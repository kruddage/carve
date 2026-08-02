/**
 * The geometry `src/core/` deliberately does not carry.
 *
 * `core/math.ts` says it outright: it holds only what the document needs in
 * order to say where a node sits, and "raycasting, screen-space projection,
 * drag planes" belong to the layer that owns those problems, which is this one.
 * So this file is that math — rays, intersection tests, matrix inversion and
 * decomposition — and it is written against core's `Vec3` / `Quat` / `Mat4`
 * types so nothing has to be converted at the boundary.
 *
 * Conventions are core's, which are also glTF's and three.js's: right-handed,
 * Y up, metres; quaternions `(x, y, z, w)`; matrices column-major with
 * `m[column * 4 + row]`; and a pose looks down its own **-Z**, which is what
 * WebXR reports for a controller and what three.js assumes for a camera.
 *
 * There is no three.js here on purpose. This math runs in the router and in
 * tests with no canvas, no GPU and no DOM — the same headless bar `src/core/`
 * and `src/kernel/` are held to — and importing `Vector3` for a dot product
 * would trade that for nothing.
 */

import {
  IDENTITY_ROTATION,
  quatNormalize,
  rotateVec3,
  vec3,
  type Mat4,
  type Quat,
  type Trs,
  type Vec3,
} from '../core/index.js';

/** A half-line. `direction` is unit length; every consumer here assumes it. */
export interface Ray {
  readonly origin: Vec3;
  readonly direction: Vec3;
}

