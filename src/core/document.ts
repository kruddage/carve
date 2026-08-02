/**
 * `CarveDocument` — the spine. Store, history, gestures, change notification
 * and selection, wired together behind one object.
 *
 * Everything else in the project is a client of this: desktop gizmos, hand
 * tracking, the wrist menu, the CSG evaluator, save/load. It knows nothing
 * about any of them. That asymmetry is the "one document, two frontends" claim
 * from issue #1 made structural — and it is enforced by the lint boundary in
 * eslint.config.js, not by anyone remembering.
 *
 * ## Change notification is granular on purpose
 *
 * Listeners receive the ids that actually changed *and* the invalidation set:
 * those nodes plus every ancestor, deepest first. Ancestors are included
 * because a boolean's result depends on its children — move a cylinder and the
 * subtract above it is stale even though nothing wrote to the subtract. The
 * set is deepest-first because that is evaluation order for the kernel in #6:
 * re-evaluate the leaf, then the boolean that consumes it.
 *
 * A single "something changed" event would be one line of code here and a
 * full-tree re-evaluation per frame of a drag there. The whole reason for the
 * parent index in `store.ts` is to make this set cheap.
 *
 * ## Gestures
 *
 * ```ts
 * const drag = doc.beginGesture('grab');
 * drag.dispatch(setTransform(nodeId, poseThisFrame));   // 72 times a second
 * drag.commit();                                        // …one undo entry
 * // or, when hand tracking drops the hand mid-drag:
 * drag.cancel();                                        // document restored,
 * //                                                       history untouched
 * ```
 */

import {
  CompositeCommand,
  InsertNodeCommand,
  MoveNodeCommand,
  RemoveNodeCommand,
  RenameNodeCommand,
  ReplaceParametersCommand,
  SetBooleanOpCommand,
  SetParametersCommand,
  SetTransformCommand,
  type Command,
} from './commands.js';
import { History, type HistoryEntry, type HistoryMark } from './history.js';
import { IDENTITY_MATRIX, multiplyMatrices, trsToMatrix, type Mat4, type Trs } from './math.js';
import {
  createNodeId,
  groupNode,
  type BooleanOp,
  type CarveNode,
  type ContainerNode,
  type NodeBundle,
  type NodeId,
} from './nodes.js';
import { DocumentError, NodeStore } from './store.js';

export type ChangeSource = 'command' | 'undo' | 'redo' | 'gesture-commit' | 'gesture-cancel';
export type GesturePhase = 'update' | 'commit' | 'cancel';

export interface DocumentChange {
  readonly source: ChangeSource;
  /** The command's label, for an undo menu or a status line. */
  readonly label: string;
  /**
   * Nodes whose own content or child list changed. May contain ids that no
   * longer exist — a delete reports the node it removed — which is what a
   * cache keyed by node id needs in order to evict.
   */
  readonly changed: readonly NodeId[];
  /** `changed` plus every ancestor, deepest first: the re-evaluation order. */
  readonly invalidated: readonly NodeId[];
  readonly gestureId: string | null;
  readonly gesturePhase: GesturePhase | null;
}

export type ChangeListener = (change: DocumentChange) => void;
export type SelectionListener = (selection: readonly NodeId[]) => void;

/**
 * A begin/update/commit/cancel bracket around a stream of edits.
 *
 * Handed out by `beginGesture` rather than being a pair of document methods so
 * that an input adapter holds the thing it is allowed to write through, and so
 * that "is this gesture still live" is a property of that object instead of
 * ambient document state that two adapters could disagree about.
 */
export interface Gesture {
  readonly id: string;
  readonly active: boolean;
  dispatch(command: Command): DocumentChange;
  /** Close the gesture, keeping its (coalesced) entry in the history. */
  commit(): void;
  /** Undo everything the gesture did and erase it from the history. */
  cancel(): void;
}

export interface DocumentOptions {
  /** Root node. Defaults to an empty group named "Document". */
  readonly root?: ContainerNode;
  readonly historyLimit?: number;
}

export class CarveDocument {
  readonly #store: NodeStore;
  readonly #history: History;
  readonly #listeners = new Set<ChangeListener>();
  readonly #selectionListeners = new Set<SelectionListener>();
  #selection: NodeId[] = [];
  #gesture: ActiveGesture | null = null;
  #gestureCounter = 0;

  private constructor(store: NodeStore, historyLimit: number) {
    this.#store = store;
    this.#history = new History(historyLimit);
  }

  /** A new document containing just a root container. */
  static create(options: DocumentOptions = {}): CarveDocument {
    const root = options.root ?? groupNode({ name: 'Document' });
    return CarveDocument.fromBundle(
      { rootId: root.id, nodes: [root] },
      options.historyLimit === undefined ? {} : { historyLimit: options.historyLimit },
    );
  }

