import type { DiskStepState } from '../../../engines/diskScheduling/types';

export function DiskVisualizer2D({ state }: { state: DiskStepState | null }) {
  if (!state) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Configure disk cylinders and request queue to visualize head movement.
      </div>
    );
  }

  const maxCyl = Math.max(1, state.cylinderCount - 1);
  const svgW = 620;
  const padX = 28;
  const usableW = svgW - padX * 2;
  const rowH = 26;
  const svgH = Math.max(180, 44 + state.visitedPath.length * rowH);

  const toX = (cyl: number) => padX + (cyl / maxCyl) * usableW;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-subtle bg-canvas/70 px-3 py-2 font-mono text-xs">
        <span>
          Head Position:{' '}
          <strong className="text-blue-600 tabular-nums">
            Cylinder {state.headPosition}
          </strong>
        </span>
        <span className="text-slate-500 tabular-nums">
          Total Seek: <strong className="text-slate-900">{state.totalHeadMovement}</strong>
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-subtle bg-canvas/80 p-3">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="h-auto w-full min-w-[460px]"
          role="img"
          aria-label="Disk head seek trajectory graph"
        >
          {/* Cylinder Axis */}
          <line
            x1={padX}
            y1={24}
            x2={svgW - padX}
            y2={24}
            stroke="#334155"
            strokeWidth={2}
          />
          {[0, Math.round(maxCyl / 4), Math.round(maxCyl / 2), Math.round((3 * maxCyl) / 4), maxCyl].map(
            (tick) => (
              <g key={tick}>
                <line
                  x1={toX(tick)}
                  y1={20}
                  x2={toX(tick)}
                  y2={svgH - 12}
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                />
                <text
                  x={toX(tick)}
                  y={14}
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick}
                </text>
              </g>
            )
          )}

          {/* Path Lines */}
          {state.visitedPath.map((hop, idx) => {
            if (idx === 0) return null;
            const prev = state.visitedPath[idx - 1];
            const x1 = toX(prev.cylinder);
            const y1 = 36 + (idx - 1) * rowH;
            const x2 = toX(hop.cylinder);
            const y2 = 36 + idx * rowH;
            return (
              <line
                key={`line-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={hop.isReturnJump ? '#F59E0B' : '#38BDF8'}
                strokeWidth={2}
                strokeDasharray={hop.isReturnJump ? '5 4' : undefined}
              />
            );
          })}

          {/* Path Nodes */}
          {state.visitedPath.map((hop, idx) => {
            const cx = toX(hop.cylinder);
            const cy = 36 + idx * rowH;
            const isHead = idx === state.visitedPath.length - 1;
            const fill = isHead
              ? '#38BDF8'
              : hop.isRequestServed
                ? '#22C55E'
                : '#F59E0B';
            return (
              <g key={`pt-${idx}`}>
                <circle cx={cx} cy={cy} r={isHead ? 5.5 : 4} fill={fill} />
                <text
                  x={cx + 8}
                  y={cy + 3}
                  fill="#334155"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {hop.cylinder}
                  {hop.hopDistance > 0 ? ` (+${hop.hopDistance})` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
