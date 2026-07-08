import { css, html } from "lit";
import * as icons from "../icons.js";
import { relativeTime } from "../annotations.js";

// Each id maps to a --accent-<id> custom property defined once in ui/tokens.js.
export const ACCENTS = ["blue", "indigo", "cyan", "green", "yellow", "orange", "red"];

const SHOW_RESOLVED_TIP =
  "Also show annotations the agent resolved or dismissed. Hidden by default so the page only shows open feedback.";

const SHOW_ALL_PAGES_TIP =
  "Show markers from every page, not just the current one. Off by default so a marker only appears where its element lives.";

// The MCP status shows "milliseconds ago" as a compact relative label.
const formatSeen = relativeTime;

// One labeled on/off switch row (label + help tooltip + toggle). Both settings
// toggles share this; clicking the label or the switch toggles, hovering the help
// icon shows the tip.
const switchRow = ({ label, tip, ariaLabel, on, onToggle, onTip, onUntip }) =>
  html`<div class="set-row">
    <span class="set-row-left">
      <span class="set-row-label" @click=${onToggle}>${label}</span>
      <button class="help" aria-label="What is this?" @mouseenter=${(e) => onTip(e, tip)} @mouseleave=${onUntip}>
        ${icons.help}
      </button>
    </span>
    <button
      class="switch"
      role="switch"
      aria-label=${ariaLabel}
      aria-checked=${on ? "true" : "false"}
      ?data-on=${on}
      @click=${onToggle}
    >
      <span class="knob"></span>
    </button>
  </div>`;

// The settings panel: theme toggle, accent swatches, the Show-resolved switch,
// and MCP agent status + registration command. A pure view of widget settings
// state; all behavior arrives as handlers.
export const settingsTemplate = ({
  theme,
  accent,
  version,
  showResolved,
  showAllPages,
  connected,
  lastSeenMsAgo,
  copied,
  regCommand,
  onToggleTheme,
  onSetAccent,
  onToggleShowResolved,
  onToggleShowAllPages,
  onTip,
  onUntip,
  onCopy,
}) =>
  html`<div class="settings">
    <div class="set-head">
      <span class="set-brand">${icons.wordmark}</span>
      <span class="set-head-right">
        ${version ? html`<span class="set-version">v${version}</span>` : ""}
        <button class="ctrl sm theme-toggle" aria-label="Toggle theme" @click=${onToggleTheme}>
          ${theme === "light" ? icons.sun : icons.moon}
        </button>
      </span>
    </div>

    <div class="set-divider"></div>

    <div class="set-label">Accent color</div>
    <div class="swatches">
      ${ACCENTS.map(
        (id) =>
          html`<button
            class="swatch"
            ?data-selected=${accent === id}
            style="--sw:var(--accent-${id})"
            aria-label=${id}
            @click=${() => onSetAccent(id)}
          ></button>`,
      )}
    </div>

    <div class="set-divider"></div>

    ${switchRow({
      label: "Show resolved",
      tip: SHOW_RESOLVED_TIP,
      ariaLabel: "Show resolved annotations",
      on: showResolved,
      onToggle: onToggleShowResolved,
      onTip,
      onUntip,
    })}
    ${switchRow({
      label: "Show all pages",
      tip: SHOW_ALL_PAGES_TIP,
      ariaLabel: "Show markers from all pages",
      on: showAllPages,
      onToggle: onToggleShowAllPages,
      onTip,
      onUntip,
    })}

    <div class="set-divider"></div>

    <div class="set-mcp">
      <span class="status-dot" ?data-on=${connected}></span>
      <span class="set-mcp-text">
        ${connected
          ? html`<span class="set-mcp-label">Agent active</span>${formatSeen(lastSeenMsAgo)
                ? html`<span class="set-mcp-sep">·</span><span class="set-mcp-ago">${formatSeen(lastSeenMsAgo)}</span>`
                : ""}`
          : html`<span class="set-mcp-label">MCP ready</span><span class="set-mcp-sep">·</span
              ><span class="set-mcp-ago">waiting for agent</span>`}
      </span>
    </div>
    <div class="reg">
      <code>${regCommand}</code>
      <button class="copy" aria-label="Copy" @click=${onCopy}>${copied ? icons.check : icons.copy}</button>
    </div>
  </div>`;

