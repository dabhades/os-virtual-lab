import type {
  BankersMetrics,
  BankersStepState,
} from '../../../engines/bankers/types';

export function BankersMetricsPanel({
  state,
  finalMetrics,
}: {
  state: BankersStepState | null;
  finalMetrics: BankersMetrics | null;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run the safety check to view Need matrix and Safe Sequence results.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Safety & State Summary
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">System State</div>
          <div
            className={`font-mono text-base font-bold ${
              finalMetrics?.isSafe ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {finalMetrics?.systemStatus ?? state.systemStatus}
          </div>
        </div>

        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Processes Finished</div>
          <div className="font-mono text-base font-bold text-blue-600 tabular-nums">
            {state.finish.filter(Boolean).length} / {state.finish.length}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-subtle bg-canvas/60 p-3 text-xs text-slate-700">
        <strong className="text-amber-700">Need Formula:</strong>{' '}
        <code className="font-mono">Need[i][j] = Maximum[i][j] − Allocation[i][j]</code>
      </div>

      <div className="rounded-xl border border-subtle bg-canvas/60 p-3 text-xs text-slate-700">
        <strong className="text-blue-700">Unsafe vs. Deadlock:</strong> An{' '}
        <em>unsafe</em> state does not guarantee a deadlock has already happened,
        but means the OS can no longer guarantee a deadlock-free completion path.
      </div>
    </div>
  );
}
