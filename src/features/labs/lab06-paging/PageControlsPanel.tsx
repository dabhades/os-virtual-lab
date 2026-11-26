import { Play, Shuffle } from 'lucide-react';
import type { PageAlgorithm } from '../../../engines/pageReplacement/types';
import type { LearningMode } from '../../../types/simulation';
import { PAGE_PRESETS } from '../../../data/presets/pagePresets';

const PAGE_ALGOS: { id: PageAlgorithm; label: string }[] = [
  { id: 'FIFO', label: 'FIFO (First-In, First-Out)' },
  { id: 'LRU', label: 'LRU (Least Recently Used)' },
  { id: 'OPTIMAL', label: 'Optimal (Belady)' },
  { id: 'LFU', label: 'LFU (Least Frequently Used, FIFO tie-break)' },
  { id: 'SECOND_CHANCE', label: 'Second Chance (Clock)' },
];

interface PageControlsPanelProps {
  mode: LearningMode;
  algorithm: PageAlgorithm;
  frameCount: number;
  refStringText: string;
  errors: string[];
  onAlgorithmChange: (algo: PageAlgorithm) => void;
  onFrameCountChange: (count: number) => void;
  onRefStringTextChange: (text: string) => void;
  onGenerateRandom: () => void;
  onLoadPreset: (id: string) => void;
  onRun: () => void;
}

export function PageControlsPanel({
  mode,
  algorithm,
  frameCount,
  refStringText,
  errors,
  onAlgorithmChange,
  onFrameCountChange,
  onRefStringTextChange,
  onGenerateRandom,
  onLoadPreset,
  onRun,
}: PageControlsPanelProps) {
  const isLearn = mode === 'learn';

  return (
    <div className="space-y-4">
      {isLearn && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>Analogy:</strong> Page frames are like desks in a small study
          room—when a new book (page) is needed and all desks are full, you must
          decide which book to put back on the shelf (disk).
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
          aria-label="Load Page Replacement preset"
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          <option value="" disabled>
            Select a preset…
          </option>
          {PAGE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-700">
          Replacement Algorithm
        </label>
        <select
          value={algorithm}
          onChange={(e) => onAlgorithmChange(e.target.value as PageAlgorithm)}
          className="w-full rounded-xl border border-subtle bg-canvas px-3 py-2 text-xs text-slate-900"
        >
          {PAGE_ALGOS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
          <span>Physical Frames</span>
          <span className="font-mono text-blue-600">{frameCount}</span>
        </div>
        <input
          type="range"
          min={1}
          max={8}
          value={frameCount}
          disabled={isLearn}
          onChange={(e) => onFrameCountChange(Number(e.target.value))}
          className="w-full accent-sky-400 disabled:opacity-60"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            Reference String (comma or space separated)
          </label>
          {!isLearn && (
            <button
              type="button"
              onClick={onGenerateRandom}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
            >
              <Shuffle className="h-3 w-3" aria-hidden="true" />
              <span>Random</span>
            </button>
          )}
        </div>
        <textarea
          rows={3}
          disabled={isLearn}
          value={refStringText}
          onChange={(e) => onRefStringTextChange(e.target.value)}
          placeholder="7, 0, 1, 2, 0, 3, 0, 4"
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
        <span>Apply & Build Simulation</span>
      </button>
    </div>
  );
}
