/**
 * The adapters, and the two claims about them that #8 has to be able to prove.
 *
 * **Adding an adapter changes nothing anywhere else.** `describe('a device
 * nobody has written yet')` builds a complete adapter inside this file — no new
 * intent kind, no router change, and certainly nothing in `src/core/` or
 * `src/ui/` — and drives a document with it.
 *
 * **Gestures are testable without a headset.** `describe('replaying a recorded
 * session')` reads a committed fixture off disk and replays it into a document
 * in Node. No WebXR, no GPU, no hardware.
 *
 * Everything here runs against structural types rather than DOM or WebXR ones:
 * `PointerHost` is what a canvas happens to be, `XrFrameLike` is what an
 * `XRFrame` happens to be. That is what makes the two claims above testable at
 * all, and it is why those interfaces exist in the shape they do.
 */

import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import {
  CarveDocument,
  groupNode,
  insertBundle,
  makeTrs,
  quat,
  vec3,
  type NodeId,
} from '../src/core/index.js';
import {
  IntentRouter,
  PickRegistry,
  SNAP_OFF,
  action,
  createPointerAdapter,
  createSpatialAdapter,
  parseRecording,
  readControllerSample,
  remapNodeIds,
  replay,
  transformBegin,
  transformCommit,
  transformUpdate,
  makeDelta,
  type Intent,
  type PointerHost,
  type PointerSample,
  type SpatialSample,
  type XrFrameLike,
  type XrInputSourceLike,
} from '../src/input/index.js';

import { idFactory, placed } from './support/document-fixture.js';
import {
  PINCH_DRAG_DISTANCE,
  UNIT_CUBE_BOUNDS,
  cameraOnZ,
  recordPinchDrag,
  rotationAbout,
  unitCubeGeometry,
} from './support/input-fixture.js';

/** A document holding one 1m box at the origin, wrapped in its own transform. */
function boxDocument(): { document: CarveDocument; solidId: NodeId } {
  const nextId = idFactory();
  const root = groupNode({ id: 'root', name: 'Document' });
  const document = CarveDocument.create({ root });
  const solid = placed(nextId, 'box', { width: 1, height: 1, depth: 1 }, makeTrs());
  document.dispatch(insertBundle(solid, root.id));
  // The setup is not part of what any test here is measuring; leaving it in the
  // history would make every "one undo entry" assertion off by one.
  document.clearHistory();
  return { document, solidId: solid.rootId };
}

function registryFor(nodeId: NodeId, document: CarveDocument): PickRegistry {
  const registry = new PickRegistry();
  registry.register({
    nodeId,
    worldMatrix: document.worldMatrix(nodeId),
    bounds: UNIT_CUBE_BOUNDS,
    geometry: unitCubeGeometry(),
  });
  return registry;
}

/** A canvas, as far as the pointer adapter is concerned. */
function fakeHost(): PointerHost & {
  readonly listeners: Map<string, ((e: PointerSample) => void)[]>;
} {
  const listeners = new Map<string, ((e: PointerSample) => void)[]>();
  return {
    listeners,
    addEventListener(type, listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener(type, listener) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((entry) => entry !== listener),
      );
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  };
}

