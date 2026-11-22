import type { SpeechOutput } from './speechOutput';

/** Recorded speech playing somewhere (the radio voice chain); `done` resolves when it ends. */
export interface Playback {
  done: Promise<void>;
  stop(): void;
}

export interface CloudSpeechOptions {
  /** Text to encoded audio (e.g. ElevenLabs) */
  synthesize: (text: string, signal: AbortSignal) => Promise<ArrayBuffer>;
  /** Plays encoded audio; null when it cannot */
  play: (audio: ArrayBuffer) => Promise<Playback | null>;
  /** Used whenever the cloud voice fails, so the operator never goes silent */
  fallback: SpeechOutput;
}

/** The operator's voice from a cloud text-to-speech service, played through the radio. */
export const createCloudSpeechOutput = ({
  synthesize,
  play,
  fallback,
}: CloudSpeechOptions): SpeechOutput => {
  let controller: AbortController | null = null;
  let playing: Playback | null = null;

  return {
    supported: true,
    async speak(text) {
      if (!text.trim()) return;
      const current = new AbortController();
      controller = current;
      try {
        const audio = await synthesize(text, current.signal);
        if (current.signal.aborted) return;
        const playback = await play(audio);
        if (current.signal.aborted) {
          playback?.stop();
          return;
        }
        if (!playback) throw new Error('Cannot play the cloud voice');
        playing = playback;
        await playback.done;
      } catch {
        if (!current.signal.aborted) await fallback.speak(text);
      } finally {
        if (controller === current) {
          controller = null;
          playing = null;
        }
      }
    },
    cancel() {
      controller?.abort();
      playing?.stop();
      fallback.cancel();
    },
  };
};
