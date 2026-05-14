<script setup lang="ts">
import {
  markRaw,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  watch,
  type Ref,
} from 'vue';
import {
  QuoltEditor,
  type ChangeEvent,
  type Delta,
  type QuoltFormatDefinition,
  type SelectionEvent,
} from 'quolt-core';

import { editorInjectionKey } from './injection.js';

const props = withDefaults(
  defineProps<{
    /**
     * Two-way bound document content as a Delta — the canonical Quolt form.
     * Use v-model:html for HTML two-way binding instead.
     */
    modelValue?: Delta;
    /** Optional HTML two-way binding. Bind via v-model:html="..." when you need HTML. */
    html?: string;
    placeholder?: string;
    readOnly?: boolean;
    /** Initial content. Delta is canonical; string is treated as HTML. */
    initialContent?: Delta | string;
    /** Pass-through to Quill module configuration. */
    modules?: Record<string, unknown>;
    /** Custom format definitions (from defineEmbed, defineComponentEmbed, etc.). */
    formats?: QuoltFormatDefinition[];
    /** Underlying Quill theme. Defaults to 'snow'. Use false for no theme. */
    quillTheme?: string | false;
  }>(),
  {
    modelValue: undefined,
    html: undefined,
    placeholder: undefined,
    readOnly: false,
    initialContent: undefined,
    modules: undefined,
    formats: () => [],
    quillTheme: 'snow',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: Delta): void;
  (e: 'update:html', value: string): void;
  (e: 'change', event: ChangeEvent): void;
  (e: 'selection', event: SelectionEvent): void;
  (e: 'ready', editor: QuoltEditor): void;
}>();

const container = ref<HTMLElement | null>(null);
const editorRef: Ref<QuoltEditor | null> = shallowRef(null);

// Flags to break the v-model echo: parent → editor → emit → parent
let ingestingFromModel = false;
let emittingFromEditor = false;

provide(editorInjectionKey, editorRef);

onMounted(() => {
  if (!container.value) return;

  const seed: Delta | string | undefined =
    props.initialContent ?? props.modelValue ?? props.html;

  const editor = new QuoltEditor(container.value, {
    placeholder: props.placeholder,
    readOnly: props.readOnly,
    initialContent: seed,
    modules: props.modules,
    formats: props.formats,
    quillTheme: props.quillTheme,
  });

  editorRef.value = markRaw(editor);

  editor.on('change', (event) => {
    emit('change', event);
    if (ingestingFromModel) return;
    emittingFromEditor = true;
    emit('update:modelValue', editor.content.getDelta());
    emit('update:html', editor.content.getHTML());
    queueMicrotask(() => {
      emittingFromEditor = false;
    });
  });

  editor.on('selection', (event) => {
    emit('selection', event);
  });

  emit('ready', editor);
});

watch(
  () => props.modelValue,
  (next) => {
    if (emittingFromEditor) return;
    const editor = editorRef.value;
    if (!editor || !next) return;
    if (deltaOpsEqual(editor.content.getDelta(), next)) return;
    ingestingFromModel = true;
    editor.content.setDelta(next);
    queueMicrotask(() => {
      ingestingFromModel = false;
    });
  },
);

watch(
  () => props.html,
  (next) => {
    if (emittingFromEditor) return;
    const editor = editorRef.value;
    if (!editor || next === undefined) return;
    if (next === editor.content.getHTML()) return;
    ingestingFromModel = true;
    editor.content.setHTML(next);
    queueMicrotask(() => {
      ingestingFromModel = false;
    });
  },
);

watch(
  () => props.readOnly,
  (next) => {
    const editor = editorRef.value;
    if (!editor) return;
    editor.quill.enable(!next);
  },
);

onBeforeUnmount(() => {
  editorRef.value?.destroy();
  editorRef.value = null;
});

defineExpose({
  getEditor: () => editorRef.value,
  editor: editorRef,
});

function deltaOpsEqual(a: Delta | undefined, b: Delta | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(a.ops) === JSON.stringify(b.ops);
}
</script>

<template>
  <div ref="container" class="quolt-editor" />
</template>
