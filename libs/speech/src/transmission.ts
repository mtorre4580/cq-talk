/*
 * Recognized speech is untrusted input of any length, so these helpers walk the string once from
 * the end instead of using regular expressions that can backtrack (CodeQL: polynomial regex).
 */

const isSpace = (c: string) => c.trim() === '';
const isWordChar = (c: string) => /^[\p{L}\p{N}_]$/u.test(c);

/** Drops trailing characters while `drop` says so. */
const trimEndWhile = (text: string, drop: (c: string) => boolean): string => {
  let end = text.length;
  while (end > 0 && drop(text.charAt(end - 1))) end--;
  return text.slice(0, end);
};

/** The text before a final "over" (any case, then spaces or . ! ,), or null when it has none. */
const beforeOver = (text: string): string | null => {
  const t = trimEndWhile(text, (c) => isSpace(c) || c === '.' || c === '!' || c === ',');
  if (t.slice(-4).toLowerCase() !== 'over') return null;
  const previous = t.charAt(t.length - 5);
  // "hangover" is not a sign-off
  if (previous && isWordChar(previous)) return null;
  return t.slice(0, -4);
};

/** A transmission ends when the speaker says "over", as on a real radio. */
export const endsTransmission = (text: string): boolean => beforeOver(text) !== null;

/**
 * Tidies a recognized transmission for the log: trimmed, capitalized, ending in "Over."
 * (recognition often drops punctuation and casing).
 */
export const normalizeTransmission = (text: string): string => {
  const withoutOver = beforeOver(text) ?? text;
  const body = trimEndWhile(withoutOver.trim(), (c) => isSpace(c) || c === ',').trim();
  if (!body) return '';
  const sentence = body.charAt(0).toUpperCase() + body.slice(1);
  const last = sentence.charAt(sentence.length - 1);
  const punctuated = last === '.' || last === '!' || last === '?' ? sentence : `${sentence}.`;
  return `${punctuated} Over.`;
};
