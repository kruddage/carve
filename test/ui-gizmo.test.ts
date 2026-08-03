/**
 * The transform gizmo: hitting a handle, and what dragging it means.
 *
 * All of it runs in Node against rays and matrices, with no canvas, because the
 * handle table in `src/render/gizmo.ts` is plain data and the drag math in
 * `src/ui/gizmo-drag.ts` is pure. That was the reason for the split, and this
 * file is the payoff: "clicking the X arrow starts an X drag" is a test rather
 * than something someone checks by hand after every change.
 *
 * The last group is the one that matters most for #9's third done-when. A
 * gizmo drag has to be **one** undo entry however many frames it lasted, so the
 * full path — begin, sixty updates, commit — is driven through the real
 * `IntentRouter` against a real document.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  insertBundle,
  makeTrs,
  placedPrimitive,
  quat,
  spawnPrimitive,
  vec3,
  type NodeId,
  type Vec3,
} from '../src/core/index.js';
import {
  IntentRouter,
  SNAP_OFF,
  makeRay,
  transformBegin,
  transformCancel,
  transformCommit,
  transformUpdate,
} from '../src/input/index.js';
import { GIZMO_HANDLES, findHandle, handlesFor } from '../src/render/index.js';
import {
  beginGizmoDrag,
  closestPointOnLine,
  deltaFor,
  gizmoFrame,
  pickGizmoHandle,
  screenScale,
  worldAxis,
} from '../src/ui/index.js';

/** A document with one placed box, and the transform node that holds it. */
function oneBox(
  at: Vec3 = vec3(0, 0, 0),
  rotation = quat(0, 0, 0, 1),
): {
  document: CarveDocument;
  nodeId: NodeId;
} {
  const document = CarveDocument.create();
  const bundle = placedPrimitive(spawnPrimitive('box'), makeTrs({ translation: at, rotation }), {
    name: 'Box',
  });
  document.dispatch(insertBundle(bundle, document.rootId));
  return { document, nodeId: bundle.rootId };
}

/** A ray from `from` towards `to`. */
function rayTowards(from: Vec3, to: Vec3) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const length = Math.hypot(dx, dy, dz);
  return makeRay(from, vec3(dx / length, dy / length, dz / length));
}

describe('the handle table', () => {
  it('gives every mode a full set of handles', () => {
    expect(handlesFor('translate').map((handle) => handle.id)).toEqual([
      'translate-plane-x',
      'translate-plane-y',
      'translate-plane-z',
      'translate-x',
      'translate-y',
      'translate-z',
    ]);
    expect(handlesFor('rotate')).toHaveLength(3);
    // Three axis handles plus the uniform cube.
    expect(handlesFor('scale')).toHaveLength(4);
  });

  it('puts overlapping handles first, so the more specific one is reachable', () => {
    const ids = GIZMO_HANDLES.map((handle) => handle.id);
    // The uniform cube sits where all three shafts begin; the plane quads sit
    // across the near end of two shafts each. First-match picking needs both
    // ahead of the shafts or neither could ever be grabbed.
    expect(ids.indexOf('scale-uniform')).toBeLessThan(ids.indexOf('scale-x'));
    expect(ids.indexOf('translate-plane-x')).toBeLessThan(ids.indexOf('translate-x'));
  });

  it('has a unique id per handle', () => {
    expect(new Set(GIZMO_HANDLES.map((handle) => handle.id)).size).toBe(GIZMO_HANDLES.length);
  });
});

