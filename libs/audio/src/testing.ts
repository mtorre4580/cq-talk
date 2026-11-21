/**
 * Test double for `AudioContext` that records which audio nodes start, so tests can assert which
 * sound played without real audio. Import it from `@cq-talk/audio/testing` in tests only.
 */
export interface FakeAudio {
  ctx: AudioContext;
  /** Node kinds in the order they were started: `noise`, `oscillator` */
  started: string[];
  calls: { resume: number; close: number };
  /** Buffer sources in creation order; call `onended` on one to finish it */
  sources: { onended: (() => void) | null }[];
}

export const createFakeAudioContext = (state: AudioContextState = 'running'): FakeAudio => {
  const started: string[] = [];
  const calls = { resume: 0, close: 0 };
  const sources: { onended: (() => void) | null }[] = [];
  const noop = () => {};
  const param = () => ({
    value: 0,
    setValueAtTime: noop,
    linearRampToValueAtTime: noop,
    exponentialRampToValueAtTime: noop,
  });
  const node = (kind: string, extra: object = {}) => ({
    loop: false,
    ...extra,
    connect: (target: unknown) => target,
    start: () => {
      started.push(kind);
    },
    stop: noop,
  });
  const ctx = {
    state,
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    resume: () => {
      calls.resume++;
      return Promise.resolve();
    },
    close: () => {
      calls.close++;
      return Promise.resolve();
    },
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      const source = node('noise', { buffer: null, onended: null }) as ReturnType<typeof node> & {
        onended: (() => void) | null;
      };
      sources.push(source);
      return source;
    },
    decodeAudioData: (data: ArrayBuffer) =>
      data.byteLength > 0
        ? Promise.resolve({ duration: 1 })
        : Promise.reject(new DOMException('Unable to decode', 'EncodingError')),
    createWaveShaper: () => node('shaper', { curve: null, oversample: 'none' }),
    createDynamicsCompressor: () => node('compressor', { threshold: param(), ratio: param() }),
    createBiquadFilter: () =>
      node('filter', { type: '', Q: param(), frequency: param(), gain: param() }),
    createGain: () => node('gain', { gain: param() }),
    createOscillator: () => node('oscillator', { type: '', frequency: param() }),
  };
  return { ctx: ctx as unknown as AudioContext, started, calls, sources };
};

/** Installs a fake as the global `AudioContext` constructor; returns it and a restore function. */
export const installFakeAudioContext = (): FakeAudio & { restore: () => void } => {
  const fake = createFakeAudioContext();
  const previous = globalThis.AudioContext;
  globalThis.AudioContext = function FakeAudioContext() {
    return fake.ctx;
  } as unknown as typeof AudioContext;
  return {
    ...fake,
    restore: () => {
      globalThis.AudioContext = previous;
    },
  };
};
