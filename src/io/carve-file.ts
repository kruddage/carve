/**
 * `.carve` files: the document as bytes on someone's disk.
 *
 * Thin on purpose. `src/core/serialize.ts` already owns the on-disk *shape*,
 * its versioning and its hostile-input validation; this file owns only what
 * turns that shape into a file — the extension, the media type, the text
 * encoding, and a filename a person will recognize in a downloads folder.
 *
 * Keeping the two apart is what lets the format be tested with no notion of a
 * file at all, and it is why loading is `decodeDocumentFile` here and
 * `deserializeJson` there rather than one function doing both jobs.
 *
 * ## Pretty-printed, and why that is worth the bytes
 *
 * Documents are written with two-space indentation. It roughly doubles the file
 * size against `JSON.stringify(value)` with no argument, and it buys three
 * things that matter more than bytes for a format this small: a `.carve` file
 * diffs line-by-line in git, it can be read and hand-repaired in a text editor
 * when something goes wrong, and a migration author can see what an old file
 * actually looked like. A 20-primitive part is a few tens of kilobytes either
 * way.
 *
 * Autosave does *not* go through here — it stores structured data in IndexedDB
 * (see `store.ts`), where there is no reason to serialize to text at all.
 */

import { deserializeJson, serialize, type CarveDocument } from '../core/index.js';

/** The extension, including the dot. */
export const CARVE_FILE_EXTENSION = '.carve';

/**
 * The media type for a `.carve` file.
 *
 * A vendor tree type rather than `application/json`: it is what a file picker's
 * `accept` list and a `Blob`'s type both want, and it keeps a browser from
 * deciding a saved document is something it should try to display. The `+json`
 * suffix is the honest part — anything that understands JSON can read it.
 */
export const CARVE_MIME_TYPE = 'application/vnd.carve+json';

/** Fallback name for a document nobody has named yet. */
export const DEFAULT_DOCUMENT_NAME = 'untitled';

export interface EncodeOptions {
  /**
   * Indentation width. `0` writes the compact form.
   *
   * Exposed for the one caller that has a reason — a size measurement, or an
   * embedding — not as a preference to be set per save. See the file header.
   */
  readonly indent?: number;
}

/** The document as the text of a `.carve` file. */
export function encodeDocumentFile(document: CarveDocument, options: EncodeOptions = {}): string {
  const indent = options.indent ?? 2;
  // Trailing newline: this is a text file, and every tool that concatenates or
  // diffs text files expects one.
  return `${JSON.stringify(serialize(document), null, indent)}\n`;
}

/**
 * A `.carve` file's text as a document.
 *
 * Throws `DocumentFormatError` — from `src/core/` — for anything that is not a
 * document this build can open, including a file from a newer version. Callers
 * catch one error type; see `serialize.ts`.
 */
export function decodeDocumentFile(text: string): CarveDocument {
  return deserializeJson(text);
}

/**
 * A filename for `name`, safe on every platform we can be downloaded to.
 *
 * Not merely cosmetic. A document name is user text and reaches this function
 * unfiltered; a name containing `/` or `..` is a path when a browser writes it,
 * and one containing a control character is rejected outright by some
 * filesystems. So: separators and control characters are replaced, leading
 * dots are dropped so the result cannot be a hidden file, whitespace is
 * collapsed, and the stem is capped well below any filesystem's limit.
 *
 * The extension is appended if it is not already there, so passing an existing
 * filename back through is a no-op rather than producing `part.carve.carve`.
 */
export function documentFileName(name: string, extension = CARVE_FILE_EXTENSION): string {
  const stem = fileNameStem(stripExtension(name, extension));
  return `${stem}${extension}`;
}

/** The sanitized stem, with no extension. Shared by every exporter's filename. */
export function fileNameStem(name: string): string {
  const cleaned = name
    // eslint-disable-next-line no-control-regex -- the point is to remove them.
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    // A leading dot makes a hidden file on Unix and confuses extension
    // detection everywhere else.
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 64)
    .trim();
  return cleaned.length > 0 ? cleaned : DEFAULT_DOCUMENT_NAME;
}

function stripExtension(name: string, extension: string): string {
  return name.toLowerCase().endsWith(extension.toLowerCase())
    ? name.slice(0, name.length - extension.length)
    : name;
}