describe('the gizmo’s frame', () => {
  it('sits at the node’s world origin', () => {
    const { document, nodeId } = oneBox(vec3(0.1, 0.2, -0.3));
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 1);
    expect(frame?.origin.x).toBeCloseTo(0.1, 9);
    expect(frame?.origin.y).toBeCloseTo(0.2, 9);
    expect(frame?.origin.z).toBeCloseTo(-0.3, 9);
  });

  it('is axis-aligned in world space', () => {
    const quarterTurnY = quat(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4));
    const { document, nodeId } = oneBox(vec3(0, 0, 0), quarterTurnY);
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 1);
    expect(frame).not.toBeNull();
    if (!frame) return;
    const x = worldAxis(frame, 'x');
    expect(x.x).toBeCloseTo(1, 9);
    expect(x.z).toBeCloseTo(0, 9);
  });

  it('follows the node’s own rotation in local space', () => {
    // A quarter turn about +Y sends local +X to world -Z.
    const quarterTurnY = quat(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4));
    const { document, nodeId } = oneBox(vec3(0, 0, 0), quarterTurnY);
    const frame = gizmoFrame(document, nodeId, 'translate', 'local', 1);
    if (!frame) return;
    const x = worldAxis(frame, 'x');
    expect(x.x).toBeCloseTo(0, 6);
    expect(x.z).toBeCloseTo(-1, 6);
  });

  it('stays world-aligned in scale mode even when the toggle says local', () => {
    // `TransformDelta.scale` is a world-axis diagonal; a rotated axis scale is
    // a shear with no TRS form. See the header of `gizmo-drag.ts`.
    const quarterTurnY = quat(0, Math.sin(Math.PI / 4), 0, Math.cos(Math.PI / 4));
    const { document, nodeId } = oneBox(vec3(0, 0, 0), quarterTurnY);
    const frame = gizmoFrame(document, nodeId, 'scale', 'local', 1);
    if (!frame) return;
    expect(worldAxis(frame, 'x').x).toBeCloseTo(1, 9);
  });

  it('strips the node’s scale, so the gizmo is not three times as long on a 3× part', () => {
    const document = CarveDocument.create();
    const bundle = placedPrimitive(spawnPrimitive('box'), makeTrs({ scale: vec3(3, 3, 3) }), {
      name: 'Big',
    });
    document.dispatch(insertBundle(bundle, document.rootId));

    const frame = gizmoFrame(document, bundle.rootId, 'translate', 'local', 1);
    if (!frame) return;
    const x = worldAxis(frame, 'x');
    expect(Math.hypot(x.x, x.y, x.z)).toBeCloseTo(1, 9);
  });

  it('grows with distance so the gizmo holds its apparent size', () => {
    const near = screenScale(vec3(0, 0, 0.5), vec3(0, 0, 0), 50);
    const far = screenScale(vec3(0, 0, 5), vec3(0, 0, 0), 50);
    expect(far / near).toBeCloseTo(10, 6);
  });
});

describe('picking a handle', () => {
  const { document, nodeId } = oneBox();
  const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);

  it('hits the X shaft from in front of it', () => {
    if (!frame) return;
    // The shaft runs from 0.16 to ~1.18 in unit space; at size 0.1 that is
    // 16mm to 118mm along +X. Aim at 70mm.
    const hit = pickGizmoHandle(rayTowards(vec3(0.07, 0, 1), vec3(0.07, 0, 0)), frame, 'translate');
    expect(hit?.id).toBe('translate-x');
  });

  it('hits the Y shaft, not the X one', () => {
    if (!frame) return;
    const hit = pickGizmoHandle(rayTowards(vec3(0, 0.07, 1), vec3(0, 0.07, 0)), frame, 'translate');
    expect(hit?.id).toBe('translate-y');
  });

  it('hits the XY plane quad between the two shafts', () => {
    if (!frame) return;
    // Unit space 0.24–0.52 on both X and Y, in the plane whose normal is Z.
    const hit = pickGizmoHandle(
      rayTowards(vec3(0.038, 0.038, 1), vec3(0.038, 0.038, 0)),
      frame,
      'translate',
    );
    expect(hit?.id).toBe('translate-plane-z');
  });

  it('misses when the ray goes nowhere near the gizmo', () => {
    if (!frame) return;
    expect(
      pickGizmoHandle(rayTowards(vec3(5, 5, 1), vec3(5, 5, 0)), frame, 'translate'),
    ).toBeNull();
  });

  it('offers only the handles of the current mode', () => {
    if (!frame) return;
    const ray = rayTowards(vec3(0.07, 0, 1), vec3(0.07, 0, 0));
    expect(pickGizmoHandle(ray, frame, 'translate')?.mode).toBe('translate');
    expect(pickGizmoHandle(ray, frame, 'scale')?.mode).toBe('scale');
  });

  it('hits a rotation ring on its band and misses inside it', () => {
    const rotateFrame = gizmoFrame(document, nodeId, 'rotate', 'world', 0.1);
    if (!rotateFrame) return;

    // The Z ring lies in the XY plane at radius 1 — 100mm at this size.
    const onBand = pickGizmoHandle(
      rayTowards(vec3(0.1, 0, 1), vec3(0.1, 0, 0)),
      rotateFrame,
      'rotate',
    );
    expect(onBand?.id).toBe('rotate-z');

    // Halfway to the centre is inside the disc and must not count, or a click
    // anywhere near the middle would grab whichever ring is listed first.
    const inside = pickGizmoHandle(
      rayTowards(vec3(0.05, 0, 1), vec3(0.05, 0, 0)),
      rotateFrame,
      'rotate',
    );
    expect(inside?.id).not.toBe('rotate-z');
  });
});

