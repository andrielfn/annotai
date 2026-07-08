import { css, html } from "lit";
import * as icons from "../icons.js";

// The floating toolbar: logo (with pending-count badge) + the open controls
// (settings, clear, close). A pure view of the open/settings state; behavior and
// the tooltip text come in as handlers. `.bar-tip` (the button tooltip) is styled
// in markers.js since its div is rendered body-level alongside the other overlays.
export const toolbarTemplate = ({
  open,
  settingsOpen,
  historyOpen,
  count,
  showBadge,
  onToggleOpen,
  onToggleSettings,
  onToggleHistory,
  onClearAll,
  onClose,
  onTip,
  onUntip,
}) =>
  html`<div class="bar" ?data-open=${open}>
    ${open
      ? // Open: the logo is just branding — inert, no highlight. Closing is the X.
        html`<span class="logo brand" aria-hidden="true">${icons.marker}</span>`
      : // Closed: the logo is the trigger that opens the bar.
        html`<button class="logo" aria-label="Open Annotai" @click=${onToggleOpen}>
          ${icons.marker}${showBadge ? html`<span class="badge">${count}</span>` : null}
        </button>`}
    <div class="controls">
      <button
        class="ctrl"
        aria-label="Annotations"
        ?data-on=${historyOpen}
        @click=${onToggleHistory}
        @mouseenter=${(e) => onTip(e, "Annotations")}
        @mouseleave=${onUntip}
      >
        ${icons.history}
      </button>
      <button
        class="ctrl"
        aria-label="Settings"
        ?data-on=${settingsOpen}
        @click=${onToggleSettings}
        @mouseenter=${(e) => onTip(e, "Settings")}
        @mouseleave=${onUntip}
      >
        ${icons.gear}
      </button>
      <button
        class="ctrl"
        aria-label="Clear all annotations"
        @click=${onClearAll}
        @mouseenter=${(e) => onTip(e, "Clear all annotations")}
        @mouseleave=${onUntip}
      >
        ${icons.trash}
      </button>
      <span class="sep"></span>
      <button
        class="ctrl"
        aria-label="Close"
        @click=${onClose}
        @mouseenter=${(e) => onTip(e, "Close (Esc)")}
        @mouseleave=${onUntip}
      >
        ${icons.close}
      </button>
    </div>
  </div>`;

export const styles = css`
  .bar {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100000;
    display: flex;
    align-items: center;
    gap: 0;
    padding: 6px;
    background: var(--surface);
    color: var(--text);
    border-radius: 24px;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 4px 16px rgba(0, 0, 0, 0.1),
      var(--surface-edge);
  }
  .bar[data-open] {
    gap: 6px;
  }
  .bar:not([data-open]) {
    padding: 0;
  }
  .logo {
    all: unset;
    cursor: pointer;
    position: relative;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text);
    transition: background 0.15s ease;
  }
  .logo svg {
    width: 20px;
    height: 20px;
  }
  .bar:not([data-open]) .logo {
    width: 44px;
    height: 44px;
  }
  .bar:not([data-open]) .logo:hover {
    background: var(--hover);
  }
  /* Open: pure branding — no highlight, not interactive. */
  .logo.brand {
    cursor: default;
  }
  .badge {
    position: absolute;
    top: -3px;
    right: -4px;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 9px;
    background: var(--accent);
    color: var(--on-accent);
    font: 600 10px system-ui;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 6px;
    max-width: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      max-width 0.32s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.32s ease;
  }
  .bar[data-open] .controls {
    max-width: 200px;
    opacity: 1;
  }
  .ctrl {
    all: unset;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-soft);
    transition:
      background 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease;
  }
  .ctrl:hover {
    background: var(--hover);
    color: var(--text);
  }
  .ctrl:active {
    transform: scale(0.92);
  }
  .ctrl[data-on] {
    background: var(--accent);
    color: var(--on-accent);
  }
  .ctrl.sm {
    width: 28px;
    height: 28px;
  }
  .sep {
    width: 1px;
    height: 18px;
    background: var(--line);
    flex: none;
  }
`;
