/**
 * The things drawn around the solid rather than as part of it: the ground grid,
 * the selection box, and the drag ghost.
 *
 * All three are viewport furniture. None of them is in the document, none is
 * exported, and none survives into a `.carve` file — which is why they live
 * here and are driven by explicit `set*` calls from the viewport rather than by
 * subscribing to anything.
 *
 * ## The ghost, and the rule it exists to keep
 *
 * `src/kernel/index.ts` states it: **hand movement and kernel evaluation are
 * never coupled.** Dragging a primitive that feeds a boolean re-solves that
 * boolean on every pose, and the result arrives whenever it arrives. If the
 * viewport waited for it, the part would visibly lag the cursor and the app
 * would feel broken on a large tree.
 *
 * So during a drag two things are on screen at once: the last completed
 * evaluation, updating at whatever rate the worker sustains, and a translucent
 * ghost of the dragged subtree at its **live** transform, updating every frame.
 * #9 asks for this on desktop for the same reason #11 asks for it in the
 * headset — "it is not a headset-only concern, a large tree lags on a laptop
 * too".
 *
 * The ghost's geometry is evaluated once, when the drag begins, and then only
 * its matrix changes. That is what makes it free: a translate or a rotate does
 * not change the dragged subtree's own shape, only where it sits, so there is
 * nothing to re-evaluate for the ghost no matter how long the drag runs.
 */

import {
  BackSide,
  BufferAttribute,
  BufferGeometry,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
} from 'three';

import type { MeshPayload } from '../kernel/index.js';

import { applyMeshToGeometry } from './mesh.js';

/** Same shape as the renderer's `Bounds` and the input layer's `Aabb`. */
export interface OverlayBounds {
  readonly min: readonly [number, number, number];
  readonly max: readonly [number, number, number];
}

/** One selection marker: a node's local bounds, and where that node is. */
export interface SelectionBox {
  readonly bounds: OverlayBounds;
  /** Local → world, i.e. `CarveDocument.worldMatrix(nodeId)`. */
  readonly matrix: readonly number[];
  /** Drawn heavier than a plain selection. The node a gizmo is currently acting on. */
  readonly primary?: boolean;
}

export interface GhostState {
  /** Geometry evaluated once at drag start. `null` clears the ghost. */
  readonly mesh: MeshPayload | null;
  /** Where to put it this frame — see the header. */
  readonly matrix: readonly number[];
}

const SELECTION_COLOR = 0xffc247;
const PRIMARY_SELECTION_COLOR = 0xffe9a8;
const GHOST_COLOR = 0x8fd4ff;

/**
 * A unit cube's edges, instanced per selected node.
 *
 * One shared `EdgesGeometry` scaled by a per-box matrix rather than a geometry
 * per selection: a selection changes on every click, and rebuilding twelve
 * line segments each time would allocate and dispose GPU buffers at click
 * rate for something that is always the same twelve segments.
 */
