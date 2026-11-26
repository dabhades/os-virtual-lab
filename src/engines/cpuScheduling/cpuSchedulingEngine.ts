import type {
  Explanation5Q,
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  CpuAlgorithm,
  CpuEvent,
  CpuSchedulingInput,
  CpuSchedulingMetrics,
  CpuStepState,
  GanttSegment,
  PriorityConvention,
  ProcessInput,
  ProcessResultRow,
} from './types';

interface InternalProcess extends ProcessInput {
  remaining: number;
  firstRunTime: number | null;
  completionTime: number | null;
}

function comparePriority(
  a: InternalProcess,
  b: InternalProcess,
  convention: PriorityConvention
): number {
  if (a.priority !== b.priority) {
    return convention === 'lower-is-higher'
      ? a.priority - b.priority
      : b.priority - a.priority;
  }
  if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
  return a.pid.localeCompare(b.pid);
}

function pickNextProcess(
  ready: InternalProcess[],
  algorithm: CpuAlgorithm,
  tick: number,
  convention: PriorityConvention
): { chosen: InternalProcess; ruleReason: string } {
  const sorted = [...ready];
  let ruleReason = '';

  switch (algorithm) {
    case 'FCFS':
      sorted.sort(
        (a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid)
      );
      ruleReason = 'FCFS selects the process that arrived earliest.';
      break;
    case 'SJF':
      sorted.sort(
        (a, b) =>
          a.burstTime - b.burstTime ||
          a.arrivalTime - b.arrivalTime ||
          a.pid.localeCompare(b.pid)
      );
      ruleReason = 'SJF selects the ready process with the smallest burst time.';
      break;
    case 'SRTF':
      sorted.sort(
        (a, b) =>
          a.remaining - b.remaining ||
          a.arrivalTime - b.arrivalTime ||
          a.pid.localeCompare(b.pid)
      );
      ruleReason =
        'SRTF selects the process with the smallest remaining burst time.';
      break;
    case 'PRIORITY_NP':
    case 'PRIORITY_P':
      sorted.sort((a, b) => comparePriority(a, b, convention));
      ruleReason = `Priority scheduling (${convention === 'lower-is-higher' ? 'lower number = higher priority' : 'higher number = higher priority'}) selects the highest-priority ready process.`;
      break;
    case 'RR':
      // FIFO ready queue order
      ruleReason =
        'Round Robin dispatches the process at the front of the FIFO ready queue.';
      break;
    case 'HRRN':
      sorted.sort((a, b) => {
        const rrA = (tick - a.arrivalTime + a.burstTime) / a.burstTime;
        const rrB = (tick - b.arrivalTime + b.burstTime) / b.burstTime;
        if (Math.abs(rrB - rrA) > 1e-9) return rrB - rrA;
        return a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid);
      });
      ruleReason =
        'HRRN selects the process with the highest Response Ratio R = (Waiting + Burst) / Burst.';
      break;
  }

  return { chosen: sorted[0], ruleReason };
}

function appendGantt(
  segments: GanttSegment[],
  pid: string | 'IDLE',
  tick: number
): void {
  const last = segments[segments.length - 1];
  if (last && last.pid === pid && last.end === tick) {
    last.end = tick + 1;
  } else {
    segments.push({ pid, start: tick, end: tick + 1 });
  }
}

function buildRows(procs: InternalProcess[]): ProcessResultRow[] {
  return procs.map((p) => {
    const ct = p.completionTime;
    const tat = ct !== null ? ct - p.arrivalTime : null;
    const wt = tat !== null ? tat - p.burstTime : null;
    const rt = p.firstRunTime !== null ? p.firstRunTime - p.arrivalTime : null;
    return {
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      firstRunTime: p.firstRunTime,
      completionTime: ct,
      turnaroundTime: tat,
      waitingTime: wt,
      responseTime: rt,
    };
  });
}

function snapshotState(
  tick: number,
  running: InternalProcess | null,
  readyQueue: InternalProcess[],
  procs: InternalProcess[],
  ganttSegments: GanttSegment[],
  contextSwitches: number,
  idleTicks: number
): CpuStepState {
  const remainingByPid: Record<string, number> = {};
  const notArrivedPids: string[] = [];
  const completedPids: string[] = [];

  for (const p of procs) {
    remainingByPid[p.pid] = p.remaining;
    if (p.completionTime !== null) {
      completedPids.push(p.pid);
    } else if (p.arrivalTime > tick) {
      notArrivedPids.push(p.pid);
    }
  }

  return {
    tick,
    runningPid: running ? running.pid : null,
    readyQueue: readyQueue.map((p) => p.pid),
    notArrivedPids,
    completedPids,
    remainingByPid,
    ganttSegments: ganttSegments.map((s) => ({ ...s })),
    contextSwitches,
    idleTicks,
    processRows: buildRows(procs),
  };
}

export const cpuSchedulingEngine: SimulationEngine<
  CpuSchedulingInput,
  CpuStepState,
  CpuEvent,
  CpuSchedulingMetrics
