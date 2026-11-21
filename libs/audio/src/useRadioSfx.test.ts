import { act, renderHook } from '@testing-library/react';
import type { RadioSfx } from './radioSfx';
import { useRadioSfx } from './useRadioSfx';

const fakeSfx = (): RadioSfx => ({
  unlock: vi.fn(),
  tuneIn: vi.fn(),
  off: vi.fn(),
  dispose: vi.fn(),
});

describe('useRadioSfx', () => {
  it('is on by default and plays sounds', () => {
    const sfx = fakeSfx();
    const { result } = renderHook(() => useRadioSfx(sfx));
    expect(result.current.soundOn).toBe(true);
    result.current.tuneIn();
    result.current.off();
    expect(sfx.tuneIn).toHaveBeenCalledOnce();
    expect(sfx.off).toHaveBeenCalledOnce();
  });

  it('stays silent when muted and remembers the choice', () => {
    const sfx = fakeSfx();
    const { result, unmount } = renderHook(() => useRadioSfx(sfx));
    act(() => result.current.toggleSound());
    expect(result.current.soundOn).toBe(false);
    result.current.unlock();
    result.current.tuneIn();
    expect(sfx.unlock).not.toHaveBeenCalled();
    expect(sfx.tuneIn).not.toHaveBeenCalled();
    expect(localStorage.getItem('cq-talk:sound')).toBe('off');

    unmount();
    expect(sfx.dispose).toHaveBeenCalled();
    const again = renderHook(() => useRadioSfx(fakeSfx()));
    expect(again.result.current.soundOn).toBe(false);
  });
});
