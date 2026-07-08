import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import "../src/widget.js"; // registers <annotai-widget>

// Behavioral (not visual) tests: mount the real element, drive actual clicks
// and keydowns, and assert the resulting STATE / API calls. We avoid anything
// geometry-dependent (getBoundingClientRect) or WAAPI .animate()-dependent
// (the compose popup's shake/dismiss) — those stay manual per tasks/testing.md.

const realFetch = globalThis.fetch;
let fetchCalls;
let replyOk; // toggle to simulate the reply endpoint failing (e.g. a 500)

// Mock fetch so connectedCallback's poll and the toolbar's API calls don't hit
// the network. Records every call so we can assert which endpoint was hit.
function installFetch() {
  fetchCalls = [];
  global.fetch = mock(async (url, opts) => {
    fetchCalls.push({ url: String(url), method: opts?.method || "GET" });
    const u = String(url);
    if (u.endsWith("/annotai/api/annotations")) return { ok: true, json: async () => ({ annotations: [] }) };
    if (u.endsWith("/annotai/api/status")) return { ok: true, json: async () => ({ connected: false }) };
    if (u.endsWith("/reply"))
      return replyOk
        ? { ok: true, json: async () => ({}) }
        : { ok: false, status: 500, statusText: "Internal Server Error" };
    return { ok: true, json: async () => ({}) };
  });
}
const called = (fragment, method) =>
  fetchCalls.some((c) => c.url.includes(fragment) && (!method || c.method === method));

// Let pending microtasks settle — notably connectedCallback's unawaited initial
// _refresh() fetch chain, which would otherwise resolve mid-test and overwrite
// any annotations a test sets directly.
const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

let w;
beforeEach(async () => {
  replyOk = true;
  installFetch();
  localStorage.clear();
  sessionStorage.clear();
  w = document.createElement("annotai-widget");
  document.body.appendChild(w); // runs connectedCallback: global listeners + initial poll
  // The synthetic fixtures are point-based and page-agnostic (no resolvable
  // element, no matching url), so opt out of page-scoping by default — the
  // "page-scoped markers" block exercises that behavior explicitly.
  w.showAllPages = true;
  await flush(); // initial _refresh() has settled — tests start from a known state
});
afterEach(() => {
  w.remove(); // disconnectedCallback clears the interval + listeners
  document.body.replaceChildren();
  globalThis.fetch = realFetch;
});

const $ = (sel) => w.renderRoot.querySelector(sel);
const tick = () => w.updateComplete;
const key = (k, opts = {}) => document.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...opts }));

describe("toolbar buttons", () => {
  test("clicking the logo opens the toolbar; once open it is inert branding", async () => {
    expect(w.open).toBe(false);
    $(".logo").click();
    await tick();
    expect(w.open).toBe(true);
    // Open, the logo is just branding — clicking it does not close the bar (the X does).
    $(".logo").click();
    await tick();
    expect(w.open).toBe(true);
  });

  test("the gear opens the settings panel", async () => {
    $(".logo").click();
    await tick();
    expect($(".settings")).toBeNull();
    $('[aria-label="Settings"]').click();
    await tick();
    expect(w.settingsOpen).toBe(true);
    expect($(".settings")).toBeTruthy();
  });

  test('the "x" closes the toolbar, the settings panel, and any compose', async () => {
    $(".logo").click();
    await tick();
    $('[aria-label="Settings"]').click();
    await tick();
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: {} }; // also ensure compose is cleared on close
    await tick();
    expect($(".settings")).toBeTruthy();

    $('[aria-label="Close"]').click();
    await tick();
    expect(w.open).toBe(false);
    expect(w.settingsOpen).toBe(false); // regression guard: settings must not stay open
    expect(w.compose).toBe(null);
    expect($(".settings")).toBeNull();
  });

  test("the trash button calls the clear-all API", async () => {
    $(".logo").click();
    await tick();
    $('[aria-label="Clear all annotations"]').click();
    await tick();
    expect(called("/annotai/api/clear", "POST")).toBe(true);
  });
});

