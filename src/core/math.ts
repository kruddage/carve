/**
 * The small amount of geometry math the document model needs to describe
 * itself: a TRS transform, quaternions, and 4x4 matrices.
 *
 * This is deliberately not a math library. Everything a renderer or a gizmo
 * needs beyond this (raycasting, screen-space projection, drag planes) belongs
 * in the layers that own those problems — see issues #4 and #8. What is here is
 * only what `src/core/` needs in order to say where a node sits without
 * importing three.js, which it is forbidden from doing.
 *
 * Conventions, all of which match glTF and three.js so nothing has to be
 * converted at the boundary:
 *
 *   - right-handed, Y up, metres
 *   - quaternions are `(x, y, z, w)` with `w` last
 *   - matrices are **column-major**, 16 numbers, `m[column * 4 + row]`
 *   - TRS applies scale first, then rotation, then translation
 *
 * Every value here is immutable. Transform edits replace the whole `Trs`
 * rather than mutating a component, because the command/undo machinery in
 * `commands.ts` captures previous values by reference and a mutated vector
 * would silently corrupt an undo entry that was recorded before the edit.
 */

/** A point or direction in metres. */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** A rotation, `w` last. Assumed normalized; `quatNormalize` enforces it. */
export interface Quat {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

/**
 * Translation / rotation / scale, kept apart from primitive parameters.
 *
 * Dragging a box must not edit the box's width. Gizmos and hand-grabs write
 * here; the parameter inspector writes to `PrimitiveNode.params`. Keeping the
 * two disjoint is what lets a grab and a parameter edit be undone
 * independently, and it is why transforms are their own node kind.
 */
export interface Trs {
  readonly translation: Vec3;
  readonly rotation: Quat;
  readonly scale: Vec3;
}

/** A column-major 4x4 matrix: exactly 16 numbers, `m[column * 4 + row]`. */
export type Mat4 = readonly number[];

export const ORIGIN: Vec3 = Object.freeze({ x: 0, y: 0, z: 0 });
export const UNIT_SCALE: Vec3 = Object.freeze({ x: 1, y: 1, z: 1 });
export const IDENTITY_ROTATION: Quat = Object.freeze({ x: 0, y: 0, z: 0, w: 1 });

export const IDENTITY_TRS: Trs = Object.freeze({
  translation: ORIGIN,
  rotation: IDENTITY_ROTATION,
  scale: UNIT_SCALE,
});

export const IDENTITY_MATRIX: Mat4 = Object.freeze([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function quat(x: number, y: number, z: number, w: number): Quat {
  return { x, y, z, w };
}

/**
 * Build a `Trs`, defaulting the components that were not given.
 *
 * Written with explicit `??` rather than object spread because the project
 * compiles with `exactOptionalPropertyTypes`, under which spreading a partial
 * whose key is present-but-undefined would produce a `Trs` with an undefined
 * component and typecheck anyway.
 */
export function makeTrs(parts: Partial<Trs> = {}): Trs {
  return {
    translation: parts.translation ?? ORIGIN,
    rotation: parts.rotation ?? IDENTITY_ROTATION,
    scale: parts.scale ?? UNIT_SCALE,
  };
}

/** Hamilton product: the rotation `b` followed by the rotation `a`. */
export function quatMultiply(a: Quat, b: Quat): Quat {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/**
 * Normalize, returning identity for a zero-length quaternion.
 *
 * The zero case is not theoretical: hand tracking hands back interpolated
 * joint poses, and a lost-tracking frame can produce all zeros. Returning
 * identity keeps a dropped frame from turning into `NaN` that then propagates
 * into the document and survives a save.
 */
export function quatNormalize(q: Quat): Quat {
  const lengthSquared = q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w;
  if (lengthSquared === 0) return IDENTITY_ROTATION;
  const inverseLength = 1 / Math.sqrt(lengthSquared);
  return {
    x: q.x * inverseLength,
    y: q.y * inverseLength,
    z: q.z * inverseLength,
    w: q.w * inverseLength,
  };
}

/** The inverse rotation. Assumes `q` is normalized, so conjugate is enough. */
export function quatConjugate(q: Quat): Quat {
  return { x: -q.x, y: -q.y, z: -q.z, w: q.w };
}

/** Rotate `v` by `q` — `v + 2 * cross(q.xyz, cross(q.xyz, v) + q.w * v)`. */
export function rotateVec3(q: Quat, v: Vec3): Vec3 {
  const tx = 2 * (q.y * v.z - q.z * v.y);
  const ty = 2 * (q.z * v.x - q.x * v.z);
  const tz = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

/** The column-major matrix for a TRS: scale, then rotate, then translate. */
export function trsToMatrix(t: Trs): Mat4 {
  const { x, y, z, w } = t.rotation;
  const { x: sx, y: sy, z: sz } = t.scale;

  const x2 = x + x;
  const y2 = y + y;
  const z2 = z + z;
  const xx = x * x2;
  const xy = x * y2;
  const xz = x * z2;
  const yy = y * y2;
  const yz = y * z2;
  const zz = z * z2;
  const wx = w * x2;
  const wy = w * y2;
  const wz = w * z2;

  return [
    (1 - (yy + zz)) * sx,
    (xy + wz) * sx,
    (xz - wy) * sx,
    0,

    (xy - wz) * sy,
    (1 - (xx + zz)) * sy,
    (yz + wx) * sy,
    0,

    (xz + wy) * sz,
    (yz - wx) * sz,
    (1 - (xx + yy)) * sz,
    0,

    t.translation.x,
    t.translation.y,
    t.translation.z,
    1,
  ];
}

/** `a * b`, both column-major: applies `b` first, then `a`. */
export function multiplyMatrices(a: Mat4, b: Mat4): Mat4 {
  const out: number[] = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) {
        sum += (a[k * 4 + row] ?? 0) * (b[column * 4 + k] ?? 0);
      }
      out[column * 4 + row] = sum;
    }
  }
  return out;
}

/**
 * Compose two TRS transforms into one.
 *
 * Exact when `parent.scale` is uniform. It is not exact for a non-uniform
 * parent scale wrapping a rotated child: that composition is a shear, and a
 * shear has no TRS representation — no library can fix this, three.js and glTF
 * have the same hole. Anything that must be correct in that case should
 * compose matrices instead (`CarveDocument.worldMatrix`), which is why the
 * evaluator in #6 takes matrices and not stacked TRS values.
 */
export function composeTrs(parent: Trs, child: Trs): Trs {
  const scaled = vec3(
    child.translation.x * parent.scale.x,
    child.translation.y * parent.scale.y,
    child.translation.z * parent.scale.z,
  );
  const rotated = rotateVec3(parent.rotation, scaled);
  return {
    translation: vec3(
      parent.translation.x + rotated.x,
      parent.translation.y + rotated.y,
      parent.translation.z + rotated.z,
    ),
    rotation: quatMultiply(parent.rotation, child.rotation),
    scale: vec3(
      parent.scale.x * child.scale.x,
      parent.scale.y * child.scale.y,
      parent.scale.z * child.scale.z,
    ),
  };
}

/** Exact component equality. Used by tests and by change detection, not by UI. */
export function trsEquals(a: Trs, b: Trs): boolean {
  return (
    a.translation.x === b.translation.x &&
    a.translation.y === b.translation.y &&
    a.translation.z === b.translation.z &&
    a.rotation.x === b.rotation.x &&
    a.rotation.y === b.rotation.y &&
    a.rotation.z === b.rotation.z &&
    a.rotation.w === b.rotation.w &&
    a.scale.x === b.scale.x &&
    a.scale.y === b.scale.y &&
    a.scale.z === b.scale.z
  );
}
