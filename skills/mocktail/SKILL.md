---
name: mocktail
description: >
  Use to make an interactive UI mock — "mock this up", "make a clickable prototype", "show me how
  this flow would feel", "build a mock of the onboarding", "prototype this screen". Produces a
  self-contained `index.html` driven by a tiny JS state machine: the user clicks through a real
  flow with floating cues, typewriter intros, "thinking" indicators, staggered reveals, and status
  ticks — on a **swappable design system** (the look is an input, not hardcoded). Interactive mocks
  only — for static diagrams use `diagram`. Output: a self-contained HTML file (+ PNG states).
---

# mocktail

A mocktail is a **clickable mock**: a single self-contained HTML page where a small, guarded JS
state machine walks the viewer through a real flow. It looks finished and it *responds* — buttons
advance state, a floating cue always says where to click next — but there's no backend. It's for
feeling out a flow before anyone builds it.

Two things make a good mocktail: the **design system** (how it looks — an input you confirm first)
and the **interaction technique** (how it feels — the patterns below, all provided by `mock.js`).

## Two rules

1. **Disambiguate before building.** A mock commits pixels to a decision, so get the decision right
   first. If the request is fuzzy, run one tight clarifying loop — *one* decision or question at a
   time, restate what you heard, confirm — then build. Don't mock five things hoping one lands.
2. **Always show where to click next.** Every step of the core flow floats a CTA cue over its next
   target. A mock with no cue is a screenshot; the cue is what makes it a walkthrough.

## First: confirm the design system

Before building, **always ask the operator which design system to use** — don't assume. The look is
an *input*. Present the four modes as options (recommend the neutral default):

1. **Neutral default** (recommended) — the kit's built-in brand-neutral tokens.
2. **Named / described** — a system or brand they name ("use Material 3", "our dark dashboard look").
3. **Inferred from reference** — they send screenshots of an existing UI; read the palette, type,
   radius, spacing, density by eye and set the tokens to match.
4. **Generated** — hand off to `design-consultation` (when present) to produce a token set.

Skip the question only when the operator already specified a system in the same request.

## Swappable design system

The kit is brand-neutral by default, and **re-skinning is one edit**: override the `:root` tokens in
`kit.css`, or inline on a wrapper. Every component reads tokens — never a hard-coded hex — so one
override re-skins the whole mock at once.

```html
<!-- re-skin inline: same kit, different brand -->
<div class="app" style="--brand:#0d9488; --brand-hover:#0f766e; --brand-soft:#ccfbf1; --brand-ink:#0f766e">
```

When inferring from screenshots, set the token groups in this order: **brand** (the one that matters
most), then the **ink/bg/line** neutral ramps, then **radius** and **type**. Match density by the
spacing scale, not by nudging individual paddings.

## The kit

Everything lives in `kit/`. The core presumes **no domain**:

```
kit/
  kit.css           tokens + neutral primitives (the design system)
  mock.js           the interaction runtime — patterns A–I as helpers
  conversation.css  OPTIONAL chat/agent add-on (thread/avatar/bubble) — link only for conversations
  render.mjs        offline single-state PNG renderer (Playwright)
  verify.mjs        drives a mock through a steps file, shoots each state
  examples/
    gallery.html    neutral catalog — every mechanic in isolation; copy tiles from here
```

**Primitives** (`kit.css`): `.app` shell (`.topbar` / `.sidebar` / `.content` / `.panel`),
`.card` (+ `.card-actions`), `.btn` (`.primary` / `.ghost` / `.role` / `.danger` / `.sm`),
`.field` / `.input` / `.textarea` / `.composer`, `.chip` / `.pill` / `.kbd`, `.pstep` (tick rows),
`.note`. Chat primitives (`.thread` / `.turn` / `.avatar` / `.bubble`) live in the optional
`conversation.css` — link it **only** when the mock is genuinely a conversation.

## The interaction technique — the scaffold + patterns

A mock is a **tiny guarded state machine**. Each transition advances `state`, renders the next
chunk, and moves the floating cue. Keep `id`s stable; a "↻ Restart" button is just
`onclick="location.reload()"`.

```js
let state = 'idle';
function go(next) { /* render the next chunk */ }
btn.addEventListener('click', () => { if (state === 'idle') { state = 'review'; go(); } });
```

`mock.js` injects its own behaviour CSS (reading the kit tokens) and exposes the patterns as helpers
— **don't re-implement the mechanics, call them**:

