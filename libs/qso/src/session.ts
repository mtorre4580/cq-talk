import { HOME_FREQ, HOME_POSITION } from './presets';
import type { Preset } from './presets';
import { STATIONS } from './stations';
import type { Station } from './stations';
import { tuneTopic } from './tuning';

export type Screen = 'home' | 'call' | 'report';

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
}

export type QsoAction =
  | { type: 'query'; value: string }
  /** A weekly frequency was pressed: the needle moves there before the call starts */
  | { type: 'preset'; preset: Preset; label: string }
  | { type: 'call'; topic: string; tuning?: { freq: string; position: number } }
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
      };
    }

    case 'tick':
      return state.screen === 'call' && !state.closing
        ? { ...state, elapsed: state.elapsed + 1 }
        : state;

    case 'hang-up':
      return state.screen === 'call' && !state.closing ? { ...state, closing: true } : state;

    case 'closed':
      return state.screen === 'call' && state.closing
        ? { ...state, screen: 'report', closing: false }
        : state;

    case 'restart':
      return { ...initialQso, freq: state.freq, position: state.position };
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
