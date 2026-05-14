# Quolt — Plan

A reference document for the project's vision, architecture, and roadmap. This is the source of truth — keep it updated as decisions change.

## Vision

Quolt is a modern, open-source rich text editor built on top of Quill.js. The goal is to give the community a **free, easy alternative** for people who find existing rich-text editors expensive or hard to use.

Two product goals:
- **Easy default experience** — drop in a `<QuoltEditor />` and get a beautiful, themed editor (light + dark) that "just works."
- **Deep customization via Quolt's own clean API** — power users can do anything Quill can do, through a well-named, well-documented API that doesn't require learning Quill's internals.

**Positioning:** Quolt is "Quill with a clean API and beautiful defaults," **not** a Notion clone. Block-level UX (drag handles, slash menu, transforms) is available as optional, opt-in modules for users who want it — but those modules are scoped to what fits Quill's model. Features that don't fit (collapsible toggle blocks, free-form nesting, inline databases) are intentionally dropped, not half-shipped.

## Architecture — the three-layer model

```
┌──────────────────────────────────────────────────────────┐
│ Layer 3: <QuoltEditor />                                 │
│          opinionated, themed, "just works" component     │
│          (lives in packages/vue, future packages/react)  │
├──────────────────────────────────────────────────────────┤
│ Layer 2: QuoltEditor class                               │
│          Quolt's OWN clean, framework-agnostic API       │
│          (lives in packages/core — the heart)            │
├──────────────────────────────────────────────────────────┤
│ Layer 1: Quill engine                                    │
│          hidden engine, accessible via editor.quill      │
│          as escape hatch                                 │
└──────────────────────────────────────────────────────────┘
```

**The key design discipline:** Every Quill concept gets re-exported through Quolt with better names and docs. Framework wrappers stay **thin** — they just expose the core `QuoltEditor` class idiomatically (Vue composables, React hooks, etc.). When future React/Svelte wrappers ship, they reuse the same core untouched.

### Layer 2 API surface (current — shipped)

```ts
class QuoltEditor {
  constructor(element: HTMLElement, options?: QuoltOptions)

  format: FormatApi      // bold, italic, underline, strike, toggle, set, clear, has, current
  insert: InsertApi      // text, image, link, embed, line
  content: ContentApi    // getHTML, setHTML, getDelta, setDelta, getText, length, clear, isEmpty
  selection: SelectionApi // get, set, caret, all, focus, blur

  on(event, handler): void
  off(event, handler): void
  destroy(): void

  get quill(): Quill     // escape hatch — documented but discouraged
  get container(): HTMLElement
}
```

### Custom format primitives (current — defineEmbed shipped, others stubbed)

```ts
defineEmbed<V>({ name, inline, toDOM?, render?, parse? })
defineMark<V>({ name, tag, class?, style? })          // stub
defineBlock<V>({ name, tag, render?, slash?, transformFromText? })  // stub
```

### Vue layer pattern (target + current)

```vue
<!-- Default v-model is Delta — Quolt's canonical content form. -->
<script setup>
import { ref } from 'vue';
import { Delta, QuoltEditor } from 'quolt-vue';
const content = ref<Delta>(new Delta());
</script>
<template>
  <QuoltEditor v-model="content" :formats="[mention, callout]" />
</template>

<!-- Opt-in HTML binding if you need it -->
<QuoltEditor v-model:html="html" />

<!-- Raw path -->
<script setup>
const editorRef = shallowRef<QuoltEditor | null>(null);
function onReady(e: QuoltEditor) { editorRef.value = e; }
</script>
<template>
  <QuoltEditor @ready="onReady">
    <!-- user-built toolbar can call editorRef.value.format.bold() -->
  </QuoltEditor>
</template>
```

**Content form policy:** Delta is the canonical, lossless form. HTML is a serialization target. `v-model` binds Delta; `v-model:html` is opt-in for HTML round-trips. `useQuolt()` composable resolves the editor in either host or embed context.

## Monorepo layout