describe('the pointer adapter', () => {
  function harness() {
    const { document, solidId } = boxDocument();
    const registry = registryFor(solidId, document);
    const emitted: Intent[] = [];
    const drillInSeen: boolean[] = [];

    const adapter = createPointerAdapter({
      emit: (intent) => emitted.push(intent),
      camera: () => cameraOnZ(5),
      pick: (ray, picked) => {
        drillInSeen.push(picked.drillIn);
        return registry.pick(ray, { tree: document, drillIn: picked.drillIn });
      },
    });
    const host = fakeHost();
    adapter.attach(host);
    return { adapter, emitted, drillInSeen, document, solidId, host };
  }

  it('emits a hover as the pointer moves over a solid, and off it', () => {
    const { adapter, emitted, solidId } = harness();

    adapter.pointerMove({ clientX: 50, clientY: 50 });
    adapter.pointerMove({ clientX: 0, clientY: 0 });

    expect(emitted).toEqual([
      { kind: 'hover', nodeId: solidId },
      { kind: 'hover', nodeId: null },
    ]);
  });

  it('turns a press and release in place into a select', () => {
    const { adapter, emitted, solidId } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    adapter.pointerUp({ clientX: 51, clientY: 50, button: 0 });

    expect(emitted).toEqual([{ kind: 'select', nodeId: solidId, additive: false }]);
    expect(adapter.dragging).toBe(false);
  });

  it('clears the selection when the click lands on nothing', () => {
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 0, clientY: 0, button: 0 });
    adapter.pointerUp({ clientX: 0, clientY: 0, button: 0 });

    expect(emitted).toEqual([{ kind: 'select', nodeId: null, additive: false }]);
  });

  it('passes the modifier through as an additive select', () => {
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0, shiftKey: true });
    adapter.pointerUp({ clientX: 50, clientY: 50, button: 0, shiftKey: true });

    expect(emitted[0]).toMatchObject({ kind: 'select', additive: true });
  });

  it('asks the hit test to drill in when alt is held', () => {
    const { adapter, drillInSeen } = harness();

    adapter.pointerMove({ clientX: 50, clientY: 50 });
    adapter.pointerMove({ clientX: 50, clientY: 50, altKey: true });

    expect(drillInSeen).toEqual([false, true]);
  });

  it('does not begin a drag until the pointer has moved past the threshold', () => {
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    adapter.pointerMove({ clientX: 52, clientY: 50 });

    expect(emitted).toEqual([]);
    expect(adapter.dragging).toBe(false);
  });

  it('begins a drag past the threshold and commits it on release', () => {
    const { adapter, emitted, solidId } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    adapter.pointerMove({ clientX: 70, clientY: 50 });
    expect(adapter.dragging).toBe(true);
    adapter.pointerUp({ clientX: 70, clientY: 50, button: 0 });

    expect(emitted.map((intent) => intent.kind)).toEqual([
      'transform-begin',
      'transform-update',
      'transform-update',
      'transform-commit',
    ]);
    expect(emitted[0]).toMatchObject({ nodeId: solidId, mode: 'translate' });

    const update = emitted[2];
    if (update?.kind !== 'transform-update') throw new Error('expected an update');
    // Dragging right moves the solid right, in the plane it was grabbed on.
    expect(update.delta.translation.x).toBeGreaterThan(0);
    expect(update.delta.translation.y).toBeCloseTo(0, 6);
    expect(update.delta.translation.z).toBeCloseTo(0, 6);
  });

  it('measures the drag from the press, not from where the threshold was crossed', () => {
    // Otherwise the part jumps by the threshold distance the instant a drag
    // begins.
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    adapter.pointerMove({ clientX: 55, clientY: 50 });

    const first = emitted[1];
    if (first?.kind !== 'transform-update') throw new Error('expected an update');
    const ratio = first.delta.translation.x;
    expect(ratio).toBeGreaterThan(0);

    adapter.pointerMove({ clientX: 60, clientY: 50 });
    const second = emitted[2];
    if (second?.kind !== 'transform-update') throw new Error('expected an update');
    expect(second.delta.translation.x).toBeGreaterThan(ratio * 1.5);
  });

  it('cancels rather than commits when the pointer is taken away', () => {
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    adapter.pointerMove({ clientX: 70, clientY: 50 });
    adapter.pointerCancel('interrupted');

    expect(emitted.at(-1)).toEqual({ kind: 'transform-cancel', reason: 'interrupted' });
    expect(adapter.dragging).toBe(false);
  });

  it('leaves every non-primary button to the camera', () => {
    const { adapter, emitted } = harness();

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 1 });
    adapter.pointerMove({ clientX: 70, clientY: 50 });
    adapter.pointerUp({ clientX: 70, clientY: 50, button: 1 });

    // The move produced a hover and nothing else — no select, no drag.
    expect(emitted.map((intent) => intent.kind)).toEqual(['hover']);
  });

  it('attaches and detaches its listeners', () => {
    const { adapter, host } = harness();
    expect(host.listeners.get('pointermove')).toHaveLength(1);

    adapter.detach();

    expect(host.listeners.get('pointermove')).toHaveLength(0);
    expect(host.listeners.get('pointercancel')).toHaveLength(0);
  });

  it('drives the document end to end, as one undo entry', () => {
    const { document, solidId } = boxDocument();
    const registry = registryFor(solidId, document);
    const router = new IntentRouter({ document, snap: SNAP_OFF });
    const adapter = createPointerAdapter({
      emit: (intent) => void router.handle(intent),
      camera: () => cameraOnZ(5),
      pick: (ray, picked) => registry.pick(ray, { tree: document, drillIn: picked.drillIn }),
    });
    adapter.attach(fakeHost());

    adapter.pointerDown({ clientX: 50, clientY: 50, button: 0 });
    for (let x = 55; x <= 75; x += 1) adapter.pointerMove({ clientX: x, clientY: 50 });
    adapter.pointerUp({ clientX: 75, clientY: 50, button: 0 });

    const node = document.expect(solidId);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.translation.x).toBeGreaterThan(0);
    expect(document.undoDepth).toBe(1);

    document.undo();
    expect(document.expect(solidId)).toMatchObject({ transform: { translation: vec3(0, 0, 0) } });
  });
});

