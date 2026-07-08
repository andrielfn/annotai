defmodule Annotai.Router do
  @moduledoc false
  use Plug.Router
  import Plug.Conn

  alias Annotai.{Annotation, MCP, Store}

  # Upper bound on a request body we'll buffer (annotations carry base64 images).
  @max_body 25_000_000

  plug(:match)
  plug(:ensure_local)
  plug(:dispatch)

  get "/annotai/app.js" do
    send_asset(conn, "app.js", "text/javascript")
  end

  # Annotation REST API — called by the browser widget.
  post "/annotai/api/annotations" do
    # Annotations can carry base64 screenshots, so the body may exceed the default
    # 8 MB read length; read it fully (capped) rather than truncating.
    case read_full_body(conn) do
      {:ok, raw, conn} ->
        case Jason.decode(raw) do
          {:ok, attrs} when is_map(attrs) ->
            annotation = attrs |> Annotation.new() |> Store.put()
            send_annotation(conn, 201, annotation)

          _ ->
            send_json(conn, 400, %{error: "invalid JSON body"})
        end

      {:too_large, conn} ->
        send_json(conn, 413, %{error: "request body too large"})
    end
  end

  get "/annotai/api/annotations" do
    send_json(conn, 200, %{annotations: Enum.map(Store.all(), &Annotation.redact_images/1)})
  end

  # Serve one attached image's bytes. Kept out of the JSON payloads (the 2s poll
  # carries metadata only) and browser-cached — image ids are unique per upload.
  get "/annotai/api/annotations/:id/images/:image_id" do
    with %{"data" => data, "mime" => mime} <- Store.get_image(id, image_id),
         {:ok, bytes} <- Base.decode64(data) do
      conn
      |> put_resp_content_type(mime)
      |> put_resp_header("cache-control", "private, max-age=31536000, immutable")
      |> send_resp(200, bytes)
    else
      _ -> send_resp(conn, 404, "image not found")
    end
  end

  # Only the comment is editable from the browser; lifecycle changes go through MCP.
  patch "/annotai/api/annotations/:id" do
    {:ok, raw, conn} = read_body(conn)

    case Jason.decode(raw) do
      {:ok, %{"comment" => comment}} ->
        case Store.update(id, %{comment: comment}) do
          {:ok, annotation} -> send_annotation(conn, 200, annotation)
          {:error, :not_found} -> send_json(conn, 404, %{error: "not found"})
        end

      {:ok, _} ->
        send_json(conn, 400, %{error: "no editable fields"})

      _ ->
        send_json(conn, 400, %{error: "invalid JSON body"})
    end
  end

  # The human replies to an annotation's thread (the agent writes via MCP).
  # Replying to a resolved/dismissed annotation reopens it — see Store.add_human_reply/2.
  post "/annotai/api/annotations/:id/reply" do
    {:ok, raw, conn} = read_body(conn)

    case Jason.decode(raw) do
      {:ok, %{"message" => message}} when is_binary(message) ->
        case String.trim(message) do
          "" ->
            send_json(conn, 400, %{error: "missing message"})

          text ->
            case Store.add_human_reply(id, text) do
              {:ok, annotation} -> send_annotation(conn, 200, annotation)
              {:error, :not_found} -> send_json(conn, 404, %{error: "not found"})
            end
        end

      {:ok, _} ->
        send_json(conn, 400, %{error: "missing message"})

      _ ->
        send_json(conn, 400, %{error: "invalid JSON body"})
    end
  end

  delete "/annotai/api/annotations/:id" do
    Store.delete(id)
    send_resp(conn, 204, "")
  end

  post "/annotai/api/clear" do
    Store.clear()
    # An explicit purge should be durable immediately, not after the debounce
    # window — otherwise a hard restart could resurrect the cleared records.
    # No-op when persistence is disabled.
    Annotai.Persistence.flush()
    send_resp(conn, 204, "")
  end

  # Agent connection status, for the widget's settings panel. "connected" is sticky:
  # true once any agent has made an MCP request since the server started.
  get "/annotai/api/status" do
    last = Store.last_agent()
    ago = last && System.system_time(:millisecond) - last
    send_json(conn, 200, %{connected: last != nil, last_seen_ms_ago: ago})
  end

  # MCP (JSON-RPC over HTTP) — the agent connects here.
  post "/annotai/mcp" do
    # CSRF: a legitimate MCP client sends no Origin header; the browser API does (D8).
    case get_req_header(conn, "origin") do
      [] ->
        Store.touch_agent()
        {:ok, raw, conn} = read_body(conn)
        handle_mcp(conn, raw)

      _ ->
        send_json(conn, 403, %{error: "origin not allowed on /annotai/mcp"})
    end
  end

  match _ do
    send_resp(conn, 404, "not found")
  end

  defp handle_mcp(conn, raw) do
    case Jason.decode(raw) do
      {:ok, request} ->
        case MCP.handle(request) do
          :noreply -> send_resp(conn, 202, "")
          response -> send_json(conn, 200, response)
        end

      _ ->
        send_json(conn, 200, MCP.parse_error())
    end
  end

  # Read the whole body in one shot up to @max_body. `read_body` returns `:more`
  # when the body exceeds its read length; we treat that as "too large" rather
  # than silently truncating (the default hard-match would have crashed).
  defp read_full_body(conn) do
    case read_body(conn, length: @max_body) do
      {:ok, body, conn} -> {:ok, body, conn}
      {:more, _partial, conn} -> {:too_large, conn}
    end
  end

  # The single place annotations are serialized to the browser: redacts image bytes
  # so base64 never rides along a REST response (the bytes are fetched per-image).
  defp send_annotation(conn, status, annotation),
    do: send_json(conn, status, Annotation.redact_images(annotation))

  defp send_json(conn, status, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(body))
  end

  defp send_asset(conn, name, content_type) do
    path = Path.join(:code.priv_dir(:annotai), "static/#{name}")

    case File.read(path) do
      {:ok, contents} ->
        conn
        |> put_resp_content_type(content_type)
        |> send_resp(200, contents)

      _ ->
        send_resp(conn, 404, "asset not found")
    end
  end

  # Dev tool: only answer loopback callers.
  defp ensure_local(conn, _opts) do
    case conn.remote_ip do
      {127, _, _, _} -> conn
      {0, 0, 0, 0, 0, 0, 0, 1} -> conn
      {0, 0, 0, 0, 0, 65535, 32512, 1} -> conn
      _ -> conn |> send_resp(403, "annotai: local access only") |> halt()
    end
  end
end
