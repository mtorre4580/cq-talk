import { useEffect, useRef } from 'react';
import { useI18n } from '@cq-talk/i18n';
import type { LogEntry } from '@cq-talk/qso';

export interface ConversationLogProps {
  entries: readonly LogEntry[];
  /** Operator call sign, printed beside each of the operator's lines */
  call: string;
}

/**
 * The QSO as light on the night: who spoke, what they said and, under each of your lines, a
 * better way to say it. New lines flicker in and are announced politely; the list keeps the
 * latest line in view.
 */
export const ConversationLog = ({ entries, call }: ConversationLogProps) => {
  const { t } = useI18n();
  const list = useRef<HTMLOListElement>(null);
  const last = entries[entries.length - 1];

  useEffect(() => {
    const element = list.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [entries.length, last?.text, last?.assessment]);

  return (
    <section aria-labelledby="log-title" className="flex min-h-0 flex-col">
      <h2 id="log-title" className="sr-only">
        {t('log.title')}
      </h2>
      <ol ref={list} aria-live="polite" className="cq-lines">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={`cq-line ${entry.who === 'you' ? 'cq-line-you' : 'cq-line-operator'}`}
          >
            <span className="cq-who">{entry.who === 'you' ? t('log.you') : call}</span>
            <p className="cq-text" lang="en">
              {entry.text}
            </p>
            {entry.assessment?.kind === 'fix' && (
              <p className="cq-note">{t('log.better', { text: entry.assessment.better })}</p>
            )}
            {entry.assessment?.kind === 'ok' && <p className="cq-note cq-note-ok">{t('log.ok')}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
};
