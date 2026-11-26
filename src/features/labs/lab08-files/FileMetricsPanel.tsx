import type {
  FileManagementMetrics,
  FileStepState,
} from '../../../engines/fileManagement/types';

export function FileMetricsPanel({
  state,
  finalMetrics,
}: {
  state: FileStepState | null;
  finalMetrics: FileManagementMetrics | null;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run file operations to inspect block usage and index overhead.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">Storage Metrics</h2>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Used Blocks</div>
          <div className="font-mono text-lg font-bold text-blue-600 tabular-nums">
            {state.usedBlocks} / {state.diskBlocks.length}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Free Blocks</div>
          <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
            {state.freeBlocks}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Index Overhead</div>
          <div className="font-mono text-lg font-bold text-amber-700 tabular-nums">
            {state.indexOverheadBlocks} blks
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Failed Ops</div>
          <div className="font-mono text-lg font-bold text-rose-700 tabular-nums">
            {finalMetrics?.failedOps ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
