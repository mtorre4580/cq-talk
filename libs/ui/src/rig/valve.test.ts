import { valveCurve } from './valve';

describe('valveCurve', () => {
  it('starts at 0 and ends at 1 both ways', () => {
    for (const warming of [true, false]) {
      expect(valveCurve(0, warming)).toBe(0);
      expect(valveCurve(1, warming)).toBe(1);
    }
  });

  it('heats slowly then fast, and cools fast with a long afterglow', () => {
    // Warming is an ease-out: most of the light comes in the first half
    expect(valveCurve(0.5, true)).toBeCloseTo(0.875);
    // Cooling drops most of the glow in the first fifth
    expect(valveCurve(0.2, false)).toBeGreaterThan(0.6);
    expect(valveCurve(0.9, false)).toBeLessThan(1);
  });

  it('clamps progress outside 0–1', () => {
    expect(valveCurve(-1, true)).toBe(0);
    expect(valveCurve(3, false)).toBe(1);
  });
});
