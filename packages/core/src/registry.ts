import Quill from 'quill';

import {
  clearRendererHandle,
  getRendererHandle,
  lookupEditor,
  setRendererHandle,
} from './internal.js';
import type {
  FormatRenderer,
  QuoltFormatDefinition,
} from './types.js';

/** Spec for a declarative DOM render. Each field is optional. */
export interface DomSpec {
  /** CSS class string applied to the host element. */
  class?: string;
  /** Inline text content. Cleared first. */
  text?: string;
  /** Inline HTML content. Cleared first. Caller must trust the source. */
  html?: string;
  /** Attribute key/value pairs applied verbatim. */
  attrs?: Record<string, string | number | boolean>;
}

export interface DefineEmbedConfig<V> {
  /** Unique format name. Used by editor.insert.embed(name, value). */
  name: string;
  /** Inline embed (default true) behaves like a single character; block embed occupies a full line. */
  inline?: boolean;
  /** Declarative renderer. Used when `render` is not provided. */
  toDOM?: (value: V) => DomSpec;
  /**
   * Imperative renderer with mount/update/destroy lifecycle. Use this for
   * framework-managed content (Vue/React/Svelte components, charts, canvas).
   * Takes precedence over `toDOM` when both are supplied.
   */
  render?: FormatRenderer<V>;
  /**
   * DOM → value. Used when the editor rehydrates from HTML (paste, setHTML).
   * Defaults to reading the `data-quolt-value` attribute as JSON.
   */
  parse?: (node: HTMLElement) => V;
}

/**
 * Register a custom embed format. Embeds are atomic, single-character units —
 * images, mention chips, dividers, math expressions, etc.
 *
 * Returns a definition object you pass to `new QuoltEditor(el, { formats: [...] })`
 * or apply globally via `registerGlobalFormat`.
 */
export function defineEmbed<V>(config: DefineEmbedConfig<V>): QuoltFormatDefinition {
  return {
    __quolt: 'format-definition',
    name: config.name,
    kind: 'embed',
    register(QuillCtor) {
      const path = config.inline === false ? 'blots/block/embed' : 'blots/embed';
      // Parchment blot classes are dynamically extended — the bridge is intentionally untyped.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const BaseEmbed = QuillCtor.import(path) as any;

      const blotName = config.name;
      const tagName = config.inline === false ? 'div' : 'span';
      const isInline = config.inline !== false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class QuoltEmbedBlot extends (BaseEmbed as any) {
        static blotName = blotName;
        static tagName = tagName;

        static create(value: V): HTMLElement {
          const node = document.createElement(tagName);
          node.setAttribute('data-quolt-embed', blotName);
          node.setAttribute('contenteditable', 'false');
          if (isInline) {
            // Inline embeds need an explicit zero-width placeholder for caret placement;
            // Quill's EmbedBlot.create normally does this, but we're building from scratch.
            node.classList.add('quolt-embed', 'quolt-embed-inline');
          } else {
            node.classList.add('quolt-embed', 'quolt-embed-block');
          }

          try {
            node.setAttribute('data-quolt-value', JSON.stringify(value));
          } catch {
            /* unstringifiable value — caller must provide parse() */
          }

          if (config.toDOM && !config.render) {
            applyDomSpec(node, config.toDOM(value));
          }

          return node;
        }

        static value(node: HTMLElement): V | null {
          if (config.parse) return config.parse(node);
          const raw = node.getAttribute('data-quolt-value');
          if (raw == null) return null;
          try {
            return JSON.parse(raw) as V;
          } catch {
            return null;
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructor(scroll: any, domNode: HTMLElement) {
          super(scroll, domNode);
          if (!config.render) return;
          const editor = lookupEditor(scroll?.domNode);
          if (!editor) return;
          const value = QuoltEmbedBlot.value(domNode);
          if (value === null) return;
          const handle = config.render(domNode, value, { editor });
          setRendererHandle(domNode, handle as never);
        }

        remove(): void {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (this as any).domNode as HTMLElement | undefined;
          if (node) {
            const stored = getRendererHandle(node);
            if (stored) {
              try {
                stored.destroy();
              } catch {
                /* renderer destroy must not bubble into Quill */
              }
              clearRendererHandle(node);
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (super.remove as () => void).call(this);
        }
      }

      QuillCtor.register(`formats/${blotName}`, QuoltEmbedBlot as never, true);
    },
  };
}

/**
 * Inline formatting mark — bold/italic-style. STUB: the wrapper class generation
 * is pending; the shape is locked in so consumers can author against it today.
 * Tracked in PLAN.md → "Custom marks".
 */
export interface DefineMarkConfig<V> {
  name: string;
  /** Tag wrapped around the marked range. Defaults to 'span'. */
  tag?: string;
  /** Optional class applied to the wrapping tag. May be a function of the value. */
  class?: string | ((value: V) => string);
  /** Optional inline style derived from the value (e.g., highlight color). */
  style?: (value: V) => Partial<CSSStyleDeclaration>;
}

export function defineMark<V>(config: DefineMarkConfig<V>): QuoltFormatDefinition {
  return {
    __quolt: 'format-definition',
    name: config.name,
    kind: 'mark',
    register() {
      // TODO: build Inline + ClassAttributor / StyleAttributor depending on config shape.
      void config;
    },
  };
}

/**
 * Block-level container — heading, callout, blockquote, toggle, code-block.
 * STUB: full Notion-style chrome (slash menu, drag handles, transforms) lives
 * behind this entry point and is intentionally deferred. The signature is set
 * now so the eventual implementation doesn't require an API rev.
 *
 * See PLAN.md → "Block model".
 */
export interface DefineBlockConfig<V> {
  name: string;
  tag?: string;
  /** Optional renderer for component-backed blocks (callouts, toggle blocks, etc.). */
  render?: FormatRenderer<V>;
  /** Slash-menu metadata — used by the block-chrome module when it ships. */
  slash?: { label: string; icon?: string; aliases?: string[] };
  /** Predicate that turns plain text into this block (e.g., "# foo" → heading). */
  transformFromText?: (text: string) => V | null;
}

export function defineBlock<V>(config: DefineBlockConfig<V>): QuoltFormatDefinition {
  return {
    __quolt: 'format-definition',
    name: config.name,
    kind: 'block',
    register() {
      // TODO: build BlockBlot with attached slash/transform metadata.
      void config;
    },
  };
}

/**
 * Formats registered with the global Quill class — affects every QuoltEditor
 * built after this call. Useful for app-wide formats like 'mention'. Per-editor
 * registration via `new QuoltEditor(el, { formats: [...] })` is also supported.
 */
const globalFormats: QuoltFormatDefinition[] = [];

export function registerGlobalFormat(def: QuoltFormatDefinition): void {
  globalFormats.push(def);
  def.register(Quill);
}

export function getGlobalFormats(): readonly QuoltFormatDefinition[] {
  return globalFormats;
}

function applyDomSpec(node: HTMLElement, spec: DomSpec): void {
  if (spec.class) node.className = spec.class;
  if (spec.text !== undefined) node.textContent = spec.text;
  if (spec.html !== undefined) node.innerHTML = spec.html;
  if (spec.attrs) {
    for (const [k, v] of Object.entries(spec.attrs)) {
      node.setAttribute(k, String(v));
    }
  }
}
