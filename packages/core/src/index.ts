export { QuoltEditor } from './QuoltEditor.js';

// Delta is re-exported as both value (class — `new Delta()`) and type.
export { Delta } from 'quill';

export type {
  ChangeEvent,
  ChangeHandler,
  FormatRenderer,
  MountedFormat,
  QuoltEvent,
  QuoltFormatDefinition,
  QuoltOptions,
  Range,
  RenderContext,
  SelectionEvent,
  SelectionHandler,
  Source,
} from './types.js';

export type { FormatApi } from './api/format.js';
export type { HeaderLevel } from './builtin/blocks/header.js';
export type { InsertApi } from './api/insert.js';
export type { ContentApi } from './api/content.js';
export type { SelectionApi } from './api/selection.js';

export { displayCombo, isMac, parseCombo } from './shortcuts/index.js';
export type {
  AnyKeyCombo,
  Key,
  KeyCombo,
  Modifier,
  ShortcutBinding,
  ShortcutContext,
  ShortcutHandler,
  ShortcutMap,
  ShortcutValue,
  ShortcutWhen,
  ShortcutsApi,
} from './shortcuts/index.js';

export {
  defineEmbed,
  defineBlock,
  defineMark,
  registerGlobalFormat,
} from './registry.js';

export type {
  DefineBlockConfig,
  DefineEmbedConfig,
  DefineMarkConfig,
  DomSpec,
} from './registry.js';
