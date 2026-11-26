export type CpuAlgorithm =
  | 'FCFS'
  | 'SJF'
  | 'SRTF'
  | 'PRIORITY_NP'
  | 'PRIORITY_P'
  | 'RR'
  | 'HRRN';

export type PriorityConvention = 'lower-is-higher' | 'higher-is-higher';

export interface ProcessInput {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
}

export interface CpuSchedulingInput {
  processes: ProcessInput[];
  algorithm: CpuAlgorithm;
  timeQuantum: number;
  priorityConvention: PriorityConvention;
}

export type CpuEventType =
  | 'ARRIVE'
  | 'DISPATCH'
  | 'PREEMPT'
  | 'QUANTUM_EXPIRE'
  | 'IDLE'
  | 'COMPLETE';

export interface CpuEvent {
  type: CpuEventType;
  pid?: string;
  detail: string;
}

export interface GanttSegment {
  pid: string | 'IDLE';
  start: number;
  end: number;
}

export interface ProcessResultRow {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  firstRunTime: number | null;
  completionTime: number | null;
  turnaroundTime: number | null;
  waitingTime: number | null;
  responseTime: number | null;
}

export interface CpuStepState {
  tick: number;
  runningPid: string | null;
  readyQueue: string[];
  notArrivedPids: string[];
  completedPids: string[];
  remainingByPid: Record<string, number>;
  ganttSegments: GanttSegment[];
  contextSwitches: number;
  idleTicks: number;
  processRows: ProcessResultRow[];
}

export interface CpuSchedulingMetrics {
  algorithm: CpuAlgorithm;
  totalTime: number;
  idleTicks: number;
  contextSwitches: number;
  cpuUtilization: number;
  throughput: number;
  avgTurnaroundTime: number;
  avgWaitingTime: number;
  avgResponseTime: number;
  processRows: ProcessResultRow[];
  ganttSegments: GanttSegment[];
  [key: string]: unknown;
}