```
quolt/
├── packages/
│   ├── core/          # framework-agnostic: QuoltEditor class, format primitives, types
│   ├── vue/           # Vue 3 wrapper (defineComponentEmbed, useQuolt, QuoltEditor.vue)
│   ├── react/         # future — see "React adapter plan" below
│   └── themes/        # future — CSS/design tokens
├── apps/
│   ├── docs/          # VitePress site
│   └── playground/    # Vite + Vue sandbox
├── pnpm-workspace.yaml
├── vitest.config.ts
├── package.json
└── LICENSE
```

## Tooling

- **Package manager:** pnpm (workspaces)
- **Build:** plain `tsc` / `vue-tsc` initially; switch to tsup/unbuild when bundle quality matters
- **Typecheck:** `tsc --noEmit` (core), `vue-tsc --noEmit` (vue, playground)
- **Tests:** Vitest + happy-dom
- **Docs:** VitePress
- **Versioning/publish:** Changesets (not yet set up)
- **License:** MIT

## Namespace

- npm package names: `quolt-core`, `quolt-vue` (unscoped). The `@quolt` scope is also free on npm — plan to claim it by publishing thin re-exports under `@quolt/core` and `@quolt/vue` once the project takes off.
- GitHub: personal account. `github.com/quolt` (org) is squatted by an inactive user — irrelevant for personal repo.
- Domains available when needed: `quolt.com`, `quolt.dev`, `quolt.io` all unregistered as of 2026-05-14.

## API design principles for the "easy + customizable" tension

1. **Default `<QuoltEditor v-model="content" />`** with sensible toolbar + theme.
2. **Props for common knobs:** `placeholder`, `readOnly`, `modules`, `formats`, `quillTheme`.
3. **Custom formats are declarative**, with a renderer escape valve for framework components.
4. **Escape hatch** — `editor.quill` exposed but discouraged in docs.

**Implementation discipline:** build Layer 2 incrementally. Start with the 20% of operations users actually need (`bold`, `italic`, headings, lists, links, images, `getContent`, `setContent`, `on('change')`). Leave the rest accessible via `editor.quill` until you wrap them.

---

## Optional block-level UX modules

Quolt's default identity is a great Quill experience, not a Notion clone. But if a user wants richer block-level UX, Quolt offers a few **opt-in** modules. None of them are required to use the editor; nothing about the default API depends on them.

The honest rule: ship what fits Quill's model, drop what doesn't. Half-broken features hurt more than missing features.

### What fits Quill — keep

- **Custom block primitives** (`defineBlock`) — Parchment `BlockBlot` wrapper. Maps cleanly to Quill's flat-Delta block-attribute model. Examples: callout, code block with language, large quote.
- **Custom embeds** (`defineEmbed`) — already shipped. Atomic insertable units.
- **Block chrome module** — gutter "+" button and drag handle. Pure DOM overlay sibling to the editor; observes Quill's block elements but never mutates Quill's tree itself.
- **Slash menu module** — typed `/` opens a floating picker that lists every registered block + embed. Selection inserts the chosen format via existing Quill APIs.
- **Text-to-block transforms** — `# ` → H1, `> ` → blockquote, `---` → divider, etc. Implemented as Quill keyboard-module handlers.
- **Linear drag-to-reorder** — drag a block, drop it elsewhere in the document. Implemented as Delta math (read source line range, delete, reinsert at target index).

### What doesn't fit Quill — drop

- **Toggle blocks (collapsible nesting).** Quill's flat-Delta model has no real hierarchy. The "adjacent-line CSS-hide" trick mostly displays right, but cursor navigation, multi-line selection, and operations like "delete the whole collapsed subtree" all break in non-obvious ways. Dropped — not worth shipping half-working.
- **Free-form drag-as-child / arbitrary nesting.** Same reason. Linear reorder only.
- **Database blocks / inline tables with views.** Effectively a separate editor. Out of scope.

If demand surfaces later for hierarchy, the right answer is probably "use ProseMirror-based editor X," not "hack it into Quill."

### Primitive: `defineBlock`

