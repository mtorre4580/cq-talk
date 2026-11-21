import { qslFileName } from './exportQsl';

describe('qslFileName', () => {
  it('slugs the topic without accents', () => {
    expect(qslFileName('Exploración espacial', 'pdf')).toBe('cq-talk-qsl-exploracion-espacial.pdf');
    expect(qslFileName('¿¡!?', 'png')).toBe('cq-talk-qsl-qso.png');
  });
});
