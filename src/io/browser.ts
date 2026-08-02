/**
 * The DOM edge: downloads, the file picker, drag-and-drop, and the tab-closing
 * flush.
 *
 * Everything else in `src/io/` is pure — bytes in, bytes out, testable in Node
 * with no DOM anywhere. This file is where that stops, and it is deliberately
 * the thinnest file in the layer: nothing here decides what a file contains,
 * only how the browser is asked to hand it over or take it away.
 *
 * ## The seams are injected, so this is testable too
 *
 * Each function takes an optional `BrowserEnv` — the two or three DOM objects
 * it needs — defaulting to the globals. That is not ceremony for its own sake:
 * "does the anchor get the right `download` attribute and does the object URL
 * get revoked" is exactly the kind of thing that breaks silently and leaks a
 * multi-megabyte blob per export, and with the seam it is four lines of test
 * instead of a browser harness.
 *
 * ## Why an anchor and not `showSaveFilePicker`
 *
 * The File System Access API gives a real save dialog and a writable handle,
 * and it exists in Chrome only. Safari and Firefox both have it behind
 * nothing — it is simply absent — and the Quest browser's support is one of the
 * unmeasured rows in `docs/capability-matrix.md`. A `Blob` plus an anchor with
 * `download` works in all four today. When the matrix is filled in and the
 * answer is better than expected, this is the one function that changes.
 */

import { decodeDocumentFile } from './carve-file.js';
import type { CarveDocument } from '../core/index.js';
import type { ExportedFile } from './export.js';

/**
 * The DOM surface this file uses, and nothing more.
 *
 * Typed structurally so a test can supply four properties rather than a
 * simulated document.
 */
export interface BrowserEnv {
  readonly document: Pick<Document, 'createElement' | 'body'>;
  readonly url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>;
  /** Constructed rather than referenced, so a test can record what was built. */
  readonly blob: new (parts: BlobPart[], options?: BlobPropertyBag) => Blob;
}

function defaultEnv(): BrowserEnv {
  return { document: globalThis.document, url: URL, blob: Blob };
}

/**
 * Hand `file` to the browser as a download.
 *
 * The object URL is revoked on the next task rather than immediately: revoking
 * it synchronously after `click()` races the browser's own read of the URL in
 * Safari, and the download fails intermittently — which is the worst kind of
 * bug to have in a save button. One task later is after the navigation has been
 * queued and long before the memory matters.
 */
export function downloadFile(file: ExportedFile, env: BrowserEnv = defaultEnv()): void {
  const blob = new env.blob([file.bytes], { type: file.mimeType });
  const href = env.url.createObjectURL(blob);
  const anchor = env.document.createElement('a');
  anchor.href = href;
  anchor.download = file.fileName;
  // Appended before clicking: a detached anchor's click is ignored by Firefox.
  // The element is removed again in the same task, so nothing is ever visible.
  env.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => env.url.revokeObjectURL(href), 0);
}

/** Read a picked or dropped `File` as a document. */
export async function openDocumentFile(file: Blob): Promise<CarveDocument> {
  return decodeDocumentFile(await file.text());
}

/** The `accept` value for a file input or a picker: `.carve` files. */
export const CARVE_ACCEPT = '.carve,application/vnd.carve+json';

export interface DropTargetOptions {
  /** Called with the first `.carve` file dropped. */
  readonly onDocument: (document: CarveDocument, file: File) => void;
  /** Called when the drop was not something openable. */
  readonly onError?: (error: unknown, file: File | null) => void;
  /** Toggled as the pointer enters and leaves, for a drop-zone highlight. */
  readonly onDragStateChange?: (dragging: boolean) => void;
}

/**
 * Accept `.carve` files dropped on `element`. Returns a detach function.
 *
 * `dragover` must be cancelled or the browser navigates to the file instead of
 * delivering a drop event — replacing the app, and the user's unsaved work,
 * with a JSON viewer. That single `preventDefault` is the reason this helper
 * exists rather than each call site wiring three listeners.
 *
 * Enter/leave are counted rather than toggled: dragging over a child element
 * fires `dragleave` on the parent, so a boolean flag flickers off every time
 * the pointer crosses a button inside the drop zone.
 */
export function attachDocumentDropTarget(
  element: HTMLElement,
  options: DropTargetOptions,
): () => void {
  let depth = 0;

  const setDragging = (dragging: boolean): void => {
    options.onDragStateChange?.(dragging);
  };

  const onDragEnter = (event: DragEvent): void => {
    event.preventDefault();
    depth += 1;
    if (depth === 1) setDragging(true);
  };

  const onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (event: DragEvent): void => {
    event.preventDefault();
    depth = Math.max(0, depth - 1);
    if (depth === 0) setDragging(false);
  };

  const onDrop = (event: DragEvent): void => {
    event.preventDefault();
    depth = 0;
    setDragging(false);
    const file = event.dataTransfer?.files.item(0) ?? null;
    if (!file) {
      options.onError?.(new Error('That drop contained no file'), null);
      return;
    }
    void openDocumentFile(file).then(
      (document) => options.onDocument(document, file),
      (error: unknown) => options.onError?.(error, file),
    );
  };

  element.addEventListener('dragenter', onDragEnter);
  element.addEventListener('dragover', onDragOver);
  element.addEventListener('dragleave', onDragLeave);
  element.addEventListener('drop', onDrop);

  return () => {
    element.removeEventListener('dragenter', onDragEnter);
    element.removeEventListener('dragover', onDragOver);
    element.removeEventListener('dragleave', onDragLeave);
    element.removeEventListener('drop', onDrop);
  };
}

/** What `flushOnHide` listens on. Injected by the tests. */
export interface HideEventTarget {
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
  /** `'hidden'` is the state worth flushing on. Absent targets always flush. */
  readonly visibilityState?: string;
}

/**
 * Flush pending work when the page is going away. Returns a detach function.
 *
 * `pagehide` and `visibilitychange`, not `beforeunload`. On mobile and on the
 * Quest, a tab is frequently *frozen* rather than unloaded — the user takes the
 * headset off, the browser suspends the page, and `beforeunload` never fires at
 * all. `visibilitychange` to `hidden` is the last event guaranteed to be
 * delivered, and it is the one moment an autosave has to have already happened.
 *
 * The flush is fire-and-forget by necessity: nothing can await a promise during
 * page hide. This is why `Autosave` keeps its debounce short enough that the
 * pending write is small.
 */
export function flushOnHide(
  flush: () => void,
  target: HideEventTarget = globalThis.document,
): () => void {
  const onPageHide = (): void => {
    flush();
  };
  // Becoming *visible* also fires `visibilitychange`, and flushing then would
  // write on every tab switch back for no benefit.
  const onVisibilityChange = (): void => {
    if (target.visibilityState === undefined || target.visibilityState === 'hidden') flush();
  };
  target.addEventListener('pagehide', onPageHide);
  target.addEventListener('visibilitychange', onVisibilityChange);
  return () => {
    target.removeEventListener('pagehide', onPageHide);
    target.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
