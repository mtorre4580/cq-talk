import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '@cq-talk/platform';
import { createRadioSfx } from './radioSfx';
import type { RadioSfx } from './radioSfx';

export const SOUND_STORAGE_KEY = 'sound';

const initialSoundOn = () => storage.get(SOUND_STORAGE_KEY) !== 'off';

export interface RadioSound {
  soundOn: boolean;
  toggleSound: () => void;
  /** Call from the click that starts a QSO so later sounds may play */
  unlock: () => void;
  tuneIn: () => void;
  off: () => void;
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
  };
};
