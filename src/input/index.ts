/**
 * src/input — input adapters.
 *
 * Pointer/keyboard on desktop, pinch and grab in the headset. Both are
 * adapters: they translate device events into the same commands against the
 * document. Nothing downstream should be able to tell which one produced a
 * transform.
 *
 * Belongs here:
 *   - raw device event handling (pointer, keyboard, XR input sources, hands)
 *   - hit testing and picking against the rendered scene
 *   - gesture recognition and drag state machines
 *   - emitting core commands — this layer's output is commands, not mutations
 *
 * Must NOT appear here:
 *   - direct document mutation. Build a command and dispatch it, so undo/redo
 *     stays whole.
 *   - UI widget markup. A wrist menu's geometry is src/xr/; a DOM inspector
 *     panel is src/ui/. What lives here is the part that turns "the user did
 *     a thing" into "the document should change".
 *
 * ## The shape of it (issue #8)
 *
 * Adapters do not manipulate the scene, and they do not know what a command is.
 * They emit **intents** — `hover`, `select`, `transformBegin/Update/Commit/
 * Cancel`, `action` — into a sink. One `IntentRouter` consumes them and is the
 * only code in this layer that touches `CarveDocument`. Adding a device means
 * writing something that produces intents; it means no change in `src/core/`
 * and none in `src/ui/`, which is #8's second done-when and is asserted by
 * `test/input-adapters.test.ts`, which builds a fictional adapter from scratch.
 *
 * ```
 *   pointer / controller / hand / a replayed fixture
 *                     │  Intent
 *                     ▼
 *              IntentRouter ──► CarveDocument (commands, gestures, undo)
 *                     ▲
 *                     │  PickHit
 *              PickRegistry ◄── evaluated meshes and bounds (#6)
 * ```
 *
 * ## Where to start reading
 *
 *   `intents.ts`       the vocabulary, and why deltas are cumulative
 *   `router.ts`        intents → commands; the only writer in this layer
 *   `pick.ts`          hit testing, and what a click on a boolean means
 *   `snap.ts`          the grid, and other solids' corners and faces
 *   `geometry.ts`      rays, intersections, matrix inverse and decomposition
 *   `pointer.ts`       mouse and touch
 *   `spatial.ts`       any world-space ray source: controllers now, hands (#11)
 *   `xr-controller.ts` the WebXR-specific half of a controller
 *   `record.ts`        recording streams to fixtures, and replaying them
 *
 * Design notes: `docs/input.md`.
 *
 * A worked example — click a solid, drag it, and undo the whole drag:
 *
 * ```ts
 * const router = new IntentRouter({ document: doc });
 * const registry = new PickRegistry();
 * registry.register({ nodeId, worldMatrix: doc.worldMatrix(nodeId), bounds, geometry });
 *
 * const adapter = createPointerAdapter({
 *   emit: (intent) => void router.handle(intent),
 *   camera: () => renderer.camera.pose,
 *   pick: (ray, { drillIn }) => registry.pick(ray, { drillIn, tree: doc }),
 * });
 * adapter.attach(canvas);
 *
 * // …the user drags. Sixty `transform-update` intents later:
 * doc.undoDepth;   // 1 — the gesture coalesced them
 * doc.undo();      // the solid is back where it started
 * ```
 */

export const INPUT_LAYER = 'input';

export {
  CANCEL_REASONS,
  IDENTITY_DELTA,
  INPUT_SOURCES,
  TRANSFORM_MODES,
  action,
  hover,
  isIntent,
  makeDelta,
  select,
  transformBegin,
  transformCancel,
  transformCommit,
  transformUpdate,
  type ActionIntent,
  type ActionRequest,
  type HoverIntent,
  type InputSourceKind,
  type Intent,
  type IntentKind,
  type IntentSink,
  type SelectIntent,
  type TransformBeginIntent,
  type TransformCancelIntent,
  type TransformCancelReason,
  type TransformCommitIntent,
  type TransformDelta,
  type TransformMode,
  type TransformUpdateIntent,
} from './intents.js';

export {
  addVec3,
  centerOf,
  cross,
  decomposeMatrix,
  distance,
  dot,
  intersectAabb,
  intersectPlane,
  intersectTriangle,
  invertMatrix,
  lengthOf,
  makeRay,
  mulVec3,
  normalize,
  pointOnRay,
  rayFromPose,
  rayFromScreenPoint,
  scaleVec3,
  subVec3,
  transformAabb,
  transformDirection,
  transformPoint,
  transformRay,
  translationMatrix,
  type Aabb,
  type Ray,
  type TriangleHit,
  type ViewPose,
} from './geometry.js';

export {
  PickRegistry,
  pickGeometryFromMesh,
  type PickCandidate,
  type PickGeometry,
  type PickHit,
  type PickOptions,
  type PickTarget,
  type PickTree,
} from './pick.js';

export {
  DEFAULT_SNAP_SETTINGS,
  SNAP_FEATURE_KINDS,
  SNAP_OFF,
  SnapField,
  boundsSnapFeatures,
  resolveSnap,
  snapRotation,
  snapToGrid,
  snapValue,
  type SnapFeature,
  type SnapFeatureKind,
  type SnapResult,
  type SnapSettings,
} from './snap.js';

export {
  IntentRouter,
  REJECTION_REASONS,
  type HoverListener,
  type OutcomeListener,
  type RejectionReason,
  type RouterOptions,
  type RouterOutcome,
  type RouterStatus,
} from './router.js';

export {
  createPointerAdapter,
  type PointerAdapter,
  type PointerAdapterOptions,
  type PointerHost,
  type PointerSample,
} from './pointer.js';

export {
  createSpatialAdapter,
  type SpatialAdapter,
  type SpatialAdapterOptions,
  type SpatialSample,
} from './spatial.js';

export {
  SQUEEZE_BUTTON,
  TRIGGER_BUTTON,
  readControllerSample,
  type XrFrameLike,
  type XrGamepadLike,
  type XrInputSourceLike,
  type XrPoseLike,
  type XrQuaternionLike,
  type XrRigidTransformLike,
  type XrSpaceLike,
  type XrVectorLike,
} from './xr-controller.js';

export {
  IntentFormatError,
  IntentRecorder,
  RECORDING_FORMAT_VERSION,
  parseRecording,
  remapNodeIds,
  replay,
  serializeRecording,
  type IntentRecording,
  type RecordedIntent,
  type RecorderOptions,
} from './record.js';
