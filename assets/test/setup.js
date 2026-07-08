// Registers a global DOM (document, window, NodeIterator, customElements, …) so the
// widget's browser code can run under `bun test`. happy-dom is a pure-JS DOM — no
// browser binary. Loaded via bunfig.toml [test] preload.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
