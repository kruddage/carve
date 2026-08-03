/**
 * Where each node *is*, so that clicking on it selects it.
 *
 * The renderer draws one evaluated solid for the whole document — see
 * `src/render/scene-graph.ts` — so the triangles under the cursor carry no node
 * identity. `src/input/pick.ts` says what to do about that: whoever owns the
 * evaluated geometry registers a `PickTarget` per node, and "bounds alone are
 * enough to be pickable; triangles make it exact". This module is that
 * registration, and it is the desktop viewport's answer to the question the
 * pick registry is deliberately not allowed to answer for itself.
 *
 * ## Bounds, not triangles, and the reason is the drag loop
 *
 * Exact per-node geometry would mean evaluating every node's own subtree, not
 * just the document root: N kernel requests per edit instead of one, several
 * times a second during a drag, for a hit test that runs once per pointer move.
 * Bounds cost one preview request per *distinct primitive shape* — cached
 * forever after, because the same box parameters always produce the same box —
 * and moving a solid then costs nothing at all, since a transform change
 * re-derives the boxes with matrix arithmetic and touches no worker.
 *
 * What that trades away is honest and worth writing down: clicking through a
 * hole cut by a subtract selects the solid whose bounding box you clicked
 * inside, because the box does not know about the hole. Per-node exact
 * geometry is the fix, and it belongs with #15's budget rather than here, where
 * it would be an unmeasured cost on the frame path.
 *
 * ## The bounds themselves come from the kernel, not from a formula here
 *
 * A box's extent is `width × height × depth`; a torus's is a function of two
 * radii; a cone's depends on which end is wider. That knowledge lives in
 * `src/kernel/solids.ts` and must not be re-derived in a UI file — it is the
 * same drift `test/primitives.test.ts` fails the build over. `PrimitivePreview`
 * already reports `bounds` "before framing, in metres" for exactly this kind of
 * caller, so `PrimitiveBoundsCache` asks the kernel with `fit: 0` and keeps the
 * answer.
 */

import {
  childrenOf,
  parametersKey,
  trsToMatrix,
  IDENTITY_MATRIX,
  type CarveDocument,
  type CarveNode,
  type Mat4,
  type NodeId,
  type PrimitiveKind,
} from '../core/index.js';
import type { PreviewSpec, PrimitivePreview } from '../kernel/index.js';
import { SnapField, transformAabb, type Aabb, type PickTarget } from '../input/index.js';

/** Local-space bounds for one primitive's parameters, or `undefined` if not known yet. */
export type PrimitiveBoundsLookup = (
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
) => Aabb | undefined;

/** What the cache needs from a kernel client. One method, so a test can supply it. */
export type PreviewRequester = (
  spec: PreviewSpec,
  options: { readonly channel: string },
) => Promise<PrimitivePreview | null>;

/**
 * The channel a bounds request goes on.
 *
 * One channel per *shape*, not per primitive kind. `previewChannel(kind)` is
 * right for a palette, where a new thumbnail should displace the old one, and
 * exactly wrong here: two boxes with different parameters would supersede each
 * other and one of them would never get bounds. Keying on `parametersKey` means
 * a shape's request only ever supersedes an identical one, which is a request
 * whose answer we already have.
 */
export function boundsChannel(
  kind: PrimitiveKind,
  params: Readonly<Record<string, number>>,
): string {
  return `bounds:${parametersKey(kind, params)}`;
}

/**
 * Local-space bounds per primitive shape, filled in from the kernel.
 *
 * Asynchronous and deliberately not awaited by its caller: the first frame
 * after a spawn has no bounds for the new shape, so it is not pickable for a
 * few milliseconds, and then it is. Blocking the viewport on a round trip to
 * make the *hit test* correct would be trading a frame for a click nobody has
 * made yet. `onChange` is how the viewport learns to rebuild its registry.
 */
export class PrimitiveBoundsCache {
  readonly #request: PreviewRequester;
  readonly #bounds = new Map<string, Aabb>();
  readonly #pending = new Set<string>();
  readonly #listeners = new Set<() => void>();

  constructor(request: PreviewRequester) {
    this.#request = request;
  }

  get size(): number {
    return this.#bounds.size;
  }

