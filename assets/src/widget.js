import { LitElement, html } from "lit";
import * as api from "./api.js";
import { context, locate, isIdAnchored, elementName, pagePath } from "./dom.js";
import { visibleAnnotations } from "./annotations.js";
import { imageBlobs, prepareImage, splitDataUrl, uid, MAX_IMAGES } from "./images.js";
import * as icons from "./icons.js";
import { tokens } from "./ui/tokens.js";
import { toolbarTemplate, styles as toolbarStyles } from "./ui/toolbar.js";
import { popupTemplate, styles as popupStyles } from "./ui/popup.js";
import { settingsTemplate, styles as settingsStyles } from "./ui/settings.js";
import { historyTemplate, styles as historyStyles } from "./ui/history.js";
import { markersTemplate, styles as markersStyles } from "./ui/markers.js";
import { styles as overlaysStyles } from "./ui/overlays.js";

const THEME_KEY = "annotai-theme";
const ACCENT_KEY = "annotai-accent";
const SHOW_RESOLVED_KEY = "annotai-show-resolved";
const SHOW_ALL_PAGES_KEY = "annotai-show-all-pages";
// A full page reload (notably Phoenix live_reload firing when the agent edits code
// mid-compose) re-mounts the widget from scratch. We mirror the active compose draft
// to sessionStorage so a reload doesn't discard what you were typing. sessionStorage is
// the right lifetime: it survives a reload but is per-tab and clears on tab close.
const DRAFT_KEY = "annotai-draft";
// When a history row on another page is clicked, we can't open its popup here —
// we navigate to its page first and stash the target id so the freshly-mounted
// widget can open it once its annotations load. Same per-tab lifetime as DRAFT_KEY.
const FOCUS_KEY = "annotai-focus";
// A cross-page focus is abandoned if its target never becomes locatable within this
// window (e.g. a redirect changed the path). Bounds the retry so a stale pending id
// can't spring the popup open on some later, unrelated navigation.
const FOCUS_TTL_MS = 10_000;
const POLL_MS = 2000; // annotation refresh + (when open) status interval
const SELECT_CLICK_GRACE_MS = 400; // swallow the click the browser fires after a text selection

// Pointer/focus interactions with our own UI that must be hidden from the host app
// (see `_shield`). `click` is special-cased there; the rest are stopped outright.
const SHIELDED_EVENTS = ["pointerdown", "mousedown", "mouseup", "click", "focusin"];

// Identity of the current page for draft scoping. Includes the query string and hash so
// a draft made on `/search?q=cats` isn't resurrected on `/search?q=dogs` — a reload keeps
// the full URL identical, which is the only case we want to restore into.
const pageKey = () => location.pathname + location.search + location.hash;

// Force the crosshair while selecting. `cursor` resolves per element, so a value on
// <html> loses to each hovered element's own cursor (text, pointer, …) — even with
// `!important`, which only wins for <html> itself. We need a rule that matches *every*
// element; a class toggles it. Shadow-DOM UI keeps its own cursors (no inheritance
// across the boundary); the host element is excluded so its chrome stays crosshair-free.
const SELECTING_CLASS = "annotai-selecting";
function ensureSelectingStyle() {
  if (document.getElementById(SELECTING_CLASS)) return;
  const style = Object.assign(document.createElement("style"), {
    id: SELECTING_CLASS,
    textContent: `html.${SELECTING_CLASS} *:not(annotai-widget) { cursor: crosshair !important }`,
  });
  document.head.appendChild(style);
}

/**
 * The Annotai annotation widget. A single custom element mounted at the body root
 * inside a Shadow DOM (so host styles never leak in). It owns:
 *   - a floating toolbar (open/close, settings, clear)
 *   - "select mode" where hovering highlights elements and a click opens a compose popup
 *   - on-page numbered markers for stored annotations, colored by status
 *   - a settings panel (theme, accent, MCP registration + agent status)
 * Annotations are persisted via the REST API in api.js and polled every POLL_MS.
 */
export class AnnotaiWidget extends LitElement {
  static properties = {
    theme: { reflect: true, attribute: "data-annotai-theme" },
    accent: { reflect: true, attribute: "data-annotai-accent" },
    open: { state: true },
    settingsOpen: { state: true },
    historyOpen: { state: true },
    historyFilter: { state: true }, // statuses the history list is filtered to (empty = all)
    revealId: { state: true }, // id of an annotation whose marker is force-shown (a list jump to a hidden one)
    showResolved: { state: true },
    showAllPages: { state: true },
    connected: { state: true },
    lastSeenMsAgo: { state: true },
    copied: { state: true },
    annotations: { state: true },
    compose: { state: true }, // {mode:'new'|'edit', id?, point:{x,y}(doc), info}
    comment: { state: true },
    attachments: { state: true }, // [{id, mime, dataUrl, width, height}] — pasted/dropped into a new annotation
    dragging: { state: true }, // an image is being dragged over the compose popup
    replyText: { state: true },
    detailsOpen: { state: true },
    hoverRect: { state: true },
    cursorTip: { state: true }, // {x,y,label}
    barTip: { state: true }, // {x,y,label} — toolbar button tooltip
  };

