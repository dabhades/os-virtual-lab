import type { BankersStepState } from '../../../engines/bankers/types';

export function BankersVisualizer2D({
  state,
}: {
  state: BankersStepState | null;
}) {
  if (!state) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Configure Allocation, Maximum, and Available resources to run Banker’s Algorithm.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resource Pool: Available & Work */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-subtle bg-canvas/80 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Available Vector
          </div>
          <div className="flex flex-wrap gap-2">
            {state.resourceNames.map((name, j) => (
              <div
                key={name}
                className="rounded-lg border border-subtle bg-surface px-3 py-1.5 font-mono text-xs"
              >
                <span className="text-slate-500">{name}: </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {state.available[j]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-700">
            Live Work Vector (Reclaimed Pool)
          </div>
          <div className="flex flex-wrap gap-2">
            {state.resourceNames.map((name, j) => (
              <div
                key={name}
                className="rounded-lg border border-blue-200 bg-canvas px-3 py-1.5 font-mono text-xs"
              >
                <span className="text-blue-700">{name}: </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {state.work[j]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Cards + Matrices */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {state.allocation.map((allocRow, i) => {
          const isFinished = state.finish[i];
          const isActive = state.activeProcessIndex === i;
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 font-mono text-xs transition ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : isFinished
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-subtle bg-canvas/70'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">P{i}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isFinished
                      ? 'bg-emerald-500/20 text-emerald-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isFinished ? 'FINISHED' : 'WAITING'}
                </span>
              </div>

              <div className="space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Alloc:</span>
                  <span>[{allocRow.join(', ')}]</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="text-slate-500">Max:</span>
                  <span>[{state.maximum[i].join(', ')}]</span>
                </div>
                <div className="flex justify-between font-semibold text-amber-700">
                  <span>Need:</span>
                  <span>[{state.need[i].join(', ')}]</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safe Sequence Bar */}
      <div className="rounded-xl border border-subtle bg-canvas/80 p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Safe Sequence</span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
              state.systemStatus === 'SAFE'
                ? 'bg-emerald-500/20 text-emerald-700'
                : state.systemStatus === 'UNSAFE' ||
                    state.systemStatus === 'REQUEST_REJECTED'
                  ? 'bg-rose-500/20 text-rose-700'
                  : 'bg-blue-100 text-blue-700'
            }`}
          >
            {state.systemStatus}
          </span>
        </div>
        <div className="font-mono text-sm text-blue-700">
          {state.safeSequence.length === 0
            ? '< scanning… >'
            : `< ${state.safeSequence.join(' → ')} >`}
        </div>
      </div>
    </div>
  );
}
