import { matchLocale } from './locales';

describe('matchLocale', () => {
  it('maps regional tags to supported locales', () => {
    expect(matchLocale(['es-AR'])).toBe('es');
    expect(matchLocale(['pt-PT'])).toBe('pt-BR');
    expect(matchLocale(['en-GB'])).toBe('en');
  });

  it('uses the first supported language', () => {
    expect(matchLocale(['fr-FR', 'pt-BR', 'en'])).toBe('pt-BR');
  });

  it('returns null when nothing matches', () => {
    expect(matchLocale(['fr', 'de'])).toBeNull();
  });
});
