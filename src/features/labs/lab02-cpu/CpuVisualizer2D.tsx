import type { CpuStepState } from '../../../engines/cpuScheduling/types';

const PROCESS_COLORS = [
  'bg-blue-100 border-blue-500 text-blue-800',
  'bg-blue-500/20 border-blue-400 text-blue-800',
  'bg-emerald-500/20 border-emerald-400 text-emerald-800',
  'bg-amber-500/20 border-amber-400 text-amber-800',
  'bg-purple-500/20 border-purple-400 text-purple-800',
  'bg-rose-500/20 border-rose-400 text-rose-800',
  'bg-cyan-500/20 border-cyan-400 text-cyan-800',
  'bg-indigo-500/20 border-indigo-400 text-indigo-800',
];

export function getPidColor(pid: string): string {
  if (pid === 'IDLE') {
    return 'bg-slate-100 border-slate-300 text-slate-500';
  }
  let hash = 0;
  for (let i = 0; i < pid.length; i += 1) {
    hash = (hash * 31 + pid.charCodeAt(i)) >>> 0;
  }
  return PROCESS_COLORS[hash % PROCESS_COLORS.length];
}

interface CpuVisualizer2DProps {
  state: CpuStepState | null;
}

export function CpuVisualizer2D({ state }: CpuVisualizer2DProps) {
  if (!state) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <h3 className="text-sm font-semibold text-slate-900">
          Gantt Chart Visualization
        </h3>
        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
          The Gantt chart will appear here once you run a scheduling algorithm.
          Select an algorithm, add processes, and click &ldquo;Submit&rdquo; to
          see the visualization.
        </p>
      </div>
    );
  }

  const totalSpan = Math.max(
    1,
    state.ganttSegments.reduce((max, seg) => Math.max(max, seg.end), 0)
  );

  return (
    <div className="space-y-5">
      {/* 4-Lane Live CPU Architecture */}
      <div className="grid gap-3 sm:grid-cols-4">
        {/* Not Arrived */}
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Waiting to Arrive
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.notArrivedPids.length === 0 ? (
              <span className="text-xs text-slate-500">None</span>
            ) : (
              state.notArrivedPids.map((pid) => (
                <span
                  key={pid}
                  className="rounded-lg border border-subtle bg-surface px-2 py-1 font-mono text-xs text-slate-700"
                >
                  {pid}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Ready Queue */}
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Ready Queue ({state.readyQueue.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.readyQueue.length === 0 ? (
              <span className="text-xs text-slate-500">Empty</span>
            ) : (
              state.readyQueue.map((pid) => (
                <span
                  key={pid}
                  className={`rounded-lg border px-2 py-1 font-mono text-xs font-semibold ${getPidColor(pid)}`}
                >
                  {pid}{' '}
                  <span className="opacity-70">
                    ({state.remainingByPid[pid]}u)
                  </span>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Running CPU */}
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            <span>CPU Core</span>
            <span className="font-mono tabular-nums">t = {state.tick}</span>
          </div>
          {state.runningPid ? (
            <div
              className={`rounded-lg border px-3 py-2 text-center font-mono text-sm font-bold ${getPidColor(state.runningPid)}`}
            >
              {state.runningPid}{' '}
              <span className="text-xs font-normal">
                ({state.remainingByPid[state.runningPid]}u left)
              </span>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center font-mono text-xs text-slate-500">
              IDLE
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Completed ({state.completedPids.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.completedPids.length === 0 ? (
              <span className="text-xs text-slate-500">None yet</span>
            ) : (
              state.completedPids.map((pid) => (
                <span
                  key={pid}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-xs font-semibold text-emerald-700"
                >
                  {pid}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Animated Gantt Chart */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
            Gantt Chart Visualization
          </h3>
          <span className="font-mono text-xs text-slate-500 tabular-nums">
            Context Switches: {state.contextSwitches} · Idle: {state.idleTicks}u
          </span>
        </div>
        <p className="mb-3 text-[11px] text-slate-500">
          Each block represents a process with its ID, and timestamps below indicate execution boundaries.
        </p>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-[420px] items-stretch gap-0.5">
            {state.ganttSegments.map((seg, idx) => {
              const widthPct = ((seg.end - seg.start) / totalSpan) * 100;
              return (
                <div
                  key={`${seg.pid}-${seg.start}-${idx}`}
                  style={{ width: `${Math.max(widthPct, 6)}%` }}
                  className="flex flex-col"
                >
                  <div
                    className={`flex h-11 items-center justify-center rounded-md border font-mono text-xs font-bold transition-all ${getPidColor(seg.pid)}`}
                    title={`${seg.pid}: ${seg.start} → ${seg.end}`}
                  >
                    {seg.pid}
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-slate-500 tabular-nums">
                    <span>{seg.start}</span>
                    {idx === state.ganttSegments.length - 1 && (
                      <span>{seg.end}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
