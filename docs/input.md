# The input layer

Implements [#8](https://github.com/kruddage/carve/issues/8). Lives in [`src/input/`](../src/input).

This is the layer that makes "shared scene graph, two input layers" from
[#1](https://github.com/kruddage/carve/issues/1) real rather than aspirational. A mouse, a Quest
controller and a pinching hand are three very different things, and the only reason this project
does not become two modelers is that none of them is allowed to touch the document. They emit
**intents**; one router turns intents into commands; the commands are the ones `src/core/` already
had.

Adding a device is writing something that produces intents. It is not a change in `src/core/`, and
it is not a change in `src/ui/` — which is #8's second done-when, and which
[`test/input-adapters.test.ts`](../test/input-adapters.test.ts) asserts by inventing a whole new
adapter inside the test file.

```
  pointer / controller / hand / a replayed fixture
                    │  Intent
                    ▼
             IntentRouter ──► CarveDocument (commands, gestures, undo)
                    ▲
                    │  PickHit
             PickRegistry ◄── evaluated meshes and bounds (#6)
```

## The vocabulary

Seven intents, and that is the whole surface an adapter has to produce:

| Intent                                 | Means                                                     |
| -------------------------------------- | --------------------------------------------------------- |
| `hover(nodeId \| null)`                | the highlight follows the ray                             |
| `select(nodeId \| null, additive)`     | `null` clears; `additive` toggles                         |
| `transformBegin(nodeId, mode, pivot?)` | open a gesture — `translate`, `rotate`, `scale` or `grab` |
| `transformUpdate(delta)`               | where it has got to, **cumulative since begin**           |
| `transformCommit()`                    | keep it: one undo entry for the whole drag                |
| `transformCancel(reason)`              | put it back, leave no trace                               |
| `action(request)`                      | spawn, boolean, delete, undo, redo                        |

Three properties are load-bearing, and each constrains what may be added later.

**Intents are plain JSON.** No class instances, no typed arrays, no functions. A stream survives
`JSON.stringify` → file → `JSON.parse` → replay unchanged, which is what makes a hand gesture
testable without a headset. See _Replay_ below.

**Intents name nodes, never meshes.** Resolving a hit to a node happens in `pick.ts`, before an
intent exists, so every adapter gets the same answer to "what did I just click".

**Deltas are cumulative, not per-frame.** A per-frame delta has to be summed by the receiver, so one
dropped or duplicated intent corrupts the rest of the drag permanently and float error accumulates
over a 72Hz stream. Cumulative deltas are idempotent: the router recomputes the transform from the
pose captured at `transformBegin` every time, a dropped update is invisible by the next frame, and
cancel is "discard" rather than "un-apply".

## `transformCancel` is not an error path

Mouse input rarely cancels. Hand tracking cancels constantly — a hand leaving the camera frustum
mid-drag is Tuesday, not an edge case — and the document already models it: a cancelled gesture
rolls its edits back, drops its history entries, and restores the redo stack its first edit cleared.
Designing for it now costs one union member. Retrofitting it once the wrist menu exists would cost a
rewrite of every adapter.

The spatial adapter tolerates `graceFrames` (six, ≈83ms at 72Hz) of lost tracking before cancelling,
because a hand that flickers out for two frames has not gone anywhere. Past that it **cancels rather
than commits**: committing a transform whose last known position was mid-air is the behaviour that
makes people stop trusting a modeler, and it is not undoable in any way they would think to try.

## Picking, and what a click on a boolean means

The renderer draws one evaluated solid per document — see
[`src/render/scene-graph.ts`](../src/render/scene-graph.ts) — so the surface under the cursor is the
output of a boolean and its triangles carry no node identity at all. The mapping has to be explicit,
so it is a registry: whoever owns evaluated geometry registers a `PickTarget` per node, with a world
matrix, local bounds, and optionally the triangles. Bounds alone make a node pickable; triangles make
it exact. That split matches how the data actually arrives — one mesh for the boolean, cheap
per-operand bounds.

The policy, stated once so that no adapter gets to decide it:

- **A pick reports the outermost registered ancestor of whatever was hit.** Click the flat face a
  `subtract` left behind and you select the subtract, not the cylinder that cut it. The boolean is
  the thing that behaves like an object.
- **With `drillIn`, a pick reports the deepest registered target hit.** Alt-click on desktop; a
  second pinch inside an already-selected solid in the headset. It is how you get at the cylinder to
  edit its radius an hour later, which is the entire premise of a non-destructive tree. Drilling in
  cannot escape into a different solid behind the one under the cursor — the modifier changes how
  deep the pick goes, never what it went into.

A registration can outlive the node it came from: the renderer keeps drawing the last evaluation
until a fresh one lands, so for a frame or two after a delete there is pickable geometry for a node
the document no longer holds. That resolves to itself rather than throwing inside a hover.

There is no BVH. The bounding-box test rejects whole targets first, a pointer produces at most one
ray per frame, and [#15](https://github.com/kruddage/carve/issues/15) owns the budget that would say
this is too slow. An acceleration structure would have to be invalidated on every kernel result —
several times a second during a drag — for a cost nobody has measured.

## Snapping

Shared across adapters rather than owned by the desktop gizmos, because it is load-bearing for hand
tracking in a way it never is for a mouse: snapping does the work your unsteady hands will not. If it
lived in [#9](https://github.com/kruddage/carve/issues/9)'s gizmo code, the headset would grow a
second implementation with a second set of tolerances, and a part assembled in VR would not line up
when opened on a laptop.

Two mechanisms and one rule about which wins. Grid quantizes to a step (1mm by default — the
resolution of the thing being made, since this exports STL for a slicer). Features are the 8 corners,
12 edge midpoints and 6 face centres of another solid's bounds, in world space. **A feature in range
beats the grid**, because grid alignment is invisible and a corner you can see is what you were
aiming at.

Two limits, said out loud rather than discovered later:

- Feature points come from bounds, not from the evaluated mesh's real edges. On a cylinder the
  "corners" are the corners of the box around it. Good enough for aligning box-shaped parts and
  centring on faces; the honest fix needs edge data the kernel does not emit.
- Scale is deliberately not snapped. A grid step is a length and there is no length here to
  quantize — a factor of 1.37 on a 3mm feature and on a 300mm one are the same number and want
  different rounding. #9's inspector is where a dimension gets typed exactly.

## Where the transform math happens

Intents carry world-space deltas, because that is the only space an adapter can speak: a hand knows
where it is in the room, not where it is in some node's parent's coordinate system. The router
composes in matrix space and decomposes once:

```
newWorld = delta · startWorld
newLocal = parentWorld⁻¹ · newWorld
```

Doing it any other way — stacking `Trs` values, or converting the delta into parent space first —
either loses an ancestor's rotation or accumulates error every frame of a drag.

One case still cannot be represented, and it is the same one core's `composeTrs` documents: a
non-uniform scale above a rotation is a shear, and no TRS describes it. A node under a
non-uniformly scaled rotated parent will drift. glTF and three.js have the same hole.

## The router answers, it does not throw

Every `handle` call returns a `RouterOutcome`: `applied`, `ignored`, or `rejected` with a reason
from a closed list. A grab on a node with nowhere to write, a boolean with one operand, an undo
during a drag — all rejections, none exceptions. Adapters run inside a frame loop fed by hardware
that produces nonsense routinely (a hand-tracking frame carrying a node id from two evaluations ago
is normal), and an exception there takes the render loop down with it. `DocumentError` is caught and
becomes a rejection carrying its message; anything else is a bug in this layer and propagates.

A grab resolves to the picked node if it is a transform, otherwise the nearest transform above it.
It does not insert one: a structural edit inside a drag gesture is exactly what the document forbids,
and a cancelled drag would leave a node behind. `placedPrimitive` already gives every spawned
primitive a transform of its own, so the null case is a hand-assembled tree, and the honest answer
there is a `no-transform-target` rejection the UI can act on.

## Replay: testing a headset gesture in Node

`record.ts` wraps a sink and keeps what went through it. A recording is JSON — version, label, and a
list of `{ at, source, intent }` — and replaying it is a `for` loop, because intents carry no clock
and no device state. `at` is metadata: honouring timestamps on replay would make every test that
uses one slow and flaky in exchange for verifying nothing.

[`test/fixtures/pinch-drag.intents.json`](../test/fixtures/pinch-drag.intents.json) is a pinch,
a 20cm drag and a release, including two frames where tracking drops. Replaying it moves the solid
20cm and leaves exactly one undo entry, in Node, with no WebXR anywhere. Node ids are remapped on the
way in (`remapNodeIds`), because ids are UUIDs minted at spawn and a fixture names nodes from the
document it was recorded against.

That fixture is **synthetic** — produced by driving the spatial adapter with a scripted pose track in
[`test/support/input-fixture.ts`](../test/support/input-fixture.ts), not recorded off a Quest. The
format, the replay path and the drift check are what #8 owes; a genuine recording, with real jitter
and real dropped frames, belongs to [#11](https://github.com/kruddage/carve/issues/11) when there is
a hand-tracking adapter to record from. The test suite re-runs the track and compares it against the
committed file, so a fixture that stops describing what the adapter does fails rather than passing
quietly.

## What the tests hold down

Run with `npm test`.

| File                          | Holds down                                                               |
| ----------------------------- | ------------------------------------------------------------------------ |
| `test/input-geometry.test.ts` | ray/box/triangle/plane intersection, matrix inverse and decomposition    |
| `test/input-pick.test.ts`     | nearest-hit ordering, and the boolean/drill-in policy                    |
| `test/input-snap.test.ts`     | grid, rotation increments, features, and feature-beats-grid              |
| `test/input-router.test.ts`   | every intent, one-undo-entry drags, cancel, and each refusal             |
| `test/input-adapters.test.ts` | pointer and spatial state machines, WebXR reading, replay, a new adapter |

## Deliberately not here

Camera navigation. Orbit, pan and dolly are not intents: "orbit the camera" has no meaning in a
headset, where the camera is your head, so putting it in the union would create a member every XR
adapter must ignore. The pointer adapter claims the primary button and leaves middle-drag,
right-drag and wheel for #9 to wire straight to `CameraControls`, which
[`camera-rig.ts`](../src/render/camera-rig.ts) was written expecting.

Gizmo geometry and the outliner are #9. Hand tracking — pinch detection, two-hand transform — is
[#11](https://github.com/kruddage/carve/issues/11), and it is an adapter feeding `SpatialSample`s
into the state machine that already exists here, not a new interface.
