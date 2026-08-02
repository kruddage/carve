/**
 * Hit testing, and the mapping from "the triangle you hit" to "the node you
 * meant".
 *
 * That mapping is the part of #8 that needs an explicit answer rather than an
 * implementation. The renderer draws **one** evaluated solid per document (see
 * `src/render/scene-graph.ts`): the surface under the cursor is the output of a
 * boolean, and its triangles carry no node identity at all. Something has to
 * decide which node a click on that surface refers to, and if each adapter
 * decides for itself, a pinch and a click on the same face select different
 * things.
 *
 * ## The registry
 *
 * Whoever owns evaluated geometry — #9's viewport, #12's wrist menu — registers
 * a `PickTarget` per node it wants pickable: a world matrix, a local-space
 * bounding box, and optionally the triangles themselves. Bounds alone are
 * enough to be pickable; triangles make it exact. That split is deliberate,
 * because the kernel gives one mesh for the whole tree and per-operand bounds
 * are cheap, so "the boolean is exact, its operands are boxes" is the shape the
 * data actually arrives in.
 *
 * Nothing here reads the document. The registry is told what exists; it does
 * not go looking, which is what keeps a stale evaluation from being pickable
 * after the tree it came from changed.
 *
 * ## The policy, stated once
 *
 * **A pick reports the outermost registered ancestor of whatever was hit.**
 * Click the flat face a `subtract` left behind and you select the subtract, not
 * the cylinder that cut it — the boolean is the thing that behaves like an
 * object, and selecting an operand you cannot see is how a CSG modeler teaches
 * you to distrust it.
 *
 * **With `drillIn`, a pick reports the deepest registered target hit.** That is
 * the modifier: alt-click on desktop, and in the headset a second pinch inside
 * an already-selected solid. It is how you get at the cylinder to edit its
 * radius after the fact, which is the entire premise of a non-destructive tree.
 *
 * Both are pure functions of the registry and the tree, so both are testable
 * with no renderer — see `test/input-pick.test.ts`.
 */

import type { Mat4, NodeId, Vec3 } from '../core/index.js';
import type { MeshPayload } from '../kernel/index.js';

import {
  distance as distanceBetween,
  intersectAabb,
  intersectTriangle,
  invertMatrix,
  transformPoint,
  transformRay,
  type Aabb,
  type Ray,
} from './geometry.js';

/**
 * Triangles to test against, in the target's local space.
 *
 * Interleaved buffers are supported because that is what the kernel emits — a
 * `MeshPayload` is position and normal in one array — and copying positions out
 * into a second buffer just to hit-test them would double the memory of the one
 * thing on this path that is measured in megabytes. Use `pickGeometryFromMesh`
 * rather than assembling the offsets by hand.
 */
export interface PickGeometry {
  readonly positions: ArrayLike<number>;
  /** Triangle list: three vertex indices per triangle. */
  readonly indices: ArrayLike<number>;
  /** Numbers per vertex in `positions`. Defaults to 3 — a bare position buffer. */
  readonly stride?: number;
  /** Index of x within a vertex. Defaults to 0. */
  readonly positionOffset?: number;
}

export interface PickTarget {
  readonly nodeId: NodeId;
  /** Local → world. `CarveDocument.worldMatrix(nodeId)`. */
  readonly worldMatrix: Mat4;
  /** Local-space bounds. Always present: it is the broad phase and the fallback. */
  readonly bounds: Aabb;
  /** Local-space triangles. Without them the target picks as its box. */
  readonly geometry?: PickGeometry;
}

export interface PickCandidate {
  /** The registered target that was hit, before any policy is applied. */
  readonly nodeId: NodeId;
  /** Distance from the ray origin, world metres. */
  readonly distance: number;
  /** World-space hit point. */
  readonly point: Vec3;
  /** World-space surface normal, or `null` when only bounds were tested. */
  readonly normal: Vec3 | null;
  /** True when a triangle was hit; false when this is a bounding-box hit. */
  readonly exact: boolean;
}

export interface PickHit extends PickCandidate {
  /**
   * The node the pick *means*, after the policy above. Intents carry this;
   * `nodeId` is kept alongside so a debug overlay can show what was really hit.
   */
  readonly resolvedId: NodeId;
}

