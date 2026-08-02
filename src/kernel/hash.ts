/**
 * Subtree hashing: the key the evaluation cache is built on.
 *
 * The requirement from issue #6 is "editing a leaf must re-evaluate only the
 * path from that leaf to the root". That falls out of one property: two
 * subtrees hash the same **iff** they evaluate to the same solid. Get that
 * right and the cache needs no invalidation logic at all — a changed parameter
 * changes that leaf's hash, which changes its ancestors' hashes, which misses
 * the cache exactly along the path to the root, and every sibling subtree hits.
 * There is nothing to mark dirty and therefore nothing to mark dirty wrongly.
 *
 * Both halves of the "iff" are load-bearing and fail differently:
 *
 *   - **Same solid, different hash** is a performance bug. The cache misses on
 *     work it has already done. Annoying, invisible, survivable.
 *   - **Different solid, same hash** is a correctness bug, and the worst kind:
 *     the viewport shows a stale mesh with no error anywhere, and it looks like
 *     a renderer problem.
 *
 * So this file leans hard in one direction. Nothing is rounded, nothing is
 * quantized, and node *identity* is deliberately not part of the hash — two
 * boxes with identical parameters are the same solid and should share a cache
 * entry, because a user who copies a bracket has just doubled their evaluation
 * cost otherwise.
 *
 * ## What is and is not in the hash
 *
 * In: primitive kind and normalized parameters, boolean op, child order, and a
 * transform's full TRS. Out: node ids, node names, and selection state — none
 * of which change the geometry.
 *
 * Parameters go through `normalizeParameters` and `parametersKey` from #25
 * rather than being hashed raw. That is the half of this that has to be right
 * and is easy to get wrong: `{width: 1, height: 1}` and `{height: 1, width: 1}`
 * are the same box, `{width: 1}` with a defaulted height is the same box again,
 * and a raw `JSON.stringify` says all three are different. `parametersKey`
 * sorts and `normalizeParameters` fills in and clamps, so equivalent inputs
 * reduce to one string before they ever reach a hash.
 *
 * ## Group hashes as union
 *
 * A group has no geometric meaning — it is "a union for evaluation purposes"
 * per `nodes.ts` — so it hashes as one. Grouping three primitives and then
 * unioning the same three produces one cache entry rather than two. The
 * outliner still shows them differently; the kernel cannot tell them apart, and
 * should not.
 *
 * ## Strings, not integers
 *
 * The hash is the structural string itself, not a 32-bit digest of it. A digest
 * would be shorter and would introduce collisions — and a collision here is the
 * silent-wrong-mesh failure above, in a system where nothing ever revisits the
 * key to check. Strings are longer than they need to be and cannot collide,
 * which is the correct trade for a cache whose entries are megabytes of mesh.
 */

import {
  isContainer,
  normalizeParameters,
  parametersKey,
  type CarveNode,
  type NodeId,
  type Trs,
} from '../core/index.js';

/** How the evaluator looks a child up. A `NodeBundle`'s nodes, indexed. */
export type NodeLookup = (id: NodeId) => CarveNode | undefined;

/** Index a bundle's flat node list for O(1) lookup during the walk. */
export function nodeLookup(nodes: readonly CarveNode[]): NodeLookup {
  const byId = new Map<NodeId, CarveNode>();
  for (const node of nodes) byId.set(node.id, node);
  return (id) => byId.get(id);
}

/** The marker for a child id that is not in the bundle. See `missing-child`. */
const MISSING = '∅';

/**
 * A structural hash of the subtree rooted at `id`.
 *
 * Recursive rather than iterative because the depth is a user-authored CSG tree
 * — tens of levels at the absolute worst, and #6 caps depth before threading is
 * ever considered. A cycle would blow the stack, but `NodeStore` rejects cycles
 * at insert time, so a cycle reaching here is a store bug and a stack overflow
 * is a fair way to hear about it.
 *
 * `memo` is per-evaluation, keyed by node id. Without it a node's hash is
 * rebuilt once for every ancestor above it, which is quadratic in depth for a
 * result that cannot have changed — the tree is immutable for the duration of a
 * walk. Pass the map the evaluator already holds; do not keep one across edits,
 * since a node id survives a parameter change and its hash must not.
 */
export function subtreeHash(lookup: NodeLookup, id: NodeId, memo?: Map<NodeId, string>): string {
  const remembered = memo?.get(id);
  if (remembered !== undefined) return remembered;

  const hash = computeHash(lookup, id, memo);
  memo?.set(id, hash);
  return hash;
}

function computeHash(lookup: NodeLookup, id: NodeId, memo?: Map<NodeId, string>): string {
  const node = lookup(id);
  if (!node) return MISSING;

  if (node.kind === 'primitive') {
    return parametersKey(node.primitive, normalizeParameters(node.primitive, node.params));
  }

  const children = isContainer(node)
    ? node.children.map((childId) => subtreeHash(lookup, childId, memo))
    : [];
  const inner = children.join(',');

  switch (node.kind) {
    case 'transform':
      return `xf${trsKey(node.transform)}[${inner}]`;
    case 'boolean':
      return `${node.op}[${inner}]`;
    // A group is a union for evaluation purposes, so it hashes as one.
    case 'group':
      return `union[${inner}]`;
  }
}

/**
 * A TRS as a string.
 *
 * Exact values, and `-0` folded to `0` for the same reason `primitives.ts`
 * folds it: the two are the same transform and different strings. No rounding —
 * a translation quantized to, say, micrometres would let a slow drag share a
 * cache entry across several distinct positions, which is a mesh in the wrong
 * place rather than a mesh arriving late.
 */
function trsKey(trs: Trs): string {
  const { translation: t, rotation: r, scale: s } = trs;
  const parts = [t.x, t.y, t.z, r.x, r.y, r.z, r.w, s.x, s.y, s.z];
  return `(${parts.map((value) => (value === 0 ? 0 : value)).join(' ')})`;
}
