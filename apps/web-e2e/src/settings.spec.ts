import { expect, test } from '@playwright/test';
import { axeViolations, openApp } from './support';

test('the key dialog opens from the footer, is accessible and closes with Escape', async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole('button', { name: 'Configurar key' }).click();
  const dialog = page.getByRole('dialog', { name: 'CONFIGURAR KEY' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('API KEY DE ANTHROPIC')).toBeVisible();
  await expect(dialog.getByRole('radio', { name: /Opus 5\.5/ })).toBeChecked();
  expect(await axeViolations(page)).toEqual([]);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('a key Anthropic rejects is never stored', async ({ page }) => {
  // No real network in tests: answer the free key check with a 401
  await page.route('https://api.anthropic.com/**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        type: 'error',
        error: { type: 'authentication_error', message: 'invalid x-api-key' },
      }),
    }),
  );
  await openApp(page);
  await page.getByRole('button', { name: 'Configurar key' }).click();
  await page.getByLabel('API KEY DE ANTHROPIC').fill('sk-ant-api03-not-a-real-key');
  await page.getByRole('button', { name: 'GUARDAR', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('status').first()).toHaveText(
    'Anthropic rechazó la key. Revisala y probá de nuevo.',
  );
  expect(await page.evaluate(() => localStorage.getItem('cq-talk:api-key'))).toBeNull();
});
