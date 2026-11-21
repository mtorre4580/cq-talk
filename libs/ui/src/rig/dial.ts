/** The dial covers the 3–30 MHz world band. */
export const BAND_START_MHZ = 3;
export const BAND_END_MHZ = 30;
const TICK_COUNT = 25;

export interface DialTick {
  /** Major ticks every fourth mark carry a MHz label */
  major: boolean;
  label: string;
}

/** The prototype's 25 ticks: majors at 3, 8, 12, 17, 21, 26 and 30 MHz. */
export const DIAL_TICKS: readonly DialTick[] = Array.from({ length: TICK_COUNT }, (_, k) => {
  const major = k % 4 === 0;
  const mhz = BAND_START_MHZ + k * ((BAND_END_MHZ - BAND_START_MHZ) / (TICK_COUNT - 1));
  return { major, label: major ? String(Math.round(mhz)) : '' };
});

/** CSS `left` for the needle: 18 px insets on both sides, `position` from 0 to 100. */
export const needleLeft = (position: number): string =>
  `calc(18px + (100% - 36px) * ${Math.min(100, Math.max(0, position)) / 100})`;
