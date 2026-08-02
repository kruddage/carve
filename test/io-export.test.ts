/**
 * Export, end to end: a real evaluated part, measured out of the exported file.
 *
 * This is #14a's "exported STL loads in a slicer at correct dimensions" as far
 * as a test can take it. The part of that claim which does not need a slicer —
 * that the triangles in the file describe a solid of the right size, in the
 * right units, with the right volume, watertight — is checked here against a
 * mesh `manifold-3d` actually produced. What is left for a human with a slicer
 * is whether the file parses in *their* tool, which is recorded in
 * `docs/capability-matrix.md` rather than asserted.
 *
 * The kernel runs in-process rather than in a worker: `Evaluator` is the same
 * code the worker runs, and a worker here would add a message protocol to a
 * test that is about geometry. `evaluatorSource` is the four-line adapter that
 * makes it satisfy `MeshSource`.
 */

import { describe, expect, it } from 'vitest';

import { makeTrs, renameNode, setTransform, vec3, type NodeBundle } from '../src/core/index.js';
import {
  DEFAULT_CHANNEL,
  Evaluator,
  type EvaluatedMesh,
  type MeshPayload,
  type RequestOptions,
} from '../src/kernel/index.js';
import {
  EXPORT_CHANNEL,
  ExportError,
  SYNTHETIC_ID_PREFIX,
  encodeDocument,
  encodeMesh,
  exportBundle,
  exportMesh,
  topmost,
  type MeshSource,
} from '../src/io/index.js';

import { bracketDocument } from './support/document-fixture.js';
import { sharedManifold } from './support/kernel-fixture.js';

/** The kernel, in-process, as a `MeshSource`. See the file header. */
async function evaluatorSource(): Promise<MeshSource & { channels: string[] }> {
  const evaluator = new Evaluator(await sharedManifold());
  const channels: string[] = [];
  return {
    channels,
    request(bundle: NodeBundle, options: RequestOptions = {}): Promise<EvaluatedMesh | null> {
      channels.push(options.channel ?? DEFAULT_CHANNEL);
      const outcome = evaluator.evaluate(bundle, options.creaseAngle);
      return Promise.resolve({
        channel: options.channel ?? DEFAULT_CHANNEL,
        requestId: channels.length,
        rootId: bundle.rootId,
        mesh: outcome.mesh,
        warnings: outcome.warnings,
        stats: outcome.stats,
      });
    },
  };
}

interface Facet {
  readonly vertices: [number, number, number][];
}

function decodeStlFacets(buffer: ArrayBuffer): Facet[] {
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  return Array.from({ length: count }, (_, i) => {
    const base = 84 + i * 50;
    const read = (offset: number): [number, number, number] => [
      view.getFloat32(base + offset, true),
      view.getFloat32(base + offset + 4, true),
      view.getFloat32(base + offset + 8, true),
    ];
    return { vertices: [read(12), read(24), read(36)] };
  });
}

function extents(facets: Facet[]): { min: number[]; max: number[]; size: number[] } {
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
  return { min, max, size: min.map((low, axis) => (max[axis] ?? 0) - low) };
}

/** Signed volume by the divergence theorem, from the file's own triangles. */
function volumeOf(facets: Facet[]): number {
  let total = 0;
  for (const { vertices } of facets) {
    const [a, b, c] = vertices;
    total +=
      a![0] * (b![1] * c![2] - b![2] * c![1]) +
      a![1] * (b![2] * c![0] - b![0] * c![2]) +
      a![2] * (b![0] * c![1] - b![1] * c![0]);
  }
  return total / 6;
}

/** The POSITION accessor's declared bounds, straight out of the GLB's JSON chunk. */
function glbPositionBounds(buffer: ArrayBuffer): { min: number[]; max: number[] } {
  const view = new DataView(buffer);
  const jsonLength = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength))) as {
    accessors: { min?: number[]; max?: number[] }[];
  };
  const position = json.accessors[0];
  return { min: position?.min ?? [], max: position?.max ?? [] };
}

