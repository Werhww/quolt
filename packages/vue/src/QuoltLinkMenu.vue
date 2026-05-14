<script setup lang="ts">
import { computed, type Ref } from 'vue';
import type { QuoltEditor } from 'quolt-core';

import QuoltFloatingMenu from './QuoltFloatingMenu.vue';
import { useFormatAnchor } from './floatingAnchors.js';
import { useQuolt } from './useQuolt.js';

/**
 * Built-in floating menu for the `link` mark. Appears whenever the cursor
 * sits inside a link in the editor; shows the URL plus edit + remove
 * controls.
 *
 * This is also the reference example for custom menus: a user-supplied
 * mark or embed mirrors this shape with `useFormatAnchor('myFormat')` or
 * `useEmbedAnchor('myEmbed')` plus a `<QuoltFloatingMenu>` wrapper.
 */
const props = defineProps<{
  /** Editor instance. Falls back to useQuolt() when omitted. */
  editor?: QuoltEditor | null;
}>();

const injected = useQuolt();
const editorRef: Ref<QuoltEditor | null> = computed(
  () => props.editor ?? injected.value,
) as Ref<QuoltEditor | null>;

const anchor = useFormatAnchor('link', editorRef);

const url = computed(() => (anchor.value as HTMLAnchorElement | null)?.href ?? '');

// Resolve the link element back to a Quill range so we can re-apply or
// clear the format without depending on whatever the user has selected.
// editor.quill is the documented escape hatch.
function selectLinkRange(): boolean {
  const ed = editorRef.value;
  const el = anchor.value;
  if (!ed || !el) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const QuillCtor = ed.quill.constructor as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blot = QuillCtor.find?.(el) as any;
  if (!blot) return false;
  const index = ed.quill.getIndex(blot);
  const length = typeof blot.length === 'function' ? blot.length() : 0;
  if (length <= 0) return false;
  ed.selection.set(index, length);
  return true;
}

function edit() {
  const ed = editorRef.value;
  if (!ed) return;
  const next = window.prompt('Edit link:', url.value);
  if (next === null) return;
  if (!selectLinkRange()) return;
  if (next === '') {
    ed.format.set('link', false);
  } else {
    ed.format.set('link', next);
  }
}

function remove() {
  const ed = editorRef.value;
  if (!ed) return;
  if (!selectLinkRange()) return;
  ed.format.set('link', false);
}
</script>

<template>
  <QuoltFloatingMenu :editor="editorRef" :anchor="anchor" placement="top">
    <div class="qe-linkmenu">
      <a
        class="qe-linkmenu-url"
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        :title="url"
      >{{ url }}</a>
      <button
        type="button"
        class="qe-linkmenu-btn"
        aria-label="Edit link"
        @click="edit"
      >Edit</button>
      <button
        type="button"
        class="qe-linkmenu-btn qe-linkmenu-btn--danger"
        aria-label="Remove link"
        @click="remove"
      >Remove</button>
    </div>
  </QuoltFloatingMenu>
</template>
