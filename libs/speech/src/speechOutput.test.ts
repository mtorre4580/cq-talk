import { createSpeechOutput, pickVoice } from './speechOutput';

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
});