describe('an exported part, measured out of the file', () => {
  it('is the right size in millimetres', async () => {
    // The fixture bracket is a 200 × 10 × 100mm plate with two 20mm holes.
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'stl' });

    const { size } = extents(decodeStlFacets(file.bytes));
    // Sorted, because the Z-up → Y-up seam in src/kernel/solids.ts decides
    // which document axis is which in the mesh, and that is the kernel's
    // business rather than the exporter's.
    expect([...size].sort((a, b) => a - b).map(Math.round)).toEqual([10, 100, 200]);
  });

  it('has the volume of a drilled plate, not of a solid one', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'stl' });

    const plate = 200 * 10 * 100;
    // Two Ø20mm holes through 10mm of plate. The tessellated cylinder is a
    // 32-gon and slightly under a true circle, hence the 1% tolerance.
    const holes = 2 * Math.PI * 10 * 10 * 10;
    expect(volumeOf(decodeStlFacets(file.bytes))).toBeGreaterThan((plate - holes) * 0.99);
    expect(volumeOf(decodeStlFacets(file.bytes))).toBeLessThan(plate - holes * 0.95);
  });

  it('is wound outward, so a slicer does not read it inside out', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'stl' });

    expect(volumeOf(decodeStlFacets(file.bytes))).toBeGreaterThan(0);
  });

  it('names the file after the document and reports its triangles', async () => {
    const { document } = bracketDocument();
    document.dispatch(renameNode(document.rootId, 'Bracket v2'));
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'stl' });

    expect(file.fileName).toBe('Bracket v2.stl');
    expect(file.mimeType).toBe('model/stl');
    expect(file.triangles).toBe(decodeStlFacets(file.bytes).length);
  });

  it('exports GLB from the same evaluation, in metres and the right way up', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'glb', name: 'bracket' });

    expect(file.fileName).toBe('bracket.glb');
    expect(file.mimeType).toBe('model/gltf-binary');
    expect(new DataView(file.bytes).getUint32(0, true)).toBe(0x46546c67);

    // The same part as the STL above, read out of the glTF POSITION accessor's
    // declared bounds: 0.2 × 0.01 × 0.1 *metres*, and 10mm of thickness on the
    // Y axis, which is glTF's up. A silent axis swap upstream lands here.
    const { min, max } = glbPositionBounds(file.bytes);
    const size = min.map((low, axis) => (max[axis] ?? 0) - low);
    expect([...size].sort((a, b) => a - b).map((value) => Math.round(value * 1000))).toEqual([
      10, 100, 200,
    ]);
    expect(Math.round((size[1] ?? 0) * 1000)).toBe(10);
  });
});

describe('exporting a selection', () => {
  it('exports only the selected subtree, at its world placement', async () => {
    const { document, ids } = bracketDocument();
    const source = await evaluatorSource();

    // holeA sits 60mm along the plate, inside the boolean.
    const file = await exportMesh(source, document, { format: 'stl', roots: [ids.holeA] });

    const { min, max, size } = extents(decodeStlFacets(file.bytes));
    // A Ø20 × 50mm cylinder, centred 60mm from the origin — placement the
    // subtree's own nodes do not carry. Round-trip through its own bundle
    // without the ancestor chain would put it at the origin.
    expect([...size].sort((a, b) => a - b).map(Math.round)).toEqual([20, 20, 50]);
    const centre = min.map((low, axis) => (low + (max[axis] ?? 0)) / 2);
    expect(centre.map(Math.round)).toContain(-60);
  });

  it('does not double geometry when a selection contains its own descendant', async () => {
    const { document, ids } = bracketDocument();
    const source = await evaluatorSource();

    const whole = await exportMesh(source, document, { format: 'stl', roots: [ids.cut] });
    const withChild = await exportMesh(source, document, {
      format: 'stl',
      roots: [ids.cut, ids.holeA],
    });

    expect(topmost(document, [ids.cut, ids.holeA])).toEqual([ids.cut]);
    expect(withChild.triangles).toBe(whole.triangles);
  });

  it('unions several roots under a synthetic group', () => {
    const { document, ids } = bracketDocument();

    const bundle = exportBundle(document, [ids.holeA, ids.holeB]);

    expect(bundle.rootId.startsWith(SYNTHETIC_ID_PREFIX)).toBe(true);
    const root = bundle.nodes.find((node) => node.id === bundle.rootId);
    expect(root?.kind).toBe('group');
    // Every id is either the document's or synthetic; nothing invented
    // collides with a node that exists.
    for (const node of bundle.nodes) {
      if (node.id.startsWith(SYNTHETIC_ID_PREFIX)) expect(document.has(node.id)).toBe(false);
    }
  });

  it('falls back to the whole document when nothing is selected', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    const empty = await exportMesh(source, document, { format: 'stl', roots: [] });
    const whole = await exportMesh(source, document, { format: 'stl' });

    expect(empty.triangles).toBe(whole.triangles);
  });

  it('names the file after the selected node, preferring the primitive', async () => {
    const { document, ids } = bracketDocument();
    document.dispatch(renameNode(ids.platePrimitive, 'Plate'));
    const source = await evaluatorSource();

    const file = await exportMesh(source, document, { format: 'stl', roots: [ids.plate] });

    expect(file.fileName).toBe('Plate.stl');
  });

  it('refuses a node that is not in the document', () => {
    const { document } = bracketDocument();

    expect(() => exportBundle(document, ['nope'])).toThrow(ExportError);
  });

  it('follows a moved node, because the bundle is built at export time', async () => {
    const { document, ids } = bracketDocument();
    const source = await evaluatorSource();
    document.dispatch(setTransform(ids.holeA, makeTrs({ translation: vec3(0, 0.5, 0) })));

    const file = await exportMesh(source, document, { format: 'stl', roots: [ids.holeA] });

    const { min, max } = extents(decodeStlFacets(file.bytes));
    const centre = min.map((low, axis) => (low + (max[axis] ?? 0)) / 2);
    expect(centre.map(Math.round)).toContain(500);
  });
});

