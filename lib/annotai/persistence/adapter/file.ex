defmodule Annotai.Persistence.Adapter.File do
  @moduledoc """
  Default persistence adapter: an ETF snapshot of the whole annotation set.

  The list is encoded with `:erlang.term_to_binary/1` and written atomically
  (temp file + rename) so a crash mid-write can't leave a torn snapshot.

  Loading is total: a missing, unreadable, or corrupt file simply loads as an
  empty set — this is a throwaway dev cache, so on any problem we start fresh and
  let the next write replace it. Encoding the whole set on each save keeps the
  adapter trivial, fine for dev-scale counts.

  Reads `:path` from the config map.
  """
  @behaviour Annotai.Persistence.Adapter

  @impl true
  def load(config) do
    case File.read(fetch_path(config)) do
      {:ok, binary} -> {:ok, decode(binary)}
      {:error, _} -> {:ok, []}
    end
  end

  @impl true
  def save(annotations, config) when is_list(annotations) do
    path = fetch_path(config)

    with :ok <- ensure_dir(path) do
      atomic_write(path, :erlang.term_to_binary(annotations))
    end
  end

  defp decode(binary) do
    # Not `:safe` — struct atoms may be absent from the table during early-boot decode.
    case :erlang.binary_to_term(binary) do
      list when is_list(list) -> list
      # Back-compat: earlier builds wrapped the list as `{version, list}`. Read it
      # so upgrading doesn't silently drop a snapshot (we always write bare lists).
      {_version, list} when is_list(list) -> list
      _ -> []
    end
  rescue
    # Truncated/garbage binary.
    ArgumentError -> []
  end

  # Write to a sibling temp file, then rename over the target. `rename` is atomic
  # within a filesystem, so a reader/restart never sees a half-written snapshot.
  defp atomic_write(path, binary) do
    tmp = path <> ".tmp"

    with :ok <- File.write(tmp, binary),
         :ok <- File.rename(tmp, path) do
      :ok
    else
      {:error, reason} ->
        File.rm(tmp)
        {:error, {:write, reason}}
    end
  end

  defp ensure_dir(path) do
    case File.mkdir_p(Path.dirname(path)) do
      :ok -> :ok
      {:error, reason} -> {:error, {:mkdir, reason}}
    end
  end

  defp fetch_path(config) when is_map(config), do: Map.fetch!(config, :path)
end
