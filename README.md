# mocktail

> Create interactive mocks on Copilot CLI and Claude Code, re-skinnable to any brand or design system.

A mock is a single self-contained `index.html`: a small JS state machine the viewer
clicks through, so a flow *responds* before anyone builds the real thing. Buttons advance
state, a floating cue always points at the next click, and there's no backend to wire up.

The look is an **input, not a default**. Every component reads `:root` tokens, so one edit
re-skins the whole mock. Hand it a brand, a screenshot to match, or keep the neutral kit.

## Install

```shell
/plugin marketplace add renyitan/mocktail
/plugin install mocktail@renyitan
```

That's it. The skill is now available to any agent in that CLI. Update later with
`/plugin marketplace update`.

Prefer a manifest dependency? Pin it directly:

```json
{ "dependencies": ["github:renyitan/mocktail"] }
```

## Use it

Just ask in plain language:

```
make an interactive mock of this doc
mock what we just discussed
```

## What you get

Eight interaction patterns, all provided as helpers so the agent calls them instead of
re-implementing the mechanics:

- **Floating CTA cue** that always shows where to click next
- **Typewriter intros** and a **"thinking" indicator** for agent-style flows
- **Status ticks** that spin then resolve, and **staggered reveals** for preview rows
- **Scale-to-fit** and **feed auto-scroll** so it reads right at any window size

## Re-skin in one edit

```html
<!-- same kit, different brand -->
<div class="app" style="--brand:#0d9488; --brand-hover:#0f766e; --brand-soft:#ccfbf1">
```

Override the brand, ink, and radius tokens and the whole mock follows. Chat primitives
(thread, avatar, bubble) live in an optional `conversation.css`, so a mock that isn't a
conversation carries none of that weight.

## Layout

```
.claude-plugin/        plugin + marketplace manifests
skills/mocktail/
  SKILL.md             the full technique (rules, patterns, gotchas)
  kit/
    kit.css            design tokens + neutral components
    mock.js            the interaction runtime (patterns as helpers)
    conversation.css   optional chat/agent add-on
    render.mjs         offline PNG renderer
    verify.mjs         drives a mock through a steps file, shoots each state
    examples/          neutral pattern gallery to copy from
```

## Render offline (optional)

Rendering normally runs through the Playwright MCP. For a standalone render:

```bash
cd skills/mocktail && npm i playwright && npx playwright install chromium
node kit/render.mjs kit/examples/gallery.html "#app" out.png 2
node kit/verify.mjs <mock.html> <mock.steps.json> ./states 2
```

`node_modules/` is git-ignored. `package.json` pins the dependency for a reproducible render.
