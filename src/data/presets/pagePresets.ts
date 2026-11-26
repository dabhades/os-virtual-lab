import type { PageAlgorithm } from '../../engines/pageReplacement/types';

export interface PagePreset {
  id: string;
  name: string;
  description: string;
  algorithm: PageAlgorithm;
  frameCount: number;
  referenceString: number[];
}

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: 'silberschatz-classic',
    name: 'Textbook Classic (20 References)',
    description: 'Standard Silberschatz string: 3 frames -> FIFO 15, LRU 12, Optimal 9 faults.',
    algorithm: 'LRU',
    frameCount: 3,
    referenceString: [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1],
  },
  {
    id: 'belady-anomaly',
    name: "Belady's Anomaly (FIFO 3 vs 4 Frames)",
    description: 'In FIFO, 3 frames gives 9 faults while 4 frames increases to 10 faults!',
    algorithm: 'FIFO',
    frameCount: 4,
    referenceString: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  },
  {
    id: 'second-chance-clock',
    name: 'Second Chance (Clock) Demo',
    description: 'Observe reference bits (R=1 -> R=0) giving frequently touched pages a second chance.',
    algorithm: 'SECOND_CHANCE',
    frameCount: 3,
    referenceString: [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2],
  },
];
