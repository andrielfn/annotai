// REST wrappers for the Annotai annotation API.
//
// All functions return Promises and reject on a non-2xx response so the widget
// can keep its last-known-good state. Response shapes:
//   list()   -> Annotation[]
//   create() -> Annotation
//   update() -> Annotation
//   status() -> { connected: boolean, last_seen_ms_ago: number|null }
const BASE = "/annotai/api";

const json = (res) => {
  if (!res.ok) throw new Error(`annotai: ${res.status} ${res.statusText}`);
  return res.json();
};

export const list = () =>
  fetch(`${BASE}/annotations`)
    .then(json)
    .then((d) => d.annotations || []);

export const create = (annotation) =>
  fetch(`${BASE}/annotations`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(annotation),
  }).then(json);

export const update = (id, changes) =>
  fetch(`${BASE}/annotations/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(changes),
  }).then(json);

// Append a human reply to an open annotation's thread. Rejects (non-2xx) if the
// annotation is resolved/dismissed (409) — the caller surfaces nothing extra.
export const reply = (id, message) =>
  fetch(`${BASE}/annotations/${id}/reply`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
  }).then(json);

export const remove = (id) => fetch(`${BASE}/annotations/${id}`, { method: "DELETE" });

export const clearAll = () => fetch(`${BASE}/clear`, { method: "POST" });

// Best-effort: the settings panel shows a dot, so a failure is just "not connected".
export const status = () =>
  fetch(`${BASE}/status`)
    .then(json)
    .catch(() => ({ connected: false }));
