# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Very early scaffold. `QuoltEditor` in `packages/core` currently only wraps `new Quill(...)` and exposes a `quill` escape hatch — none of the Layer 2 API (`format.*`, `insert.*`, `content.*`, `selection.*`, `on/off`) exists yet. See `PLAN.md` for the full roadmap; treat it as the source of truth for design decisions and update it when those decisions change.

## Commands

This is a pnpm 10 workspace (Node >=18). All scripts run from the repo root and fan out to packages via `pnpm -r --filter=./packages/*`.

```bash
pnpm install      # install + link workspace packages
pnpm build        # build all packages (tsc / vue-tsc emit to dist/)
pnpm dev          # watch-mode tsc across packages
pnpm typecheck    # tsc --noEmit / vue-tsc --noEmit
pnpm clean        # rimraf dist + node_modules/.cache in each package
```

Per-package commands (run inside `packages/core` or `packages/vue`): `pnpm build`, `pnpm dev`, `pnpm typecheck`, `pnpm clean`. `packages/vue` uses `vue-tsc`; `packages/core` uses plain `tsc`.

No test runner is wired up yet (Vitest is planned).

## Architecture — three layers

```
Layer 3  <QuoltEditor /> component   (packages/vue, future packages/react)
Layer 2  QuoltEditor class — Quolt's own framework-agnostic API   (packages/core)
Layer 1  Quill engine — hidden, reachable via editor.quill escape hatch
```

Design discipline:
- **Framework wrappers stay thin.** Vue/React/Svelte packages only adapt the core `QuoltEditor` class idiomatically. New behavior belongs in `packages/core`, not in a framework wrapper.
- **Re-export Quill concepts with better names.** Don't make users learn Quill internals; expose the same capability through Quolt's API surface, keep `editor.quill` as a documented but discouraged escape hatch.
- Build Layer 2 incrementally — ship the 20% users actually need (bold/italic/headings/lists/links/images, get/set content, change event) before wrapping the rest.

## Workspace mechanics

- `packages/vue` depends on `quolt-core` via `workspace:*`. Vue imports from `'quolt-core'` resolve to the linked package, not a published version.
- **`publishConfig` pattern (non-obvious):** each package's `package.json` points `main`/`types`/`exports` at `./src/index.ts` for local development, and overrides them to `./dist/...` at publish time via `publishConfig`. This is why downstream packages can import TS source directly during dev — don't "fix" the entry points to point at `dist/` for the dev case.
- `pnpm-workspace.yaml` includes `apps/*`, but no `apps/` directory exists yet. `apps/playground` (Vite sandbox) is the first planned app per the roadmap.

## TypeScript

Root `tsconfig.base.json` is strict ESM (`module: ESNext`, `moduleResolution: Bundler`, `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `isolatedModules`). Each package extends it and only sets `outDir`/`rootDir` (+ `jsx: preserve` for vue). Because `verbatimModuleSyntax` is on, type-only imports must use `import type`.
