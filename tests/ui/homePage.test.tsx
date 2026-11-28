import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '../../src/features/home/HomePage';
import { LABS_CATALOGUE } from '../../src/data/labsCatalogue';

describe('HomePage', () => {
  it('renders all 8 topic cards, quick-jump shortcuts, and expandable explanations', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Learn Operating Systems by Trying Them/i })
    ).toBeTruthy();

    for (const lab of LABS_CATALOGUE) {
      expect(screen.getByRole('heading', { name: lab.title })).toBeTruthy();
      expect(
        screen.getByRole('link', { name: `Open ${lab.title} simulator` })
      ).toBeTruthy();
    }

    const toggles = screen.getAllByRole('button', {
      name: /How it actually works/i,
    });
    expect(toggles.length).toBe(LABS_CATALOGUE.length);
    fireEvent.click(toggles[0]);
    expect(toggles[0].getAttribute('aria-expanded')).toBe('true');
  });
});
