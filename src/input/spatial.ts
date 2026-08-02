/**
 * The spatial adapter: anything that points from somewhere in the room.
 *
 * One state machine, driven by per-frame samples, shared by XR controllers and
 * XR hands. It is device-agnostic on purpose — a controller's trigger and a
 * hand's pinch are the same signal at this level, and the moment they are two
 * code paths, "select" starts meaning something slightly different depending on
 * what you are holding. `xr-controller.ts` reads a `SpatialSample` out of a
 * WebXR frame; #11's hand tracking will fill the same struct from pinch
 * detection, and this file will not change.
 *
 * ## The grab, in world space
 *
 * A grab is rigid: the solid keeps its pose relative to your hand. So the
 * delta this adapter emits is *the hand's own movement since the grab*, and
 * nothing else — translation from where the hand was, rotation from how it has
 * turned. The router does the rest, and because the intent's delta is
 * cumulative from the begin (see `intents.ts`), a dropped frame is invisible by
 * the next one.
 *
 * ## Losing tracking is normal
 *
 * Hands leave the camera frustum constantly. Two behaviours follow, and both
 * are the reason `transformCancel` is a first-class intent:
 *
 *   - **A grace window.** `graceFrames` samples of lost tracking are tolerated
 *     before anything is cancelled, because a hand that flickers out for two
 *     frames at 72Hz has not gone anywhere and cancelling on the first bad
 *     sample would make a drag impossible to hold.
 *   - **Cancel, not commit.** Past the window the drag is cancelled: the solid
 *     goes back where it was and the history is untouched. Committing a
 *     transform whose last known position was mid-air is the behaviour that
 *     makes people stop trusting a modeler, and it is not undoable in any way
 *     they would think to try.
 */

import { quatConjugate, quatMultiply, type NodeId, type Quat, type Vec3 } from '../core/index.js';

import { rayFromPose, subVec3, type Ray } from './geometry.js';
import {
  hover,
  makeDelta,
  select,
  transformBegin,
  transformCancel,
  transformCommit,
  transformUpdate,
  type IntentSink,
  type TransformMode,
} from './intents.js';
import type { PickHit } from './pick.js';

/**
 * One frame of one input source.
 *
 * Everything the state machine needs and nothing about where it came from.
 * `select` is trigger-or-pinch, `squeeze` is grip-or-fist; a device that has
 * only one of them wires it to `select` and leaves `squeeze` false, in which
 * case grabbing is unavailable rather than subtly different.
 */
export interface SpatialSample {
  /** Target-ray origin, world space. */
  readonly position: Vec3;
  /** Target-ray orientation. Forward is -Z, as WebXR defines it. */
  readonly orientation: Quat;
  /** False when the device was not tracked this frame. */
  readonly tracked: boolean;
  /** Trigger, or pinch. Rising edge selects. */
  readonly select: boolean;
  /** Grip, or closed fist. Rising edge grabs whatever the ray is on. */
  readonly squeeze: boolean;
}

export interface SpatialAdapterOptions {
  readonly emit: IntentSink;
  readonly pick: (ray: Ray) => PickHit | null;
  /** Mode a grab runs in. Defaults to `grab` — rigid, the whole delta. */
  readonly mode?: TransformMode;
  /** Lost-tracking samples tolerated before a drag is cancelled. Defaults to 6. */
  readonly graceFrames?: number;
}

export interface SpatialAdapter {
  /** Feed one frame. Call once per input source per `XRFrame`. */
  update(sample: SpatialSample): void;
  /** The device went away between frames — session ended, source disconnected. */
  disconnect(): void;
  readonly grabbing: boolean;
  /** The node being held, for the ghost preview the kernel's drag strategy expects. */
  readonly grabbed: NodeId | null;
  /** What the ray is currently on, for a highlight or a cursor. */
  readonly hovered: NodeId | null;
}

/** Six frames is ~83ms at 72Hz: long enough to ride out a flicker, short enough not to feel stuck. */
const DEFAULT_GRACE_FRAMES = 6;

interface GrabState {
  readonly nodeId: NodeId;
  readonly handPosition: Vec3;
  readonly handOrientation: Quat;
}

export function createSpatialAdapter(options: SpatialAdapterOptions): SpatialAdapter {
  const grace = options.graceFrames ?? DEFAULT_GRACE_FRAMES;
  const mode: TransformMode = options.mode ?? 'grab';

  let grab: GrabState | null = null;
  let hovered: NodeId | null = null;
  let wasSelecting = false;
  let wasSqueezing = false;
  let lostFrames = 0;

  function setHover(nodeId: NodeId | null): void {
    if (nodeId === hovered) return;
    hovered = nodeId;
    options.emit(hover(nodeId));
  }

  function endGrab(commit: boolean, reason: 'user' | 'tracking-lost' | 'interrupted'): void {
    if (!grab) return;
    grab = null;
    options.emit(commit ? transformCommit() : transformCancel(reason));
  }

  return {
    update(sample: SpatialSample): void {
      if (!sample.tracked) {
        lostFrames += 1;
        // Buttons are meaningless without a pose, so nothing else is read from
        // an untracked sample — including the release that would otherwise
        // commit a drag whose last known position is stale.
        if (grab && lostFrames > grace) endGrab(false, 'tracking-lost');
        if (!grab) setHover(null);
        wasSelecting = false;
        wasSqueezing = false;
        return;
      }
      lostFrames = 0;

      const ray = rayFromPose(sample.position, sample.orientation);

      if (grab) {
        if (!sample.squeeze) {
          wasSqueezing = false;
          endGrab(true, 'user');
          return;
        }
        options.emit(
          transformUpdate(
            makeDelta({
              translation: subVec3(sample.position, grab.handPosition),
              // The rotation *since* the grab: current ⋅ start⁻¹, applied on
              // the left because both are world-space orientations.
              rotation: quatMultiply(sample.orientation, quatConjugate(grab.handOrientation)),
            }),
          ),
        );
        return;
      }

      const hit = options.pick(ray);
      setHover(hit?.resolvedId ?? null);

      // Select on the rising edge only: holding the trigger while sweeping the
      // ray across a scene would otherwise re-select every solid it crosses.
      if (sample.select && !wasSelecting) {
        options.emit(select(hit?.resolvedId ?? null, false));
      }
      wasSelecting = sample.select;

      if (sample.squeeze && !wasSqueezing && hit) {
        grab = {
          nodeId: hit.resolvedId,
          handPosition: sample.position,
          handOrientation: sample.orientation,
        };
        options.emit(transformBegin(hit.resolvedId, mode, hit.point));
      }
      wasSqueezing = sample.squeeze;
    },

    disconnect(): void {
      endGrab(false, 'interrupted');
      setHover(null);
      wasSelecting = false;
      wasSqueezing = false;
      lostFrames = 0;
    },

    get grabbing(): boolean {
      return grab !== null;
    },

    get grabbed(): NodeId | null {
      return grab?.nodeId ?? null;
    },

    get hovered(): NodeId | null {
      return hovered;
    },
  };
}
