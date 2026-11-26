import type { LearningMode } from '../../types/simulation';

const MODES: { id: LearningMode; label: string; hint: string }[] = [
  { id: 'learn', label: 'Learn', hint: 'Guided presets & analogies' },
  { id: 'experiment', label: 'Experiment', hint: 'Custom inputs & comparison' },
  { id: 'practice', label: 'Practice', hint: 'Predict next steps' },
];

interface ModeSwitcherProps {
  mode: LearningMode;
  onChange: (mode: LearningMode) => void;
}

export function ModeSwitcher({ mode, onChange }: ModeSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Learning mode"
      className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
    >
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={m.hint}
            onClick={() => onChange(m.id)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition ${
              active
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
