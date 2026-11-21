import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@cq-talk/i18n';
import { createLogbook, memoryBackend } from '@cq-talk/storage';
import type { QslRecord } from '@cq-talk/storage';
import { SavedQsl } from './SavedQsl';

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

describe('SavedQsl', () => {
  it('reprints a saved card in the reader’s language', async () => {
    inSpanish(<SavedQsl logbook={await logbookWith(record)} id="qsl-1" onBack={() => {}} />);
    const card = await screen.findByRole('article', { name: 'Mundial 2026' });
    expect(card).toHaveTextContent('Tokio, Japón');
    expect(card).toHaveTextContent('El sujeto no se omite.');
    expect(screen.getByRole('button', { name: 'VOLVER A MIS QSL' })).toBeInTheDocument();
  });

  it('says so when the card is gone', async () => {
    inSpanish(<SavedQsl logbook={await logbookWith()} id="nope" onBack={() => {}} />);
    expect(await screen.findByText('No encontramos esa tarjeta.')).toBeInTheDocument();
  });
});
