import { useId, useState } from 'react';
import type { SubmitEvent } from 'react';
import { createRadioSfx } from '@cq-talk/audio';
import { useI18n } from '@cq-talk/i18n';
import type { TranslationKey } from '@cq-talk/i18n';
import { createElevenLabsClient, rankOperatorVoices } from '@cq-talk/speech';
import type { ElevenLabsCheck, ElevenLabsClient, ElevenLabsVoice } from '@cq-talk/speech';
import { removeElevenLabs, saveVoice } from '@cq-talk/storage';
import type { Settings, VoiceProvider } from '@cq-talk/storage';
import { maskKey } from './maskKey';

/** What the operator says in the voice test (the conversation is always English). */
export const VOICE_SAMPLE =
  'CQ, CQ, this is JA1·AI. I copy you loud and clear. What do you want to talk about today? Over.';

export interface VoiceSectionProps {
  settings: Settings;
  /** Injected in tests; defaults to the real ElevenLabs client */
  createClient?: (apiKey: string) => ElevenLabsClient;
  /** Injected in tests; defaults to playing through the radio voice chain */
  playSample?: (audio: ArrayBuffer) => Promise<boolean>;
}

type Status =
  ElevenLabsCheck | 'connecting' | 'testing' | 'test-failed' | 'saved' | 'saved-system' | 'removed';

const STATUS_KEY: Record<Status, TranslationKey> = {
  connecting: 'settings.voice.status.connecting',
  ok: 'settings.voice.status.ok',
  invalid: 'settings.voice.status.invalid',
  forbidden: 'settings.voice.status.forbidden',
  'rate-limited': 'settings.voice.status.rateLimited',
  offline: 'settings.voice.status.offline',
  error: 'settings.voice.status.error',
  testing: 'settings.voice.status.testing',
  'test-failed': 'settings.voice.status.testFailed',
  saved: 'settings.voice.status.saved',
  'saved-system': 'settings.voice.status.savedSystem',
  removed: 'settings.voice.status.removed',
};

const playThroughRadio = async (audio: ArrayBuffer): Promise<boolean> => {
  const sfx = createRadioSfx();
  sfx.unlock();
  const playback = await sfx.voice(audio);
  if (!playback) return false;
  await playback.done;
  return true;
};

const keyClass =
  'flex min-h-[58px] cursor-pointer items-start gap-2 rounded-md bg-key px-3 py-2 text-plate-ink shadow-[0_3px_0_#6E716B] outline-offset-2 hover:bg-key-hover has-checked:outline-3 has-checked:outline-amber has-checked:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-solid';
const secondaryButton =
  'min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label disabled:cursor-not-allowed disabled:opacity-60';

