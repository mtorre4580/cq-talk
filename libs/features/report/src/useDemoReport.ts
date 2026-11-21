import { useMemo } from 'react';
import { useI18n } from '@cq-talk/i18n';
import { DEMO_ERRORS, DEMO_PHRASES, demoErrorCount } from '@cq-talk/qso';
import type { QslReport } from '@cq-talk/qso';

const WHY = ['demo.why1', 'demo.why2'] as const;
const MEANINGS = ['demo.meaning1', 'demo.meaning2', 'demo.meaning3', 'demo.meaning4'] as const;
const PRACTICE = ['demo.practice1', 'demo.practice2', 'demo.practice3'] as const;

/** The prototype's report, in the UI language, listing as many mistakes as the demo fixed. */
export const useDemoReport = (fixes: number): QslReport => {
  const { t } = useI18n();
  return useMemo(
    () => ({
      errors: DEMO_ERRORS.slice(0, demoErrorCount(fixes)).map((error, i) => ({
        ...error,
        why: t(WHY[i] ?? 'demo.why1'),
      })),
      vocabulary: DEMO_PHRASES.map((phrase, i) => ({
        phrase,
        meaning: t(MEANINGS[i] ?? 'demo.meaning1'),
      })),
      practice: PRACTICE.map((key) => t(key)),
    }),
    [fixes, t],
  );
};