The signature is locked in; the wrapper-class generator is pending.

```ts
defineBlock<V>({
  name: 'callout',
  tag: 'div',
  render?: FormatRenderer<V>,           // optional component-backed renderer
  slash?: { label, icon?, aliases? },   // metadata for the slash menu module
  transformFromText?: (text) => V|null  // "> " → { tone: 'info' }, etc.
});
```

Same `render` contract as `defineEmbed`. Vue/React adapters provide `defineComponentBlock` sugar.

### Optional modules

Each module is enabled explicitly. Users only pay for what they import.

```ts
new QuoltEditor(el, {
  modules: {
    'quolt:block-chrome': blockChrome({ handle: true, insert: true }),
    'quolt:slash-menu':   slashMenu({ trigger: '/' }),
    'quolt:transforms':   transforms({ markdown: true }),
    'quolt:reorder':      reorder(),
  },
});
```

| Module | Status | Notes |
| --- | --- | --- |
| `blockChrome` | not yet built | Gutter overlay with "+" and drag handle. |
| `slashMenu` | not yet built | Sources entries from `defineBlock` + `defineEmbed` metadata. |
| `transforms` | not yet built | Markdown-style shortcuts as Quill keyboard handlers. |
| `reorder` | not yet built | Linear drag-to-reorder via Delta math. |

### Optional-module roadmap

These ship **on demand**, not speculatively. Themes and the core API come first; modules follow if/when real users ask for them.

1. `defineBlock` wrapper-class generation (BlockBlot pipeline).
2. `transforms` module — markdown shortcuts. Smallest, highest value of the four.
3. `slashMenu` module — only if users ask.
4. `blockChrome` module — only if users ask.
5. `reorder` module — only if users ask.

---

## Themes — light, dark, customizable

Replacing Quill's dated "Snow" look is one of Quolt's biggest visual wins. Themes are a first-class part of the project, not an afterthought.

### Default behavior

```vue
<QuoltEditor v-model="content" theme="auto" />
```

| Prop value | Behavior |
| --- | --- |
| `theme="auto"` (default) | Follows `prefers-color-scheme`. |
| `theme="light"` | Forces light. |
| `theme="dark"` | Forces dark. |
| `theme="none"` | Quolt's theme CSS opts out — user supplies their own styling. |

The component sets `data-quolt-theme="light" \| "dark"` on its root element. All visual properties resolve through CSS custom properties so users can override any token without rewriting the theme.

### Token taxonomy

| Category | Example tokens |
| --- | --- |
| Surfaces | `--quolt-bg`, `--quolt-panel`, `--quolt-toolbar-bg`, `--quolt-code-bg`, `--quolt-embed-bg` |
| Text | `--quolt-text`, `--quolt-muted`, `--quolt-link`, `--quolt-error` |
| Borders | `--quolt-border`, `--quolt-toolbar-border`, `--quolt-focus-ring` |
| Brand | `--quolt-accent`, `--quolt-accent-fg` |
| State | `--quolt-selection`, `--quolt-hover`, `--quolt-active` |
| Typography | `--quolt-font`, `--quolt-font-mono`, `--quolt-font-size`, `--quolt-line-height` |
| Spacing | `--quolt-radius`, `--quolt-gap-1`, `--quolt-gap-2`, `--quolt-gap-3` |

### Default tokens (sketch — final values TBD with design)

```css
[data-quolt-theme='light'] {
  --quolt-bg: #ffffff;
  --quolt-text: #1a1a1a;
  --quolt-muted: #6b7280;
  --quolt-border: #e5e7eb;
  --quolt-accent: #7c5cff;
  --quolt-toolbar-bg: #f9fafb;
  --quolt-selection: rgba(124, 92, 255, 0.15);
  --quolt-code-bg: #f4f4f7;
  --quolt-radius: 8px;
}

[data-quolt-theme='dark'] {
  --quolt-bg: #14161d;
  --quolt-text: #e6e6ec;
  --quolt-muted: #8b8fa3;
  --quolt-border: #2a2d3a;
  --quolt-accent: #7c5cff;
  --quolt-toolbar-bg: #1c1f2a;
  --quolt-selection: rgba(124, 92, 255, 0.25);
  --quolt-code-bg: #1c1f2a;
  --quolt-radius: 8px;
}
```

