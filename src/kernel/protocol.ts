/**
 * The wire between the main thread and the kernel worker.
 *
 * Everything in this file has to survive `postMessage`, which rules out class
 * instances, functions and anything with a prototype worth keeping. That is not
 * a constraint so much as a confirmation: `src/core/` nodes are already
 * immutable plain data referenced by id, so a `NodeBundle` structured-clones
 * for free and the protocol never had to invent a second description of the
 * tree. If a message type here ever needs a method, the design has gone wrong.
 *
 * ## Channels, and why requests are not simply queued
 *
 * Dragging a parameter slider produces evaluation requests faster than the
 * worker completes them. A plain FIFO queue would work through every one of
 * them, so the mesh you see would be several hundred milliseconds behind your
 * hand and getting further behind for as long as you keep dragging.
 *
 * So every request carries a **channel**. Within a channel only the newest
 * request matters: a queued request is discarded the moment a newer one for the
 * same channel arrives, and the client is told so rather than being left
 * waiting for a result that will never come. Two independent previews — a
 * viewport and a wrist-menu thumbnail, say — use two channels and do not
 * supersede each other.
 *
 * `id` is monotonic per client and is what makes "never apply a stale result"
 * checkable: results can only be applied in increasing `id` order per channel,
 * so a slow evaluation that lands after a fast one is dropped rather than
 * painted. Completion order and request order are not the same thing, and the
 * document is the authority on which one counts.
 *
 * ## Mesh layout: interleaved, and transferred rather than copied
 *
 * `vertices` is one interleaved buffer — `[px, py, pz, nx, ny, nz]` per vertex
 * — because that is both what `manifold-3d` hands us and what a renderer wants
 * to upload. De-interleaving into separate position and normal arrays would be
 * a full copy on the worker and another allocation on the main thread, to
 * produce a layout the GPU likes less. #4 wraps these buffers in a
 * `BufferGeometry` with an interleaved attribute and no copy at all.
 *
 * Both buffers are transferred, not cloned. After a `postMessage` the worker's
 * views are detached, which is correct — the worker has no further use for
 * them, and a clone of a multi-megabyte mesh on every drag frame is exactly the
 * cost this whole design exists to avoid.
 */

import type { NodeBundle, NodeId } from '../core/index.js';

/**
 * The default crease threshold, in degrees.
 *
 * Above this angle an edge gets two normals and reads as a machined edge; below
 * it the normal is shared and the surface reads as curved. 30° is under the
 * shallowest angle a tessellated primitive produces at its own default density
 * — a 32-sided cylinder turns 11.25° per facet, a 48-segment torus 7.5° — so
 * every round surface stays smooth, while the 90° edges of a box and every edge
 * a boolean cuts stay sharp. Raising it past ~60° starts rounding off chamfers;
 * lowering it past ~15° facets the cylinders.
 */
export const DEFAULT_CREASE_ANGLE = 30;

/** Floats per vertex in `MeshPayload.vertices`. */
export const VERTEX_STRIDE = 6;
/** Offset, in floats, of the position within a vertex. */
export const POSITION_OFFSET = 0;
/** Offset, in floats, of the normal within a vertex. */
export const NORMAL_OFFSET = 3;

/** Evaluated geometry, in the layout #4 uploads directly. */
export interface MeshPayload {
  /** Interleaved `[px, py, pz, nx, ny, nz]`, `VERTEX_STRIDE` floats per vertex. */
  readonly vertices: Float32Array;
  /** Triangle indices into `vertices`, three per triangle, CCW. */
  readonly indices: Uint32Array;
  readonly stride: typeof VERTEX_STRIDE;
  readonly positionOffset: typeof POSITION_OFFSET;
  readonly normalOffset: typeof NORMAL_OFFSET;
}

/**
 * Something the kernel could not do cleanly, attributed to the node that caused
 * it.
 *
 * A warning is never an exception. `primitives.ts` already repairs degenerate
 * *parameters* before they reach the store, so what arrives here is degenerate
 * *geometry* — a subtraction that removes everything, an intersection of two
 * solids that do not touch, a boolean with one operand. All of those are things
 * a user does on the way to something valid, and throwing would mean the
 * viewport goes blank mid-edit. The UI puts a marker on the node instead.
 */
export type KernelWarningCode =
  'empty-result' | 'degenerate-input' | 'missing-child' | 'unary-boolean' | 'build-failed';

export interface KernelWarning {
  readonly code: KernelWarningCode;
  readonly nodeId: NodeId;
  readonly message: string;
}

/** What the evaluation cost and how much of it the cache absorbed. */
export interface EvaluationStats {
  /** Subtrees built this evaluation — the number the cache did *not* absorb. */
  readonly evaluated: number;
  /** Subtrees served from cache. */
  readonly cached: number;
  /** Live entries in the subtree cache after this evaluation. */
  readonly cacheSize: number;
  readonly triangles: number;
  readonly vertices: number;
  /** Wall-clock milliseconds inside the worker, excluding message transit. */
  readonly durationMs: number;
}

export interface EvaluateRequest {
  readonly type: 'evaluate';
  /** Monotonic per client. Results are applied in this order, not completion order. */
  readonly id: number;
  /** Supersession key — see the channel note in the file header. */
  readonly channel: string;
  /** The subtree to evaluate, as plain data. `CarveDocument.bundle(id)`. */
  readonly bundle: NodeBundle;
  /** Degrees. Defaults to `DEFAULT_CREASE_ANGLE`. */
  readonly creaseAngle?: number;
}

/** Drop anything queued for `channel`. Sent on `transformCancel` and on teardown. */
export interface CancelRequest {
  readonly type: 'cancel';
  readonly channel: string;
}

/** Empty the subtree cache. For tests, and for reclaiming WASM heap on document close. */
export interface ResetRequest {
  readonly type: 'reset';
}

export type KernelRequest = EvaluateRequest | CancelRequest | ResetRequest;

export interface EvaluateResult {
  readonly type: 'result';
  readonly id: number;
  readonly channel: string;
  readonly mesh: MeshPayload;
  readonly stats: EvaluationStats;
  readonly warnings: readonly KernelWarning[];
}

/**
 * A request that was dropped before it ran because a newer one arrived.
 *
 * Reported rather than dropped silently: a caller that awaits a request must be
 * able to settle its promise, and a preview that never resolves is a spinner
 * that never stops. Supersession is the expected outcome of dragging, not an
 * error, so it has its own message rather than a rejection.
 */
export interface SupersededNotice {
  readonly type: 'superseded';
  readonly id: number;
  readonly channel: string;
  /** The request that displaced this one. */
  readonly supersededBy: number;
}

/** The kernel itself failed — a bug here or in `manifold-3d`, not bad user input. */
export interface KernelFailure {
  readonly type: 'error';
  readonly id: number;
  readonly channel: string;
  readonly message: string;
}

export type KernelResponse = EvaluateResult | SupersededNotice | KernelFailure;

/** An empty mesh. What an evaluation with nothing in it produces. */
export function emptyMesh(): MeshPayload {
  return {
    vertices: new Float32Array(0),
    indices: new Uint32Array(0),
    stride: VERTEX_STRIDE,
    positionOffset: POSITION_OFFSET,
    normalOffset: NORMAL_OFFSET,
  };
}

/** The buffers to hand `postMessage` as transferables for a response. */
export function transferablesOf(response: KernelResponse): ArrayBuffer[] {
  if (response.type !== 'result') return [];
  return [
    response.mesh.vertices.buffer as ArrayBuffer,
    response.mesh.indices.buffer as ArrayBuffer,
  ];
}
