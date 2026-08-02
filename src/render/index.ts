/**
 * src/render — the renderer layer.
 *
 * WebGL2, via three.js `WebGLRenderer`. One backend, on the flat page and in
 * the headset alike. v1 has no WebGPU path: `XRGPUBinding` is not implemented
 * on Quest, WebGL2 was always the shipping answer in-headset, and a second
 * backend for a hypothetical cost more than it bought. See issue #4 and
 * docs/roadmap.md.
 *
 * There is still a seam here, and it is not about swapping backends. It is
 * because #13's outline pass and #15's foveation both reach into renderer
 * internals, and because the moment three.js objects appear above this layer,
 * `src/core/` stops being headless and the "one document, two frontends" claim
 * stops being testable.
 *
 * ## What "the document renders" means here
 *
 * The document (#5) is a tree; the kernel (#6) evaluates that tree down to
 * one mesh per request, as the worked example in `src/kernel/index.ts` shows.
 * So this layer does not mirror nodes one-for-one into `Object3D`s — it holds
 * one evaluated solid and re-points its geometry at whatever the kernel's
 * `MeshListener` hands it next. `createRenderer(...).upload(mesh)` is that
 * seam; wire it directly to a `KernelClient` subscription:
 *
 * ```ts
 * const renderer = createRenderer(canvas);
 * kernel.subscribe(({ mesh }) => renderer.upload(mesh));
 * await kernel.request(doc.bundle());
 *
 * function loop() {
 *   renderer.renderFrame();
 *   requestAnimationFrame(loop);
 * }
 * requestAnimationFrame(loop);
 * ```
 *
 * The render loop itself is owned by the caller (#9's viewport, #10's
 * `XRSession.requestAnimationFrame` loop) — this layer draws one frame when
 * asked and never schedules its own.
 *
 * Belongs here:
 *   - the renderer interface, the frame loop, and its instrumentation
 *   - three.js scene construction, materials, shading (issue #13 extends it)
 *   - turning kernel mesh buffers into GPU resources
 *
 * Must NOT appear here:
 *   - document mutation. This layer reads the document and draws it; it does
 *     not edit it. Edits are commands, and commands belong to src/core/.
 *   - three.js or WebGL types leaking out of the module's public surface — if
 *     `WebGLRenderingContext` or a `THREE.*` type appears in an exported
 *     signature, the seam has already failed. `CameraControls` below is
 *     `CameraRig`'s public shape with its `THREE.PerspectiveCamera` property
 *     dropped for exactly this reason.
 *   - UI chrome: panels, buttons and outliners are src/ui/.
 */

import type { MeshPayload } from '../kernel/index.js';

import type { Bounds, StandardView } from './camera-rig.js';
import { CameraRig } from './camera-rig.js';
import { GlRenderer } from './gl-renderer.js';
import { SceneGraph } from './scene-graph.js';

export const RENDER_LAYER = 'render';

export { STANDARD_VIEWS, type Bounds, type StandardView } from './camera-rig.js';

/** Orbit/pan/zoom, driven by #8's pointer/XR intents once that layer exists. */
export interface CameraControls {
  /** Orbit by a drag delta, in radians. */
  orbit(deltaAzimuth: number, deltaPolar: number): void;
  /** Pan the target across the camera's own right/up plane, in world units. */
  pan(deltaX: number, deltaY: number): void;
  /** Multiplicative zoom: `factor > 1` moves the camera away from the target. */
  dolly(factor: number): void;
  /** Jump to a standard view, keeping the current target and radius. */
  setView(view: StandardView): void;
  /** Frame `bounds` in view, or reset to the origin when `null`. */
  frame(bounds: Bounds | null): void;
  /** The current orbit target, world space. */
  readonly target: readonly [number, number, number];
}

/** What the instrumentation overlay (#15) reads every frame. */
export interface RendererStats {
  /** Wall-clock cost of the last `renderFrame()` call, milliseconds. */
  readonly frameTimeMs: number;
  readonly triangleCount: number;
  /** Set by the caller via `setEvaluationQueueDepth` — this layer does not know the kernel. */
  readonly evaluationQueueDepth: number;
}

