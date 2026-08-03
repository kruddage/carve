/**
 * Clicking a gizmo handle, and turning the drag that follows into intents.
 *
 * The pointer adapter in `src/input/pointer.ts` deliberately does not do this.
 * It offers a free drag on a camera-facing plane and says so: "#9's axis and
 * plane handles will pass their own constraint plane in". An axis handle needs
 * more than a plane — a plane leaves two degrees of freedom and an axis drag
 * has one — so the gizmo runs its own small drag state machine here and emits
 * the *same* `transform-begin` / `transform-update` / `transform-commit`
 * intents the adapter does. Downstream, nothing can tell the two apart, which
 * is the property #8 exists to protect.
 *
 * Everything in this file is a pure function of a ray and some numbers, which
 * is why `test/ui-gizmo.test.ts` can drag every handle without a canvas.
 *
 * ## Where the gizmo's own frame comes from
 *
 * `gizmoFrame` builds the matrix the handles live in: the selected node's world
 * position, and its world rotation only when the space toggle says `local`.
 * The node's **scale is always stripped**. A gizmo inherited scale would be
 * three times as long on a 3× scaled part and its arrow tips would sit outside
 * the handles' own hit boxes, since those are described in unit space.
 *
 * ## Scale is world-aligned, always, and that is a limitation not an oversight
 *
 * `TransformDelta.scale` is a world-axis diagonal — `IntentRouter` turns it
 * into `makeTrs({ scale })` and multiplies. A non-uniform scale about a
 * *rotated* axis is a shear, which has no TRS form at all; `decomposeMatrix`
 * documents the same hole, and so do glTF and three.js. So the scale gizmo
 * ignores the local/world toggle and stays world-aligned, where its arrows
 * describe what will actually happen. Rotated per-axis scaling needs a richer
 * delta than the intent vocabulary has, which is #8's decision to revisit and
 * not something to fake here.
 */

import {
  quat,
  quatNormalize,
  trsToMatrix,
  vec3,
  type CarveDocument,
  type Mat4,
  type NodeId,
  type Quat,
  type Vec3,
} from '../core/index.js';
import {
  addVec3,
  cross,
  distance,
  dot,
  intersectAabb,
  intersectPlane,
  invertMatrix,
  lengthOf,
  makeDelta,
  makeRay,
  normalize,
  pointOnRay,
  scaleVec3,
  subVec3,
  transformDirection,
  transformPoint,
  transformRay,
  type Ray,
  type TransformDelta,
} from '../input/index.js';
import {
  GIZMO_RING_TOLERANCE,
  axisIndex,
  handlesFor,
  type GizmoAxis,
  type GizmoHandle,
} from '../render/index.js';

import type { GizmoMode, TransformSpace } from './view-state.js';

/** The gizmo's placement: where it is, which way its axes point, how big it draws. */
export interface GizmoFrame {
  /** Gizmo space → world, unit-sized. Rotation only when the space is local. */
  readonly matrix: Mat4;
  readonly origin: Vec3;
  /** Screen-constant size, in world metres, that unit gizmo space is scaled by. */
  readonly size: number;
}

/**
 * The gizmo's frame for a node.
 *
 * `size` is the caller's business — it depends on the camera — so this takes
 * it rather than computing it. `screenScale` below is what a viewport uses.
 */
export function gizmoFrame(
  document: CarveDocument,
  nodeId: NodeId,
  mode: GizmoMode,
  space: TransformSpace,
  size: number,
): GizmoFrame | null {
  if (!document.has(nodeId)) return null;
  const world = document.worldMatrix(nodeId);
  const origin = transformPoint(world, vec3(0, 0, 0));

  // See the header: scale mode is world-aligned regardless of the toggle.
  const oriented = space === 'local' && mode !== 'scale';
  if (!oriented) {
    return {
      matrix: trsToMatrix({
        translation: origin,
        rotation: quat(0, 0, 0, 1),
        scale: vec3(1, 1, 1),
      }),
      origin,
      size,
    };
  }

  // Columns of the world matrix, normalized: the node's own axes with its
  // scale divided out. A zero-scale axis leaves nothing to normalize, so the
  // whole frame falls back to world-aligned rather than producing a NaN basis.
  const columns = [0, 1, 2].map((column) =>
    normalize(vec3(world[column * 4] ?? 0, world[column * 4 + 1] ?? 0, world[column * 4 + 2] ?? 0)),
  );
  if (columns.some((column) => lengthOf(column) < 0.5)) {
    return {
      matrix: trsToMatrix({
        translation: origin,
        rotation: quat(0, 0, 0, 1),
        scale: vec3(1, 1, 1),
      }),
      origin,
      size,
    };
  }

  const [ax, ay, az] = columns as [Vec3, Vec3, Vec3];
  return {
    matrix: [
      ax.x,
      ax.y,
      ax.z,
      0,
      ay.x,
      ay.y,
      ay.z,
      0,
      az.x,
      az.y,
      az.z,
      0,
      origin.x,
      origin.y,
      origin.z,
      1,
    ],
    origin,
    size,
  };
}

