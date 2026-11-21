import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Real browser: unlike the jsdom suite, color contrast is checked here
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ page }) => {
  // Static audits: no decorative motion mid-check
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('home loads and has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeAttached();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
});

test('the page never scrolls horizontally', async ({ page }) => {
  await page.goto('./');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
