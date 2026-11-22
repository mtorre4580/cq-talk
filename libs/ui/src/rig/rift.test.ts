import { STRANDS, WAVE_FRAMES, strandFrames, strandPath } from './rift';

const xs = (path: string) => [...path.matchAll(/[ML](-?[\d.]+) /g)].map((m) => Number(m[1]));

describe('aurora rift strands', () => {
  it('pins every strand to the middle of the rift at both ends', () => {
    for (const strand of STRANDS) {
      const points = xs(strandPath(strand, 1.3));
      expect(points[0]).toBe(50);
      expect(points.at(-1)).toBe(50);
    }
  });

  it('waves within its amplitude', () => {
    const strand = STRANDS[0]!;
    const points = xs(strandPath(strand, 0.7));
    const reach = Math.max(...points.map((x) => Math.abs(x - 50)));
    expect(reach).toBeGreaterThan(strand.amp * 0.5);
    // amplitude × breathing (1.3) × harmonics (1.12)
    expect(reach).toBeLessThanOrEqual(strand.amp * 1.3 * 1.12);
  });

  it('loops seamlessly: the last frame is the first', () => {
    const frames = strandFrames(STRANDS[1]!).split(';');
    expect(frames).toHaveLength(WAVE_FRAMES + 1);
    expect(frames.at(-1)).toBe(frames[0]);
    expect(frames[1]).not.toBe(frames[0]);
  });
});
