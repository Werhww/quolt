import type Quill from 'quill';
import type { Delta } from 'quill';

export interface ContentApi {
  /** Get the document as a Delta — the canonical Quolt content form. */
  getDelta(): Delta;
  /** Replace the document with a Delta. */
  setDelta(delta: Delta): void;
  /** Serialize the current document to HTML. */
  getHTML(): string;
  /** Replace the document with parsed HTML via Quill's clipboard converter. */
  setHTML(html: string): void;
  /** Get the plain-text representation of the document. */
  getText(): string;
  /** Number of characters in the document, including the trailing newline. */
  length(): number;
  /** Clear the document. */
  clear(): void;
  /** True when the document is empty (only the trailing newline remains). */
  isEmpty(): boolean;
}

export function createContentApi(quill: Quill): ContentApi {
  return {
    getDelta() {
      return quill.getContents();
    },
    setDelta(delta) {
      quill.setContents(delta, 'api');
    },
    getHTML() {
      return quill.root.innerHTML;
    },
    setHTML(html) {
      const delta = quill.clipboard.convert({ html });
      quill.setContents(delta, 'api');
    },
    getText() {
      return quill.getText();
    },
    length() {
      return quill.getLength();
    },
    clear() {
      quill.setText('', 'api');
    },
    isEmpty() {
      return quill.getLength() <= 1;
    },
  };
}
