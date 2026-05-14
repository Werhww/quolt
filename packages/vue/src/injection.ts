import type { InjectionKey, Ref } from 'vue';
import type { QuoltEditor } from 'quolt-core';

/**
 * Injection key for the editor instance. Provided by `<QuoltEditor>` (host)
 * and by `defineComponentEmbed`-generated mini-apps (embed). Both surface a
 * Ref so consumers can react to mount completion.
 */
export const editorInjectionKey: InjectionKey<Ref<QuoltEditor | null>> = Symbol(
  'quolt:editor',
);
