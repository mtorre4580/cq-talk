export interface SpeechOutput {
  readonly supported: boolean;
  /** Speaks in English; resolves when done (or right away where speech is unavailable) */
  speak(text: string): Promise<void>;
  cancel(): void;
}

type VoiceInfo = Pick<SpeechSynthesisVoice, 'name' | 'lang'>;

/** High-quality voices across platforms, best first within each group. */
const NATURAL = /\b(natural|neural|premium|enhanced|siri)\b/i;
const KNOWN_GOOD = [
  'google us english',
  'google uk english',
  'samantha',
  'ava',
  'allison',
  'susan',
  'evan',
  'nathan',
  'zoe',
  'tom',
  'alex',
  'daniel',
  'karen',
  'moira',
  'tessa',
  'serena',
  'microsoft aria',
  'microsoft jenny',
  'microsoft guy',
];
/** Clear but synthetic (macOS Eloquence voices) */
const ACCEPTABLE = ['reed', 'shelley', 'sandy', 'flo', 'eddy'];
/**
 * macOS novelty and legacy voices: robotic, sung or comic on purpose. "Albert" sorts first in
 * the voice list, which once made the operator sound distorted.
 */
const NOVELTY = [
  'albert',
  'bad news',
  'bahh',
  'bells',
  'boing',
  'bubbles',
  'cellos',
  'good news',
  'jester',
  'organ',
  'superstar',
  'trinoids',
  'whisper',
  'wobble',
  'zarvox',
  'deranged',
  'hysterical',
  'fred',
  'junior',
  'ralph',
  'kathy',
  'grandma',
  'grandpa',
  'rocko',
];

/** `"Samantha (Enhanced)"`, `"Reed (inglés (Estados Unidos))"` → `"samantha"`, `"reed"`. */
const baseName = (name: string) => name.toLowerCase().split('(')[0]!.trim();

/** Higher is better; negative means never choose it. */
export const voiceScore = (voice: VoiceInfo): number => {
  const lang = voice.lang.toLowerCase().replace('_', '-');
  if (!lang.startsWith('en')) return -1;
  const name = baseName(voice.name);
  const regional = lang === 'en-us' ? 2 : 1;
  if (NOVELTY.includes(name)) return -1;
  const known = KNOWN_GOOD.findIndex((good) => name === good || name.startsWith(`${good} `));
  if (known >= 0) return 100 - known + regional;
  if (NATURAL.test(voice.name)) return 60 + regional;
  if (ACCEPTABLE.includes(name)) return 20 + regional;
  return regional;
};

/** The most natural English voice available, or null to let the browser pick one for en-US. */
export const pickVoice = <V extends VoiceInfo>(voices: readonly V[]): V | null => {
  let best: V | null = null;
  let bestScore = 0;
  for (const voice of voices) {
    const score = voiceScore(voice);
    if (score > bestScore) {
      best = voice;
      bestScore = score;
    }
  }
  return best;
};

/** Browsers load voices asynchronously: wait for the list (at most `timeoutMs`). */
const voicesReady = (synth: SpeechSynthesis, timeoutMs = 1500): Promise<void> => {
  if (synth.getVoices().length > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    synth.addEventListener?.('voiceschanged', done);
  });
};

/** The operator's voice, through the browser's speech synthesis. */
export const createSpeechOutput = (
  synth: SpeechSynthesis | undefined = globalThis.speechSynthesis,
  Utterance: typeof SpeechSynthesisUtterance | undefined = globalThis.SpeechSynthesisUtterance,
): SpeechOutput => {
  const supported = Boolean(synth && Utterance);
  let voice: SpeechSynthesisVoice | null | undefined;
  return {
    supported,
    async speak(text) {
      if (!synth || !Utterance || !text.trim()) return;
      if (voice === undefined) {
        await voicesReady(synth);
        voice = pickVoice(synth.getVoices());
      }
      await new Promise<void>((resolve) => {
        const utterance = new Utterance(text);
        utterance.lang = 'en-US';
        if (voice) utterance.voice = voice;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        synth.speak(utterance);
      });
    },
    cancel() {
      synth?.cancel();
    },
  };
};
