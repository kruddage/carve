/**
 * Shared machinery for the kernel tests.
 *
 * Three things live here rather than in each spec: one WASM instance, mesh
 * predicates that check the properties #6 actually promises, and the target
 * tree its performance goal is stated against.
 *
 * ## One module, shared
 *
 * Instantiating `manifold-3d` costs a few hundred milliseconds. Doing it per
 * spec file is tolerable; doing it per test is not, and Vitest gives each file
 * its own module registry anyway, so the memoization in `runtime.ts` is
 * per-file. `sharedManifold()` is that same promise, named, so a spec reads as
 * "get the toolkit" rather than as setup.
 *
 * ## Measuring a mesh rather than comparing it
 *
 * Nothing here compares triangles to a golden file. A boolean's exact
 * triangulation is an implementation detail of `manifold-3d` and changes
 * between its versions without the *solid* changing at all — a golden-mesh test
 * would fail on every upgrade for no reason and would still not catch a wrong
 * shape that happened to have the right triangle count.
 *
 * What is checked instead is what "correct, watertight mesh" means: signed
 * volume from the divergence theorem, the bounding box, genus, and the
 * every-edge-shared-exactly-twice property. Those are the invariants a slicer
 * cares about, they have closed-form expected values for the primitive set, and
 * they are stable across tessellation changes.
 */

import {
  CarveDocument,
  booleanNode,
  groupNode,
  insertBundle,
  insertNode,
  makeTrs,
  spawnPrimitive,
  placedPrimitive,
  vec3,
  type NodeBundle,
  type NodeId,
} from '../../src/core/index.js';
import { loadManifold, type MeshPayload, VERTEX_STRIDE } from '../../src/kernel/index.js';

import { idFactory } from './document-fixture.js';

export function sharedManifold(): ReturnType<typeof loadManifold> {
  return loadManifold();
}

/** A single primitive in a bundle of its own, for the simplest possible tree. */
export function soloBundle(
  primitive: Parameters<typeof spawnPrimitive>[0],
  params: Record<string, number> = {},
): NodeBundle {
  const node = spawnPrimitive(primitive, { params });
  return { rootId: node.id, nodes: [node] };
}

// --- Mesh predicates --------------------------------------------------------

export interface Bounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

export function triangleCount(mesh: MeshPayload): number {
  return mesh.indices.length / 3;
}

export function position(mesh: MeshPayload, vertex: number): [number, number, number] {
  const base = vertex * VERTEX_STRIDE + mesh.positionOffset;
  return [mesh.vertices[base] ?? 0, mesh.vertices[base + 1] ?? 0, mesh.vertices[base + 2] ?? 0];
}

export function normal(mesh: MeshPayload, vertex: number): [number, number, number] {
  const base = vertex * VERTEX_STRIDE + mesh.normalOffset;
  return [mesh.vertices[base] ?? 0, mesh.vertices[base + 1] ?? 0, mesh.vertices[base + 2] ?? 0];
}

export function bounds(mesh: MeshPayload): Bounds {
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  const count = mesh.vertices.length / VERTEX_STRIDE;
  for (let vertex = 0; vertex < count; vertex += 1) {
    const p = position(mesh, vertex);
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis] ?? Infinity, p[axis] ?? 0);
      max[axis] = Math.max(max[axis] ?? -Infinity, p[axis] ?? 0);
    }
  }
  return { min, max };
}

/**
 * Signed volume by the divergence theorem: `Σ v0 · (v1 × v2) / 6`.
 *
 * Independent of `manifold-3d` on purpose — this is the check, and computing it
 * with the same library that produced the mesh would only prove the library
 * agrees with itself. It also carries a sign, so a mesh whose triangles wound
 * up inside-out comes out negative rather than merely wrong-looking, which is
 * the failure a renderer hides and a slicer does not.
 */
export function volume(mesh: MeshPayload): number {
  let total = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const a = position(mesh, mesh.indices[i] ?? 0);
    const b = position(mesh, mesh.indices[i + 1] ?? 0);
    const c = position(mesh, mesh.indices[i + 2] ?? 0);
    total +=
      a[0] * (b[1] * c[2] - b[2] * c[1]) +
      a[1] * (b[2] * c[0] - b[0] * c[2]) +
      a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  return total / 6;
}

/**
 * Whether every edge is shared by exactly two oppositely-wound triangles.
 *
 * This is what "watertight" means to a slicer, and it is the property a mesh
 * boolean is *for* — a naive one leaves cracks along the seam, and a crack is
 * invisible in a render and fatal in a print.
 *
 * Vertices are canonicalized by position before edges are counted. A crease
 * split gives one geometric corner several property vertices with different
 * normals, so matching on index alone would report every sharp edge as a hole.
 * Exact float comparison is right here rather than a tolerance: the split
 * copies the position channels verbatim, so two property vertices at one corner
 * are bit-identical, and a tolerance would start welding genuinely distinct
 * vertices on a finely tessellated sphere.
 */
export function isWatertight(mesh: MeshPayload): boolean {
  return openEdges(mesh).length === 0;
}

