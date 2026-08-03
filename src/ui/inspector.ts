/**
 * The inspector panel: parameters and placement for the selected node.
 *
 * Fields are built from `inspector-model.ts`, which builds them from the
 * registry. Nothing here knows what a torus is.
 *
 * ## Numeric fields drag, and a drag is one undo entry
 *
 * #9 asks for draggable numeric fields with live re-evaluation, and that is a
 * gesture in exactly the sense `CarveDocument.beginGesture` means: a stream of
 * `setParameters` at pointer rate that has to coalesce into one history entry.
 * So a drag opens a gesture through the router-free path — parameter edits are
 * not intents, since there is no headset gesture that produces them — and
 * commits it on release. The document's merge policy does the rest.
 *
 * Releasing dispatches `commitValue`, which normalizes; the drag itself
 * dispatches `dragValue`, which only clamps. `inspector-model.ts` explains why
 * those must be two different things.
 */

import {
  PARAMETER_UNITS,
  fromDisplayValue,
  setTransform,
  type CarveDocument,
  type Command,
  type Gesture,
  type NodeId,
  type PrimitiveNode,
  type Trs,
} from '../core/index.js';

import { clear, el } from './dom.js';
import {
  commitValue,
  dragValue,
  eulerFromQuat,
  inspectPrimitive,
  inspectTransform,
  parseFieldInput,
  primitiveUnder,
  quatFromEuler,
  type ParameterField,
} from './inspector-model.js';

export interface InspectorOptions {
  readonly document: CarveDocument;
  readonly onCommand: (command: Command) => void;
  /** Open a coalescing gesture for a field drag. Returns `null` if one is already open. */
  readonly beginGesture: (name: string) => Gesture | null;
}

export interface Inspector {
  readonly element: HTMLElement;
  render(): void;
}

/** Pixels of horizontal drag per step. Slower than 1:1, which overshoots badly on a 1mm step. */
const PIXELS_PER_STEP = 4;

