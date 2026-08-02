/**
 * GLB, for sharing and for looking at somewhere that is not this app.
 *
 * The container is written by hand — about a hundred lines of `DataView` — and
 * that is cheaper than it looks. three.js ships `GLTFExporter`, but reaching
 * for it would mean the export path takes a `THREE.Mesh`, which would put a
 * renderer object between the kernel's buffers and the file. Exporting would
 * then only work once the scene had been built, could not be tested in Node,
 * and would silently export whatever the renderer had decided to do to the
 * geometry (a merged attribute, a modified index) rather than what the kernel
 * evaluated. `src/io/` takes `MeshPayload`, the same input as the STL path, and
 * stays runnable with no GPU anywhere.
 *
 * ## The interleaved buffer is written verbatim
 *
 * glTF supports a `byteStride` on a buffer view, which is exactly the layout
 * `MeshPayload` already has: `[px, py, pz, nx, ny, nz]` per vertex. So POSITION
 * and NORMAL are two accessors into one view at offsets 0 and 12, and the
 * vertex bytes are `memcpy`'d rather than de-interleaved. The saving is real on
 * a large part, and the deeper point is that no code here re-derives geometry.
 *
 * ## Conventions that happen to line up, and are asserted anyway
 *
 * glTF 2.0 is right-handed, +Y up, counter-clockwise front faces, and metres.
 * `src/kernel/solids.ts` already resolves Z-up (how CAD parameters read) to
 * Y-up (what the renderer and WebXR want) at the primitive-construction seam,
 * and manifold emits CCW triangles. So this exporter transforms nothing — no
 * axis swap, no winding flip, no unit scale — which is the best possible
 * outcome and an invisible one. `test/io-gltf.test.ts` asserts a known box
 * comes out the right way up and the right size, so the day one of those
 * conventions changes upstream, a test fails here rather than a part arriving
 * on its side in someone else's viewer.
 */

import { VERTEX_STRIDE, type MeshPayload } from '../kernel/index.js';

import { METRES_TO_GLTF } from './units.js';

const GLB_MAGIC = 0x46546c67; // 'glTF'
const GLB_VERSION = 2;
const GLB_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;
const CHUNK_TYPE_JSON = 0x4e4f534a; // 'JSON'
const CHUNK_TYPE_BIN = 0x004e4942; // 'BIN\0'

/** glTF component types, from the specification's enum. */
const COMPONENT_FLOAT = 5126;
const COMPONENT_UNSIGNED_INT = 5125;
/** Buffer view targets: `ARRAY_BUFFER` and `ELEMENT_ARRAY_BUFFER`. */
const TARGET_ARRAY_BUFFER = 34962;
const TARGET_ELEMENT_ARRAY_BUFFER = 34963;
/** Primitive mode 4 is `TRIANGLES`. */
const MODE_TRIANGLES = 4;

export interface GlbOptions {
  /** Node and mesh name in the asset. Defaults to `'Carve'`. */
  readonly name?: string;
  /**
   * Multiplier applied to positions. Defaults to `1` — glTF's unit is already
   * the document's. See `units.ts`; this exists so a caller who wants a
   * millimetre-scaled asset for a specific downstream tool can say so
   * explicitly rather than editing the exporter.
   */
  readonly scale?: number;
  /** Written into `asset.generator`, where a viewer will show it. */
  readonly generator?: string;
}

export const DEFAULT_GLB_GENERATOR = 'Carve';

/**
 * `mesh` as a self-contained `.glb` file: one buffer, one mesh, one node.
 *
 * Materials are deliberately absent. A glTF with no material renders with the
 * viewer's default, which is the honest representation of a part whose
 * appearance lives in #13's shading rather than in the document — and a
 * hand-written PBR material here would be a second, diverging description of
 * how a Carve part is supposed to look.
 */
