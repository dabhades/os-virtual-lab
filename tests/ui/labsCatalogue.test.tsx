import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabsCataloguePage } from '../../src/features/labs/LabsCataloguePage';
import { LABS_CATALOGUE } from '../../src/data/labsCatalogue';

describe('LabsCataloguePage', () => {
  it('renders all 8 practical labs cleanly', () => {
    render(
      <MemoryRouter>
        <LabsCataloguePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Operating Systems Simulators/i })
    ).toBeTruthy();

    for (const lab of LABS_CATALOGUE) {
      expect(screen.getByText(lab.title)).toBeTruthy();
    }
  });
});
