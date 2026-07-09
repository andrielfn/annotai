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

  ## Placement

  The widget sits in the bottom-right corner by default. If another dev tool lives
  there too (e.g. LiveDebugger), move Annotai out of the way with `:position` — a
  keyword list of CSS insets, exactly like `position: fixed`:

      # config/dev.exs
      config :annotai, position: [bottom: 20, right: 220]   # slide left of the other widget
      config :annotai, position: [bottom: 20, left: 20]     # dodge to the other corner

  Each key (`:top` / `:bottom` / `:left` / `:right`) is a distance from that edge;
  integers are pixels, strings pass through as-is (`"2rem"`). The corner the widget
  anchors to — which also decides how its panels open — falls out of the edges you
  name. Set at most one of `:top`/`:bottom` and one of `:left`/`:right`; omit an axis
  to keep its 20px default. An invalid value is ignored (with a log warning) and the
  default placement is used.
  """
  @behaviour Plug
  import Plug.Conn
  require Logger

  @position_keys [:top, :bottom, :left, :right]
  @position_default_inset 20

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
    ~s(<script src="/annotai/app.js" data-annotai-version="#{Annotai.version()}"#{position_attrs()}></script>)
  end

  # Serializes the `:position` config into `data-annotai-*` attributes the widget
  # reads to place itself. Emits nothing (keeping the injected tag byte-identical to
  # the no-config case) when unset. h/v are separate attributes so a multi-token value
  # like `calc(20px + 10px)` survives intact.
  defp position_attrs do
    case Application.get_env(:annotai, :position) do
      nil ->
        ""

      cfg ->
        case resolve_position(cfg) do
          {:ok, %{corner: corner, h: h, v: v}} ->
            ~s( data-annotai-corner="#{corner}" data-annotai-inset-h="#{h}" data-annotai-inset-v="#{v}")

          {:error, reason} ->
            Logger.warning("[annotai] invalid :position config (#{reason}); using default placement")
            ""
        end
    end
  end

  @doc false
  # Resolves a `:position` keyword list into the anchor corner ("bottom-right") and
  # the horizontal/vertical edge insets, applying defaults and validating the axes.
  @spec resolve_position(term()) ::
          {:ok, %{corner: String.t(), h: String.t(), v: String.t()}} | {:error, String.t()}
  def resolve_position(cfg) do
    if Keyword.keyword?(cfg) do
      with :ok <- validate_position_keys(cfg),
           :ok <- validate_position_axis(cfg, :top, :bottom),
           :ok <- validate_position_axis(cfg, :left, :right),
           {:ok, vside, v} <- resolve_edge(cfg, :top, :bottom),
           {:ok, hside, h} <- resolve_edge(cfg, :left, :right) do
        {:ok, %{corner: "#{vside}-#{hside}", h: h, v: v}}
      end
    else
      {:error, "expected a keyword list like [bottom: 20, right: 20]"}
    end
  end

  # Resolves one axis to its active edge + CSS inset: the near edge if named, else the
  # far edge with its default (so `bottom`/`right` win when the axis is omitted).
  defp resolve_edge(cfg, near, far) do
    {side, raw} =
      if Keyword.has_key?(cfg, near),
        do: {near, cfg[near]},
        else: {far, Keyword.get(cfg, far, @position_default_inset)}

    with {:ok, css} <- css_length(raw), do: {:ok, to_string(side), css}
  end

  defp validate_position_keys(cfg) do
    case Enum.reject(Keyword.keys(cfg), &(&1 in @position_keys)) do
      [] -> :ok
      bad -> {:error, "unknown key(s) #{inspect(bad)}; allowed: #{inspect(@position_keys)}"}
    end
  end

  defp validate_position_axis(cfg, a, b) do
    if Keyword.has_key?(cfg, a) and Keyword.has_key?(cfg, b),
      do: {:error, "set only one of #{a}/#{b}"},
      else: :ok
  end

  defp css_length(n) when is_integer(n), do: {:ok, "#{n}px"}

  defp css_length(s) when is_binary(s) do
    case String.trim(s) do
      "" -> {:error, "empty length string"}
      trimmed -> {:ok, trimmed}
    end
  end

  defp css_length(other), do: {:error, "invalid length #{inspect(other)}; use an integer or CSS string"}

  defp html?(conn) do
    case get_resp_header(conn, "content-type") do
      [ct | _] -> String.contains?(ct, "text/html")
      _ -> false
    end
  end
end
