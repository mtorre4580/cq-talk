import { useId, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useI18n } from '@cq-talk/i18n';
import type { TranslationKey } from '@cq-talk/i18n';
import type { LiveError } from '@cq-talk/qso';

/** Why the microphone is not in use, if it is not. */
export type TransmitNotice = 'unsupported' | 'not-allowed' | 'no-microphone' | 'network';

export interface TransmitPanelProps {
  /** It is the user's turn to transmit */
  yourTurn: boolean;
  /** The microphone is open and recognition is running */
  listening: boolean;
  /** Words recognized so far in this transmission */
  interim: string;
  notice?: TransmitNotice | null;
  /** A typed transmission (always available, even when speech works) */
  onSend: (text: string) => void;
  /** The live operator failed; `onRetry` repeats the last step */
  error?: LiveError | null;
  onRetry?: () => void;
}

const ERROR_KEY: Record<LiveError, TranslationKey> = {
  key: 'live.error.key',
  'rate-limit': 'live.error.rateLimit',
  offline: 'live.error.offline',
  refused: 'live.error.refused',
  other: 'live.error.other',
};

/** Errors a retry can fix */
const RETRYABLE: readonly LiveError[] = ['rate-limit', 'offline', 'other'];

const NOTICE_KEY: Record<TransmitNotice, TranslationKey> = {
  unsupported: 'transmit.unsupported',
  'not-allowed': 'transmit.notAllowed',
  'no-microphone': 'transmit.noMicrophone',
  network: 'transmit.network',
};

/** Live mode: what the microphone hears, plus a typed fallback in the tuner's display style. */
export const TransmitPanel = ({
  yourTurn,
  listening,
  interim,
  notice,
  onSend,
  error,
  onRetry,
}: TransmitPanelProps) => {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const id = useId();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!yourTurn || !draft.trim()) return;
    onSend(draft.trim());
    setDraft('');
  };

  const line = error
    ? t(ERROR_KEY[error])
    : !yourTurn
      ? t('transmit.waiting')
      : notice
        ? t(NOTICE_KEY[notice])
        : listening
          ? interim || t('transmit.listening')
          : '';

  return (
    <form onSubmit={submit} className="flex flex-col gap-2.5">
      <p
        aria-live="polite"
        lang={interim && listening ? 'en' : undefined}
        className="m-0 min-h-5 font-readout text-[15px] text-control-text"
      >
        {line}
      </p>
      {error && onRetry && RETRYABLE.includes(error) && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 cursor-pointer self-start rounded-md border border-control-border bg-control px-3 font-label text-[12px] tracking-[2px] text-control-text"
        >
          {t('live.retry')}
        </button>
      )}
      <div className="flex flex-wrap items-center gap-3.5">
        <label htmlFor={`${id}-text`} className="sr-only">
          {t('transmit.label')}
        </label>
        <div className="flex min-w-0 flex-[999_1_260px] items-center gap-2.5 rounded-lg border-[3px] border-plate bg-display px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-amber focus-within:outline-solid">
          <span aria-hidden="true" className="font-readout text-[18px] text-amber">
            &gt;
          </span>
          <input
            id={`${id}-text`}
            lang="en"
            value={draft}
            disabled={!yourTurn}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('transmit.placeholder')}
            autoComplete="off"
            className="h-[46px] min-w-0 flex-1 border-0 bg-transparent font-readout text-[18px] text-amber outline-none placeholder:text-display-placeholder disabled:cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          disabled={!yourTurn}
          className="min-h-12 flex-[1_1_150px] cursor-pointer rounded-lg border-0 bg-amber font-label text-[15px] font-semibold tracking-[3px] text-amber-ink shadow-[0_3px_0_#8A4E12] hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('transmit.send')}
        </button>
      </div>
    </form>
  );
};
