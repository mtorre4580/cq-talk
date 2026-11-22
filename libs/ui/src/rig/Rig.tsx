import type { CSSProperties, ReactNode } from 'react';
import type { MicState } from './DeskMicrophone';

export interface RigProps {
  /** Drives the valves: standby at home, full power on air, cooling down while closing */
  power: MicState;
  /** The receiver */
  radio: ReactNode;
  /** The desk microphone beside it */
  microphone: ReactNode;
}

/** `--power` lights the dials, `--lamp` the ON AIR jewel, `--tally` the microphone's tally. */
const LEVELS: Record<MicState, { power: number; lamp: number; tally: number }> = {
  off: { power: 0.45, lamp: 0, tally: 0 },
  on: { power: 1, lamp: 1, tally: 1 },
  closing: { power: 0, lamp: 0, tally: 0 },
};

/** The desk set: receiver and microphone side by side; the microphone moves under it on phones. */
export const Rig = ({ power, radio, microphone }: RigProps) => {
  const level = LEVELS[power];
  return (
    <div
      className="cq-deskset"
      data-power={power}
      style={
        {
          '--power': level.power,
          '--lamp': level.lamp,
          '--tally': level.tally,
        } as CSSProperties
      }
    >
      {radio}
      <div>{microphone}</div>
    </div>
  );
};
