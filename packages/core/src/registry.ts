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
 * Inline formatting mark — bold/italic-style.
 *
 * Three behaviors composed in one signature:
 *   - Boolean marks (V = true): just wrap selection in `tag`.
 *   - Attribute marks: `attrs(value)` returns key/value pairs applied to the tag (e.g., link href).
 *   - Style marks: `style(value)` returns CSS properties applied to the tag (e.g., color).
 *
 * `parse(node)` extracts the value from the DOM during paste / setHTML; defaults
 * to `true` for boolean marks. Provide it for any non-boolean V.
 */
export interface DefineMarkConfig<V> {
  name: string;
  /**
   * Tag wrapped around the marked range. Defaults to 'span'. Pass an array to
   * accept multiple tags during HTML parsing (e.g., ['strong', 'b'] for bold).
   * The first entry is used when creating new blots programmatically.
   */
  tag?: string | string[];
  /** Attributes computed from the value (e.g., link → href). */
  attrs?: (value: V) => Record<string, string>;
  /** Class applied to the wrapping tag. May be a function of the value. */
  class?: string | ((value: V) => string);
  /** Inline style derived from the value (e.g., highlight color). */
  style?: (value: V) => Partial<CSSStyleDeclaration>;
  /** DOM → value. Required for non-boolean marks. */
  parse?: (node: HTMLElement) => V;
}

export function defineMark<V>(config: DefineMarkConfig<V>): QuoltFormatDefinition {
  return {
    __quolt: 'format-definition',
    name: config.name,
    kind: 'mark',
    register(QuillCtor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Inline = QuillCtor.import('blots/inline') as any;
      const blotName = config.name;
      const tagName: string | string[] = Array.isArray(config.tag)
        ? config.tag.map((t) => t.toUpperCase())
        : (config.tag ?? 'span').toUpperCase();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class QuoltMarkBlot extends (Inline as any) {
        static blotName = blotName;
        static tagName = tagName;

        static create(value: V): HTMLElement {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const node = (super.create as (v: unknown) => HTMLElement).call(this, value);
          applyMarkConfig(node, value, config);
          return node;
        }

        static formats(node: HTMLElement): V | true {
          if (config.parse) return config.parse(node);
          return true;
        }

        // Re-apply config when the format is set on an existing blot (e.g., changing
        // a link's URL). For boolean marks this is a no-op.
        format(name: string, value: unknown): void {
          if (name === blotName && value !== false && value != null) {
            applyMarkConfig(this.domNode as HTMLElement, value as V, config);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (Inline.prototype.format as (n: string, v: unknown) => void).call(this, name, value);
          }
        }
      }

      QuillCtor.register(`formats/${blotName}`, QuoltMarkBlot as never, true);
    },
  };
}

function applyMarkConfig<V>(
  node: HTMLElement,
  value: V,
  config: DefineMarkConfig<V>,
): void {
  if (config.attrs) {
    const attrs = config.attrs(value);
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v);
    }
  }
  if (config.class) {
    const cls = typeof config.class === 'function' ? config.class(value) : config.class;
    if (cls) node.classList.add(...cls.split(/\s+/).filter(Boolean));
  }
  if (config.style) {
    const style = config.style(value);
    for (const [k, v] of Object.entries(style)) {
      if (v !== undefined && v !== null) {
        // CSSStyleDeclaration indexer accepts kebab via setProperty; for camelCase
        // we go through the property assignment path.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (node.style as any)[k] = v;
      }
    }
  }
}

/**
 * Block-level container — heading, blockquote, code-block, callout.
 *
 * Two shapes:
 *   - Single-tag blocks (V = true): blockquote, code-block. One tag, one class.
 *   - Variant blocks (V = number): heading. `tag` is an array of tags;
 *     value is the 1-based index (value 1 → tag[0], value 2 → tag[1], …).
 *
 * For variant blocks, the default class adds a `-${value}` suffix
 * (e.g. `quolt-header quolt-header-1`); pass a custom `class` function
 * to override (PLAN.md uses `quolt-h1` for headings — see builtin/blocks).
 *
 * Slash menu and transformFromText metadata are accepted now but only consumed
 * once the optional block-UX modules ship (see PLAN.md → "Optional modules").
 */
