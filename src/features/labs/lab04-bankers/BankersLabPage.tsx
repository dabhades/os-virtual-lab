import { useCallback, useEffect, useState } from 'react';
import { LabWorkspaceShell } from '../../../components/simulator/LabWorkspaceShell';
import { TransportBar } from '../../../components/simulator/TransportBar';
import { ExplanationPanel5Q } from '../../../components/simulator/ExplanationPanel5Q';
import { PracticeCheckpoint } from '../../../components/simulator/PracticeCheckpoint';
import { ReportModal } from '../../../components/simulator/ReportModal';
import { useSimulationStore } from '../../../core/useSimulationStore';
import { useAppStore } from '../../../core/useAppStore';
import { buildExperimentReport } from '../../../core/reportGenerator';
import { bankersEngine } from '../../../engines/bankers/bankersEngine';
import type {
  BankersMetrics,
  BankersStepState,
  ResourceRequest,
} from '../../../engines/bankers/types';
import type { ExperimentReport } from '../../../types/report';
import { BANKERS_PRESETS } from '../../../data/presets/bankersPresets';
import { BankersControlsPanel } from './BankersControlsPanel';
import { BankersVisualizer2D } from './BankersVisualizer2D';
import { BankersMetricsPanel } from './BankersMetricsPanel';

export function BankersLabPage() {
  const defaultPreset = BANKERS_PRESETS[0];
  const [available, setAvailable] = useState<number[]>(defaultPreset.available);
  const [maximum, setMaximum] = useState<number[][]>(defaultPreset.maximum);
  const [allocation, setAllocation] = useState<number[][]>(
    defaultPreset.allocation
  );
  const [resourceRequest, setResourceRequest] =
    useState<ResourceRequest | null>(defaultPreset.resourceRequest);
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
      nextAvail = available,
      nextMax = maximum,
      nextAlloc = allocation,
      nextReq = resourceRequest
    ) => {
      loadSimulation(bankersEngine, {
        available: nextAvail,
        maximum: nextMax,
        allocation: nextAlloc,
        resourceRequest: nextReq,
      });
    },
    [available, maximum, allocation, resourceRequest, loadSimulation]
  );

  useEffect(() => {
    recordLastVisited('/labs/bankers-algorithm', "LAB 04: Banker's Algorithm");
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as BankersStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as BankersMetrics | null) ?? null;

  const handleLoadPreset = (id: string) => {
    const p = BANKERS_PRESETS.find((item) => item.id === id);
    if (!p) return;
    setAvailable(p.available);
    setMaximum(p.maximum);
    setAllocation(p.allocation);
    setResourceRequest(p.resourceRequest);
    runCurrent(p.available, p.maximum, p.allocation, p.resourceRequest);
  };

  const handleCellChange = (
    matrix: 'allocation' | 'maximum',
    row: number,
    col: number,
    val: number
  ) => {
    const updater = (prev: number[][]) =>
      prev.map((r, i) => (i === row ? r.map((c, j) => (j === col ? val : c)) : r));
    if (matrix === 'allocation') setAllocation(updater);
    else setMaximum(updater);
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'bankers-algorithm',
        labTitle: "Banker's Algorithm",
        aim: 'Determine system safety and validate resource requests using Banker’s Algorithm.',
        objectives: [
          'Compute Need = Maximum − Allocation.',
          'Trace Work vector updates and construct a Safe Sequence.',
        ],
        theorySummary:
          "Banker's Algorithm is a deadlock avoidance algorithm that tests whether granting a resource request leaves the system in a Safe State.",
        algorithmName: "Banker's Safety & Resource Request",
        algorithmSteps: [
          'Compute Need[i] = Maximum[i] - Allocation[i].',
          'If a request is present, verify Request <= Need and Request <= Available.',
          'Run Safety Algorithm: find Finish[i]==false with Need[i] <= Work and reclaim Allocation[i].',
        ],
        inputs: { available, allocation, maximum, resourceRequest },
        conclusion: finalMetrics.isSafe
          ? `System is SAFE with sequence <${finalMetrics.safeSequence.join(', ')}>.`
          : `System is ${finalMetrics.systemStatus}; no complete Safe Sequence exists.`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'bankers-algorithm',
      labTitle: "Banker's Algorithm",
      algorithm: finalMetrics.systemStatus,
      timestamp: generated.generatedAt,
      summaryMetric: finalMetrics.isSafe
        ? `<${finalMetrics.safeSequence.join(',')}>`
        : 'Unsafe',
    });
  };

  const checkpoint = snapshot.currentStep?.checkpointPrompt;

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 04"
        title="Banker's Algorithm"
        subtitle="Deadlock avoidance via Need matrix, Safety Algorithm, and Resource Request rollback."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <BankersControlsPanel
            mode={snapshot.mode}
            available={available}
            maximum={maximum}
            allocation={allocation}
            resourceRequest={resourceRequest}
            errors={snapshot.errors}
            onAvailableChange={setAvailable}
            onCellChange={handleCellChange}
            onRequestChange={setResourceRequest}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={<BankersVisualizer2D state={currentState} />}
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
          <BankersMetricsPanel state={currentState} finalMetrics={finalMetrics} />
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
