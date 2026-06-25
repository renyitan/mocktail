#!/usr/bin/env node
/* ============================================================
   render.mjs — render a kit mock (or any element) to a crisp PNG
   ------------------------------------------------------------
   The offline / scriptable renderer. The primary interactive path
   is Playwright MCP (see SKILL.md); this is the no-MCP fallback.

   USAGE
     node render.mjs <html-file> <css-selector> [out.png] [scale]
   EXAMPLE
     node render.mjs examples/agent-setup.html "#app" out.png 2

   NOTES
     - First run needs Chromium:  npm i playwright && npx playwright install chromium
     - scale defaults to 2 (retina). For a scaled-to-window frame,
       screenshot the inner #app (not the viewport) to get it crisp.
   ============================================================ */

import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import path from 'path';

const [, , htmlArg, selector, outArg, scaleArg] = process.argv;
if (!htmlArg || !selector) {
  console.error('usage: node render.mjs <html-file> <css-selector> [out.png] [scale]');
  process.exit(1);
}
const htmlPath = path.resolve(htmlArg);
const out = outArg || htmlPath.replace(/\.html?$/i, '.png');
const scale = Number(scaleArg) || 2;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: scale, viewport: { width: 1440, height: 1024 } });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });

const el = await page.$(selector);
if (!el) { console.error(`selector not found: ${selector}`); await browser.close(); process.exit(2); }
await el.screenshot({ path: out });
await browser.close();
console.log(`rendered ${selector} -> ${out} @${scale}x`);
