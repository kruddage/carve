/**
 * The main thread's handle on the kernel worker.
 *
 * Two jobs, and the second one is the one that matters:
 *
 *  1. turn a document subtree into a request and a result into a mesh
 *  2. **guarantee a stale result is never applied**
 *
 * ## Why (2) is not automatic
 *
 * `driver.ts` already throws away superseded requests before they run, so most
 * staleness never happens. What it cannot prevent is the case where two
 * requests both run and finish out of order — a small edit submitted after a
 * large one, on a different channel or across a cache boundary, completes
 * first. The mesh that lands last is then the mesh that was asked for first,
 * and the viewport shows the previous shape with no error anywhere to explain
 * it. Requests are ordered; completions are not; the document is the authority
 * on which of the two counts.
 *
 * So every request carries a monotonic `id`, and a result is applied only if
 * its id exceeds the highest already applied *on that channel*. Per channel and
 * not globally, because two independent previews progress independently and a
 * global watermark would have a fast thumbnail silently suppress a slow
 * viewport.
 *
 * That check is here, on the main thread, rather than in the worker. It has to
 * be: the worker cannot know what the renderer has already drawn, and this is
 * the last point before a mesh becomes pixels.
 *
 * ## Fire-and-forget during a gesture
 *
 * Nothing here blocks a frame. `request()` returns a promise, but the drag path
 * in #9 and #11 is expected to ignore it: submit on every pose, draw the
 * translucent ghost at the live transform, and let whatever result arrives
 * replace the stale mesh whenever it does. The promise exists for the paths
 * that genuinely need to await a specific mesh — export in #14a, a thumbnail in
 * #12 — and for tests.
 *
 * A superseded request resolves to `null` rather than rejecting. Supersession
 * is the *expected* outcome of dragging, and a rejection would mean every drag
 * frame produced an unhandled promise rejection unless every caller wrote a
 * `.catch` it does not otherwise need.
 *
 * ## Port, not Worker
 *
 * The constructor takes a `KernelPort` — `postMessage`, an `onmessage` hook,
 * `terminate` — rather than a `Worker`. `Worker` is a DOM API, `src/kernel/` is
 * headless by contract, and the scheduling rules above are exactly the part
 * worth testing in Node with no worker anywhere. `spawn.ts` is the one file
 * that knows how to build a real one.
 */

import type { NodeBundle, NodeId, PrimitiveKind } from '../core/index.js';

import {
  type EvaluationStats,
  type KernelRequest,
  type KernelResponse,
  type KernelWarning,
  type MeshPayload,
  type PreviewSpec,
  type PrimitivePreview,
} from './protocol.js';

/**
 * The shape of a `Worker` this client needs, and nothing more.
 *
 * `postMessage`'s transfer list is accepted but unused in this direction —
 * requests are small plain objects. It is in the signature because a real
 * `Worker` has it and structural typing would otherwise reject one.
 */
export interface KernelPort {
  postMessage(message: KernelRequest, transfer?: Transferable[]): void;
  set onmessage(handler: ((event: { data: KernelResponse }) => void) | null);
  terminate(): void;
}

/** The default channel — one viewport, one preview, one document. */
export const DEFAULT_CHANNEL = 'main';

/** The channel prefix thumbnails use, so a palette never displaces the viewport. */
export const PREVIEW_CHANNEL = 'preview';

/**
 * The default channel for a preview of `kind` — one per primitive.
 *
 * Not one channel for all thumbnails, which is the mistake this exists to
 * prevent: a menu asks for six previews in one pass, and on a single channel
 * five of them would supersede each other before running and come back `null`.
 * Per kind, the supersession that remains is the one that is wanted — dragging
 * a parameter re-requests that shape's thumbnail and abandons its own older
 * request, while its five neighbours are untouched.
 */
export function previewChannel(kind: PrimitiveKind): string {
  return `${PREVIEW_CHANNEL}:${kind}`;
}

export interface EvaluatedMesh {
  readonly channel: string;
  readonly requestId: number;
  readonly rootId: NodeId;
  readonly mesh: MeshPayload;
  readonly warnings: readonly KernelWarning[];
  readonly stats: EvaluationStats;
}

export interface RequestOptions {
  readonly channel?: string;
  /** Degrees. Defaults to the kernel's own `DEFAULT_CREASE_ANGLE`. */
  readonly creaseAngle?: number;
}

/** Where to send a preview request. Everything else about it is in the spec. */
export interface PreviewRequestOptions {
  /**
   * Defaults to `previewChannel(kind)`, which is deliberately not the
   * viewport's: a palette rebuilding its thumbnails must not displace the
   * evaluation the scene is waiting for, and the two have no reason to
   * supersede each other.
   */
  readonly channel?: string;
}

/** Notified whenever a fresher mesh arrives. The renderer's subscription. */
export type MeshListener = (mesh: EvaluatedMesh) => void;

/**
 * An outstanding request, tagged by what it asked for.
 *
 * The tag is what keeps a preview out of the renderer's subscription: both
 * kinds of result run the same staleness gate, and only an evaluation reaches
 * the mesh listeners.
 */
type Inflight =
  | {
      readonly type: 'evaluate';
      readonly channel: string;
      readonly rootId: NodeId;
      readonly settle: (mesh: EvaluatedMesh | null) => void;
      readonly fail: (error: Error) => void;
    }
  | {
      readonly type: 'preview';
      readonly channel: string;
      readonly settle: (preview: PrimitivePreview | null) => void;
      readonly fail: (error: Error) => void;
    };