  /** Rebuild a document from a snapshot. Used by `deserialize`. */
  static fromBundle(
    bundle: NodeBundle,
    options: { readonly historyLimit?: number } = {},
  ): CarveDocument {
    return new CarveDocument(new NodeStore(bundle), options.historyLimit ?? 500);
  }

  // --- Reading ------------------------------------------------------------

  get rootId(): NodeId {
    return this.#store.rootId;
  }

  get size(): number {
    return this.#store.size;
  }

  has(id: NodeId): boolean {
    return this.#store.has(id);
  }

  get(id: NodeId): CarveNode | undefined {
    return this.#store.get(id);
  }

  expect(id: NodeId): CarveNode {
    return this.#store.expect(id);
  }

  childrenOf(id: NodeId): readonly NodeId[] {
    return this.#store.childrenOf(id);
  }

  parentOf(id: NodeId): NodeId | null {
    return this.#store.parentOf(id);
  }

  ancestorsOf(id: NodeId): readonly NodeId[] {
    return this.#store.ancestorsOf(id);
  }

  descendantsOf(id: NodeId): readonly NodeId[] {
    return this.#store.descendantsOf(id);
  }

  /** Position within the parent's child list; `-1` for the root. */
  indexOf(id: NodeId): number {
    return this.#store.indexOf(id);
  }

  /** Depth-first document order from `from` (default: the root). */
  order(from?: NodeId): readonly NodeId[] {
    return from === undefined ? this.#store.order() : this.#store.order(from);
  }

  /** Snapshot a subtree as detached data. */
  bundle(id: NodeId = this.rootId): NodeBundle {
    return this.#store.bundle(id);
  }

  /**
   * World matrix of a node: every ancestor transform, outermost first.
   *
   * Matrices rather than stacked `Trs` values because a non-uniform scale above
   * a rotation is a shear and has no TRS form — see `composeTrs` in math.ts.
   * The kernel and the gizmos both need the honest answer.
   */
  worldMatrix(id: NodeId): Mat4 {
    const chain = [id, ...this.#store.ancestorsOf(id)].reverse();
    let matrix: Mat4 = IDENTITY_MATRIX;
    for (const nodeId of chain) {
      const node = this.#store.expect(nodeId);
      if (node.kind === 'transform') matrix = multiplyMatrices(matrix, trsToMatrix(node.transform));
    }
    return matrix;
  }

  // --- Writing ------------------------------------------------------------

  /**
   * Apply a command and record it.
   *
   * Dispatching directly while a gesture is open is rejected: a gizmo edit
   * landing in the middle of a hand-drag would sit between the drag's first
   * inverse and its latest command, and undo would then restore a state that
   * never existed. Route it through the gesture, or finish the gesture first.
   */
  dispatch(command: Command): DocumentChange {
    if (this.#gesture) {
      throw new DocumentError(
        `Cannot dispatch ${command.kind} directly: gesture ${this.#gesture.id} is open. ` +
          'Dispatch through the gesture, or commit/cancel it first.',
      );
    }
    return this.#applyAndRecord(command, null, 'command');
  }

  beginGesture(name = 'gesture'): Gesture {
    if (this.#gesture) {
      throw new DocumentError(
        `Gesture ${this.#gesture.id} is already open; commit or cancel it first`,
      );
    }
    this.#gestureCounter += 1;
    const gesture = new ActiveGesture(
      this,
      `${name}-${this.#gestureCounter}`,
      this.#history.mark(),
    );
    this.#gesture = gesture;
    return gesture;
  }

  get activeGestureId(): string | null {
    return this.#gesture?.id ?? null;
  }

  get canUndo(): boolean {
    return this.#history.canUndo;
  }

  get canRedo(): boolean {
    return this.#history.canRedo;
  }

  get undoDepth(): number {
    return this.#history.depth;
  }

  get redoDepth(): number {
    return this.#history.redoDepth;
  }

  /** Undo entry labels, oldest first. */
  get undoLabels(): readonly string[] {
    return this.#history.labels;
  }

  /**
   * Undo one entry. Returns the change, or `null` if there was nothing to undo.
   *
   * Refuses while a gesture is open for the same reason `dispatch` does: the
   * open gesture's entry is still being merged into and is not a stable target.
   */
  undo(): DocumentChange | null {
    this.#assertNoGesture('undo');
    const entry = this.#history.popUndo();
    if (!entry) return null;

    const changed = entry.inverse.apply(this.#store);
    // The inverse of the inverse, captured against the state we just restored:
    // that is what redo has to re-apply.
    this.#history.pushRedo({
      command: entry.command,
      inverse: entry.inverse,
      mergeKey: entry.mergeKey,
      label: entry.label,
    });
    return this.#emit(changed, entry.label, 'undo', null, null);
  }

