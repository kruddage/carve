/**
 * The orbit/pan/zoom math, tested against a detached camera — no canvas, no
 * WebGL context, matching the split `gl-renderer.ts` describes: this module
 * is pure enough to verify without a GPU.
 */

import { describe, expect, it } from 'vitest';

import { CameraRig } from '../src/render/camera-rig.js';

function expectClose(actual: number, expected: number, precision = 6): void {
  expect(actual).toBeCloseTo(expected, precision);
}

describe('CameraRig', () => {
  it('starts at a three-quarter home view looking at the origin', () => {
    const rig = new CameraRig();
    expect(rig.target).toEqual([0, 0, 0]);
    // Home view is above and off to the side, not straight down an axis.
    expect(rig.camera.position.y).toBeGreaterThan(0);
    expect(rig.camera.position.x).not.toBe(0);
  });

  it('setView("front") places the camera on +Z looking at the target', () => {
    const rig = new CameraRig();
    rig.setView('front');

    expectClose(rig.camera.position.x, 0);
    expectClose(rig.camera.position.y, 0);
    expect(rig.camera.position.z).toBeGreaterThan(0);
  });

  it('setView("top") places the camera on +Y looking down', () => {
    const rig = new CameraRig();
    rig.setView('top');

    expectClose(rig.camera.position.x, 0, 2);
    expectClose(rig.camera.position.z, 0, 2);
    expect(rig.camera.position.y).toBeGreaterThan(0);
  });

  it('setView("right") places the camera on +X', () => {
    const rig = new CameraRig();
    rig.setView('right');

    expectClose(rig.camera.position.y, 0);
    expectClose(rig.camera.position.z, 0);
    expect(rig.camera.position.x).toBeGreaterThan(0);
  });

  it('dolly moves the camera further from the target without moving the target', () => {
    const rig = new CameraRig();
    rig.setView('front');
    const before = rig.radius;

    rig.dolly(2);

    expect(rig.radius).toBeCloseTo(before * 2, 6);
    expect(rig.target).toEqual([0, 0, 0]);
  });

  it('dolly clamps to a minimum radius rather than crossing the target', () => {
    const rig = new CameraRig();
    for (let i = 0; i < 50; i += 1) rig.dolly(0.01);
    expect(rig.radius).toBeGreaterThan(0);
  });

  it('orbit changes the camera position but not the target', () => {
    const rig = new CameraRig();
    rig.setView('front');
    const before = rig.camera.position.clone();

    rig.orbit(Math.PI / 2, 0);

    expect(rig.camera.position.distanceTo(before)).toBeGreaterThan(0);
    expect(rig.target).toEqual([0, 0, 0]);
  });

  it('pan moves the target, and the camera stays the same distance away', () => {
    const rig = new CameraRig();
    rig.setView('front');
    const radiusBefore = rig.radius;

    rig.pan(1, 0);

    expect(rig.target).not.toEqual([0, 0, 0]);
    expect(rig.radius).toBeCloseTo(radiusBefore, 6);
  });

  it('frame(null) resets to the origin at the default radius', () => {
    const rig = new CameraRig();
    rig.frame({ min: [-1, -1, -1], max: [1, 1, 1] });
    rig.frame(null);

    expect(rig.target).toEqual([0, 0, 0]);
  });

  it('frame(bounds) centres the target on the bounds and backs off to fit them', () => {
    const rig = new CameraRig();
    rig.frame({ min: [-5, -5, -5], max: [5, 5, 5] });

    expect(rig.target).toEqual([0, 0, 0]);
    // A ~8.66m-radius bounding sphere needs meaningfully more than the
    // default 5m radius to fit inside a 50° field of view.
    expect(rig.radius).toBeGreaterThan(10);
  });

  it('frame(bounds) scales radius up for a larger part', () => {
    const rig = new CameraRig();
    rig.frame({ min: [-1, -1, -1], max: [1, 1, 1] });
    const small = rig.radius;

    rig.frame({ min: [-10, -10, -10], max: [10, 10, 10] });
    const large = rig.radius;

    expect(large).toBeGreaterThan(small);
  });

  it('exposes a pose of plain numbers, which is all #8 needs to cast a ray', () => {
    const rig = new CameraRig({ fovDegrees: 60 });
    rig.setAspect(16 / 9);
    rig.setView('front');

    const pose = rig.pose;

    expect(pose.fovDegrees).toBe(60);
    expect(pose.aspect).toBeCloseTo(16 / 9, 6);
    expectClose(pose.position.x, 0);
    expect(pose.position.z).toBeGreaterThan(0);
    // Front view looks down -Z with no roll: the identity orientation.
    expectClose(Math.abs(pose.orientation.w), 1, 5);
  });

  it('poses are snapshots, so reading one cannot move the camera', () => {
    const rig = new CameraRig();
    const pose = rig.pose;
    const cameraX = rig.camera.position.x;

    (pose.position as { x: number }).x = 999;

    expect(rig.camera.position.x).toBe(cameraX);
  });

  it('setAspect updates the camera projection only when the aspect changes', () => {
    const rig = new CameraRig();
    const matrixBefore = rig.camera.projectionMatrix.clone();

    rig.setAspect(rig.camera.aspect);
    expect(rig.camera.projectionMatrix.equals(matrixBefore)).toBe(true);

    rig.setAspect(16 / 9);
    expect(rig.camera.projectionMatrix.equals(matrixBefore)).toBe(false);
  });
});
