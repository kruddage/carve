/**
 * Binary STL: the layout a slicer parses, and the units it assumes.
 *
 * The file is decoded back with an independent reader written here rather than
 * being compared to a golden blob. A golden file would fail on any change to
 * `manifold-3d`'s triangulation while proving nothing about whether the bytes
 * are laid out the way the format says; decoding proves the layout, and the
 * geometric assertions on top of it are the ones that survive an upgrade.
 */

import { describe, expect, it } from 'vitest';

import { PARAMETER_UNITS } from '../src/core/index.js';
import { VERTEX_STRIDE, type MeshPayload } from '../src/kernel/index.js';
import {
  DEFAULT_STL_HEADER,
  METRES_TO_MILLIMETRES,
  encodeBinaryStl,
  stlByteLength,
} from '../src/io/index.js';

/** A unit cube, 1m on a side, centred on the origin. Twelve triangles. */
function cubeMesh(half = 0.5): MeshPayload {
  const corners: [number, number, number][] = [
    [-half, -half, -half],
    [half, -half, -half],
    [half, half, -half],
    [-half, half, -half],
    [-half, -half, half],
    [half, -half, half],
    [half, half, half],
    [-half, half, half],
  ];
  const faces: [number, number, number][] = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
    [0, 1, 5],
    [0, 5, 4],
    [1, 2, 6],
    [1, 6, 5],
    [2, 3, 7],
    [2, 7, 6],
    [3, 0, 4],
    [3, 4, 7],
  ];

  const vertices = new Float32Array(corners.length * VERTEX_STRIDE);
  corners.forEach((corner, index) => {
    const base = index * VERTEX_STRIDE;
    vertices.set(corner, base);
    // Normals a real mesh would have split at the creases; irrelevant to STL,
    // which is the point — see the facet-normal note in src/io/stl.ts.
    const length = Math.hypot(...corner) || 1;
    vertices.set(
      corner.map((axis) => axis / length),
      base + 3,
    );
  });

  return {
    vertices,
    indices: new Uint32Array(faces.flat()),
    stride: VERTEX_STRIDE,
    positionOffset: 0,
    normalOffset: 3,
  };
}

interface Facet {
  readonly normal: [number, number, number];
  readonly vertices: [number, number, number][];
}

/** An independent binary-STL reader. See the file header. */
function decodeStl(buffer: ArrayBuffer): { header: string; facets: Facet[] } {
  const view = new DataView(buffer);
  const header = new TextDecoder('ascii').decode(new Uint8Array(buffer, 0, 80)).replace(/\0+$/, '');
  const count = view.getUint32(80, true);
  const facets: Facet[] = [];

  for (let i = 0; i < count; i += 1) {
    const base = 84 + i * 50;
    const read = (offset: number): [number, number, number] => [
      view.getFloat32(base + offset, true),
      view.getFloat32(base + offset + 4, true),
      view.getFloat32(base + offset + 8, true),
    ];
    facets.push({ normal: read(0), vertices: [read(12), read(24), read(36)] });
    expect(view.getUint16(base + 48, true)).toBe(0);
  }
  return { header, facets };
}

function boundsOf(facets: Facet[]): { min: number[]; max: number[] } {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const facet of facets) {
    for (const vertex of facet.vertices) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis] ?? Infinity, vertex[axis] ?? 0);
        max[axis] = Math.max(max[axis] ?? -Infinity, vertex[axis] ?? 0);
      }
    }
  }
  return { min, max };
}

describe('layout', () => {
  it('is exactly 84 + 50n bytes, with the triangle count in the header', () => {
    const mesh = cubeMesh();

    const stl = encodeBinaryStl(mesh);

    expect(stl.byteLength).toBe(84 + 12 * 50);
    expect(stl.byteLength).toBe(stlByteLength(mesh));
    expect(decodeStl(stl).facets).toHaveLength(12);
  });

  it('never writes a header that would be sniffed as ASCII STL', () => {
    const stl = encodeBinaryStl(cubeMesh(), { header: 'solid something' });

    expect(decodeStl(stl).header.toLowerCase().startsWith('solid')).toBe(false);
  });

  it('writes an ASCII-only default header naming the writer', () => {
    const { header } = decodeStl(encodeBinaryStl(cubeMesh()));

    expect(header).toContain('Carve');
    expect(header).toMatch(/^[\x20-\x7e]*$/);
    // The default contains an em dash, which is not ASCII and is dropped.
    expect(DEFAULT_STL_HEADER).toContain('—');
    expect(header).not.toContain('—');
  });

  it('writes an empty but valid file for an empty mesh', () => {
    const empty: MeshPayload = {
      vertices: new Float32Array(0),
      indices: new Uint32Array(0),
      stride: VERTEX_STRIDE,
      positionOffset: 0,
      normalOffset: 3,
    };

    const stl = encodeBinaryStl(empty);

    expect(stl.byteLength).toBe(84);
    expect(decodeStl(stl).facets).toHaveLength(0);
  });
});

describe('units', () => {
  it('scales metres to millimetres, because that is what a slicer assumes', () => {
    // A 20mm cube in the document is 0.02m.
    const { facets } = decodeStl(encodeBinaryStl(cubeMesh(0.01)));

    const { min, max } = boundsOf(facets);
    expect(min.map((value) => Math.round(value * 1000) / 1000)).toEqual([-10, -10, -10]);
    expect(max.map((value) => Math.round(value * 1000) / 1000)).toEqual([10, 10, 10]);
  });

  it('takes the conversion from PARAMETER_UNITS rather than repeating it', () => {
    // The claim in src/io/units.ts: change the authoring unit and the exporter
    // follows. Asserted against the registry, not against the number 1000.
    expect(METRES_TO_MILLIMETRES).toBe(PARAMETER_UNITS.length.perCanonical);
  });

  it('honours an explicit scale for a caller who wants metres', () => {
    const { facets } = decodeStl(encodeBinaryStl(cubeMesh(0.01), { scale: 1 }));

    expect(boundsOf(facets).max[0]).toBeCloseTo(0.01, 6);
  });
});

describe('facet normals', () => {
  it('are the facet plane, not a copied vertex normal', () => {
    const { facets } = decodeStl(encodeBinaryStl(cubeMesh()));

    for (const facet of facets) {
      const [a, b, c] = facet.vertices;
      const u = [b![0] - a![0], b![1] - a![1], b![2] - a![2]];
      const v = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
      const cross = [
        u[1]! * v[2]! - u[2]! * v[1]!,
        u[2]! * v[0]! - u[0]! * v[2]!,
        u[0]! * v[1]! - u[1]! * v[0]!,
      ];
      const length = Math.hypot(...cross);

      for (let axis = 0; axis < 3; axis += 1) {
        expect(facet.normal[axis]).toBeCloseTo(cross[axis]! / length, 5);
      }
      // A cube's face normals are axis-aligned; a copied vertex normal from
      // this fixture would point at a corner and fail here.
      expect(Math.max(...facet.normal.map(Math.abs))).toBeCloseTo(1, 5);
    }
  });

  it('writes a zero normal for a degenerate triangle rather than NaN', () => {
    const mesh = cubeMesh();
    const collapsed: MeshPayload = { ...mesh, indices: new Uint32Array([0, 0, 0]) };

    const { facets } = decodeStl(encodeBinaryStl(collapsed));

    expect(facets[0]?.normal).toEqual([0, 0, 0]);
  });
});
