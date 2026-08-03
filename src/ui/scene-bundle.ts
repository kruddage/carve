/**
 * The subtree the viewport actually asks the kernel to evaluate.
 *
 * Normally that is `document.bundle()` verbatim. It differs only when the user
 * has hidden something, and hiding is view state (see `view-state.ts`): the
 * document still contains the node, undo does not restore its visibility, and
 * the saved file does not mention it. What hiding changes is which nodes are in
 * the bundle that goes over the wire.
 *
 * Doing it as a filter on the bundle — rather than as a `visible` flag the
 * kernel honours — keeps the kernel's contract intact. A `NodeBundle` is still
 * "a complete subtree, evaluated in full", the subtree hash still identifies
 * exactly the geometry it produces, and hiding a node hits the cache for the
 * *same* tree without it rather than invalidating a mesh that is still correct.
 * A flag would put a second axis into the cache key for something the kernel
 * has no opinion about.
 */

import {
  childrenOf,
  isContainer,
  withChildren,
  type CarveNode,
  type NodeBundle,
  type NodeId,
} from '../core/index.js';

/**
 * `bundle` with every hidden node — and everything under it — removed.
 *
 * Returns the bundle unchanged when nothing is hidden, so the common path
 * allocates nothing and the kernel sees an identical request, cache key and
 * all. Hiding the bundle's own root yields a bundle with no nodes, which
 * `Evaluator` reports as an empty mesh: the viewport goes blank, which is what
 * hiding everything should look like.
 */
export function visibleBundle(bundle: NodeBundle, hidden: ReadonlySet<NodeId>): NodeBundle {
  if (hidden.size === 0) return bundle;

  const byId = new Map(bundle.nodes.map((node) => [node.id, node]));
  if (hidden.has(bundle.rootId)) return { rootId: bundle.rootId, nodes: [] };

  const kept: CarveNode[] = [];

  const walk = (nodeId: NodeId): void => {
    const node = byId.get(nodeId);
    if (!node) return;
    const survivors = childrenOf(node).filter((childId) => !hidden.has(childId));
    // Rebuild the child list only when it changed: an untouched node keeps its
    // identity, which matters because the kernel's subtree hash is structural
    // and a needlessly rewritten node still hashes the same but costs a copy
    // of every node in the tree on every drag frame.
    kept.push(
      isContainer(node) && survivors.length !== node.children.length
        ? withChildren(node, survivors)
        : node,
    );
    for (const childId of survivors) walk(childId);
  };

  walk(bundle.rootId);
  return { rootId: bundle.rootId, nodes: kept };
}
