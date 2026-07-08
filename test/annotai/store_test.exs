defmodule Annotai.StoreTest do
  use ExUnit.Case, async: false

  alias Annotai.{Annotation, Store}

  # The Store is a process-wide singleton (named public ETS); reset between tests.
  setup do: Annotai.TestHelpers.reset_store()

  defp put(attrs \\ %{}), do: attrs |> Annotation.new() |> Store.put()

  describe "put/1" do
    test "fills id and inserted_at when absent" do
      ann = put(%{"comment" => "x"})
      assert ann.id =~ ~r/^ann_/
      assert is_binary(ann.inserted_at)
      assert %Annotation{} = Store.get(ann.id)
    end

    test "preserves a supplied id and inserted_at" do
      ann = Store.put(%Annotation{id: "ann_fixed", inserted_at: "2020-01-01T00:00:00Z"})
      assert ann.id == "ann_fixed"
      assert ann.inserted_at == "2020-01-01T00:00:00Z"
    end
  end

  test "all/0 returns structs oldest-first" do
    Store.put(%Annotation{id: "b", inserted_at: "2026-01-02T00:00:00Z"})
    Store.put(%Annotation{id: "a", inserted_at: "2026-01-01T00:00:00Z"})
    assert Enum.map(Store.all(), & &1.id) == ["a", "b"]
  end

  test "pending/0 returns only :pending and :acknowledged" do
    Store.put(%Annotation{id: "p", status: :pending, inserted_at: "2026-01-01T00:00:00Z"})
    Store.put(%Annotation{id: "a", status: :acknowledged, inserted_at: "2026-01-02T00:00:00Z"})
    Store.put(%Annotation{id: "r", status: :resolved, inserted_at: "2026-01-03T00:00:00Z"})
    assert Enum.map(Store.pending(), & &1.id) == ["p", "a"]
  end

  test "get/1 returns nil for a missing id" do
    assert Store.get("nope") == nil
  end

  describe "update/2" do
    test "merges given fields" do
      ann = put(%{"comment" => "old"})
      assert {:ok, updated} = Store.update(ann.id, %{comment: "new"})
      assert updated.comment == "new"
      assert Store.get(ann.id).comment == "new"
    end

    test "returns {:error, :not_found} for a missing id" do
      assert Store.update("nope", %{comment: "x"}) == {:error, :not_found}
    end

    test "leaves unrelated fields untouched" do
      ann =
        Store.put(%Annotation{
          id: "ann_1",
          status: :acknowledged,
          comment: "old",
          thread: [%{"x" => 1}]
        })

      {:ok, updated} = Store.update(ann.id, %{comment: "new"})
      assert updated.status == :acknowledged
      assert updated.thread == [%{"x" => 1}]
    end
  end

  describe "transition/3" do
    test "applies an allowed transition" do
      ann = put(%{"comment" => "x"})

      assert {:ok, updated} =
               Store.transition(ann.id, [:pending, :acknowledged], %{status: :acknowledged})

      assert updated.status == :acknowledged
    end

    test "rejects a disallowed transition and leaves the annotation untouched (idempotency)" do
      ann = Store.put(%Annotation{id: "r", status: :resolved})

      assert Store.transition("r", [:pending, :acknowledged], %{status: :resolved}) ==
               {:error, {:invalid_transition, :resolved, [:pending, :acknowledged]}}

      assert Store.get("r").status == :resolved
      refute_received _
      assert ann.status == :resolved
    end

    test "auto-stamps resolved_at when entering a terminal status" do
      ann = put(%{"comment" => "x"})

      {:ok, resolved} =
        Store.transition(ann.id, [:pending], %{status: :resolved, resolved_by: :agent})

      assert resolved.status == :resolved
      assert resolved.resolved_by == :agent
      assert is_binary(resolved.resolved_at)
    end

    test "auto-stamps resolved_at for :dismissed too" do
      ann = put(%{"comment" => "x"})
      {:ok, dismissed} = Store.transition(ann.id, [:pending], %{status: :dismissed})
      assert dismissed.status == :dismissed
      assert is_binary(dismissed.resolved_at)
    end

    test "not_found for a missing id" do
      assert Store.transition("nope", [:pending], %{status: :resolved}) == {:error, :not_found}
    end
  end

  describe "add_thread_message/3" do
    test "appends a message map" do
      ann = put(%{"comment" => "x"})
      assert {:ok, updated} = Store.add_thread_message(ann.id, "agent", "on it")
      assert [%{"role" => "agent", "content" => "on it", "at" => at}] = updated.thread
      assert is_binary(at)
    end

    test "appends in order across multiple calls" do
      ann = put(%{"comment" => "x"})
      {:ok, _} = Store.add_thread_message(ann.id, "human", "first")
      {:ok, updated} = Store.add_thread_message(ann.id, "agent", "second")
      assert [%{"content" => "first"}, %{"content" => "second"}] = updated.thread
    end

    test "not_found for a missing id" do
      assert Store.add_thread_message("nope", "agent", "x") == {:error, :not_found}
    end
  end

  describe "add_human_reply/2" do
    test "appends a human message to an open annotation (pending and acknowledged)" do
      for status <- ["pending", "acknowledged"] do
        ann = put(%{"status" => status})
        assert {:ok, updated} = Store.add_human_reply(ann.id, "use accent")
        assert [%{"role" => "human", "content" => "use accent"}] = updated.thread
      end
    end

    test "reopens a terminal annotation (:resolved/:dismissed), clearing resolution metadata" do
      for status <- [:resolved, :dismissed] do
        # Build the struct directly: Annotation.new never accepts resolution metadata.
        ann =
          Store.put(%Annotation{
            id: "ann_#{status}",
            status: status,
            resolved_by: :agent,
            resolved_at: "2026-01-01T00:00:00Z",
            thread: [%{"role" => "agent", "content" => "done", "at" => "2026-01-01T00:00:00Z"}]
          })

        assert {:ok, updated} = Store.add_human_reply(ann.id, "one more thing")
        assert updated.status == :pending
        assert updated.resolved_by == nil
        assert updated.resolved_at == nil
        # The prior resolution summary stays; the human reply is appended after it.
        assert [%{"role" => "agent"}, %{"role" => "human", "content" => "one more thing"}] = updated.thread
      end
    end

    test "not_found for a missing id" do
      assert Store.add_human_reply("nope", "hi") == {:error, :not_found}
    end
  end

  test "delete/1 removes one annotation, leaving others" do
    a = put()
    b = put()
    Store.delete(a.id)
    assert Store.get(a.id) == nil
    assert Store.get(b.id)
  end

  test "clear/0 removes all annotations" do
    put()
    put()
    Store.clear()
    assert Store.all() == []
  end

  test "touch_agent/0 records a timestamp last_agent/0 can read" do
    assert Store.last_agent() == nil
    assert Store.touch_agent() == :ok
    assert is_integer(Store.last_agent())
  end

  describe "restore/1" do
    test "inserts annotations verbatim, preserving ids and timestamps" do
      annotations = [
        %Annotation{id: "ann_x", inserted_at: "2020-01-01T00:00:00Z", status: :resolved},
        %Annotation{id: "ann_y", inserted_at: "2020-01-02T00:00:00Z", status: :pending}
      ]

      assert Store.restore(annotations) == :ok
      assert Store.get("ann_x").status == :resolved
      assert Store.get("ann_x").inserted_at == "2020-01-01T00:00:00Z"
      assert Enum.map(Store.all(), & &1.id) == ["ann_x", "ann_y"]
    end

    test "does not notify persistence (no cast to a running persister)" do
      # Stand in for the persistence process under its registered name; restore
      # must not send it anything, unlike put/delete/clear.
      # The registered name is released automatically when this test process
      # exits, so no explicit cleanup is needed.
      Process.register(self(), Annotai.Persistence)

      Store.restore([%Annotation{id: "ann_z", inserted_at: "2020-01-01T00:00:00Z"}])
      refute_receive {:"$gen_cast", :changed}

      # ...but a real mutation does notify, proving the hook is wired.
      put()
      assert_receive {:"$gen_cast", :changed}
    end
  end
end
