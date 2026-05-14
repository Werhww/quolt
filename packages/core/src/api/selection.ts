import type Quill from 'quill';

import type { Range } from '../types.js';

export interface SelectionApi {
  /** Current selection range, or null when the editor isn't focused. */
  get(): Range | null;
  /** Set the selection. Focuses the editor as a side effect. */
  set(index: number, length?: number): void;
  /** Move the cursor to a position with zero length. */
  caret(index: number): void;
  /** Select the entire document. */
  all(): void;
  /** Focus the editor without changing the selection. */
  focus(): void;
  /** Blur the editor. */
  blur(): void;
}

export function createSelectionApi(quill: Quill): SelectionApi {
  return {
    get() {
      const range = quill.getSelection();
      return range ? { index: range.index, length: range.length } : null;
    },
    set(index, length = 0) {
      quill.setSelection(index, length, 'user');
    },
    caret(index) {
      quill.setSelection(index, 0, 'user');
    },
    all() {
      quill.setSelection(0, quill.getLength(), 'user');
    },
    focus() {
      quill.focus();
    },
    blur() {
      quill.blur();
    },
  };
}
