import { useMemo, type ReactNode } from 'react';
import { useAppStore } from '../../core/useAppStore';

function detectWebGLSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    );
  } catch {
    return false;
  }
}

interface SafeCanvas3DProps {
  scene3D: ReactNode;
  fallback2D: ReactNode;
  force2D?: boolean;
}

/**
 * Renders an interactive 3D scene when WebGL is available and the user has not
 * enabled 2D-Only / Low-GPU mode; otherwise falls back seamlessly to 2D.
 */
export function SafeCanvas3D({
  scene3D,
  fallback2D,
  force2D = false,
}: SafeCanvas3DProps) {
  const prefer2DOnly = useAppStore((s) => s.preferences.prefer2DOnly);
  const webglAvailable = useMemo(() => detectWebGLSupport(), []);

  if (force2D || prefer2DOnly || !webglAvailable) {
    return <>{fallback2D}</>;
  }

  return <>{scene3D}</>;
}
