/**
 * The math under everything else in `src/input/`: rays, intersections, and the
 * two matrix operations core deliberately does not carry.
 *
 * Held to the same bar as `test/math.test.ts` — conventions are asserted, not
 * assumed. A sign error in `rayFromPose` is invisible on a laptop and points
 * the controller backwards in a headset, which is the most expensive kind of
 * bug this project can have.
 */

import { describe, expect, it } from 'vitest';

import {
  IDENTITY_MATRIX,
  makeTrs,
  multiplyMatrices,
  quat,
  trsToMatrix,
  vec3,
} from '../src/core/index.js';
import {
  decomposeMatrix,
  intersectAabb,
  intersectPlane,
  intersectTriangle,
  invertMatrix,
  makeRay,
  normalize,
  rayFromPose,
  rayFromScreenPoint,
  transformAabb,
  transformRay,
  type Aabb,
} from '../src/input/index.js';

import { cameraOnZ, rotationAbout, UNIT_CUBE_BOUNDS } from './support/input-fixture.js';

function expectClose(actual: number, expected: number, precision = 6): void {
  expect(actual).toBeCloseTo(expected, precision);
}

describe('vectors', () => {
  it('normalizes to unit length', () => {
    const unit = normalize(vec3(0, 3, 4));
    expectClose(unit.x, 0);
    expectClose(unit.y, 0.6);
    expectClose(unit.z, 0.8);
  });

  it('returns a usable direction for a zero-length vector rather than NaN', () => {
    // A lost hand-tracking frame hands back zeros; NaN here would reach the
    // document and survive a save.
    expect(normalize(vec3(0, 0, 0))).toEqual(vec3(0, 0, -1));
  });

  it('makeRay normalizes whatever direction it is given', () => {
    const ray = makeRay(vec3(0, 0, 0), vec3(0, 0, -7));
    expectClose(ray.direction.z, -1);
  });
});

describe('invertMatrix', () => {
  it('inverts a translate/rotate/scale matrix', () => {
    const matrix = trsToMatrix(
      makeTrs({
        translation: vec3(1, 2, 3),
        rotation: rotationAbout(vec3(0, 1, 0), 35),
        scale: vec3(2, 2, 2),
      }),
    );
    const inverse = invertMatrix(matrix);
    expect(inverse).not.toBeNull();

    const product = multiplyMatrices(matrix, inverse ?? IDENTITY_MATRIX);
    product.forEach((value, index) => expectClose(value, IDENTITY_MATRIX[index] ?? 0));
  });

  it('returns null for a singular matrix instead of throwing', () => {
    // A zero scale is a legal document state and reaches picking as a
    // non-invertible world matrix.
    const flattened = trsToMatrix(makeTrs({ scale: vec3(1, 0, 1) }));
    expect(invertMatrix(flattened)).toBeNull();
  });
});

describe('decomposeMatrix', () => {
  it('round-trips a TRS', () => {
    const trs = makeTrs({
      translation: vec3(0.1, -0.2, 3),
      rotation: rotationAbout(normalize(vec3(1, 2, 3)), 47),
      scale: vec3(1.5, 1.5, 1.5),
    });

    const back = decomposeMatrix(trsToMatrix(trs));

    expectClose(back.translation.x, trs.translation.x);
    expectClose(back.translation.y, trs.translation.y);
    expectClose(back.translation.z, trs.translation.z);
    expectClose(back.scale.x, 1.5);
    expectClose(back.scale.y, 1.5);
    expectClose(back.scale.z, 1.5);
    // Sign of a quaternion is not observable in the rotation it describes, so
    // compare the rotation, not the four numbers.
    const dot =
      back.rotation.x * trs.rotation.x +
      back.rotation.y * trs.rotation.y +
      back.rotation.z * trs.rotation.z +
      back.rotation.w * trs.rotation.w;
    expectClose(Math.abs(dot), 1, 5);
  });

  it('survives a 180° rotation, where the naive branch loses all precision', () => {
    const rotation = rotationAbout(vec3(0, 1, 0), 180);
    const back = decomposeMatrix(trsToMatrix(makeTrs({ rotation })));

    // Flipping the part over must still round-trip: apply the decomposed
    // rotation to +X and it should land on -X.
    const m = trsToMatrix(makeTrs({ rotation: back.rotation }));
    expectClose(m[0] ?? 0, -1, 5);
    expectClose(m[10] ?? 0, -1, 5);
  });

  it('folds a mirror into the X scale rather than losing it', () => {
    const mirrored = trsToMatrix(makeTrs({ scale: vec3(-1, 1, 1) }));
    expect(decomposeMatrix(mirrored).scale.x).toBeLessThan(0);
  });

  it('reports identity rotation for a collapsed matrix instead of NaN', () => {
    const collapsed = trsToMatrix(makeTrs({ scale: vec3(0, 1, 1) }));
    expect(decomposeMatrix(collapsed).rotation).toEqual(quat(0, 0, 0, 1));
  });
});

describe('rays from a camera', () => {
  it('casts through the centre of the viewport along -Z', () => {
    const ray = rayFromScreenPoint(cameraOnZ(), 50, 50, 100, 100);
    expectClose(ray.direction.x, 0);
    expectClose(ray.direction.y, 0);
    expectClose(ray.direction.z, -1);
  });

  it('casts right and up for a point right of and above centre', () => {
    const ray = rayFromScreenPoint(cameraOnZ(), 75, 25, 100, 100);
    expect(ray.direction.x).toBeGreaterThan(0);
    expect(ray.direction.y).toBeGreaterThan(0);
  });

  it('widens with the aspect ratio, so a wide viewport does not stretch picking', () => {
    const square = rayFromScreenPoint(cameraOnZ(5, 50, 1), 100, 50, 100, 100);
    const wide = rayFromScreenPoint(cameraOnZ(5, 50, 2), 100, 50, 100, 100);
    expect(Math.abs(wide.direction.x)).toBeGreaterThan(Math.abs(square.direction.x));
  });

  it('starts at the camera', () => {
    expect(rayFromScreenPoint(cameraOnZ(3), 0, 0, 100, 100).origin).toEqual(vec3(0, 0, 3));
  });
});