/** An axis-aligned box. Same shape as the kernel's and the renderer's bounds. */
export interface Aabb {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

/**
 * A camera reduced to plain numbers.
 *
 * Structurally identical to `CameraPose` in `src/render/`, and deliberately
 * re-declared rather than imported at runtime: this module must not pull
 * three.js in behind a type import, and an input adapter driven by a fake
 * camera in a test should not have to construct a renderer to get one.
 */
export interface ViewPose {
  readonly position: Vec3;
  /** Orientation of a camera looking down its own -Z. */
  readonly orientation: Quat;
  /** Vertical field of view, degrees. */
  readonly fovDegrees: number;
  /** Width / height. */
  readonly aspect: number;
}

// --- Vectors --------------------------------------------------------------

export function addVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function subVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scaleVec3(v: Vec3, factor: number): Vec3 {
  return { x: v.x * factor, y: v.y * factor, z: v.z * factor };
}

export function mulVec3(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x * b.x, y: a.y * b.y, z: a.z * b.z };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function lengthOf(v: Vec3): number {
  return Math.sqrt(dot(v, v));
}

export function distance(a: Vec3, b: Vec3): number {
  return lengthOf(subVec3(a, b));
}

/**
 * Unit vector, or `(0, 0, -1)` for a zero-length input.
 *
 * The fallback is not defensive noise. A hand-tracking frame with a lost hand
 * hands back all-zero joint poses (see `quatNormalize` in core, which takes the
 * same position for the same reason), and a `NaN` direction propagates into a
 * ray, into a hit test, into a transform, and then into a saved file.
 */
export function normalize(v: Vec3): Vec3 {
  const length = lengthOf(v);
  if (length === 0) return vec3(0, 0, -1);
  return scaleVec3(v, 1 / length);
}

// --- Matrices -------------------------------------------------------------

/** Apply the full matrix, translation included. */
export function transformPoint(m: Mat4, p: Vec3): Vec3 {
  const at = (index: number): number => m[index] ?? 0;
  const w = at(3) * p.x + at(7) * p.y + at(11) * p.z + at(15);
  const inverseW = w === 0 ? 1 : 1 / w;
  return {
    x: (at(0) * p.x + at(4) * p.y + at(8) * p.z + at(12)) * inverseW,
    y: (at(1) * p.x + at(5) * p.y + at(9) * p.z + at(13)) * inverseW,
    z: (at(2) * p.x + at(6) * p.y + at(10) * p.z + at(14)) * inverseW,
  };
}

/** Apply rotation and scale but not translation. Does not renormalize. */
export function transformDirection(m: Mat4, v: Vec3): Vec3 {
  const at = (index: number): number => m[index] ?? 0;
  return {
    x: at(0) * v.x + at(4) * v.y + at(8) * v.z,
    y: at(1) * v.x + at(5) * v.y + at(9) * v.z,
    z: at(2) * v.x + at(6) * v.y + at(10) * v.z,
  };
}

/**
 * The inverse, or `null` for a singular matrix.
 *
 * `null` rather than a throw or a silent identity: a zero scale on a node is a
 * legal (if useless) document state, and it reaches this code as a
 * non-invertible world matrix. A throw would turn it into a crash on hover; an
 * identity fallback would make the node pickable in the wrong place, which is
 * worse than not being pickable at all.
 */
export function invertMatrix(m: Mat4): Mat4 | null {
  const at = (index: number): number => m[index] ?? 0;

  // Cofactors, as named values rather than writes into a partially built array:
  // under `noUncheckedIndexedAccess` reading one back out of an array to form
  // the determinant would be `number | undefined`, and the `?? 0` that silences
  // that is exactly the kind of guard that hides a real indexing bug.
  const c0 =
    at(5) * at(10) * at(15) -
    at(5) * at(11) * at(14) -
    at(9) * at(6) * at(15) +
    at(9) * at(7) * at(14) +
    at(13) * at(6) * at(11) -
    at(13) * at(7) * at(10);
  const c4 =
    -at(4) * at(10) * at(15) +
    at(4) * at(11) * at(14) +
    at(8) * at(6) * at(15) -
    at(8) * at(7) * at(14) -
    at(12) * at(6) * at(11) +
    at(12) * at(7) * at(10);
  const c8 =
    at(4) * at(9) * at(15) -
    at(4) * at(11) * at(13) -
    at(8) * at(5) * at(15) +
    at(8) * at(7) * at(13) +
    at(12) * at(5) * at(11) -
    at(12) * at(7) * at(9);
  const c12 =
    -at(4) * at(9) * at(14) +
    at(4) * at(10) * at(13) +
    at(8) * at(5) * at(14) -
    at(8) * at(6) * at(13) -
    at(12) * at(5) * at(10) +
    at(12) * at(6) * at(9);

  const determinant = at(0) * c0 + at(1) * c4 + at(2) * c8 + at(3) * c12;
  if (determinant === 0 || !Number.isFinite(determinant)) return null;

  const c1 =
    -at(1) * at(10) * at(15) +
    at(1) * at(11) * at(14) +
    at(9) * at(2) * at(15) -
    at(9) * at(3) * at(14) -
    at(13) * at(2) * at(11) +
    at(13) * at(3) * at(10);
  const c5 =
    at(0) * at(10) * at(15) -
    at(0) * at(11) * at(14) -
    at(8) * at(2) * at(15) +
    at(8) * at(3) * at(14) +
    at(12) * at(2) * at(11) -
    at(12) * at(3) * at(10);
  const c9 =
    -at(0) * at(9) * at(15) +
    at(0) * at(11) * at(13) +
    at(8) * at(1) * at(15) -
    at(8) * at(3) * at(13) -
    at(12) * at(1) * at(11) +
    at(12) * at(3) * at(9);
  const c13 =
    at(0) * at(9) * at(14) -
    at(0) * at(10) * at(13) -
    at(8) * at(1) * at(14) +
    at(8) * at(2) * at(13) +
    at(12) * at(1) * at(10) -
    at(12) * at(2) * at(9);
  const c2 =
    at(1) * at(6) * at(15) -
    at(1) * at(7) * at(14) -
    at(5) * at(2) * at(15) +
    at(5) * at(3) * at(14) +
    at(13) * at(2) * at(7) -
    at(13) * at(3) * at(6);
  const c6 =
    -at(0) * at(6) * at(15) +
    at(0) * at(7) * at(14) +
    at(4) * at(2) * at(15) -
    at(4) * at(3) * at(14) -
    at(12) * at(2) * at(7) +
    at(12) * at(3) * at(6);
  const c10 =
    at(0) * at(5) * at(15) -
    at(0) * at(7) * at(13) -
    at(4) * at(1) * at(15) +
    at(4) * at(3) * at(13) +
    at(12) * at(1) * at(7) -
    at(12) * at(3) * at(5);
  const c14 =
    -at(0) * at(5) * at(14) +
    at(0) * at(6) * at(13) +
    at(4) * at(1) * at(14) -
    at(4) * at(2) * at(13) -
    at(12) * at(1) * at(6) +
    at(12) * at(2) * at(5);
  const c3 =
    -at(1) * at(6) * at(11) +
    at(1) * at(7) * at(10) +
    at(5) * at(2) * at(11) -
    at(5) * at(3) * at(10) -
    at(9) * at(2) * at(7) +
    at(9) * at(3) * at(6);
  const c7 =
    at(0) * at(6) * at(11) -
    at(0) * at(7) * at(10) -
    at(4) * at(2) * at(11) +
    at(4) * at(3) * at(10) +
    at(8) * at(2) * at(7) -
    at(8) * at(3) * at(6);
  const c11 =
    -at(0) * at(5) * at(11) +
    at(0) * at(7) * at(9) +
    at(4) * at(1) * at(11) -
    at(4) * at(3) * at(9) -
    at(8) * at(1) * at(7) +
    at(8) * at(3) * at(5);
  const c15 =
    at(0) * at(5) * at(10) -
    at(0) * at(6) * at(9) -
    at(4) * at(1) * at(10) +
    at(4) * at(2) * at(9) +
    at(8) * at(1) * at(6) -
    at(8) * at(2) * at(5);

  const inverse = 1 / determinant;
  return [
    c0 * inverse,
    c1 * inverse,
    c2 * inverse,
    c3 * inverse,
    c4 * inverse,
    c5 * inverse,
    c6 * inverse,
    c7 * inverse,
    c8 * inverse,
    c9 * inverse,
    c10 * inverse,
    c11 * inverse,
    c12 * inverse,
    c13 * inverse,
    c14 * inverse,
    c15 * inverse,
  ];
}

/**
 * Split a matrix back into translation, rotation and scale.
 *
 * Lossy in exactly one case, and it is the same case core's `composeTrs`
 * documents: a matrix containing shear has no TRS form, and shear is what you
 * get from a non-uniform scale above a rotation. The router composes in matrix
 * space precisely so that only the *final* write to the document goes through
 * here, which keeps the error at one decomposition rather than one per frame of
 * a drag — but it does not make the hole go away, and a node under a
 * non-uniformly scaled rotated parent will drift. See `docs/input.md`.
 *
 * A negative determinant means the matrix mirrors. The sign is folded into the
 * X scale, matching three.js and glTF, so at least the handedness survives.
 */
export function decomposeMatrix(m: Mat4): Trs {
  const at = (index: number): number => m[index] ?? 0;
  const column = (index: number): Vec3 => vec3(at(index * 4), at(index * 4 + 1), at(index * 4 + 2));

  const x = column(0);
  const y = column(1);
  const z = column(2);

  const determinant = dot(x, cross(y, z));
  const signX = determinant < 0 ? -1 : 1;

  const scaleX = lengthOf(x) * signX;
  const scaleY = lengthOf(y);
  const scaleZ = lengthOf(z);

  const rotation =
    scaleX === 0 || scaleY === 0 || scaleZ === 0
      ? IDENTITY_ROTATION
      : rotationFromBasis(
          scaleVec3(x, 1 / scaleX),
          scaleVec3(y, 1 / scaleY),
          scaleVec3(z, 1 / scaleZ),
        );

  return {
    translation: vec3(at(12), at(13), at(14)),
    rotation,
    scale: vec3(scaleX, scaleY, scaleZ),
  };
}

/**
 * Quaternion from three orthonormal basis vectors.
 *
 * Shepperd's method: pick the branch whose divisor is largest so the square
 * root never runs against zero. The naive single-branch version loses all
 * precision at a 180° rotation, which for a modeler is "flip the part over" and
 * therefore not rare.
 */
function rotationFromBasis(x: Vec3, y: Vec3, z: Vec3): Quat {
  const trace = x.x + y.y + z.z;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    return quatNormalize({
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
      w: 0.25 * s,
    });
  }
  if (x.x > y.y && x.x > z.z) {
    const s = Math.sqrt(1 + x.x - y.y - z.z) * 2;
    return quatNormalize({
      x: 0.25 * s,
      y: (y.x + x.y) / s,
      z: (z.x + x.z) / s,
      w: (y.z - z.y) / s,
    });
  }
  if (y.y > z.z) {
    const s = Math.sqrt(1 + y.y - x.x - z.z) * 2;
    return quatNormalize({
      x: (y.x + x.y) / s,
      y: 0.25 * s,
      z: (z.y + y.z) / s,
      w: (z.x - x.z) / s,
    });
  }
  const s = Math.sqrt(1 + z.z - x.x - y.y) * 2;
  return quatNormalize({
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: 0.25 * s,
    w: (x.y - y.x) / s,
  });
}

