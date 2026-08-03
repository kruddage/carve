/**
 * The CSG tree, as rows.
 *
 * The outliner is the only place the *structure* of a document is visible —
 * the viewport draws one evaluated solid and cannot show you that the flat face
 * you are looking at is a subtract of two cylinders. So this module answers two
 * questions and both of them are pure functions of the document plus view
 * state: **what rows are there**, and **where may this row be dropped**.
 *
 * Neither one touches the DOM, which is what lets `test/ui-outliner.test.ts`
 * assert reparenting and operand reordering — two of #9's done-whens — without
 * a browser. `outliner.ts` is the thin part that turns these rows into
 * elements.
 *
 * ## Operand order is shown, not implied
 *
 * `subtract` cuts every later operand out of the first one. That is a modelling
 * fact with no visual tell: two identical-looking rows under a subtract produce
 * completely different solids depending on which is first. So a boolean's
 * children carry an explicit `operandRole` — `base` for the first, `tool` for
 * the rest — and the row renders it. #9 calls this out ("order matters for
 * subtract, so make it visible") and it is the single most common way a CSG
 * outliner is unusable.
 *
 * ## Drops are planned, then dispatched
 *
 * `planDrop` returns either a `MoveNodeCommand`'s arguments or a refusal with a
 * reason. It never mutates. Dragging over a row happens dozens of times a
 * second and most of those positions are illegal — into your own subtree, onto
 * yourself, onto a primitive that cannot hold children — and the drag feedback
 * needs to know that *before* the drop, so the cursor can say no rather than
 * the document throwing on release.
 */

import {
  childrenOf,
  getPrimitive,
  isContainer,
  moveNode,
  type CarveDocument,
  type CarveNode,
  type Command,
  type NodeId,
} from '../core/index.js';

import type { ViewState } from './view-state.js';

/** The first operand of a boolean is its base; the rest cut into it. */
export type OperandRole = 'base' | 'tool';

export interface OutlinerRow {
  readonly nodeId: NodeId;
  /** 0 for the root's own children — the root itself is not a row. See `buildRows`. */
  readonly depth: number;
  readonly kind: CarveNode['kind'];
  readonly name: string;
  /**
   * The short type tag next to the name: `subtract`, `Box`, `group`. Read from
   * the registry for primitives rather than from the kind string, so a palette
   * label and an outliner label cannot disagree.
   */
  readonly badge: string;
  readonly hasChildren: boolean;
  readonly collapsed: boolean;
  readonly selected: boolean;
  /** True when this node or any ancestor is hidden — a hidden subtree reads as hidden throughout. */
  readonly hidden: boolean;
  /** True only when this node itself carries the hidden flag; the eye toggle acts on it. */
  readonly hiddenSelf: boolean;
  /** Set only for a child of a boolean. */
  readonly operandRole: OperandRole | null;
  /** Position within the parent's child list. */
  readonly index: number;
  readonly parentId: NodeId | null;
}

/**
 * Depth-first rows for the whole document, minus the root.
 *
 * The root is omitted deliberately. It is a group that always exists, can never
 * be deleted, moved, hidden or renamed, and showing it costs one indent level
 * on every row for a line nobody can act on. Dropping "outside everything" is
 * still expressible — see `planDrop`'s `'root'` position — so nothing is lost.
 */
export function buildRows(document: CarveDocument, view: ViewState): readonly OutlinerRow[] {
  const rows: OutlinerRow[] = [];

  const walk = (parentId: NodeId, depth: number, hiddenAbove: boolean): void => {
    const parent = document.get(parentId);
    if (!parent) return;
    const isBoolean = parent.kind === 'boolean';

    childrenOf(parent).forEach((nodeId, index) => {
      const node = document.get(nodeId);
      if (!node) return;
      const hiddenSelf = view.isHidden(nodeId);
      const hidden = hiddenAbove || hiddenSelf;
      const children = childrenOf(node);
      const collapsed = view.isCollapsed(nodeId);

      rows.push({
        nodeId,
        depth,
        kind: node.kind,
        name: node.name,
        badge: badgeFor(node),
        hasChildren: children.length > 0,
        collapsed,
        selected: document.isSelected(nodeId),
        hidden,
        hiddenSelf,
        operandRole: isBoolean ? (index === 0 ? 'base' : 'tool') : null,
        index,
        parentId,
      });

      if (children.length > 0 && !collapsed) walk(nodeId, depth + 1, hidden);
    });
  };

  walk(document.rootId, 0, false);
  return rows;
}

/**
 * The type tag shown beside a row's name.
 *
 * Primitives read their label out of the registry (#25) rather than
 * capitalizing `node.primitive`, so the outliner cannot drift from the palette
 * and a renamed primitive updates in both at once.
 */
