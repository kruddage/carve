/**
 * The node store: the tree itself, plus the invariants that keep it a tree.
 *
 * Nodes live in a flat `Map` keyed by id with a parallel parent index, not as
 * nested objects. Three things fall out of that which the nested version does
 * not give:
 *
 *   - O(1) lookup by id, which every other subsystem needs, because selection,
 *     history and the outliner all address nodes by id and never by path
 *   - re-parenting is two child-list edits, not a subtree rewrite
 *   - "which subtrees are dirty" is a walk *up* the parent index, which is how
 *     the kernel in #6 avoids re-evaluating the whole document per mouse move
 *
 * The store is mutable and deliberately low-level: it validates structure and
 * nothing else. It has no undo, emits no events, and knows nothing about
 * commands. Everything above it — `commands.ts`, `history.ts`, `document.ts` —
 * is built on the guarantee that a store operation either completes and leaves
 * a valid tree, or throws and leaves the tree untouched.
 */

import {
  childrenOf,
  isContainer,
  withChildren,
  type CarveNode,
  type ContainerNode,
  type NodeBundle,
  type NodeId,
} from './nodes.js';

/** Thrown when an operation would break a tree invariant. */
export class DocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentError';
  }
}

export class NodeStore {
  readonly #nodes = new Map<NodeId, CarveNode>();
  readonly #parents = new Map<NodeId, NodeId | null>();
  readonly #rootId: NodeId;

  /**
   * Build a store from a bundle whose root is a container.
   *
   * The root has to be a container: a document whose root is a primitive has
   * nowhere to put the second primitive, and every insert would have to
   * special-case "unless the root is a leaf".
   */
  constructor(bundle: NodeBundle) {
    assertClosedBundle(bundle);
    const root = bundle.nodes.find((node) => node.id === bundle.rootId);
    if (root && !isContainer(root)) {
      throw new DocumentError('The document root must be a container node');
    }

    for (const node of bundle.nodes) this.#nodes.set(node.id, node);

    this.#rootId = bundle.rootId;
    this.#parents.set(bundle.rootId, null);
    this.#indexDescendants(bundle.rootId);
  }

  get rootId(): NodeId {
    return this.#rootId;
  }

  get size(): number {
    return this.#nodes.size;
  }

  has(id: NodeId): boolean {
    return this.#nodes.has(id);
  }

  get(id: NodeId): CarveNode | undefined {
    return this.#nodes.get(id);
  }

  /** Like `get`, but throws rather than handing back `undefined` to be ignored. */
  expect(id: NodeId): CarveNode {
    const node = this.#nodes.get(id);
    if (!node) throw new DocumentError(`No such node: ${id}`);
    return node;
  }

  expectContainer(id: NodeId): ContainerNode {
    const node = this.expect(id);
    if (!isContainer(node)) {
      throw new DocumentError(`Node ${id} is a ${node.kind} and cannot hold children`);
    }
    return node;
  }