describe('dragging a handle', () => {
  it('moves along the axis and only along it', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);
    const handle = findHandle('translate-x');
    if (!frame || !handle) return;

    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.07, 0, 1), vec3(0.07, 0, 0)));
    expect(drag).not.toBeNull();
    if (!drag) return;

    // The cursor moves up as well as right; only the X component may survive.
    const delta = deltaFor(drag, rayTowards(vec3(0.15, 0.4, 1), vec3(0.15, 0.4, 0)));
    expect(delta).not.toBeNull();
    if (!delta) return;
    expect(delta.translation.x).toBeCloseTo(0.08, 6);
    expect(delta.translation.y).toBeCloseTo(0, 6);
    expect(delta.translation.z).toBeCloseTo(0, 6);
  });

  it('moves in two axes on a plane handle', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);
    const handle = findHandle('translate-plane-z');
    if (!frame || !handle) return;

    const drag = beginGizmoDrag(
      handle,
      frame,
      rayTowards(vec3(0.038, 0.038, 1), vec3(0.038, 0.038, 0)),
    );
    if (!drag) return;
    const delta = deltaFor(drag, rayTowards(vec3(0.1, 0.2, 1), vec3(0.1, 0.2, 0)));
    if (!delta) return;
    expect(delta.translation.x).toBeCloseTo(0.062, 6);
    expect(delta.translation.y).toBeCloseTo(0.162, 6);
    // The plane's normal is Z, so depth must not change.
    expect(delta.translation.z).toBeCloseTo(0, 6);
  });

  it('produces a signed rotation about the ring’s axis', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'rotate', 'world', 0.1);
    const handle = findHandle('rotate-z');
    if (!frame || !handle) return;

    // Grab at +X on the ring, drag to +Y: a quarter turn about +Z.
    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.1, 0, 1), vec3(0.1, 0, 0)));
    if (!drag) return;
    const delta = deltaFor(drag, rayTowards(vec3(0, 0.1, 1), vec3(0, 0.1, 0)));
    if (!delta) return;

    const angle = 2 * Math.acos(Math.min(1, Math.abs(delta.rotation.w)));
    expect(angle).toBeCloseTo(Math.PI / 2, 5);
    expect(Math.abs(delta.rotation.z)).toBeCloseTo(Math.sin(Math.PI / 4), 5);

    // …and dragging the other way turns the other way.
    const back = deltaFor(drag, rayTowards(vec3(0, -0.1, 1), vec3(0, -0.1, 0)));
    if (!back) return;
    expect(Math.sign(back.rotation.z)).toBe(-Math.sign(delta.rotation.z));
  });

  it('scales one axis, leaving the other two at 1', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'scale', 'world', 0.1);
    const handle = findHandle('scale-x');
    if (!frame || !handle) return;

    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.05, 0, 1), vec3(0.05, 0, 0)));
    if (!drag) return;
    const delta = deltaFor(drag, rayTowards(vec3(0.1, 0, 1), vec3(0.1, 0, 0)));
    if (!delta) return;
    expect(delta.scale.x).toBeCloseTo(2, 5);
    expect(delta.scale.y).toBe(1);
    expect(delta.scale.z).toBe(1);
  });

  it('never lets a scale drag through the origin flip the part inside out', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'scale', 'world', 0.1);
    const handle = findHandle('scale-x');
    if (!frame || !handle) return;

    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.1, 0, 1), vec3(0.1, 0, 0)));
    if (!drag) return;
    const delta = deltaFor(drag, rayTowards(vec3(-0.5, 0, 1), vec3(-0.5, 0, 0)));
    if (!delta) return;
    expect(delta.scale.x).toBeGreaterThan(0);
  });

  it('scales all three axes together on the uniform cube', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'scale', 'world', 0.1);
    const handle = findHandle('scale-uniform');
    if (!frame || !handle) return;

    // One fixed camera position for both rays. The uniform handle has no axis
    // of its own and works on the plane facing the *camera*, so moving the eye
    // between samples would tilt that plane and change the answer slightly —
    // which is correct behaviour and not what this is measuring.
    const eye = vec3(0, 0, 1);
    const drag = beginGizmoDrag(handle, frame, rayTowards(eye, vec3(0.02, 0, 0)));
    if (!drag) return;
    const delta = deltaFor(drag, rayTowards(eye, vec3(0.04, 0, 0)));
    if (!delta) return;
    expect(delta.scale.x).toBeCloseTo(2, 5);
    expect(delta.scale.y).toBeCloseTo(delta.scale.x, 9);
    expect(delta.scale.z).toBeCloseTo(delta.scale.x, 9);
  });

  it('refuses a drag that is nearly parallel to its axis', () => {
    const { document, nodeId } = oneBox();
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);
    const handle = findHandle('translate-x');
    if (!frame || !handle) return;
    // Looking straight down the X axis: every cursor position maps to
    // somewhere absurdly far along the line, so there is nothing to grab.
    expect(beginGizmoDrag(handle, frame, makeRay(vec3(-5, 0, 0), vec3(1, 0, 0)))).toBeNull();
  });

  it('finds the nearest point on a line, and gives up when parallel', () => {
    const point = closestPointOnLine(
      makeRay(vec3(0.5, 1, 0), vec3(0, -1, 0)),
      vec3(0, 0, 0),
      vec3(1, 0, 0),
    );
    expect(point?.x).toBeCloseTo(0.5, 9);
    expect(
      closestPointOnLine(makeRay(vec3(0, 1, 0), vec3(1, 0, 0)), vec3(0, 0, 0), vec3(1, 0, 0)),
    ).toBeNull();
  });
});

