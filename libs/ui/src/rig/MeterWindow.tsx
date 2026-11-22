import type { ReactNode } from 'react';

export interface MeterWindowProps {
  /** Engraved under the window */
  label: string;
  /** The wide center window has a taller top radius */
  main?: boolean;
  /** The cream face (an SVG) */
  children: ReactNode;
}

/**
 * Bakelite bezel and glass around a backlit cream face. The overlays read `--power` from the
 * desk set: the face is dark when the set is off and warms to amber as the valves heat up.
 */
export const MeterWindow = ({ label, main = false, children }: MeterWindowProps) => (
  <div className={main ? 'cq-window cq-window-main' : 'cq-window'}>
    <div className="cq-glass">
      {children}
      <div className="cq-warm" />
      <div className="cq-dim" />
      <div className="cq-bloom" />
      <div className="cq-shine" />
    </div>
    <span className="cq-window-label cq-eng">{label}</span>
  </div>
);