/** The column-major matrix for "translate by `t`". */
export function translationMatrix(t: Vec3): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t.x, t.y, t.z, 1];
}

// --- Rays -----------------------------------------------------------------

export function makeRay(origin: Vec3, direction: Vec3): Ray {
  return { origin, direction: normalize(direction) };
}

/** The point `distance` metres along `ray`. */
export function pointOnRay(ray: Ray, along: number): Vec3 {
  return addVec3(ray.origin, scaleVec3(ray.direction, along));
}

/** Move a ray into another space — for testing a ray against local geometry. */
export function transformRay(matrix: Mat4, ray: Ray): Ray {
  return {
    origin: transformPoint(matrix, ray.origin),
    direction: normalize(transformDirection(matrix, ray.direction)),
  };
}

/**
 * The ray through a point on the screen.
 *
 * `(0, 0)` is the top-left of the viewport, in CSS pixels, which is what a
 * `PointerEvent` reports relative to a canvas' bounding box. Device pixel ratio
 * does not appear: it scales the drawing buffer, not the coordinate space
 * pointer events are delivered in, and multiplying it in here is the classic
 * way to make picking land half a cursor off on a Retina display.
 */
export function rayFromScreenPoint(
  pose: ViewPose,
  screenX: number,
  screenY: number,
  width: number,
  height: number,
): Ray {
  const ndcX = width === 0 ? 0 : (screenX / width) * 2 - 1;
  const ndcY = height === 0 ? 0 : 1 - (screenY / height) * 2;
  const tanHalfFov = Math.tan((pose.fovDegrees * Math.PI) / 360);
  const inCamera = vec3(ndcX * tanHalfFov * pose.aspect, ndcY * tanHalfFov, -1);
  return {
    origin: pose.position,
    direction: normalize(rotateVec3(pose.orientation, inCamera)),
  };
}

