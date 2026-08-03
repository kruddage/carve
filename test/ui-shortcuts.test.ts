/**
 * The keyboard table.
 *
 * Two things are being asserted, and the second is the one that matters.
 *
 * The first is that individual bindings resolve — that Ctrl+Z is undo.
 *
 * The second is that the *table* is well formed: no two bindings claim the same
 * keystroke, `Ctrl+Shift+Z` does not also match `Ctrl+Z`, every `ShortcutId`
 * actually has a binding, and typing in a text field does not trigger the
 * gizmo. Those are properties of the table as a whole, they are what breaks
 * when someone adds a shortcut, and none of them are visible by reading a
 * `switch` statement — which is why the table is data in the first place.
 */

import { describe, expect, it } from 'vitest';

import {
  SHORTCUTS,
  SHORTCUT_IDS,
  formatBinding,
  isTypingTarget,
  resolveShortcut,
  shortcutsByGroup,
  type KeyStroke,
} from '../src/ui/index.js';

/** A keystroke with everything off, so each test only names what it means. */
function stroke(key: string, modifiers: Partial<KeyStroke> = {}): KeyStroke {
  return { key, ...modifiers };
}

describe('resolving a keystroke', () => {
  it('matches a plain key', () => {
    expect(resolveShortcut(stroke('g'))).toBe('mode-translate');
    expect(resolveShortcut(stroke('r'))).toBe('mode-rotate');
    expect(resolveShortcut(stroke('s'))).toBe('mode-scale');
  });

  it('is case-insensitive, because Caps Lock is not a modifier', () => {
    expect(resolveShortcut(stroke('G'))).toBe('mode-translate');
  });

  it('treats Ctrl and Command as the same modifier', () => {
    expect(resolveShortcut(stroke('z', { ctrlKey: true }))).toBe('undo');
    expect(resolveShortcut(stroke('z', { metaKey: true }))).toBe('undo');
  });

  it('matches modifiers exactly, so redo does not shadow undo', () => {
    expect(resolveShortcut(stroke('z', { ctrlKey: true, shiftKey: true }))).toBe('redo');
    expect(resolveShortcut(stroke('z', { ctrlKey: true }))).toBe('undo');
    // A bare Z is neither.
    expect(resolveShortcut(stroke('z'))).toBeNull();
  });

  it('keeps the three S bindings apart', () => {
    expect(resolveShortcut(stroke('s'))).toBe('mode-scale');
    expect(resolveShortcut(stroke('s', { shiftKey: true }))).toBe('boolean-subtract');
    expect(resolveShortcut(stroke('s', { ctrlKey: true }))).toBe('save');
  });

  it('returns null for anything unbound', () => {
    expect(resolveShortcut(stroke('k'))).toBeNull();
    expect(resolveShortcut(stroke('F13'))).toBeNull();
  });
});

describe('keystrokes inside a text field', () => {
  const field = { tagName: 'INPUT' };

  it('does not fire unmodified shortcuts — typing a radius must not move the camera', () => {
    expect(resolveShortcut({ key: '2', target: field })).toBeNull();
    expect(resolveShortcut({ key: 's', target: field })).toBeNull();
  });

  it('still fires shortcuts carrying the platform modifier', () => {
    expect(resolveShortcut({ key: 's', ctrlKey: true, target: field })).toBe('save');
    expect(resolveShortcut({ key: 'z', ctrlKey: true, target: field })).toBe('undo');
  });

  it('still delivers Escape, which is how a half-typed value is abandoned', () => {
    expect(resolveShortcut({ key: 'Escape', target: field })).toBe('cancel');
  });

  it('recognises the elements that take typing', () => {
    expect(isTypingTarget({ tagName: 'INPUT' })).toBe(true);
    expect(isTypingTarget({ tagName: 'textarea' })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'CANVAS' })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
  });
});

describe('the table as a whole', () => {
  it('binds every declared shortcut id', () => {
    const bound = new Set(SHORTCUTS.map((binding) => binding.id));
    expect([...SHORTCUT_IDS].filter((id) => !bound.has(id))).toEqual([]);
  });

  it('never binds one keystroke to two different actions', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const binding of SHORTCUTS) {
      const signature = [
        binding.key.toLowerCase(),
        binding.mod ?? false,
        binding.shift ?? false,
        binding.alt ?? false,
      ].join('|');
      const existing = seen.get(signature);
      // The same id twice is fine and deliberate — Delete and Backspace both
      // delete, Ctrl+Y and Ctrl+Shift+Z both redo. Two *different* ids on one
      // keystroke means the second is unreachable.
      if (existing !== undefined && existing !== binding.id) {
        collisions.push(`${signature}: ${existing} vs ${binding.id}`);
      }
      seen.set(signature, binding.id);
    }
    expect(collisions).toEqual([]);
  });

  it('resolves every binding to itself, so none is shadowed by an earlier one', () => {
    for (const binding of SHORTCUTS) {
      const resolved = resolveShortcut({
        key: binding.key,
        ctrlKey: binding.mod ?? false,
        shiftKey: binding.shift ?? false,
        altKey: binding.alt ?? false,
      });
      expect(resolved, `${binding.key} → ${binding.id}`).toBe(binding.id);
    }
  });

  it('gives every binding a non-empty description, since the help overlay renders it', () => {
    for (const binding of SHORTCUTS) {
      expect(binding.description, binding.id).not.toHaveLength(0);
    }
  });

  it('puts every binding in exactly one rendered group', () => {
    const grouped = shortcutsByGroup().flatMap(([, bindings]) => bindings);
    expect(grouped).toHaveLength(SHORTCUTS.length);
  });
});

describe('how a binding is written', () => {
  it('spells the platform modifier the way the platform does', () => {
    const undo = SHORTCUTS.find((binding) => binding.id === 'undo');
    expect(undo).toBeDefined();
    if (!undo) return;
    expect(formatBinding(undo, 'other')).toBe('Ctrl+Z');
    expect(formatBinding(undo, 'mac')).toBe('⌘Z');
  });

  it('leaves named keys named rather than upper-casing them into nonsense', () => {
    const cancel = SHORTCUTS.find((binding) => binding.id === 'cancel');
    expect(cancel).toBeDefined();
    if (!cancel) return;
    expect(formatBinding(cancel)).toBe('Escape');
  });
});