/** The unpaired directed edges, as `"a→b"` position keys. Empty when watertight. */
export function openEdges(mesh: MeshPayload): string[] {
  const canonical = new Map<string, number>();
  const weld: number[] = [];
  const vertexCount = mesh.vertices.length / VERTEX_STRIDE;
  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const key = position(mesh, vertex).join(',');
    const existing = canonical.get(key);
    if (existing === undefined) {
      canonical.set(key, vertex);
      weld.push(vertex);
    } else {
      weld.push(existing);
    }
  }

  const directed = new Map<string, number>();
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const tri = [
      weld[mesh.indices[i] ?? 0] ?? 0,
      weld[mesh.indices[i + 1] ?? 0] ?? 0,
      weld[mesh.indices[i + 2] ?? 0] ?? 0,
    ];
    for (let edge = 0; edge < 3; edge += 1) {
      const from = tri[edge] ?? 0;
      const to = tri[(edge + 1) % 3] ?? 0;
      // Degenerate edges (both ends welded to one vertex) have no opposite and
      // are not holes; manifold collapses them, but a future change might not.
      if (from === to) continue;
      const key = `${from}→${to}`;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }

  const unpaired: string[] = [];
  for (const [key, count] of directed) {
    const [from, to] = key.split('→');
    const opposite = directed.get(`${to}→${from}`) ?? 0;
    if (count !== opposite) unpaired.push(key);
  }
  return unpaired;
}

// --- The target tree --------------------------------------------------------

export interface TargetTree {
  readonly document: CarveDocument;
  /** The primitive nodes, in creation order. Edit one to simulate a drag. */
  readonly leaves: readonly NodeId[];
  readonly primitiveCount: number;
  readonly booleanCount: number;
}

/**
 * The tree #6's performance target is stated against: ~20 primitives, ~10
 * boolean operations.
 *
 * Shaped like a real hard-surface part rather than as twenty primitives in a
 * flat list, because the flat version has no depth and therefore nothing for
 * the subtree cache to skip — it would measure boolean throughput and report it
 * as if it measured the thing that matters. Here each of five plates is drilled
 * by two holes and chamfered by a wedge, and the five drilled plates are
 * unioned: editing one hole invalidates that plate's subtract, the union above
 * it, and nothing else.
 *
 * That is the shape the 16ms budget is about — not "how fast is one boolean"
 * but "how much of a twenty-primitive tree does one slider drag actually cost".
 */
export function targetTree(): TargetTree {
  const nextId = idFactory('t');
  const root = groupNode({ id: 'target-root', name: 'Target' });
  const document = CarveDocument.create({ root, historyLimit: 4 });

  const assembly = booleanNode({ id: 'assembly', op: 'union' });
  document.dispatch(insertNode(assembly, root.id));

  const leaves: NodeId[] = [];
  const PLATES = 5;

  for (let plateIndex = 0; plateIndex < PLATES; plateIndex += 1) {
    const drilled = booleanNode({ id: `drilled-${plateIndex}`, op: 'subtract' });
    document.dispatch(insertNode(drilled, assembly.id));

    const y = plateIndex * 0.012;

    // The base plate, then two holes through it, then a wedge cut off one
    // corner: four primitives and one subtract per plate.
    const plate = placedBundle(nextId, 'box', { width: 0.08, height: 0.008, depth: 0.05 }, 0, y, 0);
    document.dispatch(insertBundle(plate, drilled.id));
    leaves.push(primitiveIdOf(plate));

    for (const x of [-0.025, 0.025]) {
      const hole = placedBundle(
        nextId,
        'cylinder',
        { radius: 0.005, height: 0.02, radialSegments: 32 },
        x,
        y,
        0,
      );
      document.dispatch(insertBundle(hole, drilled.id));
      leaves.push(primitiveIdOf(hole));
    }

    const chamfer = placedBundle(
      nextId,
      'wedge',
      { width: 0.02, height: 0.02, depth: 0.06 },
      0.04,
      y,
      0,
    );
    document.dispatch(insertBundle(chamfer, drilled.id));
    leaves.push(primitiveIdOf(chamfer));
  }

  document.clearHistory();

  return {
    document,
    leaves,
    primitiveCount: leaves.length,
    // One subtract per plate, plus the union that assembles them.
    booleanCount: PLATES + 1,
  };
}

function placedBundle(
  nextId: () => string,
  primitive: Parameters<typeof spawnPrimitive>[0],
  params: Record<string, number>,
  x: number,
  y: number,
  z: number,
): NodeBundle {
  return placedPrimitive(
    { ...spawnPrimitive(primitive, { params }), id: nextId() },
    makeTrs({ translation: vec3(x, y, z) }),
    { id: nextId() },
  );
}

function primitiveIdOf(bundle: NodeBundle): NodeId {
  const primitive = bundle.nodes.find((node) => node.kind === 'primitive');
  if (!primitive) throw new Error('fixture: expected a primitive in the bundle');
  return primitive.id;
}
