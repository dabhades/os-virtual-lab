import { describe, expect, it } from 'vitest';
import { bankersEngine } from '../../src/engines/bankers/bankersEngine';

const CLASSIC_ALLOC = [
  [0, 1, 0],
  [2, 0, 0],
  [3, 0, 2],
  [2, 1, 1],
  [0, 0, 2],
];

const CLASSIC_MAX = [
  [7, 5, 3],
  [3, 2, 2],
  [9, 0, 2],
  [2, 2, 2],
  [4, 3, 3],
];

describe('bankersEngine', () => {
  it('rejects Allocation > Maximum in validation', () => {
    const val = bankersEngine.validate({
      available: [1, 1],
      allocation: [[3, 0]],
      maximum: [[2, 1]],
      resourceRequest: null,
    });
    expect(val.valid).toBe(false);
  });

  it('finds textbook Safe Sequence <P1, P3, P4, P0, P2>', () => {
    const res = bankersEngine.run({
      available: [3, 3, 2],
      allocation: CLASSIC_ALLOC,
      maximum: CLASSIC_MAX,
      resourceRequest: null,
    });

    expect(res.finalMetrics.isSafe).toBe(true);
    expect(res.finalMetrics.safeSequence).toEqual([
      'P1',
      'P3',
      'P4',
      'P0',
      'P2',
    ]);
    expect(res.finalMetrics.finalWork).toEqual([10, 5, 7]);
  });

  it('grants valid safe resource request P1 [1, 0, 2]', () => {
    const res = bankersEngine.run({
      available: [3, 3, 2],
      allocation: CLASSIC_ALLOC,
      maximum: CLASSIC_MAX,
      resourceRequest: { processIndex: 1, request: [1, 0, 2] },
    });

    expect(res.finalMetrics.isSafe).toBe(true);
    expect(res.finalMetrics.requestGranted).toBe(true);
    expect(res.finalMetrics.safeSequence).toEqual([
      'P1',
      'P3',
      'P4',
      'P0',
      'P2',
    ]);
  });

  it('rejects and rolls back unsafe resource requests', () => {
    const res = bankersEngine.run({
      available: [1, 0, 0],
      allocation: [
        [0, 1, 0],
        [2, 0, 0],
      ],
      maximum: [
        [2, 2, 1],
        [3, 1, 1],
      ],
      resourceRequest: { processIndex: 0, request: [1, 0, 0] },
    });

    expect(res.finalMetrics.isSafe).toBe(false);
    expect(res.finalMetrics.requestGranted).toBe(false);
    expect(res.steps.at(-1)?.state.available).toEqual([1, 0, 0]);
  });
});
