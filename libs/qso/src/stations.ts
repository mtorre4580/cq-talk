/** An AI operator's station. Its city lives in the i18n dictionaries under `stations.<id>`. */
export interface Station {
  id: StationId;
  /** Call sign shown on the display and the QSL card */
  call: string;
}

export type StationId = 'tokyo' | 'london' | 'sydney' | 'newYork' | 'toronto' | 'helsinki';

export const STATIONS: readonly Station[] = [
  { id: 'tokyo', call: 'JA1·AI' },
  { id: 'london', call: 'G4·AI' },
  { id: 'sydney', call: 'VK2·AI' },
  { id: 'newYork', call: 'W2·AI' },
  { id: 'toronto', call: 'VE3·AI' },
  { id: 'helsinki', call: 'OH2·AI' },
];
