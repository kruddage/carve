/**
 * GLB: the container, the accessors, and the conventions that have to line up.
 *
 * The file is taken apart with a parser written here — chunk headers, then the
 * JSON, then the accessors read out of the binary chunk by their own declared
 * offsets and stride. That is the same work a viewer does, which is what makes
 * this a test of the file rather than of the encoder's intentions: if an offset
 * is wrong, reading through it produces the wrong vertices here exactly as it
 * would in Blender.
 *
 * The alignment and padding assertions look pedantic and are not. A GLB with an
 * unpadded chunk loads in most viewers and is rejected by the Khronos
 * validator, so the failure surfaces long after the change that caused it and
 * somewhere nobody is looking.
 */

import { describe, expect, it } from 'vitest';

import { VERTEX_STRIDE, type MeshPayload } from '../src/kernel/index.js';
import { DEFAULT_GLB_GENERATOR, encodeGlb } from '../src/io/index.js';

/** A tetrahedron: four vertices, four faces, no symmetry to hide an axis swap. */
function tetraMesh(): MeshPayload {
  const corners: [number, number, number][] = [
    [0, 0, 0],
    [0.2, 0, 0],
    [0, 0.3, 0],
    [0, 0, 0.4],
  ];
  const vertices = new Float32Array(corners.length * VERTEX_STRIDE);
  corners.forEach((corner, index) => {
    const base = index * VERTEX_STRIDE;
    vertices.set(corner, base);
    vertices.set([index, index + 1, index + 2], base + 3);
  });
  return {
    vertices,
    indices: new Uint32Array([0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3]),
    stride: VERTEX_STRIDE,
    positionOffset: 0,
    normalOffset: 3,
  };
}

interface Glb {
  readonly json: Record<string, unknown>;
  readonly bin: Uint8Array;
  readonly jsonChunkLength: number;
  readonly binChunkLength: number;
  readonly totalLength: number;
}

/** An independent GLB reader — the parse a viewer performs. */
function decodeGlb(buffer: ArrayBuffer): Glb {
  const view = new DataView(buffer);
  expect(view.getUint32(0, true)).toBe(0x46546c67);
  expect(view.getUint32(4, true)).toBe(2);
  const totalLength = view.getUint32(8, true);
  expect(totalLength).toBe(buffer.byteLength);

  const jsonChunkLength = view.getUint32(12, true);
  expect(view.getUint32(16, true)).toBe(0x4e4f534a);
  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLength);

  const binHeader = 20 + jsonChunkLength;
  const binChunkLength = view.getUint32(binHeader, true);
  expect(view.getUint32(binHeader + 4, true)).toBe(0x004e4942);
  const bin = new Uint8Array(buffer, binHeader + 8, binChunkLength);

  return {
    json: JSON.parse(new TextDecoder().decode(jsonBytes)) as Record<string, unknown>,
    bin,
    jsonChunkLength,
    binChunkLength,
    totalLength,
  };
}

/** Read a `VEC3` float accessor through its buffer view, stride included. */
function readVec3Accessor(glb: Glb, index: number): [number, number, number][] {
  const accessors = glb.json['accessors'] as Record<string, number>[];
  const views = glb.json['bufferViews'] as Record<string, number>[];
  const accessor = accessors[index]!;
  const view = views[accessor['bufferView']!]!;
  const stride = view['byteStride'] ?? 12;
  const start = (view['byteOffset'] ?? 0) + (accessor['byteOffset'] ?? 0);
  const data = new DataView(glb.bin.buffer, glb.bin.byteOffset);

  const out: [number, number, number][] = [];
  for (let i = 0; i < accessor['count']!; i += 1) {
    const base = start + i * stride;
    out.push([
      data.getFloat32(base, true),
      data.getFloat32(base + 4, true),
      data.getFloat32(base + 8, true),
    ]);
  }
  return out;
}

function readIndices(glb: Glb, index: number): number[] {
  const accessors = glb.json['accessors'] as Record<string, number>[];
  const views = glb.json['bufferViews'] as Record<string, number>[];
  const accessor = accessors[index]!;
  const view = views[accessor['bufferView']!]!;
  const data = new DataView(glb.bin.buffer, glb.bin.byteOffset);
  const start = (view['byteOffset'] ?? 0) + (accessor['byteOffset'] ?? 0);
  return Array.from({ length: accessor['count']! }, (_, i) => data.getUint32(start + i * 4, true));
}

/** Compare vectors read from a float32 buffer, which 0.2 does not survive exactly. */
function expectVec3Close(
  actual: readonly (readonly [number, number, number])[],
  expected: readonly (readonly [number, number, number])[],
): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((vector, index) => {
    vector.forEach((value, axis) => {
      expect(value).toBeCloseTo(expected[index]![axis]!, 6);
    });
  });
}

