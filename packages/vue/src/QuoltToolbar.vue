<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { QuoltEditor } from 'quolt-core';

import QuoltIcon from './QuoltIcon.vue';
import { useQuolt } from './useQuolt.js';

const props = withDefaults(
  defineProps<{
    /**
     * Editor instance. When omitted, falls back to useQuolt() so the toolbar
     * still works when it's a descendant of <QuoltEditor>. The typical
     * pattern is to pass the editor explicitly because the toolbar usually
     * sits ABOVE the editor (siblings under .qe-frame).
     */
    editor?: QuoltEditor | null;
    /** Show the right-aligned status zone. */
    showStatus?: boolean;
  }>(),
  {
    editor: undefined,
    showStatus: true,
  },
);

const injectedEditor = useQuolt();
const editor = computed<QuoltEditor | null>(
  () => props.editor ?? injectedEditor.value,
);

// Active formats refresh on every selection or change event from the editor.
// The toolbar's is-active state and the heading trigger label both read from
// this single source of truth.
const active = ref<Record<string, unknown>>({});

function refresh() {
  active.value = editor.value?.format.current() ?? {};
}

let attached: QuoltEditor | null = null;

function detach() {
  if (attached) {
    attached.off('selection', refresh);
    attached.off('change', refresh);
    attached = null;
  }
}

watch(
  editor,
  (next) => {
    detach();
    if (!next) return;
    attached = next;
    next.on('selection', refresh);
    next.on('change', refresh);
    refresh();
  },
  { immediate: true },
);

onBeforeUnmount(detach);

function isMark(name: string): boolean {
  return Boolean(active.value[name]);
}
function isList(kind: 'bullet' | 'ordered'): boolean {
  return active.value['list'] === kind;
}

// ---------- Heading dropdown ----------
interface HeadingItem {
  kind: 'header' | 'paragraph' | 'blockquote' | 'code-block';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  glyph: string;
  previewClass: string;
  label: string;
  kbd: string;
  triggerStyle: string;
}

const HEADING_ITEMS: HeadingItem[] = [
  { kind: 'header', level: 1, glyph: 'H1', previewClass: 'qe-mp-h1', label: 'Heading 1', kbd: '⌘⌥1', triggerStyle: 'style-h1' },
  { kind: 'header', level: 2, glyph: 'H2', previewClass: 'qe-mp-h2', label: 'Heading 2', kbd: '⌘⌥2', triggerStyle: 'style-h2' },
  { kind: 'header', level: 3, glyph: 'H3', previewClass: 'qe-mp-h3', label: 'Heading 3', kbd: '⌘⌥3', triggerStyle: 'style-h3' },
  { kind: 'header', level: 4, glyph: 'H4', previewClass: 'qe-mp-h4', label: 'Heading 4', kbd: '⌘⌥4', triggerStyle: 'style-h3' },
  { kind: 'header', level: 5, glyph: 'H5', previewClass: 'qe-mp-h5', label: 'Heading 5', kbd: '⌘⌥5', triggerStyle: 'style-h3' },
  { kind: 'header', level: 6, glyph: 'H6', previewClass: 'qe-mp-h6', label: 'Heading 6', kbd: '⌘⌥6', triggerStyle: 'style-h3' },
  { kind: 'paragraph', glyph: '¶', previewClass: 'qe-mp-p', label: 'Paragraph', kbd: '⌘⌥0', triggerStyle: 'style-paragraph' },
  { kind: 'blockquote', glyph: '“ ”', previewClass: 'qe-mp-quote', label: 'Blockquote', kbd: '⌘⇧.', triggerStyle: 'style-quote' },
  { kind: 'code-block', glyph: '{ }', previewClass: 'qe-mp-code', label: 'Code block', kbd: '⌘⌥C', triggerStyle: 'style-code' },
];

