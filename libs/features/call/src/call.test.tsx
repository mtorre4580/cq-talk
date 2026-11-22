import { render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';
import { demoScript, STATIONS } from '@cq-talk/qso';
import type { ReactElement } from 'react';
import { ConversationLog } from './ConversationLog';
import { StationHeader } from './StationHeader';
import { StationReadout } from './StationReadout';

const renderIn = (ui: ReactElement, locale: Locale = 'es') =>
  render(<I18nProvider initial={locale}>{ui}</I18nProvider>);

const tokyo = STATIONS[0]!;

describe('StationHeader', () => {
  it('shows the station, its city, the frequency, the clock and the status', () => {
    renderIn(<StationHeader station={tokyo} freq="7.074" elapsed={75} status="your-turn" />);
    expect(screen.getByText('EN CONTACTO CON')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'JA1·AI' })).toBeInTheDocument();
    expect(screen.getByText('Tokio, Japón · operador IA')).toBeInTheDocument();
    expect(screen.getByText('· 7.074 MHz')).toBeInTheDocument();
    expect(screen.getByText('01:15')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Recibiendo · tu turno');
  });

  it('translates the city and status', () => {
    renderIn(<StationHeader station={tokyo} freq="7.074" elapsed={0} status="tuning" />, 'en');
    expect(screen.getByText('Tokyo, Japan · AI operator')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tuning…');
  });
});

describe('StationReadout', () => {
  it('repeats the call sign, frequency and clock on the receiver, hidden from screen readers', () => {
    const { container } = renderIn(<StationReadout call="JA1·AI" freq="7.074" elapsed={12} />);
    const line = container.querySelector('[aria-hidden="true"]');
    expect(line).toHaveTextContent('JA1·AI7.074 MHz00:12');
  });
});

describe('ConversationLog', () => {
  const script = demoScript('Mundial 2026', 'JA1·AI');

  it('prints who said each line, the fixes and the well-said ones', () => {
    renderIn(<ConversationLog entries={script.slice(0, 6)} call="JA1·AI" />);
    const log = screen.getByRole('region', { name: 'LOG DE LA CONVERSACIÓN' });
    const lines = within(log).getAllByRole('listitem');
    expect(lines).toHaveLength(6);
    expect(lines[0]).toHaveTextContent(/^JA1·AICQ, CQ, this is JA1·AI/);
    expect(lines[1]).toHaveTextContent(/^VOSI think is a very interesting topic/);
    expect(lines[1]).toHaveTextContent('✎ Mejor: I think it’s a really interesting topic');
    expect(lines[5]).toHaveTextContent('✓ Copiado 5 y 9: bien dicho');
  });

  it('keeps the whole conversation (the list scrolls)', () => {
    renderIn(<ConversationLog entries={script} call="JA1·AI" />);
    const lines = screen.getAllByRole('listitem');
    expect(lines).toHaveLength(7);
    expect(lines[6]).toHaveTextContent('Can you give me a recent example?');
  });

  it('marks the conversation as English for screen readers', () => {
    renderIn(<ConversationLog entries={script.slice(0, 1)} call="JA1·AI" />);
    expect(screen.getByText(/CQ, CQ, this is/)).toHaveAttribute('lang', 'en');
  });
});
