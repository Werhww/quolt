# Custom formats

Quolt exposes three primitives for extending the editor: **marks** (inline formatting like bold), **blocks** (block-level containers like headings), and **embeds** (atomic insertable units like images or mention chips).

Each one is built on top of Parchment — Quill's document-model library — but Quolt hides the class inheritance, static-method ceremony, and registration dance behind a config object.

## Embeds — `defineEmbed`

Embeds are the simplest case and the only fully-wired primitive at this point. They render an atomic DOM node that Quill treats as a single character.

### Declarative: `toDOM`

```ts
import { defineEmbed } from 'quolt-vue';

const divider = defineEmbed<true>({
  name: 'divider',
  inline: false,           // block-level
  toDOM: () => ({ html: '<hr />' }),
});
```

Pass the definition to the editor:

```vue
<QuoltEditor :formats="[divider]" />
```

Then insert from code:

```ts
editor.insert.embed('divider', true);
```

> Quill treats `null` embed values as a no-op. Use a truthy sentinel (`true`, `{}`, etc.) for embeds that have no per-instance data.

### Component-backed (Vue)

For complex embeds — anything with internal state, click handlers, computed display — use [component embeds](/guide/component-embeds).

## Marks — `defineMark` (in progress)

The `defineMark` factory is stubbed; the signature is final but wrapper-class generation is pending. See [PLAN.md → Custom marks](https://github.com/Werhww/quolt/blob/main/PLAN.md).

```ts
defineMark<{ color: string }>({
  name: 'highlight',
  tag: 'span',
  style: ({ color }) => ({ backgroundColor: color }),
});
```

## Blocks — `defineBlock` (in progress)

Same status as marks. The signature locks in space for the Notion-style block model (slash menu, drag handles, text-to-block transforms) so consumer code written today won't need to change later.

```ts
defineBlock<{ tone: 'info' | 'warning' }>({
  name: 'callout',
  tag: 'div',
  slash: { label: 'Callout', icon: '💡' },
  transformFromText: (t) => (t.startsWith('> ') ? { tone: 'info' } : null),
});
```
