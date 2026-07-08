defmodule Annotai.Store do
  @moduledoc """
  Ephemeral in-memory annotation store.

  A trivial `GenServer` owns a public, named ETS table so the MCP and HTTP
  handlers (running in web-server processes) can read and write directly
  without a GenServer round-trip. The owner holds no logic, so a handler crash
  can never take the table down with it. Annotations live only in memory and are
  wiped when the host app restarts — by design for a dev-only feedback tool.

  Every stored value is a `Annotai.Annotation` struct.
  """
  use GenServer

  alias Annotai.Annotation

  @table :annotai_annotations
  @meta :annotai_meta

  # Optional persistence process. When running, every mutation pokes it (async)
  # so it can debounce a snapshot to disk; when absent the poke is a no-op, so the
  # Store stays fully decoupled from — and usable without — persistence.
  @persistence Annotai.Persistence

  @open_statuses [:pending, :acknowledged]

  @doc false
  def start_link(_opts), do: GenServer.start_link(__MODULE__, nil, name: __MODULE__)

  @impl true
  def init(nil) do
    table = :ets.new(@table, [:named_table, :public, :set, read_concurrency: true])
    :ets.new(@meta, [:named_table, :public, :set])
    {:ok, table}
  end

  @doc "Record that an agent just made an MCP request."
  @spec touch_agent() :: :ok
  def touch_agent do
    :ets.insert(@meta, {:last_agent, System.system_time(:millisecond)})
    :ok
  end

  @doc "Epoch-ms of the last agent request, or `nil` if none yet."
  @spec last_agent() :: integer() | nil
  def last_agent do
    case :ets.lookup(@meta, :last_agent) do
      [{:last_agent, ts}] -> ts
      [] -> nil
    end
  end

  @doc "Store an annotation, filling in `id` and `inserted_at` when absent."
  @spec put(Annotation.t()) :: Annotation.t()
  def put(%Annotation{} = annotation) do
    write(%{
      annotation
      | id: annotation.id || gen_id(),
        inserted_at: annotation.inserted_at || now_iso()
    })
  end

  @doc "All annotations, oldest first."
  @spec all() :: [Annotation.t()]
  def all do
    @table
    |> :ets.tab2list()
    |> Enum.map(&elem(&1, 1))
    |> Enum.sort_by(& &1.inserted_at)
  end

  @doc "Annotations still awaiting the agent (`:pending` or `:acknowledged`), oldest first."
  @spec pending() :: [Annotation.t()]
  def pending, do: Enum.filter(all(), &(&1.status in @open_statuses))

  @doc "Fetch one annotation by id, or `nil`."
  @spec get(String.t()) :: Annotation.t() | nil
  def get(id) do
    case :ets.lookup(@table, id) do
      [{^id, annotation}] -> annotation
      [] -> nil
    end
  end

  @doc "Fetch a single attached image (with its base64 `data`) by annotation + image id, or `nil`."
  @spec get_image(String.t(), String.t()) :: map() | nil
  def get_image(annotation_id, image_id) do
    case get(annotation_id) do
      %Annotation{images: images} -> Enum.find(images, &(&1["id"] == image_id))
      nil -> nil
    end
  end

  @doc """
  Merge `changes` (a map of struct fields) into an annotation.

  Returns `{:ok, annotation}` or `{:error, :not_found}`. Used for plain edits
  (e.g. the developer editing a comment); lifecycle changes go through
  `transition/3`.
  """
  @spec update(String.t(), map()) :: {:ok, Annotation.t()} | {:error, :not_found}
  def update(id, changes) when is_map(changes) do
    case get(id) do
      nil -> {:error, :not_found}
      annotation -> {:ok, write(struct(annotation, changes))}
    end
  end

  @doc """
  Apply a guarded lifecycle transition.

  The annotation's current status must be one of `allowed_from`, otherwise it is
  left untouched — this is what makes acknowledge/resolve/dismiss idempotent.
  `resolved_at` is stamped automatically when the new status is terminal
  (`:resolved`/`:dismissed`).
  """
  @spec transition(String.t(), [Annotation.status()], map()) ::
          {:ok, Annotation.t()}
          | {:error, :not_found}
          | {:error, {:invalid_transition, Annotation.status(), [Annotation.status()]}}
  def transition(id, allowed_from, changes) do
    case get(id) do
      nil ->
        {:error, :not_found}

      %Annotation{status: status} = annotation ->
        if status in allowed_from do
          {:ok, write(struct(annotation, stamp(changes)))}
        else
          {:error, {:invalid_transition, status, allowed_from}}
        end
    end
  end

  @doc """
  Append a message to an annotation's reply thread.

  Returns `{:ok, annotation}` or `{:error, :not_found}`.
  """
  @spec add_thread_message(String.t(), String.t(), String.t()) ::
          {:ok, Annotation.t()} | {:error, :not_found}
  def add_thread_message(id, role, content) do
    case get(id) do
      nil -> {:error, :not_found}
      %Annotation{} = annotation -> {:ok, append_message(annotation, role, content)}
    end
  end

  @doc """
  Append a human reply to an annotation's thread.

  On an *open* (`:pending`/`:acknowledged`) annotation this just appends. On a
  terminal (`:resolved`/`:dismissed`) one it also **reopens** the thread —
  status back to `:pending`, `resolved_at`/`resolved_by` cleared — so the agent
  picks the work up again (a reply the agent never sees would be a dead end).
  The prior resolution summary stays in the thread as context for the next pass.
  This is the browser-facing counterpart to the agent's `add_thread_message/3`.
  """
  @spec add_human_reply(String.t(), String.t()) ::
          {:ok, Annotation.t()} | {:error, :not_found}
  def add_human_reply(id, content) do
    # Read once and write the checked struct, so the reopen decision applies to
    # the same snapshot we mutate (narrows the resolve-vs-reply race window).
    case get(id) do
      nil ->
        {:error, :not_found}

      %Annotation{status: status} = annotation when status in @open_statuses ->
        {:ok, append_message(annotation, "human", content)}

      %Annotation{} = annotation ->
        reopened = %{annotation | status: :pending, resolved_at: nil, resolved_by: nil}
        {:ok, append_message(reopened, "human", content)}
    end
  end

  defp append_message(%Annotation{thread: thread} = annotation, role, content) do
    message = %{"role" => role, "content" => content, "at" => now_iso()}
    write(%{annotation | thread: thread ++ [message]})
  end

  @doc "Delete one annotation."
  @spec delete(String.t()) :: :ok
  def delete(id) do
    :ets.delete(@table, id)
    notify_change()
    :ok
  end

  @doc "Remove all annotations."
  @spec clear() :: :ok
  def clear do
    :ets.delete_all_objects(@table)
    notify_change()
    :ok
  end

  @doc """
  Bulk-insert annotations verbatim, used to hydrate the table from persistence.

  Unlike `put/1`, ids and timestamps are preserved as-is (never regenerated), and
  no change notification is emitted — hydration is loading what was already
  persisted, not a new mutation to snapshot back.
  """
  @spec restore([Annotation.t()]) :: :ok
  def restore(annotations) when is_list(annotations) do
    :ets.insert(@table, Enum.map(annotations, &{&1.id, &1}))
    :ok
  end

  defp write(%Annotation{} = annotation) do
    :ets.insert(@table, {annotation.id, annotation})
    notify_change()
    annotation
  end

  # Poke the persistence process to snapshot the change. `cast` to an unregistered
  # name is a safe no-op, so this costs nothing when persistence is disabled.
  defp notify_change, do: GenServer.cast(@persistence, :changed)

  defp stamp(%{status: status} = changes) when status in [:resolved, :dismissed] do
    Map.put_new(changes, :resolved_at, now_iso())
  end

  defp stamp(changes), do: changes

  defp now_iso, do: DateTime.utc_now() |> DateTime.to_iso8601()

  defp gen_id, do: "ann_" <> (:crypto.strong_rand_bytes(6) |> Base.url_encode64(padding: false))
end
