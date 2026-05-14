# Getting started

Quolt is a modern, open-source rich text editor built on top of Quill.js. You get a beautiful, themeable editor out of the box plus a clean API for deep customization — without learning Quill's internals.

> **Project status:** very early. The Layer 2 API is taking shape; Layer 3 components ship with the Vue package today.

## Install

::: code-group
```bash [pnpm]
pnpm add quolt-vue vue
```

```bash [npm]
npm install quolt-vue vue
```

```bash [yarn]
yarn add quolt-vue vue
```
:::

`quolt-vue` re-exports everything from `quolt-core`, so you only need one package install for Vue projects.

## Mount the editor

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Delta, QuoltEditor } from 'quolt-vue';
import 'quill/dist/quill.snow.css';

// v-model is bound to a Delta — Quolt's canonical content form.
const content = ref<Delta>(
  new Delta().insert('Hello, ').insert('world', { bold: true }).insert('.\n'),
);
</script>

<template>
  <QuoltEditor v-model="content" placeholder="Start typing..." />
</template>
```

That's a complete working editor — two-way bound to a Delta, with Quill's default Snow toolbar.

### Why Delta and not HTML?

Delta is Quill's native, lossless content format. It preserves intent (a heading is a heading, not just `<h1>`), survives format round-trips, and composes cleanly with collaborative-edit operations. HTML is a serialization target — useful for display, lossy as storage.

### If you really want HTML two-way binding

```vue
<QuoltEditor v-model:html="html" />
```

`v-model:html` is the opt-in HTML binding. You can use both at once if you need them — Quolt emits updates to whichever you've subscribed to.

## Reach the underlying API

The editor instance is exposed via the `ready` event or the component's exposed ref:

```vue
<script setup lang="ts">
import { shallowRef } from 'vue';
import { QuoltEditor, type QuoltEditor as QuoltEditorClass } from 'quolt-vue';

const editor = shallowRef<QuoltEditorClass | null>(null);
function onReady(instance: QuoltEditorClass) {
  editor.value = instance;
}
</script>

<template>
  <QuoltEditor @ready="onReady" />
  <button @click="editor?.format.bold()">Bold</button>
</template>
```

Or use the `useQuolt()` composable inside any child of `<QuoltEditor>`:

```ts
import { useQuolt } from 'quolt-vue';
const editor = useQuolt();  // Ref<QuoltEditor | null>
```

## Next

- [Custom formats](/guide/custom-formats) — declarative embeds, marks, blocks.
- [Component embeds](/guide/component-embeds) — Vue components as blots.
