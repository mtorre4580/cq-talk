import { endsTransmission, normalizeTransmission } from './transmission';

describe('transmission', () => {
  it('ends when the speaker says over', () => {
    expect(endsTransmission('I think so over')).toBe(true);
    expect(endsTransmission('I think so. Over.')).toBe(true);
    expect(endsTransmission('game over then we talk')).toBe(false);
    expect(endsTransmission('I went over')).toBe(true);
  });

  it('tidies recognized speech for the log', () => {
    expect(normalizeTransmission('i think it is interesting over')).toBe(
      'I think it is interesting. Over.',
    );
    expect(normalizeTransmission('Really? over')).toBe('Really? Over.');
    expect(normalizeTransmission('  yes, i agree,  ')).toBe('Yes, i agree. Over.');
    expect(normalizeTransmission(' over ')).toBe('');
  });

  it('does not count words that merely end in "over"', () => {
    expect(endsTransmission('what a hangover')).toBe(false);
    expect(normalizeTransmission('what a hangover')).toBe('What a hangover. Over.');
  });

  it('stays fast on long, hostile input', () => {
    const hostile = `a${'\t'.repeat(50_000)}b`;
    const start = performance.now();
    normalizeTransmission(hostile);
    endsTransmission(`over${' '.repeat(50_000)}x`);
    expect(performance.now() - start).toBeLessThan(200);
  });
});
