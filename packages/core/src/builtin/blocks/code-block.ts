import { defineBlock } from '../../registry.js';

// Blot name must stay 'code-block' to match Quill's stock format name —
// keyboard handlers, clipboard matchers, and Delta attributes all key on it.
export const codeBlockBlock = defineBlock<true>({
  name: 'code-block',
  tag: 'pre',
});
