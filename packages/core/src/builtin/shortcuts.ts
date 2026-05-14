import type { ShortcutMap } from '../shortcuts/types.js';

/**
 * Quolt's default keyboard bindings. Registered first in `modules.keyboard.bindings`,
 * which gives them higher priority than Quill's built-in defaults — Quolt's
 * handlers run first and Quill's only fire if Quolt's return `true` (propagate).
 *
 * User shortcuts passed via `options.shortcuts` register BEFORE these defaults
 * (object insertion order), so user bindings override Quolt's, which override Quill's.
 */
export function getDefaultShortcuts(): ShortcutMap {
  return {
    // Inline format toggles
    'mod+b': (editor) => {
      editor.format.bold();
    },
    'mod+i': (editor) => {
      editor.format.italic();
    },
    'mod+u': (editor) => {
      editor.format.underline();
    },
    'mod+shift+s': (editor) => {
      editor.format.toggle('strike');
    },

    // Headings: mod+alt+1..6 set; mod+alt+0 clears.
    'mod+alt+0': (editor) => {
      editor.format.set('header', false);
    },
    'mod+alt+1': (editor) => {
      editor.format.set('header', 1);
    },
    'mod+alt+2': (editor) => {
      editor.format.set('header', 2);
    },
    'mod+alt+3': (editor) => {
      editor.format.set('header', 3);
    },
    'mod+alt+4': (editor) => {
      editor.format.set('header', 4);
    },
    'mod+alt+5': (editor) => {
      editor.format.set('header', 5);
    },
    'mod+alt+6': (editor) => {
      editor.format.set('header', 6);
    },

    // Misc
    'mod+\\': (editor) => {
      editor.format.clear();
    },
  };
}
