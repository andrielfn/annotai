import { describe, test, expect, afterEach } from "bun:test";
import { resolveSource } from "../src/source-locator.js";

// Build a DOM from an HTML fragment and return the element with id="target".
// Comments are the HEEx debug annotations Phoenix emits with
// `debug_heex_annotations: true`; `data-phx-loc` comes from `debug_attributes: true`.
function render(html) {
  document.body.innerHTML = html;
  const el = document.getElementById("target");
  if (!el) throw new Error('render(): fixture has no element with id="target"');
  return el;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("resolveSource", () => {
  test("uses the enclosing component comment for file + component", () => {
    const el = render(`
      <!-- <MyAppWeb.Foo> lib/my_app_web/foo.ex:10 -->
      <div id="target">hi</div>
      <!-- </MyAppWeb.Foo> -->
    `);
    expect(resolveSource(el)).toEqual({
      source_file: "lib/my_app_web/foo.ex",
      source_line: 10,
      component: "MyAppWeb.Foo",
    });
  });

  test("data-phx-loc on the element overrides the comment's line", () => {
    const el = render(`
      <!-- <MyAppWeb.Foo> lib/my_app_web/foo.ex:10 -->
      <div id="target" data-phx-loc="42">hi</div>
    `);
    const src = resolveSource(el);
    expect(src.source_line).toBe(42);
    expect(src.source_file).toBe("lib/my_app_web/foo.ex");
  });

  test("slot content is attributed to the @caller file, not the component", () => {
    // Enclosing module does NOT end in `.render` (a function component invoked by a
    // caller), so the content's file comes from the nearest @caller comment.
    const el = render(`
      <!-- @caller lib/my_app_web/caller.ex:7 -->
      <!-- <MyAppWeb.Layouts.app> lib/my_app_web/layouts.ex:3 -->
      <span id="target">slotted</span>
    `);
    const src = resolveSource(el);
    expect(src.source_file).toBe("lib/my_app_web/caller.ex");
    expect(src.component).toBe("MyAppWeb.Layouts.app");
    expect(src.source_line).toBe(3);
  });

  test("a `.render` enclosing module keeps its own file even with a caller present", () => {
    const el = render(`
      <!-- @caller lib/my_app_web/caller.ex:7 -->
      <!-- <MyAppWeb.DemoLive.render> lib/my_app_web/demo_live.ex:5 -->
      <h1 id="target">title</h1>
    `);
    const src = resolveSource(el);
    expect(src.source_file).toBe("lib/my_app_web/demo_live.ex");
    expect(src.source_line).toBe(5);
  });

  test("picks the innermost enclosing component when nested", () => {
    const el = render(`
      <!-- <Outer> a.ex:1 -->
      <!-- <Inner> b.ex:2 -->
      <div id="target"></div>
      <!-- </Inner> -->
      <!-- </Outer> -->
    `);
    const src = resolveSource(el);
    expect(src.component).toBe("Inner");
    expect(src.source_file).toBe("b.ex");
    expect(src.source_line).toBe(2);
  });

  test("with no comments, line comes from data-phx-loc and file/component are null", () => {
    const el = render(`<div id="target" data-phx-loc="99"></div>`);
    expect(resolveSource(el)).toEqual({
      source_file: null,
      source_line: 99,
      component: null,
    });
  });

  test("with neither comments nor data-phx-loc, everything is null", () => {
    const el = render(`<div id="target"></div>`);
    expect(resolveSource(el)).toEqual({
      source_file: null,
      source_line: null,
      component: null,
    });
  });

  test("ignores comments that come after the element", () => {
    const el = render(`
      <div id="target"></div>
      <!-- <ShouldBeIgnored> later.ex:50 -->
    `);
    expect(resolveSource(el).component).toBeNull();
  });

  test("@caller with no enclosing component falls back to the caller file", () => {
    const el = render(`
      <!-- @caller lib/my_app_web/caller.ex:7 -->
      <div id="target"></div>
    `);
    const src = resolveSource(el);
    expect(src.source_file).toBe("lib/my_app_web/caller.ex");
    expect(src.component).toBeNull();
    expect(src.source_line).toBeNull();
  });

  test("tolerates a spurious close comment with no matching open", () => {
    const el = render(`
      <!-- </Orphan> -->
      <div id="target"></div>
    `);
    expect(() => resolveSource(el)).not.toThrow();
    expect(resolveSource(el).component).toBeNull();
  });
});
