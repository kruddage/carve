/**
 * The one place intents become commands.
 *
 * Every adapter — pointer, controller, hand, replayed fixture — hands its
 * intents here, and this is the only code in `src/input/` that touches
 * `CarveDocument`. That is what makes #8's second done-when true rather than
 * aspirational: adding an adapter is writing something that produces `Intent`
 * values, with no change in `src/core/` and none in `src/ui/`, because neither
 * one ever learns a new device exists.
 *
 * ## It answers, it does not throw
 *
 * Every `handle` call returns a `RouterOutcome`, including the bad ones. A
 * grab on a node with nowhere to write, a boolean with one operand, an undo
 * during a drag: all of them come back as `rejected` with a reason. Adapters
 * run inside a frame loop fed by hardware that produces nonsense on a regular
 * basis — a hand-tracking frame with a node id from two evaluations ago is
 * normal — and an exception there takes the render loop down with it. The
 * document still throws, and this module still catches: `DocumentError` becomes
 * a rejection with its message attached.
 *
 * ## Where the transform math happens
 *
 * Intents carry **world-space** deltas, because that is the only space an
 * adapter can speak: a hand knows where it is in the room, not where it is in
 * some node's parent's coordinate system. So the router composes in matrix
 * space —
 *
 *   newWorld  = delta · startWorld
 *   newLocal  = parentWorld⁻¹ · newWorld
 *
 * — and decomposes only the final result. Doing it any other way (stacking
 * `Trs` values, or converting the delta into parent space first) either loses
 * the rotation of an ancestor or accumulates error every frame of a drag.
 * `decomposeMatrix` in `geometry.ts` documents the one case that still cannot
 * be represented: a non-uniform scale above a rotation is a shear, and no TRS
 * describes it. Core's `composeTrs` has the same hole, and so do glTF and
 * three.js.
 *
 * ## Why a gesture, every time
 *
 * A transform runs inside `CarveDocument.beginGesture`, so a 144-frame drag
 * coalesces into one undo entry and a cancel leaves no trace. The document was
 * built for this — see `docs/document-model.md` — and the router's job is to
 * make sure no adapter has to remember it.
 */

import {
  DocumentError,
  IDENTITY_MATRIX,
  IDENTITY_TRS,
  booleanNode,
  composite,
  insertBundle,
  makeBooleanCommand,
  makeTrs,
  multiplyMatrices,
  placedPrimitive,
  removeNode,
  setTransform,
  spawnPrimitive,
  trsToMatrix,
  vec3,
  type CarveDocument,
  type Gesture,
  type Mat4,
  type NodeId,
  type Vec3,
} from '../core/index.js';

import {
  decomposeMatrix,
  invertMatrix,
  scaleVec3,
  subVec3,
  transformPoint,
  translationMatrix,
} from './geometry.js';
import type { ActionRequest, Intent, TransformDelta, TransformMode } from './intents.js';
import {
  DEFAULT_SNAP_SETTINGS,
  resolveSnap,
  snapRotation,
  type SnapFeature,
  type SnapField,
  type SnapSettings,
} from './snap.js';