  redo(): DocumentChange | null {
    this.#assertNoGesture('redo');
    const entry = this.#history.popRedo();
    if (!entry) return null;

    const changed = entry.command.apply(this.#store);
    this.#history.pushUndo({
      command: entry.command,
      inverse: entry.command.invert(),
      mergeKey: entry.mergeKey,
      label: entry.label,
    });
    return this.#emit(changed, entry.label, 'redo', null, null);
  }

  /** Forget the history without touching the tree. Used after load. */
  clearHistory(): void {
    this.#assertNoGesture('clearHistory');
    this.#history.clear();
  }

  // --- Selection ----------------------------------------------------------

  /**
   * Selection is by id and is *not* undoable.
   *
   * Making it undoable is a common instinct and a bad experience: undo after a
   * delete should restore the node, not first restore what was highlighted. It
   * is kept in the document rather than in the UI because the desktop outliner
   * and the headset both need it, and it must survive switching between them.
   */
  get selection(): readonly NodeId[] {
    return this.#selection;
  }

  setSelection(ids: Iterable<NodeId>): void {
    const next = [...new Set(ids)].filter((id) => this.#store.has(id));
    const unchanged =
      next.length === this.#selection.length && next.every((id, i) => id === this.#selection[i]);
    if (unchanged) return;
    this.#selection = next;
    for (const listener of this.#selectionListeners) listener(this.#selection);
  }

  clearSelection(): void {
    this.setSelection([]);
  }

  isSelected(id: NodeId): boolean {
    return this.#selection.includes(id);
  }

  subscribe(listener: ChangeListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  subscribeSelection(listener: SelectionListener): () => void {
    this.#selectionListeners.add(listener);
    return () => this.#selectionListeners.delete(listener);
  }

  // --- Internals used by ActiveGesture ------------------------------------

  /** @internal */
  applyWithinGesture(gesture: ActiveGesture, command: Command): DocumentChange {
    if (this.#gesture !== gesture) {
      throw new DocumentError(`Gesture ${gesture.id} is no longer open`);
    }
    return this.#applyAndRecord(command, gesture, 'command');
  }

  /** @internal */
  commitGesture(gesture: ActiveGesture): void {
    if (this.#gesture !== gesture) throw new DocumentError(`Gesture ${gesture.id} is not open`);
    this.#gesture = null;
    // A commit does not change the tree. It is still emitted, because it is the
    // signal the kernel waits for before spending a full-quality evaluation on
    // geometry that was being previewed at drag quality a frame ago.
    this.#emit([...gesture.touched], gesture.label, 'gesture-commit', gesture.id, 'commit');
  }

  /** @internal */
  cancelGesture(gesture: ActiveGesture): void {
    if (this.#gesture !== gesture) throw new DocumentError(`Gesture ${gesture.id} is not open`);
    this.#gesture = null;

    const changed = new Set<NodeId>();
    for (const entry of this.#history.rewindTo(gesture.mark)) {
      for (const id of entry.inverse.apply(this.#store)) changed.add(id);
    }
    // Nodes the gesture touched are reported even when the rewind restored them
    // to their previous value: a listener that cached a mid-drag preview keyed
    // by node id has to be told to drop it.
    for (const id of gesture.touched) changed.add(id);
    this.#emit([...changed], gesture.label, 'gesture-cancel', gesture.id, 'cancel');
  }

  // --- Private ------------------------------------------------------------

  #applyAndRecord(
    command: Command,
    gesture: ActiveGesture | null,
    source: ChangeSource,
  ): DocumentChange {
    const changed = command.apply(this.#store);
    const inverse = command.invert();
    const mergeKey =
      gesture && command.mergeScope !== null ? `${gesture.id}|${command.mergeScope}` : null;

    const entry: HistoryEntry = { command, inverse, mergeKey, label: command.label };
    this.#history.record(entry);

    if (gesture) {
      for (const id of changed) gesture.touched.add(id);
      gesture.label = command.label;
    }

    // A delete can orphan the selection; a selection holding ids that are gone
    // is how an outliner ends up highlighting nothing and a gizmo ends up
    // dragging a node the document no longer has.
    this.#pruneSelection();

    return this.#emit(
      changed,
      command.label,
      source,
      gesture?.id ?? null,
      gesture ? 'update' : null,
    );
  }

  #pruneSelection(): void {
    if (this.#selection.every((id) => this.#store.has(id))) return;
    this.setSelection(this.#selection.filter((id) => this.#store.has(id)));
  }

  #assertNoGesture(what: string): void {
    if (this.#gesture) {
      throw new DocumentError(`Cannot ${what} while gesture ${this.#gesture.id} is open`);
    }
  }

  #emit(
    changed: readonly NodeId[],
    label: string,
    source: ChangeSource,
    gestureId: string | null,
    gesturePhase: GesturePhase | null,
  ): DocumentChange {
    const change: DocumentChange = {
      source,
      label,
      changed,
      invalidated: this.#invalidationSet(changed),
      gestureId,
      gesturePhase,
    };
    for (const listener of this.#listeners) listener(change);
    return change;
  }

  /**
   * `changed` plus every ancestor, ordered deepest first.
   *
   * Deepest-first is evaluation order: a boolean cannot be re-evaluated before
   * the child that invalidated it. Ids that no longer exist are dropped here —
   * they still appear in `changed` so caches can evict them, but a deleted node
   * has nothing to re-evaluate.
   */
  #invalidationSet(changed: readonly NodeId[]): readonly NodeId[] {
    const depths = new Map<NodeId, number>();
    for (const id of changed) {
      if (!this.#store.has(id)) continue;
      const chain = [id, ...this.#store.ancestorsOf(id)];
      // The chain runs child → root, so its index is depth from the node: the
      // node itself is deepest and the root is shallowest.
      let depth = chain.length - 1;
      for (const nodeId of chain) {
        const known = depths.get(nodeId);
        if (known === undefined || depth > known) depths.set(nodeId, depth);
        depth -= 1;
      }
    }
    return [...depths.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }
}

/** The concrete gesture handed to callers by `beginGesture`. */
class ActiveGesture implements Gesture {
  readonly touched = new Set<NodeId>();
  label = 'Edit';
  #active = true;

  constructor(
    private readonly document: CarveDocument,
    readonly id: string,
    readonly mark: HistoryMark,
  ) {}

  get active(): boolean {
    return this.#active;
  }

  dispatch(command: Command): DocumentChange {
    this.#assertActive('dispatch through');
    return this.document.applyWithinGesture(this, command);
  }

  commit(): void {
    this.#assertActive('commit');
    this.#active = false;
    this.document.commitGesture(this);
  }

  cancel(): void {
    this.#assertActive('cancel');
    this.#active = false;
    this.document.cancelGesture(this);
  }

  #assertActive(what: string): void {
    if (!this.#active) throw new DocumentError(`Cannot ${what} gesture ${this.id}: already closed`);
  }
}

// --- Command constructors -------------------------------------------------
//
// Small factories so callers write `doc.dispatch(setTransform(id, trs))` rather
// than `new SetTransformCommand(...)`. Input adapters should not have to know
// class names to move a box.

export function insertNode(
  node: CarveNode,
  parentId: NodeId,
  index = Number.MAX_SAFE_INTEGER,
): Command {
  return new InsertNodeCommand({ rootId: node.id, nodes: [node] }, parentId, index);
}

export function insertBundle(
  bundle: NodeBundle,
  parentId: NodeId,
  index = Number.MAX_SAFE_INTEGER,
): Command {
  return new InsertNodeCommand(bundle, parentId, index);
}

export function removeNode(nodeId: NodeId): Command {
  return new RemoveNodeCommand(nodeId);
}

export function moveNode(nodeId: NodeId, parentId: NodeId, index: number): Command {
  return new MoveNodeCommand(nodeId, parentId, index);
}

export function setTransform(nodeId: NodeId, transform: Trs): Command {
  return new SetTransformCommand(nodeId, transform);
}

export function setParameters(nodeId: NodeId, params: Readonly<Record<string, number>>): Command {
  return new SetParametersCommand(nodeId, params);
}

export function replaceParameters(
  nodeId: NodeId,
  params: Readonly<Record<string, number>>,
): Command {
  return new ReplaceParametersCommand(nodeId, params);
}

export function setBooleanOp(nodeId: NodeId, op: BooleanOp): Command {
  return new SetBooleanOpCommand(nodeId, op);
}

export function renameNode(nodeId: NodeId, name: string): Command {
  return new RenameNodeCommand(nodeId, name);
}

export function composite(commands: readonly Command[], label?: string): Command {
  return label === undefined
    ? new CompositeCommand(commands)
    : new CompositeCommand(commands, label);
}

/**
 * A primitive is spawned wrapped in its own transform node.
 *
 * A bare primitive has no placement — that is the point of keeping TRS in a
 * separate node kind — so every spawn needs somewhere for the first grab to
 * write. Doing it here means no input adapter has to remember, and it means
 * "the thing you grabbed" and "the thing you resize" are always the same two
 * nodes in the same relationship.
 */
export function placedPrimitive(
  primitive: CarveNode,
  transform: Trs,
  options: { readonly id?: NodeId; readonly name?: string } = {},
): NodeBundle {
  const wrapper: ContainerNode = {
    id: options.id ?? createNodeId(),
    kind: 'transform',
    name: options.name ?? primitive.name,
    transform,
    children: [primitive.id],
  };
  return { rootId: wrapper.id, nodes: [wrapper, primitive] };
}