export function badgeFor(node: CarveNode): string {
  switch (node.kind) {
    case 'primitive':
      return getPrimitive(node.primitive).label;
    case 'boolean':
      return node.op;
    case 'transform':
      return 'transform';
    case 'group':
      return 'group';
  }
}

/** Where a drop landed relative to the row under the cursor. */
export type DropPosition =
  /** Become the previous sibling of the target. */
  | 'before'
  /** Become the next sibling of the target. */
  | 'after'
  /** Become the target's last child. Only legal for containers. */
  | 'inside'
  /** Dropped past the last row: become the document root's last child. */
  | 'root';

export const DROP_REFUSALS = [
  'same-node',
  'into-own-subtree',
  'not-a-container',
  'no-parent',
  'unknown-node',
  'no-change',
] as const;
export type DropRefusal = (typeof DROP_REFUSALS)[number];

export type DropPlan =
  | { readonly ok: true; readonly parentId: NodeId; readonly index: number; readonly label: string }
  | { readonly ok: false; readonly reason: DropRefusal };

/**
 * Whether `draggedId` may land at `position` relative to `targetId`, and where
 * that puts it.
 *
 * ## The index, and why it is computed the way it is
 *
 * `NodeStore.moveChild` removes the node before inserting it, so within one
 * parent an index is measured against the list *without* the dragged node. A
 * plan that ignored that is off by one for every downward move inside a
 * parent — the classic reorder bug, and one that looks like "the last item
 * won't move" rather than like an index error. `adjustForRemoval` below is that
 * correction, applied only when the parent does not change.
 */
export function planDrop(
  document: CarveDocument,
  draggedId: NodeId,
  targetId: NodeId,
  position: DropPosition,
): DropPlan {
  if (!document.has(draggedId)) return { ok: false, reason: 'unknown-node' };
  if (draggedId === document.rootId) return { ok: false, reason: 'no-parent' };

  if (position === 'root') {
    return plan(document, draggedId, document.rootId, document.childrenOf(document.rootId).length);
  }

  if (!document.has(targetId)) return { ok: false, reason: 'unknown-node' };
  if (targetId === draggedId) return { ok: false, reason: 'same-node' };
  // The dragged node's own descendants are the one structurally impossible
  // destination: the store throws on it, and a tree that briefly contains a
  // cycle has no root to walk from.
  if (document.ancestorsOf(targetId).includes(draggedId)) {
    return { ok: false, reason: 'into-own-subtree' };
  }

  if (position === 'inside') {
    const target = document.get(targetId);
    if (!target || !isContainer(target)) return { ok: false, reason: 'not-a-container' };
    return plan(document, draggedId, targetId, childrenOf(target).length);
  }

  const parentId = document.parentOf(targetId);
  if (parentId === null) return { ok: false, reason: 'no-parent' };
  const targetIndex = document.indexOf(targetId);
  return plan(document, draggedId, parentId, position === 'before' ? targetIndex : targetIndex + 1);
}

function plan(
  document: CarveDocument,
  draggedId: NodeId,
  parentId: NodeId,
  rawIndex: number,
): DropPlan {
  const currentParentId = document.parentOf(draggedId);
  if (currentParentId === null) return { ok: false, reason: 'no-parent' };

  const sameParent = currentParentId === parentId;
  const index = sameParent
    ? adjustForRemoval(rawIndex, document.indexOf(draggedId))
    : Math.max(0, rawIndex);

  if (sameParent && index === document.indexOf(draggedId)) {
    return { ok: false, reason: 'no-change' };
  }

  const parent = document.get(parentId);
  const label =
    parent?.kind === 'boolean' && index === 0 ? 'Make base operand' : 'Reparent in the tree';
  return { ok: true, parentId, index, label };
}

/** See `planDrop`: an index inside one parent is measured after the node is lifted out. */
function adjustForRemoval(rawIndex: number, currentIndex: number): number {
  return Math.max(0, rawIndex > currentIndex ? rawIndex - 1 : rawIndex);
}

/**
 * The command a successful plan turns into.
 *
 * Separate from `planDrop` so that drag feedback can evaluate a plan on every
 * pointer move without building a command it will throw away, and so the drop
 * handler has nothing left to decide.
 */
export function dropCommand(plan: DropPlan, draggedId: NodeId): Command | null {
  return plan.ok ? moveNode(draggedId, plan.parentId, plan.index) : null;
}

/**
 * The nodes a "select all" should select: the root's own children.
 *
 * Not every node in the tree. Selecting a boolean *and* its operands means a
 * subsequent delete removes the boolean and then tries to remove children that
 * went with it — the router already guards that case, but a select-all whose
 * result the next command has to filter is a select-all that means something
 * else. Top-level solids are what a user means by "everything".
 */
export function topLevelIds(document: CarveDocument): readonly NodeId[] {
  return document.childrenOf(document.rootId);
}
