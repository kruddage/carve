/**
 * Every keyboard shortcut, in one table.
 *
 * Issue #9 asks for exactly this — "shortcuts live in one table so they can be
 * shown in a help overlay and eventually rebound" — and the table is the
 * feature, not the shortcuts. A `switch` on `event.key` inside a keydown
 * handler works fine and then the help overlay is written by hand, drifts from
 * the handler within a release, and rebinding means rewriting the switch.
 *
 * So: this module owns the bindings and the matcher, and owns *no* behaviour.
 * `resolveShortcut` turns a key event into a `ShortcutId`; what that id does is
 * `app.ts`'s business. That split is what lets the whole table be tested in Node
 * with no DOM — `test/ui-shortcuts.test.ts` drives plain objects through
 * `resolveShortcut` — and it is what a rebinding UI would edit later.
 *
 * ## Matching rules, stated once
 *
 * A binding matches when the key matches case-insensitively **and every
 * modifier matches exactly**. Exactly, not "at least": without that, `Ctrl+Z`
 * and `Ctrl+Shift+Z` are the same binding and redo shadows undo. `mod` means
 * Ctrl on Windows and Linux, Command on macOS, and is matched against
 * `ctrlKey || metaKey` because a table that hardcoded one of them would be
 * wrong on half the platforms this has to run on (#9's last done-when names
 * three browsers, two of which people mostly use on a Mac).
 *
 * Bindings are ordered most-specific-first only in the sense that the first
 * match wins; `assertNoAmbiguousBindings` in the test suite is what keeps that
 * from mattering.
 */

/** What a shortcut asks the app to do. Ids, not functions — see the header. */
export const SHORTCUT_IDS = [
  'undo',
  'redo',
  'delete',
  'frame-selection',
  'frame-all',
  'select-all',
  'deselect',
  'mode-translate',
  'mode-rotate',
  'mode-scale',
  'toggle-space',
  'toggle-snapping',
  'toggle-grid',
  'toggle-stats',
  'toggle-help',
  'view-front',
  'view-top',
  'view-right',
  'view-home',
  'boolean-union',
  'boolean-subtract',
  'boolean-intersect',
  'hide-selection',
  'show-all',
  'save',
  'open',
  'cancel',
] as const;
export type ShortcutId = (typeof SHORTCUT_IDS)[number];

/** Groups exist so the help overlay has sections without a second list to maintain. */
export const SHORTCUT_GROUPS = ['Edit', 'Transform', 'Booleans', 'View', 'File'] as const;
export type ShortcutGroup = (typeof SHORTCUT_GROUPS)[number];

export interface ShortcutBinding {
  readonly id: ShortcutId;
  /** `KeyboardEvent.key`, matched case-insensitively. */
  readonly key: string;
  /** Ctrl on Windows/Linux, Command on macOS. See the header. */
  readonly mod?: boolean;
  readonly shift?: boolean;
  readonly alt?: boolean;
  readonly group: ShortcutGroup;
  /** Help-overlay text. Imperative, because it describes an action. */
  readonly description: string;
}

/**
 * The bindings.
 *
 * `G`/`R`/`S` set the *gizmo* mode rather than starting a modal drag. Both
 * conventions exist — Blender starts a drag, every CAD package switches the
 * gizmo — and this one is picked because #9 asks for on-screen gizmos as the
 * primary transform surface. A modal drag would mean two ways to move a solid
 * with different snapping and different undo shapes, which is the divergence
 * this project keeps refusing everywhere else.
 */
