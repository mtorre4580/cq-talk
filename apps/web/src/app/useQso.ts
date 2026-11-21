import { useCallback, useEffect, useReducer, useRef } from 'react';
import { initialQso, isOnAir, qsoReducer } from '@cq-talk/qso';
import type { Preset } from '@cq-talk/qso';

/** Pause between pressing a weekly key and the call, so the needle travels first */
export const PRESET_CALL_DELAY_MS = 750;
/** Pause between switching the microphone off and the QSL card */
export const CLOSING_DELAY_MS = 1200;

/**
 * Runs the QSO state machine and the timers around it. The reducer in `@cq-talk/qso` stays pure;
 * every timeout and interval lives here and is cleared on unmount.
 */
export const useQso = () => {
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

  const call = useCallback((topic: string) => dispatch({ type: 'call', topic }), []);

  const pickPreset = useCallback(
    (preset: Preset, label: string) => {
      dispatch({ type: 'preset', preset, label });
      later(PRESET_CALL_DELAY_MS, () =>
        dispatch({
          type: 'call',
          topic: label,
          tuning: { freq: preset.freq, position: preset.position },
        }),
      );
    },
    [later],
  );

  const hangUp = useCallback(() => {
    dispatch({ type: 'hang-up' });
    later(CLOSING_DELAY_MS, () => dispatch({ type: 'closed' }));
  }, [later]);

  const restart = useCallback(() => dispatch({ type: 'restart' }), []);

  return { state, setQuery, call, pickPreset, hangUp, restart };
};
