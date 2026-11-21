import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { installFakeAudioContext } from '@cq-talk/audio/testing';
import { App } from './App';

import { CLOSING_DELAY_MS, PRESET_CALL_DELAY_MS } from './useQso';

const setup = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es-AR']);
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<App />);
  return user;
};

describe('QSO flow', () => {
  let audio: ReturnType<typeof installFakeAudioContext>;
  beforeEach(() => {
    audio = installFakeAudioContext();
  });
  afterEach(() => {
    vi.useRealTimers();
    audio.restore();
  });

  it('plays the tune-in when the call goes out and the click when the mic goes off', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Mundial 2026/ }));
    // The click unlocks audio; the tune-in waits for the needle
    expect(audio.started).toEqual([]);
    act(() => vi.advanceTimersByTime(PRESET_CALL_DELAY_MS));
    expect(audio.started).toEqual(['noise', 'oscillator', 'oscillator', 'oscillator']);

    await user.click(
      screen.getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' }),
    );
    expect(audio.started.slice(4)).toEqual(['noise', 'oscillator']);
  });

  it('stays silent with SONIDO · OFF', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'SONIDO · ON' }));
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), 'space{Enter}');
    expect(audio.started).toEqual([]);
    expect(screen.getByRole('button', { name: 'SONIDO · OFF' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls CQ on a typed topic and goes on air', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), 'Mundial 2026');
    await user.click(screen.getByRole('button', { name: 'LLAMAR · CQ' }));

    expect(screen.queryByLabelText('¿De qué querés hablar?')).not.toBeInTheDocument();
    expect(screen.getByText('10.436 · JA1·AI')).toBeInTheDocument();
    expect(screen.getByText('MIC ON')).toBeInTheDocument();
  });

  it('runs the demo QSO with the prototype timing', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), 'Mundial 2026{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Sintonizando…');
    expect(screen.getByText('EN CONTACTO CON')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByText('00:03')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Recibiendo · tu turno');
    expect(
      screen.getByText(/So, Mundial 2026 — what’s your take on it\? Over\./),
    ).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toHaveTextContent('Transmitiendo…');
    expect(
      screen.getByText(/✎ Mejor: I think it’s a really interesting topic/),
    ).toBeInTheDocument();
  });

  it('does not call without a topic', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: 'LLAMAR · CQ' }));
    expect(screen.getByLabelText('¿De qué querés hablar?')).toBeInTheDocument();
  });

  it('tunes a weekly frequency, waits for the needle and calls on it', async () => {
    const user = setup();
    await user.click(screen.getByRole('button', { name: /Cambio climático/ }));
    expect(screen.getByLabelText('¿De qué querés hablar?')).toHaveValue('Cambio climático');

    act(() => vi.advanceTimersByTime(PRESET_CALL_DELAY_MS));
    expect(screen.getByText(/^14\.205 · /)).toBeInTheDocument();
  });

  it('hangs up from the microphone and comes back for a new QSO', async () => {
    const user = setup();
    await user.type(screen.getByLabelText('¿De qué querés hablar?'), 'space{Enter}');
    await user.click(
      screen.getByRole('button', { name: 'Apagar el micrófono y terminar la conversación' }),
    );
    expect(screen.getByText('Imprimiendo tu tarjeta QSL…')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(CLOSING_DELAY_MS));
    await user.click(screen.getByRole('button', { name: 'NUEVO QSO' }));
    expect(screen.getByLabelText('¿De qué querés hablar?')).toHaveValue('');
  });
});
