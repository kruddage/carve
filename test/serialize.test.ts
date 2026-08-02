/**
 * The on-disk format: round-trip, validation, and the migration hook.
 *
 * Round-trip is the headline assertion from issue #5 —
 * `deserialize(serialize(doc))` deep-equals `doc` — and the rest of this file
 * is about the other half of the job: a file that is *not* what we wrote has to
 * fail loudly and specifically, because the alternative is a half-built
 * document that fails later somewhere unrelated.
 */

import { describe, expect, it } from 'vitest';

import {
  CarveDocument,
  DOCUMENT_FORMAT_VERSION,
  DocumentFormatError,
  deserialize,
  deserializeJson,
  makeTrs,
  migrate,
  primitiveNode,
  quat,
  renameNode,
  serialize,
  setTransform,
  vec3,
  type Migration,
  type SerializedDocument,
} from '../src/core/index.js';

import { bracketDocument, canonical, snapshot } from './support/document-fixture.js';

describe('round trip', () => {
  it('restores a document that deep-equals the original', () => {
    const { document, ids } = bracketDocument();
    document.dispatch(
      setTransform(
        ids.holeA,
        makeTrs({
          translation: vec3(0.011, -0.2, 3),
          rotation: quat(0, 0.7071067811865476, 0, 0.7071067811865476),
          scale: vec3(1, 2, 3),
        }),
      ),
    );

    const restored = deserialize(serialize(document));

    expect(serialize(restored)).toEqual(serialize(document));
    expect(snapshot(restored)).toBe(snapshot(document));
    expect(restored.childrenOf(ids.cut)).toEqual(document.childrenOf(ids.cut));
    expect(restored.worldMatrix(ids.holeA)).toEqual(document.worldMatrix(ids.holeA));
  });

  it('survives JSON.stringify and back, which is how it will actually be stored', () => {
    const { document } = bracketDocument();

    const restored = deserializeJson(JSON.stringify(serialize(document)));

    expect(canonical(serialize(restored))).toBe(canonical(serialize(document)));
  });

  it('writes nodes in depth-first document order, root first', () => {
    const { document, ids } = bracketDocument();

    const written = serialize(document).nodes.map((node) => node.id);

    expect(written[0]).toBe(ids.root);
    expect(written).toEqual([...document.order()]);
  });

  it('stamps the format version', () => {
    const { document } = bracketDocument();

    expect(serialize(document).version).toBe(DOCUMENT_FORMAT_VERSION);
  });

  it('comes back with an empty history, so undo cannot reach past the load', () => {
    const { document, ids } = bracketDocument();
    document.dispatch(renameNode(ids.cut, 'Drill'));

    const restored = deserialize(serialize(document));

    expect(restored.canUndo).toBe(false);
    expect(restored.expect(ids.cut).name).toBe('Drill');
  });

  it('keeps editing working on the restored document', () => {
    const { document, ids } = bracketDocument();
    const restored = deserialize(serialize(document));

    restored.dispatch(renameNode(ids.cut, 'Drill'));
    restored.undo();

    expect(snapshot(restored)).toBe(snapshot(document));
  });
});

describe('validation', () => {
  const valid = (): SerializedDocument => serialize(bracketDocument().document);

  it('rejects a document that is not an object', () => {
    expect(() => deserialize(null)).toThrow(DocumentFormatError);
    expect(() => deserialize('{}')).toThrow(DocumentFormatError);
    expect(() => deserialize([])).toThrow(DocumentFormatError);
  });

  it('rejects a missing or non-integer version', () => {
    expect(() => deserialize({ ...valid(), version: undefined })).toThrow(/version/);
    expect(() => deserialize({ ...valid(), version: 1.5 })).toThrow(/version/);
  });

  it('rejects a version newer than this build, and says so', () => {
    expect(() => deserialize({ ...valid(), version: DOCUMENT_FORMAT_VERSION + 1 })).toThrow(
      /newer than this build/,
    );
  });

  it('rejects an unknown node kind', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.kind === 'boolean' ? ({ ...node, kind: 'nurbs' } as never) : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/is not a node kind/);
  });

  it('rejects an unknown primitive kind', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.kind === 'primitive' ? ({ ...node, primitive: 'dodecahedron' } as never) : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/must be one of/);
  });

  it('rejects a non-finite parameter, which JSON turns into null anyway', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.kind === 'primitive' ? ({ ...node, params: { width: null } } as never) : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/finite number/);
  });

  it('rejects a malformed transform', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.kind === 'transform'
        ? ({ ...node, transform: { translation: { x: 0, y: 0 } } } as never)
        : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/transform/);
  });

  it('rejects a child reference that points at nothing', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.kind === 'boolean' ? { ...node, children: [...node.children, 'ghost'] } : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/does not contain/);
  });

  it('rejects a node that no longer hangs off the root', () => {
    const document = valid();
    const orphan = primitiveNode({ id: 'orphan', primitive: 'sphere', params: { radius: 1 } });

    expect(() => deserialize({ ...document, nodes: [...document.nodes, orphan] })).toThrow(
      /unreachable/,
    );
  });

  it('rejects a cycle', () => {
    const document = valid();
    const nodes = document.nodes.map((node) =>
      node.id === document.root && node.kind === 'group'
        ? { ...node, children: [...node.children, document.root] }
        : node,
    );

    expect(() => deserialize({ ...document, nodes })).toThrow(/more than once/);
  });

  it('reports bad JSON as bad JSON', () => {
    expect(() => deserializeJson('{ not json')).toThrow(/Not valid JSON/);
  });
});

describe('migration', () => {
  // There are no real migrations at v1 — the point of these tests is that the
  // machinery is exercised now rather than the day the format first changes,
  // because an untested migration path is the same as not having one. So they
  // run today's document forward against a pretend future format.
  const today = (): SerializedDocument => serialize(bracketDocument().document);

  it('runs migrations in order until the document reaches the target version', () => {
    const applied: number[] = [];
    const bump =
      (from: number): Migration =>
      (document) => {
        applied.push(from);
        return { ...document, version: from + 1 };
      };
    const table = new Map<number, Migration>([
      [1, bump(1)],
      [2, bump(2)],
      [3, bump(3)],
    ]);

    const result = migrate(today(), table, 4);

    expect(applied).toEqual([1, 2, 3]);
    expect(result.version).toBe(4);
  });

  it('refuses a version it has no migration for, instead of guessing', () => {
    expect(() => migrate(today(), new Map(), 2)).toThrow(/No migration/);
  });

  it('refuses a migration that does not advance the version, instead of looping', () => {
    const stuck = new Map<number, Migration>([[1, (document) => document]]);

    expect(() => migrate(today(), stuck, 2)).toThrow(/did not advance/);
  });

  it('is a no-op for a current-version document', () => {
    const current = today();

    expect(migrate(current)).toEqual(current);
  });

  it('produces a loadable document at the end of the chain', () => {
    const renameEveryGroup: Migration = (document) => ({
      ...document,
      version: document.version + 1,
      nodes: document.nodes.map((node) =>
        node.kind === 'group' ? { ...node, name: `${node.name} (migrated)` } : node,
      ),
    });

    const migrated = migrate(today(), new Map([[1, renameEveryGroup]]), 2);
    const restored = CarveDocument.fromBundle({ rootId: migrated.root, nodes: migrated.nodes });

    expect(restored.size).toBe(migrated.nodes.length);
    expect(restored.expect(restored.rootId).name).toBe('Document (migrated)');
  });
});