export const REJECTION_REASONS = [
  'unknown-node',
  'no-transform-target',
  'already-transforming',
  'not-transforming',
  'gesture-open',
  'degenerate-transform',
  'nothing-selected',
  'needs-two-operands',
  'nothing-to-undo',
  'nothing-to-redo',
  'cannot-delete-root',
  'document-error',
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

export type RouterStatus =
  /** The document changed, or the selection did. */
  | 'applied'
  /** Well-formed and deliberately a no-op — a hover that did not move. */
  | 'ignored'
  /** Refused, with a reason. Never an exception. */
  | 'rejected';

export interface RouterOutcome {
  readonly status: RouterStatus;
  readonly intent: Intent;
  readonly reason?: RejectionReason;
  /** `DocumentError`'s message, when one was caught. */
  readonly message?: string;
  /** The node the intent acted on — the new node, for a spawn. */
  readonly nodeId?: NodeId;
  /** The feature a transform update snapped to, for a viewport marker. */
  readonly snappedTo?: SnapFeature;
}

export type OutcomeListener = (outcome: RouterOutcome) => void;
export type HoverListener = (nodeId: NodeId | null) => void;

export interface RouterOptions {
  readonly document: CarveDocument;
  /** Defaults to `DEFAULT_SNAP_SETTINGS`. */
  readonly snap?: SnapSettings;
  /** Scene features to snap against. Without one, only the grid applies. */
  readonly snapField?: SnapField;
  /** Where `spawn-primitive` puts new nodes. Defaults to the document root. */
  readonly spawnParentId?: NodeId;
}

/** What a transform gesture captured when it began. */
interface ActiveTransform {
  readonly nodeId: NodeId;
  readonly mode: TransformMode;
  readonly gesture: Gesture;
  /** World-space point rotation and scale happen about. */
  readonly pivot: Vec3;
  /** The node's world matrix at begin. */
  readonly startWorld: Mat4;
  /** Inverse of the parent's world matrix at begin. */
  readonly parentInverse: Mat4;
  /** World-space origin at begin — what translation snapping quantizes. */
  readonly startOrigin: Vec3;
  /** The node and everything under it: never snaps to its own features. */
  readonly ownFeatures: ReadonlySet<NodeId>;
}

export class IntentRouter {
  readonly #document: CarveDocument;
  readonly #outcomeListeners = new Set<OutcomeListener>();
  readonly #hoverListeners = new Set<HoverListener>();
  #snap: SnapSettings;
  #snapField: SnapField | null;
  #spawnParentId: NodeId | null;
  #hovered: NodeId | null = null;
  #active: ActiveTransform | null = null;

  constructor(options: RouterOptions) {
    this.#document = options.document;
    this.#snap = options.snap ?? DEFAULT_SNAP_SETTINGS;
    this.#snapField = options.snapField ?? null;
    this.#spawnParentId = options.spawnParentId ?? null;
  }

  get document(): CarveDocument {
    return this.#document;
  }

  /** What the last `hover` intent resolved to. Not document state: view state. */
  get hovered(): NodeId | null {
    return this.#hovered;
  }

  /** The node and mode of the transform in flight, or `null`. */
  get transforming(): { readonly nodeId: NodeId; readonly mode: TransformMode } | null {
    return this.#active === null ? null : { nodeId: this.#active.nodeId, mode: this.#active.mode };
  }

  get snapSettings(): SnapSettings {
    return this.#snap;
  }

  setSnapSettings(settings: SnapSettings): void {
    this.#snap = settings;
  }

  setSnapField(field: SnapField | null): void {
    this.#snapField = field;
  }

  subscribe(listener: OutcomeListener): () => void {
    this.#outcomeListeners.add(listener);
    return () => this.#outcomeListeners.delete(listener);
  }

  subscribeHover(listener: HoverListener): () => void {
    this.#hoverListeners.add(listener);
    return () => this.#hoverListeners.delete(listener);
  }

  /** Route one intent. Never throws. */
  handle(intent: Intent): RouterOutcome {
    let outcome: RouterOutcome;
    try {
      outcome = this.#route(intent);
    } catch (error) {
      // A `DocumentError` is a rejected edit and belongs in the return value.
      // Anything else is a bug in this layer and must not be swallowed, or the
      // frame loop keeps running against a document nobody can explain.
      if (!(error instanceof DocumentError)) throw error;
      outcome = {
        status: 'rejected',
        intent,
        reason: 'document-error',
        message: error.message,
      };
    }
    for (const listener of this.#outcomeListeners) listener(outcome);
    return outcome;
  }

  /** Route a stream in order, returning every outcome. Used by `replay`. */
  handleAll(intents: Iterable<Intent>): readonly RouterOutcome[] {
    const outcomes: RouterOutcome[] = [];
    for (const intent of intents) outcomes.push(this.handle(intent));
    return outcomes;
  }

  /**
   * Abandon any transform in flight.
   *
   * For the case no intent can describe, because the adapter that would have
   * sent one is gone: an XR session ending mid-drag, a canvas being torn down,
   * a pointer capture lost to a browser gesture.
   */
  abort(reason: 'user' | 'tracking-lost' | 'interrupted' = 'interrupted'): boolean {
    if (!this.#active) return false;
    this.handle({ kind: 'transform-cancel', reason });
    return true;
  }

  // --- Routing ------------------------------------------------------------

  #route(intent: Intent): RouterOutcome {
    switch (intent.kind) {
      case 'hover':
        return this.#hover(intent.nodeId, intent);
      case 'select':
        return this.#select(intent.nodeId, intent.additive, intent);
      case 'transform-begin':
        return this.#beginTransform(intent.nodeId, intent.mode, intent.pivot, intent);
      case 'transform-update':
        return this.#updateTransform(intent.delta, intent);
      case 'transform-commit':
        return this.#endTransform(true, intent);
      case 'transform-cancel':
        return this.#endTransform(false, intent);
      case 'action':
        return this.#action(intent.action, intent);
    }
  }

  #hover(nodeId: NodeId | null, intent: Intent): RouterOutcome {
    const resolved = nodeId !== null && this.#document.has(nodeId) ? nodeId : null;
    if (resolved === this.#hovered) return { status: 'ignored', intent };
    this.#hovered = resolved;
    for (const listener of this.#hoverListeners) listener(resolved);
    return resolved === null
      ? { status: 'applied', intent }
      : { status: 'applied', intent, nodeId: resolved };
  }

  #select(nodeId: NodeId | null, additive: boolean, intent: Intent): RouterOutcome {
    if (nodeId === null) {
      this.#document.clearSelection();
      return { status: 'applied', intent };
    }
    if (!this.#document.has(nodeId)) {
      return { status: 'rejected', intent, reason: 'unknown-node', nodeId };
    }

    if (!additive) {
      this.#document.setSelection([nodeId]);
      return { status: 'applied', intent, nodeId };
    }

    // Additive means toggle. Ctrl-clicking a selected node to deselect it is
    // the behaviour every tool has, and "additive" that could only ever add
    // would need a second intent to undo itself.
    const current = this.#document.selection;
    const next = current.includes(nodeId)
      ? current.filter((id) => id !== nodeId)
      : [...current, nodeId];
    this.#document.setSelection(next);
    return { status: 'applied', intent, nodeId };
  }

  #beginTransform(
    nodeId: NodeId,
    mode: TransformMode,
    pivot: Vec3 | undefined,
    intent: Intent,
  ): RouterOutcome {
    if (this.#active) {
      return { status: 'rejected', intent, reason: 'already-transforming', nodeId };
    }
    if (!this.#document.has(nodeId)) {
      return { status: 'rejected', intent, reason: 'unknown-node', nodeId };
    }
    if (this.#document.activeGestureId !== null) {
      return { status: 'rejected', intent, reason: 'gesture-open', nodeId };
    }

    const targetId = this.#transformTarget(nodeId);
    if (targetId === null) {
      return { status: 'rejected', intent, reason: 'no-transform-target', nodeId };
    }

    const startWorld = this.#document.worldMatrix(targetId);
    const parentId = this.#document.parentOf(targetId);
    const parentWorld = parentId === null ? IDENTITY_MATRIX : this.#document.worldMatrix(parentId);
    const parentInverse = invertMatrix(parentWorld);
    if (!parentInverse) {
      return { status: 'rejected', intent, reason: 'degenerate-transform', nodeId: targetId };
    }

    const startOrigin = transformPoint(startWorld, vec3(0, 0, 0));
    this.#active = {
      nodeId: targetId,
      mode,
      gesture: this.#document.beginGesture(mode),
      pivot: pivot ?? startOrigin,
      startWorld,
      parentInverse,
      startOrigin,
      ownFeatures: new Set([targetId, ...this.#document.descendantsOf(targetId)]),
    };
    return { status: 'applied', intent, nodeId: targetId };
  }

  #updateTransform(delta: TransformDelta, intent: Intent): RouterOutcome {
    const active = this.#active;
    if (!active) return { status: 'ignored', intent, reason: 'not-transforming' };

    const { matrix, snappedTo } = this.#deltaMatrix(active, delta);
    const newWorld = multiplyMatrices(matrix, active.startWorld);
    const newLocal = multiplyMatrices(active.parentInverse, newWorld);

    // The one lossy step in the pipeline, and it is taken once per frame rather
    // than once per operation — see the file header and `decomposeMatrix`.
    active.gesture.dispatch(setTransform(active.nodeId, decomposeMatrix(newLocal)));

    return snappedTo
      ? { status: 'applied', intent, nodeId: active.nodeId, snappedTo }
      : { status: 'applied', intent, nodeId: active.nodeId };
  }

  #endTransform(keep: boolean, intent: Intent): RouterOutcome {
    const active = this.#active;
    if (!active) return { status: 'ignored', intent, reason: 'not-transforming' };

    this.#active = null;
    if (keep) active.gesture.commit();
    else active.gesture.cancel();
    return { status: 'applied', intent, nodeId: active.nodeId };
  }

  #action(request: ActionRequest, intent: Intent): RouterOutcome {
    // Every action is a structural edit, and the document refuses those while a
    // gesture is open — for good reason: an insert landing between a drag's
    // first inverse and its latest command makes undo restore a state that
    // never existed. Rejected here with a reason rather than left to throw.
    if (this.#active !== null || this.#document.activeGestureId !== null) {
      return { status: 'rejected', intent, reason: 'gesture-open' };
    }

    switch (request.name) {
      case 'undo': {
        const change = this.#document.undo();
        return change === null
          ? { status: 'rejected', intent, reason: 'nothing-to-undo' }
          : { status: 'applied', intent };
      }
      case 'redo': {
        const change = this.#document.redo();
        return change === null
          ? { status: 'rejected', intent, reason: 'nothing-to-redo' }
          : { status: 'applied', intent };
      }
      case 'spawn-primitive': {
        const primitive = spawnPrimitive(
          request.primitive,
          request.quality === undefined ? {} : { quality: request.quality },
        );
        const bundle = placedPrimitive(primitive, request.transform ?? IDENTITY_TRS);
        const parentId = request.parentId ?? this.#spawnParentId ?? this.#document.rootId;
        if (!this.#document.has(parentId)) {
          return { status: 'rejected', intent, reason: 'unknown-node', nodeId: parentId };
        }
        this.#document.dispatch(insertBundle(bundle, parentId));
        // Spawn then select: the next thing anyone does to a primitive they
        // just created is move it, and requiring a click first would make the
        // wrist menu in #12 a two-step interaction for no reason.
        this.#document.setSelection([bundle.rootId]);
        return { status: 'applied', intent, nodeId: bundle.rootId };
      }
      case 'apply-boolean': {
        const targets = request.targets ?? this.#document.selection;
        if (targets.length < 2) {
          return { status: 'rejected', intent, reason: 'needs-two-operands' };
        }
        const missing = targets.find((id) => !this.#document.has(id));
        if (missing !== undefined) {
          return { status: 'rejected', intent, reason: 'unknown-node', nodeId: missing };
        }
        const node = booleanNode({ op: request.op });
        this.#document.dispatch(makeBooleanCommand(this.#document, node, [...targets]));
        this.#document.setSelection([node.id]);
        return { status: 'applied', intent, nodeId: node.id };
      }
      case 'delete': {
        const targets = request.targets ?? this.#document.selection;
        if (targets.length === 0) {
          return { status: 'rejected', intent, reason: 'nothing-selected' };
        }
        if (targets.includes(this.#document.rootId)) {
          return { status: 'rejected', intent, reason: 'cannot-delete-root' };
        }
        const missing = targets.find((id) => !this.#document.has(id));
        if (missing !== undefined) {
          return { status: 'rejected', intent, reason: 'unknown-node', nodeId: missing };
        }
        // Drop anything already covered by an ancestor in the same request:
        // removing a node and then its child means the second command runs
        // against a store that no longer holds it, and the whole composite
        // rolls back.
        const outermost = [...new Set(targets)].filter(
          (id) => !this.#document.ancestorsOf(id).some((ancestor) => targets.includes(ancestor)),
        );
        this.#document.dispatch(
          composite(
            outermost.map((id) => removeNode(id)),
            outermost.length === 1 ? 'Delete' : `Delete ${outermost.length} nodes`,
          ),
        );
        return { status: 'applied', intent };
      }
    }
  }

  // --- Transform helpers --------------------------------------------------

  /**
   * The node a grab actually writes to: the picked node if it is a transform,
   * otherwise the nearest transform above it.
   *
   * Not "wrap it in one if there isn't": inserting a node as a side effect of
   * touching something would put a structural edit inside a drag gesture, which
   * the document forbids, and would mean a cancelled drag left a node behind.
   * `placedPrimitive` already guarantees every spawned primitive has a
   * transform of its own, so the null case is a tree assembled by hand — and
   * the honest answer there is "nothing to grab", surfaced as a rejection the
   * UI can act on.
   */
  #transformTarget(nodeId: NodeId): NodeId | null {
    const node = this.#document.get(nodeId);
    if (node?.kind === 'transform') return nodeId;
    for (const ancestorId of this.#document.ancestorsOf(nodeId)) {
      if (this.#document.get(ancestorId)?.kind === 'transform') return ancestorId;
    }
    return null;
  }

  /**
   * The world-space delta matrix for this frame, snapping applied.
   *
   * The mode decides which component of the delta is honoured and the rest is
   * dropped — a translate gesture ignores rotation even if the hand rolled,
   * which is what makes a gizmo axis-drag and a pinch behave the same way.
   */
  #deltaMatrix(
    active: ActiveTransform,
    delta: TransformDelta,
  ): { matrix: Mat4; snappedTo?: SnapFeature } {
    switch (active.mode) {
      case 'translate': {
        const snap = this.#snapTranslation(active, delta);
        return snap.feature
          ? { matrix: translationMatrix(snap.offset), snappedTo: snap.feature }
          : { matrix: translationMatrix(snap.offset) };
      }
      case 'rotate': {
        const rotation = snapRotation(delta.rotation, this.#snap.rotationDegrees);
        return { matrix: aboutPivot(trsToMatrix(makeTrs({ rotation })), active.pivot) };
      }
      case 'scale': {
        // Scale is deliberately not snapped. A grid step is a length, and there
        // is no length here to quantize — a factor of 1.37 on a 3mm feature and
        // on a 300mm one are the same number and want different rounding. #9's
        // inspector is where a dimension gets typed exactly.
        return { matrix: aboutPivot(trsToMatrix(makeTrs({ scale: delta.scale })), active.pivot) };
      }
      case 'grab': {
        // Rotation and scale about the pivot first — the point the hand closed
        // on stays put while the solid turns under it — and the translation
        // afterwards, in world space, so snapping still lands the origin on a
        // grid step or a feature rather than somewhere rotated off it.
        const snap = this.#snapTranslation(active, delta);
        const rotation = snapRotation(delta.rotation, this.#snap.rotationDegrees);
        const spin = aboutPivot(
          trsToMatrix(makeTrs({ rotation, scale: delta.scale })),
          active.pivot,
        );
        const matrix = multiplyMatrices(translationMatrix(snap.offset), spin);
        return snap.feature ? { matrix, snappedTo: snap.feature } : { matrix };
      }
    }
  }

  /**
   * The world-space offset to apply, once the grid and nearby features have had
   * their say about where the node's origin should land.
   */
  #snapTranslation(
    active: ActiveTransform,
    delta: TransformDelta,
  ): { offset: Vec3; feature: SnapFeature | null } {
    const wanted = vec3(
      active.startOrigin.x + delta.translation.x,
      active.startOrigin.y + delta.translation.y,
      active.startOrigin.z + delta.translation.z,
    );
    const snap = resolveSnap(wanted, this.#snap, this.#snapField ?? undefined, active.ownFeatures);
    return { offset: subVec3(snap.point, active.startOrigin), feature: snap.feature };
  }
}

/** `T(pivot) · m · T(-pivot)` — apply `m` as if the origin were `pivot`. */
function aboutPivot(matrix: Mat4, pivot: Vec3): Mat4 {
  return multiplyMatrices(
    multiplyMatrices(translationMatrix(pivot), matrix),
    translationMatrix(scaleVec3(pivot, -1)),
  );
}
