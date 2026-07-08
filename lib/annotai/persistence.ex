defmodule Annotai.Persistence do
  @moduledoc """
  Optional durability for the annotation `Annotai.Store`.

  Opt-in via app config. When enabled, this GenServer:

    * **hydrates** the Store from the on-disk snapshot on boot (pruning terminal
      annotations older than the optional TTL),
    * **debounces** a snapshot write after each mutation, so a burst of edits
      collapses into one disk write off the mutation hot path, and
    * **flushes** a final time on graceful shutdown.

  The Store pokes this process (`GenServer.cast(_, :changed)`) after every
  mutation; the poke is a no-op when persistence is disabled, so the Store stays
  fully decoupled. The actual encode/write lives behind
  `Annotai.Persistence.Adapter` (default `Annotai.Persistence.Adapter.File`).

  ## Config

      config :annotai, persistence: false                              # (default) off
      config :annotai, persistence: true                               # on, defaults
      config :annotai, persistence: [path: "...", ttl: {14, :day}]     # on, overrides

  `Config` deep-merges keyword lists across env files, so override per env by
  setting the *whole* value (e.g. `persistence: false` in `test.exs`), not partial
  keys.
  """
  use GenServer
  require Logger

  alias Annotai.Store
  alias Annotai.Persistence.{Adapter, Retention}

  @default_adapter Adapter.File
  @default_path ".annotai/annotations.ets"
  @default_ttl :infinity
  @default_debounce_ms 500

  # --- Config ---

  @doc "Read and normalize the `:persistence` app config: `:disabled | map`."
  @spec config() :: :disabled | map()
  def config, do: normalize(Application.get_env(:annotai, :persistence, false))

  @doc """
  Normalize a config value to `:disabled` or a `%{adapter:, path:, ttl:}` map.

  Accepts the `false | true | keyword` union; `true` and a keyword both enable
  (presence == enabled), filling in defaults.
  """
  @spec normalize(false | nil | true | keyword()) :: :disabled | map()
  def normalize(value) when value in [false, nil], do: :disabled
  def normalize(true), do: normalize([])

  def normalize(opts) when is_list(opts) do
    %{
      adapter: Keyword.get(opts, :adapter, @default_adapter),
      path: Keyword.get(opts, :path, @default_path),
      ttl: validate_ttl(Keyword.get(opts, :ttl, @default_ttl))
    }
  end

  # A bad `:ttl` (typo like `{14, :days}`, a bare integer, …) would otherwise
  # crash the persister on every hydrate/sweep and trip a supervisor restart
  # loop. Warn and fall back to the safe default (keep everything) instead.
  defp validate_ttl(:infinity), do: :infinity

  defp validate_ttl({n, unit} = ttl)
       when is_integer(n) and n > 0 and unit in [:second, :minute, :hour, :day],
       do: ttl

  defp validate_ttl(other) do
    Logger.warning(
      "[annotai] invalid persistence :ttl #{inspect(other)}; expected :infinity or " <>
        "{pos_integer, :second | :minute | :hour | :day}. Falling back to :infinity."
    )

    :infinity
  end

  # --- Public API ---

  @doc false
  def start_link(opts) do
    {name, opts} = Keyword.pop(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  Force an immediate, synchronous snapshot. No-op when persistence isn't running.

  Used by the "delete all" route so an explicit purge is durable at once rather
  than waiting out the debounce window.
  """
  @spec flush(GenServer.server()) :: :ok
  def flush(server \\ __MODULE__) do
    if pid = GenServer.whereis(server), do: GenServer.call(pid, :flush), else: :ok
  end

  # --- Server ---

  @impl true
  def init(opts) do
    Process.flag(:trap_exit, true)

    state = %{
      adapter: Keyword.get(opts, :adapter, @default_adapter),
      config: adapter_config(opts),
      ttl: Keyword.get(opts, :ttl, @default_ttl),
      debounce_ms: Keyword.get(opts, :debounce_ms, @default_debounce_ms),
      dirty: false,
      flush_ref: nil
    }

    {:ok, state, {:continue, :hydrate}}
  end

  @impl true
  def handle_continue(:hydrate, state) do
    annotations =
      case state.adapter.load(state.config) do
        {:ok, annotations} ->
          annotations

        {:error, reason} ->
          Logger.warning("[annotai] could not load annotation snapshot (#{inspect(reason)}); starting empty")
          []
      end

    # Prune aged-out terminal records at boot; the file re-shrinks on the next
    # write. A dev restarts often, so boot-time pruning is enough — no sweep timer.
    {kept, _expired} = Retention.partition(annotations, state.ttl, DateTime.utc_now())
    Store.restore(kept)

    {:noreply, state}
  end

  @impl true
  def handle_cast(:changed, state), do: {:noreply, schedule_flush(%{state | dirty: true})}

  @impl true
  def handle_call(:flush, _from, state), do: {:reply, :ok, do_flush(cancel_flush(state))}

  @impl true
  def handle_info(:flush, state), do: {:noreply, do_flush(%{state | flush_ref: nil})}

  @impl true
  def terminate(_reason, state) do
    if state.dirty, do: state.adapter.save(Store.all(), state.config)
    :ok
  end

  # --- Internals ---

  # The bag handed to the adapter. Real callers pass `:path`; tests can pass a
  # full `:config` map (e.g. carrying a probe pid for a fake adapter).
  defp adapter_config(opts) do
    case Keyword.fetch(opts, :config) do
      {:ok, config} -> config
      :error -> %{path: Keyword.fetch!(opts, :path)}
    end
  end

  # Debounce: schedule one flush per burst. Further changes while a flush is
  # pending don't reset the timer, so writes fire at most once per debounce window
  # regardless of edit rate.
  defp schedule_flush(%{flush_ref: nil, debounce_ms: ms} = state),
    do: %{state | flush_ref: Process.send_after(self(), :flush, ms)}

  defp schedule_flush(state), do: state

  defp cancel_flush(%{flush_ref: nil} = state), do: state

  defp cancel_flush(%{flush_ref: ref} = state) do
    Process.cancel_timer(ref)
    %{state | flush_ref: nil}
  end

  defp do_flush(%{dirty: false} = state), do: state

  defp do_flush(state) do
    case state.adapter.save(Store.all(), state.config) do
      :ok ->
        %{state | dirty: false}

      {:error, reason} ->
        # Keep `dirty` set so the next mutation retries; no timer, no fuss.
        Logger.warning("[annotai] could not persist annotations (#{inspect(reason)})")
        state
    end
  end
end
