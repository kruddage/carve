/**
 * The primitive set, evaluated.
 *
 * Every shape is checked against a closed-form expectation rather than against
 * a stored mesh: volume from the divergence theorem, the bounding box, and
 * genus where it distinguishes anything. That is what makes these assertions
 * survive a `manifold-3d` upgrade that retriangulates — the solid is the
 * contract, its triangulation is not.
 *
 * Two conventions are load-bearing enough to get their own tests, because both
 * fail silently and both fail in only one of the two frontends:
 *
 *   - **+Y up.** `manifold-3d` is Z-up, `solids.ts` converts once, and a cone
 *     that came out pointing along +Z would look plausible in a desktop
 *     viewport and wrong in a headset where "up" is not a camera choice.
 *   - **centred on the origin.** A primitive resting on the XZ plane reads fine
 *     on a grid and badly in a room, and it makes a grabbed object rotate about
 *     a point that is not in your hand.
 *
 * Tessellation counts appear as tolerances, not as exact numbers: a 32-sided
 * cylinder inscribes its circle, so its volume is a few percent under the
 * analytic one and converges as segments rise. Asserting the *inscribed* value
 * would be pinning the tessellation strategy; asserting a band that tightens
 * with segment count is asserting that the parameter means what it says.
 *
 * ## Ratios, not absolute tolerances
 *
 * Positions come back as `Float32Array` — that is the layout the GPU wants and
 * the one #4 uploads without a copy — so every coordinate carries about seven
 * significant digits. On a 60mm part that is nanometres of slop, which is far
 * inside any tolerance that means anything physically, and far outside what
 * `toBeCloseTo(expected, 12)` allows on a number of the order of 1e-5. So exact
 * expectations are written as ratios against the analytic value, where the
 * precision argument means significant figures rather than absolute metres.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  PRIMITIVE_KINDS,
  TESSELLATION_QUALITIES,
  defaultParameters,
  getPrimitive,
  spawnPrimitive,
  type PrimitiveKind,
  type TessellationQuality,
} from '../src/core/index.js';
import { Evaluator, type MeshPayload } from '../src/kernel/index.js';

import {
  bounds,
  isWatertight,
  normal,
  openEdges,
  sharedManifold,
  soloBundle,
  triangleCount,
  volume,
  type Bounds,
} from './support/kernel-fixture.js';

/** `actual / expected ≈ 1`, to `digits` significant figures. See the header. */
function expectRatio(actual: number, expected: number, digits = 5): void {
  expect(actual / expected).toBeCloseTo(1, digits);
}

/** The size of a bounding box along one axis. */
function extent(box: Bounds, axis: number): number {
  return (box.max[axis] ?? 0) - (box.min[axis] ?? 0);
}

let api: Awaited<ReturnType<typeof sharedManifold>>;
let evaluator: Evaluator;

beforeAll(async () => {
  api = await sharedManifold();
  evaluator = new Evaluator(api);
});

function meshOf(kind: PrimitiveKind, params: Record<string, number> = {}): MeshPayload {
  const outcome = evaluator.evaluate(soloBundle(kind, params));
  expect(outcome.warnings).toEqual([]);
  return outcome.mesh;
}

