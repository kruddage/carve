# The desktop UI

Implements [#9](https://github.com/kruddage/carve/issues/9). Lives in [`src/ui/`](../src/ui), with
the parts that draw in [`src/render/gizmo.ts`](../src/render/gizmo.ts) and
[`src/render/overlay.ts`](../src/render/overlay.ts).

This is the milestone where `/` stops being a coming-soon page. Everything before it was headless:
a document model with no screen, a kernel with no viewport, a renderer with nothing driving it, an
input vocabulary with no device attached. This layer is where those become an application you can
build a bracket in.

It is also the one [#1](https://github.com/kruddage/carve/issues/1) says has to be good on its own
terms. Its first done-when — open the URL on a laptop, build a bracket out of four primitives and
two subtractions with mouse and keyboard, save it, reload it, export an STL that measures correctly
in a slicer — is satisfiable with no headset anywhere in the room. That is deliberate, and it is why
this issue is a product rather than a checkpoint.

## Models and views

Every module here is one of two kinds.

**Models** are pure functions of the document plus view state. What rows the outliner has, whether a
drop is legal and where it lands, what a parameter field contains, which handle a ray hits, what a
drag means, which shortcut a keystroke fires. No DOM appears in any of them.

**Views** turn a model into elements and wire events back. They are thin on purpose: anything in a
view worth testing is in the wrong file.

The reason for the split is that Vitest runs with `environment: 'node'` and there is no jsdom
anywhere in this project. Without it, "outliner reparenting is undoable" and "an axis drag moves
along its axis" would be things somebody checks by hand in three browsers after every change — which
is to say, things that stop being true. With it, they are assertions in
[`test/ui-outliner.test.ts`](../test/ui-outliner.test.ts) and
[`test/ui-gizmo.test.ts`](../test/ui-gizmo.test.ts).

```
  view-state ─┐
  document  ──┼─► outliner-model ──► outliner
              ├─► inspector-model ─► inspector
              ├─► scene-bounds ────► viewport ──► render (canvas)
              ├─► gizmo-drag ──────┘
              └─► shortcuts ───────► app
```

## Where to start reading

| File                 | What it answers                                          |
| -------------------- | -------------------------------------------------------- |
| `view-state.ts`      | what the UI remembers that the document must not         |
| `outliner-model.ts`  | rows, operand order, and whether a drop is legal         |
| `inspector-model.ts` | fields from `ParameterSchema`; validate versus normalize |
| `scene-bounds.ts`    | what is clickable, and where the bounds come from        |
| `scene-bundle.ts`    | hiding a node, without touching the document             |
| `gizmo-drag.ts`      | handle hit tests, and drag → `TransformDelta`            |
| `shortcuts.ts`       | the one keyboard table                                   |
| `load.ts`            | opening a file into the document already on screen       |
| `viewport.ts`        | the canvas: camera, picking, gizmo, ghost, frame loop    |
| `app.ts`             | the composition root                                     |

## View state is not document state

A collapsed outliner row, a gizmo left in rotate mode, a hidden node: none of these has any meaning
in a headset and none belongs in a `.carve` file. #9 asks for the separation and `ViewState` is it.
Put `visible` on `CarveNode` instead and opening a document on the Quest starts restoring somebody's
laptop panel layout.

Hiding looks like the exception and is not. It does not edit the tree; it changes which subtree is
submitted for evaluation, through `visibleBundle`. Undo does not restore visibility, saving does not
record it, and a document opened in the headset shows everything — all three of which are what you
want, and none of which are true if it becomes a node field.

## One command path

Every structural edit is an `action` intent through one `IntentRouter`: the toolbar's buttons, the
keyboard shortcuts, and later [#12](https://github.com/kruddage/carve/issues/12)'s wrist menu. The
router is where a boolean's operand order, a delete's ancestor filtering and a spawn's select-after
are decided, and a second path would decide them again and differently.

The exceptions are edits with no headset equivalent — a rename, an outliner reparent, an inspector
parameter — which go through `dispatch` as plain commands. They are still commands, so undo covers
them; they are just not intents, because no gesture produces them and adding union members that no
adapter emits would weaken the vocabulary rather than strengthen it.

## Three things want the pointer

1. **The camera.** Middle-drag pans, right-drag orbits, the wheel dollies. None of these are
   intents — [`src/input/pointer.ts`](../src/input/pointer.ts) explains at length why "orbit the
   camera" cannot be in a vocabulary a headset also speaks — so they are wired straight to
   `CameraControls`, which was written expecting exactly that.
2. **The gizmo.** A primary press on a handle starts a constrained drag through `gizmo-drag.ts`.
3. **The document.** Anything else primary goes to the pointer adapter, which turns it into hover,
   select and free-drag intents.

`PointerAdapter.attach` is deliberately unused. Listener order would otherwise decide whether the
gizmo or the adapter saw a press first, and that is a property of the order two `addEventListener`
calls happen to run in. The viewport installs the listeners and calls the adapter's handlers itself,
which the adapter exposes for exactly this purpose.

## The gizmo, in two halves

`GIZMO_HANDLES` in `src/render/gizmo.ts` is plain data: an id, a mode, an axis and a box each, in a
space where the gizmo is one unit long. `GizmoOverlay` builds three.js objects from that table, and
`src/ui/gizmo-drag.ts` hit-tests against the same table. A handle you can see is therefore a handle
you can grab, and moving an arrow means editing one array.

Hit-testing the drawn meshes with a raycaster instead would put `THREE.Object3D` in the picker's
signature — which the renderer's public surface forbids for reasons written up in
[`docs/render.md`](render.md) — and would make "does clicking the X arrow start an X drag" a test
that needs a GPU.

Five of the six handle shapes are boxes and hit-test as boxes. A rotation ring cannot: its bounding
box is the whole disc, so a click anywhere near the centre would grab it. It gets a plane test plus
a radius band.

The gizmo's frame is the selected node's world position, plus its world rotation when the space
toggle says `local`. Its scale is always stripped: a gizmo that inherited scale would be three times
as long on a 3× part and its arrow tips would sit outside their own hit boxes.

### Scale is world-aligned, always

`TransformDelta.scale` is a world-axis diagonal — the router turns it into `makeTrs({ scale })` and
multiplies. A non-uniform scale about a _rotated_ axis is a shear, which has no TRS form at all;
`decomposeMatrix` documents the same hole, and so do glTF and three.js. So the scale gizmo ignores
the local/world toggle and stays world-aligned, where its arrows describe what will actually happen.

Rotated per-axis scaling needs a richer delta than the intent vocabulary has. That is #8's decision
to revisit, not something to fake here.

## Picking: bounds, not triangles

The renderer draws one evaluated solid for the whole document, so the triangles under the cursor
carry no node identity. [`src/input/pick.ts`](../src/input/pick.ts) says what to do about that:
register a `PickTarget` per node, where "bounds alone are enough to be pickable; triangles make it
exact". `scene-bounds.ts` registers bounds.

Exact per-node geometry would mean evaluating every node's own subtree rather than just the document
root: N kernel requests per edit instead of one, several times a second during a drag, for a hit
test that runs once per pointer move. Bounds cost one preview request per _distinct primitive
shape_, cached forever after — the same box parameters always produce the same box — and moving a
solid then costs nothing at all, because a transform change re-derives the boxes with matrix
arithmetic and touches no worker.

What that trades away, stated plainly: clicking through a hole cut by a subtract selects the solid
whose bounding box you clicked inside, because the box does not know about the hole. Per-node exact
geometry is the fix and it belongs with [#15](https://github.com/kruddage/carve/issues/15)'s budget,
where its cost can be measured, rather than here on the frame path where it cannot.

The bounds themselves come from the kernel, never from a formula in a UI file. A torus's extent is a
function of two radii and a cone's depends on which end is wider; that knowledge lives in
`src/kernel/solids.ts`, and re-deriving it here is the drift
[`test/primitives.test.ts`](../test/primitives.test.ts) fails the build over. `PrimitivePreview`
already reports `bounds` "before framing, in metres" for exactly this kind of caller, so
`PrimitiveBoundsCache` asks with `fit: 0` and keeps the answer.

One channel per **shape**, not per kind: `previewChannel(kind)` is right for a palette, where a new
thumbnail should displace the old one, and exactly wrong here, because two boxes with different
parameters would supersede each other and one would never get bounds.

The document root is never registered. `PickRegistry` resolves a hit to its outermost registered
ancestor, so registering the root would make every click select the root and nothing else would ever
be selectable.

## The ghost, and the rule it keeps

`src/kernel/index.ts` states it: **hand movement and kernel evaluation are never coupled.** Dragging
a primitive that feeds a boolean re-solves that boolean on every pose, and the result arrives
whenever it arrives.

So during a drag two things are on screen: the last completed evaluation, updating at whatever rate
the worker sustains, and a translucent ghost of the dragged subtree at its live transform, updating
every frame. #9 asks for this on desktop for the same reason
[#11](https://github.com/kruddage/carve/issues/11) asks for it in the headset — a large tree lags on
a laptop too.

The ghost's geometry is evaluated **once**, when the drag begins, on its own channel. A translate or
a rotate does not change the dragged subtree's own shape, only where it sits, so there is nothing to
re-evaluate however long the drag runs. The mesh comes back in the dragged node's parent space with
the node's start transform already baked in, so placing it at the live pose is

```
  ghost = parentWorld · localLive · localStart⁻¹
```

and the drag costs one kernel request in total.

## Units

Values are metres in the document and millimetres on screen, and no file in `src/ui/` writes
`* 1000`. Parameter fields go through `toDisplayValue` / `fromDisplayValue` / `formatParameter`;
the transform fields, which are not registry parameters and have no `ParameterSchema` to hand over,
divide by `PARAMETER_UNITS.length.perCanonical` and `PARAMETER_UNITS.angle.perCanonical` directly.
See [`docs/primitives.md`](primitives.md).

Rotation is shown as extrinsic-XYZ Euler degrees and read back the same way. That is lossy in the
usual manner and is still what the field has to be, because nobody types a quaternion. The document
keeps the quaternion; only the display derives from it.

## Validate on every keystroke, normalize only on commit

Two different operations, and #9 asks for both separately.

`validateParameters` reports without mutating: it runs on every keystroke and its output is the red
outline. `normalizeParameters` clamps, rounds and repairs relations: it runs when an edit is
committed, and its output is what gets dispatched.

Running normalize per keystroke is the failure the separation exists to prevent. A user typing `0.5`
types `0` first, the clamp rewrites it to the minimum, and the field fights back on every character.

A field drag is a gesture in exactly `CarveDocument.beginGesture`'s sense: a stream of
`setParameters` at pointer rate coalescing into one history entry. The gesture opens on the first
_movement_, not on the press — a press that turns out to be a click is how a field gets focused, and
an empty gesture opened around it would block undo for its duration.

## Opening a file

`deserialize` builds a new `CarveDocument`, and the obvious thing to do with it is to swap it in.
That turns out to be the expensive option: the router, the autosave, the subscriptions and the
panels all hold the old instance, so a swap means rebuilding the wiring on every open — and anything
that forgot to re-subscribe keeps working against a document nobody can see, which presents as "the
outliner stopped updating an hour ago".

So the app keeps one document for its lifetime and loads _into_ it: clear the root, insert the
loaded tree, take on its name, one composite command, then `clearHistory()`. Ids come across
unchanged; the removals run before the inserts inside the same composite, so nothing can collide.

The history is cleared rather than the load being made undoable. "Undo the file I just opened" is
not a thing anyone means, and the state it would restore is one nobody can reach any other way.

## Keyboard

One table, in `shortcuts.ts`, and the table is the feature. A `switch` on `event.key` works fine and
then the help overlay is written by hand, drifts within a release, and rebinding means rewriting the
switch. Here the overlay renders from the table, and
[`test/ui-shortcuts.test.ts`](../test/ui-shortcuts.test.ts) asserts properties of the table as a
whole: every id is bound, no keystroke resolves to two different actions, every binding resolves to
itself rather than being shadowed by an earlier one.

Matching is exact on every modifier, not "at least" — without that, `Ctrl+Z` and `Ctrl+Shift+Z` are
the same binding and redo shadows undo. `mod` means Ctrl on Windows and Linux and Command on macOS,
matched against `ctrlKey || metaKey`, because #9's last done-when names three browsers and two of
them are mostly used on a Mac.

Unmodified shortcuts do not fire inside a text field. Otherwise typing a radius of `2` jumps the
camera to the top view and typing a name containing an `s` switches the gizmo to scale. Shortcuts
carrying the platform modifier are let through, which is the rule the browser itself applies, and so
is Escape, which is how a half-typed value is abandoned.

`G`/`R`/`S` set the gizmo mode rather than starting a modal drag. Both conventions exist — Blender
starts a drag, every CAD package switches the gizmo — and this one is picked because #9 asks for
on-screen gizmos as the primary transform surface. A modal drag would mean two ways to move a solid,
with different snapping and different undo shapes, which is the divergence this project keeps
refusing everywhere else.

## Layout

A grid shell: toolbar, body, status bar, with the viewport the only element allowed to grow. Panels
are fixed-width columns.

Below 900px the inspector goes and the outliner narrows. With only one of them on screen the tree is
the one you cannot work without, because it is the only place the structure of a boolean is visible
at all. Below 640px both go and the viewport takes the window — which is the Quest 2D browser case,
where the page is a preview before entering the session rather than somewhere anyone models.

No framework, no virtual DOM, no diffing. The whole app is five panels; the outliner rebuilds itself
whole on every change, because a v1 CSG tree is tens of rows and it changes on a click rather than
on a frame. The two things that would break under a naive rebuild — an in-progress rename and the
scroll position — are handled explicitly.

## What is not here

- **Shading.** [#13](https://github.com/kruddage/carve/issues/13) owns materials, crease-aware
  outlines and real selection states. What is here is a bounding-box outline per selected node,
  which is legible and is not the same thing.
- **Multi-node transforms.** The intent vocabulary moves one node per gesture. The rest of a
  selection gets a box and no handles.
- **A performance budget.** [#15](https://github.com/kruddage/carve/issues/15) owns the numbers, the
  benchmark scene and the headless assertion in CI. The status bar's readout is the display half,
  and it landed here for the same reason #10 pulls the overlay forward: a budget with nothing
  showing the number is unevaluable.
- **3D thumbnails in the palette.** The palette uses the registry's SVG icons. Rotating 3D previews
  are #12's ask, where a flat icon at wrist distance genuinely does not read.