const currentHeading = computed<HeadingItem>(() => {
  const level = active.value['header'];
  if (typeof level === 'number' && level >= 1 && level <= 6) {
    return HEADING_ITEMS.find((it) => it.kind === 'header' && it.level === level) ?? HEADING_ITEMS[6]!;
  }
  if (active.value['blockquote']) return HEADING_ITEMS[7]!;
  if (active.value['code-block']) return HEADING_ITEMS[8]!;
  return HEADING_ITEMS[6]!; // paragraph
});

function isCurrent(item: HeadingItem): boolean {
  return item === currentHeading.value;
}

function applyHeading(item: HeadingItem) {
  const ed = editor.value;
  if (!ed) return;
  // Header / blockquote / code-block are mutually exclusive on the same line.
  // Clear the other two before applying — Quill mostly handles this but the
  // explicit clear keeps state predictable when a user clicks rapidly.
  if (item.kind === 'paragraph') {
    ed.format.set('header', false);
    ed.format.set('blockquote', false);
    ed.format.set('code-block', false);
  } else if (item.kind === 'header') {
    ed.format.set('blockquote', false);
    ed.format.set('code-block', false);
    ed.format.set('header', item.level);
  } else if (item.kind === 'blockquote') {
    ed.format.set('header', false);
    ed.format.set('code-block', false);
    ed.format.set('blockquote', true);
  } else {
    ed.format.set('header', false);
    ed.format.set('blockquote', false);
    ed.format.set('code-block', true);
  }
  menuOpen.value = false;
}

const menuOpen = ref(false);
const rootEl = ref<HTMLElement | null>(null);
const sentinelEl = ref<HTMLElement | null>(null);

// "Stuck" = the toolbar has scrolled to the top of the viewport and is
// floating above the page (position:sticky engaged). Detected via a 1px
// sentinel placed just above the toolbar's natural top edge: when the
// sentinel scrolls out of view, the toolbar is stuck. CSS uses this to
// flatten the rounded top corners and add a soft elevation shadow.
const stuck = ref(false);
let stickyObserver: IntersectionObserver | null = null;

onMounted(() => {
  if (!sentinelEl.value || typeof IntersectionObserver === 'undefined') return;
  stickyObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry) stuck.value = !entry.isIntersecting;
    },
    { threshold: 0 },
  );
  stickyObserver.observe(sentinelEl.value);
});

onBeforeUnmount(() => {
  stickyObserver?.disconnect();
  stickyObserver = null;
});

function onDocumentClick(event: MouseEvent) {
  if (!menuOpen.value) return;
  const target = event.target as Node | null;
  if (target && rootEl.value?.contains(target)) return;
  menuOpen.value = false;
}

watch(menuOpen, (open) => {
  if (open) {
    document.addEventListener('mousedown', onDocumentClick);
  } else {
    document.removeEventListener('mousedown', onDocumentClick);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocumentClick);
});

// ---------- Action handlers ----------
function toggleMark(name: 'bold' | 'italic' | 'underline' | 'strike') {
  editor.value?.format.toggle(name);
}

function toggleList(kind: 'bullet' | 'ordered') {
  const ed = editor.value;
  if (!ed) return;
  const current = ed.format.current()['list'];
  ed.format.set('list', current === kind ? false : kind);
}

function toggleBlockquote() {
  editor.value?.format.blockquote();
}

function toggleCodeBlock() {
  editor.value?.format.codeBlock();
}

function insertLink() {
  const ed = editor.value;
  if (!ed) return;
  const url = window.prompt('Link URL:');
  if (!url) return;
  ed.insert.link(url);
}

function insertImage() {
  const ed = editor.value;
  if (!ed) return;
  const url = window.prompt('Image URL:');
  if (!url) return;
  ed.insert.image(url);
}

function insertDivider() {
  // No-op when the consumer hasn't registered a `divider` format.
  // The error path is intentional — surfacing it through the UI would lie
  // about the toolbar's capabilities.
  editor.value?.insert.embed('divider', true);
}
</script>

