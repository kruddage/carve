/**
 * Hit testing, and the policy for what a hit *means*.
 *
 * The policy half is the part worth testing hardest. "Nearest triangle wins" is
 * arithmetic; "clicking the face a subtract left behind selects the subtract,
 * and alt-clicking selects the cylinder that cut it" is a product decision that
 * two adapters must not be free to answer differently.
 */

import { describe, expect, it } from 'vitest';

import { makeTrs, trsToMatrix, vec3, IDENTITY_MATRIX } from '../src/core/index.js';
import {
  PickRegistry,
  makeRay,
  pickGeometryFromMesh,
  type PickTarget,
} from '../src/input/index.js';

import { bracketDocument } from './support/document-fixture.js';
import { UNIT_CUBE_BOUNDS, unitCubeGeometry } from './support/input-fixture.js';

function cubeTarget(nodeId: string, translation = vec3(0, 0, 0), exact = true): PickTarget {
  const worldMatrix = trsToMatrix(makeTrs({ translation }));
  return exact
    ? { nodeId, worldMatrix, bounds: UNIT_CUBE_BOUNDS, geometry: unitCubeGeometry() }
    : { nodeId, worldMatrix, bounds: UNIT_CUBE_BOUNDS };
}

const downZ = makeRay(vec3(0, 0, 5), vec3(0, 0, -1));

describe('PickRegistry', () => {
  it('hits an exact target and reports the world-space point and normal', () => {
    const registry = new PickRegistry();
    registry.register(cubeTarget('cube'));

    const hit = registry.pick(downZ);

    expect(hit?.nodeId).toBe('cube');
    expect(hit?.exact).toBe(true);
    expect(hit?.distance).toBeCloseTo(4.5, 6);
    expect(hit?.point.z).toBeCloseTo(0.5, 6);
    expect(hit?.normal?.z).toBeCloseTo(1, 6);
  });

  it('falls back to the bounding box when a target has no triangles', () => {
    const registry = new PickRegistry();
    registry.register(cubeTarget('cube', vec3(0, 0, 0), false));

    const hit = registry.pick(downZ);

    expect(hit?.exact).toBe(false);
    expect(hit?.normal).toBeNull();
    expect(hit?.distance).toBeCloseTo(4.5, 6);
  });

  it('misses cleanly when nothing is under the ray', () => {
    const registry = new PickRegistry();
    registry.register(cubeTarget('cube'));
    expect(registry.pick(makeRay(vec3(9, 9, 5), vec3(0, 0, -1)))).toBeNull();
  });

  it('picks the nearest of several targets', () => {
    const registry = new PickRegistry();
    registry.register(cubeTarget('far', vec3(0, 0, -3)));
    registry.register(cubeTarget('near'));

    expect(registry.pick(downZ)?.nodeId).toBe('near');
    expect(registry.pickAll(downZ).map((candidate) => candidate.nodeId)).toEqual(['near', 'far']);
  });

  it('measures distance in world space, so a scaled target does not jump the queue', () => {
    const registry = new PickRegistry();
    // A cube scaled 10× reaches 5m across; in its own local space its near face
    // is still 0.5 away, which is why the distance is measured after the
    // transform rather than before.
    registry.register({
      nodeId: 'huge',
      worldMatrix: trsToMatrix(makeTrs({ scale: vec3(10, 10, 10) })),
      bounds: UNIT_CUBE_BOUNDS,
      geometry: unitCubeGeometry(),
    });

    expect(registry.pick(makeRay(vec3(0, 0, 20), vec3(0, 0, -1)))?.distance).toBeCloseTo(15, 5);
  });

  it('ignores a target with a collapsed world matrix instead of throwing', () => {
    const registry = new PickRegistry();
    registry.register({
      nodeId: 'flat',
      worldMatrix: trsToMatrix(makeTrs({ scale: vec3(1, 0, 1) })),
      bounds: UNIT_CUBE_BOUNDS,
    });
    expect(registry.pick(downZ)).toBeNull();
  });

  it('registers, replaces, unregisters and clears', () => {
    const registry = new PickRegistry();
    registry.register(cubeTarget('cube'));
    registry.register(cubeTarget('cube', vec3(0, 0, -2)));

    expect(registry.size).toBe(1);
    expect(registry.get('cube')?.worldMatrix[14]).toBe(-2);
    expect(registry.unregister('cube')).toBe(true);
    expect(registry.pick(downZ)).toBeNull();

    registry.register(cubeTarget('cube'));
    registry.clear();
    expect(registry.size).toBe(0);
  });

  it('adapts a kernel MeshPayload without copying its buffers', () => {
    const vertices = new Float32Array([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1]);
    const geometry = pickGeometryFromMesh({
      vertices,
      indices: new Uint32Array([0, 1, 2]),
      stride: 6,
      positionOffset: 0,
      normalOffset: 3,
    });

    expect(geometry.positions).toBe(vertices);
    expect(geometry.stride).toBe(6);
  });
});