  constructor() {
    super();
    this.theme = localStorage.getItem(THEME_KEY) || "dark";
    this.accent = localStorage.getItem(ACCENT_KEY) || "blue";
    // The injected <script> carries the package version and any configured
    // placement (corner + edge insets) as data attributes.
    const script = document.querySelector("script[data-annotai-version]");
    this.version = script?.dataset.annotaiVersion || null;
    this._corner = script?.dataset.annotaiCorner || null; // e.g. "bottom-right"; null = default placement
    this._insetH = script?.dataset.annotaiInsetH || null; // horizontal edge inset, e.g. "220px"
    this._insetV = script?.dataset.annotaiInsetV || null; // vertical edge inset, e.g. "20px"
    this.open = false;
    this.settingsOpen = false;
    this.historyOpen = false;
    this.historyFilter = [];
    this.revealId = null;
    this.showResolved = localStorage.getItem(SHOW_RESOLVED_KEY) === "1";
    this.showAllPages = localStorage.getItem(SHOW_ALL_PAGES_KEY) === "1";
    this.connected = false;
    this.lastSeenMsAgo = null;
    this.copied = false;
    this.annotations = [];
    this.compose = null;
    this.comment = "";
    this.attachments = [];
    this.dragging = false;
    this._dragDepth = 0;
    this.replyText = "";
    this.detailsOpen = false;
    this.hoverRect = null;
    this.cursorTip = null;
    this.barTip = null;
    this._raf = false;
    this._move = null;
    this._skipNextClick = false;
    this._refreshing = false;
    this._threadKey = null;
    this._onClick = this._onClick.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onKey = this._onKey.bind(this);
    this._shield = this._shield.bind(this);
    // Scroll/resize only move marker positions, which only matter while markers are
    // drawn (widget open) — re-rendering a closed widget would re-run the locate
    // sweep for nothing.
    this._onViewportChange = () => {
      if (this.open) this.requestUpdate();
    };
    // Navigation can change which markers belong here (and the badge count even when
    // closed). `phx:page-loading-stop` fires after *every* LiveView event, not just
    // navigation, so gate on an actual pathname change to avoid a re-render storm.
    this._lastPath = location.pathname;
    this._onNavigate = () => {
      if (location.pathname !== this._lastPath) {
        this._lastPath = location.pathname;
        this.requestUpdate();
      }
    };
    this._draftStored = false;
    this._submitting = false; // suppress draft persistence while a create/reply request is in flight
    this._openedByRestore = false; // the widget was force-opened purely to restore a draft
    // Rehydrate an in-progress compose popup left behind by a page reload. Done here,
    // alongside the other defaults, so the first render already shows the restored popup.
    this._restoreDraft();
    // A pending "jump to this annotation" left by a cross-page history click. Consumed
    // once the first poll confirms the annotation is present on this page (_refresh).
    try {
      this._pendingFocusId = sessionStorage.getItem(FOCUS_KEY);
      sessionStorage.removeItem(FOCUS_KEY);
    } catch (_) {
      this._pendingFocusId = null;
    }
    this._pendingFocusAt = Date.now(); // start the FOCUS_TTL_MS clock for the pending jump
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyPlacement();
    ensureSelectingStyle();
    document.addEventListener("click", this._onClick, true);
    document.addEventListener("mousemove", this._onMove, true);
    document.addEventListener("mouseup", this._onUp, true);
    document.addEventListener("keydown", this._onKey, true);
    window.addEventListener("scroll", this._onViewportChange, true);
    window.addEventListener("resize", this._onViewportChange);
    // Re-evaluate the page gate when the URL changes without a full reload. popstate
    // covers back/forward; LiveView fires page-loading-stop after every patch (the
    // handler self-filters to real pathname changes). The poll is the backstop.
    window.addEventListener("popstate", this._onNavigate);
    window.addEventListener("phx:page-loading-stop", this._onNavigate);
    // Interactions with our own UI must never reach the host app's listeners. Host
    // components that close on an outside click/press (modals, dropdowns, popovers)
    // otherwise see a click on our toolbar/popup — retargeted to <annotai-widget>,
    // outside themselves — and close, right as you try to annotate them. We shield on
    // `window` in the CAPTURE phase: window is the first node in every event's path, so
    // stopping here pre-empts host detectors in either phase, including the common case
    // of a capture-phase `document` listener (e.g. Fluxon dropdowns) that a bubble-phase
    // shield on our host element could never reach. See `_shield` for how our own
    // handlers still run despite the event never descending past window.
    for (const type of SHIELDED_EVENTS) window.addEventListener(type, this._shield, true);
    // A modal that traps interaction (Fluxon `<.modal>`, most `<dialog>` polyfills) marks
    // every sibling of the dialog `inert` so the background can't be clicked, hovered, or
    // focused. Our widget is a body-level sibling, so it gets inerted too — and then you
    // can't annotate the modal that's on screen. We're dev-only tooling that must stay live
    // on top of any host overlay, so we strip `inert` off ourselves the instant it lands.
    this._keepInteractive = new MutationObserver(() => {
      if (this.hasAttribute("inert")) this.removeAttribute("inert");
    });
    this._keepInteractive.observe(this, { attributes: true, attributeFilter: ["inert"] });
    if (this.hasAttribute("inert")) this.removeAttribute("inert"); // mounted while a modal was already open
    this._pollTimer = setInterval(() => {
      this._refresh();
      if (this.settingsOpen) this._pollStatus();
    }, POLL_MS);
    this._refresh();
  }
  // Server-configured corner placement (config :annotai, position:). With no config
  // the widget keeps the default bottom-right insets from tokens.js. Otherwise we pin
  // the two active edges (the other two go `auto`) and stamp data-annotai-corner, which
  // the toolbar reads for its insets and the panels read to flip their open direction.
  _applyPlacement() {
    if (!this._corner) return;
    const [vSide, hSide] = this._corner.split("-"); // "bottom-right" -> ["bottom", "right"]
    for (const edge of ["top", "right", "bottom", "left"]) {
      this.style.setProperty(`--annotai-inset-${edge}`, "auto");
    }
    this.style.setProperty(`--annotai-inset-${hSide}`, this._insetH);
    this.style.setProperty(`--annotai-inset-${vSide}`, this._insetV);
    this.setAttribute("data-annotai-corner", this._corner);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("click", this._onClick, true);
    document.removeEventListener("mousemove", this._onMove, true);
    document.removeEventListener("mouseup", this._onUp, true);
    document.removeEventListener("keydown", this._onKey, true);
    window.removeEventListener("scroll", this._onViewportChange, true);
    window.removeEventListener("resize", this._onViewportChange);
    window.removeEventListener("popstate", this._onNavigate);
    window.removeEventListener("phx:page-loading-stop", this._onNavigate);
    for (const type of SHIELDED_EVENTS) window.removeEventListener(type, this._shield, true);
    this._keepInteractive?.disconnect();
    clearInterval(this._pollTimer);
    document.documentElement.classList.remove(SELECTING_CLASS);
  }

