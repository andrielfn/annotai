import { describe, test, expect } from "bun:test";
import { visibleAnnotations, TERMINAL_STATUSES } from "../src/annotations.js";

const anns = [
  { id: "1", status: "pending" },
  { id: "2", status: "acknowledged" },
  { id: "3", status: "resolved" },
  { id: "4", status: "dismissed" },
];

describe("visibleAnnotations", () => {
  test("hides resolved and dismissed by default", () => {
    expect(visibleAnnotations(anns, false).map((a) => a.id)).toEqual(["1", "2"]);
  });

  test("shows everything when showResolved is true", () => {
    expect(visibleAnnotations(anns, true)).toEqual(anns);
  });

  test("preserves order of the kept annotations", () => {
    const mixed = [anns[2], anns[0], anns[3], anns[1]];
    expect(visibleAnnotations(mixed, false).map((a) => a.id)).toEqual(["1", "2"]);
  });

  test("treats a missing status as visible (not terminal)", () => {
    expect(visibleAnnotations([{ id: "x" }], false)).toEqual([{ id: "x" }]);
  });

  test("TERMINAL_STATUSES are the two done states", () => {
    expect(TERMINAL_STATUSES).toEqual(["resolved", "dismissed"]);
  });
});
