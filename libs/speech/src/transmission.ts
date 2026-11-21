/** A transmission ends when the speaker says "over", as on a real radio. */
const OVER = /\bover[\s.!,]*$/i;

export const endsTransmission = (text: string): boolean => OVER.test(text.trim());

/**
 * Tidies a recognized transmission for the log: trimmed, capitalized, ending in "Over."
 * (recognition often drops punctuation and casing).
 */
export const normalizeTransmission = (text: string): string => {
  const body = text
    .trim()
    .replace(OVER, '')
    .trim()
    .replace(/[\s,]+$/, '');
  if (!body) return '';
  const sentence = body.charAt(0).toUpperCase() + body.slice(1);
  const punctuated = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
  return `${punctuated} Over.`;
};
