import { endsTransmission, normalizeTransmission } from './transmission';

/** The part of the Web Speech API we use (TypeScript's DOM lib does not ship it). */
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface RecognitionEvent {
  readonly results: ArrayLike<RecognitionResult>;
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type RecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechWindow {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
}

/** Standard constructor, or the prefixed one Chrome and Safari still ship. */
export const findRecognition = (): RecognitionConstructor | null => {
  const w = globalThis as unknown as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export type SpeechInputError =
  'not-allowed' | 'no-microphone' | 'network' | 'unsupported' | 'other';

const mapError = (error: string): SpeechInputError => {
  if (error === 'not-allowed' || error === 'service-not-allowed') return 'not-allowed';
  if (error === 'audio-capture') return 'no-microphone';
  if (error === 'network') return 'network';
  return 'other';
};

export interface SpeechInputOptions {
  /** What the user is saying so far, while they speak */
  onInterim: (text: string) => void;
  /** A complete transmission, normalized to end in "Over." */
  onTransmission: (text: string) => void;
  onError: (error: SpeechInputError) => void;
  /** End the turn after this much silence even without "over" */
  silenceMs?: number;
  lang?: string;
  Recognition?: RecognitionConstructor | null;
}

export interface SpeechInput {
  /** Opens the microphone for one transmission */
  listen(): void;
  /** Closes the microphone and drops what was heard */
  stop(): void;
}

/**
 * Half-duplex speech recognition: listens for one transmission at a time and hands it over when
 * the user says "over" or stops talking.
 */
export const createSpeechInput = ({
  onInterim,
  onTransmission,
  onError,
  silenceMs = 1500,
  lang = 'en-US',
  Recognition = findRecognition(),
}: SpeechInputOptions): SpeechInput => {
  let recognition: SpeechRecognitionLike | null = null;
  let listening = false;
  let transcript = '';
  let silence: ReturnType<typeof setTimeout> | undefined;

  const reset = () => {
    clearTimeout(silence);
    transcript = '';
  };

  const finish = () => {
    const text = normalizeTransmission(transcript);
    listening = false;
    reset();
    recognition?.stop();
    if (text) onTransmission(text);
  };

  const ensure = (): SpeechRecognitionLike | null => {
    if (recognition) return recognition;
    if (!Recognition) return null;
    const r = new Recognition();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (event) => {
      let text = '';
      let final = true;
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        text += result[0].transcript;
        final = result.isFinal;
      }
      transcript = text.trim();
      onInterim(transcript);
      clearTimeout(silence);
      if (final && endsTransmission(transcript)) finish();
      else silence = setTimeout(finish, silenceMs);
    };
    r.onerror = (event) => {
      // "no-speech" and "aborted" are part of normal turn-taking
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      listening = false;
      reset();
      onError(mapError(event.error));
    };
    r.onend = () => {
      // Browsers end continuous recognition on their own after a while: keep the turn open
      if (listening) r.start();
    };
    recognition = r;
    return r;
  };

  return {
    listen() {
      const r = ensure();
      if (!r) {
        onError('unsupported');
        return;
      }
      if (listening) return;
      reset();
      listening = true;
      r.start();
    },
    stop() {
      listening = false;
      reset();
      recognition?.abort();
    },
  };
};