### Customization

Override any token at any scope:

```css
.my-editor-wrapper {
  --quolt-accent: #ff5c7c;
  --quolt-radius: 4px;
  --quolt-font: 'Inter', sans-serif;
}
```

For total control, use `theme="none"` and write your own CSS over Quill's DOM. The selector taxonomy will be documented.

### Theme system roadmap

1. **Build `packages/core/theme/` CSS** — light + dark variants, exposed as the subpath import `'quolt-core/theme.css'`.
2. **Add `theme` prop** to `<QuoltEditor>` in `quolt-vue` — sets `data-quolt-theme` and listens for `prefers-color-scheme` when `auto`.
3. **`useQuoltTheme()` composable** — reactive `{ theme: 'light' | 'dark', setTheme(value) }` for surrounding UI that wants to follow the editor's theme.
4. **Document tokens** in `apps/docs/guide/theming.md`.
5. **Playground theme switcher** — toolbar in `apps/playground` for dogfooding.

This is the #1 next milestone — biggest visual differentiation for the least implementation risk.

---

## React adapter plan

The React package mirrors `quolt-vue` structurally — a thin wrapper over `quolt-core` that adapts React's rendering model into the same `mount/update/destroy` contract `defineEmbed` already accepts.

### Package layout

```
packages/react/
├── src/
│   ├── index.ts
│   ├── QuoltEditor.tsx
│   ├── useQuolt.ts
│   ├── defineComponentEmbed.ts
│   ├── context.ts
│   └── internal.ts
├── package.json
└── tsconfig.json
```

### `<QuoltEditor>` component

```tsx
<QuoltEditor
  value={html}
  onChange={setHtml}
  formats={[mention, callout]}
  placeholder="..."
  onReady={(editor) => editorRef.current = editor}
/>
```

Controlled by `value` + `onChange` (the React equivalent of v-model). Uses `useEffect` to create + destroy the editor; uses `useRef` for the container element. Echo loops are broken by the same flag pattern as the Vue version.

### `defineComponentEmbed` (React)

```ts
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { defineEmbed } from 'quolt-core';
import { EditorContext } from './context';

export function defineComponentEmbed<V>(config) {
  return defineEmbed<V>({
    ...config,
    render(container, value, ctx) {
      let current = value;
      const root: Root = createRoot(container);
      const draw = () => {
        root.render(
          createElement(EditorContext.Provider, { value: ctx.editor },
            createElement(config.component, { value: current })
          )
        );
      };
      draw();
      return {
        update(next) { current = next; draw(); },
        destroy() { root.unmount(); },
      };
    },
  });
}
```

### `useQuolt()` hook

```ts
import { useContext } from 'react';
import { EditorContext } from './context';

export function useQuolt() {
  return useContext(EditorContext);  // QuoltEditor | null
}
```

Inside the host component, the context is provided by `<QuoltEditor>` via `<EditorContext.Provider>`. Inside an embed, the per-embed React root supplies its own provider.

### React-specific risks

- **Concurrent rendering / Suspense** — `createRoot.render` is asynchronous and batched. For embeds with frequent updates (mention chips refreshing every few hundred ms), we should ensure `root.render` is called inside a microtask, never inside a Quill synchronous mutation hook.
- **StrictMode double-render** — the embed's effect runs twice in dev. Make sure `mount` is idempotent (it is — `createRoot` plus `render` is repeatable; second render replaces first).
- **React 19 server components** — out of scope; the editor is client-only.

### When to start

After `quolt-vue` ships v0.1 and the API has settled — currently estimated as roadmap step 7. No work needs to happen in `quolt-core` to enable it; the render contract already abstracts the framework.

---

## Status

### Done

