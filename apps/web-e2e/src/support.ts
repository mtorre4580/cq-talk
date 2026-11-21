import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** WCAG 2.2 AA violations on the current page, one readable line each. */
export const axeViolations = async (page: Page): Promise<string[]> => {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`);
};

/**
 * Loads every declared font face up front. Screens that appear later (the QSL card) would
 * otherwise be measured with a fallback font while theirs is still downloading.
 */
export const loadAllFonts = (page: Page) =>
  page.evaluate(() => Promise.all([...document.fonts].map((font) => font.load())).then(() => {}));

/**
 * Opens the app in Spanish (the prototype's language) with sound off, a controllable clock and
 * no decorative motion, so screens can be audited and measured deterministically.
 */
export const openApp = async (page: Page) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('cq-talk:locale', 'es');
    localStorage.setItem('cq-talk:sound', 'off');
  });
  await page.goto('./');
  // The fake clock also freezes CSS animations on their first frame: switch them off entirely
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });
  await loadAllFonts(page);
};

/** Rounded box of the first element matching the locator. */
export const box = async (page: Page, selector: string) => {
  const b = await page.locator(selector).first().boundingBox();
  if (!b) throw new Error(`No box for ${selector}`);
  return {
    x: Math.round(b.x),
    y: Math.round(b.y),
    w: Math.round(b.width),
    h: Math.round(b.height),
  };
};
