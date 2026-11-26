import { Play } from 'lucide-react';
import type {
  DiskAlgorithm,
  DiskDirection,
} from '../../../engines/diskScheduling/types';
import type { LearningMode } from '../../../types/simulation';
import { DISK_PRESETS } from '../../../data/presets/diskPresets';

const ALGOS: { id: DiskAlgorithm; label: string }[] = [
  { id: 'FCFS', label: 'FCFS (First-Come, First-Served)' },
  { id: 'SSTF', label: 'SSTF (Shortest Seek Time First)' },
  { id: 'SCAN', label: 'SCAN (Elevator — touches boundary)' },
  { id: 'C_SCAN', label: 'C-SCAN (Circular SCAN)' },
  { id: 'LOOK', label: 'LOOK (Reverses at last request)' },
  { id: 'C_LOOK', label: 'C-LOOK (Circular LOOK)' },
];

interface DiskControlsPanelProps {
  mode: LearningMode;
  algorithm: DiskAlgorithm;
  cylinderCount: number;
  initialHead: number;
  direction: DiskDirection;
  queueText: string;
  errors: string[];
  onAlgorithmChange: (a: DiskAlgorithm) => void;
  onCylinderCountChange: (c: number) => void;
  onInitialHeadChange: (h: number) => void;
  onDirectionChange: (d: DiskDirection) => void;
  onQueueTextChange: (t: string) => void;
  onLoadPreset: (id: string) => void;
  onRun: () => void;
}

export function DiskControlsPanel({
  mode,
  algorithm,
  cylinderCount,
  initialHead,
  direction,
  queueText,
  errors,
  onAlgorithmChange,
  onCylinderCountChange,
  onInitialHeadChange,
  onDirectionChange,
  onQueueTextChange,
  onLoadPreset,
  onRun,
}: DiskControlsPanelProps) {
  const isLearn = mode === 'learn';

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> An elevator in a tall building—SCAN goes all
          the way to the top/bottom floor before reversing, while LOOK turns
          around at the last floor someone actually pressed.
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Load Preset
        </label>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) onLoadPreset(e.target.value);
          }}
          aria-label="Load Disk Scheduling preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a preset…
          </option>
          {DISK_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as DiskAlgorithm)}
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          {ALGOS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-slate-700">
          Cylinders
          <input
            type="number"
            min={20}
            max={1000}
            disabled={isLearn}
            value={cylinderCount}
            onChange={(e) => onCylinderCountChange(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-subtle bg-canvas px-2 py-1.5 font-mono text-xs text-slate-900 disabled:opacity-60"
          />
        </label>
        <label className="text-xs text-slate-700">
          Start Head
          <input
            type="number"
            min={0}
            max={cylinderCount - 1}
            disabled={isLearn}
            value={initialHead}
            onChange={(e) => onInitialHeadChange(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-subtle bg-canvas px-2 py-1.5 font-mono text-xs text-slate-900 disabled:opacity-60"
          />
        </label>
        <label className="text-xs text-slate-700">
          Direction
          <select
            value={direction}
            disabled={isLearn}
            onChange={(e) =>
              onDirectionChange(e.target.value as DiskDirection)
            }
            className="mt-1 w-full rounded-lg border border-subtle bg-canvas px-2 py-1.5 text-xs text-slate-900 disabled:opacity-60"
          >
            <option value="LEFT">LEFT (↓)</option>
            <option value="RIGHT">RIGHT (↑)</option>
          </select>
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Request Queue (comma or space separated)
        </label>
        <textarea
          rows={3}
          disabled={isLearn}
          value={queueText}
          onChange={(e) => onQueueTextChange(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-canvas p-2.5 font-mono text-xs text-slate-900 disabled:opacity-60"
        />
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        <span>Apply & Build Seek Path</span>
      </button>
    </div>
  );
}
