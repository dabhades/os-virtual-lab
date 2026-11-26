export type DiskAlgorithm =
  | 'FCFS'
  | 'SSTF'
  | 'SCAN'
  | 'C_SCAN'
  | 'LOOK'
  | 'C_LOOK';

export type DiskDirection = 'LEFT' | 'RIGHT';

export interface DiskSchedulingInput {
  cylinderCount: number;
  initialHead: number;
  direction: DiskDirection;
  requests: number[];
  algorithm: DiskAlgorithm;
}

export interface DiskHop {
  cylinder: number;
  hopDistance: number;
  isRequestServed: boolean;
  isReturnJump: boolean;
}

export interface DiskEvent {
  type: 'SEEK' | 'SERVE' | 'BOUNDARY_REVERSE' | 'CIRCULAR_JUMP';
  cylinder: number;
  detail: string;
}

export interface DiskStepState {
  tick: number;
  cylinderCount: number;
  headPosition: number;
  visitedPath: DiskHop[];
  serviceOrder: number[];
  pendingRequests: number[];
  lastSeekDistance: number;
  totalHeadMovement: number;
  movementWithoutReturnJump: number;
  averageSeekMovement: number;
}

export interface DiskSchedulingMetrics {
  algorithm: DiskAlgorithm;
  cylinderCount: number;
  initialHead: number;
  direction: DiskDirection;
  requestCount: number;
  serviceOrder: number[];
  totalHeadMovement: number;
  movementWithoutReturnJump: number;
  averageSeekMovement: number;
  [key: string]: unknown;
}
