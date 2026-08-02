/**
 * Autosave: when a write happens, what it costs, and what survives a crash.
 *
 * Two halves, tested differently. The *policy* — debounce, the ceiling, no
 * writes mid-gesture, one write at a time — is deterministic and is driven with
 * fake timers against an in-memory store. The *storage* is exercised against
 * `fake-indexeddb`, which is the real IndexedDB algorithm with an in-memory
 * backend, so the transaction and index behaviour under test is the behaviour a
 * browser has rather than a mock's idea of it.
 *
 * "Autosave recovers a document after a forced tab kill" is #14a's done-when,
 * and a killed tab is exactly a store that outlives its `Autosave`: the
 * recovery tests below drop the instance, reopen the database, and read what is
 * there — which is all a reload does.
 */

import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renameNode, setParameters, setTransform, makeTrs, vec3 } from '../src/core/index.js';
import {
  Autosave,
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MAX_DELAY_MS,
  IndexedDbDocumentStore,
  MemoryDocumentStore,
  createDocumentId,
  openDocumentStore,
  recoverLatest,
  restore,
  type DocumentStore,
  type StoredDocument,
} from '../src/io/index.js';

import { bracketDocument, canonical } from './support/document-fixture.js';

/** A store that counts writes and can be made to fail. */
class CountingStore extends MemoryDocumentStore {
  puts = 0;
  failNext = false;

  override put(record: StoredDocument): Promise<void> {
    this.puts += 1;
    if (this.failNext) {
      this.failNext = false;
      return Promise.reject(new Error('quota exceeded'));
    }
    return super.put(record);
  }
}

describe('when a write happens', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('collapses a burst of edits into one write', async () => {
    const { document, ids } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    for (let i = 0; i < 20; i += 1) {
      document.dispatch(setParameters(ids.platePrimitive, { width: 0.2 + i * 0.001 }));
      await vi.advanceTimersByTimeAsync(50);
    }
    await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS);

    expect(store.puts).toBe(1);
    expect(autosave.dirty).toBe(false);
    autosave.stop();
  });

  it('writes nothing while a gesture is open, and once when it commits', async () => {
    const { document, ids } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    const drag = document.beginGesture('grab');
    for (let i = 0; i < 60; i += 1) {
      drag.dispatch(setTransform(ids.holeA, makeTrs({ translation: vec3(i * 0.001, 0, 0) })));
      await vi.advanceTimersByTimeAsync(16);
    }
    // A whole second of drag frames, well past the debounce, and nothing has
    // been written — this is the assertion that keeps IndexedDB out of the
    // frame loop.
    expect(store.puts).toBe(0);

    drag.commit();
    await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS);

    expect(store.puts).toBe(1);
    autosave.stop();
  });

  it('forces a write for a burst that never pauses', async () => {
    const { document, ids } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    // An edit every second: never a gap long enough for the trailing debounce
    // to fire on its own.
    for (let i = 0; i < 20; i += 1) {
      document.dispatch(setParameters(ids.platePrimitive, { width: 0.2 + i * 0.001 }));
      await vi.advanceTimersByTimeAsync(1_000);
    }

    expect(store.puts).toBeGreaterThanOrEqual(1);
    expect(autosave.lastSavedAt).not.toBeNull();
    expect(DEFAULT_MAX_DELAY_MS).toBeGreaterThan(DEFAULT_DEBOUNCE_MS);
    autosave.stop();
  });

  it('flushes on demand, which is what page-hide calls', async () => {
    const { document } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    document.dispatch(renameNode(document.rootId, 'Bracket'));
    await autosave.flush();

    expect(store.puts).toBe(1);
    expect((await store.get(autosave.id))?.name).toBe('Bracket');
    autosave.stop();
  });

  it('does not create a slot for a document nobody has edited', async () => {
    const { document } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    await autosave.flush();
    await autosave.flush();

    expect(store.puts).toBe(0);
    autosave.stop();
  });

  it('stops writing once stopped', async () => {
    const { document } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store);

    autosave.stop();
    document.dispatch(renameNode(document.rootId, 'After'));
    await vi.advanceTimersByTimeAsync(DEFAULT_MAX_DELAY_MS * 2);
    await autosave.flush();

    expect(store.puts).toBe(0);
  });

  it('reports a failed write and stays dirty, rather than throwing at the caller', async () => {
    const { document } = bracketDocument();
    const store = new CountingStore();
    const errors: unknown[] = [];
    const autosave = Autosave.attach(document, store, { onError: (error) => errors.push(error) });

    store.failNext = true;
    // The dispatch must not throw: this runs inside a change listener.
    expect(() => document.dispatch(renameNode(document.rootId, 'One'))).not.toThrow();
    await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS);

    expect(errors).toHaveLength(1);
    expect(autosave.dirty).toBe(true);
    expect(autosave.lastSavedAt).toBeNull();

    // The next tick retries, and succeeds.
    document.dispatch(renameNode(document.rootId, 'Two'));
    await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_MS);

    expect(autosave.dirty).toBe(false);
    expect((await store.get(autosave.id))?.name).toBe('Two');
    autosave.stop();
  });

  it('never loses a change that arrives while a write is in flight', async () => {
    const { document } = bracketDocument();
    const store = new CountingStore();
    const autosave = Autosave.attach(document, store, { debounceMs: 10 });

    document.dispatch(renameNode(document.rootId, 'First'));
    // Fire the timer, then change the document before the write settles.
    vi.advanceTimersByTime(10);
    document.dispatch(renameNode(document.rootId, 'Second'));
    await vi.advanceTimersByTimeAsync(100);

    expect((await store.get(autosave.id))?.name).toBe('Second');
    autosave.stop();
  });

  it('keeps only the most recent documents', async () => {
    const store = new MemoryDocumentStore();
    const { document } = bracketDocument();

    for (let i = 0; i < 15; i += 1) {
      const autosave = Autosave.attach(document, store, {
        id: `doc-${String(i).padStart(2, '0')}`,
        maxRecent: 5,
        now: () => 1_000 + i,
      });
      document.dispatch(renameNode(document.rootId, `Take ${i}`));
      await autosave.flush();
      autosave.stop();
    }

    const list = await store.list();
    expect(list).toHaveLength(5);
    expect(list[0]?.id).toBe('doc-14');
    expect(list.at(-1)?.id).toBe('doc-10');
  });
});

