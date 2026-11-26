export type PageAlgorithm =
  | 'FIFO'
  | 'LRU'
  | 'OPTIMAL'
  | 'LFU'
  | 'SECOND_CHANCE';

export interface PageReplacementInput {
  referenceString: number[];
  frameCount: number;
  algorithm: PageAlgorithm;
}

export interface PageHistoryColumn {
  refIndex: number;
  page: number;
  frames: (number | null)[];
  outcome: 'HIT' | 'FAULT';
  replacedPage: number | null;
  reason: string;
}

export interface PageEvent {
  type: 'HIT' | 'FAULT_LOAD' | 'FAULT_REPLACE';
  page: number;
  replacedPage?: number;
  detail: string;
}

export interface PageStepState {
  tick: number;
  currentPage: number;
  frames: (number | null)[];
  referenceBits: number[];
  frequencies: Record<number, number>;
  clockPointer: number;
  outcome: 'HIT' | 'FAULT';
  replacedPage: number | null;
  replacementReason: string;
  history: PageHistoryColumn[];
  hits: number;
  faults: number;
  hitRatio: number;
  faultRatio: number;
}

export interface PageReplacementMetrics {
  algorithm: PageAlgorithm;
  frameCount: number;
  totalReferences: number;
  hits: number;
  faults: number;
  hitRatio: number;
  faultRatio: number;
  [key: string]: unknown;
}
