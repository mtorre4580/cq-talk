import { DIAL_TICKS, needleLeft } from './dial';

describe('dial', () => {
  it('has the prototype ticks and major labels', () => {
    expect(DIAL_TICKS).toHaveLength(25);
    expect(DIAL_TICKS.filter((t) => t.major).map((t) => t.label)).toEqual([
      '3',
      '8',
      '12',
      '17',
      '21',
      '26',
      '30',
    ]);
  });

  it('places the needle inside the 18 px insets and clamps it', () => {
    expect(needleLeft(44)).toBe('calc(18px + (100% - 36px) * 0.44)');
    expect(needleLeft(-5)).toBe('calc(18px + (100% - 36px) * 0)');
    expect(needleLeft(140)).toBe('calc(18px + (100% - 36px) * 1)');
  });
});
