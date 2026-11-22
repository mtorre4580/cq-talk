import type { CSSProperties } from 'react';

export interface KnobProps {
  /** Engraved above the knob */
  label: string;
  /** Where the white pointer rests, in degrees from 12 o'clock */
  pointer: number;
}

/** Knurled bakelite knob. Decorative: the receiver's real controls are the keys and the mic. */
export const Knob = ({ label, pointer }: KnobProps) => (
  <div className="cq-ctl" aria-hidden="true">
    <span className="cq-eng">{label}</span>
    <div className="cq-knob" style={{ '--pointer': `${pointer}deg` } as CSSProperties} />
  </div>
);
