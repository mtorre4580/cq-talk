import { formatClock, topicSeed, tuneTopic } from './tuning';

describe('tuneTopic', () => {
  it('matches the prototype formulas', () => {
    // "Mundial 2026": seed 948 → 7 + 948 % 21 = 10, 100 + (948 * 7) % 900 = 436, 8 + 948 % 84 = 32
    expect(topicSeed('Mundial 2026')).toBe(948);
    expect(tuneTopic('Mundial 2026')).toEqual({
      freq: '10.436',
      position: 32,
      station: { id: 'tokyo', call: 'JA1·AI' },
    });
  });

  it('is stable for the same topic and ignores surrounding spaces', () => {
    expect(tuneTopic('  space  ')).toEqual(tuneTopic('space'));
  });

  it('keeps a preset frequency and position but still picks the station from the topic', () => {
    const tuning = tuneTopic('Cambio climático', { freq: '14.205', position: 44 });
    expect(tuning.freq).toBe('14.205');
    expect(tuning.position).toBe(44);
    expect(tuning.station.call).toMatch(/·AI$/);
  });

  it('always lands inside the dial', () => {
    for (const topic of ['a', 'zzzzzzzzzzzzzzzzzzz', 'Inteligencia artificial', '🙂']) {
      const { position } = tuneTopic(topic);
      expect(position).toBeGreaterThanOrEqual(8);
      expect(position).toBeLessThanOrEqual(91);
    }
  });
});

describe('formatClock', () => {
  it('pads minutes and seconds', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(75)).toBe('01:15');
    expect(formatClock(3600)).toBe('60:00');
  });
});
