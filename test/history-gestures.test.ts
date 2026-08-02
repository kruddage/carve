/**
 * Undo, redo, coalescing, and the gesture lifecycle.
 *
 * The two requirements issue #5 calls out as easy to get wrong and expensive to
 * retrofit are both here:
 *
 *   - a 72Hz drag is *one* undo entry, not 144
 *   - a gesture that is cancelled — hand tracking loses the hand, which it
 *     will — restores the document and leaves no trace in the history
 *
 * The second one is the reason cancel is not "undo N times": undoing after a
 * lost-tracking drag has to undo the edit *before* the drag, not the drag that
 * never finished.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  DocumentError,
  groupNode,
  insertNode,
  makeTrs,
  moveNode,
  primitiveNode,
  quat,
  removeNode,
  renameNode,
  setBooleanOp,
  setParameters,
  setTransform,
  transformNode,
  vec3,
  type DocumentChange,
  type Trs,
} from '../src/core/index.js';

import { bracketDocument, snapshot } from './support/document-fixture.js';

/** One frame of a drag: a pose that depends on the frame number. */
function poseAtFrame(frame: number): Trs {
  return makeTrs({
    translation: vec3(frame * 0.001, 0.02, -0.3),
    rotation: quat(0, Math.sin(frame / 200), 0, Math.cos(frame / 200)),
  });
}

describe('undo and redo', () => {
  it('round-trips every command kind', () => {
    const { document, ids } = bracketDocument();
    const before = snapshot(document);

    document.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    document.dispatch(setParameters(ids.platePrimitive, { width: 0.42, fillet: 0.002 }));
    document.dispatch(setBooleanOp(ids.cut, 'intersect'));
    document.dispatch(renameNode(ids.cut, 'Drill'));
    document.dispatch(moveNode(ids.holeB, ids.cut, 0));
    document.dispatch(removeNode(ids.holeA));

    const after = snapshot(document);
    expect(after).not.toBe(before);
    expect(document.undoDepth).toBe(6);

    while (document.canUndo) document.undo();
    expect(snapshot(document)).toBe(before);

    while (document.canRedo) document.redo();
    expect(snapshot(document)).toBe(after);
  });

  it('restores a parameter map exactly, including keys the patch added', () => {
    const { document, ids } = bracketDocument();

    document.dispatch(setParameters(ids.platePrimitive, { chamfer: 0.001 }));
    expect(document.expect(ids.platePrimitive)).toMatchObject({ params: { chamfer: 0.001 } });

    document.undo();

    const params = document.expect(ids.platePrimitive);
    expect(params.kind).toBe('primitive');
    expect(params.kind === 'primitive' && 'chamfer' in params.params).toBe(false);
  });

  it('drops the redo stack once a new edit lands', () => {
    const { document, ids } = bracketDocument();

    document.dispatch(renameNode(ids.cut, 'One'));
    document.undo();
    expect(document.canRedo).toBe(true);

    document.dispatch(renameNode(ids.cut, 'Two'));
    expect(document.canRedo).toBe(false);
  });

  it('returns null rather than throwing at the ends of the stack', () => {
    const { document } = bracketDocument();

    expect(document.undo()).toBeNull();
    expect(document.redo()).toBeNull();
  });

  it('labels the change it emits with the command that caused it', () => {
    const { document, ids } = bracketDocument();
    const seen: DocumentChange[] = [];
    document.subscribe((change) => seen.push(change));

    document.dispatch(removeNode(ids.holeA));
    document.undo();
    document.redo();

    expect(seen.map((change) => change.source)).toEqual(['command', 'undo', 'redo']);
    expect(new Set(seen.map((change) => change.label))).toEqual(new Set(['Delete node']));
  });
});

