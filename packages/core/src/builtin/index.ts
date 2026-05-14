import Quill from 'quill';

import { blockquoteBlock } from './blocks/blockquote.js';
import { codeBlockBlock } from './blocks/code-block.js';
import { headerBlock } from './blocks/header.js';
import { backgroundMark } from './marks/background.js';
import { boldMark } from './marks/bold.js';
import { colorMark } from './marks/color.js';
import { italicMark } from './marks/italic.js';
import { linkMark } from './marks/link.js';
import { strikeMark } from './marks/strike.js';
import { underlineMark } from './marks/underline.js';

let registered = false;

/**
 * Register Quolt's built-in formats with the Quill class. Idempotent — safe to
 * call multiple times. The QuoltEditor constructor invokes this on every
 * instantiation; the flag short-circuits subsequent calls.
 *
 * Built-ins register BEFORE per-editor user formats, so user formats can
 * override built-ins by passing them in `options.formats`.
 */
export function registerBuiltinFormats(): void {
  if (registered) return;
  registered = true;

  // Marks (inline formatting)
  boldMark.register(Quill);
  italicMark.register(Quill);
  underlineMark.register(Quill);
  strikeMark.register(Quill);
  linkMark.register(Quill);
  colorMark.register(Quill);
  backgroundMark.register(Quill);

  // Blocks (line-level formatting)
  headerBlock.register(Quill);
  blockquoteBlock.register(Quill);
  codeBlockBlock.register(Quill);

  // Embeds will land here as their factories complete.
}

export {
  backgroundMark,
  blockquoteBlock,
  boldMark,
  codeBlockBlock,
  colorMark,
  headerBlock,
  italicMark,
  linkMark,
  strikeMark,
  underlineMark,
};

export type { HeaderLevel } from './blocks/header.js';

export { getDefaultShortcuts } from './shortcuts.js';
