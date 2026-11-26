import type { LabId } from './learning';

export interface ExperimentReportStep {
  stepIndex: number;
  tick: number;
  whatHappened: string;
  whichRule: string;
}

export interface ExperimentReport {
  id: string;
  generatedAt: string;
  labId: LabId;
  labTitle: string;
  aim: string;
  objectives: string[];
  theorySummary: string;
  algorithmName: string;
  algorithmSteps: string[];
  inputs: Record<string, unknown>;
  executionTrace: ExperimentReportStep[];
  metrics: Record<string, string | number>;
  conclusion: string;
}