describe('coalescing', () => {
  it('turns a two-second 72Hz drag into exactly one undo entry', () => {
    const { document, ids } = bracketDocument();
    const before = document.expect(ids.holeA);
    const depthBefore = document.undoDepth;

    const drag = document.beginGesture('pinch-grab');
    for (let frame = 0; frame < 144; frame += 1) {
      drag.dispatch(setTransform(ids.holeA, poseAtFrame(frame)));
    }
    drag.commit();

    expect(document.undoDepth).toBe(depthBefore + 1);
    expect(document.expect(ids.holeA)).toMatchObject({ transform: poseAtFrame(143) });

    // One undo, and the node is back where the drag started — not one frame back.
    document.undo();
    expect(document.expect(ids.holeA)).toEqual(before);
    expect(document.undoDepth).toBe(depthBefore);

    document.redo();
    expect(document.expect(ids.holeA)).toMatchObject({ transform: poseAtFrame(143) });
  });

  it('does not merge two separate drags of the same node', () => {
    const { document, ids } = bracketDocument();

    for (const frames of [
      [0, 1, 2],
      [3, 4, 5],
    ]) {
      const drag = document.beginGesture('pinch-grab');
      for (const frame of frames) drag.dispatch(setTransform(ids.holeA, poseAtFrame(frame)));
      drag.commit();
    }

    expect(document.undoDepth).toBe(2);
    document.undo();
    expect(document.expect(ids.holeA)).toMatchObject({ transform: poseAtFrame(2) });
  });

  it('does not merge edits to different properties inside one gesture', () => {
    const { document, ids } = bracketDocument();

    const gesture = document.beginGesture('inspector');
    gesture.dispatch(setParameters(ids.platePrimitive, { width: 0.3 }));
    gesture.dispatch(setParameters(ids.platePrimitive, { width: 0.4 }));
    gesture.dispatch(setParameters(ids.platePrimitive, { depth: 0.2 }));
    gesture.commit();

    // Width merged with width; depth is its own adjustment.
    expect(document.undoDepth).toBe(2);
  });

  it('never merges outside a gesture, however fast the edits arrive', () => {
    const { document, ids } = bracketDocument();

    document.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    document.dispatch(setTransform(ids.holeA, poseAtFrame(2)));

    expect(document.undoDepth).toBe(2);
  });

  it('never merges structural edits', () => {
    const { document, ids } = bracketDocument();

    const gesture = document.beginGesture('drag-in-outliner');
    gesture.dispatch(moveNode(ids.holeA, ids.cut, 0));
    gesture.dispatch(moveNode(ids.holeA, ids.cut, 2));
    gesture.commit();

    expect(document.undoDepth).toBe(2);
  });
});

