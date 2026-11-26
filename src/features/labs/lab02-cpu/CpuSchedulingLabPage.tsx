import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Layers } from 'lucide-react';
import { LabWorkspaceShell } from '../../../components/simulator/LabWorkspaceShell';
import { TransportBar } from '../../../components/simulator/TransportBar';
import { ExplanationPanel5Q } from '../../../components/simulator/ExplanationPanel5Q';
import { PracticeCheckpoint } from '../../../components/simulator/PracticeCheckpoint';
import { ReportModal } from '../../../components/simulator/ReportModal';
import { SafeCanvas3D } from '../../../components/three/SafeCanvas3D';
import { useSimulationStore } from '../../../core/useSimulationStore';
import { useAppStore } from '../../../core/useAppStore';
import { buildExperimentReport } from '../../../core/reportGenerator';
import {
  compareCpuAlgorithms,
  cpuSchedulingEngine,
} from '../../../engines/cpuScheduling/cpuSchedulingEngine';
import type {
  CpuAlgorithm,
  CpuSchedulingMetrics,
  CpuStepState,
  PriorityConvention,
  ProcessInput,
} from '../../../engines/cpuScheduling/types';
import type { ExperimentReport } from '../../../types/report';
import { CPU_PRESETS } from '../../../data/presets/cpuPresets';
import { CpuControlsPanel } from './CpuControlsPanel';
import { CpuVisualizer2D } from './CpuVisualizer2D';
import { CpuMetricsPanel } from './CpuMetricsPanel';

const LazyCpuScene3D = lazy(() =>
  import('./CpuScene3D').then((m) => ({ default: m.CpuScene3D }))
);

