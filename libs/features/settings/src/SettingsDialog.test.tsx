import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@cq-talk/i18n';
import type { KeyCheck } from '@cq-talk/claude';
import { maskKey } from './maskKey';
import { SettingsDialog } from './SettingsDialog';

const setup = (check: (key: string) => Promise<KeyCheck> = async () => 'ok') => {
  const onClose = vi.fn();
  render(
    <I18nProvider initial="es">
      <SettingsDialog open onClose={onClose} check={check} />
    </I18nProvider>,
  );
  return { onClose, user: userEvent.setup() };
};

describe('SettingsDialog', () => {
  it('saves a key only after Anthropic accepts it', async () => {
    const check = vi.fn(async () => 'ok' as const);
    const { user } = setup(check);
    const dialog = screen.getByRole('dialog', { name: 'CONFIGURAR KEY' });
    await user.type(
      within(dialog).getByLabelText('API KEY DE ANTHROPIC'),
      'sk-ant-api03-secret-a1b2',
    );
    await user.click(within(dialog).getByRole('button', { name: 'GUARDAR' }));

    expect(check).toHaveBeenCalledWith('sk-ant-api03-secret-a1b2');
    expect(localStorage.getItem('cq-talk:api-key')).toBe('sk-ant-api03-secret-a1b2');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent(
      'el próximo QSO es con un operador IA',
    );
    expect(screen.getByText(/Key guardada: sk-ant-…a1b2/)).toBeInTheDocument();
  });

  it('does not store a rejected key and says why', async () => {
    const { user } = setup(async () => 'invalid');
    await user.type(screen.getByLabelText('API KEY DE ANTHROPIC'), 'nope-nope-nope');
    await user.click(screen.getByRole('button', { name: 'GUARDAR' }));
    expect(localStorage.getItem('cq-talk:api-key')).toBeNull();
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Anthropic rechazó la key');
  });

  it('chooses the operator model, Opus 5.5 by default', async () => {
    const { user } = setup();
    expect(screen.getByRole('radio', { name: /Opus 5\.5/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /Haiku 5\.5/ }));
    await user.click(screen.getByRole('button', { name: 'GUARDAR' }));
    expect(localStorage.getItem('cq-talk:model')).toBe('claude-haiku-5-5');
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Modelo guardado.');
  });

  it('removes a saved key', async () => {
    localStorage.setItem('cq-talk:api-key', 'sk-ant-api03-secret-a1b2');
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'BORRAR KEY' }));
    expect(localStorage.getItem('cq-talk:api-key')).toBeNull();
    expect(screen.queryByRole('button', { name: 'BORRAR KEY' })).not.toBeInTheDocument();
  });

  it('closes from its button', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'CERRAR' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('maskKey', () => {
  it('never shows the middle of a key', () => {
    expect(maskKey('sk-ant-api03-very-secret-value-a1b2')).toBe('sk-ant-…a1b2');
    expect(maskKey('short')).toBe('••••');
  });
});
