/**
 * `.carve` files: the round trip through text, and the filenames.
 *
 * The format's own guarantees are `test/serialize.test.ts`'s job. What is
 * checked here is the file wrapper around it — that what is written parses
 * back, that a checked-in file from an earlier build still opens, and that a
 * document name a user typed cannot become a path.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  DOCUMENT_FORMAT_VERSION,
  DocumentFormatError,
  renameNode,
  serialize,
} from '../src/core/index.js';
import {
  CARVE_FILE_EXTENSION,
  CARVE_MIME_TYPE,
  decodeDocumentFile,
  documentFileName,
  encodeDocumentFile,
  fileNameStem,
} from '../src/io/index.js';

import { bracketDocument, canonical } from './support/document-fixture.js';

const FIXTURE = fileURLToPath(new URL('./fixtures/bracket.carve', import.meta.url));

describe('round trip', () => {
  it('writes text that parses back to the same document', () => {
    const { document } = bracketDocument();

    const restored = decodeDocumentFile(encodeDocumentFile(document));

    expect(canonical(serialize(restored))).toBe(canonical(serialize(document)));
  });

  it('pretty-prints, so a file diffs and can be hand-read', () => {
    const { document } = bracketDocument();

    const text = encodeDocumentFile(document);

    expect(text.split('\n').length).toBeGreaterThan(10);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('honours a compact encoding when asked', () => {
    const { document } = bracketDocument();

    const compact = encodeDocumentFile(document, { indent: 0 });

    expect(compact.split('\n')).toHaveLength(2); // the content, then the trailing newline
    expect(canonical(serialize(decodeDocumentFile(compact)))).toBe(canonical(serialize(document)));
  });

  it('rejects a file that is not a document, naming what was wrong', () => {
    expect(() => decodeDocumentFile('{"version":1}')).toThrow(DocumentFormatError);
    expect(() => decodeDocumentFile('not json at all')).toThrow(/Not valid JSON/);
  });
});

/**
 * A file written by a previous build, checked in.
 *
 * This is the regression guard #14 asks for — "version migration exercised by
 * an actual old-format fixture in the tests" — as far as the format's own
 * history allows: it is at v1, so there is no v0 to migrate *from*, and a
 * hand-written fake old version would only assert that the migration table can
 * run a migration, which `test/serialize.test.ts` already covers with an
 * injected table.
 *
 * What this does assert is the thing that will actually break: a real file, of
 * the version that real users have, still opens byte-for-byte as it did the day
 * it was written. When the format reaches v2 this fixture stops being a
 * round-trip check and becomes the migration's input, unchanged.
 */
describe('the checked-in fixture', () => {
  it('opens, and is the version it claims to be', async () => {
    const text = await readFile(FIXTURE, 'utf8');

    const document = decodeDocumentFile(text);

    expect(JSON.parse(text)).toMatchObject({ version: 1 });
    expect(document.size).toBe(8);
    expect(document.expect(document.rootId).name).toBe('Bracket');
  });

  it('matches what this build writes for the same document', async () => {
    const text = await readFile(FIXTURE, 'utf8');
    const { document } = bracketDocument();
    document.dispatch(renameNode(document.rootId, 'Bracket'));

    // Not a byte comparison: node ids in the fixture are the fixture's. The
    // claim is that the *shape* this build writes is the shape on disk.
    expect(canonical(serialize(decodeDocumentFile(text)))).toBe(canonical(serialize(document)));
    expect(serialize(document).version).toBe(DOCUMENT_FORMAT_VERSION);
  });
});

describe('filenames', () => {
  it('appends the extension once', () => {
    expect(documentFileName('bracket')).toBe(`bracket${CARVE_FILE_EXTENSION}`);
    expect(documentFileName('bracket.carve')).toBe('bracket.carve');
    expect(documentFileName('bracket.CARVE')).toBe('bracket.carve');
  });

  it('cannot produce a path, a hidden file, or a control character', () => {
    const stem = fileNameStem('../../etc/passwd');
    expect(stem).not.toMatch(/[/\\]/);
    expect(stem.startsWith('.')).toBe(false);
    expect(documentFileName('../../etc/passwd')).toBe('-..-etc-passwd.carve');
    expect(fileNameStem('a\u0000b\u0001c')).toBe('a b c');
    expect(fileNameStem('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j');
  });

  it('falls back rather than writing a file with no name', () => {
    expect(documentFileName('')).toBe('untitled.carve');
    expect(documentFileName('   ')).toBe('untitled.carve');
    expect(documentFileName('...')).toBe('untitled.carve');
  });

  it('caps the stem well below any filesystem limit', () => {
    expect(fileNameStem('x'.repeat(500))).toHaveLength(64);
  });

  it('declares a media type a browser will not try to render', () => {
    expect(CARVE_MIME_TYPE).toBe('application/vnd.carve+json');
  });
});
