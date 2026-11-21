import { useI18n } from '@cq-talk/i18n';

/** `off` before a call, `on` during it, `closing` while the QSL card prints. */
export type MicState = 'off' | 'on' | 'closing';

export interface DeskMicrophoneProps {
  state: MicState;
  /** Tapping the live microphone ends the QSO */
  onHangUp: () => void;
}

const GRILLE = [
  [100, 86],
  [88, 86],
  [112, 86],
  [76, 86],
  [124, 86],
  [94, 75],
  [106, 75],
  [82, 75],
  [118, 75],
  [94, 97],
  [106, 97],
  [82, 97],
  [118, 97],
  [100, 64],
  [88, 64],
  [112, 64],
  [100, 108],
  [88, 108],
  [112, 108],
] as const;

/** Chrome desk microphone: grille lights up amber, the PTT bar turns red and the LED goes green when live. */
export const DeskMicrophone = ({ state, onHangUp }: DeskMicrophoneProps) => {
  const { t } = useI18n();
  const on = state === 'on';
  const label = on ? t('mic.on') : state === 'closing' ? t('mic.closing') : t('mic.off');
  const hint = on ? t('mic.hintOn') : state === 'closing' ? t('mic.hintClosing') : t('mic.hintOff');

  return (
    <div className="flex max-w-[240px] flex-[1_1_200px] flex-col items-center gap-2.5">
      <button
        type="button"
        aria-label={on ? t('mic.labelOn') : t('mic.labelOff')}
        onClick={() => {
          if (on) onHangUp();
        }}
        className="group cursor-pointer border-0 bg-transparent p-0"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 200 300"
          width="180"
          height="270"
          className="group-hover:brightness-[1.08]"
        >
          <circle
            cx="100"
            cy="86"
            r="70"
            fill="none"
            stroke={on ? 'rgba(110,255,190,.55)' : 'rgba(110,255,190,0)'}
            strokeWidth="10"
            style={{ transition: 'stroke 1s ease' }}
          />
          <circle cx="100" cy="86" r="60" fill="#C9CCC4" stroke="#7E837D" strokeWidth="4" />
          <circle cx="100" cy="86" r="48" fill="#2A2E2B" />
          <g
            data-testid="mic-grille"
            fill={on ? '#FFB347' : '#5A5F5B'}
            style={{ transition: 'fill .6s ease' }}
          >
            {GRILLE.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
            ))}
          </g>
          <rect x="92" y="144" width="16" height="96" rx="4" fill="#9EA39C" />
          <path
            d="M30 262 Q34 236 70 234 L130 234 Q166 236 170 262 Z"
            fill="#46564F"
            stroke="#2A322E"
            strokeWidth="2"
          />
          <rect x="26" y="260" width="148" height="22" rx="8" fill="#2E3833" />
          <rect
            x="62"
            y="246"
            width="76"
            height="10"
            rx="4"
            fill={on ? '#FF4A2E' : '#6E716B'}
            style={{ transition: 'fill .4s ease' }}
          />
        </svg>
      </button>
      <div className="flex items-center gap-2 font-label text-[13px] tracking-[2px] text-night-label">
        <span
          aria-hidden="true"
          className={`size-2.5 rounded-full ${on ? 'bg-led-on' : 'bg-led-off'}`}
          style={{ boxShadow: on ? '0 0 10px rgba(108,255,184,.9)' : 'none' }}
        />
        {label}
      </div>
      <span className="text-center text-[13px] text-night-muted">{hint}</span>
    </div>
  );
};
