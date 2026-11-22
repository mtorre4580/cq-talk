/** One strand of light in the aurora rift. */
export interface Strand {
  color: string;
  /** Stroke width in px */
  width: number;
  /** Wave amplitude in viewBox units (the rift is 100 wide, 1000 tall) */
  amp: number;
  /** Phase offset in radians, so the strands never move in step */
  phase: number;
  opacity: number;
}

/** Green, violet and cyan around a white core, as in the prototype. */
export const STRANDS: readonly Strand[] = [
  { color: '#6cffb8', width: 1, amp: 22, phase: 3.1, opacity: 0.45 },
  { color: '#b49aff', width: 1.4, amp: 16, phase: -1.4, opacity: 0.6 },
  { color: '#7fd0ff', width: 1.2, amp: 18, phase: 2.3, opacity: 0.6 },
  { color: '#9fffe0', width: 1.8, amp: 13, phase: 1.1, opacity: 0.8 },
  { color: '#ffffff', width: 2.8, amp: 8, phase: 0, opacity: 1 },
];

const SEGMENTS = 48;
/** Frames in one wave cycle; SMIL morphs the path through them */
export const WAVE_FRAMES = 16;
const WAVELENGTH = 560;

/**
 * The strand at time `t` (radians): a sine wave travelling up the rift with a faint second
 * harmonic and a breathing amplitude, pinned at both ends.
 */
export const strandPath = ({ amp, phase }: Pick<Strand, 'amp' | 'phase'>, t: number): string => {
  const breathe = 1 + 0.3 * Math.sin(t + phase);
  let d = '';
  for (let i = 0; i <= SEGMENTS; i++) {
    const y = (i * 1000) / SEGMENTS;
    const pin = Math.pow(Math.sin((Math.PI * i) / SEGMENTS), 0.6);
    const k = (2 * Math.PI * y) / WAVELENGTH;
    const x =
      50 +
      amp * breathe * pin * (Math.sin(k + t + phase) + 0.12 * Math.sin(1.6 * k - 2 * t + phase));
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(1)}`;
  }
  return d;
};

/** Every frame of one full cycle, the first repeated at the end so the loop is seamless. */
export const strandFrames = (strand: Pick<Strand, 'amp' | 'phase'>): string =>
  Array.from({ length: WAVE_FRAMES + 1 }, (_, f) =>
    strandPath(strand, (2 * Math.PI * f) / WAVE_FRAMES),
  ).join(';');