  // selector mode = open and not composing, in settings, or viewing history
  get selecting() {
    return this.open && !this.compose && !this.settingsOpen && !this.historyOpen;
  }

  // A restored draft opens a compose popup on first render; put the cursor where the
  // user left it so they can keep typing without a click.
  firstUpdated() {
    if (this.compose) this._focusInput();
  }

  updated() {
    document.documentElement.classList.toggle(SELECTING_CLASS, this.selecting);
    if (!this.selecting) {
      if (this.hoverRect) this.hoverRect = null;
      if (this.cursorTip) this.cursorTip = null;
    }
    // Drop a temporary marker reveal once its popup is no longer the open edit — covers
    // the paths that clear compose without going through _dismiss (delete, close, reopen).
    if (this.revealId && this.compose?.id !== this.revealId) this.revealId = null;
    this._autoScrollThread();
    this._persistDraft();
  }

  // ---- draft persistence (survive a page reload while composing) ----
  // updated() runs after every reactive change, so the latest keystroke is always
  // saved — no beforeunload needed. The `_draftStored` flag avoids a needless
  // removeItem on every non-compose re-render (e.g. hover frames).
  _persistDraft() {
    // While a submit/reply is in flight the draft must NOT be stored: a reload in that
    // window would restore a fully re-submittable popup and duplicate the annotation/reply.
    if (this.compose && !this._submitting) {
      this._writeDraft({
        path: pageKey(),
        compose: this.compose,
        comment: this.comment,
        replyText: this.replyText,
        detailsOpen: this.detailsOpen,
        attachments: this.attachments,
      });
      this._draftStored = true;
    } else if (this._draftStored) {
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch (_) {}
      this._draftStored = false;
    }
  }

