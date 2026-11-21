/** A weekly frequency: a ready-made topic tuned to a fixed spot on the dial. */
export interface Preset {
  /** Stable id; its label lives in the i18n dictionaries under `presets.<id>` */
  id: PresetId;
  /** Frequency in MHz, as printed on the key */
  freq: string;
  /** Needle position on the dial, 0–100 */
  position: number;
}

export type PresetId =
  'health' | 'worldCup' | 'ai' | 'climate' | 'space' | 'economy' | 'elections' | 'movies';

/** "Frecuencias de la semana", in the prototype's order and positions. */
export const PRESETS: readonly Preset[] = [
  { id: 'health', freq: '3.650', position: 4 },
  { id: 'worldCup', freq: '7.074', position: 17 },
  { id: 'ai', freq: '10.136', position: 29 },
  { id: 'climate', freq: '14.205', position: 44 },
  { id: 'space', freq: '18.110', position: 58 },
  { id: 'economy', freq: '21.300', position: 70 },
  { id: 'elections', freq: '24.950', position: 83 },
  { id: 'movies', freq: '28.400', position: 95 },
];

/** Where the needle rests before any call (the prototype's starting frequency). */
export const HOME_FREQ = '14.205';
export const HOME_POSITION = 44;
