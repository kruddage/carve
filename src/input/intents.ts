/**
 * The vocabulary every input device speaks.
 *
 * An intent is *what the user meant*, not what the device did. A mouse drag, a
 * controller trigger-and-move and a pinch-and-move all produce the same three
 * intents — begin, update, commit — and the router in `router.ts` is the only
 * thing that turns them into commands against the document. That is the whole
 * mechanism behind "shared scene graph, two input layers" (#1, #8): get this
 * union right and hand tracking is an adapter; get it wrong and we maintain two
 * modelers.
 *
 * Three properties are load-bearing, and each one is a constraint on what may
 * be added here later:
 *
 * **Intents are plain JSON.** No class instances, no functions, no typed
 * arrays, no `NaN`. A stream of them survives `JSON.stringify` → file →
 * `JSON.parse` → replay unchanged, which is what makes a hand gesture testable
 * without a headset (`record.ts`). `test/input-intents.test.ts` asserts the
 * round trip for one of every kind.
 *
 * **Intents name nodes, never meshes.** The renderer draws one evaluated solid
 * per document (see `src/render/scene-graph.ts`), so "the triangle you hit" is
 * an evaluation output with no identity the document knows about. Resolving a
 * hit to a node id happens in `pick.ts`, *before* an intent exists, and the
 * policy for what a boolean's surface resolves to is written down there rather
 * than being decided independently by each adapter.
 *
 * **`transformCancel` is a first-class outcome, not an error path.** Mouse
 * input rarely cancels. Hand tracking cancels constantly — a hand leaving the
 * camera frustum mid-drag is Tuesday, not an edge case — and the document
 * already models it: `Gesture.cancel()` rolls the drag back and leaves the
 * history untouched. Designing for it now costs a union member; retrofitting it
 * once the wrist menu exists costs a rewrite of every adapter.
 */

import {
  BOOLEAN_OPS,
  PRIMITIVE_KINDS,
  type BooleanOp,
  type NodeId,
  type PrimitiveKind,
  type Quat,
  type TessellationQuality,
  type Trs,
  type Vec3,
} from '../core/index.js';

/**
 * Which device produced an intent.
 *
 * Carried on recorded intents rather than on the intents themselves: the router
 * deliberately cannot see it, because the first time behaviour branches on the
 * device is the moment the two frontends start to diverge. It exists for
 * fixtures, for the status line, and for diagnosing a misbehaving adapter.
 */
export const INPUT_SOURCES = ['pointer', 'xr-controller', 'xr-hand', 'replay'] as const;
export type InputSourceKind = (typeof INPUT_SOURCES)[number];

/**
 * What a transform gesture is editing. One gesture, one mode.
 *
 * The first three exist because a desktop gizmo has three handles and each one
 * constrains the drag to a single kind of change: dragging the move arrows must
 * not rotate the part however much the mouse wanders. `grab` is the fourth
 * because a hand does not work that way — closing your fingers on a solid and
 * turning your wrist moves *and* rotates it, and a two-hand transform (#11)
 * scales at the same time. Rather than three gestures fighting over one node,
 * `grab` honours the whole delta at once.
 */
export const TRANSFORM_MODES = ['translate', 'rotate', 'scale', 'grab'] as const;
export type TransformMode = (typeof TRANSFORM_MODES)[number];

/**
 * Why a transform ended without being kept.
 *
 * Reported rather than inferred, because the three cases want different
 * treatment upstream: `user` is a deliberate escape-key or thumbstick cancel,
 * `tracking-lost` should leave a "your hand left the view" hint, and
 * `interrupted` means another adapter took over and nothing needs saying.
 */
export const CANCEL_REASONS = ['user', 'tracking-lost', 'interrupted'] as const;
export type TransformCancelReason = (typeof CANCEL_REASONS)[number];

/**
 * How far a transform has moved **since its `transformBegin`**, in world space.
 *
 * Cumulative rather than per-frame, and that is the single most consequential
 * decision in this file. Per-frame deltas have to be summed by the receiver, so
 * one dropped or duplicated intent corrupts the rest of the drag permanently,
 * float error accumulates over a 72Hz stream, and a replayed fixture can only
 * be verified by replaying all of it in order. Cumulative deltas are idempotent:
 * the router recomputes the node's transform from the pose captured at begin
 * every time, a dropped update is invisible by the next frame, and `cancel` is
 * "discard, do not un-apply".
 *
 * `scale` is a multiplier, so identity is `1`, not `0` — see `IDENTITY_DELTA`.
 */