/**
 * The ray a controller or a pointing hand casts: forward is -Z of the pose.
 *
 * Matches `XRInputSource.targetRaySpace`, whose transform is already defined to
 * point down -Z, so an XR adapter passes the pose straight through with no
 * axis fixup — and no place to get a sign wrong that only shows up in a
 * headset.
 */
export function rayFromPose(position: Vec3, orientation: Quat): Ray {
  return {
    origin: position,
    direction: normalize(rotateVec3(orientation, vec3(0, 0, -1))),
  };
}

// --- Intersection ---------------------------------------------------------

/**
 * Distance to the first intersection with `box`, or `null` for a miss.
 *
 * Returns `0` when the ray starts inside, which is the honest answer and the
 * one the caller wants: a hand inside a solid is holding it.
 */
export function intersectAabb(ray: Ray, box: Aabb): number | null {
  let near = 0;
  let far = Number.POSITIVE_INFINITY;

  const origin = [ray.origin.x, ray.origin.y, ray.origin.z];
  const direction = [ray.direction.x, ray.direction.y, ray.direction.z];

  for (let axis = 0; axis < 3; axis += 1) {
    const o = origin[axis] ?? 0;
    const d = direction[axis] ?? 0;
    const min = box.min[axis] ?? 0;
    const max = box.max[axis] ?? 0;

    if (d === 0) {
      // Parallel to this slab: a miss unless the origin is already between its
      // planes. Handled explicitly because `o / 0` is ±Infinity and the
      // min/max below would silently accept a ray that never enters the box.
      if (o < min || o > max) return null;
      continue;
    }

    const inverse = 1 / d;
    const t1 = (min - o) * inverse;
    const t2 = (max - o) * inverse;
    near = Math.max(near, Math.min(t1, t2));
    far = Math.min(far, Math.max(t1, t2));
    if (near > far) return null;
  }

  return near;
}

