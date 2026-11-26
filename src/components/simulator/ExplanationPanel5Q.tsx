import { ArrowRight, Bookmark, HelpCircle, Lightbulb, ShieldCheck } from 'lucide-react';
import type { Explanation5Q } from '../../types/simulation';

interface ExplanationPanel5QProps {
  explanation: Explanation5Q | null;
  tick?: number;
}

export function ExplanationPanel5Q({
  explanation,
  tick,
}: ExplanationPanel5QProps) {
  if (!explanation) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Adjust the settings or click Play / Step Forward to see a plain-English walkthrough of each step.
      </div>
    );
  }

  return (
    <section
      aria-label="Step-by-step explanation"
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-slate-900">
            What’s Happening Now
          </h2>
        </div>
        {typeof tick === 'number' && (
          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-medium text-slate-700 tabular-nums">
            Step / Tick {tick}
          </span>
        )}
      </div>

      {/* Primary Plain-English Headline */}
      <div className="rounded-lg border-l-4 border-l-blue-600 bg-blue-50/60 px-4 py-3">
        <p className="text-sm font-semibold leading-snug text-slate-900">
          {explanation.whatHappened}
        </p>
      </div>

      {/* Clean Cause -> Rule -> Next Flow */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <HelpCircle className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span>Why</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {explanation.whyItHappened}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>Rule Applied</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {explanation.whichRule}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <ArrowRight className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
            <span>Up Next</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-700">
            {explanation.whatNext}
          </p>
        </div>
      </div>

      {/* Key Takeaway */}
      <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
        <Bookmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
        <span>
          <strong className="text-slate-800">Remember:</strong>{' '}
          {explanation.remember}
        </span>
      </div>
    </section>
  );
}
