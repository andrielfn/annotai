// Resolve a DOM element to its HEEx source location: {source_file, source_line, component}.
//
// This is Annotai's defining feature, and it leans on two Phoenix LiveView dev flags:
//
//   * `debug_attributes: true`     — stamps each rendered node with `data-phx-loc="<line>"`.
//                                    This is the PRIMARY, morphdom-stable source of the line.
//   * `debug_heex_annotations: true` — wraps each rendered component in HTML comments:
//          <!-- <MyAppWeb.CoreComponents.button> lib/.../core_components.ex:142 -->
//          ...rendered markup...
//          <!-- </MyAppWeb.CoreComponents.button> -->
//                                    These give the FILE and component module name.
//
// Algorithm (validated in Spike A): walk every comment node in document order up to
// the target element, maintaining a stack of currently-open component annotations
// (push on `<Mod> file:line`, pop on `</Mod>`). When we reach the target, the top of
// the stack is the component that rendered it. The line comes from the element's own
// `data-phx-loc` when present (more precise and patch-stable) and falls back to the
// enclosing comment's line.
//
// Slot content is attributed to its caller: Phoenix emits an `@caller file:line`
// comment for slot bodies, whose file is the template that *used* the component
// rather than the component's own definition. We detect "inside a slot" heuristically
// — a non-`.render` enclosing module means we're inside a component's slot — and
// prefer the caller's file in that case.
const openRe = /^\s*<([A-Za-z0-9_.]+)>\s+(\S+):(\d+)/;
const closeRe = /^\s*<\/([A-Za-z0-9_.]+)>/;
const callerRe = /^\s*@caller\s+(\S+):(\d+)/;

export function resolveSource(el) {
  const it = document.createNodeIterator(document.documentElement, NodeFilter.SHOW_COMMENT);
  const stack = [];
  let caller = null;
  let c;
  while ((c = it.nextNode())) {
    // Stop once we pass comments that no longer precede the target element.
    if (!(el.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_PRECEDING)) break;
    const t = c.nodeValue;
    let m;
    if ((m = openRe.exec(t))) stack.push({ module: m[1], file: m[2], line: m[3] });
    else if ((m = callerRe.exec(t))) caller = { file: m[1], line: m[2] };
    else if (closeRe.test(t)) stack.pop();
  }
  const enc = stack[stack.length - 1] || null;
  const loc = el.getAttribute("data-phx-loc");
  const inSlot = enc && enc.module && !enc.module.endsWith(".render");
  const file = inSlot && caller ? caller.file : enc ? enc.file : caller ? caller.file : null;
  return {
    source_file: file,
    source_line: loc ? parseInt(loc, 10) : enc ? parseInt(enc.line, 10) : null,
    component: enc ? enc.module : null,
  };
}
