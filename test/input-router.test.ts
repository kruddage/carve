/**
 * The router: intents in, commands out.
 *
 * This is where #8's first done-when is actually held down — *all three
 * adapters drive the same operations through the same interface* — because the
 * router is the interface. Everything asserted here is true for a mouse, a
 * controller and a hand alike, since none of them reaches the document any
 * other way.
 *
 * Three things get the most attention:
 *
 *   - **A drag is one undo entry.** Sixty updates, one entry, and undo puts the
 *     solid back where it started. Without this, undo after a hand-drag walks
 *     back frame by frame and reads as broken.
 *   - **Cancel leaves nothing behind.** Not an error path: hand tracking
 *     cancels constantly.
 *   - **Bad input is answered, not thrown.** Adapters run inside a frame loop.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  groupNode,
  insertBundle,
  insertNode,
  makeTrs,
  primitiveNode,
  vec3,
  type NodeId,
} from '../src/core/index.js';
import {
  DEFAULT_SNAP_SETTINGS,
  IntentRouter,
  SNAP_OFF,
  SnapField,
  action,
  hover,
  makeDelta,
  select,
  transformBegin,
  transformCancel,
  transformCommit,
  transformUpdate,
} from '../src/input/index.js';

import { bracketDocument, idFactory, placed } from './support/document-fixture.js';
import { UNIT_CUBE_BOUNDS, rotationAbout } from './support/input-fixture.js';

function routerWithBracket(): {
  router: IntentRouter;
  document: CarveDocument;
  ids: ReturnType<typeof bracketDocument>['ids'];
} {
  const { document, ids } = bracketDocument();
  // Snapping off unless a test asks for it: a 1mm grid would quantize every
  // expected number here and hide the arithmetic being checked.
  return { router: new IntentRouter({ document, snap: SNAP_OFF }), document, ids };
}

function translationOf(
  document: CarveDocument,
  nodeId: NodeId,
): { x: number; y: number; z: number } {
  const node = document.expect(nodeId);
  if (node.kind !== 'transform') throw new Error(`${nodeId} is not a transform node`);
  return node.transform.translation;
}

describe('hover and select', () => {
  it('tracks the hovered node and notifies listeners once per change', () => {
    const { router, ids } = routerWithBracket();
    const seen: (NodeId | null)[] = [];
    router.subscribeHover((nodeId) => seen.push(nodeId));

    expect(router.handle(hover(ids.holeA)).status).toBe('applied');
    // The same node again is a no-op: a pointer that has not left a solid
    // produces one of these per frame.
    expect(router.handle(hover(ids.holeA)).status).toBe('ignored');
    expect(router.handle(hover(null)).status).toBe('applied');

    expect(seen).toEqual([ids.holeA, null]);
    expect(router.hovered).toBeNull();
  });

  it('treats a hover on a node that no longer exists as a hover on nothing', () => {
    const { router, ids } = routerWithBracket();
    router.handle(hover(ids.holeA));
    expect(router.handle(hover('gone')).status).toBe('applied');
    expect(router.hovered).toBeNull();
  });

  it('replaces the selection, and clears it on empty space', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(select(ids.holeA, false));
    expect(document.selection).toEqual([ids.holeA]);

    router.handle(select(ids.holeB, false));
    expect(document.selection).toEqual([ids.holeB]);

    router.handle(select(null, false));
    expect(document.selection).toEqual([]);
  });

  it('toggles with an additive select', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(select(ids.holeA, true));
    router.handle(select(ids.holeB, true));
    expect(document.selection).toEqual([ids.holeA, ids.holeB]);

    router.handle(select(ids.holeA, true));
    expect(document.selection).toEqual([ids.holeB]);
  });

  it('rejects a select on an unknown node instead of clearing the selection', () => {
    const { router, document, ids } = routerWithBracket();
    router.handle(select(ids.holeA, false));

    const outcome = router.handle(select('nope', false));

    expect(outcome.status).toBe('rejected');
    expect(outcome.reason).toBe('unknown-node');
    expect(document.selection).toEqual([ids.holeA]);
  });
});

describe('a translate drag', () => {
  it('coalesces every frame into a single undo entry', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'translate'));
    for (let frame = 1; frame <= 60; frame += 1) {
      router.handle(transformUpdate(makeDelta({ translation: vec3(frame / 600, 0, 0) })));
    }
    router.handle(transformCommit());

    expect(document.undoDepth).toBe(1);
    expect(translationOf(document, ids.holeA).x).toBeCloseTo(-0.06 + 0.1, 9);

    document.undo();
    expect(translationOf(document, ids.holeA).x).toBeCloseTo(-0.06, 9);
  });

  it('is cumulative, so a dropped update is invisible by the next one', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(0.05, 0, 0) })));
    // …frame lost…
    router.handle(transformUpdate(makeDelta({ translation: vec3(0.2, 0, 0) })));
    router.handle(transformCommit());

    expect(translationOf(document, ids.holeA).x).toBeCloseTo(-0.06 + 0.2, 9);
  });

  it('resolves a picked primitive to the transform node above it', () => {
    const { router, ids } = routerWithBracket();

    const outcome = router.handle(transformBegin(ids.platePrimitive, 'translate'));

    expect(outcome.status).toBe('applied');
    expect(outcome.nodeId).toBe(ids.plate);
    expect(router.transforming).toEqual({ nodeId: ids.plate, mode: 'translate' });
    router.handle(transformCancel('user'));
  });

  it('writes through an ancestor transform rather than into world space', () => {
    // A wrapper rotated 90° about +Y holds the solid; a world-space nudge along
    // +Z must land as a local -X, or a grab inside a rotated group drifts.
    const nextId = idFactory();
    const root = groupNode({ id: 'root' });
    const document = CarveDocument.create({ root });
    const outer = placed(
      nextId,
      'box',
      { width: 1, height: 1, depth: 1 },
      makeTrs({ rotation: rotationAbout(vec3(0, 1, 0), 90) }),
    );
    document.dispatch(insertBundle(outer, root.id));
    const inner = placed(
      nextId,
      'box',
      { width: 1, height: 1, depth: 1 },
      makeTrs({ translation: vec3(1, 0, 0) }),
    );
    document.dispatch(insertBundle(inner, outer.rootId));

    const router = new IntentRouter({ document, snap: SNAP_OFF });
    router.handle(transformBegin(inner.rootId, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(0, 0, 1) })));
    router.handle(transformCommit());

    const local = translationOf(document, inner.rootId);
    expect(local.x).toBeCloseTo(0, 5);
    expect(local.y).toBeCloseTo(0, 5);
    expect(local.z).toBeCloseTo(0, 5);
  });

  it('cancels back to where it started and leaves no undo entry', () => {
    const { router, document, ids } = routerWithBracket();
    const before = translationOf(document, ids.holeA);

    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(1, 1, 1) })));
    const outcome = router.handle(transformCancel('tracking-lost'));

    expect(outcome.status).toBe('applied');
    expect(translationOf(document, ids.holeA)).toEqual(before);
    expect(document.undoDepth).toBe(0);
    expect(router.transforming).toBeNull();
  });

  it('abort() ends a drag no intent is coming for', () => {
    const { router, document, ids } = routerWithBracket();
    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(1, 0, 0) })));

    expect(router.abort('interrupted')).toBe(true);
    expect(router.abort()).toBe(false);
    expect(document.undoDepth).toBe(0);
  });
});

describe('rotate and scale', () => {
  it('rotates about the pivot the adapter passed, not the node origin', () => {
    const { router, document, ids } = routerWithBracket();

    // holeA sits at x = -0.06. Turning it 90° about +Y through the origin
    // should swing it onto -Z.
    router.handle(transformBegin(ids.holeA, 'rotate', vec3(0, 0, 0)));
    router.handle(transformUpdate(makeDelta({ rotation: rotationAbout(vec3(0, 1, 0), 90) })));
    router.handle(transformCommit());

    const local = translationOf(document, ids.holeA);
    expect(local.x).toBeCloseTo(0, 5);
    expect(local.z).toBeCloseTo(0.06, 5);
  });

  it('rotates in place when no pivot is given', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'rotate'));
    router.handle(transformUpdate(makeDelta({ rotation: rotationAbout(vec3(0, 1, 0), 90) })));
    router.handle(transformCommit());

    expect(translationOf(document, ids.holeA).x).toBeCloseTo(-0.06, 9);
    expect(document.expect(ids.holeA).kind).toBe('transform');
  });

  it('ignores the parts of a delta its mode does not own', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(
      transformUpdate(
        makeDelta({
          translation: vec3(0.1, 0, 0),
          rotation: rotationAbout(vec3(0, 1, 0), 90),
          scale: vec3(3, 3, 3),
        }),
      ),
    );
    router.handle(transformCommit());

    const node = document.expect(ids.holeA);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.translation.x).toBeCloseTo(0.04, 9);
    expect(node.transform.scale).toEqual(vec3(1, 1, 1));
    expect(node.transform.rotation.y).toBeCloseTo(0, 9);
  });

  it('scales about the pivot, so the handle you took hold of stays put', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'scale', vec3(0, 0, 0)));
    router.handle(transformUpdate(makeDelta({ scale: vec3(2, 2, 2) })));
    router.handle(transformCommit());

    const node = document.expect(ids.holeA);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.scale.x).toBeCloseTo(2, 6);
    // Twice as far from the pivot, because the pivot is the origin.
    expect(node.transform.translation.x).toBeCloseTo(-0.12, 6);
  });

  it('grab moves and turns together, which is what a hand does', () => {
    const { router, document, ids } = routerWithBracket();

    router.handle(transformBegin(ids.holeA, 'grab', vec3(-0.06, 0, 0)));
    router.handle(
      transformUpdate(
        makeDelta({
          translation: vec3(0.1, 0, 0),
          rotation: rotationAbout(vec3(0, 1, 0), 90),
        }),
      ),
    );
    router.handle(transformCommit());

    const node = document.expect(ids.holeA);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.translation.x).toBeCloseTo(0.04, 5);
    expect(Math.abs(node.transform.rotation.y)).toBeCloseTo(Math.SQRT1_2, 5);
  });
});

describe('snapping during a drag', () => {
  it('quantizes the world-space origin to the grid', () => {
    const { document, ids } = routerWithBracket();
    const router = new IntentRouter({ document, snap: DEFAULT_SNAP_SETTINGS });

    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(0.10037, 0, 0) })));
    router.handle(transformCommit());

    // Started at -0.06, wanted 0.04037, landed on the 1mm grid at 0.04.
    expect(translationOf(document, ids.holeA).x).toBeCloseTo(0.04, 9);
  });

  it('snaps to another solid’s corner and says which one', () => {
    const { document, ids } = routerWithBracket();
    const field = new SnapField();
    field.setFromBounds(ids.plate, UNIT_CUBE_BOUNDS, document.worldMatrix(ids.plate));
    const router = new IntentRouter({ document, snap: DEFAULT_SNAP_SETTINGS, snapField: field });

    router.handle(transformBegin(ids.holeA, 'translate'));
    // Aim just short of the (0.5, 0.5, 0.5) corner of the plate's box.
    const outcome = router.handle(
      transformUpdate(makeDelta({ translation: vec3(0.55, 0.49, 0.505) })),
    );
    router.handle(transformCommit());

    expect(outcome.snappedTo?.kind).toBe('corner');
    const local = translationOf(document, ids.holeA);
    expect(local.x).toBeCloseTo(0.5, 9);
    expect(local.y).toBeCloseTo(0.5, 9);
    expect(local.z).toBeCloseTo(0.5, 9);
  });

  it('never snaps a node to its own features', () => {
    const { document, ids } = routerWithBracket();
    const field = new SnapField();
    field.setFromBounds(ids.holeA, UNIT_CUBE_BOUNDS, document.worldMatrix(ids.holeA));
    const router = new IntentRouter({ document, snap: DEFAULT_SNAP_SETTINGS, snapField: field });

    router.handle(transformBegin(ids.holeA, 'translate'));
    const outcome = router.handle(transformUpdate(makeDelta({ translation: vec3(0.003, 0, 0) })));

    expect(outcome.snappedTo).toBeUndefined();
  });

  it('takes new settings mid-session', () => {
    const { router, document, ids } = routerWithBracket();
    router.setSnapSettings(DEFAULT_SNAP_SETTINGS);
    expect(router.snapSettings.grid).toBe(DEFAULT_SNAP_SETTINGS.grid);

    router.handle(transformBegin(ids.holeA, 'translate'));
    router.handle(transformUpdate(makeDelta({ translation: vec3(0.10037, 0, 0) })));
    router.handle(transformCommit());

    expect(translationOf(document, ids.holeA).x).toBeCloseTo(0.04, 9);
  });
});

describe('refusals', () => {
  it('rejects a grab on a node that does not exist', () => {
    const { router } = routerWithBracket();
    const outcome = router.handle(transformBegin('nope', 'translate'));
    expect(outcome).toMatchObject({ status: 'rejected', reason: 'unknown-node' });
  });

  it('rejects a grab on a node with no transform to write to', () => {
    // A primitive parented straight to a group: nothing above it holds a TRS.
    const document = CarveDocument.create({ root: groupNode({ id: 'root' }) });
    const bare = primitiveNode({ id: 'bare', primitive: 'box', params: {} });
    document.dispatch(insertNode(bare, 'root'));
    const router = new IntentRouter({ document });

    const outcome = router.handle(transformBegin('bare', 'translate'));

    expect(outcome).toMatchObject({ status: 'rejected', reason: 'no-transform-target' });
    expect(document.activeGestureId).toBeNull();
  });

  it('rejects a second grab while one is in flight', () => {
    const { router, ids } = routerWithBracket();
    router.handle(transformBegin(ids.holeA, 'translate'));

    const outcome = router.handle(transformBegin(ids.holeB, 'translate'));

    expect(outcome).toMatchObject({ status: 'rejected', reason: 'already-transforming' });
    expect(router.transforming?.nodeId).toBe(ids.holeA);
  });

  it('ignores updates and ends when nothing is being transformed', () => {
    const { router } = routerWithBracket();
    expect(router.handle(transformUpdate(makeDelta())).status).toBe('ignored');
    expect(router.handle(transformCommit()).status).toBe('ignored');
    expect(router.handle(transformCancel('user')).status).toBe('ignored');
  });

  it('rejects structural edits and undo while a drag is open', () => {
    const { router, ids } = routerWithBracket();
    router.handle(transformBegin(ids.holeA, 'translate'));

    for (const intent of [
      action({ name: 'undo' }),
      action({ name: 'delete', targets: [ids.holeB] }),
      action({ name: 'spawn-primitive', primitive: 'box' }),
    ]) {
      expect(router.handle(intent)).toMatchObject({ status: 'rejected', reason: 'gesture-open' });
    }
  });

  it('reports a document refusal as a rejection rather than throwing', () => {
    const { router, document, ids } = routerWithBracket();
    // A gesture opened behind the router's back: the document will refuse the
    // dispatch, and the frame loop must survive it.
    document.beginGesture('somebody-else');

    const outcome = router.handle(select(ids.holeA, false));
    expect(outcome.status).toBe('applied');

    const grab = router.handle(transformBegin(ids.holeA, 'translate'));
    expect(grab).toMatchObject({ status: 'rejected', reason: 'gesture-open' });
  });

  it('publishes every outcome to subscribers, refusals included', () => {
    const { router, ids } = routerWithBracket();
    const statuses: string[] = [];
    const unsubscribe = router.subscribe((outcome) => statuses.push(outcome.status));

    router.handle(select(ids.holeA, false));
    router.handle(select('nope', false));
    unsubscribe();
    router.handle(select(ids.holeB, false));

    expect(statuses).toEqual(['applied', 'rejected']);
  });
});

describe('actions', () => {
  it('spawns a primitive, selects it, and undoes as one entry', () => {
    const { router, document } = routerWithBracket();

    const outcome = router.handle(
      action({
        name: 'spawn-primitive',
        primitive: 'cylinder',
        transform: makeTrs({ translation: vec3(0, 0.1, 0) }),
      }),
    );

    expect(outcome.status).toBe('applied');
    const spawned = outcome.nodeId ?? '';
    expect(document.has(spawned)).toBe(true);
    expect(document.selection).toEqual([spawned]);
    expect(document.parentOf(spawned)).toBe(document.rootId);

    document.undo();
    expect(document.has(spawned)).toBe(false);
  });

  it('honours an explicit parent and rejects one that is gone', () => {
    const { router, document, ids } = routerWithBracket();

    const inside = router.handle(
      action({ name: 'spawn-primitive', primitive: 'box', parentId: ids.cut }),
    );
    expect(document.parentOf(inside.nodeId ?? '')).toBe(ids.cut);

    expect(
      router.handle(action({ name: 'spawn-primitive', primitive: 'box', parentId: 'gone' })),
    ).toMatchObject({ status: 'rejected', reason: 'unknown-node' });
  });

  it('applies a boolean to the selection, keeping operand order', () => {
    const { router, document, ids } = routerWithBracket();
    router.handle(select(ids.holeA, false));
    router.handle(select(ids.holeB, true));

    const outcome = router.handle(action({ name: 'apply-boolean', op: 'subtract' }));

    const created = outcome.nodeId ?? '';
    expect(document.expect(created).kind).toBe('boolean');
    expect(document.childrenOf(created)).toEqual([ids.holeA, ids.holeB]);
    expect(document.selection).toEqual([created]);
  });

  it('rejects a boolean with fewer than two operands', () => {
    const { router, ids } = routerWithBracket();
    router.handle(select(ids.holeA, false));

    expect(router.handle(action({ name: 'apply-boolean', op: 'union' }))).toMatchObject({
      status: 'rejected',
      reason: 'needs-two-operands',
    });
  });

  it('deletes the selection as one undoable edit', () => {
    const { router, document, ids } = routerWithBracket();
    router.handle(select(ids.holeA, false));
    router.handle(select(ids.holeB, true));

    router.handle(action({ name: 'delete' }));

    expect(document.has(ids.holeA)).toBe(false);
    expect(document.has(ids.holeB)).toBe(false);

    document.undo();
    expect(document.has(ids.holeA)).toBe(true);
    expect(document.has(ids.holeB)).toBe(true);
  });

  it('drops targets already covered by an ancestor in the same delete', () => {
    // Deleting a boolean and one of its operands together: removing the operand
    // afterwards would run against a store that no longer holds it and roll the
    // whole composite back.
    const { router, document, ids } = routerWithBracket();

    const outcome = router.handle(action({ name: 'delete', targets: [ids.cut, ids.holeA] }));

    expect(outcome.status).toBe('applied');
    expect(document.has(ids.cut)).toBe(false);
    expect(document.has(ids.holeA)).toBe(false);
  });

  it('refuses to delete the root, and to delete nothing', () => {
    const { router, document } = routerWithBracket();

    expect(router.handle(action({ name: 'delete' }))).toMatchObject({
      status: 'rejected',
      reason: 'nothing-selected',
    });
    expect(router.handle(action({ name: 'delete', targets: [document.rootId] }))).toMatchObject({
      status: 'rejected',
      reason: 'cannot-delete-root',
    });
  });

  it('undoes and redoes, and says so when there is nothing to do', () => {
    const { router, document, ids } = routerWithBracket();

    expect(router.handle(action({ name: 'undo' }))).toMatchObject({ reason: 'nothing-to-undo' });

    router.handle(select(ids.holeA, false));
    router.handle(select(ids.holeB, true));
    router.handle(action({ name: 'apply-boolean', op: 'union' }));

    expect(router.handle(action({ name: 'undo' })).status).toBe('applied');
    expect(document.childrenOf(ids.cut)).toContain(ids.holeA);
    expect(router.handle(action({ name: 'redo' })).status).toBe('applied');
    expect(router.handle(action({ name: 'redo' }))).toMatchObject({ reason: 'nothing-to-redo' });
  });
});
