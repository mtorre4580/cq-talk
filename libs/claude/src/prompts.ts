import type { LogEntry, OperatorContext } from '@cq-talk/qso';

/** Language for everything the learner reads on the QSL card. */
const LANGUAGE: Record<string, string> = {
  es: 'Rioplatense Spanish (use "vos": "probá", "armá")',
  en: 'plain English',
  'pt-BR': 'Brazilian Portuguese',
};
export const explanationLanguage = (locale: string): string => LANGUAGE[locale] ?? LANGUAGE['en']!;

/** Stable per QSO, so it can be cached across the turns of one contact. */
export const operatorSystemPrompt = (ctx: OperatorContext): string =>
  [
    `You are ${ctx.call}, a friendly amateur radio operator in ${ctx.city}.`,
    `You are on a voice QSO (a radio contact) on ${ctx.freq} MHz with someone practicing spoken English.`,
    `The topic of the contact is: "${ctx.topic}".`,
    '',
    'How you talk:',
    '- Natural, everyday spoken English at an intermediate level. Your words are read aloud, so keep each transmission to one to three short sentences (under 45 words).',
    '- End every transmission with "Over."',
    '- React to what they said, then ask one open question that keeps them talking about the topic.',
    '- Never correct their English in your transmission: corrections are handled elsewhere.',
    '- A little radio flavor is welcome ("copy", "roger", "73"), as long as it stays easy to follow.',
    '- Plain text only: no lists, markdown, emoji or stage directions.',
    '- If they want to end the contact, say goodbye with "73" and still end with "Over."',
    '- If the topic or a turn is unsafe or inappropriate, steer kindly to a nearby safe topic.',
  ].join('\n');

export const openingCue = (ctx: OperatorContext): string =>
  `[CQ CQ CQ on ${ctx.freq} MHz. The learner is calling. Answer the call: give your call sign, say you copy them loud and clear, and ask for their take on "${ctx.topic}".]`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * The log as alternating chat turns: the opening cue first (the API starts with the user), the
 * operator as the assistant, the learner as the user. Consecutive lines from one side merge.
 */
export const toMessages = (log: readonly LogEntry[], ctx: OperatorContext): ChatMessage[] => {
  const messages: ChatMessage[] = [{ role: 'user', content: openingCue(ctx) }];
  for (const entry of log) {
    const role = entry.who === 'operator' ? 'assistant' : 'user';
    const last = messages[messages.length - 1]!;
    if (last.role === role) last.content = `${last.content}\n${entry.text}`;
    else messages.push({ role, content: entry.text });
  }
  return messages;
};

export const ASSESS_SYSTEM_PROMPT = [
  'You are an English tutor listening to a radio conversation. Judge ONE thing the learner said aloud.',
  'The text comes from speech recognition: ignore punctuation, capitalization and a final "Over".',
  'verdict "fix": there is a grammar mistake, a wrong word, or a phrase a native speaker would say differently. Put the most natural version in "better", keeping their meaning and level, without "Over".',
  'verdict "ok": correct and natural, and more than a one-word answer. "better" is empty.',
  'verdict "none": fine but too short to judge ("yes", "thank you", "roger"). "better" is empty.',
].join('\n');

export const assessInput = (text: string, log: readonly LogEntry[]): string => {
  const question = [...log].reverse().find((entry) => entry.who === 'operator');
  return [
    question ? `The operator had said: "${question.text}"` : '',
    `The learner said: "${text}"`,
  ]
    .filter(Boolean)
    .join('\n');
};

export const reportSystemPrompt = (locale: string): string =>
  [
    'You write the lessons on a QSL card after a radio conversation with someone practicing spoken English.',
    `Write "why", "meaning" and "practice" in ${explanationLanguage(locale)}. Keep "said", "better" and "phrase" in English.`,
    '- errors: up to 4 of the learner\'s real mistakes, most useful first. "said" is their words, "better" the natural version, "why" one or two short sentences on the rule behind it. Empty if there were none.',
    '- vocabulary: 3 to 4 English phrases that would have helped them talk about this topic, each with a short meaning.',
    '- practice: exactly 3 short exercises for tomorrow, numbered "1. ", "2. ", "3. ", built on their mistakes.',
  ].join('\n');

export const reportInput = (log: readonly LogEntry[], ctx: OperatorContext): string =>
  [
    `Topic: ${ctx.topic}`,
    'Conversation:',
    ...log.map((entry) => `${entry.who === 'operator' ? ctx.call : 'LEARNER'}: ${entry.text}`),
  ].join('\n');
