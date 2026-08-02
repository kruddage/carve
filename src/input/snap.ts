/**
 * Snapping: the grid, and the corners, edges and faces of other solids.
 *
 * Shared across adapters rather than owned by the desktop gizmos, because it is
 * load-bearing for hand tracking in a way it never is for a mouse. A cursor
 * lands where you put it; a pinch lands within a centimetre or two of where you
 * meant, jittering the whole time. Snapping is what does the work your unsteady
 * hands will not — and if it lived in #9's gizmo code, the headset would have to
 * grow a second implementation with a second set of tolerances, and a part
 * assembled in VR would not line up when opened on a laptop.
 *
 * Two mechanisms, and one rule about which wins:
 *
 *   - **Grid.** Quantize to a step. Cheap, always available, no context.
 *   - **Features.** The eight corners, twelve edge midpoints and six face
 *     centres of another solid's bounds, in world space. Within `radius`, the
 *     nearest one wins.
 *
 * **A feature beats the grid whenever one is in range.** Grid alignment is
 * invisible; a corner you can see is what you were aiming at. Snapping a
 * bracket to 1mm next to the hole it should be concentric with is a worse
 * answer than snapping it to the hole and being off-grid.
 *
 * Feature points come from bounds rather than from the evaluated mesh's real
 * edges, and that is a v1 approximation with a known cost: on a cylinder the
 * "corners" are the corners of the box around it, which are not on the surface.
 * It is enough for the case that matters — aligning box-shaped parts and
 * centring on faces — and the honest fix (snap features from the kernel's
 * B-rep-ish edge data) needs geometry the kernel does not currently emit. Said
 * out loud here so nobody discovers it as a bug.
 */

import {
  quatNormalize,
  vec3,
  type Mat4,
  type NodeId,
  type Quat,
  type Vec3,
} from '../core/index.js';

import { distance, transformPoint, type Aabb } from './geometry.js';

export const SNAP_FEATURE_KINDS = ['corner', 'edge-midpoint', 'face-center'] as const;
export type SnapFeatureKind = (typeof SNAP_FEATURE_KINDS)[number];

export interface SnapFeature {
  /** Which node the feature belongs to, so a drag can exclude its own. */
  readonly nodeId: NodeId;
  readonly kind: SnapFeatureKind;
  /** World space. */
  readonly point: Vec3;
}

export interface SnapSettings {
  /** Grid step in metres. `0` disables grid snapping. */
  readonly grid: number;
  /** Rotation increment in degrees. `0` disables rotation snapping. */
  readonly rotationDegrees: number;
  /** How close a feature must be to win, world metres. `0` disables features. */
  readonly featureRadius: number;
}

/**
 * 1mm grid, 15° rotations, 20mm feature radius.
 *
 * The grid is 1mm because that is the resolution of the thing being made — this
 * exports STL for a slicer (#14a) — not because it is a round number in metres.
 * The feature radius is deliberately larger than the grid step and comparable to
 * hand-tracking jitter: below about 10mm a pinch cannot reliably reach a
 * feature at all, and the snap that exists to help becomes one you have to
 * fight.
 */
export const DEFAULT_SNAP_SETTINGS: SnapSettings = Object.freeze({
  grid: 0.001,
  rotationDegrees: 15,
  featureRadius: 0.02,
});

/** Snapping fully off — every adapter needs a way to say "exactly where I put it". */
export const SNAP_OFF: SnapSettings = Object.freeze({
  grid: 0,
  rotationDegrees: 0,
  featureRadius: 0,
});

export function snapValue(value: number, step: number): number {
  if (step <= 0 || !Number.isFinite(step)) return value;
  return Math.round(value / step) * step;
}

export function snapToGrid(point: Vec3, step: number): Vec3 {
  if (step <= 0 || !Number.isFinite(step)) return point;
  return vec3(snapValue(point.x, step), snapValue(point.y, step), snapValue(point.z, step));
}

/**
 * Quantize a rotation to `degrees` increments about its own axis.
 *
 * About its own axis rather than per-Euler-angle: a hand rotation is a single
 * arbitrary-axis turn, and decomposing it into yaw/pitch/roll to quantize each
 * one introduces axis order, gimbal cases and a result that does not resemble
 * what the hand did. Quantizing the angle keeps the axis the user chose and
 * only tidies how far they went.
 */
export function snapRotation(rotation: Quat, degrees: number): Quat {
  if (degrees <= 0 || !Number.isFinite(degrees)) return rotation;

  const normalized = quatNormalize(rotation);
  const clampedW = Math.min(1, Math.max(-1, normalized.w));
  const halfAngle = Math.acos(clampedW);
  const sinHalf = Math.sin(halfAngle);
  // Identity, or near enough that the axis is numerical noise.
  if (sinHalf < 1e-8) return { x: 0, y: 0, z: 0, w: 1 };

  const step = (degrees * Math.PI) / 180;
  const snappedAngle = Math.round((halfAngle * 2) / step) * step;
  const snappedHalf = snappedAngle / 2;
  const scale = Math.sin(snappedHalf) / sinHalf;

  return quatNormalize({
    x: normalized.x * scale,
    y: normalized.y * scale,
    z: normalized.z * scale,
    w: Math.cos(snappedHalf),
  });
}

