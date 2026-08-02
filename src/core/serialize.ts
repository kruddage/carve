/**
 * The on-disk shape of a document, versioned from the first commit.
 *
 * Versioning before there is anything to migrate looks like ceremony, and is
 * the cheapest insurance in the project. A file written today by a user who
 * builds something they care about has to still open after #7a adds parameter
 * schemas and #14 adds materials. Without a version field the only options are
 * "guess from the shape" or "break their file"; with one, a migration is a
 * function in the table below.
 *
 * The format is plain JSON with no cycles: a version, a root id, and a flat
 * array of nodes in depth-first document order. Flat rather than nested for the
 * same reason the store is flat — and because the depth-first ordering makes
 * the array itself the answer to "what order does the outliner show". Ordering
 * is deterministic, which is what lets `deserialize(serialize(doc))` be
 * compared with a deep equal in a test instead of a custom tree walk.
 *
 * Deserialization treats its input as hostile. It is reading a file the user
 * may have hand-edited or that came out of a different version of the app, so
 * every field is checked and a bad file produces a `DocumentFormatError` naming
 * what was wrong, never a half-built document.
 */

import { CarveDocument } from './document.js';
import {
  BOOLEAN_OPS,
  PRIMITIVE_KINDS,
  type BooleanOp,
  type CarveNode,
  type NodeBundle,
  type NodeId,
  type PrimitiveKind,
} from './nodes.js';
import { DocumentError } from './store.js';
import { type Quat, type Trs, type Vec3 } from './math.js';

/** Bumped by any change to the shape below. See `MIGRATIONS`. */
export const DOCUMENT_FORMAT_VERSION = 1;

export interface SerializedDocument {
  readonly version: number;
  readonly root: NodeId;
  /** Depth-first from the root, root first. */
  readonly nodes: readonly CarveNode[];
}

export class DocumentFormatError extends DocumentError {
  constructor(message: string) {
    super(message);
    this.name = 'DocumentFormatError';
  }
}

/** Snapshot a document as plain JSON-safe data. */
export function serialize(document: CarveDocument): SerializedDocument {
  return {
    version: DOCUMENT_FORMAT_VERSION,
    root: document.rootId,
    nodes: document.order().map((id) => document.expect(id)),
  };
}

/**
 * Rebuild a document from `serialize` output or from parsed JSON.
 *
 * The history is *not* restored: an undo stack that survives a reload would
 * hold commands captured against a store that no longer exists, and "undo"
 * immediately after opening a file is a request nobody makes. The document
 * comes back with an empty history, which is also why #14 can save on a
 * schedule without worrying about what it does to undo.
 */
export function deserialize(raw: unknown): CarveDocument {
  const migrated = migrate(raw);
  try {
    return CarveDocument.fromBundle(toBundle(migrated));
  } catch (error) {
    // The store's structural checks — dangling child references, cycles,
    // unreachable nodes — are the same failures as a malformed field when the
    // input is a file. Callers reading a file should only have to catch one
    // error type to tell "this document is broken" from "this is a bug".
    if (error instanceof DocumentError) throw new DocumentFormatError(error.message);
    throw error;
  }
}

