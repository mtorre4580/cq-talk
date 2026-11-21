export interface SpeechOutput {
  readonly supported: boolean;
  /** Speaks in English; resolves when done (or right away where speech is unavailable) */
  speak(text: string): Promise<void>;
  cancel(): void;
}

/** Best English voice available: US first, then any English one. */
export const pickVoice = (voices: readonly SpeechSynthesisVoice[]): SpeechSynthesisVoice | null =>
  voices.find((v) => v.lang === 'en-US') ??
  voices.find((v) => v.lang.toLowerCase().startsWith('en')) ??
  null;

/** The operator's voice, through the browser's speech synthesis. */
export const createSpeechOutput = (
  synth: SpeechSynthesis | undefined = globalThis.speechSynthesis,
  Utterance: typeof SpeechSynthesisUtterance | undefined = globalThis.SpeechSynthesisUtterance,
): SpeechOutput => {
  const supported = Boolean(synth && Utterance);
  return {
    supported,
    speak(text) {
      if (!synth || !Utterance || !text.trim()) return Promise.resolve();
      return new Promise((resolve) => {
        const utterance = new Utterance(text);
        utterance.lang = 'en-US';
        const voice = pickVoice(synth.getVoices());
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
