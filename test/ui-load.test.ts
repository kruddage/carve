/**
 * Opening a file into the document already on screen.
 *
 * The property that matters is the one in `load.ts`'s header: after a load the
 * app is looking at the *same* `CarveDocument` object, so nothing downstream
 * has to be re-subscribed. That is what these assert, along with the two things
 * that would otherwise go wrong — a load sitting at the bottom of the undo
 * stack, and a stale selection pointing at nodes from the previous file.
 *
 * The round trip goes through the real `serialize` / `deserialize` rather than
 * a hand-built second document, because "save it, reload it" is issue #1's
 * first done-when and a load path tested against a synthetic source is a load
 * path tested against the wrong thing.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  booleanNode,
  deserializeJson,
  insertBundle,
  insertNode,
  makeTrs,
  placedPrimitive,
  renameNode,
  serialize,
  spawnPrimitive,
  vec3,
  type NodeId,
} from '../src/core/index.js';
import { loadCommand, loadInto } from '../src/ui/index.js';

/** A document with a subtract of two boxes, saved and read back. */
function bracket(): { document: CarveDocument; opId: NodeId } {
  const document = CarveDocument.create();
  document.dispatch(renameNode(document.rootId, 'Bracket'));

  const op = booleanNode({ op: 'subtract' });
  document.dispatch(insertNode(op, document.rootId));
  for (const [name, at] of [
    ['Body', 0],
    ['Hole', 0.02],
  ] as const) {
    document.dispatch(
      insertBundle(
        placedPrimitive(spawnPrimitive('box', { name }), makeTrs({ translation: vec3(at, 0, 0) }), {
          name,
        }),
        op.id,
      ),
    );
  }
  return { document, opId: op.id };
}

function roundTrip(document: CarveDocument): CarveDocument {
  return deserializeJson(JSON.stringify(serialize(document)));
}

describe('loading into a live document', () => {
  it('keeps the same document object', () => {
    const target = CarveDocument.create();
    const { document: source } = bracket();
    loadInto(target, roundTrip(source));
    // The point of the whole exercise: nothing has to re-subscribe.
    expect(target).toBeInstanceOf(CarveDocument);
    expect(target.size).toBe(source.size);
  });

  it('brings the tree across with its structure and its ids intact', () => {
    const { document: source, opId } = bracket();
    const target = CarveDocument.create();
    loadInto(target, roundTrip(source));

    expect(target.has(opId)).toBe(true);
    expect(target.childrenOf(opId)).toEqual(source.childrenOf(opId));
    expect(target.get(target.rootId)?.name).toBe('Bracket');

    const op = target.expect(opId);
    expect(op.kind === 'boolean' && op.op).toBe('subtract');
  });

  it('replaces what was there rather than appending to it', () => {
    const { document: source } = bracket();
    const target = CarveDocument.create();
    target.dispatch(
      insertBundle(placedPrimitive(spawnPrimitive('sphere'), makeTrs()), target.rootId),
    );
    const stale = target.childrenOf(target.rootId)[0];
    expect(stale).toBeDefined();

    loadInto(target, roundTrip(source));
    expect(target.childrenOf(target.rootId)).toEqual(source.childrenOf(source.rootId));
    if (stale) expect(target.has(stale)).toBe(false);
  });

  it('leaves nothing in the undo stack — a file open is not an edit', () => {
    const { document: source } = bracket();
    const target = CarveDocument.create();
    target.dispatch(
      insertBundle(placedPrimitive(spawnPrimitive('sphere'), makeTrs()), target.rootId),
    );
    expect(target.undoDepth).toBeGreaterThan(0);

    loadInto(target, roundTrip(source));
    expect(target.undoDepth).toBe(0);
    expect(target.canUndo).toBe(false);
  });

  it('drops a selection that pointed at the previous document', () => {
    const { document: source } = bracket();
    const target = CarveDocument.create();
    const bundle = placedPrimitive(spawnPrimitive('sphere'), makeTrs());
    target.dispatch(insertBundle(bundle, target.rootId));
    target.setSelection([bundle.rootId]);

    loadInto(target, roundTrip(source));
    expect(target.selection).toEqual([]);
  });

  it('survives being loaded twice — the second load is not a collision', () => {
    const { document: source } = bracket();
    const target = CarveDocument.create();
    loadInto(target, roundTrip(source));
    const size = target.size;
    loadInto(target, roundTrip(source));
    expect(target.size).toBe(size);
  });

  it('does nothing at all when both documents are empty', () => {
    const target = CarveDocument.create();
    expect(loadCommand(target, CarveDocument.create())).toBeNull();
  });

  it('renames the root when only the name differs', () => {
    const target = CarveDocument.create();
    const source = CarveDocument.create();
    source.dispatch(renameNode(source.rootId, 'Renamed'));

    const command = loadCommand(target, source);
    expect(command).not.toBeNull();
    loadInto(target, source);
    expect(target.get(target.rootId)?.name).toBe('Renamed');
  });
});
