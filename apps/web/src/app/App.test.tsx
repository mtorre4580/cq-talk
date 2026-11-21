import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('renders the app name as the main heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'CQ talk' })).toBeInTheDocument();
  });
});
