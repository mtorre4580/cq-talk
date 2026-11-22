import { expect, test } from '@playwright/test';
import { fakeAnthropic } from './fakeAnthropic';
import { axeViolations } from './support';

// The real policy: the live operator must work within connect-src
test.use({ bypassCSP: false });

test('a live QSO streams the operator, corrects the user and prints their QSL card', async ({
  page,
}) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) violations.push(m.text());
  });
  const api = await fakeAnthropic(page, [
    ['CQ, this is JA1·AI. ', 'I copy you loud and clear! Over.'],
    ['Great point. Why do you think so? Over.'],
  ]);
  await page.addInitScript(() => {
    localStorage.setItem('cq-talk:locale', 'es');
    localStorage.setItem('cq-talk:sound', 'off');
    localStorage.setItem('cq-talk:api-key', 'sk-ant-api03-test-key');
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  await page.getByLabel('¿De qué querés hablar?').fill('Mundial 2026');
  await page.keyboard.press('Enter');
  const log = page.getByRole('region', { name: 'LOG DE LA CONVERSACIÓN' });
  await expect(log).toContainText('I copy you loud and clear! Over.');

  // Chromium in CI has no speech recognition: the typed fallback takes over
  const transmission = page.getByLabel('Tu transmisión');
  await expect(transmission).toBeEnabled();
  expect(await axeViolations(page)).toEqual([]);
  await transmission.fill('I think is great');
  await page.keyboard.press('Enter');
  await expect(log.getByRole('listitem').nth(1)).toContainText('VOSI think is great. Over.');
  await expect(log).toContainText('✎ Mejor: I think it’s great.');
  await expect(log).toContainText('Why do you think so? Over.');

  await page
    .getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' })
    .click();
  const card = page.getByRole('article', { name: 'Mundial 2026' });
  await expect(card).toContainText('El sujeto no se omite.');
  await expect(card).toContainText('to weigh in on');

  // The SDK talked to Anthropic directly, with the user's key, at the agreed settings
  const first = api.requests[0]!;
  // SDK 1.x sends the API key as a bearer token
  expect(first.headers['authorization']).toBe('Bearer sk-ant-api03-test-key');
  expect(first.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
  expect(first.body).toMatchObject({ model: 'claude-opus-5-5', output_config: { effort: 'low' } });
  expect(violations).toEqual([]);
});
