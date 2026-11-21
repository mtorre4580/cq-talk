import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const mediaQuery = (): MediaQueryList | null => {
  try {
    return window.matchMedia(QUERY);
  } catch {
    return null;
  }
};

const subscribe = (onChange: () => void) => {
  const mql = mediaQuery();
  mql?.addEventListener('change', onChange);
  return () => mql?.removeEventListener('change', onChange);
};

const getSnapshot = () => mediaQuery()?.matches ?? false;

/** Live `prefers-reduced-motion` flag that follows changes to the OS setting. */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, () => false);
