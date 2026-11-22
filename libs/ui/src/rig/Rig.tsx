import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { MicState } from './DeskMicrophone';
import { VALVE_LEVELS, useValvePower } from './valve';

export interface RigProps {
  /** Drives the valves: standby at home, full power on air, cooling down while closing */
  power: MicState;
  /** The receiver */
  radio: ReactNode;
  /** The desk microphone beside it */
  microphone: ReactNode;
}

/**
 * The desk set: receiver and microphone side by side; the microphone moves under it on phones.
 * Its `--power`, `--lamp` and `--tally` light the dials, the ON AIR jewel and the mic's tally,
 * ramping like a valve set as the QSO starts and ends.
 */
export const Rig = ({ power, radio, microphone }: RigProps) => {
  const deskset = useRef<HTMLDivElement>(null);
  useValvePower(deskset, VALVE_LEVELS[power]);
  return (
    <div ref={deskset} className="cq-deskset" data-power={power}>
      {radio}
      <div>{microphone}</div>
    </div>
  );
};
