/**
 * src/render — the renderer layer.
 *
 * WebGL2, via three.js `WebGLRenderer`. One backend, on the flat page and in
 * the headset alike. v1 has no WebGPU path: `XRGPUBinding` is not implemented
 * on Quest, WebGL2 was always the shipping answer in-headset, and a second
 * backend for a hypothetical cost more than it bought. See issue #4 and
 * docs/roadmap.md.
 *
 * There is still a seam here, and it is not about swapping backends. It is
 * because #13's outline pass and #15's foveation both reach into renderer
 * internals, and because the moment three.js objects appear above this layer,
 * `src/core/` stops being headless and the "one document, two frontends" claim
 * stops being testable.
 *
 * Belongs here:
 *   - the renderer interface, the frame loop, and its instrumentation
 *   - three.js scene construction, materials, shading (issue #13)
 *   - turning kernel mesh buffers into GPU resources
 *
 * Must NOT appear here:
 *   - document mutation. This layer reads the document and draws it; it does
 *     not edit it. Edits are commands, and commands belong to src/core/.
 *   - three.js or WebGL types leaking out of the module's public surface — if
 *     `WebGLRenderingContext` or a `THREE.*` type appears in an exported
 *     signature, the seam has already failed.
 *   - UI chrome: panels, buttons and outliners are src/ui/.
 *
 * Implemented by issue #4. Placeholder until then.
 */

export const RENDER_LAYER = 'render';
