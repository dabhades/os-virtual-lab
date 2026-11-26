export type SyncScenario =
  | 'CRITICAL_SECTION'
  | 'RACE_CONDITION'
  | 'MUTEX_LOCK'
  | 'BINARY_SEMAPHORE'
  | 'COUNTING_SEMAPHORE'
  | 'PRODUCER_CONSUMER'
  | 'DINING_PHILOSOPHERS'
  | 'READERS_WRITERS';

export interface SyncInput {
  scenario: SyncScenario;
  bufferSize: number; // Producer-Consumer
  producerCount: number;
  consumerCount: number;
  semaphoreCount: number; // Counting Semaphore
  triggerDeadlock: boolean; // Dining Philosophers
}

export type SyncProcessState = 'READY' | 'RUNNING' | 'BLOCKED' | 'IN_CS' | 'DONE';

export interface SyncProcessSnapshot {
  id: string;
  role: string;
  state: SyncProcessState;
  lastAction: string;
  blockedOn: string | null;
}

export interface SemaphoreSnapshot {
  name: string;
  kind: 'MUTEX' | 'BINARY' | 'COUNTING';
  value: number;
  blockedQueue: string[];
}

export interface SyncEvent {
  type: 'WAIT' | 'SIGNAL' | 'BLOCKED' | 'WAKEUP' | 'CS_ENTER' | 'CS_EXIT' | 'RACE_LOSS' | 'DEADLOCK';
  pid?: string;
  detail: string;
}

export interface SyncStepState {
  tick: number;
  scenario: SyncScenario;
  processes: SyncProcessSnapshot[];
  semaphores: SemaphoreSnapshot[];
  sharedCounter: number;
  expectedCounter: number;
  csOccupants: string[];
  csViolations: number;
  lostUpdates: number;
  buffer: (string | null)[];
  forks: (string | null)[];
  activeReaders: number;
  activeWriter: string | null;
  deadlockDetected: boolean;
}

export interface SyncMetrics {
  scenario: SyncScenario;
  totalSteps: number;
  csViolations: number;
  lostUpdates: number;
  deadlockDetected: boolean;
  finalCounter: number;
  expectedCounter: number;
  [key: string]: unknown;
}
