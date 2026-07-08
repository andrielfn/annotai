import { css, html } from "lit";
import { repeat } from "lit/directives/repeat.js";

// The numbered-markers layer: one colored pin per visible annotation, positioned
// in viewport coords. `markers` is the precomputed list ([{ ann, n, vp }]); the
// widget owns the geometry so this stays a pure view. onEdit(ann) opens the marker.
//
// `.add-pin` (the transient compose pin) is styled here too because it shares the
// base pin rule with `.marker`; its trivial markup stays inline in widget.render().
export const markersTemplate = ({ markers, onEdit }) =>
  html`<div class="markers">
    ${repeat(
      markers,
      (m) => m.ann.id,
      (m) =>
        html`<div
          class="marker"
          data-status=${m.ann.status || "pending"}
          style="left:${m.vp.x}px;top:${m.vp.y}px"
          @click=${(e) => {
            e.stopPropagation();
            onEdit(m.ann);
          }}
        >
          ${m.n}
        </div>`,
    )}
  </div>`;

export const styles = css`
  .markers {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 99998;
  }
  .marker,
  .add-pin {
    position: fixed;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.25),
      inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  }
  .marker {
    pointer-events: auto;
    cursor: pointer;
    font: 600 11px system-ui;
    z-index: 99998;
    transition:
      background 0.3s ease,
      transform 0.12s ease;
    animation: mark 0.28s cubic-bezier(0.22, 1, 0.3, 1);
  }
  @keyframes mark {
    from {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .marker:hover {
    transform: translate(-50%, -50%) scale(1.12);
  }
  .marker[data-status="pending"] {
    background: var(--accent);
    color: var(--on-accent);
  }
  .marker[data-status="acknowledged"] {
    background: var(--c-amber);
  }
  .marker[data-status="resolved"] {
    background: var(--c-green);
  }
  .marker[data-status="dismissed"] {
    background: var(--c-grey);
    opacity: 0.55;
  }
  .add-pin {
    z-index: 100000;
    background: var(--accent);
    color: var(--on-accent);
    pointer-events: none;
    animation: pinpop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .add-pin svg {
    width: 16px;
    height: 16px;
  }
  @keyframes pinpop {
    from {
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;
