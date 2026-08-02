/**
 * Scheduling: which request runs, which is abandoned, and which result is
 * allowed to reach the screen.
 *
 * These are the two done-whens in #6 that are not about geometry — "rapid
 * parameter dragging stays responsive and never applies a stale result", and
 * "a deliberately oversized tree still holds frame rate while dragging, with
 * the preview visibly lagging". Both are properties of `driver.ts` and
 * `client.ts` and neither needs `manifold-3d`, a `Worker`, or a GPU to check.
 * That separation is deliberate: the rules that decide whether dragging feels
 * connected are the ones most worth having a fast, deterministic test for.
 *
 * ## Fake work, real timing semantics
 *
 * The evaluator is replaced with a function that records what it was asked to
 * do and returns immediately. What is being tested is not how long a boolean
 * takes — it is that a request that arrives during one is allowed to displace
 * whatever is queued behind it, and that completion order does not decide what
 * gets drawn. Substituting a real boolean would make these tests slower,
 * machine-dependent, and no more meaningful.
 *
 * The driver's yield point is injected for the same reason. In production it is
 * `setTimeout(0)`, which is what lets queued `message` events be delivered
 * between jobs; here it is an awaitable the test controls, so "a newer request
 * arrives mid-drag" is a deterministic sequence rather than a race.
 */

import { describe, expect, it, vi } from 'vitest';

import { spawnPrimitive, type NodeBundle } from '../src/core/index.js';
import {
  DEFAULT_CHANNEL,
  KernelClient,
  KernelDriver,
  emptyMesh,
  type EvaluatedMesh,
  type EvaluationStats,
  type Job,
  type JobOutcome,
  type KernelPort,
  type KernelRequest,
  type KernelResponse,
} from '../src/kernel/index.js';

const STATS: EvaluationStats = {
  evaluated: 0,
  cached: 0,
  cacheSize: 0,
  triangles: 0,
  vertices: 0,
  durationMs: 0,
};

/** A bundle whose only distinguishing feature is its root id. */
function bundle(rootId: string): NodeBundle {
  const node = { ...spawnPrimitive('box'), id: rootId };
  return { rootId, nodes: [node] };
}

function job(id: number, channel = DEFAULT_CHANNEL): Job {
  return { id, channel, bundle: bundle(`n${id}`) };
}

function outcome(): JobOutcome {
  return { mesh: emptyMesh(), warnings: [], stats: STATS };
}

// --- The driver -------------------------------------------------------------

/**
 * A driver whose yield point the test controls.
 *
 * `release()` lets exactly one queued job proceed past the yield, so a test can
 * say "one job ran, now three more requests arrive, now let it continue" and
 * assert what survived.
 */
function controllableDriver(handlers: {
  run?: (job: Job) => JobOutcome;
  onResult?: (job: Job) => void;
  onSuperseded?: (job: Job, by: number) => void;
  onError?: (job: Job, error: unknown) => void;
}): { driver: KernelDriver; release: () => Promise<void> } {
  let unblock: (() => void) | null = null;

  const driver = new KernelDriver({
    run: handlers.run ?? (() => outcome()),
    onResult: (j) => handlers.onResult?.(j),
    onSuperseded: (j, by) => handlers.onSuperseded?.(j, by),
    onError: (j, error) => handlers.onError?.(j, error),
    yieldToMessages: () =>
      new Promise<void>((resolve) => {
        unblock = resolve;
      }),
  });

  return {
    driver,
    release: async () => {
      // Let the drain loop reach its yield before releasing it.
      await Promise.resolve();
      unblock?.();
      unblock = null;
      await Promise.resolve();
    },
  };
}