/**
 * World size of one unit of gizmo space, so the gizmo holds its apparent size.
 *
 * Proportional to the distance from the camera and to the tangent of half the
 * field of view, which together are the world height of the view frustum at
 * that distance. `fraction` is how much of the viewport's height the gizmo
 * should span.
 */
export function screenScale(
  cameraPosition: Vec3,
  origin: Vec3,
  fovDegrees: number,
  fraction = 0.14,
): number {
  const away = Math.max(distance(cameraPosition, origin), 1e-4);
  return away * Math.tan(((fovDegrees / 2) * Math.PI) / 180) * 2 * fraction;
}

/**
 * The handle under `ray`, or `null`.
 *
 * First match in `GIZMO_HANDLES` order rather than nearest hit, because the
 * handles overlap by design — the plane quads sit across the near end of two
 * shafts, and the uniform cube sits where all three begin. The table is ordered
 * so that the more specific handle is offered first; see the note there.
 */
export function pickGizmoHandle(ray: Ray, frame: GizmoFrame, mode: GizmoMode): GizmoHandle | null {
  const toGizmo = invertMatrix(frame.matrix);
  if (!toGizmo) return null;
  // Handle boxes are in unit space, so divide the ray's position by `size`
  // rather than scaling every box up.
  const local = transformRay(toGizmo, ray);
  const scaled = makeRay(scaleVec3(local.origin, 1 / frame.size), local.direction);

  for (const handle of handlesFor(mode)) {
    if (handle.kind === 'ring') {
      if (handle.axis && hitsRing(scaled, handle.axis, handle.radius ?? 1)) return handle;
      continue;
    }
    if (intersectAabb(scaled, handle.box) !== null) return handle;
  }
  return null;
}

/** A ring is a plane test plus a radius band — see the note in `render/gizmo.ts`. */
function hitsRing(ray: Ray, axis: GizmoAxis, radius: number): boolean {
  const normal = unitAxis(axis);
  const along = intersectPlane(ray, vec3(0, 0, 0), normal);
  if (along === null) return false;
  const point = pointOnRay(ray, along);
  return Math.abs(lengthOf(point) - radius) <= GIZMO_RING_TOLERANCE;
}

function unitAxis(axis: GizmoAxis): Vec3 {
  return vec3(Number(axis === 'x'), Number(axis === 'y'), Number(axis === 'z'));
}

/** What a drag captured when it began. Held by the viewport for the drag's life. */
export interface GizmoDrag {
  readonly handle: GizmoHandle;
  readonly frame: GizmoFrame;
  /** World-space direction of the handle's axis. Identity axis for the uniform cube. */
  readonly axis: Vec3;
  /** The reference point the drag measures from, world space. */
  readonly anchor: Vec3;
  /** Distance from the gizmo origin to `anchor`. Zero disables scaling — see `deltaFor`. */
  readonly anchorRadius: number;
  /** A second in-plane axis, so a rotation can measure a signed angle. */
  readonly reference: Vec3;
}

/**
 * Capture the drag, or refuse it.
 *
 * Refuses when the ray is degenerate against this handle — edge-on to a plane
 * handle, parallel to an axis shaft. A drag started there produces enormous
 * deltas from tiny cursor movements, so the honest answer is not to start.
 */
export function beginGizmoDrag(handle: GizmoHandle, frame: GizmoFrame, ray: Ray): GizmoDrag | null {
  const axis = handle.axis ? worldAxis(frame, handle.axis) : vec3(0, 1, 0);
  const anchor = anchorPoint(handle, frame, axis, ray);
  if (!anchor) return null;

  const offset = subVec3(anchor, frame.origin);
  const radius = lengthOf(offset);
  return {
    handle,
    frame,
    axis,
    anchor,
    anchorRadius: radius,
    reference: radius > 1e-9 ? scaleVec3(offset, 1 / radius) : perpendicularTo(axis),
  };
}

/**
 * The cumulative delta from the drag's start to `ray`.
 *
 * Cumulative, not incremental: `TransformDelta` is defined that way in
 * `src/input/intents.ts` — "deltas are cumulative" — because the router
 * composes each update against the transform captured at begin. An incremental
 * delta would accumulate float error over a long drag and would make a dropped
 * frame lose distance permanently.
 *
 * Returns `null` when this frame's ray gives no usable answer; the caller holds
 * the previous delta, exactly as the pointer adapter does when the cursor
 * leaves its drag plane.
 */
