import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import type { Explanation5Q } from '../../types/simulation';

interface ExplainerToastProps {
  visible: boolean;
  stepIndex: number;
  tick?: number;
  explanation: Explanation5Q | null;
}

export function ExplainerToast({
  visible,
  stepIndex,
  tick,
  explanation,
}: ExplainerToastProps) {
  const [dismissedAtStep, setDismissedAtStep] = useState<number | null>(null);

  useEffect(() => {
    setDismissedAtStep(null);
  }, [stepIndex]);

  if (!visible || !explanation || dismissedAtStep === stepIndex) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 bottom-20 z-30 rounded-xl border border-blue-200 bg-white p-3.5 shadow-lg md:inset-x-auto md:right-5 md:bottom-5 md:w-96"
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Step Explainer {typeof tick === 'number' ? `· Tick ${tick}` : ''}</span>
        </div>
        <button
          type="button"
          onClick={() => setDismissedAtStep(stepIndex)}
          aria-label="Dismiss step toast"
          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="text-xs font-semibold text-slate-900">
        {explanation.whatHappened}
      </p>
      <div className="mt-1.5 space-y-1 text-[11px] leading-relaxed text-slate-600">
        <p>
          <strong className="text-slate-800">Why this:</strong>{' '}
          {explanation.whyItHappened}
        </p>
        <p>
          <strong className="text-slate-800">How:</strong>{' '}
          {explanation.whichRule}
        </p>
        <p>
          <strong className="text-slate-800">Next:</strong>{' '}
          {explanation.whatNext}
        </p>
      </div>
    </aside>
  );
}
