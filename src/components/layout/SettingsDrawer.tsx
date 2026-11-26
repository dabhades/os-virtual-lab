import { useEffect, useRef } from 'react';
import { Monitor, Sparkles, Type, X } from 'lucide-react';
import { useAppStore } from '../../core/useAppStore';

export function SettingsDrawer() {
  const isOpen = useAppStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const preferences = useAppStore((s) => s.preferences);
  const updatePreferences = useAppStore((s) => s.updatePreferences);
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
      onClose={() => setSettingsOpen(false)}
      onClick={(e) => {
        if (e.target === dialogRef.current) setSettingsOpen(false);
      }}
      aria-label="Display and Accessibility Settings"
      className="m-auto w-[min(92vw,28rem)] rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/35"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Display & Accessibility
          </h2>
          <p className="text-xs text-slate-500">
            Optimize the simulator for your laptop and comfort.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(false)}
          aria-label="Close settings"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex gap-3">
            <Monitor className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <span className="block text-sm font-medium text-slate-900">
                2D-Only / Low-GPU Mode
              </span>
              <span className="text-xs text-slate-500">
                Disables 3D WebGL scenes and uses 2D diagrams to save battery and RAM.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.prefer2DOnly}
            onChange={(e) => updatePreferences({ prefer2DOnly: e.target.checked })}
            className="mt-1 h-4 w-4 accent-blue-600"
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <span className="block text-sm font-medium text-slate-900">
                Step Explainer Toasts
              </span>
              <span className="text-xs text-slate-500">
                Show floating step-by-step explanations during simulations.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.showExplainerToasts}
            onChange={(e) =>
              updatePreferences({ showExplainerToasts: e.target.checked })
            }
            className="mt-1 h-4 w-4 accent-blue-600"
          />
        </label>

        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <span className="block text-sm font-medium text-slate-900">
                Reduced Motion
              </span>
              <span className="text-xs text-slate-500">
                Minimizes UI transitions while preserving step-by-step clarity.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.reducedMotion}
            onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
            className="mt-1 h-4 w-4 accent-blue-600"
          />
        </label>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex gap-3">
            <Type className="mt-0.5 h-4 w-4 text-blue-600" aria-hidden="true" />
            <div>
              <span className="block text-sm font-medium text-slate-900">
                Text Size
              </span>
              <span className="text-xs text-slate-500">
                Increase base font size for easier reading.
              </span>
            </div>
          </div>
          <select
            value={preferences.fontScale}
            onChange={(e) =>
              updatePreferences({
                fontScale: e.target.value as 'normal' | 'large',
              })
            }
            aria-label="Text Size"
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-900"
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </dialog>
  );
}
