defmodule AnnotaiTest do
  use ExUnit.Case, async: true
  import Plug.Test
  import Plug.Conn

  @opts Annotai.init([])

  defp run(conn), do: Annotai.call(conn, @opts)

  test "forwards /annotai/* to the router and halts" do
    conn = run(conn(:get, "/annotai/app.js"))
    assert conn.halted
    assert conn.status == 200
  end

  describe "when disabled" do
    setup do
      Application.put_env(:annotai, :enabled, false)
      on_exit(fn -> Application.delete_env(:annotai, :enabled) end)
    end

    test "does not forward /annotai/* to the router" do
      conn = run(conn(:get, "/annotai/app.js"))
      refute conn.halted
    end

    test "does not inject the widget script" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html><body>hi</body></html>")

      refute conn.resp_body =~ "app.js"
    end
  end

  describe "script injection" do
    test "injects the widget script before </body> and drops content-length" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> put_resp_header("content-length", "30")
        |> send_resp(200, "<html><body>hi</body></html>")

      assert conn.resp_body =~
               ~s(<script src="/annotai/app.js" data-annotai-version="#{Annotai.version()}"></script></body>)

      assert get_resp_header(conn, "content-length") == []
    end

    test "injects into only the first </body>" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<body>a</body><body>b</body>")

      assert length(String.split(conn.resp_body, "/annotai/app.js")) == 2
    end

    test "leaves responses with no content-type untouched" do
      conn = conn(:get, "/") |> run() |> send_resp(200, "<html><body>hi</body></html>")
      refute conn.resp_body =~ "app.js"
    end

    test "leaves non-HTML responses untouched" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("application/json")
        |> send_resp(200, "{\"</body>\": true}")

      refute conn.resp_body =~ "app.js"
    end

    test "leaves HTML without a </body> untouched" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html>hi</html>")

      refute conn.resp_body =~ "app.js"
    end

    test "emits no placement attributes when :position is unset" do
      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html><body>hi</body></html>")

      refute conn.resp_body =~ "data-annotai-corner"
      refute conn.resp_body =~ "data-annotai-inset"
    end

    test "emits placement attributes from :position config" do
      Application.put_env(:annotai, :position, bottom: 20, right: 220)
      on_exit(fn -> Application.delete_env(:annotai, :position) end)

      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html><body>hi</body></html>")

      assert conn.resp_body =~ ~s(data-annotai-corner="bottom-right")
      assert conn.resp_body =~ ~s(data-annotai-inset-h="220px")
      assert conn.resp_body =~ ~s(data-annotai-inset-v="20px")
    end

    test "falls back to default placement on invalid :position config" do
      Application.put_env(:annotai, :position, left: 20, right: 20)
      on_exit(fn -> Application.delete_env(:annotai, :position) end)

      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html><body>hi</body></html>")

      assert conn.resp_body =~ "app.js"
      refute conn.resp_body =~ "data-annotai-corner"
    end

    test "falls back without crashing on a non-keyword-list :position" do
      Application.put_env(:annotai, :position, ~c"bottom-right")
      on_exit(fn -> Application.delete_env(:annotai, :position) end)

      conn =
        conn(:get, "/")
        |> run()
        |> put_resp_content_type("text/html")
        |> send_resp(200, "<html><body>hi</body></html>")

      assert conn.resp_body =~ "app.js"
      refute conn.resp_body =~ "data-annotai-corner"
    end
  end

  describe "resolve_position/1" do
    test "defaults the omitted axis to the far edge at 20px" do
      assert Annotai.resolve_position(right: 220) == {:ok, %{corner: "bottom-right", h: "220px", v: "20px"}}
      assert Annotai.resolve_position(top: 30) == {:ok, %{corner: "top-right", h: "20px", v: "30px"}}
    end

    test "derives the corner from the named edges" do
      assert Annotai.resolve_position(bottom: 20, left: 20) == {:ok, %{corner: "bottom-left", h: "20px", v: "20px"}}
      assert Annotai.resolve_position(top: 10, left: 10) == {:ok, %{corner: "top-left", h: "10px", v: "10px"}}
    end

    test "passes string lengths through (multi-token and trimmed)" do
      assert Annotai.resolve_position(bottom: "2rem", right: "  1em ") ==
               {:ok, %{corner: "bottom-right", h: "1em", v: "2rem"}}

      assert Annotai.resolve_position(right: "calc(20px + 10px)") ==
               {:ok, %{corner: "bottom-right", h: "calc(20px + 10px)", v: "20px"}}
    end

    test "rejects setting both edges of an axis" do
      assert {:error, _} = Annotai.resolve_position(left: 10, right: 10)
      assert {:error, _} = Annotai.resolve_position(top: 10, bottom: 10)
    end

    test "rejects unknown keys, bad value types, and non-keyword lists" do
      assert {:error, _} = Annotai.resolve_position(corner: :bottom_right)
      assert {:error, _} = Annotai.resolve_position(bottom: :nope)
      assert {:error, _} = Annotai.resolve_position("bottom-right")
      assert {:error, _} = Annotai.resolve_position(~c"bottom-right")
      assert {:error, _} = Annotai.resolve_position([:foo, :bar])
    end
  end
end
