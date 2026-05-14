# Component embeds (Vue)

Some embeds want a real Vue component — mention chips with avatars, inline equation editors, embed cards with click handlers. `defineComponentEmbed` lets you author those as ordinary SFCs.

## Define the component

```vue
<!-- MentionChip.vue -->
<script setup lang="ts">
import { useQuolt } from 'quolt-vue';

defineProps<{ value: { id: string; name: string } }>();

const editor = useQuolt();
</script>

<template>
  <span class="mention" @click="editor?.selection.focus()">
    @{{ value.name }}
  </span>
</template>
```

## Register it

```ts
import { defineComponentEmbed } from 'quolt-vue';
import MentionChip from './MentionChip.vue';

export const mentionEmbed = defineComponentEmbed<{ id: string; name: string }>({
  name: 'mention',
  inline: true,
  component: MentionChip,
});
```

## Use it

```vue
<QuoltEditor :formats="[mentionEmbed]" />

<script setup>
const editor = useQuolt();
editor.value?.insert.embed('mention', { id: '42', name: 'ada' });
</script>
```

## How it works

Each embed mounts its own Vue app inside the host blot's DOM node. The Delta remains the source of truth — the component renders from `props.value`. When the editor mutates the embed's value, Quolt swaps the prop in place rather than remounting (assuming the renderer signals support; see PLAN.md for the current limitations around non-destructive updates).

The component can reach back into the editor via `useQuolt()` — the same composable works whether the component lives in the host editor or inside an embed.

## Reactivity contract

| Direction | Mechanism |
| --- | --- |
| Editor → component | `props.value` reassigned via `shallowRef` in the embed's app |
| Component → editor | Call methods on the editor returned by `useQuolt()` |

Components must not store the embed's value in local state — `props.value` is the single source. Local state is fine for UI ephemera (open/closed, hovered, etc.).
