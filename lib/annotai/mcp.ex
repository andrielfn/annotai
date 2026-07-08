defmodule Annotai.MCP do
  @moduledoc """
  Minimal MCP (JSON-RPC 2.0) handler that exposes annotations to an AI agent.

  Register it with your agent (replace the port with your dev server's):

      claude mcp add --transport http annotai http://localhost:4000/annotai/mcp

  The tools fall into three groups:

    * reads — `annotai_get_pending`, `annotai_get_annotation`
    * lifecycle — `annotai_acknowledge`, `annotai_resolve`, `annotai_dismiss`, `annotai_reply`
    * `annotai_watch_annotations` — a hands-free loop that waits for new annotations

  Lifecycle transitions are guarded by `Annotai.Store.transition/3`, so an
  annotation cannot be resolved or dismissed twice.
  """
  alias Annotai.{Annotation, Store}

  @protocol_version "2025-03-26"
  @open_statuses [:pending, :acknowledged]

  @tools [
    %{
      name: "annotai_get_pending",
      description:
        "List pending UI annotations (pending or acknowledged) left by the developer. Each " <>
          "includes the comment, a CSS selector, the matching phx-* fingerprint, and the exact " <>
          "source file:line of the annotated element. Any attached screenshots are listed as " <>
          "metadata only (no image data); call annotai_get_annotation to view them. Oldest first.",
      inputSchema: %{type: "object", properties: %{}, required: []}
    },
    %{
      name: "annotai_get_annotation",
      description:
        "Fetch a single annotation by id, including its full reply thread and any screenshots " <>
          "the developer attached (returned as viewable image blocks).",
      inputSchema: %{
        type: "object",
        properties: %{id: %{type: "string"}},
        required: ["id"]
      }
    },
    %{
      name: "annotai_acknowledge",
      description: "Mark an annotation as acknowledged (\"I see this and am working on it\").",
      inputSchema: %{
        type: "object",
        properties: %{id: %{type: "string"}},
        required: ["id"]
      }
    },
    %{
      name: "annotai_resolve",
      description:
        "Mark an annotation resolved after making the change. Only resolve annotations the " <>
          "user actually accepted; if a change was rejected, leave it open. An optional summary " <>
          "of what changed is added to the thread.",
      inputSchema: %{
        type: "object",
        properties: %{id: %{type: "string"}, summary: %{type: "string"}},
        required: ["id"]
      }
    },
    %{
      name: "annotai_dismiss",
      description: "Dismiss an annotation that will not be acted on, with a reason.",
      inputSchema: %{
        type: "object",
        properties: %{id: %{type: "string"}, reason: %{type: "string"}},
        required: ["id", "reason"]
      }
    },
    %{
      name: "annotai_reply",
      description: "Add a message to an annotation's thread (e.g. to answer a question).",
      inputSchema: %{
        type: "object",
        properties: %{id: %{type: "string"}, message: %{type: "string"}},
        required: ["id", "message"]
      }
    },
    %{
      name: "annotai_watch_annotations",
      description:
        "Wait for new (pending) annotations, for a hands-free loop. Returns immediately with " <>
          "any annotations already pending (drain); otherwise waits up to `timeout_seconds` for " <>
          "the first, then collects a short batch. Returns {type: annotations|timeout}. Call it " <>
          "again after acknowledging/resolving the batch to keep watching.",
      inputSchema: %{
        type: "object",
        properties: %{
          timeout_seconds: %{
            type: "integer",
            description: "max wait, default 25 (keep < server idle timeout)"
          },
          batch_window_seconds: %{
            type: "number",
            description: "collect window after first arrival, default 2"
          }
        },
        required: []
      }
    }
  ]

  @doc """
  Handle one decoded JSON-RPC request map.

  Returns a response map ready to encode, or `:noreply` for notifications
  (which expect no response body).
  """
  @spec handle(map()) :: map() | :noreply
  def handle(%{"method" => "initialize", "id" => id}) do
    result(id, %{
      protocolVersion: @protocol_version,
      capabilities: %{tools: %{}},
      serverInfo: %{name: "annotai", version: Annotai.version()}
    })
  end

  def handle(%{"method" => "notifications/" <> _}), do: :noreply
  def handle(%{"method" => "ping", "id" => id}), do: result(id, %{})
  def handle(%{"method" => "tools/list", "id" => id}), do: result(id, %{tools: @tools})

  def handle(%{"method" => "tools/call", "id" => id, "params" => params}) do
    name = params["name"]
    args = params["arguments"] || %{}

    case call_tool(name, args) do
      # A single annotation is returned as its (redacted) JSON plus one image
      # block per attached screenshot, so the agent can actually see them.
      {:ok, :annotation, annotation} ->
        content = [text(Annotation.redact_images(annotation)) | image_blocks(annotation)]
        result(id, %{content: content, isError: false})

      {:ok, payload} ->
        result(id, %{content: [text(redact(payload))], isError: false})

      {:error, message} ->
        result(id, %{content: [text(%{error: message})], isError: true})
    end
  end

  def handle(%{"id" => id, "method" => method}),
    do: error(id, -32601, "unknown method: #{method}")

  # Decoded JSON, but not a valid request (e.g. missing "method") — keep the id so the caller can correlate.
  def handle(%{"id" => id}), do: error(id, -32600, "invalid request")
  def handle(_), do: parse_error()

  @doc "The JSON-RPC response for an unparseable request body."
  @spec parse_error() :: map()
  def parse_error, do: %{jsonrpc: "2.0", id: nil, error: %{code: -32700, message: "parse error"}}

  defp call_tool("annotai_get_pending", _args) do
    pending = Store.pending()
    {:ok, %{count: length(pending), annotations: pending}}
  end

  defp call_tool("annotai_get_annotation", %{"id" => id}) do
    case Store.get(id) do
      nil -> {:error, "annotation not found: #{id}"}
      annotation -> {:ok, :annotation, annotation}
    end
  end

  defp call_tool("annotai_acknowledge", %{"id" => id}) do
    finish(Store.transition(id, @open_statuses, %{status: :acknowledged}), id)
  end

  defp call_tool("annotai_resolve", %{"id" => id} = args) do
    case Store.transition(id, @open_statuses, %{status: :resolved, resolved_by: :agent}) do
      {:ok, _} ->
        maybe_reply(id, args["summary"])
        {:ok, Store.get(id)}

      error ->
        finish(error, id)
    end
  end

  defp call_tool("annotai_dismiss", %{"id" => id, "reason" => reason}) do
    case Store.transition(id, @open_statuses, %{status: :dismissed, resolved_by: :agent}) do
      {:ok, _} ->
        Store.add_thread_message(id, "agent", "Dismissed: #{reason}")
        {:ok, Store.get(id)}

      error ->
        finish(error, id)
    end
  end

  defp call_tool("annotai_reply", %{"id" => id, "message" => message}) do
    finish(Store.add_thread_message(id, "agent", message), id)
  end

  defp call_tool("annotai_watch_annotations", args) do
    timeout_ms = round(num(args["timeout_seconds"], 25) * 1000)
    batch_ms = round(num(args["batch_window_seconds"], 2) * 1000)
    deadline = System.monotonic_time(:millisecond) + timeout_ms
    {:ok, watch_loop(deadline, batch_ms, true)}
  end

  defp call_tool(name, _args), do: {:error, "unknown tool or missing arguments: #{name}"}

  # Each MCP request runs in its own web-server process, so this self-poll of ETS
  # doesn't block other watchers (there is no shared GenServer).
  defp watch_loop(deadline, batch_ms, first?) do
    fresh = fresh_annotations()

    cond do
      # Drain-on-entry: annotations were already pending; return them right away.
      fresh != [] and first? ->
        deliver(fresh)

      # First arrival during the wait: settle a short batch window, then re-read.
      fresh != [] ->
        Process.sleep(batch_ms)
        deliver(fresh_annotations())

      System.monotonic_time(:millisecond) >= deadline ->
        timeout()

      true ->
        Process.sleep(250)
        watch_loop(deadline, batch_ms, false)
    end
  end

  # An empty batch (e.g. acknowledged during the window) reads as a timeout, not
  # a zero-count "annotations" delivery.
  defp deliver([]), do: timeout()
  defp deliver(fresh), do: %{type: "annotations", count: length(fresh), annotations: fresh}

  defp timeout, do: %{type: "timeout", count: 0, annotations: []}

  # "fresh" = genuinely new (still :pending). Acknowledging removes an annotation
  # from the watch set so the loop won't redeliver it.
  defp fresh_annotations, do: Enum.filter(Store.all(), &(&1.status == :pending))

  defp maybe_reply(id, summary) when is_binary(summary) and summary != "",
    do: Store.add_thread_message(id, "agent", summary)

  defp maybe_reply(_id, _summary), do: :ok

  defp num(v, _default) when is_number(v), do: v
  defp num(_v, default), do: default

  # Normalize a Store result into the {:ok, payload} | {:error, message} tool shape.
  defp finish({:ok, annotation}, _id), do: {:ok, annotation}
  defp finish({:error, :not_found}, id), do: {:error, "annotation not found: #{id}"}

  defp finish({:error, {:invalid_transition, status, allowed}}, _id) do
    {:error,
     "cannot transition annotation in status \"#{status}\" " <>
       "(allowed: #{Enum.map_join(allowed, ", ", &Atom.to_string/1)})"}
  end

  # Keep image bytes out of the text payloads — they ride along as image blocks
  # (single annotation) or are fetched on demand. Lists/structs keep metadata only.
  defp redact(%Annotation{} = a), do: Annotation.redact_images(a)

  defp redact(%{annotations: annotations} = payload) when is_list(annotations),
    do: %{payload | annotations: Enum.map(annotations, &Annotation.redact_images/1)}

  defp redact(other), do: other

  # MCP image content blocks (spec shape: type/data/mimeType), one per attachment.
  defp image_blocks(%Annotation{images: images}) do
    for %{"data" => data, "mime" => mime} <- images, is_binary(data) do
      %{type: "image", data: data, mimeType: mime}
    end
  end

  defp text(payload), do: %{type: "text", text: Jason.encode!(payload, pretty: true)}
  defp result(id, result), do: %{jsonrpc: "2.0", id: id, result: result}

  defp error(id, code, message),
    do: %{jsonrpc: "2.0", id: id, error: %{code: code, message: message}}
end
