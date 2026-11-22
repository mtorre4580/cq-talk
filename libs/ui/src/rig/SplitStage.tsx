import type { ReactNode } from 'react';
import { AuroraRift } from './AuroraRift';

/** `on` while the call is live, `closing` while it collapses after hanging up. */
export type RiftState = 'off' | 'on' | 'closing';

export interface SplitStageProps {
  /** The screen is split in two: desk set on the left, the QSO on the right */
  split: boolean;
  rift: RiftState;
  /** A call is on screen (it changes the phone layout: smaller mic, no desk) */
  call: boolean;
  left: ReactNode;
  right?: ReactNode;
}

/**
 * The radio page. At home the desk set fills it; when a call goes out an aurora rift flashes in
 * the middle and the screen opens in two (top and bottom on phones), as in the film.
 */
export const SplitStage = ({ split, rift, call, left, right }: SplitStageProps) => (
  <div
    className="cq-split"
    data-split={split ? 'open' : 'closed'}
    data-rift={rift}
    data-call={call || undefined}
  >
    <div className="cq-pane-left">{left}</div>
    {rift !== 'off' && <AuroraRift />}
    <div className="cq-pane-right">{right}</div>
  </div>
);
