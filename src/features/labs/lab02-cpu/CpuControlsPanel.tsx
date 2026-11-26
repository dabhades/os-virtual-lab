import { Plus, Play, Trash2 } from 'lucide-react';
import type {
  CpuAlgorithm,
  PriorityConvention,
  ProcessInput,
} from '../../../engines/cpuScheduling/types';
import type { LearningMode } from '../../../types/simulation';
import { CPU_PRESETS } from '../../../data/presets/cpuPresets';

const ALGO_OPTIONS: { id: CpuAlgorithm; label: string }[] = [
  { id: 'FCFS', label: 'FCFS (First-Come, First-Served)' },
  { id: 'SJF', label: 'SJF (Shortest Job First, Non-preemptive)' },
  { id: 'SRTF', label: 'SRTF (Shortest Remaining Time First)' },
  { id: 'PRIORITY_NP', label: 'Priority (Non-preemptive)' },
  { id: 'PRIORITY_P', label: 'Priority (Preemptive)' },
  { id: 'RR', label: 'Round Robin (Time Quantum)' },
  { id: 'HRRN', label: 'HRRN (Highest Response Ratio Next)' },
];

interface CpuControlsPanelProps {
  mode: LearningMode;
  algorithm: CpuAlgorithm;
  timeQuantum: number;
  priorityConvention: PriorityConvention;
  processes: ProcessInput[];
  errors: string[];
  onAlgorithmChange: (algo: CpuAlgorithm) => void;
  onQuantumChange: (q: number) => void;
  onPriorityConventionChange: (conv: PriorityConvention) => void;
  onProcessesChange: (procs: ProcessInput[]) => void;
  onLoadPreset: (presetId: string) => void;
  onRun: () => void;
}

export function CpuControlsPanel({
  mode,
  algorithm,
  timeQuantum,
  priorityConvention,
  processes,
  errors,
  onAlgorithmChange,
  onQuantumChange,
  onPriorityConventionChange,
  onProcessesChange,
  onLoadPreset,
  onRun,
}: CpuControlsPanelProps) {
  const isLearn = mode === 'learn';

  const updateRow = (
    idx: number,
    field: keyof ProcessInput,
    value: string
  ) => {
    const next = processes.map((p, i) => {
      if (i !== idx) return p;
      if (field === 'pid') return { ...p, pid: value };
      return { ...p, [field]: Number(value) };
    });
    onProcessesChange(next);
  };

  const addProcess = () => {
    const nextNum = processes.length + 1;
    onProcessesChange([
      ...processes,
      {
        pid: `P${nextNum}`,
        arrivalTime: nextNum - 1,
        burstTime: 4,
        priority: 1,
      },
    ]);
  };

  const removeProcess = (idx: number) => {
    if (processes.length <= 1) return;
    onProcessesChange(processes.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> Think of CPU scheduling like a single doctor
          clinic—whoever is in the waiting room gets seen based on arrival,
          urgency (priority), or quick checkups (SJF).
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Load Preset
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) onLoadPreset(e.target.value);
          }}
          defaultValue=""
          aria-label="Load CPU scheduling preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a textbook preset…
          </option>
          {CPU_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Scheduling Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as CpuAlgorithm)}
          aria-label="CPU Scheduling Algorithm"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          {ALGO_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {algorithm === 'RR' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Time Quantum (ticks)
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={timeQuantum}
            onChange={(e) => onQuantumChange(Number(e.target.value))}
            className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 font-mono text-xs text-slate-900"
          />
        </div>
      )}

      {(algorithm === 'PRIORITY_NP' || algorithm === 'PRIORITY_P') && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Priority Convention
          </label>
          <select
            value={priorityConvention}
            onChange={(e) =>
              onPriorityConventionChange(e.target.value as PriorityConvention)
            }
            className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
          >
            <option value="lower-is-higher">Lower number = Higher priority (1 &gt; 5)</option>
            <option value="higher-is-higher">Higher number = Higher priority (5 &gt; 1)</option>
          </select>
        </div>
      )}

      {/* Process Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Processes ({processes.length})
          </span>
          {!isLearn && (
            <button
              type="button"
              onClick={addProcess}
              className="inline-flex items-center gap-1 rounded-lg border border-subtle bg-canvas px-2 py-1 text-[11px] font-medium text-blue-700 hover:border-blue-300"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              <span>Add</span>
            </button>
          )}
        </div>

        <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
          <div className="grid grid-cols-12 gap-1.5 px-1 font-mono text-[10px] text-slate-500">
            <span className="col-span-3">PID</span>
            <span className="col-span-3">AT</span>
            <span className="col-span-3">BT</span>
            <span className="col-span-2">Prio</span>
            <span className="col-span-1" />
          </div>
          {processes.map((proc, idx) => (
            <div key={idx} className="grid grid-cols-12 items-center gap-1.5">
              <input
                type="text"
                value={proc.pid}
                disabled={isLearn}
                onChange={(e) => updateRow(idx, 'pid', e.target.value)}
                aria-label={`Process ${idx + 1} ID`}
                className="col-span-3 rounded-lg border border-subtle bg-canvas px-2 py-1 font-mono text-xs text-slate-900 disabled:opacity-60"
              />
              <input
                type="number"
                min={0}
                value={proc.arrivalTime}
                disabled={isLearn}
                onChange={(e) => updateRow(idx, 'arrivalTime', e.target.value)}
                aria-label={`${proc.pid} Arrival Time`}
                className="col-span-3 rounded-lg border border-subtle bg-canvas px-2 py-1 font-mono text-xs text-slate-900 disabled:opacity-60"
              />
              <input
                type="number"
                min={1}
                value={proc.burstTime}
                disabled={isLearn}
                onChange={(e) => updateRow(idx, 'burstTime', e.target.value)}
                aria-label={`${proc.pid} Burst Time`}
                className="col-span-3 rounded-lg border border-subtle bg-canvas px-2 py-1 font-mono text-xs text-slate-900 disabled:opacity-60"
              />
              <input
                type="number"
                min={0}
                value={proc.priority}
                disabled={isLearn}
                onChange={(e) => updateRow(idx, 'priority', e.target.value)}
                aria-label={`${proc.pid} Priority`}
                className="col-span-2 rounded-lg border border-subtle bg-canvas px-2 py-1 font-mono text-xs text-slate-900 disabled:opacity-60"
              />
              <button
                type="button"
                disabled={isLearn || processes.length <= 1}
                onClick={() => removeProcess(idx)}
                aria-label={`Remove ${proc.pid}`}
                className="col-span-1 flex justify-center text-slate-500 hover:text-rose-700 disabled:opacity-30"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        <span>Submit</span>
      </button>
    </div>
  );
}