| | Pattern | Helper | Notes |
| --- | --- | --- | --- |
| **A** | Floating CTA cue | `Mock.cue(wrapId, label, where)` / `Mock.clearCue()` | `where` = `top`/`bottom`/`left`/`right`. Wrap the target in `.cuewrap` so the cue scales with the frame. **CSS arrow + text, never an emoji finger.** |
| **B** | Typewriter intro | `Mock.type(el, text, {speed, done})` | Types char-by-char with a blinking caret; into an element's text or an input's value. Float a cue in `done`. |
| **C** | Status ticks | `Mock.tick(stepEl)` | A `.pstep.run` shows a spinner ring; `tick()` swaps it to a **bare green tick** (`✓`, never a circled checkmark). |
| **E** | "Thinking" indicator | `Mock.thinking(text)` → node | A tight square cluster, **never bouncing dots**. Linger 2–3s before resolving. |
| **F** | Staggered reveal | `Mock.reveal(items, {each, gap, onEach, done})` | Reveal preview rows one at a time (`onEach(row,'ready')` fills the value); actions appear in `done`. |
| **G** | Scale-to-fit | `Mock.fit(appId, {w, h, reserveTop, reserveBottom})` | Build at a fixed design size, scale to the window. Never upscales past 1:1. `reserveTop` for a fixed intro header. |
| **H** | Feed auto-scroll | `Mock.follow(scrollEl)` → `scroll()` | Make the feed a scroll container; call `scroll()` after every append **and** every staged reveal tick. |

Two more, by composition (see `gallery.html`):

- **D — Fade transitions.** Add `.fade-up` (mock.js ships it) to anything you inject; `.btn:active`
  already nudges down 1px.
- **I — Intro header.** A full-width fixed bar *outside* the scaled frame (title + one-line
  description). Couples with G: top-anchor the frame and pass `reserveTop` into `fit()`.

### Gotchas (learned the hard way)

- **Cues clipped by rounded cards.** An ancestor with `overflow:hidden` (any rounded `.card`/`.app`)
  clips the cue. Add a `card-open` → `overflow:visible` modifier on **every** card class the cue
  lives inside.
- **Two actions, two colours.** A primary and a secondary/iterative action must not share a hue —
  same colour for two consequences is a usability bug. Primary stays `--brand`; secondary takes
  `.role` (a distinct hue).
- **Animation-shorthand collision.** Two equal-specificity rules both setting the `animation`
  shorthand silently clobber each other. Put both in one declaration.
- **Relative paths from `examples/`.** Link the kit as `../kit.css` and `../mock.js` (the example
  sits in `kit/examples/`, the kit in `kit/`).

## Rendering & verifying

**Primary — Playwright MCP** (interactive sessions): open the HTML, click through it live,
screenshot states. No install.

**Fallback — `render.mjs` / `verify.mjs`** (offline / scriptable / CI):

```bash
# first run only:
cd skills/mocktail && npm i playwright && npx playwright install chromium

# one static state (screenshot the scaled #app, not the viewport, for crispness):
node kit/render.mjs kit/examples/gallery.html "#app" out.png 2

# drive a whole flow and shoot each labelled state:
node kit/verify.mjs <mock.html> <mock.steps.json> ~/Desktop/mock-states 2
```

A `*.steps.json` is a list of actions (`click` / `press` / `type` / `hover` / `wait` / `shot`) — one
reusable driver, no per-mock temp script. `shot` defaults to the `#app` selector; override per shot
with `"sel"`. Always eyeball the states — animations and timing are easy to get subtly wrong.
`node_modules/` is git-ignored; `package.json` pins the dep.

## Landing the mock

A mock is usually an **output**, not a shipped artifact. Give it an obvious home: a throwaway for
quick review goes to the Desktop; a mock that belongs to a piece of work lives next to that work. If
a mock proves a flow worth keeping, say where it should live — don't leave it homeless. (A live
GitHub Pages preview is a possible later add.)

## Improving the kit (intake feedback)

This is a living kit. **Treat any operator feedback on a rendered mock as kit intake** — don't patch
the one mock and move on. For each piece of feedback:

1. **Fix at the most general level that addresses it** — a token in `kit.css`, then a primitive,
   then a helper in `mock.js`, then (last resort) the one mock. A fix in `mock.js`/`kit.css` improves
   *every* future mock.
2. **Re-render and verify** the affected states before calling it done.
3. **Log it** in the changelog below.

### Changelog

- **v1** — Built from first principles. A neutral, swappable design system (re-skin by overriding
  `:root` tokens), the two rules, the state-machine scaffold, and patterns A–I. Chat primitives are
  split into an optional `conversation.css` so the core stays domain-free. Ships a reusable
  `verify.mjs` steps-driver instead of per-mock temp scripts, and a neutral pattern `gallery.html`
  rather than a domain-specific example.
