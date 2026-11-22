import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@cq-talk/i18n';
import type { Locale } from '@cq-talk/i18n';
import { TopicForm } from './TopicForm';
import { WeeklyKeys } from './WeeklyKeys';

const setup = (query = '', locale: Locale = 'es') => {
  const handlers = { onQueryChange: vi.fn(), onCall: vi.fn(), onPreset: vi.fn() };
  render(
    <I18nProvider initial={locale}>
      <TopicForm query={query} onQueryChange={handlers.onQueryChange} onCall={handlers.onCall} />
      <WeeklyKeys onPreset={handlers.onPreset} />
    </I18nProvider>,
  );
  return handlers;
};

describe('TopicForm', () => {
  it('labels the topic display with the prototype question', () => {
    setup();
    expect(screen.getByLabelText('¿De qué querés hablar?')).toHaveAttribute(
      'placeholder',
      '¿De qué querés hablar?',
    );
  });

  it('reports typing and calls CQ with the current query', async () => {
    const user = userEvent.setup();
    const { onQueryChange, onCall } = setup('Mundial 2026');
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), '!');
    expect(onQueryChange).toHaveBeenLastCalledWith('Mundial 2026!');
    await user.click(screen.getByRole('button', { name: 'LLAMAR · CQ' }));
    expect(onCall).toHaveBeenCalledWith('Mundial 2026');
  });

  it('calls CQ with Enter from the display', async () => {
    const user = userEvent.setup();
    const { onCall } = setup('space');
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), '{Enter}');
    expect(onCall).toHaveBeenCalledWith('space');
  });
});

describe('WeeklyKeys', () => {
  it('lists the eight weekly frequencies in order', () => {
    setup();
    const list = screen.getByRole('list', { name: 'FRECUENCIAS DE LA SEMANA' });
    const keys = within(list).getAllByRole('button');
    expect(keys).toHaveLength(8);
    expect(keys[0]).toHaveTextContent('3.650Salud y ciencia');
    expect(keys[7]).toHaveTextContent('28.400Cine y series');
  });

  it('passes the translated label when a weekly frequency is pressed', async () => {
    const user = userEvent.setup();
    const { onPreset } = setup('', 'en');
    await user.click(screen.getByRole('button', { name: /Climate change/ }));
    expect(onPreset).toHaveBeenCalledWith(
      { id: 'climate', freq: '14.205', position: 44 },
      'Climate change',
    );
  });
});
