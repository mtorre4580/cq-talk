import { render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nProvider } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';
import { ReportScreen } from './ReportScreen';
import { useDemoReport } from './useDemoReport';

const wrapper =
  (locale: Locale) =>
  ({ children }: { children: ReactNode }) => (
    <I18nProvider initial={locale}>{children}</I18nProvider>
  );

const contact = {
  topic: 'Mundial 2026',
  call: 'JA1·AI',
  place: 'Tokio, Japón',
  freq: '7.074',
  duration: '00:21',
  fixes: 2,
  total: 3,
};

describe('useDemoReport', () => {
  it('lists the prototype mistakes, vocabulary and practice in the UI language', () => {
    const { result } = renderHook(() => useDemoReport(2), { wrapper: wrapper('es') });
    expect(result.current.errors).toHaveLength(2);
    expect(result.current.errors[1]?.why).toMatch(/^“Discuss” no lleva “about”/);
    expect(result.current.vocabulary.map((v) => v.phrase)).toEqual([
      'to keep up with',
      'what matters most',
      'to weigh in on',
      'to catch someone’s eye',
    ]);
    expect(result.current.practice[0]).toBe('1. Armá 3 frases con “I’ve been + -ing + for…”.');
  });

  it('always shows at least one mistake, as the prototype does', () => {
    const { result } = renderHook(() => useDemoReport(0), { wrapper: wrapper('en') });
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0]?.why).toMatch(/^In English the subject is never dropped/);
  });
});

describe('ReportScreen', () => {
  const Screen = (props: {
    onDownload?: (card: HTMLElement, topic: string) => Promise<void>;
    onNewQso?: () => void;
  }) => {
    const report = useDemoReport(contact.fixes);
    return (
      <ReportScreen
        contact={contact}
        report={report}
        download={props.onDownload ?? (async () => {})}
        secondaryLabel="NUEVO QSO"
        onSecondary={props.onNewQso ?? (() => {})}
      />
    );
  };

  it('prints the contact on the card', () => {
    render(<Screen />, { wrapper: wrapper('es') });
    const card = screen.getByRole('article', { name: 'Mundial 2026' });
    expect(within(card).getByText('TARJETA QSL · CONFIRMO NUESTRO QSO')).toBeInTheDocument();
    const terms = within(card)
      .getAllByRole('term')
      .map((dt) => dt.textContent);
    const values = within(card)
      .getAllByRole('definition')
      .map((dd) => dd.textContent);
    expect(terms).toEqual(['A', 'DE', 'DESDE', 'FRECUENCIA', 'DURACIÓN', 'CORRECCIONES']);
    expect(values).toEqual(['Vos', 'JA1·AI', 'Tokio, Japón', '7.074 MHz', '00:21', '2 de 3']);
  });

  it('shows each mistake struck through with the better version', () => {
    render(<Screen />, { wrapper: wrapper('es') });
    const errors = screen.getByRole('heading', { name: 'ERRORES REGISTRADOS' }).parentElement!;
    expect(within(errors).getAllByRole('deletion')).toHaveLength(2);
    expect(within(errors).getAllByText('Mejor:')).toHaveLength(2);
  });

  it('offers the PDF and a new QSO', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn(async () => {});
    const onNewQso = vi.fn();
    render(<Screen onDownload={onDownload} onNewQso={onNewQso} />, { wrapper: wrapper('es') });
    await user.click(screen.getByRole('button', { name: 'DESCARGAR QSL (PDF)' }));
    await user.click(screen.getByRole('button', { name: 'NUEVO QSO' }));
    expect(onDownload).toHaveBeenCalledWith(screen.getByRole('article'), 'Mundial 2026');
    expect(onNewQso).toHaveBeenCalledOnce();
  });
});
