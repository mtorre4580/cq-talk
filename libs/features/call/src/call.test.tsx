import { render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';
import { demoScript, STATIONS } from '@cq-talk/qso';
import type { ReactElement } from 'react';
import { ConversationLog } from './ConversationLog';
import { StationPanel } from './StationPanel';

const renderIn = (ui: ReactElement, locale: Locale = 'es') =>
  render(<I18nProvider initial={locale}>{ui}</I18nProvider>);

const tokyo = STATIONS[0]!;

describe('StationPanel', () => {
  it('shows the station, its city, the clock and the status', () => {
    renderIn(<StationPanel station={tokyo} elapsed={75} status="your-turn" />);
    expect(screen.getByText('EN CONTACTO CON')).toBeInTheDocument();
    expect(screen.getByText('JA1·AI')).toBeInTheDocument();
    expect(screen.getByText('Tokio, Japón · operador IA')).toBeInTheDocument();
    expect(screen.getByText('01:15')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Recibiendo · tu turno');
  });

  it('translates the city and status', () => {
    renderIn(<StationPanel station={tokyo} elapsed={0} status="tuning" />, 'en');
    expect(screen.getByText('Tokyo, Japan · AI operator')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Tuning…');
  });
});

describe('ConversationLog', () => {
  const script = demoScript('Mundial 2026', 'JA1·AI');

  it('prints who said each line, the fixes and the well-said ones', () => {
    renderIn(<ConversationLog entries={script.slice(0, 6)} call="JA1·AI" visible={6} />);
    const log = screen.getByRole('region', { name: 'LOG DE LA CONVERSACIÓN' });
    const lines = within(log).getAllByRole('listitem');
    expect(lines).toHaveLength(6);
    expect(lines[0]).toHaveTextContent(/^JA1·AI ▸ CQ, CQ, this is JA1·AI/);
    expect(lines[1]).toHaveTextContent(/^VOS ▸ I think is a very interesting topic/);
    expect(lines[1]).toHaveTextContent('✎ Mejor: I think it’s a really interesting topic');
    expect(lines[5]).toHaveTextContent('✓ Copiado 5 y 9: bien dicho');
  });

  it('keeps only the last four lines, like the paper in the prototype', () => {
    renderIn(<ConversationLog entries={script} call="JA1·AI" />);
    const lines = screen.getAllByRole('listitem');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveTextContent('Can you give me a recent example?');
  });

  it('marks the conversation as English for screen readers', () => {
    renderIn(<ConversationLog entries={script.slice(0, 1)} call="JA1·AI" />);
    expect(screen.getByText(/CQ, CQ, this is/)).toHaveAttribute('lang', 'en');
  });
});
