// Annotai widget entry point. Bundled by bun into ../priv/static/app.js (committed),
// so consumers of the Annotai package run no build.
import "./widget.js";

// The injected <script> can appear more than once (e.g. layout re-renders, hot
// reload); the guard keeps a single widget instance mounted at the body root.
if (!window.__annotaiLoaded) {
  window.__annotaiLoaded = true;
  document.body.appendChild(document.createElement("annotai-widget"));
}
