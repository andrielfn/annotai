ExUnit.start()

defmodule Annotai.TestHelpers do
  @moduledoc "Shared helpers for tests that touch the singleton Store/ETS."

  @doc "Reset all Store state between tests: annotations and the agent-activity meta."
  def reset_store do
    Annotai.Store.clear()
    :ets.delete(:annotai_meta, :last_agent)
    :ok
  end
end
