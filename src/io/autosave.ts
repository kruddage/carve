/**
 * Autosave: the policy half. `store.ts` decides where, this decides when.
 *
 * The requirement from #14 is one sentence — "a browser tab crash or a headset
 * battery death should not cost an hour" — and everything below follows from
 * taking it literally rather than from writing a save on every change.
 *
 * ## Nothing is written during a gesture
 *
 * A hand-drag emits a `DocumentChange` per pose. Writing each one would put
 * dozens of full documents per second through IndexedDB, on the thread the
 * frame loop is on, to persist intermediate states nobody wants recovered.
 * `gesturePhase === 'update'` changes only mark the document dirty; the write
 * is scheduled when the gesture commits. A gesture that is *cancelled* still
 * schedules one, because a cancel restores state that the last write may
 * predate.
 *
 * ## Trailing debounce, with a ceiling
 *
 * Edits arrive in bursts — nudge, nudge, nudge, think. A trailing debounce
 * collapses a burst into one write. On its own it would also mean a user who
 * never pauses is never saved, so a burst that keeps going is forced out after
 * `maxDelayMs` regardless. Both defaults are in seconds, not milliseconds: the
 * thing being protected against is losing an hour, not losing a keystroke.
 *
 * ## One write at a time
 *
 * A write in flight blocks the next one rather than racing it. Two overlapping
 * `put`s of the same key are not ordered by IndexedDB in any way this code can
 * rely on, so the older document could land last and become what recovery
 * finds. A change that arrives mid-write re-schedules instead.
 *
 * ## Failures are reported, never thrown
 *
 * This runs inside a document change listener. Throwing there would take out
 * whatever dispatched the command — a gizmo drag, an undo — to report that a
 * background save failed. `onError` gets it instead, and the document stays
 * dirty so the next tick tries again.
 */

import { deserialize, serialize, type CarveDocument } from '../core/index.js';

import type { DocumentStore, StoredDocument } from './store.js';

/** Trailing debounce. Long enough to collapse a burst of nudges into one write. */
export const DEFAULT_DEBOUNCE_MS = 2_000;
/** Longest a continuously-edited document goes unwritten. */
export const DEFAULT_MAX_DELAY_MS = 15_000;
/** How many documents the recent list keeps. */
export const DEFAULT_MAX_RECENT = 10;

type TimerHandle = ReturnType<typeof setTimeout>;

export interface AutosaveOptions {
  /** Slot id. Stable across a session; this is what `recover` reads back. */
  readonly id?: string;
  /** Defaults to the root node's name at save time, so a rename follows. */
  readonly name?: string;
  readonly debounceMs?: number;
  readonly maxDelayMs?: number;
  readonly maxRecent?: number;
  /** Injected in tests. Defaults to `Date.now`. */
  readonly now?: () => number;
  /** Injected in tests. Default to the global timer functions. */
  readonly setTimer?: (callback: () => void, ms: number) => TimerHandle;
  readonly clearTimer?: (handle: TimerHandle) => void;
  /** Called for every failed write. Defaults to `console.warn`. */
  readonly onError?: (error: unknown) => void;
  /** Called after every successful write. A "saved just now" indicator. */
  readonly onSave?: (record: StoredDocument) => void;
}

/**
 * A document id for a new autosave slot.
 *
 * Time-ordered prefix so the ids sort the way the documents do, which makes a
 * database dump readable while debugging and gives the recency index a sane
 * tie-break. Zero-padded to a fixed width, because base-36 numbers of different
 * lengths do *not* sort lexicographically — the property is the whole point of
 * the prefix, and it would be quietly untrue without the padding. Uniqueness
 * comes from the random suffix, not from the clock.
 */
export function createDocumentId(now: () => number = Date.now): string {
  const stamp = now().toString(36).padStart(9, '0');
  const random = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `doc-${stamp}-${random}`;
}

/** A stored record as a live document. Throws `DocumentFormatError` on a bad one. */
export function restore(record: StoredDocument): CarveDocument {
  return deserialize(record.document);
}

/**
 * The document to offer back after a crash: the newest autosave, or `null`.
 *
 * Deliberately returns the record rather than only the document, because the
 * question a recovery prompt asks is "restore *Bracket*, saved four minutes
 * ago?" and both halves of that come from the metadata.
 *
 * A record that fails to deserialize is skipped rather than thrown: one
 * corrupted autosave must not make an older, readable one unreachable. The
 * failure is reported through `onError` so it is not silent.
 */
export async function recoverLatest(
  store: DocumentStore,
  onError: (error: unknown, id: string) => void = () => {},
): Promise<{ record: StoredDocument; document: CarveDocument } | null> {
  for (const summary of await store.list()) {
    const record = await store.get(summary.id);
    if (!record) continue;
    try {
      return { record, document: restore(record) };
    } catch (error) {
      onError(error, summary.id);
    }
  }
  return null;
}