/**
 * The two tree questions the policy asks. `CarveDocument` satisfies it.
 *
 * Narrower than the document on purpose: hit-test resolution must not be able
 * to read parameters, let alone write anything, and a two-method interface is a
 * claim the type system checks.
 *
 * `has` is not redundant. A registration can outlive the node it came from —
 * the renderer keeps drawing the last evaluation until a fresh one lands, so
 * for a frame or two after a delete there is pickable geometry for a node the
 * document no longer holds. Asking `ancestorsOf` about it throws, and a hover
 * that throws takes the frame loop with it.
 */
export interface PickTree {
  has(id: NodeId): boolean;
  /** Ancestors of `id`, nearest parent first. */
  ancestorsOf(id: NodeId): readonly NodeId[];
}

export interface PickOptions {
  /** Report the deepest registered target hit instead of the outermost. */
  readonly drillIn?: boolean;
  /** Required to resolve outwards; without it the raw target is reported. */
  readonly tree?: PickTree;
}

/** Adapt a kernel mesh for hit testing, offsets and all. */
export function pickGeometryFromMesh(mesh: MeshPayload): PickGeometry {
  return {
    positions: mesh.vertices,
    indices: mesh.indices,
    stride: mesh.stride,
    positionOffset: mesh.positionOffset,
  };
}

export class PickRegistry {
  readonly #targets = new Map<NodeId, PickTarget>();

  get size(): number {
    return this.#targets.size;
  }

  /** Add or replace the target for a node. */
  register(target: PickTarget): void {
    this.#targets.set(target.nodeId, target);
  }

  unregister(nodeId: NodeId): boolean {
    return this.#targets.delete(nodeId);
  }

  clear(): void {
    this.#targets.clear();
  }

  has(nodeId: NodeId): boolean {
    return this.#targets.has(nodeId);
  }

  get(nodeId: NodeId): PickTarget | undefined {
    return this.#targets.get(nodeId);
  }

  targets(): readonly PickTarget[] {
    return [...this.#targets.values()];
  }

  /**
   * Every target the ray meets, nearest first.
   *
   * Ties break towards an exact hit: a triangle and a bounding box at the same
   * distance are the same surface described twice, and the box is the
   * approximation.
   */
  pickAll(ray: Ray): readonly PickCandidate[] {
    const candidates: PickCandidate[] = [];
    for (const target of this.#targets.values()) {
      const candidate = intersectTarget(ray, target);
      if (candidate) candidates.push(candidate);
    }
    return candidates.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return Number(b.exact) - Number(a.exact);
    });
  }

  /** The nearest hit, resolved through the policy in this file's header. */
  pick(ray: Ray, options: PickOptions = {}): PickHit | null {
    const candidates = this.pickAll(ray);
    const nearest = candidates[0];
    if (!nearest) return null;

    const tree = options.tree;
    if (!tree) return { ...nearest, resolvedId: nearest.nodeId };

    const resolvedId = options.drillIn
      ? this.#deepestWithin(nearest.nodeId, candidates, tree)
      : this.#outermostRegistered(nearest.nodeId, tree);

    return { ...nearest, resolvedId };
  }

  /**
   * The registered ancestor closest to the root, or the node itself.
   *
   * "Registered" is the filter that matters: an unregistered group in the
   * middle of the tree is organizational and must not swallow the selection,
   * while a registered boolean above the hit is exactly what the user sees as
   * one object.
   */
  #outermostRegistered(nodeId: NodeId, tree: PickTree): NodeId {
    if (!tree.has(nodeId)) return nodeId;
    let outermost = nodeId;
    for (const ancestorId of tree.ancestorsOf(nodeId)) {
      if (this.#targets.has(ancestorId)) outermost = ancestorId;
    }
    return outermost;
  }

  /**
   * The deepest hit target inside the winner, by ancestor count.
   *
   * Restricted to descendants of the nearest hit so that drilling in cannot
   * jump to a different solid behind the one under the cursor — the modifier
   * changes *how deep* the pick goes, never *what* it went into. Ties at equal
   * depth fall back to nearest, which is the order `candidates` already has.
   */
  #deepestWithin(nodeId: NodeId, candidates: readonly PickCandidate[], tree: PickTree): NodeId {
    if (!tree.has(nodeId)) return nodeId;
    let best = nodeId;
    let bestDepth = tree.ancestorsOf(nodeId).length;
    for (const candidate of candidates) {
      if (candidate.nodeId === nodeId || !tree.has(candidate.nodeId)) continue;
      const ancestors = tree.ancestorsOf(candidate.nodeId);
      if (!ancestors.includes(nodeId)) continue;
      if (ancestors.length > bestDepth) {
        best = candidate.nodeId;
        bestDepth = ancestors.length;
      }
    }
    return best;
  }
}

