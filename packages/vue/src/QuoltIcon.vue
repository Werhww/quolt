<script setup lang="ts">
// 16×16, 1.5px stroke, rounded caps, currentColor. Inner paths are stored as
// strings + injected via v-html — the surrounding <svg> already sits in the
// SVG namespace so the parsed children inherit it.

export type QuoltIconName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'link'
  | 'image'
  | 'code'
  | 'bullet'
  | 'ordered'
  | 'quote'
  | 'divider'
  | 'chevron'
  | 'more';

defineProps<{ name: QuoltIconName }>();

const PATHS: Record<QuoltIconName, string> = {
  bold:
    '<path d="M4.5 3h4.25a2.5 2.5 0 0 1 0 5H4.5z"/>' +
    '<path d="M4.5 8h5a2.5 2.5 0 0 1 0 5H4.5z"/>',
  italic:
    '<path d="M10 3H6"/><path d="M10 13H6"/><path d="M9 3L7 13"/>',
  underline:
    '<path d="M4 2.5v5a4 4 0 0 0 8 0v-5"/><path d="M3 13h10"/>',
  strike:
    '<path d="M11.5 4.5a2.7 2 0 0 0-2.6-1.5H7.5a2 2 0 0 0-1.4 3.5"/>' +
    '<path d="M10.5 9.5a2 2 0 0 1-1.5 3.5H7a2.7 2 0 0 1-2.6-1.5"/>' +
    '<path d="M2.5 8h11"/>',
  link:
    '<path d="M6.5 9.5l3-3"/>' +
    '<path d="M7 4.5l1-1a2.83 2.83 0 0 1 4 4l-1 1"/>' +
    '<path d="M9 11.5l-1 1a2.83 2.83 0 0 1-4-4l1-1"/>',
  image:
    '<rect x="2.5" y="2.5" width="11" height="11" rx="1.5"/>' +
    '<circle cx="6" cy="6" r="1"/>' +
    '<path d="M13.5 10L10 7l-6.5 6"/>',
  code:
    '<path d="M5.5 4.5L2 8l3.5 3.5"/><path d="M10.5 4.5L14 8l-3.5 3.5"/>',
  bullet:
    '<circle cx="3" cy="4" r="0.75" fill="currentColor"/>' +
    '<circle cx="3" cy="8" r="0.75" fill="currentColor"/>' +
    '<circle cx="3" cy="12" r="0.75" fill="currentColor"/>' +
    '<path d="M6 4h7"/><path d="M6 8h7"/><path d="M6 12h7"/>',
  ordered:
    '<path d="M2.5 3.5h1V6"/><path d="M2.5 6h2"/>' +
    '<path d="M2.5 10.5h2L2.5 13h2"/>' +
    '<path d="M6 4h7"/><path d="M6 8h7"/><path d="M6 12h7"/>',
  quote:
    '<path d="M5 5.5c-1.4 0-2.5 1.1-2.5 2.5S3.6 10.5 5 10.5c0 0-1 1-2.5 1"/>' +
    '<path d="M11 5.5c-1.4 0-2.5 1.1-2.5 2.5S9.6 10.5 11 10.5c0 0-1 1-2.5 1"/>',
  divider:
    '<path d="M4 4h8"/><path d="M2 8h12"/><path d="M4 12h8"/>',
  chevron:
    '<path d="M4 6l4 4 4-4"/>',
  more:
    '<circle cx="3.5" cy="8" r="0.9" fill="currentColor"/>' +
    '<circle cx="8" cy="8" r="0.9" fill="currentColor"/>' +
    '<circle cx="12.5" cy="8" r="0.9" fill="currentColor"/>',
};
</script>

<template>
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="PATHS[name]"
  />
</template>
