import { createElevenLabsClient, ELEVENLABS_MODEL, rankOperatorVoices } from './elevenLabs';
import type { ElevenLabsVoice } from './elevenLabs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('ElevenLabs client', () => {
  it('asks for English speech with the low-latency model and the key header', async () => {
    const fetchImpl = vi.fn(async () => new Response(new Uint8Array([1, 2, 3])));
    const audio = await createElevenLabsClient('xi-test', fetchImpl).synthesize(
      'Roger. Over.',
      'v1',
    );
    expect(new Uint8Array(audio)).toEqual(new Uint8Array([1, 2, 3]));
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.elevenlabs.io/v1/text-to-speech/v1?output_format=mp3_44100_128');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'xi-api-key': 'xi-test' });
    expect(JSON.parse(String(init.body))).toMatchObject({
      text: 'Roger. Over.',
      model_id: ELEVENLABS_MODEL,
    });
  });

  it('lists premade voices and skips malformed ones', async () => {
    const fetchImpl = vi.fn(async () =>
      json({
        voices: [
          { voice_id: 'a', name: 'Bill', description: 'warm', labels: { gender: 'male', age: 7 } },
          { name: 'no id' },
        ],
      }),
    );
    const voices = await createElevenLabsClient('xi-test', fetchImpl).listVoices();
    expect(voices).toEqual([
      { id: 'a', name: 'Bill', description: 'warm', labels: { gender: 'male' } },
    ]);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toContain('/v2/voices?category=premade');
  });

  it.each([
    [200, 'ok'],
    [401, 'invalid'],
    [403, 'forbidden'],
    [429, 'rate-limited'],
    [500, 'error'],
  ])('checks a key: HTTP %s is %s', async (status, expected) => {
    const fetchImpl = vi.fn(async () => json({ voices: [] }, status));
    expect(await createElevenLabsClient('xi-test', fetchImpl).check()).toBe(expected);
  });

  it('reports offline when the request cannot be made', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await createElevenLabsClient('xi-test', fetchImpl).check()).toBe('offline');
  });
});

describe('rankOperatorVoices', () => {
  const voice = (
    id: string,
    labels: Record<string, string>,
    description = '',
  ): ElevenLabsVoice => ({
    id,
    name: id,
    description,
    labels,
  });

  it('puts a mature, warm American man first', () => {
    const ranked = rankOperatorVoices([
      voice('young-woman', { gender: 'female', accent: 'american', age: 'young' }),
      voice('british-man', { gender: 'male', accent: 'british', age: 'middle aged' }),
      voice('operator', { gender: 'male', accent: 'american', age: 'middle_aged' }, 'warm, deep'),
      voice('young-american-man', { gender: 'male', accent: 'american', age: 'young' }),
    ]);
    expect(ranked.map((v) => v.id)).toEqual([
      'operator',
      'british-man',
      'young-american-man',
      'young-woman',
    ]);
  });
});
