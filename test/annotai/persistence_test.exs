defmodule Annotai.Persistence.FakeAdapter do
  @moduledoc "Test adapter: reports load/save to a probe pid and returns canned results."
  @behaviour Annotai.Persistence.Adapter

  @impl true
  def load(config) do
    send(config.probe, :load_called)
    Map.get(config, :load_result, {:ok, Map.get(config, :seed, [])})
  end

  @impl true
  def save(annotations, config) do
    send(config.probe, {:saved, annotations})
    Map.get(config, :save_result, :ok)
  end
end

defmodule Annotai.PersistenceTest do
  use ExUnit.Case, async: false

  import ExUnit.CaptureLog

  alias Annotai.{Annotation, Store}
  alias Annotai.Persistence
  alias Annotai.Persistence.Adapter.File, as: FileAdapter

  setup do: Annotai.TestHelpers.reset_store()

  defp days_ago(n), do: DateTime.utc_now() |> DateTime.add(-n * 86_400, :second) |> DateTime.to_iso8601()

  defp ann(attrs), do: struct(%Annotation{inserted_at: "2020-01-01T00:00:00Z"}, attrs)

  # Start an (unnamed) persister backed by the fake adapter, probing this test.
  defp start_fake(opts) do
    config = Map.merge(%{probe: self()}, Keyword.get(opts, :config, %{}))

    full =
      [name: nil, adapter: Persistence.FakeAdapter, debounce_ms: 30]
      |> Keyword.merge(Keyword.delete(opts, :config))
      |> Keyword.put(:config, config)

    {:ok, pid} = Persistence.start_link(full)
    Process.unlink(pid)
    on_exit(fn -> if Process.alive?(pid), do: Process.exit(pid, :kill) end)
    pid
  end

  describe "normalize/1" do
    test "false and nil disable" do
      assert Persistence.normalize(false) == :disabled
      assert Persistence.normalize(nil) == :disabled
    end

    test "true enables with defaults" do
      assert %{adapter: FileAdapter, path: path, ttl: :infinity} = Persistence.normalize(true)
      assert is_binary(path)
    end

    test "a keyword overrides defaults" do
      assert %{path: "custom.ets", ttl: {7, :day}, adapter: FileAdapter} =
               Persistence.normalize(path: "custom.ets", ttl: {7, :day})
    end

    test "an invalid ttl warns and falls back to :infinity instead of crashing later" do
      for bad <- [{14, :days}, {0, :day}, 3600, "7d"] do
        log = capture_log(fn -> assert %{ttl: :infinity} = Persistence.normalize(ttl: bad) end)
        assert log =~ "invalid persistence :ttl"
      end
    end
  end

  test "config/0 reads and normalizes app env" do
    Application.put_env(:annotai, :persistence, path: "x.ets")
    on_exit(fn -> Application.delete_env(:annotai, :persistence) end)
    assert %{path: "x.ets"} = Persistence.config()
  end

  describe "hydrate" do
    test "restores the store from the adapter on boot" do
      seed = [ann(%{id: "ann_a", status: :pending})]
      pid = start_fake(config: %{seed: seed})
      :sys.get_state(pid)

      assert_received :load_called
      assert Enum.map(Store.all(), & &1.id) == ["ann_a"]
    end

    test "prunes aged-out terminal records on hydrate" do
      old = ann(%{id: "old", status: :resolved, resolved_at: days_ago(30)})
      keep = ann(%{id: "keep", status: :pending, inserted_at: days_ago(1)})

      pid = start_fake(config: %{seed: [old, keep]}, ttl: {7, :day})
      :sys.get_state(pid)

      assert Store.get("old") == nil
      assert Store.get("keep")
    end

    test "a load error is logged and the store starts empty" do
      log =
        capture_log(fn ->
          pid = start_fake(config: %{load_result: {:error, :corrupt}})
          :sys.get_state(pid)
        end)

      assert Store.all() == []
      assert log =~ "could not load annotation snapshot"
    end
  end

  describe "debounced flushing" do
    test "coalesces a burst of changes into a single write" do
      Store.put(ann(%{id: "x"}))
      pid = start_fake(config: %{seed: []}, debounce_ms: 40)
      :sys.get_state(pid)

      for _ <- 1..5, do: GenServer.cast(pid, :changed)

      assert_receive {:saved, [%Annotation{id: "x"}]}, 500
      refute_receive {:saved, _}, 120
    end

    test "flush/1 writes immediately and cancels the pending debounce" do
      Store.put(ann(%{id: "y"}))
      pid = start_fake(debounce_ms: 5_000)
      :sys.get_state(pid)

      GenServer.cast(pid, :changed)
      assert Persistence.flush(pid) == :ok
      assert_received {:saved, [%Annotation{id: "y"}]}
      refute_receive {:saved, _}, 100
    end

    test "flush/1 is a no-op when the server isn't running" do
      assert Persistence.flush(:annotai_persistence_absent) == :ok
    end

    test "a save error is logged, keeps dirty, and doesn't crash the process" do
      Store.put(ann(%{id: "z"}))
      pid = start_fake(config: %{save_result: {:error, :boom}}, debounce_ms: 20)
      :sys.get_state(pid)

      log =
        capture_log(fn ->
          GenServer.cast(pid, :changed)
          assert_receive {:saved, _}
          :sys.get_state(pid)
        end)

      assert Process.alive?(pid)
      assert :sys.get_state(pid).dirty
      assert log =~ "could not persist annotations"
    end

    test "flushes a final time on graceful shutdown" do
      Store.put(ann(%{id: "t"}))
      pid = start_fake(debounce_ms: 10_000)
      :sys.get_state(pid)

      GenServer.cast(pid, :changed)
      :sys.get_state(pid)
      GenServer.stop(pid)

      assert_received {:saved, [%Annotation{id: "t"}]}
    end
  end

  describe "real File adapter integration" do
    @tag :tmp_dir
    test "round-trips annotations across a simulated restart", %{tmp_dir: dir} do
      path = Path.join(dir, "annotations.ets")

      Store.put(ann(%{id: "keep1", inserted_at: "2026-01-01T00:00:00Z"}))
      {:ok, p1} = Persistence.start_link(name: nil, path: path, debounce_ms: 10)
      :sys.get_state(p1)
      GenServer.cast(p1, :changed)
      assert :ok = Persistence.flush(p1)
      GenServer.stop(p1)

      # Wipe memory to prove the second process reloads from disk.
      Store.clear()
      assert Store.all() == []

      {:ok, p2} = Persistence.start_link(name: nil, path: path)
      :sys.get_state(p2)
      assert Enum.map(Store.all(), & &1.id) == ["keep1"]
      GenServer.stop(p2)
    end

    @tag :tmp_dir
    test "delete-all: clear + flush makes an empty snapshot durable at once", %{tmp_dir: dir} do
      path = Path.join(dir, "a.ets")

      # Registered under the default name so Store's notify + the route's flush/0
      # reach it, exercising the real coupling. debounce is huge so only the
      # explicit flush writes.
      {:ok, pid} = Persistence.start_link(path: path, debounce_ms: 5_000)
      on_exit(fn -> if Process.alive?(pid), do: GenServer.stop(pid) end)
      :sys.get_state(Persistence)

      Store.put(ann(%{id: "gone", inserted_at: "2026-01-01T00:00:00Z"}))
      assert :ok = Persistence.flush()
      assert {:ok, [%Annotation{id: "gone"}]} = FileAdapter.load(%{path: path})

      # What the clear route does: purge, then flush immediately.
      Store.clear()
      assert :ok = Persistence.flush()
      assert {:ok, []} = FileAdapter.load(%{path: path})
    end
  end
end
