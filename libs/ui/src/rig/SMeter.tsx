import { useI18n } from '@cq-talk/i18n';
import { S_METER, arcPath, scaleTicks } from './dial';
import { ScaleMarks } from './ScaleMarks';

const INK = '#2a2620';
const RED = '#b42318';
const { center, from, to } = S_METER;
const MARKS = scaleTicks({
  center,
  radius: 120,
  from,
  to,
  count: 7,
  majorEvery: 1,
  length: 10,
  majorLength: 10,
  labels: ['1', '3', '5', '7', '9', '+20', '+40', '+60'],
  labelRadius: 99,
});

export interface SMeterProps {
  /** The needle swings S5–S9 while a signal is on air and drifts low on standby */
  active: boolean;
}

/** Cream S meter in S units with a red zone past S9. */
export const SMeter = ({ active }: SMeterProps) => {
  const { t } = useI18n();
  return (
    <svg role="img" aria-label={t('rig.meter')} viewBox="0 0 200 140">
      <rect width="200" height="140" fill="#efe3c4" />
      <path d={arcPath(center, 120, from, 18)} fill="none" stroke={INK} strokeWidth="1.4" />
      <path d={arcPath(center, 120, 18, to)} fill="none" stroke={RED} strokeWidth="3.2" />
      <ScaleMarks ticks={MARKS} color={(i) => (i > 4 ? RED : INK)} fontSize={10} />
      <text
        x="100"
        y="96"
        textAnchor="middle"
        fontFamily="Special Elite, monospace"
        fontSize="15"
        fill={INK}
      >
        S
      </text>
      <text
        x="100"
        y="112"
        textAnchor="middle"
        fontFamily="Oswald, sans-serif"
        fontSize="7"
        letterSpacing="1.5"
        fill="#5a4a3a"
      >
        {t('rig.signal')}
      </text>
      <line
        data-testid="s-meter-needle"
        x1="100"
        y1="168"
        x2="100"
        y2="46"
        stroke="#1d1a16"
        strokeWidth="1.5"
        style={{
          transformOrigin: '100px 168px',
          transformBox: 'view-box',
          animation: active
            ? 'cq-smeter-air 1.4s ease-in-out infinite alternate'
            : 'cq-smeter-idle 5s ease-in-out infinite',
        }}
      />
      <rect x="70" y="126" width="60" height="20" fill="#1a1512" />
      <circle cx="100" cy="136" r="6" fill="#2a2420" />
    </svg>
  );
};
