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
  end
end