describe("host click-outside shielding", () => {
  // A click on our own UI must not reach the host app's listeners, or host components
  // that close on an outside click (modals, dropdowns) would close the moment you click
  // the widget to annotate them. The shield sits on `window` in the capture phase, so it
  // covers host detectors in EITHER phase.

  // Register a host listener and return the record of what it saw. `capture` mimics the
  // Fluxon case — outside-click detectors commonly listen on document in the capture phase.
  const spyOn = (type, { capture = false } = {}) => {
    const seen = [];
    const fn = () => seen.push(type);
    document.addEventListener(type, fn, capture);
    return { seen, dispose: () => document.removeEventListener(type, fn, capture) };
  };

  test("a click on our UI is hidden from a capture-phase host detector, yet still activates our own control", async () => {
    // The exact bug: Fluxon-style detectors on document CAPTURE fire before a bubble-phase
    // shield could ever see the event. Emulate a real user click — composed (crosses the
    // shadow boundary) and originating on the FAB's deepest node.
    const host = spyOn("click", { capture: true });
    try {
      const logo = $(".logo");
      const target = logo.firstElementChild || logo;
      target.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
      await tick();
      expect(w.open).toBe(true); // our @click still ran, via the composed:false relay
      expect(host.seen).toEqual([]); // ...but the capture-phase host detector never saw it
    } finally {
      host.dispose();
    }
  });

  test("a click on our UI is also hidden from a bubble-phase host listener", async () => {
    const host = spyOn("click");
    try {
      $(".logo").click(); // FAB while closed — the interaction that used to leak
      await tick();
      expect(w.open).toBe(true);
      expect(host.seen).toEqual([]);
    } finally {
      host.dispose();
    }
  });

  test("a genuine page click still reaches the host (both phases)", () => {
    const cap = spyOn("click", { capture: true });
    const bub = spyOn("click");
    try {
      document.body.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
      expect(cap.seen).toEqual(["click"]);
      expect(bub.seen).toEqual(["click"]);
    } finally {
      cap.dispose();
      bub.dispose();
    }
  });

  test("a pointer press on our UI is hidden from a capture-phase host detector", () => {
    // Modals that close on outside mousedown must not fire when you press our toolbar.
    const host = spyOn("mousedown", { capture: true });
    try {
      $(".logo").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, composed: true }));
      expect(host.seen).toEqual([]);
    } finally {
      host.dispose();
    }
  });

  test("focus moving into our UI does not reach the host (focus-out modals stay open)", () => {
    // A host modal/dropdown that closes on focus leaving it must not fire when the
    // compose textarea takes focus — that would close the very thing you're annotating.
    const host = spyOn("focusin", { capture: true });
    try {
      w.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));
      expect(host.seen).toEqual([]);
    } finally {
      host.dispose();
    }
  });

  test("pressing a toolbar control preventDefaults the press, so it can't pull host focus", async () => {
    // Fluxon <.select> (and many dropdowns) close when focus LEAVES their trigger. A press
    // on our button must not steal that focus — we cancel the press's default focus shift.
    $(".logo").click();
    await tick();
    const btn = $('[aria-label="Settings"]');
    const e = new MouseEvent("mousedown", { bubbles: true, composed: true, cancelable: true });
    btn.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  test("pressing our own text field is NOT prevented (the annotation textarea still focuses)", async () => {
    // The flip side: a press on our compose textarea must keep native focus/caret so you
    // can type — so it must NOT be preventDefaulted.
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: {} };
    await tick();
    const ta = $("textarea");
    expect(ta).toBeTruthy();
    const e = new MouseEvent("mousedown", { bubbles: true, composed: true, cancelable: true });
    ta.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
  });

  test("stays interactive when a host modal marks it inert", async () => {
    // Fluxon <.modal> inerts every sibling of the dialog so the background can't be touched.
    // We're a body-level sibling; if we let that stick, you couldn't annotate the open modal.
    w.setAttribute("inert", "");
    await flush(); // the MutationObserver reaction is async
    expect(w.hasAttribute("inert")).toBe(false);
  });

  test("annotating a host element hides the click from a later document-capture listener", async () => {
    // Turning a host click into an annotation must be invisible to the host — including a
    // capture-phase document listener registered AFTER us (Fluxon <.select> selecting/closing
    // an option that way). stopImmediatePropagation in _onClick is what silences it.
    $(".logo").click(); // enter annotate mode
    await tick();
    const seen = [];
    const onCapture = () => seen.push("click");
    document.addEventListener("click", onCapture, true); // registered after our _onClick
    const hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    try {
      hostEl.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));
      expect(seen).toEqual([]); // the later same-phase listener never ran
    } finally {
      document.removeEventListener("click", onCapture, true);
      hostEl.remove();
    }
  });
});

describe("keybindings", () => {
  test('"x" clears annotations when the toolbar is open', async () => {
    $(".logo").click();
    await tick();
    key("x");
    await tick();
    expect(called("/annotai/api/clear", "POST")).toBe(true);
  });

  test('"x" is ignored when the toolbar is closed', async () => {
    key("x");
    await tick();
    expect(called("/annotai/api/clear", "POST")).toBe(false);
  });

  test("Escape closes the settings panel before the toolbar", async () => {
    $(".logo").click();
    await tick();
    $('[aria-label="Settings"]').click();
    await tick();

    key("Escape"); // first Escape: settings only
    await tick();
    expect(w.settingsOpen).toBe(false);
    expect(w.open).toBe(true);

    key("Escape"); // second Escape: the toolbar
    await tick();
    expect(w.open).toBe(false);
  });
});

describe("settings: Show resolved", () => {
  async function openSettings() {
    $(".logo").click();
    await tick();
    $('[aria-label="Settings"]').click();
    await tick();
  }

  test("clicking the switch toggles showResolved and persists it", async () => {
    await openSettings();
    expect(w.showResolved).toBe(false);
    $(".switch").click();
    await tick();
    expect(w.showResolved).toBe(true);
    expect(localStorage.getItem("annotai-show-resolved")).toBe("1");
  });

  test("clicking the label also toggles the switch", async () => {
    await openSettings();
    $(".set-row-label").click();
    await tick();
    expect(w.showResolved).toBe(true);
  });

  test("clicking the help icon does NOT toggle the switch", async () => {
    await openSettings();
    const before = w.showResolved;
    $(".help").click();
    await tick();
    expect(w.showResolved).toBe(before);
  });
});

