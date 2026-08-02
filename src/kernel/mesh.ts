/**
 * A solid's surface, as the buffers #4 uploads.
 *
 * One function, extracted because two callers need exactly the same answer and
 * a second implementation of it would be a second convention: `evaluate.ts`
 * runs it on the root of a document walk, and `preview.ts` runs it on a lone
 * primitive built for a thumbnail. A thumbnail whose crease threshold differed
 * from the viewport's would show a faceted sphere in the wrist menu and a
 * smooth one in the scene, for no reason a user could act on.
 *
 * ## Normals come from `manifold-3d`, at a crease threshold
 *
 * `calculateNormals(0, creaseAngle)` splits a vertex into one per adjacent face
 * wherever the dihedral angle exceeds the threshold, and shares it everywhere
 * else. That is the hard-surface requirement exactly — machined edges stay
 * crisp, tessellated cylinders stay round — and doing it inside WASM over the
 * whole mesh is an order of magnitude quicker than the equivalent walk in JS,
 * on the thread where the time is cheapest to spend.
 *
 * The `0` is the property channel the normals are written into. It is the only
 * channel there is, which is why `numProp` is asserted below: if a future
 * `manifold-3d` wrote something else alongside them, every attribute offset
 * downstream would be silently misaligned and the mesh would render as noise.
 *
 * ## The derived solid is not kept
 *
 * `calculateNormals` returns a new solid, and it is deleted as soon as its mesh
 * has been read. It is keyed by crease angle as well as by geometry, so caching
 * it would double the cache's memory for a pass that costs a fraction of a
 * boolean.
 */

import { NORMAL_OFFSET, POSITION_OFFSET, VERTEX_STRIDE, type MeshPayload } from './protocol.js';
import type { Solid } from './solids.js';

/**
 * Interleaved position-and-normal buffers for `solid`.
 *
 * `creaseAngle` is in degrees. The caller keeps ownership of `solid`; nothing
 * here frees it.
 */
export function meshFromSolid(solid: Solid, creaseAngle: number): MeshPayload {
  const withNormals = solid.calculateNormals(0, creaseAngle);
  try {
    const mesh = withNormals.getMesh();
    if (mesh.numProp !== VERTEX_STRIDE) {
      // Unreachable unless `calculateNormals` changes what it writes, which
      // would silently mis-key every attribute offset downstream.
      throw new Error(`Expected ${VERTEX_STRIDE} properties per vertex, got ${mesh.numProp}`);
    }
    return {
      vertices: mesh.vertProperties,
      indices: mesh.triVerts,
      stride: VERTEX_STRIDE,
      positionOffset: POSITION_OFFSET,
      normalOffset: NORMAL_OFFSET,
    };
  } finally {
    withNormals.delete();
  }
}
