# The CSG kernel

`src/kernel/`. Turns a document subtree from [#5](https://github.com/kruddage/carve/issues/5) into
evaluated, manifold-guaranteed mesh geometry, off the main thread, incrementally.

This is [#6](https://github.com/kruddage/carve/issues/6), plus the thumbnail geometry of
[#7b](https://github.com/kruddage/carve/issues/7) — see [Previews](#previews-the-other-kind-of-work)
— which lives here because building a solid is mesh work and belongs on the same side of the worker
boundary as the booleans that consume it. #6 is the highest-fanout node on the roadmap —
[#9](https://github.com/kruddage/carve/issues/9),
[#11](https://github.com/kruddage/carve/issues/11),
[#13](https://github.com/kruddage/carve/issues/13) and
[#14a](https://github.com/kruddage/carve/issues/14) all wait on it — so the shape of the interface
matters as much as the geometry behind it.

## The one thing to understand first

**The kernel is never in the critical path of a frame.**

Moving a standalone solid is a matrix update and costs nothing. Dragging a cylinder _through a
plate to position a hole_ re-solves that boolean, and everything above it in the tree, on every
pose. At 72Hz in a headset there is no arrangement of faster booleans that makes that safe. So the
kernel is arranged not to be waited on:

- Evaluation during an active gesture is fire-and-forget. The renderer draws the most recent
  completed result and never waits for the next one.
- The dragged primitive renders as a translucent ghost at its live transform, at full frame rate,
  over the stale boolean result. The hand — or the mouse — always feels connected even when the
  solid is seconds behind.
- Re-evaluation runs at whatever rate the worker sustains. 30Hz on a small tree, 3Hz on a large
  one. Both are acceptable. A dropped frame is not.
- One final evaluation on `transformCommit`; that is the result that lands in the document.
- On `transformCancel`, pending work is discarded and the pre-gesture result stays on screen.

The rendering half of the ghost belongs to [#11](https://github.com/kruddage/carve/issues/11) for
hands and [#9](https://github.com/kruddage/carve/issues/9) for the mouse. It is needed in both, for
the same reason.

## Layout

| File          | What it decides                                                  |
| ------------- | ---------------------------------------------------------------- |
| `runtime.ts`  | loading `manifold-3d`, and which build of it                     |
| `solids.ts`   | primitive parameters → manifold solids, and the Z-up → Y-up seam |
| `mesh.ts`     | a solid's surface as the buffers #4 uploads                      |
| `hash.ts`     | the subtree fingerprint the cache rests on                       |
| `evaluate.ts` | the tree walk, the cache, and WASM memory ownership              |
| `preview.ts`  | thumbnail geometry, framed to a fixed size                       |
| `driver.ts`   | which request runs and which is abandoned before it starts       |
| `client.ts`   | the main-thread handle, and the never-apply-a-stale-result rule  |
| `protocol.ts` | the wire between the two                                         |
| `worker.ts`   | the entry point, which is only wiring                            |
| `spawn.ts`    | the one file that knows what a `Worker` is                       |

Everything except `worker.ts` and `spawn.ts` is importable and testable in Node under Vitest. That
split is deliberate: the rules that decide whether dragging feels connected are the ones most worth
having fast, deterministic tests for, and they do not need a browser to be true.

## Decision: the single-threaded `manifold-3d` build

The alternative is a threaded build, which needs `SharedArrayBuffer`, which needs cross-origin
isolation via COOP/COEP response headers, which GitHub Pages cannot set — so it would also need a
service worker synthesising them. **Use the single-threaded build.** Written down here so it is not
relitigated later:

**Threading does not pay at our mesh sizes.** Parallel booleans win on large meshes. The target is
~20 primitives and ~10 boolean ops, and a hard-surface bracket is hundreds to low-thousands of
triangles per solid. At that size thread coordination overhead lands on work that finishes in under
a millisecond, and the parallel path is frequently slower. A boolean big enough for threading to
help is one we would already be fixing with tessellation.

**The design already parallelises at a better granularity.** Subtree caching, cancellation and the
ghost preview each do more for perceived responsiveness than a 2× faster boolean would — and the
kernel is on its own Worker regardless, so the "don't block the UI" win is banked either way.

**On Quest it is arguably negative.** The XR2 Gen 2 is thermally constrained with asymmetric cores
and is simultaneously running the compositor and tracking stack at 72Hz. Spawning threads that
contend for those cores risks frame stability — the thing that matters — to speed up something
[#15](https://github.com/kruddage/carve/issues/15) explicitly excludes from the frame budget.

**The cost lands in the worst debugging environment we have.** The service-worker shim intercepts
every request, needs a reload dance on first load because the SW is not yet active, applies to the
probe page and every preview deploy too, and fails in ways that are painful to diagnose from inside
a headset over `adb`. Cross-origin isolation also means any cross-origin resource without CORP
headers stops loading, which is a constraint carried forever.

### If measurement says otherwise

Timings live in [`docs/perf.md`](./perf.md). If the target tree misses badly, escalate **in this
order** — threading is behind both:

1. **`draft` tessellation tier** — exists in the registry today
   ([#25](https://github.com/kruddage/carve/issues/25)), and is already the intended XR lever
2. **Cap on tree depth**
3. Threading

And if it ever genuinely matters: **the constraint is GitHub Pages, not the web.** Cloudflare
Pages, Netlify and Vercel can all set COOP/COEP directly. Changing host is a cleaner route to
threading than the shim, and that decision can be made later with a measurement in hand rather than
now on a guess. Deploy-side work belongs to [#16](https://github.com/kruddage/carve/issues/16).

## The subtree cache, and why there is no invalidation

Every node's result is stored under a **subtree hash**: a structural fingerprint over primitive kind
and normalised parameters, boolean op, child order, and transforms. Identical geometry, identical
key.

Editing a leaf changes that leaf's hash, and therefore every ancestor's hash, and therefore misses
the cache along exactly the path from the leaf to the root. Every sibling subtree still hashes the
same and hits. So there is no dirty flag, no invalidation pass, and no way for the cache to be
wrong about what changed.

Three consequences worth knowing:

- **A hit skips the walk, not just the boolean.** A cached subtree's children are never visited, so
  a deep untouched branch costs one map lookup regardless of its size.
- **Undo is usually free.** Stepping back to a previous parameter restores a previous hash, which
  is very often still resident.
- **Node identity is not in the hash.** Two identical boxes share one cache entry, so copying a
  bracket does not double the evaluation cost.

Parameters go through `normalizeParameters` and `parametersKey` from
[#25](https://github.com/kruddage/carve/issues/25) rather than being hashed raw. That is the half
that has to be right and is easy to get wrong: `{width: 1, height: 1}`, `{height: 1, width: 1}` and
`{width: 1}` with a defaulted height are the same box, and a raw `JSON.stringify` says all three
are different.

The hash is the structural string itself, not a digest of it. A digest would be shorter and would
introduce collisions — and a collision here means the viewport shows a stale mesh with no error
anywhere, in a system where nothing ever revisits the key to check.

### Eager, not lazy

`manifold-3d` booleans are deferred: `a.subtract(b)` builds a node in a CSG graph and does no work
until something asks for the result. Left alone, a whole evaluation collapses into one batched solve
at `getMesh()` — faster for a single evaluation from cold, and useless here, because nothing would
be memoised in the cached subtrees and every edit would pay for the entire tree again.

So each subtree is forced as it is built. Two consequences, both wanted: the cache actually caches
work, and emptiness and error status are known per node, so "this cut removed everything" is
attributable to the node that did it rather than noticed at the root with nothing to point at.

### WASM memory

A `Solid` is not garbage-collected. Ownership is carried in an explicit `fresh` flag rather than
inferred — `fresh` means "nobody owns this yet, cache it or delete it". Cache eviction is the only
place a solid is destroyed, it runs after a walk completes, and it never frees an entry that walk
touched. If the live tree alone exceeds capacity the cache overflows rather than breaking; a memory
ceiling is not worth a use-after-free.

## Scheduling: what gets thrown away

A drag produces a request per frame. A boolean takes tens of milliseconds. Run them all in order and
the mesh is progressively further behind the hand, unboundedly, for as long as the drag continues.
The queue is not a backlog to work through — it is a stack of answers to questions nobody is asking
any more.

So every request carries a **channel**, and the queue holds at most one request per channel. A newer
request displaces the older one outright, and the displaced one is reported as superseded rather
than dropped silently, so a caller awaiting it can settle. Two independent previews — a viewport and
a wrist-menu thumbnail — use two channels and do not supersede each other.

Once a job starts it runs to completion. `manifold-3d` exposes an `ExecutionContext` that can cancel
a long solve, but at these mesh sizes a single boolean is a few milliseconds and the coordination
would cost more than it saves. Abandonment happens in the queue, before work starts, where it is
free.

### Never apply a stale result

Superseding handles most staleness. What it cannot prevent is two requests that both run and finish
out of order — a small edit submitted after a large one completes first, and the mesh that lands
last is the mesh that was asked for first. Requests are ordered; completions are not.

So every request carries a monotonic id, and `client.ts` applies a result only if its id exceeds the
highest already applied **on that channel**. Per channel, not globally, so a fast thumbnail cannot
silently suppress a slow viewport. The check lives on the main thread because the worker cannot know
what the renderer has already drawn.

## Output: interleaved buffers with sharp-edge normals

`MeshPayload` is one interleaved `Float32Array` — `[px, py, pz, nx, ny, nz]` per vertex — plus a
`Uint32Array` of indices. That is both what `manifold-3d` produces and what a renderer wants to
upload, so [#4](https://github.com/kruddage/carve/issues/4) wraps it in a `BufferGeometry` with an
interleaved attribute and no copy at all. Both buffers are transferred, not cloned.

Normals come from `manifold-3d`'s own crease-threshold pass, computed worker-side on the root result
only. The default threshold is **30°**: under the shallowest angle a tessellated primitive produces
at its default density — a 32-sided cylinder turns 11.25° per facet — so round surfaces stay smooth
while box edges and every cut a boolean makes stay crisp.

Normals are not computed per subtree, because they are a property of the visible surface: a face an
ancestor boolean is about to cut away does not need one.

## Previews: the other kind of work

[#7b](https://github.com/kruddage/carve/issues/7) asks for 3D thumbnails — the wrist menu
([#12](https://github.com/kruddage/carve/issues/12)) wants a small solid that turns, not a flat
icon, and the desktop palette ([#9](https://github.com/kruddage/carve/issues/9)) wants the same mesh
at a larger size. `preview.ts` builds them, and a `preview` request carries one to the main thread.

A preview is one primitive, at `draft` density, **framed**: scaled uniformly so its longest
bounding-box edge is one metre, with the true bounds reported alongside so a caller can still label
the entry "60 mm". Framing is the reason this is not simply an evaluation of a one-node bundle. A
menu cell is a fixed size, and a 60mm box beside a 108mm torus would otherwise arrive at half the
apparent size for no reason a user could act on — and the factor that fixes it can only be known
after the solid exists. Two consequences follow from keeping it separate:

- **Previews do not touch the subtree cache.** Six thumbnails, rebuilt every time a parameter moves,
  would evict live document subtrees to hold geometry nobody is modelling with.
- **Previews do not reach mesh listeners.** `preview-result` is its own message and `requestPreview`
  its own call, because a subscriber is the renderer drawing the document. One shared message type
  is how a palette entry ends up drawn as the part.

What previews _do_ share is everything that has to agree: the same `buildSolid`, the same
`normalizeParameters`, the same crease pass in `mesh.ts`. With framing off and a matching tier, a
preview mesh is asserted byte-identical to the evaluated one — a thumbnail is a smaller picture of
the same solid, never a second opinion about what a torus is.

They also share the queue, and therefore the channel rule — with a default of one channel _per
primitive kind_, `previewChannel(kind)`. Not one channel for all thumbnails: a palette asks for six
previews in a single pass, and on a shared channel five of them would be superseded before running
and come back `null`. Per kind, the supersession that survives is the one that is wanted — dragging
a parameter abandons that shape's older thumbnail and leaves its neighbours alone — and no preview
is ever on the viewport's channel, so a rebuilding palette cannot displace the evaluation the scene
is waiting for.

## Degenerate input warns, never throws

`normalizeParameters` repairs degenerate _parameters_ upstream, so what reaches the kernel is
degenerate _geometry_. Each case is reported as a `KernelWarning` against the node that caused it,
and evaluation carries on:

| Code               | What happened                                        |
| ------------------ | ---------------------------------------------------- |
| `empty-result`     | a subtraction removed its own base, or operands miss |
| `unary-boolean`    | a `subtract` or `intersect` with nothing to cut with |
| `missing-child`    | a child id not present in the bundle                 |
| `degenerate-input` | `manifold-3d` could not make the result manifold     |
| `build-failed`     | a constructor or transform threw                     |

All five are states a user passes through on the way to something valid. A viewport that goes blank
mid-edit is a worse outcome than a marker on a node, which is what
[#9](https://github.com/kruddage/carve/issues/9) puts in the outliner.

## Two build notes

**The worker must be a module worker.** `vite.config.ts` sets `worker.format: 'es'`. `manifold-3d`
is ESM, uses top-level `await` to instantiate its WASM, and locates `manifold.wasm` relative to
`import.meta.url` — none of which survive the IIFE format Vite otherwise uses for a production
worker build. The failure is invisible until a worker is actually spawned, which on this project
means it would be found in a headset rather than on a laptop.

**`node:module` is externalized, and that is fine.** The build logs a warning that `manifold.js`
imports `node:module`. It is a guarded `await import()` inside an `if (ENVIRONMENT_IS_NODE)` branch
that lets the same file work under Node for our Vitest suite; the branch never runs in a browser or
a Worker. Nothing to fix, and worth not re-investigating.

The kernel emits as its own chunk (~53kB) with the WASM as a separate asset (~540kB, ~206kB
gzipped), so neither is in the main bundle and the page is interactive before the kernel finishes
instantiating.

## Conventions this layer establishes

**+Y up, centred on the origin.** `manifold-3d` is Z-up; `solids.ts` applies a single −90° rotation
about X at construction and nowhere else. Everything above the kernel lives in one frame of
reference. A cone that came out pointing along +Z would look plausible in a desktop viewport and
wrong in a headset, where "up" is not a camera choice.

**Tessellation is an argument, never ambient state.** `manifold-3d` has module-level segment
defaults; nothing here reads or sets them. A mesh is a pure function of `(kind, params)`, which is
what makes the cache key mean one thing — if density came from ambient state, switching a session to
`draft` would serve desktop-density geometry out of the cache.

## Using it

```ts
import { spawnKernel } from './kernel/spawn.js'; // app only — Vite-specific

const kernel = spawnKernel();
kernel.subscribe(({ mesh }) => renderer.upload(mesh));

await kernel.request(doc.bundle()); // first full evaluation

const drag = doc.beginGesture('grab');
for (const pose of poses) {
  drag.dispatch(setTransform(nodeId, pose));
  void kernel.request(doc.bundle()); // fire and forget; most are superseded
}
drag.commit();
await kernel.request(doc.bundle()); // the result that lands in the document
```

On `transformCancel`, call `kernel.cancel()` and re-request the pre-gesture document.

A palette or a wrist menu asks for thumbnails instead, one per registry entry:

```ts
// One channel per kind by default, so all six can be in flight at once.
const previews = await Promise.all(
  listPrimitives().map((definition) => kernel.requestPreview({ kind: definition.kind })),
);
for (const preview of previews) {
  if (preview) cell(preview.kind).upload(preview.mesh); // already framed to a unit box
}
```

Tests construct a `KernelClient` over any `KernelPort`, an `Evaluator` directly over a
`loadManifold()` toolkit, or call `buildPreview` with the toolkit and nothing else. None of them
needs a `Worker`.

## What is deliberately not here

**WGSL compute shaders for CSG.** The kernel is WASM. See
[#4](https://github.com/kruddage/carve/issues/4).

**Export.** glTF and STL writing is [#14a](https://github.com/kruddage/carve/issues/14), and it
consumes `MeshPayload` rather than reaching into `manifold-3d`.
