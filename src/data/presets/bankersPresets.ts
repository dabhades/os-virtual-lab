import type { ResourceRequest } from '../../engines/bankers/types';

export interface BankersPreset {
  id: string;
  name: string;
  description: string;
  available: number[];
  maximum: number[][];
  allocation: number[][];
  resourceRequest: ResourceRequest | null;
}

export const BANKERS_PRESETS: BankersPreset[] = [
  {
    id: 'silberschatz-safe',
    name: 'Textbook Safe State (5 Processes, 3 Resources)',
    description: 'Classic Silberschatz example yielding Safe Sequence <P1, P3, P4, P0, P2>.',
    available: [3, 3, 2],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    maximum: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    resourceRequest: null,
  },
  {
    id: 'safe-request-p1',
    name: 'Safe Resource Request: P1 asks [1, 0, 2]',
    description: 'Request is <= Need and <= Available, and leaves system Safe.',
    available: [3, 3, 2],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    maximum: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    resourceRequest: { processIndex: 1, request: [1, 0, 2] },
  },
  {
    id: 'unsafe-request-p0',
    name: 'Unsafe Resource Request (Rollback): P0 asks [0, 2, 0]',
    description: 'Demonstrates tentative allocation followed by rollback because state becomes Unsafe.',
    available: [2, 3, 0],
    allocation: [
      [0, 1, 0],
      [3, 0, 2],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    maximum: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
    resourceRequest: { processIndex: 0, request: [0, 2, 0] },
  },
];
