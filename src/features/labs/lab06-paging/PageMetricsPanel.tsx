import { BarChart3 } from 'lucide-react';
import type {
  PageReplacementMetrics,
  PageStepState,
} from '../../../engines/pageReplacement/types';

export function PageMetricsPanel({
  state,
  comparisonRows,
  showComparison,
  onToggleComparison,
}: {
  state: PageStepState | null;
  comparisonRows: PageReplacementMetrics[];
  showComparison: boolean;
  onToggleComparison: () => void;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run the simulation to view Page Hits, Page Faults, and ratios.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Hit & Fault Metrics
        </h2>
        <button
          type="button"
          onClick={onToggleComparison}
          className="inline-flex items-center gap-1.5 rounded-lg border border-subtle bg-canvas px-2.5 py-1 text-xs font-medium text-blue-700 transition hover:border-blue-300"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{showComparison ? 'Hide Comparison' : 'Compare All 5 Algos'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Page Hits</div>
          <div className="font-mono text-lg font-bold text-emerald-700 tabular-nums">
            {state.hits}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Page Faults</div>
          <div className="font-mono text-lg font-bold text-rose-700 tabular-nums">
            {state.faults}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Hit Ratio</div>
          <div className="font-mono text-lg font-bold text-blue-600 tabular-nums">
            {state.hitRatio}%
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Fault Ratio</div>
          <div className="font-mono text-lg font-bold text-amber-700 tabular-nums">
            {state.faultRatio}%
          </div>
        </div>
      </div>

      {showComparison && comparisonRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-blue-200 bg-canvas/80 p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
            5-Algorithm Comparison
          </h3>
          <table className="w-full text-left font-mono text-xs tabular-nums">
            <thead className="border-b border-subtle text-[11px] text-slate-500">
              <tr>
                <th className="py-1.5 pr-2">Algorithm</th>
                <th className="px-2 py-1.5">Faults</th>
                <th className="px-2 py-1.5">Hits</th>
                <th className="px-2 py-1.5">Hit %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {comparisonRows.map((c) => (
                <tr key={c.algorithm} className="text-slate-800">
                  <td className="py-1.5 pr-2 font-semibold text-blue-700">
                    {c.algorithm}
                  </td>
                  <td className="px-2 py-1.5 text-rose-700">{c.faults}</td>
                  <td className="px-2 py-1.5 text-emerald-700">{c.hits}</td>
                  <td className="px-2 py-1.5">{c.hitRatio}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
