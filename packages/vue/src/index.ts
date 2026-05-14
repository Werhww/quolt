export { default as QuoltEditor } from './QuoltEditor.vue';
export { useQuolt } from './useQuolt.js';
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
  ChangeEvent,
  ChangeHandler,
  ContentApi,
  FormatApi,
  FormatRenderer,
  InsertApi,
  MountedFormat,
  QuoltEvent,
  QuoltFormatDefinition,
  QuoltOptions,
  Range,
  RenderContext,
  SelectionApi,
  SelectionEvent,
  SelectionHandler,
  Source,
  DefineBlockConfig,
  DefineEmbedConfig,
  DefineMarkConfig,
  DomSpec,
} from 'quolt-core';
