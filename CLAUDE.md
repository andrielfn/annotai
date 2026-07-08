# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Annotai is

A **dev-only Phoenix/LiveView library** mounted as a single `Plug`. It injects an in-browser
annotation widget: a developer clicks elements on their running app and leaves comments. Each
annotation is captured with rich context (CSS selector, `phx-*` fingerprint, and the exact HEEx
`file:line` that rendered the element) and exposed to an AI coding agent over an **in-process
MCP server**. The agent reads pending annotations, opens the precise source location, makes the
change, and marks them resolved — a tight visual feedback loop.

The defining decision: **the entire backend lives inside the host app's BEAM process** — no
separate server, no database, no SSE, no stdio shim. Phoenix's long-lived process holds state in
ETS and answers MCP calls by reading it directly.

## Commands

Annotai is a dependency, not a standalone app; the end-to-end loop is exercised by adding it to a
Phoenix/LiveView host app and driving the widget in a browser.

```bash
# Elixir library
mix deps.get
mix compile --warnings-as-errors      # CI treats warnings as errors
mix format --check-formatted
mix test                              # ExUnit suite
mix test path/to/file_test.exs        # one file
mix test path/to/file_test.exs:LINE   # one test by line

# Widget (Lit, bundled with bun) — source in assets/src/, builds to priv/static/app.js
cd assets && bun install            # once (use --frozen-lockfile in CI)
cd assets && bun run build          # bundle the widget
cd assets && bun run watch          # rebuild on change
cd assets && bun test               # widget tests (happy-dom DOM, no browser binary)
cd assets && bun run format:check   # prettier
```

OTP/Elixir/bun versions are pinned in `.mise.toml` and mirrored in the CI workflow — keep them in
sync when bumping either.

`priv/static/app.js` is **committed** so consumer apps run no JS build. After editing the widget
source, run `bun run build` and **commit the rebuilt bundle in the same change**. The asset is
served from disk per request, so reloading the page picks it up — no Elixir recompile needed.

## Architecture

Three layers, all living in the host app's process — no external services:

1. **The Plug** (dev-only, mounted in the host endpoint). It owns the `/annotai/*` namespace —
   serving the widget bundle, the annotation REST API, and the MCP endpoint — and, for every
   *other* HTML response, injects a single `<script>` tag before `</body>` to load the widget. It
   never rewrites host markup; the entire UI is built client-side.
2. **The store**: an ETS table holding annotations, owned by a trivial GenServer that runs **no
   logic**, so a request-handler crash can't take the table down. Handlers read/write the named
   table directly. State is ephemeral by default — no DB, gone on restart.
3. **The MCP server**: a JSON-RPC 2.0 endpoint that reads and mutates the store directly. An agent
   registers it once over HTTP. Tools cover reading pending annotations, fetching one with its
   reply thread, guarded lifecycle transitions (acknowledge / resolve / dismiss / reply), and a
   watch loop for hands-free polling.

The **browser widget** is built with Lit inside a Shadow DOM, mounted at `document.body`. It POSTs
annotations as JSON and polls for status updates.

### Optional persistence

`Annotai.Persistence` (opt-in via `config :annotai, persistence: …`) adds durability without
touching the store's hot path. `Annotai.Store` funnels every mutation through `write/1`/`delete/1`/
`clear/0`, which fire a **guarded async cast** to the persister (a no-op when it isn't running, so
the store stays decoupled). The persister **debounces** those into a single snapshot write, and on
boot **hydrates** the table via `Store.restore/1` before serving. The encode/write lives behind the
`Annotai.Persistence.Adapter` behaviour (default `Adapter.File`: a versioned `term_to_binary` ETS
snapshot, written atomically via temp-file + rename). `Annotai.Persistence.Retention` (pure) prunes
only **terminal** annotations past a TTL — open ones never expire. "Delete all" calls
`Persistence.flush/0` after `Store.clear/0` so an explicit purge is durable immediately, not after
the debounce window. Kept history never reaches the agent — the MCP tools only read open work.
