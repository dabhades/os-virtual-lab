import { BarChart3 } from 'lucide-react';
import type {
  CpuSchedulingMetrics,
  CpuStepState,
} from '../../../engines/cpuScheduling/types';

interface CpuMetricsPanelProps {
  state: CpuStepState | null;
  finalMetrics: CpuSchedulingMetrics | null;
  comparisonRows: CpuSchedulingMetrics[];
  showComparison: boolean;
  onToggleComparison: () => void;
}

export function CpuMetricsPanel({
  state,
  finalMetrics,
  comparisonRows,
  showComparison,
  onToggleComparison,
}: CpuMetricsPanelProps) {
  const rows = state?.processRows ?? [];
  const maxChartVal = Math.max(
    1,
    ...comparisonRows.flatMap((c) => [c.avgTurnaroundTime, c.avgWaitingTime])
  );

  return (
    <div className="space-y-5">
      {/* Process Results Table Header & Description */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">
            Process Results Table
          </h2>
          <button
            type="button"
            onClick={onToggleComparison}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
          >
            <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {showComparison
                ? 'Hide comparison'
                : 'Compare similar algorithms'}
            </span>
          </button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Detailed scheduling results including completion time, turnaround time,
          and waiting time for each process under the selected algorithm.
        </p>
      </div>

      {/* Quick Reference */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
        <div className="mb-1 font-semibold text-slate-700">Quick Reference:</div>
        <div className="space-y-0.5 font-mono text-[11px] text-slate-600">
          <div>Turnaround Time = Completion Time − Arrival Time</div>
          <div>Waiting Time = Turnaround Time − Burst Time</div>
        </div>
      </div>

      {/* Summary Averages */}
      {finalMetrics && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">Avg WT</div>
            <div className="font-mono text-base font-bold text-blue-600 tabular-nums">
              {finalMetrics.avgWaitingTime}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">Avg TAT</div>
            <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
              {finalMetrics.avgTurnaroundTime}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">Avg RT</div>
            <div className="font-mono text-base font-bold text-emerald-700 tabular-nums">
              {finalMetrics.avgResponseTime}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-[11px] text-slate-500">CPU Util</div>
            <div className="font-mono text-base font-bold text-amber-700 tabular-nums">
              {finalMetrics.cpuUtilization}%
            </div>
          </div>
        </div>
      )}

      {/* Per-Process Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left font-mono text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[11px] text-slate-500">
            <tr>
              <th className="px-3 py-2">PID</th>
              <th className="px-2 py-2">AT</th>
              <th className="px-2 py-2">BT</th>
              <th className="px-2 py-2">CT</th>
              <th className="px-2 py-2">TAT</th>
              <th className="px-2 py-2">WT</th>
              <th className="px-2 py-2">RT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 tabular-nums">
            {rows.map((r) => (
              <tr key={r.pid} className="text-slate-800">
                <td className="px-3 py-2 font-semibold text-blue-700">{r.pid}</td>
                <td className="px-2 py-2">{r.arrivalTime}</td>
                <td className="px-2 py-2">{r.burstTime}</td>
                <td className="px-2 py-2">{r.completionTime ?? '—'}</td>
                <td className="px-2 py-2">{r.turnaroundTime ?? '—'}</td>
                <td className="px-2 py-2">{r.waitingTime ?? '—'}</td>
                <td className="px-2 py-2">{r.responseTime ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Algorithm Comparison Chart */}
      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Algorithm Comparison Chart
        </h3>
        {!showComparison ? (
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            This chart compares the performance of similar scheduling algorithms
            using the same process data. Click &ldquo;Compare similar
            algorithms&rdquo; above to plot average turnaround time and waiting
            time.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-600" />
                Avg Turnaround Time
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                Avg Waiting Time
              </span>
            </div>

            <div className="space-y-2.5">
              {comparisonRows.map((c) => {
                const tatPct = (c.avgTurnaroundTime / maxChartVal) * 100;
                const wtPct = (c.avgWaitingTime / maxChartVal) * 100;
                return (
                  <div key={c.algorithm} className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold">{c.algorithm}</span>
                      <span className="text-slate-500 tabular-nums">
                        TAT: {c.avgTurnaroundTime} · WT: {c.avgWaitingTime}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${tatPct}%` }}
                          className="h-full rounded-full bg-blue-600"
                        />
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          style={{ width: `${wtPct}%` }}
                          className="h-full rounded-full bg-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Understanding Your Results */}
      <div className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
          Understanding Your Results
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3 text-xs">
            <div className="font-semibold text-slate-900">Gantt Chart</div>
            <p className="mt-1 leading-relaxed text-slate-600">
              Displays the execution timeline of processes. Each block shows a
              running process ID, with timestamps below indicating when
              execution starts and ends.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs">
            <div className="font-semibold text-slate-900">
              Performance Metrics
            </div>
            <p className="mt-1 leading-relaxed text-slate-600">
              Lower average turnaround and waiting times indicate better
              algorithm performance for your specific workload.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