/**
 * Distance to an infinite plane, or `null` if the ray runs parallel to it or
 * would have to travel backwards to reach it.
 *
 * This is what turns a pointer into a 3D drag: press on a solid, build a plane
 * through the hit point, and every later cursor position is a ray-plane
 * intersection. Which plane is the adapter's choice — screen-parallel for a
 * free drag, or containing the axis for a gizmo handle in #9 — and neither one
 * belongs down here.
 */
export function intersectPlane(ray: Ray, planePoint: Vec3, planeNormal: Vec3): number | null {
  const denominator = dot(planeNormal, ray.direction);
  if (Math.abs(denominator) < 1e-9) return null;
  const along = dot(subVec3(planePoint, ray.origin), planeNormal) / denominator;
  return along < 0 ? null : along;
}

export interface TriangleHit {
  /** Distance along the ray, metres. */
  readonly distance: number;
  /** Geometric normal of the triangle, flipped to face the ray. */
  readonly normal: Vec3;
}

/**
 * Möller–Trumbore, double-sided.
 *
 * Back faces count. Front-face-only culling is the usual choice and it is wrong
 * here in two situations this project has by design: a camera (or a hand)
 * inside a solid, and the inward-facing surface a `subtract` leaves behind,
 * which is a real machined face a user must be able to point at.
 */
export function intersectTriangle(ray: Ray, a: Vec3, b: Vec3, c: Vec3): TriangleHit | null {
  const EPSILON = 1e-12;
  const edge1 = subVec3(b, a);
  const edge2 = subVec3(c, a);
  const pvec = cross(ray.direction, edge2);
  const determinant = dot(edge1, pvec);
  if (Math.abs(determinant) < EPSILON) return null;

  const inverseDeterminant = 1 / determinant;
  const tvec = subVec3(ray.origin, a);
  const u = dot(tvec, pvec) * inverseDeterminant;
  if (u < 0 || u > 1) return null;

  const qvec = cross(tvec, edge1);
  const v = dot(ray.direction, qvec) * inverseDeterminant;
  if (v < 0 || u + v > 1) return null;

  const along = dot(edge2, qvec) * inverseDeterminant;
  if (along < 0) return null;

  const geometric = normalize(cross(edge1, edge2));
  return {
    distance: along,
    normal: dot(geometric, ray.direction) > 0 ? scaleVec3(geometric, -1) : geometric,
  };
}

/** The AABB of `box` after `matrix`: all eight corners, re-bounded. */
export function transformAabb(matrix: Mat4, box: Aabb): Aabb {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let corner = 0; corner < 8; corner += 1) {
    const source = transformPoint(
      matrix,
      vec3(
        (corner & 1 ? box.max[0] : box.min[0]) ?? 0,
        (corner & 2 ? box.max[1] : box.min[1]) ?? 0,
        (corner & 4 ? box.max[2] : box.min[2]) ?? 0,
      ),
    );
    minX = Math.min(minX, source.x);
    minY = Math.min(minY, source.y);
    minZ = Math.min(minZ, source.z);
    maxX = Math.max(maxX, source.x);
    maxY = Math.max(maxY, source.y);
    maxZ = Math.max(maxZ, source.z);
  }

  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

/** Centre of a box. */
export function centerOf(box: Aabb): Vec3 {
  return vec3(
    ((box.min[0] ?? 0) + (box.max[0] ?? 0)) / 2,
    ((box.min[1] ?? 0) + (box.max[1] ?? 0)) / 2,
    ((box.min[2] ?? 0) + (box.max[2] ?? 0)) / 2,
  );
}
