import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from './App';

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-AR']);
  });

  it('renders the app name as the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeInTheDocument();
  });

  it('shows the idle rig with the microphone off', () => {
    render(<App />);
    expect(screen.getByRole('img', { name: 'Medidor de señal' })).toBeInTheDocument();
    expect(screen.getByText('BANDA MUNDIAL · 3–30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Micrófono apagado' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SONIDO · ON' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('shows the prototype footer in Spanish by default', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(
      within(footer).getByText('Gratis · tu API key queda solo en este navegador'),
    ).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Configurar key' })).toBeInTheDocument();
    expect(within(footer).getByRole('button', { name: 'Mis QSL' })).toBeInTheDocument();
  });

  it('opens the key settings from the footer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Configurar key' }));
    expect(screen.getByRole('dialog', { name: 'CONFIGURAR KEY' })).toBeInTheDocument();
  });

  it('switches the language from the footer and remembers it', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'en');
    expect(screen.getByRole('button', { name: 'My QSLs' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');

    unmount();
    render(<App />);
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
  });
});