describe('gesture lifecycle', () => {
  it('restores the document and the history when a gesture is cancelled', () => {
    const { document, ids } = bracketDocument();
    document.dispatch(renameNode(ids.cut, 'Drill'));
    const before = snapshot(document);
    const depthBefore = document.undoDepth;

    const drag = document.beginGesture('pinch-grab');
    for (let frame = 0; frame < 30; frame += 1) {
      drag.dispatch(setTransform(ids.holeA, poseAtFrame(frame)));
    }
    drag.cancel();

    expect(snapshot(document)).toBe(before);
    expect(document.undoDepth).toBe(depthBefore);

    // And undo still targets the edit before the drag, not the drag.
    document.undo();
    expect(document.expect(ids.cut).name).not.toBe('Drill');
  });

  it('cancels a gesture that mixed structural and property edits', () => {
    const { document, ids } = bracketDocument();
    const before = snapshot(document);

    const gesture = document.beginGesture('mixed');
    gesture.dispatch(moveNode(ids.holeB, ids.cut, 0));
    gesture.dispatch(setTransform(ids.holeB, poseAtFrame(4)));
    gesture.dispatch(removeNode(ids.holeA));
    gesture.cancel();

    expect(snapshot(document)).toBe(before);
    expect(document.undoDepth).toBe(0);
  });

  it('restores the redo stack that the cancelled gesture cleared', () => {
    const { document, ids } = bracketDocument();
    document.dispatch(renameNode(ids.cut, 'Drill'));
    document.undo();
    expect(document.canRedo).toBe(true);

    const drag = document.beginGesture('pinch-grab');
    drag.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    drag.cancel();

    expect(document.canRedo).toBe(true);
    document.redo();
    expect(document.expect(ids.cut).name).toBe('Drill');
  });

  it('emits a commit event so the kernel knows when to stop previewing', () => {
    const { document, ids } = bracketDocument();
    const seen: DocumentChange[] = [];
    document.subscribe((change) => seen.push(change));

    const drag = document.beginGesture('pinch-grab');
    drag.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    drag.dispatch(setTransform(ids.holeA, poseAtFrame(2)));
    drag.commit();

    expect(seen.map((change) => change.gesturePhase)).toEqual(['update', 'update', 'commit']);
    expect(seen.every((change) => change.gestureId === 'pinch-grab-1')).toBe(true);
    // The commit reports every node the gesture touched, so a listener that
    // previewed at drag quality knows exactly what to re-evaluate properly.
    expect(seen.at(-1)?.changed).toEqual([ids.holeA]);
    expect(seen.at(-1)?.invalidated).toEqual([ids.holeA, ids.cut, ids.root]);
  });

  it('emits a cancel event naming what it rolled back', () => {
    const { document, ids } = bracketDocument();
    const seen: DocumentChange[] = [];
    document.subscribe((change) => seen.push(change));

    const drag = document.beginGesture('pinch-grab');
    drag.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    drag.cancel();

    expect(seen.at(-1)?.gesturePhase).toBe('cancel');
    expect(seen.at(-1)?.source).toBe('gesture-cancel');
    expect(seen.at(-1)?.changed).toContain(ids.holeA);
  });

  it('refuses a second gesture, a direct dispatch, or an undo while one is open', () => {
    const { document, ids } = bracketDocument();
    const drag = document.beginGesture('pinch-grab');

    expect(() => document.beginGesture('other')).toThrow(DocumentError);
    expect(() => document.dispatch(renameNode(ids.cut, 'x'))).toThrow(DocumentError);
    expect(() => document.undo()).toThrow(DocumentError);
    expect(document.activeGestureId).toBe('pinch-grab-1');

    drag.commit();
    expect(document.activeGestureId).toBeNull();
  });

  it('refuses to be used after it closes', () => {
    const { document, ids } = bracketDocument();

    const drag = document.beginGesture('pinch-grab');
    drag.dispatch(setTransform(ids.holeA, poseAtFrame(1)));
    drag.commit();

    expect(drag.active).toBe(false);
    expect(() => drag.dispatch(setTransform(ids.holeA, poseAtFrame(2)))).toThrow(DocumentError);
    expect(() => drag.commit()).toThrow(DocumentError);
    expect(() => drag.cancel()).toThrow(DocumentError);
  });
});

describe('history bounds', () => {
  it('drops the oldest entries past the limit rather than growing forever', () => {
    // Undo entries hold deleted subtrees by reference, so an unbounded stack is
    // a memory leak with a friendly name — and the headset is the machine with
    // the least memory to leak.
    const root = groupNode({ id: 'root' });
    const document = CarveDocument.create({ root, historyLimit: 3 });
    const box = primitiveNode({ id: 'box', primitive: 'box', params: { width: 1 } });
    document.dispatch(insertNode(box, root.id));

    for (let i = 0; i < 10; i += 1) document.dispatch(renameNode(box.id, `name-${i}`));

    expect(document.undoDepth).toBe(3);
    while (document.canUndo) document.undo();
    expect(document.expect(box.id).name).toBe('name-6');
  });

  it('cancels a gesture correctly even when the limit trimmed an entry mid-gesture', () => {
    // The boundary case: the gesture's edit pushes the stack over the limit, so
    // the oldest entry is dropped and the stack *length* after the edit equals
    // what it was before. A mark recorded as a length would conclude there was
    // nothing to roll back and leave the drag applied.
    const root = groupNode({ id: 'root' });
    const document = CarveDocument.create({ root, historyLimit: 2 });
    const wrapper = transformNode({ id: 'wrapper' });
    document.dispatch(insertNode(wrapper, root.id));
    document.dispatch(renameNode(wrapper.id, 'A'));
    document.dispatch(renameNode(wrapper.id, 'B'));
    expect(document.undoDepth).toBe(2);
    const before = snapshot(document);

    const drag = document.beginGesture('pinch-grab');
    drag.dispatch(setTransform(wrapper.id, poseAtFrame(1)));
    drag.cancel();

    expect(snapshot(document)).toBe(before);
    // The trimmed entry is gone for good — trimming is destructive, that is the
    // point of a limit. What must hold is that the *drag* left no entry, so the
    // next undo targets the edit before it.
    expect(document.undoDepth).toBe(1);
    document.undo();
    expect(document.expect(wrapper.id).name).toBe('A');
  });
});
