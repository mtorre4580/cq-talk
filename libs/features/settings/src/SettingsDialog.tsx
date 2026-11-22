import { useEffect, useId, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { DEFAULT_MODEL, MODELS } from '@cq-talk/claude';
import type { KeyCheck } from '@cq-talk/claude';
import { useI18n } from '@cq-talk/i18n';
import type { TranslationKey } from '@cq-talk/i18n';
import { saveApiKey, saveModel, useSettings } from '@cq-talk/storage';
import { maskKey } from './maskKey';
import { VoiceSection } from './VoiceSection';

export interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Injected in tests; defaults to a free request to the Anthropic API */
  check?: (apiKey: string) => Promise<KeyCheck>;
}

type Result = KeyCheck | 'removed' | 'model-saved';

const RESULT_KEY: Record<Result, TranslationKey> = {
  ok: 'settings.result.ok',
  invalid: 'settings.result.invalid',
  forbidden: 'settings.result.forbidden',
  'rate-limited': 'settings.result.rateLimited',
  offline: 'settings.result.offline',
  error: 'settings.result.error',
  removed: 'settings.result.removed',
  'model-saved': 'settings.result.modelSaved',
};

/** Loads the SDK only when a key is actually checked */
const checkWithAnthropic = async (apiKey: string): Promise<KeyCheck> =>
  (await import('@cq-talk/claude/client')).checkApiKey(apiKey);

const secondaryButton =
  'min-h-12 cursor-pointer rounded-lg border border-rig-border bg-control px-[22px] font-label text-[15px] font-medium tracking-[2px] text-night-label';

/** "Configurar key": the user's own API key and the operator model, styled like the rig. */
export const SettingsDialog = ({
  open,
  onClose,
  check = checkWithAnthropic,
}: SettingsDialogProps) => {
  const { t } = useI18n();
  const settings = useSettings(DEFAULT_MODEL);
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState('');
  const [model, setModel] = useState(settings.model);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const ids = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) {
      setDraft('');
      setResult(null);
      setModel(settings.model);
      element.showModal();
    }
    if (!open && element.open) element.close();
  }, [open, settings.model]);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveModel(model);
    if (!draft.trim()) {
      setResult('model-saved');
      return;
    }
    setChecking(true);
    const outcome = await check(draft.trim());
    setChecking(false);
    setResult(outcome);
    if (outcome === 'ok') {
      saveApiKey(draft);
      setDraft('');
    }
  };

  const remove = () => {
    saveApiKey(null);
    setResult('removed');
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${ids}-title`}
      onClose={onClose}
      className="m-auto box-border w-[calc(100%-32px)] max-w-[560px] rounded-xl border border-rig-border bg-rig-chassis p-[22px] font-body text-night-text shadow-[0_24px_60px_rgba(0,0,0,.7)] backdrop:bg-[rgba(5,8,13,.75)]"
    >
      <form onSubmit={submit} className="flex flex-col gap-[18px]">
        <div className="self-start rounded bg-plate px-3 py-1.5 text-plate-ink shadow-[inset_0_1px_0_#EEF0EA,0_1px_2px_rgba(0,0,0,.4)]">
          <h2 id={`${ids}-title`} className="m-0 font-label text-[15px] font-medium tracking-[3px]">
            {t('settings.title')}
          </h2>
        </div>
        <p className="m-0 text-[15px] leading-normal">{t('settings.intro')}</p>

        <div className="flex flex-col gap-2">
          <label
            htmlFor={`${ids}-key`}
            className="font-label text-[12px] tracking-[2px] text-night-label"
          >
            {t('settings.keyLabel')}
          </label>
          <div className="flex items-center gap-2.5 rounded-lg border-[3px] border-plate bg-display px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber focus-within:outline-solid">
            <span aria-hidden="true" className="font-readout text-[18px] text-amber">
              &gt;
            </span>
            <input
              id={`${ids}-key`}
              type="password"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={settings.apiKey ? maskKey(settings.apiKey) : 'sk-ant-…'}
              autoComplete="off"
              spellCheck={false}
              aria-describedby={`${ids}-hint`}
              className="h-[46px] min-w-0 flex-1 border-0 bg-transparent font-readout text-[17px] text-amber outline-none placeholder:text-display-placeholder"
            />
          </div>
          <p id={`${ids}-hint`} className="m-0 text-[13px] leading-normal text-control-text">
            {settings.apiKey && (
              <>
                {t('settings.saved', { masked: maskKey(settings.apiKey) })}
                {' · '}
              </>
            )}
            {t('settings.keyHint')}{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
              {t('settings.getKey')}
            </a>
          </p>
        </div>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 font-label text-[12px] tracking-[2px] text-night-label">
            {t('settings.model')}
          </legend>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
            {MODELS.map((option) => (
              <label
                key={option.id}
                className="flex min-h-[58px] cursor-pointer items-start gap-2 rounded-md bg-key px-3 py-2 text-plate-ink shadow-[0_3px_0_#6E716B] outline-offset-2 hover:bg-key-hover has-checked:outline-3 has-checked:outline-amber has-checked:outline-solid has-focus-visible:outline-2 has-focus-visible:outline-solid"
              >
                <input
                  type="radio"
                  name={`${ids}-model`}
                  value={option.id}
                  checked={model === option.id}
                  onChange={() => setModel(option.id)}
                  className="mt-1 accent-amber-ink"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px] font-bold">
                    {t(`settings.models.${option.key}`)}
                  </span>
                  <span className="font-readout text-[12px] text-freq-ink">
                    {t(`settings.models.${option.key}Hint`)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-[13px] leading-normal text-control-text">
          <li>{t('settings.costNote')}</li>
          <li>{t('settings.speechNote')}</li>
        </ul>

        <p role="status" className="m-0 min-h-5 text-[14px] text-night-label">
          {checking ? t('settings.checking') : result && t(RESULT_KEY[result])}
        </p>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="submit"
            disabled={checking}
            className="min-h-12 cursor-pointer rounded-lg border-0 bg-amber px-[22px] font-label text-[15px] font-semibold tracking-[2px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover disabled:cursor-wait disabled:opacity-70"
          >
            {t('settings.save')}
          </button>
          {settings.apiKey && (
            <button type="button" onClick={remove} className={secondaryButton}>
              {t('settings.remove')}
            </button>
          )}
          <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
            {t('settings.close')}
          </button>
        </div>
      </form>
      <div className="mt-[18px]">
        <VoiceSection settings={settings} />
      </div>
    </dialog>
  );
};