/**
 * One target against one ray, in the target's local space.
 *
 * The ray is moved into local space rather than the geometry into world space:
 * a mesh is tens of thousands of vertices and a ray is two, and doing it the
 * other way would allocate a transformed copy of the whole solid on every
 * pointer move. Distance is measured back in **world** space afterwards,
 * because a scaled node compresses local distances and the caller is comparing
 * this number against other targets' with other scales.
 */
function intersectTarget(ray: Ray, target: PickTarget): PickCandidate | null {
  const toLocal = invertMatrix(target.worldMatrix);
  // A singular world matrix means a zero scale somewhere above: the node
  // occupies no space, so nothing can point at it.
  if (!toLocal) return null;

  const localRay = transformRay(toLocal, ray);
  const boundsDistance = intersectAabb(localRay, target.bounds);
  if (boundsDistance === null) return null;

  if (!target.geometry) {
    const localPoint = pointAlong(localRay, boundsDistance);
    const point = transformPoint(target.worldMatrix, localPoint);
    return {
      nodeId: target.nodeId,
      distance: distanceBetween(point, ray.origin),
      point,
      normal: null,
      exact: false,
    };
  }

  const hit = nearestTriangle(localRay, target.geometry);
  if (!hit) return null;

  const point = transformPoint(target.worldMatrix, hit.point);
  return {
    nodeId: target.nodeId,
    distance: distanceBetween(point, ray.origin),
    point,
    // Normals are transformed as directions by the world matrix, which is only
    // correct for uniform scale. Non-uniform scale needs the inverse transpose;
    // it is not worth carrying here, because the one consumer — the drag plane
    // an adapter builds at the hit — re-derives its own basis anyway.
    normal: normalToWorld(target.worldMatrix, hit.normal),
    exact: true,
  };
}

function pointAlong(ray: Ray, along: number): Vec3 {
  return {
    x: ray.origin.x + ray.direction.x * along,
    y: ray.origin.y + ray.direction.y * along,
    z: ray.origin.z + ray.direction.z * along,
  };
}

function normalToWorld(worldMatrix: Mat4, normal: Vec3): Vec3 {
  const at = (index: number): number => worldMatrix[index] ?? 0;
  const x = at(0) * normal.x + at(4) * normal.y + at(8) * normal.z;
  const y = at(1) * normal.x + at(5) * normal.y + at(9) * normal.z;
  const z = at(2) * normal.x + at(6) * normal.y + at(10) * normal.z;
  const length = Math.sqrt(x * x + y * y + z * z);
  if (length === 0) return normal;
  return { x: x / length, y: y / length, z: z / length };
}

interface LocalTriangleHit {
  readonly point: Vec3;
  readonly normal: Vec3;
}

/**
 * Brute force over every triangle, nearest wins.
 *
 * No BVH, and that is a measured-later decision rather than an oversight: the
 * bounding-box test above rejects whole targets first, a pointer produces at
 * most one ray per frame, and #15 owns the budget that would say this is too
 * slow. Building an acceleration structure now would mean invalidating it on
 * every kernel result — during a drag, that is several times a second — for a
 * cost nobody has measured.
 */
function nearestTriangle(ray: Ray, geometry: PickGeometry): LocalTriangleHit | null {
  const stride = geometry.stride ?? 3;
  const offset = geometry.positionOffset ?? 0;
  const { positions, indices } = geometry;

  let bestDistance = Number.POSITIVE_INFINITY;
  let best: LocalTriangleHit | null = null;

  for (let triangle = 0; triangle + 2 < indices.length; triangle += 3) {
    const a = vertexAt(positions, indices[triangle] ?? 0, stride, offset);
    const b = vertexAt(positions, indices[triangle + 1] ?? 0, stride, offset);
    const c = vertexAt(positions, indices[triangle + 2] ?? 0, stride, offset);
    const hit = intersectTriangle(ray, a, b, c);
    if (!hit || hit.distance >= bestDistance) continue;
    bestDistance = hit.distance;
    best = { point: pointAlong(ray, hit.distance), normal: hit.normal };
  }

  return best;
}

function vertexAt(
  positions: ArrayLike<number>,
  index: number,
  stride: number,
  offset: number,
): Vec3 {
  const base = index * stride + offset;
  return {
    x: positions[base] ?? 0,
    y: positions[base + 1] ?? 0,
    z: positions[base + 2] ?? 0,
  };
}
