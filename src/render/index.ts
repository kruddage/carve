/**
 * src/render — the renderer abstraction and its backends.
 *
 * One interface, two backends: three.js `WebGPURenderer` where WebGPU is
 * available, WebGL2 where it is not. Quest immersive sessions are WebGL2 today
 * and should flip to WebGPU when Meta ships `XRGPUBinding`, with no change
 * above this layer — which only holds if nothing above this layer knows which
 * backend it got.
 *
 * Belongs here:
 *   - the backend-agnostic renderer interface and capability detection
 *   - three.js scene construction, materials, shading (issue #13)
 *   - turning kernel mesh buffers into GPU resources
 *   - the frame loop and its instrumentation
 *
 * Must NOT appear here:
 *   - document mutation. This layer reads the document and draws it; it does
 *     not edit it. Edits are commands, and commands belong to src/core/.
 *   - backend-specific types leaking out of the module's public surface —
 *     if `WebGPUDevice` or `WebGLRenderingContext` appears in an exported
 *     signature, the abstraction has already failed.
 *   - UI chrome: panels, buttons and outliners are src/ui/.
 *
 * Implemented by issue #4. Placeholder until then.
 */

export const RENDER_LAYER = 'render';
