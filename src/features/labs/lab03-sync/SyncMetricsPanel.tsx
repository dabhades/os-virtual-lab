import type {
  SyncMetrics,
  SyncStepState,
} from '../../../engines/synchronization/types';

export function SyncMetricsPanel({
  state,
  finalMetrics,
}: {
  state: SyncStepState | null;
  finalMetrics: SyncMetrics | null;
}) {
  if (!state) {
    return (
      <p className="text-sm text-slate-500">
        Run a scenario to inspect synchronization invariants and deadlock status.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">
        Synchronization Invariants
      </h2>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">CS Violations</div>
          <div
            className={`font-mono text-lg font-bold tabular-nums ${
              state.csViolations > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {state.csViolations}
          </div>
        </div>
        <div className="rounded-xl border border-subtle bg-canvas/70 p-3">
          <div className="text-[11px] text-slate-500">Deadlock</div>
          <div
            className={`font-mono text-lg font-bold ${
              (finalMetrics?.deadlockDetected ?? state.deadlockDetected)
                ? 'text-rose-700'
                : 'text-emerald-700'
            }`}
          >
            {(finalMetrics?.deadlockDetected ?? state.deadlockDetected)
              ? 'YES'
              : 'NO'}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-subtle bg-canvas/60 p-3 font-mono text-xs text-slate-700">
        wait(S) decrements or blocks · signal(S) wakes blocked process or increments S.
      </div>
    </div>
  );
}
