#!/usr/bin/env node
/* ============================================================
   verify.mjs — drive an interactive mock through its states and
   screenshot each one, so you can eyeball every transition.
   ------------------------------------------------------------
   Reusable driver (no per-mock temp script). It reads a steps
   file describing the click-through and shoots each labelled state.

   USAGE
     node verify.mjs <html-file> <steps.json> [outDir] [scale]
   EXAMPLE
     node verify.mjs examples/agent-setup.html examples/agent-setup.steps.json ~/Desktop/mocktail-samples 2

   STEPS FILE  (JSON array; each step is one action)
     { "shot": "01-idle" }              screenshot the frame, named 01-idle.png
     { "click": "#approve" }            click a selector
     { "press": "Enter" }               press a key (focuses body first)
     { "type":  ["#field", "hello"] }   fill a field
     { "wait":  1200 }                  wait ms (let animations settle)
     { "hover": "#row3" }               hover a selector
   Optional top-of-file via CLI: the frame screenshotted for "shot"
   steps is "#app" by default; override per shot with
     { "shot": "03-done", "sel": "#panel" }

   NOTES
     - First run needs Chromium:  npm i playwright && npx playwright install chromium
     - Run from inside skills/mocktail/.
   ============================================================ */

import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { readFile, mkdir } from 'fs/promises';
import path from 'path';
import os from 'os';

const [, , htmlArg, stepsArg, outArg, scaleArg] = process.argv;
if (!htmlArg || !stepsArg) {
  console.error('usage: node verify.mjs <html-file> <steps.json> [outDir] [scale]');
  process.exit(1);
}
const htmlPath = path.resolve(htmlArg);
const steps = JSON.parse(await readFile(path.resolve(stepsArg), 'utf8'));
const outDir = (outArg || './mock-states').replace(/^~(?=$|\/)/, os.homedir());
const scale = Number(scaleArg) || 2;
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: scale, viewport: { width: 1440, height: 1024 } });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });

let n = 0;
for (const step of steps) {
  if ('wait' in step) await page.waitForTimeout(step.wait);
  else if ('click' in step) await page.click(step.click);
  else if ('hover' in step) await page.hover(step.hover);
  else if ('press' in step) { await page.locator('body').focus().catch(() => {}); await page.keyboard.press(step.press); }
  else if ('type' in step) await page.fill(step.type[0], step.type[1]);
  else if ('shot' in step) {
    const sel = step.sel || '#app';
    const el = await page.$(sel);
    const file = path.join(outDir, `${step.shot}.png`);
    if (el) await el.screenshot({ path: file });
    else await page.screenshot({ path: file });
    console.log(`  shot ${step.shot} (${sel}) -> ${file}`);
    n++;
  }
}
await browser.close();
console.log(`verify: ${n} states captured in ${outDir}`);
