import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import type { DiskStepState } from '../../../engines/diskScheduling/types';

export function DiskScene3D({ state }: { state: DiskStepState | null }) {
  if (!state) return null;

  const maxCyl = Math.max(1, state.cylinderCount - 1);
  const ratio = state.headPosition / maxCyl; // 0 = outer/inner mapping
  const armRadius = 0.6 + ratio * 1.9;

  return (
    <div className="h-60 w-full overflow-hidden rounded-xl border border-subtle bg-slate-100">
      <Canvas camera={{ position: [0, 3.8, 4.6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />

        {/* Disk Platter */}
        <mesh rotation={[0, 0, 0]} position={[0, -0.2, 0]}>
          <cylinderGeometry args={[2.7, 2.7, 0.14, 48]} />
          <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.3} />
        </mesh>

        {/* Spindle */}
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 24]} />
          <meshStandardMaterial color="#64748B" />
        </mesh>

        {/* Active Track Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.11, 0]}>
          <ringGeometry args={[armRadius - 0.04, armRadius + 0.04, 48]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>

        {/* Read/Write Arm Head */}
        <mesh position={[armRadius, 0.05, 0]}>
          <boxGeometry args={[0.35, 0.18, 0.25]} />
          <meshStandardMaterial color="#38BDF8" />
        </mesh>
        <Text position={[armRadius, 0.42, 0]} fontSize={0.24} color="#0F172A">
          {`Cyl ${state.headPosition}`}
        </Text>

        <OrbitControls enablePan={false} minDistance={4} maxDistance={10} />
      </Canvas>
    </div>
  );
}
