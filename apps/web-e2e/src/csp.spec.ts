import { expect, test } from '@playwright/test';

// The real policy, as users get it
test.use({ bypassCSP: false });

test('the production build ships a strict Content Security Policy and never trips it', async ({
  page,
}) => {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('Content Security Policy')) violations.push(message.text());
  });
  await page.goto('./');
  const csp = await page
    .locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content');
  expect(csp).toContain("connect-src 'self' https://api.anthropic.com");
  expect(csp).toContain("script-src 'self'");
  expect(csp).toContain("style-src 'self'");

  // Walk every screen: inline React styles, fonts and the lazy SDK chunk must all be allowed
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole('button', { name: /Mundial 2026|World Cup 2026|Copa do Mundo 2026/ })
    .click();
  await expect(page.getByRole('status')).toBeVisible();
  await page.locator('button[aria-label]').first().click();
  await expect(page.getByRole('article')).toBeVisible({ timeout: 5000 });
  expect(violations).toEqual([]);
});
