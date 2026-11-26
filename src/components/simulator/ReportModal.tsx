import { useEffect, useRef } from 'react';
import { Download, FileJson, Printer, X } from 'lucide-react';
import type { ExperimentReport } from '../../types/report';
import { formatReportAsMarkdown } from '../../core/reportGenerator';

interface ReportModalProps {
  report: ExperimentReport | null;
  onClose: () => void;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportModal({ report, onClose }: ReportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (report && !dialog.open) dialog.showModal();
    if (!report && dialog.open) dialog.close();
  }, [report]);

  if (!report) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      aria-label="Experiment Report"
      className="m-auto w-[min(94vw,48rem)] rounded-xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {report.labTitle} — Experiment Report
          </h2>
          <p className="font-mono text-xs text-blue-600">
            {report.algorithmName} · Generated from actual simulator run
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close report modal"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5 text-sm">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Aim
          </h3>
          <p className="mt-1 text-slate-800">{report.aim}</p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Calculated Metrics
          </h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {Object.entries(report.metrics).map(([k, v]) => (
              <div
                key={k}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
              >
                <div className="text-[11px] text-slate-500">{k}</div>
                <div className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {v}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Execution Trace ({report.executionTrace.length} steps)
          </h3>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-700">
            {report.executionTrace.map((t) => (
              <div key={t.stepIndex} className="border-b border-slate-200 py-1 last:border-0">
                <span className="font-semibold text-blue-600">[t={t.tick}]</span> {t.whatHappened}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              `${report.labId}-report.md`,
              formatReportAsMarkdown(report),
              'text/markdown'
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>Markdown (.md)</span>
        </button>

        <button
          type="button"
          onClick={() =>
            downloadTextFile(
              `${report.labId}-report.json`,
              JSON.stringify(report, null, 2),
              'application/json'
            )
          }
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <FileJson className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <span>JSON</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Print / Save PDF</span>
        </button>
      </div>
    </dialog>
  );
}
