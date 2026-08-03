/**
 * The scene holds exactly one solid, and `upload` never rebuilds the scene
 * or the mesh around it — only the geometry's attributes change.
 *
 * The scene also holds #9's overlays — the ground grid, the selection boxes,
 * the drag ghost, the snap marker and the gizmo — which is why these read
 * `graph.solid` rather than `graph.scene.children[0]`. The claim under test is
 * about the *solid*, and it should not break the next time something else is
 * added beside it.
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
    expect(graph.solid.visible).toBe(false);
    expect(graph.scene.children).toContain(graph.solid);
  });

  it('upload shows the solid and reports its triangle count', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());

    expect(graph.triangleCount).toBe(1);
    expect(graph.solid.visible).toBe(true);
  });

  it('upload reuses the same Mesh and Scene — no rebuild', () => {
    const graph = new SceneGraph();
    const meshObject = graph.solid;
    const sceneSize = graph.scene.children.length;

    graph.upload(triangleMesh());
    graph.upload(triangleMesh());

    expect(graph.solid).toBe(meshObject);
    expect(graph.scene.children).toHaveLength(sceneSize);
  });

  it('uploading an empty mesh hides the solid again', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());
    graph.upload(emptyMesh());

    expect(graph.triangleCount).toBe(0);
    expect(graph.solid.visible).toBe(false);
  });

  it('dispose does not throw', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());
    expect(() => graph.dispose()).not.toThrow();
  });
});

describe('overlays', () => {
  const identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const unitBox = { min: [-1, -1, -1] as const, max: [1, 1, 1] as const };

  it('leaves the solid alone', () => {
    const graph = new SceneGraph();
    graph.upload(triangleMesh());
    const before = graph.solid;

    graph.setGridVisible(false);
    graph.setSelection([{ bounds: unitBox, matrix: identity, primary: true }]);
    graph.setGhost({ mesh: triangleMesh(), matrix: identity });
    graph.setSnapMarker([0, 0, 0], 0.01);
    graph.setGizmo({ matrix: identity, mode: 'rotate', size: 0.1, activeId: 'rotate-x' });

    expect(graph.solid).toBe(before);
    expect(graph.solid.visible).toBe(true);
    expect(graph.triangleCount).toBe(1);
  });

  it('clears without throwing, and does not leak a selection box per call', () => {
    const graph = new SceneGraph();
    const sceneSize = graph.scene.children.length;

    for (let round = 0; round < 5; round += 1) {
      graph.setSelection([
        { bounds: unitBox, matrix: identity },
        { bounds: unitBox, matrix: identity },
      ]);
      graph.setSelection([]);
    }
    graph.setGhost(null);
    graph.setSnapMarker(null, 0);
    graph.setGizmo(null);

    expect(graph.scene.children).toHaveLength(sceneSize);
    expect(() => graph.dispose()).not.toThrow();
  });
});
