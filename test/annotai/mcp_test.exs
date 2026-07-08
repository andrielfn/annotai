defmodule Annotai.MCPTest do
  use ExUnit.Case, async: false

  alias Annotai.{Annotation, MCP, Store}

  setup do: Annotai.TestHelpers.reset_store()

  defp put(attrs), do: attrs |> Annotation.new() |> Store.put()

  defp call_tool(name, args \\ %{}) do
    resp =
      MCP.handle(%{
        "method" => "tools/call",
        "id" => 1,
        "params" => %{"name" => name, "arguments" => args}
      })

    text = resp.result.content |> hd() |> Map.fetch!(:text)
    %{error?: resp.result.isError, payload: Jason.decode!(text)}
  end

  # The full content-block array (text + any image blocks).
  defp call_content(name, args) do
    MCP.handle(%{
      "method" => "tools/call",
      "id" => 1,
      "params" => %{"name" => name, "arguments" => args}
    }).result.content
  end

  describe "protocol methods" do
    test "initialize advertises the annotai server" do
      resp = MCP.handle(%{"method" => "initialize", "id" => 1})
      assert resp.jsonrpc == "2.0"
      assert resp.id == 1
      assert resp.result.serverInfo.name == "annotai"
    end

    test "notifications get no reply" do
      assert MCP.handle(%{"method" => "notifications/initialized"}) == :noreply
    end

    test "ping returns an empty result" do
      assert MCP.handle(%{"method" => "ping", "id" => 7}).result == %{}
    end

    test "tools/list returns the 7 annotai_* tools" do
      tools = MCP.handle(%{"method" => "tools/list", "id" => 1}).result.tools
      names = Enum.map(tools, & &1.name)
      assert length(names) == 7
      assert Enum.all?(names, &String.starts_with?(&1, "annotai_"))
    end
  end

  describe "dispatch errors" do
    test "unknown method -> -32601, keeps id" do
      resp = MCP.handle(%{"id" => 9, "method" => "foo/bar"})
      assert resp.error.code == -32601
      assert resp.id == 9
    end

    test "decoded map missing method but with id -> -32600, keeps id" do
      resp = MCP.handle(%{"id" => 9})
      assert resp.error.code == -32600
      assert resp.id == 9
    end

    test "unrecognized shape -> parse error with nil id" do
      resp = MCP.handle(%{"foo" => 1})
      assert resp.error.code == -32700
      assert resp.id == nil
    end
  end

  describe "read tools" do
    test "get_pending returns count + annotations" do
      put(%{"comment" => "x"})
      %{error?: false, payload: p} = call_tool("annotai_get_pending")
      assert p["count"] == 1
      assert [%{"comment" => "x"}] = p["annotations"]
    end

    test "get_annotation found / not found" do
      ann = put(%{"comment" => "x"})

      assert %{error?: false, payload: %{"id" => id}} =
               call_tool("annotai_get_annotation", %{"id" => ann.id})

      assert id == ann.id

      assert %{error?: true, payload: %{"error" => msg}} =
               call_tool("annotai_get_annotation", %{"id" => "nope"})

      assert msg =~ "not found"
    end

    test "get_annotation returns the comment as text plus an image block per screenshot" do
      ann =
        put(%{
          "comment" => "x",
          "images" => [%{"id" => "img_1", "mime" => "image/png", "data" => "AAAA"}]
        })

      content = call_content("annotai_get_annotation", %{"id" => ann.id})

      assert [%{type: "text", text: text}, %{type: "image", data: "AAAA", mimeType: "image/png"}] =
               content

      # The text block carries metadata only — never the base64 bytes.
      payload = Jason.decode!(text)
      assert [img] = payload["images"]
      refute Map.has_key?(img, "data")
      assert img["id"] == "img_1"
    end

    test "get_pending lists image metadata but no bytes" do
      put(%{"comment" => "x", "images" => [%{"mime" => "image/png", "data" => "AAAA"}]})
      %{error?: false, payload: p} = call_tool("annotai_get_pending")
      assert [%{"images" => [img]}] = p["annotations"]
      refute Map.has_key?(img, "data")
    end
  end

  describe "lifecycle tools" do
    test "acknowledge moves pending -> acknowledged" do
      ann = put(%{"comment" => "x"})
      assert %{error?: false} = call_tool("annotai_acknowledge", %{"id" => ann.id})
      assert Store.get(ann.id).status == :acknowledged
    end

    test "resolve sets status + appends the summary to the thread" do
      ann = put(%{"comment" => "x"})

      assert %{error?: false} =
               call_tool("annotai_resolve", %{"id" => ann.id, "summary" => "changed to blue"})

      stored = Store.get(ann.id)
      assert stored.status == :resolved
      assert stored.resolved_by == :agent
      assert [%{"content" => "changed to blue"}] = stored.thread
    end

    test "resolving an already-resolved annotation is a guarded error" do
      ann = put(%{"comment" => "x"})
      call_tool("annotai_resolve", %{"id" => ann.id})

      assert %{error?: true, payload: %{"error" => msg}} =
               call_tool("annotai_resolve", %{"id" => ann.id})

      assert msg =~ "cannot transition"
    end

    test "dismiss records the reason in the thread" do
      ann = put(%{"comment" => "x"})

      assert %{error?: false} =
               call_tool("annotai_dismiss", %{"id" => ann.id, "reason" => "wontfix"})

      stored = Store.get(ann.id)
      assert stored.status == :dismissed
      assert [%{"content" => "Dismissed: wontfix"}] = stored.thread
    end

    test "dismissing an already-dismissed annotation is a guarded error" do
      ann = put(%{"comment" => "x"})
      call_tool("annotai_dismiss", %{"id" => ann.id, "reason" => "wontfix"})

      assert %{error?: true, payload: %{"error" => msg}} =
               call_tool("annotai_dismiss", %{"id" => ann.id, "reason" => "again"})

      assert msg =~ "cannot transition"
    end

    test "reply appends a message" do
      ann = put(%{"comment" => "x"})

      assert %{error?: false} =
               call_tool("annotai_reply", %{"id" => ann.id, "message" => "what color?"})

      assert [%{"role" => "agent", "content" => "what color?"}] = Store.get(ann.id).thread
    end

    test "reply to a missing annotation is an error" do
      assert %{error?: true, payload: %{"error" => msg}} =
               call_tool("annotai_reply", %{"id" => "nope", "message" => "x"})

      assert msg =~ "not found"
    end

    test "unknown tool -> error" do
      assert %{error?: true} = call_tool("annotai_nope")
    end
  end

  describe "watch_annotations" do
    test "drains already-pending annotations immediately" do
      put(%{"comment" => "x"})

      %{error?: false, payload: p} =
        call_tool("annotai_watch_annotations", %{"timeout_seconds" => 1})

      assert p["type"] == "annotations"
      assert p["count"] == 1
    end

    test "returns a timeout when nothing is pending" do
      %{error?: false, payload: p} =
        call_tool("annotai_watch_annotations", %{
          "timeout_seconds" => 0.3,
          "batch_window_seconds" => 0.1
        })

      assert p["type"] == "timeout"
      assert p["count"] == 0
    end
  end
end
