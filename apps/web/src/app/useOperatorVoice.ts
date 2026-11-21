import { useEffect, useMemo, useRef } from 'react';
import type { LogEntry } from '@cq-talk/qso';
import { createSpeechOutput } from '@cq-talk/speech';
import type { SpeechOutput } from '@cq-talk/speech';

interface OperatorVoiceOptions {
  /** Speak at all (follows the SONIDO toggle) */
  enabled: boolean;
  /** Static under the voice; returns the function that fades it out */
  hiss: () => () => void;
  /** Called while the operator speaks (live mode pauses the microphone) */
  onSpeaking?: (speaking: boolean) => void;
  output?: SpeechOutput;
}

/** Reads each new operator line aloud once, over a bed of static, like a real receiver. */
export const useOperatorVoice = (
  log: readonly LogEntry[],
  { enabled, hiss, onSpeaking, output }: OperatorVoiceOptions,
) => {
  const voice = useMemo(() => output ?? createSpeechOutput(), [output]);
  const spoken = useRef(new Set<string>());
  const callbacks = useRef({ hiss, onSpeaking });
  useEffect(() => {
    callbacks.current = { hiss, onSpeaking };
  });

  useEffect(() => {
    // A new QSO starts with an empty log: forget the previous one's lines
    if (log.length === 0) spoken.current.clear();
    const fresh = log.filter((e) => e.who === 'operator' && !spoken.current.has(e.id));
    fresh.forEach((entry) => spoken.current.add(entry.id));
    const last = fresh[fresh.length - 1];
    if (!enabled || !last) return;

    // The demo log is re-derived on every clock tick, so the speech must outlive this effect run
    const stopHiss = callbacks.current.hiss();
    callbacks.current.onSpeaking?.(true);
    void voice.speak(last.text).finally(() => {
      stopHiss();
      callbacks.current.onSpeaking?.(false);
    });
  }, [log, enabled, voice]);

  // Hanging up or muting cuts the operator off
  useEffect(() => {
    if (!enabled) voice.cancel();
  }, [enabled, voice]);

  useEffect(() => () => voice.cancel(), [voice]);
};
