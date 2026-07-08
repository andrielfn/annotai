import { describe, test, expect } from "bun:test";
import { splitDataUrl, fitWithin, approxBytes, imageBlobs, MAX_DIM } from "../src/images.js";

// Pure helpers only — the canvas-dependent `prepareImage` is exercised manually
// (happy-dom has no real 2d canvas). See tasks/testing.md.

describe("splitDataUrl", () => {
  test("splits a base64 data URL into mime + data", () => {
    expect(splitDataUrl("data:image/png;base64,AAAB")).toEqual({ mime: "image/png", data: "AAAB" });
  });

  test("returns null for non data URLs", () => {
    expect(splitDataUrl("http://x/y.png")).toBeNull();
    expect(splitDataUrl("")).toBeNull();
    expect(splitDataUrl(null)).toBeNull();
  });
});

describe("fitWithin", () => {
  test("leaves an already-small image untouched (never upscales)", () => {
    expect(fitWithin(800, 600, MAX_DIM)).toEqual({ width: 800, height: 600 });
  });

  test("scales the longest edge down to max, preserving aspect ratio", () => {
    expect(fitWithin(3200, 1600, 1600)).toEqual({ width: 1600, height: 800 });
    expect(fitWithin(1000, 4000, 1000)).toEqual({ width: 250, height: 1000 });
  });
});

describe("approxBytes", () => {
  test("estimates decoded size from base64 length, accounting for padding", () => {
    // "AAAA" -> 3 bytes, "AAA=" -> 2 bytes, "AA==" -> 1 byte
    expect(approxBytes("data:image/png;base64,AAAA")).toBe(3);
    expect(approxBytes("AAA=")).toBe(2);
    expect(approxBytes("AA==")).toBe(1);
  });
});

describe("imageBlobs", () => {
  const item = (kind, type, file) => ({ kind, type, getAsFile: () => file });

  test("returns only image file blobs", () => {
    const png = { name: "p" };
    const dt = { items: [item("file", "image/png", png), item("string", "text/plain", null)] };
    expect(imageBlobs(dt)).toEqual([png]);
  });

  test("empty / missing items -> []", () => {
    expect(imageBlobs({})).toEqual([]);
    expect(imageBlobs(null)).toEqual([]);
    expect(imageBlobs({ items: [item("file", "text/plain", { x: 1 })] })).toEqual([]);
  });
});
