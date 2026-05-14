<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import {
  Delta,
  QuoltEditor,
  QuoltLinkMenu,
  QuoltToolbar,
  defineComponentEmbed,
  defineEmbed,
  type QuoltEditorCore,
} from 'quolt-vue';

import MentionChip from './MentionChip.vue';

// Default v-model is Delta — the canonical Quolt form.
//
// Quill's Delta convention: inline attributes (bold, italic, link) go on
// the text run; block attributes (header, blockquote, code-block) go on
// the trailing newline. Mixing them — e.g. { header: 1 } on the inline
// text — produces a malformed op that crashes Quill's tree builder on
// mount with "appendChild is not a function".
const content = ref<Delta>(
  new Delta()
    .insert('Designing in the open')
    .insert('\n', { header: 1 })
    .insert('Quolt ships with a clean, framework-agnostic API on top of Quill. The defaults ')
    .insert('just work', { italic: true })
    .insert(' — drop in QuoltEditor and you get a themed editor with light and dark modes. Click ')
    .insert('this link', { link: 'https://quolt.dev' })
    .insert(' to see the floating link menu in action.')
    .insert('\n'),
);

const editorRef = shallowRef<QuoltEditorCore | null>(null);

const theme = ref<'light' | 'dark'>('light');
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
}

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

function insertMention() {
  editorRef.value?.insert.embed('mention', { id: '42', name: 'ada' });
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
      <div class="panel-head">
        <h2>Editor</h2>
        <div class="controls">
          <button class="ghost-btn" @click="insertMention">+ Mention</button>
          <button class="ghost-btn" @click="toggleTheme">
            {{ theme === 'light' ? '🌙 Dark' : '☀️ Light' }}
          </button>
        </div>
      </div>
      <div class="qe-frame" :data-quolt-theme="theme">
        <QuoltToolbar :editor="editorRef" />
        <QuoltEditor
          v-model="content"
          :formats="formats"
          placeholder="Start typing..."
          @ready="onReady"
        />
        <!-- Floating menu — appears when the cursor sits inside a link. -->
        <QuoltLinkMenu :editor="editorRef" />
      </div>
    </section>

    <aside class="panel">
      <h2>Delta (v-model)</h2>
      <pre class="inspect">{{ deltaJson }}</pre>
      <h2 style="margin-top: 18px">HTML (derived)</h2>
      <pre class="inspect">{{ htmlDerived }}</pre>
    </aside>
  </div>
</template>
