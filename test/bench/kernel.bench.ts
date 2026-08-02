/**
 * The measurements behind `docs/perf.md`.
 *
 * Issue #6 states one number: a tree of ~20 primitives with ~10 boolean ops
 * re-evaluates a single-leaf edit in under 16ms. This file is where that number
 * comes from, so the entry in `docs/perf.md` is a reading rather than a claim,
 * and so re-running it after a `manifold-3d` upgrade or a tessellation change
 * takes one command.
 *
 * Run with `npm run bench`. Deliberately not part of `npm test`: a benchmark on
 * shared CI measures the runner's neighbours as much as the code, and a
 * threshold that fails a PR for that reason gets disabled within a week. What
 * CI *does* assert is `test/kernel-cache.test.ts`'s evaluation counts, which is
 * the structural half of the same claim and is machine-independent.
 *
 * ## What each case is for
 *
 *   - **cold** — the whole tree from an empty cache. What opening a document
 *     costs. Never on the critical path of a frame.
 *   - **single-leaf edit (warm)** — the 16ms target. One parameter changes and
 *     the cache absorbs everything not on the path to the root. This is the
 *     number that decides how a slider feels.
 *   - **re-evaluate unchanged** — pure cache-hit cost, which bounds how cheap
 *     the "did anything change?" path can ever be.
 *   - **one boolean** and **one primitive** — the components, so a regression
 *     in the aggregate can be attributed.
 *
 * Each drag step below uses a radius nothing has seen before, so every
 * iteration is a genuine cache miss along the path to the root. Cycling through
 * a few repeated values would measure the cache instead of the kernel and would
 * report a number roughly two orders of magnitude too good.
 */

import { bench, describe } from 'vitest';

import { setParameters } from '../../src/core/index.js';
import { Evaluator, loadManifold } from '../../src/kernel/index.js';
import { soloBundle, targetTree } from '../support/kernel-fixture.js';

const api = await loadManifold();

/** Drag step counter, so the "one boolean" case never repeats a radius. */
let cutStep = 0;

type Document = ReturnType<typeof targetTree>['document'];

/** Dispatch a radius change and hand back the resulting bundle. */
function applyRadius(
  document: Document,
  nodeId: string,
  radius: number,
): ReturnType<Document['bundle']> {
  document.dispatch(setParameters(nodeId, { radius }));
  return document.bundle();
}

describe('the target tree — ~20 primitives, ~10 booleans', () => {
  bench('cold: full evaluation from an empty cache', () => {
    const { document } = targetTree();
    const evaluator = new Evaluator(api);
    evaluator.evaluate(document.bundle());
    evaluator.reset();
  });

  const warm = targetTree();
  const warmEvaluator = new Evaluator(api);
  warmEvaluator.evaluate(warm.document.bundle());
  let step = 0;

  bench('single-leaf edit: one hole resized, cache warm', () => {
    step += 1;
    const hole = warm.leaves[6] ?? '';
    warmEvaluator.evaluate(
      applyRadius(warm.document, hole, 0.0035 + (step % 400) * 1e-6 + step * 1e-9),
    );
  });

  const idle = targetTree();
  const idleEvaluator = new Evaluator(api);
  idleEvaluator.evaluate(idle.document.bundle());

  bench('re-evaluate unchanged: every subtree is a cache hit', () => {
    idleEvaluator.evaluate(idle.document.bundle());
  });
});

describe('components', () => {
  // Capacity zero, so each iteration pays the full construction cost rather
  // than measuring a cache lookup. Entries the live walk touched are still
  // protected from eviction, so this is a cold build, not a broken one.
  const evaluator = new Evaluator(api, { maxCacheEntries: 0 });
  const singleCut = targetTree();

  bench('one primitive: a 32-sided cylinder', () => {
    evaluator.evaluate(soloBundle('cylinder', { radius: 0.01, height: 0.05 }));
  });

  bench('one boolean: a cylinder subtracted from a box', () => {
    cutStep += 1;
    evaluator.evaluate(
      applyRadius(singleCut.document, singleCut.leaves[1] ?? '', 0.004 + cutStep * 1e-7),
    );
  });
});
