/**
 * Turning a document — or part of one — into a mesh, and that mesh into a file.
 *
 * The encoders in `stl.ts` and `gltf.ts` take a `MeshPayload` and know nothing
 * about documents. This is the layer above them: which subtree gets evaluated,
 * on which kernel channel, and what the resulting file is called.
 *
 * ## Export runs on its own channel
 *
 * `EXPORT_CHANNEL`, never the viewport's. The kernel supersedes within a
 * channel — see the channel note in `src/kernel/protocol.ts` — so exporting on
 * `main` would mean an export request cancels the evaluation the viewport is
 * waiting on, and a mid-drag export gets superseded by the drag and resolves to
 * `null`. Neither is a scenario anyone would debug quickly. On its own channel,
 * an export and a drag simply proceed.
 *
 * A superseded export is still possible — press the button twice — and is the
 * one case `exportMesh` treats as an error rather than as `null`: the second
 * press produces the file, the first raises `ExportError` instead of silently
 * writing nothing.
 *
 * ## "Export selection only" is a different bundle, not a different exporter
 *
 * Exporting a selected node means evaluating *that* subtree. Two details make
 * it correct rather than approximately correct:
 *
 *  - **World placement is preserved.** A subtree's own nodes describe it in its
 *    parent's space, so `exportBundle` re-wraps it in the transform nodes of
 *    its ancestors. Exporting a hole that sits 60mm along the plate produces a
 *    cylinder 60mm from the origin, which is what every part of the app that
 *    can see it has been drawing.
 *  - **Nested selections do not double.** Selecting a boolean and one of its
 *    own operands would otherwise union that operand with itself. Descendants
 *    of another selected node are dropped.
 *
 * Several roots are combined under a synthetic `group`, which the evaluator
 * defines as a union. Synthetic nodes are the only ones this file invents, and
 * they are prefixed so they can never collide with a document id.
 */

import {
  childrenOf,
  groupNode,
  transformNode,
  type CarveDocument,
  type CarveNode,
  type NodeBundle,
  type NodeId,
} from '../core/index.js';
import type { EvaluatedMesh, KernelWarning, MeshPayload, RequestOptions } from '../kernel/index.js';

import { CARVE_MIME_TYPE, encodeDocumentFile, fileNameStem } from './carve-file.js';
import { encodeGlb, type GlbOptions } from './gltf.js';
import { encodeBinaryStl, type StlOptions } from './stl.js';

/**
 * The channel every export uses. See the file header.
 *
 * One channel for all exports, not one per request: pressing Export twice
 * should abandon the first, which is what a shared channel does.
 */
export const EXPORT_CHANNEL = 'export';

/** Prefix for the nodes `exportBundle` invents. Never present in a document. */
export const SYNTHETIC_ID_PREFIX = 'export:';

export type ExportFormat = 'stl' | 'glb';

export const EXPORT_MIME_TYPES: Readonly<Record<ExportFormat, string>> = Object.freeze({
  stl: 'model/stl',
  glb: 'model/gltf-binary',
});

export const EXPORT_EXTENSIONS: Readonly<Record<ExportFormat, string>> = Object.freeze({
  stl: '.stl',
  glb: '.glb',
});

/**
 * The part of `KernelClient` an export needs.
 *
 * Narrower than the class on purpose: this file has no business subscribing to
 * meshes, cancelling channels or terminating a worker, and a test can satisfy
 * this interface with an evaluator and four lines of adapter instead of a
 * worker.
 */
export interface MeshSource {
  request(bundle: NodeBundle, options?: RequestOptions): Promise<EvaluatedMesh | null>;
}

export class ExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

/** A file, ready for a download or a test assertion. */
export interface ExportedFile {
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: ArrayBuffer;
  /** Whatever the kernel could not do cleanly. An empty result is in here. */
  readonly warnings: readonly KernelWarning[];
  readonly triangles: number;
}

export interface ExportOptions {
  readonly format: ExportFormat;
  /**
   * What to export. Defaults to the whole document.
   *
   * Pass `document.selection` for "selected only". An empty array is treated as
   * "no selection", i.e. the whole document, which is what a toolbar button
   * does when nothing is selected.
   */
  readonly roots?: readonly NodeId[];
  /** Filename stem. Defaults to the exported node's name, or `'untitled'`. */
  readonly name?: string;
  /** Degrees; passed to the kernel. Defaults to its own crease threshold. */
  readonly creaseAngle?: number;
  readonly stl?: StlOptions;
  readonly glb?: GlbOptions;
}

/**
 * Evaluate and encode, in one call.
 *
 * Rejects with `ExportError` if the request was superseded or the kernel
 * failed. Degenerate geometry is *not* an error: it comes back as warnings on a
 * file that was still written, because "this subtraction removed everything" is
 * a thing the user needs told rather than a reason to refuse to save.
 */
export async function exportMesh(
  source: MeshSource,
  document: CarveDocument,
  options: ExportOptions,
): Promise<ExportedFile> {
  const roots = resolveRoots(document, options.roots);
  const bundle = exportBundle(document, roots);

  const evaluated = await source.request(bundle, {
    channel: EXPORT_CHANNEL,
    ...(options.creaseAngle === undefined ? {} : { creaseAngle: options.creaseAngle }),
  });
  if (!evaluated) {
    throw new ExportError(
      'The export was superseded by a newer one before it finished. Nothing was written.',
    );
  }

  return encodeMesh(evaluated.mesh, {
    format: options.format,
    name: options.name ?? defaultName(document, roots),
    warnings: evaluated.warnings,
    ...(options.stl ? { stl: options.stl } : {}),
    ...(options.glb ? { glb: options.glb } : {}),
  });
}