export const styles = css`
  .settings {
    position: fixed;
    bottom: 74px;
    right: 20px;
    z-index: 100001;
    width: 258px;
    background: var(--surface);
    color: var(--text);
    border-radius: 14px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 14px 14px;
    font-weight: 500;
    transform-origin: bottom right;
    animation: pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .set-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .set-brand {
    display: flex;
    align-items: center;
  }
  .set-brand svg {
    height: 15px;
    width: auto;
    display: block;
  }
  .set-head-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
  }
  .set-version {
    font-size: 11px;
    color: var(--text-mut);
    font-variant-numeric: tabular-nums;
  }
  /* Keep the 28px tap target but stop it from inflating the header: the negative
     vertical margin lets the button overflow the row instead of setting its
     height, and the negative right margin pulls its icon flush to the edge so the
     button's padding doesn't inset it from the popover wall. */
  .theme-toggle {
    margin: -7px -6px -7px 0;
  }
  .theme-toggle svg {
    width: 15px;
    height: 15px;
  }
  .set-label {
    font-size: 13px;
    font-weight: 400;
    color: var(--text);
    margin: 10px 0 6px;
  }
  .swatches {
    display: flex;
    gap: 9px;
    margin-bottom: 4px;
  }
  .swatch {
    all: unset;
    cursor: pointer;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--sw);
    transition:
      box-shadow 0.15s ease,
      transform 0.1s ease;
  }
  .swatch:hover {
    transform: scale(1.08);
  }
  /* Selected = inner ring (gap + smaller center) so the footprint stays 18px — no outward growth. */
  .swatch[data-selected] {
    box-shadow:
      inset 0 0 0 2px var(--sw),
      inset 0 0 0 4px var(--surface);
  }
  .set-divider {
    height: 1px;
    background: color-mix(in srgb, var(--line) 55%, transparent);
    margin: 12px 0;
  }
  .set-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .set-row + .set-row {
    margin-top: 10px;
  }
  .set-row-left {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }
  .set-row-label {
    font-size: 13px;
    font-weight: 400;
    color: var(--text);
    cursor: pointer;
    user-select: none;
  }
  .help {
    all: unset;
    cursor: help;
    display: flex;
    align-items: center;
    color: var(--text-mut);
    border-radius: 50%;
    transition: color 0.15s ease;
  }
  .help:hover {
    color: var(--text-soft);
  }
  .help svg {
    width: 13px;
    height: 13px;
  }
  .switch {
    all: unset;
    cursor: pointer;
    box-sizing: border-box;
    width: 23px;
    height: 15px;
    border-radius: 8px;
    background: var(--c-grey);
    padding: 2px;
    transition: background-color 0.15s ease;
    flex: none;
  }
  .switch .knob {
    display: block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.15s ease;
  }
  .switch[data-on] {
    background: var(--accent);
  }
  .switch[data-on] .knob {
    transform: translateX(8px);
  }
  .set-mcp {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 400;
    line-height: 1;
    color: var(--text-soft);
    margin-bottom: 8px;
  }
  .set-mcp-text {
    display: inline-flex;
    align-items: baseline;
  }
  .set-mcp-sep {
    margin: 0 5px;
    opacity: 0.5;
  }
  .set-mcp-ago {
    font-size: 11px;
    opacity: 0.65;
  }
  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c-grey);
    flex: none;
    /* Optical centering: flex centers the dot on the cap-height, but mixed-case
       text reads as centered nearer the x-height, so nudge the dot down ~0.75px. */
    transform: translateY(0.75px);
  }
  .status-dot[data-on] {
    background: var(--c-green);
  }
  .reg {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-radius: 8px;
    padding: 6px 8px;
  }
  .reg code {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .copy {
    all: unset;
    cursor: pointer;
    color: var(--text-mut);
    display: flex;
    padding: 3px;
    border-radius: 6px;
  }
  .copy:hover {
    background: var(--hover);
    color: var(--text);
  }
  .copy svg {
    width: 15px;
    height: 15px;
  }
`;
