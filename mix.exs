defmodule Annotai.MixProject do
  use Mix.Project

  @version "0.2.0"
  @source_url "https://github.com/andrielfn/annotai"

  def project do
    [
      app: :annotai,
      version: @version,
      elixir: "~> 1.16",
      elixirc_paths: ["lib"],
      deps: deps(),
      name: "Annotai",
      description: description(),
      package: package(),
      docs: docs(),
      source_url: @source_url
    ]
  end

  def application do
    [
      mod: {Annotai.Application, []},
      extra_applications: [:logger]
    ]
  end

  defp deps do
    [
      {:plug, "~> 1.20"},
      {:jason, "~> 1.4"},
      {:igniter, "~> 0.8", optional: true},
      {:ex_doc, "~> 0.34", runtime: false, only: :dev}
    ]
  end

  defp description do
    "A dev-only Phoenix/LiveView annotation widget that feeds in-browser UI feedback " <>
      "to AI coding agents over an in-process MCP server."
  end

  defp package do
    [
      maintainers: ["Andriel Nuernberg"],
      licenses: ["MIT"],
      links: %{"GitHub" => @source_url},
      files: ~w(lib priv/static/app.js mix.exs README.md LICENSE CHANGELOG.md)
    ]
  end

  defp docs do
    [
      main: "readme",
      source_ref: "v#{@version}",
      extras: ["README.md", "CHANGELOG.md", "LICENSE"]
    ]
  end
end
