/**
 * The IndexedDB implementation of `DocumentStore`.
 *
 * IndexedDB rather than `localStorage`, for three reasons that all matter here:
 * it stores structured clones so a serialized document goes in without a
 * `JSON.stringify` round trip, it is asynchronous so an autosave never blocks
 * the frame that triggered it, and its quota is measured in hundreds of
 * megabytes rather than five.
 *
 * ## Every request is wrapped once, and only once
 *
 * The IndexedDB API is event-based, and the standard mistake is to promisify it
 * per call site until half the code paths forget `onerror`. `request()` below
 * is the only place `onsuccess`/`onerror` appear.
 *
 * ## Storage is allowed to be unavailable
 *
 * Private-mode Safari, a browser with site data blocked, and a headset with
 * storage permissions withheld all fail at `open()`. Autosave is a safety net,
 * not a feature the app can be gated on, so `openDocumentStore` falls back to
 * an in-memory store and reports which one the caller got. The alternative —
 * an exception on startup — turns "your work is not being backed up" into "the
 * app does not open", which is strictly worse for the same user.
 *
 * ## The `savedAt` index is what makes the recent list cheap
 *
 * `list()` and `prune()` both want records in recency order. An index on
 * `savedAt` gives that from the database instead of reading every record and
 * sorting in JS — and `prune()` in particular runs after every autosave, so it
 * is the one operation whose cost grows with how long the app has been used.
 */

import {
  byRecency,
  summarize,
  MemoryDocumentStore,
  type DocumentStore,
  type DocumentSummary,
  type StoredDocument,
} from './store.js';

export const DATABASE_NAME = 'carve';
export const DATABASE_VERSION = 1;
export const DOCUMENT_STORE_NAME = 'documents';
/** Index on `savedAt`, used by `list` and `prune`. */
export const RECENCY_INDEX = 'savedAt';

/** How the store was obtained, so the UI can say "autosave is off" honestly. */
export interface OpenedStore {
  readonly store: DocumentStore;
  readonly persistent: boolean;
  /** Why persistence is unavailable, when it is. */
  readonly reason?: string;
}

export interface OpenOptions {
  /** Defaults to `globalThis.indexedDB`. Injected by the tests. */
  readonly factory?: IDBFactory;
  readonly databaseName?: string;
}

/**
 * Open the autosave database, or fall back to memory.
 *
 * Never rejects. A caller that wants to know whether autosave will survive a
 * reload reads `persistent`.
 */
export async function openDocumentStore(options: OpenOptions = {}): Promise<OpenedStore> {
  const factory = options.factory ?? globalThis.indexedDB;
  if (!factory) {
    return {
      store: new MemoryDocumentStore(),
      persistent: false,
      reason: 'This browser exposes no IndexedDB. Autosave will not survive a reload.',
    };
  }

  try {
    const database = await openDatabase(factory, options.databaseName ?? DATABASE_NAME);
    return { store: new IndexedDbDocumentStore(database), persistent: true };
  } catch (error) {
    return {
      store: new MemoryDocumentStore(),
      persistent: false,
      reason: `Could not open the autosave database (${messageOf(error)}). Autosave will not survive a reload.`,
    };
  }
}

export class IndexedDbDocumentStore implements DocumentStore {
  readonly #database: IDBDatabase;

  constructor(database: IDBDatabase) {
    this.#database = database;
  }

  async put(record: StoredDocument): Promise<void> {
    const transaction = this.#database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
    const done = settled(transaction);
    transaction.objectStore(DOCUMENT_STORE_NAME).put(record);
    await done;
  }

  async get(id: string): Promise<StoredDocument | null> {
    const transaction = this.#database.transaction(DOCUMENT_STORE_NAME, 'readonly');
    const record = await request<StoredDocument | undefined>(
      transaction.objectStore(DOCUMENT_STORE_NAME).get(id),
    );
    return record ?? null;
  }

  async list(): Promise<readonly DocumentSummary[]> {
    const transaction = this.#database.transaction(DOCUMENT_STORE_NAME, 'readonly');
    const records = await request<StoredDocument[]>(
      transaction.objectStore(DOCUMENT_STORE_NAME).index(RECENCY_INDEX).getAll(),
    );
    // The index orders ascending; the list is newest first. Sorting the
    // summaries rather than reversing the records keeps the tie-break in one
    // place — see `byRecency`.
    return records.map(summarize).sort(byRecency);
  }

  async delete(id: string): Promise<void> {
    const transaction = this.#database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
    const done = settled(transaction);
    transaction.objectStore(DOCUMENT_STORE_NAME).delete(id);
    await done;
  }

  async prune(limit: number): Promise<readonly string[]> {
    const summaries = await this.list();
    const doomed = summaries.slice(Math.max(0, limit)).map((entry) => entry.id);
    if (doomed.length === 0) return doomed;

    const transaction = this.#database.transaction(DOCUMENT_STORE_NAME, 'readwrite');
    const done = settled(transaction);
    const store = transaction.objectStore(DOCUMENT_STORE_NAME);
    for (const id of doomed) store.delete(id);
    await done;
    return doomed;
  }

  close(): void {
    this.#database.close();
  }
}

function openDatabase(factory: IDBFactory, name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = factory.open(name, DATABASE_VERSION);
    open.onupgradeneeded = () => {
      const database = open.result;
      if (!database.objectStoreNames.contains(DOCUMENT_STORE_NAME)) {
        const store = database.createObjectStore(DOCUMENT_STORE_NAME, { keyPath: 'id' });
        store.createIndex(RECENCY_INDEX, 'savedAt');
      }
    };
    open.onsuccess = () => {
      const database = open.result;
      // Another tab upgrading the schema would otherwise leave this connection
      // holding a version that no longer exists, and every later transaction
      // would throw. Closing is the documented response.
      database.onversionchange = () => database.close();
      resolve(database);
    };
    open.onerror = () => reject(errorOf(open, 'open the database'));
    open.onblocked = () =>
      reject(new Error('The autosave database is blocked by another tab holding an old version'));
  });
}

/** One promise wrapper for one IndexedDB request. See the file header. */
function request<T>(source: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    source.onsuccess = () => resolve(source.result as T);
    source.onerror = () => reject(errorOf(source, 'read from the database'));
  });
}

/**
 * Resolve when the transaction commits.
 *
 * Writes are awaited on the *transaction*, not on the request: a `put` reports
 * success as soon as it is queued, and the durability an autosave is claiming
 * only exists once the transaction has committed. Awaiting the request would
 * make "saved" mean "about to be saved", which is precisely the distinction
 * that matters when the tab is closing.
 */
function settled(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(errorOf(transaction, 'write to the database'));
    transaction.onabort = () => reject(errorOf(transaction, 'write to the database'));
  });
}

function errorOf(source: { error?: DOMException | null }, what: string): Error {
  const detail = source.error ? `: ${source.error.name} ${source.error.message}` : '';
  return new Error(`Could not ${what}${detail}`);
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
