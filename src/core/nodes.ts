/**
 * The node types the CSG tree is made of, and the invariants that hold for all
 * of them.
 *
 * The tree is non-destructive: a box is `{ width, height, depth }` forever, not
 * twelve triangles the moment it is created. Meshes are a *derived* artifact
 * produced by the kernel in #6 and thrown away when a parameter changes. That
 * is the whole reason for this file's existence — if nodes stored geometry,
 * "edit the radius of the cylinder you subtracted an hour ago" stops being
 * possible.
 *
 * Four kinds, and the reason each one is separate:
 *
 *   - **primitive** — shape type plus parameters. No placement.
 *   - **transform** — TRS over its children. Separate from primitives so a
 *     gizmo drag and a parameter edit never touch the same field.
 *   - **boolean**   — union / subtract / intersect over *ordered* children.
 *     Order is load-bearing: subtract is not commutative.
 *   - **group**     — organization only, no geometric meaning. A group is a
 *     union for evaluation purposes but stays distinct in the outliner.
 *
 * Nodes are immutable plain data. Every edit produces a new node object, which
 * is what makes the undo stack able to hold a previous version by reference and
 * what makes `serialize` a structural copy rather than a traversal with special
 * cases. Children are referenced by id, never by nesting the objects, so the
 * store can look any node up in O(1) and so a subtree can be re-parented
 * without rewriting the nodes inside it.
 */

import { IDENTITY_TRS, type Trs } from './math.js';

/** A stable, tree-position-independent handle for a node. */
export type NodeId = string;

export const NODE_KINDS = ['primitive', 'transform', 'boolean', 'group'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

/**
 * The v1 primitive set from issue #1.
 *
 * Only the *names* live here. Parameter schemas, units, defaults and the
 * registry that validates them are in `primitives.ts` (issue #7a), and mesh
 * construction is #7b. `params` stays an unvalidated bag of numbers as far as
 * this file is concerned, and the document model does not care what is in it.
 * That is deliberate — the model's job is to keep parameters editable and
 * undoable, not to know what a torus is. Code that spawns a primitive for a
 * user should call `spawnPrimitive` from `primitives.ts` rather than
 * `primitiveNode` here, so nothing reaches the store un-normalized.
 */
export const PRIMITIVE_KINDS = ['box', 'cylinder', 'sphere', 'cone', 'torus', 'wedge'] as const;
export type PrimitiveKind = (typeof PRIMITIVE_KINDS)[number];

export const BOOLEAN_OPS = ['union', 'subtract', 'intersect'] as const;
export type BooleanOp = (typeof BOOLEAN_OPS)[number];

interface NodeBase {
  readonly id: NodeId;
  /** Display name for the outliner. Not unique, not an identifier. */
  readonly name: string;
}

export interface PrimitiveNode extends NodeBase {
  readonly kind: 'primitive';
  readonly primitive: PrimitiveKind;
  /** Shape parameters in metres or radians. Schema lives in `primitives.ts`. */
  readonly params: Readonly<Record<string, number>>;
}

export interface TransformNode extends NodeBase {
  readonly kind: 'transform';
  readonly transform: Trs;
  readonly children: readonly NodeId[];
}

export interface BooleanNode extends NodeBase {
  readonly kind: 'boolean';
  readonly op: BooleanOp;
  /**
   * Ordered. For `subtract` the first child is the base and every later child
   * is cut out of it; `union` and `intersect` do not depend on order, but the
   * ordering is still preserved so evaluation is deterministic and the subtree
   * cache in #6 stays valid across a reload.
   */
  readonly children: readonly NodeId[];
}

export interface GroupNode extends NodeBase {
  readonly kind: 'group';
  readonly children: readonly NodeId[];
}

export type CarveNode = PrimitiveNode | TransformNode | BooleanNode | GroupNode;

/** Any node that can hold children. Primitives are the only leaves. */
export type ContainerNode = TransformNode | BooleanNode | GroupNode;

export function isContainer(node: CarveNode): node is ContainerNode {
  return node.kind !== 'primitive';
}

/** Children of any node — the empty list for a primitive, so callers need no guard. */
export function childrenOf(node: CarveNode): readonly NodeId[] {
  return isContainer(node) ? node.children : [];
}

/** A copy of `node` with a different child list. Kind and id are preserved. */
export function withChildren(node: ContainerNode, children: readonly NodeId[]): ContainerNode {
  return { ...node, children };
}

/**
 * Id generation.
 *
 * `crypto.randomUUID` is unavailable in a plain-HTTP context, which is exactly
 * how the LAN dev server is reached from a headset when the https mode in
 * vite.config.ts is not in use. So there is a fallback, and it is
 * `getRandomValues` rather than `Math.random` wherever possible: these ids end
 * up in saved files, and collisions across two documents merged later are a
 * real (if distant) failure mode.
 */
export function createNodeId(): NodeId {
  const webCrypto = globalThis.crypto as Crypto | undefined;
  if (typeof webCrypto?.randomUUID === 'function') return webCrypto.randomUUID();

  const bytes = new Uint8Array(16);
  if (typeof webCrypto?.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  // Set the RFC 4122 version (4) and variant bits so the fallback is still a
  // well-formed UUID rather than 32 arbitrary hex characters.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

interface CommonSpec {
  readonly id?: NodeId;
  readonly name?: string;
}

export interface PrimitiveSpec extends CommonSpec {
  readonly primitive: PrimitiveKind;
  readonly params?: Readonly<Record<string, number>>;
}

export function primitiveNode(spec: PrimitiveSpec): PrimitiveNode {
  return {
    id: spec.id ?? createNodeId(),
    kind: 'primitive',
    name: spec.name ?? spec.primitive,
    primitive: spec.primitive,
    params: { ...(spec.params ?? {}) },
  };
}

export interface TransformSpec extends CommonSpec {
  readonly transform?: Trs;
  readonly children?: readonly NodeId[];
}

export function transformNode(spec: TransformSpec = {}): TransformNode {
  return {
    id: spec.id ?? createNodeId(),
    kind: 'transform',
    name: spec.name ?? 'Transform',
    transform: spec.transform ?? IDENTITY_TRS,
    children: [...(spec.children ?? [])],
  };
}

export interface BooleanSpec extends CommonSpec {
  readonly op: BooleanOp;
  readonly children?: readonly NodeId[];
}

export function booleanNode(spec: BooleanSpec): BooleanNode {
  return {
    id: spec.id ?? createNodeId(),
    kind: 'boolean',
    name: spec.name ?? spec.op,
    op: spec.op,
    children: [...(spec.children ?? [])],
  };
}

export interface GroupSpec extends CommonSpec {
  readonly children?: readonly NodeId[];
}

export function groupNode(spec: GroupSpec = {}): GroupNode {
  return {
    id: spec.id ?? createNodeId(),
    kind: 'group',
    name: spec.name ?? 'Group',
    children: [...(spec.children ?? [])],
  };
}

/**
 * A detached subtree: one root plus every node beneath it, self-contained.
 *
 * This is the unit that insert and remove trade in. Deleting a boolean has to
 * remember its whole subtree in order for undo to put it back, and it has to
 * remember it as *data* rather than as ids into a store that no longer contains
 * them.
 */
export interface NodeBundle {
  readonly rootId: NodeId;
  /** Every node in the subtree including the root, in depth-first order. */
  readonly nodes: readonly CarveNode[];
}
