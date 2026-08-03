/**
 * src/ui — the desktop DOM interface.
 *
 * The CSG tree outliner, parameter inspector, toolbar and dialogs — everything
 * that is HTML around the canvas. This is the desktop half of the two
 * frontends; the in-headset half is src/xr/.
 *
 * Belongs here:
 *   - DOM construction, CSS, and DOM event wiring
 *   - views that subscribe to document changes and re-render
 *   - dispatching core commands in response to clicks
 *
 * Must NOT appear here:
 *   - anything the headset also needs. If both frontends need it, it belongs
 *     in src/core/ or src/render/, not duplicated here and in src/xr/.
 *   - business logic: validation of a parameter value is the document model's
 *     job, so it is enforced identically for a wrist menu and a text field.
 *   - direct document mutation — dispatch commands.
 *
 * ## The shape of it (issue #9)
 *
 * Every module here is one of two kinds, and the split is deliberate:
 *
 *   - **Models** are pure functions of the document plus view state: what rows
 *     the outliner has, whether a drop is legal, what a parameter field
 *     contains, where a gizmo handle is, which shortcut a keystroke fires.
 *     These contain no DOM at all and are tested in Node — which is the only
 *     reason "reparenting is undoable" and "an axis drag moves along its axis"
 *     are assertions rather than hopes, since Vitest runs with
 *     `environment: 'node'` and there is no jsdom anywhere in this project.
 *   - **Views** turn a model into elements and wire events back. They are thin
 *     on purpose. Anything in a view worth testing is in the wrong file.
 *
 * ```
 *   view-state ─┐
 *   document  ──┼─► outliner-model ──► outliner
 *               ├─► inspector-model ─► inspector
 *               ├─► scene-bounds ────► viewport ──► render (canvas)
 *               ├─► gizmo-drag ──────┘
 *               └─► shortcuts ───────► app
 * ```
 *
 * ## Where to start reading
 *
 *   `view-state.ts`      what the UI remembers that the document must not
 *   `outliner-model.ts`  rows, operand order, and whether a drop is legal
 *   `inspector-model.ts` fields from `ParameterSchema`; validate vs normalize
 *   `scene-bounds.ts`    what is clickable, and where the bounds come from
 *   `scene-bundle.ts`    hiding a node, without touching the document
 *   `gizmo-drag.ts`      handle hit tests, and drag → `TransformDelta`
 *   `shortcuts.ts`       the one keyboard table
 *   `load.ts`            opening a file into the document already on screen
 *   `viewport.ts`        the canvas: camera, picking, gizmo, ghost, frame loop
 *   `app.ts`             the composition root
 *
 * Design notes: `docs/desktop-ui.md`.
 *
 * A worked example — the whole app, as `main.ts` builds it:
 *
 * ```ts
 * import { spawnKernel } from './kernel/spawn.js';
 * import { mountApp } from './ui/index.js';
 *
 * mountApp({ host: appRoot, kernel: spawnKernel() });
 * ```
 *
 * `styles.css` is deliberately not imported from here. `main.ts` imports it, so
 * that anything pulling on this barrel — a test, or #12 reusing a model — does
 * not drag a stylesheet through a bundler that has no reason to want one.
 */

export const UI_LAYER = 'ui';

export { mountApp, type AppOptions, type CarveApp } from './app.js';

export {
  GIZMO_MODES,
  TRANSFORM_SPACES,
  ViewState,
  transformModeOf,
  type GizmoMode,
  type TransformSpace,
  type ViewStateListener,
  type ViewStateSnapshot,
} from './view-state.js';

export {
  DROP_REFUSALS,
  badgeFor,
  buildRows,
  dropCommand,
  planDrop,
  topLevelIds,
  type DropPlan,
  type DropPosition,
  type DropRefusal,
  type OperandRole,
  type OutlinerRow,
} from './outliner-model.js';

export {
  commitValue,
  dragValue,
  eulerFromQuat,
  inspectPrimitive,
  inspectTransform,
  parseFieldInput,
  primitiveUnder,
  quatFromEuler,
  type FieldInput,
  type ParameterField,
  type PrimitiveInspection,
  type TransformField,
  type TransformInspection,
} from './inspector-model.js';

export {
  PrimitiveBoundsCache,
  boundsChannel,
  buildPickTargets,
  buildSnapField,
  documentBounds,
  localBounds,
  localMatrixOf,
  unionAabb,
  worldBounds,
  type PreviewRequester,
  type PrimitiveBoundsLookup,
  type SceneTargetOptions,
} from './scene-bounds.js';

export { visibleBundle } from './scene-bundle.js';

export {
  axisAngle,
  beginGizmoDrag,
  closestPointOnLine,
  deltaFor,
  gizmoFrame,
  pickGizmoHandle,
  screenScale,
  worldAxis,
  type GizmoDrag,
  type GizmoFrame,
} from './gizmo-drag.js';

export {
  SHORTCUTS,
  SHORTCUT_GROUPS,
  SHORTCUT_IDS,
  formatBinding,
  hasMod,
  isTypingTarget,
  resolveShortcut,
  shortcutsByGroup,
  type KeyStroke,
  type ShortcutBinding,
  type ShortcutGroup,
  type ShortcutId,
} from './shortcuts.js';

export { loadCommand, loadInto } from './load.js';

export { createViewport, type Viewport, type ViewportOptions } from './viewport.js';
