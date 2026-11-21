import type { ReactNode } from 'react';

export interface RigProps {
  /** The transceiver (a `RigCase`) */
  radio: ReactNode;
  /** The desk microphone beside it */
  microphone: ReactNode;
}

/** Radio and microphone side by side on desktop; the microphone wraps below on phones. */
export const Rig = ({ radio, microphone }: RigProps) => (
  <div className="flex w-full flex-wrap items-end justify-center gap-6">
    {radio}
    {microphone}
  </div>
);
