/**
 * src/core — the document model.
 *
 * The single source of truth for what the user has built: the CSG tree,
 * primitive parameters, transforms, selection, and the command/undo stack.
 * Desktop gizmos and XR hands are two input adapters emitting the same
 * commands against this; a scene built in one opens in the other because both
 * only ever talk to what is in here.
 *
 * Belongs here:
 *   - node/tree data structures and their invariants
 *   - commands, the undo/redo stack, and document mutation
 *   - serialization of the document (the on-disk shape lives with the model)
 *   - pure geometry math used to describe the document (units, transforms)
 *
 * Must NOT appear here:
 *   - imports from src/render/, src/input/, src/ui/ or src/xr/ — enforced by
 *     ESLint, see eslint.config.js and test/import-boundary.test.ts
 *   - three.js, WebGPU/WebGL types, or anything else renderer-shaped
 *   - DOM or WebXR APIs: `document`, `window`, `navigator.xr`, event listeners
 *
 * The test for whether something belongs here is "does it still make sense
 * with no screen attached?" This module must run unchanged under Vitest in
 * Node, in a Web Worker, and on a headset.
 *
 * ## Where to start reading (issue #5)
 *
 *   `nodes.ts`      the four node kinds, and what each one is for
 *   `primitives.ts` what each primitive's parameters are, and the registry
 *   `store.ts`      the tree and its invariants; no undo, no events
 *   `commands.ts`   the only way anything mutates; apply/invert
 *   `history.ts`    the undo stack and the drag-coalescing policy
 *   `document.ts`   the facade everything else talks to
 *   `serialize.ts`  the versioned on-disk shape
 *
 * A worked example — place a box, drag it, undo the whole drag:
 *
 * ```ts
 * const doc = CarveDocument.create();
 * const box = primitiveNode({ primitive: 'box', params: { width: 1, height: 1, depth: 1 } });
 * const placed = placedPrimitive(box, makeTrs({ translation: vec3(0, 0.5, 0) }));
 * doc.dispatch(insertBundle(placed, doc.rootId));
 *
 * const drag = doc.beginGesture('grab');
 * for (const pose of posesThisSecond) drag.dispatch(setTransform(placed.rootId, pose));
 * drag.commit();
 *
 * doc.undo();   // reverses the whole drag, not its last frame
 * ```
 */

export const CORE_LAYER = 'core';

export {
  BOOLEAN_OPS,
  NODE_KINDS,
  PRIMITIVE_KINDS,
  booleanNode,
  childrenOf,
  createNodeId,
  groupNode,
  isContainer,
  primitiveNode,
  transformNode,
  withChildren,
  type BooleanNode,
  type BooleanOp,
  type BooleanSpec,
  type CarveNode,
  type ContainerNode,
  type GroupNode,
  type GroupSpec,
  type NodeBundle,
  type NodeId,
  type NodeKind,
  type PrimitiveKind,
  type PrimitiveNode,
  type PrimitiveSpec,
  type TransformNode,
  type TransformSpec,
} from './nodes.js';

export {
  DEFAULT_TESSELLATION_QUALITY,
  PARAMETER_UNITS,
  PRIMITIVE_REGISTRY,
  TESSELLATION_QUALITIES,
  TESSELLATION_SCALE,
  applyTessellationQuality,
  defaultParameters,
  formatParameter,
  fromDisplayValue,
  getParameterSchema,
  getPrimitive,
  listPrimitives,
  normalizeParameters,
  parametersKey,
  spawnPrimitive,
  toDisplayValue,
  validateParameters,
  type ParameterIssue,
  type ParameterSchema,
  type ParameterUnit,
  type PrimitiveDefinition,
  type PrimitiveIcon,
  type SpawnPrimitiveOptions,
  type TessellationQuality,
  type UnitDisplay,
} from './primitives.js';

export {
  IDENTITY_MATRIX,
  IDENTITY_ROTATION,
  IDENTITY_TRS,
  ORIGIN,
  UNIT_SCALE,
  composeTrs,
  makeTrs,
  multiplyMatrices,
  quat,
  quatConjugate,
  quatMultiply,
  quatNormalize,
  rotateVec3,
  trsEquals,
  trsToMatrix,
  vec3,
  type Mat4,
  type Quat,
  type Trs,
  type Vec3,
} from './math.js';

export { DocumentError, NodeStore } from './store.js';

export {
  CompositeCommand,
  InsertNodeCommand,
  MoveNodeCommand,
  RemoveNodeCommand,
  RenameNodeCommand,
  ReplaceParametersCommand,
  SetBooleanOpCommand,
  SetParametersCommand,
  SetTransformCommand,
  makeBooleanCommand,
  type Command,
} from './commands.js';

export { History, type HistoryEntry, type HistoryMark } from './history.js';

export {
  CarveDocument,
  composite,
  insertBundle,
  insertNode,
  moveNode,
  placedPrimitive,
  removeNode,
  renameNode,
  replaceParameters,
  setBooleanOp,
  setParameters,
  setTransform,
  type ChangeListener,
  type ChangeSource,
  type DocumentChange,
  type DocumentOptions,
  type Gesture,
  type GesturePhase,
  type SelectionListener,
} from './document.js';

export {
  DOCUMENT_FORMAT_VERSION,
  DocumentFormatError,
  MIGRATIONS,
  deserialize,
  deserializeJson,
  migrate,
  serialize,
  type Migration,
  type SerializedDocument,
} from './serialize.js';
