import { describe, expect, it } from 'vitest';
import {
  buildExperimentReport,
  formatReportAsMarkdown,
} from '../../src/core/reportGenerator';
import type { SimulationResult } from '../../src/types/simulation';

describe('reportGenerator', () => {
  it('builds and formats an experiment report strictly from actual simulation output', () => {
    const mockResult: SimulationResult<
      { tick: number },
      string,
      { avgWait: number; cpuUtil: string }
    > = {
      steps: [
        {
          stepIndex: 0,
          tick: 0,
          state: { tick: 0 },
          events: ['DISPATCH P1'],
          explanation: {
            whatHappened: 'P1 dispatched to CPU',
            whyItHappened: 'P1 arrived first',
            whichRule: 'FCFS',
            whatNext: 'P1 runs',
            remember: 'Non-preemptive',
          },
        },
      ],
      finalMetrics: {
        avgWait: 2.5,
        cpuUtil: '100%',
      },
    };

    const report = buildExperimentReport(
      {
        labId: 'cpu-scheduling',
        labTitle: 'CPU Scheduling',
        aim: 'Verify FCFS scheduling metrics.',
        objectives: ['Compute WT and TAT'],
        theorySummary: 'FCFS executes processes in arrival order.',
        algorithmName: 'FCFS',
        algorithmSteps: ['Sort by arrival time', 'Dispatch next process'],
        inputs: { processes: ['P1'] },
        conclusion: 'FCFS achieved 100% CPU utilization.',
      },
      mockResult
    );

    expect(report.executionTrace).toHaveLength(1);
    expect(report.metrics.avgWait).toBe(2.5);
    expect(report.metrics.cpuUtil).toBe('100%');

    const md = formatReportAsMarkdown(report);
    expect(md).toContain('# CPU Scheduling — Experiment Report');
    expect(md).toContain('P1 dispatched to CPU');
    expect(md).toContain('| avgWait | 2.5 |');
  });
});