describe("history panel", () => {
  const anns = [
    { id: "a1", status: "pending", point: { x: 10, y: 10 }, comment: "first", element: "div", url: "http://x/a" },
    { id: "a2", status: "resolved", point: { x: 40, y: 10 }, comment: "second", element: "div", url: "http://x/b" },
    { id: "a3", status: "dismissed", point: { x: 70, y: 10 }, comment: "third", element: "div", url: "http://x/c" },
  ];
  const $$ = (sel) => [...w.renderRoot.querySelectorAll(sel)];

  async function openHistory() {
    $(".logo").click();
    await tick();
    $('[aria-label="Annotations"]').click();
    await tick();
  }

  test("the history button opens the panel", async () => {
    await openHistory();
    expect(w.historyOpen).toBe(true);
    expect($(".history")).toBeTruthy();
  });

  test('"x" does NOT clear annotations while the history panel is open', async () => {
    // Regression: the history panel exists to review annotations — the destructive
    // clear-all shortcut must be suppressed there, exactly as it is for settings.
    w.annotations = anns;
    await openHistory();
    key("x");
    await tick();
    expect(called("/annotai/api/clear", "POST")).toBe(false);
  });

  test("lists every annotation regardless of status, newest first", async () => {
    w.annotations = anns;
    await openHistory();
    const rows = $$(".hist-card");
    expect(rows.length).toBe(3); // resolved + dismissed included, unlike the marker view
    // store order is oldest-first; the panel reverses it
    expect(rows[0].querySelector(".hist-comment").textContent).toContain("third");
    expect(rows[2].querySelector(".hist-comment").textContent).toContain("first");
  });

  test("each row shows a status icon reflecting its status", async () => {
    w.annotations = anns; // reversed → row0 dismissed, row1 resolved, row2 pending
    await openHistory();
    const rows = $$(".hist-card");
    expect(rows[0].querySelector(".hist-ico")?.getAttribute("data-status")).toBe("dismissed");
    expect(rows[1].querySelector(".hist-ico")?.getAttribute("data-status")).toBe("resolved");
    expect(rows[2].querySelector(".hist-ico")?.getAttribute("data-status")).toBe("pending");
    expect(rows[0].querySelector(".hist-ico svg")).toBeTruthy(); // icon actually rendered
  });

  test("header shows a per-status count chip for each present status", async () => {
    w.annotations = anns; // 1 pending, 1 resolved, 1 dismissed
    await openHistory();
    const byStatus = Object.fromEntries(
      $$(".hist-count").map((c) => [c.getAttribute("data-status"), c.textContent.trim()]),
    );
    expect(byStatus.pending).toBe("1");
    expect(byStatus.resolved).toBe("1");
    expect(byStatus.dismissed).toBe("1");
    expect(byStatus.acknowledged).toBeUndefined(); // zero-count statuses are omitted
  });

  test("clicking count chips filters the list; multi-select and toggle-off", async () => {
    w.annotations = anns; // pending a1, resolved a2, dismissed a3
    await openHistory();
    const chip = (s) => $(`.hist-count[data-status="${s}"]`);

    chip("resolved").click();
    await tick();
    let rows = $$(".hist-card");
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector(".hist-ico").getAttribute("data-status")).toBe("resolved");

    chip("pending").click(); // multi-select: pending + resolved
    await tick();
    expect($$(".hist-card").length).toBe(2);

    chip("resolved").click(); // toggle resolved off → only pending
    await tick();
    rows = $$(".hist-card");
    expect(rows.length).toBe(1);
    expect(rows[0].querySelector(".hist-ico").getAttribute("data-status")).toBe("pending");

    chip("pending").click(); // toggle last one off → no filter → all
    await tick();
    expect($$(".hist-card").length).toBe(3);
  });

  test("an active filter keeps its chip (and stays clearable) when its count drops to 0", async () => {
    w.annotations = anns; // includes one dismissed
    await openHistory();
    const chip = (s) => $(`.hist-count[data-status="${s}"]`);
    chip("dismissed").click();
    await tick();
    expect($$(".hist-card").length).toBe(1); // only the dismissed one

    // The dismissed annotation goes away (e.g. count drops to 0 for that status).
    w.annotations = anns.filter((a) => a.status !== "dismissed");
    await tick();
    // Its chip must remain so the filter is still toggle-off-able (regression guard).
    expect(chip("dismissed")).toBeTruthy();
    expect(chip("dismissed").hasAttribute("data-active")).toBe(true);

    chip("dismissed").click(); // clear the now-empty filter
    await tick();
    expect(w.historyFilter).toEqual([]);
    expect($$(".hist-card").length).toBe(2); // remaining pending + resolved
  });

  test("opening history closes an in-progress compose (no clobber under the panel)", async () => {
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: {} };
    w.comment = "half-typed";
    await tick();
    $(".logo").click();
    await tick();
    $('[aria-label="Annotations"]').click();
    await tick();
    expect(w.historyOpen).toBe(true);
    expect(w.compose).toBeNull();
  });

  test("jumping to a resolved annotation reveals its marker only while its popup is open", async () => {
    // "Show resolved" is off by default, so the resolved marker is normally hidden.
    const r = { id: "rr", status: "resolved", point: { x: 10, y: 10 }, comment: "done", url: location.href };
    w.annotations = [r];
    await openHistory();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(0); // hidden by default

    $(".hist-card").click(); // jump from the list → opens its popup
    await tick();
    expect(w.compose?.id).toBe("rr");
    expect(w.revealId).toBe("rr");
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(1); // temporarily revealed

    w.cancel(); // close the popup
    // The reveal is dropped synchronously at dismiss start, so the pin leaves with the
    // close instead of lingering through the popup's fade-out.
    expect(w.revealId).toBeNull();
    await tick();
    await tick();
    expect(w.compose).toBeNull();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(0); // hidden again
  });

  test("opening history resets any prior filter", async () => {
    w.annotations = anns;
    await openHistory();
    $(`.hist-count[data-status="resolved"]`).click();
    await tick();
    expect(w.historyFilter).toEqual(["resolved"]);
    // Close and reopen → filter starts fresh.
    $('[aria-label="Annotations"]').click(); // close
    await tick();
    $('[aria-label="Annotations"]').click(); // reopen
    await tick();
    expect(w.historyFilter).toEqual([]);
    expect($$(".hist-card").length).toBe(3);
  });

  test("empty state when there are no annotations", async () => {
    await openHistory();
    expect($(".hist-none")).toBeTruthy();
    expect($$(".hist-card").length).toBe(0);
  });

  test("opening history closes settings, and vice versa", async () => {
    $(".logo").click();
    await tick();
    $('[aria-label="Settings"]').click();
    await tick();
    expect(w.settingsOpen).toBe(true);

    $('[aria-label="Annotations"]').click();
    await tick();
    expect(w.historyOpen).toBe(true);
    expect(w.settingsOpen).toBe(false);

    $('[aria-label="Settings"]').click();
    await tick();
    expect(w.settingsOpen).toBe(true);
    expect(w.historyOpen).toBe(false);
  });

  test("Escape closes the history panel before the toolbar", async () => {
    await openHistory();
    key("Escape");
    await tick();
    expect(w.historyOpen).toBe(false);
    expect(w.open).toBe(true);
  });

  test("clicking a same-page row opens that annotation and closes the panel", async () => {
    // Same path as the test document → treated as on-page regardless of showAllPages.
    const local = { id: "s1", status: "pending", point: { x: 10, y: 10 }, comment: "local", url: location.href };
    w.annotations = [local];
    await openHistory();
    $(".hist-card").click();
    await tick();
    expect(w.historyOpen).toBe(false);
    expect(w.compose?.mode).toBe("edit");
    expect(w.compose?.id).toBe("s1");
  });

  test("clicking a cross-page row stashes focus and navigates — even with show-all-pages on", async () => {
    // Regression guard: "show all pages" only changes where markers render, not which
    // page owns an annotation, so an off-page row must still navigate (not open locally).
    const orig = location.href;
    window.location.href = "http://localhost/current"; // a real origin to navigate within
    const foreign = {
      id: "f1",
      status: "pending",
      point: { x: 5, y: 5 },
      comment: "elsewhere",
      url: "http://localhost/another-page",
    };
    w.annotations = [foreign];
    w.showAllPages = true;
    await openHistory();
    try {
      $(".hist-card").click();
      await tick();
      expect(sessionStorage.getItem("annotai-focus")).toBe("f1");
      expect(location.pathname).toBe("/another-page");
      expect(w.compose).toBeNull(); // did NOT open locally
    } finally {
      window.location.href = orig; // restore so later tests see the original location
    }
  });

  test("a pending cross-page focus opens its annotation once the widget re-mounts", async () => {
    // Simulates the post-navigation mount: the target id waits in sessionStorage and
    // the annotation is on this page, so the fresh widget opens it after its first poll.
    const target = { id: "t1", status: "pending", point: { x: 10, y: 10 }, comment: "hi", url: location.href };
    sessionStorage.setItem("annotai-focus", "t1");
    global.fetch = mock(async (url) => {
      const u = String(url);
      if (u.endsWith("/annotai/api/annotations")) return { ok: true, json: async () => ({ annotations: [target] }) };
      if (u.endsWith("/annotai/api/status")) return { ok: true, json: async () => ({ connected: false }) };
      return { ok: true, json: async () => ({}) };
    });
    const nw = document.createElement("annotai-widget");
    document.body.appendChild(nw);
    await flush();
    await nw.updateComplete;
    expect(sessionStorage.getItem("annotai-focus")).toBeNull(); // read + cleared at construction
    expect(nw.compose?.mode).toBe("edit");
    expect(nw.compose?.id).toBe("t1");
    nw.remove();
  });
});

