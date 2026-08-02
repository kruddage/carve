/**
 * Kernel mesh buffers → a `THREE.BufferGeometry`, without a copy.
 *
 * `MeshPayload.vertices` is already interleaved `[px, py, pz, nx, ny, nz]` —
 * see the protocol note in `src/kernel/protocol.ts` — which is exactly what
 * `THREE.InterleavedBuffer` wants. Wrapping the same `Float32Array` (and the
 * same `Uint32Array` for indices) rather than copying into separate
 * `position`/`normal` attributes is the whole point: a full evaluation can be
 * several hundred thousand vertices, and a drag frame arrives often enough
 * that a copy on the main thread would be its own dropped-frame source.
 *
 * Normals are never recomputed here. `meshFromSolid` (#6) already baked in
 * crease-threshold normals at the kernel, so a flat face of a box stays flat
 * and the round wall of a cylinder stays smooth — recomputing per-vertex
 * normals from triangle winding on this side of the wire would throw that
 * away and average every hard edge into a bevel.
 */

import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
} from 'three';

import type { MeshPayload } from '../kernel/index.js';

/** Build a `BufferGeometry` view over `mesh`'s own buffers — no allocation. */
export function geometryFromMesh(mesh: MeshPayload): BufferGeometry {
  const geometry = new BufferGeometry();
  applyMeshToGeometry(geometry, mesh);
  return geometry;
}

/**
 * Re-point an existing geometry at a fresher mesh.
 *
 * Used on every evaluated result so uploading a new mesh disposes the old
 * GPU buffers and swaps in the new ones without touching the `THREE.Mesh`,
 * the scene graph, or the renderer around it — see `scene-graph.ts`.
 */
export function applyMeshToGeometry(geometry: BufferGeometry, mesh: MeshPayload): void {
  const interleaved = new InterleavedBuffer(mesh.vertices, mesh.stride);
  const position = new InterleavedBufferAttribute(interleaved, 3, mesh.positionOffset, false);
  const normal = new InterleavedBufferAttribute(interleaved, 3, mesh.normalOffset, false);

  geometry.setAttribute('position', position);
  geometry.setAttribute('normal', normal);
  geometry.setIndex(new BufferAttribute(mesh.indices, 1, false));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
}

/** Triangle count of `mesh`, for the instrumentation overlay (#15). */
export function triangleCountOf(mesh: MeshPayload): number {
  return Math.floor(mesh.indices.length / 3);
}
