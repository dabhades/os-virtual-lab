import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import type { CpuStepState } from '../../../engines/cpuScheduling/types';

function ProcessCube({
  position,
  label,
  color,
}: {
  position: [number, number, number];
  label: string;
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      <Text
        position={[0, 0.72, 0]}
        fontSize={0.28}
        color="#0F172A"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

export function CpuScene3D({ state }: { state: CpuStepState | null }) {
  if (!state) return null;

  return (
    <div className="h-64 w-full overflow-hidden rounded-xl border border-subtle bg-slate-100">
      <Canvas
        camera={{ position: [0, 3.2, 6.5], fov: 45 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />

        {/* Ready Queue Platform */}
        <mesh position={[-3.2, -0.7, 0]}>
          <boxGeometry args={[3.2, 0.25, 1.8]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        <Text position={[-3.2, -1.15, 0.9]} fontSize={0.24} color="#F59E0B">
          READY QUEUE
        </Text>

        {state.readyQueue.slice(0, 3).map((pid, idx) => (
          <ProcessCube
            key={pid}
            position={[-4.2 + idx * 1.05, 0, 0]}
            label={pid}
            color="#F59E0B"
          />
        ))}

        {/* CPU Core */}
        <mesh position={[0, -0.7, 0]}>
          <boxGeometry args={[2.0, 0.3, 2.0]} />
          <meshStandardMaterial color="#0EA5E9" />
        </mesh>
        <Text position={[0, -1.15, 1.0]} fontSize={0.24} color="#38BDF8">
          CPU CORE (t={state.tick})
        </Text>

        {state.runningPid ? (
          <ProcessCube
            position={[0, 0.05, 0]}
            label={`${state.runningPid} (${state.remainingByPid[state.runningPid]}u)`}
            color="#38BDF8"
          />
        ) : (
          <Text position={[0, 0.1, 0]} fontSize={0.3} color="#64748B">
            IDLE
          </Text>
        )}

        {/* Completed Tray */}
        <mesh position={[3.2, -0.7, 0]}>
          <boxGeometry args={[3.2, 0.25, 1.8]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>
        <Text position={[3.2, -1.15, 0.9]} fontSize={0.24} color="#22C55E">
          COMPLETED ({state.completedPids.length})
        </Text>

        {state.completedPids.slice(-3).map((pid, idx) => (
          <ProcessCube
            key={pid}
            position={[2.2 + idx * 1.05, 0, 0]}
            label={pid}
            color="#22C55E"
          />
        ))}

        <OrbitControls enablePan={false} minDistance={4} maxDistance={11} />
      </Canvas>
    </div>
  );
}
