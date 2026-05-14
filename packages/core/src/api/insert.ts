import type Quill from 'quill';

export interface InsertApi {
  /** Insert plain text at the current cursor, optionally with inline formats. */
  text(text: string, formats?: Record<string, unknown>): void;
  /** Insert an image embed at the current cursor. */
  image(url: string): void;
  /** Wrap the selection in a link, or insert a link if no selection. */
  link(url: string, text?: string): void;
  /** Insert a custom embed at the current cursor by registered name. */
  embed(name: string, value: unknown): void;
  /** Insert a newline at the current cursor. */
  line(): void;
}

export function createInsertApi(quill: Quill): InsertApi {
  const currentIndex = (): number => quill.getSelection(true)?.index ?? quill.getLength();

  return {
    text(text, formats) {
      const index = currentIndex();
      if (formats) {
        quill.insertText(index, text, formats, 'user');
      } else {
        quill.insertText(index, text, 'user');
      }
      quill.setSelection(index + text.length, 0, 'user');
    },
    image(url) {
      const index = currentIndex();
      quill.insertEmbed(index, 'image', url, 'user');
      quill.setSelection(index + 1, 0, 'user');
    },
    link(url, text) {
      const range = quill.getSelection(true);
      if (range && range.length > 0) {
        quill.format('link', url, 'user');
        return;
      }
      const index = range?.index ?? quill.getLength();
      const label = text ?? url;
      quill.insertText(index, label, { link: url }, 'user');
      quill.setSelection(index + label.length, 0, 'user');
    },
    embed(name, value) {
      const index = currentIndex();
      quill.insertEmbed(index, name, value, 'user');
      quill.setSelection(index + 1, 0, 'user');
    },
    line() {
      const index = currentIndex();
      quill.insertText(index, '\n', 'user');
      quill.setSelection(index + 1, 0, 'user');
    },
  };
}
