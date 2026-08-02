/**
 * The subtree cache: what gets rebuilt when one leaf changes.
 *
 * Issue #6's done-when asks for "a test asserting evaluation counts", and that
 * phrasing is exact for a reason. A timing assertion would be flaky on shared
 * CI and would pass for the wrong reason on a fast machine; what actually needs
 * proving is a *structural* claim — that editing a leaf rebuilds the path from
 * that leaf to the root and nothing else. `stats.evaluated` counts subtrees
 * built, `stats.cached` counts subtrees served, and both are deterministic.
 *
 * The counts are asserted exactly rather than as "fewer than before". An
 * off-by-one here is a whole subtree being rebuilt every frame, which is
 * invisible until a tree gets big enough for it to be the only thing that
 * matters.
 *
 * ## What a hit costs
 *
 * A cache hit returns before recursing, so a hit on a deep subtree is one map
 * lookup regardless of what is under it. That is why `cached` is small in the
 * assertions below and does not equal "every untouched node" — the untouched
 * nodes are never visited at all, which is the point.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  CarveDocument,
  booleanNode,
  groupNode,
  insertBundle,
  insertNode,
  makeTrs,
  setParameters,
  transformNode,
  vec3,
  type NodeBundle,
} from '../src/core/index.js';
import { Evaluator, subtreeHash, nodeLookup } from '../src/kernel/index.js';

import { idFactory, placed } from './support/document-fixture.js';
import { sharedManifold, targetTree, volume } from './support/kernel-fixture.js';

let manifold: Awaited<ReturnType<typeof sharedManifold>>;

beforeAll(async () => {
  manifold = await sharedManifold();
});

function freshEvaluator(maxCacheEntries?: number): Evaluator {
  return new Evaluator(manifold, maxCacheEntries === undefined ? {} : { maxCacheEntries });
}

/**
 * Two drilled plates under a union. Small enough that every count below is
 * derivable by hand from the diagram:
 *
 *     group  doc                      pass-through, one child
 *      └── union  assembly
 *           ├── transform  place-0    translation (0, 0, 0)
 *           │    └── subtract  cut-0
 *           │         ├── transform → box
 *           │         └── transform → cylinder
 *           └── transform  place-1    translation (0.05, 0, 0)
 *                └── subtract  cut-1
 *                     ├── transform → box        identical to cut-0's
 *                     └── transform → cylinder   identical to cut-0's
 *
 * Fourteen nodes; eight distinct subtrees. The offset lives on the two `place`
 * transforms rather than inside the plates, so both `subtract` subtrees are
 * structurally identical and share one cache entry — which is worth asserting
 * on its own, since a hash that accidentally included node identity would pass
 * every correctness test in the suite while quietly doing twice the work.
 */
interface TwoPlates {
  readonly document: CarveDocument;
  /** The cylinder inside the first plate. Edit this to simulate a drag. */
  readonly holeA: string;
  /** Its counterpart in the second plate. Same shape, different position. */
  readonly holeB: string;
}

function twoPlates(): TwoPlates {
  const nextId = idFactory('p');
  const document = CarveDocument.create({ root: groupNode({ id: 'doc' }) });
  const assembly = booleanNode({ id: 'assembly', op: 'union' });
  document.dispatch(insertNode(assembly, 'doc'));

  const holes: string[] = [];
  for (const [index, offset] of [0, 0.05].entries()) {
    const place = transformNode({
      id: `place-${index}`,
      transform: makeTrs({ translation: vec3(offset, 0, 0) }),
    });
    const cut = booleanNode({ id: `cut-${index}`, op: 'subtract' });
    document.dispatch(insertNode(place, assembly.id));
    document.dispatch(insertNode(cut, place.id));

    const plate = placed(nextId, 'box', { width: 0.04, height: 0.006, depth: 0.04 });
    const hole = placed(nextId, 'cylinder', { radius: 0.008, height: 0.02, radialSegments: 24 });
    document.dispatch(insertBundle(plate, cut.id));
    document.dispatch(insertBundle(hole, cut.id));
    holes.push(primitiveOf(hole));
  }
  document.clearHistory();

  const [holeA, holeB] = holes;
  if (!holeA || !holeB) throw new Error('fixture: expected two holes');
  return { document, holeA, holeB };
}

