/** The dial covers the 3–30 MHz world band. */
export const BAND_START_MHZ = 3;
export const BAND_END_MHZ = 30;

export type Point = readonly [x: number, y: number];

/** Point at `radius` from `center`, `degrees` clockwise from 12 o'clock. */
export const polar = ([cx, cy]: Point, radius: number, degrees: number): Point => {
  const a = ((degrees - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
};

const round = (n: number) => Math.round(n * 100) / 100;

/** SVG arc from `from` to `to` degrees, clockwise. */
export const arcPath = (center: Point, radius: number, from: number, to: number): string => {
  const [x0, y0] = polar(center, radius, from);
  const [x1, y1] = polar(center, radius, to);
  return `M${round(x0)} ${round(y0)} A${radius} ${radius} 0 0 1 ${round(x1)} ${round(y1)}`;
};

export interface Tick {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  major: boolean;
  /** Printed under major ticks, rotated to follow the arc */
  label?: { x: number; y: number; text: string; angle: number };
}

export interface ScaleSpec {
  center: Point;
  radius: number;
  from: number;
  to: number;
  /** Number of intervals: there are `count + 1` ticks */
  count: number;
  majorEvery: number;
  /** Minor tick length; majors are longer */
  length: number;
  majorLength?: number;
  labels?: readonly string[];
  /** Where labels sit; defaults to inside the ticks */
  labelRadius?: number;
}

/** Ticks and labels evenly spread along an arc (the prototype's dial scales). */
export const scaleTicks = ({
  center,
  radius,
  from,
  to,
  count,
  majorEvery,
  length,
  majorLength = length * 1.7,
  labels,
  labelRadius = radius - length * 3.3,
}: ScaleSpec): Tick[] =>
  Array.from({ length: count + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / count;
    const major = i % majorEvery === 0;
    const [x1, y1] = polar(center, radius, angle);
    const [x2, y2] = polar(center, radius - (major ? majorLength : length), angle);
    const text = major ? labels?.[i / majorEvery] : undefined;
    const tick: Tick = { x1: round(x1), y1: round(y1), x2: round(x2), y2: round(y2), major };
    if (text) {
      const [x, y] = polar(center, labelRadius, angle);
      tick.label = { x: round(x), y: round(y), text, angle: round(angle) };
    }
    return tick;
  });

const clamp = (position: number) => Math.min(100, Math.max(0, position));

/** Main dial: the needle sweeps 76° around a pivot below the window. */
export const MAIN_DIAL = { center: [200, 330] as Point, from: -38, to: 38 };
export const needleAngle = (position: number): number =>
  round(MAIN_DIAL.from + ((MAIN_DIAL.to - MAIN_DIAL.from) * clamp(position)) / 100);

/** Band spread: a fine dial that turns several times across the band. */
export const BAND_SPREAD = { center: [100, 190] as Point, from: -32, to: 32 };
export const spreadAngle = (position: number): number =>
  round(-28 + ((clamp(position) * 7.3) % 56));

/** S meter: S1–S9 then +20/+40/+60 in red. */
export const S_METER = { center: [100, 168] as Point, from: -48, to: 48 };

/** The tuning knob turns 3.2° per step, together with the needle. */
export const knobTurn = (position: number): number => Math.round(clamp(position) * 3.2);