describe('the driver keeps at most one request per channel', () => {
  it('runs a single request immediately', async () => {
    const ran: number[] = [];
    const { driver, release } = controllableDriver({
      run: (j) => {
        ran.push(j.id);
        return outcome();
      },
    });

    driver.submit(job(1));
    await release();
    expect(ran).toEqual([1]);
    expect(driver.queueDepth).toBe(0);
  });

  it('abandons every superseded request in a drag, running only the last', async () => {
    const ran: number[] = [];
    const superseded: [number, number][] = [];
    const { driver, release } = controllableDriver({
      run: (j) => {
        ran.push(j.id);
        return outcome();
      },
      onSuperseded: (j, by) => superseded.push([j.id, by]),
    });

    // Frame 1 starts running. Frames 2..6 arrive while it is in flight.
    driver.submit(job(1));
    for (let id = 2; id <= 6; id += 1) driver.submit(job(id));

    // Only the newest is still queued; the four in between never existed as
    // far as the worker is concerned.
    expect(driver.queueDepth).toBe(1);
    expect(superseded).toEqual([
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
    ]);

    await release();
    await release();
    expect(ran).toEqual([1, 6]);
  });

  it('does not let one busy channel starve another', async () => {
    const ran: number[] = [];
    const { driver, release } = controllableDriver({
      run: (j) => {
        ran.push(j.id);
        return outcome();
      },
    });

    // Job 1 starts immediately. The thumbnail queues behind it, and then the
    // viewport resubmits twice while both are waiting.
    driver.submit(job(1, 'viewport'));
    driver.submit(job(2, 'thumbnail'));
    driver.submit(job(3, 'viewport'));
    driver.submit(job(4, 'viewport'));

    await release();
    await release();
    await release();

    // The thumbnail runs before the viewport's resubmission, because replacing
    // a queued job keeps the channel's position rather than moving it to the
    // back. A viewport dragging at 72Hz would otherwise starve every other
    // channel indefinitely — and job 3 still never ran.
    expect(ran).toEqual([1, 2, 4]);
  });

  it('cancel drops a queued request without running it', async () => {
    const ran: number[] = [];
    const withdrawn: number[] = [];
    const { driver, release } = controllableDriver({
      run: (j) => {
        ran.push(j.id);
        return outcome();
      },
      onSuperseded: (j) => withdrawn.push(j.id),
    });

    driver.submit(job(1));
    driver.submit(job(2));
    driver.cancel(DEFAULT_CHANNEL);

    await release();
    // Job 1 was already running when the cancel arrived; job 2 never starts.
    expect(ran).toEqual([1]);
    expect(withdrawn).toEqual([2]);
    expect(driver.queueDepth).toBe(0);
  });

  it('reports a job that throws without stopping the queue', async () => {
    const failures: number[] = [];
    const ran: number[] = [];
    const { driver, release } = controllableDriver({
      run: (j) => {
        if (j.id === 1) throw new Error('degenerate');
        ran.push(j.id);
        return outcome();
      },
      onError: (j) => failures.push(j.id),
    });

    driver.submit(job(1, 'a'));
    driver.submit(job(2, 'b'));
    await release();
    await release();

    expect(failures).toEqual([1]);
    expect(ran).toEqual([2]);
  });
});

