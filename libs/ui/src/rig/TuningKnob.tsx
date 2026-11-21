export interface TuningKnobProps {
  /** Same 0–100 position as the dial needle; the knob turns 3.2° per step */
  position: number;
}

/** Knurled tuning knob that turns together with the dial needle. */
export const TuningKnob = ({ position }: TuningKnobProps) => (
  <svg aria-hidden="true" viewBox="0 0 80 80" width="64" height="64" className="shrink-0">
    <g
      data-testid="tuning-knob"
      style={{
        transformOrigin: '40px 40px',
        transformBox: 'view-box',
        transition: 'transform .7s var(--ease-spring)',
        transform: `rotate(${Math.round(position * 3.2)}deg)`,
      }}
    >
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="#C9CCC4"
        stroke="#7E837D"
        strokeWidth="7"
        strokeDasharray="2 3"
      />
      <circle cx="40" cy="40" r="22" fill="#2A2E2B" />
      <rect x="38" y="20" width="4" height="14" rx="2" fill="#E8E4D8" />
    </g>
  </svg>
);
