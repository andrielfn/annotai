---
name: fix-annotations
description: Work through the UI annotations a developer left with Annotai's in-browser widget. Read pending annotations over the in-process MCP server, open the exact HEEx file:line each one points at, make the change, verify it, and close the loop (resolve / reply / dismiss). Use this when the user says "fix the annotations", "check pending annotations", "work through my annotai notes", asks to "watch annotations" for a hands-free loop, or otherwise wants to act on Annotai feedback. Annotai is a dev-only Phoenix/LiveView annotation tool; annotations arrive as `annotai_*` MCP tools.
---

# Work through Annotai annotations

Annotai lets a developer click an element on their running Phoenix/LiveView app and
leave a note. Each annotation carries the context an agent needs to act without
guessing: the comment, a CSS selector, the `phx-*` fingerprint, and, above all, the
**exact HEEx `file:line`** that rendered the element. This is the loop that turns those
notes into verified changes.

The MCP tools are the capability; this playbook is the procedure. It's written to be
agent-agnostic: any MCP-capable coding agent (Claude Code, Codex, and so on) exposes the
same `annotai_*` tools. Follow it in order.

## Preflight: confirm the MCP tools are reachable

The annotations arrive as tools named `annotai_get_pending`, `annotai_get_annotation`,
`annotai_acknowledge`, `annotai_resolve`, `annotai_dismiss`, `annotai_reply`, and
`annotai_watch_annotations`.

If those tools are **not** present in this session:

1. The host app must be running (Annotai lives inside the Phoenix dev process, so there is
   no separate server) and the MCP endpoint registered with your agent. For Claude Code:

   ```bash
   claude mcp add --transport http annotai http://localhost:4000/annotai/mcp
   ```

   Other agents register the same HTTP URL through their own config (e.g. Codex via
   `~/.codex/config.toml`). Match the port to the dev server.
2. **MCP tools are discovered when the agent starts.** After registering, restart your
   agent session before the `annotai_*` tools appear. Say so and stop; don't try to work
   around it.

## The loop (one-shot: "fix the annotations")

### 1. Pull the work

Call `annotai_get_pending`. It returns open annotations (pending **or** acknowledged),
**oldest first**. Each item has the comment, selector, `phx-*` fingerprint, and source
`file:line`. Attached screenshots are listed as metadata only; no image data here.

If the list is empty, say so and offer watch mode (below) instead of spinning.

### 2. Claim it before you touch code

Call `annotai_acknowledge` with the annotation's `id` **before editing**. This flips the
widget to "I see this and am working on it" so the human watching the page gets live
feedback. Skipping this is the most common way the loop feels broken to the user.

### 3. Read the full context (when you need it)

If the comment references a screenshot, a prior reply, or is ambiguous, call
`annotai_get_annotation` with the `id`. It returns the full reply thread plus any
screenshots as **viewable image blocks**; look at them, they usually disambiguate the
request.

### 4. Go straight to the source

Open the captured `file:line` directly. **Do not re-search for the element**; resolving
that location is exactly what Annotai already did for you. The selector and `phx-*`
fingerprint are there to confirm you're at the right node, not to re-derive it.

### 5. Make the smallest change that satisfies the note, then verify

- Smallest change that addresses the comment; follow the surrounding conventions.
- **Verify before you close it**: compile the host app (e.g. `mix compile`), run the
  relevant test, or drive the flow. "Looks right" is not resolved. If the note is a
  visual/widget change in an app that builds its own assets, rebuild them before you check.

### 6. Close the loop: pick the right transition

- **`annotai_resolve`** (with a one-line `summary` of what changed): you made the change
  and verified it. The summary lands in the thread so the human sees what you did. Only
  resolve notes the user actually wants acted on; if a change was rejected, leave it open.
- **`annotai_reply`** (with `message`): the note is a **question**, or you need input
  before acting. Answer in the thread and leave it open.
- **`annotai_dismiss`** (with a `reason`): it won't be acted on (out of scope, won't fix,
  duplicate). Always give a concrete reason; it's recorded in the thread.

Lifecycle transitions are guarded server-side, so an annotation can't be resolved or
dismissed twice, but pick deliberately rather than relying on the guard.

### 7. Next annotation

Move to the next pending item and repeat. When several notes touch the same file, batch
them into one coherent edit rather than reopening the file repeatedly.

## Watch mode ("watch annotations" / hands-free)

When the user asks to *watch* rather than run once:

1. Call `annotai_watch_annotations`. It drains anything already pending immediately;
   otherwise it waits up to `timeout_seconds` (default 25, kept under the server idle
   timeout) for the first arrival, then collects a short batch.
2. It returns `{type: "annotations", ...}` with a batch, or `{type: "timeout", ...}` when
   nothing arrived.
3. Run steps 2 through 6 of the loop above on each annotation in the batch.
4. Call `annotai_watch_annotations` **again** to keep watching. Loop until the user says
   stop or a timeout comes back and they don't want to keep waiting.

Don't bake watch mode into project memory unprompted; some users prefer the explicit
one-shot flow. Only enter watch mode when asked.

## Notes

- **Kept history never reaches you.** The MCP tools only expose *open* work; resolved and
  dismissed annotations are out of scope by design. Don't try to reopen or re-fetch them.
- **A human reply can reopen a closed annotation.** If the developer replies to something
  you resolved or dismissed, it comes back as pending, so treat it as fresh work on the
  next `get_pending` / `watch` call.
- **Don't start the server yourself.** Annotai runs inside the user's `mix phx.server`;
  assume they own the running app.