function primitiveOf(bundle: NodeBundle): string {
  const primitive = bundle.nodes.find((node) => node.kind === 'primitive');
  if (!primitive) throw new Error('fixture: expected a primitive in the bundle');
  return primitive.id;
}

/**
 * How many subtrees an edit to one leaf must rebuild in `twoPlates`.
 *
 * The ancestor chain of a hole, and nothing else: the cylinder, the transform
 * that places it, the `subtract` that drills its plate, the `place` transform
 * above that, and the `union` at the top. The document root is a group with one
 * child, which passes its child's solid straight through and is not cached
 * separately, so it does not appear here.
 */
const PATH_TO_ROOT = 5;

describe('a cold evaluation builds everything once', () => {
  it('counts distinct subtrees, not nodes', () => {
    const { document } = twoPlates();
    const evaluator = freshEvaluator();
    const first = evaluator.evaluate(document.bundle());

    // One hit on a *cold* cache, and it is the interesting one: `cut-1` hashes
    // identically to `cut-0`, so the second plate's entire subtree — its box,
    // its cylinder and both their transforms — is served by a single lookup and
    // never walked. Node identity is not in the hash, and this is what that buys.
    expect(first.stats.cached).toBe(1);
    // Eight of the fourteen nodes. The two plates are the same box at the same
    // local transform and so are the two holes, the two `subtract` nodes are
    // therefore identical too, and the root group passes its only child
    // through. Six nodes' worth of work that never happens.
    expect(document.size).toBe(14);
    expect(first.stats.evaluated).toBe(8);
    expect(volume(first.mesh)).toBeGreaterThan(0);
  });

  it('re-evaluating an unchanged document builds nothing at all', () => {
    const { document } = twoPlates();
    const evaluator = freshEvaluator();
    evaluator.evaluate(document.bundle());

    const second = evaluator.evaluate(document.bundle());
    expect(second.stats.evaluated).toBe(0);
    expect(second.stats.cached).toBeGreaterThan(0);
  });
});

describe('editing one leaf rebuilds only the path to the root', () => {
  it('leaves the untouched plate entirely cached', () => {
    const { document, holeA } = twoPlates();
    const evaluator = freshEvaluator();
    evaluator.evaluate(document.bundle());

    document.dispatch(setParameters(holeA, { radius: 0.009 }));
    const after = evaluator.evaluate(document.bundle());

    // The other plate's whole subtree is one cache hit — its children are not
    // visited at all.
    expect(after.stats.evaluated).toBe(PATH_TO_ROOT);
    expect(volume(after.mesh)).toBeGreaterThan(0);
  });

  it('rebuilds the same count on every step of a drag', () => {
    const { document, holeA } = twoPlates();
    const evaluator = freshEvaluator();
    evaluator.evaluate(document.bundle());

    let previous = 0;
    for (const radius of [0.0085, 0.009, 0.0095, 0.01]) {
      document.dispatch(setParameters(holeA, { radius }));
      const outcome = evaluator.evaluate(document.bundle());
      expect(outcome.stats.evaluated).toBe(PATH_TO_ROOT);
      // Each drag step produces a distinct solid, not a cached near-miss.
      expect(volume(outcome.mesh)).not.toBeCloseTo(previous, 12);
      previous = volume(outcome.mesh);
    }
  });

  it('serves an undone edit from cache — stepping back costs nothing', () => {
    const { document, holeA } = twoPlates();
    const evaluator = freshEvaluator();
    const original = evaluator.evaluate(document.bundle());

    document.dispatch(setParameters(holeA, { radius: 0.009 }));
    evaluator.evaluate(document.bundle());

    document.undo();
    const restored = evaluator.evaluate(document.bundle());

    expect(restored.stats.evaluated).toBe(0);
    expect(volume(restored.mesh)).toBeCloseTo(volume(original.mesh), 12);
  });
});

