/**
 * The document model's geometry math.
 *
 * Small surface, but every one of these is load-bearing somewhere unpleasant:
 * a wrong matrix convention shows up as geometry in the wrong place only after
 * the renderer lands, and a `NaN` from a dropped hand-tracking frame gets saved
 * into the user's file and survives every reload.
 */

import { describe, expect, it } from 'vitest';

import {
  IDENTITY_ROTATION,
  IDENTITY_TRS,
  composeTrs,
  makeTrs,
  multiplyMatrices,
  quat,
  quatConjugate,
  quatMultiply,
  quatNormalize,
  rotateVec3,
  trsEquals,
  trsToMatrix,
  vec3,
} from '../src/core/index.js';

/** A quarter turn about +Y. */
const QUARTER_TURN_Y = quat(0, Math.SQRT1_2, 0, Math.SQRT1_2);

function expectClose(actual: number, expected: number): void {
  expect(actual).toBeCloseTo(expected, 12);
}

describe('quaternions', () => {
  it('rotates a vector', () => {
    const rotated = rotateVec3(QUARTER_TURN_Y, vec3(1, 0, 0));

    expectClose(rotated.x, 0);
    expectClose(rotated.y, 0);
    expectClose(rotated.z, -1);
  });

  it('composes so that the second argument is applied first', () => {
    const half = quatMultiply(QUARTER_TURN_Y, QUARTER_TURN_Y);
    const rotated = rotateVec3(half, vec3(1, 0, 0));

    expectClose(rotated.x, -1);
    expectClose(rotated.z, 0);
  });

  it('undoes itself with its conjugate', () => {
    const original = vec3(0.3, -2, 7);

    const round = rotateVec3(quatConjugate(QUARTER_TURN_Y), rotateVec3(QUARTER_TURN_Y, original));

    expectClose(round.x, original.x);
    expectClose(round.y, original.y);
    expectClose(round.z, original.z);
  });

  it('normalizes, and returns identity for the all-zero quaternion', () => {
    expect(quatNormalize(quat(0, 0, 0, 2))).toEqual(IDENTITY_ROTATION);
    // A lost-tracking frame can hand back zeros. Returning identity keeps that
    // from becoming a NaN that gets written into the user's file.
    expect(quatNormalize(quat(0, 0, 0, 0))).toEqual(IDENTITY_ROTATION);
  });
});

describe('matrices', () => {
  it('writes translation into the last column, column-major like glTF', () => {
    const matrix = trsToMatrix(makeTrs({ translation: vec3(1, 2, 3) }));

    expect(matrix.slice(12)).toEqual([1, 2, 3, 1]);
  });

  it('scales along the basis columns', () => {
    const matrix = trsToMatrix(makeTrs({ scale: vec3(2, 3, 4) }));

    expect([matrix[0], matrix[5], matrix[10]]).toEqual([2, 3, 4]);
  });

  it('multiplies so that the right-hand matrix applies first', () => {
    const translate = trsToMatrix(makeTrs({ translation: vec3(1, 0, 0) }));
    const scale = trsToMatrix(makeTrs({ scale: vec3(2, 2, 2) }));

    // translate * scale: scale the point, then move it.
    const product = multiplyMatrices(translate, scale);

    expect(product.slice(12)).toEqual([1, 0, 0, 1]);
    expect(product[0]).toBe(2);
  });

  it('is the identity for the identity TRS', () => {
    expect(trsToMatrix(IDENTITY_TRS)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });
});

describe('TRS composition', () => {
  it('agrees with matrix multiplication when the parent scale is uniform', () => {
    const parent = makeTrs({
      translation: vec3(1, 2, 3),
      rotation: QUARTER_TURN_Y,
      scale: vec3(2, 2, 2),
    });
    const child = makeTrs({ translation: vec3(0, 0, 1), rotation: QUARTER_TURN_Y });

    const composed = trsToMatrix(composeTrs(parent, child));
    const multiplied = multiplyMatrices(trsToMatrix(parent), trsToMatrix(child));

    composed.forEach((value, index) => expectClose(value, multiplied[index] ?? Number.NaN));
  });

  it('is not exact for a non-uniform parent scale above a rotation — by nature', () => {
    // The true composition is a shear, and a shear has no TRS form. Asserted
    // rather than left implicit so that nobody "fixes" composeTrs by chasing
    // this difference; the fix is to compose matrices, which is what
    // CarveDocument.worldMatrix does.
    // The rotation has to mix two axes that are scaled differently, or there
    // is no shear to miss: a turn about Y under a scale of (1, 4, 1) stays
    // inside the uniformly-scaled XZ plane and composes exactly.
    const parent = makeTrs({ scale: vec3(1, 4, 1) });
    const child = makeTrs({
      rotation: quat(0, 0, Math.SQRT1_2, Math.SQRT1_2),
      translation: vec3(1, 0, 0),
    });

    const composed = trsToMatrix(composeTrs(parent, child));
    const multiplied = multiplyMatrices(trsToMatrix(parent), trsToMatrix(child));

    expect(composed).not.toEqual(multiplied);
  });

  it('leaves a transform unchanged when composed with the identity', () => {
    const transform = makeTrs({
      translation: vec3(0.1, 0.2, 0.3),
      rotation: QUARTER_TURN_Y,
      scale: vec3(1, 2, 3),
    });

    expect(trsEquals(composeTrs(IDENTITY_TRS, transform), transform)).toBe(true);
    expect(trsEquals(composeTrs(transform, IDENTITY_TRS), transform)).toBe(true);
  });
});
