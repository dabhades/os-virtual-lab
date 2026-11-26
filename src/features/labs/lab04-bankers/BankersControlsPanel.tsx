import { Play } from 'lucide-react';
import type { ResourceRequest } from '../../../engines/bankers/types';
import type { LearningMode } from '../../../types/simulation';
import { BANKERS_PRESETS } from '../../../data/presets/bankersPresets';

interface BankersControlsPanelProps {
  mode: LearningMode;
  available: number[];
  maximum: number[][];
  allocation: number[][];
  resourceRequest: ResourceRequest | null;
  errors: string[];
  onAvailableChange: (next: number[]) => void;
  onCellChange: (
    matrix: 'allocation' | 'maximum',
    row: number,
    col: number,
    val: number
  ) => void;
  onRequestChange: (req: ResourceRequest | null) => void;
  onLoadPreset: (id: string) => void;
  onRun: () => void;
}

export function BankersControlsPanel({
  mode,
  available,
  maximum,
  allocation,
  resourceRequest,
  errors,
  onAvailableChange,
  onCellChange,
  onRequestChange,
  onLoadPreset,
  onRun,
}: BankersControlsPanelProps) {
  const isLearn = mode === 'learn';
  const m = available.length;
  const n = allocation.length;

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> A careful banker only lends money if there
          is at least one order in which every customer can finish their project
          and repay their loan.
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
          aria-label="Load Banker's Algorithm preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a preset…
          </option>
          {BANKERS_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Available Vector */}
      <div>
        <span className="mb-1 block text-xs font-semibold text-slate-700">
          Available Resources
        </span>
        <div className="flex gap-2">
          {available.map((val, j) => (
            <div key={j} className="flex-1">
              <span className="block font-mono text-[10px] text-slate-500">
                {String.fromCharCode(65 + j)}
              </span>
              <input
                type="number"
                min={0}
                disabled={isLearn}
                value={val}
                onChange={(e) =>
                  onAvailableChange(
                    available.map((v, idx) =>
                      idx === j ? Number(e.target.value) : v
                    )
                  )
                }
                className="w-full rounded-lg border border-subtle bg-canvas px-2 py-1 font-mono text-xs text-slate-900 disabled:opacity-60"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Allocation & Maximum Matrix Editor */}
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        <span className="block text-xs font-semibold text-slate-700">
          Allocation | Maximum ({n}×{m})
        </span>
        {allocation.map((row, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-subtle bg-canvas/70 px-2 py-1.5 font-mono text-xs"
          >
            <span className="w-6 text-blue-600">P{i}</span>
            <div className="flex gap-1">
              {row.map((val, j) => (
                <input
                  key={`a-${j}`}
                  type="number"
                  min={0}
                  disabled={isLearn}
                  value={val}
                  onChange={(e) =>
                    onCellChange('allocation', i, j, Number(e.target.value))
                  }
                  aria-label={`P${i} Allocation ${String.fromCharCode(65 + j)}`}
                  className="w-9 rounded border border-subtle bg-surface px-1 py-0.5 text-center text-slate-900 disabled:opacity-60"
                />
              ))}
            </div>
            <span className="text-slate-500">|</span>
            <div className="flex gap-1">
              {maximum[i].map((val, j) => (
                <input
                  key={`m-${j}`}
                  type="number"
                  min={0}
                  disabled={isLearn}
                  value={val}
                  onChange={(e) =>
                    onCellChange('maximum', i, j, Number(e.target.value))
                  }
                  aria-label={`P${i} Maximum ${String.fromCharCode(65 + j)}`}
                  className="w-9 rounded border border-subtle bg-surface px-1 py-0.5 text-center text-amber-800 disabled:opacity-60"
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Optional Resource Request */}
      <div className="rounded-xl border border-subtle bg-canvas/60 p-3 space-y-2">
        <label className="flex cursor-pointer items-center justify-between text-xs font-semibold text-slate-800">
          <span>Include Resource Request</span>
          <input
            type="checkbox"
            disabled={isLearn}
            checked={resourceRequest !== null}
            onChange={(e) =>
              onRequestChange(
                e.target.checked
                  ? { processIndex: 0, request: Array(m).fill(0) }
                  : null
              )
            }
            className="h-4 w-4 accent-sky-400"
          />
        </label>

        {resourceRequest && (
          <div className="flex items-center gap-2 pt-1 font-mono text-xs">
            <select
              disabled={isLearn}
              value={resourceRequest.processIndex}
              onChange={(e) =>
                onRequestChange({
                  ...resourceRequest,
                  processIndex: Number(e.target.value),
                })
              }
              className="rounded-lg border border-subtle bg-surface px-2 py-1 text-slate-900"
            >
              {Array.from({ length: n }, (_, i) => (
                <option key={i} value={i}>
                  P{i}
                </option>
              ))}
            </select>
            {resourceRequest.request.map((val, j) => (
              <input
                key={j}
                type="number"
                min={0}
                disabled={isLearn}
                value={val}
                onChange={(e) =>
                  onRequestChange({
                    ...resourceRequest,
                    request: resourceRequest.request.map((r, idx) =>
                      idx === j ? Number(e.target.value) : r
                    ),
                  })
                }
                className="w-11 rounded-lg border border-subtle bg-surface px-1.5 py-1 text-center text-slate-900"
              />
            ))}
          </div>
        )}
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
        <span>Run Safety Check</span>
      </button>
    </div>
  );
}
