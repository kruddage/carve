/**
 * The one piece of this layer that touches a real WebGL context.
 *
 * Deliberately thin: constructing `THREE.WebGLRenderer` needs a live
 * `<canvas>` with a working `webgl2` context, which does not exist under
 * Vitest. Every piece of logic that *can* be tested without a GPU —
 * geometry construction (`mesh.ts`), the scene (`scene-graph.ts`), camera
 * math (`camera-rig.ts`) — lives elsewhere specifically so it can be. What
 * is left here is resize bookkeeping, frame timing, and context loss
 * recovery, verified by running the app rather than by a unit test — the
 * same tradeoff `src/kernel/spawn.ts` makes for the one file that constructs
 * a real `Worker`.
 */

import { WebGLRenderer, type Camera, type Scene } from 'three';

export interface GlRendererOptions {
  readonly antialias?: boolean;
  /** Called after a context-loss event and after the context has come back. */
  readonly onContextLoss?: (lost: boolean) => void;
}

export class GlRenderer {
  readonly #renderer: WebGLRenderer;
  readonly #canvas: HTMLCanvasElement;
  readonly #onContextLoss: ((lost: boolean) => void) | undefined;
  readonly #onLost = (event: Event): void => {
    // Without this, the browser assumes the loss is unrecoverable and never
    // fires `webglcontextrestored` — silently turning a driver hiccup into a
    // permanently blank canvas.
    event.preventDefault();
    this.#contextLost = true;
    this.#onContextLoss?.(true);
  };
  readonly #onRestored = (): void => {
    this.#contextLost = false;
    this.#onContextLoss?.(false);
  };
  #contextLost = false;
  #lastFrameTimeMs = 0;

  constructor(canvas: HTMLCanvasElement, options: GlRendererOptions = {}) {
    this.#canvas = canvas;
    this.#onContextLoss = options.onContextLoss;
    this.#renderer = new WebGLRenderer({
      canvas,
      antialias: options.antialias ?? true,
      alpha: false,
    });
    this.#renderer.setClearColor(0x2a2d31, 1);

    canvas.addEventListener('webglcontextlost', this.#onLost, false);
    canvas.addEventListener('webglcontextrestored', this.#onRestored, false);
  }

  get contextLost(): boolean {
    return this.#contextLost;
  }

  /** Last frame's `render()` wall-clock cost, in milliseconds. */
  get lastFrameTimeMs(): number {
    return this.#lastFrameTimeMs;
  }

  /**
   * Match the drawing buffer to the canvas's current CSS size.
   *
   * Call this whenever the canvas's layout size might have changed — a
   * window resize, entering/leaving a panel layout in #9 — rather than on a
   * timer. `updateStyle: false` because #9 owns the canvas's CSS size; this
   * layer only owns the drawing buffer behind it.
   */
  resize(width: number, height: number, pixelRatio: number): void {
    this.#renderer.setPixelRatio(pixelRatio);
    this.#renderer.setSize(width, height, false);
  }

  /**
   * Draw one frame. A no-op while the context is lost, so a caller's render
   * loop does not need its own guard for a state this layer already tracks.
   */
  render(scene: Scene, camera: Camera): void {
    if (this.#contextLost) return;
    const start = performance.now();
    this.#renderer.render(scene, camera);
    this.#lastFrameTimeMs = performance.now() - start;
  }

  dispose(): void {
    this.#canvas.removeEventListener('webglcontextlost', this.#onLost, false);
    this.#canvas.removeEventListener('webglcontextrestored', this.#onRestored, false);
    this.#renderer.dispose();
  }
}
