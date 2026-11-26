export type FitStrategy = 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT' | 'NEXT_FIT';

export type PartitionMode = 'VARIABLE' | 'FIXED';

export type MemoryOpType = 'ALLOCATE' | 'DEALLOCATE' | 'COMPACT';

export interface MemoryOperation {
  id: string;
  type: MemoryOpType;
  pid?: string;
  size?: number;
}

export interface MemoryAllocationInput {
  totalMemory: number;
  partitionMode: PartitionMode;
  fitStrategy: FitStrategy;
  fixedPartitions: number[];
  operations: MemoryOperation[];
}

export interface MemoryBlock {
  id: string;
  startAddr: number;
  size: number;
  status: 'FREE' | 'ALLOCATED';
  pid?: string;
  requestedSize?: number;
}

export interface MemoryEvent {
  type: 'ALLOCATE_OK' | 'ALLOCATE_FAIL' | 'DEALLOCATE' | 'COMPACT';
  pid?: string;
  detail: string;
}

export interface MemoryStepState {
  tick: number;
  blocks: MemoryBlock[];
  nextFitCursorAddr: number;
  allocatedMemory: number;
  freeMemory: number;
  internalFragmentation: number;
  externalFragmentation: number;
  largestFreeBlock: number;
  utilizationPercent: number;
  allocationSuccessCount: number;
  allocationFailCount: number;
  lastOperationLabel: string;
}

export interface MemoryAllocationMetrics {
  partitionMode: PartitionMode;
  fitStrategy: FitStrategy;
  totalMemory: number;
  allocatedMemory: number;
  freeMemory: number;
  internalFragmentation: number;
  externalFragmentation: number;
  largestFreeBlock: number;
  utilizationPercent: number;
  allocationSuccessCount: number;
  allocationFailCount: number;
  [key: string]: unknown;
}