describe("markers", () => {
  // point-based markers need no geometry, so this is reliable headless.
  const anns = [
    { id: "p1", status: "pending", point: { x: 10, y: 10 }, comment: "open", element: "div" },
    { id: "r1", status: "resolved", point: { x: 40, y: 10 }, comment: "done", element: "div" },
  ];

  test("resolved markers are hidden by default and shown when toggled on", async () => {
    w.annotations = anns;
    w.open = true;
    await tick();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(1); // only pending

    w.showResolved = true;
    await tick();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(2);
  });

  test("clicking a marker opens it in edit mode", async () => {
    w.annotations = anns;
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.compose?.mode).toBe("edit");
    expect(w.compose?.id).toBe("p1");
  });
});

describe("page-scoped markers", () => {
  // A point-only annotation (no locatable element) made on another page.
  const here = location.href;
  const onThisPage = { id: "h", status: "pending", point: { x: 10, y: 10 }, comment: "x", element: "div", url: here };
  const onOtherPage = { ...onThisPage, id: "o", url: "http://localhost/somewhere-else" };

  test("a point-only marker shows on its own page and hides on others", async () => {
    w.showAllPages = false;
    w.annotations = [onThisPage, onOtherPage];
    w.open = true;
    await tick();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(1); // only the same-path one
  });

  test('"show all pages" reveals markers from every page', async () => {
    w.showAllPages = true;
    w.annotations = [onThisPage, onOtherPage];
    w.open = true;
    await tick();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(2);
  });

  test("the toolbar badge counts only the current page's markers", async () => {
    w.showAllPages = false;
    w.annotations = [onThisPage, onOtherPage];
    await tick(); // closed → badge visible, count is page-scoped
    expect(w.renderRoot.querySelector(".badge")?.textContent).toBe("1");

    w.showAllPages = true; // now every page's marker counts
    await tick();
    expect(w.renderRoot.querySelector(".badge")?.textContent).toBe("2");
  });

  test("query string / hash differences don't fragment a marker's page", async () => {
    w.showAllPages = false;
    w.annotations = [{ ...onThisPage, url: here + "?tab=x#frag" }];
    w.open = true;
    await tick();
    expect(w.renderRoot.querySelectorAll(".marker").length).toBe(1);
  });
});

