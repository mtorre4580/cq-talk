import type { LogEntry } from './conversation';

/** The demo operator's first line arrives 3 s into the call, then one line every 3 s. */
export const DEMO_FIRST_LINE_S = 3;
export const DEMO_LINE_EVERY_S = 3;

/**
 * The prototype's scripted QSO (both sides), used without an API key, in tests and to record
 * media. Operator lines name the station and the topic; the user's lines carry the prototype's
 * corrections.
 */
export const demoScript = (topic: string, call: string): LogEntry[] => [
  {
    id: 'demo-1',
    who: 'operator',
    text: `CQ, CQ, this is ${call}. I copy you loud and clear! So, ${topic} — what’s your take on it? Over.`,
  },
  {
    id: 'demo-2',
    who: 'you',
    text: 'I think is a very interesting topic, I follow the news since many years. Over.',
    assessment: {
      kind: 'fix',
      better: 'I think it’s a really interesting topic — I’ve been following the news for years.',
    },
  },
  {
    id: 'demo-3',
    who: 'operator',
    text: 'For years? Nice. What caught your attention the most lately? Over.',
  },
  {
    id: 'demo-4',
    who: 'you',
    text: 'The most important for me is how people discuss about it in internet. Over.',
    assessment: { kind: 'fix', better: 'What matters most to me is how people discuss it online.' },
  },
  {
    id: 'demo-5',
    who: 'operator',
    text: 'Good point. Do you think online debates change what people actually believe? Over.',
  },
  {
    id: 'demo-6',
    who: 'you',
    text: 'Yes, I agree with that. People are more influenced than before. Over.',
    assessment: { kind: 'ok' },
  },
  {
    id: 'demo-7',
    who: 'operator',
    text: 'Roger that. Can you give me a recent example? Over.',
  },
];

/** How many demo lines are on the log after `seconds` on air (the prototype's timing). */
export const demoLinesAt = (seconds: number, total = 7): number =>
  seconds < DEMO_FIRST_LINE_S
    ? 0
    : Math.min(total, 1 + Math.floor((seconds - DEMO_FIRST_LINE_S) / DEMO_LINE_EVERY_S));
