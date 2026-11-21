import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '@cq-talk/platform';
import { createRadioSfx } from './radioSfx';
import type { RadioSfx, RadioVoicePlayback } from './radioSfx';

export const SOUND_STORAGE_KEY = 'sound';

const initialSoundOn = () => storage.get(SOUND_STORAGE_KEY) !== 'off';

export interface RadioSound {
  soundOn: boolean;
  toggleSound: () => void;
  /** Call from the click that starts a QSO so later sounds may play */
  unlock: () => void;
  tuneIn: () => void;
  off: () => void;
  /** Static under the operator's voice; returns the function that fades it out */
  hiss: () => () => void;
  /** Recorded speech through the radio; null when muted or without Web Audio */
  voice: (encoded: ArrayBuffer) => Promise<RadioVoicePlayback | null>;
}

/**
 * Radio sounds with the "SONIDO · ON/OFF" preference (on by default, stored in `cq-talk:sound`).
 * Pass a custom `RadioSfx` in tests.
 */
export const useRadioSfx = (sfx?: RadioSfx): RadioSound => {
  const effects = useMemo(() => sfx ?? createRadioSfx(), [sfx]);
  const [soundOn, setSoundOn] = useState(initialSoundOn);

  useEffect(() => () => effects.dispose(), [effects]);

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      storage.set(SOUND_STORAGE_KEY, on ? 'off' : 'on');
      return !on;
    });
  }, []);

  return {
    soundOn,
    toggleSound,
    unlock: useCallback(() => {
      if (soundOn) effects.unlock();
    }, [effects, soundOn]),
    tuneIn: useCallback(() => {
      if (soundOn) effects.tuneIn();
    }, [effects, soundOn]),
    off: useCallback(() => {
      if (soundOn) effects.off();
    }, [effects, soundOn]),
    hiss: useCallback(() => (soundOn ? effects.hiss() : () => {}), [effects, soundOn]),
    voice: useCallback(
      async (encoded: ArrayBuffer) => (soundOn ? effects.voice(encoded) : null),
      [effects, soundOn],
    ),
  };
};