export function createInspector(options: InspectorOptions): Inspector {
  const { document: doc } = options;
  const body = el('div', { class: 'carve-inspector-body' });
  const element = el('section', { class: 'carve-panel carve-inspector' }, [
    el('header', { class: 'carve-panel-header', text: 'Inspector' }),
    body,
  ]);

  function render(): void {
    clear(body);
    const selection = doc.selection;
    const nodeId = selection[selection.length - 1];

    if (nodeId === undefined) {
      body.appendChild(el('p', { class: 'carve-empty', text: 'Select a solid to edit it.' }));
      return;
    }
    if (selection.length > 1) {
      body.appendChild(
        el('p', {
          class: 'carve-note',
          text: `${selection.length} selected — editing the last one.`,
        }),
      );
    }

    const node = doc.get(nodeId);
    if (!node) return;

    body.appendChild(el('h3', { class: 'carve-section-title', text: node.name }));

    if (node.kind === 'boolean') {
      body.appendChild(
        el('p', {
          class: 'carve-note',
          text: `A ${node.op} of ${doc.childrenOf(nodeId).length} operands. Reorder them in the tree; the first is the base.`,
        }),
      );
    }

    const transformNodeId = node.kind === 'transform' ? nodeId : null;
    if (transformNodeId !== null && node.kind === 'transform') {
      body.appendChild(renderTransform(transformNodeId, node.transform));
    }

    const primitive = primitiveUnder(doc, nodeId);
    if (primitive) body.appendChild(renderPrimitive(primitive));
  }

  // --- Primitive parameters -------------------------------------------------

  function renderPrimitive(node: PrimitiveNode): HTMLElement {
    const inspection = inspectPrimitive(node);
    const section = el('div', { class: 'carve-section' }, [
      el('h4', {
        class: 'carve-section-title',
        text: inspection.primitiveLabel,
        title: inspection.description,
      }),
    ]);

    for (const field of inspection.dimensions) section.appendChild(parameterRow(node, field));

    if (inspection.tessellation.length > 0) {
      // Grouped apart because these change triangle count, not shape — #9 asks
      // for the separation and #25's schema is what marks them.
      section.appendChild(
        el('h4', { class: 'carve-section-title carve-subtle', text: 'Tessellation' }),
      );
      for (const field of inspection.tessellation) section.appendChild(parameterRow(node, field));
    }

    for (const issue of inspection.otherIssues) {
      section.appendChild(el('p', { class: 'carve-issue', text: issue }));
    }

    return section;
  }

  function parameterRow(node: PrimitiveNode, field: ParameterField): HTMLElement {
    const input = numericInput(field.display, field.decimals, field.suffix);
    const row = el('label', { class: 'carve-field', title: field.schema.description }, [
      el('span', { class: 'carve-field-label', text: field.schema.label }),
      input,
    ]);
    if (field.issue) {
      row.classList.add('is-invalid');
      row.appendChild(el('span', { class: 'carve-issue', text: field.issue }));
    }

    wireDrag(input, {
      step: field.displayStep,
      onDrag: (display, gesture) =>
        gesture.dispatch(dragValue(node, field.schema, fromDisplayValue(field.schema, display))),
      onCommit: (display) =>
        options.onCommand(
          commitValue(node, field.schema.key, fromDisplayValue(field.schema, display)),
        ),
      label: field.schema.label,
    });

    input.addEventListener('change', () => {
      const parsed = parseFieldInput(field.schema, input.value);
      if (!parsed.ok) {
        // Put the last good value back rather than leaving the field holding
        // text the document does not have. The red outline is for values that
        // are numbers and out of range; this is text that is not a number.
        input.value = formatNumber(field.display, field.decimals);
        return;
      }
      options.onCommand(commitValue(node, field.schema.key, parsed.value));
    });

    return row;
  }

  // --- Placement ------------------------------------------------------------

  function renderTransform(nodeId: NodeId, transform: Trs): HTMLElement {
    const inspection = inspectTransform(nodeId, transform);
    const section = el('div', { class: 'carve-section' }, [
      el('h4', { class: 'carve-section-title', text: 'Placement' }),
    ]);

    const groups = [
      { title: 'Position', fields: inspection.translation, part: 'translation' as const },
      { title: 'Rotation', fields: inspection.rotationDegrees, part: 'rotation' as const },
      { title: 'Scale', fields: inspection.scale, part: 'scale' as const },
    ];

    for (const group of groups) {
      const row = el('div', { class: 'carve-vector' }, [
        el('span', { class: 'carve-field-label', text: group.title }),
      ]);
      for (const field of group.fields) {
        const input = numericInput(field.display, field.decimals, field.suffix);
        input.setAttribute('aria-label', `${group.title} ${field.axis.toUpperCase()}`);
        const write = (display: number, dispatch: (command: Command) => void): void => {
          dispatch(
            setTransform(
              nodeId,
              withComponent(currentTransform(nodeId, transform), group.part, field.axis, display),
            ),
          );
        };
        wireDrag(input, {
          step: field.step,
          label: `${group.title} ${field.axis}`,
          onDrag: (display, gesture) => write(display, (command) => gesture.dispatch(command)),
          onCommit: (display) => write(display, options.onCommand),
        });
        input.addEventListener('change', () => {
          const parsed = Number(input.value.replace(field.suffix, '').trim());
          if (!Number.isFinite(parsed)) {
            input.value = formatNumber(field.display, field.decimals);
            return;
          }
          write(parsed, options.onCommand);
        });
        row.appendChild(
          el('span', { class: `carve-axis carve-axis-${field.axis}` }, [
            el('span', { class: 'carve-axis-label', text: field.axis.toUpperCase() }),
            input,
          ]),
        );
      }
      section.appendChild(row);
    }

    return section;
  }

  /** Re-read the node, because a drag has moved on since `render` captured it. */
  function currentTransform(nodeId: NodeId, fallback: Trs): Trs {
    const node = doc.get(nodeId);
    return node?.kind === 'transform' ? node.transform : fallback;
  }

  // --- Field mechanics ------------------------------------------------------

  function numericInput(value: number, decimals: number, suffix: string): HTMLInputElement {
    const input = el('input', {
      class: 'carve-number',
      // `text` rather than `number`: a number input's spinner steals the drag,
      // and its locale parsing disagrees with ours about the suffix.
      attrs: { type: 'text', inputmode: 'decimal', spellcheck: 'false' },
      ...(suffix.length > 0 ? { title: `In ${suffix}` } : {}),
    });
    input.value = formatNumber(value, decimals);
    return input;
  }

  interface DragOptions {
    readonly step: number;
    readonly label: string;
    readonly onDrag: (display: number, gesture: Gesture) => void;
    readonly onCommit: (display: number) => void;
  }

  /**
   * Turn horizontal dragging on a field into a live edit.
   *
   * The gesture opens on the *first movement*, not on the press: a press that
   * turns out to be a click is how a user focuses the field to type in it, and
   * an empty gesture opened and closed around it would block undo for its
   * duration — the same reasoning `src/input/pointer.ts` gives for not emitting
   * `transformBegin` on press.
   */
  function wireDrag(input: HTMLInputElement, drag: DragOptions): void {
    let origin: { x: number; value: number; pointerId: number } | null = null;
    let gesture: Gesture | null = null;

    input.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const start = Number(input.value.replace(/[^\d.eE+-]/g, ''));
      if (!Number.isFinite(start)) return;
      origin = { x: event.clientX, value: start, pointerId: event.pointerId };
    });

    input.addEventListener('pointermove', (event) => {
      if (!origin) return;
      const moved = event.clientX - origin.x;
      if (!gesture) {
        if (Math.abs(moved) < PIXELS_PER_STEP) return;
        gesture = options.beginGesture(drag.label);
        if (!gesture) {
          origin = null;
          return;
        }
        input.setPointerCapture(origin.pointerId);
      }
      const next = origin.value + Math.round(moved / PIXELS_PER_STEP) * drag.step;
      input.value = formatNumber(next, decimalsFor(drag.step));
      drag.onDrag(next, gesture);
    });

    const finish = (event: PointerEvent): void => {
      const state = origin;
      origin = null;
      if (!state || !gesture) return;
      const active = gesture;
      gesture = null;
      input.releasePointerCapture(state.pointerId);
      // Commit the gesture first, then dispatch the normalized value as its own
      // entry: dispatching into a closed gesture throws, and normalizing inside
      // it would put a clamp in the middle of the coalesced drag.
      active.commit();
      const moved = event.clientX - state.x;
      drag.onCommit(state.value + Math.round(moved / PIXELS_PER_STEP) * drag.step);
    };

    input.addEventListener('pointerup', finish);
    input.addEventListener('pointercancel', () => {
      origin = null;
      gesture?.cancel();
      gesture = null;
    });
  }

  render();
  return { element, render };
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