<template>
  <div
    ref="rootEl"
    :class="['qe-toolbar', { 'is-stuck': stuck }]"
    role="toolbar"
    aria-label="Editor toolbar"
  >
    <div ref="sentinelEl" class="qe-toolbar-sentinel" aria-hidden="true" />
    <!-- Heading dropdown — its own segment-like trigger -->
    <div class="qe-heading-wrap">
      <button
        type="button"
        :class="['qe-heading-trigger', currentHeading.triggerStyle, { 'is-open': menuOpen }]"
        aria-haspopup="menu"
        :aria-expanded="menuOpen"
        @click="menuOpen = !menuOpen"
      >
        <span class="glyph" aria-hidden="true">{{ currentHeading.glyph }}</span>
        <span class="label">{{ currentHeading.label }}</span>
        <span class="chev"><QuoltIcon name="chevron" /></span>
      </button>
      <div
        v-if="menuOpen"
        class="qe-menu"
        role="menu"
        aria-label="Heading style"
        style="left: 0; top: calc(100% + 6px);"
      >
        <template v-for="(item, i) in HEADING_ITEMS" :key="i">
          <div
            v-if="item.kind === 'paragraph' && i > 0"
            class="qe-menu-divider"
            aria-hidden="true"
          />
          <button
            type="button"
            role="menuitemradio"
            :class="['qe-menu-item', { 'is-current': isCurrent(item) }]"
            :aria-checked="isCurrent(item)"
            @click="applyHeading(item)"
          >
            <span class="glyph">{{ item.glyph }}</span>
            <span class="label"><span :class="['preview', item.previewClass]">{{ item.label }}</span></span>
            <span class="kbd">{{ item.kbd }}</span>
          </button>
        </template>
      </div>
    </div>

    <!-- Scrollable segments — overflow horizontally when there isn't enough
         room. Heading dropdown sits OUTSIDE so its menu can extend below
         the toolbar without being clipped by this wrapper's overflow. -->
    <div class="qe-toolbar-scroll">
    <!-- Inline formatting -->
    <div class="qe-segment" role="group" aria-label="Inline formatting">
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('bold') }]" aria-label="Bold" @click="toggleMark('bold')">
        <QuoltIcon name="bold" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('italic') }]" aria-label="Italic" @click="toggleMark('italic')">
        <QuoltIcon name="italic" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('underline') }]" aria-label="Underline" @click="toggleMark('underline')">
        <QuoltIcon name="underline" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('strike') }]" aria-label="Strikethrough" @click="toggleMark('strike')">
        <QuoltIcon name="strike" />
      </button>
    </div>

    <!-- Lists + quote -->
    <div class="qe-segment" role="group" aria-label="Block formatting">
      <button type="button" :class="['qe-icon-btn', { 'is-active': isList('bullet') }]" aria-label="Bullet list" @click="toggleList('bullet')">
        <QuoltIcon name="bullet" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isList('ordered') }]" aria-label="Ordered list" @click="toggleList('ordered')">
        <QuoltIcon name="ordered" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('blockquote') }]" aria-label="Blockquote" @click="toggleBlockquote">
        <QuoltIcon name="quote" />
      </button>
    </div>

    <!-- Insert / code -->
    <div class="qe-segment" role="group" aria-label="Insert">
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('code-block') }]" aria-label="Code block" @click="toggleCodeBlock">
        <QuoltIcon name="code" />
      </button>
      <button type="button" :class="['qe-icon-btn', { 'is-active': isMark('link') }]" aria-label="Link" @click="insertLink">
        <QuoltIcon name="link" />
      </button>
      <button type="button" class="qe-icon-btn" aria-label="Image" @click="insertImage">
        <QuoltIcon name="image" />
      </button>
      <button type="button" class="qe-icon-btn" aria-label="Divider" @click="insertDivider">
        <QuoltIcon name="divider" />
      </button>
    </div>
    </div>

    <div v-if="showStatus" class="qe-status" aria-label="Editor status">
      <span class="dot" aria-hidden="true"></span>
      <slot name="status">
        <span>Ready</span>
      </slot>
    </div>
  </div>
</template>