> = {
  validate(input: CpuSchedulingInput): ValidationResult {
    const errors: string[] = [];
    if (!input.processes || input.processes.length === 0) {
      errors.push('Add at least one process to run the simulation.');
    }
    if (input.processes.length > 12) {
      errors.push('Maximum 12 processes are supported for clear visualization.');
    }

    const seenPids = new Set<string>();
    for (const p of input.processes) {
      const pid = p.pid.trim();
      if (!pid) {
        errors.push('Every process must have a non-empty PID.');
      } else if (seenPids.has(pid)) {
        errors.push(`Duplicate PID "${pid}" found. PIDs must be unique.`);
      }
      seenPids.add(pid);

      if (!Number.isInteger(p.arrivalTime) || p.arrivalTime < 0) {
        errors.push(`${pid || 'Process'}: Arrival time must be an integer >= 0.`);
      }
      if (!Number.isInteger(p.burstTime) || p.burstTime < 1) {
        errors.push(`${pid || 'Process'}: Burst time must be an integer >= 1.`);
      }
      if (!Number.isInteger(p.priority) || p.priority < 0) {
        errors.push(`${pid || 'Process'}: Priority must be an integer >= 0.`);
      }
    }

    if (
      input.algorithm === 'RR' &&
      (!Number.isInteger(input.timeQuantum) || input.timeQuantum < 1)
    ) {
      errors.push('Round Robin requires an integer time quantum >= 1.');
    }

    return { valid: errors.length === 0, errors };
  },

  run(
    input: CpuSchedulingInput
  ): SimulationResult<CpuStepState, CpuEvent, CpuSchedulingMetrics> {
    const procs: InternalProcess[] = input.processes.map((p) => ({
      ...p,
      pid: p.pid.trim(),
      remaining: p.burstTime,
      firstRunTime: null,
      completionTime: null,
    }));

    const steps: SimulationStep<CpuStepState, CpuEvent>[] = [];
    const ganttSegments: GanttSegment[] = [];
    let readyQueue: InternalProcess[] = [];
    let running: InternalProcess | null = null;
    let quantumUsed = 0;
    let contextSwitches = 0;
    let idleTicks = 0;
    let tick = 0;

    const isPreemptive =
      input.algorithm === 'SRTF' || input.algorithm === 'PRIORITY_P';

    while (procs.some((p) => p.completionTime === null)) {
      const events: CpuEvent[] = [];
      let explanation: Explanation5Q | null = null;
      let checkpointPrompt:
        | SimulationStep<CpuStepState, CpuEvent>['checkpointPrompt']
        | undefined;

      // 1. Enqueue processes arriving at `tick` (before RR quantum expiry re-enqueue)
      const arrivals = procs
        .filter((p) => p.arrivalTime === tick)
        .sort((a, b) => a.pid.localeCompare(b.pid));
      for (const arr of arrivals) {
        readyQueue.push(arr);
        events.push({
          type: 'ARRIVE',
          pid: arr.pid,
          detail: `${arr.pid} arrived (BT=${arr.burstTime}, Prio=${arr.priority}).`,
        });
      }

      // 2. Check RR quantum expiry from previous tick
      if (
        running &&
        input.algorithm === 'RR' &&
        quantumUsed >= input.timeQuantum
      ) {
        events.push({
          type: 'QUANTUM_EXPIRE',
          pid: running.pid,
          detail: `${running.pid} exhausted time quantum (${input.timeQuantum}).`,
        });
        readyQueue.push(running);
        running = null;
        quantumUsed = 0;
      }

      // 3. Check preemption for SRTF / Priority Preemptive
      if (running && isPreemptive && readyQueue.length > 0) {
        const { chosen } = pickNextProcess(
          readyQueue,
          input.algorithm,
          tick,
          input.priorityConvention
        );
        const shouldPreempt =
          input.algorithm === 'SRTF'
            ? chosen.remaining < running.remaining
            : comparePriority(chosen, running, input.priorityConvention) < 0;

        if (shouldPreempt) {
          events.push({
            type: 'PREEMPT',
            pid: running.pid,
            detail: `${chosen.pid} preempted ${running.pid}.`,
          });
          readyQueue.push(running);
          running = null;
          contextSwitches += 1;
        }
      }

      // 4. Dispatch if CPU is free and readyQueue is non-empty
      if (!running && readyQueue.length > 0) {
        const candidatePids = readyQueue.map((p) => p.pid);
        const { chosen, ruleReason } = pickNextProcess(
          readyQueue,
          input.algorithm,
          tick,
          input.priorityConvention
        );
        readyQueue = readyQueue.filter((p) => p.pid !== chosen.pid);

        if (
          ganttSegments.length > 0 &&
          ganttSegments[ganttSegments.length - 1].pid !== 'IDLE' &&
          ganttSegments[ganttSegments.length - 1].pid !== chosen.pid &&
          !events.some((e) => e.type === 'PREEMPT')
        ) {
          contextSwitches += 1;
        }

        running = chosen;
        quantumUsed = 0;
        if (running.firstRunTime === null) {
          running.firstRunTime = tick;
        }
        events.push({
          type: 'DISPATCH',
          pid: running.pid,
          detail: `Dispatched ${running.pid} to CPU.`,
        });

        if (candidatePids.length > 1) {
          checkpointPrompt = {
            question: `At tick ${tick}, Ready Queue has [${candidatePids.join(', ')}]. Which process runs next under ${input.algorithm}?`,
            options: candidatePids,
            correctOption: running.pid,
            hint: ruleReason,
          };
        }

        explanation = {
          whatHappened: `CPU dispatched ${running.pid} at tick ${tick}.`,
          whyItHappened:
            arrivals.length > 0
              ? `${arrivals.map((a) => a.pid).join(', ')} arrived and entered the Ready Queue.`
              : `The CPU was free and selected from ${candidatePids.length} ready process(es).`,
          whichRule: ruleReason,
          whatNext: `${running.pid} executes 1 time unit (${running.remaining - 1} remaining after this tick).`,
          remember:
            input.algorithm === 'FCFS'
              ? 'FCFS is simple and starvation-free, but long jobs delay short ones (Convoy Effect).'
              : input.algorithm === 'RR'
                ? 'Round Robin ensures fair CPU sharing using a fixed time quantum.'
                : `${input.algorithm} optimizes scheduling order based on its selection criterion.`,
        };
      }

      // 5. Execute 1 tick
      if (running) {
        appendGantt(ganttSegments, running.pid, tick);
        running.remaining -= 1;
        quantumUsed += 1;

        if (!explanation) {
          explanation = {
            whatHappened: `${running.pid} continued executing during tick ${tick} → ${tick + 1}.`,
            whyItHappened: `${running.pid} still had ${running.remaining + 1} unit(s) of CPU burst left.`,
            whichRule: `${input.algorithm} continues the active CPU burst.`,
            whatNext:
              running.remaining === 0
                ? `${running.pid} will complete at tick ${tick + 1}.`
                : `${running.pid} has ${running.remaining} unit(s) remaining.`,
            remember: 'Response Time is measured from arrival to first CPU execution.',
          };
        }

        if (running.remaining === 0) {
          running.completionTime = tick + 1;
          events.push({
            type: 'COMPLETE',
            pid: running.pid,
            detail: `${running.pid} completed at tick ${tick + 1}.`,
          });
          explanation.whatNext = `${running.pid} finished all burst work at tick ${tick + 1} and moved to Completed.`;
          running = null;
          quantumUsed = 0;
        }
      } else {
        appendGantt(ganttSegments, 'IDLE', tick);
        idleTicks += 1;
        events.push({
          type: 'IDLE',
          detail: `CPU idle during tick ${tick} → ${tick + 1}.`,
        });
        explanation = {
          whatHappened: `CPU remained IDLE from tick ${tick} to ${tick + 1}.`,
          whyItHappened: 'No processes are currently in the Ready Queue.',
          whichRule: 'CPU waits until the next process arrives.',
          whatNext: 'Check upcoming arrival times.',
          remember: 'Idle ticks reduce overall CPU Utilization.',
        };
      }

      steps.push({
        stepIndex: steps.length,
        tick: tick + 1,
        state: snapshotState(
          tick + 1,
          running,
          readyQueue,
          procs,
          ganttSegments,
          contextSwitches,
          idleTicks
        ),
        events,
        explanation,
        checkpointPrompt,
      });

      tick += 1;
    }

    const finalRows = buildRows(procs);
    const n = finalRows.length;
    const totalTAT = finalRows.reduce((s, r) => s + (r.turnaroundTime ?? 0), 0);
    const totalWT = finalRows.reduce((s, r) => s + (r.waitingTime ?? 0), 0);
    const totalRT = finalRows.reduce((s, r) => s + (r.responseTime ?? 0), 0);
    const totalTime = tick;
    const cpuUtilization =
      totalTime > 0
        ? Number((((totalTime - idleTicks) / totalTime) * 100).toFixed(2))
        : 0;

    return {
      steps,
      finalMetrics: {
        algorithm: input.algorithm,
        totalTime,
        idleTicks,
        contextSwitches,
        cpuUtilization,
        throughput:
          totalTime > 0 ? Number((n / totalTime).toFixed(3)) : 0,
        avgTurnaroundTime: Number((totalTAT / n).toFixed(2)),
        avgWaitingTime: Number((totalWT / n).toFixed(2)),
        avgResponseTime: Number((totalRT / n).toFixed(2)),
        processRows: finalRows,
        ganttSegments,
      },
    };
  },
};

export const ALL_CPU_ALGORITHMS: CpuAlgorithm[] = [
  'FCFS',
  'SJF',
  'SRTF',
  'PRIORITY_NP',
  'PRIORITY_P',
  'RR',
  'HRRN',
];

export function compareCpuAlgorithms(
  processes: ProcessInput[],
  timeQuantum: number,
  priorityConvention: PriorityConvention
): CpuSchedulingMetrics[] {
  return ALL_CPU_ALGORITHMS.map(
    (algorithm) =>
      cpuSchedulingEngine.run({
        processes,
        algorithm,
        timeQuantum,
        priorityConvention,
      }).finalMetrics
  );
}
