/**
 * The keyboard help panel.
 *
 * Rendered from `SHORTCUTS`, which is the whole reason that table exists as
 * data: a help overlay written by hand is a help overlay that is wrong within a
 * release, and there is no way to notice. Here, an added binding shows up with
 * no edit to this file, and a removed one disappears.
 *
 * The camera controls are listed alongside even though they are not keyboard
 * bindings, because "how do I orbit" is the first question anyone has and the
 * answer lives in `viewport.ts` rather than in the shortcut table.
 */

import { clear, el } from './dom.js';
import { formatBinding, shortcutsByGroup } from './shortcuts.js';

export interface HelpOverlay {
  readonly element: HTMLElement;
  setVisible(visible: boolean): void;
}

/** Mouse gestures the shortcut table cannot describe. See the header. */
const POINTER_HELP: readonly (readonly [string, string])[] = [
  ['Left drag', 'Move the solid under the cursor, or drag a gizmo handle'],
  ['Left click', 'Select. Shift or Ctrl adds; Alt drills into a boolean'],
  ['Right drag', 'Orbit'],
  ['Middle drag', 'Pan'],
  ['Wheel', 'Zoom'],
  ['Drag a row', 'Reparent or reorder in the tree'],
  ['Drag a number', 'Scrub the value; one undo entry for the whole drag'],
];

export function createHelpOverlay(onClose: () => void): HelpOverlay {
  const body = el('div', { class: 'carve-help-body' });
  const panel = el(
    'div',
    { class: 'carve-help-panel', attrs: { role: 'dialog', 'aria-label': 'Keyboard shortcuts' } },
    [
      el('header', { class: 'carve-panel-header' }, [
        el('span', { text: 'Shortcuts' }),
        el('button', {
          class: 'carve-tool',
          text: 'Close',
          attrs: { type: 'button' },
          on: { click: () => onClose() },
        }),
      ]),
      body,
    ],
  );

  const element = el('div', { class: 'carve-help' }, [panel]);
  element.hidden = true;
  // Clicking the scrim closes; clicking the panel must not.
  element.addEventListener('pointerdown', (event) => {
    if (event.target === element) onClose();
  });

  const platform: 'mac' | 'other' =
    typeof navigator !== 'undefined' && /mac/i.test(navigator.platform ?? '') ? 'mac' : 'other';

  function render(): void {
    clear(body);
    for (const [group, bindings] of shortcutsByGroup()) {
      const rows = bindings.map((binding) =>
        el('div', { class: 'carve-help-row' }, [
          el('kbd', { text: formatBinding(binding, platform) }),
          el('span', { text: binding.description }),
        ]),
      );
      body.appendChild(
        el('section', { class: 'carve-help-group' }, [el('h4', { text: group }), ...rows]),
      );
    }

    body.appendChild(
      el('section', { class: 'carve-help-group' }, [
        el('h4', { text: 'Pointer' }),
        ...POINTER_HELP.map(([gesture, description]) =>
          el('div', { class: 'carve-help-row' }, [
            el('kbd', { text: gesture }),
            el('span', { text: description }),
          ]),
        ),
      ]),
    );
  }

  render();

  return {
    element,
    setVisible(visible: boolean): void {
      element.hidden = !visible;
    },
  };
}
