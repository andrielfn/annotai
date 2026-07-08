import { css, html } from "lit";
import * as icons from "../icons.js";

const infoRow = (label, value) =>
  html`<div class="info-row"><span class="k">${label}</span><code>${value}</code></div>`;

// Compact relative time from an ISO-8601 string (the thread's `at` field).
const timeAgo = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
};

// Split a run of plain text on inline `code` spans. Returns a mix of strings and
// <code> templates; Lit escapes the interpolated text, so no HTML injection.
const inlineCode = (text) => {
  const parts = [];
  let last = 0;
  const re = /`([^`\n]+)`/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(html`<code class="code">${m[1]}</code>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

// Render a message body with lightweight Markdown for code only: fenced ```blocks```
// become <pre><code>, inline `spans` become <code>. Everything else stays plain text
// (the .bubble's pre-wrap keeps newlines). Agents routinely reply with code, and a
// raw backtick soup is hard to read; this is the smallest formatting that helps.
const formatBody = (text) => {
  if (typeof text !== "string") return text;
  const parts = [];
  let last = 0;
  const re = /```[^\n]*\n?([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(...inlineCode(text.slice(last, m.index)));
    parts.push(html`<pre class="codeblock"><code>${m[1].replace(/\n$/, "")}</code></pre>`);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(...inlineCode(text.slice(last)));
  return parts;
};

// The agent⇄human conversation: a single-column labeled feed. Each message has
// an "Agent"/"You" label + relative time, then a bubble (agent subtly tinted).
// Read-only — you reply via the box below.
const conversationBlock = (messages) =>
  html`<div class="thread">
    ${messages.map(
      (m) =>
        html`<div class="msg" data-role=${m.role}>
          <div class="msg-meta">
            <span class="msg-who">${m.role === "agent" ? "Agent" : "You"}</span>
            <span class="msg-time">${timeAgo(m.at)}</span>
          </div>
          <div class="bubble">${formatBody(m.content)}</div>
        </div>`,
    )}
  </div>`;

// The compose popup: element title + collapsible source details, an optional
// selected-text quote, then EITHER the comment textarea (fresh annotation) OR
// the conversation + reply box (once the agent has engaged). A pure view of
// compose state — state in, handlers in, no behavior. Any conversation accepts a
// reply; replying to a resolved/dismissed one reopens it (server-side).

// One thumbnail. `onRemove` is supplied for locally-pasted images (adds the ×
// button) and omitted for already-stored images (read-only).
const thumb = (src, onRemove) =>
  html`<div class="thumb">
    <img src=${src} alt="attachment" />
    ${onRemove
      ? html`<button class="thumb-x" aria-label="Remove image" @click=${onRemove}>${icons.close}</button>`
      : null}
  </div>`;

const imageStrip = (thumbs) => (thumbs.length === 0 ? null : html`<div class="attachments">${thumbs}</div>`);

// Locally-pasted screenshots on a new annotation: removable, rendered from their
// data URLs. Stored screenshots: read-only, fetched from the image route (bytes
// are never inlined in the polled JSON).
const attachmentStrip = (attachments, onRemove) =>
  imageStrip(attachments.map((a) => thumb(a.dataUrl, () => onRemove(a.id))));

const storedImageStrip = (annotation) =>
  imageStrip(
    (annotation.images ?? []).map((img) => thumb(`/annotai/api/annotations/${annotation.id}/images/${img.id}`)),
  );

export const popupTemplate = ({
  compose,
  annotation,
  comment,
  attachments,
  dragging,
  replyText,
  detailsOpen,
  popupStyle,
  onToggleDetails,
  onInput,
  onInputKey,
  onPaste,
  onRemoveImage,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onReplyInput,
  onReplyKey,
  onReplySend,
  onCancel,
  onDelete,
  onSubmit,
}) => {
  const info = compose.info;
  const src = info.source_file ? `${info.source_file}:${info.source_line}` : null;
  // Once there's a thread, the original comment becomes the first (human) message
  // of the conversation — you reply instead of editing it. `annotation` is the
  // live (polled) record; `compose.info` is the click-time snapshot.
  const thread = annotation.thread ?? [];
  const isConversation = compose.mode === "edit" && thread.length > 0;
  const canReply = isConversation;
  const messages = isConversation
    ? [{ role: "human", content: annotation.comment ?? "", at: annotation.inserted_at }, ...thread]
    : [];
  return html`<div
    class="popup"
    style=${popupStyle}
    ?data-dragging=${dragging}
    @dragenter=${onDragEnter}
    @dragover=${onDragOver}
    @dragleave=${onDragLeave}
    @drop=${onDrop}
  >
    ${compose.mode === "new" && dragging
      ? html`<div class="dropzone"><span>${icons.plus} Drop image to attach</span></div>`
      : null}
    <div class="hdr" title="More info" @click=${onToggleDetails}>
      <span class="title">${info.element}</span>
      <span class="chev" ?data-open=${detailsOpen}>${icons.chevron}</span>
    </div>
    <div class="details" ?data-open=${detailsOpen}>
      <div class="details-inner">
        <div class="details-pad">
          ${src ? infoRow("Source", src) : null} ${info.component ? infoRow("Component", info.component) : null}
          ${info.element_path ? infoRow("Selector", info.element_path) : null}
          ${info.css_classes ? infoRow("Classes", info.css_classes) : null}
        </div>
      </div>
    </div>
    ${info.selected_text ? html`<div class="quote">${info.selected_text}</div>` : null}
    ${isConversation
      ? conversationBlock(messages)
      : html`<textarea
          placeholder="What should change here? (paste a screenshot to attach)"
          autocomplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-bwignore
          data-form-type="other"
          .value=${comment}
          @input=${onInput}
          @keydown=${onInputKey}
          @paste=${onPaste}
        ></textarea>`}
    ${compose.mode === "new" ? attachmentStrip(attachments, onRemoveImage) : storedImageStrip(annotation)}
    ${canReply
      ? html`<div class="reply">
          <textarea
            placeholder="Reply to the agent…"
            autocomplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-bwignore
            data-form-type="other"
            .value=${replyText}
            @input=${onReplyInput}
            @keydown=${onReplyKey}
          ></textarea>
          <button class="reply-send" aria-label="Send reply" ?disabled=${replyText.trim() === ""} @click=${onReplySend}>
            ${icons.send}
          </button>
        </div>`
      : null}
    <div class="actions">
      ${compose.mode === "edit"
        ? html`<button class="del" title="Delete" @click=${onDelete}>${icons.trash}</button>`
        : null}
      <span class="spacer"></span>
      ${isConversation
        ? html`<button class="ghost" @click=${onCancel}>Close</button>`
        : html`<button class="ghost" @click=${onCancel}>Cancel</button>
            <button class="solid" ?disabled=${comment.trim() === ""} @click=${onSubmit}>
              ${compose.mode === "edit" ? "Save" : "Add"}
            </button>`}
    </div>
  </div>`;
};

export const styles = css`
  .popup {
    position: fixed;
    z-index: 100001;
    width: 288px;
    background: var(--surface);
    color: var(--text);
    border-radius: 16px;
    box-shadow:
      0 6px 28px rgba(0, 0, 0, 0.32),
      var(--surface-edge);
    padding: 12px 14px 14px;
    font-weight: 500;
    transform-origin: top center;
    animation: pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  /* Drop-zone overlay shown while dragging an image over a new-annotation popup. */
  .dropzone {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    border: 2px dashed var(--accent);
    background: color-mix(in srgb, var(--accent) 16%, var(--surface));
    pointer-events: none; /* let the drop land on .popup */
  }
  .dropzone span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--text);
  }
  .dropzone svg {
    width: 16px;
    height: 16px;
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.94) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .hdr {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    user-select: none;
  }
  .title {
    flex: 1;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .chev {
    display: flex;
    align-items: center;
    color: var(--text-mut);
  }
  .hdr:hover .chev {
    color: var(--text-soft);
  }
  .chev svg {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }
  .chev[data-open] svg {
    transform: rotate(180deg);
  }
  .details {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.22s ease;
  }
  .details[data-open] {
    grid-template-rows: 1fr;
  }
  .details-inner {
    overflow: hidden;
    min-height: 0;
  }
  .details-pad {
    padding-bottom: 8px;
  }
  .info-row {
    display: flex;
    gap: 10px;
    font-size: 11px;
    padding: 2px 0;
  }
  .info-row .k {
    color: var(--text-mut);
    width: 62px;
    flex: none;
  }
  .info-row code {
    color: var(--text-soft);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  textarea {
    width: 100%;
    min-height: 60px;
    resize: vertical;
    background: var(--field);
    color: var(--text);
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 13px;
    outline: none;
    box-shadow: var(--well-edge);
    transition: box-shadow 0.15s ease;
  }
  textarea:focus {
    box-shadow:
      inset 0 0 0 1px var(--accent),
      var(--well-edge);
  }
  .attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .thumb {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--field);
  }
  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .thumb-x {
    all: unset;
    position: absolute;
    top: 2px;
    right: 2px;
    box-sizing: border-box;
    width: 15px;
    height: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: #fff;
    background: rgba(0, 0, 0, 0.6);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s ease;
  }
  .thumb-x svg {
    width: 10px;
    height: 10px;
    display: block;
  }
  .thumb:hover .thumb-x {
    opacity: 1;
  }
  .thumb-x:hover {
    background: var(--c-red);
  }
  .quote {
    font: italic 12px/1.45 system-ui;
    color: var(--text-soft);
    background: var(--raised);
    box-shadow: var(--raised-edge);
    border-radius: 8px;
    padding: 6px 9px;
    margin-bottom: 8px;
    max-height: 62px;
    overflow: auto;
    border-left: 2px solid var(--accent);
  }
  .thread {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    /* side padding + matching negative margin: room for the bubble shadows without
       shifting content (overflow-y:auto would otherwise clip them). */
    margin-inline: -8px;
    max-height: 320px;
    overflow-y: auto;
    padding: 1px 8px;
  }
  .msg {
    display: flex;
    flex-direction: column;
  }
  .msg-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 3px 6px;
  }
  .msg-who {
    font-size: 10.5px;
    font-weight: 600;
  }
  .msg[data-role="agent"] .msg-who {
    color: var(--accent);
  }
  .msg[data-role="human"] .msg-who {
    color: var(--text-soft);
  }
  .msg-time {
    font-size: 10px;
    color: var(--text-mut);
  }
  .bubble {
    font-size: 12.5px;
    line-height: 1.42;
    padding: 7px 11px;
    border-radius: 11px;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--raised);
    color: var(--text);
    box-shadow: var(--raised-edge);
  }
  .code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    background: color-mix(in srgb, var(--text) 9%, transparent);
    border-radius: 4px;
    padding: 1px 4px;
    word-break: break-word;
  }
  .codeblock {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.4;
    margin: 6px 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--field);
    box-shadow: var(--well-edge);
    overflow-x: auto;
    white-space: pre;
  }
  .codeblock code {
    background: none;
    padding: 0;
    font-family: inherit; /* the universal * rule sets it on <code>; re-inherit the mono stack */
  }
  .reply {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    margin-top: 10px;
  }
  .reply textarea {
    flex: 1;
    min-width: 0;
    width: auto;
    min-height: 34px;
    max-height: 90px;
    resize: none;
    font-size: 12.5px;
    padding: 7px 9px;
  }
  .reply-send {
    all: unset;
    cursor: pointer;
    flex: none;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--accent);
    color: var(--on-accent);
    border-radius: 8px;
    transition: opacity 0.15s ease;
  }
  .reply-send svg {
    width: 15px;
    height: 15px;
  }
  .reply-send[disabled] {
    opacity: 0.4;
    cursor: default;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
  }
  .del,
  .ghost,
  .solid {
    all: unset;
    cursor: pointer;
    height: 30px;
    display: inline-flex;
    align-items: center;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
  }
  .del {
    color: var(--c-red);
    padding: 0 8px;
  }
  .del svg {
    width: 16px;
    height: 16px;
  }
  .del:hover {
    background: color-mix(in srgb, var(--c-red) 14%, transparent);
  }
  .ghost {
    color: var(--text-soft);
    padding: 0 12px;
  }
  .ghost:hover {
    background: var(--hover);
  }
  .solid {
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 600;
    padding: 0 14px;
  }
  .solid[disabled] {
    opacity: 0.4;
    cursor: default;
  }
  .spacer {
    flex: 1;
  }
`;
