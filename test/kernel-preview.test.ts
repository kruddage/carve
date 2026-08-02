/**
 * Thumbnail geometry: `7b`'s preview meshes, and the wire that carries them.
 *
 * Two halves, and the second is the one that is easy to get wrong.
 *
 * **The mesh.** A preview is the same solid the document would get, framed to a
 * fixed size and built at a lower density. So the assertions are mostly about
 * what framing must *not* change: proportions, the origin the shape is centred
 * on, and the true dimensions, which travel alongside the mesh rather than in
 * it. The one place a preview is allowed to differ from an evaluation is
 * triangle count — and with framing off and the same tier, it is asserted
 * byte-identical, because a thumbnail that disagreed with the viewport about
 * where an edge is sharp would be a second opinion about what a torus is.
 *
 * **The routing.** Preview results share the request queue, the channel rule
 * and the staleness gate with evaluation, and must not share the renderer's
 * subscription: a mesh listener is the viewport, and handing it a palette entry
 * would draw a thumbnail as though it were the part. That is asserted end to
 * end here — a real `KernelClient` over a real `KernelDriver`, wired the way
 * `worker.ts` wires them, with no `Worker` anywhere.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  PRIMITIVE_KINDS,
  applyTessellationQuality,
  getPrimitive,
  spawnPrimitive,
  type PrimitiveKind,
} from '../src/core/index.js';
import {
  DEFAULT_CHANNEL,
  Evaluator,
  KernelClient,
  KernelDriver,
  PREVIEW_CHANNEL,
  PREVIEW_FIT_SIZE,
  buildPreview,
  transferablesOf,
  type EvaluatedMesh,
  type Job,
  type JobOutcome,
  type KernelPort,
  type KernelRequest,
  type KernelResponse,
  type PreviewSpec,
  type PrimitivePreview,
} from '../src/kernel/index.js';

import {
  bounds,
  openEdges,
  sharedManifold,
  triangleCount,
  volume,
  type Bounds,
} from './support/kernel-fixture.js';

let api: Awaited<ReturnType<typeof sharedManifold>>;

beforeAll(async () => {
  api = await sharedManifold();
});

function extent(box: Bounds, axis: number): number {
  return (box.max[axis] ?? 0) - (box.min[axis] ?? 0);
}

function longestExtent(box: Bounds): number {
  return Math.max(extent(box, 0), extent(box, 1), extent(box, 2));
}

function preview(kind: PrimitiveKind, spec: Omit<PreviewSpec, 'kind'> = {}): PrimitivePreview {
  return buildPreview(api, { kind, ...spec });
}

/** A promise the test opens by hand. The worker's WASM startup, controllably. */
function openable(): { ready: Promise<void>; open: () => void } {
  let open = (): void => {};
  const ready = new Promise<void>((resolve) => {
    open = resolve;
  });
  return { ready, open };
}

/** A preview that was not superseded, or a failure that names what happened. */
function required(result: PrimitivePreview | null): PrimitivePreview {
  if (!result) throw new Error('the preview was superseded, which this test did not ask for');
  return result;
}