export interface DefineBlockConfig<V> {
  name: string;
  /**
   * Block tag. Single string for plain blocks ('blockquote', 'pre'); array for
   * variant blocks where value selects the tag (e.g. ['h1','h2','h3','h4','h5','h6']).
   * Defaults to 'p'.
   */
  tag?: string | string[];
  /** Class applied to the block element. Function form receives the current value. */
  class?: string | ((value: V) => string);
  /** Optional renderer for component-backed blocks. Not yet implemented. */
  render?: FormatRenderer<V>;
  /** Slash-menu metadata — consumed by the block-chrome module when it ships. */
  slash?: { label: string; icon?: string; aliases?: string[] };
  /** Predicate that turns plain text into this block (e.g., "# foo" → heading). */
  transformFromText?: (text: string) => V | null;
}

export function defineBlock<V>(config: DefineBlockConfig<V>): QuoltFormatDefinition {
  return {
    __quolt: 'format-definition',
    name: config.name,
    kind: 'block',
    register(QuillCtor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Block = QuillCtor.import('blots/block') as any;
      const blotName = config.name;
      const tagSpec = config.tag ?? 'p';
      const isVariant = Array.isArray(tagSpec);
      const tagArray: string[] | null = isVariant
        ? tagSpec.map((t) => t.toUpperCase())
        : null;
      const singleTag: string | null = isVariant
        ? null
        : (tagSpec as string).toUpperCase();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      class QuoltBlockBlot extends (Block as any) {
        static blotName = blotName;
        static tagName = tagArray ?? singleTag!;

        static create(value: V): HTMLElement {
          let node: HTMLElement;
          if (tagArray) {
            const idx = (typeof value === 'number' ? value : 1) - 1;
            const tag = tagArray[Math.max(0, Math.min(tagArray.length - 1, idx))]!;
            node = document.createElement(tag);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node = (super.create as (v: unknown) => HTMLElement).call(this, value);
          }
          applyBlockClass(node, value, config, blotName, tagArray);
          return node;
        }

        static formats(node: HTMLElement): V | true {
          if (tagArray) {
            const idx = tagArray.indexOf(node.tagName);
            return (idx + 1) as V;
          }
          return true;
        }

        format(name: string, value: unknown): void {
          if (name === blotName && tagArray && typeof value === 'number') {
            // Variant block (e.g. header): the tag itself differs by value
            // (H1 vs H2 vs H3 …). Element tags are immutable once created, so
            // Quill's Editor.formatLine path requires us to swap the blot via
            // replaceWith — which routes through our static create() and
            // builds a fresh element with the correct tag and class.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).replaceWith(blotName, value);
            return;
          }
          if (name === blotName && value !== false && value != null) {
            // Same blot, same shape — idempotent class re-apply for safety.
            applyBlockClass(
              this.domNode as HTMLElement,
              value as V,
              config,
              blotName,
              tagArray,
            );
            return;
          }
          // Different format name, or clearing (value=false) — defer to
          // Parchment's default block-format machinery.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (Block.prototype.format as (n: string, v: unknown) => void).call(
            this,
            name,
            value,
          );
        }
      }

      QuillCtor.register(`formats/${blotName}`, QuoltBlockBlot as never, true);
    },
  };
}

function applyBlockClass<V>(
  node: HTMLElement,
  value: V,
  config: DefineBlockConfig<V>,
  blotName: string,
  tagArray: string[] | null,
): void {
  // Strip any prior quolt-${blotName}* classes so variant changes don't leave
  // stale ones behind when Parchment swaps the inner element in place.
  const prefix = `quolt-${blotName}`;
  for (const cls of Array.from(node.classList)) {
    if (cls === prefix || cls.startsWith(`${prefix}-`)) {
      node.classList.remove(cls);
    }
  }

  let cls: string;
  if (config.class) {
    cls = typeof config.class === 'function' ? config.class(value) : config.class;
  } else if (tagArray) {
    cls = `${prefix} ${prefix}-${String(value)}`;
  } else {
    cls = prefix;
  }
  if (cls) node.classList.add(...cls.split(/\s+/).filter(Boolean));
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
