import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@cq-talk/i18n';
import { createLogbook, memoryBackend } from '@cq-talk/storage';
import type { QslRecord } from '@cq-talk/storage';
import { LogbookPage } from './LogbookPage';

const record: QslRecord = {
  id: 'qsl-1',
  savedAt: '2026-11-21T15:30:00.000Z',
  mode: 'live',
  topic: 'Mundial 2026',
  call: 'JA1·AI',
  stationId: 'tokyo',
  freq: '7.074',
  duration: '03:20',
  fixes: 2,
  total: 5,
  report: {
    errors: [{ said: 'I think is', better: 'I think it’s', why: 'El sujeto no se omite.' }],
    vocabulary: [],
    practice: [],
  },
};

const logbookWith = async (...records: QslRecord[]) => {
  const logbook = createLogbook(async () => memoryBackend());
  for (const r of records) await logbook.save(r);
  return logbook;
};

const inSpanish = (ui: React.ReactElement) =>
  render(<I18nProvider initial="es">{ui}</I18nProvider>);

describe('LogbookPage', () => {
  it('lists saved cards as links', async () => {
    const logbook = await logbookWith(record);
    inSpanish(
      <LogbookPage
        logbook={logbook}
        onBack={() => {}}
        renderLink={(r, children, className) => (
          <a href={`/qsl/${r.id}`} className={className}>
            {children}
          </a>
        )}
      />,
    );
    const link = await screen.findByRole('link', { name: /Mundial 2026/ });
    expect(link).toHaveAttribute('href', '/qsl/qsl-1');
    expect(link).toHaveTextContent('JA1·AI · 7.074 MHz · 03:20');
    expect(link).toHaveTextContent('2 de 5 corregidas');
  });

  it('invites a first QSO when empty and goes back to the radio', async () => {
    const onBack = vi.fn();
    inSpanish(
      <LogbookPage logbook={await logbookWith()} onBack={onBack} renderLink={() => null} />,
    );
    expect(
      await screen.findByText('Todavía no hay tarjetas: hacé tu primer QSO.'),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'VOLVER A LA RADIO' }));
    expect(onBack).toHaveBeenCalled();
  });
});
