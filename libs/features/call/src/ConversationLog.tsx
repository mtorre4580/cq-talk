import { useI18n } from '@cq-talk/i18n';
import type { LogEntry } from '@cq-talk/qso';

export interface ConversationLogProps {
  entries: readonly LogEntry[];
  /** Operator call sign, printed before each of the operator's lines */
  call: string;
  /** The paper only fits the most recent lines */
  visible?: number;
}

/** Typewritten paper log under the rig. New lines fade in and are announced politely. */
export const ConversationLog = ({ entries, call, visible = 4 }: ConversationLogProps) => {
  const { t } = useI18n();
  const shown = entries.slice(-visible);

  return (
    <section
      aria-labelledby="log-title"
      className="box-border flex min-h-[220px] w-full max-w-[820px] flex-col justify-end gap-3 rounded bg-paper px-5 py-4 text-paper-ink shadow-[0_18px_40px_rgba(0,0,0,.6)]"
    >
      <h2
        id="log-title"
        className="m-0 font-label text-[12px] font-normal tracking-[2px] text-paper-muted"
      >
        {t('log.title')}
      </h2>
      <ol aria-live="polite" className="m-0 flex list-none flex-col gap-3 p-0">
        {shown.map((entry) => (
          <li key={entry.id} className="flex animate-fadein flex-col gap-1">
            <p className="m-0 text-[16px] leading-normal">
              <strong className={entry.who === 'you' ? 'text-paper-ink' : 'text-operator'}>
                {entry.who === 'you' ? t('log.you') : call} ▸
              </strong>{' '}
              <span lang="en">{entry.text}</span>
            </p>
            {entry.assessment?.kind === 'fix' && (
              <p className="m-0 ml-4 text-[15px] leading-[1.45] text-fix">
                {t('log.better', { text: entry.assessment.better })}
              </p>
            )}
            {entry.assessment?.kind === 'ok' && (
              <p className="m-0 ml-4 text-[14px] text-ok">{t('log.ok')}</p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
};
