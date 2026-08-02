/**
 * The scene holds exactly one solid, and `upload` never rebuilds the scene
 * or the mesh around it — only the geometry's attributes change.
 */

import { describe, expect, it } from 'vitest';

import { VERTEX_STRIDE, type MeshPayload } from '../src/kernel/index.js';
import { SceneGraph } from '../src/render/scene-graph.js';

function triangleMesh(): MeshPayload {
  // prettier-ignore
  const vertices = new Float32Array([
    0, 0, 0,  0, 0, 1,
    1, 0, 0,  0, 0, 1,
    0, 1, 0,  0, 0, 1,
  ]);
  return {
    vertices,
    indices: new Uint32Array([0, 1, 2]),
    stride: VERTEX_STRIDE,
    positionOffset: 0,
    normalOffset: 3,
  };
}

function emptyMesh(): MeshPayload {
  return {
    vertices: new Float32Array(0),
    indices: new Uint32Array(0),
    stride: VERTEX_STRIDE,
    positionOffset: 0,
    normalOffset: 3,
  };
}

describe('SceneGraph', () => {
  it('starts with the solid hidden and no triangles', () => {
    const graph = new SceneGraph();
    expect(graph.triangleCount).toBe(0);
    expect(graph.scene.children).toHaveLength(1);
    expect(graph.scene.children[0]?.visible).toBe(false);
  });

  it('upload shows the solid and reports its triangle count', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());

    expect(graph.triangleCount).toBe(1);
    expect(graph.scene.children[0]?.visible).toBe(true);
  });

  it('upload reuses the same Mesh and Scene — no rebuild', () => {
    const graph = new SceneGraph();
    const meshObject = graph.scene.children[0];

    graph.upload(triangleMesh());
    graph.upload(triangleMesh());

    expect(graph.scene.children).toHaveLength(1);
    expect(graph.scene.children[0]).toBe(meshObject);
  });

  it('uploading an empty mesh hides the solid again', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());
    graph.upload(emptyMesh());

    expect(graph.triangleCount).toBe(0);
    expect(graph.scene.children[0]?.visible).toBe(false);
  });

  it('dispose does not throw', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());
    expect(() => graph.dispose()).not.toThrow();
  });
});
