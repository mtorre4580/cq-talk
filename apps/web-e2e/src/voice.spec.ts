import { expect, test } from '@playwright/test';

// The real policy: the cloud voice must work within connect-src
test.use({ bypassCSP: false });

/** A short silent WAV (16-bit mono PCM), enough for the browser to decode and play. */
const silentWav = (seconds = 0.3, sampleRate = 8000): Buffer => {
  const samples = Math.round(seconds * sampleRate);
  const data = samples * 2;
  const wav = Buffer.alloc(44 + data);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + data, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(data, 40);
  return wav;
};

test('the operator speaks with the ElevenLabs voice through the radio', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (m.text().includes('Content Security Policy')) violations.push(m.text());
  });
  const requests: { url: string; key?: string; body: Record<string, unknown> }[] = [];
  await page.route('https://api.elevenlabs.io/**', async (route) => {
    const request = route.request();
    requests.push({
      url: request.url(),
      key: (await request.allHeaders())['xi-api-key'],
      body: request.postDataJSON() as Record<string, unknown>,
    });
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav() });
  });
  await page.addInitScript(() => {
    localStorage.setItem('cq-talk:locale', 'es');
    localStorage.setItem('cq-talk:sound', 'on');
    localStorage.setItem('cq-talk:voice-provider', 'elevenlabs');
    localStorage.setItem('cq-talk:elevenlabs-key', 'sk_test_voice');
    localStorage.setItem('cq-talk:elevenlabs-voice', 'operator-voice');
    // Count any fallback to the browser voice
    (window as unknown as { systemVoice: number }).systemVoice = 0;
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (utterance) => {
      (window as unknown as { systemVoice: number }).systemVoice++;
      speak(utterance);
    };
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');

  // Demo QSO: the first operator line arrives at 3 s and is spoken with the cloud voice
  await page.getByRole('button', { name: /Mundial 2026/ }).click();
  await expect.poll(() => requests.length, { timeout: 10_000 }).toBeGreaterThan(0);

  const first = requests[0]!;
  expect(first.url).toBe(
    'https://api.elevenlabs.io/v1/text-to-speech/operator-voice?output_format=mp3_44100_128',
  );
  expect(first.key).toBe('sk_test_voice');
  expect(first.body).toMatchObject({ model_id: 'eleven_flash_v2_5' });
  expect(String(first.body['text'])).toContain('CQ, CQ, this is');

  // Give the decoded clip time to play: the browser voice must never be used
  await page.waitForTimeout(1500);
  expect(
    await page.evaluate(() => (window as unknown as { systemVoice: number }).systemVoice),
  ).toBe(0);
  expect(violations).toEqual([]);
});
