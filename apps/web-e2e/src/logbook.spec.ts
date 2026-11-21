import { expect, test } from '@playwright/test';

// The real policy: the PDF export must work within it
test.use({ bypassCSP: false });

test('a printed card lands in Mis QSL and downloads as a PDF', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) violations.push(m.text());
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    localStorage.setItem('cq-talk:locale', 'es');
    localStorage.setItem('cq-talk:sound', 'off');
  });
  await page.goto('./');

  // A short demo QSO: call, then hang up right away
  await page.getByLabel('¿De qué querés hablar?').fill('Exploración espacial');
  await page.keyboard.press('Enter');
  await page
    .getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' })
    .click();
  await expect(page.getByRole('article', { name: 'Exploración espacial' })).toBeVisible();

  await page.getByRole('link', { name: 'Mis QSL' }).click();
  await expect(page).toHaveURL(/\/cq-talk\/qsl$/);
  await expect(page.getByRole('heading', { name: 'MIS QSL' })).toBeVisible();
  await page.getByRole('link', { name: /Exploración espacial/ }).click();
  await expect(page).toHaveURL(/\/cq-talk\/qsl\/[0-9a-f-]+$/);

  // A saved card opened directly (deep link) still loads
  await page.reload();
  const card = page.getByRole('article', { name: 'Exploración espacial' });
  await expect(card).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'DESCARGAR QSL (PDF)' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('cq-talk-qsl-exploracion-espacial.pdf');
  const pdf = await download.createReadStream();
  const head = await new Promise<string>((resolve) =>
    pdf.once('data', (chunk) => resolve(String(chunk).slice(0, 5))),
  );
  expect(head).toBe('%PDF-');

  await page.getByRole('button', { name: 'VOLVER A MIS QSL' }).click();
  await expect(page).toHaveURL(/\/cq-talk\/qsl$/);
  expect(violations).toEqual([]);
});
