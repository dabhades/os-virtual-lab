import type { SyncStepState } from '../../../engines/synchronization/types';

const STATE_BADGE: Record<string, string> = {
  READY: 'bg-slate-100 text-slate-700 border-slate-300',
  RUNNING: 'bg-blue-100 text-blue-700 border-blue-500',
  BLOCKED: 'bg-rose-500/20 text-rose-700 border-rose-400',
  IN_CS: 'bg-amber-500/20 text-amber-700 border-amber-400',
  DONE: 'bg-emerald-500/20 text-emerald-700 border-emerald-400',
};

export function SyncVisualizer2D({ state }: { state: SyncStepState | null }) {
  if (!state) {
    return (
      <div className="flex h-60 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Select a synchronization scenario to start.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.deadlockDetected && (
        <div className="rounded-xl border border-rose-500/50 bg-rose-500/15 px-4 py-2.5 font-mono text-xs font-semibold text-rose-800">
          DEADLOCK DETECTED: All processes are blocked in a circular wait!
        </div>
      )}

      {/* Semaphore Counters & Blocked Queues */}
      {state.semaphores.length > 0 && (
        <div className="grid gap-2.5 sm:grid-cols-3">
          {state.semaphores.map((sem) => (
            <div
              key={sem.name}
              className="rounded-xl border border-subtle bg-canvas/80 p-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-600">{sem.name}</span>
                <span className="rounded bg-surface px-2 py-0.5 text-sm font-bold text-slate-900 tabular-nums">
                  val = {sem.value}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500">
                Blocked:{' '}
                <span className="text-rose-700">
                  {sem.blockedQueue.length === 0
                    ? 'None'
                    : sem.blockedQueue.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scenario-specific Shared Resource Stage */}
      {state.scenario === 'PRODUCER_CONSUMER' && (
        <div className="rounded-xl border border-blue-200 bg-sky-500/5 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            Bounded Buffer ({state.buffer.filter(Boolean).length} /{' '}
            {state.buffer.length} occupied)
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {state.buffer.map((slot, idx) => (
              <div
                key={idx}
                className={`flex h-14 flex-col items-center justify-center rounded-xl border font-mono text-xs ${
                  slot
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-800'
                    : 'border-dashed border-slate-300 bg-canvas text-slate-500'
                }`}
              >
                <span className="text-[10px] opacity-70">Slot {idx}</span>
                <span className="font-bold">{slot ?? 'EMPTY'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(state.scenario === 'RACE_CONDITION' ||
        state.scenario === 'MUTEX_LOCK') && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-subtle bg-canvas/80 p-4 font-mono">
          <div>
            <div className="text-[11px] text-slate-500">Shared Counter</div>
            <div className="text-2xl font-bold text-blue-600 tabular-nums">
              {state.sharedCounter}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Expected Counter</div>
            <div className="text-2xl font-bold text-emerald-700 tabular-nums">
              {state.expectedCounter}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500">Lost Updates</div>
            <div
              className={`text-2xl font-bold tabular-nums ${
                state.lostUpdates > 0 ? 'text-rose-700' : 'text-slate-700'
              }`}
            >
              {state.lostUpdates}
            </div>
          </div>
        </div>
      )}

      {state.scenario === 'DINING_PHILOSOPHERS' && (
        <div className="rounded-xl border border-subtle bg-canvas/80 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-700">
            5 Forks Ownership
          </div>
          <div className="grid grid-cols-5 gap-2 font-mono text-xs">
            {state.forks.map((owner, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-2 text-center ${
                  owner
                    ? 'border-amber-400 bg-amber-500/15 text-amber-800'
                    : 'border-subtle bg-surface text-slate-500'
                }`}
              >
                <div>Fork {idx}</div>
                <div className="font-bold">{owner ?? 'FREE'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.scenario === 'READERS_WRITERS' && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-subtle bg-canvas/80 p-3 font-mono text-xs">
          <div>
            <span className="text-slate-500">Active Readers: </span>
            <span className="font-bold text-blue-600 tabular-nums">
              {state.activeReaders}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Active Writer: </span>
            <span className="font-bold text-amber-700">
              {state.activeWriter ?? 'None'}
            </span>
          </div>
        </div>
      )}

      {/* Process State Cards */}
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {state.processes.map((proc) => (
          <div
            key={proc.id}
            className="rounded-xl border border-subtle bg-canvas/70 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {proc.id}
                </span>
                <span className="ml-2 text-[11px] text-slate-500">
                  {proc.role}
                </span>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                  STATE_BADGE[proc.state] ?? STATE_BADGE.READY
                }`}
              >
                {proc.state}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[11px] text-slate-700">
              {proc.lastAction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
