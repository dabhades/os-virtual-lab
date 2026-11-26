import type { LabId } from '../types/learning';
import type { ExperimentReport } from '../types/report';
import type { SimulationResult } from '../types/simulation';

export interface ReportMetadataInput {
  labId: LabId;
  labTitle: string;
  aim: string;
  objectives: string[];
  theorySummary: string;
  algorithmName: string;
  algorithmSteps: string[];
  inputs: Record<string, unknown>;
  conclusion: string;
}

export function buildExperimentReport<TState, TEvent, TMetrics extends Record<string, unknown>>(
  meta: ReportMetadataInput,
  result: SimulationResult<TState, TEvent, TMetrics>
): ExperimentReport {
  const metrics: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(result.finalMetrics)) {
    if (typeof v === 'number' || typeof v === 'string') {
      metrics[k] = v;
    }
  }

  return {
    id: `rep-${meta.labId}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    labId: meta.labId,
    labTitle: meta.labTitle,
    aim: meta.aim,
    objectives: meta.objectives,
    theorySummary: meta.theorySummary,
    algorithmName: meta.algorithmName,
    algorithmSteps: meta.algorithmSteps,
    inputs: meta.inputs,
    executionTrace: result.steps.map((s) => ({
      stepIndex: s.stepIndex,
      tick: s.tick,
      whatHappened: s.explanation.whatHappened,
      whichRule: s.explanation.whichRule,
    })),
    metrics,
    conclusion: meta.conclusion,
  };
}

export function formatReportAsMarkdown(report: ExperimentReport): string {
  const lines: string[] = [
    `# ${report.labTitle} — Experiment Report`,
    '',
    `- **Generated:** ${report.generatedAt}`,
    `- **Algorithm:** ${report.algorithmName}`,
    '',
    '## 1. Aim',
    report.aim,
    '',
    '## 2. Learning Objectives',
    ...report.objectives.map((o) => `- ${o}`),
    '',
    '## 3. Theory',
    report.theorySummary,
    '',
    '## 4. Algorithm',
    ...report.algorithmSteps.map((step, i) => `${i + 1}. ${step}`),
    '',
    '## 5. Input Configuration',
    '```json',
    JSON.stringify(report.inputs, null, 2),
    '```',
    '',
    '## 6. Step-by-Step Execution Trace',
    '| Step | Tick | Event / Action | Rule Applied |',
    '| :--- | :--- | :--- | :--- |',
    ...report.executionTrace.map(
      (row) =>
        `| ${row.stepIndex} | ${row.tick} | ${row.whatHappened} | ${row.whichRule} |`
    ),
    '',
    '## 7. Output & Calculated Metrics',
    '| Metric | Value |',
    '| :--- | :--- |',
    ...Object.entries(report.metrics).map(([k, v]) => `| ${k} | ${v} |`),
    '',
    '## 8. Conclusion',
    report.conclusion,
  ];
  return lines.join('\n');
}
