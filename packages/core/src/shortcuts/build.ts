import type Quill from 'quill';

import type { QuoltEditor } from '../QuoltEditor.js';
import { displayCombo, parseCombo } from './parse.js';
import type {
  AnyKeyCombo,
  ShortcutBinding,
  ShortcutMap,
  ShortcutValue,
  ShortcutsApi,
  ShortcutWhen,
} from './types.js';

/** Tag attached to every Quill binding we register, so unbind() can find them. */
const QUOLT_BINDING = Symbol.for('quolt:binding');

interface QuoltBindingTag {
  combo: string;
  when?: ShortcutWhen;
}

interface QuillRange {
  index: number;
  length: number;
}

interface QuillContext {
  collapsed: boolean;
  empty: boolean;
  offset: number;
  prefix: string;
  suffix: string;
  format: Record<string, unknown>;
  event: KeyboardEvent;
}

interface QuillBinding {
  key: string;
  shortKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  collapsed?: boolean;
  empty?: boolean;
  offset?: number;
  prefix?: RegExp;
  suffix?: RegExp;
  format?: string[] | Record<string, unknown>;
  handler(this: unknown, range: QuillRange | null, ctx: QuillContext): boolean | void;
  [QUOLT_BINDING]?: QuoltBindingTag;
}

function normalize(value: ShortcutValue): ShortcutBinding[] {
  if (typeof value === 'function') return [{ do: value }];
  if (Array.isArray(value)) return value;
  return [value];
}

function toQuillBinding(
  editor: QuoltEditor,
  combo: AnyKeyCombo,
  binding: ShortcutBinding,
): QuillBinding {
  const parsed = parseCombo(combo);
  const out: QuillBinding = {
    key: parsed.key,
    handler(range, ctx): boolean | void {
      return binding.do(editor, {
        range: range
          ? { index: range.index, length: range.length }
          : { index: 0, length: 0 },
        collapsed: ctx.collapsed,
        empty: ctx.empty,
        offset: ctx.offset,
        prefix: ctx.prefix,
        suffix: ctx.suffix,
        format: ctx.format,
        event: ctx.event,
      });
    },
    [QUOLT_BINDING]: { combo: String(combo), when: binding.when },
  };
  if (parsed.shortKey) out.shortKey = true;
  if (parsed.shiftKey) out.shiftKey = true;
  if (parsed.altKey) out.altKey = true;
  if (parsed.ctrlKey) out.ctrlKey = true;
  if (parsed.metaKey) out.metaKey = true;
  const w = binding.when;
  if (w) {
    if (w.collapsed !== undefined) out.collapsed = w.collapsed;
    if (w.empty !== undefined) out.empty = w.empty;
    if (w.offset !== undefined) out.offset = w.offset;
    if (w.prefix) out.prefix = w.prefix;
    if (w.suffix) out.suffix = w.suffix;
    if (w.format) out.format = w.format;
  }
  return out;
}

/**
 * Convert a Quolt ShortcutMap into the object form Quill expects under
 * `modules.keyboard.bindings`. Keys in the returned object are synthetic
 * unique identifiers — Quill uses them only for dedup; the real combo lives
 * on the binding's `key` field plus modifier flags.
 */
export function buildQuillBindings(
  editor: QuoltEditor,
  map: ShortcutMap,
): Record<string, QuillBinding> {
  const out: Record<string, QuillBinding> = {};
  let counter = 0;
  for (const [combo, value] of Object.entries(map)) {
    if (value === undefined || value === null) continue;
    for (const binding of normalize(value)) {
      const id = `quolt:${combo}:${counter++}`;
      out[id] = toQuillBinding(editor, combo, binding);
    }
  }
  return out;
}

/**
 * Build the editor.shortcuts API. Initial bindings (already passed to Quill
 * via modules.keyboard.bindings) seed the internal tracker so list() and
 * unbind() see them.
 */
export function createShortcutsApi(
  editor: QuoltEditor,
  quill: Quill,
  initialMap: ShortcutMap = {},
): ShortcutsApi {
  // Per-editor record of every Quolt binding currently attached. Drives list()
  // and unbind(); kept in sync with what Quill's keyboard.bindings holds.
  const ours = new Map<string, ShortcutBinding[]>();

  for (const [combo, value] of Object.entries(initialMap)) {
    if (value === undefined || value === null) continue;
    ours.set(String(combo), normalize(value));
  }

  return {
    bind(combo, value) {
      const bindings = normalize(value);
      const key = String(combo);
      const existing = ours.get(key) ?? [];
      ours.set(key, [...existing, ...bindings]);
      const keyboard = quill.keyboard as unknown as {
        addBinding: (b: QuillBinding) => void;
      };
      for (const binding of bindings) {
        keyboard.addBinding(toQuillBinding(editor, combo, binding));
      }
    },

    unbind(combo) {
      const target = String(combo);
      const parsed = parseCombo(combo);
      const keyboard = quill.keyboard as unknown as {
        bindings: Record<string, QuillBinding[] | undefined>;
      };
      const arr = keyboard.bindings[parsed.key];
      if (arr) {
        keyboard.bindings[parsed.key] = arr.filter((b) => {
          const tag = b[QUOLT_BINDING];
          return !(tag && tag.combo === target);
        });
      }
      ours.delete(target);
    },

    list() {
      const result: Array<{ combo: string; displayName: string; when?: ShortcutWhen }> = [];
      for (const [combo, bindings] of ours) {
        for (const b of bindings) {
          result.push({
            combo,
            displayName: displayCombo(combo),
            when: b.when,
          });
        }
      }
      return result;
    },

    display(combo) {
      return displayCombo(combo);
    },
  };
}
