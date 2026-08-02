/**
 * Binary STL, for printing.
 *
 * The kernel already emits exactly what STL wants — a flat list of triangles
 * with no shared topology — so this is a transcription rather than a
 * conversion. There is no tessellation decision here and there must not be
 * one: the mesh a slicer receives is the mesh the viewport drew, and a second
 * triangulation path would be a second chance to be wrong about the part.
 *
 * ## Binary, not ASCII
 *
 * ASCII STL is ~7× larger and slower to parse for no benefit anyone consuming
 * it cares about. Every slicer reads binary. The only argument for ASCII is
 * human readability of a triangle soup, which is not a thing anyone does.
 *
 * ## Millimetres
 *
 * STL declares no unit. Every slicer in the world assumes millimetres, so the
 * export scales metres to millimetres exactly once, here, through
 * `METRES_TO_MILLIMETRES` — see `units.ts` for why that constant is derived
 * from `PARAMETER_UNITS` rather than written as `* 1000`.
 *
 * ## Normals are recomputed per facet, not copied
 *
 * The mesh carries per-*vertex* normals, split at #6's crease threshold so hard
 * edges read as hard. STL's normal is per *facet*, and the two are not the same
 * quantity: on a smooth cylinder wall the three vertex normals of a triangle
 * point in three different directions, and picking one of them would write a
 * facet normal that disagrees with the facet's own winding.
 *
 * So each facet's normal is the normalized cross product of its own edges,
 * which is what the geometry actually says. A degenerate triangle — zero area,
 * which manifold should never emit but a hand-built mesh could — gets a zero
 * normal, the value the format reserves for "derive it from the winding".
 */

import { VERTEX_STRIDE, type MeshPayload } from '../kernel/index.js';

import { METRES_TO_MILLIMETRES } from './units.js';

/** Bytes of fixed header before the triangle count. Spec-defined. */
const HEADER_BYTES = 80;
/** Bytes per triangle: normal + three positions, 12 floats, plus `uint16`. */
const TRIANGLE_BYTES = 50;

export interface StlOptions {
  /**
   * Multiplier applied to every coordinate. Defaults to metres → millimetres.
   *
   * A caller with a reason to write metres can pass `1`; nobody printing a part
   * has that reason. See `units.ts`.
   */
  readonly scale?: number;
  /**
   * The 80-byte header text. Truncated to fit, ASCII only.
   *
   * Never starts with `solid`: a binary file whose header begins with that word
   * is misdetected as ASCII STL by parsers that sniff the first five bytes,
   * which is a real failure mode and a very confusing one. `encodeBinaryStl`
   * enforces it rather than trusting the caller.
   */
  readonly header?: string;
}

/** The default header. Identifies the writer, which is what headers are for. */
export const DEFAULT_STL_HEADER = 'Carve — https://github.com/kruddage/carve';

/**
 * `mesh` as a binary STL file.
 *
 * The returned buffer is exactly `84 + 50n` bytes and is safe to hand straight
 * to a `Blob`.
 */
export function encodeBinaryStl(mesh: MeshPayload, options: StlOptions = {}): ArrayBuffer {
  const scale = options.scale ?? METRES_TO_MILLIMETRES;
  const triangles = Math.floor(mesh.indices.length / 3);

  const buffer = new ArrayBuffer(HEADER_BYTES + 4 + triangles * TRIANGLE_BYTES);
  const view = new DataView(buffer);

  writeHeader(new Uint8Array(buffer, 0, HEADER_BYTES), options.header ?? DEFAULT_STL_HEADER);
  // Little-endian throughout, which the format mandates — the `true` argument
  // on every write below is not a preference.
  view.setUint32(HEADER_BYTES, triangles, true);

  let offset = HEADER_BYTES + 4;
  for (let i = 0; i < triangles; i += 1) {
    const a = vertexAt(mesh, mesh.indices[i * 3] ?? 0, scale);
    const b = vertexAt(mesh, mesh.indices[i * 3 + 1] ?? 0, scale);
    const c = vertexAt(mesh, mesh.indices[i * 3 + 2] ?? 0, scale);

    offset = writeVec3(view, offset, facetNormal(a, b, c));
    offset = writeVec3(view, offset, a);
    offset = writeVec3(view, offset, b);
    offset = writeVec3(view, offset, c);
    // Attribute byte count. Some tools smuggle colour in here; a `0` is what
    // "no attributes" means and is what every slicer expects.
    view.setUint16(offset, 0, true);
    offset += 2;
  }

  return buffer;
}

/** Bytes an STL of this mesh will occupy, without building it. */
export function stlByteLength(mesh: MeshPayload): number {
  return HEADER_BYTES + 4 + Math.floor(mesh.indices.length / 3) * TRIANGLE_BYTES;
}

type Vec3Tuple = readonly [number, number, number];

function vertexAt(mesh: MeshPayload, vertex: number, scale: number): Vec3Tuple {
  const base = vertex * VERTEX_STRIDE + mesh.positionOffset;
  return [
    (mesh.vertices[base] ?? 0) * scale,
    (mesh.vertices[base + 1] ?? 0) * scale,
    (mesh.vertices[base + 2] ?? 0) * scale,
  ];
}

function facetNormal(a: Vec3Tuple, b: Vec3Tuple, c: Vec3Tuple): Vec3Tuple {
  const u: Vec3Tuple = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: Vec3Tuple = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: Vec3Tuple = [
    u[1] * v[2] - u[2] * v[1],
    u[2] * v[0] - u[0] * v[2],
    u[0] * v[1] - u[1] * v[0],
  ];
  const length = Math.hypot(n[0], n[1], n[2]);
  if (length === 0) return [0, 0, 0];
  return [n[0] / length, n[1] / length, n[2] / length];
}

function writeVec3(view: DataView, offset: number, v: Vec3Tuple): number {
  view.setFloat32(offset, v[0], true);
  view.setFloat32(offset + 4, v[1], true);
  view.setFloat32(offset + 8, v[2], true);
  return offset + 12;
}

/**
 * Write `text` into the 80-byte header, ASCII-only and never leading `solid`.
 *
 * Non-ASCII is dropped rather than encoded: the header has no declared
 * encoding, so a UTF-8 em dash in it is bytes a reader will render as mojibake
 * at best. The default header contains one, deliberately — this is the code
 * path that has to handle it, not the constant that has to avoid it.
 */
function writeHeader(header: Uint8Array, text: string): void {
  const ascii = text.replace(/[^ -~]/g, '');
  const safe = /^\s*solid/i.test(ascii) ? `Carve ${ascii}` : ascii;
  for (let i = 0; i < header.length; i += 1) {
    header[i] = i < safe.length ? safe.charCodeAt(i) & 0x7f : 0;
  }
}