describe('the driver waits for the WASM module before draining', () => {
  it('coalesces the startup burst into one evaluation', async () => {
    const ran: number[] = [];
    let ready: () => void = () => undefined;
    const driver = new KernelDriver({
      ready: new Promise<void>((resolve) => {
        ready = resolve;
      }),
      run: (j) => {
        ran.push(j.id);
        return outcome();
      },
      onResult: () => undefined,
      onSuperseded: () => undefined,
      onError: () => undefined,
      yieldToMessages: () => Promise.resolve(),
    });

    // Five edits while manifold-3d is still instantiating.
    for (let id = 1; id <= 5; id += 1) driver.submit(job(id));
    expect(ran).toEqual([]);

    ready();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ran).toEqual([5]);
  });

  it('fails what is queued if the module never loads', async () => {
    const failures: string[] = [];
    const driver = new KernelDriver({
      ready: Promise.reject(new Error('WASM fetch failed')),
      run: () => outcome(),
      onResult: () => undefined,
      onSuperseded: () => undefined,
      onError: (_job, error) => failures.push(error instanceof Error ? error.message : ''),
      yieldToMessages: () => Promise.resolve(),
    });

    driver.submit(job(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(failures).toEqual(['WASM fetch failed']);
  });
});

// --- The client -------------------------------------------------------------

/**
 * A port whose responses the test writes by hand.
 *
 * The whole point of the staleness rule is what happens when the worker answers out
 * of order, which no real worker can be made to do on demand.
 */
class ScriptedPort implements KernelPort {
  readonly sent: KernelRequest[] = [];
  terminated = false;
  #handler: ((event: { data: KernelResponse }) => void) | null = null;

  postMessage(message: KernelRequest): void {
    this.sent.push(message);
  }

  set onmessage(handler: ((event: { data: KernelResponse }) => void) | null) {
    this.#handler = handler;
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Deliver a response as if the worker had just posted it. */
  reply(response: KernelResponse): void {
    this.#handler?.({ data: response });
  }

  result(id: number, channel = DEFAULT_CHANNEL): void {
    this.reply({ type: 'result', id, channel, mesh: emptyMesh(), stats: STATS, warnings: [] });
  }
}

describe('the client never applies a stale result', () => {
  it('drops a result whose request predates one already applied', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const applied: number[] = [];
    client.subscribe((mesh) => applied.push(mesh.requestId));

    const first = client.request(bundle('a'));
    const second = client.request(bundle('b'));

    // The second request finishes first — a smaller edit, or a cache hit.
    port.result(2);
    port.result(1);

    await expect(second).resolves.toMatchObject({ requestId: 2 });
    // The older result resolves to null rather than rejecting: a caller that
    // was awaiting it has simply been overtaken, which is not an error.
    await expect(first).resolves.toBeNull();
    expect(applied).toEqual([2]);
  });

  it('keeps the watermark per channel, so two previews do not suppress each other', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const applied: EvaluatedMesh[] = [];
    client.subscribe((mesh) => applied.push(mesh));

    const viewport = client.request(bundle('v'), { channel: 'viewport' });
    const thumbnail = client.request(bundle('t'), { channel: 'thumbnail' });

    // The thumbnail (id 2) lands first. A global watermark would then refuse
    // the viewport's id 1, and the main view would never draw.
    port.result(2, 'thumbnail');
    port.result(1, 'viewport');

    await expect(thumbnail).resolves.toMatchObject({ requestId: 2 });
    await expect(viewport).resolves.toMatchObject({ requestId: 1 });
    expect(applied.map((mesh) => mesh.channel)).toEqual(['thumbnail', 'viewport']);
  });

  it('applies every result of a drag that arrives in order', () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const applied: number[] = [];
    client.subscribe((mesh) => applied.push(mesh.requestId));

    for (let frame = 0; frame < 5; frame += 1) void client.request(bundle(`f${frame}`));
    for (let id = 1; id <= 5; id += 1) port.result(id);

    expect(applied).toEqual([1, 2, 3, 4, 5]);
  });

  it('resolves a superseded request to null and draws nothing', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const applied: number[] = [];
    client.subscribe((mesh) => applied.push(mesh.requestId));

    const abandoned = client.request(bundle('a'));
    const kept = client.request(bundle('b'));

    port.reply({ type: 'superseded', id: 1, channel: DEFAULT_CHANNEL, supersededBy: 2 });
    port.result(2);

    await expect(abandoned).resolves.toBeNull();
    await expect(kept).resolves.toMatchObject({ requestId: 2 });
    expect(applied).toEqual([2]);
  });

  it('rejects only when the kernel itself failed', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const request = client.request(bundle('a'));
    port.reply({ type: 'error', id: 1, channel: DEFAULT_CHANNEL, message: 'boom' });
    await expect(request).rejects.toThrow('boom');
  });
});

