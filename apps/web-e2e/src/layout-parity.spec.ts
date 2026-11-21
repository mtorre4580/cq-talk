import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { renderPrototype } from '../../../tools/prototype/render.mjs';
import { loadAllFonts, openApp } from './support';

/**
 * The app must land on the prototype's pixels. Both are measured in this run, in this browser,
 * so font rasterization differences between platforms (macOS vs the Linux CI) cancel out.
 * The prototype is rendered from docs/prototype with the app's own stylesheet, so both use the
 * same self-hosted font files.
 */

type Box = { x: number; y: number; w: number; h: number };
type Boxes = Record<string, Box>;

/** Elements to compare, found by the prototype's markup and by the app's semantics. */
const SCREENS = {
  home: {
    state: { screen: 'home' },
    prototype: {
      plate: `[...document.querySelectorAll('span')].find((s) => s.textContent === 'CQ talk').parentElement`,
      meter: `document.querySelector('svg[role=img]').parentElement`,
      display: `document.querySelector('#topic').parentElement`,
      call: `document.querySelector('button[type=submit]')`,
      firstKey: `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('Salud'))`,
      microphone: `document.querySelector('button.mic svg')`,
    },
    app: {
      plate: `document.querySelector('h1').parentElement`,
      meter: `document.querySelector('svg[role=img]').parentElement`,
      display: `document.querySelector('#topic').parentElement`,
      call: `document.querySelector('form:has(#topic) button[type=submit]')`,
      firstKey: `document.querySelector('ul[aria-labelledby=weekly] button')`,
      microphone: `document.querySelector('main button[aria-label] svg')`,
    },
  },
  call: {
    state: {
      screen: 'call',
      topic: 'Mundial 2026',
      freq: '7.074',
      pos: 17,
      st: 0,
      shown: 4,
      secs: 12,
    },
    prototype: {
      station: `[...document.querySelectorAll('span')].find((s) => s.textContent === 'EN CONTACTO CON').parentElement.parentElement`,
      log: `[...document.querySelectorAll('span')].find((s) => s.textContent === 'LOG DE LA CONVERSACIÓN').parentElement`,
      microphone: `document.querySelector('button.mic svg')`,
    },
    app: {
      station: `[...document.querySelectorAll('[role=status]')].find((s) => s.checkVisibility()).parentElement.parentElement`,
      log: `document.querySelector('section[aria-labelledby=log-title]')`,
      microphone: `document.querySelector('main button[aria-label] svg')`,
    },
  },
  report: {
    state: {
      screen: 'report',
      topic: 'Mundial 2026',
      freq: '7.074',
      pos: 17,
      st: 0,
      shown: 4,
      secs: 12,
    },
    prototype: {
      card: `document.querySelector('div[style*="max-width: 760px"]')`,
      download: `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('DESCARGAR'))`,
      newQso: `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('NUEVO'))`,
    },
    app: {
      card: `document.querySelector('article')`,
      download: `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('DESCARGAR'))`,
      newQso: `[...document.querySelectorAll('button')].find((b) => b.textContent.includes('NUEVO'))`,
    },
  },
} as const;

const measure = (page: Page, selectors: Record<string, string>): Promise<Boxes> =>
  page.evaluate((entries) => {
    const result: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const [name, expression] of entries) {
      const element = new Function(`return ${expression}`)() as Element | null;
      if (!element) throw new Error(`Not found: ${name}`);
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

const NO_MOTION =
  '*, *::before, *::after { animation: none !important; transition: none !important; }';

/** Opens the prototype in the given state, on the app's origin, with the app's stylesheet. */
const openPrototype = async (page: Page, state: Record<string, unknown>) => {
  await page.goto('./');
  const stylesheet = await page.locator('link[rel=stylesheet]').first().getAttribute('href');
  const url = new URL(`__prototype/${String(state['screen'])}.html`, page.url()).toString();
  await page.route(url, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: renderPrototype(state, { stylesheet: new URL(stylesheet!, page.url()).pathname }),
    }),
  );
  await page.goto(url);
  await page.addStyleTag({ content: NO_MOTION });
  await loadAllFonts(page);
};

const compare = (screen: string, app: Boxes, prototype: Boxes) => {
  for (const [name, expected] of Object.entries(prototype)) {
    const actual = app[name]!;
    for (const key of ['x', 'y', 'w', 'h'] as const) {
      expect
        .soft(
          Math.abs(actual[key] - expected[key]),
          `${screen}.${name}.${key}: app ${JSON.stringify(actual)}, prototype ${JSON.stringify(expected)}`,
        )
        .toBeLessThanOrEqual(2);
    }
  }
};

test('the app lands on the prototype pixels on every screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Measured at the 1280×900 desktop viewport');

  const prototype: Record<string, Boxes> = {};
  for (const [name, screen] of Object.entries(SCREENS)) {
    await openPrototype(page, screen.state);
    prototype[name] = await measure(page, screen.prototype);
  }

  await openApp(page);
  compare('home', await measure(page, SCREENS.home.app), prototype['home']!);

  await page.getByRole('button', { name: /Mundial 2026/ }).click();
  // Separate steps: React registers the call clock only after the preset's timeout renders
  await page.clock.runFor(750);
  await page.clock.runFor(12_000);
  compare('call', await measure(page, SCREENS.call.app), prototype['call']!);

  await page
    .getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' })
    .click();
  await page.clock.runFor(1200);
  compare('report', await measure(page, SCREENS.report.app), prototype['report']!);
});