describe('every primitive evaluates to a watertight solid', () => {
  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} is closed, positively wound and non-empty`, () => {
      const mesh = meshOf(kind);
      expect(triangleCount(mesh)).toBeGreaterThan(0);
      expect(openEdges(mesh)).toEqual([]);
      // A positive signed volume means the triangles are wound outward. A
      // mesh wound inward renders identically with backface culling off and is
      // rejected by every slicer there is.
      expect(volume(mesh)).toBeGreaterThan(0);
    });

    it(`${kind} is centred on its own origin`, () => {
      const { min, max } = bounds(meshOf(kind));
      for (let axis = 0; axis < 3; axis += 1) {
        expect((min[axis] ?? 0) + (max[axis] ?? 0)).toBeCloseTo(0, 6);
      }
    });
  }
});

describe('box', () => {
  it('measures exactly, in metres', () => {
    const mesh = meshOf('box', { width: 0.04, height: 0.02, depth: 0.06 });
    expectRatio(volume(mesh), 0.04 * 0.02 * 0.06, 6);
    const { min, max } = bounds(mesh);
    expect(min).toEqual([
      expect.closeTo(-0.02, 7),
      expect.closeTo(-0.01, 7),
      expect.closeTo(-0.03, 7),
    ]);
    expect(max).toEqual([
      expect.closeTo(0.02, 7),
      expect.closeTo(0.01, 7),
      expect.closeTo(0.03, 7),
    ]);
    // Six quads, two triangles each. A box that arrives with more than this has
    // picked up an unnecessary subdivision somewhere.
    expect(triangleCount(mesh)).toBe(12);
  });
});

describe('cylinder', () => {
  it('extends along Y, not along manifold-3d’s Z', () => {
    const { min, max } = bounds(meshOf('cylinder', { radius: 0.01, height: 0.08 }));
    expect(max[1] - (min[1] ?? 0)).toBeCloseTo(0.08, 7);
    expect(max[0] - (min[0] ?? 0)).toBeCloseTo(0.02, 3);
    expect(max[2] - (min[2] ?? 0)).toBeCloseTo(0.02, 3);
  });

  it('converges on πr²h as the side count rises', () => {
    const analytic = Math.PI * 0.01 * 0.01 * 0.08;
    const coarse = volume(meshOf('cylinder', { radius: 0.01, height: 0.08, radialSegments: 8 }));
    const fine = volume(meshOf('cylinder', { radius: 0.01, height: 0.08, radialSegments: 128 }));

    // Inscribed, so always under — and the coarse one visibly so.
    expect(coarse).toBeLessThan(analytic);
    expect(fine).toBeLessThan(analytic);
    expect(fine).toBeGreaterThan(coarse);
    expect(fine / analytic).toBeGreaterThan(0.999);
    expect(coarse / analytic).toBeLessThan(0.95);
  });
});

describe('sphere', () => {
  it('converges on 4/3πr³', () => {
    const analytic = (4 / 3) * Math.PI * 0.03 ** 3;
    const coarse = volume(meshOf('sphere', { radius: 0.03, segments: 8 }));
    const fine = volume(meshOf('sphere', { radius: 0.03, segments: 128 }));
    // A geodesic sphere refines an octahedron, so it inscribes and converges
    // more slowly than a lat/long sphere of the same nominal segment count.
    expect(fine).toBeLessThan(analytic);
    expect(fine).toBeGreaterThan(coarse);
    expect(fine / analytic).toBeGreaterThan(0.998);
  });

  it('has smooth normals — no crease survives on a round surface', () => {
    const mesh = meshOf('sphere', { radius: 0.03, segments: 64 });
    // Every normal is unit length and points away from the centre, which is
    // only true if the crease threshold left the sphere's shared normals alone.
    for (let vertex = 0; vertex < mesh.vertices.length / mesh.stride; vertex += 1) {
      const n = normal(mesh, vertex);
      expect(Math.hypot(...n)).toBeCloseTo(1, 4);
    }
  });
});

describe('cone', () => {
  it('is a true point when the top radius is zero', () => {
    const mesh = meshOf('cone', { baseRadius: 0.02, topRadius: 0, height: 0.05 });
    const analytic = (Math.PI * 0.02 ** 2 * 0.05) / 3;
    expect(volume(mesh) / analytic).toBeGreaterThan(0.99);
    expect(volume(mesh)).toBeLessThan(analytic);
    expect(isWatertight(mesh)).toBe(true);
  });

  it('puts the base radius at −Y', () => {
    const mesh = meshOf('cone', { baseRadius: 0.02, topRadius: 0, height: 0.05 });
    // The apex is the only vertex at the top, so the widest ring must be at the
    // bottom. Compare the extreme radius found in each half.
    let bottomRadius = 0;
    let topRadius = 0;
    for (let vertex = 0; vertex < mesh.vertices.length / mesh.stride; vertex += 1) {
      const base = vertex * mesh.stride;
      const x = mesh.vertices[base] ?? 0;
      const y = mesh.vertices[base + 1] ?? 0;
      const z = mesh.vertices[base + 2] ?? 0;
      const radius = Math.hypot(x, z);
      if (y < 0) bottomRadius = Math.max(bottomRadius, radius);
      else topRadius = Math.max(topRadius, radius);
    }
    expect(bottomRadius).toBeGreaterThan(0.019);
    expect(topRadius).toBeLessThan(1e-6);
  });

  it('is a frustum when both radii are non-zero', () => {
    const mesh = meshOf('cone', {
      baseRadius: 0.02,
      topRadius: 0.01,
      height: 0.05,
      radialSegments: 128,
    });
    // V = πh(R² + Rr + r²)/3
    const analytic = (Math.PI * 0.05 * (0.02 ** 2 + 0.02 * 0.01 + 0.01 ** 2)) / 3;
    expect(volume(mesh)).toBeLessThan(analytic);
    expect(volume(mesh) / analytic).toBeGreaterThan(0.999);
  });
});

describe('torus', () => {
  it('has a hole through it', () => {
    const mesh = meshOf('torus', {
      majorRadius: 0.04,
      minorRadius: 0.01,
      majorSegments: 96,
      minorSegments: 48,
    });
    // V = 2π²Rr²
    const analytic = 2 * Math.PI ** 2 * 0.04 * 0.01 ** 2;
    expect(volume(mesh) / analytic).toBeGreaterThan(0.99);
    expect(isWatertight(mesh)).toBe(true);
    // The ring lies in XZ with its axis along Y: the Y extent is the tube
    // diameter, the X and Z extents are the outer diameter.
    const { min, max } = bounds(mesh);
    expect(max[1] - (min[1] ?? 0)).toBeCloseTo(0.02, 3);
    expect(max[0] - (min[0] ?? 0)).toBeCloseTo(0.1, 2);
  });

  it('repairs a tube fatter than its ring rather than failing', () => {
    // `normalizeParameters` catches this upstream of the kernel. The kernel
    // still has to produce a solid, because a saved file can contain anything.
    const outcome = evaluator.evaluate(
      soloBundle('torus', { majorRadius: 0.02, minorRadius: 0.05 }),
    );
    expect(outcome.warnings).toEqual([]);
    expect(volume(outcome.mesh)).toBeGreaterThan(0);
    expect(isWatertight(outcome.mesh)).toBe(true);
  });
});

describe('wedge', () => {
  it('is half a box, tapering to nothing at +X', () => {
    const mesh = meshOf('wedge', { width: 0.06, height: 0.04, depth: 0.02 });
    // The scaleTop argument to manifold-3d's `extrude` is not interpreted as a
    // uniform scale when passed as a scalar, and the silent result is a wedge
    // with two thirds of this volume. Hence an exact assertion.
    expectRatio(volume(mesh), 0.5 * 0.06 * 0.04 * 0.02, 6);
    expect(bounds(mesh).max[1]).toBeCloseTo(0.02, 5);
  });

  it('has flat faces — every normal on a face is the face normal', () => {
    const mesh = meshOf('wedge', { width: 0.06, height: 0.04, depth: 0.02 });
    const normals = new Set<string>();
    for (let vertex = 0; vertex < mesh.vertices.length / mesh.stride; vertex += 1) {
      normals.add(
        normal(mesh, vertex)
          .map((value) => value.toFixed(4))
          .join(','),
      );
    }
    // Five faces: two triangles, three quads. A wedge with fewer distinct
    // normals has had a crease smoothed away by the threshold.
    expect(normals.size).toBe(5);
  });
});

describe('defaults', () => {
  it('every registry default builds', () => {
    for (const kind of PRIMITIVE_KINDS) {
      const node = spawnPrimitive(kind);
      expect(node.params).toEqual(defaultParameters(kind));
      const outcome = evaluator.evaluate({ rootId: node.id, nodes: [node] });
      expect(outcome.warnings).toEqual([]);
      expect(volume(outcome.mesh)).toBeGreaterThan(0);
    }
  });
});

/**
 * The property #6's subtree cache is built on, asserted from the mesh side.
 *
 * `primitives.test.ts` already holds down the parameter half: `parametersKey`
 * is canonical, so two spellings of one box produce one cache key. That is only
 * half the claim. If construction were not itself deterministic, one key would
 * name two meshes, the cache would serve whichever it happened to build first,
 * and nothing anywhere would report a difference — the viewport would just be
 * subtly wrong on a reload.
 *
 * Byte-identical is the right bar rather than "close enough": these buffers are
 * produced by the same WASM build from the same inputs, so any drift at all is
 * an ambient input that should not be there.
 */
describe('construction is deterministic', () => {
  /** A fresh evaluator per build, so the cache cannot be why two meshes match. */
  function uncachedMesh(kind: PrimitiveKind, params: Record<string, number> = {}): MeshPayload {
    return new Evaluator(api).evaluate(soloBundle(kind, params)).mesh;
  }

  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} builds byte-identically from identical parameters`, () => {
      const first = uncachedMesh(kind);
      const second = uncachedMesh(kind);
      expect([...second.vertices]).toEqual([...first.vertices]);
      expect([...second.indices]).toEqual([...first.indices]);
    });
  }

  it('a parameter that differs produces a mesh that differs', () => {
    // The negative of the above: identical output for identical input is only
    // interesting if the output is sensitive to the input at all.
    const nominal = uncachedMesh('cylinder');
    const taller = uncachedMesh('cylinder', { height: 0.09 });
    expect([...taller.vertices]).not.toEqual([...nominal.vertices]);
  });
});

