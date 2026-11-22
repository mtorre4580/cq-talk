import { arcPath, knobTurn, needleAngle, polar, scaleTicks, spreadAngle } from './dial';

describe('dial geometry', () => {
  it('measures angles clockwise from 12 o’clock', () => {
    expect(polar([0, 0], 10, 0).map(Math.round)).toEqual([0, -10]);
    expect(polar([0, 0], 10, 90).map(Math.round)).toEqual([10, 0]);
  });

  it('draws arcs clockwise between two angles', () => {
    expect(arcPath([100, 100], 50, -90, 90)).toBe('M50 100 A50 50 0 0 1 150 100');
  });

  it('spreads ticks evenly and labels only the majors', () => {
    const ticks = scaleTicks({
      center: [0, 0],
      radius: 100,
      from: -40,
      to: 40,
      count: 8,
      majorEvery: 4,
      length: 5,
      labels: ['A', 'B', 'C'],
    });
    expect(ticks).toHaveLength(9);
    expect(ticks.filter((t) => t.major)).toHaveLength(3);
    expect(ticks.flatMap((t) => (t.label ? [t.label.text] : []))).toEqual(['A', 'B', 'C']);
    expect(ticks[4]!.label).toMatchObject({ x: 0, angle: 0 });
  });

  it('moves the needles and the knob together with the position, clamped to the band', () => {
    expect(needleAngle(0)).toBe(-38);
    expect(needleAngle(50)).toBe(0);
    expect(needleAngle(140)).toBe(38);
    expect(knobTurn(44)).toBe(141);
    expect(spreadAngle(0)).toBe(-28);
  });
});