  /** `null` for the root. Throws for an unknown id, which is a caller bug. */
  parentOf(id: NodeId): NodeId | null {
    if (!this.#nodes.has(id)) throw new DocumentError(`No such node: ${id}`);
    return this.#parents.get(id) ?? null;
  }

  childrenOf(id: NodeId): readonly NodeId[] {
    return childrenOf(this.expect(id));
  }

  /** Ancestors from the immediate parent up to the root, nearest first. */
  ancestorsOf(id: NodeId): NodeId[] {
    const chain: NodeId[] = [];
    let current = this.parentOf(id);
    while (current !== null) {
      chain.push(current);
      current = this.parentOf(current);
    }
    return chain;
  }

  /** Depth-first descendants of `id`, excluding `id` itself. */
  descendantsOf(id: NodeId): NodeId[] {
    const out: NodeId[] = [];
    const visit = (current: NodeId): void => {
      for (const child of this.childrenOf(current)) {
        out.push(child);
        visit(child);
      }
    };
    visit(id);
    return out;
  }

  /** Depth-first document order, root first. This is the serialization order. */
  order(from: NodeId = this.#rootId): NodeId[] {
    return [from, ...this.descendantsOf(from)];
  }

  /** Position of `id` within its parent's child list; `-1` for the root. */
  indexOf(id: NodeId): number {
    const parent = this.parentOf(id);
    if (parent === null) return -1;
    return this.childrenOf(parent).indexOf(id);
  }

  /** Snapshot a subtree as self-contained data, without removing it. */
  bundle(id: NodeId): NodeBundle {
    return { rootId: id, nodes: this.order(id).map((nodeId) => this.expect(nodeId)) };
  }

  /**
   * Swap one node for a new version of itself.
   *
   * Structure is off limits here — the child list must be identical — because
   * a structural edit has to keep the parent index in step, and that is what
   * `insertBundle`, `removeSubtree` and `moveChild` are for. Letting `replace`
   * quietly change children is how a parent index drifts out of sync with the
   * tree and stays wrong until something much later fails to explain itself.
   */
  replace(node: CarveNode): void {
    const existing = this.expect(node.id);
    if (existing.kind !== node.kind) {
      throw new DocumentError(
        `Cannot change node ${node.id} from ${existing.kind} to ${node.kind} in place`,
      );
    }
    const before = childrenOf(existing);
    const after = childrenOf(node);
    if (before.length !== after.length || before.some((child, index) => child !== after[index])) {
      throw new DocumentError(`replace() may not change the children of ${node.id}`);
    }
    this.#nodes.set(node.id, node);
  }

  /**
   * Insert a detached subtree as a child of `parentId` at `index`.
   *
   * `index` is clamped rather than rejected: an append is the overwhelmingly
   * common case and callers spell it `children.length`, which is off by one the
   * moment anything else inserts first.
   */
  insertBundle(bundle: NodeBundle, parentId: NodeId, index: number): void {
    const parent = this.expectContainer(parentId);

    for (const node of bundle.nodes) {
      if (this.#nodes.has(node.id)) {
        throw new DocumentError(`Node ${node.id} is already in the document`);
      }
    }
    assertClosedBundle(bundle);

    for (const node of bundle.nodes) this.#nodes.set(node.id, node);

    const position = clamp(index, 0, parent.children.length);
    const children = [...parent.children];
    children.splice(position, 0, bundle.rootId);
    this.#nodes.set(parentId, withChildren(parent, children));

    this.#parents.set(bundle.rootId, parentId);
    this.#indexDescendants(bundle.rootId);
  }

  /** Detach a subtree and return it, so a command can put it back on undo. */
  removeSubtree(id: NodeId): NodeBundle {
    if (id === this.#rootId) throw new DocumentError('The document root cannot be removed');
    const parentId = this.parentOf(id);
    if (parentId === null) throw new DocumentError(`Node ${id} has no parent to detach from`);

    const detached = this.bundle(id);
    const parent = this.expectContainer(parentId);
    this.#nodes.set(
      parentId,
      withChildren(
        parent,
        parent.children.filter((child) => child !== id),
      ),
    );

    for (const node of detached.nodes) {
      this.#nodes.delete(node.id);
      this.#parents.delete(node.id);
    }
    return detached;
  }

  /**
   * Move a node to a new parent and/or position, returning where it was.
   *
   * Re-parenting into your own descendant is the one structural mistake a UI
   * makes routinely — drag a group onto a node inside it — and it produces a
   * detached cycle that no traversal ever terminates on. Rejected up front.
   */
  moveChild(
    id: NodeId,
    newParentId: NodeId,
    index: number,
  ): { readonly parentId: NodeId; readonly index: number } {
    if (id === this.#rootId) throw new DocumentError('The document root cannot be moved');
    const previousParentId = this.parentOf(id);
    if (previousParentId === null) throw new DocumentError(`Node ${id} has no parent`);
    const previousIndex = this.indexOf(id);

    if (newParentId === id || this.ancestorsOf(newParentId).includes(id)) {
      throw new DocumentError(`Cannot move ${id} into its own subtree`);
    }
    const newParent = this.expectContainer(newParentId);

    if (previousParentId === newParentId) {
      const children = [...newParent.children];
      children.splice(previousIndex, 1);
      children.splice(clamp(index, 0, children.length), 0, id);
      this.#nodes.set(newParentId, withChildren(newParent, children));
      return { parentId: previousParentId, index: previousIndex };
    }

    const oldParent = this.expectContainer(previousParentId);
    this.#nodes.set(
      previousParentId,
      withChildren(
        oldParent,
        oldParent.children.filter((child) => child !== id),
      ),
    );

    // Re-read: the previous parent may be the new parent's ancestor, and the
    // edit above replaced whatever object we were holding for it.
    const target = this.expectContainer(newParentId);
    const children = [...target.children];
    children.splice(clamp(index, 0, children.length), 0, id);
    this.#nodes.set(newParentId, withChildren(target, children));
    this.#parents.set(id, newParentId);

    return { parentId: previousParentId, index: previousIndex };
  }

  #indexDescendants(id: NodeId): void {
    for (const child of this.childrenOf(id)) {
      if (this.#parents.has(child)) {
        throw new DocumentError(`Node ${child} appears more than once in the tree`);
      }
      this.#parents.set(child, id);
      this.#indexDescendants(child);
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(value), min), max);
}

/**
 * A bundle must be self-contained before any of it is written into the store.
 *
 * Checked up front rather than discovered halfway through the insert: the
 * store's contract is that a failed operation leaves the tree untouched, and a
 * dangling child reference found mid-write would leave half a subtree in the
 * map with no way back.
 */
function assertClosedBundle(bundle: NodeBundle): void {
  const byId = new Map(bundle.nodes.map((node) => [node.id, node] as const));
  if (byId.size !== bundle.nodes.length) {
    throw new DocumentError('Bundle contains duplicate node ids');
  }
  if (!byId.has(bundle.rootId)) {
    throw new DocumentError(`Bundle root ${bundle.rootId} is not present in the bundle`);
  }

  const reached = new Set<NodeId>();
  const visit = (id: NodeId): void => {
    const node = byId.get(id);
    if (!node) throw new DocumentError(`Bundle references a node it does not contain: ${id}`);
    if (reached.has(id)) throw new DocumentError(`Node ${id} appears more than once in the bundle`);
    reached.add(id);
    for (const child of childrenOf(node)) visit(child);
  };
  visit(bundle.rootId);

  if (reached.size !== bundle.nodes.length) {
    const orphans = bundle.nodes.filter((node) => !reached.has(node.id)).map((node) => node.id);
    throw new DocumentError(
      `Bundle contains nodes unreachable from its root: ${orphans.join(', ')}`,
    );
  }
}
