import { useState } from 'react';
import { ChevronDown, ChevronRight, Cpu } from 'lucide-react';
import { LAB_ALGORITHM_STEPS } from '../../data/algorithmSteps';

export function AlgorithmStepsCard({
  labTitle,
  isRunning,
  activeStageIndex = -1,
}: {
  labTitle: string;
  isRunning: boolean;
  activeStageIndex?: number;
}) {
  const [open, setOpen] = useState(false);
  const steps = LAB_ALGORITHM_STEPS[labTitle];
  if (!steps) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <span>How the Algorithm Works (Process Flow)</span>
          {isRunning && (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-700">
              Active
            </span>
          )}
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        )}
      </button>

      {open && (
        <div className="grid gap-2.5 border-t border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => {
            const isActive = idx === activeStageIndex;
            return (
              <div
                key={step.title}
                className={`rounded-lg border p-3 transition ${
                  isActive
                    ? 'border-blue-400 bg-blue-50/70'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold text-blue-700">
                  {step.title}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  {step.detail}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
