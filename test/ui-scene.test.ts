/**
 * What is clickable, what is snappable, and what gets evaluated.
 *
 * These three questions have one answer between them — the bounds tree — and
 * getting it wrong is invisible in a way most bugs are not: a solid that is
 * simply not pickable looks like a broken mouse, and a hidden node that still
 * cuts a hole looks like the kernel is wrong.
 *
 * The bounds themselves come from the kernel in the real app. Here they are
 * seeded directly, which is the point of `PrimitiveBoundsLookup` being a
 * function type: none of this needs a WASM module to be checked.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  IDENTITY_TRS,
  booleanNode,
  insertBundle,
  insertNode,
  makeTrs,
  placedPrimitive,
  spawnPrimitive,
  vec3,
  type NodeId,
  type PrimitiveKind,
} from '../src/core/index.js';
import { PickRegistry, makeRay, type Aabb } from '../src/input/index.js';
import {
  PrimitiveBoundsCache,
  boundsChannel,
  buildPickTargets,
  buildSnapField,
  documentBounds,
  localBounds,
  unionAabb,
  visibleBundle,
  worldBounds,
} from '../src/ui/index.js';

/** A 60mm cube centred on its own origin — what the registry's defaults describe. */
const UNIT_BOX: Aabb = { min: [-0.03, -0.03, -0.03], max: [0.03, 0.03, 0.03] };

/** Every primitive is a 60mm box as far as these tests are concerned. */
const boxBounds = (): Aabb => UNIT_BOX;

function placeBox(document: CarveDocument, parentId: NodeId, at: number, name = 'Box'): NodeId {
  const bundle = placedPrimitive(
    spawnPrimitive('box', { name }),
    makeTrs({ translation: vec3(at, 0, 0) }),
    { name },
  );
  document.dispatch(insertBundle(bundle, parentId));
  return bundle.rootId;
}

describe('bounds up the tree', () => {
  it('reports a primitive’s own bounds unchanged', () => {
    const document = CarveDocument.create();
    const box = spawnPrimitive('box');
    document.dispatch(insertBundle(placedPrimitive(box, IDENTITY_TRS), document.rootId));
    expect(localBounds(document, box.id, boxBounds)).toEqual(UNIT_BOX);
  });

  it('lifts a child’s bounds through the transform that places it', () => {
    const document = CarveDocument.create();
    const placed = placeBox(document, document.rootId, 0.5);
    // The transform node's own bounds are in its own frame, so the offset is
    // *not* in them — `worldMatrix` carries it. Getting this backwards
    // double-counts every translation.
    expect(localBounds(document, placed, boxBounds)).toEqual(UNIT_BOX);
    expect(worldBounds(document, [placed], boxBounds)?.min[0]).toBeCloseTo(0.47, 9);
  });

  it('unions a boolean’s operands', () => {
    const document = CarveDocument.create();
    const op = booleanNode({ op: 'union' });
    document.dispatch(insertNode(op, document.rootId));
    placeBox(document, op.id, -0.5);
    placeBox(document, op.id, 0.5);

    const bounds = localBounds(document, op.id, boxBounds);
    expect(bounds?.min[0]).toBeCloseTo(-0.53, 9);
    expect(bounds?.max[0]).toBeCloseTo(0.53, 9);
  });

  it('returns null when nothing underneath has known bounds yet', () => {
    const document = CarveDocument.create();
    placeBox(document, document.rootId, 0);
    // An empty box at the origin would be a pickable target the size of a
    // point, sitting exactly where the user is most likely to click.
    expect(localBounds(document, document.rootId, () => undefined)).toBeNull();
    expect(documentBounds(document, () => undefined)).toBeNull();
  });

  it('unions boxes, tolerating an absent one on either side', () => {
    expect(unionAabb(null, UNIT_BOX)).toEqual(UNIT_BOX);
    expect(unionAabb(UNIT_BOX, null)).toEqual(UNIT_BOX);
    expect(unionAabb(null, null)).toBeNull();
  });
});

describe('pick targets', () => {
  it('never registers the document root, or every click would select it', () => {
    const document = CarveDocument.create();
    placeBox(document, document.rootId, 0);
    const targets = buildPickTargets(document, boxBounds);
    expect(targets.some((target) => target.nodeId === document.rootId)).toBe(false);
    expect(targets.length).toBeGreaterThan(0);
  });

  it('resolves a click on a boolean’s operand to the boolean', () => {
    const document = CarveDocument.create();
    const op = booleanNode({ op: 'subtract' });
    document.dispatch(insertNode(op, document.rootId));
    placeBox(document, op.id, 0);
    placeBox(document, op.id, 0.02);

    const registry = new PickRegistry();
    for (const target of buildPickTargets(document, boxBounds)) registry.register(target);

    // Straight down the -Z axis at the origin.
    const ray = makeRay(vec3(0, 0, 1), vec3(0, 0, -1));
    const hit = registry.pick(ray, { tree: document });
    expect(hit).not.toBeNull();
    // The policy in `src/input/pick.ts`: the outermost registered ancestor.
    expect(hit?.resolvedId).toBe(op.id);
  });

  it('drills through to the operand with the modifier', () => {
    const document = CarveDocument.create();
    const op = booleanNode({ op: 'subtract' });
    document.dispatch(insertNode(op, document.rootId));
    const first = placeBox(document, op.id, 0);
    placeBox(document, op.id, 0.5);

    const registry = new PickRegistry();
    for (const target of buildPickTargets(document, boxBounds)) registry.register(target);

    const hit = registry.pick(makeRay(vec3(0, 0, 1), vec3(0, 0, -1)), {
      tree: document,
      drillIn: true,
    });
    // The deepest target inside the winner: the primitive under the transform.
    expect(hit?.resolvedId).toBeDefined();
    expect([first, ...document.descendantsOf(first)]).toContain(hit?.resolvedId);
  });

  it('leaves a hidden subtree out entirely', () => {
    const document = CarveDocument.create();
    const visible = placeBox(document, document.rootId, 0);
    const hiddenId = placeBox(document, document.rootId, 0.5);

    const targets = buildPickTargets(document, boxBounds, { hidden: new Set([hiddenId]) });
    const ids = targets.map((target) => target.nodeId);
    expect(ids).toContain(visible);
    expect(ids).not.toContain(hiddenId);
    // …and none of its descendants either.
    for (const descendant of document.descendantsOf(hiddenId)) {
      expect(ids).not.toContain(descendant);
    }
  });
});

