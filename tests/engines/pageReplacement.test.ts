import { describe, expect, it } from 'vitest';
import {
  comparePageAlgorithms,
  pageReplacementEngine,
} from '../../src/engines/pageReplacement/pageReplacementEngine';

const CLASSIC_REF = [
  7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1,
];

describe('pageReplacementEngine', () => {
  it('validates frameCount and referenceString', () => {
    expect(
      pageReplacementEngine.validate({
        referenceString: [],
        frameCount: 3,
        algorithm: 'FIFO',
      }).valid
    ).toBe(false);

    expect(
      pageReplacementEngine.validate({
        referenceString: [1, 2, 3],
        frameCount: 0,
        algorithm: 'LRU',
      }).valid
    ).toBe(false);
  });

  it('matches textbook fault counts for FIFO (15), LRU (12), and Optimal (9)', () => {
    const fifo = pageReplacementEngine.run({
      referenceString: CLASSIC_REF,
      frameCount: 3,
      algorithm: 'FIFO',
    });
    const lru = pageReplacementEngine.run({
      referenceString: CLASSIC_REF,
      frameCount: 3,
      algorithm: 'LRU',
    });
    const opt = pageReplacementEngine.run({
      referenceString: CLASSIC_REF,
      frameCount: 3,
      algorithm: 'OPTIMAL',
    });

    expect(fifo.finalMetrics.faults).toBe(15);
    expect(lru.finalMetrics.faults).toBe(12);
    expect(opt.finalMetrics.faults).toBe(9);
  });

  it("reproduces Belady's Anomaly in FIFO (3 frames = 9 faults < 4 frames = 10 faults)", () => {
    const beladyRef = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
    const f3 = pageReplacementEngine.run({
      referenceString: beladyRef,
      frameCount: 3,
      algorithm: 'FIFO',
    });
    const f4 = pageReplacementEngine.run({
      referenceString: beladyRef,
      frameCount: 4,
      algorithm: 'FIFO',
    });

    expect(f3.finalMetrics.faults).toBe(9);
    expect(f4.finalMetrics.faults).toBe(10);
  });

  it('handles LFU tie-breaking via FIFO and Second Chance R-bit sweeps', () => {
    const lfu = pageReplacementEngine.run({
      referenceString: [1, 2, 3, 1, 4],
      frameCount: 3,
      algorithm: 'LFU',
    });
    // At ref 4: Page 1 has freq=2; Pages 2 and 3 have freq=1; Page 2 was loaded earlier (FIFO tie-break)
    expect(lfu.steps.at(-1)?.state.replacedPage).toBe(2);

    const clock = pageReplacementEngine.run({
      referenceString: [1, 2, 3, 1, 4],
      frameCount: 3,
      algorithm: 'SECOND_CHANCE',
    });
    expect(clock.finalMetrics.faults).toBe(4);
    expect(comparePageAlgorithms([1, 2, 3, 1, 4], 3)).toHaveLength(5);
  });
});
