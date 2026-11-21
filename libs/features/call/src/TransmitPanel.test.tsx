import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@cq-talk/i18n';
import { TransmitPanel } from './TransmitPanel';
import type { TransmitPanelProps } from './TransmitPanel';

const setup = (props: Partial<TransmitPanelProps> = {}) => {
  const onSend = vi.fn();
  render(
    <I18nProvider initial="es">
      <TransmitPanel yourTurn listening={false} interim="" onSend={onSend} {...props} />
    </I18nProvider>,
  );
  return { onSend, user: userEvent.setup() };
};

describe('TransmitPanel', () => {
  it('shows what the microphone hears while listening', () => {
    setup({ listening: true, interim: 'I think that' });
    expect(screen.getByText('I think that')).toHaveAttribute('lang', 'en');
  });

  it('prompts to finish with over before anything is heard', () => {
    setup({ listening: true });
    expect(screen.getByText('Escuchando… terminá con “over”')).toBeInTheDocument();
  });

  it('sends a typed transmission', async () => {
    const { onSend, user } = setup();
    await user.type(screen.getByLabelText('Tu transmisión'), 'I agree with you{Enter}');
    expect(onSend).toHaveBeenCalledWith('I agree with you');
    expect(screen.getByLabelText('Tu transmisión')).toHaveValue('');
  });

  it('waits while the operator transmits', () => {
    setup({ yourTurn: false });
    expect(screen.getByLabelText('Tu transmisión')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'TRANSMITIR' })).toBeDisabled();
    expect(screen.getByText('Esperá: el operador está transmitiendo')).toBeInTheDocument();
  });

  it('explains why typing is needed when the microphone is unavailable', () => {
    setup({ notice: 'not-allowed' });
    expect(screen.getByText(/Sin permiso para el micrófono/)).toBeInTheDocument();
  });

  it('explains a live error and offers a retry when it can help', async () => {
    const onRetry = vi.fn();
    const { user } = setup({ error: 'offline', onRetry });
    expect(
      screen.getByText('Se cortó la conexión: revisá tu red y reintentá.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'REINTENTAR' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not offer a retry for a rejected key', () => {
    setup({ error: 'key', onRetry: vi.fn() });
    expect(screen.queryByRole('button', { name: 'REINTENTAR' })).not.toBeInTheDocument();
  });
});