describe('the spatial adapter', () => {
  function harness() {
    const { document, solidId } = boxDocument();
    const registry = registryFor(solidId, document);
    const emitted: Intent[] = [];
    const adapter = createSpatialAdapter({
      emit: (intent) => emitted.push(intent),
      pick: (ray) => registry.pick(ray, { tree: document }),
      graceFrames: 3,
    });
    return { adapter, emitted, document, solidId };
  }

  const at = (x: number, overrides: Partial<SpatialSample> = {}): SpatialSample => ({
    position: vec3(x, 0, 2),
    orientation: quat(0, 0, 0, 1),
    tracked: true,
    select: false,
    squeeze: false,
    ...overrides,
  });

  it('hovers what the ray is on, and only says so when it changes', () => {
    const { adapter, emitted, solidId } = harness();

    adapter.update(at(0));
    adapter.update(at(0));
    adapter.update(at(9));

    expect(emitted).toEqual([
      { kind: 'hover', nodeId: solidId },
      { kind: 'hover', nodeId: null },
    ]);
  });

  it('selects on the rising edge of the trigger, not every frame it is held', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(0, { select: true }));
    adapter.update(at(0, { select: true }));
    adapter.update(at(0, { select: false }));
    adapter.update(at(0, { select: true }));

    expect(emitted.filter((intent) => intent.kind === 'select')).toHaveLength(2);
  });

  it('grabs on squeeze, tracks the hand, and commits on release', () => {
    const { adapter, emitted, solidId } = harness();

    adapter.update(at(0));
    adapter.update(at(0, { squeeze: true }));
    expect(adapter.grabbing).toBe(true);
    expect(adapter.grabbed).toBe(solidId);
    adapter.update(at(0.2, { squeeze: true }));
    adapter.update(at(0.2));

    const kinds = emitted.map((intent) => intent.kind);
    expect(kinds).toEqual(['hover', 'transform-begin', 'transform-update', 'transform-commit']);

    const update = emitted[2];
    if (update?.kind !== 'transform-update') throw new Error('expected an update');
    expect(update.delta.translation.x).toBeCloseTo(0.2, 9);
  });

  it('carries the hand’s rotation into the delta, so a grab is rigid', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(0));
    adapter.update(at(0, { squeeze: true }));
    adapter.update(at(0, { squeeze: true, orientation: rotationAbout(vec3(0, 1, 0), 30) }));

    const update = emitted.at(-1);
    if (update?.kind !== 'transform-update') throw new Error('expected an update');
    expect(update.delta.rotation.y).toBeCloseTo(Math.sin(Math.PI / 12), 6);
  });

  it('rides out a flicker in tracking without cancelling', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(0));
    adapter.update(at(0, { squeeze: true }));
    adapter.update(at(0.1, { squeeze: true, tracked: false }));
    adapter.update(at(0.1, { squeeze: true, tracked: false }));
    adapter.update(at(0.1, { squeeze: true }));

    expect(adapter.grabbing).toBe(true);
    expect(emitted.some((intent) => intent.kind === 'transform-cancel')).toBe(false);
  });

  it('cancels — never commits — once tracking is gone for good', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(0));
    adapter.update(at(0, { squeeze: true }));
    for (let frame = 0; frame < 5; frame += 1) {
      adapter.update(at(0.1, { squeeze: true, tracked: false }));
    }
    // The hand comes back with the pinch already released: committing here
    // would keep a transform whose last known position was mid-air.
    adapter.update(at(0.1));

    expect(emitted).toContainEqual({ kind: 'transform-cancel', reason: 'tracking-lost' });
    expect(emitted.some((intent) => intent.kind === 'transform-commit')).toBe(false);
    expect(adapter.grabbing).toBe(false);
  });

  it('cancels an in-flight grab when the device disconnects', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(0));
    adapter.update(at(0, { squeeze: true }));
    adapter.disconnect();

    expect(emitted.at(-1)).toMatchObject({ kind: 'hover', nodeId: null });
    expect(emitted.some((intent) => intent.kind === 'transform-cancel')).toBe(true);
  });

  it('does not grab thin air', () => {
    const { adapter, emitted } = harness();

    adapter.update(at(9, { squeeze: true }));

    expect(adapter.grabbing).toBe(false);
    expect(emitted.some((intent) => intent.kind === 'transform-begin')).toBe(false);
  });
});

