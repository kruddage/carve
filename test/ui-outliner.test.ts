/**
 * The outliner's model: rows, operand order, and drops.
 *
 * Two of issue #9's done-whens live in this file — "outliner reparenting and
 * operand reordering work and are undoable", and "every mutation is undoable" —
 * and both are asserted against a real `CarveDocument` with no browser
 * involved. The drop planner is a pure function precisely so that this is
 * possible; a drag-and-drop implementation that could only be checked by hand
 * in three browsers is one that quietly stops working in the third.
 *
 * The reorder-index case is the one worth reading. `NodeStore.moveChild`
 * removes before it inserts, so an index within one parent is measured against
 * the list *without* the node being moved. Getting that wrong presents as "the
 * last row will not move", which looks like a drag-and-drop bug rather than an
 * off-by-one — so it is tested directly.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  IDENTITY_TRS,
  booleanNode,
  groupNode,
  insertBundle,
  insertNode,
  makeTrs,
  placedPrimitive,
  spawnPrimitive,
  vec3,
  type NodeId,
} from '../src/core/index.js';
import {
  ViewState,
  badgeFor,
  buildRows,
  dropCommand,
  planDrop,
  topLevelIds,
} from '../src/ui/index.js';

/** A document with three placed boxes at the top level, named A/B/C. */
function threeSolids(): { document: CarveDocument; ids: NodeId[] } {
  const document = CarveDocument.create();
  const ids = ['A', 'B', 'C'].map((name, index) => {
    const bundle = placedPrimitive(
      spawnPrimitive('box', { name }),
      makeTrs({ translation: vec3(index * 0.1, 0, 0) }),
      { name },
    );
    document.dispatch(insertBundle(bundle, document.rootId));
    return bundle.rootId;
  });
  return { document, ids };
}

describe('rows', () => {
  it('omits the root and reports depth from the root’s children', () => {
    const { document, ids } = threeSolids();
    const rows = buildRows(document, new ViewState());

    // Three transforms at depth 0, each with its primitive at depth 1.
    expect(rows.filter((row) => row.depth === 0).map((row) => row.nodeId)).toEqual(ids);
    expect(rows.some((row) => row.nodeId === document.rootId)).toBe(false);
    expect(rows.filter((row) => row.depth === 1)).toHaveLength(3);
  });

  it('hides the children of a collapsed row', () => {
    const { document, ids } = threeSolids();
    const view = new ViewState();
    const first = ids[0];
    expect(first).toBeDefined();
    if (!first) return;

    view.setCollapsed(first, true);
    const rows = buildRows(document, view);
    expect(rows.filter((row) => row.depth === 1)).toHaveLength(2);
    expect(rows.find((row) => row.nodeId === first)?.collapsed).toBe(true);
  });

  it('propagates hidden down the subtree but marks only the node that carries it', () => {
    const { document, ids } = threeSolids();
    const view = new ViewState();
    const first = ids[0];
    if (!first) return;
    view.setHidden(first, true);

    const rows = buildRows(document, view);
    const parent = rows.find((row) => row.nodeId === first);
    const child = rows.find((row) => row.parentId === first);
    expect(parent?.hiddenSelf).toBe(true);
    expect(child?.hidden).toBe(true);
    expect(child?.hiddenSelf).toBe(false);
  });

  it('marks the first operand of a boolean as the base and the rest as tools', () => {
    const document = CarveDocument.create();
    const op = booleanNode({ op: 'subtract' });
    document.dispatch(insertNode(op, document.rootId));
    const operands = ['Base', 'Cutter', 'Cutter 2'].map((name) => {
      const bundle = placedPrimitive(spawnPrimitive('box', { name }), IDENTITY_TRS, { name });
      document.dispatch(insertBundle(bundle, op.id));
      return bundle.rootId;
    });

    const rows = buildRows(document, new ViewState()).filter((row) => row.parentId === op.id);
    expect(rows.map((row) => row.operandRole)).toEqual(['base', 'tool', 'tool']);
    expect(rows.map((row) => row.nodeId)).toEqual(operands);
  });

  it('takes a primitive’s badge from the registry rather than from its kind string', () => {
    const box = spawnPrimitive('box');
    expect(badgeFor(box)).toBe('Box');
    expect(badgeFor(booleanNode({ op: 'intersect' }))).toBe('intersect');
    expect(badgeFor(groupNode({ name: 'g' }))).toBe('group');
  });
});

