/**
 * Commands: the only way anything in this project mutates the document.
 *
 * Not a style preference. Undo is the feature that decides whether a modeler
 * feels like a tool or a toy, and undo is only reliable if there is exactly one
 * path through which state changes. A gizmo drag, a hand-grab, a wrist-menu tap
 * and a file import all end up here, which is also why a scene built on a
 * headset opens on a desktop: they are the same edits.
 *
 * The contract, in three parts:
 *
 *   1. `apply(store)` performs the edit and **captures whatever it needs to
 *      undo itself**. Calling `invert()` before `apply()` throws — the previous
 *      value is not knowable at construction time, because the caller building
 *      a "set transform to X" command does not know what the transform was.
 *   2. `apply` returns the ids whose own content changed. The document turns
 *      that into an invalidation set by walking to the root; see
 *      `document.ts`. Returning "everything" here would be correct and would
 *      also make the kernel in #6 re-evaluate the whole tree per frame of a
 *      drag, so the return value is kept exact.
 *   3. `mergeScope` names the (node, property) pair a command writes. During a
 *      gesture, two commands with the same scope coalesce into one undo entry.
 *      A scope of `null` means "never coalesce" — every structural edit, since
 *      merging two inserts into one is meaningless.
 *
 * Commands are single-use per application in the sense that `apply` overwrites
 * the captured undo state each time. That is what makes redo work: redoing
 * re-applies the same object, which re-captures against the state it finds.
 */

import { type BooleanOp, type CarveNode, type NodeBundle, type NodeId } from './nodes.js';
import { DocumentError, type NodeStore } from './store.js';
import { type Trs } from './math.js';

export interface Command {
  /** Stable discriminant, for debugging and for the history label. */
  readonly kind: string;
  /** Human-readable, shown next to Undo in the UI. */
  readonly label: string;
  /**
   * `(node, property)` this command writes, or `null` if it must never merge.
   * The gesture id is added by the history; see `history.ts`.
   */
  readonly mergeScope: string | null;
  /** Perform the edit, capture the undo state, return the ids that changed. */
  apply(store: NodeStore): readonly NodeId[];
  /** The command that exactly undoes the last `apply`. Throws before one. */
  invert(): Command;
}

/** Shared "did you call apply first" plumbing. */
abstract class BaseCommand implements Command {
  abstract readonly kind: string;
  abstract readonly label: string;
  readonly mergeScope: string | null = null;

  abstract apply(store: NodeStore): readonly NodeId[];
  abstract invert(): Command;

  protected captured<T>(value: T | undefined, what: string): T {
    if (value === undefined) {
      throw new DocumentError(
        `${this.kind}.invert() called before apply(); there is no ${what} to restore`,
      );
    }
    return value;
  }
}

/**
 * Add a detached subtree under `parentId`.
 *
 * Takes a bundle rather than a single node so that "undo a delete" and "paste"
 * are the same command — a deleted boolean comes back with its whole subtree or
 * it does not come back.
 */
export class InsertNodeCommand extends BaseCommand {
  readonly kind = 'insert-node';
  readonly label: string;

  constructor(
    private readonly bundle: NodeBundle,
    private readonly parentId: NodeId,
    private readonly index: number,
  ) {
    super();
    this.label = 'Insert node';
  }

  apply(store: NodeStore): readonly NodeId[] {
    store.insertBundle(this.bundle, this.parentId, this.index);
    // The parent's child list changed, and the inserted subtree is new: both
    // need evaluating, and the parent is where the boolean that consumes it
    // lives.
    return [this.parentId, this.bundle.rootId];
  }

  invert(): Command {
    return new RemoveNodeCommand(this.bundle.rootId);
  }
}

/** Delete a subtree, remembering it and where it sat. */
export class RemoveNodeCommand extends BaseCommand {
  readonly kind = 'remove-node';
  readonly label = 'Delete node';

  #removed: NodeBundle | undefined;
  #parentId: NodeId | undefined;
  #index: number | undefined;

  constructor(private readonly nodeId: NodeId) {
    super();
  }

  apply(store: NodeStore): readonly NodeId[] {
    const parentId = store.parentOf(this.nodeId);
    if (parentId === null) throw new DocumentError('The document root cannot be removed');
    this.#parentId = parentId;
    this.#index = store.indexOf(this.nodeId);
    this.#removed = store.removeSubtree(this.nodeId);
    return [parentId];
  }

