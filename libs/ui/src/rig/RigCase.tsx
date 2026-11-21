import type { ReactNode } from 'react';

export interface RigCaseProps {
  /** The case casts a green glow while on air */
  onAir: boolean;
  children: ReactNode;
}

/** The transceiver's black body and sage-green chassis that holds every panel. */
export const RigCase = ({ onAir, children }: RigCaseProps) => (
  <div
    className="max-w-[820px] min-w-0 flex-[999_1_620px] rounded-[18px] bg-rig-body p-2.5"
    style={{
      boxShadow: `0 24px 60px rgba(0,0,0,.7), 0 0 80px ${onAir ? 'rgba(70,255,170,.22)' : 'rgba(70,255,170,.06)'}`,
      transition: 'box-shadow 1.5s ease',
    }}
  >
    <div className="flex flex-col gap-[18px] rounded-xl border border-rig-border bg-rig-chassis p-[22px] shadow-[inset_0_1px_0_#6F8279]">
      {children}
    </div>
  </div>
);
