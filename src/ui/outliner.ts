/**
 * The outliner panel: `outliner-model.ts`'s rows, as elements.
 *
 * Everything that could be decided without a DOM already was — which rows
 * exist, what they are called, whether a drop is legal and where it lands. What
 * is left here is elements, drag events and click handlers, and that is the
 * intended proportion: the logic worth testing is tested in Node, and this file
 * is the part a browser has to run.
 *
 * ## Rebuilt whole, on every change
 *
 * No diffing, no keyed reconciliation. A CSG tree in v1 is tens of rows, the
 * outliner changes on a click rather than on a frame, and the two things that
 * would actually break under a naive rebuild — an in-progress rename and the
 * scroll position — are both handled explicitly below. Reconciliation here
 * would be a framework's worth of machinery to make a rebuild that costs
 * microseconds cost fewer of them.
 */

import { renameNode, type CarveDocument, type Command, type NodeId } from '../core/index.js';

import { button, clear, el, setClass } from './dom.js';
import {
  buildRows,
  dropCommand,
  planDrop,
  type DropPosition,
  type OutlinerRow,
} from './outliner-model.js';
import type { ViewState } from './view-state.js';

export interface OutlinerOptions {
  readonly document: CarveDocument;
  readonly view: ViewState;
  /** Select `nodeId`, or clear when `null`. `additive` is a ctrl/shift click. */
  readonly onSelect: (nodeId: NodeId | null, additive: boolean) => void;
  /** Everything the outliner does to the tree goes through here, so undo stays whole. */
  readonly onCommand: (command: Command) => void;
}

export interface Outliner {
  readonly element: HTMLElement;
  render(): void;
}

/** How close to a row's edge counts as "between rows" rather than "onto it". */
const EDGE_FRACTION = 0.3;

