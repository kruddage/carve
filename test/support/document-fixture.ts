/**
 * Shared fixtures for the document-model tests.
 *
 * Two things live here rather than being repeated in every spec: deterministic
 * node ids, and a canonical stringifier.
 *
 * Ids are counter-based in tests because a failing assertion that says
 * `expected "box-3" to be "box-4"` is diagnosable and one that compares two
 * UUIDs is not. Production ids stay random; see `createNodeId`.
 *
 * The stringifier sorts object keys before comparing. Two documents that hold
 * the same data can legitimately differ in property *insertion order* — a
 * parameter patch appends new keys, undo restores the original map — and a
 * plain `JSON.stringify` comparison would call that a state difference, which
 * would make the fuzz test fail for a reason that is not a bug.
 */

import {
  CarveDocument,
  booleanNode,
  groupNode,
  insertBundle,
  insertNode,
  makeTrs,
  placedPrimitive,
  primitiveNode,
  serialize,
  vec3,
  type NodeBundle,
  type PrimitiveKind,
  type Trs,
} from '../../src/core/index.js';

/** A fresh counter-based id source; one per test so ids restart at 1. */
export function idFactory(prefix = 'n'): () => string {
  let counter = 0;
  return () => {
    counter += 1;
    return `${prefix}${counter}`;
  };
}

/** `mulberry32` — small, fast, and seeded, so a failing fuzz run is replayable. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** JSON with object keys sorted, for order-insensitive state comparison. */
export function canonical(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    return Object.fromEntries(entries.map(([key, inner]) => [key, sortKeys(inner)]));
  }
  return value;
}

/** The whole document as a canonical string. The fuzz test's equality check. */
export function snapshot(document: CarveDocument): string {
  return canonical(serialize(document));
}

/** A transform-wrapped primitive, with ids from `nextId`. */
export function placed(
  nextId: () => string,
  primitive: PrimitiveKind,
  params: Record<string, number>,
  transform: Trs = makeTrs(),
): NodeBundle {
  return placedPrimitive(primitiveNode({ id: nextId(), primitive, params }), transform, {
    id: nextId(),
  });
}

/**
 * The bracket from issue #1's done-when, in miniature: a plate with two holes
 * subtracted from it, wrapped in a group.
 *
 * Small enough to assert against by hand, structured enough to exercise
 * ordered boolean operands, nesting, and transforms above transforms.
 */
export function bracketDocument(): {
  readonly document: CarveDocument;
  readonly ids: {
    readonly root: string;
    readonly cut: string;
    readonly plate: string;
    readonly platePrimitive: string;
    readonly holeA: string;
    readonly holeB: string;
  };
} {
  const nextId = idFactory();
  const root = groupNode({ id: 'root', name: 'Document' });
  const document = CarveDocument.create({ root, historyLimit: 10_000 });

  const plate = placed(nextId, 'box', { width: 0.2, height: 0.01, depth: 0.1 });
  const holeA = placed(
    nextId,
    'cylinder',
    { radius: 0.01, height: 0.05 },
    makeTrs({ translation: vec3(-0.06, 0, 0) }),
  );
  const holeB = placed(
    nextId,
    'cylinder',
    { radius: 0.01, height: 0.05 },
    makeTrs({ translation: vec3(0.06, 0, 0) }),
  );
  const cut = booleanNode({ id: 'cut', op: 'subtract' });

  // The plate is the first operand: subtract cuts everything after it out of
  // it, so this ordering is the difference between a drilled plate and nothing.
  document.dispatch(insertNode(cut, root.id));
  document.dispatch(insertBundle(plate, cut.id));
  document.dispatch(insertBundle(holeA, cut.id));
  document.dispatch(insertBundle(holeB, cut.id));
  document.clearHistory();

  const platePrimitive = plate.nodes[1];
  if (!platePrimitive)
    throw new Error('fixture: placed() should produce a wrapper and a primitive');

  return {
    document,
    ids: {
      root: root.id,
      cut: cut.id,
      plate: plate.rootId,
      platePrimitive: platePrimitive.id,
      holeA: holeA.rootId,
      holeB: holeB.rootId,
    },
  };
}
