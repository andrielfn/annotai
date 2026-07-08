defmodule Annotai do
  @moduledoc """
  Dev-only Plug. Mount it in your endpoint, guarded so it never reaches prod:

      if Mix.env() == :dev do
        plug Annotai
      end

  For requests under `/annotai/*` it serves the widget asset, the annotation API,
  and the MCP endpoint (via `Annotai.Router`). For every other HTML response it
  injects a single `<script src="/annotai/app.js">` before `</body>` — the only
  thing added to the host page; the entire widget UI is built client-side in a
  Shadow DOM root.

  Place `plug Annotai` before `Plug.Parsers` (the MCP endpoint needs the raw body)
  and before the code-reloading block. `mix annotai.install` does this for you.

  ## Disabling

  Annotai is on by default. Set `config :annotai, enabled: false` to make the plug
  fully inert — no widget injection and no `/annotai/*` routes. To control it via an
  environment variable instead, drive the flag from one in the host app's config:

      # config/dev.exs
      config :annotai, enabled: System.get_env("DISABLE_ANNOTAI") != "true"

  Then run with `DISABLE_ANNOTAI=true mix phx.server` and Annotai disappears.
  """
  @behaviour Plug
  import Plug.Conn

  @doc """
  The installed Annotai package version, as a string (e.g. `"0.1.0"`). Sourced
  from the loaded application spec so it tracks `mix.exs` without duplication.
  """
  @spec version() :: String.t()
  def version do
    case Application.spec(:annotai, :vsn) do
      nil -> ""
      vsn -> to_string(vsn)
    end
  end

  @doc """
  Whether Annotai is active. Controlled by `config :annotai, enabled: bool`
  (default `true`). When `false`, `call/2` returns the conn untouched, so the
  widget is never injected and `/annotai/*` is never served. See the module doc
  for the per-developer opt-out pattern.
  """
  @spec enabled?() :: boolean()
  def enabled?, do: Application.get_env(:annotai, :enabled, true)

  @impl true
  def init(opts), do: opts

  @impl true
  def call(conn, opts) do
    if enabled?(), do: dispatch(conn, opts), else: conn
  end

  defp dispatch(%Plug.Conn{path_info: ["annotai" | _]} = conn, _opts) do
    conn
    |> Annotai.Router.call(Annotai.Router.init([]))
    |> halt()
  end

  defp dispatch(conn, _opts) do
    register_before_send(conn, &maybe_inject/1)
  end

  defp maybe_inject(conn) do
    with true <- html?(conn),
         body = IO.iodata_to_binary(conn.resp_body),
         true <- String.contains?(body, "</body>") do
      # The body length changes, so drop content-length and let the adapter recompute (D7).
      conn
      |> delete_resp_header("content-length")
      |> Map.put(:resp_body, String.replace(body, "</body>", inject() <> "</body>", global: false))
    else
      _ -> conn
    end
  end

  defp inject do
    ~s(<script src="/annotai/app.js" data-annotai-version="#{Annotai.version()}"></script>)
  end

  defp html?(conn) do
    case get_resp_header(conn, "content-type") do
      [ct | _] -> String.contains?(ct, "text/html")
      _ -> false
    end
  end
end
