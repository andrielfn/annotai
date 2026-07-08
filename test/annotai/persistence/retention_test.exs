defmodule Annotai.Persistence.RetentionTest do
  use ExUnit.Case, async: true

  alias Annotai.Annotation
  alias Annotai.Persistence.Retention

  @now ~U[2026-07-01 12:00:00Z]

  defp iso(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
  defp days_ago(n), do: iso(DateTime.add(@now, -n * 86_400, :second))

  defp ann(attrs), do: struct(%Annotation{inserted_at: days_ago(0)}, attrs)

  test ":infinity keeps everything" do
    annotations = [ann(%{id: "a", status: :resolved, resolved_at: days_ago(999)})]
    assert Retention.partition(annotations, :infinity, @now) == {annotations, []}
  end

  test "terminal records older than the ttl expire; recent ones stay" do
    old = ann(%{id: "old", status: :resolved, resolved_at: days_ago(10)})
    fresh = ann(%{id: "fresh", status: :dismissed, resolved_at: days_ago(1)})

    assert {kept, ["old"]} = Retention.partition([old, fresh], {7, :day}, @now)
    assert Enum.map(kept, & &1.id) == ["fresh"]
  end

  test "open annotations never expire regardless of age" do
    annotations = [
      ann(%{id: "p", status: :pending, inserted_at: days_ago(999)}),
      ann(%{id: "ack", status: :acknowledged, inserted_at: days_ago(999)})
    ]

    assert {^annotations, []} = Retention.partition(annotations, {1, :day}, @now)
  end

  test "age is measured from resolved_at, not inserted_at" do
    # Inserted long ago but only just resolved → still within the window.
    recently_resolved =
      ann(%{id: "r", status: :resolved, inserted_at: days_ago(30), resolved_at: days_ago(1)})

    assert {[_], []} = Retention.partition([recently_resolved], {7, :day}, @now)
  end

  test "falls back to inserted_at when resolved_at is missing" do
    stale = ann(%{id: "s", status: :dismissed, resolved_at: nil, inserted_at: days_ago(10)})
    assert {[], ["s"]} = Retention.partition([stale], {7, :day}, @now)
  end

  test "the boundary (exactly at the ttl) is kept" do
    at_cutoff = ann(%{id: "edge", status: :resolved, resolved_at: days_ago(7)})
    assert {[_], []} = Retention.partition([at_cutoff], {7, :day}, @now)
  end

  test "an unparseable timestamp is kept" do
    weird = ann(%{id: "w", status: :resolved, resolved_at: "not-a-date", inserted_at: "nope"})
    assert {[_], []} = Retention.partition([weird], {7, :day}, @now)
  end

  test "falls back to inserted_at when resolved_at is present but unparseable" do
    garbage = ann(%{id: "g", status: :resolved, resolved_at: "2026-13-99", inserted_at: days_ago(10)})
    assert {[], ["g"]} = Retention.partition([garbage], {7, :day}, @now)
  end

  test "supports second/minute/hour units" do
    old = ann(%{id: "o", status: :resolved, resolved_at: iso(DateTime.add(@now, -120, :second))})
    assert {[], ["o"]} = Retention.partition([old], {1, :minute}, @now)
  end
end
