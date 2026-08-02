/**
 * The worker entry point.
 *
 * Deliberately thin. Everything with a decision in it lives in a module that
 * can be imported and tested in Node — `evaluate.ts` decides what a mesh is,
 * `driver.ts` decides which request survives — and this file only wires them to
 * `postMessage`. What is left is the part that genuinely cannot be tested
 * without a `Worker`, and there is as little of it as possible.
 *
 * ## Requests arriving before the WASM module is ready
 *
 * `manifold-3d` takes a moment to instantiate, and the app will submit its
 * first evaluation well before that finishes. Those requests queue in the
 * driver, which does not start draining until the module resolves — so the
 * ordinary supersession rule applies to the startup burst too, and a document
 * that changed five times while WASM loaded evaluates once, at its final state.
 *
 * ## Transfer, not clone
 *
 * Mesh buffers are transferred. After the `postMessage` the worker's views are
 * detached, which is correct: this side has no further use for them, and
 * cloning a multi-megabyte mesh on every drag frame is the cost the whole
 * design exists to avoid.
 */

import type { ManifoldToplevel } from 'manifold-3d';

import { KernelDriver, type Job, type JobOutcome } from './driver.js';
import { Evaluator } from './evaluate.js';
import { buildPreview } from './preview.js';
import { transferablesOf, type KernelRequest, type KernelResponse } from './protocol.js';
import { loadManifold } from './runtime.js';

/**
 * The worker global, named for what it is.
 *
 * `tsconfig.json` includes both the `DOM` and `WebWorker` libs — the app needs
 * one and the kernel needs the other — so the ambient `self` is typed as a
 * `Window`. The cast is the narrowing, in one place, rather than a `self as
 * unknown as ...` at each of the three uses below.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope;

/** Set once WASM is up. `run` is unreachable before then — see `ready` below. */
let evaluator: Evaluator | null = null;
/**
 * The toolkit itself, for the work that has no tree to walk.
 *
 * A thumbnail is one primitive with no document around it, so `preview.ts`
 * takes the toolkit directly rather than going through the evaluator — see the
 * note there on why a preview is not an evaluation.
 */
let toolkit: ManifoldToplevel | null = null;

const ready = loadManifold().then((api) => {
  toolkit = api;
  evaluator = new Evaluator(api);
});

const driver = new KernelDriver({
  ready,
  run: (job: Job): JobOutcome => {
    if (job.type === 'preview') {
      if (!toolkit) throw new Error('The CSG kernel is not ready yet');
      return { type: 'preview', preview: buildPreview(toolkit, job) };
    }
    if (!evaluator) throw new Error('The CSG kernel is not ready yet');
    return { type: 'evaluate', ...evaluator.evaluate(job.bundle, job.creaseAngle) };
  },
  onResult: (job, outcome) => {
    if (outcome.type === 'preview') {
      respond({
        type: 'preview-result',
        id: job.id,
        channel: job.channel,
        preview: outcome.preview,
      });
      return;
    }
    respond({
      type: 'result',
      id: job.id,
      channel: job.channel,
      mesh: outcome.mesh,
      stats: outcome.stats,
      warnings: outcome.warnings,
    });
  },
  onSuperseded: (job, supersededBy) => {
    respond({ type: 'superseded', id: job.id, channel: job.channel, supersededBy });
  },
  onError: (job, error) => {
    respond({
      type: 'error',
      id: job.id,
      channel: job.channel,
      message: error instanceof Error ? error.message : String(error),
    });
  },
});

scope.onmessage = (event: MessageEvent<KernelRequest>): void => {
  const request = event.data;
  switch (request.type) {
    // Both kinds of work are submitted verbatim: a `Job` *is* its request, so
    // there is nothing here to copy and nothing to get wrong.
    case 'evaluate':
    case 'preview':
      driver.submit(request);
      return;
    case 'cancel':
      driver.cancel(request.channel);
      return;
    case 'reset':
      driver.cancelAll();
      evaluator?.reset();
      return;
  }
};

function respond(response: KernelResponse): void {
  scope.postMessage(response, { transfer: transferablesOf(response) });
}