describe('reading a WebXR controller', () => {
  const space = {};
  function frameWith(pose: unknown): XrFrameLike {
    return { getPose: vi.fn().mockReturnValue(pose) };
  }
  function controller(buttons: boolean[]): XrInputSourceLike {
    return {
      targetRaySpace: space,
      gamepad: { buttons: buttons.map((pressed) => ({ pressed })) },
      handedness: 'right',
    };
  }

  it('reads position, orientation and the trigger and grip buttons', () => {
    const frame = frameWith({
      transform: { position: { x: 1, y: 2, z: 3 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
    });

    const sample = readControllerSample(controller([true, false]), frame, space);

    expect(sample.position).toEqual(vec3(1, 2, 3));
    expect(sample.tracked).toBe(true);
    expect(sample.select).toBe(true);
    expect(sample.squeeze).toBe(false);
  });

  it('reports an untracked sample when the pose is missing, rather than nothing at all', () => {
    // The state machine has to *hear* about a lost frame to run its grace
    // window; silence would leave a grab open until the session ended.
    const sample = readControllerSample(controller([true, true]), frameWith(undefined), space);

    expect(sample.tracked).toBe(false);
    expect(sample.select).toBe(false);
  });

  it('survives an input source with no gamepad', () => {
    const frame = frameWith({
      transform: { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } },
    });

    const sample = readControllerSample({ targetRaySpace: space }, frame, space);

    expect(sample.tracked).toBe(true);
    expect(sample.select).toBe(false);
  });

  it('normalizes the orientation a runtime handed back', () => {
    const frame = frameWith({
      transform: {
        position: { x: 0, y: 0, z: 0 },
        orientation: { x: 0, y: 0, z: 0, w: 1.002 },
      },
    });

    expect(readControllerSample(controller([]), frame, space).orientation.w).toBeCloseTo(1, 9);
  });
});

describe('a device nobody has written yet', () => {
  /**
   * A "voice adapter", invented here in twelve lines.
   *
   * The point of the test is what it did **not** need: no new intent kind, no
   * change to the router, nothing in `src/core/` and nothing in `src/ui/`.
   * That is #8's second done-when, and this is the cheapest honest way to
   * assert it — if adding a device required a change anywhere else, this file
   * could not compile without one.
   */
  function createVoiceAdapter(emit: (intent: Intent) => void) {
    return {
      say(phrase: string, subject?: NodeId): void {
        if (phrase === 'new box') emit(action({ name: 'spawn-primitive', primitive: 'box' }));
        if (phrase === 'nudge' && subject) {
          emit(transformBegin(subject, 'translate'));
          emit(transformUpdate(makeDelta({ translation: vec3(0.01, 0, 0) })));
          emit(transformCommit());
        }
        if (phrase === 'undo') emit(action({ name: 'undo' }));
      },
    };
  }

  it('drives the document through the same router as every other adapter', () => {
    const { document } = boxDocument();
    const router = new IntentRouter({ document, snap: SNAP_OFF });
    const voice = createVoiceAdapter((intent) => void router.handle(intent));

    voice.say('new box');
    const spawned = document.selection[0] ?? '';
    voice.say('nudge', spawned);

    const node = document.expect(spawned);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.translation.x).toBeCloseTo(0.01, 9);

    voice.say('undo');
    expect(document.expect(spawned)).toMatchObject({ transform: { translation: vec3(0, 0, 0) } });
  });
});

