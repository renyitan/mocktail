# mocktail

A **plugin** for Copilot CLI and Claude Code that makes interactive UI mocks. Think clickable, animated prototypes for
feeling out a flow before anyone builds it. Each one is a single self-contained `index.html` driven
by a tiny JS state machine, on a **swappable design system**. The look is an *input* you set by
overriding `:root` tokens, not something hardcoded.

The skill (`skills/mocktail/SKILL.md`) carries the full technique. In short:

- **Two rules.** Disambiguate before building, and always float a cue showing where to click next.
- **The kit** (`skills/mocktail/kit/`) is a neutral, token-driven design system (`kit.css`), an
  interaction runtime (`mock.js`) exposing the patterns as helpers, an optional chat add-on
  (`conversation.css`), offline renderers (`render.mjs` plus a reusable `verify.mjs` steps-driver),
  and a neutral pattern catalog (`examples/gallery.html`) to copy from.
- **Swappable look.** Re-skin in one edit by overriding the brand, ink, and radius tokens. Point them
  at a named system, values read off a screenshot, a generated palette, or just keep the default.

This repo is the canonical home, and it's meant to be used by more than one agent. Keep it neutral.
Product-specific looks belong in the consumer's skin, not here.

## Install / consume

This repo is both the **plugin** and a single-plugin **marketplace** (it carries
`.claude-plugin/marketplace.json`). Consume it the native Copilot/Claude Code way:

```shell
/plugin marketplace add renyitan/mocktail
/plugin install mocktail@renyitan
```

The CLI copies the plugin into its plugin cache and tracks it in `config.json`. Refresh later with
`/plugin marketplace update`. The skill is then available to whatever agent runs in that CLI.

To give it your own design system, override the `:root` tokens with a brand skin, and optionally
layer a chrome add-on the way `conversation.css` does. The mechanics stay shared. Only the look
changes per consumer.

### As a git dependency

A plugin or agency manifest can also pull it in directly:

```json
{ "dependencies": ["github:renyitan/mocktail"] }
```

## Render & verify

The skill is self-contained and rendering is optional (Playwright MCP is the primary path). For the
offline path:

```bash
cd skills/mocktail && npm i playwright && npx playwright install chromium
node kit/render.mjs kit/examples/gallery.html "#app" out.png 2
node kit/verify.mjs <mock.html> <mock.steps.json> ~/Desktop/mock-states 2
```

`node_modules/` is git-ignored, and `package.json` pins the dep for a reproducible offline render.

## Design notes

Built from scratch as a neutral, re-skinnable kit. The defining choice is that the design system is
an input rather than something hardcoded, so the same mock can wear any look you hand it. Chat and
agent primitives are kept out of the core and live in the optional `conversation.css`, so a mock
that isn't a conversation carries none of that weight.