export class Autosave {
  readonly #document: CarveDocument;
  readonly #store: DocumentStore;
  readonly #options: Required<
    Omit<AutosaveOptions, 'id' | 'name' | 'onError' | 'onSave' | 'setTimer' | 'clearTimer'>
  >;
  readonly #id: string;
  readonly #name: string | undefined;
  readonly #setTimer: (callback: () => void, ms: number) => TimerHandle;
  readonly #clearTimer: (handle: TimerHandle) => void;
  readonly #onError: (error: unknown) => void;
  readonly #onSave: ((record: StoredDocument) => void) | undefined;

  #unsubscribe: (() => void) | null = null;
  #timer: TimerHandle | null = null;
  /** When the oldest unwritten change arrived. The `maxDelayMs` anchor. */
  #dirtySince: number | null = null;
  #writing: Promise<void> | null = null;
  #lastSavedAt: number | null = null;
  #stopped = false;

  private constructor(document: CarveDocument, store: DocumentStore, options: AutosaveOptions) {
    this.#document = document;
    this.#store = store;
    this.#options = {
      debounceMs: options.debounceMs ?? DEFAULT_DEBOUNCE_MS,
      maxDelayMs: options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
      maxRecent: options.maxRecent ?? DEFAULT_MAX_RECENT,
      now: options.now ?? Date.now,
    };
    this.#id = options.id ?? createDocumentId(this.#options.now);
    this.#name = options.name;
    this.#setTimer = options.setTimer ?? ((callback, ms) => setTimeout(callback, ms));
    this.#clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
    this.#onError =
      options.onError ??
      ((error) => {
        console.warn('Autosave failed; the document is still only in memory.', error);
      });
    this.#onSave = options.onSave;
  }

  /** Start autosaving `document` into `store`. */
  static attach(
    document: CarveDocument,
    store: DocumentStore,
    options: AutosaveOptions = {},
  ): Autosave {
    const autosave = new Autosave(document, store, options);
    autosave.#unsubscribe = document.subscribe((change) => {
      // See the gesture note in the file header: intermediate poses are not
      // states worth persisting, and the commit is a moment later.
      if (change.gesturePhase === 'update') {
        autosave.#markDirty();
        return;
      }
      autosave.#markDirty();
      autosave.#schedule();
    });
    return autosave;
  }

  get id(): string {
    return this.#id;
  }

  /** Epoch ms of the last successful write, or `null` if nothing is stored yet. */
  get lastSavedAt(): number | null {
    return this.#lastSavedAt;
  }

  /** Whether there are changes not yet written. */
  get dirty(): boolean {
    return this.#dirtySince !== null;
  }

  /**
   * Write now, if there is anything to write.
   *
   * The `pagehide` / `visibilitychange` path — see `browser.ts`. Also what a
   * test awaits instead of a timer. Resolves once the write has committed; a
   * failure resolves too, after `onError`, because a caller closing a tab has
   * nothing useful to do with a rejection.
   */
  async flush(): Promise<void> {
    this.#cancelTimer();
    if (this.#writing) await this.#writing;
    if (!this.dirty || this.#stopped) return;
    await this.#write();
  }

  /**
   * Stop listening. Does not flush — call `flush()` first if the pending state
   * matters, which is what closing a document should do.
   */
  stop(): void {
    this.#stopped = true;
    this.#cancelTimer();
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  }

  #markDirty(): void {
    this.#dirtySince ??= this.#options.now();
  }

  #schedule(): void {
    if (this.#stopped) return;
    const dirtySince = this.#dirtySince ?? this.#options.now();
    const elapsed = this.#options.now() - dirtySince;
    // The ceiling: a burst that never pauses still gets written. `delay` can
    // reach zero, which fires on the next tick rather than synchronously —
    // writing inside the change listener is what the file header rules out.
    const delay = Math.max(
      0,
      Math.min(this.#options.debounceMs, this.#options.maxDelayMs - elapsed),
    );

    this.#cancelTimer();
    this.#timer = this.#setTimer(() => {
      this.#timer = null;
      void this.#write();
    }, delay);
  }

  async #write(): Promise<void> {
    if (this.#writing) {
      // A write is already in flight. It will not include this change — it
      // serialized before it started — so re-schedule rather than dropping it.
      this.#schedule();
      return;
    }
    if (!this.dirty || this.#stopped) return;

    const savedAt = this.#options.now();
    const serialized = serialize(this.#document);
    const record: StoredDocument = {
      id: this.#id,
      name: this.#name ?? this.#document.expect(this.#document.rootId).name,
      savedAt,
      nodeCount: serialized.nodes.length,
      document: serialized,
    };
    // Cleared *before* the await, and restored on failure: a change that
    // arrives while this write is in flight must not be swallowed by the
    // success path clearing a flag it never set.
    this.#dirtySince = null;

    const write = (async () => {
      try {
        await this.#store.put(record);
        await this.#store.prune(this.#options.maxRecent);
        this.#lastSavedAt = savedAt;
        this.#onSave?.(record);
      } catch (error) {
        this.#dirtySince ??= savedAt;
        this.#onError(error);
      }
    })();

    this.#writing = write;
    try {
      await write;
    } finally {
      this.#writing = null;
    }
  }

  #cancelTimer(): void {
    if (this.#timer !== null) {
      this.#clearTimer(this.#timer);
      this.#timer = null;
    }
  }
}
