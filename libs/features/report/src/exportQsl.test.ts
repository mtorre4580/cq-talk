import { qslFileName } from './exportQsl';

describe('qslFileName', () => {
  it('slugs the topic without accents', () => {
    expect(qslFileName('Exploración espacial', 'pdf')).toBe('cq-talk-qsl-exploracion-espacial.pdf');
    expect(qslFileName('¿¡!?', 'png')).toBe('cq-talk-qsl-qso.png');
  });

  it('stays fast on long, hostile topics', () => {
    const start = performance.now();
    expect(qslFileName('-'.repeat(50_000) + 'x', 'pdf')).toBe('cq-talk-qsl-x.pdf');
    expect(performance.now() - start).toBeLessThan(200);
  });

  it('keeps names short', () => {
    expect(qslFileName('a'.repeat(100), 'pdf')).toBe(`cq-talk-qsl-${'a'.repeat(40)}.pdf`);
  });
});
