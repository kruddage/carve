/**
 * The top bar: the primitive palette, the boolean operations, the transform
 * mode, the standard views, and the file menu.
 *
 * Two rules shape this file, and both are #9's.
 *
 * **No hardcoded primitive list.** The palette enumerates `listPrimitives()`
 * and reads each entry's label, description and icon out of the registry. Add a
 * seventh primitive to `src/core/primitives.ts` and it appears here with no
 * change to this file — which is what `test/primitives.test.ts` fails the build
 * over, by reading the source of every file in `src/`.
 *
 * **One command path.** Every button here emits the same `action` intent the
 * wrist menu (#12) will emit, through the same `IntentRouter`. There is no
 * "toolbar version" of applying a boolean. The router already refuses the cases
 * that need refusing — fewer than two operands, nothing selected, a gesture
 * open — and returns a reason, so the bar can disable a button instead of
 * offering one that fails.
 */

import {
  BOOLEAN_OPS,
  listPrimitives,
  type BooleanOp,
  type CarveDocument,
  type PrimitiveKind,
} from '../core/index.js';
import { STANDARD_VIEWS, type StandardView } from '../render/index.js';

import { button, el, setClass, svgIcon } from './dom.js';
import { GIZMO_MODES, type GizmoMode, type ViewState } from './view-state.js';

export interface ToolbarActions {
  readonly spawn: (kind: PrimitiveKind) => void;
  readonly applyBoolean: (op: BooleanOp) => void;
  readonly undo: () => void;
  readonly redo: () => void;
  readonly deleteSelection: () => void;
  readonly setView: (view: StandardView) => void;
  readonly frameSelection: () => void;
  readonly newDocument: () => void;
  readonly open: () => void;
  readonly save: () => void;
  readonly exportAs: (format: 'stl' | 'glb') => void;
  readonly toggleHelp: () => void;
}

export interface ToolbarOptions {
  readonly document: CarveDocument;
  readonly view: ViewState;
  readonly actions: ToolbarActions;
}

export interface Toolbar {
  readonly element: HTMLElement;
  /** Re-evaluate what is enabled and what is pressed. Called on any change. */
  render(): void;
}

const BOOLEAN_LABELS: Readonly<Record<BooleanOp, string>> = Object.freeze({
  union: 'Union',
  subtract: 'Subtract',
  intersect: 'Intersect',
});

const BOOLEAN_HINTS: Readonly<Record<BooleanOp, string>> = Object.freeze({
  union: 'Fuse the selected solids into one.',
  subtract: 'Cut every later selected solid out of the first one.',
  intersect: 'Keep only what all the selected solids share.',
});

const MODE_LABELS: Readonly<Record<GizmoMode, string>> = Object.freeze({
  translate: 'Move',
  rotate: 'Rotate',
  scale: 'Scale',
});

const VIEW_LABELS: Readonly<Record<StandardView, string>> = Object.freeze({
  front: 'Front',
  top: 'Top',
  right: 'Right',
  home: 'Home',
});