/** Decimals implied by a step: a step of 0.01 wants two, a step of 1 wants none. */
function decimalsFor(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 2;
  return Math.min(4, Math.max(0, Math.ceil(-Math.log10(step))));
}

/**
 * A TRS with one component of one part replaced, converting from display units.
 *
 * The two conversions here divide by `PARAMETER_UNITS`, never by a literal
 * 1000 or 180/π. #9 is explicit that UI code must not hardcode the authoring
 * unit, and a transform field is exactly where it would otherwise creep in —
 * these numbers are not registry parameters, so they have no `ParameterSchema`
 * of their own to hand to `fromDisplayValue`.
 *
 * Rotation goes through Euler degrees, which is lossy in the way
 * `inspectTransform` documents — and is what the field has to be, since nobody
 * types a quaternion.
 */
function withComponent(
  transform: Trs,
  part: 'translation' | 'rotation' | 'scale',
  axis: 'x' | 'y' | 'z',
  display: number,
): Trs {
  if (part === 'translation') {
    const metres = display / PARAMETER_UNITS.length.perCanonical;
    return { ...transform, translation: { ...transform.translation, [axis]: metres } };
  }
  if (part === 'scale') {
    // Scale is a ratio and has no unit; it is the one field shown as stored.
    return { ...transform, scale: { ...transform.scale, [axis]: display } };
  }
  const euler = eulerFromQuat(transform.rotation);
  return {
    ...transform,
    rotation: quatFromEuler({
      ...euler,
      [axis]: display / PARAMETER_UNITS.angle.perCanonical,
    }),
  };
}