export class SelectionOverlay {
  readonly group = new Group();
  readonly #geometry = new EdgesGeometry(new BoxGeometry(1, 1, 1));
  readonly #material = new LineBasicMaterial({
    color: SELECTION_COLOR,
    depthTest: false,
    transparent: true,
    opacity: 0.9,
  });
  readonly #primaryMaterial = new LineBasicMaterial({
    color: PRIMARY_SELECTION_COLOR,
    depthTest: false,
  });
  readonly #pool: LineSegments[] = [];

  constructor() {
    this.group.renderOrder = 900;
  }

  set(boxes: readonly SelectionBox[]): void {
    while (this.#pool.length < boxes.length) {
      const segments = new LineSegments(this.#geometry, this.#material);
      segments.matrixAutoUpdate = false;
      segments.renderOrder = 900;
      this.#pool.push(segments);
      this.group.add(segments);
    }

    this.#pool.forEach((segments, index) => {
      const box = boxes[index];
      if (!box) {
        segments.visible = false;
        return;
      }
      segments.visible = true;
      segments.material = box.primary === true ? this.#primaryMaterial : this.#material;
      // The shared geometry is a unit cube centred on the origin, so the box's
      // own size and centre go into the matrix rather than into vertices.
      const size = [0, 1, 2].map((axis) =>
        Math.max((box.bounds.max[axis] ?? 0) - (box.bounds.min[axis] ?? 0), 1e-6),
      );
      const centre = [0, 1, 2].map(
        (axis) => ((box.bounds.max[axis] ?? 0) + (box.bounds.min[axis] ?? 0)) / 2,
      );
      const local = new Matrix4()
        .makeTranslation(centre[0] ?? 0, centre[1] ?? 0, centre[2] ?? 0)
        .multiply(new Matrix4().makeScale(size[0] ?? 1, size[1] ?? 1, size[2] ?? 1));
      segments.matrix.copy(new Matrix4().fromArray([...box.matrix]).multiply(local));
      segments.matrixWorldNeedsUpdate = true;
    });
  }

  clear(): void {
    for (const segments of this.#pool) segments.visible = false;
  }

  dispose(): void {
    this.#geometry.dispose();
    this.#material.dispose();
    this.#primaryMaterial.dispose();
    this.#pool.length = 0;
  }
}

/**
 * The translucent copy of whatever is being dragged.
 *
 * Rendered back-faces-first with no depth write, which is the cheap way to make
 * a transparent solid read as a volume rather than as a flat wash: without it,
 * the far side of the ghost draws over the near side about half the time and
 * the shape stops being legible exactly when you need it most.
 */
export class GhostOverlay {
  readonly mesh: Mesh;
  readonly #geometry = new BufferGeometry();
  readonly #material = new MeshBasicMaterial({
    color: GHOST_COLOR,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: BackSide,
  });

  constructor() {
    this.mesh = new Mesh(this.#geometry, this.#material);
    this.mesh.visible = false;
    this.mesh.matrixAutoUpdate = false;
    this.mesh.renderOrder = 800;
  }

  set(state: GhostState | null): void {
    if (!state?.mesh || state.mesh.indices.length === 0) {
      this.mesh.visible = false;
      return;
    }
    applyMeshToGeometry(this.#geometry, state.mesh);
    this.mesh.matrix.copy(new Matrix4().fromArray([...state.matrix]));
    this.mesh.matrixWorldNeedsUpdate = true;
    this.mesh.visible = true;
  }

  dispose(): void {
    this.#geometry.dispose();
    this.#material.dispose();
  }
}

/**
 * A small cross drawn where a drag snapped to something.
 *
 * `resolveSnap` already returns the winning feature, and `src/input/snap.ts`
 * says why it must be shown: "a snap the user cannot see is indistinguishable
 * from the drag being laggy". Three axis-aligned segments, screen-scaled by the
 * caller, drawn in front of everything.
 */
export class SnapMarker {
  readonly lines: LineSegments;
  readonly #geometry = new BufferGeometry();
  readonly #material = new LineBasicMaterial({ color: 0xffffff, depthTest: false });

  constructor() {
    const arm = 1;
    this.#geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([-arm, 0, 0, arm, 0, 0, 0, -arm, 0, 0, arm, 0, 0, 0, -arm, 0, 0, arm]),
        3,
      ),
    );
    this.lines = new LineSegments(this.#geometry, this.#material);
    this.lines.visible = false;
    this.lines.matrixAutoUpdate = false;
    this.lines.renderOrder = 1100;
  }

  set(point: readonly [number, number, number] | null, size: number): void {
    if (!point) {
      this.lines.visible = false;
      return;
    }
    this.lines.matrix
      .makeTranslation(point[0], point[1], point[2])
      .multiply(new Matrix4().makeScale(size, size, size));
    this.lines.matrixWorldNeedsUpdate = true;
    this.lines.visible = true;
  }

  dispose(): void {
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
