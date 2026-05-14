import { createApp, h, markRaw, shallowRef, type Component } from 'vue';
import {
  defineEmbed,
  type QuoltFormatDefinition,
} from 'quolt-core';

import { editorInjectionKey } from './injection.js';

export interface DefineComponentEmbedConfig<V> {
  /** Unique format name. Used by editor.insert.embed(name, value). */
  name: string;
  /** Inline embed (default true) behaves like a single character. */
  inline?: boolean;
  /** Vue component that receives `{ value: V }` as props. */
  component: Component;
  /** Optional custom HTML → value parser (paste, setHTML). Defaults to data-quolt-value JSON. */
  parse?: (node: HTMLElement) => V;
}

/**
 * Vue-flavoured embed. The component renders inside an isolated Vue app
 * mounted into the embed's host element; the underlying Parchment blot stays
 * a plain class so Quill's tree algorithm is untouched.
 *
 * Reactivity:
 *  - Component receives `value: V` as a prop. When the renderer's update()
 *    fires, the prop reassigns and Vue re-renders without remount.
 *  - The component can call useQuolt() to reach the editor and mutate state.
 *  - The Delta remains the source of truth; programmatic value changes flow
 *    through the editor API (delete + insert for now — see PLAN.md for the
 *    planned non-destructive update path).
 */
export function defineComponentEmbed<V>(
  config: DefineComponentEmbedConfig<V>,
): QuoltFormatDefinition {
  return defineEmbed<V>({
    name: config.name,
    inline: config.inline,
    parse: config.parse,
    render(container, value, ctx) {
      const valueRef = shallowRef<V>(value);
      const editorRef = shallowRef(ctx.editor);

      const app = createApp({
        render: () =>
          h(config.component, {
            value: valueRef.value,
          }),
      });

      app.provide(editorInjectionKey, editorRef);
      // markRaw prevents Vue from wrapping the editor's internal Quill instance in a reactive proxy,
      // which would break Quill's identity checks on DOM nodes.
      app.provide('quolt:editor:raw', markRaw(ctx.editor));
      app.mount(container);

      return {
        update(next) {
          valueRef.value = next;
          try {
            container.setAttribute('data-quolt-value', JSON.stringify(next));
          } catch {
            /* unstringifiable — skip serialization */
          }
        },
        destroy() {
          app.unmount();
        },
      };
    },
  });
}
