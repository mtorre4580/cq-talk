export type Locale = 'es' | 'en' | 'pt-BR';

/** The prototype is written in Spanish, so Spanish is the default and the source of truth. */
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_STORAGE_KEY = 'locale';

export interface LocaleInfo {
  id: Locale;
  /** Name of the language in that language */
  label: string;
}

export const locales: readonly LocaleInfo[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt-BR', label: 'Português (Brasil)' },
];

export const isLocale = (value: unknown): value is Locale => locales.some((l) => l.id === value);

/** Maps browser language tags (`es-AR`, `pt-PT`, `en-GB`…) to a supported locale. */
export const matchLocale = (tags: readonly string[]): Locale | null => {
  for (const tag of tags) {
    const lang = tag.toLowerCase().split('-')[0];
    if (lang === 'es') return 'es';
    if (lang === 'pt') return 'pt-BR';
    if (lang === 'en') return 'en';
  }
  return null;
};