/**
 * Quality tiers change how much geometry there is, never how big it is.
 *
 * This is the lever `docs/kernel.md` names first when a tree misses its budget,
 * and the one #12 will pull to put six thumbnails on a wrist at 72fps. It is
 * only a usable lever if switching tiers cannot change the part: a `draft`
 * session that quietly shrank every cylinder would be a measurement error you
 * would carry all the way to a slicer.
 *
 * Which primitives *should* change is read from the registry rather than
 * listed here — a box has no segment count to scale, and hardcoding which three
 * do is the failure mode `primitives.test.ts` exists to catch.
 */
describe('tessellation tiers', () => {
  function tierMesh(kind: PrimitiveKind, quality: TessellationQuality): MeshPayload {
    const node = spawnPrimitive(kind, { quality });
    const outcome = evaluator.evaluate({ rootId: node.id, nodes: [node] });
    expect(outcome.warnings).toEqual([]);
    return outcome.mesh;
  }

  /** Whether this primitive has any parameter a tier would scale. */
  function isTessellated(kind: PrimitiveKind): boolean {
    return getPrimitive(kind).parameters.some((parameter) => parameter.tessellation);
  }

  for (const kind of PRIMITIVE_KINDS) {
    it(`${kind} keeps its dimensions across draft, standard and fine`, () => {
      const reference = bounds(tierMesh(kind, 'standard'));
      for (const quality of TESSELLATION_QUALITIES) {
        const measured = bounds(tierMesh(kind, quality));
        for (let axis = 0; axis < 3; axis += 1) {
          // A tolerance rather than equality: a segment count decides where an
          // inscribed polygon's vertices land, so a coarser sweep is entitled
          // to a fractionally smaller extent. What would fail here is a tier
          // that scaled a dimension, which is a whole-percent error at least.
          expectRatio(extent(measured, axis), extent(reference, axis), 2);
        }
      }
    });

    it(
      isTessellated(kind)
        ? `${kind} gets denser with every tier`
        : `${kind} has no segment count for a tier to scale`,
      () => {
        const draft = triangleCount(tierMesh(kind, 'draft'));
        const standard = triangleCount(tierMesh(kind, 'standard'));
        const fine = triangleCount(tierMesh(kind, 'fine'));

        if (!isTessellated(kind)) {
          expect([draft, fine]).toEqual([standard, standard]);
          return;
        }
        expect(draft).toBeLessThan(standard);
        expect(standard).toBeLessThan(fine);
      },
    );
  }
});