describe('identical geometry shares one entry', () => {
  it('two structurally identical subtrees hash the same', () => {
    const { document, holeA, holeB } = twoPlates();
    const lookup = nodeLookup(document.bundle().nodes);
    expect(subtreeHash(lookup, holeA)).toBe(subtreeHash(lookup, holeB));
  });

  it('and diverge the moment one of them is edited', () => {
    const { document, holeA, holeB } = twoPlates();
    document.dispatch(setParameters(holeA, { radius: 0.009 }));
    const lookup = nodeLookup(document.bundle().nodes);
    expect(subtreeHash(lookup, holeA)).not.toBe(subtreeHash(lookup, holeB));
  });
});

describe('the target tree from the performance goal', () => {
  it('re-evaluates a single-leaf edit as a handful of subtrees, not twenty', () => {
    const { document, leaves, primitiveCount, booleanCount } = targetTree();
    expect(primitiveCount).toBe(20);
    expect(booleanCount).toBe(6);

    const evaluator = freshEvaluator();
    const cold = evaluator.evaluate(document.bundle());
    expect(cold.stats.evaluated).toBeGreaterThan(10);

    // A hole in the middle plate. Its subtract, and the union at the top.
    const hole = leaves[6];
    expect(hole).toBeDefined();
    document.dispatch(setParameters(hole ?? '', { radius: 0.0055 }));

    const warm = evaluator.evaluate(document.bundle());
    // The edited cylinder, the transform placing it, the subtract that drills
    // that plate, and the union that assembles all five plates.
    expect(warm.stats.evaluated).toBe(4);
    expect(warm.stats.evaluated).toBeLessThan(cold.stats.evaluated / 3);
  });
});

describe('eviction', () => {
  it('bounds the cache and frees what it drops', () => {
    const { document, holeA } = twoPlates();
    const evaluator = freshEvaluator(12);

    for (let step = 0; step < 40; step += 1) {
      document.dispatch(setParameters(holeA, { radius: 0.004 + step * 0.0001 }));
      const outcome = evaluator.evaluate(document.bundle());
      // Never exceeds capacity by more than the live tree, and the live tree is
      // well under 12 here.
      expect(outcome.stats.cacheSize).toBeLessThanOrEqual(13);
      expect(volume(outcome.mesh)).toBeGreaterThan(0);
    }

    // The evicted solids were deleted, not leaked — a use-after-free would have
    // crashed the WASM heap somewhere in the loop above rather than reaching
    // here with a usable evaluator.
    expect(volume(evaluator.evaluate(document.bundle()).mesh)).toBeGreaterThan(0);
  });

  it('never evicts a subtree the current evaluation is using', () => {
    // Capacity of one, against a tree that needs several live entries at once.
    // Overflowing is allowed; freeing a solid an ancestor still references is
    // not, and would fault rather than fail an assertion.
    const { document } = twoPlates();
    const evaluator = freshEvaluator(1);
    const outcome = evaluator.evaluate(document.bundle());
    expect(volume(outcome.mesh)).toBeGreaterThan(0);
    expect(evaluator.cacheSize).toBeGreaterThan(1);
  });

  it('reset empties the cache', () => {
    const { document } = twoPlates();
    const evaluator = freshEvaluator();
    evaluator.evaluate(document.bundle());
    expect(evaluator.cacheSize).toBeGreaterThan(0);

    evaluator.reset();
    expect(evaluator.cacheSize).toBe(0);

    const after = evaluator.evaluate(document.bundle());
    expect(after.stats.evaluated).toBe(8);
  });
});
