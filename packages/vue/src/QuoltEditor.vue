<script setup lang="ts">
import {
  markRaw,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  shallowRef,
  toRaw,
  watch,
  type Ref,
} from 'vue';
import {
  Delta as DeltaCtor,
  QuoltEditor,
  type ChangeEvent,
  type Delta,
  type QuoltFormatDefinition,
  type SelectionEvent,
} from 'quolt-core';

// Vue 3's `ref(deltaInstance)` deeply proxies the Delta, including the inner
// `ops` array and each op object. Quill's `new Delta(delta)` then copies
// `delta.ops` by reference — the proxied array ends up inside Quill's
// internals and Parchment's clone path eventually trips over a property
// access that doesn't survive the Proxy ("after2.appendChild is not a
// function"). We rebuild the Delta from a structured clone of its ops so
// Quill only ever sees plain objects.
function unwrapDelta(value: unknown): Delta | undefined {
  if (!value || typeof value !== 'object' || !('ops' in value)) return undefined;
  const raw = toRaw(value as Delta);
  const rawOps = toRaw(raw.ops) as readonly unknown[];
  const cleanOps = rawOps.map((op) => {
    const rawOp = toRaw(op) as Record<string, unknown>;
    const out: Record<string, unknown> = { ...rawOp };
    if (rawOp.attributes) out.attributes = { ...toRaw(rawOp.attributes) as object };
    return out;
  });
  return new DeltaCtor(cleanOps);
}

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

  const rawInitial =
    props.initialContent && typeof props.initialContent === 'object' && 'ops' in props.initialContent
      ? unwrapDelta(props.initialContent)
      : props.initialContent;
  const rawModel = unwrapDelta(props.modelValue);
  const seed: Delta | string | undefined =
    rawInitial ?? rawModel ?? props.html;

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
    const clean = unwrapDelta(next);
    if (!clean) return;
    if (deltaOpsEqual(editor.content.getDelta(), clean)) return;
    ingestingFromModel = true;
    editor.content.setDelta(clean);
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
