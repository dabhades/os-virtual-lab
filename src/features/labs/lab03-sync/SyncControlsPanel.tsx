import { Play } from 'lucide-react';
import type { SyncScenario } from '../../../engines/synchronization/types';
import type { LearningMode } from '../../../types/simulation';

const SCENARIOS: { id: SyncScenario; label: string }[] = [
  { id: 'PRODUCER_CONSUMER', label: 'Producer–Consumer (Bounded Buffer)' },
  { id: 'RACE_CONDITION', label: 'Race Condition (Lost Update)' },
  { id: 'MUTEX_LOCK', label: 'Mutex Lock (Race Fixed)' },
  { id: 'CRITICAL_SECTION', label: 'Critical Section Basics' },
  { id: 'BINARY_SEMAPHORE', label: 'Binary Semaphore (Signaling)' },
  { id: 'COUNTING_SEMAPHORE', label: 'Counting Semaphore (Resource Pool)' },
  { id: 'DINING_PHILOSOPHERS', label: 'Dining Philosophers' },
  { id: 'READERS_WRITERS', label: 'Readers–Writers Problem' },
];

interface SyncControlsPanelProps {
  mode: LearningMode;
  scenario: SyncScenario;
  bufferSize: number;
  producerCount: number;
  consumerCount: number;
  semaphoreCount: number;
  triggerDeadlock: boolean;
  errors: string[];
  onScenarioChange: (s: SyncScenario) => void;
  onBufferSizeChange: (n: number) => void;
  onProducerCountChange: (n: number) => void;
  onConsumerCountChange: (n: number) => void;
  onSemaphoreCountChange: (n: number) => void;
  onTriggerDeadlockChange: (b: boolean) => void;
  onRun: () => void;
}

export function SyncControlsPanel({
  mode,
  scenario,
  bufferSize,
  producerCount,
  consumerCount,
  semaphoreCount,
  triggerDeadlock,
  errors,
  onScenarioChange,
  onBufferSizeChange,
  onProducerCountChange,
  onConsumerCountChange,
  onSemaphoreCountChange,
  onTriggerDeadlockChange,
  onRun,
}: SyncControlsPanelProps) {
  const isLearn = mode === 'learn';

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> A mutex/semaphore is like a restroom key on
          a hook—only one person holds the key at a time, while others wait in
          line until the key is returned.
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Synchronization Scenario
        </label>
        <select
          value={scenario}
          onChange={(e) => onScenarioChange(e.target.value as SyncScenario)}
          aria-label="Synchronization Scenario"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          {SCENARIOS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {scenario === 'PRODUCER_CONSUMER' && (
        <div className="space-y-3 rounded-xl border border-subtle bg-canvas/60 p-3">
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-700">
              <span>Buffer Slots (K)</span>
              <span className="font-mono text-blue-600">{bufferSize}</span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              disabled={isLearn}
              value={bufferSize}
              onChange={(e) => onBufferSizeChange(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-slate-700">
              Producers
              <input
                type="number"
                min={1}
                max={3}
                disabled={isLearn}
                value={producerCount}
                onChange={(e) => onProducerCountChange(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-subtle bg-surface px-2 py-1 font-mono text-slate-900"
              />
            </label>
            <label className="text-slate-700">
              Consumers
              <input
                type="number"
                min={1}
                max={3}
                disabled={isLearn}
                value={consumerCount}
                onChange={(e) => onConsumerCountChange(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-subtle bg-surface px-2 py-1 font-mono text-slate-900"
              />
            </label>
          </div>
        </div>
      )}

      {scenario === 'COUNTING_SEMAPHORE' && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-slate-700">
            <span>Semaphore Initial Count (N)</span>
            <span className="font-mono text-blue-600">{semaphoreCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            disabled={isLearn}
            value={semaphoreCount}
            onChange={(e) => onSemaphoreCountChange(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
        </div>
      )}

      {scenario === 'DINING_PHILOSOPHERS' && (
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-subtle bg-canvas/60 p-3 text-xs text-slate-800">
          <span>Trigger Circular-Wait Deadlock</span>
          <input
            type="checkbox"
            checked={triggerDeadlock}
            onChange={(e) => onTriggerDeadlockChange(e.target.checked)}
            className="h-4 w-4 accent-rose-400"
          />
        </label>
      )}

      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-800">
          {errors.map((err) => (
            <p key={err}>{err}</p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onRun}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        <span>Rebuild Deterministic Trace</span>
      </button>
    </div>
  );
}