interface EncodeMeshOptions {
  readonly format: ExportFormat;
  readonly name: string;
  readonly warnings?: readonly KernelWarning[];
  readonly stl?: StlOptions;
  readonly glb?: GlbOptions;
}

/** Encode an already-evaluated mesh. The half of `exportMesh` with no kernel in it. */
export function encodeMesh(mesh: MeshPayload, options: EncodeMeshOptions): ExportedFile {
  const stem = fileNameStem(options.name);
  const bytes =
    options.format === 'stl'
      ? encodeBinaryStl(mesh, options.stl ?? {})
      : encodeGlb(mesh, { name: stem, ...(options.glb ?? {}) });

  return {
    fileName: `${stem}${EXPORT_EXTENSIONS[options.format]}`,
    mimeType: EXPORT_MIME_TYPES[options.format],
    bytes,
    warnings: options.warnings ?? [],
    triangles: Math.floor(mesh.indices.length / 3),
  };
}

/** The `.carve` file for a document — the save path's counterpart to `encodeMesh`. */
export function encodeDocument(document: CarveDocument, name?: string): ExportedFile {
  const stem = fileNameStem(name ?? document.expect(document.rootId).name);
  const text = encodeDocumentFile(document);
  return {
    fileName: `${stem}.carve`,
    mimeType: CARVE_MIME_TYPE,
    bytes: new TextEncoder().encode(text).buffer,
    warnings: [],
    triangles: 0,
  };
}

/**
 * The bundle to evaluate for `roots`, in world space.
 *
 * Exported for the tests and for #12, which will want the same "what does this
 * selection actually look like" bundle for a preview.
 */
export function exportBundle(document: CarveDocument, roots: readonly NodeId[]): NodeBundle {
  const targets = roots.length > 0 ? roots : [document.rootId];
  for (const id of targets) {
    if (!document.has(id)) throw new ExportError(`Cannot export ${id}: no such node`);
  }

  const nextSyntheticId = syntheticIds(document);
  const placed = targets.map((id) => placeInWorld(document, id, nextSyntheticId));

  if (placed.length === 1) {
    const only = placed[0];
    if (!only) throw new ExportError('Nothing to export');
    return only;
  }

  const root = groupNode({ id: nextSyntheticId(), name: 'Export' });
  return {
    rootId: root.id,
    nodes: [
      { ...root, children: placed.map((bundle) => bundle.rootId) },
      ...placed.flatMap((bundle) => bundle.nodes),
    ],
  };
}

/**
 * The selection, minus anything already covered by an ancestor in it.
 *
 * Exported because the same rule decides what a "delete selection" or a
 * "group selection" command should act on, and there should be one answer.
 */
export function topmost(document: CarveDocument, ids: readonly NodeId[]): readonly NodeId[] {
  const set = new Set(ids);
  return ids.filter((id) => !document.ancestorsOf(id).some((ancestor) => set.has(ancestor)));
}

function resolveRoots(document: CarveDocument, roots?: readonly NodeId[]): readonly NodeId[] {
  if (!roots || roots.length === 0) return [document.rootId];
  return topmost(document, roots);
}

/**
 * `id`'s subtree, re-wrapped in the transform nodes above it.
 *
 * The wrappers are copies with synthetic ids and no other children, so the
 * chain contributes placement and nothing else — a sibling of the exported node
 * cannot sneak into the file through a shared parent.
 */
function placeInWorld(
  document: CarveDocument,
  id: NodeId,
  nextSyntheticId: () => NodeId,
): NodeBundle {
  const bundle = document.bundle(id);
  let rootId = bundle.rootId;
  const wrappers: CarveNode[] = [];

  // `ancestorsOf` is root-first; walking it in reverse wraps innermost first,
  // so the outermost transform ends up outermost.
  for (const ancestorId of [...document.ancestorsOf(id)].reverse()) {
    const ancestor = document.expect(ancestorId);
    if (ancestor.kind !== 'transform') continue;
    const wrapper = transformNode({
      id: nextSyntheticId(),
      name: ancestor.name,
      transform: ancestor.transform,
      children: [rootId],
    });
    wrappers.push(wrapper);
    rootId = wrapper.id;
  }

  return { rootId, nodes: [...wrappers.reverse(), ...bundle.nodes] };
}

/** A source of ids no document node can be using. */
function syntheticIds(document: CarveDocument): () => NodeId {
  let counter = 0;
  return () => {
    let id = `${SYNTHETIC_ID_PREFIX}${(counter += 1)}`;
    // Belt and braces: a document could contain one of these if a `.carve` file
    // was hand-edited, and a duplicate id is a store invariant violation rather
    // than a wrong export.
    while (document.has(id)) id = `${SYNTHETIC_ID_PREFIX}${(counter += 1)}`;
    return id;
  };
}

/** What the file is called when the caller does not say. */
function defaultName(document: CarveDocument, roots: readonly NodeId[]): string {
  const only = roots.length === 1 ? roots[0] : undefined;
  if (only !== undefined && only !== document.rootId) {
    const node = document.get(only);
    // A transform wrapper is named after what it holds far less usefully than
    // its own primitive is; `placedPrimitive` names both, so prefer the child
    // when the wrapper has exactly one.
    if (node && node.kind === 'transform') {
      const children = childrenOf(node);
      const child = children.length === 1 ? document.get(children[0] ?? '') : undefined;
      if (child) return child.name;
    }
    if (node) return node.name;
  }
  return document.expect(document.rootId).name;
}
