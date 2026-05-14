# Design

Component designs for Quolt, produced in Claude Design and handed off to Claude Code.

## Convention

- `inbox/` — fresh handoff bundles or HTML exports from Claude Design. Drop new designs here.
- `shipped/` — designs that have been implemented. Move folders here once the corresponding component lands.

Each design lives in its own folder: `inbox/<component-name>-v<n>/` (e.g. `inbox/toolbar-v1/`, `inbox/system-foundation/`).

## Handing off a design

1. In Claude Design, generate the handoff bundle (or "Send to Claude Code").
2. Drop the bundle in `design/inbox/<name>/`.
3. Either:
   - Tell Claude Code in chat: *"build the design in `design/inbox/<name>`"*, or
   - Open a GitHub issue: *"@claude implement `design/inbox/<name>` — open a PR against main"*.
4. Once the PR lands, move the folder to `design/shipped/<name>/`.

## Decoding a Claude Design bundle

Claude Design exports a single self-extracting `.html` file with the assets gzip+base64-encoded inside. To inspect the raw markup, CSS tokens, or asset list, run the local decoder:

```bash
node design/scripts/extract-bundle.mjs "design/inbox/<name>/<bundle>.html"
```

That writes `template.html` and each asset (fonts, images, etc.) to a sibling `_extracted/` folder you can grep through normally. The decoder is only needed for inspection — the `.html` file itself opens fine in a browser.

## Source of truth

- Visual direction, token taxonomy, component roadmap → `PLAN.md` (`Themes` and `Status` sections)
- Coding conventions and workspace layout → `CLAUDE.md`

The design system foundation (palette, type scale, spacing, radii, focus ring) is the canonical reference every later component inherits. Pin it in Claude Design so future prompts can say *"match the system from <link>"*.
