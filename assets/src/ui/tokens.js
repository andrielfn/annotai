import { css } from "lit";

// Design tokens shared across every region: theme/accent custom properties +
// base resets. Lives on its own because it's cross-cutting — every other ui
// module's styles read these vars.
export const tokens = css`
  :host {
    --c-indigo: #6155f5;
    --c-green: #34c759;
    --c-amber: #ff8d28;
    --c-red: #ff383c;
    --c-grey: #888;
    /* accent palette — single source of truth: both the swatches (ui/settings.js) and the
       selectors below read these, so a color is defined exactly once. */
    --accent-blue: #0088ff;
    --accent-indigo: #6155f5;
    --accent-cyan: #00c3d0;
    --accent-green: #34c759;
    --accent-yellow: #ffcc00;
    --accent-orange: #ff8d28;
    --accent-red: #ff383c;
    --accent: var(--accent-blue);
    --on-accent: #fff; /* default = blue */
    /* Surface elevation: panels sit at --surface, content blocks step up to --raised (a
       gentle oklch step lighter in dark), inputs/code recess to --field. Kept deliberately
       subtle so raised blocks read as grouped, not floating. */
    --surface-step: 0.045;
    --surface: #1c1c1e;
    --raised: oklch(from var(--surface) calc(l + var(--surface-step)) c h);
    --field: #141416;
    --text: rgba(255, 255, 255, 0.9);
    --text-soft: rgba(255, 255, 255, 0.6);
    --text-mut: rgba(255, 255, 255, 0.45);
    --hover: rgba(255, 255, 255, 0.12);
    --line: rgba(255, 255, 255, 0.12);
    --surface-edge:
      inset 0 1px 0 0 rgba(255, 255, 255, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.3);
    /* One hairline + one soft shadow: enough to lift a block off the panel without popping. */
    --raised-edge: inset 0 0 0 1px rgba(255, 255, 255, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.28);
    --well-edge: inset 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 2px rgba(0, 0, 0, 0.3);
  }
  /* selected accent + legible foreground (dark fg for light accents) */
  :host([data-annotai-accent="indigo"]) {
    --accent: var(--accent-indigo);
    --on-accent: #fff;
  }
  :host([data-annotai-accent="blue"]) {
    --accent: var(--accent-blue);
    --on-accent: #fff;
  }
  :host([data-annotai-accent="cyan"]) {
    --accent: var(--accent-cyan);
    --on-accent: #0c2027;
  }
  :host([data-annotai-accent="green"]) {
    --accent: var(--accent-green);
    --on-accent: #0c2415;
  }
  :host([data-annotai-accent="yellow"]) {
    --accent: var(--accent-yellow);
    --on-accent: #1a1a1a;
  }
  :host([data-annotai-accent="orange"]) {
    --accent: var(--accent-orange);
    --on-accent: #1a1a1a;
  }
  :host([data-annotai-accent="red"]) {
    --accent: var(--accent-red);
    --on-accent: #fff;
  }
  :host([data-annotai-theme="light"]) {
    /* Light stays flat (white ceiling): --field must stay below --raised so wells read sunken. */
    --surface: #fff;
    --raised: #fafafb;
    --field: #f0f0f2;
    --text: rgba(0, 0, 0, 0.85);
    --text-soft: rgba(0, 0, 0, 0.55);
    --text-mut: rgba(0, 0, 0, 0.4);
    --hover: rgba(0, 0, 0, 0.06);
    --line: rgba(0, 0, 0, 0.1);
    --surface-edge: 0 0 0 1px rgba(0, 0, 0, 0.07);
    --raised-edge: 0 0 0 1px rgba(0, 0, 0, 0.05);
    --well-edge: inset 0 0 0 1px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  * {
    box-sizing: border-box;
    font-family:
      system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      sans-serif;
  }
  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;
