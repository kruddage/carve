/**
 * Where an autosaved document lives, as an interface with two implementations.
 *
 * #14 asks for "autosave to IndexedDB with a recent-documents list, because a
 * browser tab crash or a headset battery death should not cost an hour". The
 * IndexedDB half of that is in `indexeddb.ts`; what is here is the contract it
 * satisfies, the record shape, and an in-memory implementation.
 *
 * The in-memory store is not only a test double. A private-mode Safari window
 * and a Quest browser with storage disabled both refuse to open a database, and
 * the useful behaviour there is an app that runs with autosave degraded to
 * "this session only" rather than one that fails to start. `openDocumentStore`
 * in `indexeddb.ts` falls back to it for exactly that reason.
 *
 * ## Records hold `SerializedDocument`, not text
 *
 * IndexedDB stores structured clones, so there is no reason to stringify on the
 * way in and parse on the way out — and a good reason not to: a serialized
 * document is plain JSON-safe data by construction (see `src/core/serialize.ts`),
 * which is exactly what the structured clone algorithm accepts. Loading a
 * record therefore skips a parse, and a corrupted record fails the same
 * `deserialize` validation a corrupted file would.
 *
 * ## The list is separate from the payload
 *
 * `list()` returns metadata only. A recent-documents menu wants six names and
 * six timestamps; making it read six full documents to render six rows would
 * put the whole autosave history into memory to draw a menu.
 */

import type { SerializedDocument } from '../core/index.js';

/** What a recent-documents list shows, with no geometry attached. */
export interface DocumentSummary {
  readonly id: string;
  readonly name: string;
  /** Epoch milliseconds. */
  readonly savedAt: number;
  /** Nodes in the document. A rough size, cheap to keep, useful in a menu. */
  readonly nodeCount: number;
}

export interface StoredDocument extends DocumentSummary {
  readonly document: SerializedDocument;
}

/**
 * A slot to autosave into and read back.
 *
 * Async throughout, because IndexedDB is, and a synchronous interface would
 * have to be abandoned the moment the real implementation arrived.
 */
export interface DocumentStore {
  put(record: StoredDocument): Promise<void>;
  get(id: string): Promise<StoredDocument | null>;
  /** Newest first. Metadata only — see the file header. */
  list(): Promise<readonly DocumentSummary[]>;
  delete(id: string): Promise<void>;
  /**
   * Keep the `limit` newest records and delete the rest. Returns the ids
   * deleted, so a caller can report what it dropped.
   */
  prune(limit: number): Promise<readonly string[]>;
  close(): void;
}

/** The metadata half of a record. */
export function summarize(record: StoredDocument): DocumentSummary {
  return {
    id: record.id,
    name: record.name,
    savedAt: record.savedAt,
    nodeCount: record.nodeCount,
  };
}

/** Newest first, ties broken by id so the order is total and stable. */
export function byRecency(a: DocumentSummary, b: DocumentSummary): number {
  if (a.savedAt !== b.savedAt) return b.savedAt - a.savedAt;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * A `DocumentStore` in a `Map`.
 *
 * Records are deep-copied on the way in and out, which is what makes it behave
 * like the real one: a caller that mutated a document after autosaving it would
 * otherwise see the stored copy change too, and the bug would only appear in
 * the browser.
 */
export class MemoryDocumentStore implements DocumentStore {
  readonly #records = new Map<string, StoredDocument>();

  put(record: StoredDocument): Promise<void> {
    this.#records.set(record.id, clone(record));
    return Promise.resolve();
  }

  get(id: string): Promise<StoredDocument | null> {
    const record = this.#records.get(id);
    return Promise.resolve(record ? clone(record) : null);
  }

  list(): Promise<readonly DocumentSummary[]> {
    return Promise.resolve([...this.#records.values()].map(summarize).sort(byRecency));
  }

  delete(id: string): Promise<void> {
    this.#records.delete(id);
    return Promise.resolve();
  }

  async prune(limit: number): Promise<readonly string[]> {
    const doomed = (await this.list()).slice(Math.max(0, limit)).map((entry) => entry.id);
    for (const id of doomed) this.#records.delete(id);
    return doomed;
  }

  close(): void {
    this.#records.clear();
  }
}

function clone<T>(value: T): T {
  return structuredClone(value);
}
