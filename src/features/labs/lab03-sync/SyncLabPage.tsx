import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
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
import { synchronizationEngine } from '../../../engines/synchronization/synchronizationEngine';
import type {
  SyncMetrics,
  SyncScenario,
  SyncStepState,
} from '../../../engines/synchronization/types';
import type { ExperimentReport } from '../../../types/report';
import { SyncControlsPanel } from './SyncControlsPanel';
import { SyncVisualizer2D } from './SyncVisualizer2D';
import { SyncMetricsPanel } from './SyncMetricsPanel';

const LazySyncScene3D = lazy(() =>
  import('./SyncScene3D').then((m) => ({ default: m.SyncScene3D }))
);

export function SyncLabPage() {
  const [scenario, setScenario] = useState<SyncScenario>('PRODUCER_CONSUMER');
  const [bufferSize, setBufferSize] = useState(4);
  const [producerCount, setProducerCount] = useState(2);
  const [consumerCount, setConsumerCount] = useState(2);
  const [semaphoreCount, setSemaphoreCount] = useState(2);
  const [triggerDeadlock, setTriggerDeadlock] = useState(true);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
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
      s = scenario,
      b = bufferSize,
      p = producerCount,
      c = consumerCount,
      sc = semaphoreCount,
      dl = triggerDeadlock
    ) => {
      loadSimulation(synchronizationEngine, {
        scenario: s,
        bufferSize: b,
        producerCount: p,
        consumerCount: c,
        semaphoreCount: sc,
        triggerDeadlock: dl,
      });
    },
    [
      scenario,
      bufferSize,
      producerCount,
      consumerCount,
      semaphoreCount,
      triggerDeadlock,
      loadSimulation,
    ]
  );

  useEffect(() => {
    recordLastVisited(
      '/labs/synchronization',
      'LAB 03: Synchronization & Semaphores'
    );
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as SyncStepState) ?? null;
  const finalMetrics = (snapshot.finalMetrics as SyncMetrics | null) ?? null;

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'synchronization',
        labTitle: 'Process Synchronization & Semaphores',
        aim: `Simulate ${scenario.replace(/_/g, ' ')} deterministically.`,
        objectives: [
          'Observe wait() and signal() semaphore state transitions.',
          'Identify race conditions, mutual exclusion, and deadlocks.',
        ],
        theorySummary:
          'Process synchronization coordinates concurrent access to shared resources using mutexes and semaphores to prevent race conditions and deadlocks.',
        algorithmName: scenario,
        algorithmSteps: [
          'Initialize processes and synchronization semaphores.',
          'Execute deterministic micro-instruction interleaving.',
          'Verify critical section invariants and deadlock freedom.',
        ],
        inputs: {
          scenario,
          bufferSize,
          producerCount,
          consumerCount,
          semaphoreCount,
          triggerDeadlock,
        },
        conclusion: `Scenario completed in ${finalMetrics.totalSteps} steps (Lost Updates: ${finalMetrics.lostUpdates}, Deadlock: ${finalMetrics.deadlockDetected}).`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'synchronization',
      labTitle: 'Synchronization',
      algorithm: scenario,
      timestamp: generated.generatedAt,
      summaryMetric: finalMetrics.deadlockDetected ? 'Deadlock' : 'Safe',
    });
  };

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 03"
        title="Process Synchronization & Semaphores"
        subtitle="Critical Section, Race Condition, Mutex, Semaphores, Producer–Consumer, Dining Philosophers & Readers–Writers."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <SyncControlsPanel
            mode={snapshot.mode}
            scenario={scenario}
            bufferSize={bufferSize}
            producerCount={producerCount}
            consumerCount={consumerCount}
            semaphoreCount={semaphoreCount}
            triggerDeadlock={triggerDeadlock}
            errors={snapshot.errors}
            onScenarioChange={(next) => {
              setScenario(next);
              runCurrent(
                next,
                bufferSize,
                producerCount,
                consumerCount,
                semaphoreCount,
                triggerDeadlock
              );
            }}
            onBufferSizeChange={setBufferSize}
            onProducerCountChange={setProducerCount}
            onConsumerCountChange={setConsumerCount}
            onSemaphoreCountChange={setSemaphoreCount}
            onTriggerDeadlockChange={(dl) => {
              setTriggerDeadlock(dl);
              runCurrent(
                scenario,
                bufferSize,
                producerCount,
                consumerCount,
                semaphoreCount,
                dl
              );
            }}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">
                Synchronization Stage
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
                  <span>2D Stage</span>
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
                  <span>3D Stage</span>
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
                          Loading 3D Synchronization scene…
                        </div>
                      }
                    >
                      <LazySyncScene3D state={currentState} />
                    </Suspense>
                  }
                  fallback2D={<SyncVisualizer2D state={currentState} />}
                />
                <SyncVisualizer2D state={currentState} />
              </div>
            ) : (
              <SyncVisualizer2D state={currentState} />
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
          <SyncMetricsPanel state={currentState} finalMetrics={finalMetrics} />
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