describe('the container', () => {
  it('is a valid GLB with two chunks and a self-consistent length', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh()));

    expect(glb.totalLength).toBe(12 + 8 + glb.jsonChunkLength + 8 + glb.binChunkLength);
    expect(glb.json['asset']).toMatchObject({ version: '2.0' });
  });

  it('pads both chunks to four bytes — JSON with spaces, BIN with zeros', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh()));

    expect(glb.jsonChunkLength % 4).toBe(0);
    expect(glb.binChunkLength % 4).toBe(0);
    // The JSON chunk stays parseable as text because the padding is 0x20; the
    // decode above would have thrown otherwise.
    expect(glb.jsonChunkLength).toBeGreaterThan(0);
  });

  it('names the generator, which is what a viewer shows', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh(), { generator: 'Carve 1.2.3' }));

    expect(glb.json['asset']).toMatchObject({ generator: 'Carve 1.2.3' });
    expect(DEFAULT_GLB_GENERATOR).toBe('Carve');
  });

  it('describes one scene, one node, one mesh, one primitive', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh(), { name: 'Bracket' }));

    expect(glb.json['scene']).toBe(0);
    expect(glb.json['scenes']).toEqual([{ nodes: [0] }]);
    expect(glb.json['nodes']).toEqual([{ mesh: 0, name: 'Bracket' }]);
    const meshes = glb.json['meshes'] as { primitives: Record<string, unknown>[] }[];
    expect(meshes[0]?.primitives).toHaveLength(1);
    expect(meshes[0]?.primitives[0]).toMatchObject({
      attributes: { POSITION: 0, NORMAL: 1 },
      indices: 2,
      mode: 4,
    });
  });

  it('carries no material, so a viewer draws its own default', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh()));

    expect(glb.json['materials']).toBeUndefined();
    const meshes = glb.json['meshes'] as { primitives: Record<string, unknown>[] }[];
    expect(meshes[0]?.primitives[0]?.['material']).toBeUndefined();
  });
});

describe('the geometry, read back through the accessors', () => {
  it('round-trips positions and normals from one interleaved view', () => {
    const mesh = tetraMesh();

    const glb = decodeGlb(encodeGlb(mesh));

    const views = glb.json['bufferViews'] as Record<string, number>[];
    expect(views[0]?.['byteStride']).toBe(VERTEX_STRIDE * 4);
    expect(views).toHaveLength(2);

    // Compared with a tolerance, not exactly: the file stores float32, so
    // 0.2 comes back as the nearest float32 and an exact comparison would be
    // asserting a property of IEEE 754 rather than of the exporter.
    expectVec3Close(readVec3Accessor(glb, 0), [
      [0, 0, 0],
      [0.2, 0, 0],
      [0, 0.3, 0],
      [0, 0, 0.4],
    ]);
    expect(readVec3Accessor(glb, 1)[2]).toEqual([2, 3, 4]);
    expect(readIndices(glb, 2)).toEqual([...mesh.indices]);
  });

  it('declares POSITION min and max, which viewers use to frame the camera', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh()));

    const accessors = glb.json['accessors'] as Record<string, number[]>[];
    expect(accessors[0]?.['min']).toEqual([0, 0, 0]);
    // The bounds are written as the float32 values actually stored, which is
    // what the specification asks for — hence a tolerance rather than 0.2.
    expectVec3Close([accessors[0]?.['max'] as [number, number, number]], [[0.2, 0.3, 0.4]]);
    // NORMAL needs none, and adding it would be noise a validator flags.
    expect(accessors[1]?.['min']).toBeUndefined();
  });

  it('writes metres, unscaled, because that is glTF’s unit', () => {
    // The document stores metres, so a 200mm plate is 0.2 in the file. This is
    // the asymmetry with STL, and it is deliberate — see src/io/units.ts.
    const glb = decodeGlb(encodeGlb(tetraMesh()));

    expect(readVec3Accessor(glb, 0)[1]?.[0]).toBeCloseTo(0.2, 6);
  });

  it('scales positions and leaves normals alone when asked', () => {
    const glb = decodeGlb(encodeGlb(tetraMesh(), { scale: 1000 }));

    expect(readVec3Accessor(glb, 0)[1]?.[0]).toBeCloseTo(200, 3);
    expect(readVec3Accessor(glb, 1)[2]).toEqual([2, 3, 4]);
  });

  it('does not mutate the mesh it was given', () => {
    const mesh = tetraMesh();
    const before = Float32Array.from(mesh.vertices);

    encodeGlb(mesh, { scale: 1000 });

    expect(mesh.vertices).toEqual(before);
  });

  it('writes a legal file for an empty mesh instead of Infinity bounds', () => {
    const empty: MeshPayload = {
      vertices: new Float32Array(0),
      indices: new Uint32Array(0),
      stride: VERTEX_STRIDE,
      positionOffset: 0,
      normalOffset: 3,
    };

    const glb = decodeGlb(encodeGlb(empty));

    const accessors = glb.json['accessors'] as Record<string, unknown>[];
    expect(accessors[0]).toMatchObject({ count: 0, min: [0, 0, 0], max: [0, 0, 0] });
  });
});