describe('recovery', () => {
  it('returns the newest autosave as a live document', async () => {
    const store = new MemoryDocumentStore();
    const { document, ids } = bracketDocument();
    const autosave = Autosave.attach(document, store, { now: () => 5_000 });
    document.dispatch(renameNode(ids.platePrimitive, 'Plate'));
    await autosave.flush();
    autosave.stop();

    const recovered = await recoverLatest(store);

    expect(recovered).not.toBeNull();
    expect(recovered?.record.nodeCount).toBe(document.size);
    expect(canonical(recovered?.document.expect(ids.platePrimitive))).toBe(
      canonical(document.expect(ids.platePrimitive)),
    );
  });

  it('is null when nothing has ever been saved', async () => {
    expect(await recoverLatest(new MemoryDocumentStore())).toBeNull();
  });

  it('skips a corrupted record rather than making an older one unreachable', async () => {
    const store = new MemoryDocumentStore();
    const { document } = bracketDocument();
    const good = Autosave.attach(document, store, { id: 'good', now: () => 1_000 });
    document.dispatch(renameNode(document.rootId, 'Good'));
    await good.flush();
    good.stop();
    await store.put({
      id: 'broken',
      name: 'Broken',
      savedAt: 9_000,
      nodeCount: 1,
      // Hand-corrupted the way a partial write or a bad migration would leave it.
      document: { version: 1, root: 'missing', nodes: [] },
    });

    const errors: string[] = [];
    const recovered = await recoverLatest(store, (_error, id) => errors.push(id));

    expect(errors).toEqual(['broken']);
    expect(recovered?.record.id).toBe('good');
  });

  it('restores a record on its own, for a recent-documents pick', async () => {
    const store = new MemoryDocumentStore();
    const { document } = bracketDocument();
    const autosave = Autosave.attach(document, store, { id: 'slot' });
    document.dispatch(renameNode(document.rootId, 'Bracket'));
    await autosave.flush();
    autosave.stop();

    const record = await store.get('slot');

    expect(restore(record!).size).toBe(document.size);
  });
});

