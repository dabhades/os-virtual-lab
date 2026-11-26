import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeCanvas3D } from '../../src/components/three/SafeCanvas3D';
import { useAppStore } from '../../src/core/useAppStore';

describe('SafeCanvas3D', () => {
  it('renders 2D fallback cleanly when WebGL is unavailable or prefer2DOnly is enabled', () => {
    useAppStore.getState().updatePreferences({ prefer2DOnly: true });

    render(
      <SafeCanvas3D
        scene3D={<div>3D Scene</div>}
        fallback2D={<div>2D Fallback View</div>}
      />
    );

    expect(screen.getByText('2D Fallback View')).toBeTruthy();
    expect(screen.queryByText('3D Scene')).toBeNull();
  });
});
