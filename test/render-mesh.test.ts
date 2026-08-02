/**
 * Kernel mesh buffers → `BufferGeometry`, and the no-copy contract that
 * matters most about it: the renderer must hold the *same* typed arrays the
 * kernel handed over, not a clone of them.
 */

import { describe, expect, it } from 'vitest';

import { VERTEX_STRIDE, type MeshPayload } from '../src/kernel/index.js';
import { applyMeshToGeometry, geometryFromMesh, triangleCountOf } from '../src/render/mesh.js';

/** Two triangles sharing an edge — a unit quad in the XY plane, +Z normal. */
function quadMesh(): MeshPayload {
  // prettier-ignore
  const vertices = new Float32Array([
    0, 0, 0,  0, 0, 1,
    1, 0, 0,  0, 0, 1,
    1, 1, 0,  0, 0, 1,
    0, 1, 0,  0, 0, 1,
  ]);
  const indices = new Uint32Array([0, 1, 2, 0, 2, 3]);
  return {
    vertices,
    indices,
    stride: VERTEX_STRIDE,
    positionOffset: 0,
    normalOffset: 3,
  };
}

describe('geometryFromMesh', () => {
  it('wraps the mesh buffers without copying them', () => {
    const mesh = quadMesh();
    const geometry = geometryFromMesh(mesh);

    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const index = geometry.getIndex();

    expect(position.array).toBe(mesh.vertices);
    expect(normal.array).toBe(mesh.vertices);
    expect(index?.array).toBe(mesh.indices);
  });

  it('reads position and normal at the payload-declared offsets', () => {
    const geometry = geometryFromMesh(quadMesh());

    expect(geometry.getAttribute('position').getX(1)).toBe(1);
    expect(geometry.getAttribute('position').getY(2)).toBe(1);
    expect(geometry.getAttribute('normal').getZ(0)).toBe(1);
  });

  it('computes bounds from the uploaded geometry', () => {
    const geometry = geometryFromMesh(quadMesh());
    geometry.computeBoundingBox();

    expect(geometry.boundingBox?.min.toArray()).toEqual([0, 0, 0]);
    expect(geometry.boundingBox?.max.toArray()).toEqual([1, 1, 0]);
  });
});

describe('applyMeshToGeometry', () => {
  it('re-points an existing geometry at a fresher mesh', () => {
    const geometry = geometryFromMesh(quadMesh());
    const first = geometry.getAttribute('position');

    const second = quadMesh();
    second.vertices[0] = 5;
    applyMeshToGeometry(geometry, second);

    expect(geometry.getAttribute('position')).not.toBe(first);
    expect(geometry.getAttribute('position').getX(0)).toBe(5);
    expect(geometry.getIndex()?.array).toBe(second.indices);
  });
});

describe('triangleCountOf', () => {
  it('is one third of the index count', () => {
    expect(triangleCountOf(quadMesh())).toBe(2);
  });

  it('is zero for an empty mesh', () => {
    const empty: MeshPayload = {
      vertices: new Float32Array(0),
      indices: new Uint32Array(0),
      stride: VERTEX_STRIDE,
      positionOffset: 0,
      normalOffset: 3,
    };
    expect(triangleCountOf(empty)).toBe(0);
  });
});
