/**
 * The scene, and the one evaluated solid in it.
 *
 * The document tree (#5) is many nodes, but the kernel (#6) evaluates it down
 * to a single mesh per request — see the worked example in
 * `src/kernel/index.ts`. So "mirror the document into three.js objects" does
 * not mean one `Object3D` per `CarveNode`; it means one `THREE.Mesh` whose
 * geometry is replaced whenever a fresher evaluation lands. That is also what
 * "reflected without a full scene rebuild" means in #4's done-when: `upload`
 * disposes the old `BufferGeometry` and swaps in the new one, and touches
 * nothing else — not the `Scene`, not the `Mesh`, not its material.
 *
 * Per-node highlighting, ghost previews during a drag (#9, #11) and ground
 * furniture (#13) all add more objects to this scene later. #9 added the
 * first of them — the ground grid, the selection boxes, the drag ghost, the
 * snap marker and the transform gizmo — and they are all *overlays*: they
 * hang off this scene beside the solid, they are driven by explicit calls
 * rather than by the kernel subscription, and none of them changes how the
 * solid itself is uploaded. See `overlay.ts` and `gizmo.ts`. #13 still owns
 * the shading of the solid, which nothing below touches.
 */

import { Mesh, Scene, type Object3D, type ShaderMaterial } from 'three';

import type { MeshPayload } from '../kernel/index.js';

import { GizmoOverlay, createGroundGrid, type GizmoState } from './gizmo.js';
import { applyMeshToGeometry, triangleCountOf } from './mesh.js';
import { createSolidMaterial } from './material.js';
import {
  GhostOverlay,
  SelectionOverlay,
  SnapMarker,
  type GhostState,
  type SelectionBox,
} from './overlay.js';

/**
 * How far the ground grid reaches, and its fine division, in metres.
 *
 * The 10mm fine step with a major line every tenth gives 100mm majors — the two
 * numbers a machinist reads a drawing in. 1m of reach is roughly three times
 * the working volume the camera starts framed on and comfortably past the
 * largest single primitive the registry allows (`MAX_SIZE` is 2m, but a 2m
 * primitive is one you are looking at from far enough away that the floor under
 * it has stopped mattering). Doubling the extent quadruples the line count for
 * a floor that is already faded to nothing at its edges.
 */
const GRID_EXTENT = 1;
const GRID_STEP = 0.01;

export class SceneGraph {
  readonly scene = new Scene();
  readonly #solid: Mesh;
  /** Same object as `#solid.material` — kept typed, since `Mesh.material` widens to an array. */
  readonly #material: ShaderMaterial;
  readonly #grid = createGroundGrid(GRID_EXTENT, GRID_STEP);
  readonly #selection = new SelectionOverlay();
  readonly #ghost = new GhostOverlay();
  readonly #snapMarker = new SnapMarker();
  readonly #gizmo = new GizmoOverlay();
  #triangleCount = 0;

  constructor() {
    this.#material = createSolidMaterial();
    this.#solid = new Mesh(undefined, this.#material);
    this.#solid.visible = false;
    this.scene.add(this.#solid);
    this.scene.add(this.#grid);
    this.scene.add(this.#selection.group);
    this.scene.add(this.#ghost.mesh);
    this.scene.add(this.#snapMarker.lines);
    this.scene.add(this.#gizmo.group);
  }

  get triangleCount(): number {
    return this.#triangleCount;
  }

  /**
   * The evaluated solid itself, as distinct from the overlays around it.
   *
   * Exposed for the tests, which used to reach for `scene.children[0]` and
   * were quietly asserting that the scene contained nothing else — an
   * assumption #9's overlays broke the moment they were added. `Object3D`
   * rather than `Mesh`: this class is internal to `src/render/`, but there is
   * still no reason to hand out anything with a `geometry` on it.
   */
  get solid(): Object3D {
    return this.#solid;
  }

  // --- Overlays -------------------------------------------------------------
  //
  // Deliberately imperative setters rather than a single `setOverlayState`
  // object: the viewport updates the gizmo every frame, the selection only on
  // a selection change, and the ghost only during a drag. One combined call
  // would mean rebuilding all of it at the highest of those rates.

  setGridVisible(visible: boolean): void {
    this.#grid.visible = visible;
  }

  setSelection(boxes: readonly SelectionBox[]): void {
    this.#selection.set(boxes);
  }

  setGhost(state: GhostState | null): void {
    this.#ghost.set(state);
  }

  setSnapMarker(point: readonly [number, number, number] | null, size: number): void {
    this.#snapMarker.set(point, size);
  }

  setGizmo(state: GizmoState | null): void {
    if (state === null) this.#gizmo.clear();
    else this.#gizmo.update(state);
  }

  /**
   * Replace the drawn solid with `mesh`. An empty mesh hides it.
   *
   * Reuses the `Mesh`'s existing `BufferGeometry` rather than allocating a
   * new one — `applyMeshToGeometry` disposes nothing itself, so the caller
   * (here) owns dropping the previous attributes' GPU buffers, which three.js
   * does automatically the next time the renderer notices they were replaced.
   */
  upload(mesh: MeshPayload): void {
    if (mesh.indices.length === 0) {
      this.#solid.visible = false;
      this.#triangleCount = 0;
      return;
    }

    applyMeshToGeometry(this.#solid.geometry, mesh);
    this.#solid.visible = true;
    this.#triangleCount = triangleCountOf(mesh);
  }

  dispose(): void {
    this.#solid.geometry.dispose();
    this.#material.dispose();
    this.#grid.geometry.dispose();
    (Array.isArray(this.#grid.material) ? this.#grid.material : [this.#grid.material]).forEach(
      (material) => material.dispose(),
    );
    this.#selection.dispose();
    this.#ghost.dispose();
    this.#snapMarker.dispose();
    this.#gizmo.dispose();
  }
}
