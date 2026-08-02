/**
 * The undo stack, and the coalescing policy that makes it usable in a headset.
 *
 * A history entry is a `(command, inverse)` pair. Undo applies the inverse and
 * moves the entry to the redo stack; redo re-applies the command and moves it
 * back. Nothing exotic — the interesting part is what does *not* become an
 * entry.
 *
 * ## Why coalescing is not an optimization
 *
 * A hand-grab emits a transform update every frame. At 72Hz, a two-second drag
 * is 144 edits. Without merging, "undo" walks back through the drag one frame
 * at a time and the user has to trigger it 144 times to get back to where they
 * started — which reads as *undo is broken*, not as *undo is granular*. So
 * commands that write the same `(node, property)` inside the same gesture
 * collapse into a single entry:
 *
 *   - the entry's **inverse** stays the one captured by the *first* command, so
 *     undo jumps back to before the drag began
 *   - the entry's **command** is replaced by the *latest* one, so redo jumps
 *     forward to the end state
 *   - the frames in between are discarded; nothing needs them
 *
 * The gesture id is part of the merge key, so two separate drags of the same
 * node never merge into each other no matter how quickly they follow. No
 * timers, no debounce windows: gesture lifecycle is explicit, and input
 * adapters already know when a pinch starts and ends.
 *
 * ## Why cancel is separate from undo
 *
 * Hand tracking loses the hand. It is not an edge case, it is Tuesday. A
 * cancelled gesture must leave the document exactly as it was *and* leave no
 * trace in the history — undoing after a lost-tracking drag should undo the
 * thing before it, not the drag that never happened. `rewindTo` does that:
 * hands back the entries to invert, drops them, and restores the redo stack
 * that the gesture's first edit cleared.
 */

import { type Command } from './commands.js';

export interface HistoryEntry {
  readonly command: Command;
  readonly inverse: Command;
  /** `${gestureId}|${mergeScope}`, or `null` for entries that never merge. */
  readonly mergeKey: string | null;
  readonly label: string;
}

/** A position in the history, taken before a gesture and rewound to on cancel. */
export interface HistoryMark {
  readonly depth: number;
  readonly redo: readonly HistoryEntry[];
}

export class History {
  #undo: HistoryEntry[] = [];
  #redo: HistoryEntry[] = [];
  /**
   * How many entries the limit has dropped off the bottom, ever.
   *
   * A `HistoryMark` cannot be a stack *length*: if the limit trims the oldest
   * entry while a gesture is open, the length after the gesture's edit is the
   * same number it was before, and a cancel would decide it had nothing to roll
   * back — leaving a lost-tracking drag applied. Marks are positions in a
   * monotonic count instead, which trimming does not disturb.
   */
  #dropped = 0;

  /**
   * Cap on undo depth.
   *
   * Bounded because entries hold removed subtrees by reference — an unbounded
   * stack means deleting a 200k-triangle subtree keeps it alive for the
   * session, and the headset is the machine with the least memory to spare.
   */
  constructor(private readonly limit = 500) {}

  get canUndo(): boolean {
    return this.#undo.length > 0;
  }

  get canRedo(): boolean {
    return this.#redo.length > 0;
  }

  get depth(): number {
    return this.#undo.length;
  }

  get redoDepth(): number {
    return this.#redo.length;
  }

  /** Labels of the undo stack, oldest first. Test and debug affordance. */
  get labels(): readonly string[] {
    return this.#undo.map((entry) => entry.label);
  }

  /**
   * Record an applied command, merging it into the previous entry when they
   * share a merge key. Returns true if it merged rather than pushing.
   */
  record(entry: HistoryEntry): boolean {
    this.#redo = [];

    const top = this.#undo[this.#undo.length - 1];
    if (entry.mergeKey !== null && top && top.mergeKey === entry.mergeKey) {
      this.#undo[this.#undo.length - 1] = {
        command: entry.command,
        inverse: top.inverse,
        mergeKey: top.mergeKey,
        label: top.label,
      };
      return true;
    }

    this.#undo.push(entry);
    if (this.#undo.length > this.limit) {
      this.#undo.shift();
      this.#dropped += 1;
    }
    return false;
  }

  /** Pop the newest entry for the caller to invert. */
  popUndo(): HistoryEntry | undefined {
    return this.#undo.pop();
  }

  /** Park an inverted entry on the redo stack. */
  pushRedo(entry: HistoryEntry): void {
    this.#redo.push(entry);
  }

  popRedo(): HistoryEntry | undefined {
    return this.#redo.pop();
  }

  /** Push an entry back without clearing redo — used when completing a redo. */
  pushUndo(entry: HistoryEntry): void {
    this.#undo.push(entry);
  }

  mark(): HistoryMark {
    return { depth: this.#position, redo: [...this.#redo] };
  }

  /** Entries recorded since the beginning of time, minus those undone. */
  get #position(): number {
    return this.#undo.length + this.#dropped;
  }

  /**
   * Drop everything recorded since `mark`, newest first, and restore the redo
   * stack as it was. The caller applies the returned inverses in order.
   */
  rewindTo(mark: HistoryMark): readonly HistoryEntry[] {
    const removed: HistoryEntry[] = [];
    while (this.#position > mark.depth && this.#undo.length > 0) {
      const entry = this.#undo.pop();
      if (entry) removed.push(entry);
    }
    this.#redo = [...mark.redo];
    return removed;
  }

  clear(): void {
    this.#undo = [];
    this.#redo = [];
    this.#dropped = 0;
  }
}
