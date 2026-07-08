import { html } from "lit";

// Brand mark — a UI element outline with a highlighter swiped across it. The
// outline tracks the surrounding text color (currentColor) so it adapts to
// theme/accent; the swipe stays the signature brand yellow.
export const marker = html`<svg viewBox="0 0 64 64" fill="none" role="img">
  <rect x="11" y="11" width="42" height="42" rx="11" fill="none" stroke="currentColor" stroke-width="7" />
  <g transform="rotate(-2.5 32 33)">
    <path
      d="M 5.50,23.06 C 10.34,21.46 20.11,23.27 27.26,23.36 C 34.41,23.46 41.34,23.53 48.38,23.62 C 55.42,23.72 66.60,22.37 69.50,23.93 C 72.40,25.49 67.62,29.92 65.79,33.00 C 63.96,36.08 63.34,40.80 58.50,42.42 C 53.66,44.05 43.89,42.74 36.74,42.76 C 29.59,42.77 22.66,42.49 15.62,42.52 C 8.58,42.56 -2.60,44.57 -5.50,42.98 C -8.40,41.39 -3.62,36.32 -1.79,33.00 C 0.04,29.68 0.66,24.67 5.50,23.06 Z"
      fill="#FFE600"
      fill-opacity="0.82"
    />
  </g>
</svg>`;

// Annotai wordmark. The first five glyphs use currentColor so they adapt to the
// theme; the trailing "ai" sits under the highlighter swipe and stays dark ink
// in both themes for contrast against the yellow.
export const wordmark = html`<svg viewBox="0 0 369.37 93.22" fill="none" role="img" aria-label="Annotai">
  <g transform="rotate(-1.5 323.10 59.35)">
    <path
      d="M 296.62,26.01 C 304.65,20.79 315.47,27.82 324.69,28.05 C 333.91,28.27 342.85,27.20 351.93,27.38 C 361.01,27.56 376.21,23.79 379.17,29.12 C 382.12,34.45 374.60,49.34 369.67,59.35 C 364.73,69.37 357.60,84.07 349.58,89.22 C 341.55,94.38 330.73,89.76 321.51,90.28 C 312.29,90.80 303.35,92.08 294.27,92.33 C 285.19,92.57 269.99,97.23 267.03,91.73 C 264.08,86.24 271.60,70.31 276.53,59.35 C 281.47,48.40 288.60,31.22 296.62,26.01 Z"
      fill="#FFE600"
      fill-opacity="0.92"
    />
  </g>
  <g transform="translate(3.95,85.81) scale(0.108,-0.108)">
    <path
      fill="currentColor"
      d="M196 -13Q144 -13 104.0 7.5Q64 28 41.5 65.5Q19 103 19 151Q19 203 43.5 239.5Q68 276 108.5 295.5Q149 315 198 315Q271 315 317.0 281.5Q363 248 377 183L311 198V309Q311 334 293.0 352.0Q275 370 237 370Q210 370 175.0 363.0Q140 356 101 337L55 452Q99 474 152.0 488.5Q205 503 262 503Q331 503 378.5 478.0Q426 453 450.0 407.5Q474 362 474 300V0H338L307 97L377 119Q362 58 317.5 22.5Q273 -13 196 -13ZM251 97Q279 97 296.0 112.0Q313 127 313 151Q313 174 296.0 189.0Q279 204 251 204Q221 204 204.5 189.0Q188 174 188 151Q188 127 204.5 112.0Q221 97 251 97Z"
    />
    <path
      transform="translate(513,0)"
      fill="currentColor"
      d="M356 503Q405 503 436.0 486.0Q467 469 484.0 440.5Q501 412 507.5 376.0Q514 340 514 301V0H352V282Q352 320 340.0 332.0Q328 344 305 344Q288 344 269.0 337.5Q250 331 231.5 318.5Q213 306 195 289L160 370H210V0H48V490H168L200 389L141 395Q166 423 199.5 447.5Q233 472 272.5 487.5Q312 503 356 503Z"
    />
    <path
      transform="translate(1067,0)"
      fill="currentColor"
      d="M356 503Q405 503 436.0 486.0Q467 469 484.0 440.5Q501 412 507.5 376.0Q514 340 514 301V0H352V282Q352 320 340.0 332.0Q328 344 305 344Q288 344 269.0 337.5Q250 331 231.5 318.5Q213 306 195 289L160 370H210V0H48V490H168L200 389L141 395Q166 423 199.5 447.5Q233 472 272.5 487.5Q312 503 356 503Z"
    />
    <path
      transform="translate(1621,0)"
      fill="currentColor"
      d="M279 -13Q202 -13 144.0 20.0Q86 53 53.0 111.0Q20 169 20 244Q20 320 53.0 378.0Q86 436 144.0 469.5Q202 503 279 503Q357 503 415.5 469.5Q474 436 506.5 378.0Q539 320 539 244Q539 169 506.5 111.0Q474 53 415.5 20.0Q357 -13 279 -13ZM279 145Q321 145 348.0 172.5Q375 200 375 245Q375 290 348.0 317.5Q321 345 279 345Q238 345 211.0 317.5Q184 290 184 245Q184 201 211.0 173.0Q238 145 279 145Z"
    />
    <path
      transform="translate(2181,0)"
      fill="currentColor"
      d="M280 -8Q193 -8 143.5 33.0Q94 74 94 169V484L92 490L126 609H256V213Q256 177 272.5 162.0Q289 147 316 147Q331 147 344.5 150.0Q358 153 367 156V4Q348 -2 327.0 -5.0Q306 -8 280 -8ZM18 340V490H367V340Z"
    />
    <path
      transform="translate(2591,0)"
      fill="#1A1A1A"
      d="M196 -13Q144 -13 104.0 7.5Q64 28 41.5 65.5Q19 103 19 151Q19 203 43.5 239.5Q68 276 108.5 295.5Q149 315 198 315Q271 315 317.0 281.5Q363 248 377 183L311 198V309Q311 334 293.0 352.0Q275 370 237 370Q210 370 175.0 363.0Q140 356 101 337L55 452Q99 474 152.0 488.5Q205 503 262 503Q331 503 378.5 478.0Q426 453 450.0 407.5Q474 362 474 300V0H338L307 97L377 119Q362 58 317.5 22.5Q273 -13 196 -13ZM251 97Q279 97 296.0 112.0Q313 127 313 151Q313 174 296.0 189.0Q279 204 251 204Q221 204 204.5 189.0Q188 174 188 151Q188 127 204.5 112.0Q221 97 251 97Z"
    />
    <path
      transform="translate(3104,0)"
      fill="#1A1A1A"
      d="M212 0H49V490H212ZM37 645Q37 688 63.0 713.5Q89 739 131 739Q174 739 199.0 713.5Q224 688 224 645Q224 604 199.0 578.5Q174 553 131 553Q89 553 63.0 578.5Q37 604 37 645Z"
    />
  </g>
</svg>`;

