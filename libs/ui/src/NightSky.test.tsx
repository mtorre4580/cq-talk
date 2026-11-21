import { render, screen } from '@testing-library/react';
import { NightSky } from './NightSky';
import { STARS } from './stars';

describe('NightSky', () => {
  it('is decorative and hidden from assistive tech', () => {
    const { container } = render(<NightSky glow="idle" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws the 40 stars of the prototype', () => {
    expect(STARS).toHaveLength(40);
    expect(STARS[1]).toEqual({ left: '37%', top: '53%', delay: '0.37s' });
  });

  it.each([
    ['idle', '0.5'],
    ['on-air', '1'],
    ['report', '0.7'],
  ] as const)('sets the aurora opacity for %s', (glow, opacity) => {
    render(<NightSky glow={glow} />);
    expect(screen.getByTestId('aurora')).toHaveStyle({ opacity });
  });
});
