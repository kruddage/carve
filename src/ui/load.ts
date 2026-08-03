/**
 * Opening a file into the document that is already on screen.
 *
 * `deserialize` builds a **new** `CarveDocument`, and the obvious thing to do
 * with it is to swap it in. That turns out to be the expensive option: the
 * router, the autosave, the change subscriptions and the panels all hold the
 * old instance, so a swap means tearing down and rebuilding the wiring on every
 * file open — and anything that forgot to re-subscribe keeps working against a
 * document nobody can see, which is a bug that presents as "the outliner
 * stopped updating an hour ago".
 *
 * So the app keeps one document for its lifetime and *loads into* it: clear the
 * root, insert the loaded tree, take on its name. One composite command, then
 * `clearHistory()` — because a file open is not an edit and having it sit at
 * the bottom of the undo stack means Ctrl+Z eventually empties the document
 * with no warning.
 *
 * Node ids come across unchanged, which is what makes this safe: the removals
 * run before the inserts inside the same composite, so nothing can collide, and
 * ids stay stable across a save/open round trip the way `serialize.ts` intends.
 */

import {
  composite,
  insertBundle,
  removeNode,
  renameNode,
  type CarveDocument,
  type Command,
} from '../core/index.js';

/**
 * The command that makes `target` hold what `source` holds.
 *
 * Returns `null` when there is nothing to do — an empty document opened into an
 * empty document — so a caller does not dispatch a composite of zero commands
 * and put an entry in the history for it.
 */
export function loadCommand(target: CarveDocument, source: CarveDocument): Command | null {
  const commands: Command[] = [];

  for (const childId of [...target.childrenOf(target.rootId)]) {
    commands.push(removeNode(childId));
  }
  for (const childId of source.childrenOf(source.rootId)) {
    commands.push(insertBundle(source.bundle(childId), target.rootId));
  }

  const name = source.get(source.rootId)?.name;
  const currentName = target.get(target.rootId)?.name;
  if (name !== undefined && name !== currentName) {
    commands.push(renameNode(target.rootId, name));
  }

  return commands.length === 0 ? null : composite(commands, 'Open');
}

/**
 * Load `source` into `target`, leaving no undo entry behind.
 *
 * The history is cleared rather than the load being made undoable. "Undo the
 * file I just opened" is not a thing anyone means, and the state it would
 * restore — the previous document, already replaced on screen — is one nobody
 * can get back to any other way, so leaving it reachable by a stray Ctrl+Z is
 * the more surprising behaviour of the two.
 */
export function loadInto(target: CarveDocument, source: CarveDocument): void {
  const command = loadCommand(target, source);
  if (command) target.dispatch(command);
  target.clearHistory();
  target.clearSelection();
}
