import { css, html } from "lit";
import * as icons from "../icons.js";
import { relativeTime } from "../annotations.js";
import { pagePath } from "../dom.js";

// The single per-status table — order, label (for the filter-chip tooltip), and
// hugeicon (clock = waiting, eye = seen, check = done, x = won't do) defined
// together so a status can't drift out of sync across facets. `byStatus` is the
// keyed lookup; unknown statuses fall back to pending.
const STATUSES = [
  { key: "pending", label: "Pending", icon: icons.clock },
  { key: "acknowledged", label: "Acknowledged", icon: icons.eye },
  { key: "resolved", label: "Resolved", icon: icons.checkCircle },
  { key: "dismissed", label: "Dismissed", icon: icons.xCircle },
];
const byStatus = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const statusOf = (s) => byStatus[s] ?? byStatus.pending;

// Compact "time ago" for a stored ISO-8601 timestamp (via the shared bucketing).
const timeAgo = (iso) => {
  const then = Date.parse(iso ?? "");
  return Number.isNaN(then) ? null : relativeTime(Date.now() - then);
};

// Per-status counts (from the full list, so they're stable while filtering). A
// status gets a chip when it has annotations OR is in the active filter — so a
// filter stays toggle-off-able even after its last annotation changes status.
const countChips = (annotations, active) =>
  STATUSES.map(({ key }) => ({ key, n: annotations.filter((a) => a.status === key).length })).filter(
    (c) => c.n > 0 || active.includes(c.key),
  );

// One annotation card: a status-colored left rail, a header line (status word +
// time-ago), the truncated comment, and a footer (page · reply count). The whole
// card is the jump affordance. Status drives every tint via `data-status`.
const row = (ann, onJump) => {
  const status = statusOf(ann.status);
  const path = pagePath(ann.url);
  const ago = timeAgo(ann.inserted_at);
  // Human follow-ups only: the agent's own thread entries (incl. auto "Dismissed: …"
  // / resolve summaries) aren't "replies" and would inflate the count on their own.
  const replies = Array.isArray(ann.thread) ? ann.thread.filter((m) => m.role === "human").length : 0;
  return html`<button class="hist-card" data-status=${status.key} @click=${() => onJump(ann)}>
    <span class="hist-top">
      <span class="hist-ico" data-status=${status.key} aria-hidden="true">${status.icon}</span>
      <span class="hist-label" data-status=${status.key}>${status.label}</span>
      ${ago ? html`<span class="hist-time">${ago}</span>` : null}
    </span>
    <span class="hist-comment">${ann.comment?.trim() || html`<span class="hist-empty">No comment</span>`}</span>
    ${path || replies > 0
      ? html`<span class="hist-foot">
          ${path ? html`<span class="hist-page">${path}</span>` : null}
          ${replies > 0
            ? html`<span class="hist-replies" title=${`${replies} ${replies === 1 ? "reply" : "replies"}`}
                >${icons.chat}${replies}</span
              >`
            : null}
        </span>`
      : null}
  </button>`;
};

// The annotations-history panel: a scrollable, newest-first list of every
// annotation (all statuses, all pages). The header count chips double as
// multi-select status filters. A pure view; behavior arrives as handlers.
export const historyTemplate = ({ annotations, filter, onJump, onToggleFilter, onTip, onUntip }) => {
  const active = filter ?? [];
  const ordered = [...annotations].reverse(); // store gives oldest-first; show newest-first
  const visible = active.length ? ordered.filter((a) => active.includes(a.status)) : ordered;
  const chips = countChips(annotations, active);
  return html`<div class="history anchored">
    <div class="hist-head">
      <span class="hist-title">Annotations</span>
      <span class="hist-counts">
        ${chips.map(
          (c) =>
            html`<button
              class="hist-count"
              data-status=${c.key}
              ?data-active=${active.includes(c.key)}
              aria-pressed=${active.includes(c.key)}
              @click=${() => onToggleFilter(c.key)}
              @mouseenter=${(e) => onTip(e, byStatus[c.key].label)}
              @mouseleave=${onUntip}
            >
              <span class="hist-cico" data-status=${c.key}>${byStatus[c.key].icon}</span>${c.n}
            </button>`,
        )}
      </span>
    </div>
    <div class="hist-list">
      ${visible.length
        ? visible.map((ann) => row(ann, onJump))
        : html`<div class="hist-none">${annotations.length ? "No matching annotations." : "No annotations yet."}</div>`}
    </div>
  </div>`;
};

