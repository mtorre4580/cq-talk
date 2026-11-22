import type { CSSProperties } from 'react';
import { knobTurn, scaleTicks } from './dial';
import { ScaleMarks } from './ScaleMarks';

const SCALE = scaleTicks({
  center: [50, 50],
  radius: 48,
  from: 0,
  to: 352.8,
  count: 49,
  majorEvery: 5,
  length: 3,
  majorLength: 6,
  labels: Array.from({ length: 10 }, (_, i) => String(i * 10)),
  labelRadius: 37,
});

export interface TuningKnobProps {
  /** Same 0–100 position as the dial needle; the knob turns 3.2° per step */
  position: number;
}

/** Chrome flywheel tuning knob with a satin logging scale and a three-spoke bakelite spinner. */
export const TuningKnob = ({ position }: TuningKnobProps) => (
  <div
    aria-hidden="true"
    data-testid="tuning-knob"
    className="cq-tune"
    style={{ '--turn': `${knobTurn(position)}deg` } as CSSProperties}
  >
    <div className="cq-tune-ring" />
    <div className="cq-tune-dial">
      <svg viewBox="0 0 100 100">
        <ScaleMarks
          ticks={SCALE}
          color="#1c1e20"
          fontSize={5}
          rotateLabels
          majorWidth={0.9}
          minorWidth={0.5}
        />
      </svg>
    </div>
    <div className="cq-tune-spinner" />
    <div className="cq-tune-gloss" />
    <span className="cq-tune-index" />
  </div>
);
