// Pure annotation helpers — no DOM, no Lit, so they're cheap to unit-test.

// Terminal (a.k.a. "done") statuses: the agent has finished with these.
export const TERMINAL_STATUSES = ["resolved", "dismissed"];

// Humanize a millisecond duration into a compact "3m ago" label. Shared by the
// settings panel's agent "last seen" and the history panel's per-annotation age.
export function relativeTime(ms) {
  if (ms == null) return null;
  // Floor, not round: rounding overshoots a bucket's own boundary (e.g. 59.5min
  // → "60m ago" instead of rolling to "1h"). Floor reads as "at least N ago".
  if (ms < 5_000) return "just now";
  if (ms < 60_000) return `${Math.floor(ms / 1_000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

const isTerminal = (a) => TERMINAL_STATUSES.includes(a.status);

/**
 * The annotations the widget should draw on the page.
 *
 * By default (matching agentation) resolved/dismissed annotations are hidden so
 * the page only shows outstanding work. `showResolved` reveals them — the marker
 * colors then distinguish status. The full list always lives client-side; this
 * is purely a view filter, so toggling is instant with no refetch.
 */
export function visibleAnnotations(annotations, showResolved) {
  if (showResolved) return annotations;
  return annotations.filter((a) => !isTerminal(a));
}