export const styles = css`
  /* Placement (position, insets, transform-origin) comes from the shared .anchored
     rules in tokens.js so the panel tracks the widget's configured corner. */
  .history {
    z-index: 100001;
    width: 300px;
    background: var(--surface);
    color: var(--text);
    border-radius: 14px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 9px 9px;
    font-weight: 300;
    animation: pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .hist-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 6px;
  }
  .hist-title {
    font-size: 14px;
    font-weight: 400;
    color: var(--text);
  }
  .hist-counts {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  /* Count chip = a status filter toggle. Active chips get a filled pill; when any
     filter is on, inactive chips dim so the active selection reads clearly. */
  .hist-count {
    all: unset;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 500;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
    transition:
      background 0.12s ease,
      opacity 0.12s ease;
  }
  .hist-count:hover {
    background: var(--hover);
  }
  .hist-count[data-active] {
    background: var(--hover);
    color: var(--text);
  }
  .hist-counts:has([data-active]) .hist-count:not([data-active]) {
    opacity: 0.45;
  }
  /* Header filter icon: the same status hugeicon as the row, sized down. */
  .hist-cico {
    width: 12px;
    height: 12px;
    flex: none;
  }
  .hist-cico svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  /* Shared status tint for the header filter icon. */
  .hist-cico {
    color: var(--c-grey);
  }
  .hist-cico[data-status="pending"] {
    color: var(--accent);
  }
  .hist-cico[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-cico[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin: 10px -2px 0;
    max-height: 360px;
    overflow-y: auto;
    /* room for each card's raised-edge shadow (overflow-y:auto also clips x) */
    padding: 2px;
  }
  /* Each annotation is a raised card with a status-colored left rail. */
  .hist-card {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    display: grid;
    row-gap: 5px;
    width: 100%;
    padding: 8px 11px 9px 12px;
    border-radius: 10px;
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-left: 3px solid var(--c-grey);
    transition:
      background 0.12s ease,
      transform 0.08s ease;
  }
  .hist-card[data-status="pending"] {
    border-left-color: var(--accent);
  }
  .hist-card[data-status="acknowledged"] {
    border-left-color: var(--c-amber);
  }
  .hist-card[data-status="resolved"] {
    border-left-color: var(--c-green);
  }
  /* "Won't do" reads as the quietest state. */
  .hist-card[data-status="dismissed"] {
    opacity: 0.72;
  }
  .hist-card:hover {
    background: color-mix(in srgb, var(--text) 4%, var(--raised));
    opacity: 1;
  }
  .hist-card:active {
    transform: scale(0.99);
  }
  /* Header line: status marker + word, with the age pushed to the right edge. */
  .hist-top {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .hist-ico {
    width: 13px;
    height: 13px;
    flex: none;
    color: var(--c-grey);
  }
  .hist-ico svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hist-ico[data-status="pending"] {
    color: var(--accent);
  }
  .hist-ico[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-ico[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-label {
    font-size: 10.5px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--c-grey);
  }
  .hist-label[data-status="pending"] {
    color: var(--accent);
  }
  .hist-label[data-status="acknowledged"] {
    color: var(--c-amber);
  }
  .hist-label[data-status="resolved"] {
    color: var(--c-green);
  }
  .hist-time {
    margin-left: auto;
    flex: none;
    font-size: 10.5px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  .hist-comment {
    font-size: 13px;
    font-weight: 300;
    line-height: 1.4;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hist-empty {
    color: var(--text-mut);
    font-style: italic;
  }
  .hist-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .hist-page {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10px;
    color: var(--text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1;
  }
  .hist-replies {
    flex: none;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10.5px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  .hist-replies svg {
    display: block;
    width: 12px;
    height: 12px;
  }
  .hist-none {
    padding: 18px 8px 20px;
    text-align: center;
    font-size: 13px;
    font-weight: 300;
    color: var(--text-mut);
  }
`;
