import type { AnyKeyCombo } from './types.js';

/** Result of parsing a combo string into Quill's binding shape. */
export interface ParsedKey {
  key: string;
  shortKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

const NAMED: Record<string, string> = {
  enter: 'Enter',
  tab: 'Tab',
  escape: 'Escape',
  esc: 'Escape',
  space: ' ',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

const MODIFIER_SET = new Set(['mod', 'shift', 'alt', 'ctrl', 'meta']);

/**
 * Parse a combo string like 'mod+shift+h' into Quill's binding shape.
 * Throws if the combo is empty or has no key.
 */
export function parseCombo(combo: AnyKeyCombo): ParsedKey {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);
  const key = parts.pop();
  if (!key) {
    throw new Error(`Invalid shortcut combo: "${combo}"`);
  }
  for (const p of parts) {
    if (!MODIFIER_SET.has(p)) {
      throw new Error(
        `Invalid modifier "${p}" in shortcut "${combo}". Expected one of: mod, shift, alt, ctrl, meta.`,
      );
    }
  }
  return {
    key: normalizeKey(key),
    shortKey: parts.includes('mod'),
    shiftKey: parts.includes('shift'),
    altKey: parts.includes('alt'),
    ctrlKey: parts.includes('ctrl'),
    metaKey: parts.includes('meta'),
  };
}

function normalizeKey(key: string): string {
  const named = NAMED[key];
  if (named !== undefined) return named;
  if (/^f\d{1,2}$/.test(key)) return key.toUpperCase();
  // Single chars (letters, digits, punctuation) pass through as-is — Quill's
  // matcher compares against KeyboardEvent.key which is lowercase for unshifted
  // letters.
  return key;
}

const IS_MAC: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent ?? '';
  const platform =
    (navigator as unknown as { platform?: string }).platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(ua) || /mac/i.test(platform);
})();

export function isMac(): boolean {
  return IS_MAC;
}

const DISPLAY_MOD: Record<string, { mac: string; other: string }> = {
  mod: { mac: '⌘', other: 'Ctrl' },
  shift: { mac: '⇧', other: 'Shift' },
  alt: { mac: '⌥', other: 'Alt' },
  ctrl: { mac: '⌃', other: 'Ctrl' },
  meta: { mac: '⌘', other: 'Meta' },
};

const DISPLAY_NAMED: Record<string, string> = {
  enter: '↵',
  tab: '⇥',
  escape: 'Esc',
  esc: 'Esc',
  space: 'Space',
  backspace: '⌫',
  delete: '⌦',
  del: '⌦',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

/** Format a combo for display in toolbars / help modals. */
export function displayCombo(combo: AnyKeyCombo): string {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((s) => s.trim())
    .filter(Boolean);
  const key = parts.pop();
  if (!key) return '';
  const platform = IS_MAC ? 'mac' : 'other';

  const modSymbols = parts.map((m) => {
    const d = DISPLAY_MOD[m];
    return d ? d[platform] : m;
  });

  const keySymbol =
    DISPLAY_NAMED[key] ??
    (key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1));

  if (IS_MAC) {
    // Mac convention — symbols concatenated with no separator.
    return modSymbols.join('') + keySymbol;
  }
  return [...modSymbols, keySymbol].join('+');
}
