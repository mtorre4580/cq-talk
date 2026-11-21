import { useCallback, useRef, useSyncExternalStore } from 'react';
import { readSettings, subscribeSettings } from './settings';
import type { Settings } from './settings';

/** Live settings for every component, kept in sync across tabs. */
export const useSettings = (defaultModel: string): Settings => {
  const cache = useRef<Settings | null>(null);
  const getSnapshot = useCallback(() => {
    const next = readSettings(defaultModel);
    const prev = cache.current;
    // Same values must return the same object or React re-renders forever
    if (prev && prev.apiKey === next.apiKey && prev.model === next.model) return prev;
    cache.current = next;
    return next;
  }, [defaultModel]);
  return useSyncExternalStore(subscribeSettings, getSnapshot, getSnapshot);
};
