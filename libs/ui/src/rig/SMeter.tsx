import { useI18n } from '@cq-talk/i18n';

export interface SMeterProps {
  /** The needle swings and the face glows while a signal is on air */
  active: boolean;
}

const SCALE = [
  { x: 26, y: 80, label: '1' },
  { x: 44, y: 50, label: '3' },
  { x: 70, y: 30, label: '5' },
  { x: 100, y: 24, label: '7' },
  { x: 127, y: 30, label: '9' },
];

/** Cream S meter in S units with a red +20 zone. */
export const SMeter = ({ active }: SMeterProps) => {
  const { t } = useI18n();
  return (
    <div
      className="flex flex-[1_1_170px] items-center justify-center rounded-lg border-[3px] border-plate bg-meter p-1.5"
      style={{
        boxShadow: `0 0 22px ${active ? 'rgba(255,190,90,.55)' : 'rgba(255,190,90,.15)'} inset`,
      }}
    >
      <svg role="img" aria-label={t('rig.meter')} viewBox="0 0 180 110" width="180" height="110">
        <path d="M24 92 A70 70 0 0 1 156 92" fill="none" stroke="#2A2620" strokeWidth="2" />
        <path d="M124 35 A70 70 0 0 1 156 92" fill="none" stroke="#B42318" strokeWidth="5" />
        <g fontFamily="Oswald, sans-serif" fontSize="11" fill="#2A2620" textAnchor="middle">
          {SCALE.map((mark) => (
            <text key={mark.label} x={mark.x} y={mark.y}>
              {mark.label}
            </text>
          ))}
          <text x="156" y="62" fill="#B42318">
            +20
          </text>
        </g>
        <text
          x="90"
          y="74"
          fontFamily="Oswald, sans-serif"
          fontSize="11"
          letterSpacing="2"
          fill="#5A5246"
          textAnchor="middle"
        >
          {t('rig.meterUnits')}
        </text>
        <line
          data-testid="s-meter-needle"
          x1="90"
          y1="92"
          x2="90"
          y2="26"
          stroke="#1A1814"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformOrigin: '90px 92px',
            transformBox: 'view-box',
            transform: 'rotate(-40deg)',
            animation: active ? 'cq-vu 1.2s ease-in-out infinite alternate' : 'none',
          }}
        />
        <circle cx="90" cy="92" r="6" fill="#1A1814" />
      </svg>
    </div>
  );
};
