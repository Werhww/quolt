<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import {
  Delta,
  QuoltEditor,
  defineComponentEmbed,
  defineEmbed,
  type QuoltEditorCore,
} from 'quolt-vue';

import MentionChip from './MentionChip.vue';

// Default v-model is Delta — the canonical Quolt form.
const content = ref<Delta>(
  new Delta()
    .insert('Welcome to ')
    .insert('Quolt', { bold: true })
    .insert('. Type below to try the editor.\n'),
);

const editorRef = shallowRef<QuoltEditorCore | null>(null);

// Custom embeds — one declarative (divider), one component-backed (mention chip).
const mentionEmbed = defineComponentEmbed<{ id: string; name: string }>({
  name: 'mention',
  inline: true,
  component: MentionChip,
});

const dividerEmbed = defineEmbed<true>({
  name: 'divider',
  inline: false,
  toDOM: () => ({ html: '<hr />' }),
});

const formats = [mentionEmbed, dividerEmbed];

function onReady(editor: QuoltEditorCore) {
  editorRef.value = editor;
}

function bold()      { editorRef.value?.format.bold(); }
function italic()    { editorRef.value?.format.italic(); }
function h1()        { editorRef.value?.format.set('header', 1); }
function h2()        { editorRef.value?.format.set('header', 2); }
function clearFmt()  { editorRef.value?.format.clear(); }
function insertMention() {
  editorRef.value?.insert.embed('mention', { id: '42', name: 'ada' });
}
function insertDivider() {
  editorRef.value?.insert.embed('divider', true);
}
function insertLink() {
  editorRef.value?.insert.link('https://quolt.dev', 'Quolt');
}

const deltaJson = computed(() => JSON.stringify(content.value, null, 2));
const htmlDerived = computed(() => editorRef.value?.content.getHTML() ?? '');
</script>

<template>
  <div class="shell">
    <header>
      <h1>Quolt Playground</h1>
      <p>Live sandbox — v-model is bound to a Delta. HTML on the right is derived.</p>
    </header>

    <section class="panel">
      <h2>Editor</h2>
      <div class="controls">
        <button @click="bold">Bold</button>
        <button @click="italic">Italic</button>
        <button @click="h1">H1</button>
        <button @click="h2">H2</button>
        <button @click="clearFmt">Clear format</button>
        <button @click="insertLink">+ Link</button>
        <button @click="insertMention">+ Mention</button>
        <button @click="insertDivider">+ Divider</button>
      </div>
      <QuoltEditor
        v-model="content"
        :formats="formats"
        placeholder="Start typing..."
        @ready="onReady"
      />
    </section>

    <aside class="panel">
      <h2>Delta (v-model)</h2>
      <pre class="inspect">{{ deltaJson }}</pre>
      <h2 style="margin-top: 18px">HTML (derived)</h2>
      <pre class="inspect">{{ htmlDerived }}</pre>
    </aside>
  </div>
</template>
