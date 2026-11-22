import { useI18n } from '@cq-talk/i18n';

/** `off` before a call, `on` during it, `closing` while the QSL card prints. */
export type MicState = 'off' | 'on' | 'closing';

export interface DeskMicrophoneProps {
  state: MicState;
  /** Pressing the switched-off microphone calls CQ */
  onCall: () => void;
  /** Pressing the live microphone ends the QSO */
  onHangUp: () => void;
}

/**
 * Black desk microphone on a chrome stand, like the ones on 1960s ham desks. Pressing it calls
 * (the push-to-talk bar sinks and the tally lights); pressing it again hangs up.
 */
export const DeskMicrophone = ({ state, onCall, onHangUp }: DeskMicrophoneProps) => {
  const { t } = useI18n();
  const on = state === 'on';
  const caption = on ? t('mic.on') : state === 'closing' ? t('mic.closing') : t('mic.off');

  return (
    <div className="cq-mic-stand">
      <button
        type="button"
        className="cq-mic"
        data-state={state}
        aria-label={on ? t('mic.labelOn') : t('mic.labelOff')}
        aria-disabled={state === 'closing' || undefined}
        onClick={() => {
          if (on) onHangUp();
          else if (state === 'off') onCall();
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 120 270">
          <defs>
            <linearGradient id="cq-mic-chrome" x1="0" x2="1">
              <stop offset="0" stopColor="#5b6167" />
              <stop offset=".35" stopColor="#fbfcfc" />
              <stop offset=".6" stopColor="#9aa1a7" />
              <stop offset="1" stopColor="#3b4046" />
            </linearGradient>
            <linearGradient id="cq-mic-chrome-v" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f6f7" />
              <stop offset=".5" stopColor="#8d949a" />
              <stop offset="1" stopColor="#3b4046" />
            </linearGradient>
            <linearGradient id="cq-mic-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4a4f4c" />
              <stop offset=".25" stopColor="#2a2d2b" />
              <stop offset="1" stopColor="#0d0e0d" />
            </linearGradient>
            <linearGradient id="cq-mic-head" x1="0" x2="1">
              <stop offset="0" stopColor="#0a0a0a" />
              <stop offset=".3" stopColor="#2d2d2d" />
              <stop offset=".55" stopColor="#141414" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
            <pattern id="cq-mic-holes" width="5" height="5" patternUnits="userSpaceOnUse">
              <rect width="5" height="5" fill="#262626" />
              <circle cx="2.5" cy="2.5" r="1.25" fill="#050505" />
            </pattern>
            <radialGradient id="cq-mic-tally">
              <stop offset="0" stopColor="#fff1e6" />
              <stop offset=".35" stopColor="#ff5a3a" />
              <stop offset="1" stopColor="#ff2a10" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* head */}
          <rect
            x="30"
            y="14"
            width="60"
            height="112"
            rx="14"
            fill="url(#cq-mic-head)"
            stroke="url(#cq-mic-chrome)"
            strokeWidth="3"
          />
          <rect x="38" y="24" width="44" height="92" rx="8" fill="url(#cq-mic-holes)" />
          <rect className="cq-mic-glint" x="40" y="22" width="7" height="96" rx="3.5" fill="#fff" />
          {/* yoke and stem */}
          <path
            d="M24 74 Q24 140 60 140 Q96 140 96 74"
            fill="none"
            stroke="url(#cq-mic-chrome)"
            strokeWidth="5"
          />
          <circle cx="24" cy="74" r="5" fill="url(#cq-mic-chrome)" />
          <circle cx="96" cy="74" r="5" fill="url(#cq-mic-chrome)" />
          <rect x="55" y="138" width="10" height="78" fill="url(#cq-mic-chrome)" />
          {/* base, push-to-talk bar and tally */}
          <path
            d="M10 262 L22 214 Q24 206 34 206 L86 206 Q96 206 98 214 L110 262 Z"
            fill="url(#cq-mic-base)"
          />
          <path d="M10 262 L110 262" stroke="#000" strokeWidth="3" />
          <path
            d="M22 214 Q24 206 34 206 L86 206 Q96 206 98 214"
            fill="none"
            stroke="rgba(255,255,255,.25)"
            strokeWidth="1.5"
          />
          <g className="cq-mic-ptt">
            <rect
              x="28"
              y="222"
              width="64"
              height="9"
              rx="4"
              fill="url(#cq-mic-chrome-v)"
              stroke="#202326"
              strokeWidth="1"
            />
          </g>
          <circle cx="60" cy="248" r="4.2" fill="#3a0f0a" stroke="#9aa0a4" strokeWidth="1.2" />
          <circle className="cq-mic-tally" cx="60" cy="248" r="10" fill="url(#cq-mic-tally)" />
        </svg>
      </button>
      <span className="cq-mic-caption">{caption}</span>
    </div>
  );
};