describe("_markerVP anchoring & cross-page gate", () => {
  // happy-dom reports 0×0 for getBoundingClientRect, so stub a real rect.
  const place = (html, rect) => {
    document.body.insertAdjacentHTML("beforeend", html);
    const el = document.body.lastElementChild;
    if (rect)
      el.getBoundingClientRect = () => ({
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.w,
        bottom: rect.y + rect.h,
        width: rect.w,
        height: rect.h,
      });
    return el;
  };
  const otherPage = "http://localhost/a-different-page";

  beforeEach(() => {
    w.showAllPages = false;
  });

  test("anchors to a located element via the fractional offset", () => {
    place(`<div id="cta"></div>`, { x: 100, y: 50, w: 200, h: 80 });
    const vp = w._markerVP({
      phx_selector: "#cta",
      element_path: "#cta",
      anchor_frac: { x: 0.5, y: 0.5 },
      url: otherPage,
    });
    expect(vp).toEqual({ x: 200, y: 90 }); // 100 + .5*200, 50 + .5*80
  });

  test("a precise #id match anchors across pages", () => {
    place(`<div id="shared"></div>`, { x: 10, y: 10, w: 40, h: 20 });
    // made on a different page, but identified by id → still anchors here
    const vp = w._markerVP({ element_path: "#shared", anchor_frac: { x: 1, y: 0 }, url: otherPage });
    expect(vp).toEqual({ x: 50, y: 10 });
  });

  test("a generic structural match on a DIFFERENT page is not trusted (no false anchor)", () => {
    place(`<main id="box"><p></p></main>`, null);
    const p = document.querySelector("#box > p");
    p.getBoundingClientRect = () => ({ left: 10, top: 10, right: 60, bottom: 30, width: 50, height: 20 });
    // generic selector + different page → don't anchor to a coincidental collision
    expect(
      w._markerVP({ element_path: "#box > p", anchor_frac: { x: 0, y: 0 }, url: otherPage, point: { x: 5, y: 5 } }),
    ).toBeNull();
  });

  test("a generic structural match on the SAME page anchors to the live element", () => {
    place(`<main id="box2"><p></p></main>`, null);
    document.querySelector("#box2 > p").getBoundingClientRect = () => ({
      left: 10,
      top: 10,
      right: 60,
      bottom: 30,
      width: 50,
      height: 20,
    });
    const vp = w._markerVP({
      element_path: "#box2 > p",
      anchor_frac: { x: 1, y: 0 },
      url: location.href,
      point: { x: 5, y: 5 },
    });
    expect(vp).toEqual({ x: 60, y: 10 });
  });

  test("a located but zero-area element does not pin the marker to (0,0)", () => {
    place(`<div id="collapsed"></div>`, { x: 0, y: 0, w: 0, h: 0 });
    // zero-area → fall through to the stored point (same page), never {0,0}
    const vp = w._markerVP({
      phx_selector: "#collapsed",
      element_path: "#collapsed",
      anchor_frac: { x: 0.5, y: 0.5 },
      url: location.href,
      point: { x: 7, y: 7 },
    });
    expect(vp).toEqual(w._vp({ x: 7, y: 7 }));
  });

  test("a point-only annotation with no url stays visible (can't page-scope it)", () => {
    expect(w._markerVP({ point: { x: 12, y: 34 }, url: null, element: "div" })).toEqual(w._vp({ x: 12, y: 34 }));
  });
});

describe("active element highlight", () => {
  // happy-dom reports 0×0 for getBoundingClientRect, so stub a real rect.
  const place = (html, rect) => {
    document.body.insertAdjacentHTML("beforeend", html);
    const el = document.body.lastElementChild;
    if (rect)
      el.getBoundingClientRect = () => ({
        left: rect.x,
        top: rect.y,
        right: rect.x + rect.w,
        bottom: rect.y + rect.h,
        width: rect.w,
        height: rect.h,
      });
    return el;
  };

  test("opening an annotation highlights its located element (2px outset)", async () => {
    place(`<button id="cta">Go</button>`, { x: 100, y: 50, w: 200, h: 80 });
    w.annotations = [
      {
        id: "a1",
        status: "pending",
        phx_selector: "#cta",
        element_path: "#cta",
        anchor_frac: { x: 0.5, y: 0.5 },
        url: location.href,
        point: { x: 5, y: 5 },
        element: 'button "Go"',
      },
    ];
    w.open = true;
    await tick();
    expect(w.renderRoot.querySelector(".hl")).toBeNull(); // nothing highlighted before opening

    $(".marker").click();
    await tick();
    expect(w.compose?.mode).toBe("edit");
    const hl = w.renderRoot.querySelector(".hl");
    expect(hl).toBeTruthy();
    expect(hl.style.left).toBe("98px"); // 100 - 2
    expect(hl.style.top).toBe("48px"); // 50 - 2
    expect(hl.style.width).toBe("204px"); // 200 + 4
    expect(hl.style.height).toBe("84px"); // 80 + 4
  });

  test("a point-only annotation (no locatable element) shows no highlight", async () => {
    w.annotations = [{ id: "p", status: "pending", point: { x: 10, y: 10 }, url: location.href, element: "div" }];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.compose?.mode).toBe("edit");
    expect(w.renderRoot.querySelector(".hl")).toBeNull();
  });

  test("a located but zero-area element shows no highlight", async () => {
    place(`<div id="collapsed"></div>`, { x: 0, y: 0, w: 0, h: 0 });
    w.annotations = [
      {
        id: "z",
        status: "pending",
        phx_selector: "#collapsed",
        element_path: "#collapsed",
        url: location.href,
        point: { x: 7, y: 7 },
      },
    ];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.compose?.mode).toBe("edit");
    expect(w.renderRoot.querySelector(".hl")).toBeNull();
  });
});

