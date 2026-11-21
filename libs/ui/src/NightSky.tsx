import { STARS } from './stars';

/** How bright the aurora glows: dim while idle, full while on air, softer on the QSL card. */
export type SkyGlow = 'idle' | 'on-air' | 'report';

const AURORA_OPACITY: Record<SkyGlow, number> = { idle: 0.5, 'on-air': 1, report: 0.7 };

export interface NightSkyProps {
  glow: SkyGlow;
}

export const NightSky = ({ glow }: NightSkyProps) => (
  <div
    aria-hidden="true"
    data-glow={glow}
    className="pointer-events-none absolute inset-0 bg-night"
  >
    {STARS.map((star) => (
      <span
        key={`${star.left}-${star.top}`}
        className="absolute size-0.5 rounded-full bg-star animate-twinkle"
        style={{ left: star.left, top: star.top, animationDelay: star.delay }}
      />
    ))}
    <div
      data-testid="aurora"
      className="absolute inset-0 transition-opacity duration-[2s] ease-in-out"
      style={{ opacity: AURORA_OPACITY[glow] }}
    >
      <div className="cq-aurora cq-aurora-1" />
      <div className="cq-aurora cq-aurora-2" />
      <div className="cq-aurora cq-aurora-3" />
    </div>
  </div>
);
