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
import { memoryAllocationEngine } from '../../../engines/memoryAllocation/memoryAllocationEngine';
import type {
  FitStrategy,
  MemoryAllocationMetrics,
  MemoryOperation,
  MemoryStepState,
  PartitionMode,
} from '../../../engines/memoryAllocation/types';
import type { ExperimentReport } from '../../../types/report';
import { MEMORY_PRESETS } from '../../../data/presets/memoryPresets';
import { MemoryControlsPanel } from './MemoryControlsPanel';
import { MemoryVisualizer2D } from './MemoryVisualizer2D';
import { MemoryMetricsPanel } from './MemoryMetricsPanel';

const LazyMemoryScene3D = lazy(() =>
  import('./MemoryScene3D').then((m) => ({ default: m.MemoryScene3D }))
);

export function MemoryAllocationLabPage() {
  const defaultPreset = MEMORY_PRESETS[0];
  const [totalMemory, setTotalMemory] = useState(defaultPreset.totalMemory);
  const [partitionMode, setPartitionMode] = useState<PartitionMode>(
    defaultPreset.partitionMode
  );
  const [fitStrategy, setFitStrategy] = useState<FitStrategy>(
    defaultPreset.fitStrategy
  );
  const [fixedPartitions, setFixedPartitions] = useState<number[]>(
    defaultPreset.fixedPartitions
  );
  const [operations, setOperations] = useState<MemoryOperation[]>(
    defaultPreset.operations
  );
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
      nextMem = totalMemory,
      nextPartMode = partitionMode,
      nextFit = fitStrategy,
      nextFixed = fixedPartitions,
      nextOps = operations
    ) => {
      loadSimulation(memoryAllocationEngine, {
        totalMemory: nextMem,
        partitionMode: nextPartMode,
        fitStrategy: nextFit,
        fixedPartitions: nextFixed,
        operations: nextOps,
      });
    },
    [
      totalMemory,
      partitionMode,
      fitStrategy,
      fixedPartitions,
      operations,
      loadSimulation,
    ]
  );

  useEffect(() => {
    recordLastVisited('/labs/memory-allocation', 'LAB 05: Memory Allocation');
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as MemoryStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as MemoryAllocationMetrics | null) ?? null;

  const handleLoadPreset = (id: string) => {
    const p = MEMORY_PRESETS.find((item) => item.id === id);
    if (!p) return;
    setTotalMemory(p.totalMemory);
    setPartitionMode(p.partitionMode);
    setFitStrategy(p.fitStrategy);
    setFixedPartitions(p.fixedPartitions);
    setOperations(p.operations);
    runCurrent(
      p.totalMemory,
      p.partitionMode,
      p.fitStrategy,
      p.fixedPartitions,
      p.operations
    );
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'memory-allocation',
        labTitle: 'Memory Allocation',
        aim: `Evaluate ${fitStrategy} under ${partitionMode} partitioning on ${totalMemory} KB RAM.`,
        objectives: [
          'Observe block allocation, deallocation coalescing, and compaction.',
          'Measure internal and external fragmentation.',
        ],
        theorySummary:
          'Contiguous memory allocation places processes into free RAM holes using First Fit, Best Fit, Worst Fit, or Next Fit strategies.',
        algorithmName: `${partitionMode} / ${fitStrategy}`,
        algorithmSteps: [
          'Scan free blocks according to the selected fit strategy.',
          'Allocate block (splitting if variable) and update fragmentation metrics.',
          'Coalesce adjacent free blocks on deallocation or compact RAM when requested.',
        ],
        inputs: { totalMemory, partitionMode, fitStrategy, operations },
        conclusion: `Completed with ${finalMetrics.utilizationPercent}% utilization, ${finalMetrics.internalFragmentation} KB internal frag, and ${finalMetrics.externalFragmentation} KB external frag.`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'memory-allocation',
      labTitle: 'Memory Allocation',
      algorithm: `${partitionMode} (${fitStrategy})`,
      timestamp: generated.generatedAt,
      summaryMetric: `Util: ${finalMetrics.utilizationPercent}%`,
    });
  };

  const checkpoint = snapshot.currentStep?.checkpointPrompt;

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 05"
        title="Memory Allocation"
        subtitle="First Fit, Best Fit, Worst Fit, Next Fit, Fixed/Variable Partitioning, and Compaction."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <MemoryControlsPanel
            mode={snapshot.mode}
            totalMemory={totalMemory}
            partitionMode={partitionMode}
            fitStrategy={fitStrategy}
            fixedPartitions={fixedPartitions}
            operations={operations}
            errors={snapshot.errors}
            onTotalMemoryChange={setTotalMemory}
            onPartitionModeChange={(m) => {
              setPartitionMode(m);
              runCurrent(totalMemory, m, fitStrategy, fixedPartitions, operations);
            }}
            onFitStrategyChange={(f) => {
              setFitStrategy(f);
              runCurrent(totalMemory, partitionMode, f, fixedPartitions, operations);
            }}
            onFixedPartitionsChange={setFixedPartitions}
            onOperationsChange={setOperations}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">
                RAM Memory Map
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
                  <span>2D Map</span>
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
                  <span>3D RAM</span>
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
                          Loading 3D RAM view…
                        </div>
                      }
                    >
                      <LazyMemoryScene3D state={currentState} />
                    </Suspense>
                  }
                  fallback2D={<MemoryVisualizer2D state={currentState} />}
                />
                <MemoryVisualizer2D state={currentState} />
              </div>
            ) : (
              <MemoryVisualizer2D state={currentState} />
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
          <MemoryMetricsPanel state={currentState} finalMetrics={finalMetrics} />
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
