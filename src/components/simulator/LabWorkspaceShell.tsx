import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import type { LearningMode } from '../../types/simulation';
import { useAppStore } from '../../core/useAppStore';
import { useSimulationStore } from '../../core/useSimulationStore';
import { ModeSwitcher } from './ModeSwitcher';
import { AlgorithmStepsCard } from './AlgorithmStepsCard';
import { ExplainerToast } from './ExplainerToast';

interface LabWorkspaceShellProps {
  labNumber?: string;
  title: string;
  subtitle: string;
  mode: LearningMode;
  onModeChange: (mode: LearningMode) => void;
  onExportReport?: () => void;
  controlsPanel: ReactNode;
  visualizationStage: ReactNode;
  transportBar: ReactNode;
  metricsPanel: ReactNode;
  explanationPanel: ReactNode;
  checkpointBanner?: ReactNode;
}

export function LabWorkspaceShell({
  title,
  subtitle,
  mode,
  onModeChange,
  onExportReport,
  controlsPanel,
  visualizationStage,
  transportBar,
  metricsPanel,
  explanationPanel,
  checkpointBanner,
}: LabWorkspaceShellProps) {
  const [showExplanationBox, setShowExplanationBox] = useState(false);

  const showExplainerToasts = useAppStore(
    (s) => s.preferences.showExplainerToasts
  );
  const updatePreferences = useAppStore((s) => s.updatePreferences);
  const snapshot = useSimulationStore((s) => s.snapshot);

  return (
    <div className="space-y-4">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <Link
            to="/labs"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>All Simulators</span>
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {title}
          </h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showExplainerToasts}
              onChange={(e) =>
                updatePreferences({ showExplainerToasts: e.target.checked })
              }
              className="h-3.5 w-3.5 accent-blue-600"
            />
            <span>Explainer Toasts</span>
          </label>

          <ModeSwitcher mode={mode} onChange={onModeChange} />

          {onExportReport && (
            <button
              type="button"
              onClick={onExportReport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <FileText className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Algorithm Process Block */}
      <AlgorithmStepsCard
        labTitle={title}
        isRunning={snapshot.status === 'playing'}
        activeStageIndex={
          snapshot.totalSteps > 0
            ? snapshot.currentStepIndex % 4
            : -1
        }
      />

      {/* Main Grid: Controls + Visualization */}
      <div className="grid gap-5 lg:grid-cols-12">
        <aside className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-4">
          {controlsPanel}
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
            {visualizationStage}
          </div>
          {checkpointBanner}
          {transportBar}
        </div>
      </div>

      {/* Metrics & Collapsible Full Explanation */}
      <div className="space-y-4">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          {metricsPanel}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setShowExplanationBox((v) => !v)}
            aria-expanded={showExplanationBox}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            <span>Detailed Step Breakdown (What / Why / Rule / Next)</span>
            {showExplanationBox ? (
              <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
            )}
          </button>
          {showExplanationBox && (
            <div className="border-t border-slate-200 p-4">{explanationPanel}</div>
          )}
        </div>
      </div>

      <ExplainerToast
        visible={showExplainerToasts}
        stepIndex={snapshot.currentStepIndex}
        tick={snapshot.currentStep?.tick}
        explanation={snapshot.currentStep?.explanation ?? null}
      />
    </div>
  );
}