/** "Voz del operador": the browser's voice or a natural ElevenLabs voice through the radio. */
export const VoiceSection = ({
  settings,
  createClient = createElevenLabsClient,
  playSample = playThroughRadio,
}: VoiceSectionProps) => {
  const { t } = useI18n();
  const ids = useId();
  const [provider, setProvider] = useState<VoiceProvider>(settings.voiceProvider);
  const [draft, setDraft] = useState('');
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [voiceId, setVoiceId] = useState(settings.elevenLabsVoiceId ?? '');
  const [status, setStatus] = useState<Status | null>(null);

  const key = draft.trim() || settings.elevenLabsKey || '';
  const busy = status === 'connecting' || status === 'testing';

  const connect = async () => {
    if (!key) {
      setStatus('invalid');
      return;
    }
    setStatus('connecting');
    const client = createClient(key);
    const check = await client.check();
    if (check !== 'ok') {
      setStatus(check);
      return;
    }
    const ranked = rankOperatorVoices(await client.listVoices());
    setVoices(ranked);
    setVoiceId((current) =>
      ranked.some((voice) => voice.id === current) ? current : (ranked[0]?.id ?? ''),
    );
    setStatus('ok');
  };

  const test = async () => {
    if (!key || !voiceId) return;
    setStatus('testing');
    try {
      const audio = await createClient(key).synthesize(VOICE_SAMPLE, voiceId);
      setStatus((await playSample(audio)) ? 'ok' : 'test-failed');
    } catch {
      setStatus('test-failed');
    }
  };

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (provider === 'system') {
      saveVoice({ provider: 'system' });
      setStatus('saved-system');
      return;
    }
    if (!key || !voiceId) {
      void connect();
      return;
    }
    saveVoice({ provider: 'elevenlabs', key, voiceId });
    setDraft('');
    setStatus('saved');
  };

  const remove = () => {
    removeElevenLabs();
    setProvider('system');
    setVoices([]);
    setVoiceId('');
    setStatus('removed');
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-[18px] border-t border-rig-border pt-[18px]">
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 font-label text-[12px] tracking-[2px] text-night-label">
          {t('settings.voice.title')}
        </legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2.5">
          {(['system', 'elevenlabs'] as const).map((option) => (
            <label key={option} className={keyClass}>
              <input
                type="radio"
                name={`${ids}-provider`}
                value={option}
                checked={provider === option}
                onChange={() => setProvider(option)}
                className="mt-1 accent-amber-ink"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold">{t(`settings.voice.${option}`)}</span>
                <span className="font-readout text-[12px] text-freq-ink">
                  {t(`settings.voice.${option}Hint`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {provider === 'elevenlabs' && (
        <>
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${ids}-key`}
              className="font-label text-[12px] tracking-[2px] text-night-label"
            >
              {t('settings.voice.keyLabel')}
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex min-w-0 flex-[999_1_240px] items-center gap-2.5 rounded-lg border-[3px] border-plate bg-display px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber focus-within:outline-solid">
                <span aria-hidden="true" className="font-readout text-[18px] text-amber">
                  &gt;
                </span>
                <input
                  id={`${ids}-key`}
                  type="password"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={settings.elevenLabsKey ? maskKey(settings.elevenLabsKey) : 'sk_…'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={`${ids}-hint`}
                  className="h-[46px] min-w-0 flex-1 border-0 bg-transparent font-readout text-[17px] text-amber outline-none placeholder:text-display-placeholder"
                />
              </div>
              <button
                type="button"
                onClick={() => void connect()}
                disabled={busy}
                className={`${secondaryButton} flex-[1_1_120px]`}
              >
                {t('settings.voice.connect')}
              </button>
            </div>
            <p id={`${ids}-hint`} className="m-0 text-[13px] leading-normal text-control-text">
              {t('settings.voice.keyHint')}{' '}
              <a
                href="https://elevenlabs.io/docs/api-reference/authentication"
                target="_blank"
                rel="noreferrer"
              >
                {t('settings.voice.howTo')}
              </a>
            </p>
          </div>

          {voices.length > 0 && (
            <div className="flex flex-wrap items-end gap-2.5">
              <label className="flex min-w-0 flex-[999_1_240px] flex-col gap-2">
                <span className="font-label text-[12px] tracking-[2px] text-night-label">
                  {t('settings.voice.voiceLabel')}
                </span>
                <select
                  value={voiceId}
                  onChange={(event) => setVoiceId(event.target.value)}
                  className="min-h-12 rounded-lg border-[3px] border-plate bg-display px-2 font-readout text-[16px] text-amber"
                >
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {[voice.name, voice.labels['accent'], voice.labels['age']]
                        .filter(Boolean)
                        .join(' · ')}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => void test()}
                disabled={busy || !voiceId}
                className={`${secondaryButton} flex-[1_1_120px]`}
              >
                {t('settings.voice.test')}
              </button>
            </div>
          )}
        </>
      )}

      <p className="m-0 text-[13px] leading-normal text-control-text">
        {t('settings.voice.aiNotice')}
      </p>
      <p role="status" className="m-0 min-h-5 text-[14px] text-night-label">
        {status && t(STATUS_KEY[status])}
      </p>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 cursor-pointer rounded-lg border-0 bg-amber px-[22px] font-label text-[15px] font-semibold tracking-[2px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover disabled:cursor-wait disabled:opacity-70"
        >
          {t('settings.voice.save')}
        </button>
        {settings.elevenLabsKey && (
          <button type="button" onClick={remove} className={secondaryButton}>
            {t('settings.voice.remove')}
          </button>
        )}
      </div>
    </form>
  );
};