describe('every primitive has a preview', () => {
  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} previews to a closed, non-empty solid`, () => {
      const { mesh } = preview(kind);
      expect(triangleCount(mesh)).toBeGreaterThan(0);
      expect(openEdges(mesh)).toEqual([]);
      // Positive volume is winding: a thumbnail whose triangles came out
      // inside-out renders as a hole in the menu and looks like a missing icon.
      expect(volume(mesh)).toBeGreaterThan(0);
    });
  }

  it('covers the registry with no list of its own', () => {
    // The same done-when `primitives.test.ts` guards for the palettes: the
    // preview builder must work from the registry, so a seventh primitive is
    // previewable the day it is defined.
    expect(PRIMITIVE_KINDS.map((kind) => preview(kind).kind)).toEqual([...PRIMITIVE_KINDS]);
  });
});

describe('framing', () => {
  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} fits the same box as every other primitive`, () => {
      // The point of framing: a 60mm box and a 108mm torus arrive in a menu
      // cell at the same apparent size, without the cell measuring either.
      expect(longestExtent(bounds(preview(kind).mesh))).toBeCloseTo(PREVIEW_FIT_SIZE, 4);
    });

    it(`${kind} keeps its proportions and its centre`, () => {
      const framed = preview(kind);
      const framedBox = bounds(framed.mesh);
      const trueLongest = Math.max(
        framed.bounds.max[0] - framed.bounds.min[0],
        framed.bounds.max[1] - framed.bounds.min[1],
        framed.bounds.max[2] - framed.bounds.min[2],
      );

      for (let axis = 0; axis < 3; axis += 1) {
        const trueExtent = (framed.bounds.max[axis] ?? 0) - (framed.bounds.min[axis] ?? 0);
        // One factor for all three axes. Per-axis scaling would fill the cell
        // exactly and turn a disc into a sphere on the way.
        expect(extent(framedBox, axis)).toBeCloseTo(
          (trueExtent / trueLongest) * PREVIEW_FIT_SIZE,
          4,
        );
        // Still centred on its own origin, because scaling about the origin
        // preserves what `primitives.ts` promises and nothing here re-centres.
        expect((framedBox.min[axis] ?? 0) + (framedBox.max[axis] ?? 0)).toBeCloseTo(0, 4);
      }
    });
  }

  it('reports the true size, which the framed mesh no longer carries', () => {
    // A palette labelling an entry "60 mm" reads this, not the mesh.
    const box = preview('box');
    expect(box.bounds.min).toEqual([-0.03, -0.03, -0.03]);
    expect(box.bounds.max).toEqual([0.03, 0.03, 0.03]);
    expect(box.scale).toBeCloseTo(PREVIEW_FIT_SIZE / 0.06, 6);
  });

  it('scales to whatever size the caller asks for', () => {
    const framed = preview('sphere', { fit: 0.25 });
    expect(longestExtent(bounds(framed.mesh))).toBeCloseTo(0.25, 5);
  });

  it('leaves the solid at true scale when framing is off', () => {
    const trueScale = preview('torus', { fit: 0 });
    expect(trueScale.scale).toBe(1);
    // 60mm major radius plus a 12mm tube, as the registry defaults describe it.
    expect(longestExtent(bounds(trueScale.mesh))).toBeCloseTo(0.108, 5);
  });
});

describe('a preview is not a second opinion about the shape', () => {
  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} at true scale is byte-identical to the evaluated solid`, () => {
      // The strongest form of "one construction path": with framing off and the
      // same tier, the preview builder and the document evaluator produce the
      // same buffers, not merely the same measurements. Anything less means a
      // thumbnail could crease differently from the viewport.
      const node = spawnPrimitive(kind, { quality: 'draft' });
      const evaluated = new Evaluator(api).evaluate({ rootId: node.id, nodes: [node] }).mesh;
      const previewed = preview(kind, { fit: 0 }).mesh;

      expect([...previewed.vertices]).toEqual([...evaluated.vertices]);
      expect([...previewed.indices]).toEqual([...evaluated.indices]);
    });
  }

  it('returns the normalized parameters it actually built from', () => {
    // Not the ones it was handed: a thumbnail that says 32 sides and draws 16
    // is how a density bug survives to the headset.
    for (const kind of PRIMITIVE_KINDS) {
      expect(preview(kind).params).toEqual(applyTessellationQuality(kind, {}, 'draft'));
    }
    expect(preview('cylinder', { params: { radius: 0.02 } }).params).toMatchObject({
      radius: 0.02,
    });
  });

  it('repairs degenerate parameters rather than throwing, as the evaluator does', () => {
    // `normalizeParameters` is the single funnel and `buildSolid` runs it, so a
    // menu that binds a slider straight to a preview cannot crash the worker.
    const repaired = preview('torus', { params: { majorRadius: 0.01, minorRadius: 0.5 } });
    expect(triangleCount(repaired.mesh)).toBeGreaterThan(0);
    expect(volume(repaired.mesh)).toBeGreaterThan(0);
  });
});

describe('previews are deterministic and cheap', () => {
  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} builds byte-identically twice`, () => {
      const first = preview(kind);
      const second = preview(kind);
      expect([...second.mesh.vertices]).toEqual([...first.mesh.vertices]);
      expect([...second.mesh.indices]).toEqual([...first.mesh.indices]);
    });
  }

  it('defaults to draft density, and honours a tier that asks for more', () => {
    for (const kind of PRIMITIVE_KINDS) {
      const draft = triangleCount(preview(kind).mesh);
      const fine = triangleCount(preview(kind, { quality: 'fine' }).mesh);
      const tessellated = getPrimitive(kind).parameters.some((parameter) => parameter.tessellation);
      // Registry-driven: a box has no segment count, so its two tiers agree.
      if (tessellated) expect(draft).toBeLessThan(fine);
      else expect(draft).toBe(fine);
    }
  });

  it('leaves nothing behind in the evaluator, because it never goes near it', () => {
    // Six thumbnails re-requested on every parameter drag would evict live
    // document subtrees if they shared the cache. They do not share it.
    const evaluator = new Evaluator(api);
    const node = spawnPrimitive('box');
    evaluator.evaluate({ rootId: node.id, nodes: [node] });
    const before = evaluator.cacheSize;
    for (const kind of PRIMITIVE_KINDS) preview(kind);
    expect(evaluator.cacheSize).toBe(before);
  });
});

