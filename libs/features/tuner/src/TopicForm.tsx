import type { SubmitEvent } from 'react';
import { useI18n } from '@cq-talk/i18n';

export interface TopicFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Calls CQ on the typed topic */
  onCall: (topic: string) => void;
}

/** The receiver's amber readout strip at home: "¿De qué querés hablar?" and LLAMAR · CQ. */
export const TopicForm = ({ query, onQueryChange, onCall }: TopicFormProps) => {
  const { t } = useI18n();

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCall(query);
  };

  return (
    <form onSubmit={submit} className="cq-readout" autoComplete="off">
      <span aria-hidden="true" className="cq-prompt">
        &gt;
      </span>
      <label htmlFor="topic" className="sr-only">
        {t('tuner.prompt')}
      </label>
      <input
        id="topic"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={t('tuner.prompt')}
        spellCheck={false}
      />
      <button type="submit" className="cq-call-button">
        {t('tuner.call')}
      </button>
    </form>
  );
};
