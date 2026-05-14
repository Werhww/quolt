<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { QuoltEditor } from 'quolt-core';

/**
 * Base primitive for floating menus that follow editor content — a link
 * popover, an image toolbar, a mention card, etc.
 *
 * The component is intentionally minimal:
 *   - You supply an `anchor` (HTMLElement | null) that says WHERE to point
 *     to and WHEN to be visible.
 *   - The menu positions itself with `position: fixed` against the anchor's
 *     bounding rect, picks a placement, and re-positions on every event
 *     that could shift the anchor (scroll, resize, editor change).
 *
 * Pair with `useFormatAnchor` / `useEmbedAnchor` / `useAnchorResolver` from
 * `floatingAnchors.ts` to derive the anchor reactively from selection.
 *
 * Why position: fixed instead of absolute + portal:
 *   - Survives ancestor overflow without Teleport gymnastics.
 *   - Inherits `data-quolt-theme` from its DOM placement (still a descendant
 *     of the editor's frame), so theme tokens resolve correctly.
 *   - Avoids creating a second DOM root for theme propagation.
 */
const props = withDefaults(
  defineProps<{
    /** Editor instance — needed to listen for content changes that may shift the anchor. */
    editor: QuoltEditor | null;
    /** The DOM element the menu points at. When null, the menu is hidden. */
    anchor: HTMLElement | null;
    /** Preferred placement. Auto-flips to the opposite side if off-screen. */
    placement?: 'top' | 'bottom';
    /** Gap in px between the anchor edge and the menu. */
    offset?: number;
  }>(),
  {
    placement: 'top',
    offset: 8,
  },
);

const menuEl = ref<HTMLElement | null>(null);
const top = ref(0);
const left = ref(0);
const positioned = ref(false);

async function reposition() {
  if (!props.anchor) {
    positioned.value = false;
    return;
  }
  // The menu DOM may not exist yet on the same tick the anchor flips from
  // null → element. Wait one tick so the v-if branch has rendered.
  if (!menuEl.value) {
    await nextTick();
    if (!menuEl.value) return;
  }

  const anchorRect = props.anchor.getBoundingClientRect();
  const menuRect = menuEl.value.getBoundingClientRect();

  // Vertical placement — preferred side first, flip to the other if the
  // preferred side would render off-screen with an 8px viewport margin.
  let t: number;
  if (props.placement === 'top') {
    t = anchorRect.top - menuRect.height - props.offset;
    if (t < 8) t = anchorRect.bottom + props.offset;
  } else {
    t = anchorRect.bottom + props.offset;
    if (t + menuRect.height > window.innerHeight - 8) {
      t = anchorRect.top - menuRect.height - props.offset;
    }
  }

  // Horizontal: center on the anchor, clamped to viewport bounds.
  let l = anchorRect.left + anchorRect.width / 2 - menuRect.width / 2;
  l = Math.max(8, Math.min(window.innerWidth - menuRect.width - 8, l));

  top.value = t;
  left.value = l;
  positioned.value = true;
}

watch(
  () => props.anchor,
  async () => {
    if (props.anchor) {
      await nextTick();
      reposition();
    } else {
      positioned.value = false;
    }
  },
  { immediate: true },
);

function onScrollOrResize() {
  reposition();
}

function onEditorChange() {
  reposition();
}

let attachedEditor: QuoltEditor | null = null;

watch(
  () => props.editor,
  (next, prev) => {
    if (prev) prev.off('change', onEditorChange);
    if (next) next.on('change', onEditorChange);
    attachedEditor = next;
  },
  { immediate: true },
);

onMounted(() => {
  // capture: true so any nested scroll container also triggers reposition.
  window.addEventListener('scroll', onScrollOrResize, true);
  window.addEventListener('resize', onScrollOrResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScrollOrResize, true);
  window.removeEventListener('resize', onScrollOrResize);
  if (attachedEditor) attachedEditor.off('change', onEditorChange);
});
</script>

<template>
  <!-- @mousedown.prevent keeps the editor's selection alive when the user
       clicks a button inside the menu. Without it, the click would shift
       focus out of the editor, fire a Quill blur → selection-change(null) →
       our anchor recomputes to null → the menu unmounts BEFORE the
       click event reaches its handler. The default-prevent kills only the
       focus-shift; click/contextmenu still propagate normally. -->
  <div
    v-if="anchor"
    ref="menuEl"
    class="qe-floating"
    role="dialog"
    :style="{
      position: 'fixed',
      top: top + 'px',
      left: left + 'px',
      visibility: positioned ? 'visible' : 'hidden',
    }"
    @mousedown.prevent
  >
    <slot />
  </div>
</template>
