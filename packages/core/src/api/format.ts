import type Quill from 'quill';

import type { HeaderLevel } from '../builtin/blocks/header.js';

export interface FormatApi {
  /** Toggle bold on the current selection. */
  bold(): void;
  /** Toggle italic on the current selection. */
  italic(): void;
  /** Toggle underline on the current selection. */
  underline(): void;
  /** Toggle strike on the current selection. */
  strike(): void;
  /** Apply a heading level (1–6) to the current line. Re-applying the same level clears it. */
  heading(level: HeaderLevel): void;
  /** Toggle blockquote on the current line. */
  blockquote(): void;
  /** Toggle code-block on the current line. */
  codeBlock(): void;
  /** Toggle any boolean-valued format by name. */
  toggle(name: string): void;
  /** Set a format to a specific value on the current selection. */
  set(name: string, value: unknown): void;
  /** Clear a specific format, or every format if no name is given. */
  clear(name?: string): void;
  /** True if the named format is active anywhere in the current selection. */
  has(name: string): boolean;
  /** Map of all formats active in the current selection. */
  current(): Record<string, unknown>;
}

export function createFormatApi(quill: Quill): FormatApi {
  const toggle = (name: string): void => {
    const formats = quill.getFormat() as Record<string, unknown>;
    const isOn = Boolean(formats[name]);
    quill.format(name, !isOn, 'user');
  };

  return {
    bold: () => toggle('bold'),
    italic: () => toggle('italic'),
    underline: () => toggle('underline'),
    strike: () => toggle('strike'),
    heading(level) {
      const current = (quill.getFormat() as Record<string, unknown>)['header'];
      // Re-applying the same level is a clear, matching how other rich-text
      // editors treat heading buttons (and how toggle() works for marks).
      quill.format('header', current === level ? false : level, 'user');
    },
    blockquote: () => toggle('blockquote'),
    codeBlock: () => toggle('code-block'),
    toggle,
    set(name, value) {
      quill.format(name, value, 'user');
    },
    clear(name) {
      const range = quill.getSelection();
      if (!range) return;
      if (name) {
        quill.formatText(range.index, range.length, name, false, 'user');
      } else {
        quill.removeFormat(range.index, range.length, 'user');
      }
    },
    has(name) {
      const formats = quill.getFormat() as Record<string, unknown>;
      return Boolean(formats[name]);
    },
    current() {
      return quill.getFormat() as Record<string, unknown>;
    },
  };
}
