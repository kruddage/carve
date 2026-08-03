/**
 * The canvas, and everything that happens on it.
 *
 * This module owns the frame loop, the camera, the hit-test registry, the
 * gizmo, and the routing of raw pointer events to one of three consumers. It is
 * the only file in `src/ui/` that is allowed to know a `RendererHandle` exists.
 *
 * ## Three things want the pointer, and the split is explicit
 *
 * 1. **The camera.** Middle-drag pans, right-drag orbits, the wheel dollies.
 *    None of these are intents — `src/input/pointer.ts` explains at length why
 *    "orbit the camera" cannot be in a vocabulary a headset also speaks — so
 *    they are wired straight to `CameraControls`, which was written expecting
 *    exactly that.
 * 2. **The gizmo.** A primary press that lands on a handle starts a constrained
 *    drag through `gizmo-drag.ts`.
 * 3. **The document.** Anything else primary goes to the pointer adapter,
 *    which turns it into hover, select, and free-drag intents.
 *
 * The adapter's own `attach` is deliberately not used. Listener order would
 * otherwise decide whether the gizmo or the adapter saw a press first, which is
 * a property of the order two `addEventListener` calls happen to run in — and
 * that is not a thing to leave load-bearing. So this file installs the
 * listeners and calls `adapter.pointerDown` / `pointerMove` / `pointerUp`
 * itself, which the adapter exposes for exactly this purpose.
 *
 * ## The frame loop never waits for the kernel
 *
 * `renderFrame` draws whatever mesh last arrived. Requests are fire-and-forget.
 * During a drag the solid on screen may be several evaluations behind the
 * cursor, and the translucent ghost — see `src/render/overlay.ts` — is what
 * covers the gap. This is the rule `src/kernel/index.ts` states as the one
 * thing to understand before changing anything: hand movement and kernel
 * evaluation are never coupled.
 */

import {
  multiplyMatrices,
  trsToMatrix,
  vec3,
  type CarveDocument,
  type Mat4,
  type NodeId,
  type Vec3,
} from '../core/index.js';
import type { MeshPayload } from '../kernel/index.js';
import {
  DEFAULT_SNAP_SETTINGS,
  PickRegistry,
  SNAP_OFF,
  createPointerAdapter,
  invertMatrix,
  rayFromScreenPoint,
  transformBegin,
  transformCommit,
  transformUpdate,
  type Aabb,
  type IntentRouter,
  type PickTarget,
  type PointerAdapter,
  type Ray,
  type SnapFeature,
} from '../input/index.js';
import {
  createRenderer,
  type Bounds,
  type GizmoHandle,
  type RendererHandle,
  type SelectionBox,
  type StandardView,
} from '../render/index.js';

import {
  beginGizmoDrag,
  deltaFor,
  gizmoFrame,
  pickGizmoHandle,
  screenScale,
  type GizmoDrag,
  type GizmoFrame,
} from './gizmo-drag.js';
import { transformModeOf, type ViewState } from './view-state.js';

/** What the viewport needs from the rest of the app. */
export interface ViewportOptions {
  readonly document: CarveDocument;
  readonly router: IntentRouter;
  readonly view: ViewState;
  /** Local bounds for a node, or `null` when the bounds cache has not filled in yet. */
  readonly boundsOf: (nodeId: NodeId) => Aabb | null;
  /** Every pickable node's target. Rebuilt whenever the document or the cache changes. */
  readonly targets: () => readonly PickTarget[];
  /**
   * Evaluate a subtree for the drag ghost. Resolves `null` if superseded or if
   * the kernel is not up yet — the drag then simply has no ghost, which is
   * degraded rather than broken.
   */
  readonly requestGhost: (nodeId: NodeId) => Promise<MeshPayload | null>;
}

/** Which button does what. Named, because `event.button === 1` reads as nothing. */
const PRIMARY_BUTTON = 0;
const MIDDLE_BUTTON = 1;
const SECONDARY_BUTTON = 2;