  onChange(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Bounds if known. Otherwise starts a request and returns `undefined`. */
  lookup: PrimitiveBoundsLookup = (kind, params) => {
    const key = parametersKey(kind, params);
    const known = this.#bounds.get(key);
    if (known) return known;
    if (!this.#pending.has(key)) void this.#fetch(kind, params, key);
    return undefined;
  };

  /** Seed a known answer. For tests, and for anything that already has a preview in hand. */
  put(kind: PrimitiveKind, params: Readonly<Record<string, number>>, bounds: Aabb): void {
    this.#bounds.set(parametersKey(kind, params), bounds);
  }

  async #fetch(
    kind: PrimitiveKind,
    params: Readonly<Record<string, number>>,
    key: string,
  ): Promise<void> {
    this.#pending.add(key);
    try {
      // `fit: 0` turns framing off — see `PreviewSpec`. A framed preview is
      // scaled to a thumbnail size, and its bounds would put a 60mm box at
      // whatever size a palette cell wanted.
      const preview = await this.#request(
        { kind, params, fit: 0 },
        { channel: boundsChannel(kind, params) },
      );
      if (!preview) return;
      this.#bounds.set(key, { min: preview.bounds.min, max: preview.bounds.max });
      for (const listener of this.#listeners) listener();
    } catch {
      // A failed preview leaves the shape un-pickable and nothing else. It is
      // not worth a dialog, and rethrowing here would surface as an unhandled
      // rejection from a fire-and-forget call on the frame path.
    } finally {
      this.#pending.delete(key);
    }
  }
}

/**
 * A node's bounds **in its own local frame** — that is, after its own transform
 * but before any ancestor's.
 *
 * That framing is what makes the result usable directly as a `PickTarget`:
 * `CarveDocument.worldMatrix(id)` already includes the node's own transform, so
 * a target is `(worldMatrix(id), localBounds(id))` with no further composition.
 *
 * Returns `null` when nothing underneath has known bounds yet. Not an empty
 * box: an empty box at the origin is a pickable target the size of a point
 * sitting where the user is most likely to click.
 */
export function localBounds(
  document: CarveDocument,
  nodeId: NodeId,
  lookup: PrimitiveBoundsLookup,
): Aabb | null {
  const node = document.get(nodeId);
  if (!node) return null;
  if (node.kind === 'primitive') return lookup(node.primitive, node.params) ?? null;

  let merged: Aabb | null = null;
  for (const childId of childrenOf(node)) {
    const child = document.get(childId);
    if (!child) continue;
    const bounds = localBounds(document, childId, lookup);
    if (!bounds) continue;
    // A child's bounds are in *its* frame; lift them into this node's.
    merged = unionAabb(merged, transformAabb(localMatrixOf(child), bounds));
  }
  return merged;
}

/**
 * A node's own contribution to its parent's coordinate system.
 *
 * Only a transform node has one. Booleans and groups are organizational and
 * place their children exactly where the children place themselves — which is
 * why `placedPrimitive` wraps every spawn in a transform rather than letting a
 * primitive carry a TRS of its own.
 */
export function localMatrixOf(node: CarveNode): Mat4 {
  return node.kind === 'transform' ? trsToMatrix(node.transform) : IDENTITY_MATRIX;
}

/** The union of two boxes, either of which may be absent. */
export function unionAabb(a: Aabb | null, b: Aabb | null): Aabb | null {
  if (!a) return b;
  if (!b) return a;
  return {
    min: [Math.min(a.min[0], b.min[0]), Math.min(a.min[1], b.min[1]), Math.min(a.min[2], b.min[2])],
    max: [Math.max(a.max[0], b.max[0]), Math.max(a.max[1], b.max[1]), Math.max(a.max[2], b.max[2])],
  };
}

export interface SceneTargetOptions {
  /** Nodes whose subtree is hidden. Neither they nor their descendants are pickable. */
  readonly hidden?: ReadonlySet<NodeId>;
}

/**
 * A pick target for every node with known bounds, root excluded.
 *
 * The root's exclusion is load-bearing rather than cosmetic. `PickRegistry`
 * resolves a hit to its **outermost registered ancestor**, so registering the
 * document root would make every click anywhere select the root and nothing
 * else would ever be selectable. Leaving it out makes "outermost" mean "the
 * top-level solid you clicked", which is the policy `pick.ts` describes.
 */
export function buildPickTargets(
  document: CarveDocument,
  lookup: PrimitiveBoundsLookup,
  options: SceneTargetOptions = {},
): readonly PickTarget[] {
  const hidden = options.hidden ?? new Set<NodeId>();
  const targets: PickTarget[] = [];

  const walk = (nodeId: NodeId): void => {
    for (const childId of document.childrenOf(nodeId)) {
      if (hidden.has(childId)) continue;
      const bounds = localBounds(document, childId, lookup);
      if (bounds) {
        targets.push({ nodeId: childId, worldMatrix: document.worldMatrix(childId), bounds });
      }
      walk(childId);
    }
  };

  walk(document.rootId);
  return targets;
}

/**
 * Snap features for every top-level solid.
 *
 * Top-level only, not every node. A boolean's operands sit *inside* the result,
 * so their corners are features you cannot see and mostly cannot want — and
 * with the operands included, dragging one solid near another snaps to the
 * hidden internal geometry of whatever it is approaching, which reads as the
 * drag catching on nothing.
 */
export function buildSnapField(
  document: CarveDocument,
  lookup: PrimitiveBoundsLookup,
  options: SceneTargetOptions = {},
): SnapField {
  const hidden = options.hidden ?? new Set<NodeId>();
  const field = new SnapField();
  for (const nodeId of document.childrenOf(document.rootId)) {
    if (hidden.has(nodeId)) continue;
    const bounds = localBounds(document, nodeId, lookup);
    if (bounds) field.setFromBounds(nodeId, bounds, document.worldMatrix(nodeId));
  }
  return field;
}

/** World-space bounds of a set of nodes — what `CameraControls.frame` takes. */
export function worldBounds(
  document: CarveDocument,
  nodeIds: Iterable<NodeId>,
  lookup: PrimitiveBoundsLookup,
): Aabb | null {
  let merged: Aabb | null = null;
  for (const nodeId of nodeIds) {
    const bounds = localBounds(document, nodeId, lookup);
    if (!bounds) continue;
    merged = unionAabb(merged, transformAabb(document.worldMatrix(nodeId), bounds));
  }
  return merged;
}

/** World-space bounds of the whole document. `null` for an empty one. */
export function documentBounds(
  document: CarveDocument,
  lookup: PrimitiveBoundsLookup,
): Aabb | null {
  return worldBounds(document, document.childrenOf(document.rootId), lookup);
}