describe('the IndexedDB store', () => {
  let factory: IDBFactory;

  beforeEach(() => {
    // A fresh database per test: fake-indexeddb is process-global otherwise,
    // and a leaked record would make these order-dependent.
    factory = new IDBFactory();
  });

  async function open(): Promise<DocumentStore> {
    const opened = await openDocumentStore({ factory });
    expect(opened.persistent).toBe(true);
    expect(opened.store).toBeInstanceOf(IndexedDbDocumentStore);
    return opened.store;
  }

  function record(id: string, savedAt: number, name = id): StoredDocument {
    const { document } = bracketDocument();
    return {
      id,
      name,
      savedAt,
      nodeCount: document.size,
      document: JSON.parse(JSON.stringify({ version: 1, root: 'root', nodes: [] })) as never,
    };
  }

  it('round-trips a record through a real transaction', async () => {
    const store = await open();
    const { document } = bracketDocument();
    const autosave = Autosave.attach(document, store, { id: 'slot' });

    document.dispatch(renameNode(document.rootId, 'Bracket'));
    await autosave.flush();
    autosave.stop();

    const read = await store.get('slot');
    expect(read?.name).toBe('Bracket');
    expect(restore(read!).size).toBe(document.size);
    store.close();
  });

  it('survives the connection closing, which is what a tab kill is', async () => {
    const first = await open();
    const { document } = bracketDocument();
    const autosave = Autosave.attach(document, first, { id: 'slot' });
    document.dispatch(renameNode(document.rootId, 'Unsaved work'));
    await autosave.flush();
    autosave.stop();
    first.close();

    // Reopen from scratch: a new page load against the same origin.
    const second = await open();
    const recovered = await recoverLatest(second);

    expect(recovered?.record.name).toBe('Unsaved work');
    expect(recovered?.document.size).toBe(document.size);
    second.close();
  });

  it('lists newest first, from the index rather than by reading every document', async () => {
    const store = await open();
    await store.put(record('a', 1_000));
    await store.put(record('c', 3_000));
    await store.put(record('b', 2_000));

    const list = await store.list();

    expect(list.map((entry) => entry.id)).toEqual(['c', 'b', 'a']);
    // Metadata only — the payload is not in a summary.
    expect(list[0]).not.toHaveProperty('document');
    store.close();
  });

  it('prunes to the newest N and reports what it dropped', async () => {
    const store = await open();
    for (let i = 0; i < 6; i += 1) await store.put(record(`d${i}`, 1_000 + i));

    const dropped = await store.prune(3);

    expect([...dropped].sort()).toEqual(['d0', 'd1', 'd2']);
    expect((await store.list()).map((entry) => entry.id)).toEqual(['d5', 'd4', 'd3']);
    expect(await store.get('d0')).toBeNull();
    store.close();
  });

  it('deletes a record', async () => {
    const store = await open();
    await store.put(record('a', 1_000));

    await store.delete('a');

    expect(await store.get('a')).toBeNull();
    store.close();
  });
});

describe('when storage is unavailable', () => {
  it('degrades to memory and says so, rather than failing to start', async () => {
    // No `factory` at all, and no `indexedDB` global in Node: the shape a
    // browser with site data blocked presents.
    const opened = await openDocumentStore();

    expect(opened.persistent).toBe(false);
    expect(opened.store).toBeInstanceOf(MemoryDocumentStore);
    expect(opened.reason).toMatch(/IndexedDB/);
  });

  it('degrades when opening the database is refused, as in private mode', async () => {
    const refusing = {
      open: () => {
        throw new DOMException('The operation is insecure', 'SecurityError');
      },
    } as unknown as IDBFactory;

    const opened = await openDocumentStore({ factory: refusing });

    expect(opened.persistent).toBe(false);
    expect(opened.reason).toMatch(/Autosave will not survive a reload/);
    // Still usable: a session's worth of autosave is better than none.
    const { document } = bracketDocument();
    const autosave = Autosave.attach(document, opened.store, { id: 'slot' });
    document.dispatch(renameNode(document.rootId, 'Bracket'));
    await autosave.flush();
    expect(await opened.store.get('slot')).not.toBeNull();
    autosave.stop();
  });
});

describe('document ids', () => {
  it('sort in the order the documents were created', () => {
    const early = createDocumentId(() => 1_000);
    const late = createDocumentId(() => 2_000);

    expect(early < late).toBe(true);
    expect(early).not.toBe(createDocumentId(() => 1_000));
  });
});
