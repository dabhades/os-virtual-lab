import type { DiskAlgorithm, DiskDirection } from '../../engines/diskScheduling/types';

export interface DiskPreset {
  id: string;
  name: string;
  cylinderCount: number;
  initialHead: number;
  direction: DiskDirection;
  algorithm: DiskAlgorithm;
  requests: number[];
}

export const DISK_PRESETS: DiskPreset[] = [
  {
    id: 'silberschatz-200',
    name: 'Textbook Classic (Cylinders 0–199, Head 53)',
    cylinderCount: 200,
    initialHead: 53,
    direction: 'LEFT',
    algorithm: 'SCAN',
    requests: [98, 183, 37, 122, 14, 124, 65, 67],
  },
  {
    id: 'cscan-vs-clook',
    name: 'C-SCAN vs C-LOOK (Right Sweep, Head 53)',
    cylinderCount: 200,
    initialHead: 53,
    direction: 'RIGHT',
    algorithm: 'C_SCAN',
    requests: [98, 183, 37, 122, 14, 124, 65, 67],
  },
];
