import { useI18n } from '@cq-talk/i18n';
import { BAND_SPREAD, arcPath, scaleTicks, spreadAngle } from './dial';
import { ScaleMarks } from './ScaleMarks';

const { center, from, to } = BAND_SPREAD;
const RINGS = [
  {
    radius: 150,
    color: '#2a2620',
    ticks: scaleTicks({
      center,
      radius: 150,
      from,
      to,
      count: 20,
      majorEvery: 4,
      length: 5,
      majorLength: 9,
      labels: ['0', '20', '40', '60', '80', '100'],
      labelRadius: 133,
    }),
  },
  {
    radius: 122,
    color: '#b0130a',
    ticks: scaleTicks({
      center,
      radius: 122,
      from,
      to,
      count: 10,
      majorEvery: 2,
      length: 5,
      majorLength: 9,
      labels: ['3.5', '7', '14', '21', '28'],
      labelRadius: 105,
    }),
  },
];

/** Small fine-tuning face whose needle turns several times across the band. */
export const BandSpread = ({ position }: { position: number }) => {
  const { t } = useI18n();
  return (
    <svg aria-hidden="true" viewBox="0 0 200 140">
      <rect width="200" height="140" fill="#efe3c4" />
      {RINGS.map((ring) => (
        <g key={ring.radius}>
          <path
            d={arcPath(center, ring.radius, from, to)}
            fill="none"
            stroke={ring.color}
            strokeWidth="1"
          />
          <ScaleMarks
            ticks={ring.ticks}
            color={ring.color}
            fontSize={10}
            majorWidth={1.2}
            minorWidth={0.6}
          />
        </g>
      ))}
      <text
        x="100"
        y="128"
        textAnchor="middle"
        fontFamily="Oswald, sans-serif"
        fontSize="7"
        letterSpacing="1.5"
        fill="#5a4a3a"
      >
        {t('rig.spreadScale')}
      </text>
      <line
        className="cq-needle"
        x1="100"
        y1="190"
        x2="100"
        y2="34"
        stroke="#b0130a"
        strokeWidth="1.4"
        style={{
          transformOrigin: '100px 190px',
          transformBox: 'view-box',
          transform: `rotate(${spreadAngle(position)}deg)`,
        }}
      />
    </svg>
  );
};
