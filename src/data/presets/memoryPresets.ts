import type {
  FitStrategy,
  MemoryOperation,
  PartitionMode,
} from '../../engines/memoryAllocation/types';

export interface MemoryPreset {
  id: string;
  name: string;
  totalMemory: number;
  partitionMode: PartitionMode;
  fitStrategy: FitStrategy;
  fixedPartitions: number[];
  operations: MemoryOperation[];
}

export const MEMORY_PRESETS: MemoryPreset[] = [
  {
    id: 'variable-compaction',
    name: 'External Fragmentation & Compaction',
    totalMemory: 512,
    partitionMode: 'VARIABLE',
    fitStrategy: 'FIRST_FIT',
    fixedPartitions: [128, 128, 128, 128],
    operations: [
      { id: '1', type: 'ALLOCATE', pid: 'P1', size: 120 },
      { id: '2', type: 'ALLOCATE', pid: 'P2', size: 140 },
      { id: '3', type: 'ALLOCATE', pid: 'P3', size: 100 },
      { id: '4', type: 'DEALLOCATE', pid: 'P2' },
      { id: '5', type: 'ALLOCATE', pid: 'P4', size: 220 },
      { id: '6', type: 'COMPACT' },
      { id: '7', type: 'ALLOCATE', pid: 'P4', size: 220 },
    ],
  },
  {
    id: 'fixed-internal-frag',
    name: 'Fixed Partitioning (Internal Waste)',
    totalMemory: 500,
    partitionMode: 'FIXED',
    fitStrategy: 'BEST_FIT',
    fixedPartitions: [100, 150, 250],
    operations: [
      { id: '1', type: 'ALLOCATE', pid: 'P1', size: 70 },
      { id: '2', type: 'ALLOCATE', pid: 'P2', size: 120 },
      { id: '3', type: 'ALLOCATE', pid: 'P3', size: 200 },
    ],
  },
];
