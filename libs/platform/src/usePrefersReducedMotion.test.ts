import { act, renderHook } from '@testing-library/react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const mockMatchMedia = (initial: boolean) => {
  const listeners = new Set<() => void>();
  const mql = {
    matches: initial,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
  return {
    change(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb());
    },
  };
};

describe('usePrefersReducedMotion', () => {
  it('follows the media query', () => {
    const media = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => media.change(true));
    expect(result.current).toBe(true);
  });

  it('is false where matchMedia is missing', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });
});
