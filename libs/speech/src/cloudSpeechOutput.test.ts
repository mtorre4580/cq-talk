import { createCloudSpeechOutput } from './cloudSpeechOutput';
import type { Playback } from './cloudSpeechOutput';
import type { SpeechOutput } from './speechOutput';

const fallback = (): SpeechOutput & { said: string[] } => {
  const said: string[] = [];
  return { said, supported: true, speak: async (t) => void said.push(t), cancel: vi.fn() };
};

const playback = (): Playback & { end: () => void } => {
  let end = () => {};
  const done = new Promise<void>((resolve) => {
    end = resolve;
  });
  return { done, end: () => end(), stop: vi.fn(() => end()) };
};

describe('createCloudSpeechOutput', () => {
  it('synthesizes, plays through the radio and resolves when the voice ends', async () => {
    const backup = fallback();
    const voice = playback();
    const output = createCloudSpeechOutput({
      synthesize: async () => new ArrayBuffer(4),
      play: async () => voice,
      fallback: backup,
    });
    let finished = false;
    const speaking = output.speak('Copy that. Over.').then(() => {
      finished = true;
    });
    await vi.waitFor(() => expect(voice.stop).not.toHaveBeenCalled());
    expect(finished).toBe(false);
    voice.end();
    await speaking;
    expect(backup.said).toEqual([]);
  });

  it('falls back to the system voice when the cloud fails', async () => {
    const backup = fallback();
    const output = createCloudSpeechOutput({
      synthesize: async () => {
        throw new Error('401');
      },
      play: async () => null,
      fallback: backup,
    });
    await output.speak('Copy that. Over.');
    expect(backup.said).toEqual(['Copy that. Over.']);
  });

  it('falls back when the audio cannot be played', async () => {
    const backup = fallback();
    const output = createCloudSpeechOutput({
      synthesize: async () => new ArrayBuffer(4),
      play: async () => null,
      fallback: backup,
    });
    await output.speak('Hello. Over.');
    expect(backup.said).toEqual(['Hello. Over.']);
  });

  it('stops the voice when cut off, without falling back', async () => {
    const backup = fallback();
    const voice = playback();
    const output = createCloudSpeechOutput({
      synthesize: async () => new ArrayBuffer(4),
      play: async () => voice,
      fallback: backup,
    });
    const speaking = output.speak('A long transmission. Over.');
    await vi.waitFor(() => expect(output).toBeTruthy());
    await new Promise((r) => setTimeout(r, 0));
    output.cancel();
    await speaking;
    expect(voice.stop).toHaveBeenCalled();
    expect(backup.said).toEqual([]);
  });
});
