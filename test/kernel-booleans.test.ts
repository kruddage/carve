/**
 * Booleans, transforms, and what happens when the geometry is degenerate.
 *
 * The fixtures are chosen so the right answer is arithmetic rather than a
 * stored mesh. Two boxes offset by half their width union to 1.5× a box and
 * intersect to 0.5×; a plate with two holes through it is the plate's volume
 * minus two cylinders. Get those wrong and the number is wrong by a lot, which
 * is the kind of failure worth having — a boolean that is subtly wrong along a
 * seam shows up as an open edge instead, and `openEdges` catches that.
 *
 * ## Watertightness is the assertion that matters
 *
 * Mesh booleans are the part of a CSG modeller that classically produces
 * *nearly* closed output: cracks along the seam, coincident faces left
 * unresolved, a sliver triangle wound backwards. All three render acceptably
 * and all three make an STL a slicer refuses, which is the export path #14a
 * depends on and the second half of #1's done-when. So every boolean case here
 * asserts a closed surface, not just a plausible volume.
 *
 * ## Degenerate geometry warns, never throws
 *
 * `normalizeParameters` (#25) repairs degenerate *parameters* before they reach
 * the store, so what arrives at the kernel is degenerate *geometry* — a
 * subtraction that removes its own base, an intersection of two solids that do
 * not touch, a boolean with one operand. Every one of those is a state a user
 * passes through on the way to something valid, so the kernel reports and
 * carries on. A viewport that goes blank mid-edit is a worse outcome than a
 * marker on a node.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  CarveDocument,
  booleanNode,
  groupNode,
  makeTrs,
  placedPrimitive,
  primitiveNode,
  quat,
  spawnPrimitive,
  vec3,
  type NodeBundle,
} from '../src/core/index.js';
import { Evaluator } from '../src/kernel/index.js';

import { bracketDocument, idFactory, placed } from './support/document-fixture.js';
import { bounds, openEdges, sharedManifold, volume } from './support/kernel-fixture.js';

let evaluator: Evaluator;

beforeAll(async () => {
  evaluator = new Evaluator(await sharedManifold());
});

/** Two unit-ish boxes, the second offset along X, under one boolean node. */
function twoBoxes(op: 'union' | 'subtract' | 'intersect', offset = 0.02): NodeBundle {
  const nextId = idFactory('b');
  const root = booleanNode({ id: 'op', op });
  const a = placed(nextId, 'box', { width: 0.04, height: 0.04, depth: 0.04 });
  const b = placed(
    nextId,
    'box',
    { width: 0.04, height: 0.04, depth: 0.04 },
    makeTrs({ translation: vec3(offset, 0, 0) }),
  );
  return {
    rootId: root.id,
    nodes: [{ ...root, children: [a.rootId, b.rootId] }, ...a.nodes, ...b.nodes],
  };
}

const BOX = 0.04 ** 3;

describe('the three boolean operations', () => {
  it('union adds the parts that do not overlap', () => {
    const outcome = evaluator.evaluate(twoBoxes('union'));
    expect(outcome.warnings).toEqual([]);
    expect(volume(outcome.mesh) / BOX).toBeCloseTo(1.5, 4);
    expect(openEdges(outcome.mesh)).toEqual([]);
  });

  it('subtract removes the second operand from the first', () => {
    const outcome = evaluator.evaluate(twoBoxes('subtract'));
    expect(outcome.warnings).toEqual([]);
    expect(volume(outcome.mesh) / BOX).toBeCloseTo(0.5, 4);
    expect(openEdges(outcome.mesh)).toEqual([]);
  });

  it('intersect keeps only the overlap', () => {
    const outcome = evaluator.evaluate(twoBoxes('intersect'));
    expect(outcome.warnings).toEqual([]);
    expect(volume(outcome.mesh) / BOX).toBeCloseTo(0.5, 4);
    expect(openEdges(outcome.mesh)).toEqual([]);
  });

  it('subtract is not commutative — operand order is load-bearing', () => {
    const forward = evaluator.evaluate(twoBoxes('subtract', 0.03));
    const reversed = evaluator.evaluate(reverseChildren(twoBoxes('subtract', 0.03)));
    // Same two solids, same overlap, but the result keeps a different quarter.
    expect(volume(forward.mesh)).toBeCloseTo(volume(reversed.mesh), 9);
    expect(bounds(forward.mesh).min[0]).toBeLessThan(bounds(reversed.mesh).min[0]);
  });
});

