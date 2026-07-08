defmodule Annotai.RouterTest do
  use ExUnit.Case, async: false
  import Plug.Test
  import Plug.Conn

  alias Annotai.{Annotation, Store}

  @opts Annotai.Router.init([])

  setup do: Annotai.TestHelpers.reset_store()

  defp route(conn), do: Annotai.Router.call(conn, @opts)
  defp json_conn(method, path, body), do: conn(method, path, Jason.encode!(body))

  describe "annotation REST API" do
    test "POST creates an annotation (201)" do
      resp = route(json_conn(:post, "/annotai/api/annotations", %{"comment" => "hi"}))
      assert resp.status == 201
      body = Jason.decode!(resp.resp_body)
      assert body["comment"] == "hi"
      assert body["id"] =~ ~r/^ann_/
    end

    test "POST with invalid JSON -> 400" do
      resp = route(conn(:post, "/annotai/api/annotations", "not json"))
      assert resp.status == 400
    end

    test "GET lists annotations" do
      Store.put(%Annotation{id: "ann_1", comment: "x"})
      resp = route(conn(:get, "/annotai/api/annotations"))
      assert resp.status == 200
      assert [%{"id" => "ann_1"}] = Jason.decode!(resp.resp_body)["annotations"]
    end

    test "PATCH edits the comment (200)" do
      Store.put(%Annotation{id: "ann_1", comment: "old"})
      resp = route(json_conn(:patch, "/annotai/api/annotations/ann_1", %{"comment" => "new"}))
      assert resp.status == 200
      assert Jason.decode!(resp.resp_body)["comment"] == "new"
    end

    test "PATCH with no editable field -> 400" do
      Store.put(%Annotation{id: "ann_1"})
      resp = route(json_conn(:patch, "/annotai/api/annotations/ann_1", %{"status" => "resolved"}))
      assert resp.status == 400
    end

    test "PATCH unknown id -> 404" do
      resp = route(json_conn(:patch, "/annotai/api/annotations/nope", %{"comment" => "x"}))
      assert resp.status == 404
    end

    test "PATCH with invalid JSON -> 400" do
      Store.put(%Annotation{id: "ann_1"})
      assert route(conn(:patch, "/annotai/api/annotations/ann_1", "not json")).status == 400
    end

    test "DELETE -> 204" do
      Store.put(%Annotation{id: "ann_1"})
      assert route(conn(:delete, "/annotai/api/annotations/ann_1")).status == 204
      assert Store.get("ann_1") == nil
    end

    test "POST /clear -> 204" do
      Store.put(%Annotation{id: "ann_1"})
      assert route(conn(:post, "/annotai/api/clear")).status == 204
      assert Store.all() == []
    end

    test "POST /:id/reply appends a human message to an open annotation (200)" do
      Store.put(%Annotation{id: "ann_1", status: :acknowledged})
      resp = route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{"message" => "use accent"}))
      assert resp.status == 200
      assert [%{"role" => "human", "content" => "use accent"}] = Jason.decode!(resp.resp_body)["thread"]
    end

    test "POST /:id/reply on a resolved annotation reopens it (200)" do
      Store.put(%Annotation{id: "ann_1", status: :resolved, resolved_by: :agent, resolved_at: "2026-01-01T00:00:00Z"})
      resp = route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{"message" => "one more thing"}))
      assert resp.status == 200

      body = Jason.decode!(resp.resp_body)
      assert body["status"] == "pending"
      assert body["resolved_by"] == nil
      assert body["resolved_at"] == nil
      assert [%{"role" => "human", "content" => "one more thing"}] = body["thread"]
    end

    test "POST /:id/reply unknown id -> 404" do
      assert route(json_conn(:post, "/annotai/api/annotations/nope/reply", %{"message" => "hi"})).status == 404
    end

    test "POST /:id/reply with a blank/whitespace/missing message -> 400, nothing stored" do
      Store.put(%Annotation{id: "ann_1", status: :pending})
      assert route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{"message" => ""})).status == 400
      assert route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{"message" => "   \n\t"})).status == 400
      assert route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{})).status == 400
      assert Store.get("ann_1").thread == []
    end

    test "POST /:id/reply trims surrounding whitespace before storing" do
      Store.put(%Annotation{id: "ann_1", status: :pending})
      resp = route(json_conn(:post, "/annotai/api/annotations/ann_1/reply", %{"message" => "  use accent  "}))
      assert resp.status == 200
      assert [%{"content" => "use accent"}] = Jason.decode!(resp.resp_body)["thread"]
    end
  end

  describe "image attachments" do
    # 1x1 transparent PNG.
    @png "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    test "POST stores images; the response carries metadata but not the bytes" do
      body = %{"comment" => "look", "images" => [%{"mime" => "image/png", "data" => @png}]}
      resp = route(json_conn(:post, "/annotai/api/annotations", body))
      assert resp.status == 201

      [img] = Jason.decode!(resp.resp_body)["images"]
      assert img["mime"] == "image/png"
      assert img["id"] =~ ~r/^img_/
      refute Map.has_key?(img, "data")
    end

    test "GET list redacts image bytes" do
      Store.put(%Annotation{
        id: "ann_1",
        images: [%{"id" => "img_1", "mime" => "image/png", "data" => @png}]
      })

      [%{"images" => [img]}] = Jason.decode!(route(conn(:get, "/annotai/api/annotations")).resp_body)["annotations"]
      refute Map.has_key?(img, "data")
    end

    test "GET image route serves the decoded bytes with the stored content-type" do
      Store.put(%Annotation{
        id: "ann_1",
        images: [%{"id" => "img_1", "mime" => "image/png", "data" => @png}]
      })

      resp = route(conn(:get, "/annotai/api/annotations/ann_1/images/img_1"))
      assert resp.status == 200
      assert [ct] = get_resp_header(resp, "content-type")
      assert ct =~ "image/png"
      assert resp.resp_body == Base.decode64!(@png)
    end

    test "GET image route -> 404 for an unknown annotation or image" do
      Store.put(%Annotation{id: "ann_1", images: [%{"id" => "img_1", "mime" => "image/png", "data" => @png}]})
      assert route(conn(:get, "/annotai/api/annotations/ann_1/images/nope")).status == 404
      assert route(conn(:get, "/annotai/api/annotations/nope/images/img_1")).status == 404
    end
  end

  describe "GET /annotai/api/status" do
    test "connected is sticky: false, then true after an agent request" do
      assert Jason.decode!(route(conn(:get, "/annotai/api/status")).resp_body)["connected"] ==
               false

      Store.touch_agent()
      assert Jason.decode!(route(conn(:get, "/annotai/api/status")).resp_body)["connected"] == true
    end
  end

  test "GET /annotai/app.js serves the bundle" do
    resp = route(conn(:get, "/annotai/app.js"))
    assert resp.status == 200
    assert [ct] = get_resp_header(resp, "content-type")
    assert ct =~ "javascript"
  end

  describe "POST /annotai/mcp" do
    test "no Origin header -> handled (200 JSON-RPC)" do
      body = %{"jsonrpc" => "2.0", "id" => 1, "method" => "tools/list"}
      resp = route(json_conn(:post, "/annotai/mcp", body))
      assert resp.status == 200
      assert Jason.decode!(resp.resp_body)["jsonrpc"] == "2.0"
    end

    test "an Origin header -> 403 (D8)" do
      conn = json_conn(:post, "/annotai/mcp", %{}) |> put_req_header("origin", "http://evil.test")
      assert route(conn).status == 403
    end

    test "touches agent activity" do
      route(json_conn(:post, "/annotai/mcp", %{"jsonrpc" => "2.0", "id" => 1, "method" => "ping"}))
      assert is_integer(Store.last_agent())
    end
  end

  describe "ensure_local" do
    test "non-loopback remote_ip -> 403" do
      conn = %{conn(:get, "/annotai/api/annotations") | remote_ip: {8, 8, 8, 8}}
      assert route(conn).status == 403
    end

    test "IPv6 loopback (::1) is allowed" do
      conn = %{conn(:get, "/annotai/api/annotations") | remote_ip: {0, 0, 0, 0, 0, 0, 0, 1}}
      assert route(conn).status == 200
    end
  end

  test "unmatched path -> 404" do
    assert route(conn(:get, "/annotai/does-not-exist")).status == 404
  end
end
