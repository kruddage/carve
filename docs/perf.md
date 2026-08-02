# Performance

Measured numbers, with the machine they were measured on. Nothing in here is a target that CI
enforces — see "Why these are not CI thresholds" below — and nothing in here is a guess.

Budgets, the benchmark scene, and the on-device half of every table are
[#15](https://github.com/kruddage/carve/issues/15). This file starts with what
[#6](https://github.com/kruddage/carve/issues/6) measured, because the kernel is the first thing in
the project with a number attached and [`docs/roadmap.md`](./roadmap.md) names these timings as the
visible progress marker for M1.

## The CSG kernel

`npm run bench` (`test/bench/kernel.bench.ts`).

### The target from #6

> A tree of ~20 primitives with ~10 boolean ops re-evaluates a single-leaf edit in under 16ms.

**Met, with room.** A warm single-leaf edit is **6.7ms mean / 10.8ms p99** on the reference machine
below.

With the ghost-preview strategy in [`docs/kernel.md`](./kernel.md) this target is about _quality of
feel_ rather than about holding frame rate — missing it degrades preview responsiveness, it does not
drop frames. The headroom above matters mostly because the Quest 3's CPU is slower than this one and
that measurement is still owed.

### Reference machine

|               |                               |
| ------------- | ----------------------------- |
| CPU           | Intel Xeon @ 2.10GHz, 4 cores |
| OS / runtime  | Linux x64, Node 22.22         |
| `manifold-3d` | 3.5.1, single-threaded build  |
| Date          | 2026-08-02                    |

A shared cloud vCPU, which is to say: unremarkable, and slower than most laptops this will run on.
Treat the numbers as a floor for desktop rather than as a typical reading.

### The target tree

Five plates, each drilled by two 32-sided cylinders and chamfered by a wedge, unioned together — 20
primitives, 6 boolean nodes, 14 transforms. Shaped like a part rather than as a flat list of
twenty primitives, because a flat tree has no depth for the subtree cache to skip and would measure
boolean throughput while appearing to measure edit latency. `targetTree()` in
`test/support/kernel-fixture.ts`.

| Case                                       |      mean |       p75 |        p99 |
| ------------------------------------------ | --------: | --------: | ---------: |
| Cold — full evaluation, empty cache        |    18.2ms |    18.7ms |     21.5ms |
| **Single-leaf edit — cache warm**          | **6.7ms** | **7.3ms** | **10.8ms** |
| Re-evaluate unchanged — every subtree hits |     2.1ms |     2.1ms |      4.2ms |

### Components

| Case                                           |   mean |
| ---------------------------------------------- | -----: |
| One primitive — a 32-sided cylinder            | 0.11ms |
| One boolean — a cylinder subtracted from a box |  5.5ms |

### Reading the numbers

**The cache earns its keep, and the structural test says why.** A warm edit is 2.7× faster than a
cold one, which understates it: `test/kernel-cache.test.ts` shows the same edit rebuilding **4
subtrees instead of 17**. The remaining time is not cache misses, it is the two items below.

**One boolean is ~5.5ms, and a warm edit needs one.** That is the floor for this tree: an edit to a
hole re-solves that plate's `subtract` and the `union` above it. Making warm edits meaningfully
faster means making booleans faster, not caching harder — which is what puts the `draft`
tessellation tier first in #6's escalation order.

**~2ms of every evaluation is normals and mesh extraction, not CSG.** The "re-evaluate unchanged"
row is a pure cache hit at the root that still runs `calculateNormals` and `getMesh` from scratch,
so it is a direct reading of that cost. Roughly a third of a warm edit. If the target tree ever
misses badly, memoising the extracted `MeshPayload` alongside the root solid is a cheap win — the
reason it is not done today is that the buffers are _transferred_ to the main thread and therefore
detached, so a memoised payload would need a copy, and a copy on every frame of a drag is the cost
the transfer exists to avoid. Worth revisiting with a measurement rather than now.

**A cold evaluation is 18ms and that is fine.** It happens on document open, never inside a gesture.

### Why these are not CI thresholds

A timing assertion on a shared runner measures the runner's neighbours as much as the code, and a
check that fails a PR for that reason gets disabled within a week. So `npm test` asserts the
machine-independent half of the same claim — **how many subtrees an edit rebuilds** — and `npm run
bench` produces the timings, by hand, when someone wants them.

Re-run and update this file when: `manifold-3d` is upgraded, the default tessellation counts change,
the evaluator's caching or forcing strategy changes, or [#15](https://github.com/kruddage/carve/issues/15)
adds budgets.

## On-device

Empty. The kernel's timings on the Quest 3's CPU need
[#10](https://github.com/kruddage/carve/issues/10) to get code into a headset, and frame-rate
figures need [#13](https://github.com/kruddage/carve/issues/13) and
[#11](https://github.com/kruddage/carve/issues/11) to have something to render and something to grab.
[#15](https://github.com/kruddage/carve/issues/15) carries both.

The expectation to check against when it is measurable: the XR2 Gen 2 is thermally constrained and
has asymmetric cores, so single-threaded WASM throughput lands somewhere in the region of a third to
a half of a desktop CPU. On the numbers above that would put a warm single-leaf edit around 15–20ms
— at or just past the 16ms target, and the first real test of whether the `draft` tier is needed by
default in a session. Written down now so the eventual measurement can confirm or refute something
specific rather than land on an empty page.

## Capability probe

Renderer and device capabilities measured on hardware are in
[`docs/capability-matrix.md`](./capability-matrix.md), from the probe at `/probe/`
([#2](https://github.com/kruddage/carve/issues/2)). That is a different kind of measurement —
"what does this device support" rather than "how long does this take" — so it keeps its own file.
