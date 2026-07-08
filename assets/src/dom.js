// Pure DOM helpers for describing an annotated element.
import { resolveSource } from "./source-locator.js";

// Build a short, mostly-stable CSS selector path for an element. We stop at the
// first ancestor with an `id` (most specific), and otherwise walk up at most a
// few levels using `tag.firstClass` — deeper paths are brittle and rarely more
// useful for a human reading the annotation. `locate()` prefers `phx_selector`
// over this, so an imprecise path here is a fallback, not the primary anchor.
const MAX_DEPTH = 4;

export function selector(el) {
  const parts = [];
  let node = el,
    depth = 0;
  while (node && node.nodeType === 1 && depth < MAX_DEPTH && node !== document.body) {
    if (node.id) {
      parts.unshift("#" + node.id);
      break;
    }
    let s = node.tagName.toLowerCase();
    // Only the first class — utility-class soup makes longer selectors no more precise.
    const cls = (node.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean)[0];
    if (cls) s += "." + cls;
    parts.unshift(s);
    node = node.parentElement;
    depth++;
  }
  return parts.join(" > ");
}

// A human-readable label for the element, e.g. `button "Save changes"`.
export function elementName(el) {
  const tag = el.tagName.toLowerCase();
  const txt = (el.textContent || "").trim().slice(0, 30);
  return txt ? `${tag} "${txt}"` : tag;
}

// Quote + escape an attribute value for an `[attr="…"]` selector. Values can carry
// arbitrary user data (a `phx-value-*` title, etc.); an unescaped `"` or `\` would
// produce a selector that throws at `querySelector` time.
const attrValue = (v) => `"${String(v).replace(/[\\"]/g, "\\$&")}"`;

// A precise re-selectable fingerprint: an id, else a phx-* binding. Used first by
// `locate()` because it survives DOM churn better than a structural path. Any
// `phx-value-*` attributes are folded in (e.g. `phx-value-id`) so two rows that
// share the same event still get distinct, meaningful selectors.
export function phxSelector(el) {
  if (el.id) return "#" + el.id;
  for (const a of ["phx-click", "phx-submit", "phx-change"]) {
    if (el.hasAttribute(a)) {
      let sel = `[${a}=${attrValue(el.getAttribute(a))}]`;
      for (const name of el.getAttributeNames()) {
        if (name.startsWith("phx-value-")) sel += `[${name}=${attrValue(el.getAttribute(name))}]`;
      }
      return sel;
    }
  }
  return null;
}

function nearbyText(el) {
  const b = [];
  if (el.previousElementSibling) b.push(el.previousElementSibling.textContent.trim().slice(0, 40));
  if (el.nextElementSibling) b.push(el.nextElementSibling.textContent.trim().slice(0, 40));
  return b.filter(Boolean).join(" … ") || null;
}

// Full annotation context captured at click time. `selectedText` is the text the
// user highlighted, if any. `cursor` is the viewport `{x, y}` of the click (or
// selection), used to anchor the marker relative to the element's box. Spreads in
// the resolved source `{source_file, source_line, component}` from source-locator.js.
export function context(el, selectedText, cursor) {
  const r = el.getBoundingClientRect();
  const path = selector(el);
  return {
    element: elementName(el),
    element_path: path,
    phx_selector: phxSelector(el),
    anchor_frac: anchorFrac(r, cursor),
    anchor_index: anchorIndex(el, path),
    bounding_box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
    css_classes: (el.getAttribute("class") || "").trim() || null,
    selected_text: selectedText || null,
    nearby_text: nearbyText(el),
    url: location.href,
    ...resolveSource(el),
  };
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// Where the click landed inside the element's box, as fractions (0..1) of its
// width/height. Re-applied against the live rect on any page so the marker keeps
// its relative spot even when the element renders at a different size. Falls back
// to the top-right corner when there's no cursor or a zero-area box.
function anchorFrac(rect, cursor) {
  if (!cursor || !rect.width || !rect.height) return { x: 1, y: 0 };
  return { x: clamp01((cursor.x - rect.left) / rect.width), y: clamp01((cursor.y - rect.top) / rect.height) };
}

function selectAll(sel) {
  try {
    return [...document.querySelectorAll(sel)];
  } catch (_) {
    return []; // invalid selector
  }
}

// Ordinal of `el` among all elements matching its structural selector, so
// `locate()` can pick the right one of several identical rows. `null` when the
// path is empty or `el` isn't found (then locate falls back to other signals).
function anchorIndex(el, path) {
  if (!path) return null;
  const i = selectAll(path).indexOf(el);
  return i >= 0 ? i : null;
}

const pickByIndex = (list, i) => (Number.isInteger(i) && i >= 0 && i < list.length ? list[i] : null);

// Among several candidates, the one whose text uniquely matches the annotated
// element's stored label (`tag "text"`). Returns it only when exactly one matches,
// so a marker can follow its row's content after a reorder without guessing when
// the text is generic ("Edit", "Delete"). `null` otherwise — caller falls back.
function uniqueByText(list, ann) {
  const m = (ann.element || "").match(/"([^"]+)"/);
  const want = m ? m[1].trim().toLowerCase() : "";
  if (!want) return null;
  const hits = list.filter((el) => (el.textContent || "").trim().toLowerCase().includes(want));
  return hits.length === 1 ? hits[0] : null;
}

// Find the live element an annotation points at (for marker positioning / editing).
// A unique phx fingerprint wins; otherwise the structural path may match several
// identical rows, disambiguated by content, then the captured ordinal, then first.
export function locate(ann) {
  const phx = ann.phx_selector ? selectAll(ann.phx_selector) : [];
  if (phx.length === 1) return phx[0]; // unambiguous fingerprint
  if (ann.element_path) {
    const list = selectAll(ann.element_path);
    if (list.length === 1) return list[0];
    if (list.length > 1) return uniqueByText(list, ann) || pickByIndex(list, ann.anchor_index) || list[0];
  }
  // phx fingerprint matched several rows (no distinguishing value) — take the first.
  return phx[0] || null;
}

// Whether an annotation is identified by a stable `#id` — its own id, or an
// id-only structural path. Such a match is the same logical element on any page
// (LiveView ids are developer-assigned and stable; streams require them), so its
// marker may anchor across pages. A generic structural selector (e.g. `#demo > p`)
// can merely *coincidentally* match another page, so it stays page-scoped.
export function isIdAnchored(ann) {
  return (!!ann.phx_selector && ann.phx_selector[0] === "#") || /^#[-\w]+$/.test(ann.element_path || "");
}

// Normalize a captured (absolute) annotation URL to a bare pathname (query/hash
// dropped), resolved against the current origin. The single source of truth for
// "which page is this?" — used by the same-page check, the history row's page
// label, and the cross-page jump (which must stay on the *live* origin, not the
// dead one an annotation was captured on before a dev-server port change). Falls
// back to the raw string if it can't be parsed.
export function pagePath(url) {
  if (!url) return null;
  try {
    return new URL(url, location.href).pathname;
  } catch (_) {
    return url;
  }
}
