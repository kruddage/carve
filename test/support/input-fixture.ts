/**
 * Shared fixtures for the input-layer tests.
 *
 * Two kinds of thing live here. Geometry a hit test can be reasoned about by
 * hand — a unit cube, a camera at a known place looking down a known axis — and
 * the synthetic **hand track** that stands in for a headset.
 *
 * The hand track is the interesting one. `test/fixtures/pinch-drag.intents.json`
 * was produced by driving `createSpatialAdapter` with `pinchDragTrack()` and
 * recording what came out, so the committed fixture and this function describe
 * the same gesture from two directions: one is what the adapter emitted, the
 * other is what it was fed. `test/input-adapters.test.ts` replays the fixture
 * *and* re-runs the track, and compares — which is what catches the fixture
 * silently ceasing to describe the adapter's behaviour.
 *
 * It is synthetic, not recorded off a Quest, and that is worth being explicit
 * about: the poses are smooth where a real hand's are not. It exercises the
 * replay path end to end, which is what #8 owes; a genuine recording with real
 * jitter and real dropped frames belongs to #11, when there is a hand-tracking
 * adapter to record from.
 */

import { quat, vec3, type Mat4, type NodeId, type Quat, type Vec3 } from '../../src/core/index.js';
import {
  IntentRecorder,
  PickRegistry,
  createSpatialAdapter,
  type Aabb,
  type IntentRecording,
  type PickGeometry,
  type SpatialSample,
  type ViewPose,
} from '../../src/input/index.js';

/** A 1m cube centred on the origin. */
export const UNIT_CUBE_BOUNDS: Aabb = {
  min: [-0.5, -0.5, -0.5],
  max: [0.5, 0.5, 0.5],
};

/**
 * The same cube as triangles.
 *
 * Written out rather than generated so a failing hit test can be checked
 * against the numbers by hand. Winding is counter-clockwise seen from outside,
 * which is what the kernel emits — though `intersectTriangle` is double-sided
 * and does not care, on purpose.
 */
export function unitCubeGeometry(): PickGeometry {
  const h = 0.5;
  const positions = new Float32Array([
    -h,
    -h,
    h,
    h,
    -h,
    h,
    h,
    h,
    h,
    -h,
    h,
    h, // +Z
    -h,
    -h,
    -h,
    -h,
    h,
    -h,
    h,
    h,
    -h,
    h,
    -h,
    -h, // -Z
  ]);
  const indices = new Uint32Array([
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    3,
    2,
    6,
    3,
    6,
    5, // top
    0,
    7,
    1,
    0,
    4,
    7, // bottom
    1,
    7,
    6,
    1,
    6,
    2, // right
    0,
    3,
    5,
    0,
    5,
    4, // left
  ]);
  return { positions, indices, stride: 3, positionOffset: 0 };
}

/** A camera on +Z looking down -Z, which is the identity orientation. */
export function cameraOnZ(distance = 5, fovDegrees = 50, aspect = 1): ViewPose {
  return {
    position: vec3(0, 0, distance),
    orientation: quat(0, 0, 0, 1),
    fovDegrees,
    aspect,
  };
}

/** A rotation of `degrees` about `axis`, which must be unit length. */
export function rotationAbout(axis: Vec3, degrees: number): Quat {
  const half = (degrees * Math.PI) / 360;
  const s = Math.sin(half);
  return quat(axis.x * s, axis.y * s, axis.z * s, Math.cos(half));
}

export interface HandFrame extends SpatialSample {
  /** Milliseconds from the start of the track. Recorded as metadata only. */
  readonly at: number;
}

/**
 * A pinch, a 20cm drag along +X, and a release — 24 frames at 72Hz.
 *
 * The hand starts on +Z pointing down -Z, so its ray hits a solid at the
 * origin. Four frames of hover, one frame that closes the pinch, sixteen that
 * move it, and three that let go. Deliberately includes two untracked frames
 * mid-drag: a hand that flickers must not cancel, and the grace window in
 * `spatial.ts` is the thing being exercised.
 */
export function pinchDragTrack(): readonly HandFrame[] {
  const frames: HandFrame[] = [];
  const frameMs = 1000 / 72;
  const identity = quat(0, 0, 0, 1);
  const push = (index: number, x: number, tracked: boolean, squeeze: boolean): void => {
    frames.push({
      at: Math.round(index * frameMs),
      position: vec3(x, 0, 1.5),
      orientation: identity,
      tracked,
      select: false,
      squeeze,
    });
  };

  let frame = 0;
  for (let i = 0; i < 4; i += 1, frame += 1) push(frame, 0, true, false);
  push(frame, 0, true, true);
  frame += 1;
  for (let step = 1; step <= 16; step += 1, frame += 1) {
    // Two frames where tracking drops, well inside the grace window.
    const tracked = step !== 7 && step !== 8;
    push(frame, (0.2 * step) / 16, tracked, true);
  }
  for (let i = 0; i < 3; i += 1, frame += 1) push(frame, 0.2, true, false);
  return frames;
}

/** Total translation the track applies to whatever it grabs, world metres. */
export const PINCH_DRAG_DISTANCE = 0.2;

export const PINCH_DRAG_LABEL = 'pinch-grab a solid and drag it 20cm along +X';

/**
 * Run `pinchDragTrack()` through the spatial adapter and record what comes out.
 *
 * This is how `test/fixtures/pinch-drag.intents.json` was produced, kept in the
 * repo rather than in a commit message so the fixture's provenance is
 * executable: `test/input-adapters.test.ts` runs it again and compares against
 * the committed file. A fixture that quietly stops describing what the adapter
 * does is worse than no fixture, because the test still passes.
 *
 * The clock is the track's own timestamps, so the recording is byte-identical
 * every run — `performance.now()` would put wall-clock jitter in a committed
 * file and make its diff meaningless.
 */
export function recordPinchDrag(nodeId: NodeId, worldMatrix: Mat4): IntentRecording {
  const registry = new PickRegistry();
  registry.register({
    nodeId,
    worldMatrix,
    bounds: UNIT_CUBE_BOUNDS,
    geometry: unitCubeGeometry(),
  });

  let at = 0;
  const recorder = new IntentRecorder({ label: PINCH_DRAG_LABEL, clock: () => at });
  const adapter = createSpatialAdapter({
    emit: recorder.sink('xr-hand'),
    pick: (ray) => registry.pick(ray),
  });

  for (const frame of pinchDragTrack()) {
    at = frame.at;
    adapter.update(frame);
  }
  return recorder.toRecording();
}