describe('what a hit resolves to', () => {
  /**
   * The bracket fixture: a `subtract` holding a plate and two holes. The
   * subtract carries the evaluated surface; the holes are registered as bounds,
   * which is the shape the data really arrives in — the kernel emits one mesh
   * for the boolean and per-operand bounds are cheap.
   */
  function bracketRegistry(): {
    registry: PickRegistry;
    ids: ReturnType<typeof bracketDocument>['ids'];
    document: ReturnType<typeof bracketDocument>['document'];
  } {
    const { document, ids } = bracketDocument();
    const registry = new PickRegistry();

    registry.register({
      nodeId: ids.cut,
      worldMatrix: IDENTITY_MATRIX,
      bounds: { min: [-0.1, -0.005, -0.05], max: [0.1, 0.005, 0.05] },
      geometry: unitCubeGeometry(),
    });
    registry.register({
      nodeId: ids.holeA,
      worldMatrix: document.worldMatrix(ids.holeA),
      bounds: { min: [-0.01, -0.025, -0.01], max: [0.01, 0.025, 0.01] },
    });

    return { registry, ids, document };
  }

  it('reports the outermost registered ancestor by default', () => {
    const { registry, ids, document } = bracketRegistry();
    // Straight down the axis of the first hole, from above.
    const ray = makeRay(vec3(-0.06, 5, 0), vec3(0, -1, 0));

    const hit = registry.pick(ray, { tree: document });

    // The boolean's evaluated surface is nearer than the operand's bounds —
    // it is the outside of the part — so the raw hit is the boolean already.
    expect(hit?.nodeId).toBe(ids.cut);
    expect(hit?.resolvedId).toBe(ids.cut);
  });

  it('reports the deepest registered target hit when drilling in', () => {
    const { registry, ids, document } = bracketRegistry();
    const ray = makeRay(vec3(-0.06, 5, 0), vec3(0, -1, 0));

    const hit = registry.pick(ray, { tree: document, drillIn: true });

    expect(hit?.resolvedId).toBe(ids.holeA);
  });

  it('drilling in cannot escape into a different solid behind the one hit', () => {
    const { registry, document } = bracketRegistry();
    // Something unrelated further along the same ray, deeper in nobody's tree.
    registry.register(cubeTarget('unrelated', vec3(-0.06, -4, 0), false));

    const hit = registry.pick(makeRay(vec3(-0.06, 5, 0), vec3(0, -1, 0)), {
      tree: document,
      drillIn: true,
    });

    expect(hit?.resolvedId).not.toBe('unrelated');
  });

  it('reports the raw target when no tree is supplied', () => {
    const { registry, ids } = bracketRegistry();
    const hit = registry.pick(makeRay(vec3(-0.06, 5, 0), vec3(0, -1, 0)));
    expect(hit?.resolvedId).toBe(ids.cut);
  });

  it('tolerates a registration that outlived its node', () => {
    // The renderer draws the last evaluation until a fresh one lands, so a
    // deleted node stays pickable for a frame or two. That must resolve to
    // itself, not throw inside a hover.
    const { registry, document } = bracketRegistry();
    registry.register(cubeTarget('deleted', vec3(0, 0, 3), false));

    const hit = registry.pick(makeRay(vec3(0, 0, 9), vec3(0, 0, -1)), { tree: document });

    expect(hit?.resolvedId).toBe('deleted');
  });

  it('leaves an unregistered ancestor out of it', () => {
    // The document root is a group nobody registered: resolving outwards must
    // stop at the boolean rather than selecting the whole document.
    const { registry, ids, document } = bracketRegistry();
    const hit = registry.pick(makeRay(vec3(-0.06, 5, 0), vec3(0, -1, 0)), { tree: document });
    expect(hit?.resolvedId).not.toBe(ids.root);
  });
});
