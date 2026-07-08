import { describe, test, expect, afterEach } from "bun:test";
import { selector, elementName, phxSelector, context, locate } from "../src/dom.js";

function render(html) {
  document.body.innerHTML = html;
  const el = document.getElementById("target");
  if (!el) throw new Error('render(): fixture has no element with id="target"');
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("selector", () => {
  test("returns #id for an element with an id", () => {
    expect(selector(render(`<div id="target"></div>`))).toBe("#target");
  });

  test("builds a tag.class breadcrumb, first class only, up to the body", () => {
    // No id on the leaf, or selector short-circuits on it.
    document.body.innerHTML = `<section><div class="a b"><span></span></div></section>`;
    expect(selector(document.querySelector("span"))).toBe("section > div.a > span");
  });

  test("short-circuits at the nearest ancestor id", () => {
    document.body.innerHTML = `<div id="card"><span class="t"></span></div>`;
    expect(selector(document.querySelector(".t"))).toBe("#card > span.t");
  });

  test("stops after 4 levels", () => {
    // No ids in the chain, or selector would short-circuit on the id.
    document.body.innerHTML = `<div><div><div><div><div><span class="leaf"></span></div></div></div></div></div>`;
    expect(selector(document.querySelector(".leaf")).split(" > ").length).toBe(4);
  });
});

describe("elementName", () => {
  test("tag plus trimmed text", () => {
    expect(elementName(render(`<button id="target">  Save </button>`))).toBe(`button "Save"`);
  });

  test("tag only when empty", () => {
    expect(elementName(render(`<div id="target"></div>`))).toBe("div");
  });

  test("truncates long text to 30 chars", () => {
    const el = render(`<p id="target">${"x".repeat(50)}</p>`);
    expect(elementName(el)).toBe(`p "${"x".repeat(30)}"`);
  });
});

describe("phxSelector", () => {
  test("prefers #id", () => {
    expect(phxSelector(render(`<button id="target" phx-click="inc"></button>`))).toBe("#target");
  });

  test("falls back to a phx-* attribute", () => {
    document.body.innerHTML = `<button phx-click="inc">x</button>`;
    expect(phxSelector(document.querySelector("button"))).toBe(`[phx-click="inc"]`);
  });

  test("null when neither id nor phx-*", () => {
    document.body.innerHTML = `<div>x</div>`;
    expect(phxSelector(document.querySelector("div"))).toBeNull();
  });

  test("uses phx-submit / phx-change when phx-click is absent", () => {
    document.body.innerHTML = `<form phx-submit="save"></form>`;
    expect(phxSelector(document.querySelector("form"))).toBe(`[phx-submit="save"]`);
    document.body.innerHTML = `<input phx-change="validate">`;
    expect(phxSelector(document.querySelector("input"))).toBe(`[phx-change="validate"]`);
  });

  test("phx-click takes priority over other phx-* attributes", () => {
    document.body.innerHTML = `<button phx-click="a" phx-submit="b"></button>`;
    expect(phxSelector(document.querySelector("button"))).toBe(`[phx-click="a"]`);
  });

  test("folds in phx-value-* so identical events on different rows stay distinct", () => {
    document.body.innerHTML = `<button phx-click="select" phx-value-id="2">x</button>`;
    expect(phxSelector(document.querySelector("button"))).toBe(`[phx-click="select"][phx-value-id="2"]`);
  });

  test("escapes quotes/backslashes in attribute values so the selector stays valid", () => {
    document.body.innerHTML = `<button phx-click="sel">x</button>`;
    const b = document.querySelector("button");
    b.setAttribute("phx-value-title", 'a"b\\c'); // a raw double-quote and backslash
    // Each `"` and `\` must be backslash-escaped inside the quoted value, otherwise
    // the `"` would terminate the value early and throw at querySelector time.
    expect(phxSelector(b)).toBe(`[phx-click="sel"][phx-value-title="a\\"b\\\\c"]`);
  });
});

describe("context", () => {
  test("assembles the full annotation context", () => {
    const el = render(`<button id="target" class="primary" phx-click="save">Go</button>`);
    const ctx = context(el, "selected!");
    expect(ctx.element).toBe(`button "Go"`);
    expect(ctx.element_path).toBe("#target");
    expect(ctx.phx_selector).toBe("#target");
    expect(ctx.css_classes).toBe("primary");
    expect(ctx.selected_text).toBe("selected!");
    expect(ctx.bounding_box).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(typeof ctx.url).toBe("string");
    // merged in from resolveSource
    expect(ctx).toHaveProperty("source_file");
    expect(ctx).toHaveProperty("source_line");
  });

  test("null css_classes and selected_text when absent", () => {
    const ctx = context(render(`<div id="target"></div>`));
    expect(ctx.css_classes).toBeNull();
    expect(ctx.selected_text).toBeNull();
  });

  test("captures nearby sibling text, joined", () => {
    document.body.innerHTML = `<div><span>before</span><button id="target">Go</button><span>after</span></div>`;
    expect(context(document.getElementById("target")).nearby_text).toBe("before … after");
  });

  test("anchor_frac defaults to the top-right corner with no cursor or zero-area box", () => {
    // happy-dom reports a 0×0 rect, so even with a cursor it falls back to the corner.
    expect(context(render(`<div id="target"></div>`)).anchor_frac).toEqual({ x: 1, y: 0 });
  });

  test("anchor_index is the element's ordinal among same-selector matches", () => {
    document.body.innerHTML = `<ul><li class="row"></li><li class="row"></li></ul>`;
    const second = document.querySelectorAll("li.row")[1];
    // selector(second) is `ul > li.row`, which matches both rows.
    expect(context(second).anchor_index).toBe(1);
  });
});

describe("locate", () => {
  test("finds by phx_selector first", () => {
    render(`<div id="target"></div>`);
    expect(locate({ phx_selector: "#target" })).toBe(document.getElementById("target"));
  });

  test("falls back to element_path", () => {
    document.body.innerHTML = `<div class="foo"></div>`;
    expect(locate({ phx_selector: null, element_path: ".foo" })).toBe(document.querySelector(".foo"));
  });

  test("swallows an invalid selector and tries the next", () => {
    render(`<div id="target"></div>`);
    expect(locate({ phx_selector: "[[[", element_path: "#target" })).toBe(document.getElementById("target"));
  });

  test("null when nothing matches", () => {
    document.body.innerHTML = "";
    expect(locate({ phx_selector: "#missing", element_path: ".missing" })).toBeNull();
  });

  test("disambiguates duplicate rows by the stored ordinal", () => {
    document.body.innerHTML = `<ul><li class="row">a</li><li class="row">b</li><li class="row">c</li></ul>`;
    const got = locate({ element_path: "ul > li.row", anchor_index: 2 });
    expect(got).toBe(document.querySelectorAll("li.row")[2]);
  });

  test("a unique text match wins over the ordinal (follows content after a reorder)", () => {
    document.body.innerHTML = `<ul><li class="row">Bravo</li><li class="row">Alpha</li></ul>`;
    // Captured at index 0 when Alpha was first; the rows have since swapped.
    const got = locate({ element_path: "ul > li.row", anchor_index: 0, element: `li "Alpha"` });
    expect(got.textContent).toBe("Alpha");
  });

  test("a unique phx fingerprint wins over an ambiguous structural path", () => {
    document.body.innerHTML = `<ul><li class="row" phx-click="sel" phx-value-id="9">a</li><li class="row">b</li></ul>`;
    const got = locate({ phx_selector: `[phx-click="sel"][phx-value-id="9"]`, element_path: "ul > li.row" });
    expect(got).toBe(document.querySelector('[phx-value-id="9"]'));
  });

  test("falls back to the first match when nothing disambiguates", () => {
    document.body.innerHTML = `<ul><li class="row">x</li><li class="row">x</li></ul>`;
    // identical generic text, no ordinal → first row.
    expect(locate({ element_path: "ul > li.row" })).toBe(document.querySelectorAll("li.row")[0]);
  });
});
