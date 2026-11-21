import { expect, test } from '@playwright/test';
import { box, openApp } from './support';

/**
 * Element boxes measured on the design prototype (docs/prototype, rendered with
 * `pnpm prototype:render`) at 1280×900. The app must land on the same pixels, ±2 px.
 */
const PROTOTYPE = {
  home: {
    plate: { x: 133, y: 78, w: 292, h: 34 },
    meter: { x: 133, y: 135, w: 244, h: 134 },
    display: { x: 211, y: 290, w: 532, h: 58 },
    call: { x: 757, y: 291, w: 150, h: 56 },
    firstKey: { x: 133, y: 397, w: 186, h: 66 },
    microphone: { x: 982, y: 244, w: 180, h: 270 },
  },
  call: {
    station: { x: 133, y: 287, w: 774, h: 96 },
    log: { x: 230, y: 440, w: 820, h: 315 },
    microphone: { x: 982, y: 74, w: 180, h: 270 },
  },
  report: {
    card: { x: 260, y: 40, w: 760, h: 845 },
    download: { x: 448, y: 905, w: 242, h: 48 },
    newQso: { x: 701, y: 905, w: 131, h: 48 },
  },
};

const near = (name: string, actual: Record<string, number>, expected: Record<string, number>) => {
  for (const key of Object.keys(expected)) {
    expect
      .soft(
        Math.abs((actual[key] ?? NaN) - (expected[key] ?? NaN)),
        `${name}.${key}: got ${JSON.stringify(actual)}, prototype ${JSON.stringify(expected)}`,
      )
      .toBeLessThanOrEqual(2);
  }
};

test('the app lands on the prototype pixels on every screen', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Measured at the 1280×900 desktop viewport');
  await openApp(page);

  near('home.plate', await box(page, 'h1 >> xpath=..'), PROTOTYPE.home.plate);
  near('home.meter', await box(page, 'svg[role=img] >> xpath=..'), PROTOTYPE.home.meter);
  near('home.display', await box(page, '#topic >> xpath=..'), PROTOTYPE.home.display);
  near('home.call', await box(page, 'form:has(#topic) button[type=submit]'), PROTOTYPE.home.call);
  near(
    'home.firstKey',
    await box(page, 'ul[aria-labelledby=weekly] button'),
    PROTOTYPE.home.firstKey,
  );
  near('home.microphone', await box(page, 'button[aria-label] svg'), PROTOTYPE.home.microphone);

  await page.getByRole('button', { name: /Mundial 2026/ }).click();
  // Separate steps: React registers the call clock only after the preset's timeout renders
  await page.clock.runFor(750);
  await page.clock.runFor(12_000);
  near(
    'call.station',
    await box(page, '[role=status]:visible >> xpath=../..'),
    PROTOTYPE.call.station,
  );
  near('call.log', await box(page, 'section[aria-labelledby=log-title]'), PROTOTYPE.call.log);
  near('call.microphone', await box(page, 'button[aria-label] svg'), PROTOTYPE.call.microphone);

  await page
    .getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' })
    .click();
  await page.clock.runFor(1200);
  near('report.card', await box(page, 'article'), PROTOTYPE.report.card);
  near(
    'report.download',
    await box(page, 'button:has-text("DESCARGAR")'),
    PROTOTYPE.report.download,
  );
  near('report.newQso', await box(page, 'button:has-text("NUEVO")'), PROTOTYPE.report.newQso);
});