export interface TransformDelta {
  /** World-space offset since begin, metres. */
  readonly translation: Vec3;
  /** World-space rotation since begin, about the gesture's pivot. */
  readonly rotation: Quat;
  /** Multiplicative scale since begin, about the gesture's pivot. */
  readonly scale: Vec3;
}

export const IDENTITY_DELTA: TransformDelta = Object.freeze({
  translation: Object.freeze({ x: 0, y: 0, z: 0 }),
  rotation: Object.freeze({ x: 0, y: 0, z: 0, w: 1 }),
  scale: Object.freeze({ x: 1, y: 1, z: 1 }),
});

/** Highlight follows the ray. `null` means nothing is under it. */
export interface HoverIntent {
  readonly kind: 'hover';
  readonly nodeId: NodeId | null;
}

/**
 * `nodeId: null` clears the selection — clicking empty space, which every
 * adapter needs and none should have to express as an `action`.
 */
export interface SelectIntent {
  readonly kind: 'select';
  readonly nodeId: NodeId | null;
  /** Add to (or toggle within) the selection instead of replacing it. */
  readonly additive: boolean;
}

export interface TransformBeginIntent {
  readonly kind: 'transform-begin';
  readonly nodeId: NodeId;
  readonly mode: TransformMode;
  /**
   * World-space point the gesture rotates and scales about. Defaults to the
   * node's own origin when omitted.
   *
   * Adapters that have a hit point should pass it: rotating a grabbed solid
   * about the point your fingers closed on is what makes a pinch feel like
   * holding something, and scaling about the gizmo handle you took hold of is
   * what keeps the opposite corner still.
   */
  readonly pivot?: Vec3;
}

export interface TransformUpdateIntent {
  readonly kind: 'transform-update';
  /** Cumulative since begin — see `TransformDelta`. */
  readonly delta: TransformDelta;
}

/** Keep the transform. One undo entry for the whole drag. */
export interface TransformCommitIntent {
  readonly kind: 'transform-commit';
}

/** Put it back where it was, and leave no undo entry behind. */
export interface TransformCancelIntent {
  readonly kind: 'transform-cancel';
  readonly reason: TransformCancelReason;
}

/**
 * The discrete edits: spawn, boolean, delete, undo, redo.
 *
 * A closed union rather than `action(name: string, params: unknown)`. The
 * open version type-checks every caller and catches none of them: a wrist menu
 * emitting `'spawn'` where the router expects `'spawn-primitive'` compiles,
 * ships, and does nothing when tapped.
 *
 * `targets` defaults to the current selection wherever it is omitted, so a
 * wrist-menu button and a keyboard shortcut can emit the identical intent.
 */
export type ActionRequest =
  | {
      readonly name: 'spawn-primitive';
      readonly primitive: PrimitiveKind;
      /** Where to place it. Defaults to the identity transform, i.e. the origin. */
      readonly transform?: Trs;
      /** `draft` when spawning into an XR session; defaults to `standard`. */
      readonly quality?: TessellationQuality;
      /** Parent for the new node. Defaults to the document root. */
      readonly parentId?: NodeId;
    }
  | {
      readonly name: 'apply-boolean';
      readonly op: BooleanOp;
      /**
       * Operand order matters: the first is the base a `subtract` cuts into.
       * Defaults to the selection, which is kept in selection order for exactly
       * this reason.
       */
      readonly targets?: readonly NodeId[];
    }
  | { readonly name: 'delete'; readonly targets?: readonly NodeId[] }
  | { readonly name: 'undo' }
  | { readonly name: 'redo' };

export interface ActionIntent {
  readonly kind: 'action';
  readonly action: ActionRequest;
}

export type Intent =
  | HoverIntent
  | SelectIntent
  | TransformBeginIntent
  | TransformUpdateIntent
  | TransformCommitIntent
  | TransformCancelIntent
  | ActionIntent;

export type IntentKind = Intent['kind'];

/** Where an adapter sends what it produced. The router is one implementation. */
export type IntentSink = (intent: Intent) => void;

// --- Constructors ---------------------------------------------------------
//
// Adapters build intents through these rather than with object literals, so
// that `exactOptionalPropertyTypes` cannot be satisfied by writing
// `{ pivot: undefined }` — a present-but-undefined key survives JSON.stringify
// as a missing one and makes a recorded fixture differ from the live stream it
// was recorded from.