export function CpuSchedulingLabPage() {
  const defaultPreset = CPU_PRESETS[0];
  const [algorithm, setAlgorithm] = useState<CpuAlgorithm>(defaultPreset.algorithm);
  const [timeQuantum, setTimeQuantum] = useState<number>(defaultPreset.timeQuantum);
  const [priorityConvention, setPriorityConvention] =
    useState<PriorityConvention>('lower-is-higher');
  const [processes, setProcesses] = useState<ProcessInput[]>(
    defaultPreset.processes
  );
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showComparison, setShowComparison] = useState(false);
  const [report, setReport] = useState<ExperimentReport | null>(null);

  const snapshot = useSimulationStore((s) => s.snapshot);
  const loadSimulation = useSimulationStore((s) => s.loadSimulation);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const reset = useSimulationStore((s) => s.reset);
  const stepForward = useSimulationStore((s) => s.stepForward);
  const stepBackward = useSimulationStore((s) => s.stepBackward);
  const seekToStep = useSimulationStore((s) => s.seekToStep);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setMode = useSimulationStore((s) => s.setMode);
  const submitPrediction = useSimulationStore((s) => s.submitPrediction);
  const revealCheckpointAnswer = useSimulationStore(
    (s) => s.revealCheckpointAnswer
  );
  const getResult = useSimulationStore((s) => s.getResult);
  const dispose = useSimulationStore((s) => s.dispose);

  const recordLastVisited = useAppStore((s) => s.recordLastVisited);
  const addExperimentRun = useAppStore((s) => s.addExperimentRun);

  const runCurrentSimulation = useCallback(
    (
      nextAlgo = algorithm,
      nextQuantum = timeQuantum,
      nextConv = priorityConvention,
      nextProcs = processes
    ) => {
      loadSimulation(cpuSchedulingEngine, {
        algorithm: nextAlgo,
        timeQuantum: nextQuantum,
        priorityConvention: nextConv,
        processes: nextProcs,
      });
    },
    [algorithm, timeQuantum, priorityConvention, processes, loadSimulation]
  );

  useEffect(() => {
    recordLastVisited('/labs/cpu-scheduling', 'LAB 02: CPU Scheduling');
    runCurrentSimulation();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as CpuStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as CpuSchedulingMetrics | null) ?? null;

  const comparisonRows = useMemo(() => {
    if (!showComparison) return [];
    const valid = cpuSchedulingEngine.validate({
      processes,
      algorithm,
      timeQuantum,
      priorityConvention,
    }).valid;
    if (!valid) return [];
    return compareCpuAlgorithms(processes, timeQuantum, priorityConvention);
  }, [showComparison, processes, algorithm, timeQuantum, priorityConvention]);

  const handleLoadPreset = (presetId: string) => {
    const preset = CPU_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setAlgorithm(preset.algorithm);
    setTimeQuantum(preset.timeQuantum);
    setProcesses(preset.processes);
    runCurrentSimulation(
      preset.algorithm,
      preset.timeQuantum,
      priorityConvention,
      preset.processes
    );
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'cpu-scheduling',
        labTitle: 'CPU Scheduling',
        aim: `Simulate and evaluate ${algorithm} CPU scheduling on ${processes.length} processes.`,
        objectives: [
          'Observe Ready Queue, Running CPU, and Gantt Chart transitions.',
          'Compute Completion, Turnaround, Waiting, and Response Times.',
        ],
        theorySummary:
          'CPU scheduling allocates the processor among ready processes to maximize CPU utilization and minimize waiting and turnaround times.',
        algorithmName: algorithm,
        algorithmSteps: [
          'Admit arriving processes into the Ready Queue at their Arrival Time.',
          `Select the next process according to ${algorithm} rules.`,
          'Update Gantt chart, remaining burst time, and completion metrics.',
        ],
        inputs: {
          algorithm,
          timeQuantum: algorithm === 'RR' ? timeQuantum : 'N/A',
          processes,
        },
        conclusion: `${algorithm} completed in ${finalMetrics.totalTime} ticks with Avg WT = ${finalMetrics.avgWaitingTime} and CPU Utilization = ${finalMetrics.cpuUtilization}%.`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'cpu-scheduling',
      labTitle: 'CPU Scheduling',
      algorithm,
      timestamp: generated.generatedAt,
      summaryMetric: `Avg WT: ${finalMetrics.avgWaitingTime}`,
    });
  };

  const checkpoint = snapshot.currentStep?.checkpointPrompt;

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 02"
        title="CPU Scheduling"
        subtitle="FCFS, SJF, SRTF, Priority, Round Robin, and HRRN with live Gantt chart and 3D CPU view."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <CpuControlsPanel
            mode={snapshot.mode}
            algorithm={algorithm}
            timeQuantum={timeQuantum}
            priorityConvention={priorityConvention}
            processes={processes}
            errors={snapshot.errors}
            onAlgorithmChange={(next) => {
              setAlgorithm(next);
              runCurrentSimulation(next, timeQuantum, priorityConvention, processes);
            }}
            onQuantumChange={(q) => {
              setTimeQuantum(q);
              runCurrentSimulation(algorithm, q, priorityConvention, processes);
            }}
            onPriorityConventionChange={(conv) => {
              setPriorityConvention(conv);
              runCurrentSimulation(algorithm, timeQuantum, conv, processes);
            }}
            onProcessesChange={setProcesses}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrentSimulation()}
          />
        }
        visualizationStage={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">
                Visualization Stage
              </span>
              <div className="inline-flex rounded-lg border border-subtle bg-canvas p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium ${
                    viewMode === '2d'
                      ? 'bg-blue-600 text-slate-900'
                      : 'text-slate-700'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>2D Gantt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium ${
                    viewMode === '3d'
                      ? 'bg-blue-600 text-slate-900'
                      : 'text-slate-700'
                  }`}
                >
                  <Box className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>3D CPU</span>
                </button>
              </div>
            </div>

            {viewMode === '3d' ? (
              <div className="space-y-4">
                <SafeCanvas3D
                  scene3D={
                    <Suspense
                      fallback={
                        <div className="flex h-64 items-center justify-center rounded-xl border border-subtle bg-canvas font-mono text-xs text-blue-600">
                          Loading 3D CPU scene…
                        </div>
                      }
                    >
                      <LazyCpuScene3D state={currentState} />
                    </Suspense>
                  }
                  fallback2D={<CpuVisualizer2D state={currentState} />}
                />
                <CpuVisualizer2D state={currentState} />
              </div>
            ) : (
              <CpuVisualizer2D state={currentState} />
            )}
          </div>
        }
        checkpointBanner={
          snapshot.mode === 'practice' &&
          snapshot.awaitingPrediction &&
          checkpoint ? (
            <PracticeCheckpoint
              question={checkpoint.question}
              options={checkpoint.options}
              feedback={snapshot.predictionFeedback}
              onSelect={submitPrediction}
              onReveal={revealCheckpointAnswer}
            />
          ) : undefined
        }
        transportBar={
          <TransportBar
            status={snapshot.status}
            currentStepIndex={snapshot.currentStepIndex}
            totalSteps={snapshot.totalSteps}
            speed={snapshot.speed}
            awaitingPrediction={snapshot.awaitingPrediction}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onStepForward={stepForward}
            onStepBackward={stepBackward}
            onSeek={seekToStep}
            onSpeedChange={setSpeed}
          />
        }
        metricsPanel={
          <CpuMetricsPanel
            state={currentState}
            finalMetrics={finalMetrics}
            comparisonRows={comparisonRows}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison((v) => !v)}
          />
        }
        explanationPanel={
          <ExplanationPanel5Q
            explanation={snapshot.currentStep?.explanation ?? null}
            tick={currentState?.tick}
          />
        }
      />

      <ReportModal report={report} onClose={() => setReport(null)} />
    </>
  );
}