export function deltaFor(drag: GizmoDrag, ray: Ray): TransformDelta | null {
  const point = anchorPoint(drag.handle, drag.frame, drag.axis, ray);
  if (!point) return null;

  switch (drag.handle.mode) {
    case 'translate':
      return makeDelta({ translation: subVec3(point, drag.anchor) });

    case 'rotate': {
      const offset = subVec3(point, drag.frame.origin);
      const radius = lengthOf(offset);
      if (radius < 1e-9) return null;
      const now = scaleVec3(offset, 1 / radius);
      // Signed angle about the axis: the cosine from the dot product, the sign
      // from whether the cross product points along the axis or against it.
      // `atan2` of the two rather than `acos` alone, which loses the sign and
      // makes every rotation go the same way.
      const angle = Math.atan2(
        dot(cross(drag.reference, now), drag.axis),
        dot(drag.reference, now),
      );
      return makeDelta({ rotation: axisAngle(drag.axis, angle) });
    }

    case 'scale': {
      const radius = lengthOf(subVec3(point, drag.frame.origin));
      if (drag.anchorRadius < 1e-9) return null;
      // Clamped below zero: dragging a scale handle back through the gizmo's
      // origin would otherwise flip the part inside out, which is never what
      // the gesture meant and produces a mesh the kernel reports as degenerate.
      const factor = Math.max(radius / drag.anchorRadius, 1e-3);
      if (drag.handle.kind === 'uniform') {
        return makeDelta({ scale: vec3(factor, factor, factor) });
      }
      const scale: [number, number, number] = [1, 1, 1];
      if (drag.handle.axis) scale[axisIndex(drag.handle.axis)] = factor;
      return makeDelta({ scale: vec3(scale[0], scale[1], scale[2]) });
    }
  }
}

/**
 * Where this frame's ray meets the handle's constraint geometry.
 *
 * One function for all four kinds because the *reference point* is what every
 * mode needs and they only differ in what it is constrained to: a line for an
 * axis, a plane for a plane handle and a ring, and the camera-facing plane for
 * the uniform cube.
 */
function anchorPoint(handle: GizmoHandle, frame: GizmoFrame, axis: Vec3, ray: Ray): Vec3 | null {
  switch (handle.kind) {
    case 'axis':
      return closestPointOnLine(ray, frame.origin, axis);
    case 'plane':
    case 'ring': {
      const along = intersectPlane(ray, frame.origin, axis);
      return along === null ? null : pointOnRay(ray, along);
    }
    case 'uniform': {
      // The plane facing the camera: a uniform scale has no axis of its own,
      // and any fixed plane would go edge-on at some camera angle.
      const facing = normalize(subVec3(ray.origin, frame.origin));
      const along = intersectPlane(ray, frame.origin, facing);
      return along === null ? null : pointOnRay(ray, along);
    }
  }
}

/** The world direction of one of the gizmo's own axes. */
export function worldAxis(frame: GizmoFrame, axis: GizmoAxis): Vec3 {
  return normalize(transformDirection(frame.matrix, unitAxis(axis)));
}

/**
 * The point on the line `origin + t·direction` nearest to `ray`.
 *
 * `null` when the two are within a degree or so of parallel: the nearest point
 * is then anywhere along the line, and using it would send the part to
 * infinity on a one-pixel cursor movement.
 */
export function closestPointOnLine(ray: Ray, origin: Vec3, direction: Vec3): Vec3 | null {
  const w0 = subVec3(origin, ray.origin);
  const b = dot(direction, ray.direction);
  const denom = 1 - b * b;
  if (Math.abs(denom) < 3e-4) return null;
  const t = (b * dot(ray.direction, w0) - dot(direction, w0)) / denom;
  return addVec3(origin, scaleVec3(direction, t));
}

/** A unit quaternion for `angle` radians about `axis`. */
export function axisAngle(axis: Vec3, angle: number): Quat {
  const half = angle / 2;
  const s = Math.sin(half);
  return quatNormalize(quat(axis.x * s, axis.y * s, axis.z * s, Math.cos(half)));
}

/** Any unit vector perpendicular to `v`. Only used when a drag begins on the axis itself. */
function perpendicularTo(v: Vec3): Vec3 {
  // Cross with whichever cardinal axis `v` is least aligned to, so the result
  // is never the zero vector.
  const helper = Math.abs(v.x) < 0.9 ? vec3(1, 0, 0) : vec3(0, 1, 0);
  return normalize(cross(v, helper));
}