describe("image attachments", () => {
  // Open a fresh-annotation compose popup with the given local attachments.
  async function composeWith(attachments) {
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
    w.comment = "look here";
    w.attachments = attachments;
    w.open = true;
    await tick();
  }

  const att = (id, dataUrl = "data:image/png;base64,AAAA") => ({ id, mime: "image/png", dataUrl, width: 4, height: 4 });

  test("local attachments render as removable thumbnails", async () => {
    await composeWith([att("a1"), att("a2")]);
    expect(w.renderRoot.querySelectorAll(".attachments .thumb").length).toBe(2);
    expect(w.renderRoot.querySelectorAll(".thumb-x").length).toBe(2);
  });

  test("clicking a thumbnail's × removes just that attachment", async () => {
    await composeWith([att("a1"), att("a2")]);
    w.renderRoot.querySelector(".thumb-x").click(); // first one
    await tick();
    expect(w.attachments.map((a) => a.id)).toEqual(["a2"]);
    expect(w.renderRoot.querySelectorAll(".thumb").length).toBe(1);
  });

  test("submit includes images as bare base64 (data-URL prefix stripped)", async () => {
    let body;
    global.fetch = mock(async (url, opts) => {
      if (opts?.body) body = JSON.parse(opts.body); // ignore the trailing _refresh GET (no body)
      return { ok: true, json: async () => ({ id: "ann_new", annotations: [] }) };
    });
    await composeWith([att("a1", "data:image/png;base64,ZZZZ")]);
    w.submit();
    await flush();
    expect(body.images).toEqual([{ mime: "image/png", data: "ZZZZ", width: 4, height: 4 }]);
  });

  test("a paste with no image items is left to the textarea (no attachment added)", async () => {
    await composeWith([]);
    let defaultPrevented = false;
    w._onPaste({
      clipboardData: { items: [{ kind: "string", type: "text/plain", getAsFile: () => null }] },
      preventDefault: () => (defaultPrevented = true),
    });
    await tick();
    expect(w.attachments).toEqual([]);
    expect(defaultPrevented).toBe(false);
  });

  // Synthetic drag event carrying file types (getAsFile is null mid-drag, so the
  // hint keys off dataTransfer.types like the real handlers do).
  const dragEvent = (types = ["Files"]) => {
    let prevented = false;
    return {
      dataTransfer: { types },
      preventDefault: () => (prevented = true),
      get prevented() {
        return prevented;
      },
    };
  };

  test("dragging an image over a new-annotation popup shows the drop zone", async () => {
    await composeWith([]);
    expect(w.renderRoot.querySelector(".dropzone")).toBeNull();

    const e = dragEvent();
    w._onDragEnter(e);
    await tick();
    expect(e.prevented).toBe(true); // accepts the drag
    expect(w.dragging).toBe(true);
    expect(w.renderRoot.querySelector(".dropzone")).toBeTruthy();
  });

  test("the drop-zone hint doesn't flicker across child boundaries (enter/leave are counted)", async () => {
    await composeWith([]);
    w._onDragEnter(dragEvent()); // enter popup
    w._onDragEnter(dragEvent()); // enter a child
    expect(w.dragging).toBe(true);
    w._onDragLeave(dragEvent()); // leave the child — still inside
    expect(w.dragging).toBe(true);
    w._onDragLeave(dragEvent()); // leave the popup — now hidden
    expect(w.dragging).toBe(false);
  });

  test("dragging is ignored while editing an existing annotation (attach is new-only)", async () => {
    w.compose = { mode: "edit", id: "x", point: { x: 1, y: 1 }, info: { element: "div" } };
    await tick();
    const e = dragEvent();
    w._onDragEnter(e);
    expect(e.prevented).toBe(false);
    expect(w.dragging).toBe(false);
  });

  test("a non-file drag (e.g. text) is not treated as a droppable image", async () => {
    await composeWith([]);
    const e = dragEvent(["text/plain"]);
    w._onDragEnter(e);
    expect(e.prevented).toBe(false);
    expect(w.dragging).toBe(false);
  });

  test("dropping resets the drag state", async () => {
    await composeWith([]);
    w._onDragEnter(dragEvent());
    expect(w.dragging).toBe(true);
    // Files present so the drop is accepted; no .items here, so ingest is a headless no-op.
    const e = dragEvent(["Files"]);
    await w._onDrop(e);
    expect(e.prevented).toBe(true);
    expect(w.dragging).toBe(false);
  });

  test("an existing annotation shows its stored images read-only via the image route", async () => {
    w.annotations = [
      {
        id: "ann_1",
        status: "pending",
        point: { x: 10, y: 10 },
        comment: "x",
        element: "div",
        thread: [],
        images: [{ id: "img_1", mime: "image/png" }],
      },
    ];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    const img = w.renderRoot.querySelector(".attachments .thumb img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toBe("/annotai/api/annotations/ann_1/images/img_1");
    expect(w.renderRoot.querySelector(".thumb-x")).toBeNull(); // read-only, no remove
  });
});

describe("reply thread", () => {
  const withThread = {
    id: "t1",
    status: "acknowledged",
    point: { x: 10, y: 10 },
    comment: "make it blue",
    element: "div",
    thread: [
      { role: "agent", content: "Should it be #00f or the accent blue?", at: new Date().toISOString() },
      { role: "human", content: "accent blue", at: new Date().toISOString() },
    ],
  };

  test("the conversation shows the original comment as the first message, then the thread", async () => {
    w.annotations = [withThread];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    const msgs = w.renderRoot.querySelectorAll(".thread .msg");
    expect(msgs.length).toBe(3); // original comment + 2 thread messages
    expect(msgs[0].getAttribute("data-role")).toBe("human"); // the original comment
    expect(msgs[1].getAttribute("data-role")).toBe("agent");
    expect(msgs[2].getAttribute("data-role")).toBe("human");
    const text = w.renderRoot.querySelector(".thread").textContent;
    expect(text).toContain("make it blue"); // the comment, now message #1
    expect(text).toContain("Should it be #00f");
  });

  test("a fresh annotation (no thread) keeps the editable comment textarea, not a conversation", async () => {
    w.annotations = [{ id: "t2", status: "pending", point: { x: 5, y: 5 }, comment: "hi", element: "div", thread: [] }];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.renderRoot.querySelector(".thread")).toBeNull();
    expect(w.renderRoot.querySelector("textarea")).toBeTruthy(); // comment textarea still editable
    expect(w.renderRoot.querySelector(".solid")).toBeTruthy(); // Save button present
  });

  test("once there's a thread the comment textarea + Save are gone (reply-only)", async () => {
    w.annotations = [withThread];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.renderRoot.querySelector(".thread")).toBeTruthy();
    expect(w.renderRoot.querySelector(".solid")).toBeNull(); // no Save in conversation mode
  });

  test("the conversation reflects the live polled annotation, not the click-time snapshot", async () => {
    w.annotations = [{ ...withThread, thread: [] }]; // open with empty thread → compose textarea
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
    expect(w.renderRoot.querySelector(".thread")).toBeNull();

    // an agent reply arrives via the poll while the popup is open
    w.annotations = [withThread];
    await tick();
    expect(w.renderRoot.querySelectorAll(".thread .msg").length).toBe(3); // comment + 2 thread
  });

  async function openMarker(ann) {
    w.showResolved = true; // so resolved/dismissed markers render and can be opened
    w.annotations = [ann];
    w.open = true;
    await tick();
    $(".marker").click();
    await tick();
  }

  test("the reply box shows for an open annotation with a thread", async () => {
    await openMarker(withThread); // acknowledged
    expect(w.renderRoot.querySelector(".reply")).toBeTruthy();
  });

  test("the reply box shows on a resolved/dismissed thread (a reply reopens it)", async () => {
    for (const status of ["resolved", "dismissed"]) {
      await openMarker({ ...withThread, status });
      expect(w.renderRoot.querySelector(".reply")).toBeTruthy();
    }
  });

  test("no reply box when the thread is empty (agent hasn't engaged)", async () => {
    await openMarker({ ...withThread, thread: [] });
    expect(w.renderRoot.querySelector(".reply")).toBeNull();
  });

  test("Send posts the reply and clears the input on success", async () => {
    await openMarker(withThread);
    w.replyText = "use the accent";
    await tick();
    w.renderRoot.querySelector(".reply-send").click();
    await flush(); // let the POST + .then settle
    await tick();
    expect(called("/annotai/api/annotations/t1/reply", "POST")).toBe(true);
    expect(w.replyText).toBe(""); // cleared after a successful send
  });

  test("Enter (no shift) in the reply box sends", async () => {
    await openMarker(withThread);
    w.replyText = "via enter";
    await tick();
    const ta = w.renderRoot.querySelector(".reply textarea");
    ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await tick();
    expect(called("/annotai/api/annotations/t1/reply", "POST")).toBe(true);
  });

  test("a blank/whitespace reply does not send", async () => {
    await openMarker(withThread);
    w.replyText = "   ";
    await tick();
    expect(w.renderRoot.querySelector(".reply-send").hasAttribute("disabled")).toBe(true);
    w._sendReply();
    await tick();
    expect(called("/annotai/api/annotations/t1/reply", "POST")).toBe(false);
  });

  test("a failed reply keeps the typed text (no silent loss)", async () => {
    replyOk = false; // endpoint rejects (e.g. a 500)
    await openMarker(withThread);
    w.replyText = "this should survive";
    await tick();
    w.renderRoot.querySelector(".reply-send").click();
    await tick();
    expect(called("/annotai/api/annotations/t1/reply", "POST")).toBe(true);
    expect(w.replyText).toBe("this should survive"); // preserved, not dropped
  });

  test("the popup closes if its annotation is deleted out from under it", async () => {
    await openMarker(withThread);
    expect(w.compose?.mode).toBe("edit");
    // the next poll returns an empty list (annotation cleared/deleted)
    await w._refresh();
    await tick();
    expect(w.compose).toBeNull();
  });
});

