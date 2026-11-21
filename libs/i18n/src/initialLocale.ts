import { storage } from '@cq-talk/platform';
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, matchLocale } from './locales';
import type { Locale } from './locales';

const browserLanguages = (): readonly string[] => {
  try {
    return navigator.languages.length ? navigator.languages : [navigator.language];
  } catch {
    return [];
  }
};

/** Stored choice, then the browser languages, then Spanish. */
export const initialLocale = (): Locale => {
  const stored = storage.get(LOCALE_STORAGE_KEY);
  if (isLocale(stored)) return stored;
  return matchLocale(browserLanguages()) ?? DEFAULT_LOCALE;
};
