import type { LogEntry } from './conversation';

/** One mistake on the QSL card. `said` and `better` are English; `why` is in the UI language. */
export interface ReportError {
  said: string;
  better: string;
  why: string;
}

export interface ReportPhrase {
  /** English phrase to add to the user's vocabulary */
  phrase: string;
  /** Meaning in the UI language */
  meaning: string;
}

/** What the QSL card teaches after a QSO. */
export interface QslReport {
  errors: ReportError[];
  vocabulary: ReportPhrase[];
  /** Exercises for tomorrow, in the UI language */
  practice: string[];
}

/** Lines the user said, and how many of them got a better version. */
export const correctionCounts = (log: readonly LogEntry[]) => {
  const yours = log.filter((entry) => entry.who === 'you');
  return {
    total: yours.length,
    fixes: yours.filter((entry) => entry.assessment?.kind === 'fix').length,
  };
};

/** English halves of the demo report; the dictionaries hold the explanations. */
export const DEMO_ERRORS = [
  {
    said: 'I think is a very interesting topic, I follow the news since many years.',
    better: 'I think it’s a really interesting topic — I’ve been following the news for years.',
  },
  {
    said: 'The most important for me is how people discuss about it in internet.',
    better: 'What matters most to me is how people discuss it online.',
  },
] as const;

export const DEMO_PHRASES = [
  'to keep up with',
  'what matters most',
  'to weigh in on',
  'to catch someone’s eye',
] as const;

/** The prototype always lists at least one mistake, and never more than the fixes so far. */
export const demoErrorCount = (fixes: number): number =>
  Math.min(DEMO_ERRORS.length, Math.max(fixes, 1));
