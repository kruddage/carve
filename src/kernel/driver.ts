/**
 * The worker-side scheduler: which evaluation runs next, and which never runs
 * at all.
 *
 * `evaluate.ts` answers "what is the mesh". This answers the question that
 * actually decides whether dragging feels connected: given that requests arrive
 * faster than they complete, **what should be thrown away?**
 *
 * ## The problem, concretely
 *
 * A pinch-drag or a slider produces a request per frame — 72 a second in a
 * headset. A boolean over a real tree takes tens of milliseconds. Run them all
 * in order and the mesh you see is progressively further behind your hand,
 * unboundedly, for as long as you keep moving. The queue is not a backlog to
 * work through; it is a stack of answers to questions nobody is asking any more.
 *
 * So the queue holds **at most one request per channel**, and a newer request
 * replaces the older one outright. The displaced request is reported as
 * superseded rather than dropped silently, because a caller awaiting it has to
 * be able to settle. Issue #6's phrasing for this is "superseded jobs must be
 * abandoned"; the shape below is what that means when the messages have already
 * arrived and are sitting in memory.
 *
 * The result is self-limiting: evaluation runs at whatever rate the worker
 * sustains — 30Hz on a small tree, 3Hz on a large one — and the mesh is always
 * the most recent one that could be finished, never the oldest one still owed.
 * Both rates are fine. What is not fine is a dropped frame, and the renderer
 * never waits for any of this.
 *
 * ## Yielding between jobs
 *
 * `manifold-3d` is synchronous WASM, so an evaluation occupies the worker
 * thread completely. If the drain loop ran to exhaustion without yielding, the
 * message queue would not be serviced during it, nothing newer could arrive,
 * and supersession would have nothing to supersede — every request would run,
 * which is precisely the failure this file exists to prevent.
 *
 * So the loop yields to the *macrotask* queue between jobs. A microtask
 * (`await Promise.resolve()`) is not enough: `message` events are macrotasks,
 * and a microtask checkpoint runs before any of them are delivered. This is the
 * one place in the kernel where the difference between the two queues is
 * load-bearing rather than trivia.
 *
 * ## No cancellation mid-boolean
 *
 * Once a job starts it runs to completion. `manifold-3d` exposes an
 * `ExecutionContext` that can cancel a long solve, but at the mesh sizes this
 * project targets a single boolean is a few milliseconds — the coordination
 * would cost more than it saves, and a cancelled solve still has to be redone.
 * Abandonment happens in the queue, before work starts, which is where it is
 * free. If #15's measurements ever show single booleans long enough to matter,
 * `withContext` is the escalation and it fits behind this same interface.
 */

import type { NodeBundle } from '../core/index.js';

import type { EvaluationStats, KernelWarning, MeshPayload } from './protocol.js';

/** One unit of work, as the driver holds it. */
export interface Job {
  readonly id: number;
  readonly channel: string;
  readonly bundle: NodeBundle;
  readonly creaseAngle?: number;
}

export interface JobOutcome {
  readonly mesh: MeshPayload;
  readonly warnings: readonly KernelWarning[];
  readonly stats: EvaluationStats;
}

export interface DriverHandlers {
  /** Run one job. Synchronous — this is the worker thread and blocking is the point. */
  readonly run: (job: Job) => JobOutcome;
  readonly onResult: (job: Job, outcome: JobOutcome) => void;
  readonly onSuperseded: (job: Job, supersededBy: number) => void;
  readonly onError: (job: Job, error: unknown) => void;
  /**
   * Yield the thread so queued `message` events can be delivered.
   *
   * Injectable so tests can drive the loop deterministically instead of racing
   * a timer. The default is `setTimeout(0)` — see the yielding note above for
   * why a microtask will not do.
   */
  readonly yieldToMessages?: () => Promise<void>;
  /**
   * Awaited before the first job runs. The WASM module's instantiation.
   *
   * Requests that arrive during startup queue and supersede each other exactly
   * as they do at any other time, so a document that changed five times while
   * `manifold-3d` loaded evaluates once, at its final state. If this rejects,
   * everything queued fails with that error and every later job fails the same
   * way — there is no degraded mode for a CSG modeller with no CSG.
   */
  readonly ready?: Promise<unknown>;
}