describe('a boolean over more than two operands', () => {
  it('folds left, so every later operand is cut from the running result', () => {
    // A plate with two holes: the bracket fixture from the document tests, now
    // actually evaluated.
    const { document } = bracketDocument();
    const outcome = evaluator.evaluate(document.bundle());
    expect(outcome.warnings).toEqual([]);

    const plate = 0.2 * 0.01 * 0.1;
    // Each hole is a 10mm-radius cylinder passing right through the 10mm plate.
    const hole = Math.PI * 0.01 ** 2 * 0.01;
    expect(volume(outcome.mesh) / (plate - 2 * hole)).toBeCloseTo(1, 2);
    expect(openEdges(outcome.mesh)).toEqual([]);
  });
});

describe('transforms', () => {
  it('place a solid without deforming it', () => {
    const nextId = idFactory('t');
    const bundle = placed(
      nextId,
      'box',
      { width: 0.04, height: 0.02, depth: 0.06 },
      makeTrs({ translation: vec3(0.5, -0.25, 0.125) }),
    );
    const outcome = evaluator.evaluate(bundle);
    const { min, max } = bounds(outcome.mesh);
    expect(min[0]).toBeCloseTo(0.48, 6);
    expect(max[0]).toBeCloseTo(0.52, 6);
    expect(min[1]).toBeCloseTo(-0.26, 6);
    expect(volume(outcome.mesh) / (0.04 * 0.02 * 0.06)).toBeCloseTo(1, 5);
  });

  it('compose down the tree — a transform above a transform', () => {
    const outer = { ...groupNode({ id: 'outer' }), children: ['inner'] };
    const inner = placedPrimitive(
      primitiveNode({
        id: 'leaf',
        primitive: 'box',
        params: { width: 0.02, height: 0.02, depth: 0.02 },
      }),
      makeTrs({ translation: vec3(0.1, 0, 0) }),
      { id: 'inner' },
    );
    const outcome = evaluator.evaluate({
      rootId: outer.id,
      nodes: [outer, ...inner.nodes],
    });
    expect(bounds(outcome.mesh).min[0]).toBeCloseTo(0.09, 6);
  });

  it('rotate without changing volume', () => {
    const nextId = idFactory('r');
    const half = Math.SQRT1_2;
    const bundle = placed(
      nextId,
      'box',
      { width: 0.06, height: 0.02, depth: 0.02 },
      // 90° about Z: the 60mm X extent becomes the Y extent.
      makeTrs({ rotation: quat(0, 0, half, half) }),
    );
    const outcome = evaluator.evaluate(bundle);
    const { min, max } = bounds(outcome.mesh);
    expect(max[1] - (min[1] ?? 0)).toBeCloseTo(0.06, 6);
    expect(max[0] - (min[0] ?? 0)).toBeCloseTo(0.02, 6);
    expect(volume(outcome.mesh) / (0.06 * 0.02 * 0.02)).toBeCloseTo(1, 5);
  });

  it('scale uniformly by the cube of the factor', () => {
    const nextId = idFactory('s');
    const bundle = placed(
      nextId,
      'box',
      { width: 0.02, height: 0.02, depth: 0.02 },
      makeTrs({ scale: vec3(2, 2, 2) }),
    );
    const outcome = evaluator.evaluate(bundle);
    expect(volume(outcome.mesh) / (0.04 * 0.04 * 0.04)).toBeCloseTo(1, 5);
  });
});

describe('groups evaluate as unions', () => {
  it('and share cache entries with the union that would replace them', () => {
    const asGroup = twoBoxes('union');
    const grouped: NodeBundle = {
      rootId: asGroup.rootId,
      nodes: asGroup.nodes.map((node) =>
        node.id === asGroup.rootId
          ? {
              ...groupNode({ id: node.id }),
              children: node.kind === 'boolean' ? node.children : [],
            }
          : node,
      ),
    };

    const union = evaluator.evaluate(asGroup);
    const group = evaluator.evaluate(grouped);

    expect(volume(group.mesh)).toBeCloseTo(volume(union.mesh), 9);
    // Nothing new was built: `hash.ts` gives a group a union's hash, so the
    // second evaluation is entirely cache hits.
    expect(group.stats.evaluated).toBe(0);
  });
});

