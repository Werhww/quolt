import { inject, shallowRef, type Ref } from 'vue';
import type { QuoltEditor } from 'quolt-core';

import { editorInjectionKey } from './injection.js';

/**
 * Returns a reactive ref to the surrounding QuoltEditor instance.
 *
 * Resolves in two contexts:
 *   1. Inside any child of `<QuoltEditor>` — taps the host's provided ref;
 *      ref starts null and flips to the editor on mount.
 *   2. Inside a component rendered by `defineComponentEmbed` — taps the
 *      embed's mini-app provide; ref is non-null immediately.
 *
 * Returns a permanently-null ref if used outside both contexts so usage is
 * safe to chain without conditional guards.
 */
export function useQuolt(): Ref<QuoltEditor | null> {
  const injected = inject(editorInjectionKey, null);
  return injected ?? shallowRef<QuoltEditor | null>(null);
}
