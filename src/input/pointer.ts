/**
 * The pointer adapter: mouse and touch.
 *
 * Turns pointer events into intents and nothing else. It does not touch the
 * document (that is the router), it does not know what a gizmo looks like (that
 * is #9), and it does not move the camera.
 *
 * ## Why camera navigation is not here
 *
 * Orbit, pan and dolly are not intents. An intent says what should happen to
 * the *document*, and the whole point of the vocabulary is that a hand and a
 * mouse produce the same ones — but "orbit the camera" has no meaning in a
 * headset, where the camera is your head. Putting it in the union would create
 * a member every XR adapter must ignore, which is the first crack in "adding an
 * adapter requires zero changes elsewhere".
 *
 * So this adapter claims the **primary button only** and ignores the rest,
 * leaving middle-drag, right-drag and wheel for #9 to wire straight to
 * `CameraControls`. `camera-rig.ts` was written expecting exactly that: its
 * `orbit`/`pan`/`dolly` take drag deltas and read no events.
 *
 * ## Click versus drag
 *
 * A press is ambiguous until the pointer moves. Below `dragThresholdPx` a
 * release is a **click** and emits `select`; past it the press becomes a
 * **drag** and emits `transformBegin` retroactively, from the position the
 * press happened at. Emitting `transformBegin` on press instead would open a
 * document gesture for every click — and a gesture that opens and closes with
 * no edit still blocks `undo` for as long as it is open, so a fast click
 * during a keyboard undo would silently swallow it.
 *
 * ## The drag plane
 *
 * A cursor has two degrees of freedom and a translation has three, so the
 * missing one has to be invented. This adapter uses the plane through the hit
 * point facing the camera, which is the convention every modeler uses for an
 * unconstrained drag: the solid tracks the cursor exactly, at the depth you
 * grabbed it. #9's axis and plane handles will pass their own constraint plane
 * in; the seam for that is `dragPlaneNormal`.
 */

import { type NodeId, type Vec3 } from '../core/index.js';

import {
  intersectPlane,
  normalize,
  pointOnRay,
  rayFromScreenPoint,
  subVec3,
  type Ray,
  type ViewPose,
} from './geometry.js';
import {
  hover,
  makeDelta,
  select,
  transformBegin,
  transformCancel,
  transformCommit,
  transformUpdate,
  type IntentSink,
  type TransformMode,
} from './intents.js';
import type { PickHit } from './pick.js';

/**
 * The part of a `PointerEvent` this adapter reads.
 *
 * Structural rather than the DOM type so the adapter can be driven from a test
 * in Node — the test environment is `node`, see vite.config.ts — with no
 * jsdom and no synthetic event constructor. Every field a real `PointerEvent`
 * already has.
 */
export interface PointerSample {
  readonly clientX: number;
  readonly clientY: number;
  /** 0 for the primary button. Absent on move events. */
  readonly button?: number;
  readonly pointerId?: number;
  readonly shiftKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
}