describe('rayFromPose', () => {
  it('points down -Z for an identity orientation, as WebXR defines a target ray', () => {
    const ray = rayFromPose(vec3(0, 1, 0), quat(0, 0, 0, 1));
    expect(ray.origin).toEqual(vec3(0, 1, 0));
    expectClose(ray.direction.z, -1);
  });

  it('turns with the pose: 90° about +Y aims down -X', () => {
    const ray = rayFromPose(vec3(0, 0, 0), rotationAbout(vec3(0, 1, 0), 90));
    expectClose(ray.direction.x, -1, 5);
    expectClose(ray.direction.z, 0, 5);
  });
});

describe('intersectAabb', () => {
  const box = UNIT_CUBE_BOUNDS;

  it('reports the distance to the near face', () => {
    const hit = intersectAabb(makeRay(vec3(0, 0, 5), vec3(0, 0, -1)), box);
    expectClose(hit ?? 0, 4.5);
  });

  it('misses a box the ray passes beside', () => {
    expect(intersectAabb(makeRay(vec3(2, 0, 5), vec3(0, 0, -1)), box)).toBeNull();
  });

  it('reports zero from inside — a hand inside a solid is holding it', () => {
    expect(intersectAabb(makeRay(vec3(0, 0, 0), vec3(0, 0, -1)), box)).toBe(0);
  });

  it('misses when the ray runs parallel to a slab outside it', () => {
    // The axis-parallel case: without the explicit guard the division by zero
    // produces infinities that compare as a hit.
    expect(intersectAabb(makeRay(vec3(0, 5, 0), vec3(1, 0, 0)), box)).toBeNull();
  });

  it('misses a box behind the ray', () => {
    expect(intersectAabb(makeRay(vec3(0, 0, 5), vec3(0, 0, 1)), box)).toBeNull();
  });
});

describe('intersectTriangle', () => {
  const a = vec3(-1, -1, 0);
  const b = vec3(1, -1, 0);
  const c = vec3(0, 1, 0);

  it('hits a triangle in front of the ray and reports the distance', () => {
    const hit = intersectTriangle(makeRay(vec3(0, 0, 2), vec3(0, 0, -1)), a, b, c);
    expectClose(hit?.distance ?? 0, 2);
  });

  it('flips the normal to face the ray', () => {
    const front = intersectTriangle(makeRay(vec3(0, 0, 2), vec3(0, 0, -1)), a, b, c);
    const back = intersectTriangle(makeRay(vec3(0, 0, -2), vec3(0, 0, 1)), a, b, c);
    expectClose(front?.normal.z ?? 0, 1);
    expectClose(back?.normal.z ?? 0, -1);
  });

  it('hits back faces, because a subtract leaves inward-facing surfaces', () => {
    expect(intersectTriangle(makeRay(vec3(0, 0, -2), vec3(0, 0, 1)), a, b, c)).not.toBeNull();
  });

  it('misses outside the triangle and behind the ray', () => {
    expect(intersectTriangle(makeRay(vec3(5, 5, 2), vec3(0, 0, -1)), a, b, c)).toBeNull();
    expect(intersectTriangle(makeRay(vec3(0, 0, 2), vec3(0, 0, 1)), a, b, c)).toBeNull();
  });
});

describe('intersectPlane', () => {
  it('finds the distance to a plane in front of the ray', () => {
    const along = intersectPlane(
      makeRay(vec3(0, 0, 5), vec3(0, 0, -1)),
      vec3(0, 0, 1),
      vec3(0, 0, 1),
    );
    expectClose(along ?? 0, 4);
  });

  it('returns null when the ray is parallel to the plane', () => {
    expect(
      intersectPlane(makeRay(vec3(0, 0, 5), vec3(1, 0, 0)), vec3(0, 0, 0), vec3(0, 0, 1)),
    ).toBeNull();
  });

  it('returns null when the plane is behind the ray', () => {
    expect(
      intersectPlane(makeRay(vec3(0, 0, 5), vec3(0, 0, 1)), vec3(0, 0, 0), vec3(0, 0, 1)),
    ).toBeNull();
  });
});

describe('transforms', () => {
  it('moves a ray into local space', () => {
    const toLocal =
      invertMatrix(trsToMatrix(makeTrs({ translation: vec3(0, 0, 3) }))) ?? IDENTITY_MATRIX;
    const local = transformRay(toLocal, makeRay(vec3(0, 0, 5), vec3(0, 0, -1)));
    expectClose(local.origin.z, 2);
    expectClose(local.direction.z, -1);
  });

  it('re-bounds a rotated box around all eight corners', () => {
    const rotated = trsToMatrix(makeTrs({ rotation: rotationAbout(vec3(0, 1, 0), 45) }));
    const bounds: Aabb = transformAabb(rotated, UNIT_CUBE_BOUNDS);
    // A cube turned 45° about Y is √2/2 ≈ 0.707 wide in X and Z, and unchanged
    // in Y.
    expectClose(bounds.max[0], Math.SQRT1_2, 5);
    expectClose(bounds.max[1], 0.5, 5);
    expectClose(bounds.max[2], Math.SQRT1_2, 5);
  });
});
