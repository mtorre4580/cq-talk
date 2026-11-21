import { useEffect, useMemo, useRef } from 'react';
import type { LogEntry } from '@cq-talk/qso';
import { createSpeechOutput } from '@cq-talk/speech';
import type { SpeechOutput } from '@cq-talk/speech';

interface OperatorVoiceOptions {
  /** Speak at all (follows the SONIDO toggle) */
  enabled: boolean;
  /** Static under the voice; returns the function that fades it out */
  hiss: () => () => void;
  /**
   * The operator line still streaming in, if any. It is read once it is complete: reading it on
   * its first chunk once left only "Copy that" spoken.
   */
  streamingId?: string | null;
  /** Called while the operator speaks */
  onSpeaking?: (speaking: boolean) => void;
  /** A line was read to the end, or skipped (sound off): the user's turn may start */
  onDone?: (id: string) => void;
  output?: SpeechOutput;
}

/** Reads each complete operator line aloud once, over a bed of static, like a real receiver. */
export const useOperatorVoice = (
  log: readonly LogEntry[],
  { enabled, hiss, streamingId = null, onSpeaking, onDone, output }: OperatorVoiceOptions,
) => {
  const voice = useMemo(() => output ?? createSpeechOutput(), [output]);
  const spoken = useRef(new Set<string>());
  const callbacks = useRef({ hiss, onSpeaking, onDone });
  useEffect(() => {
    callbacks.current = { hiss, onSpeaking, onDone };
  });

  useEffect(() => {
    // A new QSO starts with an empty log: forget the previous one's lines
    if (log.length === 0) spoken.current.clear();
    const fresh = log.filter(
      (e) => e.who === 'operator' && e.id !== streamingId && !spoken.current.has(e.id),
    );
    fresh.forEach((entry) => spoken.current.add(entry.id));
    const last = fresh[fresh.length - 1];
    if (!last) return;
    if (!enabled) {
      fresh.forEach((entry) => callbacks.current.onDone?.(entry.id));
      return;
    }

    // The demo log is re-derived on every clock tick, so the speech must outlive this effect run
    const stopHiss = callbacks.current.hiss();
    callbacks.current.onSpeaking?.(true);
    void voice.speak(last.text).finally(() => {
      stopHiss();
      callbacks.current.onSpeaking?.(false);
      callbacks.current.onDone?.(last.id);
    });
  }, [log, enabled, streamingId, voice]);

  // Hanging up or muting cuts the operator off
  useEffect(() => {
    if (!enabled) voice.cancel();
  }, [enabled, voice]);

  useEffect(() => () => voice.cancel(), [voice]);
};