describe('a gizmo drag through the router', () => {
  function dragBox(): { document: CarveDocument; nodeId: NodeId; router: IntentRouter } {
    const { document, nodeId } = oneBox();
    // Snapping off so the assertions are about the drag and not the 1mm grid.
    const router = new IntentRouter({ document, snap: SNAP_OFF });
    return { document, nodeId, router };
  }

  it('is one undo entry however many frames it lasted', () => {
    const { document, nodeId, router } = dragBox();
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);
    const handle = findHandle('translate-x');
    if (!frame || !handle) return;
    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.05, 0, 1), vec3(0.05, 0, 0)));
    if (!drag) return;

    const depth = document.undoDepth;
    router.handle(transformBegin(nodeId, 'translate', frame.origin));
    for (let step = 1; step <= 60; step += 1) {
      const delta = deltaFor(
        drag,
        rayTowards(vec3(0.05 + step * 0.001, 0, 1), vec3(0.05 + step * 0.001, 0, 0)),
      );
      if (delta) router.handle(transformUpdate(delta));
    }
    router.handle(transformCommit());

    expect(document.undoDepth).toBe(depth + 1);

    const moved = document.expect(nodeId);
    expect(moved.kind === 'transform' && moved.transform.translation.x).toBeCloseTo(0.06, 6);

    document.undo();
    const restored = document.expect(nodeId);
    expect(restored.kind === 'transform' && restored.transform.translation.x).toBeCloseTo(0, 9);
  });

  it('leaves no trace at all when cancelled', () => {
    const { document, nodeId, router } = dragBox();
    const frame = gizmoFrame(document, nodeId, 'translate', 'world', 0.1);
    const handle = findHandle('translate-y');
    if (!frame || !handle) return;
    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0, 0.05, 1), vec3(0, 0.05, 0)));
    if (!drag) return;

    const depth = document.undoDepth;
    router.handle(transformBegin(nodeId, 'translate', frame.origin));
    const delta = deltaFor(drag, rayTowards(vec3(0, 0.2, 1), vec3(0, 0.2, 0)));
    if (delta) router.handle(transformUpdate(delta));
    router.handle(transformCancel('user'));

    expect(document.undoDepth).toBe(depth);
    const node = document.expect(nodeId);
    expect(node.kind === 'transform' && node.transform.translation.y).toBeCloseTo(0, 9);
  });

  it('rotates the node about the ring’s axis', () => {
    const { document, nodeId, router } = dragBox();
    const frame = gizmoFrame(document, nodeId, 'rotate', 'world', 0.1);
    const handle = findHandle('rotate-y');
    if (!frame || !handle) return;

    // The Y ring lies in the XZ plane; grab at +X and drag round to -Z.
    const drag = beginGizmoDrag(handle, frame, rayTowards(vec3(0.1, 1, 0), vec3(0.1, 0, 0)));
    if (!drag) return;

    router.handle(transformBegin(nodeId, 'rotate', frame.origin));
    const delta = deltaFor(drag, rayTowards(vec3(0, 1, -0.1), vec3(0, 0, -0.1)));
    if (delta) router.handle(transformUpdate(delta));
    router.handle(transformCommit());

    const node = document.expect(nodeId);
    if (node.kind !== 'transform') return;
    const angle = 2 * Math.acos(Math.min(1, Math.abs(node.transform.rotation.w)));
    expect(angle).toBeCloseTo(Math.PI / 2, 4);
    expect(Math.abs(node.transform.rotation.y)).toBeGreaterThan(0.5);
  });
});
