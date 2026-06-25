# 🍹 Mocktail

> Mix ideas into interactive mocks.

Mocktail helps agents turn ideas, documents, PRDs, and conversations into interactive mocks.

Each mock is a single self-contained `index.html` that people can click through. Screens respond to actions, flows progress naturally, and a floating cue guides viewers through the experience. No backend required.

The look and feel is completely customizable. Change a few design tokens and the same mock can match a startup landing page, an enterprise dashboard, or an existing product design system.

## Install

```shell
/plugin marketplace add renyitan/mocktail
/plugin install mocktail@renyitan
```

That's it. Mocktail is now available to any agent in your CLI.

Update later with:

```shell
/plugin marketplace update
```

Or pin it as a dependency:

```json
{
  "dependencies": ["github:renyitan/mocktail"]
}
```

## Use It

Describe what you want in plain language:

```text
make an interactive mock of this document

create a prototype for a customer onboarding flow

mock what we just discussed

turn this PRD into a clickable experience
```

The agent generates a standalone mock that can be shared, reviewed, and iterated on immediately.

## What You Get

* Clickable, multi-step user flows
* A floating cue that guides viewers through the experience
* Agent-style interactions such as typing, thinking, and status updates
* Responsive layouts that scale to fit the viewport
* A single self-contained `index.html`

## Re-skin in One Edit

```html
<div
  class="app"
  style="
    --brand:#0d9488;
    --brand-hover:#0f766e;
    --brand-soft:#ccfbf1;
  "
>
```

Override a few design tokens and the entire experience follows.

Colors, typography, spacing, radius, and component styling all derive from shared tokens. Conversation-specific primitives (avatars, bubbles, threads, agent messages) live in an optional `conversation.css`, so non-conversational mocks stay lightweight.

## Project Layout

```text
.claude-plugin/        plugin + marketplace manifests

skills/mocktail/
├── SKILL.md           Authoring patterns, rules, and guidance
└── kit/
    ├── kit.css        Design tokens and neutral components
    ├── mock.js        Interaction runtime
    ├── conversation.css
    ├── render.mjs     Offline PNG renderer
    ├── verify.mjs     State verification and screenshot capture
    └── examples/      Reference patterns and templates
```

## Offline Rendering (Optional)

Mocktail normally renders through the Playwright MCP.

```bash
cd skills/mocktail

npm i playwright
npx playwright install chromium

node kit/render.mjs kit/examples/gallery.html "#app" out.png 2

node kit/verify.mjs <mock.html> <mock.steps.json> ./states 2
```
