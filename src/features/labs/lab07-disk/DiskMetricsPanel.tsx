import { BarChart3 } from 'lucide-react';
import type {
  DiskSchedulingMetrics,
  DiskStepState,
} from '../../../engines/diskScheduling/types';

export function DiskMetricsPanel({
  state,
  comparisonRows,
  showComparison,
  onToggleComparison,
}: {
  state: DiskStepState | null;
  comparisonRows: DiskSchedulingMetrics[];
  showComparison: boolean;
  onToggleComparison: () => void;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run the simulation to view Total Head Movement and Average Seek Distance.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">Seek Metrics</h2>
        <button
          type="button"
          onClick={onToggleComparison}
          className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-canvas px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:border-blue-300"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{showComparison ? 'Hide Comparison' : 'Compare All 6 Algos'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Total Head Movement</div>
          <div className="font-mono text-lg font-bold text-blue-600 tabular-nums">
            {state.totalHeadMovement} cyl
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Avg Seek Movement</div>
          <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
            {state.averageSeekMovement} cyl
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-subtle bg-canvas/60 p-3 font-mono text-xs text-slate-700">
        <span className="text-slate-500">Service Order: </span>
        {state.serviceOrder.length === 0
          ? '—'
          : state.serviceOrder.join(' → ')}
      </div>

      {state.movementWithoutReturnJump !== state.totalHeadMovement && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Return-Jump Note:</strong> Total movement excluding the
          circular wrap-around jump is{' '}
          <span className="font-mono font-semibold tabular-nums">
            {state.movementWithoutReturnJump} cyl
          </span>
          .
        </div>
      )}

      {showComparison && comparisonRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-blue-200 bg-canvas/80 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            6-Algorithm Comparison
          </h3>
          <table className="w-full text-left font-mono text-xs tabular-nums">
            <thead className="border-b border-subtle text-[11px] text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">Algorithm</th>
                <th className="px-2 py-1.5">Total Seek</th>
                <th className="px-2 py-1.5">Avg Seek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comparisonRows.map((c) => (
                <tr key={c.algorithm} className="text-slate-800">
                  <td className="py-1.5 pr-2 font-semibold text-blue-700">
                    {c.algorithm}
                  </td>
                  <td className="px-2 py-1.5">{c.totalHeadMovement}</td>
                  <td className="px-2 py-1.5">{c.averageSeekMovement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
