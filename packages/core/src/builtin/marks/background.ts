import { defineMark } from '../../registry.js';

export const backgroundMark = defineMark<string>({
  name: 'background',
  tag: 'span',
  style: (color) => ({ backgroundColor: color }),
  parse: (node) => node.style.backgroundColor || '',
});
