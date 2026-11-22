import { usePrefersReducedMotion } from '@cq-talk/platform';
import { STRANDS, strandFrames, strandPath } from './rift';

const STILL = STRANDS.map((strand) => strandPath(strand, 0));
const FRAMES = STRANDS.map(strandFrames);

/**
 * The aurora rift that splits the call screen, as in the film: a flare and streaks rippled by an
 * SVG displacement filter, and a core of light strands whose waves travel up the rift. Its
 * entrance and exit are CSS animations keyed on `.cq-split[data-rift]`. With reduced motion the
 * strands hold still.
 */
export const AuroraRift = () => {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <div className="cq-rift" aria-hidden="true">
      <div className="cq-rift-flare" />
      <div className="cq-rift-streaks" />
      <div className="cq-rift-core">
        <svg viewBox="0 0 100 1000" preserveAspectRatio="none">
          {STRANDS.map((strand, n) => (
            <path
              key={strand.color}
              d={STILL[n]}
              fill="none"
              stroke={strand.color}
              strokeWidth={strand.width}
              opacity={strand.opacity}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            >
              {!reducedMotion && (
                <animate
                  attributeName="d"
                  dur={`${6 + n * 0.7}s`}
                  values={FRAMES[n]}
                  repeatCount="indefinite"
                />
              )}
            </path>
          ))}
        </svg>
      </div>
      <svg width="0" height="0">
        <filter id="cq-rift-wave" x="-40%" y="-5%" width="180%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.002 0.004"
            numOctaves={1}
            seed={4}
            result="noise"
          >
            {!reducedMotion && (
              <animate
                attributeName="baseFrequency"
                dur="10s"
                values="0.002 0.004;0.0024 0.0055;0.0021 0.0045;0.002 0.004"
                repeatCount="indefinite"
              />
            )}
          </feTurbulence>
          {/* Only sideways displacement: green is pinned to the neutral 0.5 */}
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1"
            result="sideways"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="sideways"
            scale={34}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  );
};