/** The part of an element this adapter needs. A real `HTMLCanvasElement` satisfies it. */
export interface PointerHost {
  addEventListener(type: string, listener: (event: PointerSample) => void): void;
  removeEventListener(type: string, listener: (event: PointerSample) => void): void;
  getBoundingClientRect(): {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  setPointerCapture?(pointerId: number): void;
  releasePointerCapture?(pointerId: number): void;
}

export interface PointerAdapterOptions {
  readonly emit: IntentSink;
  /** Where the ray is cast from. Read per event, so a moving camera is fine. */
  readonly camera: () => ViewPose;
  /** Hit test. `drillIn` is true when the modifier key is held. */
  readonly pick: (ray: Ray, options: { readonly drillIn: boolean }) => PickHit | null;
  /** Viewport size in CSS pixels. Defaults to the host's bounding box. */
  readonly viewport?: () => { readonly width: number; readonly height: number };
  /** Which mode a drag runs in. Called at drag start; #9 returns the picked handle's. */
  readonly mode?: () => TransformMode;
  /** Movement, in CSS pixels, that turns a press into a drag. Defaults to 4. */
  readonly dragThresholdPx?: number;
  /** Constrain translation to a plane with this world normal. Defaults to facing the camera. */
  readonly dragPlaneNormal?: () => Vec3 | null;
}

export interface PointerAdapter {
  /** Wire up `pointermove` / `pointerdown` / `pointerup` / `pointercancel` on a host. */
  attach(host: PointerHost): void;
  detach(): void;
  /** The event handlers, exposed so tests (and #9's own wiring) can drive them directly. */
  pointerMove(event: PointerSample): void;
  pointerDown(event: PointerSample): void;
  pointerUp(event: PointerSample): void;
  /** Pointer capture lost, window blurred, Escape pressed. Cancels any drag. */
  pointerCancel(reason?: 'user' | 'interrupted'): void;
  /** True between a press that became a drag and its release. */
  readonly dragging: boolean;
}

const DEFAULT_DRAG_THRESHOLD_PX = 4;

interface PressState {
  readonly pointerId: number | undefined;
  readonly screenX: number;
  readonly screenY: number;
  readonly hit: PickHit | null;
  readonly additive: boolean;
  /** Set once the threshold is crossed. */
  drag: DragState | null;
}

interface DragState {
  readonly nodeId: NodeId;
  readonly planePoint: Vec3;
  readonly planeNormal: Vec3;
  /** Where on the plane the press landed — every later delta is measured from here. */
  readonly anchor: Vec3;
}

export function createPointerAdapter(options: PointerAdapterOptions): PointerAdapter {
  const threshold = options.dragThresholdPx ?? DEFAULT_DRAG_THRESHOLD_PX;
  let host: PointerHost | null = null;
  let press: PressState | null = null;

  function viewportOf(): { width: number; height: number } {
    if (options.viewport) return options.viewport();
    const rect = host?.getBoundingClientRect();
    return { width: rect?.width ?? 0, height: rect?.height ?? 0 };
  }

  function localPoint(event: PointerSample): { x: number; y: number } {
    const rect = host?.getBoundingClientRect();
    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }

  function rayFor(event: PointerSample): Ray {
    const { x, y } = localPoint(event);
    const { width, height } = viewportOf();
    return rayFromScreenPoint(options.camera(), x, y, width, height);
  }

  /**
   * Alt drills into a boolean's operands; shift and the platform modifier add
   * to the selection. Meta as well as ctrl because ctrl-click is a right-click
   * on macOS and would never reach here.
   */
  function drillIn(event: PointerSample): boolean {
    return event.altKey === true;
  }

  function additive(event: PointerSample): boolean {
    return event.shiftKey === true || event.ctrlKey === true || event.metaKey === true;
  }

  function beginDrag(event: PointerSample, current: PressState): void {
    const hit = current.hit;
    if (!hit) return;

    const camera = options.camera();
    const constrained = options.dragPlaneNormal?.() ?? null;
    // Facing the camera: the plane the cursor moves in, so the solid tracks it
    // exactly rather than sliding away along the view direction.
    const planeNormal = constrained ?? normalize(subVec3(camera.position, hit.point));
    const anchor = hit.point;

    const mode = options.mode?.() ?? 'translate';
    const drag: DragState = {
      nodeId: hit.resolvedId,
      planePoint: anchor,
      planeNormal,
      anchor,
    };
    press = { ...current, drag };
    options.emit(transformBegin(hit.resolvedId, mode, hit.point));
    // The press position is where the drag started, so the first update is the
    // movement since the press, not since the threshold was crossed. Without
    // this the part jumps by the threshold distance the moment a drag begins.
    updateDrag(drag, event);
  }

  /**
   * Takes the drag state rather than reading it back off `press`, because the
   * release path clears `press` first — and a final update that silently did
   * nothing would drop the last few pixels of every drag.
   */
  function updateDrag(drag: DragState, event: PointerSample): void {
    const ray = rayFor(event);
    const along = intersectPlane(ray, drag.planePoint, drag.planeNormal);
    // The cursor left the plane's half-space — possible when the camera is
    // nearly edge-on to it. Holding the last delta is better than emitting a
    // wild one: the drag stays live and recovers as soon as the cursor comes
    // back.
    if (along === null) return;

    const point = pointOnRay(ray, along);
    options.emit(transformUpdate(makeDelta({ translation: subVec3(point, drag.anchor) })));
  }

  // Handlers are closures rather than methods on the returned object: they are
  // handed straight to `addEventListener`, and a method detached from its
  // object is exactly the shape that loses its `this`.
  const pointerMove = (event: PointerSample): void => {
    if (!press) {
      const hit = options.pick(rayFor(event), { drillIn: drillIn(event) });
      options.emit(hover(hit?.resolvedId ?? null));
      return;
    }

    if (press.drag) {
      updateDrag(press.drag, event);
      return;
    }

    const movedX = event.clientX - press.screenX;
    const movedY = event.clientY - press.screenY;
    if (Math.hypot(movedX, movedY) < threshold) return;
    beginDrag(event, press);
  };

  const pointerDown = (event: PointerSample): void => {
    // Anything but the primary button belongs to the camera — see the header.
    if ((event.button ?? 0) !== 0) return;
    if (press) return;

    const hit = options.pick(rayFor(event), { drillIn: drillIn(event) });
    press = {
      pointerId: event.pointerId,
      screenX: event.clientX,
      screenY: event.clientY,
      hit,
      additive: additive(event),
      drag: null,
    };
    if (event.pointerId !== undefined) host?.setPointerCapture?.(event.pointerId);
  };

  const pointerUp = (event: PointerSample): void => {
    const current = press;
    if (!current) return;
    press = null;
    if (current.pointerId !== undefined) host?.releasePointerCapture?.(current.pointerId);

    if (current.drag) {
      updateDrag(current.drag, event);
      options.emit(transformCommit());
      return;
    }

    // A click. `null` is a click on empty space, which clears the selection —
    // and must still be emitted, or clicking away from a part would do nothing.
    options.emit(select(current.hit?.resolvedId ?? null, current.additive));
  };

  const pointerCancel = (reason: 'user' | 'interrupted' = 'interrupted'): void => {
    const current = press;
    press = null;
    if (current?.pointerId !== undefined) host?.releasePointerCapture?.(current.pointerId);
    if (current?.drag) options.emit(transformCancel(reason));
  };

  const onPointerCancelEvent = (): void => pointerCancel('interrupted');

  const detach = (): void => {
    if (!host) return;
    host.removeEventListener('pointermove', pointerMove);
    host.removeEventListener('pointerdown', pointerDown);
    host.removeEventListener('pointerup', pointerUp);
    host.removeEventListener('pointercancel', onPointerCancelEvent);
    host = null;
  };

  return {
    attach(next: PointerHost): void {
      detach();
      host = next;
      next.addEventListener('pointermove', pointerMove);
      next.addEventListener('pointerdown', pointerDown);
      next.addEventListener('pointerup', pointerUp);
      next.addEventListener('pointercancel', onPointerCancelEvent);
    },
    detach,
    pointerMove,
    pointerDown,
    pointerUp,
    pointerCancel,
    get dragging(): boolean {
      return press?.drag != null;
    },
  };
}
