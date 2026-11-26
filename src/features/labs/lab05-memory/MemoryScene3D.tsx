import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import type { MemoryStepState } from '../../../engines/memoryAllocation/types';

export function MemoryScene3D({ state }: { state: MemoryStepState | null }) {
  if (!state) return null;

  const total = Math.max(
    1,
    state.blocks.reduce((sum, b) => sum + b.size, 0)
  );
  const totalWidth = 8;

  let cursorX = -totalWidth / 2;

  return (
    <div className="h-60 w-full overflow-hidden rounded-xl border border-subtle bg-slate-100">
      <Canvas camera={{ position: [0, 2.8, 6.2], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.1} />

        {/* RAM PCB Base */}
        <mesh position={[0, -0.65, 0]}>
          <boxGeometry args={[totalWidth + 0.4, 0.2, 1.8]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>

        {state.blocks.map((block) => {
          const w = Math.max(0.25, (block.size / total) * totalWidth);
          const centerX = cursorX + w / 2;
          cursorX += w;
          const isFree = block.status === 'FREE';

          return (
            <group key={block.id} position={[centerX, 0, 0]}>
              <mesh>
                <boxGeometry args={[w - 0.04, isFree ? 0.55 : 0.95, 1.1]} />
                <meshStandardMaterial
                  color={isFree ? '#334155' : '#38BDF8'}
                  transparent={isFree}
                  opacity={isFree ? 0.45 : 0.95}
                />
              </mesh>
              <Text
                position={[0, 0.85, 0]}
                fontSize={0.22}
                color={isFree ? '#94A3B8' : '#F8FAFC'}
                anchorX="center"
              >
                {isFree ? `FREE\n${block.size}K` : `${block.pid}\n${block.size}K`}
              </Text>
            </group>
          );
        })}

        <OrbitControls enablePan={false} minDistance={4} maxDistance={11} />
      </Canvas>
    </div>
  );
}
