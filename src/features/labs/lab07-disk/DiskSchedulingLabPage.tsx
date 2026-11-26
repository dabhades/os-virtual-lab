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
  compareDiskAlgorithms,
  diskSchedulingEngine,
} from '../../../engines/diskScheduling/diskSchedulingEngine';
import type {
  DiskAlgorithm,
  DiskDirection,
  DiskSchedulingMetrics,
  DiskStepState,
} from '../../../engines/diskScheduling/types';
import type { ExperimentReport } from '../../../types/report';
import { DISK_PRESETS } from '../../../data/presets/diskPresets';
import { DiskControlsPanel } from './DiskControlsPanel';
import { DiskVisualizer2D } from './DiskVisualizer2D';
import { DiskMetricsPanel } from './DiskMetricsPanel';

const LazyDiskScene3D = lazy(() =>
  import('./DiskScene3D').then((m) => ({ default: m.DiskScene3D }))
);

function parseQueue(text: string): number[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
}

export function DiskSchedulingLabPage() {
  const defaultPreset = DISK_PRESETS[0];
  const [algorithm, setAlgorithm] = useState<DiskAlgorithm>(
    defaultPreset.algorithm
  );
  const [cylinderCount, setCylinderCount] = useState(
    defaultPreset.cylinderCount
  );
  const [initialHead, setInitialHead] = useState(defaultPreset.initialHead);
  const [direction, setDirection] = useState<DiskDirection>(
    defaultPreset.direction
  );
  const [queueText, setQueueText] = useState(defaultPreset.requests.join(', '));
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

  const runCurrent = useCallback(
    (
      nextAlgo = algorithm,
      nextCyl = cylinderCount,
      nextHead = initialHead,
      nextDir = direction,
      nextQ = queueText
    ) => {
      loadSimulation(diskSchedulingEngine, {
        algorithm: nextAlgo,
        cylinderCount: nextCyl,
        initialHead: nextHead,
        direction: nextDir,
        requests: parseQueue(nextQ),
      });
    },
    [algorithm, cylinderCount, initialHead, direction, queueText, loadSimulation]
  );

  useEffect(() => {
    recordLastVisited('/labs/disk-scheduling', 'LAB 07: Disk Scheduling');
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as DiskStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as DiskSchedulingMetrics | null) ?? null;

  const comparisonRows = useMemo(() => {
    if (!showComparison) return [];
    const reqs = parseQueue(queueText);
    if (
      !diskSchedulingEngine.validate({
        algorithm,
        cylinderCount,
        initialHead,
        direction,
        requests: reqs,
      }).valid
    ) {
      return [];
    }
    return compareDiskAlgorithms(cylinderCount, initialHead, direction, reqs);
  }, [showComparison, algorithm, cylinderCount, initialHead, direction, queueText]);

  const handleLoadPreset = (id: string) => {
    const p = DISK_PRESETS.find((item) => item.id === id);
    if (!p) return;
    const txt = p.requests.join(', ');
    setAlgorithm(p.algorithm);
    setCylinderCount(p.cylinderCount);
    setInitialHead(p.initialHead);
    setDirection(p.direction);
    setQueueText(txt);
    runCurrent(p.algorithm, p.cylinderCount, p.initialHead, p.direction, txt);
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'disk-scheduling',
        labTitle: 'Disk Scheduling',
        aim: `Evaluate ${algorithm} disk arm movement starting from cylinder ${initialHead}.`,
        objectives: [
          'Calculate total head movement and average seek distance.',
          'Contrast SCAN vs. LOOK and C-SCAN vs. C-LOOK boundary behavior.',
        ],
        theorySummary:
          'Disk scheduling orders pending cylinder I/O requests to minimize seek time and prevent starvation.',
        algorithmName: algorithm,
        algorithmSteps: [
          'Start from initial head position and direction.',
          `Select next cylinder using ${algorithm} rules.`,
          'Accumulate |next - current| seek distances.',
        ],
        inputs: {
          algorithm,
          cylinderCount,
          initialHead,
          direction,
          requests: parseQueue(queueText),
        },
        conclusion: `${algorithm} serviced ${finalMetrics.requestCount} requests with Total Head Movement = ${finalMetrics.totalHeadMovement} cylinders.`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'disk-scheduling',
      labTitle: 'Disk Scheduling',
      algorithm,
      timestamp: generated.generatedAt,
      summaryMetric: `Seek: ${finalMetrics.totalHeadMovement}`,
    });
  };

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 07"
        title="Disk Scheduling"
        subtitle="FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK with 2D seek trajectory and 3D platter."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <DiskControlsPanel
            mode={snapshot.mode}
            algorithm={algorithm}
            cylinderCount={cylinderCount}
            initialHead={initialHead}
            direction={direction}
            queueText={queueText}
            errors={snapshot.errors}
            onAlgorithmChange={(a) => {
              setAlgorithm(a);
              runCurrent(a, cylinderCount, initialHead, direction, queueText);
            }}
            onCylinderCountChange={setCylinderCount}
            onInitialHeadChange={setInitialHead}
            onDirectionChange={(d) => {
              setDirection(d);
              runCurrent(algorithm, cylinderCount, initialHead, d, queueText);
            }}
            onQueueTextChange={setQueueText}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">
                Disk Seek Stage
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
                  <span>2D Graph</span>
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
                  <span>3D Platter</span>
                </button>
              </div>
            </div>

            {viewMode === '3d' ? (
              <div className="space-y-4">
                <SafeCanvas3D
                  scene3D={
                    <Suspense
                      fallback={
                        <div className="flex h-60 items-center justify-center rounded-xl border border-subtle bg-canvas font-mono text-xs text-blue-600">
                          Loading 3D Disk Platter…
                        </div>
                      }
                    >
                      <LazyDiskScene3D state={currentState} />
                    </Suspense>
                  }
                  fallback2D={<DiskVisualizer2D state={currentState} />}
                />
                <DiskVisualizer2D state={currentState} />
              </div>
            ) : (
              <DiskVisualizer2D state={currentState} />
            )}
          </div>
        }
        checkpointBanner={
          snapshot.mode === 'practice' &&
          snapshot.awaitingPrediction &&
          snapshot.currentStep?.checkpointPrompt ? (
            <PracticeCheckpoint
              question={snapshot.currentStep.checkpointPrompt.question}
              options={snapshot.currentStep.checkpointPrompt.options}
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
          <DiskMetricsPanel
            state={currentState}
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
