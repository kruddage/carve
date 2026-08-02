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
 * furniture (#13) all add more objects to this scene later. Nothing here
 * forecloses that; there is just nothing here yet, because #4 has no gizmos,
 * no selection and no shading to draw them with.
 */

import { Mesh, Scene, type ShaderMaterial } from 'three';

import type { MeshPayload } from '../kernel/index.js';

import { applyMeshToGeometry, triangleCountOf } from './mesh.js';
import { createSolidMaterial } from './material.js';

export class SceneGraph {
  readonly scene = new Scene();
  readonly #solid: Mesh;
  /** Same object as `#solid.material` — kept typed, since `Mesh.material` widens to an array. */
  readonly #material: ShaderMaterial;
  #triangleCount = 0;

  constructor() {
    this.#material = createSolidMaterial();
    this.#solid = new Mesh(undefined, this.#material);
    this.#solid.visible = false;
    this.scene.add(this.#solid);
  }

  get triangleCount(): number {
    return this.#triangleCount;
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
  }
}
