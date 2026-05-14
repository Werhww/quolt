import { defineMark } from '../../registry.js';

export const boldMark = defineMark<true>({
  name: 'bold',
  tag: ['strong', 'b'],
});
