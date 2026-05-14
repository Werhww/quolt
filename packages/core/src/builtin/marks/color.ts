import { defineMark } from '../../registry.js';

export const colorMark = defineMark<string>({
  name: 'color',
  tag: 'span',
  style: (color) => ({ color }),
  parse: (node) => node.style.color || '',
});
