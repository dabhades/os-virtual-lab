import type { CpuAlgorithm, ProcessInput } from '../../engines/cpuScheduling/types';

export interface CpuPreset {
  id: string;
  name: string;
  description: string;
  algorithm: CpuAlgorithm;
  timeQuantum: number;
  processes: ProcessInput[];
}

export const CPU_PRESETS: CpuPreset[] = [
  {
    id: 'textbook-basic',
    name: 'Textbook Standard (4 Processes)',
    description: 'Balanced arrivals and bursts—great for comparing all 7 algorithms.',
    algorithm: 'SRTF',
    timeQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 2 },
      { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
      { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 3 },
      { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 2 },
    ],
  },
  {
    id: 'convoy-effect',
    name: 'FCFS Convoy Effect Demo',
    description: 'One long process arrives first and delays short jobs in FCFS.',
    algorithm: 'FCFS',
    timeQuantum: 3,
    processes: [
      { pid: 'P1', arrivalTime: 0, burstTime: 24, priority: 3 },
      { pid: 'P2', arrivalTime: 0, burstTime: 3, priority: 1 },
      { pid: 'P3', arrivalTime: 0, burstTime: 3, priority: 2 },
    ],
  },
  {
    id: 'idle-cpu',
    name: 'Idle CPU & Staggered Arrivals',
    description: 'Demonstrates idle CPU ticks before first arrival and between bursts.',
    algorithm: 'HRRN',
    timeQuantum: 2,
    processes: [
      { pid: 'P1', arrivalTime: 2, burstTime: 3, priority: 1 },
      { pid: 'P2', arrivalTime: 7, burstTime: 4, priority: 2 },
      { pid: 'P3', arrivalTime: 8, burstTime: 2, priority: 1 },
    ],
  },
];
