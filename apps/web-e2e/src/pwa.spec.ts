import { expect, test } from '@playwright/test';

// The real policy: the service worker and manifest must load within it
test.use({ bypassCSP: false, serviceWorkers: 'allow' });

test('the app is an installable PWA with an offline shell', async ({ page, context }) => {
  await page.goto('./');

  // Manifest: name, standalone display, the night background and a maskable icon
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const manifest = await (await page.request.get(new URL(href!, page.url()).toString())).json();
  expect(manifest).toMatchObject({
    name: 'CQ talk',
    display: 'standalone',
    background_color: '#05080D',
    theme_color: '#05080D',
  });
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      expect.objectContaining({ sizes: '192x192' }),
    ]),
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    'href',
    /apple-touch-icon-180x180\.png$/,
  );

  // The service worker takes control and serves the shell offline
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeVisible();
  await context.setOffline(false);
});
