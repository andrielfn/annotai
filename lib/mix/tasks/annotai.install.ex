if Code.ensure_loaded?(Igniter) do
  defmodule Mix.Tasks.Annotai.Install do
    @shortdoc "Installs Annotai into your Phoenix app"

    @moduledoc false
    @plug_example """
    + if Mix.env() == :dev do
    +   plug Annotai
    + end

    if code_reloading? do
      socket "/phoenix/live_reload/socket", Phoenix.LiveReloader.Socket
      plug Phoenix.LiveReloader
      plug Phoenix.CodeReloader
    end
    """

    use Igniter.Mix.Task

    @impl Igniter.Mix.Task
    def info(_argv, _composing_task) do
      %Igniter.Mix.Task.Info{
        group: :annotai,
        example: "mix annotai.install"
      }
    end

    @impl Igniter.Mix.Task
    def igniter(igniter) do
      igniter
      |> setup_endpoint()
      |> enable_debug_config()
      |> registration_notice()
    end

    # 1. Add the dev-only plug to the endpoint, before the code-reloading block.
    defp setup_endpoint(igniter) do
      {igniter, endpoint} =
        Igniter.Libs.Phoenix.select_endpoint(igniter, nil, "Which endpoint should serve Annotai?")

      if endpoint do
        add_plug_to_endpoint(igniter, endpoint)
      else
        Igniter.add_warning(igniter, """
        No endpoint found or selected for Annotai. Add the plug manually, for example:

        #{@plug_example}
        """)
      end
    end

    defp add_plug_to_endpoint(igniter, endpoint) do
      Igniter.Project.Module.find_and_update_module!(igniter, endpoint, fn zipper ->
        with :error <-
               Igniter.Code.Common.move_to(zipper, fn zipper ->
                 Igniter.Code.Function.function_call?(zipper, :plug) and
                   Igniter.Code.Function.argument_equals?(zipper, 0, Annotai)
               end),
             {:ok, zipper} <- Igniter.Code.Common.move_to(zipper, &code_reloading?/1) do
          {:ok,
           Igniter.Code.Common.add_code(
             zipper,
             """
             if Mix.env() == :dev do
               plug Annotai
             end
             """,
             placement: :before
           )}
        else
          {:ok, _} ->
            {:ok, zipper}

          :error ->
            {:warning,
             """
             Could not find the code-reloading section of your endpoint `#{inspect(endpoint)}`.
             We look for `if code_reloading? do`. Add the plug manually, for example:

             #{@plug_example}
             """}
        end
      end)
    end

    # 2. Enable the source-mapping config in dev (the killer feature needs these).
    defp enable_debug_config(igniter) do
      igniter
      |> Igniter.Project.Config.configure(
        "dev.exs",
        :phoenix_live_view,
        [:debug_heex_annotations],
        true
      )
      |> Igniter.Project.Config.configure(
        "dev.exs",
        :phoenix_live_view,
        [:debug_attributes],
        true
      )
    end

    # 3. Tell the developer how to register the MCP server (named per app, so multiple
    #    apps don't collide).
    defp registration_notice(igniter) do
      app = Igniter.Project.Application.app_name(igniter)

      Igniter.add_notice(igniter, """
      Annotai installed. Start your app (`mix phx.server`) and the widget appears bottom-right.

      To let your AI agent read annotations, register Annotai's MCP server — replace 4000 with
      your dev server's port:

          claude mcp add --transport http annotai_#{app} http://localhost:4000/annotai/mcp
      """)
    end

    defp code_reloading?(zipper) do
      Igniter.Code.Function.function_call?(zipper, :if, 2) &&
        Igniter.Code.Function.argument_matches_predicate?(
          zipper,
          0,
          &Igniter.Code.Common.variable?(&1, :code_reloading?)
        )
    end
  end
else
  defmodule Mix.Tasks.Annotai.Install do
    @shortdoc "Installs Annotai into your Phoenix app (requires igniter)"

    @moduledoc false

    use Mix.Task

    def run(_argv) do
      Mix.shell().error("""
      The task `annotai.install` requires igniter. Add it and try again:

          {:igniter, "~> 0.8", only: [:dev, :test]}

      Or install Annotai manually:

          # lib/my_app_web/endpoint.ex — before the `if code_reloading? do` block
          if Mix.env() == :dev do
            plug Annotai
          end

          # config/dev.exs
          config :phoenix_live_view, debug_heex_annotations: true, debug_attributes: true

      To control it via an environment variable, gate it behind one:

          # config/dev.exs
          config :annotai, enabled: System.get_env("DISABLE_ANNOTAI") != "true"

      Then register the MCP server with your agent:
          claude mcp add --transport http annotai_my_app http://localhost:4000/annotai/mcp
      """)

      exit({:shutdown, 1})
    end
  end
end
