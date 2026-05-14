# QuoltEditor

The framework-agnostic core class. Wraps Quill and exposes Quolt's API surface.

```ts
import { QuoltEditor } from 'quolt-core';

const editor = new QuoltEditor(element, options);
```

## Options

| Field | Type | Default | Notes |
| --- | --- | --- | --- |
| `placeholder` | `string` | — | Quill's placeholder pass-through. |
| `readOnly` | `boolean` | `false` | |
| `initialContent` | `Delta \| string` | — | Initial content. Delta is canonical; a string is treated as HTML and routed through the clipboard converter. |
| `modules` | `Record<string, unknown>` | — | Pass-through to Quill module configuration. |
| `formats` | `QuoltFormatDefinition[]` | `[]` | Custom formats (from `defineEmbed` etc.) registered before mount. |
| `quillTheme` | `string \| false` | `'snow'` | Underlying Quill theme. `false` opts out. |

## API groups

### `editor.format`

```ts
editor.format.bold();
editor.format.italic();
editor.format.underline();
editor.format.strike();
editor.format.toggle('blockquote');
editor.format.set('header', 1);
editor.format.clear();           // clear all
editor.format.clear('bold');     // clear one
editor.format.has('bold');
editor.format.current();         // { bold: true, ... }
```

### `editor.insert`

```ts
editor.insert.text('hi');
editor.insert.text('hi', { bold: true });
editor.insert.link('https://quolt.dev', 'Quolt');
editor.insert.image('https://...');
editor.insert.embed('mention', { id: '42', name: 'ada' });
editor.insert.line();
```

### `editor.content`

Delta is the canonical form. HTML is a serialization target — useful for display, lossy as storage.

```ts
editor.content.getDelta();         // Delta — canonical
editor.content.setDelta(delta);

editor.content.getHTML();          // HTML — serialization
editor.content.setHTML('<p>...</p>');

editor.content.getText();
editor.content.length();
editor.content.clear();
editor.content.isEmpty();
```

### `editor.selection`

```ts
editor.selection.get();          // { index, length } | null
editor.selection.set(0, 5);
editor.selection.caret(10);
editor.selection.all();
editor.selection.focus();
editor.selection.blur();
```

## Events

```ts
editor.on('change', ({ delta, oldDelta, source }) => { ... });
editor.on('selection', ({ range, oldRange, source }) => { ... });
editor.off('change', handler);
```

## Escape hatch

```ts
editor.quill  // raw Quill instance — use sparingly
```

## Lifecycle

```ts
editor.destroy();  // detaches listeners and empties the container
```
