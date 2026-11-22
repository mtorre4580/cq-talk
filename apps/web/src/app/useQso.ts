import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialQso, isOnAir, qsoReducer } from '@cq-talk/qso';
import type { Preset, QsoMode } from '@cq-talk/qso';

/** Pause between pressing a weekly key and the call, so the needle travels first */
export const PRESET_CALL_DELAY_MS = 750;
/**
 * Pause between switching the microphone off and the QSL card: the valves cool down
 * (`COOL_DOWN_MS` in `@cq-talk/ui`) and the aurora rift closes to a thread first
 */
export const CLOSING_DELAY_MS = 2300;

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
export const useQso = (effects: QsoEffects = {}, mode: QsoMode = 'demo') => {
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
  const modeRef = useRef(mode);
  useEffect(() => {
    fx.current = effects;
    modeRef.current = mode;
  });

  const call = useCallback((topic: string) => {
    if (!topic.trim()) return;
    fx.current.unlock?.();
    fx.current.tuneIn?.();
    dispatch({ type: 'call', topic, mode: modeRef.current });
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
          mode: modeRef.current,
        });
      });
    },
    [later],
  );

  /** `pending`: work the QSL card waits for (the live report) besides the closing pause */
  const hangUp = useCallback(
    (pending?: Promise<unknown>) => {
      fx.current.off?.();
      dispatch({ type: 'hang-up' });
      if (!pending) {
        later(CLOSING_DELAY_MS, () => dispatch({ type: 'closed' }));
        return;
      }
      const pause = new Promise<void>((resolve) => later(CLOSING_DELAY_MS, resolve));
      void Promise.allSettled([pause, pending]).then(() => dispatch({ type: 'closed' }));
    },
    [later],
  );

  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  return { state, dispatch, setQuery, call, pickPreset, hangUp, restart };
};
