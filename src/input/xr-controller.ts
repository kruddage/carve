/**
 * WebXR controllers, as `SpatialSample`s.
 *
 * The whole of the controller-specific knowledge in this project: which space
 * to ask for a pose in, and which gamepad button is the trigger. Everything
 * after that is `spatial.ts`, which is also what #11's hands will feed — so a
 * behaviour change lands in one place and reaches both, and a controller cannot
 * quietly acquire an interaction the hands do not have.
 *
 * ## The types here are structural
 *
 * `XRFrame`, `XRInputSource` and friends are not imported. They arrive from
 * `@types/webxr` via three.js today, which makes them an implicit dependency of
 * a module that has no business having one, and — more practically — a test
 * cannot construct an `XRFrame`. So this file declares the three fields it
 * actually reads. A real `XRFrame` satisfies `XrFrameLike` structurally, and a
 * five-line fake satisfies it in a unit test. That is the whole of why #8's
 * done-when about testing gestures without a headset is achievable.
 *
 * ## Buttons
 *
 * Index 0 is the trigger and index 1 the squeeze, per the `xr-standard` gamepad
 * mapping every Quest controller reports. Read defensively anyway: a controller
 * with no gamepad (a gaze-only source, or a transient input from a screen tap)
 * is legal, and reading `.buttons[0]` on it is a `TypeError` inside the frame
 * loop — which on a headset means the session dies rather than one input source
 * being inert.
 */

import { quatNormalize, vec3, type Quat, type Vec3 } from '../core/index.js';

import type { SpatialSample } from './spatial.js';

/** `xr-standard` mapping: trigger, then squeeze. */
export const TRIGGER_BUTTON = 0;
export const SQUEEZE_BUTTON = 1;

export interface XrVectorLike {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface XrQuaternionLike extends XrVectorLike {
  readonly w: number;
}

export interface XrRigidTransformLike {
  readonly position: XrVectorLike;
  readonly orientation: XrQuaternionLike;
}

export interface XrPoseLike {
  readonly transform: XrRigidTransformLike;
  /** False while a tracked source is being extrapolated rather than measured. */
  readonly emulatedPosition?: boolean;
}

export interface XrSpaceLike {
  readonly [key: string]: unknown;
}

export interface XrFrameLike {
  getPose(space: XrSpaceLike, baseSpace: XrSpaceLike): XrPoseLike | undefined | null;
}

export interface XrGamepadLike {
  readonly buttons: ArrayLike<{ readonly pressed: boolean }>;
}

export interface XrInputSourceLike {
  readonly targetRaySpace: XrSpaceLike;
  readonly gamepad?: XrGamepadLike | null;
  readonly handedness?: string;
}

/**
 * One controller, one frame.
 *
 * Returns an untracked sample rather than `null` when the pose is missing: the
 * state machine in `spatial.ts` needs to *hear about* a lost frame in order to
 * run its grace window and eventually cancel a drag. Returning nothing would
 * look identical to the adapter never being called, and a grab would hang open
 * until the session ended.
 */
export function readControllerSample(
  inputSource: XrInputSourceLike,
  frame: XrFrameLike,
  referenceSpace: XrSpaceLike,
): SpatialSample {
  const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
  const pressed = (index: number): boolean =>
    inputSource.gamepad?.buttons?.[index]?.pressed === true;

  if (!pose) {
    return {
      position: vec3(0, 0, 0),
      orientation: { x: 0, y: 0, z: 0, w: 1 },
      tracked: false,
      select: false,
      squeeze: false,
    };
  }

  return {
    position: toVec3(pose.transform.position),
    orientation: toQuat(pose.transform.orientation),
    tracked: true,
    select: pressed(TRIGGER_BUTTON),
    squeeze: pressed(SQUEEZE_BUTTON),
  };
}

function toVec3(value: XrVectorLike): Vec3 {
  return vec3(value.x, value.y, value.z);
}

/**
 * Normalized on the way in.
 *
 * WebXR orientations are unit quaternions by spec, and are not always unit
 * quaternions in practice once a runtime has interpolated a predicted pose. A
 * drift of 1e-3 is invisible for one frame and compounds into visible skew once
 * it is multiplied into a transform every frame of a drag.
 */
function toQuat(value: XrQuaternionLike): Quat {
  return quatNormalize({ x: value.x, y: value.y, z: value.z, w: value.w });
}
