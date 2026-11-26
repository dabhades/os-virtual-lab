import { useCallback, useEffect, useState } from 'react';
import { LabWorkspaceShell } from '../../../components/simulator/LabWorkspaceShell';
import { TransportBar } from '../../../components/simulator/TransportBar';
import { ExplanationPanel5Q } from '../../../components/simulator/ExplanationPanel5Q';
import { ReportModal } from '../../../components/simulator/ReportModal';
import { useSimulationStore } from '../../../core/useSimulationStore';
import { useAppStore } from '../../../core/useAppStore';
import { buildExperimentReport } from '../../../core/reportGenerator';
import { fileManagementEngine } from '../../../engines/fileManagement/fileManagementEngine';
import type {
  AllocationMethod,
  DirectoryStructure,
  FileManagementMetrics,
  FileOperation,
  FileStepState,
} from '../../../engines/fileManagement/types';
import type { ExperimentReport } from '../../../types/report';
import { FILE_PRESETS } from '../../../data/presets/filePresets';
import { FileControlsPanel } from './FileControlsPanel';
import { FileVisualizer2D } from './FileVisualizer2D';
import { FileMetricsPanel } from './FileMetricsPanel';

export function FileManagementLabPage() {
  const defaultPreset = FILE_PRESETS[0];
  const [allocationMethod, setAllocationMethod] = useState<AllocationMethod>(
    defaultPreset.allocationMethod
  );
  const [directoryStructure, setDirectoryStructure] =
    useState<DirectoryStructure>(defaultPreset.directoryStructure);
  const [operations, setOperations] = useState<FileOperation[]>(
    defaultPreset.operations
  );
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
  const getResult = useSimulationStore((s) => s.getResult);
  const dispose = useSimulationStore((s) => s.dispose);

  const recordLastVisited = useAppStore((s) => s.recordLastVisited);
  const addExperimentRun = useAppStore((s) => s.addExperimentRun);

  const runCurrent = useCallback(
    (
      nextAlloc = allocationMethod,
      nextDir = directoryStructure,
      nextOps = operations
    ) => {
      loadSimulation(fileManagementEngine, {
        diskBlockCount: 24,
        allocationMethod: nextAlloc,
        directoryStructure: nextDir,
        operations: nextOps,
      });
    },
    [allocationMethod, directoryStructure, operations, loadSimulation]
  );

  useEffect(() => {
    recordLastVisited('/labs/file-management', 'LAB 08: File Management');
    runCurrent();
    return () => dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentState = (snapshot.currentStep?.state as FileStepState) ?? null;
  const finalMetrics =
    (snapshot.finalMetrics as FileManagementMetrics | null) ?? null;

  const handleLoadPreset = (id: string) => {
    const p = FILE_PRESETS.find((item) => item.id === id);
    if (!p) return;
    setAllocationMethod(p.allocationMethod);
    setDirectoryStructure(p.directoryStructure);
    setOperations(p.operations);
    runCurrent(p.allocationMethod, p.directoryStructure, p.operations);
  };

  const handleExportReport = () => {
    const result = getResult();
    if (!result || !finalMetrics) return;
    const generated = buildExperimentReport(
      {
        labId: 'file-management',
        labTitle: 'File Management',
        aim: `Simulate ${allocationMethod} file allocation with ${directoryStructure} directory structure.`,
        objectives: [
          'Compare Contiguous, Linked, and Indexed block allocation.',
          'Inspect Inodes, Open File Table, and Free Space Bitmap.',
        ],
        theorySummary:
          'File systems map hierarchical directory names to Inodes and manage disk blocks using Contiguous, Linked, or Indexed allocation.',
        algorithmName: `${allocationMethod} / ${directoryStructure}`,
        algorithmSteps: [
          'Validate directory path against active directory structure.',
          'Allocate or free disk blocks and update Free Space Bitmap.',
          'Maintain Inode linkCount and Open File Table entries.',
        ],
        inputs: { allocationMethod, directoryStructure, operations },
        conclusion: `Used ${finalMetrics.usedBlocks}/${finalMetrics.diskBlockCount} blocks across ${finalMetrics.fileCount} active file(s).`,
      },
      result as never
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'file-management',
      labTitle: 'File Management',
      algorithm: allocationMethod,
      timestamp: generated.generatedAt,
      summaryMetric: `Used: ${finalMetrics.usedBlocks}/${finalMetrics.diskBlockCount} blks`,
    });
  };

  return (
    <>
      <LabWorkspaceShell
        labNumber="LAB 08"
        title="File Management"
        subtitle="Contiguous, Linked & Indexed allocation, 4 directory structures, Inodes, and Free Space Bitmap."
        mode={snapshot.mode}
        onModeChange={setMode}
        onExportReport={finalMetrics ? handleExportReport : undefined}
        controlsPanel={
          <FileControlsPanel
            mode={snapshot.mode}
            allocationMethod={allocationMethod}
            directoryStructure={directoryStructure}
            operations={operations}
            errors={snapshot.errors}
            onAllocationChange={(m) => {
              setAllocationMethod(m);
              runCurrent(m, directoryStructure, operations);
            }}
            onDirectoryChange={(d) => {
              setDirectoryStructure(d);
              runCurrent(allocationMethod, d, operations);
            }}
            onOperationsChange={setOperations}
            onLoadPreset={handleLoadPreset}
            onRun={() => runCurrent()}
          />
        }
        visualizationStage={<FileVisualizer2D state={currentState} />}
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
          <FileMetricsPanel state={currentState} finalMetrics={finalMetrics} />
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
