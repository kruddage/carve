/**
 * The tree itself: structure, invariants, and what a change notification says.
 *
 * These are the assertions the rest of the project leans on without checking.
 * The kernel in #6 assumes an invalidation set is complete (or it renders stale
 * geometry) and minimal (or it re-evaluates the document per frame); the
 * outliner in #9 assumes operand order is preserved; every input adapter
 * assumes a failed edit left nothing behind.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  CarveDocument,
  DocumentError,
  booleanNode,
  groupNode,
  insertBundle,
  insertNode,
  makeBooleanCommand,
  makeTrs,
  moveNode,
  primitiveNode,
  removeNode,
  renameNode,
  setBooleanOp,
  setParameters,
  setTransform,
  transformNode,
  vec3,
  type DocumentChange,
} from '../src/core/index.js';

import { bracketDocument, idFactory, placed } from './support/document-fixture.js';

describe('tree structure', () => {
  it('builds a nested document and reports parents, children and order', () => {
    const { document, ids } = bracketDocument();

    expect(document.rootId).toBe(ids.root);
    expect(document.childrenOf(ids.root)).toEqual([ids.cut]);
    expect(document.childrenOf(ids.cut)).toEqual([ids.plate, ids.holeA, ids.holeB]);
    expect(document.parentOf(ids.plate)).toBe(ids.cut);
    expect(document.parentOf(ids.root)).toBeNull();
    expect(document.ancestorsOf(ids.platePrimitive)).toEqual([ids.plate, ids.cut, ids.root]);
    expect(document.order()[0]).toBe(ids.root);
    expect(document.size).toBe(document.order().length);
  });

  it('keeps boolean operands ordered, because subtract is not commutative', () => {
    const { document, ids } = bracketDocument();

    document.dispatch(moveNode(ids.holeB, ids.cut, 0));

    expect(document.childrenOf(ids.cut)).toEqual([ids.holeB, ids.plate, ids.holeA]);
  });

  it('refuses to move a node into its own subtree', () => {
    const { document, ids } = bracketDocument();

    expect(() => document.dispatch(moveNode(ids.cut, ids.plate, 0))).toThrow(DocumentError);
    // …and the tree is exactly as it was.
    expect(document.childrenOf(ids.root)).toEqual([ids.cut]);
    expect(document.parentOf(ids.plate)).toBe(ids.cut);
  });

  it('refuses to remove or move the root', () => {
    const { document, ids } = bracketDocument();

    expect(() => document.dispatch(removeNode(ids.root))).toThrow(DocumentError);
    expect(() => document.dispatch(moveNode(ids.root, ids.cut, 0))).toThrow(DocumentError);
  });

  it('refuses to give a primitive children', () => {
    const { document, ids } = bracketDocument();
    const nextId = idFactory('extra');

    expect(() =>
      document.dispatch(insertBundle(placed(nextId, 'sphere', { radius: 1 }), ids.platePrimitive)),
    ).toThrow(DocumentError);
  });

  it('deletes a subtree whole and restores it whole', () => {
    const { document, ids } = bracketDocument();
    const before = document.size;

    document.dispatch(removeNode(ids.plate));

    expect(document.has(ids.plate)).toBe(false);
    expect(document.has(ids.platePrimitive)).toBe(false);
    expect(document.size).toBe(before - 2);

    document.undo();

    expect(document.childrenOf(ids.cut)).toEqual([ids.plate, ids.holeA, ids.holeB]);
    expect(document.expect(ids.platePrimitive).kind).toBe('primitive');
    expect(document.size).toBe(before);
  });

  it('wraps a selection in a new boolean with the first operand as the base', () => {
    const nextId = idFactory();
    const root = groupNode({ id: 'root' });
    const document = CarveDocument.create({ root });
    const a = placed(nextId, 'box', { width: 1 });
    const b = placed(nextId, 'cylinder', { radius: 1 });
    document.dispatch(insertBundle(a, root.id));
    document.dispatch(insertBundle(b, root.id));

    const cut = booleanNode({ id: 'cut', op: 'subtract' });
    const depthBefore = document.undoDepth;
    document.dispatch(makeBooleanCommand(document, cut, [a.rootId, b.rootId]));

    expect(document.childrenOf(root.id)).toEqual([cut.id]);
    expect(document.childrenOf(cut.id)).toEqual([a.rootId, b.rootId]);

    // One user action, one undo entry, even though it was three edits: insert
    // the boolean, then move both operands into it.
    expect(document.undoDepth).toBe(depthBefore + 1);
    document.undo();
    expect(document.childrenOf(root.id)).toEqual([a.rootId, b.rootId]);
    expect(document.has(cut.id)).toBe(false);
  });
});

describe('change notification', () => {
  it('invalidates the changed node and every ancestor, deepest first', () => {
    const { document, ids } = bracketDocument();
    const changes: DocumentChange[] = [];
    document.subscribe((change) => changes.push(change));

    document.dispatch(setParameters(ids.platePrimitive, { width: 0.3 }));

    expect(changes).toHaveLength(1);
    const change = changes[0];
    expect(change?.changed).toEqual([ids.platePrimitive]);
    // The subtract above it is stale even though nothing wrote to it.
    expect(change?.invalidated).toEqual([ids.platePrimitive, ids.plate, ids.cut, ids.root]);
    expect(change?.source).toBe('command');
    expect(change?.gestureId).toBeNull();
  });

  it('does not invalidate siblings', () => {
    const { document, ids } = bracketDocument();
    const seen: DocumentChange[] = [];
    document.subscribe((change) => seen.push(change));

    document.dispatch(setTransform(ids.holeA, makeTrs({ translation: vec3(1, 0, 0) })));

    expect(seen[0]?.invalidated).not.toContain(ids.holeB);
    expect(seen[0]?.invalidated).not.toContain(ids.plate);
  });

  it('reports a deleted node in changed so caches can evict it', () => {
    const { document, ids } = bracketDocument();
    const seen: DocumentChange[] = [];
    document.subscribe((change) => seen.push(change));

    document.dispatch(removeNode(ids.holeA));

    expect(seen[0]?.changed).toContain(ids.cut);
    expect(seen[0]?.invalidated).toEqual([ids.cut, ids.root]);
    expect(seen[0]?.invalidated).not.toContain(ids.holeA);
  });

  it('stops calling a listener after it unsubscribes', () => {
    const { document, ids } = bracketDocument();
    const listener = vi.fn();
    const unsubscribe = document.subscribe(listener);

    document.dispatch(renameNode(ids.cut, 'Drill'));
    unsubscribe();
    document.dispatch(renameNode(ids.cut, 'Drill holes'));

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('selection', () => {
  it('is by id, deduplicated, and drops ids that are not in the document', () => {
    const { document, ids } = bracketDocument();

    document.setSelection([ids.plate, ids.plate, 'does-not-exist']);

    expect(document.selection).toEqual([ids.plate]);
    expect(document.isSelected(ids.plate)).toBe(true);
  });

  it('is pruned when the selected node is deleted, and is not undoable', () => {
    const { document, ids } = bracketDocument();
    document.setSelection([ids.plate, ids.holeA]);

    document.dispatch(removeNode(ids.plate));
    expect(document.selection).toEqual([ids.holeA]);

    // Undo restores the node. It does not restore the highlight — undo is for
    // the model, and re-selecting a node the user deleted on purpose would be
    // its own surprise.
    document.undo();
    expect(document.has(ids.plate)).toBe(true);
    expect(document.selection).toEqual([ids.holeA]);
  });
});

describe('world transforms', () => {
  it('composes nested transform nodes, outermost first', () => {
    const root = groupNode({ id: 'root' });
    const document = CarveDocument.create({ root });
    const outer = transformNode({
      id: 'outer',
      transform: makeTrs({ translation: vec3(1, 0, 0), scale: vec3(2, 2, 2) }),
    });
    const inner = transformNode({
      id: 'inner',
      transform: makeTrs({ translation: vec3(0, 3, 0) }),
    });
    const box = primitiveNode({ id: 'box', primitive: 'box', params: { width: 1 } });

    document.dispatch(insertNode(outer, root.id));
    document.dispatch(insertNode(inner, outer.id));
    document.dispatch(insertNode(box, inner.id));

    const matrix = document.worldMatrix(box.id);

    // Translation column: the inner offset is scaled by the outer scale before
    // the outer translation is added.
    expect(matrix.slice(12, 15)).toEqual([1, 6, 0]);
    expect(matrix[0]).toBe(2);
  });

  it('is the identity for a node with no transform above it', () => {
    const { document, ids } = bracketDocument();

    expect(document.worldMatrix(ids.cut)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });
});

describe('command preconditions', () => {
  it('rejects writing a transform onto a node that is not a transform', () => {
    const { document, ids } = bracketDocument();

    expect(() => document.dispatch(setTransform(ids.cut, makeTrs()))).toThrow(DocumentError);
  });

  it('rejects writing parameters onto a node that is not a primitive', () => {
    const { document, ids } = bracketDocument();

    expect(() => document.dispatch(setParameters(ids.cut, { width: 1 }))).toThrow(DocumentError);
  });

  it('rejects a boolean op on a node that is not a boolean', () => {
    const { document, ids } = bracketDocument();

    expect(() => document.dispatch(setBooleanOp(ids.plate, 'union'))).toThrow(DocumentError);
  });

  it('rejects an unknown node id', () => {
    const { document } = bracketDocument();

    expect(() => document.dispatch(renameNode('nope', 'x'))).toThrow(DocumentError);
  });
});
