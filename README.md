# Quolt

A modern wrapper for Quill — beautiful defaults, a cleaner API, and idiomatic framework bindings. Vue first.

Quolt is a modern, open-source rich text editor built on top of Quill.js. It gives you a beautiful, themeable editor out of the box, and exposes its own clean, well-documented API for deep customization — without ever needing to learn Quill's internals.

Vue support ships first, with React and Svelte planned. MIT licensed, free forever.

## Packages

| Package | Description |
| --- | --- |
| [`quolt-core`](./packages/core) | Framework-agnostic core. Wraps Quill and exposes Quolt's own API. |
| [`quolt-vue`](./packages/vue) | Vue 3 wrapper. Thin idiomatic bindings over `quolt-core`. |

## Development

This is a [pnpm](https://pnpm.io) workspace monorepo.

```bash
pnpm install      # install all deps and link workspace packages
pnpm build        # build all packages
pnpm typecheck    # typecheck all packages
```

## License

[MIT](./LICENSE)
