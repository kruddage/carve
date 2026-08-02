/**
 * src/io — persistence and export.
 *
 * Everything that turns a document into bytes and back: `.carve` files,
 * autosave to IndexedDB, STL for printing and GLB for sharing. Implements
 * `14a` of issue #14; the in-headset file operations of `14b` are #12's wrist
 * menu calling into exactly these functions, with no second implementation.
 *
 * Belongs here:
 *   - file formats and their encoders — one place per format
 *   - the autosave store and the policy that decides when it writes
 *   - the DOM edge for downloads, the file picker and drag-and-drop
 *
 * Must NOT appear here:
 *   - anything that decides what a document *is*. The on-disk shape, its
 *     version and its validation belong to `src/core/serialize.ts`; this layer
 *     writes what that produces.
 *   - a second tessellation path. Exports encode the mesh the kernel evaluated,
 *     which is the mesh the viewport drew. A file that does not match what was
 *     on screen is worse than no export.
 *   - three.js. `GLTFExporter` would put a renderer object between the kernel
 *     and the file and make export untestable in Node. See `gltf.ts`.
 *
 * ## Where the DOM starts
 *
 * `browser.ts` and nothing else. Every other file here is bytes in, bytes out,
 * and runs under Vitest in Node — which is what lets `test/io-export.test.ts`
 * assert that a real evaluated bracket exports at the right size in
 * millimetres, with no browser involved.
 *
 * ## Where to start reading (issue #14a)
 *
 *   `carve-file.ts` the `.carve` file: media type, text encoding, filenames
 *   `units.ts`      the one metres → millimetres conversion, derived not typed
 *   `stl.ts`        binary STL, and why facet normals are recomputed
 *   `gltf.ts`       GLB, written by hand over the interleaved kernel buffer
 *   `export.ts`     which subtree gets evaluated, on which channel
 *   `store.ts`      the autosave record, and an in-memory implementation
 *   `indexeddb.ts`  the persistent one, and the fallback when storage is denied
 *   `autosave.ts`   when a write happens, and why not during a gesture
 *   `browser.ts`    the DOM edge: download, drop target, flush on hide
 *
 * Design notes: `docs/persistence.md`.
 *
 * A worked example — save, export the selection, and recover after a crash:
 *
 * ```ts
 * downloadFile(encodeDocument(doc, 'bracket'));
 *
 * const stl = await exportMesh(kernel, doc, { format: 'stl', roots: doc.selection });
 * downloadFile(stl);
 *
 * const { store } = await openDocumentStore();
 * const autosave = Autosave.attach(doc, store);
 * flushOnHide(() => void autosave.flush());
 *
 * const recovered = await recoverLatest(store);   // next time the page loads
 * ```
 */

export const IO_LAYER = 'io';

export {
  CARVE_FILE_EXTENSION,
  CARVE_MIME_TYPE,
  DEFAULT_DOCUMENT_NAME,
  decodeDocumentFile,
  documentFileName,
  encodeDocumentFile,
  fileNameStem,
  type EncodeOptions,
} from './carve-file.js';

export { METRES_TO_GLTF, METRES_TO_MILLIMETRES } from './units.js';

export { DEFAULT_STL_HEADER, encodeBinaryStl, stlByteLength, type StlOptions } from './stl.js';

export { DEFAULT_GLB_GENERATOR, encodeGlb, type GlbOptions } from './gltf.js';

export {
  EXPORT_CHANNEL,
  EXPORT_EXTENSIONS,
  EXPORT_MIME_TYPES,
  ExportError,
  SYNTHETIC_ID_PREFIX,
  encodeDocument,
  encodeMesh,
  exportBundle,
  exportMesh,
  topmost,
  type ExportFormat,
  type ExportOptions,
  type ExportedFile,
  type MeshSource,
} from './export.js';

export {
  MemoryDocumentStore,
  byRecency,
  summarize,
  type DocumentStore,
  type DocumentSummary,
  type StoredDocument,
} from './store.js';

export {
  DATABASE_NAME,
  DATABASE_VERSION,
  DOCUMENT_STORE_NAME,
  IndexedDbDocumentStore,
  RECENCY_INDEX,
  openDocumentStore,
  type OpenOptions,
  type OpenedStore,
} from './indexeddb.js';

export {
  Autosave,
  DEFAULT_DEBOUNCE_MS,
  DEFAULT_MAX_DELAY_MS,
  DEFAULT_MAX_RECENT,
  createDocumentId,
  recoverLatest,
  restore,
  type AutosaveOptions,
} from './autosave.js';

export {
  CARVE_ACCEPT,
  attachDocumentDropTarget,
  downloadFile,
  flushOnHide,
  openDocumentFile,
  type BrowserEnv,
  type DropTargetOptions,
  type HideEventTarget,
} from './browser.js';