/** Parse and deserialize in one step, with file-shaped errors. */
export function deserializeJson(text: string): CarveDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new DocumentFormatError(
      `Not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return deserialize(parsed);
}

export type Migration = (document: SerializedDocument) => SerializedDocument;

/**
 * `version` → the migration that turns it into `version + 1`.
 *
 * Empty at v1, and the hook exists anyway: the expensive version of this
 * decision is the one where the first migration also has to invent the
 * mechanism, under time pressure, against files that already exist.
 */
export const MIGRATIONS: ReadonlyMap<number, Migration> = new Map<number, Migration>();

/**
 * Run a raw document up to the current version.
 *
 * Exported with an injectable table so the machinery can be tested with fake
 * migrations rather than only being exercised for real the day the format
 * changes — an untested migration path is the same as not having one.
 */
export function migrate(
  raw: unknown,
  migrations: ReadonlyMap<number, Migration> = MIGRATIONS,
  targetVersion: number = DOCUMENT_FORMAT_VERSION,
): SerializedDocument {
  const document = asSerializedDocument(raw);

  if (document.version > targetVersion) {
    throw new DocumentFormatError(
      `Document is version ${document.version}, which is newer than this build understands ` +
        `(${targetVersion}). Update Carve to open it.`,
    );
  }

  let current = document;
  while (current.version < targetVersion) {
    const migration = migrations.get(current.version);
    if (!migration) {
      throw new DocumentFormatError(
        `No migration from document version ${current.version} to ${current.version + 1}`,
      );
    }
    const next = migration(current);
    if (next.version <= current.version) {
      throw new DocumentFormatError(
        `Migration from version ${current.version} did not advance the version`,
      );
    }
    current = next;
  }
  return current;
}

function toBundle(document: SerializedDocument): NodeBundle {
  return { rootId: document.root, nodes: document.nodes };
}

// --- Validation -----------------------------------------------------------
//
// Hand-written rather than schema-driven. The shape is small, the checks are
// the documentation of the format, and a validation library in src/core/ is a
// dependency that would then have to run in a worker and on a headset.

function asSerializedDocument(raw: unknown): SerializedDocument {
  const record = asRecord(raw, 'document');
  const version = record['version'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new DocumentFormatError(
      `Document version must be a positive integer, got ${show(version)}`,
    );
  }
  const root = record['root'];
  if (typeof root !== 'string' || root.length === 0) {
    throw new DocumentFormatError(`Document root must be a node id, got ${show(root)}`);
  }
  const nodes = record['nodes'];
  if (!Array.isArray(nodes)) {
    throw new DocumentFormatError(`Document nodes must be an array, got ${show(nodes)}`);
  }
  // Node validation is skipped for versions that still need migrating: an old
  // file is only required to be node-shaped *after* its migrations have run.
  const list = nodes as readonly unknown[];
  const parsed =
    version === DOCUMENT_FORMAT_VERSION
      ? list.map((node, index) => asNode(node, index))
      : (list as readonly CarveNode[]);
  return { version, root, nodes: parsed };
}

function asNode(raw: unknown, index: number): CarveNode {
  const where = `nodes[${index}]`;
  const record = asRecord(raw, where);
  const id = asId(record['id'], `${where}.id`);
  const name = record['name'];
  if (typeof name !== 'string') {
    throw new DocumentFormatError(`${where}.name must be a string, got ${show(name)}`);
  }

  switch (record['kind']) {
    case 'primitive':
      return {
        id,
        name,
        kind: 'primitive',
        primitive: asPrimitiveKind(record['primitive'], `${where}.primitive`),
        params: asParams(record['params'], `${where}.params`),
      };
    case 'transform':
      return {
        id,
        name,
        kind: 'transform',
        transform: asTrs(record['transform'], `${where}.transform`),
        children: asChildren(record['children'], where),
      };
    case 'boolean':
      return {
        id,
        name,
        kind: 'boolean',
        op: asBooleanOp(record['op'], `${where}.op`),
        children: asChildren(record['children'], where),
      };
    case 'group':
      return { id, name, kind: 'group', children: asChildren(record['children'], where) };
    default:
      throw new DocumentFormatError(`${where}.kind is not a node kind: ${show(record['kind'])}`);
  }
}

function asRecord(raw: unknown, where: string): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new DocumentFormatError(`${where} must be an object, got ${show(raw)}`);
  }
  return raw as Record<string, unknown>;
}

function asId(raw: unknown, where: string): NodeId {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new DocumentFormatError(`${where} must be a non-empty string, got ${show(raw)}`);
  }
  return raw;
}

function asChildren(raw: unknown, where: string): readonly NodeId[] {
  if (!Array.isArray(raw)) {
    throw new DocumentFormatError(`${where}.children must be an array, got ${show(raw)}`);
  }
  return raw.map((child, index) => asId(child, `${where}.children[${index}]`));
}

function asPrimitiveKind(raw: unknown, where: string): PrimitiveKind {
  if (!isMember(PRIMITIVE_KINDS, raw)) {
    throw new DocumentFormatError(
      `${where} must be one of ${PRIMITIVE_KINDS.join(', ')}, got ${show(raw)}`,
    );
  }
  return raw;
}

function asBooleanOp(raw: unknown, where: string): BooleanOp {
  if (!isMember(BOOLEAN_OPS, raw)) {
    throw new DocumentFormatError(
      `${where} must be one of ${BOOLEAN_OPS.join(', ')}, got ${show(raw)}`,
    );
  }
  return raw;
}

function asParams(raw: unknown, where: string): Readonly<Record<string, number>> {
  const record = asRecord(raw, where);
  const params: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    // NaN and Infinity do not survive JSON anyway (`JSON.stringify` writes
    // them as null), so a non-finite number here means the file was built by
    // something other than `serialize` and would poison every mesh downstream.
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new DocumentFormatError(`${where}.${key} must be a finite number, got ${show(value)}`);
    }
    params[key] = value;
  }
  return params;
}

function asTrs(raw: unknown, where: string): Trs {
  const record = asRecord(raw, where);
  return {
    translation: asVec3(record['translation'], `${where}.translation`),
    rotation: asQuat(record['rotation'], `${where}.rotation`),
    scale: asVec3(record['scale'], `${where}.scale`),
  };
}

function asVec3(raw: unknown, where: string): Vec3 {
  const record = asRecord(raw, where);
  return {
    x: asFiniteNumber(record['x'], `${where}.x`),
    y: asFiniteNumber(record['y'], `${where}.y`),
    z: asFiniteNumber(record['z'], `${where}.z`),
  };
}

function asQuat(raw: unknown, where: string): Quat {
  const record = asRecord(raw, where);
  return {
    x: asFiniteNumber(record['x'], `${where}.x`),
    y: asFiniteNumber(record['y'], `${where}.y`),
    z: asFiniteNumber(record['z'], `${where}.z`),
    w: asFiniteNumber(record['w'], `${where}.w`),
  };
}

function asFiniteNumber(raw: unknown, where: string): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new DocumentFormatError(`${where} must be a finite number, got ${show(raw)}`);
  }
  return raw;
}

function isMember<T extends string>(values: readonly T[], raw: unknown): raw is T {
  return typeof raw === 'string' && (values as readonly string[]).includes(raw);
}

/**
 * A short, safe rendering of a bad value for an error message.
 *
 * Switched on `typeof` rather than stringified directly: the input is whatever
 * was in the file, and an error message that reads `[object Object]` tells the
 * person holding the broken file nothing at all.
 */
function show(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'number':
    case 'bigint':
    case 'boolean':
    case 'undefined':
      return String(value);
    case 'symbol':
      return value.toString();
    case 'function':
      return 'a function';
    default:
      if (value === null) return 'null';
      return Array.isArray(value) ? 'an array' : 'an object';
  }
}
