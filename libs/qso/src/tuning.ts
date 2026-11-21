import { STATIONS } from './stations';
import type { Station } from './stations';

/** Character-code checksum of a topic, the seed the prototype uses for everything it derives. */
export const topicSeed = (topic: string): number => {
  let n = 0;
  for (let i = 0; i < topic.length; i++) n = (n + topic.charCodeAt(i)) % 997;
  return n;
};

export interface Tuning {
  freq: string;
  position: number;
  station: Station;
}

/**
 * Tunes a free-text topic: the same topic always lands on the same frequency, needle position
 * and station (formulas from the prototype). Presets pass their own frequency and position.
 */
export const tuneTopic = (topic: string, fixed?: { freq: string; position: number }): Tuning => {
  const n = topicSeed(topic.trim());
  const station = STATIONS[n % STATIONS.length] as Station;
  return {
    freq: fixed?.freq ?? `${7 + (n % 21)}.${100 + ((n * 7) % 900)}`,
    position: fixed?.position ?? 8 + (n % 84),
    station,
  };
};

/** `mm:ss` clock for the call display and the QSL card. */
export const formatClock = (seconds: number): string => {
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
