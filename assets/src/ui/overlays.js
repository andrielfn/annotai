import { css } from "lit";

// Transient, fixed-position overlay layers painted over the page during
// interaction: `.hl` (hover highlight in select mode), `.cursor-tip` (the
// element-name label that trails the cursor) and `.bar-tip` (toolbar button
// tooltip). Their markup is trivial and tied to per-frame state, so it stays
// inline in widget.render(); only the styles live here.
export const styles = css`
  .hl {
    position: fixed;
    z-index: 99997;
    pointer-events: none;
    border: 2px solid color-mix(in srgb, var(--accent) 55%, transparent);
    background: color-mix(in srgb, var(--accent) 6%, transparent);
    border-radius: 4px;
    transition: all 0.07s ease;
  }
  .cursor-tip {
    position: fixed;
    z-index: 100002;
    pointer-events: none;
    background: var(--surface);
    color: var(--text);
    font: 500 12px system-ui;
    padding: 4px 8px;
    border-radius: 6px;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.3),
      var(--surface-edge);
    white-space: nowrap;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-tip {
    position: fixed;
    z-index: 100002;
    transform: translate(-50%, -100%);
    pointer-events: none;
    background: var(--surface);
    color: var(--text);
    font: 400 12px system-ui;
    padding: 5px 9px;
    border-radius: 7px;
    box-shadow:
      0 2px 10px rgba(0, 0, 0, 0.3),
      var(--surface-edge);
    max-width: 210px;
    text-align: center;
    line-height: 1.35;
  }
`;