// sun-02
export const sun = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z" />
  <path
    d="M12 2c-.377.333-.905 1.2 0 2m0 16c.377.333.906 1.2 0 2m7.5-17.497c-.532-.033-1.575.22-1.496 1.495M5.496 17.5c.033.532-.22 1.575-1.496 1.496M5.003 4.5c-.033.532.22 1.576 1.497 1.497M18 17.503c.532-.032 1.575.208 1.496 1.414M22 12c-.333-.377-1.2-.905-2 0m-16-.5c-.333.377-1.2.906-2 0"
  />
</svg>`;

// moon-02
export const moon = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M21.5 14.078A8.557 8.557 0 0 1 9.922 2.5C5.668 3.497 2.5 7.315 2.5 11.873a9.627 9.627 0 0 0 9.627 9.627c4.558 0 8.376-3.168 9.373-7.422"
  />
</svg>`;

// delete-02 — clear all
export const trash = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="m19.5 5.5-.62 10.025c-.158 2.561-.237 3.842-.88 4.763a4 4 0 0 1-1.2 1.128c-.957.584-2.24.584-4.806.584-2.57 0-3.855 0-4.814-.585a4 4 0 0 1-1.2-1.13c-.642-.922-.72-2.205-.874-4.77L4.5 5.5M3 5.5h18m-4.944 0-.683-1.408c-.453-.936-.68-1.403-1.071-1.695a2 2 0 0 0-.275-.172C13.594 2 13.074 2 12.035 2c-1.066 0-1.599 0-2.04.234a2 2 0 0 0-.278.18c-.395.303-.616.788-1.058 1.757L8.053 5.5m1.447 11v-6m5 6v-6"
  />
</svg>`;

// plus-sign — the pending add marker
export const plus = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2.2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 4v16m8-8H4" />
</svg>`;

// cancel-01 — close
export const close = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M18 6 6 18m12 0L6 6" />
</svg>`;

// chevron-down — details toggle
export const chevron = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m6 9 6 6 6-6" />
</svg>`;

