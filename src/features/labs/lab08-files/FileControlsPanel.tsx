import { Play, Plus, Trash2 } from 'lucide-react';
import type {
  AllocationMethod,
  DirectoryStructure,
  FileOpType,
  FileOperation,
} from '../../../engines/fileManagement/types';
import type { LearningMode } from '../../../types/simulation';
import { FILE_PRESETS } from '../../../data/presets/filePresets';

interface FileControlsPanelProps {
  mode: LearningMode;
  allocationMethod: AllocationMethod;
  directoryStructure: DirectoryStructure;
  operations: FileOperation[];
  errors: string[];
  onAllocationChange: (m: AllocationMethod) => void;
  onDirectoryChange: (d: DirectoryStructure) => void;
  onOperationsChange: (ops: FileOperation[]) => void;
  onLoadPreset: (id: string) => void;
  onRun: () => void;
}

const OP_TYPES: FileOpType[] = [
  'CREATE',
  'OPEN',
  'READ',
  'WRITE',
  'APPEND',
  'DELETE',
  'RENAME',
  'COPY',
  'MOVE',
  'SHARE_LINK',
];

export function FileControlsPanel({
  mode,
  allocationMethod,
  directoryStructure,
  operations,
  errors,
  onAllocationChange,
  onDirectoryChange,
  onOperationsChange,
  onLoadPreset,
  onRun,
}: FileControlsPanelProps) {
  const isLearn = mode === 'learn';

  const addOp = () => {
    onOperationsChange([
      ...operations,
      {
        id: `${Date.now()}-${operations.length}`,
        type: 'CREATE',
        path: `/docs/file${operations.length + 1}.txt`,
        blocks: 2,
      },
    ]);
  };

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> Contiguous allocation is like booking adjacent
          hotel rooms; Linked is a treasure hunt (each block points to the next);
          Indexed keeps a table of contents in one index block.
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
          aria-label="Load File Management preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a preset…
          </option>
          {FILE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-700">
          Allocation
          <select
            value={allocationMethod}
            onChange={(e) =>
              onAllocationChange(e.target.value as AllocationMethod)
            }
            className="mt-1 w-full rounded-xl border border-subtle bg-canvas px-2 py-2 text-xs text-slate-900"
          >
            <option value="CONTIGUOUS">Contiguous</option>
            <option value="LINKED">Linked</option>
            <option value="INDEXED">Indexed</option>
          </select>
        </label>

        <label className="text-xs text-slate-700">
          Directory
          <select
            value={directoryStructure}
            disabled={isLearn}
            onChange={(e) =>
              onDirectoryChange(e.target.value as DirectoryStructure)
            }
            className="mt-1 w-full rounded-xl border border-subtle bg-canvas px-2 py-2 text-xs text-slate-900 disabled:opacity-60"
          >
            <option value="SINGLE_LEVEL">Single-Level</option>
            <option value="TWO_LEVEL">Two-Level</option>
            <option value="TREE">Tree-Structured</option>
            <option value="ACYCLIC_GRAPH">Acyclic Graph</option>
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Operations ({operations.length})
          </span>
          {!isLearn && (
            <button
              type="button"
              onClick={addOp}
              className="inline-flex items-center gap-1 rounded-md border border-subtle bg-canvas px-2 py-1 text-[11px] text-blue-700"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Add Op
            </button>
          )}
        </div>

        <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
          {operations.map((op, idx) => (
            <div
              key={op.id}
              className="flex flex-wrap items-center gap-1.5 rounded-lg border border-subtle bg-canvas/70 p-1.5 font-mono text-[11px]"
            >
              <select
                value={op.type}
                disabled={isLearn}
                onChange={(e) =>
                  onOperationsChange(
                    operations.map((item, i) =>
                      i === idx
                        ? { ...item, type: e.target.value as FileOpType }
                        : item
                    )
                  )
                }
                className="rounded border border-subtle bg-surface px-1.5 py-0.5 text-blue-700"
              >
                {OP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={op.path}
                disabled={isLearn}
                onChange={(e) =>
                  onOperationsChange(
                    operations.map((item, i) =>
                      i === idx ? { ...item, path: e.target.value } : item
                    )
                  )
                }
                className="min-w-[100px] flex-1 rounded border border-subtle bg-surface px-1.5 py-0.5 text-slate-900"
              />
              {(op.type === 'CREATE' || op.type === 'APPEND') && (
                <input
                  type="number"
                  min={1}
                  max={16}
                  value={op.blocks ?? 2}
                  disabled={isLearn}
                  onChange={(e) =>
                    onOperationsChange(
                      operations.map((item, i) =>
                        i === idx
                          ? { ...item, blocks: Number(e.target.value) }
                          : item
                      )
                    )
                  }
                  className="w-12 rounded border border-subtle bg-surface px-1 py-0.5 text-center text-slate-900"
                />
              )}
              {!isLearn && (
                <button
                  type="button"
                  onClick={() =>
                    onOperationsChange(operations.filter((_, i) => i !== idx))
                  }
                  aria-label="Remove operation"
                  className="text-slate-500 hover:text-rose-700"
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
        <span>Apply & Build Disk Trace</span>
      </button>
    </div>
  );
}
