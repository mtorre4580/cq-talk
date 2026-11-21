import { createSpeechOutput, pickVoice, voiceScore } from './speechOutput';

const voice = (lang: string) => ({ lang, name: lang }) as SpeechSynthesisVoice;

class FakeUtterance {
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

describe('speech output', () => {
  it('prefers a US English voice, then any English one', () => {
    expect(pickVoice([voice('es-AR'), voice('en-GB'), voice('en-US')])?.lang).toBe('en-US');
    expect(pickVoice([voice('es-AR'), voice('en-AU')])?.lang).toBe('en-AU');
    expect(pickVoice([voice('es-AR')])).toBeNull();
  });

  it('speaks English and resolves when the utterance ends', async () => {
    const spoken: FakeUtterance[] = [];
    const synth = {
      getVoices: () => [voice('en-US')],
      speak: (u: FakeUtterance) => {
        spoken.push(u);
        u.onend?.();
      },
      cancel: vi.fn(),
    } as unknown as SpeechSynthesis;
    const output = createSpeechOutput(
      synth,
      FakeUtterance as unknown as typeof SpeechSynthesisUtterance,
    );
    await output.speak('Roger that. Over.');
    expect(spoken[0]).toMatchObject({ text: 'Roger that. Over.', lang: 'en-US' });
    output.cancel();
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('resolves right away without speech synthesis', async () => {
    const output = createSpeechOutput(undefined, undefined);
    expect(output.supported).toBe(false);
    await expect(output.speak('Hello')).resolves.toBeUndefined();
  });

  const named = (name: string, lang = 'en-US') => ({ name, lang });

  // The en-US voices macOS Chrome reported, in its order (Spanish system locale)
  const MAC_VOICES = [
    'Albert',
    'Bad News',
    'Bahh',
    'Bells',
    'Boing',
    'Bubbles',
    'Buenas noticias',
    'Cellos',
    'Eddy (inglés (Estados Unidos))',
    'Flo (inglés (Estados Unidos))',
    'Fred',
    'Grandma (inglés (Estados Unidos))',
    'Grandpa (inglés (Estados Unidos))',
    'Jester',
    'Junior',
    'Kathy',
    'Organ',
    'Ralph',
    'Reed (inglés (Estados Unidos))',
    'Rocko (inglés (Estados Unidos))',
    'Samantha',
    'Sandy (inglés (Estados Unidos))',
    'Shelley (inglés (Estados Unidos))',
    'Superstar',
    'Trinoids',
    'Whisper',
    'Wobble',
    'Zarvox',
  ].map((name) => named(name));

  it('never lets a macOS novelty voice like Albert win', () => {
    expect(pickVoice(MAC_VOICES)?.name).toBe('Samantha');
    expect(voiceScore(named('Albert'))).toBeLessThan(0);
    expect(voiceScore(named('Zarvox'))).toBeLessThan(0);
  });

  it('prefers Google and natural voices on Chrome and Windows', () => {
    expect(pickVoice([...MAC_VOICES, named('Google US English')])?.name).toBe('Google US English');
    expect(
      pickVoice([
        named('Microsoft David - English (United States)'),
        named('Microsoft Aria Online (Natural) - English (United States)'),
      ])?.name,
    ).toBe('Microsoft Aria Online (Natural) - English (United States)');
  });

  it('takes a clear synthetic voice before leaving it to the browser', () => {
    expect(pickVoice([named('Albert'), named('Reed (English (US))')])?.name).toBe(
      'Reed (English (US))',
    );
    expect(pickVoice([named('Albert'), named('Zarvox')])).toBeNull();
  });

  it('waits for the browser to load its voices before the first line', async () => {
    let voices: ReturnType<typeof named>[] = [];
    const listeners: (() => void)[] = [];
    const spoken: FakeUtterance[] = [];
    const synth = {
      getVoices: () => voices,
      addEventListener: (_: string, cb: () => void) => listeners.push(cb),
      removeEventListener: vi.fn(),
      speak: (u: FakeUtterance) => {
        spoken.push(u);
        u.onend?.();
      },
      cancel: vi.fn(),
    } as unknown as SpeechSynthesis;
    const output = createSpeechOutput(
      synth,
      FakeUtterance as unknown as typeof SpeechSynthesisUtterance,
    );
    const speaking = output.speak('CQ, CQ. Over.');
    voices = MAC_VOICES;
    listeners.forEach((cb) => cb());
    await speaking;
    expect(spoken[0]?.voice).toMatchObject({ name: 'Samantha' });
  });
});