- Monorepo scaffolded with pnpm workspaces
- `packages/core`, `packages/vue` exist with publishConfig src/dist split
- Shared `tsconfig.base.json` (strict, ESM, bundler resolution)
- **Layer 2 API skeleton** — `QuoltEditor` class with `format`, `insert`, `content`, `selection` groups
- **`on/off` event mapping** — `change` ↔ `text-change`, `selection` ↔ `selection-change`
- **`defineEmbed` primitive** — declarative (`toDOM`) and renderer-based (`render`) paths
- **Vue adapter** — `<QuoltEditor>` with v-model, `useQuolt()` composable, `defineComponentEmbed`
- **Playground** — `apps/playground` (Vite + Vue) with mention chip + divider demos
- **Vitest** — root config + happy-dom + core smoke tests
- **VitePress docs** — `apps/docs` skeleton with getting-started, custom-formats, component-embeds, API reference

### In progress / next up

**Themes (priority #1 — visual differentiation)**
- Default light + dark CSS shipped from `packages/core/theme/`
- CSS custom property token taxonomy
- `theme` prop on `<QuoltEditor>` (`auto` | `light` | `dark` | `none`)
- `useQuoltTheme()` composable
- Playground theme switcher

**Custom marks and blocks (signatures stubbed, implementation pending)**
- `defineMark` wrapper-class generation (Inline + Attributor pipeline)
- `defineBlock` wrapper-class generation (BlockBlot pipeline)
- Built-in marks: highlight, color, font-size, font-family
- Built-in blocks: callout, code-block-with-language *(toggle blocks intentionally dropped — see "Optional block-level UX modules" above)*

**Optional block UX modules (on-demand, not speculative)**
- `transforms` — markdown shortcuts (smallest, highest value)
- `slashMenu` — only if users ask
- `blockChrome` — only if users ask
- `reorder` — only if users ask

**Toolbar**
- Toolbar preset registry — `toolbar="minimal" | "full" | string[]`
- Component-based toolbar (Vue first)

**Tests**
- Vue component tests (mount, v-model echo, embed mount/unmount)
- Theme-switching tests

**Tooling**
- tsup or unbuild for production bundling (currently plain tsc)
- Changesets for versioning + publishing

**Publishing & ops**
- First commit + push to GitHub
- Claim the `@quolt` npm scope (publish first package)
- Initial `0.0.1` release

**React package**
- See "React adapter plan" above.

## Roadmap (suggested order)

1. **Verify the current build** — `pnpm typecheck`, `pnpm test`, and `pnpm play` should all work end to end. Playground is the visual gate.
2. **Theme system (light + dark)** — default CSS, token taxonomy, `theme` prop, `useQuoltTheme()`. Biggest visual win for the effort, and the thing that most clearly differentiates Quolt from raw Quill.
3. **`defineMark` and `defineBlock` wrapper-class generation** — finish the primitives the signatures already promise.
4. **Toolbar presets + `toolbar` prop** — `"minimal"`, `"full"`, custom array.
5. **Vue component tests + Vitest UI mode.**
6. **First publish** — `quolt-core` + `quolt-vue` at `0.0.1`. Claim the `@quolt` scope on npm.
7. **Optional block-UX modules** — only if real users request them. Default order: `transforms` → `slashMenu` → `blockChrome` → `reorder`.
8. **React package** — once the Vue version is stable and the core API has settled.
9. **Svelte package** — same trigger.

## Future considerations (not blockers)

- **Move to `@quolt/*` scope long-term** vs keeping unscoped names. Decision deferred — current plan is to ship unscoped first and add scoped re-exports.
- **GitHub org `quolt`** is squatted; could file a name-claim with GitHub support if the project takes off and the squatter is still inactive.
- **Plugin system / custom formats / custom blots** — covered by `defineX` primitives above. Plugin packages (`@quolt/plugin-collab`, `@quolt/plugin-markdown`) would compose these.
- **Markdown export/import** — common ask, not in Quill core; would compose `defineBlock` + a serializer.
- **Collaborative editing** — out of scope for now (Quill has no native support; would need Yjs/Automerge integration).