// --- Over the wire ----------------------------------------------------------

/**
 * A `KernelPort` wired to a real driver, the way `worker.ts` wires one.
 *
 * `worker.ts` itself cannot be imported here — it reaches for a
 * `DedicatedWorkerGlobalScope` — so the routing it performs is reproduced,
 * which is the part worth asserting: which message type a preview comes back
 * as, and who is allowed to see it.
 */
function loopbackPort(options: { ready?: Promise<unknown> } = {}): KernelPort {
  let handler: ((event: { data: KernelResponse }) => void) | null = null;
  const evaluator = new Evaluator(api);

  const post = (response: KernelResponse): void => {
    handler?.({ data: response });
  };

  const driver = new KernelDriver({
    // The worker's real startup gate. Passing an unresolved one lets a test
    // hold requests in the queue, which is the only state in which anything can
    // be superseded — `run` here is synchronous, so an unheld driver finishes
    // every job inside `submit`.
    ...(options.ready === undefined ? {} : { ready: options.ready }),
    run: (job: Job): JobOutcome =>
      job.type === 'preview'
        ? { type: 'preview', preview: buildPreview(api, job) }
        : { type: 'evaluate', ...evaluator.evaluate(job.bundle, job.creaseAngle) },
    onResult: (job, outcome) => {
      post(
        outcome.type === 'preview'
          ? { type: 'preview-result', id: job.id, channel: job.channel, preview: outcome.preview }
          : {
              type: 'result',
              id: job.id,
              channel: job.channel,
              mesh: outcome.mesh,
              stats: outcome.stats,
              warnings: outcome.warnings,
            },
      );
    },
    onSuperseded: (job, supersededBy) => {
      post({ type: 'superseded', id: job.id, channel: job.channel, supersededBy });
    },
    onError: (job, error) => {
      post({
        type: 'error',
        id: job.id,
        channel: job.channel,
        message: error instanceof Error ? error.message : String(error),
      });
    },
  });

  return {
    postMessage(message: KernelRequest): void {
      switch (message.type) {
        case 'evaluate':
        case 'preview':
          driver.submit(message);
          return;
        case 'cancel':
          driver.cancel(message.channel);
          return;
        case 'reset':
          driver.cancelAll();
          evaluator.reset();
          return;
      }
    },
    set onmessage(next: ((event: { data: KernelResponse }) => void) | null) {
      handler = next;
    },
    terminate(): void {
      handler = null;
    },
  };
}

