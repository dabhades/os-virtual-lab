export interface ResourceRequest {
  processIndex: number;
  request: number[];
}

export interface BankersInput {
  available: number[];
  maximum: number[][];
  allocation: number[][];
  resourceRequest: ResourceRequest | null;
}

export interface BankersEvent {
  type:
    | 'INIT'
    | 'REQUEST_CHECK'
    | 'REQUEST_TENTATIVE'
    | 'REQUEST_GRANTED'
    | 'REQUEST_DENIED_ROLLBACK'
    | 'PROCESS_FINISH'
    | 'SAFE_STATE'
    | 'UNSAFE_STATE';
  processIndex?: number;
  detail: string;
}

export interface BankersStepState {
  tick: number;
  resourceNames: string[];
  available: number[];
  work: number[];
  maximum: number[][];
  allocation: number[][];
  need: number[][];
  finish: boolean[];
  safeSequence: string[];
  activeProcessIndex: number | null;
  systemStatus: 'CHECKING' | 'SAFE' | 'UNSAFE' | 'REQUEST_REJECTED';
}

export interface BankersMetrics {
  processCount: number;
  resourceCount: number;
  isSafe: boolean;
  requestGranted: boolean | null;
  safeSequence: string[];
  finalWork: number[];
  systemStatus: 'SAFE' | 'UNSAFE' | 'REQUEST_REJECTED';
  [key: string]: unknown;
}
