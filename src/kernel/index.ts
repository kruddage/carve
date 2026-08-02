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
 *   - three.js geometry/material objects: this layer emits plain buffers, and
 *     the renderer decides what to wrap them in. That is what lets the kernel
 *     be tested in Node with no GPU anywhere in sight.
 *   - DOM access. A Worker has no `document`, and the kernel must stay
 *     runnable headlessly under Vitest.
 *
 * ## Where to start reading (issue #6)
 *
 *   `runtime.ts`   loading manifold-3d, and why it is the single-threaded build
 *   `solids.ts`    primitive parameters → manifold solids, and the Z-up→Y-up seam
 *   `hash.ts`      the subtree fingerprint the whole cache rests on
 *   `evaluate.ts`  the tree walk, the cache, and WASM memory ownership
 *   `driver.ts`    which request runs and which is abandoned
 *   `client.ts`    the main-thread handle, and the never-apply-a-stale-result rule
 *   `protocol.ts`  the wire between the two
 *   `worker.ts`    the entry point, which is only wiring
 *
 * Design notes, including the drag-preview strategy and the measured timings:
 * `docs/kernel.md` and `docs/perf.md`.
 *
 * ## The one thing to understand before changing anything here
 *
 * **The kernel is never in the critical path of a frame.** Dragging a primitive
 * that is an operand of a boolean re-solves that boolean, and everything above
 * it, on every pose. So evaluation during a gesture is fire-and-forget: the
 * renderer draws the most recent completed result and does not wait for the
 * next one, the dragged solid renders as a translucent ghost at its live
 * transform over the stale result, and re-evaluation runs at whatever rate the
 * worker sustains. 30Hz on a small tree and 3Hz on a large one are both fine.
 * A dropped frame is not.
 *
 * A worked example — evaluate a document, then drag one leaf:
 *
 * ```ts
 * const kernel = spawnKernel();                 // from './spawn.js', app only
 * kernel.subscribe(({ mesh }) => renderer.upload(mesh));
 *
 * await kernel.request(doc.bundle());           // first full evaluation
 *
 * const drag = doc.beginGesture('grab');
 * for (const pose of posesThisFrame) {
 *   drag.dispatch(setTransform(nodeId, pose));
 *   void kernel.request(doc.bundle());          // fire and forget; most are superseded
 * }
 * drag.commit();
 * await kernel.request(doc.bundle());           // the result that lands in the document
 * ```
 *
 * `spawn.ts` is deliberately not re-exported below: it imports a Vite-specific
 * `?worker` module that has no meaning in Node, and re-exporting it here would
 * make this whole layer un-importable from a test.
 */

export const KERNEL_LAYER = 'kernel';

export {
  DEFAULT_CREASE_ANGLE,
  NORMAL_OFFSET,
  POSITION_OFFSET,
  VERTEX_STRIDE,
  emptyMesh,
  transferablesOf,
  type CancelRequest,
  type EvaluateRequest,
  type EvaluateResult,
  type EvaluationStats,
  type KernelFailure,
  type KernelRequest,
  type KernelResponse,
  type KernelWarning,
  type KernelWarningCode,
  type MeshPayload,
  type ResetRequest,
  type SupersededNotice,
} from './protocol.js';

export { nodeLookup, subtreeHash, type NodeLookup } from './hash.js';

export { buildSolid, toManifoldMatrix, toManifoldVec3, type Solid } from './solids.js';

export { loadManifold, resetManifoldForTesting } from './runtime.js';

export { Evaluator, type EvaluationOutcome, type EvaluatorOptions } from './evaluate.js';

export { KernelDriver, type DriverHandlers, type Job, type JobOutcome } from './driver.js';

export {
  DEFAULT_CHANNEL,
  KernelClient,
  type EvaluatedMesh,
  type KernelPort,
  type MeshListener,
  type RequestOptions,
} from './client.js';
