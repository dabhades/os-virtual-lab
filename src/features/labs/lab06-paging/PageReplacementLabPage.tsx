import { useCallback, useEffect, useMemo, useState } from 'react';
import { LabWorkspaceShell } from '../../../components/simulator/LabWorkspaceShell';
import { TransportBar } from '../../../components/simulator/TransportBar';
import { ExplanationPanel5Q } from '../../../components/simulator/ExplanationPanel5Q';
import { PracticeCheckpoint } from '../../../components/simulator/PracticeCheckpoint';
import { ReportModal } from '../../../components/simulator/ReportModal';
import { useSimulationStore } from '../../../core/useSimulationStore';
import { useAppStore } from '../../../core/useAppStore';
import { buildExperimentReport } from '../../../core/reportGenerator';
import {
  comparePageAlgorithms,
  pageReplacementEngine,
} from '../../../engines/pageReplacement/pageReplacementEngine';
import type {
  PageAlgorithm,
  PageReplacementMetrics,
  PageStepState,
} from '../../../engines/pageReplacement/types';
import type { ExperimentReport } from '../../../types/report';
import { PAGE_PRESETS } from '../../../data/presets/pagePresets';
import { PageControlsPanel } from './PageControlsPanel';
import { PageVisualizer2D } from './PageVisualizer2D';
import { PageMetricsPanel } from './PageMetricsPanel';

function parseReferenceString(text: string): number[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number);
}

export function PageReplacementLabPage() {
  const defaultPreset = PAGE_PRESETS[0];
  const [algorithm, setAlgorithm] = useState<PageAlgorithm>(
    defaultPreset.algorithm
  );
  const [frameCount, setFrameCount] = useState<number>(defaultPreset.frameCount);
  const [refStringText, setRefStringText] = useState<string>(
    defaultPreset.referenceString.join(', ')
  );
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
      nextFrames = frameCount,
      nextText = refStringText
    ) => {
      loadSimulation(pageReplacementEngine, {
        algorithm: nextAlgo,
        frameCount: nextFrames,
        referenceString: parseReferenceString(nextText),
      });
    },
    [algorithm, frameCount, refStringText, loadSimulation]
  );

  useEffect(() => {
    recordLastVisited('/labs/page-replacement', 'LAB 06: Page Replacement');
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as PageStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as PageReplacementMetrics | null) ?? null;

  const comparisonRows = useMemo(() => {
    if (!showComparison) return [];
    const parsed = parseReferenceString(refStringText);
    if (
      !pageReplacementEngine.validate({
        algorithm,
        frameCount,
        referenceString: parsed,
      }).valid
    ) {
      return [];
    }
    return comparePageAlgorithms(parsed, frameCount);
  }, [showComparison, algorithm, frameCount, refStringText]);

  const handleLoadPreset = (id: string) => {
    const p = PAGE_PRESETS.find((item) => item.id === id);
    if (!p) return;
    const txt = p.referenceString.join(', ');
    setAlgorithm(p.algorithm);
    setFrameCount(p.frameCount);
    setRefStringText(txt);
    runCurrent(p.algorithm, p.frameCount, txt);
  };

  const handleGenerateRandom = () => {
    const len = 14;
    const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 8));
    const txt = arr.join(', ');
    setRefStringText(txt);
    runCurrent(algorithm, frameCount, txt);
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'page-replacement',
        labTitle: 'Page Replacement',
        aim: `Evaluate ${algorithm} page replacement with ${frameCount} frames.`,
        objectives: [
          'Trace page hits, page faults, and victim selection.',
          'Compare fault ratios across replacement policies.',
        ],
        theorySummary:
          'Virtual memory uses page replacement algorithms to choose which resident page to evict when a page fault occurs and all frames are occupied.',
        algorithmName: algorithm,
        algorithmSteps: [
          'Check if requested page is in physical frames (Hit vs Fault).',
          'Load into free frame if available, else select victim via policy.',
          'Update Hit/Fault counts and ratios.',
        ],
        inputs: {
          algorithm,
          frameCount,
          referenceString: parseReferenceString(refStringText),
        },
        conclusion: `${algorithm} produced ${finalMetrics.faults} page faults and ${finalMetrics.hits} hits (Hit Ratio: ${finalMetrics.hitRatio}%).`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'page-replacement',
      labTitle: 'Page Replacement',
      algorithm: `${algorithm} (${frameCount}F)`,
      timestamp: generated.generatedAt,
      summaryMetric: `Faults: ${finalMetrics.faults}`,
    });
  };

  const checkpoint = snapshot.currentStep?.checkpointPrompt;

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 06"
        title="Page Replacement"
        subtitle="FIFO, LRU, Optimal, LFU, and Second Chance (Clock) with Belady's Anomaly demo."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <PageControlsPanel
            mode={snapshot.mode}
            algorithm={algorithm}
            frameCount={frameCount}
            refStringText={refStringText}
            errors={snapshot.errors}
            onAlgorithmChange={(a) => {
              setAlgorithm(a);
              runCurrent(a, frameCount, refStringText);
            }}
            onFrameCountChange={(c) => {
              setFrameCount(c);
              runCurrent(algorithm, c, refStringText);
            }}
            onRefStringTextChange={setRefStringText}
            onGenerateRandom={handleGenerateRandom}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={
          <PageVisualizer2D
            state={currentState}
            algorithm={algorithm}
            frameCount={frameCount}
          />
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
          <PageMetricsPanel
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