export const SHORTCUTS: readonly ShortcutBinding[] = Object.freeze([
  { id: 'undo', key: 'z', mod: true, group: 'Edit', description: 'Undo the last edit' },
  { id: 'redo', key: 'z', mod: true, shift: true, group: 'Edit', description: 'Redo' },
  { id: 'redo', key: 'y', mod: true, group: 'Edit', description: 'Redo' },
  { id: 'delete', key: 'Delete', group: 'Edit', description: 'Delete the selection' },
  { id: 'delete', key: 'Backspace', group: 'Edit', description: 'Delete the selection' },
  {
    id: 'select-all',
    key: 'a',
    mod: true,
    group: 'Edit',
    description: 'Select every top-level solid',
  },
  { id: 'deselect', key: 'a', alt: true, group: 'Edit', description: 'Clear the selection' },

  { id: 'mode-translate', key: 'g', group: 'Transform', description: 'Translate gizmo' },
  { id: 'mode-rotate', key: 'r', group: 'Transform', description: 'Rotate gizmo' },
  { id: 'mode-scale', key: 's', group: 'Transform', description: 'Scale gizmo' },
  { id: 'toggle-space', key: 'q', group: 'Transform', description: 'World / local space' },
  { id: 'toggle-snapping', key: 'x', group: 'Transform', description: 'Grid and feature snapping' },

  {
    id: 'boolean-union',
    key: 'u',
    shift: true,
    group: 'Booleans',
    description: 'Union the selection',
  },
  {
    id: 'boolean-subtract',
    key: 's',
    shift: true,
    group: 'Booleans',
    description: 'Subtract: the first selected solid is the base',
  },
  {
    id: 'boolean-intersect',
    key: 'i',
    shift: true,
    group: 'Booleans',
    description: 'Intersect the selection',
  },

  { id: 'view-front', key: '1', group: 'View', description: 'Front view' },
  { id: 'view-top', key: '2', group: 'View', description: 'Top view' },
  { id: 'view-right', key: '3', group: 'View', description: 'Right view' },
  { id: 'view-home', key: '4', group: 'View', description: 'Home view' },
  { id: 'frame-selection', key: 'f', group: 'View', description: 'Frame the selection' },
  {
    id: 'frame-all',
    key: 'f',
    shift: true,
    group: 'View',
    description: 'Frame the whole document',
  },
  { id: 'hide-selection', key: 'h', group: 'View', description: 'Hide the selection' },
  { id: 'show-all', key: 'h', alt: true, group: 'View', description: 'Show everything again' },
  { id: 'toggle-grid', key: 'b', group: 'View', description: 'Ground grid' },
  { id: 'toggle-stats', key: 'p', group: 'View', description: 'Performance overlay' },
  { id: 'toggle-help', key: '?', shift: true, group: 'View', description: 'This list' },
  { id: 'cancel', key: 'Escape', group: 'View', description: 'Cancel a drag, or close a panel' },

  { id: 'save', key: 's', mod: true, group: 'File', description: 'Save a .carve file' },
  { id: 'open', key: 'o', mod: true, group: 'File', description: 'Open a .carve file' },
]);

/**
 * The part of a `KeyboardEvent` the matcher reads.
 *
 * Structural, like `PointerSample` in `src/input/pointer.ts` and for the same
 * reason: the test environment is Node with no DOM, and a table nobody can test
 * is a table that is wrong.
 */
export interface KeyStroke {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
  readonly altKey?: boolean;
  /** Where the keystroke landed. See `isTypingTarget`. */
  readonly target?: unknown;
}

/** Does this stroke carry the platform command modifier? */
export function hasMod(stroke: KeyStroke): boolean {
  return stroke.ctrlKey === true || stroke.metaKey === true;
}

/**
 * True when the keystroke belongs to a text field rather than to the app.
 *
 * Without this, typing a radius of `2` into the inspector jumps the camera to
 * the top view and typing a name containing an `s` switches the gizmo to scale.
 * Editing shortcuts that *should* still work inside a field — undo, save —
 * carry the platform modifier and are let through, which is the same rule the
 * browser itself applies.
 */
export function isTypingTarget(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;
  const element = target as { tagName?: unknown; isContentEditable?: unknown };
  if (element.isContentEditable === true) return true;
  const tag = typeof element.tagName === 'string' ? element.tagName.toUpperCase() : '';
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * The shortcut this keystroke triggers, or `null`.
 *
 * Escape is deliberately still delivered from inside a text field: it is how
 * you abandon a half-typed parameter, and the field itself has no other way to
 * hear about it once the app has claimed the keydown.
 */
export function resolveShortcut(
  stroke: KeyStroke,
  bindings: readonly ShortcutBinding[] = SHORTCUTS,
): ShortcutId | null {
  const typing = isTypingTarget(stroke.target);
  for (const binding of bindings) {
    if (binding.key.toLowerCase() !== stroke.key.toLowerCase()) continue;
    if ((binding.mod ?? false) !== hasMod(stroke)) continue;
    if ((binding.shift ?? false) !== (stroke.shiftKey === true)) continue;
    if ((binding.alt ?? false) !== (stroke.altKey === true)) continue;
    if (typing && !(binding.mod ?? false) && binding.key !== 'Escape') continue;
    return binding.id;
  }
  return null;
}

/** How a binding is written in the help overlay: `⇧S`, `Ctrl+Z`. */
export function formatBinding(
  binding: ShortcutBinding,
  platform: 'mac' | 'other' = 'other',
): string {
  const parts: string[] = [];
  if (binding.mod) parts.push(platform === 'mac' ? '⌘' : 'Ctrl');
  if (binding.shift) parts.push(platform === 'mac' ? '⇧' : 'Shift');
  if (binding.alt) parts.push(platform === 'mac' ? '⌥' : 'Alt');
  parts.push(binding.key.length === 1 ? binding.key.toUpperCase() : binding.key);
  return parts.join(platform === 'mac' ? '' : '+');
}

/** The table as the help overlay wants it: grouped, in `SHORTCUT_GROUPS` order. */
export function shortcutsByGroup(
  bindings: readonly ShortcutBinding[] = SHORTCUTS,
): readonly (readonly [ShortcutGroup, readonly ShortcutBinding[]])[] {
  return SHORTCUT_GROUPS.map(
    (group) => [group, bindings.filter((binding) => binding.group === group)] as const,
  ).filter(([, entries]) => entries.length > 0);
}
