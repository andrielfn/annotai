defmodule Annotai.Persistence.Retention do
  @moduledoc """
  Pure retention policy: decide which annotations have aged out.

  Only *terminal* annotations (`:resolved`/`:dismissed`) can expire, and only once
  older than the configured TTL — measured from `resolved_at`, falling back to
  `inserted_at`. Open annotations (`:pending`/`:acknowledged`) are never expired
  regardless of age, so unhandled feedback is never silently dropped.

  This module holds no state and reads no clock: callers pass `now`, which keeps
  the policy trivially testable and lets the orchestrator run it on hydrate.
  """

  alias Annotai.Annotation

  @terminal [:resolved, :dismissed]

  @typedoc "Retention window; `:infinity` disables expiry."
  @type ttl :: :infinity | {pos_integer(), :second | :minute | :hour | :day}

  @doc """
  Split `annotations` into `{kept, expired_ids}` for the given `ttl` and `now`.

  Order within `kept` is preserved. `ttl: :infinity` keeps everything. An
  annotation whose timestamp can't be parsed is kept (never delete what we can't
  date).
  """
  @spec partition([Annotation.t()], ttl(), DateTime.t()) ::
          {[Annotation.t()], [String.t()]}
  def partition(annotations, :infinity, _now), do: {annotations, []}

  def partition(annotations, ttl, now) do
    cutoff = DateTime.add(now, -to_seconds(ttl), :second)
    {expired, kept} = Enum.split_with(annotations, &expired?(&1, cutoff))
    {kept, Enum.map(expired, & &1.id)}
  end

  defp expired?(%Annotation{status: status} = annotation, cutoff) when status in @terminal do
    case timestamp(annotation) do
      nil -> false
      dt -> DateTime.compare(dt, cutoff) == :lt
    end
  end

  defp expired?(_open, _cutoff), do: false

  # Prefer resolved_at; fall back to inserted_at when it's absent or unparseable.
  defp timestamp(%Annotation{resolved_at: resolved_at, inserted_at: inserted_at}),
    do: parse(resolved_at) || parse(inserted_at)

  defp parse(iso) when is_binary(iso) do
    case DateTime.from_iso8601(iso) do
      {:ok, dt, _offset} -> dt
      {:error, _} -> nil
    end
  end

  defp parse(_), do: nil

  defp to_seconds({n, :second}) when is_integer(n) and n > 0, do: n
  defp to_seconds({n, :minute}) when is_integer(n) and n > 0, do: n * 60
  defp to_seconds({n, :hour}) when is_integer(n) and n > 0, do: n * 3600
  defp to_seconds({n, :day}) when is_integer(n) and n > 0, do: n * 86_400
end
