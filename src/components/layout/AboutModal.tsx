import { useEffect, useRef } from 'react';
import { GraduationCap, Users, X } from 'lucide-react';
import { useAppStore } from '../../core/useAppStore';

export function AboutModal() {
  const isOpen = useAppStore((s) => s.isAboutOpen);
  const setAboutOpen = useAppStore((s) => s.setAboutOpen);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={() => setAboutOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setAboutOpen(false);
      }}
      aria-label="About this project"
      className="m-auto w-[min(92vw,30rem)] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/35"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            About This Project
          </h2>
          <p className="text-xs text-slate-500">
            Operating Systems Virtual Laboratory
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAboutOpen(false)}
          aria-label="Close about dialog"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <p className="text-xs leading-relaxed text-slate-600">
          An interactive, browser-based Operating Systems simulator designed to
          help students visualize and experiment with core OS practicals—from
          CPU scheduling and synchronization to memory, paging, disk, file
          systems, and Linux commands.
        </p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <Users className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span>Presented By</span>
          </div>
          <ul className="space-y-1 font-medium text-slate-900">
            <li>Sopan Dabhade</li>
            <li>Ritik Bhavle</li>
          </ul>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Presented To</span>
          </div>
          <p className="font-semibold text-slate-900">Prof. S.D. Gavande</p>
        </div>
      </div>
    </dialog>
  );
}
