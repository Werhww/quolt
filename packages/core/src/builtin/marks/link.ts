import { defineMark } from '../../registry.js';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

export function sanitizeUrl(raw: string): string {
  if (!raw) return 'about:blank';
  const trimmed = raw.trim();
  // Relative paths and anchors pass through.
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }
  // Match protocol-prefixed URLs.
  const colon = trimmed.indexOf(':');
  if (colon === -1) {
    // No protocol — treat as relative.
    return trimmed;
  }
  const proto = trimmed.slice(0, colon + 1).toLowerCase();
  if (ALLOWED_PROTOCOLS.includes(proto)) {
    return trimmed;
  }
  return 'about:blank';
}

export const linkMark = defineMark<string>({
  name: 'link',
  tag: 'a',
  attrs: (url) => ({
    href: sanitizeUrl(url),
    rel: 'noopener noreferrer',
    target: '_blank',
  }),
  parse: (node) => node.getAttribute('href') ?? '',
});