export function createToolbar(options: ToolbarOptions): Toolbar {
  const { document: doc, view, actions } = options;

  const booleanButtons = new Map<BooleanOp, HTMLButtonElement>();
  const modeButtons = new Map<GizmoMode, HTMLButtonElement>();
  const toggles: { node: HTMLButtonElement; on: () => boolean }[] = [];
  let undoButton: HTMLButtonElement | null = null;
  let redoButton: HTMLButtonElement | null = null;
  let deleteButton: HTMLButtonElement | null = null;

  function group(title: string, children: readonly HTMLElement[]): HTMLElement {
    return el('div', { class: 'carve-toolgroup', attrs: { 'aria-label': title } }, [
      el('span', { class: 'carve-toolgroup-label', text: title }),
      el('div', { class: 'carve-toolgroup-body' }, children),
    ]);
  }

  function toggle(
    label: string,
    title: string,
    on: () => boolean,
    onClick: () => void,
  ): HTMLButtonElement {
    const node = button(label, onClick, { class: 'carve-tool carve-toggle', title });
    node.setAttribute('aria-pressed', String(on()));
    toggles.push({ node, on });
    return node;
  }

  // --- Palette --------------------------------------------------------------

  const palette = listPrimitives().map((definition) => {
    const node = button(definition.label, () => actions.spawn(definition.kind), {
      class: 'carve-tool carve-primitive',
      title: definition.description,
    });
    // Icon before the text: `button()` set the label as the only child.
    node.insertBefore(svgIcon(definition.icon), node.firstChild);
    return node;
  });

  // --- Booleans -------------------------------------------------------------

  const booleans = BOOLEAN_OPS.map((op) => {
    const node = button(BOOLEAN_LABELS[op], () => actions.applyBoolean(op), {
      class: 'carve-tool',
      title: BOOLEAN_HINTS[op],
    });
    booleanButtons.set(op, node);
    return node;
  });

  // --- Transform ------------------------------------------------------------

  const modes = GIZMO_MODES.map((mode) => {
    const node = button(MODE_LABELS[mode], () => view.setGizmoMode(mode), {
      class: 'carve-tool carve-toggle',
      title: `${MODE_LABELS[mode]} gizmo`,
    });
    modeButtons.set(mode, node);
    return node;
  });

  const spaceToggle = toggle(
    'Local',
    'World or local axes. Scale is always world-aligned — see the docs.',
    () => view.space === 'local',
    () => view.toggleSpace(),
  );
  const snapToggle = toggle(
    'Snap',
    'Snap to the 1mm grid and to nearby corners, edges and faces.',
    () => view.snapping,
    () => view.setSnapping(!view.snapping),
  );
  const gridToggle = toggle(
    'Grid',
    'Ground grid',
    () => view.showGrid,
    () => view.setShowGrid(!view.showGrid),
  );
  const statsToggle = toggle(
    'Stats',
    'Frame time, triangles and evaluation queue depth',
    () => view.showStats,
    () => view.setShowStats(!view.showStats),
  );

  // --- Edit, views and file -------------------------------------------------

  undoButton = button('Undo', actions.undo, { class: 'carve-tool', title: 'Undo' });
  redoButton = button('Redo', actions.redo, { class: 'carve-tool', title: 'Redo' });
  deleteButton = button('Delete', actions.deleteSelection, {
    class: 'carve-tool',
    title: 'Delete the selection',
  });

  const views = [
    ...STANDARD_VIEWS.map((standard) =>
      button(VIEW_LABELS[standard], () => actions.setView(standard), {
        class: 'carve-tool',
        title: `${VIEW_LABELS[standard]} view`,
      }),
    ),
    button('Frame', actions.frameSelection, {
      class: 'carve-tool',
      title: 'Frame the selection, or the whole document when nothing is selected',
    }),
  ];

  const file = [
    button('New', actions.newDocument, { class: 'carve-tool', title: 'Start an empty document' }),
    button('Open', actions.open, { class: 'carve-tool', title: 'Open a .carve file' }),
    button('Save', actions.save, { class: 'carve-tool', title: 'Download a .carve file' }),
    button('STL', () => actions.exportAs('stl'), {
      class: 'carve-tool',
      title: 'Export the selection, or the whole document, as binary STL in millimetres',
    }),
    button('GLB', () => actions.exportAs('glb'), {
      class: 'carve-tool',
      title: 'Export as glTF binary',
    }),
    button('?', actions.toggleHelp, { class: 'carve-tool', title: 'Keyboard shortcuts' }),
  ];

  const element = el('header', { class: 'carve-toolbar' }, [
    el('span', { class: 'carve-brand', text: 'Carve' }),
    group('Primitives', palette),
    group('Booleans', booleans),
    group('Transform', [...modes, spaceToggle, snapToggle]),
    group('Edit', [undoButton, redoButton, deleteButton]),
    group('View', [...views, gridToggle, statsToggle]),
    group('File', file),
  ]);

  function render(): void {
    const selection = doc.selection;
    if (undoButton) undoButton.disabled = !doc.canUndo;
    if (redoButton) redoButton.disabled = !doc.canRedo;
    if (deleteButton) deleteButton.disabled = selection.length === 0;

    // A boolean needs two operands. Disabling rather than letting the router
    // reject keeps the failure out of the status line for something the user
    // could see was unavailable.
    for (const node of booleanButtons.values()) node.disabled = selection.length < 2;

    for (const [mode, node] of modeButtons) {
      const active = view.gizmoMode === mode;
      node.setAttribute('aria-pressed', String(active));
      setClass(node, 'is-active', active);
    }
    for (const entry of toggles) {
      const active = entry.on();
      entry.node.setAttribute('aria-pressed', String(active));
      setClass(entry.node, 'is-active', active);
    }
  }

  render();
  return { element, render };
}
