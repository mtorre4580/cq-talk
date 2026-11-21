import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialQso, isOnAir, qsoReducer } from '@cq-talk/qso';
import type { Preset } from '@cq-talk/qso';

/** Pause between pressing a weekly key and the call, so the needle travels first */
export const PRESET_CALL_DELAY_MS = 750;
/** Pause between switching the microphone off and the QSL card */
export const CLOSING_DELAY_MS = 1200;

/** Side effects the radio makes around the QSO (sound effects today, speech later). */
export interface QsoEffects {
  /** Inside the user's click: lets audio start from the timers that follow */
  unlock?: () => void;
  /** The call goes out */
  tuneIn?: () => void;
  /** The microphone is switched off */
  off?: () => void;
}

/**
 * Runs the QSO state machine and the timers around it. The reducer in `@cq-talk/qso` stays pure;
 * every timeout and interval lives here and is cleared on unmount.
 */
export const useQso = (effects: QsoEffects = {}) => {
  const [state, dispatch] = useReducer(qsoReducer, initialQso);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((ms: number, run: () => void) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      run();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const onAir = isOnAir(state);
  useEffect(() => {
    if (!onAir) return;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [onAir]);

  const setQuery = useCallback((value: string) => dispatch({ type: 'query', value }), []);

  // Latest effects without re-creating every callback when they change
  const fx = useRef(effects);
  useEffect(() => {
    fx.current = effects;
  });

  const call = useCallback((topic: string) => {
    if (!topic.trim()) return;
    fx.current.unlock?.();
    fx.current.tuneIn?.();
    dispatch({ type: 'call', topic });
  }, []);

  const pickPreset = useCallback(
    (preset: Preset, label: string) => {
      fx.current.unlock?.();
      dispatch({ type: 'preset', preset, label });
      later(PRESET_CALL_DELAY_MS, () => {
        fx.current.tuneIn?.();
        dispatch({
          type: 'call',
          topic: label,
          tuning: { freq: preset.freq, position: preset.position },
        });
      });
    },
    [later],
  );

  const hangUp = useCallback(() => {
    fx.current.off?.();
    dispatch({ type: 'hang-up' });
    later(CLOSING_DELAY_MS, () => dispatch({ type: 'closed' }));
  }, [later]);

  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  return { state, setQuery, call, pickPreset, hangUp, restart };
};
