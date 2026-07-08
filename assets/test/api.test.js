import { describe, test, expect, afterEach, mock } from "bun:test";
import * as api from "../src/api.js";

const realFetch = globalThis.fetch;
let calls;

// Replace fetch with a stub that records calls and returns `response`.
function stubFetch(response) {
  calls = [];
  global.fetch = mock(async (url, opts) => {
    calls.push({ url, opts });
    return response;
  });
}

function ok(json) {
  return { ok: true, json: async () => json };
}

// Restore real fetch after each test so a throwing/leaking mock can't corrupt later tests.
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("list", () => {
  test("GETs annotations and unwraps the list", async () => {
    stubFetch(ok({ annotations: [{ id: "a" }] }));
    expect(await api.list()).toEqual([{ id: "a" }]);
    expect(calls[0].url).toBe("/annotai/api/annotations");
  });

  test("defaults to [] when the payload has no annotations", async () => {
    stubFetch(ok({}));
    expect(await api.list()).toEqual([]);
  });
});

describe("create", () => {
  test("POSTs JSON with the right headers and returns the created annotation", async () => {
    stubFetch(ok({ id: "a", comment: "x" }));
    const result = await api.create({ comment: "x" });
    expect(result).toEqual({ id: "a", comment: "x" });
    expect(calls[0].url).toBe("/annotai/api/annotations");
    expect(calls[0].opts.method).toBe("POST");
    expect(calls[0].opts.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(calls[0].opts.body)).toEqual({ comment: "x" });
  });
});

describe("update", () => {
  test("PATCHes the annotation by id", async () => {
    stubFetch(ok({ id: "ann_1", comment: "new" }));
    await api.update("ann_1", { comment: "new" });
    expect(calls[0].url).toBe("/annotai/api/annotations/ann_1");
    expect(calls[0].opts.method).toBe("PATCH");
    expect(JSON.parse(calls[0].opts.body)).toEqual({ comment: "new" });
  });
});

describe("reply", () => {
  test("POSTs the message to the annotation's reply endpoint", async () => {
    stubFetch(ok({ id: "ann_1", thread: [{ role: "human", content: "yes" }] }));
    const result = await api.reply("ann_1", "yes");
    expect(result.thread).toHaveLength(1);
    expect(calls[0].url).toBe("/annotai/api/annotations/ann_1/reply");
    expect(calls[0].opts.method).toBe("POST");
    expect(calls[0].opts.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(calls[0].opts.body)).toEqual({ message: "yes" });
  });

  test("rejects on a non-OK response", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Internal Server Error" });
    await expect(api.reply("ann_1", "hi")).rejects.toThrow(/500/);
  });
});

describe("remove / clearAll", () => {
  test("remove DELETEs by id", async () => {
    stubFetch(ok({}));
    await api.remove("ann_1");
    expect(calls[0].url).toBe("/annotai/api/annotations/ann_1");
    expect(calls[0].opts.method).toBe("DELETE");
  });

  test("clearAll POSTs /clear", async () => {
    stubFetch(ok({}));
    await api.clearAll();
    expect(calls[0].url).toBe("/annotai/api/clear");
    expect(calls[0].opts.method).toBe("POST");
  });
});

describe("status", () => {
  test("returns the parsed status when reachable", async () => {
    stubFetch(ok({ connected: true }));
    expect(await api.status()).toEqual({ connected: true });
  });

  test("falls back to { connected: false } on failure", async () => {
    global.fetch = mock(async () => {
      throw new Error("network down");
    });
    expect(await api.status()).toEqual({ connected: false });
  });
});

describe("error handling", () => {
  test("a non-2xx response rejects (the json() guard throws)", async () => {
    stubFetch({ ok: false, status: 500, statusText: "Internal Server Error" });
    await expect(api.list()).rejects.toThrow(/500/);
  });
});

describe("fire-and-forget endpoints (no json() guard)", () => {
  test("remove resolves rather than rejects on a non-2xx response", async () => {
    stubFetch({ ok: false, status: 500, statusText: "err" });
    await expect(api.remove("ann_1")).resolves.toBeDefined();
  });

  test("clearAll resolves on a non-2xx response", async () => {
    stubFetch({ ok: false, status: 500, statusText: "err" });
    await expect(api.clearAll()).resolves.toBeDefined();
  });
});
