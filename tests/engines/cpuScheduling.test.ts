import { describe, expect, it } from 'vitest';
import {
  compareCpuAlgorithms,
  cpuSchedulingEngine,
} from '../../src/engines/cpuScheduling/cpuSchedulingEngine';

describe('cpuSchedulingEngine', () => {
  it('validates invalid process tables and RR quantum', () => {
    expect(
      cpuSchedulingEngine.validate({
        processes: [],
        algorithm: 'FCFS',
        timeQuantum: 2,
        priorityConvention: 'lower-is-higher',
      }).valid
    ).toBe(false);

    expect(
      cpuSchedulingEngine.validate({
        processes: [
          { pid: 'P1', arrivalTime: 0, burstTime: 3, priority: 1 },
          { pid: 'P1', arrivalTime: 1, burstTime: 2, priority: 2 },
        ],
        algorithm: 'RR',
        timeQuantum: 0,
        priorityConvention: 'lower-is-higher',
      }).errors.length
    ).toBeGreaterThanOrEqual(2);
  });

  it('computes textbook FCFS metrics accurately', () => {
    const res = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 24, priority: 1 },
        { pid: 'P2', arrivalTime: 0, burstTime: 3, priority: 2 },
        { pid: 'P3', arrivalTime: 0, burstTime: 3, priority: 3 },
      ],
      algorithm: 'FCFS',
      timeQuantum: 4,
      priorityConvention: 'lower-is-higher',
    });

    expect(res.finalMetrics.avgWaitingTime).toBe(17);
    expect(res.finalMetrics.avgTurnaroundTime).toBe(27);
    expect(res.finalMetrics.cpuUtilization).toBe(100);
  });

  it('computes textbook SJF non-preemptive metrics accurately', () => {
    const res = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 6, priority: 1 },
        { pid: 'P2', arrivalTime: 0, burstTime: 8, priority: 1 },
        { pid: 'P3', arrivalTime: 0, burstTime: 7, priority: 1 },
        { pid: 'P4', arrivalTime: 0, burstTime: 3, priority: 1 },
      ],
      algorithm: 'SJF',
      timeQuantum: 2,
      priorityConvention: 'lower-is-higher',
    });

    expect(res.finalMetrics.avgWaitingTime).toBe(7);
    expect(res.finalMetrics.ganttSegments.map((s) => s.pid)).toEqual([
      'P4',
      'P1',
      'P3',
      'P2',
    ]);
  });

  it('computes textbook SRTF preemptive metrics accurately', () => {
    const res = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 1 },
        { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
        { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 1 },
        { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 1 },
      ],
      algorithm: 'SRTF',
      timeQuantum: 2,
      priorityConvention: 'lower-is-higher',
    });

    expect(res.finalMetrics.avgWaitingTime).toBe(6.5);
    expect(res.finalMetrics.totalTime).toBe(26);
  });

  it('computes Round Robin (q=4) textbook example accurately', () => {
    const res = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 24, priority: 1 },
        { pid: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
        { pid: 'P3', arrivalTime: 0, burstTime: 3, priority: 1 },
      ],
      algorithm: 'RR',
      timeQuantum: 4,
      priorityConvention: 'lower-is-higher',
    });

    expect(res.finalMetrics.avgWaitingTime).toBe(5.67);
    expect(res.finalMetrics.ganttSegments[0]).toEqual({
      pid: 'P1',
      start: 0,
      end: 4,
    });
  });

  it('handles Priority Preemptive, HRRN, and CPU idle gaps', () => {
    const prio = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 0, burstTime: 4, priority: 3 },
        { pid: 'P2', arrivalTime: 1, burstTime: 2, priority: 1 },
      ],
      algorithm: 'PRIORITY_P',
      timeQuantum: 2,
      priorityConvention: 'lower-is-higher',
    });
    expect(prio.finalMetrics.ganttSegments).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 3 },
      { pid: 'P1', start: 3, end: 6 },
    ]);

    const hrrn = cpuSchedulingEngine.run({
      processes: [
        { pid: 'P1', arrivalTime: 2, burstTime: 3, priority: 1 },
        { pid: 'P2', arrivalTime: 3, burstTime: 6, priority: 1 },
        { pid: 'P3', arrivalTime: 4, burstTime: 2, priority: 1 },
      ],
      algorithm: 'HRRN',
      timeQuantum: 2,
      priorityConvention: 'lower-is-higher',
    });
    expect(hrrn.finalMetrics.idleTicks).toBe(2);
    expect(hrrn.finalMetrics.ganttSegments[0]).toEqual({
      pid: 'IDLE',
      start: 0,
      end: 2,
    });
    expect(hrrn.finalMetrics.ganttSegments[1]).toEqual({
      pid: 'P1',
      start: 2,
      end: 5,
    });
  });

  it('compares all 7 algorithms on the same dataset', () => {
    const comparison = compareCpuAlgorithms(
      [
        { pid: 'P1', arrivalTime: 0, burstTime: 5, priority: 2 },
        { pid: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
        { pid: 'P3', arrivalTime: 2, burstTime: 4, priority: 3 },
      ],
      2,
      'lower-is-higher'
    );
    expect(comparison).toHaveLength(7);
  });
});