describe('snap features', () => {
  it('come from top-level solids only, so a drag does not catch on hidden internals', () => {
    const document = CarveDocument.create();
    const op = booleanNode({ op: 'union' });
    document.dispatch(insertNode(op, document.rootId));
    placeBox(document, op.id, 0);
    placeBox(document, op.id, 0.5);

    const field = buildSnapField(document, boxBounds);
    // 26 points per box — 8 corners, 12 edge midpoints, 6 face centres — and
    // exactly one box's worth, because the operands do not contribute.
    expect(field.size).toBe(26);
  });

  it('omits a hidden solid', () => {
    const document = CarveDocument.create();
    placeBox(document, document.rootId, 0);
    const hiddenId = placeBox(document, document.rootId, 0.5);
    expect(buildSnapField(document, boxBounds, { hidden: new Set([hiddenId]) }).size).toBe(26);
  });
});

describe('hiding a node', () => {
  it('leaves the bundle untouched when nothing is hidden — same object, same cache key', () => {
    const document = CarveDocument.create();
    placeBox(document, document.rootId, 0);
    const bundle = document.bundle();
    expect(visibleBundle(bundle, new Set())).toBe(bundle);
  });

  it('removes the node and its subtree, and unlinks it from its parent', () => {
    const document = CarveDocument.create();
    const keep = placeBox(document, document.rootId, 0);
    const drop = placeBox(document, document.rootId, 0.5);

    const pruned = visibleBundle(document.bundle(), new Set([drop]));
    const ids = pruned.nodes.map((node) => node.id);
    expect(ids).toContain(keep);
    expect(ids).not.toContain(drop);
    for (const descendant of document.descendantsOf(drop)) expect(ids).not.toContain(descendant);

    const root = pruned.nodes.find((node) => node.id === pruned.rootId);
    expect(root && 'children' in root ? root.children : []).toEqual([keep]);
  });

  it('does not touch the document — hiding is view state', () => {
    const document = CarveDocument.create();
    const drop = placeBox(document, document.rootId, 0);
    const depth = document.undoDepth;

    visibleBundle(document.bundle(), new Set([drop]));
    expect(document.has(drop)).toBe(true);
    expect(document.undoDepth).toBe(depth);
  });

  it('yields an empty bundle when the root itself is hidden', () => {
    const document = CarveDocument.create();
    placeBox(document, document.rootId, 0);
    expect(visibleBundle(document.bundle(), new Set([document.rootId])).nodes).toEqual([]);
  });
});

describe('the bounds cache', () => {
  it('asks the kernel once per distinct shape, on a channel of that shape’s own', () => {
    const asked: string[] = [];
    const cache = new PrimitiveBoundsCache((spec, options) => {
      asked.push(options.channel);
      // `fit: 0` turns framing off, which is what makes the reported bounds the
      // solid's true size rather than a thumbnail's.
      expect(spec.fit).toBe(0);
      return Promise.resolve(null);
    });

    const box = spawnPrimitive('box');
    const wide = { ...box.params, width: 0.2 };
    expect(cache.lookup('box', box.params)).toBeUndefined();
    expect(cache.lookup('box', box.params)).toBeUndefined();
    expect(cache.lookup('box', wide)).toBeUndefined();

    // Two shapes, two channels, no repeat for the shape asked about twice.
    expect(new Set(asked).size).toBe(2);
    expect(asked).toHaveLength(2);
    expect(asked[0]).toBe(boundsChannel('box', box.params));
  });

  it('serves a seeded answer without asking at all', () => {
    let asked = 0;
    const cache = new PrimitiveBoundsCache(() => {
      asked += 1;
      return Promise.resolve(null);
    });
    const box = spawnPrimitive('box');
    cache.put('box', box.params, UNIT_BOX);
    expect(cache.lookup('box', box.params)).toEqual(UNIT_BOX);
    expect(asked).toBe(0);
  });

  it('gives every primitive kind a distinct channel', () => {
    const box = spawnPrimitive('box');
    const kinds: PrimitiveKind[] = ['box', 'sphere'];
    const channels = kinds.map((kind) => boundsChannel(kind, box.params));
    expect(new Set(channels).size).toBe(kinds.length);
  });
});
