defmodule Annotai.Persistence.Adapter do
  @moduledoc """
  Behaviour for annotation persistence backends.

  An adapter turns the in-memory annotation list into durable storage and back.
  The default is `Annotai.Persistence.Adapter.File` (an ETF snapshot of the whole
  set); the behaviour is the seam for alternative backends (e.g. a database) and
  for a fake adapter in tests.

  `config` is the normalized persistence config (a map) — each adapter reads only
  the keys it cares about.
  """

  alias Annotai.Annotation

  @typedoc "Normalized persistence config; adapters pick the keys they need."
  @type config :: map()

  @doc "Load all persisted annotations. Absent storage returns `{:ok, []}`."
  @callback load(config) :: {:ok, [Annotation.t()]} | {:error, term()}

  @doc "Persist `annotations`, replacing any previously stored set."
  @callback save([Annotation.t()], config) :: :ok | {:error, term()}
end