export function createOutliner(options: OutlinerOptions): Outliner {
  const { document: doc, view } = options;

  const list = el('div', { class: 'carve-outliner-list', attrs: { role: 'tree' } });
  const element = el('section', { class: 'carve-panel carve-outliner' }, [
    el('header', { class: 'carve-panel-header', text: 'Tree' }),
    list,
  ]);

  /** The row being dragged, and the last plan computed for it. */
  let draggingId: NodeId | null = null;
  /** Set while an inline rename is open, so a re-render does not close the field. */
  let renamingId: NodeId | null = null;

  function render(): void {
    const scrollTop = list.scrollTop;
    clear(list);

    const rows = buildRows(doc, view);
    if (rows.length === 0) {
      list.appendChild(
        el('p', {
          class: 'carve-empty',
          text: 'Nothing here yet. Spawn a primitive from the palette above.',
        }),
      );
      return;
    }

    for (const row of rows) list.appendChild(renderRow(row));
    // A drop past the last row means "top level", and without a target there is
    // nowhere to express it. This is that target.
    list.appendChild(rootDropZone());
    list.scrollTop = scrollTop;
  }

  function renderRow(row: OutlinerRow): HTMLElement {
    const node = el('div', {
      class: 'carve-row',
      attrs: { role: 'treeitem', draggable: 'true', 'aria-selected': row.selected },
      dataset: { nodeId: row.nodeId },
    });
    setClass(node, 'is-selected', row.selected);
    setClass(node, 'is-hidden', row.hidden);
    node.style.setProperty('--depth', String(row.depth));

    node.appendChild(
      row.hasChildren
        ? button(row.collapsed ? '▸' : '▾', () => view.toggleCollapsed(row.nodeId), {
            class: 'carve-twisty',
            title: row.collapsed ? 'Expand' : 'Collapse',
          })
        : el('span', { class: 'carve-twisty carve-twisty-empty' }),
    );

    if (row.operandRole) {
      node.appendChild(
        el('span', {
          class: `carve-operand carve-operand-${row.operandRole}`,
          text: row.operandRole === 'base' ? 'base' : 'tool',
          title:
            row.operandRole === 'base'
              ? 'The solid the other operands act on. Drag a row to the top of the boolean to make it the base.'
              : 'Applied to the base, in order.',
        }),
      );
    }

    if (renamingId === row.nodeId) {
      node.appendChild(renameField(row));
    } else {
      node.appendChild(
        el('span', {
          class: 'carve-row-name',
          text: row.name,
          title: row.name,
          on: {
            dblclick: () => {
              renamingId = row.nodeId;
              render();
            },
          },
        }),
      );
    }

    node.appendChild(el('span', { class: 'carve-row-badge', text: row.badge }));
    node.appendChild(
      button(row.hiddenSelf ? '◌' : '●', () => view.toggleHidden(row.nodeId), {
        class: 'carve-eye',
        title: row.hiddenSelf ? 'Show' : 'Hide',
      }),
    );

    node.addEventListener('pointerdown', (event) => {
      // Only a plain press on the row body selects. The twisty and the eye are
      // buttons and stop their own events; a rename field must keep focus.
      if (event.button !== 0) return;
      if (renamingId === row.nodeId) return;
      options.onSelect(row.nodeId, event.shiftKey || event.ctrlKey || event.metaKey);
    });

    wireDragAndDrop(node, row);
    return node;
  }

  function renameField(row: OutlinerRow): HTMLElement {
    const input = el('input', {
      class: 'carve-rename',
      attrs: { type: 'text', value: row.name, 'aria-label': 'Node name' },
    });
    const commit = (): void => {
      renamingId = null;
      const next = input.value.trim();
      if (next.length > 0 && next !== row.name) options.onCommand(renameNode(row.nodeId, next));
      else render();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') commit();
      if (event.key === 'Escape') {
        renamingId = null;
        render();
      }
    });
    // Focus after the element is in the document; appending happens above us.
    queueMicrotask(() => {
      input.focus();
      input.select();
    });
    return input;
  }

  function wireDragAndDrop(node: HTMLElement, row: OutlinerRow): void {
    node.addEventListener('dragstart', (event) => {
      draggingId = row.nodeId;
      node.classList.add('is-dragging');
      // Firefox refuses to start a drag unless something is in the data
      // transfer, whatever it is.
      event.dataTransfer?.setData('text/plain', row.nodeId);
    });

    node.addEventListener('dragend', () => {
      draggingId = null;
      render();
    });

    node.addEventListener('dragover', (event) => {
      if (draggingId === null) return;
      const position = positionWithin(node, event);
      const plan = planDrop(doc, draggingId, row.nodeId, position);
      clearDropMarks(node);
      if (!plan.ok) {
        node.classList.add('is-drop-refused');
        return;
      }
      // Only a legal drop cancels the default, which is what tells the browser
      // to allow a drop here at all — so an illegal position shows the refused
      // outline *and* refuses the drop, with no second check on release.
      event.preventDefault();
      node.classList.add(`is-drop-${position}`);
    });

    node.addEventListener('dragleave', () => clearDropMarks(node));

    node.addEventListener('drop', (event) => {
      event.preventDefault();
      clearDropMarks(node);
      if (draggingId === null) return;
      const plan = planDrop(doc, draggingId, row.nodeId, positionWithin(node, event));
      const command = dropCommand(plan, draggingId);
      draggingId = null;
      if (command) options.onCommand(command);
    });
  }

  function rootDropZone(): HTMLElement {
    const zone = el('div', { class: 'carve-drop-root', text: 'Drop here for top level' });
    zone.addEventListener('dragover', (event) => {
      if (draggingId === null) return;
      if (planDrop(doc, draggingId, doc.rootId, 'root').ok) {
        event.preventDefault();
        zone.classList.add('is-drop-inside');
      }
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-drop-inside'));
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('is-drop-inside');
      if (draggingId === null) return;
      const command = dropCommand(planDrop(doc, draggingId, doc.rootId, 'root'), draggingId);
      draggingId = null;
      if (command) options.onCommand(command);
    });
    return zone;
  }

  /**
   * Top third of a row is "before", bottom third "after", the middle "inside".
   *
   * Thirds rather than halves because "inside" needs a target big enough to hit
   * — reparenting into a boolean is the whole point of the drag — while
   * reordering needs the edges to be reachable without precision aiming.
   */
  function positionWithin(node: HTMLElement, event: DragEvent): DropPosition {
    const rect = node.getBoundingClientRect();
    const fraction = rect.height === 0 ? 0.5 : (event.clientY - rect.top) / rect.height;
    if (fraction < EDGE_FRACTION) return 'before';
    if (fraction > 1 - EDGE_FRACTION) return 'after';
    return 'inside';
  }

  function clearDropMarks(node: HTMLElement): void {
    node.classList.remove('is-drop-before', 'is-drop-after', 'is-drop-inside', 'is-drop-refused');
  }

  // A click on the panel background, outside every row, clears the selection —
  // the same gesture as clicking empty space in the viewport.
  list.addEventListener('pointerdown', (event) => {
    if (event.target === list) options.onSelect(null, false);
  });

  render();
  return { element, render };
}