describe('planning a drop', () => {
  it('refuses a node onto itself', () => {
    const { document, ids } = threeSolids();
    const first = ids[0];
    if (!first) return;
    expect(planDrop(document, first, first, 'before')).toEqual({
      ok: false,
      reason: 'same-node',
    });
  });

  it('refuses a node into its own subtree, which would make a cycle', () => {
    const { document, ids } = threeSolids();
    const parent = ids[0];
    if (!parent) return;
    const child = document.childrenOf(parent)[0];
    expect(child).toBeDefined();
    if (!child) return;

    expect(planDrop(document, parent, child, 'inside')).toEqual({
      ok: false,
      reason: 'into-own-subtree',
    });
  });

  it('refuses "inside" a primitive, which cannot hold children', () => {
    const { document, ids } = threeSolids();
    const [first, second] = ids;
    if (!first || !second) return;
    const primitive = document.childrenOf(second)[0];
    if (!primitive) return;

    expect(planDrop(document, first, primitive, 'inside')).toEqual({
      ok: false,
      reason: 'not-a-container',
    });
  });

  it('refuses a drop that would change nothing', () => {
    const { document, ids } = threeSolids();
    const [first, second] = ids;
    if (!first || !second) return;
    // A is already immediately before B, so "before B" is where it is.
    expect(planDrop(document, first, second, 'before')).toEqual({ ok: false, reason: 'no-change' });
  });
});

describe('reordering within one parent', () => {
  it('moves a node down to the end, accounting for its own removal', () => {
    const { document, ids } = threeSolids();
    const [first, , third] = ids;
    if (!first || !third) return;

    // A after C. Raw index is 3; with A lifted out first, the target is 2.
    const plan = planDrop(document, first, third, 'after');
    expect(plan.ok && plan.index).toBe(2);

    const command = dropCommand(plan, first);
    expect(command).not.toBeNull();
    if (!command) return;
    document.dispatch(command);

    expect(document.childrenOf(document.rootId)).toEqual([ids[1], ids[2], ids[0]]);
  });

  it('moves a node up without adjusting, since removal is below the target', () => {
    const { document, ids } = threeSolids();
    const [first, , third] = ids;
    if (!first || !third) return;

    const plan = planDrop(document, third, first, 'before');
    expect(plan.ok && plan.index).toBe(0);

    const command = dropCommand(plan, third);
    if (!command) return;
    document.dispatch(command);
    expect(document.childrenOf(document.rootId)).toEqual([ids[2], ids[0], ids[1]]);
  });

  it('is undoable as a single entry', () => {
    const { document, ids } = threeSolids();
    const before = [...document.childrenOf(document.rootId)];
    const [first, , third] = ids;
    if (!first || !third) return;

    const depth = document.undoDepth;
    const command = dropCommand(planDrop(document, first, third, 'after'), first);
    if (!command) return;
    document.dispatch(command);

    expect(document.undoDepth).toBe(depth + 1);
    document.undo();
    expect(document.childrenOf(document.rootId)).toEqual(before);
  });
});

describe('reparenting', () => {
  it('moves a solid into a boolean and makes it an operand', () => {
    const { document, ids } = threeSolids();
    const [first, second, third] = ids;
    if (!first || !second || !third) return;

    const op = booleanNode({ op: 'subtract' });
    document.dispatch(insertNode(op, document.rootId));

    for (const nodeId of [first, second]) {
      const command = dropCommand(planDrop(document, nodeId, op.id, 'inside'), nodeId);
      expect(command).not.toBeNull();
      if (command) document.dispatch(command);
    }

    expect(document.childrenOf(op.id)).toEqual([first, second]);
    expect(document.childrenOf(document.rootId)).toEqual([third, op.id]);
  });

  it('promotes an operand to base by dropping it before the current base', () => {
    const { document, ids } = threeSolids();
    const [first, second] = ids;
    if (!first || !second) return;

    const op = booleanNode({ op: 'subtract' });
    document.dispatch(insertNode(op, document.rootId));
    for (const nodeId of [first, second]) {
      const command = dropCommand(planDrop(document, nodeId, op.id, 'inside'), nodeId);
      if (command) document.dispatch(command);
    }
    expect(document.childrenOf(op.id)).toEqual([first, second]);

    const promote = planDrop(document, second, first, 'before');
    expect(promote.ok && promote.label).toBe('Make base operand');
    const command = dropCommand(promote, second);
    if (!command) return;
    document.dispatch(command);

    expect(document.childrenOf(op.id)).toEqual([second, first]);
    expect(
      buildRows(document, new ViewState()).find((row) => row.nodeId === second)?.operandRole,
    ).toBe('base');

    // …and it comes back.
    document.undo();
    expect(document.childrenOf(op.id)).toEqual([first, second]);
  });

  it('lifts a node back to the top level through the root drop zone', () => {
    const { document, ids } = threeSolids();
    const [first, second] = ids;
    if (!first || !second) return;

    const op = booleanNode({ op: 'union' });
    document.dispatch(insertNode(op, document.rootId));
    for (const nodeId of [first, second]) {
      const command = dropCommand(planDrop(document, nodeId, op.id, 'inside'), nodeId);
      if (command) document.dispatch(command);
    }

    const out = dropCommand(planDrop(document, first, document.rootId, 'root'), first);
    expect(out).not.toBeNull();
    if (!out) return;
    document.dispatch(out);

    expect(document.childrenOf(op.id)).toEqual([second]);
    expect(document.childrenOf(document.rootId).includes(first)).toBe(true);
  });
});

describe('select all', () => {
  it('is the root’s own children, not every node in the tree', () => {
    const { document, ids } = threeSolids();
    expect(topLevelIds(document)).toEqual(ids);
    expect(document.size).toBeGreaterThan(ids.length + 1);
  });
});