describe('the client never blocks the caller', () => {
  it('returns from request() before any result exists', () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);

    // The drag path in #9 and #11 calls this once per pose and ignores the
    // promise. If it could block, the ghost preview would stutter with the
    // kernel — which is the exact failure the whole design is arranged to
    // prevent.
    const started = client.request(bundle('a'));
    expect(started).toBeInstanceOf(Promise);
    expect(port.sent).toHaveLength(1);
    expect(port.sent[0]).toMatchObject({ type: 'evaluate', id: 1 });

    // Nothing was applied, and nothing waited.
    port.result(1);
  });

  it('lets a whole gesture be fired and forgotten', () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const drawn: number[] = [];
    client.subscribe((mesh) => drawn.push(mesh.requestId));

    // 72 poses, one frame each. The worker answers three of them.
    for (let pose = 0; pose < 72; pose += 1) void client.request(bundle(`p${pose}`));
    expect(port.sent).toHaveLength(72);

    for (const id of [12, 40, 72]) port.result(id);
    // The renderer drew three meshes and skipped 69 the user has already moved
    // past. Preview lags; frames do not.
    expect(drawn).toEqual([12, 40, 72]);
  });

  it('cancel withdraws the queue and refuses the in-flight result', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const drawn: number[] = [];
    client.subscribe((mesh) => drawn.push(mesh.requestId));

    void client.request(bundle('a'));
    const settled = client.request(bundle('b'));
    port.result(2);
    expect(drawn).toEqual([2]);

    // transformCancel: withdraw, then re-request the pre-gesture document.
    client.cancel();
    expect(port.sent.at(-1)).toEqual({ type: 'cancel', channel: DEFAULT_CHANNEL });

    // A job that was already running finishes and posts its result. It is
    // refused here, so the pre-gesture mesh stays on screen.
    port.result(1);
    expect(drawn).toEqual([2]);
    await expect(settled).resolves.toMatchObject({ requestId: 2 });
  });

  it('settles everything outstanding on terminate', async () => {
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const pending = client.request(bundle('a'));

    client.terminate();
    await expect(pending).resolves.toBeNull();
    expect(port.terminated).toBe(true);
    await expect(client.request(bundle('b'))).rejects.toThrow(/terminated/);
  });
});

describe('the two halves together', () => {
  it('a drag over a slow tree produces one drawn mesh per completed evaluation', async () => {
    // The end-to-end claim of the drag-preview strategy: the client submits on
    // every frame, the driver runs what it can, and the results that come back
    // are always the newest the worker managed to finish.
    const port = new ScriptedPort();
    const client = new KernelClient(port);
    const drawn: number[] = [];
    client.subscribe((mesh) => drawn.push(mesh.requestId));

    const run = vi.fn(() => outcome());
    const { driver, release } = controllableDriver({
      run,
      onResult: (j) => {
        port.result(j.id);
      },
      onSuperseded: (j) => {
        port.reply({ type: 'superseded', id: j.id, channel: j.channel, supersededBy: 0 });
      },
    });

    // Wire the scripted port's outbound requests straight into the driver, so
    // this is the real client talking to the real scheduler with no worker.
    const pump = (): void => {
      for (const request of port.sent.splice(0)) {
        if (request.type === 'evaluate') {
          driver.submit({ id: request.id, channel: request.channel, bundle: request.bundle });
        }
      }
    };

    for (let frame = 0; frame < 10; frame += 1) void client.request(bundle(`f${frame}`));
    pump();
    await release();
    await release();

    // Ten frames submitted; the worker ran the first and then whatever was
    // newest when it finished. Everything in between was abandoned before it
    // cost anything.
    expect(run.mock.calls.length).toBeLessThan(10);
    expect(drawn).toEqual([...drawn].sort((a, b) => a - b));
    expect(drawn.at(-1)).toBe(10);
  });
});
