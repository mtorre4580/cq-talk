import { expect, test } from '@playwright/test';
import { axeViolations, openApp } from './support';

test('a demo QSO goes from the tuner to the QSL card and back', async ({ page }) => {
  await openApp(page);
  expect(await axeViolations(page)).toEqual([]);

  // Weekly frequency: the needle travels for 750 ms, then the call goes out
  await page.getByRole('button', { name: /Mundial 2026/ }).click();
  await page.clock.runFor(750);
  const status = page.getByRole('status');
  await expect(status).toHaveText('Sintonizando…');
  // The microphone is live (its caption hides on phones to leave room for the QSO)
  const mic = page.getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' });
  await expect(mic).toBeVisible();

  await page.clock.runFor(12_000);
  await expect(page.locator('time')).toHaveText('00:12');
  await expect(status).toHaveText('Transmitiendo…');
  const log = page.getByRole('region', { name: 'LOG DE LA CONVERSACIÓN' });
  await expect(log.getByRole('listitem')).toHaveCount(4);
  await expect(log).toContainText('✎ Mejor: What matters most to me');
  expect(await axeViolations(page)).toEqual([]);

  // Hang up from the microphone: 2.3 s while the set cools down and the rift closes, then the QSL
  await mic.click();
  await expect(status).toHaveText('73 · cerrando…');
  await page.clock.runFor(2300);
  const card = page.getByRole('article', { name: 'Mundial 2026' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('2 de 2');
  expect(await axeViolations(page)).toEqual([]);

  await page.getByRole('button', { name: 'NUEVO QSO' }).click();
  await expect(page.getByLabel('¿De qué querés hablar?')).toHaveValue('');
});

test('a typed topic calls with Enter and the page never scrolls sideways', async ({ page }) => {
  await openApp(page);
  await page.getByLabel('¿De qué querés hablar?').fill('Exploración espacial');
  await page.keyboard.press('Enter');
  await page.clock.runFor(3000);
  await expect(page.getByRole('status')).toHaveText('Recibiendo · tu turno');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
