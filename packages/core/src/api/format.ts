import type Quill from 'quill';

export interface FormatApi {
  /** Toggle bold on the current selection. */
  bold(): void;
  /** Toggle italic on the current selection. */
  italic(): void;
  /** Toggle underline on the current selection. */
  underline(): void;
  /** Toggle strike on the current selection. */
  strike(): void;
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
