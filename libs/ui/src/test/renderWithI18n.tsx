import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';

/**
 * Renders inside the Spanish dictionary (the prototype's language) unless told otherwise.
 * The provider is a `wrapper`, so `rerender` keeps it.
 */
export const renderWithI18n = (ui: ReactElement, locale: Locale = 'es'): RenderResult =>
  render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <I18nProvider initial={locale}>{children}</I18nProvider>
    ),
  });