// settings-02 — gear
export const gear = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
  <path
    d="M21.011 14.097c.522-.141.783-.212.886-.346.103-.135.103-.351.103-.784v-1.934c0-.433 0-.65-.103-.784s-.364-.205-.886-.345c-1.95-.526-3.171-2.565-2.668-4.503.139-.533.208-.8.142-.956s-.256-.264-.635-.479l-1.725-.98c-.372-.21-.558-.316-.725-.294s-.356.21-.733.587c-1.459 1.455-3.873 1.455-5.333 0-.377-.376-.565-.564-.732-.587-.167-.022-.353.083-.725.295l-1.725.979c-.38.215-.57.323-.635.48-.066.155.003.422.141.955.503 1.938-.718 3.977-2.669 4.503-.522.14-.783.21-.886.345S2 10.6 2 11.033v1.934c0 .433 0 .65.103.784s.364.205.886.346c1.95.526 3.171 2.565 2.668 4.502-.139.533-.208.8-.142.956s.256.264.635.48l1.725.978c.372.212.558.317.725.295s.356-.21.733-.587c1.46-1.457 3.876-1.457 5.336 0 .377.376.565.564.732.587.167.022.353-.083.726-.295l1.724-.979c.38-.215.57-.323.635-.48s-.003-.422-.141-.955c-.504-1.937.716-3.976 2.666-4.502Z"
  />
</svg>`;

// copy-01
export const copy = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path
    d="M9 15c0-2.828 0-4.243.879-5.121C10.757 9 12.172 9 15 9h1c2.828 0 4.243 0 5.121.879C22 10.757 22 12.172 22 15v1c0 2.828 0 4.243-.879 5.121C20.243 22 18.828 22 16 22h-1c-2.828 0-4.243 0-5.121-.879C9 20.243 9 18.828 9 16z"
  />
  <path
    d="M17 9c-.003-2.957-.047-4.489-.908-5.538a4 4 0 0 0-.554-.554C14.43 2 12.788 2 9.5 2c-3.287 0-4.931 0-6.038.908a4 4 0 0 0-.554.554C2 4.57 2 6.212 2 9.5c0 3.287 0 4.931.908 6.038a4 4 0 0 0 .554.554c1.05.86 2.58.906 5.538.908"
  />
</svg>`;

// tick-02 — check
export const check = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m5 14 3.5 3.5L19 6.5" />
</svg>`;

// arrow-up — send a reply
export const send = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.9"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 19V5m0 0-6 6m6-6 6 6" />
</svg>`;

// help-circle — settings field explainer
export const help = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" />
  <path
    d="M9.6 9.6c0-1.326 1.074-2.4 2.4-2.4s2.4 1.074 2.4 2.4c0 .96-.563 1.787-1.376 2.17-.5.235-1.024.59-1.024 1.144V13.5"
  />
  <path d="M12 17h.008" />
</svg>`;

// task-01 — annotations history/progress
export const history = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M14.5 2h-5a1.5 1.5 0 0 0 0 3h5a1.5 1.5 0 0 0 0-3M8 15h3.429M8 11h8" />
  <path
    d="M16 3.5c1.554.047 2.48.22 3.121.862.88.878.88 2.293.88 5.12V16c0 2.828 0 4.242-.88 5.121-.878.879-2.293.879-5.12.879h-4c-2.83 0-4.244 0-5.122-.879S4 18.828 4 16V9.483c0-2.828 0-4.243.879-5.121C5.52 3.72 6.447 3.547 8 3.5"
  />
</svg>`;

// message-01 — human reply count in the history list
export const chat = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8.5 14.5h7m-7-5H12" />
  <path
    d="M14.17 20.89c4.184-.277 7.516-3.657 7.79-7.9.053-.83.053-1.69 0-2.52-.274-4.242-3.606-7.62-7.79-7.899a33 33 0 0 0-4.34 0c-4.184.278-7.516 3.657-7.79 7.9a20 20 0 0 0 0 2.52c.1 1.545.783 2.976 1.588 4.184.467.845.159 1.9-.328 2.823-.35.665-.526.997-.385 1.237.14.24.455.248 1.084.263 1.245.03 2.084-.322 2.75-.813.377-.279.566-.418.696-.434s.387.09.899.3c.46.19.995.307 1.485.34 1.425.094 2.914.094 4.342 0Z"
  />
</svg>`;

// Annotation status icons (hugeicons, stroke-rounded). Colored by the caller.
// clock-01 — pending (waiting on the agent)
export const clock = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="10" />
  <path d="M12 8v4l2 2" />
</svg>`;

// eye — acknowledged (the agent has seen it)
export const eye = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M2 8s4.477-5 10-5 10 5 10 5" />
  <path
    d="M21.544 13.045c.304.426.456.64.456.955 0 .316-.152.529-.456.955C20.178 16.871 16.689 21 12 21c-4.69 0-8.178-4.13-9.544-6.045C2.152 14.529 2 14.315 2 14c0-.316.152-.529.456-.955C3.822 11.129 7.311 7 12 7c4.69 0 8.178 4.13 9.544 6.045Z"
  />
  <path d="M15 14a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z" />
</svg>`;

// checkmark-circle-02 — resolved
export const checkCircle = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10Z" />
  <path d="m8 12.5 2.5 2.5L16 9" />
</svg>`;

// cancel-circle — dismissed
export const xCircle = html`<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10 10-4.477 10-10m-7 3L9 9m0 6 6-6" />
</svg>`;
