import { HelpCircle } from 'lucide-react';

interface PracticeCheckpointProps {
  question: string;
  options: string[];
  feedback: {
    selected: string;
    isCorrect: boolean;
    hint: string;
  } | null;
  onSelect: (option: string) => void;
  onReveal: () => void;
}

export function PracticeCheckpoint({
  question,
  options,
  feedback,
  onSelect,
  onReveal,
}: PracticeCheckpointProps) {
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          <span>Practice Checkpoint — Predict Next Step</span>
        </div>
        <button
          type="button"
          onClick={onReveal}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          Show Answer
        </button>
      </div>

      <p className="text-sm font-medium text-slate-900">{question}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onSelect(opt)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-medium text-slate-800 transition hover:border-blue-500 hover:bg-blue-50"
          >
            {opt}
          </button>
        ))}
      </div>

      {feedback && (
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            feedback.isCorrect
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {feedback.isCorrect ? (
            <span>Correct! You can now step forward or resume playback.</span>
          ) : (
            <span>
              Not quite ({feedback.selected}). Hint: {feedback.hint}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