/** Radians of orbit per pixel of drag. A full turn in roughly 800px. */
const ORBIT_RADIANS_PER_PIXEL = 0.008;
/** Wheel notch → dolly factor. 1.1 is about 10% per notch, which is a comfortable zoom. */
const DOLLY_PER_NOTCH = 1.1;

type CameraDrag = {
  readonly kind: 'orbit' | 'pan';
  x: number;
  y: number;
  readonly pointerId: number;
};

export interface Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: RendererHandle;
  /** Rebuild the pick registry and the selection overlay. Cheap; call on any change. */
  refresh(): void;
  setView(view: StandardView): void;
  frame(bounds: Bounds | null): void;
  /** Abandon a drag in progress — Escape, or a panel taking over. */
  cancelDrag(): void;
  dispose(): void;
}

export function createViewport(host: HTMLElement, options: ViewportOptions): Viewport {
  const { document: doc, router, view } = options;

  const canvas = document.createElement('canvas');
  canvas.className = 'carve-canvas';
  // Without this the browser scrolls the page on a drag inside the canvas, and
  // on a trackpad that makes orbiting impossible.
  canvas.style.touchAction = 'none';
  host.appendChild(canvas);

  const renderer = createRenderer(canvas, { antialias: true });
  const registry = new PickRegistry();

  let cameraDrag: CameraDrag | null = null;
  let gizmoDrag: GizmoDrag | null = null;
  let hoveredHandle: GizmoHandle | null = null;
  let ghost: {
    readonly parentWorld: Mat4;
    readonly startInverse: Mat4;
    mesh: MeshPayload | null;
  } | null = null;
  let snapPoint: Vec3 | null = null;
  let running = true;

  // --- Rays and picking -----------------------------------------------------

  function viewportSize(): { width: number; height: number } {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  function rayAt(event: { clientX: number; clientY: number }): Ray {
    const rect = canvas.getBoundingClientRect();
    return rayFromScreenPoint(
      renderer.camera.pose,
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
    );
  }

  const adapter: PointerAdapter = createPointerAdapter({
    emit: (intent) => void router.handle(intent),
    camera: () => renderer.camera.pose,
    pick: (ray, { drillIn }) => registry.pick(ray, { drillIn, tree: doc }),
    viewport: viewportSize,
    mode: () => transformModeOf(view.gizmoMode),
  });

  // --- The gizmo ------------------------------------------------------------

  /**
   * The gizmo's frame, or `null` when there is nothing to draw one on.
   *
   * The *last* selected node rather than the first: a selection is built up by
   * clicking, and the gizmo belongs on the thing you just touched. Multi-select
   * transforms are not in #9's scope — the intent vocabulary moves one node per
   * gesture — so the rest of the selection gets a box and no handles.
   */
  function currentFrame(): GizmoFrame | null {
    const selection = doc.selection;
    const nodeId = selection[selection.length - 1];
    if (nodeId === undefined) return null;
    const frame = gizmoFrame(doc, nodeId, view.gizmoMode, view.space, 1);
    if (!frame) return null;
    const size = screenScale(
      renderer.camera.pose.position,
      frame.origin,
      renderer.camera.pose.fovDegrees,
    );
    return { ...frame, size };
  }

  function gizmoTargetId(): NodeId | null {
    const selection = doc.selection;
    return selection[selection.length - 1] ?? null;
  }

  // --- Ghost ----------------------------------------------------------------

  function startGhost(nodeId: NodeId): void {
    const node = doc.get(nodeId);
    const parentId = doc.parentOf(nodeId);
    if (!node || node.kind !== 'transform' || parentId === null) return;
    const startInverse = invertMatrix(trsToMatrix(node.transform));
    if (!startInverse) return;
    ghost = { parentWorld: doc.worldMatrix(parentId), startInverse, mesh: null };

    void options.requestGhost(nodeId).then((mesh) => {
      // The drag may already be over; a ghost arriving after the commit would
      // paint a translucent copy over the finished part until the next drag.
      if (ghost) ghost.mesh = mesh;
    });
  }

  function ghostState(): { mesh: MeshPayload | null; matrix: Mat4 } | null {
    const nodeId = router.transforming?.nodeId;
    if (!ghost?.mesh || nodeId === undefined) return null;
    const node = doc.get(nodeId);
    if (!node || node.kind !== 'transform') return null;
    // See the module note in `overlay.ts`: the mesh already carries the
    // transform the node had at drag start, so that has to come back out
    // before the live one goes in.
    const matrix = multiplyMatrices(
      ghost.parentWorld,
      multiplyMatrices(trsToMatrix(node.transform), ghost.startInverse),
    );
    return { mesh: ghost.mesh, matrix };
  }

  const unsubscribeOutcomes = router.subscribe((outcome) => {
    if (outcome.status !== 'applied') return;
    if (outcome.intent.kind === 'transform-begin' && outcome.nodeId !== undefined) {
      startGhost(outcome.nodeId);
    }
    if (outcome.intent.kind === 'transform-update') {
      snapPoint = featurePoint(outcome.snappedTo);
    }
    if (outcome.intent.kind === 'transform-commit' || outcome.intent.kind === 'transform-cancel') {
      ghost = null;
      snapPoint = null;
    }
  });

  function featurePoint(feature: SnapFeature | undefined): Vec3 | null {
    return feature ? vec3(feature.point.x, feature.point.y, feature.point.z) : null;
  }

  // --- Pointer --------------------------------------------------------------

  function onPointerDown(event: PointerEvent): void {
    canvas.focus();

    if (event.button === MIDDLE_BUTTON || event.button === SECONDARY_BUTTON) {
      event.preventDefault();
      cameraDrag = {
        kind: event.button === SECONDARY_BUTTON ? 'orbit' : 'pan',
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button !== PRIMARY_BUTTON) return;

    const frame = currentFrame();
    const targetId = gizmoTargetId();
    if (frame && targetId !== null) {
      const handle = pickGizmoHandle(rayAt(event), frame, view.gizmoMode);
      if (handle) {
        const drag = beginGizmoDrag(handle, frame, rayAt(event));
        if (drag) {
          gizmoDrag = drag;
          hoveredHandle = handle;
          canvas.setPointerCapture(event.pointerId);
          router.handle(transformBegin(targetId, transformModeOf(view.gizmoMode), frame.origin));
          return;
        }
      }
    }

    adapter.pointerDown(event);
  }

  function onPointerMove(event: PointerEvent): void {
    if (cameraDrag) {
      const dx = event.clientX - cameraDrag.x;
      const dy = event.clientY - cameraDrag.y;
      cameraDrag.x = event.clientX;
      cameraDrag.y = event.clientY;
      if (cameraDrag.kind === 'orbit') {
        renderer.camera.orbit(dx * ORBIT_RADIANS_PER_PIXEL, dy * ORBIT_RADIANS_PER_PIXEL);
      } else {
        // Pan in world units at the target's depth, so the point under the
        // cursor stays under it. `camera-rig.ts` documents the contract.
        const { height } = viewportSize();
        const pose = renderer.camera.pose;
        const target = renderer.camera.target;
        const depth = Math.hypot(
          pose.position.x - target[0],
          pose.position.y - target[1],
          pose.position.z - target[2],
        );
        const perPixel =
          height === 0
            ? 0
            : (2 * depth * Math.tan(((pose.fovDegrees / 2) * Math.PI) / 180)) / height;
        renderer.camera.pan(dx * perPixel, dy * perPixel);
      }
      return;
    }

    if (gizmoDrag) {
      const delta = deltaFor(gizmoDrag, rayAt(event));
      if (delta) router.handle(transformUpdate(delta));
      return;
    }

    // Hovering a handle suppresses document hover: the cursor is over the
    // gizmo, and highlighting the solid behind it says the click will select
    // something it will not.
    const frame = currentFrame();
    hoveredHandle = frame ? pickGizmoHandle(rayAt(event), frame, view.gizmoMode) : null;
    if (hoveredHandle) return;

    adapter.pointerMove(event);
  }

  function onPointerUp(event: PointerEvent): void {
    if (cameraDrag?.pointerId === event.pointerId) {
      canvas.releasePointerCapture(event.pointerId);
      cameraDrag = null;
      return;
    }
    if (gizmoDrag) {
      const delta = deltaFor(gizmoDrag, rayAt(event));
      if (delta) router.handle(transformUpdate(delta));
      gizmoDrag = null;
      canvas.releasePointerCapture(event.pointerId);
      router.handle(transformCommit());
      return;
    }
    adapter.pointerUp(event);
  }

  function onPointerCancel(): void {
    cameraDrag = null;
    if (gizmoDrag) {
      gizmoDrag = null;
      router.abort('interrupted');
      return;
    }
    adapter.pointerCancel('interrupted');
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    // `deltaY` units vary by device and OS; only its sign is portable, so one
    // notch is one step rather than a scaled amount.
    renderer.camera.dolly(event.deltaY > 0 ? DOLLY_PER_NOTCH : 1 / DOLLY_PER_NOTCH);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  // Right-drag orbits, so the context menu has to go. Only over the canvas.
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // --- Registry and overlays ------------------------------------------------

  function refresh(): void {
    registry.clear();
    for (const target of options.targets()) registry.register(target);

    const selection = doc.selection;
    const primary = selection[selection.length - 1];
    const boxes: SelectionBox[] = [];
    for (const nodeId of selection) {
      const bounds = options.boundsOf(nodeId);
      if (!bounds) continue;
      boxes.push({
        bounds,
        matrix: doc.worldMatrix(nodeId),
        primary: nodeId === primary,
      });
    }
    renderer.setSelection(boxes);
  }

  // --- Frame loop -----------------------------------------------------------

  const resizeObserver = new ResizeObserver(() => {
    const { width, height } = viewportSize();
    if (width > 0 && height > 0) renderer.resize(width, height);
  });
  resizeObserver.observe(host);

  function loop(): void {
    if (!running) return;

    renderer.setGridVisible(view.showGrid);

    const frame = currentFrame();
    if (frame) {
      renderer.setGizmo({
        matrix: frame.matrix,
        mode: view.gizmoMode,
        size: frame.size,
        activeId: (gizmoDrag?.handle ?? hoveredHandle)?.id ?? null,
      });
    } else {
      renderer.setGizmo(null);
    }

    renderer.setGhost(ghostState());
    renderer.setSnapMarker(
      snapPoint ? [snapPoint.x, snapPoint.y, snapPoint.z] : null,
      frame ? frame.size * 0.14 : 0.01,
    );

    renderer.renderFrame();
    requestAnimationFrame(loop);
  }

  const { width, height } = viewportSize();
  if (width > 0 && height > 0) renderer.resize(width, height);
  requestAnimationFrame(loop);

  // Snapping is a view-state toggle and the router is where it takes effect.
  const unsubscribeView = view.subscribe(() => {
    router.setSnapSettings(view.snapping ? DEFAULT_SNAP_SETTINGS : SNAP_OFF);
  });
  router.setSnapSettings(view.snapping ? DEFAULT_SNAP_SETTINGS : SNAP_OFF);

  return {
    canvas,
    renderer,
    refresh,
    setView: (standard) => renderer.camera.setView(standard),
    frame: (bounds) => renderer.camera.frame(bounds),
    cancelDrag(): void {
      if (gizmoDrag) {
        gizmoDrag = null;
        router.abort('user');
        return;
      }
      adapter.pointerCancel('user');
    },
    dispose(): void {
      running = false;
      resizeObserver.disconnect();
      unsubscribeOutcomes();
      unsubscribeView();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      renderer.dispose();
      canvas.remove();
    },
  };
}
