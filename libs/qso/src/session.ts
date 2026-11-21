import type { Assessment, CallStatus, LiveError, LogEntry } from './conversation';
import { demoLinesAt, demoScript } from './demo';
import { HOME_FREQ, HOME_POSITION } from './presets';
import type { Preset } from './presets';
import { STATIONS } from './stations';
import type { Station } from './stations';
import type { QslReport } from './report';
import { tuneTopic } from './tuning';

export type Screen = 'home' | 'call' | 'report';

/** `demo` replays the prototype's script; `live` talks to a real operator (PR 10). */
export type QsoMode = 'demo' | 'live';

/** Everything the screens need to know about the current QSO (contact). */
export interface QsoState {
  screen: Screen;
  /** What the user is typing in the tuner */
  query: string;
  /** The topic of the active or last QSO */
  topic: string;
  freq: string;
  /** Needle position on the dial, 0–100 */
  position: number;
  station: Station;
  /** Seconds since the call started */
  elapsed: number;
  /** The microphone was switched off and the QSL card is printing */
  closing: boolean;
  mode: QsoMode;
  /** Live transmissions; in demo mode the log is derived from the script and the clock */
  log: LogEntry[];
  /** Live: the operator's transmission is still streaming in */
  operatorTalking: boolean;
  /** Live: the QSL lessons, once the operator wrote them */
  report: QslReport | null;
  error: LiveError | null;
}

export type QsoAction =
  | { type: 'query'; value: string }
  /** A weekly frequency was pressed: the needle moves there before the call starts */
  | { type: 'preset'; preset: Preset; label: string }
  | {
      type: 'call';
      topic: string;
      tuning?: { freq: string; position: number };
      mode?: QsoMode;
    }
  /** A chunk of the operator's live transmission (creates the entry on the first chunk) */
  | { type: 'operator-chunk'; id: string; text: string }
  | { type: 'operator-done' }
  /** The user finished a live transmission */
  | { type: 'transmission'; id: string; text: string }
  | { type: 'assessed'; id: string; assessment: Assessment }
  | { type: 'report-ready'; report: QslReport }
  | { type: 'live-error'; error: LiveError }
  | { type: 'tick' }
  | { type: 'hang-up' }
  | { type: 'closed' }
  | { type: 'restart' };

export const initialQso: QsoState = {
  screen: 'home',
  query: '',
  topic: '',
  freq: HOME_FREQ,
  position: HOME_POSITION,
  station: STATIONS[0] as Station,
  elapsed: 0,
  closing: false,
  mode: 'demo',
  log: [],
  operatorTalking: false,
  report: null,
  error: null,
};

/** Pure state machine: home → call → (closing) → report → home. */
export const qsoReducer = (state: QsoState, action: QsoAction): QsoState => {
  switch (action.type) {
    case 'query':
      return state.screen === 'home' ? { ...state, query: action.value } : state;

    case 'preset':
      if (state.screen !== 'home') return state;
      return { ...state, query: action.label, position: action.preset.position };

    case 'call': {
      const topic = action.topic.trim();
      if (state.screen !== 'home' || !topic) return state;
      const tuning = tuneTopic(topic, action.tuning);
      return {
        ...state,
        screen: 'call',
        topic,
        freq: tuning.freq,
        position: tuning.position,
        station: tuning.station,
        elapsed: 0,
        closing: false,
        mode: action.mode ?? 'demo',
        log: [],
        operatorTalking: false,
        report: null,
        error: null,
      };
    }

    case 'tick':
      return state.screen === 'call' && !state.closing
        ? { ...state, elapsed: state.elapsed + 1 }
        : state;

    case 'operator-chunk': {
      if (state.screen !== 'call' || state.closing) return state;
      const last = state.log[state.log.length - 1];
      const log =
        last?.id === action.id
          ? [...state.log.slice(0, -1), { ...last, text: last.text + action.text }]
          : [...state.log, { id: action.id, who: 'operator' as const, text: action.text }];
      return { ...state, log, operatorTalking: true, error: null };
    }

    case 'operator-done':
      return { ...state, operatorTalking: false };

    case 'transmission':
      if (state.screen !== 'call' || state.closing || !action.text.trim()) return state;
      return {
        ...state,
        log: [...state.log, { id: action.id, who: 'you', text: action.text.trim() }],
      };

    case 'assessed':
      return {
        ...state,
        log: state.log.map((entry) =>
          entry.id === action.id ? { ...entry, assessment: action.assessment } : entry,
        ),
      };

    case 'report-ready':
      return { ...state, report: action.report };

    case 'live-error':
      return { ...state, error: action.error, operatorTalking: false };

    case 'hang-up':
      return state.screen === 'call' && !state.closing
        ? { ...state, closing: true, operatorTalking: false }
        : state;

    case 'closed':
      return state.screen === 'call' && state.closing
        ? { ...state, screen: 'report', closing: false }
        : state;

    case 'restart':
      return { ...initialQso, freq: state.freq, position: state.position, mode: state.mode };
  }
};

/** Transmitting: the lamp, meter, glow and microphone are live. */
export const isOnAir = (state: QsoState): boolean => state.screen === 'call' && !state.closing;

export type SkyGlow = 'idle' | 'on-air' | 'report';
export const skyGlow = (state: QsoState): SkyGlow =>
  isOnAir(state) ? 'on-air' : state.screen === 'report' ? 'report' : 'idle';

export type MicState = 'off' | 'on' | 'closing';
export const micState = (state: QsoState): MicState =>
  isOnAir(state) ? 'on' : state.screen === 'call' && state.closing ? 'closing' : 'off';

/** Every transmission so far, oldest first. */
export const conversationLog = (state: QsoState): LogEntry[] =>
  state.mode === 'demo'
    ? demoScript(state.topic, state.station.call).slice(0, demoLinesAt(state.elapsed))
    : state.log;

/** The status line under the clock, as in the prototype. */
export const callStatus = (state: QsoState): CallStatus => {
  if (state.closing) return 'closing';
  if (state.operatorTalking) return 'receiving';
  const log = conversationLog(state);
  const last = log[log.length - 1];
  if (!last) return 'tuning';
  return last.who === 'operator' ? 'your-turn' : 'transmitting';
};

/** Live: the microphone may open (the operator finished and nothing is pending). */
export const isYourTurn = (state: QsoState): boolean => {
  if (state.mode !== 'live' || !isOnAir(state) || state.operatorTalking || state.error)
    return false;
  return state.log[state.log.length - 1]?.who === 'operator';
};