describe("draft persistence across a page reload", () => {
  const readDraft = () => JSON.parse(sessionStorage.getItem("annotai-draft") || "null");
  const pageKey = () => location.pathname + location.search + location.hash;

  // Mount a *fresh* widget (its constructor runs _restoreDraft) after seeding a draft,
  // simulating what a full page reload does. Returns the new element.
  async function remount() {
    const el = document.createElement("annotai-widget");
    document.body.appendChild(el);
    await flush();
    return el;
  }

  test("composing continuously mirrors the draft to sessionStorage", async () => {
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
    w.comment = "half a thought";
    await tick();
    const draft = readDraft();
    expect(draft.comment).toBe("half a thought");
    expect(draft.compose.mode).toBe("new");
    expect(draft.path).toBe(pageKey());
  });

  test("a fresh mount restores an in-progress draft (open, popup, text)", async () => {
    sessionStorage.setItem(
      "annotai-draft",
      JSON.stringify({
        path: pageKey(),
        compose: { mode: "new", point: { x: 9, y: 9 }, info: { element: "div" } },
        comment: "survived the reload",
        replyText: "",
        detailsOpen: false,
        attachments: [],
      }),
    );
    const el = await remount();
    expect(el.open).toBe(true);
    expect(el.compose?.mode).toBe("new");
    expect(el.comment).toBe("survived the reload");
    expect(el.renderRoot.querySelector("textarea")).toBeTruthy();
    el.remove();
  });

  test("a draft made on a different path is not restored", async () => {
    sessionStorage.setItem(
      "annotai-draft",
      JSON.stringify({
        path: "/some-other-page",
        compose: { mode: "new", point: { x: 1, y: 1 }, info: { element: "div" } },
        comment: "from elsewhere",
      }),
    );
    const el = await remount();
    expect(el.compose).toBeNull();
    el.remove();
  });

  test("a draft made on the same path but a different query is not restored", async () => {
    sessionStorage.setItem(
      "annotai-draft",
      JSON.stringify({
        path: pageKey() + "?q=cats", // same pathname, different full URL
        compose: { mode: "new", point: { x: 1, y: 1 }, info: { element: "div" } },
        comment: "for the cats page",
      }),
    );
    const el = await remount();
    expect(el.compose).toBeNull(); // query/hash blindness would wrongly restore this
    el.remove();
  });

  test("ending the compose clears the saved draft (no stale restore after submit)", async () => {
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
    w.comment = "typing";
    await tick();
    expect(readDraft()).toBeTruthy();

    w.compose = null; // what _dismiss() does after submit/cancel
    await tick();
    expect(readDraft()).toBeNull();
  });

  test("submitting drops the saved draft up front, before the request resolves", async () => {
    // Gate the create POST so we can inspect storage while the request is in flight.
    // The poll GET hits the same path but must NOT block, so gate on the method.
    let releaseCreate;
    const created = new Promise((res) => (releaseCreate = res));
    global.fetch = mock(async (url, opts) => {
      const u = String(url);
      if (u.endsWith("/annotai/api/annotations") && opts?.method === "POST") {
        await created;
        return { ok: true, json: async () => ({ id: "ann_new" }) };
      }
      if (u.endsWith("/annotai/api/annotations")) return { ok: true, json: async () => ({ annotations: [] }) };
      return { ok: true, json: async () => ({}) };
    });

    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
    w.comment = "no dupes";
    await tick();
    expect(readDraft()).toBeTruthy(); // saved while composing

    w.submit(); // request now in flight, unresolved
    await tick();
    expect(readDraft()).toBeNull(); // dropped up front — a reload here can't re-submit it

    // Even a poll landing mid-request must not re-persist it.
    await w._refresh();
    await tick();
    expect(readDraft()).toBeNull();

    releaseCreate();
    await flush();
  });

  test("a failed submit keeps the draft so the text can be retried", async () => {
    global.fetch = mock(async (url) => {
      if (String(url).endsWith("/annotai/api/annotations")) return { ok: false, status: 500, statusText: "boom" };
      return { ok: true, json: async () => ({}) };
    });
    w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
    w.comment = "please survive";
    await tick();

    w.submit();
    await flush();
    await tick();
    expect(w.compose).not.toBeNull(); // popup stays open
    expect(readDraft()?.comment).toBe("please survive"); // re-persisted for a retry
  });

  test("a restored edit draft whose annotation is gone closes the widget (no stranded selector)", async () => {
    sessionStorage.setItem(
      "annotai-draft",
      JSON.stringify({
        path: pageKey(),
        compose: { mode: "edit", id: "ann_gone", point: { x: 5, y: 5 }, info: { id: "ann_gone", element: "div" } },
        comment: "edited before a server restart",
      }),
    );
    // Default fetch mock returns an empty annotation list → the target is gone.
    const el = await remount();
    expect(el.compose).toBeNull(); // the _refresh guard cleared it
    expect(el.open).toBe(false); // ...and didn't strand the widget open
    el.remove();
  });

  test("an oversized draft still saves the text (attachments dropped, not the comment)", async () => {
    // Simulate a sessionStorage quota that rejects any payload carrying attachments.
    // happy-dom's Storage proxies method access, so swap the whole global for a complete
    // fake (with clear/key/length, so a leaked fake can't cascade into other tests).
    const store = {};
    const fake = {
      getItem: (k) => (k in store ? store[k] : null),
      removeItem: (k) => delete store[k],
      clear: () => Object.keys(store).forEach((k) => delete store[k]),
      key: (i) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
      setItem: (k, v) => {
        if (/"attachments":\[\{/.test(v)) throw new Error("QuotaExceededError");
        store[k] = v;
      },
    };
    const orig = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: fake });
    try {
      w.compose = { mode: "new", point: { x: 5, y: 5 }, info: { element: "div" } };
      w.comment = "keep me";
      w.attachments = [{ id: "a1", mime: "image/png", dataUrl: "data:image/png;base64,ZZZZ", width: 4, height: 4 }];
      await tick();
      const draft = JSON.parse(store["annotai-draft"] || "null");
      expect(draft.comment).toBe("keep me");
      expect(draft.attachments).toEqual([]); // dropped to fit the quota
    } finally {
      if (orig) Object.defineProperty(globalThis, "sessionStorage", orig);
      else delete globalThis.sessionStorage;
    }
  });
});
