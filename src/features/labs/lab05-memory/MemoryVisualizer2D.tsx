import type { MemoryStepState } from '../../../engines/memoryAllocation/types';
import { getPidColor } from '../lab02-cpu/CpuVisualizer2D';

export function MemoryVisualizer2D({ state }: { state: MemoryStepState | null }) {
  if (!state || !Array.isArray(state.blocks)) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Configure RAM and operations to visualize memory blocks.
      </div>
    );
  }

  const totalSize = Math.max(
    1,
    state.blocks.reduce((sum, b) => sum + b.size, 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-mono text-slate-700">
          Operation: <strong className="text-blue-600">{state.lastOperationLabel}</strong>
        </span>
        <span className="font-mono text-slate-500 tabular-nums">
          Next-Fit Cursor: {state.nextFitCursorAddr} KB
        </span>
      </div>

      {/* Proportional Horizontal RAM Strip */}
      <div className="rounded-xl border border-subtle bg-canvas/80 p-4">
        <div className="mb-2 flex justify-between font-mono text-[10px] text-slate-500 tabular-nums">
          <span>0 KB</span>
          <span>{totalSize} KB</span>
        </div>

        <div className="flex h-20 w-full overflow-hidden rounded-xl border border-subtle bg-surface">
          {state.blocks.map((block) => {
            const pct = (block.size / totalSize) * 100;
            const isFree = block.status === 'FREE';
            const waste =
              !isFree && typeof block.requestedSize === 'number'
                ? block.size - block.requestedSize
                : 0;
            const wastePct = block.size > 0 ? (waste / block.size) * 100 : 0;

            return (
              <div
                key={block.id}
                style={{ width: `${Math.max(pct, 4)}%` }}
                title={`${isFree ? 'FREE' : block.pid}: ${block.startAddr}–${block.startAddr + block.size} KB (${block.size} KB)`}
                className={`relative flex flex-col items-center justify-center border-r border-slate-200 px-1 text-center font-mono text-[11px] last:border-r-0 ${
                  isFree
                    ? 'bg-slate-100 text-slate-500'
                    : getPidColor(block.pid ?? 'P')
                }`}
              >
                {wastePct > 0 && (
                  <div
                    style={{ width: `${wastePct}%` }}
                    className="absolute inset-y-0 right-0 bg-amber-500/25"
                    title={`Internal Fragmentation: ${waste} KB`}
                  />
                )}
                <span className="relative z-10 font-bold">
                  {isFree ? 'FREE' : block.pid}
                </span>
                <span className="relative z-10 text-[10px] opacity-80 tabular-nums">
                  {block.size}K
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-sky-500/40 border border-blue-500" />
            Allocated Block
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-100 border border-slate-300" />
            Free Hole
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-500/40 border border-amber-400" />
            Internal Fragmentation
          </span>
        </div>
      </div>

      {/* Block Address Table */}
      <div className="max-h-44 overflow-y-auto rounded-xl border border-subtle bg-canvas/60">
        <table className="w-full text-left font-mono text-xs tabular-nums">
          <thead className="border-b border-subtle text-[11px] text-slate-500">
            <tr>
              <th className="px-3 py-1.5">Start</th>
              <th className="px-2 py-1.5">End</th>
              <th className="px-2 py-1.5">Size</th>
              <th className="px-2 py-1.5">Status</th>
              <th className="px-2 py-1.5">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {state.blocks.map((b) => (
              <tr key={b.id} className="text-slate-800">
                <td className="px-3 py-1.5">{b.startAddr} KB</td>
                <td className="px-2 py-1.5">{b.startAddr + b.size} KB</td>
                <td className="px-2 py-1.5">{b.size} KB</td>
                <td className="px-2 py-1.5">
                  <span
                    className={
                      b.status === 'ALLOCATED'
                        ? 'text-blue-600'
                        : 'text-slate-500'
                    }
                  >
                    {b.status}
                  </span>
                </td>
                <td className="px-2 py-1.5">{b.pid ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