describe('replaying a recorded session', () => {
  const fixture = parseRecording(
    readFileSync(new URL('./fixtures/pinch-drag.intents.json', import.meta.url), 'utf8'),
  );

  it('still describes what the spatial adapter does today', () => {
    // The committed fixture and `recordPinchDrag` are the same gesture from two
    // directions. If the adapter's behaviour changes and the fixture does not,
    // replay would keep passing while testing something that no longer happens.
    const { document, solidId } = boxDocument();
    const fresh = recordPinchDrag(solidId, document.worldMatrix(solidId));

    expect(fresh.intents).toEqual(remapNodeIds(fixture, new Map([['n2', solidId]])).intents);
  });

  it('moves the solid 20cm and leaves exactly one undo entry', () => {
    const { document, solidId } = boxDocument();
    const router = new IntentRouter({ document, snap: SNAP_OFF });

    const outcomes = replay(remapNodeIds(fixture, new Map([['n2', solidId]])), router);

    expect(outcomes.every((outcome) => outcome.status !== 'rejected')).toBe(true);
    const node = document.expect(solidId);
    if (node.kind !== 'transform') throw new Error('expected a transform node');
    expect(node.transform.translation.x).toBeCloseTo(PINCH_DRAG_DISTANCE, 6);
    expect(document.undoDepth).toBe(1);

    document.undo();
    expect(document.expect(solidId)).toMatchObject({ transform: { translation: vec3(0, 0, 0) } });
  });

  it('replays against a document with different ids once they are remapped', () => {
    const first = boxDocument();
    const second = boxDocument();
    const routerA = new IntentRouter({ document: first.document, snap: SNAP_OFF });
    const routerB = new IntentRouter({ document: second.document, snap: SNAP_OFF });

    replay(remapNodeIds(fixture, new Map([['n2', first.solidId]])), routerA);
    replay(remapNodeIds(fixture, new Map([['n2', second.solidId]])), routerB);

    expect(first.document.expect(first.solidId)).toMatchObject({
      transform: second.document.expect(second.solidId).kind === 'transform' ? {} : {},
    });
    const a = first.document.expect(first.solidId);
    const b = second.document.expect(second.solidId);
    if (a.kind !== 'transform' || b.kind !== 'transform') throw new Error('expected transforms');
    expect(a.transform).toEqual(b.transform);
  });

  it('rejects a fixture whose intents are not intents', () => {
    expect(() =>
      parseRecording('{"version":1,"intents":[{"at":0,"source":"x","intent":{}}]}'),
    ).toThrow(/does not hold a valid intent/);
    expect(() => parseRecording('{"version":99,"intents":[]}')).toThrow(/Unsupported recording/);
    expect(() => parseRecording('not json')).toThrow(/Not JSON/);
  });
});
