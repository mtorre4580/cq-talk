import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { loadAllFonts, openApp } from './support';

/**
 * The radio page must land on the prototype's pixels (docs/prototype/index.html). Both are
 * measured in this run, in this browser, so font rasterization differences between platforms
 * (macOS vs the Linux CI) cancel out. The prototype is served with the app's own stylesheet
 * instead of Google Fonts, so both use the same self-hosted font files. The footers differ by
 * design (the app's has the language switcher) and are hidden on both, so the centered desk set
 * sits in the same place.
 */

type Key = 'x' | 'y' | 'w' | 'h';
type Box = Record<Key, number>;
interface Target {
  prototype: string;
  app: string;
  /** What to compare; text that differs by design (call signs) only compares position */
  keys?: readonly Key[];
}

const ALL: readonly Key[] = ['x', 'y', 'w', 'h'];

const HOME: Record<string, Target> = {
  cabinet: { prototype: '.cabinet', app: '.cq-cabinet' },
  mainDial: { prototype: '.window.main', app: '.cq-window-main' },
  nameplate: { prototype: '.nameplate', app: '.cq-nameplate' },
  readout: { prototype: '#tuner', app: '.cq-readout' },
  call: { prototype: '#tuner button', app: '.cq-call-button' },
  tuningKnob: { prototype: '#tune', app: '.cq-tune' },
  firstKey: { prototype: '.key', app: '.cq-key' },
  microphone: { prototype: '#mic svg', app: '.cq-mic svg' },
};

const CALL: Record<string, Target> = {
  cabinet: { prototype: '.cabinet', app: '.cq-cabinet' },
  readout: { prototype: '.readout', app: '.cq-readout' },
  windows: { prototype: '.windows', app: '.cq-windows' },
  nameplate: { prototype: '.nameplate', app: '.cq-nameplate' },
  controls: { prototype: '.controls', app: '.cq-controls' },
  microphone: { prototype: '#mic svg', app: '.cq-mic svg' },
  callSign: { prototype: '#q-call', app: '.cq-call-sign', keys: ['x', 'y', 'h'] },
  status: { prototype: '.status', app: '.cq-status', keys: ['x', 'y', 'h'] },
  // The prototype shows every demo line at once with reduced motion: compare where the list starts
  lines: { prototype: '#lines', app: '.cq-lines', keys: ['x', 'y', 'w'] },
};

const HIDE_FOOTERS = 'footer, .cq-footer, .tag { display: none !important; }';
const NO_MOTION =
  '*, *::before, *::after { animation: none !important; transition: none !important; }';

const PROTOTYPE = readFileSync(
  new URL('../../../docs/prototype/index.html', import.meta.url),
  'utf8',
);

const measure = (page: Page, selectors: Record<string, string>): Promise<Record<string, Box>> =>
  page.evaluate((entries) => {
    const result: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const [name, selector] of entries) {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`Not found: ${name} (${selector})`);
      const b = element.getBoundingClientRect();
      result[name] = {
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.round(b.width),
        h: Math.round(b.height),
      };
    }
    return result;
  }, Object.entries(selectors));

const side = (targets: Record<string, Target>, which: 'prototype' | 'app') =>
  Object.fromEntries(Object.entries(targets).map(([name, target]) => [name, target[which]]));

/** Opens the prototype on the app's origin, with the app's stylesheet and no motion. */
const openPrototype = async (page: Page) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const stylesheet = await page.locator('link[rel=stylesheet]').first().getAttribute('href');
  const url = new URL('__prototype/index.html', page.url()).toString();
  // The artifact host wraps the page in a standards-mode document; without the doctype the
  // browser falls back to quirks mode and line boxes shrink
  const body =
    '<!doctype html>\n' +
    PROTOTYPE.replace(/<link[^>]*fonts\.(googleapis|gstatic)[^>]*>/gs, '').replace(
      '<style>',
      `<link rel="stylesheet" href="${new URL(stylesheet!, page.url()).pathname}" />\n<style>`,
    );
  await page.route(url, (route) => route.fulfill({ contentType: 'text/html', body }));
  await page.goto(url);
  await page.addStyleTag({ content: NO_MOTION + HIDE_FOOTERS });
  await loadAllFonts(page);
};

const compare = (
  screen: string,
  targets: Record<string, Target>,
  app: Record<string, Box>,
  prototype: Record<string, Box>,
) => {
  for (const [name, target] of Object.entries(targets)) {
    for (const key of target.keys ?? ALL) {
      const actual = app[name]!;
      const expected = prototype[name]!;
      expect
        .soft(
          Math.abs(actual[key] - expected[key]),
          `${screen}.${name}.${key}: app ${JSON.stringify(actual)}, prototype ${JSON.stringify(expected)}`,
        )
        .toBeLessThanOrEqual(2);
    }
  }
};

test('the radio page lands on the prototype pixels at home and on air', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Measured at the 1280×900 desktop viewport');

  await openPrototype(page);
  const prototypeHome = await measure(page, side(HOME, 'prototype'));
  await page.locator('.key', { hasText: 'Mundial 2026' }).click();
  // Reduced motion shortens the prototype's timers to 50 ms
  await page.clock.runFor(2000);
  const prototypeCall = await measure(page, side(CALL, 'prototype'));

  await openApp(page);
  await page.addStyleTag({ content: HIDE_FOOTERS });
  compare('home', HOME, await measure(page, side(HOME, 'app')), prototypeHome);

  await page.getByRole('button', { name: /Mundial 2026/ }).click();
  // Separate steps: React registers the call clock only after the preset's timeout renders
  await page.clock.runFor(750);
  await page.clock.runFor(12_000);
  compare('call', CALL, await measure(page, side(CALL, 'app')), prototypeCall);
});
