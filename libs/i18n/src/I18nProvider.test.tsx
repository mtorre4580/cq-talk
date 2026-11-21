import { act, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider, useI18n } from './I18nProvider';
import { initialLocale } from './initialLocale';

const Probe = () => {
  const { t, locale } = useI18n();
  return (
    <p>
      {locale}: {t('footer.logbook')}
    </p>
  );
};

describe('I18nProvider', () => {
  it('translates with the forced locale', () => {
    render(
      <I18nProvider initial="en">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByText('en: My QSLs')).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });

  it('stores the chosen locale', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nProvider initial="es">{children}</I18nProvider>
    );
    const { result } = renderHook(() => useI18n(), { wrapper });
    act(() => result.current.setLocale('pt-BR'));
    expect(result.current.t('footer.logbook')).toBe('Meus QSL');
    expect(initialLocale()).toBe('pt-BR');
  });

  it('throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useI18n())).toThrow(/I18nProvider/);
  });
});
