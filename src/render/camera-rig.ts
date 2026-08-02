/**
 * Orbit/pan/zoom camera rig, plus the standard views #9's toolbar wants.
 *
 * A spherical orbit around a target point rather than a free-fly camera:
 * "drag to orbit, scroll to zoom, middle-drag to pan" is the whole desktop
 * camera model in #9, and every one of those maps onto one spherical
 * coordinate. Keeping the state as `(azimuth, polar, radius, target)` instead
 * of a raw position + quaternion is what makes `setView('top')` a two-line
 * assignment instead of a look-at solve, and what keeps orbiting numerically
 * stable forever instead of drifting the way repeated quaternion deltas do.
 *
 * This module is the only place in `src/render/` that does camera math, and
 * it is pure enough to unit test without a canvas: build a rig against a
 * detached `PerspectiveCamera`, drive it, and read back position/quaternion.
 * `gl-renderer.ts` is the only caller that needs a real WebGL context.
 *
 * Intent mapping (issue #8, once it exists): `orbit`/`pan`/`dolly` are meant
 * to be called directly from pointer-drag deltas; nothing here reads a DOM
 * event.
 */

import { MathUtils, PerspectiveCamera, Vector3 } from 'three';

/** An axis-aligned box in world space, metres. */
export interface Bounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export const STANDARD_VIEWS = ['front', 'top', 'right', 'home'] as const;
export type StandardView = (typeof STANDARD_VIEWS)[number];

/** Radians. Keeps the rig from flipping through the pole or turning inside out. */
const MIN_POLAR = 0.001;
const MAX_POLAR = Math.PI - 0.001;
const MIN_RADIUS = 0.01;
const MAX_RADIUS = 10_000;

/** `(azimuth, polar, radius)` for each standard view, around whatever the current target is. */
const VIEW_ANGLES: Record<StandardView, { readonly azimuth: number; readonly polar: number }> = {
  // Looking down -Z, +Y up: the document's default "front".
  front: { azimuth: 0, polar: Math.PI / 2 },
  // Looking down -Y: +Z is "up" on screen for a top view.
  top: { azimuth: 0, polar: MIN_POLAR },
  // Looking down -X.
  right: { azimuth: Math.PI / 2, polar: Math.PI / 2 },
  // A three-quarter view, framed on whatever `frame()` was last given.
  home: { azimuth: Math.PI / 4, polar: Math.PI / 3 },
};

const DEFAULT_RADIUS = 5;
/** Fraction of extra room left around a framed bounds' bounding sphere. */
const FRAME_MARGIN = 1.3;

export interface CameraRigOptions {
  readonly fovDegrees?: number;
  readonly near?: number;
  readonly far?: number;
}

/**
 * Owns a `PerspectiveCamera` and the spherical state that drives it.
 *
 * Orthographic "standard views" are still through the perspective camera —
 * see `VIEW_ANGLES` — rather than a second `OrthographicCamera`, matching
 * most CAD viewports: a framed top view with a narrow FOV and a large radius
 * reads as orthographic without the seam of swapping projection matrices
 * (and the resulting resize/aspect bookkeeping) mid-session.
 */
export class CameraRig {
  readonly camera: PerspectiveCamera;

  #target = new Vector3(0, 0, 0);
  #azimuth = VIEW_ANGLES.home.azimuth;
  #polar = VIEW_ANGLES.home.polar;
  #radius = DEFAULT_RADIUS;

  constructor(options: CameraRigOptions = {}) {
    this.camera = new PerspectiveCamera(
      options.fovDegrees ?? 50,
      1,
      options.near ?? 0.01,
      options.far ?? 1000,
    );
    this.#apply();
  }

  get target(): readonly [number, number, number] {
    return [this.#target.x, this.#target.y, this.#target.z];
  }

  get radius(): number {
    return this.#radius;
  }

  setAspect(aspect: number): void {
    if (this.camera.aspect === aspect) return;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Orbit by a screen-space drag delta, in radians. */
  orbit(deltaAzimuth: number, deltaPolar: number): void {
    this.#azimuth -= deltaAzimuth;
    this.#polar = MathUtils.clamp(this.#polar - deltaPolar, MIN_POLAR, MAX_POLAR);
    this.#apply();
  }

  /**
   * Pan the target across the camera's own right/up plane.
   *
   * `deltaX`/`deltaY` are world-space distances at the target's depth, not
   * pixels — the caller (#8's pointer adapter) converts screen delta to world
   * delta using the viewport size and `radius`, so panning speed matches
   * cursor speed at any zoom level.
   */
  pan(deltaX: number, deltaY: number): void {
    const right = new Vector3();
    const up = new Vector3();
    this.camera.matrixWorld.extractBasis(right, up, new Vector3());
    this.#target.addScaledVector(right, -deltaX).addScaledVector(up, deltaY);
    this.#apply();
  }

  /** Multiplicative zoom: `factor > 1` moves the camera away from the target. */
  dolly(factor: number): void {
    this.#radius = MathUtils.clamp(this.#radius * factor, MIN_RADIUS, MAX_RADIUS);
    this.#apply();
  }

  /** Jump to one of the standard views, keeping the current target and radius. */
  setView(view: StandardView): void {
    const angles = VIEW_ANGLES[view];
    this.#azimuth = angles.azimuth;
    this.#polar = angles.polar;
    this.#apply();
  }

  /**
   * Frame `bounds` — set the target to its centre and back the camera off
   * far enough that the whole bounding sphere fits in view. `null` resets to
   * the origin at the default radius, for an empty document.
   */
  frame(bounds: Bounds | null): void {
    if (!bounds) {
      this.#target.set(0, 0, 0);
      this.#radius = DEFAULT_RADIUS;
      this.#apply();
      return;
    }

    const center = new Vector3(
      (bounds.min[0] + bounds.max[0]) / 2,
      (bounds.min[1] + bounds.max[1]) / 2,
      (bounds.min[2] + bounds.max[2]) / 2,
    );
    const extent = new Vector3(
      bounds.max[0] - bounds.min[0],
      bounds.max[1] - bounds.min[1],
      bounds.max[2] - bounds.min[2],
    );
    const sphereRadius = Math.max(extent.length() / 2, MIN_RADIUS);
    const fovRadians = MathUtils.degToRad(this.camera.fov);
    const distance = (sphereRadius / Math.sin(fovRadians / 2)) * FRAME_MARGIN;

    this.#target.copy(center);
    this.#radius = MathUtils.clamp(distance, MIN_RADIUS, MAX_RADIUS);
    this.#apply();
  }

  #apply(): void {
    const sinPolar = Math.sin(this.#polar);
    const offset = new Vector3(
      this.#radius * sinPolar * Math.sin(this.#azimuth),
      this.#radius * Math.cos(this.#polar),
      this.#radius * sinPolar * Math.cos(this.#azimuth),
    );
    this.camera.position.copy(this.#target).add(offset);
    this.camera.lookAt(this.#target);
    this.camera.updateMatrixWorld(true);
  }
}
