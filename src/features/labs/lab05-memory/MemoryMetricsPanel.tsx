import type {
  MemoryAllocationMetrics,
  MemoryStepState,
} from '../../../engines/memoryAllocation/types';

export function MemoryMetricsPanel({
  state,
  finalMetrics,
}: {
  state: MemoryStepState | null;
  finalMetrics: MemoryAllocationMetrics | null;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run the simulator to view live RAM utilization and fragmentation metrics.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">
        RAM Utilization & Fragmentation
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Utilization</div>
          <div className="font-mono text-lg font-bold text-blue-600 tabular-nums">
            {state.utilizationPercent}%
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Largest Free Hole</div>
          <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
            {state.largestFreeBlock} KB
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Internal Frag.</div>
          <div className="font-mono text-lg font-bold text-amber-700 tabular-nums">
            {state.internalFragmentation} KB
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">External Frag.</div>
          <div className="font-mono text-lg font-bold text-rose-700 tabular-nums">
            {state.externalFragmentation} KB
          </div>
        </div>
      </div>

      {finalMetrics && (
        <div className="rounded-xl border border-subtle bg-canvas/60 p-3 font-mono text-xs text-slate-700 tabular-nums">
          Final Run: {finalMetrics.allocationSuccessCount} succeeded ·{' '}
          {finalMetrics.allocationFailCount} failed · Free:{' '}
          {finalMetrics.freeMemory} KB
        </div>
      )}
    </div>
  );
}