export class KernelClient {
  readonly #port: KernelPort;
  readonly #inflight = new Map<number, Inflight>();
  readonly #listeners = new Set<MeshListener>();
  /** Highest request id already applied, per channel. See the staleness note. */
  readonly #applied = new Map<string, number>();
  #nextId = 1;
  #terminated = false;

  constructor(port: KernelPort) {
    this.#port = port;
    this.#port.onmessage = (event) => {
      this.#receive(event.data);
    };
  }

  /**
   * Ask for a mesh.
   *
   * Resolves with the mesh, or with `null` if a newer request for the same
   * channel displaced this one — see the note on supersession above. Rejects
   * only when the kernel itself failed, which is a bug rather than a modelling
   * problem; degenerate geometry comes back as warnings on a resolved mesh.
   */
  request(bundle: NodeBundle, options: RequestOptions = {}): Promise<EvaluatedMesh | null> {
    if (this.#terminated) {
      return Promise.reject(new Error('This kernel client has been terminated'));
    }

    const id = this.#nextId++;
    const channel = options.channel ?? DEFAULT_CHANNEL;

    return new Promise<EvaluatedMesh | null>((resolve, reject) => {
      this.#inflight.set(id, {
        type: 'evaluate',
        channel,
        rootId: bundle.rootId,
        settle: resolve,
        fail: reject,
      });
      this.#port.postMessage({
        type: 'evaluate',
        id,
        channel,
        bundle,
        ...(options.creaseAngle === undefined ? {} : { creaseAngle: options.creaseAngle }),
      });
    });
  }

  /**
   * Ask for a thumbnail of one primitive.
   *
   * The palette's and the wrist menu's path (#9, #12): a mesh for a shape that
   * is not in the document, framed to a fixed size so a cell can draw it
   * without measuring it first. Resolves to `null` on the same terms as
   * `request` — a newer preview on the same channel displaced this one.
   *
   * Preview results never reach the mesh listeners. A subscriber is the
   * renderer drawing the document, and handing it a thumbnail would put a
   * palette entry on screen as though it were the part.
   */
  requestPreview(
    spec: PreviewSpec,
    options: PreviewRequestOptions = {},
  ): Promise<PrimitivePreview | null> {
    if (this.#terminated) {
      return Promise.reject(new Error('This kernel client has been terminated'));
    }

    const id = this.#nextId++;
    const channel = options.channel ?? previewChannel(spec.kind);

    return new Promise<PrimitivePreview | null>((resolve, reject) => {
      this.#inflight.set(id, { type: 'preview', channel, settle: resolve, fail: reject });
      this.#port.postMessage({ type: 'preview', id, channel, ...spec });
    });
  }

  /**
   * Withdraw whatever is queued for `channel`.
   *
   * `transformCancel`'s path. A job already running still finishes — see
   * `driver.ts` — but its result is refused here by the watermark, so the
   * pre-gesture mesh is what stays on screen.
   */
  cancel(channel = DEFAULT_CHANNEL): void {
    if (this.#terminated) return;
    this.#port.postMessage({ type: 'cancel', channel });
  }

  /** Empty the worker's subtree cache. Document close, and tests. */
  reset(): void {
    if (this.#terminated) return;
    this.#port.postMessage({ type: 'reset' });
  }

  /** Subscribe to fresher meshes. Returns an unsubscribe function. */
  subscribe(listener: MeshListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Tear down the worker and settle everything outstanding.
   *
   * In-flight requests resolve to `null` rather than rejecting, for the same
   * reason supersession does: a drag interrupted by a document close should not
   * produce a page full of unhandled rejections.
   */
  terminate(): void {
    if (this.#terminated) return;
    this.#terminated = true;
    for (const inflight of this.#inflight.values()) inflight.settle(null);
    this.#inflight.clear();
    this.#listeners.clear();
    this.#port.onmessage = null;
    this.#port.terminate();
  }

  #receive(response: KernelResponse): void {
    const inflight = this.#inflight.get(response.id);
    this.#inflight.delete(response.id);

    if (response.type === 'error') {
      inflight?.fail(new Error(response.message));
      return;
    }

    if (response.type === 'superseded') {
      inflight?.settle(null);
      return;
    }

    // The staleness gate. A result whose request predates one already applied
    // is a picture of a document state the user has moved past, and drawing it
    // would be a visible regression with nothing to attribute it to.
    const applied = this.#applied.get(response.channel) ?? 0;
    if (response.id <= applied) {
      inflight?.settle(null);
      return;
    }
    this.#applied.set(response.channel, response.id);

    if (response.type === 'preview-result') {
      // The type check is not defensive noise: a `preview-result` answering an
      // `evaluate` would be a worker bug, and settling `null` keeps a caller
      // from waiting forever on a promise nothing else will resolve.
      if (inflight?.type === 'preview') inflight.settle(response.preview);
      else inflight?.settle(null);
      return;
    }

    const mesh: EvaluatedMesh = {
      channel: response.channel,
      requestId: response.id,
      // `rootId` is not on the wire — it is the caller's own bundle root, and
      // round-tripping it would let a worker bug rename what the main thread
      // thinks it asked about.
      rootId: inflight?.type === 'evaluate' ? inflight.rootId : '',
      mesh: response.mesh,
      warnings: response.warnings,
      stats: response.stats,
    };

    if (inflight?.type === 'evaluate') inflight.settle(mesh);
    else inflight?.settle(null);
    for (const listener of this.#listeners) listener(mesh);
  }
}
