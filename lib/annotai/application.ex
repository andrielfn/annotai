defmodule Annotai.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    # Persistence is opt-in and ordered AFTER the Store so the ETS table exists
    # before it hydrates from disk. `:one_for_all` keeps the pair in sync so a
    # restart of either re-hydrates against a fresh table.
    children = [Annotai.Store | persistence_children()]
    Supervisor.start_link(children, strategy: :one_for_all, name: Annotai.Supervisor)
  end

  defp persistence_children do
    case Annotai.Persistence.config() do
      :disabled -> []
      config -> [{Annotai.Persistence, Map.to_list(config)}]
    end
  end
end