  // A draft with large pasted screenshots can exceed the sessionStorage quota. Retry
  // without attachments so the typed text — the thing that's actually hard to recreate —
  // is never what we drop.
  _writeDraft(draft) {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, attachments: [] }));
      } catch (_) {}
    }
  }

  // Restore a compose draft after a reload. Only on the same path it was made on — a
  // reload keeps the URL, but we don't want to resurrect a draft after navigating away.
  // An edit draft whose annotation is since gone is handled by the _refresh() guard.
  _restoreDraft() {
    let draft;
    try {
      draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null");
    } catch (_) {
      return;
    }
    if (!draft || !draft.compose || draft.path !== pageKey()) return;
    this.open = true;
    this.compose = draft.compose;
    this.comment = draft.comment || "";
    this.replyText = draft.replyText || "";
    this.detailsOpen = !!draft.detailsOpen;
    this.attachments = Array.isArray(draft.attachments) ? draft.attachments : [];
    this._draftStored = true;
    this._openedByRestore = true; // we opened the widget for the user; the first _refresh may undo this
  }

  // Refresh the annotation list, guarded so overlapping polls can't restore a stale
  // list (e.g. re-showing something just deleted) and a transient error keeps the last good one.
  async _refresh() {
    if (this._refreshing) return;
    this._refreshing = true;
    try {
      this.annotations = await api.list();
      // If an open edit popup's annotation was deleted/cleared out from under it,
      // close it rather than render a reply box against a gone annotation.
      if (this.compose?.mode === "edit" && !this.annotations.some((a) => a.id === this.compose.id)) {
        this.compose = null;
        this.comment = "";
        this.replyText = "";
        // A restored edit draft whose target annotation no longer exists (e.g. the server
        // restarted and lost its ETS state): don't strand the widget open on an empty
        // selector — the user didn't open it this session.
        if (this._openedByRestore) this.open = false;
      }
      // One-shot: only the first successful load after a restore may auto-close. Once the
      // draft's annotation is confirmed present, a later deletion (while the user is
      // legitimately editing) must not close the widget out from under them.
      this._openedByRestore = false;
      // A cross-page history jump asked us to focus an annotation on arrival. Wait until
      // it's actually loaded and locatable here (LiveView may still be mounting), then
      // open its popup. Left pending across polls so a slow mount still resolves — but
      // give up once the user is already composing (never hijack their popup) or the
      // TTL lapses (target never showed up), so it can't fire on a later navigation.
      // Precedence is intentional: if a same-page draft was restored on this mount, its
      // popup wins and the jump is dropped — we never clobber an unsaved draft, and the
      // rare overlap (draft saved on this page, then a cross-jump back to it) isn't worth
      // resurrecting the jump seconds later after the user dismisses the draft.
      if (this._pendingFocusId) {
        const ann = this.annotations.find((a) => a.id === this._pendingFocusId);
        if (this.compose || Date.now() - this._pendingFocusAt > FOCUS_TTL_MS) {
          this._pendingFocusId = null;
        } else if (ann && this._markerVP(ann)) {
          this._pendingFocusId = null;
          this._focusAnnotation(ann);
        }
      }
    } catch (_) {
      /* keep last-known-good list */
    } finally {
      this._refreshing = false;
    }
  }

  // Scroll the conversation to the latest message on open and when a new message
  // arrives — but not on unrelated re-renders, so the user can scroll up freely.
  _autoScrollThread() {
    if (this.compose?.mode !== "edit") {
      this._threadKey = null;
      return;
    }
    const ann = this.annotations.find((a) => a.id === this.compose.id);
    const key = `${this.compose.id}:${ann?.thread?.length ?? 0}`;
    if (key === this._threadKey) return;
    this._threadKey = key;
    const el = this.renderRoot.querySelector(".thread");
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ---- global interaction shield ----
  // Runs on `window` in the capture phase, before the event can descend to any host
  // listener (see connectedCallback for the why). For interactions that land on our own
  // UI it stops all further propagation, so the page never sees them.
  //
  // Two host-closing channels have to be sealed:
  //
  // 1. Outside-click detectors. `stopImmediatePropagation` at window handles those, but it
  //    also stops the event reaching our own controls — and our toolbar/popup buttons are
  //    wired with Lit `@click`. A real click is `composed: true` (that's exactly why it
  //    escapes the shadow tree and reaches the host), so we swallow it and re-emit a
  //    `composed: false` clone on the true target: a non-composed event can't cross the
  //    shadow boundary, so our `@click` handlers fire while the click stays sealed inside —
  //    it never reaches `window`, so it can't re-enter this shield either.
  //
  // 2. Focus-out detectors. A host component can also close when focus LEAVES it (Fluxon
  //    `<.select>`, many dropdowns). Pressing our toolbar would pull focus off the host's
  //    trigger and trip that. So on the press we `preventDefault`, which cancels the focus
  //    shift and keeps the host's focus intact — but NOT when the press lands on one of our
  //    own text fields, which legitimately need the caret/focus to type an annotation.
  _shield(e) {
    const path = e.composedPath();
    if (!path.includes(this)) return; // a genuine host interaction — leave it alone
    e.stopImmediatePropagation();
    if (e.type === "pointerdown" || e.type === "mousedown") {
      // preventDefault on a control press keeps host focus (channel 2); text and inputs are
      // left alone so popup copy stays selectable. Matches our controls, button or not.
      if (path[0]?.closest?.("button, .hdr, .set-row-label, .marker")) e.preventDefault();
      return;
    }
    if (e.type !== "click") return;
    e.preventDefault();
    path[0].dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: false,
        view: window,
        detail: e.detail,
        button: e.button,
        clientX: e.clientX,
        clientY: e.clientY,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      }),
    );
  }

  // Capture-phase click handler. Branches by current mode: skip a swallowed
  // selection-click, keep the compose popup open (shake on outside click), close
  // settings on outside click, otherwise start a new annotation.
  //
  // Every branch that acts on a host click uses `stopImmediatePropagation`, not plain
  // `stopPropagation`. A click we're turning into an annotation must be fully invisible to
  // the host: components like Fluxon `<.select>` do their selection/close from a `document`
  // capture-phase listener too, registered when they opened — i.e. AFTER ours. Plain
  // stopPropagation leaves those same-target-later listeners running (so clicking an option
  // to annotate it would still pick it and close the dropdown); stopImmediatePropagation
  // silences them. This is the click path only, so text-selection annotation (mouseup) is
  // untouched.
  _onClick(e) {
    if (!this.open) return;
    if (this._skipNextClick) {
      this._skipNextClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    const inside = e.composedPath().includes(this);
    if (this.compose) {
      if (inside) return; // let popup/toolbar handle it
      e.preventDefault();
      e.stopImmediatePropagation();
      this._shake(); // click-outside → shake, don't close
      return;
    }
    if (this.settingsOpen) {
      if (inside) return; // interacting with the settings panel
      e.preventDefault();
      e.stopImmediatePropagation();
      this.settingsOpen = false; // click-outside closes settings
      return;
    }
    if (this.historyOpen) {
      if (inside) return; // interacting with the history panel
      e.preventDefault();
      e.stopImmediatePropagation();
      this.historyOpen = false; // click-outside closes history
      return;
    }
    if (inside) return; // clicking our own toolbar
    e.preventDefault();
    e.stopImmediatePropagation();
    this._startNew(e);
  }

  _onMove(e) {
    if (!this.selecting || e.composedPath().includes(this)) {
      if (this.hoverRect || this.cursorTip) {
        this.hoverRect = null;
        this.cursorTip = null;
      }
      return;
    }
    this._move = e;
    if (this._raf) return;
    this._raf = true;
    requestAnimationFrame(() => {
      this._raf = false;
      const ev = this._move;
      const el = ev && ev.target;
      // The target may have been removed by a LiveView patch between the event and
      // this frame; a detached node gives a 0×0 rect, so bail.
      if (!el || el.nodeType !== 1 || !el.isConnected) {
        this.hoverRect = null;
        this.cursorTip = null;
        return;
      }
      const r = el.getBoundingClientRect();
      this.hoverRect = { left: r.left - 2, top: r.top - 2, width: r.width + 4, height: r.height + 4 };
      this.cursorTip = { x: ev.clientX, y: ev.clientY, label: elementName(el) };
    });
  }

  // Text selection → annotate the selected text. The browser fires a trailing
  // `click` right after `mouseup`; _skipNextClick swallows it so we don't also
  // open a second compose popup.
  _onUp(e) {
    if (!this.selecting || e.composedPath().includes(this)) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    if (!sel || !text || sel.isCollapsed) return; // not a text selection — let the click flow handle it
    e.stopPropagation();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    let el = range.commonAncestorContainer;
    if (el.nodeType === 3) el = el.parentElement;
    const cursor = { x: (rect.left + rect.right) / 2, y: rect.bottom };
    const point = { x: cursor.x + window.scrollX, y: cursor.y + window.scrollY };
    this.compose = { mode: "new", point, info: context(el, text.slice(0, 500), cursor) };
    this.comment = "";
    this._clearAttachState();
    this.detailsOpen = false;
    this._skipNextClick = true;
    setTimeout(() => (this._skipNextClick = false), SELECT_CLICK_GRACE_MS);
    this._focusInput();
  }

  _onKey(e) {
    // "x" clears all annotations — only while the widget is open and not typing.
    if ((e.key === "x" || e.key === "X") && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (!this.open || this.compose || this.settingsOpen || this.historyOpen || this._isTyping(e)) return;
      e.preventDefault();
      this.clearAll();
      return;
    }
    if (e.key !== "Escape") return;
    // Esc closes a layer without a corresponding mouseleave, so a hover tooltip
    // (barTip) would linger — clear it alongside whatever we close.
    this.barTip = null;
    if (this.compose) {
      e.preventDefault();
      e.stopPropagation();
      this.cancel();
    } else if (this.settingsOpen) {
      e.preventDefault();
      e.stopPropagation();
      this.settingsOpen = false;
    } else if (this.historyOpen) {
      e.preventDefault();
      e.stopPropagation();
      this.historyOpen = false;
    } else if (this.open) {
      e.preventDefault();
      e.stopPropagation();
      this.open = false;
    }
  }

  _isTyping(e) {
    const t = e.composedPath()[0];
    if (!t || !t.tagName) return false;
    const tag = t.tagName.toLowerCase();
    return tag === "input" || tag === "textarea" || t.isContentEditable;
  }

  _shake() {
    // WAAPI so it can't clobber the CSS entrance animation (no end-of-shake flash).
    const el = this.renderRoot.querySelector(".popup");
    if (!el || typeof el.animate !== "function") return;
    el.animate(
      [0, -5, 5, -4, 4, -2, 2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 380, easing: "ease-in-out" },
    );
  }

  // ---- compose / popup ----
  _startNew(e) {
    const point = { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY };
    const sel = window.getSelection()?.toString().trim().slice(0, 500) ?? "";
    const ctx = context(e.target, sel, { x: e.clientX, y: e.clientY });
    this.compose = { mode: "new", point, info: ctx };
    this.comment = "";
    this._clearAttachState();
    this.detailsOpen = false;
    this._focusInput();
  }
  _editMarker(ann) {
    // Anchor the edit popup at the marker's live position (document-space), so it
    // tracks the re-anchored marker rather than a stale stored coordinate.
    const vp = this._markerVP(ann) || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const point = { x: vp.x + window.scrollX, y: vp.y + window.scrollY };
    this.compose = { mode: "edit", id: ann.id, point, info: ann };
    this.comment = ann.comment || "";
    this._clearAttachState();
    this.replyText = "";
    this.detailsOpen = false;
    this._focusInput();
  }
  toggleDetails() {
    this.detailsOpen = !this.detailsOpen;
  }
  _focusInput() {
    this.updateComplete.then(() => {
      const ta = this.renderRoot.querySelector("textarea");
      if (ta) ta.focus();
    });
  }
  // Animate the popup out, then clear state.
  _dismiss(cb) {
    // Drop the temporary reveal up front so a jumped-to hidden marker vanishes with the
    // Esc/close rather than lingering through the popup's fade-out (compose stays set for it).
    this.revealId = null;
    const el = this.renderRoot.querySelector(".popup");
    const finish = () => {
      this.compose = null;
      this.comment = "";
      this._clearAttachState();
      this.replyText = "";
      this.detailsOpen = false;
      this._submitting = false;
      if (cb) cb();
    };
    if (!el || typeof el.animate !== "function") return finish();
    const a = el.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.96) translateY(-4px)" }], {
      duration: 130,
      easing: "ease-in",
    });
    a.onfinish = finish;
    a.oncancel = finish;
  }
  cancel() {
    this._dismiss();
  }
  submit() {
    const text = this.comment.trim();
    if (text === "" || !this.compose) return;
    const c = this.compose;
    // Drop the saved draft up front and hold off re-persisting until the request settles,
    // so a reload mid-request can't restore this popup and let the user re-submit it.
    // `create` appends (a duplicate would be a new annotation); `update` is idempotent.
    this._submitting = true;
    this._persistDraft();
    const save =
      c.mode === "edit"
        ? api.update(c.id, { comment: text })
        : api.create({ ...c.info, comment: text, point: c.point, status: "pending", images: this._imagePayload() });
    save
      .then(() => {
        this._dismiss(); // clears compose + resets _submitting
        this._refresh();
      })
      .catch(() => {
        // Request failed: keep the popup and text, re-enable persistence, signal it.
        this._submitting = false;
        this._persistDraft();
        this._shake();
      });
  }

  // Map local attachments to the create payload's `images` (bare base64, no data-URL prefix).
  _imagePayload() {
    return this.attachments.flatMap((a) => {
      const parts = splitDataUrl(a.dataUrl);
      return parts ? [{ mime: parts.mime, data: parts.data, width: a.width, height: a.height }] : [];
    });
  }

  // Downscale + attach image blobs (shared by paste and drop), up to the cap.
  async _ingestImages(blobs) {
    for (const blob of blobs) {
      if (this.attachments.length >= MAX_IMAGES) break;
      try {
        const img = await prepareImage(blob);
        if (img) this.attachments = [...this.attachments, { id: uid(), ...img }];
      } catch (_) {
        /* skip an image we can't decode/encode */
      }
    }
  }

  // Paste an image (screenshot) into a new annotation. A paste with no image
  // items is a normal text paste — leave it to the textarea.
  async _onPaste(e) {
    const blobs = imageBlobs(e.clipboardData);
    if (blobs.length === 0) return;
    e.preventDefault();
    await this._ingestImages(blobs);
  }

  // Drag-and-drop onto a new-annotation popup. dragenter/leave are counted (they
  // also fire when crossing child elements) so the drop-zone hint doesn't flicker.
  _canDrop(e) {
    return this.compose?.mode === "new" && Array.from(e.dataTransfer?.types ?? []).includes("Files");
  }
  _onDragEnter(e) {
    if (!this._canDrop(e)) return;
    e.preventDefault();
    this._dragDepth++;
    this.dragging = true;
  }
  _onDragOver(e) {
    if (this._canDrop(e)) e.preventDefault(); // required for the drop event to fire
  }
  _onDragLeave(e) {
    if (!this._canDrop(e)) return;
    if (--this._dragDepth <= 0) {
      this._dragDepth = 0;
      this.dragging = false;
    }
  }
  async _onDrop(e) {
    if (!this._canDrop(e)) return;
    e.preventDefault();
    this.dragging = false;
    this._dragDepth = 0;
    await this._ingestImages(imageBlobs(e.dataTransfer));
  }

  _removeAttachment(id) {
    this.attachments = this.attachments.filter((a) => a.id !== id);
  }

  // Reset everything tied to a compose popup's images, including a half-finished
  // drag (a drag abandoned outside the window leaves no balancing dragleave).
  _clearAttachState() {
    this.attachments = [];
    this.dragging = false;
    this._dragDepth = 0;
  }
  del() {
    if (this.compose && this.compose.mode === "edit")
      api.remove(this.compose.id).then(() => {
        this._dismiss();
        this._refresh();
      });
  }
  _onInputKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.submit();
    }
  }

  // Post a human reply to the open annotation's thread; the poll surfaces it.
  _sendReply() {
    const text = this.replyText.trim();
    if (text === "" || !this.compose || this.compose.mode !== "edit") return;
    // Same guard as submit(): a reply appends to the thread, so don't leave a
    // re-sendable draft in storage while the request is in flight.
    this._submitting = true;
    this._persistDraft();
    api
      .reply(this.compose.id, text)
      .then(() => {
        this._submitting = false;
        this.replyText = ""; // reactive change re-persists the (reply-less) edit draft
        this._refresh();
      })
      .catch(() => {
        // keep the typed text and signal the failure
        this._submitting = false;
        this._persistDraft();
        this._shake();
      });
  }
  _onReplyKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this._sendReply();
    }
  }

  // ---- toolbar ----
  toggleOpen() {
    this.open = !this.open;
    this.barTip = null;
    if (!this.open) {
      this.compose = null;
      this.settingsOpen = false;
      this.historyOpen = false;
    }
  }
  close() {
    this.open = false;
    this.compose = null;
    this.settingsOpen = false;
    this.historyOpen = false;
    this.barTip = null;
  }

  // toolbar button tooltip
  _tip(e, label) {
    const r = e.currentTarget.getBoundingClientRect();
    this.barTip = { x: r.left + r.width / 2, y: r.top - 8, label };
  }
  _untip() {
    this.barTip = null;
  }
  toggleTheme() {
    this.theme = this.theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, this.theme);
  }
  setAccent(id) {
    this.accent = id;
    localStorage.setItem(ACCENT_KEY, id);
  }
  toggleShowResolved() {
    this.showResolved = !this.showResolved;
    localStorage.setItem(SHOW_RESOLVED_KEY, this.showResolved ? "1" : "0");
  }
  toggleShowAllPages() {
    this.showAllPages = !this.showAllPages;
    localStorage.setItem(SHOW_ALL_PAGES_KEY, this.showAllPages ? "1" : "0");
  }
  toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
    if (this.settingsOpen) {
      this.historyOpen = false; // one panel at a time
      this._pollStatus();
    }
  }
  toggleHistory() {
    this.historyOpen = !this.historyOpen;
    if (this.historyOpen) {
      this.settingsOpen = false; // one panel at a time
      this.historyFilter = []; // start each opening unfiltered
      // Close any open compose so it can't sit under the panel and get clobbered
      // when a row jump opens a different annotation (or navigates away).
      if (this.compose) this.cancel();
    }
  }
  // Toggle a status in the history list's filter (multi-select; empty = show all).
  _toggleHistoryFilter(status) {
    this.historyFilter = this.historyFilter.includes(status)
      ? this.historyFilter.filter((s) => s !== status)
      : [...this.historyFilter, status];
  }
  // Whether an annotation genuinely belongs to the current page. Two related but
  // distinct questions are answered by two predicates on purpose:
  //   - `_onThisPage` (here): page *identity* — should a jump navigate or stay?
  //     Ignores "show all pages" (that only changes where markers render, not which
  //     page owns an annotation) and doesn't care whether the element is on screen yet.
  //   - `_markerVP` (positioning): can the marker be *placed* right now? Respects the
  //     toggle and needs a live, non-zero-area element — which is why the arrival-side
  //     focus resolver in `_refresh` waits on it (the LiveView element may still be
  //     mounting) rather than on `_onThisPage`.
  // After a cross-page navigation both agree (same path), so they stay consistent.
  _onThisPage(ann) {
    if (!ann.url) return true; // no captured page — can't tell it apart, treat as here
    if (this._samePath(ann.url)) return true;
    return isIdAnchored(ann) && !!locate(ann); // a precise #id match re-locates on any page
  }
  // Jump from a history row to its annotation. If it belongs to this page, scroll it
  // into view and open its popup. Otherwise it was made on another page: navigate
  // there and hand off the focus to the next mount via sessionStorage — the
  // freshly-loaded widget opens it once its list arrives. We navigate to the stored
  // page's *path* on the current origin, not its captured absolute URL — that origin
  // may be dead (e.g. the dev server restarted on a different port).
  _jumpTo(ann) {
    if (this._onThisPage(ann)) {
      this.historyOpen = false;
      this._focusAnnotation(ann);
      return;
    }
    try {
      sessionStorage.setItem(FOCUS_KEY, ann.id);
    } catch (_) {}
    try {
      // Take only the stored page's path (+query/hash) and re-resolve it against the
      // CURRENT location, so we navigate on the live origin — the captured absolute
      // origin may be dead (e.g. the dev server restarted on a different port).
      const stored = new URL(ann.url, location.href);
      location.href = new URL(stored.pathname + stored.search + stored.hash, location.href).href;
    } catch (_) {
      location.href = ann.url;
    }
  }
  // Scroll an on-page annotation's element (or point) into view and open its popup.
  // Shared by a same-page history jump and the cross-page focus handoff.
  _focusAnnotation(ann) {
    this.open = true;
    const el = locate(ann);
    // "instant" so _editMarker reads the settled rect this tick — a host app's
    // `scroll-behavior: smooth` would otherwise anchor the popup at the old position.
    if (el) el.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "instant" });
    else if (ann.point)
      window.scrollTo?.({ top: Math.max(0, ann.point.y - window.innerHeight / 2), behavior: "instant" });
    this._editMarker(ann);
    this.revealId = ann.id; // force-show this marker while the popup is open (no-op if already visible)
  }
  async _pollStatus() {
    const s = await api.status();
    this.connected = !!s.connected;
    this.lastSeenMsAgo = typeof s.last_seen_ms_ago === "number" ? s.last_seen_ms_ago : null;
  }
  get regCommand() {
    return `claude mcp add --transport http annotai http://${location.host}/annotai/mcp`;
  }
  async copyReg() {
    try {
      await navigator.clipboard.writeText(this.regCommand);
      this.copied = true;
      setTimeout(() => (this.copied = false), 1500);
    } catch (_) {}
  }
  clearAll() {
    api.clearAll().then(() => this._refresh());
  }

  // viewport position of a document point
  _vp(point) {
    return { x: point.x - window.scrollX, y: point.y - window.scrollY };
  }
  // Same path (ignoring query/hash) as where the annotation was made.
  _samePath(url) {
    return !!url && pagePath(url) === location.pathname;
  }

  // Viewport position of an annotation's marker, or `null` to hide it on this page.
  // Element-anchored markers re-anchor off the live element's rect via the stored
  // fractional offset, so they reappear at the right relative spot wherever the
  // element is. Cross-page anchoring is trusted only for a precise `#id` match; a
  // generic structural selector that merely collides with an unrelated element on
  // another page is treated as not-here. Annotations whose element can't be located
  // (or whose element is zero-area) fall back to their stored point, shown on the
  // page they were made — or everywhere when "show all pages" is on, or when no url
  // was captured so we can't tell pages apart.
  _markerVP(ann) {
    const el = locate(ann);
    if (el) {
      const r = el.getBoundingClientRect();
      const onPage = this.showAllPages || isIdAnchored(ann) || this._samePath(ann.url);
      if (onPage && (r.width > 0 || r.height > 0)) {
        const f =
          ann.anchor_frac && Number.isFinite(ann.anchor_frac.x) && Number.isFinite(ann.anchor_frac.y)
            ? ann.anchor_frac
            : { x: 1, y: 0 }; // legacy annotation: top-right corner
        return { x: r.left + f.x * r.width, y: r.top + f.y * r.height };
      }
    }
    if (!ann.point) return null;
    if (this.showAllPages || !ann.url || this._samePath(ann.url)) return this._vp(ann.point);
    return null;
  }
  // The highlight box for the currently-open annotation's element, drawn so it's
  // clear which element a viewed annotation is attached to (mirrors the select-mode
  // hover highlight). Recomputed each render — viewport changes already trigger a
  // re-render while open — so it tracks scroll/resize. Page-gated like `_markerVP`,
  // so it only shows when the element is actually here; a point-only annotation or a
  // located element with a zero-area box gets no highlight (just the popup).
  _activeHL() {
    if (this.compose?.mode !== "edit") return null;
    const ann = this.annotations.find((a) => a.id === this.compose.id) ?? this.compose.info;
    const el = locate(ann);
    if (!el) return null;
    const onPage = this.showAllPages || isIdAnchored(ann) || this._samePath(ann.url);
    if (!onPage) return null;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { left: r.left - 2, top: r.top - 2, width: r.width + 4, height: r.height + 4 };
  }
  // Anchor the popup beside the marker. The side is chosen from the marker's
  // position: below it (CSS `top`) when it's in the top half, above it (CSS
  // `bottom`) otherwise. Anchoring the FAR edge means any growth — the details
  // accordion or an arriving reply — expands the popup away from the marker
  // instead of pushing it across the marker. No height is read, so it never
  // depends on a measured/mid-animation size. Width is fixed (.popup{width:288px}).
  _popupStyle(vp) {
    const w = 288,
      gap = 26,
      margin = 8;
    const left = Math.min(Math.max(margin, vp.x - w / 2), window.innerWidth - w - margin);
    return vp.y < window.innerHeight / 2
      ? `left:${left}px;top:${vp.y + gap}px`
      : `left:${left}px;bottom:${window.innerHeight - (vp.y - gap)}px`;
  }

  render() {
    // Page-scoped: only annotations whose marker actually renders here (element
    // present, or point-only on this same page) count and show. `_markerVP`
    // returns null for the rest. The badge then matches the pins on screen.
    let shown = visibleAnnotations(this.annotations, this.showResolved);
    // Temporarily reveal the marker for an annotation jumped-to from the history list
    // even if it's resolved/dismissed and "show resolved" is off. Keyed on `revealId`
    // (not `compose`) so it's cleared at the *start* of dismissal — the pin vanishes
    // with the Esc/close instead of lingering through the popup's fade-out animation.
    if (this.revealId && !shown.some((a) => a.id === this.revealId)) {
      const open = this.annotations.find((a) => a.id === this.revealId);
      if (open) shown = [...shown, open];
    }
    const markers = shown
      .map((ann) => ({ ann, vp: this._markerVP(ann) }))
      .filter((m) => m.vp)
      .map((m, i) => ({ ...m, n: i + 1 }));
    const count = markers.length;
    const showBadge = !this.open && count > 0;
    const activeHL = this._activeHL();

    return html`
      ${this.open ? this._renderMarkers(markers) : null}
      ${activeHL
        ? html`<div
            class="hl"
            style="left:${activeHL.left}px;top:${activeHL.top}px;width:${activeHL.width}px;height:${activeHL.height}px"
          ></div>`
        : null}
      ${this.selecting && this.hoverRect
        ? html`<div
            class="hl"
            style="left:${this.hoverRect.left}px;top:${this.hoverRect.top}px;width:${this.hoverRect
              .width}px;height:${this.hoverRect.height}px"
          ></div>`
        : null}
      ${this.selecting && this.cursorTip
        ? html`<div class="cursor-tip" style="left:${this.cursorTip.x + 14}px;top:${this.cursorTip.y + 16}px">
            ${this.cursorTip.label}
          </div>`
        : null}
      ${this.compose && this.compose.mode === "new"
        ? (() => {
            const vp = this._vp(this.compose.point);
            return html`<div class="add-pin" style="left:${vp.x}px;top:${vp.y}px">${icons.plus}</div>`;
          })()
        : null}
      ${this._renderToolbar(count, showBadge)} ${this.settingsOpen ? this._renderSettings() : null}
      ${this.historyOpen ? this._renderHistory() : null}
      ${this.barTip
        ? html`<div class="bar-tip" style="left:${this.barTip.x}px;top:${this.barTip.y}px">${this.barTip.label}</div>`
        : null}
      ${this.compose ? this._renderPopup() : null}
    `;
  }

  _renderMarkers(markers) {
    return markersTemplate({ markers, onEdit: (ann) => this._editMarker(ann) });
  }

  _renderToolbar(count, showBadge) {
    return toolbarTemplate({
      open: this.open,
      settingsOpen: this.settingsOpen,
      historyOpen: this.historyOpen,
      count,
      showBadge,
      onToggleOpen: this.toggleOpen,
      onToggleSettings: this.toggleSettings,
      onToggleHistory: this.toggleHistory,
      onClearAll: this.clearAll,
      onClose: this.close,
      onTip: (e, label) => this._tip(e, label),
      onUntip: this._untip,
    });
  }

  _renderPopup() {
    // Read the live annotation so an agent reply arriving via the poll shows up
    // while the popup is open (compose.info is frozen at click time).
    const c = this.compose;
    const live = c.mode === "edit" ? (this.annotations.find((a) => a.id === c.id) ?? c.info) : c.info;
    return popupTemplate({
      compose: this.compose,
      annotation: live,
      comment: this.comment,
      attachments: this.attachments,
      dragging: this.dragging,
      replyText: this.replyText,
      detailsOpen: this.detailsOpen,
      popupStyle: this._popupStyle(this._vp(this.compose.point)),
      onToggleDetails: this.toggleDetails,
      onInput: (e) => (this.comment = e.target.value),
      onInputKey: this._onInputKey,
      onPaste: (e) => this._onPaste(e),
      onRemoveImage: (id) => this._removeAttachment(id),
      onDragEnter: (e) => this._onDragEnter(e),
      onDragOver: (e) => this._onDragOver(e),
      onDragLeave: (e) => this._onDragLeave(e),
      onDrop: (e) => this._onDrop(e),
      onReplyInput: (e) => (this.replyText = e.target.value),
      onReplyKey: this._onReplyKey,
      onReplySend: this._sendReply,
      onCancel: this.cancel,
      onDelete: this.del,
      onSubmit: this.submit,
    });
  }

  _renderSettings() {
    return settingsTemplate({
      theme: this.theme,
      accent: this.accent,
      version: this.version,
      showResolved: this.showResolved,
      showAllPages: this.showAllPages,
      connected: this.connected,
      lastSeenMsAgo: this.lastSeenMsAgo,
      copied: this.copied,
      regCommand: this.regCommand,
      onToggleTheme: this.toggleTheme,
      onSetAccent: (id) => this.setAccent(id),
      onToggleShowResolved: this.toggleShowResolved,
      onToggleShowAllPages: this.toggleShowAllPages,
      onTip: (e, label) => this._tip(e, label),
      onUntip: this._untip,
      onCopy: this.copyReg,
    });
  }

  _renderHistory() {
    return historyTemplate({
      annotations: this.annotations,
      filter: this.historyFilter,
      onJump: (ann) => this._jumpTo(ann),
      onToggleFilter: (status) => this._toggleHistoryFilter(status),
      onTip: (e, label) => this._tip(e, label),
      onUntip: this._untip,
    });
  }

  static styles = [tokens, toolbarStyles, popupStyles, settingsStyles, historyStyles, markersStyles, overlaysStyles];
}

customElements.define("annotai-widget", AnnotaiWidget);
