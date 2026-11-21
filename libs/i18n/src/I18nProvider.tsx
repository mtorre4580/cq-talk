import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { storage } from '@cq-talk/platform';
import { initialLocale } from './initialLocale';
import { LOCALE_STORAGE_KEY } from './locales';
import type { Locale } from './locales';
import { messages } from './messages';
import type { Messages } from './messages';
import { translate } from './translate';
import type { MessageKey, Params } from './translate';

export type TranslationKey = MessageKey<Messages>;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Params) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
  /** Forces a starting locale (tests); otherwise the stored choice or the browser language */
  initial?: Locale;
}

export const I18nProvider = ({ children, initial }: I18nProviderProps) => {
  const [locale, setLocaleState] = useState<Locale>(() => initial ?? initialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    storage.set(LOCALE_STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Params) => translate(messages[locale], locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
};