export interface RendererOptions {
  readonly antialias?: boolean;
  /** `PerspectiveCamera` vertical field of view, degrees. Defaults to 50. */
  readonly fovDegrees?: number;
  /** Called whenever the context is lost or restored — see `resize`'s note on recovery. */
  readonly onContextLoss?: (lost: boolean) => void;
}

export interface RendererHandle {
  /** Draw the currently uploaded solid onto `canvas`. Owns no `requestAnimationFrame` loop. */
  renderFrame(): void;

  /**
   * Replace the drawn solid with a fresh evaluation from the kernel (#6).
   *
   * Reuses the existing GPU buffers' owning objects rather than rebuilding
   * the scene — see `scene-graph.ts`. An empty mesh (nothing evaluated, or a
   * document with nothing in it) hides the solid rather than drawing
   * degenerate geometry.
   */
  upload(mesh: MeshPayload): void;

  /**
   * Match the drawing buffer and camera aspect to the canvas's current CSS
   * size. Call on every layout change; this layer does not poll for resizes.
   */
  resize(width: number, height: number, pixelRatio?: number): void;

  readonly camera: CameraControls;
  readonly stats: RendererStats;

  /** Record how many evaluations are queued/in flight, for `stats.evaluationQueueDepth`. */
  setEvaluationQueueDepth(depth: number): void;

  /** Whether the WebGL context is currently lost — see `RendererOptions.onContextLoss`. */
  readonly contextLost: boolean;

  dispose(): void;
}

/**
 * Build a renderer that draws into `canvas`.
 *
 * One per canvas, for the lifetime of that canvas. Nothing here reads the
 * document or the kernel directly — see the module doc for the intended
 * wiring — so this factory has no dependency on `src/core/` or
 * `src/kernel/` beyond the `MeshPayload` shape `upload` accepts.
 */
export function createRenderer(
  canvas: HTMLCanvasElement,
  options: RendererOptions = {},
): RendererHandle {
  const sceneGraph = new SceneGraph();
  const cameraRig = new CameraRig(
    options.fovDegrees === undefined ? {} : { fovDegrees: options.fovDegrees },
  );
  const glRenderer = new GlRenderer(canvas, {
    ...(options.antialias === undefined ? {} : { antialias: options.antialias }),
    ...(options.onContextLoss === undefined ? {} : { onContextLoss: options.onContextLoss }),
  });

  let evaluationQueueDepth = 0;

  const camera: CameraControls = {
    orbit: (deltaAzimuth, deltaPolar) => cameraRig.orbit(deltaAzimuth, deltaPolar),
    pan: (deltaX, deltaY) => cameraRig.pan(deltaX, deltaY),
    dolly: (factor) => cameraRig.dolly(factor),
    setView: (view) => cameraRig.setView(view),
    frame: (bounds) => cameraRig.frame(bounds),
    get target() {
      return cameraRig.target;
    },
  };

  return {
    renderFrame(): void {
      glRenderer.render(sceneGraph.scene, cameraRig.camera);
    },
    upload(mesh: MeshPayload): void {
      sceneGraph.upload(mesh);
    },
    resize(width: number, height: number, pixelRatio = globalThis.devicePixelRatio || 1): void {
      glRenderer.resize(width, height, pixelRatio);
      cameraRig.setAspect(height === 0 ? 1 : width / height);
    },
    camera,
    get stats(): RendererStats {
      return {
        frameTimeMs: glRenderer.lastFrameTimeMs,
        triangleCount: sceneGraph.triangleCount,
        evaluationQueueDepth,
      };
    },
    setEvaluationQueueDepth(depth: number): void {
      evaluationQueueDepth = depth;
    },
    get contextLost(): boolean {
      return glRenderer.contextLost;
    },
    dispose(): void {
      sceneGraph.dispose();
      glRenderer.dispose();
    },
  };
}
