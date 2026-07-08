// Clipboard-screenshot attachments for annotations.
//
// The widget lets a developer paste an image (e.g. a screenshot) into the compose
// popup. We downscale + re-encode it client-side so a giant 4K paste can't bloat
// the in-memory store or the MCP response, then ship it as base64 in the create
// payload. The agent reads it back as an MCP image block.
//
// The DOM-touching bits (canvas/Image) live behind `prepareImage`; the rest are
// pure helpers so the caps/encoding logic is unit-testable without a browser.

export const MAX_DIM = 1600; // longest edge, px
export const MAX_IMAGES = 4; // per annotation
export const MAX_BYTES = 2_000_000; // per image, after compression

// Split a `data:<mime>;base64,<data>` URL into its parts, or null if it isn't one.
export function splitDataUrl(dataUrl) {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl || "");
  return m ? { mime: m[1], data: m[2] } : null;
}

// Scale (w, h) down so the longest edge is <= max, preserving aspect ratio.
// Never upscales.
export function fitWithin(w, h, max) {
  if (w <= max && h <= max) return { width: w, height: h };
  const scale = max / Math.max(w, h);
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

// Approximate decoded byte size of a base64 data URL (or bare base64).
export function approxBytes(dataUrl) {
  const i = (dataUrl || "").indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl || "";
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding);
}

let _seq = 0;
export const uid = () => `att_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

// Pull image blobs out of a paste/drop DataTransfer; ignores non-image items.
export function imageBlobs(dataTransfer) {
  const out = [];
  for (const item of dataTransfer?.items ?? []) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) out.push(file);
    }
  }
  return out;
}

// Downscale + re-encode a blob to a capped data URL. Prefers PNG (crisp UI text)
// and falls back to progressively lossier JPEG when PNG is too heavy; returns null
// if it still can't fit under maxBytes. DOM-dependent (canvas) — not exercised in
// the headless tests, which cover the pure helpers above.
export async function prepareImage(blob, { maxDim = MAX_DIM, maxBytes = MAX_BYTES } = {}) {
  const bitmap = await loadImage(blob);
  const { width, height } = fitWithin(bitmap.naturalWidth, bitmap.naturalHeight, maxDim);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);

  for (const [mime, quality] of [
    ["image/png", undefined],
    ["image/jpeg", 0.85],
    ["image/jpeg", 0.6],
  ]) {
    const dataUrl = canvas.toDataURL(mime, quality);
    if (approxBytes(dataUrl) <= maxBytes) return { mime, dataUrl, width, height };
  }
  return null;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
