import type Quill from 'quill';
import type { Delta } from 'quill';

import type { ShortcutMap } from './shortcuts/types.js';

export type QuillEngine = Quill;

export type { Delta };

export type Source = 'user' | 'api' | 'silent';

export interface Range {
  index: number;
  length: number;
}

export interface QuoltOptions {
  placeholder?: string;
  readOnly?: boolean;
  /**
   * Initial content. Delta is the canonical form; passing a string treats it as
   * HTML and routes through Quill's clipboard converter.
   */
  initialContent?: Delta | string;
  /**
   * Pass-through to Quill module configuration (toolbar, history, keyboard, etc.).
   * Power-user knob — Quolt will grow opinionated wrappers over time.
   */
  modules?: Record<string, unknown>;
  /**
   * Underlying Quill theme. Defaults to 'snow'. Set to false to use no Quill theme
   * (Quolt themes ship with their own CSS).
   */
  quillTheme?: string | false;
  /** Custom format/embed/block definitions to register before the editor mounts. */
  formats?: QuoltFormatDefinition[];
  /**
   * Keyboard shortcuts. User-provided bindings have higher priority than
   * Quolt's defaults, which have higher priority than Quill's built-ins. Use
   * `editor.shortcuts.bind()` for runtime registration (lower priority).
   */
  shortcuts?: ShortcutMap;
}

/** Opaque marker — every defineX() call returns one of these. */
export interface QuoltFormatDefinition {
  readonly __quolt: 'format-definition';
  readonly name: string;
  readonly kind: 'mark' | 'block' | 'embed';
  /** Internal: called once when the format is being registered with a Quill instance. */
  register(quill: typeof Quill): void;
}

/**
 * Lifecycle handle returned by a format renderer. Quolt invokes update() when the
 * editor wants to mutate the bound value without recreating the DOM, and destroy()
 * before the host blot is removed.
 */
export interface MountedFormat<V = unknown> {
  update(value: V): void;
  destroy(): void;
}

export interface RenderContext {
  editor: import('./QuoltEditor.js').QuoltEditor;
}

export type FormatRenderer<V> = (
  container: HTMLElement,
  value: V,
  ctx: RenderContext,
) => MountedFormat<V>;

export type QuoltEvent = 'change' | 'selection';

export interface ChangeEvent {
  source: Source;
  /** Delta describing this change. */
  delta: Delta;
  /** Document Delta before the change. */
  oldDelta: Delta;
}

export interface SelectionEvent {
  source: Source;
  range: Range | null;
  oldRange: Range | null;
}

export type ChangeHandler = (event: ChangeEvent) => void;
export type SelectionHandler = (event: SelectionEvent) => void;