export function encodeGlb(mesh: MeshPayload, options: GlbOptions = {}): ArrayBuffer {
  const scale = options.scale ?? METRES_TO_GLTF;
  const name = options.name ?? DEFAULT_GLB_GENERATOR;

  const vertexCount = Math.floor(mesh.vertices.length / VERTEX_STRIDE);
  const vertices = scale === 1 ? mesh.vertices : scalePositions(mesh, scale);

  const vertexBytes = vertices.byteLength;
  const indexBytes = mesh.indices.byteLength;
  // Both views are 4-byte-aligned by construction: the vertex block is a whole
  // number of 24-byte vertices, and it precedes the indices. Asserting it is
  // cheaper than debugging a viewer that rejects the file with "accessor
  // offset must be a multiple of the component size".
  if (vertexBytes % 4 !== 0) throw new Error(`Vertex block is not 4-byte aligned: ${vertexBytes}`);

  const bounds = positionBounds(vertices, mesh.positionOffset);

  const json = {
    asset: { version: '2.0', generator: options.generator ?? DEFAULT_GLB_GENERATOR },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [
      {
        name,
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            mode: MODE_TRIANGLES,
          },
        ],
      },
    ],
    accessors: [
      {
        bufferView: 0,
        byteOffset: mesh.positionOffset * Float32Array.BYTES_PER_ELEMENT,
        componentType: COMPONENT_FLOAT,
        count: vertexCount,
        type: 'VEC3',
        // Required on POSITION by the specification, and used by viewers to
        // frame the camera. A file without it opens zoomed to nothing.
        min: bounds.min,
        max: bounds.max,
      },
      {
        bufferView: 0,
        byteOffset: mesh.normalOffset * Float32Array.BYTES_PER_ELEMENT,
        componentType: COMPONENT_FLOAT,
        count: vertexCount,
        type: 'VEC3',
      },
      {
        bufferView: 1,
        componentType: COMPONENT_UNSIGNED_INT,
        count: mesh.indices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: vertexBytes,
        byteStride: VERTEX_STRIDE * Float32Array.BYTES_PER_ELEMENT,
        target: TARGET_ARRAY_BUFFER,
      },
      {
        buffer: 0,
        byteOffset: vertexBytes,
        byteLength: indexBytes,
        target: TARGET_ELEMENT_ARRAY_BUFFER,
      },
    ],
    buffers: [{ byteLength: vertexBytes + indexBytes }],
  };

  return assembleGlb(new TextEncoder().encode(JSON.stringify(json)), vertices, mesh.indices);
}

/**
 * Lay out the two chunks and the header.
 *
 * Both chunks are padded to a four-byte boundary — JSON with spaces, BIN with
 * zeros, as the specification requires. Getting the padding byte wrong produces
 * a file that most viewers accept and the strict validator rejects, which is
 * the worst kind of wrong: it works until it is someone else's problem.
 */
function assembleGlb(json: Uint8Array, vertices: Float32Array, indices: Uint32Array): ArrayBuffer {
  const jsonLength = padTo4(json.byteLength);
  const binLength = padTo4(vertices.byteLength + indices.byteLength);
  const total = GLB_HEADER_BYTES + CHUNK_HEADER_BYTES * 2 + jsonLength + binLength;

  const buffer = new ArrayBuffer(total);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint32(0, GLB_MAGIC, true);
  view.setUint32(4, GLB_VERSION, true);
  view.setUint32(8, total, true);

  view.setUint32(GLB_HEADER_BYTES, jsonLength, true);
  view.setUint32(GLB_HEADER_BYTES + 4, CHUNK_TYPE_JSON, true);
  const jsonStart = GLB_HEADER_BYTES + CHUNK_HEADER_BYTES;
  bytes.set(json, jsonStart);
  // 0x20, not 0x00: the JSON chunk is padded with spaces so the chunk stays
  // parseable as text.
  bytes.fill(0x20, jsonStart + json.byteLength, jsonStart + jsonLength);

  const binHeader = jsonStart + jsonLength;
  view.setUint32(binHeader, binLength, true);
  view.setUint32(binHeader + 4, CHUNK_TYPE_BIN, true);
  const binStart = binHeader + CHUNK_HEADER_BYTES;
  bytes.set(new Uint8Array(vertices.buffer, vertices.byteOffset, vertices.byteLength), binStart);
  bytes.set(
    new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength),
    binStart + vertices.byteLength,
  );

  return buffer;
}

function padTo4(length: number): number {
  return (length + 3) & ~3;
}

/** A copy of the interleaved buffer with positions scaled and normals left alone. */
function scalePositions(mesh: MeshPayload, scale: number): Float32Array {
  const scaled = mesh.vertices.slice();
  for (let base = 0; base < scaled.length; base += VERTEX_STRIDE) {
    for (let axis = 0; axis < 3; axis += 1) {
      const index = base + mesh.positionOffset + axis;
      scaled[index] = (scaled[index] ?? 0) * scale;
    }
  }
  return scaled;
}

function positionBounds(
  vertices: Float32Array,
  positionOffset: number,
): { min: number[]; max: number[] } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let base = 0; base < vertices.length; base += VERTEX_STRIDE) {
    for (let axis = 0; axis < 3; axis += 1) {
      const value = vertices[base + positionOffset + axis] ?? 0;
      min[axis] = Math.min(min[axis] ?? Infinity, value);
      max[axis] = Math.max(max[axis] ?? -Infinity, value);
    }
  }
  // An empty mesh would otherwise write ±Infinity, which is not valid JSON and
  // serializes as `null`. Zeroes are the degenerate-but-legal answer.
  if (!Number.isFinite(min[0])) return { min: [0, 0, 0], max: [0, 0, 0] };
  return { min, max };
}
