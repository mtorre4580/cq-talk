import { renderHook } from '@testing-library/react';
import { demoScript } from '@cq-talk/qso';
import type { SpeechOutput } from '@cq-talk/speech';
import { useOperatorVoice } from './useOperatorVoice';

const fakeVoice = () => {
  const said: string[] = [];
  const output: SpeechOutput = {
    supported: true,
    speak: vi.fn(async (text: string) => {
      said.push(text);
    }),
    cancel: vi.fn(),
  };
  return { output, said };
};

describe('useOperatorVoice', () => {
  const script = demoScript('Mundial 2026', 'JA1·AI');

  it('reads each new operator line once, over static', async () => {
    const { output, said } = fakeVoice();
    const stopHiss = vi.fn();
    const hiss = vi.fn(() => stopHiss);
    const { rerender } = renderHook(
      ({ log }) => useOperatorVoice(log, { enabled: true, hiss, output }),
      { initialProps: { log: script.slice(0, 1) } },
    );
    rerender({ log: script.slice(0, 2) });
    rerender({ log: script.slice(0, 3) });
    await Promise.resolve();
    expect(said).toEqual([script[0]!.text, script[2]!.text]);
    expect(hiss).toHaveBeenCalledTimes(2);
    expect(stopHiss).toHaveBeenCalled();
  });

  it('stays silent with the sound off and cuts off when the QSO ends', () => {
    const { output, said } = fakeVoice();
    const { rerender } = renderHook(
      ({ enabled }) =>
        useOperatorVoice(script.slice(0, 1), { enabled, hiss: () => () => {}, output }),
      { initialProps: { enabled: false } },
    );
    expect(said).toEqual([]);
    expect(output.cancel).toHaveBeenCalled();
    rerender({ enabled: true });
  });
});
