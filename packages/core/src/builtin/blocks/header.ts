import { defineBlock } from '../../registry.js';

export type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export const headerBlock = defineBlock<HeaderLevel>({
  name: 'header',
  tag: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  // PLAN.md uses the short form `quolt-h1` rather than the systematic
  // `quolt-header-1` for headings. The theme package selects on these.
  class: (level) => `quolt-h${level}`,
});