  invert(): Command {
    return new InsertNodeCommand(
      this.captured(this.#removed, 'removed subtree'),
      this.captured(this.#parentId, 'parent'),
      this.captured(this.#index, 'index'),
    );
  }

  /** The subtree this command took out, for callers that need to inspect it. */
  get removed(): NodeBundle | undefined {
    return this.#removed;
  }
}

/**
 * Re-parent and/or reorder. One command, because from the model's side those
 * are the same edit and the UI produces them from the same drag.
 *
 * Reordering matters beyond tidiness: `subtract` takes its first child as the
 * base, so moving a child from index 1 to index 0 changes the resulting solid.
 */
export class MoveNodeCommand extends BaseCommand {
  readonly kind = 'move-node';
  readonly label = 'Move node';

  #previousParentId: NodeId | undefined;
  #previousIndex: number | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly parentId: NodeId,
    private readonly index: number,
  ) {
    super();
  }

  apply(store: NodeStore): readonly NodeId[] {
    const previous = store.moveChild(this.nodeId, this.parentId, this.index);
    this.#previousParentId = previous.parentId;
    this.#previousIndex = previous.index;
    return previous.parentId === this.parentId
      ? [this.parentId]
      : [previous.parentId, this.parentId];
  }

  invert(): Command {
    return new MoveNodeCommand(
      this.nodeId,
      this.captured(this.#previousParentId, 'previous parent'),
      this.captured(this.#previousIndex, 'previous index'),
    );
  }
}

/**
 * Write a whole TRS onto a transform node.
 *
 * Whole, not per-component, because a two-hand transform changes translation,
 * rotation and scale together and three separate commands would give three
 * undo entries for one gesture. This is also the highest-frequency command in
 * the system — 72 per second per grabbed node — so it is the one whose merge
 * scope has to be right.
 */
export class SetTransformCommand extends BaseCommand {
  readonly kind = 'set-transform';
  readonly label = 'Transform';
  override readonly mergeScope: string;

  #previous: Trs | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly transform: Trs,
  ) {
    super();
    this.mergeScope = `${nodeId}#transform`;
  }

  apply(store: NodeStore): readonly NodeId[] {
    const node = store.expect(this.nodeId);
    if (node.kind !== 'transform') {
      throw new DocumentError(`Node ${this.nodeId} is a ${node.kind}, not a transform`);
    }
    this.#previous = node.transform;
    store.replace({ ...node, transform: this.transform });
    return [this.nodeId];
  }

  invert(): Command {
    return new SetTransformCommand(this.nodeId, this.captured(this.#previous, 'transform'));
  }
}

/**
 * Patch primitive parameters. Keys not mentioned are left alone, so an
 * inspector field can send `{ radius }` without knowing the rest of the schema
 * (which is #7a's problem, not this file's).
 *
 * The merge scope includes the key set, so dragging the radius slider and then
 * the height slider produces two undo entries rather than one — matching what
 * the user did, which is two adjustments.
 */
export class SetParametersCommand extends BaseCommand {
  readonly kind = 'set-parameters';
  readonly label = 'Edit parameters';
  override readonly mergeScope: string;

  #previous: Readonly<Record<string, number>> | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly params: Readonly<Record<string, number>>,
  ) {
    super();
    this.mergeScope = `${nodeId}#params:${Object.keys(params).sort().join(',')}`;
  }

  apply(store: NodeStore): readonly NodeId[] {
    const node = store.expect(this.nodeId);
    if (node.kind !== 'primitive') {
      throw new DocumentError(`Node ${this.nodeId} is a ${node.kind}, not a primitive`);
    }
    this.#previous = node.params;
    store.replace({ ...node, params: { ...node.params, ...this.params } });
    return [this.nodeId];
  }

  invert(): Command {
    // Restores the whole map, not just the touched keys: a patch that *adds* a
    // key cannot be undone by patching, only by replacing.
    return new ReplaceParametersCommand(this.nodeId, this.captured(this.#previous, 'parameters'));
  }
}

/** Set the full parameter map. The inverse of a patch, and useful on its own. */
export class ReplaceParametersCommand extends BaseCommand {
  readonly kind = 'replace-parameters';
  readonly label = 'Edit parameters';

  #previous: Readonly<Record<string, number>> | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly params: Readonly<Record<string, number>>,
  ) {
    super();
  }

  apply(store: NodeStore): readonly NodeId[] {
    const node = store.expect(this.nodeId);
    if (node.kind !== 'primitive') {
      throw new DocumentError(`Node ${this.nodeId} is a ${node.kind}, not a primitive`);
    }
    this.#previous = node.params;
    store.replace({ ...node, params: { ...this.params } });
    return [this.nodeId];
  }

  invert(): Command {
    return new ReplaceParametersCommand(this.nodeId, this.captured(this.#previous, 'parameters'));
  }
}

/** Switch a boolean node between union / subtract / intersect. */
export class SetBooleanOpCommand extends BaseCommand {
  readonly kind = 'set-boolean-op';
  readonly label = 'Change boolean';

  #previous: BooleanOp | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly op: BooleanOp,
  ) {
    super();
  }

  apply(store: NodeStore): readonly NodeId[] {
    const node = store.expect(this.nodeId);
    if (node.kind !== 'boolean') {
      throw new DocumentError(`Node ${this.nodeId} is a ${node.kind}, not a boolean`);
    }
    this.#previous = node.op;
    store.replace({ ...node, op: this.op });
    return [this.nodeId];
  }

  invert(): Command {
    return new SetBooleanOpCommand(this.nodeId, this.captured(this.#previous, 'operation'));
  }
}

/**
 * Rename. Coalescable, so typing in the outliner is one undo entry per edit
 * session rather than one per keystroke — but only inside a gesture, and a
 * text field that opens a gesture on focus is the natural way to drive it.
 */
export class RenameNodeCommand extends BaseCommand {
  readonly kind = 'rename-node';
  readonly label = 'Rename';
  override readonly mergeScope: string;

  #previous: string | undefined;

  constructor(
    private readonly nodeId: NodeId,
    private readonly name: string,
  ) {
    super();
    this.mergeScope = `${nodeId}#name`;
  }

  apply(store: NodeStore): readonly NodeId[] {
    const node = store.expect(this.nodeId);
    this.#previous = node.name;
    const renamed: CarveNode = { ...node, name: this.name };
    store.replace(renamed);
    return [this.nodeId];
  }

  invert(): Command {
    return new RenameNodeCommand(this.nodeId, this.captured(this.#previous, 'name'));
  }
}

/**
 * Several edits that undo as one.
 *
 * "Subtract B from A" is really: create a boolean node, move A into it, move B
 * into it. One user action, one undo entry. Children are applied in order and
 * inverted in reverse, which is the only ordering under which the inverses see
 * the state they were captured against.
 */
export class CompositeCommand extends BaseCommand {
  readonly kind = 'composite';
  readonly label: string;

  #applied: Command[] | undefined;

  constructor(
    private readonly commands: readonly Command[],
    label = 'Edit',
  ) {
    super();
    this.label = label;
  }

  apply(store: NodeStore): readonly NodeId[] {
    const changed = new Set<NodeId>();
    const applied: Command[] = [];
    try {
      for (const command of this.commands) {
        for (const id of command.apply(store)) changed.add(id);
        applied.push(command);
      }
    } catch (error) {
      // Partial application is the one thing a composite must never leave
      // behind: roll back what did land before re-throwing, so the store's
      // "failed operations change nothing" contract survives composition.
      for (const command of [...applied].reverse()) command.invert().apply(store);
      throw error;
    }
    this.#applied = applied;
    return [...changed];
  }

  invert(): Command {
    const applied = this.captured(this.#applied, 'applied commands');
    return new CompositeCommand(
      [...applied].reverse().map((command) => command.invert()),
      this.label,
    );
  }
}

/**
 * The two tree queries `makeBooleanCommand` needs in order to decide where the
 * new boolean goes. Both `NodeStore` and `CarveDocument` satisfy it, which is
 * what keeps this file from having to import the document and make the
 * dependency circular.
 */
export interface TreeQuery {
  parentOf(id: NodeId): NodeId | null;
  indexOf(id: NodeId): number;
}

/**
 * Convenience: wrap `targetIds` in a new boolean node, in place.
 *
 * Lives here rather than in the UI because operand order is a modeling
 * decision, not a presentation one — the first id becomes the base of a
 * subtract — and because getting the sequence right (insert the boolean where
 * the first target was, *then* move the targets into it) is exactly the kind of
 * thing that should be written once.
 */
export function makeBooleanCommand(
  tree: TreeQuery,
  booleanNodeToInsert: CarveNode,
  targetIds: readonly NodeId[],
): Command {
  if (booleanNodeToInsert.kind !== 'boolean') {
    throw new DocumentError('makeBooleanCommand needs a boolean node');
  }
  if (booleanNodeToInsert.children.length > 0) {
    throw new DocumentError('The boolean node must start empty; its children come from targetIds');
  }
  const [first, ...rest] = targetIds;
  if (first === undefined || rest.length === 0) {
    throw new DocumentError('A boolean needs at least two operands');
  }

  const parentId = tree.parentOf(first);
  if (parentId === null) throw new DocumentError('Cannot apply a boolean to the document root');
  const index = tree.indexOf(first);

  const bundle: NodeBundle = { rootId: booleanNodeToInsert.id, nodes: [booleanNodeToInsert] };
  const commands: Command[] = [new InsertNodeCommand(bundle, parentId, index)];
  targetIds.forEach((id, position) => {
    commands.push(new MoveNodeCommand(id, booleanNodeToInsert.id, position));
  });
  return new CompositeCommand(commands, `Apply ${booleanNodeToInsert.op}`);
}
