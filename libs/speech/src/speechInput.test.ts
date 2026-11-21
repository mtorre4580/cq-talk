import { createSpeechInput } from './speechInput';
import type { SpeechRecognitionLike } from './speechInput';

/** Fake recognizer: tests push results the way the browser would. */
const fakeRecognition = () => {
  const instances: FakeRecognition[] = [];
  class FakeRecognition implements SpeechRecognitionLike {
    lang = '';
    continuous = false;
    interimResults = false;
    onresult: SpeechRecognitionLike['onresult'] = null;
    onerror: SpeechRecognitionLike['onerror'] = null;
    onend: SpeechRecognitionLike['onend'] = null;
    starts = 0;
    stops = 0;
    constructor() {
      instances.push(this);
    }
    start() {
      this.starts++;
    }
    stop() {
      this.stops++;
    }
    abort() {
      this.stops++;
    }
    say(...chunks: [text: string, isFinal: boolean][]) {
      this.onresult?.({
        results: chunks.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript } })),
      });
    }
  }
  return { Recognition: FakeRecognition, instances };
};

const setup = () => {
  const fake = fakeRecognition();
  const handlers = { onInterim: vi.fn(), onTransmission: vi.fn(), onError: vi.fn() };
  const input = createSpeechInput({ ...handlers, Recognition: fake.Recognition });
  return { ...handlers, input, fake };
};

describe('createSpeechInput', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('listens in continuous English with interim results', () => {
    const { input, fake } = setup();
    input.listen();
    const r = fake.instances[0]!;
    expect(r).toMatchObject({ lang: 'en-US', continuous: true, interimResults: true, starts: 1 });
  });

  it('shows interim words and hands over the turn on "over"', () => {
    const { input, fake, onInterim, onTransmission } = setup();
    input.listen();
    const r = fake.instances[0]!;
    r.say(['I think', false]);
    expect(onInterim).toHaveBeenLastCalledWith('I think');
    r.say(['I think it is great over', true]);
    expect(onTransmission).toHaveBeenCalledWith('I think it is great. Over.');
    expect(r.stops).toBe(1);
  });

  it('hands over the turn after a pause without "over"', () => {
    const { input, fake, onTransmission } = setup();
    input.listen();
    fake.instances[0]!.say(['yes I agree', true]);
    vi.advanceTimersByTime(1499);
    expect(onTransmission).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onTransmission).toHaveBeenCalledWith('Yes I agree. Over.');
  });

  it('keeps the turn open when the browser ends recognition on its own', () => {
    const { input, fake } = setup();
    input.listen();
    const r = fake.instances[0]!;
    r.onend?.();
    expect(r.starts).toBe(2);
    input.stop();
    r.onend?.();
    expect(r.starts).toBe(2);
  });

  it('reports a blocked microphone and ignores normal silence', () => {
    const { input, fake, onError } = setup();
    input.listen();
    const r = fake.instances[0]!;
    r.onerror?.({ error: 'no-speech' });
    expect(onError).not.toHaveBeenCalled();
    r.onerror?.({ error: 'not-allowed' });
    expect(onError).toHaveBeenCalledWith('not-allowed');
  });

  it('says so where the browser has no speech recognition', () => {
    const onError = vi.fn();
    createSpeechInput({
      onInterim: vi.fn(),
      onTransmission: vi.fn(),
      onError,
      Recognition: null,
    }).listen();
    expect(onError).toHaveBeenCalledWith('unsupported');
  });
});
