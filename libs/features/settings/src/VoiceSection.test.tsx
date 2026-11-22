import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '@cq-talk/i18n';
import type { ElevenLabsCheck, ElevenLabsClient, ElevenLabsVoice } from '@cq-talk/speech';
import { readSettings } from '@cq-talk/storage';
import type { Settings } from '@cq-talk/storage';
import { VOICE_SAMPLE, VoiceSection } from './VoiceSection';

const base: Settings = {
  apiKey: null,
  model: 'claude-opus-5-5',
  voiceProvider: 'system',
  elevenLabsKey: null,
  elevenLabsVoiceId: null,
};

const fakeClient = (check: ElevenLabsCheck = 'ok') => {
  const client: ElevenLabsClient = {
    check: vi.fn(async () => check),
    listVoices: vi.fn(async (): Promise<ElevenLabsVoice[]> => [
      { id: 'young', name: 'Skye', description: '', labels: { gender: 'female', age: 'young' } },
      {
        id: 'operator',
        name: 'Hank',
        description: 'warm and deep',
        labels: { gender: 'male', accent: 'american', age: 'middle aged' },
      },
    ]),
    synthesize: vi.fn(async () => new ArrayBuffer(8)),
  };
  return client;
};

const setup = (settings: Settings = base, client = fakeClient()) => {
  const playSample = vi.fn(async () => true);
  const createClient = vi.fn(() => client);
  render(
    <I18nProvider initial="es">
      <VoiceSection settings={settings} createClient={createClient} playSample={playSample} />
    </I18nProvider>,
  );
  return { user: userEvent.setup(), client, createClient, playSample };
};

describe('VoiceSection', () => {
  it('uses the browser voice by default and says the voice is AI-generated', () => {
    setup();
    expect(screen.getByRole('radio', { name: /Voz del navegador/ })).toBeChecked();
    expect(screen.getByText('La voz del operador es generada por IA.')).toBeInTheDocument();
  });

  it('connects a key, suggests the best operator voice, tests it and saves it', async () => {
    const { user, client, playSample } = setup();
    await user.click(screen.getByRole('radio', { name: /ElevenLabs/ }));
    await user.type(screen.getByLabelText('API KEY DE ELEVENLABS'), 'sk_test_voice');
    await user.click(screen.getByRole('button', { name: 'CONECTAR' }));

    expect(await screen.findByRole('combobox', { name: 'Voz' })).toHaveValue('operator');
    await user.click(screen.getByRole('button', { name: 'PROBAR VOZ' }));
    expect(client.synthesize).toHaveBeenCalledWith(VOICE_SAMPLE, 'operator');
    expect(playSample).toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'GUARDAR VOZ' }));
    expect(readSettings('m')).toMatchObject({
      voiceProvider: 'elevenlabs',
      elevenLabsKey: 'sk_test_voice',
      elevenLabsVoiceId: 'operator',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Voz guardada');
  });

  it('explains a rejected key and stores nothing', async () => {
    const { user } = setup(base, fakeClient('invalid'));
    await user.click(screen.getByRole('radio', { name: /ElevenLabs/ }));
    await user.type(screen.getByLabelText('API KEY DE ELEVENLABS'), 'nope');
    await user.click(screen.getByRole('button', { name: 'CONECTAR' }));
    expect(await screen.findByText(/ElevenLabs rechazó la key/)).toBeInTheDocument();
    expect(readSettings('m').elevenLabsKey).toBeNull();
  });

  it('goes back to the browser voice', async () => {
    const { user } = setup({
      ...base,
      voiceProvider: 'elevenlabs',
      elevenLabsKey: 'sk_saved_voice_key',
      elevenLabsVoiceId: 'operator',
    });
    await user.click(screen.getByRole('button', { name: 'BORRAR KEY DE VOZ' }));
    expect(readSettings('m')).toMatchObject({ voiceProvider: 'system', elevenLabsKey: null });
    expect(screen.getByRole('radio', { name: /Voz del navegador/ })).toBeChecked();
  });
});
