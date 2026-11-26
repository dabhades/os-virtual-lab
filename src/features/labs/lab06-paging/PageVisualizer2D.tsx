import type {
  PageAlgorithm,
  PageStepState,
} from '../../../engines/pageReplacement/types';

export function PageVisualizer2D({
  state,
  algorithm,
  frameCount,
}: {
  state: PageStepState | null;
  algorithm: PageAlgorithm;
  frameCount: number;
}) {
  if (!state) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-subtle bg-canvas/50 text-sm text-slate-500">
        Configure reference string and frames to visualize page replacement.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Frame Snapshot + Reason */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-subtle bg-canvas/70 p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-500">Current Ref:</span>
          <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-sm font-bold text-blue-700">
            Page {state.currentPage}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${
              state.outcome === 'HIT'
                ? 'bg-emerald-500/20 text-emerald-700'
                : 'bg-rose-500/20 text-rose-700'
            }`}
          >
            {state.outcome}
          </span>
        </div>
        <span className="text-xs text-slate-700">{state.replacementReason}</span>
      </div>

      {/* Live Frame Table Matrix */}
      <div className="overflow-x-auto rounded-xl border border-subtle bg-canvas/80 p-4">
        <table className="border-collapse font-mono text-xs tabular-nums">
          <thead>
            <tr>
              <th className="pr-3 pb-2 text-left text-[11px] text-slate-500">
                Reference →
              </th>
              {state.history.map((col, idx) => {
                const isLatest = idx === state.history.length - 1;
                return (
                  <th
                    key={col.refIndex}
                    className={`min-w-[2.4rem] px-1.5 pb-2 text-center font-bold ${
                      isLatest ? 'text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {col.page}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: frameCount }, (_, fIdx) => (
              <tr key={fIdx}>
                <td className="pr-3 py-1 text-[11px] text-slate-500">
                  Frame {fIdx + 1}
                  {algorithm === 'SECOND_CHANCE' &&
                    state.clockPointer === fIdx && (
                      <span className="ml-1 text-amber-700" title="Clock hand">
                        ◀
                      </span>
                    )}
                </td>
                {state.history.map((col, idx) => {
                  const val = col.frames[fIdx];
                  const isLatest = idx === state.history.length - 1;
                  const isNewOrChanged =
                    val !== null &&
                    (idx === 0 || state.history[idx - 1].frames[fIdx] !== val);

                  return (
                    <td key={col.refIndex} className="p-1 text-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md border font-semibold ${
                          val === null
                            ? 'border-slate-200 bg-surface/40 text-slate-600'
                            : isLatest && col.outcome === 'HIT' && val === col.page
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-800'
                              : isNewOrChanged
                                ? 'border-blue-500/70 bg-blue-100 text-blue-800'
                                : 'border-subtle bg-surface text-slate-800'
                        }`}
                      >
                        {val ?? '—'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="pr-3 pt-2 text-[11px] text-slate-500">Status</td>
              {state.history.map((col) => (
                <td key={col.refIndex} className="pt-2 text-center text-[10px] font-bold">
                  <span
                    className={
                      col.outcome === 'HIT'
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }
                  >
                    {col.outcome === 'HIT' ? 'H' : 'F'}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Algorithm-specific metadata (R-bits or LFU frequencies) */}
      {algorithm === 'SECOND_CHANCE' && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-subtle bg-canvas/60 px-3 py-2 font-mono text-xs text-slate-700">
          <span className="text-amber-700">Clock R-bits:</span>
          {state.frames.map((p, idx) => (
            <span key={idx} className="rounded bg-surface px-2 py-0.5">
              F{idx + 1}({p ?? '—'}): R={state.referenceBits[idx]}
              {state.clockPointer === idx ? ' ◀' : ''}
            </span>
          ))}
        </div>
      )}

      {algorithm === 'LFU' && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-subtle bg-canvas/60 px-3 py-2 font-mono text-xs text-slate-700">
          <span className="text-blue-600">Frequencies (ties → FIFO):</span>
          {state.frames.map((p, idx) =>
            p !== null ? (
              <span key={idx} className="rounded bg-surface px-2 py-0.5">
                Page {p}: freq={state.frequencies[p] ?? 0}
              </span>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
