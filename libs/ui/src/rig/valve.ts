import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { usePrefersReducedMotion } from '@cq-talk/platform';
import type { MicState } from './DeskMicrophone';

/** `power` lights the dials, `lamp` the ON AIR jewel, `tally` the microphone's tally (0–1). */
export interface ValveLevels {
  power: number;
  lamp: number;
  tally: number;
}

/** Standby at home, full power on air, dark while the QSL card prints. */
export const VALVE_LEVELS: Record<MicState, ValveLevels> = {
  off: { power: 0.45, lamp: 0, tally: 0 },
  on: { power: 1, lamp: 1, tally: 1 },
  closing: { power: 0, lamp: 0, tally: 0 },
};

/** The set comes up from dark when the page opens */
export const FIRST_LIGHT_MS = 2200;
/** A call goes out: the filaments heat to full brightness */
export const WARM_UP_MS = 1500;
/** Hang-up: the glow decays, then the QSL card prints */
export const COOL_DOWN_MS = 2000;

/**
 * How far a ramp has come at `progress` (0–1). A filament heats slowly, then fast (cubic
 * ease-out); it cools exponentially, quick at first and with a long afterglow.
 */
export const valveCurve = (progress: number, warming: boolean): number => {
  const k = Math.min(1, Math.max(0, progress));
  return warming ? 1 - Math.pow(1 - k, 3) : 1 - Math.exp(-5 * k) * (1 - k);
};

const lerp = (from: number, to: number, k: number) => from + (to - from) * k;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const write = (element: HTMLElement, levels: ValveLevels) => {
  element.style.setProperty('--power', levels.power.toFixed(3));
  element.style.setProperty('--lamp', levels.lamp.toFixed(3));
  element.style.setProperty('--tally', levels.tally.toFixed(3));
};

/**
 * Ramps the receiver's light toward `target` like a valve set: the filaments catch with a flicker
 * and heat up, the ON AIR jewel stutters before it holds, and switching off lets the glow die
 * away. The levels go straight to the element's CSS custom properties (no re-render per frame).
 * With reduced motion they jump to the target.
 */
export const useValvePower = (element: RefObject<HTMLElement | null>, target: ValveLevels) => {
  const reducedMotion = usePrefersReducedMotion();
  const current = useRef<ValveLevels>({ power: 0, lamp: 0, tally: 0 });
  const { power, lamp, tally } = target;

  useEffect(() => {
    const node = element.current;
    if (!node) return;
    const to = { power, lamp, tally };
    const apply = (levels: ValveLevels) => {
      current.current = levels;
      write(node, levels);
    };
    if (reducedMotion || typeof requestAnimationFrame !== 'function') {
      apply(to);
      return;
    }

    const from = current.current;
    const warming = to.power >= from.power;
    const duration = !warming ? COOL_DOWN_MS : from.power === 0 ? FIRST_LIGHT_MS : WARM_UP_MS;
    let start: number | undefined;
    let frame = 0;
    const step = (now: number) => {
      start ??= now;
      const progress = Math.min(1, (now - start) / duration);
      const k = valveCurve(progress, warming);
      // The filament catches unevenly in the first third of the ramp
      const flicker =
        progress < 0.35 && Math.random() < 0.25 ? (warming ? -0.25 : 0.18) * (1 - progress) : 0;
      // The jewel stutters on, then holds
      const lampK = warming && progress < 0.15 ? (Math.random() < 0.5 ? 0.9 : 0.1) : k;
      apply({
        power: clamp01(lerp(from.power, to.power, k) + flicker),
        lamp: clamp01(lerp(from.lamp, to.lamp, lampK)),
        tally: lerp(from.tally, to.tally, k),
      });
      if (progress < 1) frame = requestAnimationFrame(step);
      else apply(to);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [element, power, lamp, tally, reducedMotion]);
};
