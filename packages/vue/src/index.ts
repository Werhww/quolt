export { default as QuoltEditor } from './QuoltEditor.vue';
export { default as QuoltToolbar } from './QuoltToolbar.vue';
export { default as QuoltIcon } from './QuoltIcon.vue';
export { default as QuoltFloatingMenu } from './QuoltFloatingMenu.vue';
export { default as QuoltLinkMenu } from './QuoltLinkMenu.vue';
export { useQuolt } from './useQuolt.js';
export {
  useAnchorResolver,
  useFormatAnchor,
  useEmbedAnchor,
  type AnchorResolver,
} from './floatingAnchors.js';
export { defineComponentEmbed } from './defineComponentEmbed.js';
export { editorInjectionKey } from './injection.js';

export type { DefineComponentEmbedConfig } from './defineComponentEmbed.js';

// Re-export the core surface so consumers can import everything from quolt-vue.
export {
  QuoltEditor as QuoltEditorCore,
  Delta,
  defineEmbed,
  defineMark,
  defineBlock,
  registerGlobalFormat,
} from 'quolt-core';

export type {
  AnyKeyCombo,
  ChangeEvent,
  ChangeHandler,
  ContentApi,
  FormatApi,
  FormatRenderer,
  InsertApi,
  Key,
  KeyCombo,
  Modifier,
  MountedFormat,
  QuoltEvent,
  QuoltFormatDefinition,
  QuoltOptions,
  Range,
  RenderContext,
  SelectionApi,
  SelectionEvent,
  SelectionHandler,
  ShortcutBinding,
  ShortcutContext,
  ShortcutHandler,
  ShortcutMap,
  ShortcutValue,
  ShortcutWhen,
  ShortcutsApi,
  Source,
  DefineBlockConfig,
  DefineEmbedConfig,
  DefineMarkConfig,
  DomSpec,
} from 'quolt-core';

export { displayCombo, isMac, parseCombo } from 'quolt-core';