describe('scheduling', () => {
  it('runs on the export channel, never the viewport’s', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();

    await exportMesh(source, document, { format: 'stl' });

    expect(source.channels).toEqual([EXPORT_CHANNEL]);
    expect(source.channels).not.toContain(DEFAULT_CHANNEL);
  });

  it('reports a superseded export rather than writing an empty file', async () => {
    const { document } = bracketDocument();
    const superseded: MeshSource = { request: () => Promise.resolve(null) };

    await expect(exportMesh(superseded, document, { format: 'stl' })).rejects.toThrow(ExportError);
  });

  it('passes warnings through on a file it still wrote', () => {
    // Degenerate geometry is a thing a user does on the way to something
    // valid — see the warning note in src/kernel/protocol.ts. The export is
    // still written; the warning rides along so the UI can say what happened.
    const mesh: MeshPayload = {
      vertices: new Float32Array(0),
      indices: new Uint32Array(0),
      stride: 6,
      positionOffset: 0,
      normalOffset: 3,
    };

    const file = encodeMesh(mesh, {
      format: 'stl',
      name: 'empty',
      warnings: [{ code: 'empty-result', nodeId: 'cut', message: 'This evaluated to nothing.' }],
    });

    expect(file.triangles).toBe(0);
    expect(file.bytes.byteLength).toBe(84);
    expect(file.warnings).toEqual([
      { code: 'empty-result', nodeId: 'cut', message: 'This evaluated to nothing.' },
    ]);
  });
});

describe('saving the document itself', () => {
  it('produces a .carve file whose bytes are the document', () => {
    const { document } = bracketDocument();
    document.dispatch(renameNode(document.rootId, 'Bracket'));

    const file = encodeDocument(document);

    expect(file.fileName).toBe('Bracket.carve');
    expect(file.mimeType).toBe('application/vnd.carve+json');
    const text = new TextDecoder().decode(file.bytes);
    expect(JSON.parse(text)).toMatchObject({ version: 1 });
  });

  it('takes an explicit name over the document’s own', () => {
    const { document } = bracketDocument();

    expect(encodeDocument(document, 'part 7').fileName).toBe('part 7.carve');
  });
});

/** Kept honest: the mesh the exporters receive is the kernel's, not a copy. */
describe('no second geometry path', () => {
  it('encodes exactly the triangles the kernel produced', async () => {
    const { document } = bracketDocument();
    const source = await evaluatorSource();
    let evaluated: MeshPayload | null = null;
    const spy: MeshSource = {
      request: async (bundle, options) => {
        const result = await source.request(bundle, options);
        evaluated = result?.mesh ?? null;
        return result;
      },
    };

    const file = await exportMesh(spy, document, { format: 'stl' });

    expect(evaluated).not.toBeNull();
    expect(file.triangles).toBe((evaluated as unknown as MeshPayload).indices.length / 3);
  });
});
