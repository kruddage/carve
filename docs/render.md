# The renderer layer

`src/render/`. WebGL2, via three.js `WebGLRenderer`. This is
[#4](https://github.com/kruddage/carve/issues/4) — the seam between the document/kernel and the
screen, and the last hardware-independent piece of **M2 · The web app**. See
[`docs/roadmap.md`](./roadmap.md) for why there is only one rendering backend.

## What "the document renders" means here

The document ([#5](https://github.com/kruddage/carve/issues/5)) is a tree, but the kernel
([#6](https://github.com/kruddage/carve/issues/6)) evaluates that tree down to **one mesh per
request** — see the worked example in `src/kernel/index.ts`. So this layer does not mirror nodes
one-for-one into `Object3D`s. It holds one evaluated solid (`scene-graph.ts`) and re-points its
geometry at whatever the kernel's `MeshListener` hands it next:

```ts
const renderer = createRenderer(canvas);
kernel.subscribe(({ mesh }) => renderer.upload(mesh));
await kernel.request(doc.bundle());

function loop() {
  renderer.renderFrame();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
```

The render loop is owned by the caller — [#9](https://github.com/kruddage/carve/issues/9)'s
viewport, [#10](https://github.com/kruddage/carve/issues/10)'s `XRSession.requestAnimationFrame`
loop. This layer draws one frame when asked and never schedules its own; that is what lets the same
`RendererHandle` serve both a desktop `requestAnimationFrame` loop and an XR frame loop unchanged.

## Layout

| File             | What it owns                                                                   |
| ---------------- | ------------------------------------------------------------------------------ |
| `mesh.ts`        | `MeshPayload` → `BufferGeometry`, without copying the kernel's buffers         |
| `material.ts`    | The default lit `ShaderMaterial`, authored in GLSL                             |
| `camera-rig.ts`  | Spherical orbit/pan/zoom, plus the standard views (front/top/right/home)       |
| `scene-graph.ts` | The `Scene` and its one evaluated solid                                        |
| `gl-renderer.ts` | The real `WebGLRenderer`: resize, frame timing, context loss/restore           |
| `index.ts`       | `createRenderer(canvas)` — the only exported entry point, and its public types |

## No copy, ever

`MeshPayload.vertices` is already interleaved `[px, py, pz, nx, ny, nz]` — see
`src/kernel/protocol.ts` — because that is both what `manifold-3d` hands the kernel and what a
renderer wants to upload. `mesh.ts` wraps the same `Float32Array` in a `THREE.InterleavedBuffer` and
the same `Uint32Array` in an index `BufferAttribute`, rather than copying into separate
`position`/`normal` arrays. A full evaluation can be several hundred thousand vertices, and a drag
frame arrives often enough that a copy on the main thread would be its own dropped-frame source —
see `docs/kernel.md`'s note on the ghost-preview strategy.

Normals are never recomputed here. `meshFromSolid` (#6) already baked in crease-threshold normals at
the kernel, so a flat face of a box stays flat and a tessellated cylinder stays round.

## The camera is a spherical rig, not a free-fly camera

`(azimuth, polar, radius, target)` rather than a raw position and quaternion, because that is the
whole desktop camera model in #9 — orbit, pan, zoom — and every one of those is a change to exactly
one coordinate. It is also what makes `setView('top')` a two-line angle assignment instead of a
look-at solve, and what keeps orbiting numerically stable forever instead of drifting the way
repeated quaternion deltas do.

`CameraRig` is pure enough to unit test without a canvas — build one against a detached
`PerspectiveCamera`, drive it, read back position and quaternion. Nothing in it touches a WebGL
context.

## Materials: GLSL, not TSL

The default solid material is a hand-written `ShaderMaterial`, not three.js's node system (TSL).
TSL's entire value proposition was compiling one material source to two rendering backends; v1 has
one backend (see #4 and #1), so plain GLSL is the more-trodden path with the best-exercised WebXR
support in three.js. This is deliberately not [#13](https://github.com/kruddage/carve/issues/13)'s
hard-surface shading — no PBR presets, no matcap, no outline pass — just enough lighting for a
booleaned solid to be legible the moment #4 can draw one at all. #13 replaces this material; it does
not need to invent the seam it plugs into.

The two light directions are declared in view space and never transformed by the view matrix, so
they ride along with the camera — a "headlamp" rig. That is deliberate for a CAD viewport: orbiting
the camera must never leave you staring at the unlit side of a part.

## Context loss has a real recovery path

`gl-renderer.ts` listens for `webglcontextlost` and calls `preventDefault()` on it — without that
call the browser assumes the loss is unrecoverable and never fires `webglcontextrestored`, turning a
driver hiccup into a permanently blank canvas. While the context is lost, `render()` is a no-op
rather than throwing, so a caller's render loop does not need its own guard for state this layer
already tracks. `RendererOptions.onContextLoss` notifies the caller of both edges, for whatever UI
(#9) or XR session (#10) wants to show a "reconnecting" state.

## What is and is not tested

Three.js's non-GPU classes — `BufferGeometry`, `Scene`, `Mesh`, cameras, `Vector3`, `Matrix4` — run
fine under Vitest in plain Node; only `WebGLRenderer` needs a real `<canvas>` with a working `webgl2`
context, which does not exist there. So `mesh.ts`, `camera-rig.ts` and `scene-graph.ts` are unit
tested directly, and `gl-renderer.ts` — the one file that constructs a real `WebGLRenderer` — is left
thin and unit-untested, the same tradeoff `src/kernel/spawn.ts` makes for the one file that
constructs a real `Worker`.

The combination was verified by hand in headless Chromium: a box mesh uploaded through
`createRenderer` renders with correctly lit, sharp-edged faces and reads back as more than one pixel
colour, not a flat clear colour. `docs/roadmap.md`'s `16b` is what turns that into a checked-in
Playwright smoke test.