/**
 * The 26 snap points of a box: 8 corners, 12 edge midpoints, 6 face centres.
 *
 * Generated from the local bounds through the world matrix, so a rotated solid
 * contributes rotated features. Centre of the box is not among them — a point
 * inside a solid is not something you can aim at, and it would win the nearest
 * -feature search from inside constantly.
 */
export function boundsSnapFeatures(
  nodeId: NodeId,
  bounds: Aabb,
  worldMatrix: Mat4,
): readonly SnapFeature[] {
  const axes: readonly (readonly number[])[] = [
    [bounds.min[0], (bounds.min[0] + bounds.max[0]) / 2, bounds.max[0]],
    [bounds.min[1], (bounds.min[1] + bounds.max[1]) / 2, bounds.max[1]],
    [bounds.min[2], (bounds.min[2] + bounds.max[2]) / 2, bounds.max[2]],
  ];

  const features: SnapFeature[] = [];
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      for (let k = 0; k < 3; k += 1) {
        // How many axes sit at the midpoint decides what the point is: none is
        // a corner, one an edge midpoint, two a face centre, three the centre
        // of the solid — which is skipped.
        const midCount = Number(i === 1) + Number(j === 1) + Number(k === 1);
        if (midCount === 3) continue;
        const kind: SnapFeatureKind =
          midCount === 0 ? 'corner' : midCount === 1 ? 'edge-midpoint' : 'face-center';
        features.push({
          nodeId,
          kind,
          point: transformPoint(
            worldMatrix,
            vec3(axes[0]?.[i] ?? 0, axes[1]?.[j] ?? 0, axes[2]?.[k] ?? 0),
          ),
        });
      }
    }
  }
  return features;
}

/**
 * The snap features currently in the scene, indexed by the node they came from.
 *
 * Per node rather than one flat list so that a moving solid's own features can
 * be dropped in one call — a node snapping to itself would pin it in place the
 * moment the drag started.
 */
export class SnapField {
  readonly #byNode = new Map<NodeId, readonly SnapFeature[]>();

  get size(): number {
    let total = 0;
    for (const features of this.#byNode.values()) total += features.length;
    return total;
  }

  set(nodeId: NodeId, features: readonly SnapFeature[]): void {
    this.#byNode.set(nodeId, features);
  }

  /** Convenience for the common case: a node's bounds are its features. */
  setFromBounds(nodeId: NodeId, bounds: Aabb, worldMatrix: Mat4): void {
    this.set(nodeId, boundsSnapFeatures(nodeId, bounds, worldMatrix));
  }

  remove(nodeId: NodeId): boolean {
    return this.#byNode.delete(nodeId);
  }

  clear(): void {
    this.#byNode.clear();
  }

  features(): readonly SnapFeature[] {
    return [...this.#byNode.values()].flat();
  }

  /** Nearest feature within `radius`, ignoring anything in `exclude`. */
  nearest(point: Vec3, radius: number, exclude?: ReadonlySet<NodeId>): SnapFeature | null {
    if (radius <= 0 || !Number.isFinite(radius)) return null;

    let best: SnapFeature | null = null;
    let bestDistance = radius;
    for (const [nodeId, features] of this.#byNode) {
      if (exclude?.has(nodeId)) continue;
      for (const feature of features) {
        const candidate = distance(point, feature.point);
        if (candidate > bestDistance) continue;
        best = feature;
        bestDistance = candidate;
      }
    }
    return best;
  }
}

export interface SnapResult {
  readonly point: Vec3;
  /** The feature that won, or `null` when the grid did (or nothing did). */
  readonly feature: SnapFeature | null;
  readonly snapped: boolean;
}

/**
 * Where a point ends up once snapping has had its say.
 *
 * Features first, grid second — see the header. The returned `feature` is what
 * a viewport should draw a marker on: a snap the user cannot see is
 * indistinguishable from the drag being laggy.
 */
export function resolveSnap(
  point: Vec3,
  settings: SnapSettings,
  field?: SnapField,
  exclude?: ReadonlySet<NodeId>,
): SnapResult {
  const feature = field?.nearest(point, settings.featureRadius, exclude) ?? null;
  if (feature) return { point: feature.point, feature, snapped: true };

  const snappedToGrid = snapToGrid(point, settings.grid);
  const snapped = settings.grid > 0 && Number.isFinite(settings.grid);
  return { point: snappedToGrid, feature: null, snapped };
}
