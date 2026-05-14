import { defineMark } from '../../registry.js';

export const italicMark = defineMark<true>({
  name: 'italic',
  tag: ['em', 'i'],
});
