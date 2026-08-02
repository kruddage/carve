/**
 * src/kernel — the CSG kernel, running in a Web Worker.
 *
 * Wraps `manifold-3d` (WASM) and turns a document subtree into evaluated,
 * manifold-guaranteed mesh geometry. It lives off the main thread because a
 * boolean evaluation that blocks the frame loop is a dropped frame, and on a
 * headset a dropped frame is felt rather than seen.
 *
 * Belongs here:
 *   - the worker entry point and its message protocol (structured-cloneable,
 *     transferables for the big buffers)
 *   - manifold-3d setup, boolean evaluation, subtree caching
 *   - mesh output as plain typed arrays — positions, normals, indices
 *
 * Must NOT appear here:
 *   - imports from src/render/, src/input/, src/ui/ or src/xr/ — enforced by
 *     ESLint, see eslint.config.js and test/import-boundary.test.ts
 *   - three.js geometry/material objects: this layer emits buffers, and the
 *     renderer decides what to wrap them in. That is what makes the WebGL2 ↔
 *     WebGPU backend swap in issue #4 a swap rather than a rewrite.
 *   - DOM access. A Worker has no `document`, and the kernel must stay
 *     runnable headlessly under Vitest.
 *
 * Implemented by issue #6. Placeholder until then; no manifold dependency yet.
 */

export const KERNEL_LAYER = 'kernel';