export class KernelDriver {
  readonly #handlers: DriverHandlers;
  readonly #yield: () => Promise<void>;
  readonly #ready: Promise<unknown> | undefined;

  /**
   * At most one pending job per channel. A `Map` because the drain order should
   * be the order channels were *first* asked for — so two independent previews
   * alternate fairly rather than one starving the other whenever it happens to
   * be resubmitted more often.
   */
  readonly #queue = new Map<string, Job>();
  #draining = false;

  constructor(handlers: DriverHandlers) {
    this.#handlers = handlers;
    this.#yield = handlers.yieldToMessages ?? defaultYield;
    this.#ready = handlers.ready;
  }

  get queueDepth(): number {
    return this.#queue.size;
  }

  get busy(): boolean {
    return this.#draining;
  }

  /**
   * Queue a job, displacing any earlier one on the same channel.
   *
   * Note the replacement keeps the channel's original position in the map:
   * `Map.set` on an existing key updates in place. That is deliberate — a
   * channel that resubmits every frame would otherwise keep jumping to the back
   * and never run.
   */
  submit(job: Job): void {
    const displaced = this.#queue.get(job.channel);
    if (displaced) this.#handlers.onSuperseded(displaced, job.id);
    this.#queue.set(job.channel, job);
    void this.#drain();
  }

  /**
   * Abandon anything queued for `channel`.
   *
   * This is `transformCancel`'s path, and the reason it does not need to know
   * whether a job is queued or already running: a running job finishes and its
   * result is discarded on the main thread by the request-order rule in
   * `client.ts`, while a queued one never starts.
   */
  cancel(channel: string): void {
    const dropped = this.#queue.get(channel);
    if (!dropped) return;
    this.#queue.delete(channel);
    // Reported against itself: nothing displaced it, the caller withdrew it.
    this.#handlers.onSuperseded(dropped, dropped.id);
  }

  /** Abandon everything. Teardown, and document close. */
  cancelAll(): void {
    for (const channel of [...this.#queue.keys()]) this.cancel(channel);
  }

  /**
   * Run queued jobs until there are none, yielding between each.
   *
   * Re-entrancy is guarded rather than queued: `submit` calls this on every
   * message, and a second drain loop would run jobs concurrently on a thread
   * that has no concurrency.
   */
  async #drain(): Promise<void> {
    if (this.#draining) return;
    this.#draining = true;
    try {
      // Held for the whole startup wait, so submissions during it queue and
      // supersede rather than starting a second loop that would race this one.
      if (this.#ready) await this.#ready;

      while (this.#queue.size > 0) {
        const [channel, job] = firstEntry(this.#queue);
        this.#queue.delete(channel);

        try {
          this.#handlers.onResult(job, this.#handlers.run(job));
        } catch (error) {
          this.#handlers.onError(job, error);
        }

        // Between jobs, not after the loop: this is what lets a newer request
        // arrive and supersede whatever is still queued.
        await this.#yield();
      }
    } catch (error) {
      // Only reachable from `ready` rejecting — the per-job try/catch above
      // handles everything else. Fail what is queued rather than leaving those
      // callers waiting on a worker that will never do any work.
      for (const [channel, job] of [...this.#queue]) {
        this.#queue.delete(channel);
        this.#handlers.onError(job, error);
      }
    } finally {
      this.#draining = false;
    }
  }
}

/** The first entry of a non-empty map. Guarded by the `size > 0` check above. */
function firstEntry(queue: Map<string, Job>): [string, Job] {
  for (const entry of queue) return entry;
  throw new Error('drain called on an empty queue');
}

function defaultYield(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
