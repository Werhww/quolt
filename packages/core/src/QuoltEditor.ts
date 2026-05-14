import Quill from 'quill';
import type { Delta } from 'quill';

import { createContentApi, type ContentApi } from './api/content.js';
import { createFormatApi, type FormatApi } from './api/format.js';
import { createInsertApi, type InsertApi } from './api/insert.js';
import { createSelectionApi, type SelectionApi } from './api/selection.js';
import {
  registerEditor,
  unregisterEditor,
} from './internal.js';
import { getGlobalFormats } from './registry.js';
import type {
  ChangeEvent,
  ChangeHandler,
  QuoltEvent,
  QuoltFormatDefinition,
  QuoltOptions,
  SelectionEvent,
  SelectionHandler,
  Source,
} from './types.js';

type AnyHandler = (event: ChangeEvent | SelectionEvent) => void;

export class QuoltEditor {
  private readonly _quill: Quill;
  private readonly _container: HTMLElement;
  private readonly _wrappers = new Map<AnyHandler, () => void>();

  readonly format: FormatApi;
  readonly insert: InsertApi;
  readonly content: ContentApi;
  readonly selection: SelectionApi;

  constructor(element: HTMLElement, options: QuoltOptions = {}) {
    this._container = element;

    // Register per-editor formats BEFORE construction — Quill snapshots its
    // registry at instance time, so late registration would silently no-op.
    for (const def of options.formats ?? []) {
      assertFormatDefinition(def);
      def.register(Quill);
    }

    const quillTheme = options.quillTheme === undefined ? 'snow' : options.quillTheme;
    this._quill = new Quill(element, {
      theme: quillTheme === false ? undefined : quillTheme,
      placeholder: options.placeholder,
      readOnly: options.readOnly,
      modules: options.modules,
    });

    registerEditor(this._quill.root, this);

    this.format = createFormatApi(this._quill);
    this.insert = createInsertApi(this._quill);
    this.content = createContentApi(this._quill);
    this.selection = createSelectionApi(this._quill);

    const initial = options.initialContent;
    if (typeof initial === 'string') {
      this.content.setHTML(initial);
    } else if (initial && typeof initial === 'object' && 'ops' in initial) {
      this.content.setDelta(initial);
    }

    // Global formats already registered with Quill class — surface them for introspection.
    void getGlobalFormats();
  }

  on(event: 'change', handler: ChangeHandler): void;
  on(event: 'selection', handler: SelectionHandler): void;
  on(event: QuoltEvent, handler: ChangeHandler | SelectionHandler): void {
    const wrapper = wrapHandler(event, handler);
    this._quill.on(quillEvent(event), wrapper as never);
    this._wrappers.set(handler as AnyHandler, () => {
      this._quill.off(quillEvent(event), wrapper as never);
    });
  }

  off(_event: QuoltEvent, handler: ChangeHandler | SelectionHandler): void {
    const undo = this._wrappers.get(handler as AnyHandler);
    if (undo) {
      undo();
      this._wrappers.delete(handler as AnyHandler);
    }
  }

  /** Direct access to the Quill engine. Escape hatch — prefer the Layer 2 API. */
  get quill(): Quill {
    return this._quill;
  }

  /** Root container element passed to the constructor. */
  get container(): HTMLElement {
    return this._container;
  }

  /** Tear down — unregisters the editor and detaches all Quolt event wrappers. */
  destroy(): void {
    for (const undo of this._wrappers.values()) {
      try {
        undo();
      } catch {
        /* swallow */
      }
    }
    this._wrappers.clear();
    unregisterEditor(this._quill.root);
    // Quill has no public destroy() — emptying the container is the documented dance.
    this._quill.disable();
    this._container.innerHTML = '';
  }
}

function quillEvent(event: QuoltEvent): 'text-change' | 'selection-change' {
  return event === 'change' ? 'text-change' : 'selection-change';
}

function wrapHandler(
  event: QuoltEvent,
  handler: ChangeHandler | SelectionHandler,
): unknown {
  if (event === 'change') {
    return (delta: Delta, oldDelta: Delta, source: Source): void => {
      (handler as ChangeHandler)({ delta, oldDelta, source });
    };
  }
  return (
    range: { index: number; length: number } | null,
    oldRange: { index: number; length: number } | null,
    source: Source,
  ): void => {
    (handler as SelectionHandler)({
      range: range ? { index: range.index, length: range.length } : null,
      oldRange: oldRange ? { index: oldRange.index, length: oldRange.length } : null,
      source,
    });
  };
}

function assertFormatDefinition(def: unknown): asserts def is QuoltFormatDefinition {
  if (
    !def ||
    typeof def !== 'object' ||
    (def as { __quolt?: unknown }).__quolt !== 'format-definition'
  ) {
    throw new TypeError(
      'QuoltOptions.formats expects objects produced by defineEmbed / defineMark / defineBlock.',
    );
  }
}
