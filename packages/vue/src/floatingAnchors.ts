import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import type { QuoltEditor, Range } from 'quolt-core';

import { useQuolt } from './useQuolt.js';

/**
 * Resolver: given the editor and its current selection, return the DOM
 * element the floating menu should anchor to — or null to hide.
 *
 * Ran on every selection-change and text-change so the anchor stays in
 * sync with the cursor and live content edits.
 */
export type AnchorResolver = (
  editor: QuoltEditor,
  range: Range | null,
) => HTMLElement | null;

/**
 * The low-level composable. Pass it any resolver — `useFormatAnchor` and
 * `useEmbedAnchor` are sugar built on top, but custom blots can drop in
 * here with their own logic.
 *
 * Example — a "highlight" mark menu that opens on any span with a
 * background colour:
 *
 *   const anchor = useAnchorResolver((editor, range) => {
 *     if (!range) return null;
 *     const node = window.getSelection()?.anchorNode;
 *     // ...walk up looking for the relevant element...
 *     return el ?? null;
 *   });
 */
export function useAnchorResolver(
  resolve: AnchorResolver,
  editorRef?: Ref<QuoltEditor | null>,
): Ref<HTMLElement | null> {
  const fallback = useQuolt();
  const ed = computed(() => (editorRef ? editorRef.value : fallback.value));

  const anchor = ref<HTMLElement | null>(null);

  function recompute() {
    if (!ed.value) {
      anchor.value = null;
      return;
    }
    const range = ed.value.selection.get();
    anchor.value = resolve(ed.value, range);
  }

  let attached: QuoltEditor | null = null;

  watch(
    ed,
    (next, prev) => {
      if (prev) {
        prev.off('selection', recompute);
        prev.off('change', recompute);
      }
      if (next) {
        next.on('selection', recompute);
        next.on('change', recompute);
        attached = next;
        recompute();
      } else {
        attached = null;
        anchor.value = null;
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    if (attached) {
      attached.off('selection', recompute);
      attached.off('change', recompute);
    }
  });

  return anchor;
}

/**
 * Reactive anchor for a MARK format (link, color, custom inline marks).
 * Walks the blot tree from the cursor upward looking for a blot whose
 * `blotName` matches; returns its DOM node so the menu can point at it.
 *
 * Returns null when the cursor isn't inside that mark (or there's no
 * selection at all).
 */
export function useFormatAnchor(
  formatName: string,
  editorRef?: Ref<QuoltEditor | null>,
): Ref<HTMLElement | null> {
  return useAnchorResolver((editor, range) => {
    if (!range) return null;
    // editor.quill is the documented escape hatch; the blot tree is
    // Quill-internal and there isn't a Layer-2 accessor for it yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [leaf] = editor.quill.getLeaf(range.index) as [any, number];
    if (!leaf) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blot: any = leaf;
    while (blot) {
      if (blot.statics?.blotName === formatName) {
        return blot.domNode as HTMLElement;
      }
      blot = blot.parent;
    }
    return null;
  }, editorRef);
}

/**
 * Reactive anchor for an EMBED format (image, divider, mention, …).
 * Embeds are atomic — clicking one places the cursor "on" it. We also
 * surface the menu when the cursor is immediately AFTER an embed, so the
 * common click-past-then-show-menu interaction works.
 */
export function useEmbedAnchor(
  embedName: string,
  editorRef?: Ref<QuoltEditor | null>,
): Ref<HTMLElement | null> {
  return useAnchorResolver((editor, range) => {
    if (!range) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [leaf] = editor.quill.getLeaf(range.index) as [any, number];
    if (leaf?.statics?.blotName === embedName) {
      return leaf.domNode as HTMLElement;
    }
    if (range.length === 0 && range.index > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [prev] = editor.quill.getLeaf(range.index - 1) as [any, number];
      if (prev?.statics?.blotName === embedName) {
        return prev.domNode as HTMLElement;
      }
    }
    return null;
  }, editorRef);
}
