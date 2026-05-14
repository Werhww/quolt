import type { Range } from '../types.js';

/** Cross-platform modifier. `mod` = Cmd on Mac, Ctrl elsewhere. */
export type Modifier = 'mod' | 'shift' | 'alt' | 'ctrl' | 'meta';

type Letter =
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j'
  | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't'
  | 'u' | 'v' | 'w' | 'x' | 'y' | 'z';

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';

type FunctionKey =
  | 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6'
  | 'f7' | 'f8' | 'f9' | 'f10' | 'f11' | 'f12';

type NamedKey =
  | 'enter' | 'tab' | 'escape' | 'esc' | 'space'
  | 'backspace' | 'delete' | 'del'
  | 'home' | 'end' | 'pageup' | 'pagedown'
  | 'arrowup' | 'arrowdown' | 'arrowleft' | 'arrowright'
  | 'up' | 'down' | 'left' | 'right';

type PunctKey = '/' | ',' | '.' | ';' | "'" | '[' | ']' | '-' | '=' | '`' | '\\';

export type Key = Letter | Digit | FunctionKey | NamedKey | PunctKey;

/** A typed shortcut combo. Validated by template-literal types at compile time. */
export type KeyCombo =
  | Key
  | `${Modifier}+${Key}`
  | `${Modifier}+${Modifier}+${Key}`
  | `${Modifier}+${Modifier}+${Modifier}+${Key}`;

/** Same as KeyCombo but also accepts arbitrary strings — preserves IDE autocomplete. */
export type AnyKeyCombo = KeyCombo | (string & {});

/**
 * Context predicates — gate the handler on selection state, surrounding text,
 * or active formats. Pass-through to Quill's keyboard module which evaluates
 * these efficiently per keystroke.
 */
export interface ShortcutWhen {
  /** Selection is collapsed (cursor only) vs ranged. */
  collapsed?: boolean;
  /** Selection contains only whitespace / trailing newline. */
  empty?: boolean;
  /** Cursor offset within its line — pin to start (0), end (line.length), etc. */
  offset?: number;
  /** Regex matched against text before the cursor in its line (e.g., /^#$/ for markdown). */
  prefix?: RegExp;
  /** Regex matched against text after the cursor in its line. */
  suffix?: RegExp;
  /** Required active formats — names only, or names → expected values. */
  format?: string[] | Record<string, unknown>;
}

/**
 * Context passed to a shortcut handler at fire time. Reflects the editor state
 * Quill captured before invoking the binding.
 */
export interface ShortcutContext {
  /** Selection range at the moment the key fired. */
  range: Range;
  collapsed: boolean;
  empty: boolean;
  /** Cursor offset within its line. */
  offset: number;
  /** Text before the cursor in the current line. */
  prefix: string;
  /** Text after the cursor in the current line. */
  suffix: string;
  /** Active formats at the cursor. */
  format: Record<string, unknown>;
  /** The raw browser keyboard event. */
  event: KeyboardEvent;
}

/**
 * Handler signature. Return `true` to PROPAGATE to the next matching binding
 * (the keystroke wasn't consumed); return anything else (including undefined)
 * to consume — Quolt will call event.preventDefault().
 */
export type ShortcutHandler = (
  editor: import('../QuoltEditor.js').QuoltEditor,
  ctx: ShortcutContext,
) => boolean | void;

/** A single binding — handler plus optional context predicates. */
export interface ShortcutBinding {
  when?: ShortcutWhen;
  do: ShortcutHandler;
}

/**
 * What you can pass for one combo:
 *   - bare handler — simplest case
 *   - object with `when` predicates and `do` handler — context-aware
 *   - array of bindings — multiple handlers for the same combo with different `when`
 */
export type ShortcutValue =
  | ShortcutHandler
  | ShortcutBinding
  | ShortcutBinding[];

/**
 * Map of combo → value. Use the typed combos for IDE autocomplete; arbitrary
 * strings are still allowed for keys not in the predefined set.
 */
export type ShortcutMap = Partial<Record<KeyCombo, ShortcutValue>> &
  Record<string, ShortcutValue>;

/** Public API exposed on `editor.shortcuts`. */
export interface ShortcutsApi {
  /**
   * Add binding(s) for a combo at runtime. Bindings added this way have LOWER
   * priority than init-time bindings passed via `options.shortcuts` — use the
   * options form when you need to override built-ins.
   */
  bind(combo: AnyKeyCombo, value: ShortcutValue): void;
  /** Remove all Quolt-registered bindings for a combo. Quill's built-ins are untouched. */
  unbind(combo: AnyKeyCombo): void;
  /** Enumerate every Quolt binding currently registered. */
  list(): ReadonlyArray<{
    combo: string;
    displayName: string;
    when?: ShortcutWhen;
  }>;
  /** Platform-aware human-readable form of a combo. `⌘B` on Mac, `Ctrl+B` elsewhere. */
  display(combo: AnyKeyCombo): string;
}