describe('previews over the kernel protocol', () => {
  it('resolves with the preview the caller asked for', async () => {
    const client = new KernelClient(loopbackPort());
    const result = required(await client.requestPreview({ kind: 'cone' }));

    expect(result.kind).toBe('cone');
    expect(triangleCount(result.mesh)).toBeGreaterThan(0);
    expect(longestExtent(bounds(result.mesh))).toBeCloseTo(PREVIEW_FIT_SIZE, 4);
    client.terminate();
  });

  it('transfers the preview’s buffers rather than cloning them', () => {
    // The same rule evaluation follows, and it has to be stated for this
    // message too: a thumbnail is small, but six of them per parameter drag is
    // not, and a clone would be paid on the worker and again on the main thread.
    const posted = transferablesOf({
      type: 'preview-result',
      id: 1,
      channel: PREVIEW_CHANNEL,
      preview: preview('box'),
    });
    expect(posted).toHaveLength(2);
  });

  it('never reaches the renderer’s subscription', async () => {
    // The reason `preview-result` is its own message. A subscriber is the
    // viewport, and a thumbnail arriving there would be drawn as the document.
    const client = new KernelClient(loopbackPort());
    const drawn: EvaluatedMesh[] = [];
    client.subscribe((mesh) => drawn.push(mesh));

    const node = spawnPrimitive('box');
    await client.requestPreview({ kind: 'sphere' });
    await client.request({ rootId: node.id, nodes: [node] });

    expect(drawn.map((mesh) => mesh.channel)).toEqual([DEFAULT_CHANNEL]);
    client.terminate();
  });

  it('defaults to a channel of its own, so a palette cannot displace the viewport', async () => {
    const client = new KernelClient(loopbackPort());
    const node = spawnPrimitive('box');

    const [evaluated, thumbnail] = await Promise.all([
      client.request({ rootId: node.id, nodes: [node] }),
      client.requestPreview({ kind: 'wedge' }),
    ]);

    // Both survive. On one channel the second would have superseded the first.
    expect(evaluated?.channel).toBe(DEFAULT_CHANNEL);
    expect(thumbnail?.kind).toBe('wedge');
    client.terminate();
  });

  it('gives every primitive its own channel, so a whole palette can be asked for at once', async () => {
    // The menu's actual usage, and the reason the default channel is per kind:
    // on one shared channel five of these six would supersede each other before
    // running, and a palette would come back with one thumbnail and five gaps.
    const gate = openable();
    const client = new KernelClient(loopbackPort({ ready: gate.ready }));

    const all = Promise.all(PRIMITIVE_KINDS.map((kind) => client.requestPreview({ kind })));
    gate.open();

    expect((await all).map((result) => required(result).kind)).toEqual([...PRIMITIVE_KINDS]);
    client.terminate();
  });

  it('supersedes an older preview on the same channel rather than queueing it', async () => {
    // Held at the startup gate so both requests are in the queue at once —
    // which is also the real burst this handles, a menu opening while WASM is
    // still instantiating.
    const gate = openable();
    const client = new KernelClient(loopbackPort({ ready: gate.ready }));

    const stale = client.requestPreview({ kind: 'torus', params: { majorRadius: 0.05 } });
    const fresh = client.requestPreview({ kind: 'torus', params: { majorRadius: 0.07 } });
    gate.open();

    // A parameter dragged through a menu: only the newest question is worth an
    // answer, and the older one settles rather than hanging a spinner forever.
    await expect(stale).resolves.toBeNull();
    expect(required(await fresh).params).toMatchObject({ majorRadius: 0.07 });
    client.terminate();
  });

  it('settles outstanding previews on terminate', async () => {
    const gate = openable();
    const client = new KernelClient(loopbackPort({ ready: gate.ready }));
    const pending = client.requestPreview({ kind: 'box' }, { channel: PREVIEW_CHANNEL });

    // A menu closed, or a document closed, while a thumbnail was still being
    // built. Resolving `null` rather than rejecting, for the same reason
    // supersession does: neither is an error worth a `.catch` at every call.
    client.terminate();
    await expect(pending).resolves.toBeNull();
    gate.open();
  });
});
