/**
 * Primitive parameters → `manifold-3d` solids.
 *
 * The `7a` registry (#25) says what a torus *is*: a major radius, a minor
 * radius, and the rule that the second must be smaller than the first. This
 * file is the only place that knows how to turn that description into geometry.
 * Every other layer stays in terms of parameters, which is what keeps the tree
 * non-destructive — a box is `{width, height, depth}` in the document forever
 * and twelve triangles only for as long as it takes to draw them.
 *
 * ## Two conventions, one conversion, done once
 *
 * `primitives.ts` states the document convention: **every solid is centred on
 * its own origin with +Y up**, so a transform node's translation places the
 * centre of the shape. `manifold-3d` is a Z-up library — `cylinder` extrudes
 * along Z, `extrude` extrudes along Z, and `revolve` produces a solid whose
 * axis is Z.
 *
 * The conversion is a single −90° rotation about X, which sends +Z to +Y, and
 * it is applied here at construction and nowhere else. Doing it once at the
 * bottom means everything above — transforms, booleans, hashing, the renderer —
 * lives in one frame of reference. Doing it "when needed" higher up is how a
 * cone ends up pointing the wrong way in exactly one of the two frontends.
 *
 * ## Tessellation is an argument, never an ambient default
 *
 * `manifold-3d` has module-level `setMinCircularAngle` / `setCircularSegments`
 * defaults that apply to any constructor called without an explicit segment
 * count. Nothing here relies on them, and nothing here sets them. Every
 * constructor below passes segments explicitly, from the node's own parameters.
 *
 * That is the same rule `primitives.ts` states for quality tiers, and for the
 * same reason: a mesh must be a pure function of `(kind, params)`. If density
 * came from ambient module state, one cache key would name two different
 * meshes, and switching a session to `draft` would serve desktop-density
 * geometry out of the cache — or worse, the reverse.
 *
 * ## Degenerate parameters do not reach here
 *
 * `normalizeParameters` is the funnel, and the evaluator runs every node's
 * parameters through it before calling into this file. A torus whose tube is
 * fatter than its ring, a cone with no radius at either end, a negative width —
 * all repaired upstream. What can still fail here is a `manifold-3d` error on
 * geometry that is individually legal, so callers get an exception rather than
 * a half-built solid, and the evaluator turns that into a `build-failed`
 * warning on the node.
 */

import type { ManifoldToplevel } from 'manifold-3d';

import {
  getPrimitive,
  normalizeParameters,
  type PrimitiveKind,
  type Vec3 as CoreVec3,
} from '../core/index.js';

/** A `manifold-3d` solid. Named to keep `Manifold` free for the toolkit's class. */
export type Solid = ReturnType<ManifoldToplevel['Manifold']['cube']>;

/**
 * Degrees about X that carry `manifold-3d`'s Z-up constructors to the
 * document's Y-up convention. See the header note.
 */
const Z_UP_TO_Y_UP: readonly [number, number, number] = [-90, 0, 0];

/**
 * Build the solid for one primitive node.
 *
 * `params` is normalized here rather than being trusted, so this is safe to
 * call with a raw `PrimitiveNode.params` — including one hand-edited in a saved
 * file or produced by a build where a parameter had a different range.
 */
export function buildSolid(
  api: ManifoldToplevel,
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
): Solid {
  const p = normalizeParameters(kind, params);
  // Every key is present after normalization — the loop in `normalizeParameters`
  // walks the schema, not the input — so the fallback is unreachable and exists
  // only because `noUncheckedIndexedAccess` cannot know that.
  const value = (key: string): number => p[key] ?? fallback(kind, key);

  const { Manifold, CrossSection } = api;

  switch (kind) {
    case 'box':
      return Manifold.cube([value('width'), value('height'), value('depth')], true);

    case 'cylinder': {
      const radius = value('radius');
      return Manifold.cylinder(
        value('height'),
        radius,
        radius,
        value('radialSegments'),
        true,
      ).rotate(Z_UP_TO_Y_UP);
    }

    case 'sphere':
      // No rotation: a geodesic sphere is symmetric about every axis, and
      // rotating it would only change which vertex sits at the pole.
      return Manifold.sphere(value('radius'), value('segments'));

    case 'cone':
      // `cylinder` with two radii is the frustum constructor. Low Z is the base,
      // and the Z→Y rotation puts low Z at −Y, which is where the registry says
      // `baseRadius` lives.
      return Manifold.cylinder(
        value('height'),
        value('baseRadius'),
        value('topRadius'),
        value('radialSegments'),
        true,
      ).rotate(Z_UP_TO_Y_UP);

    case 'torus': {
      // A circle of the tube's radius, pushed out to the ring radius, revolved.
      // `revolve` sweeps about the cross-section's Y axis and calls the result's
      // axis Z; the shared rotation then stands the ring up in the XZ plane.
      const profile = CrossSection.circle(value('minorRadius'), value('minorSegments')).translate([
        value('majorRadius'),
        0,
      ]);
      return Manifold.revolve(profile, value('majorSegments')).rotate(Z_UP_TO_Y_UP);
    }

    case 'wedge': {
      // A right triangular prism: full height at −X, tapering to nothing at +X,
      // extruded along Z. Bounding-box centred like every other primitive, so
      // the centroid is *not* at the origin — that is deliberate. A grabbed
      // wedge should rotate about the middle of the thing in your hand, not
      // about a centre of mass two-thirds of the way to one corner.
      const halfWidth = value('width') / 2;
      const halfHeight = value('height') / 2;
      const profile = new CrossSection([
        [
          [-halfWidth, -halfHeight],
          [halfWidth, -halfHeight],
          [-halfWidth, halfHeight],
        ],
      ]);
      // `scaleTop` is passed as an explicit `[1, 1]` rather than left to its
      // default or given as a scalar: a scalar is not interpreted as a uniform
      // scale by this binding, and the silent result is a wedge with two-thirds
      // of the volume it should have.
      return Manifold.extrude(profile, value('depth'), 0, 0, [1, 1], true);
    }
  }
}

/** Unreachable in practice — see the note at the call site. */
function fallback(kind: PrimitiveKind, key: string): number {
  const schema = getPrimitive(kind).parameters.find((parameter) => parameter.key === key);
  if (!schema) throw new Error(`${kind} has no parameter "${key}"`);
  return schema.default;
}

/**
 * A column-major `Mat4` from `core` as the tuple `manifold-3d` wants.
 *
 * Both are column-major with translation in the last column, so this is a
 * length check and a cast rather than a transpose. `core`'s `Mat4` is a
 * `readonly number[]` because it is built by `trsToMatrix` and multiplied by
 * `multiplyMatrices`; `manifold-3d` wants a 16-tuple, and TypeScript will not
 * narrow one into the other on its own.
 */
export function toManifoldMatrix(matrix: readonly number[]): Parameters<Solid['transform']>[0] {
  if (matrix.length !== 16) {
    throw new Error(`Expected a 4x4 column-major matrix, got ${matrix.length} numbers`);
  }
  return matrix as unknown as Parameters<Solid['transform']>[0];
}

/** A `core` `Vec3` as the tuple `manifold-3d` wants. */
export function toManifoldVec3(v: CoreVec3): [number, number, number] {
  return [v.x, v.y, v.z];
}
