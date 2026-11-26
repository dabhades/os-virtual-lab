import { Play, Plus, Trash2 } from 'lucide-react';
import type {
  FitStrategy,
  MemoryOpType,
  MemoryOperation,
  PartitionMode,
} from '../../../engines/memoryAllocation/types';
import type { LearningMode } from '../../../types/simulation';
import { MEMORY_PRESETS } from '../../../data/presets/memoryPresets';

interface MemoryControlsPanelProps {
  mode: LearningMode;
  totalMemory: number;
  partitionMode: PartitionMode;
  fitStrategy: FitStrategy;
  fixedPartitions: number[];
  operations: MemoryOperation[];
  errors: string[];
  onTotalMemoryChange: (val: number) => void;
  onPartitionModeChange: (mode: PartitionMode) => void;
  onFitStrategyChange: (fit: FitStrategy) => void;
  onFixedPartitionsChange: (parts: number[]) => void;
  onOperationsChange: (ops: MemoryOperation[]) => void;
  onLoadPreset: (id: string) => void;
  onRun: () => void;
}

export function MemoryControlsPanel({
  mode,
  totalMemory,
  partitionMode,
  fitStrategy,
  fixedPartitions,
  operations,
  errors,
  onTotalMemoryChange,
  onPartitionModeChange,
  onFitStrategyChange,
  onFixedPartitionsChange,
  onOperationsChange,
  onLoadPreset,
  onRun,
}: MemoryControlsPanelProps) {
  const isLearn = mode === 'learn';

  const addOp = (type: MemoryOpType) => {
    const id = `${Date.now()}-${operations.length}`;
    if (type === 'COMPACT') {
      onOperationsChange([...operations, { id, type: 'COMPACT' }]);
    } else if (type === 'DEALLOCATE') {
      onOperationsChange([...operations, { id, type: 'DEALLOCATE', pid: 'P1' }]);
    } else {
      onOperationsChange([
        ...operations,
        { id, type: 'ALLOCATE', pid: `P${operations.length + 1}`, size: 64 },
      ]);
    }
  };

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> RAM is like a parking lot—First Fit takes the
          first open spot big enough, Best Fit finds the tightest spot, and
          Compaction slides parked cars together to merge empty gaps.
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
          aria-label="Load Memory preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a preset…
          </option>
          {MEMORY_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Partitioning
          </label>
          <select
            value={partitionMode}
            disabled={isLearn}
            onChange={(e) =>
              onPartitionModeChange(e.target.value as PartitionMode)
            }
            className="w-full rounded-xl border border-subtle bg-canvas px-2.5 py-2 text-xs text-slate-900 disabled:opacity-60"
          >
            <option value="VARIABLE">Variable</option>
            <option value="FIXED">Fixed</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Total RAM (KB)
          </label>
          <input
            type="number"
            min={64}
            max={4096}
            value={totalMemory}
            disabled={isLearn}
            onChange={(e) => onTotalMemoryChange(Number(e.target.value))}
            className="w-full rounded-xl border border-subtle bg-canvas px-2.5 py-2 font-mono text-xs text-slate-900 disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Fit Strategy
        </label>
        <select
          value={fitStrategy}
          onChange={(e) => onFitStrategyChange(e.target.value as FitStrategy)}
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="FIRST_FIT">First Fit</option>
          <option value="BEST_FIT">Best Fit</option>
          <option value="WORST_FIT">Worst Fit</option>
          <option value="NEXT_FIT">Next Fit</option>
        </select>
      </div>

      {partitionMode === 'FIXED' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Fixed Partitions (comma-separated KB)
          </label>
          <input
            type="text"
            disabled={isLearn}
            value={fixedPartitions.join(', ')}
            onChange={(e) =>
              onFixedPartitionsChange(
                e.target.value
                  .split(',')
                  .map((v) => Number(v.trim()))
                  .filter((n) => !Number.isNaN(n))
              )
            }
            className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 font-mono text-xs text-slate-900 disabled:opacity-60"
          />
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Operations ({operations.length})
          </span>
          {!isLearn && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => addOp('ALLOCATE')}
                className="inline-flex items-center gap-0.5 rounded-md border border-subtle bg-canvas px-2 py-1 text-[10px] text-blue-700"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
                Alloc
              </button>
              <button
                type="button"
                onClick={() => addOp('DEALLOCATE')}
                className="rounded-md border border-subtle bg-canvas px-2 py-1 text-[10px] text-amber-700"
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => addOp('COMPACT')}
                className="rounded-md border border-subtle bg-canvas px-2 py-1 text-[10px] text-emerald-700"
              >
                Compact
              </button>
            </div>
          )}
        </div>

        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
          {operations.map((op, idx) => (
            <div
              key={op.id}
              className="flex items-center gap-1.5 rounded-lg border border-subtle bg-canvas/70 px-2 py-1.5 font-mono text-xs"
            >
              <span className="w-16 shrink-0 text-[10px] text-blue-600">
                {op.type}
              </span>
              {op.type !== 'COMPACT' && (
                <input
                  type="text"
                  value={op.pid ?? ''}
                  disabled={isLearn}
                  onChange={(e) =>
                    onOperationsChange(
                      operations.map((item, i) =>
                        i === idx ? { ...item, pid: e.target.value } : item
                      )
                    )
                  }
                  className="w-14 rounded border border-subtle bg-surface px-1.5 py-0.5 text-xs text-slate-900"
                />
              )}
              {op.type === 'ALLOCATE' && (
                <input
                  type="number"
                  min={1}
                  value={op.size ?? 1}
                  disabled={isLearn}
                  onChange={(e) =>
                    onOperationsChange(
                      operations.map((item, i) =>
                        i === idx
                          ? { ...item, size: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                  className="w-16 rounded border border-subtle bg-surface px-1.5 py-0.5 text-xs text-slate-900"
                />
              )}
              {!isLearn && (
                <button
                  type="button"
                  onClick={() =>
                    onOperationsChange(operations.filter((_, i) => i !== idx))
                  }
                  aria-label="Remove operation"
                  className="ml-auto text-slate-500 hover:text-rose-700"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-slate-900 transition hover:bg-blue-700"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        <span>Apply & Build Simulation</span>
      </button>
    </div>
  );
}
