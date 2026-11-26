import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import type { SyncStepState } from '../../../engines/synchronization/types';

export function SyncScene3D({ state }: { state: SyncStepState | null }) {
  if (!state) return null;

  const isPC = state.scenario === 'PRODUCER_CONSUMER';

  return (
    <div className="h-60 w-full overflow-hidden rounded-xl border border-subtle bg-slate-100">
      <Canvas camera={{ position: [0, 3, 6.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />

        {/* Shared Resource / Buffer Stage */}
        <mesh position={[0, -0.7, 0]}>
          <boxGeometry args={[6.5, 0.2, 2.2]} />
          <meshStandardMaterial color="#1E293B" />
        </mesh>

        {isPC ? (
          state.buffer.map((slot, idx) => {
            const x = (idx - (state.buffer.length - 1) / 2) * 1.15;
            return (
              <group key={idx} position={[x, 0, 0]}>
                <mesh>
                  <boxGeometry args={[0.85, 0.85, 0.85]} />
                  <meshStandardMaterial
                    color={slot ? '#22C55E' : '#334155'}
                    transparent={!slot}
                    opacity={slot ? 1 : 0.4}
                  />
                </mesh>
                <Text position={[0, 0.72, 0]} fontSize={0.22} color="#0F172A">
                  {slot ?? `Slot ${idx}`}
                </Text>
              </group>
            );
          })
        ) : (
          state.processes.slice(0, 5).map((proc, idx) => {
            const x = (idx - (Math.min(state.processes.length, 5) - 1) / 2) * 1.25;
            const color =
              proc.state === 'BLOCKED'
                ? '#EF4444'
                : proc.state === 'IN_CS'
                  ? '#F59E0B'
                  : proc.state === 'DONE'
                    ? '#22C55E'
                    : '#38BDF8';
            return (
              <group key={proc.id} position={[x, 0, 0]}>
                <mesh>
                  <boxGeometry args={[0.85, 0.85, 0.85]} />
                  <meshStandardMaterial color={color} />
                </mesh>
                <Text position={[0, 0.72, 0]} fontSize={0.22} color="#0F172A">
                  {`${proc.id}\n${proc.state}`}
                </Text>
              </group>
            );
          })
        )}

        <OrbitControls enablePan={false} minDistance={4} maxDistance={11} />
      </Canvas>
    </div>
  );
}