describe('degenerate geometry warns rather than throwing', () => {
  it('reports a subtraction that removes its own base', () => {
    const nextId = idFactory('d');
    const root = booleanNode({ id: 'self-cut', op: 'subtract' });
    const a = placed(nextId, 'box', { width: 0.02, height: 0.02, depth: 0.02 });
    const b = placed(nextId, 'box', { width: 0.04, height: 0.04, depth: 0.04 });
    const outcome = evaluator.evaluate({
      rootId: root.id,
      nodes: [{ ...root, children: [a.rootId, b.rootId] }, ...a.nodes, ...b.nodes],
    });

    expect(outcome.mesh.indices.length).toBe(0);
    expect(outcome.warnings.map((warning) => warning.code)).toContain('empty-result');
    expect(outcome.warnings.some((warning) => warning.nodeId === root.id)).toBe(true);
  });

  it('reports an intersection of two solids that do not touch', () => {
    const outcome = evaluator.evaluate(twoBoxes('intersect', 0.5));
    expect(outcome.mesh.indices.length).toBe(0);
    expect(outcome.warnings.map((warning) => warning.code)).toContain('empty-result');
  });

  it('reports a subtract with nothing to cut with', () => {
    const nextId = idFactory('u');
    const root = booleanNode({ id: 'lonely', op: 'subtract' });
    const a = placed(nextId, 'box', { width: 0.02, height: 0.02, depth: 0.02 });
    const outcome = evaluator.evaluate({
      rootId: root.id,
      nodes: [{ ...root, children: [a.rootId] }, ...a.nodes],
    });

    // The base is still drawn — the result is correct, it just is not what the
    // user was in the middle of asking for.
    expect(volume(outcome.mesh) / 0.02 ** 3).toBeCloseTo(1, 5);
    expect(outcome.warnings).toEqual([
      expect.objectContaining({ code: 'unary-boolean', nodeId: 'lonely' }),
    ]);
  });

  it('reports a child id that is not in the bundle, and evaluates the rest', () => {
    const nextId = idFactory('m');
    const root = booleanNode({ id: 'gap', op: 'union' });
    const a = placed(nextId, 'box', { width: 0.02, height: 0.02, depth: 0.02 });
    const outcome = evaluator.evaluate({
      rootId: root.id,
      nodes: [{ ...root, children: [a.rootId, 'not-in-this-document'] }, ...a.nodes],
    });

    expect(volume(outcome.mesh) / 0.02 ** 3).toBeCloseTo(1, 5);
    expect(outcome.warnings).toEqual([
      expect.objectContaining({ code: 'missing-child', nodeId: 'gap' }),
    ]);
  });

  it('an empty document evaluates to an empty mesh, not an exception', () => {
    const document = CarveDocument.create({ root: groupNode({ id: 'empty' }) });
    const outcome = evaluator.evaluate(document.bundle());
    expect(outcome.mesh.indices.length).toBe(0);
    expect(outcome.mesh.vertices.length).toBe(0);
    expect(outcome.warnings.map((warning) => warning.code)).toEqual(['empty-result']);
  });
});

describe('coincident faces', () => {
  it('resolve to a closed solid rather than to a doubled surface', () => {
    // Two boxes sharing a face exactly. This is the classic mesh-boolean
    // failure: a naive implementation leaves both copies of the shared face in
    // the output, which renders as z-fighting and exports as a non-manifold
    // solid. It is also what a user does constantly — stacking a boss on a
    // plate puts two faces in the same plane.
    const nextId = idFactory('c');
    const root = booleanNode({ id: 'stack', op: 'union' });
    const base = placed(nextId, 'box', { width: 0.04, height: 0.02, depth: 0.04 });
    const boss = placed(
      nextId,
      'box',
      { width: 0.02, height: 0.02, depth: 0.02 },
      makeTrs({ translation: vec3(0, 0.02, 0) }),
    );
    const outcome = evaluator.evaluate({
      rootId: root.id,
      nodes: [{ ...root, children: [base.rootId, boss.rootId] }, ...base.nodes, ...boss.nodes],
    });

    expect(outcome.warnings).toEqual([]);
    expect(openEdges(outcome.mesh)).toEqual([]);
    expect(volume(outcome.mesh) / (0.04 * 0.02 * 0.04 + 0.02 ** 3)).toBeCloseTo(1, 4);
  });
});

describe('the whole primitive set survives being booleaned together', () => {
  it('unions all six into one closed solid', () => {
    const root = groupNode({ id: 'all' });
    const nodes = [
      { ...root, children: ['box', 'cylinder', 'sphere', 'cone', 'torus', 'wedge'] },
      ...(['box', 'cylinder', 'sphere', 'cone', 'torus', 'wedge'] as const).map((kind) => ({
        ...spawnPrimitive(kind),
        id: kind,
      })),
    ];
    const outcome = evaluator.evaluate({ rootId: root.id, nodes });
    expect(outcome.warnings).toEqual([]);
    expect(openEdges(outcome.mesh)).toEqual([]);
    expect(volume(outcome.mesh)).toBeGreaterThan(0);
  });
});

/** The same bundle with the root's children reversed. */
function reverseChildren(bundle: NodeBundle): NodeBundle {
  return {
    rootId: bundle.rootId,
    nodes: bundle.nodes.map((node) =>
      node.id === bundle.rootId && node.kind === 'boolean'
        ? { ...node, children: [...node.children].reverse() }
        : node,
    ),
  };
}
