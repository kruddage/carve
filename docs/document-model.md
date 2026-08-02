# The document model

Implements [#5](https://github.com/kruddage/carve/issues/5). Lives in [`src/core/`](../src/core).

The document model is the spine of the project: the CSG tree, the commands that mutate it, the
undo stack, and the on-disk format. Everything else — desktop gizmos, hand tracking, the wrist
menu, the CSG evaluator, save and export — is a client of it, and it is a client of nothing. That
asymmetry is what makes "a scene built on a Quest opens on a laptop" true rather than aspirational,
and it is enforced by the lint boundary in [`eslint.config.js`](../eslint.config.js) rather than by
anyone remembering.

Nothing in here touches a DOM, a renderer, or WebXR. The whole module runs under Vitest in Node, in
a Web Worker, and on a headset, unchanged.

## The tree

Non-destructive. A box is `{ width, height, depth }` forever, not twelve triangles the moment it is
created — meshes are derived by the kernel ([#6](https://github.com/kruddage/carve/issues/6)) and
thrown away when a parameter changes. Without that, "edit the radius of the cylinder you subtracted
an hour ago" stops being possible, which is the entire point of a CSG modeler.

| Kind        | Holds                     | Why it is its own kind                             |
| ----------- | ------------------------- | -------------------------------------------------- |
| `primitive` | shape type + parameters   | no placement, so a drag can never edit a dimension |
| `transform` | TRS + children            | where gizmos and hand-grabs write                  |
| `boolean`   | op + **ordered** children | `subtract` is not commutative; child 0 is the base |
| `group`     | children                  | organization with no geometric meaning             |

Nodes are immutable plain data in a flat `Map` keyed by a stable UUID, with a parallel parent
index. Children are referenced by id, never nested. Three things follow, and all three are load
bearing elsewhere: lookup by id is O(1) (selection, history and the outliner all address nodes by
id, never by index or path); re-parenting is two child-list edits rather than a subtree rewrite; and
"which subtrees are dirty" is a walk _up_ the parent index.

A primitive on its own has no placement, so `placedPrimitive()` wraps one in its own transform node.
Every spawn gets somewhere for the first grab to write, without any input adapter having to remember
to arrange it.

## Commands

Every mutation goes through a command object with `apply` / `invert`. Not a style preference: undo
is only reliable if there is exactly one path through which state changes, and it is also why the
same edits can arrive from a mouse, a controller, a pinch, or a file import.

```ts
const doc = CarveDocument.create();
doc.dispatch(insertBundle(placedPrimitive(box, makeTrs()), doc.rootId));
doc.dispatch(setParameters(box.id, { width: 0.3 }));
doc.undo();
```

`apply(store)` performs the edit and captures whatever it needs to undo itself — `invert()` before
`apply()` throws, because the previous value is not knowable when the command is constructed. It
returns the ids whose own content changed, which is what keeps invalidation exact.

`CompositeCommand` makes several edits undo as one. "Subtract B from A" is really _create a boolean,
move A into it, move B into it_: one user action, one undo entry. If a sub-command fails, the ones
that already landed are rolled back before the error propagates — a partially applied composite is
the one thing that would leave the tree in a state no undo entry describes.

## Coalescing, and why it is not an optimization

A hand-grab emits a transform update every frame. At 72Hz a two-second drag is 144 edits. Without
merging, undo walks back through the drag one frame at a time and the user has to trigger it 144
times to get back where they started — which reads as _undo is broken_, not as _undo is granular_.

Commands writing the same `(node, property)` **inside the same gesture** collapse into one entry:
the inverse stays the one captured by the first command, the forward command is replaced by the
latest, and the frames between are discarded. The gesture id is part of the merge key, so two
separate drags of the same node never merge into each other no matter how quickly they follow. No
timers and no debounce windows — input adapters already know when a pinch starts and ends.

Structural edits never coalesce. Merging two inserts into one means nothing.

## Gestures

```ts
const drag = doc.beginGesture('pinch-grab');
for (const pose of poses) drag.dispatch(setTransform(nodeId, pose));
drag.commit(); // one undo entry
// …or, when tracking drops the hand:
drag.cancel(); // document restored, history untouched
```

Cancel is separate from undo, and the difference matters: hand tracking losing the hand mid-drag is
not an edge case, it is Tuesday. A cancelled gesture rolls its edits back, drops its entries, and
restores the redo stack its first edit cleared — so undo afterwards targets the edit _before_ the
drag, not the drag that never happened.

While a gesture is open, direct `dispatch`, `undo` and `redo` are rejected. An unrelated edit
landing between a drag's first inverse and its latest command would make undo restore a state that
never existed.

## Change notification

Listeners get the ids that changed _and_ the invalidation set: those nodes plus every ancestor,
deepest first.

Ancestors are included because a boolean's result depends on its children — move a cylinder and the
subtract above it is stale even though nothing wrote to the subtract. Deepest-first is evaluation
order: re-evaluate the leaf, then the boolean that consumes it. Deleted ids appear in `changed` but
not in `invalidated`, because a cache keyed by node id needs to evict them and there is nothing left
to evaluate.

A single "something changed" event would be one line of code here and a full-tree re-evaluation per
frame of a drag in #6. Gesture updates carry `gesturePhase: 'update'`, and the `commit` event names
every node the gesture touched — enough for the kernel to preview at drag quality and spend a full
evaluation only once the hand lets go.

## Serialization

JSON, versioned from the first commit, with a migration hook that is empty at v1 and tested anyway
— an untested migration path is the same as not having one. Deserialization treats its input as
hostile: every field is checked, and a bad file raises `DocumentFormatError` naming what was wrong
rather than producing a half-built document. `deserialize(serialize(doc))` deep-equals `doc`, which
the test suite asserts on a canonicalized snapshot.

History is deliberately not serialized. An undo stack restored from a file would hold commands
captured against a store that no longer exists.

## What the tests hold down

Run with `npm test`.

| File                            | Holds down                                                           |
| ------------------------------- | -------------------------------------------------------------------- |
| `test/document-tree.test.ts`    | structure, invariants, invalidation sets, selection, world matrices  |
| `test/history-gestures.test.ts` | undo/redo per command kind, coalescing, gesture commit/cancel        |
| `test/serialize.test.ts`        | round trip, validation failures, the migration machinery             |
| `test/undo-fuzz.test.ts`        | ~3,800 random commands; undo and redo checked at every history depth |
| `test/math.test.ts`             | quaternion and matrix conventions, TRS composition and its limits    |

The fuzz test also asserts _what it generated_ — that it produced cancelled gestures, composites and
rejected illegal edits — because a generator that quietly stopped producing those would keep passing
while testing half of what it claims.

## Deliberately not here

Primitive parameter schemas, units and defaults are
[#7a](https://github.com/kruddage/carve/issues/7); `params` is an unvalidated bag of numbers until
then, and the model does not care what is in it. Mesh construction is #7b, evaluation and caching
are #6, and gizmo math beyond TRS composition belongs to
[#8](https://github.com/kruddage/carve/issues/8).