export function hover(nodeId: NodeId | null): HoverIntent {
  return { kind: 'hover', nodeId };
}

export function select(nodeId: NodeId | null, additive = false): SelectIntent {
  return { kind: 'select', nodeId, additive };
}

export function transformBegin(
  nodeId: NodeId,
  mode: TransformMode,
  pivot?: Vec3,
): TransformBeginIntent {
  return pivot === undefined
    ? { kind: 'transform-begin', nodeId, mode }
    : { kind: 'transform-begin', nodeId, mode, pivot };
}

export function transformUpdate(delta: TransformDelta): TransformUpdateIntent {
  return { kind: 'transform-update', delta };
}

export function transformCommit(): TransformCommitIntent {
  return { kind: 'transform-commit' };
}

export function transformCancel(reason: TransformCancelReason = 'user'): TransformCancelIntent {
  return { kind: 'transform-cancel', reason };
}

export function action(request: ActionRequest): ActionIntent {
  return { kind: 'action', action: request };
}

/** Build a delta from parts, defaulting the components that were not given. */
export function makeDelta(parts: Partial<TransformDelta> = {}): TransformDelta {
  return {
    translation: parts.translation ?? IDENTITY_DELTA.translation,
    rotation: parts.rotation ?? IDENTITY_DELTA.rotation,
    scale: parts.scale ?? IDENTITY_DELTA.scale,
  };
}

/**
 * Whether `value` is a well-formed intent.
 *
 * Used by `record.ts` when reading a fixture off disk, on the same principle as
 * `deserialize` in core: a file is hostile input, and a half-understood intent
 * replayed against a document is worse than a rejected one.
 */
export function isIntent(value: unknown): value is Intent {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { kind?: unknown };
  switch (candidate.kind) {
    case 'hover':
      return isNodeIdOrNull((value as HoverIntent).nodeId);
    case 'select': {
      const intent = value as SelectIntent;
      return isNodeIdOrNull(intent.nodeId) && typeof intent.additive === 'boolean';
    }
    case 'transform-begin': {
      const intent = value as TransformBeginIntent;
      return (
        typeof intent.nodeId === 'string' &&
        (TRANSFORM_MODES as readonly string[]).includes(intent.mode) &&
        (intent.pivot === undefined || isVec3(intent.pivot))
      );
    }
    case 'transform-update':
      return isDelta((value as TransformUpdateIntent).delta);
    case 'transform-commit':
      return true;
    case 'transform-cancel':
      return (CANCEL_REASONS as readonly string[]).includes(
        (value as TransformCancelIntent).reason,
      );
    case 'action':
      return isActionRequest((value as ActionIntent).action);
    default:
      return false;
  }
}

function isNodeIdOrNull(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isVec3(value: unknown): value is Vec3 {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Vec3;
  return isFiniteNumber(v.x) && isFiniteNumber(v.y) && isFiniteNumber(v.z);
}

function isQuat(value: unknown): value is Quat {
  if (typeof value !== 'object' || value === null) return false;
  const q = value as Quat;
  return isFiniteNumber(q.x) && isFiniteNumber(q.y) && isFiniteNumber(q.z) && isFiniteNumber(q.w);
}

function isDelta(value: unknown): value is TransformDelta {
  if (typeof value !== 'object' || value === null) return false;
  const delta = value as TransformDelta;
  return isVec3(delta.translation) && isQuat(delta.rotation) && isVec3(delta.scale);
}

function isActionRequest(value: unknown): value is ActionRequest {
  if (typeof value !== 'object' || value === null) return false;
  const request = value as { name?: unknown; primitive?: unknown; op?: unknown; targets?: unknown };
  switch (request.name) {
    case 'spawn-primitive':
      return (PRIMITIVE_KINDS as readonly string[]).includes(request.primitive as string);
    case 'apply-boolean':
      return (
        (BOOLEAN_OPS as readonly string[]).includes(request.op as string) &&
        isTargetList(request.targets)
      );
    case 'delete':
      return isTargetList(request.targets);
    case 'undo':
    case 'redo':
      return true;
    default:
      return false;
  }
}

function isTargetList(value: unknown): boolean {
  return (
    value === undefined || (Array.isArray(value) && value.every((id) => typeof id === 'string'))
  );
}
