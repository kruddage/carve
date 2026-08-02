/**
 * Snapping.
 *
 * The rule under test that is a *decision* rather than arithmetic: a feature in
 * range beats the grid. Everything else here is quantization, but that one
 * governs what happens when someone tries to line a bracket up with a hole, and
 * getting it backwards makes hand tracking feel like it is fighting you.
 */

import { describe, expect, it } from 'vitest';

import { makeTrs, trsToMatrix, vec3, IDENTITY_MATRIX, quat } from '../src/core/index.js';
import {
  DEFAULT_SNAP_SETTINGS,
  SNAP_OFF,
  SnapField,
  boundsSnapFeatures,
  resolveSnap,
  snapRotation,
  snapToGrid,
  snapValue,
} from '../src/input/index.js';

import { UNIT_CUBE_BOUNDS, rotationAbout } from './support/input-fixture.js';

describe('grid', () => {
  it('rounds to the nearest step', () => {
    expect(snapValue(0.0123, 0.01)).toBeCloseTo(0.01, 9);
    expect(snapValue(0.0177, 0.01)).toBeCloseTo(0.02, 9);
    expect(snapValue(-0.0177, 0.01)).toBeCloseTo(-0.02, 9);
  });

  it('is a no-op for a zero or nonsense step, rather than dividing by it', () => {
    expect(snapValue(0.0123, 0)).toBe(0.0123);
    expect(snapValue(0.0123, Number.NaN)).toBe(0.0123);
    expect(snapToGrid(vec3(1.234, 0, 0), 0)).toEqual(vec3(1.234, 0, 0));
  });

  it('snaps each axis independently', () => {
    const snapped = snapToGrid(vec3(0.104, -0.096, 0.5), 0.01);
    expect(snapped.x).toBeCloseTo(0.1, 9);
    expect(snapped.y).toBeCloseTo(-0.1, 9);
    expect(snapped.z).toBeCloseTo(0.5, 9);
  });
});

describe('snapRotation', () => {
  it('quantizes the angle and keeps the axis the user turned about', () => {
    const snapped = snapRotation(rotationAbout(vec3(0, 1, 0), 20), 15);
    const expected = rotationAbout(vec3(0, 1, 0), 15);

    expect(snapped.x).toBeCloseTo(expected.x, 6);
    expect(snapped.y).toBeCloseTo(expected.y, 6);
    expect(snapped.z).toBeCloseTo(expected.z, 6);
    expect(snapped.w).toBeCloseTo(expected.w, 6);
  });

  it('snaps a small wobble back to no rotation at all', () => {
    const snapped = snapRotation(rotationAbout(vec3(0, 1, 0), 3), 15);
    expect(snapped).toEqual(quat(0, 0, 0, 1));
  });

  it('keeps an arbitrary axis rather than decomposing into Euler angles', () => {
    const axis = vec3(0.6, 0.8, 0);
    const snapped = snapRotation(rotationAbout(axis, 47), 15);
    // 47° snaps to 45°; the axis is untouched, so the x:y ratio survives.
    expect(snapped.x / snapped.y).toBeCloseTo(0.6 / 0.8, 6);
  });

  it('leaves the rotation alone when snapping is off', () => {
    const free = rotationAbout(vec3(0, 1, 0), 23.4);
    expect(snapRotation(free, 0)).toBe(free);
  });
});

describe('boundsSnapFeatures', () => {
  it('produces 8 corners, 12 edge midpoints and 6 face centres — and no centre', () => {
    const features = boundsSnapFeatures('cube', UNIT_CUBE_BOUNDS, IDENTITY_MATRIX);

    expect(features).toHaveLength(26);
    expect(features.filter((f) => f.kind === 'corner')).toHaveLength(8);
    expect(features.filter((f) => f.kind === 'edge-midpoint')).toHaveLength(12);
    expect(features.filter((f) => f.kind === 'face-center')).toHaveLength(6);
    // The centre of a solid is not something you can aim at.
    expect(features.some((f) => f.point.x === 0 && f.point.y === 0 && f.point.z === 0)).toBe(false);
  });

  it('moves with the node', () => {
    const matrix = trsToMatrix(makeTrs({ translation: vec3(10, 0, 0) }));
    const features = boundsSnapFeatures('cube', UNIT_CUBE_BOUNDS, matrix);
    expect(features.every((f) => f.point.x >= 9.5 - 1e-9)).toBe(true);
  });
});

describe('SnapField', () => {
  function field(): SnapField {
    const snapField = new SnapField();
    snapField.setFromBounds('a', UNIT_CUBE_BOUNDS, IDENTITY_MATRIX);
    snapField.setFromBounds(
      'b',
      UNIT_CUBE_BOUNDS,
      trsToMatrix(makeTrs({ translation: vec3(5, 0, 0) })),
    );
    return snapField;
  }

  it('finds the nearest feature within the radius', () => {
    const nearest = field().nearest(vec3(0.48, 0.51, 0.49), 0.05);
    expect(nearest?.nodeId).toBe('a');
    expect(nearest?.kind).toBe('corner');
  });

  it('finds nothing outside the radius', () => {
    expect(field().nearest(vec3(0.48, 0.51, 0.49), 0.001)).toBeNull();
  });

  it('excludes the node being dragged, which would otherwise pin it in place', () => {
    const nearest = field().nearest(vec3(0.48, 0.51, 0.49), 0.05, new Set(['a']));
    expect(nearest).toBeNull();
  });

  it('drops a node when it is removed', () => {
    const snapField = field();
    snapField.remove('a');
    expect(snapField.size).toBe(26);
    snapField.clear();
    expect(snapField.features()).toHaveLength(0);
  });

  it('treats a zero radius as snapping off', () => {
    expect(field().nearest(vec3(0.5, 0.5, 0.5), 0)).toBeNull();
  });
});

describe('resolveSnap', () => {
  it('prefers a feature in range over the grid', () => {
    const snapField = new SnapField();
    snapField.setFromBounds('a', UNIT_CUBE_BOUNDS, IDENTITY_MATRIX);

    // 0.4931 would snap to 0.493 on a 1mm grid; the corner at 0.5 is 7mm away
    // and inside the 20mm feature radius, so the corner wins.
    const result = resolveSnap(vec3(0.4931, 0.4931, 0.4931), DEFAULT_SNAP_SETTINGS, snapField);

    expect(result.feature?.kind).toBe('corner');
    expect(result.point.x).toBeCloseTo(0.5, 9);
    expect(result.snapped).toBe(true);
  });

  it('falls back to the grid when nothing is near', () => {
    const result = resolveSnap(vec3(0.0123, 0, 0), DEFAULT_SNAP_SETTINGS, new SnapField());
    expect(result.feature).toBeNull();
    expect(result.point.x).toBeCloseTo(0.012, 9);
  });

  it('leaves the point exactly where it was when snapping is off', () => {
    const result = resolveSnap(vec3(0.0123, 0, 0), SNAP_OFF);
    expect(result.point).toEqual(vec3(0.0123, 0, 0));
    expect(result.snapped).toBe(false);
  });

  it('applies the grid with no field at all', () => {
    expect(resolveSnap(vec3(0.0123, 0, 0), DEFAULT_SNAP_SETTINGS).point.x).toBeCloseTo(0.012, 9);
  });
});
