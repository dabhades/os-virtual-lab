import { describe, expect, it } from 'vitest';
import { memoryAllocationEngine } from '../../src/engines/memoryAllocation/memoryAllocationEngine';

describe('memoryAllocationEngine', () => {
  it('validates total memory and fixed partition sums', () => {
    expect(
      memoryAllocationEngine.validate({
        totalMemory: 100,
        partitionMode: 'FIXED',
        fitStrategy: 'FIRST_FIT',
        fixedPartitions: [60, 60],
        operations: [{ id: '1', type: 'ALLOCATE', pid: 'P1', size: 20 }],
      }).valid
    ).toBe(false);
  });

  it('distinguishes First Fit, Best Fit, Worst Fit, and Next Fit', () => {
    const baseOps = [
      { id: '1', type: 'ALLOCATE' as const, pid: 'P1', size: 100 },
      { id: '2', type: 'ALLOCATE' as const, pid: 'P2', size: 200 },
      { id: '3', type: 'ALLOCATE' as const, pid: 'P3', size: 150 },
      { id: '4', type: 'DEALLOCATE' as const, pid: 'P1' }, // 100 KB hole at 0
      { id: '5', type: 'DEALLOCATE' as const, pid: 'P3' }, // 150 KB hole at 300 (+50 free at 450 coalesced -> 200 KB)
      { id: '6', type: 'ALLOCATE' as const, pid: 'P4', size: 80 },
    ];

    const first = memoryAllocationEngine.run({
      totalMemory: 500,
      partitionMode: 'VARIABLE',
      fitStrategy: 'FIRST_FIT',
      fixedPartitions: [],
      operations: baseOps,
    });
    const p4First = first.steps.at(-1)!.state.blocks.find((b) => b.pid === 'P4');
    expect(p4First?.startAddr).toBe(0);

    const worst = memoryAllocationEngine.run({
      totalMemory: 500,
      partitionMode: 'VARIABLE',
      fitStrategy: 'WORST_FIT',
      fixedPartitions: [],
      operations: baseOps,
    });
    const p4Worst = worst.steps.at(-1)!.state.blocks.find((b) => b.pid === 'P4');
    expect(p4Worst?.startAddr).toBe(300);

    const next = memoryAllocationEngine.run({
      totalMemory: 500,
      partitionMode: 'VARIABLE',
      fitStrategy: 'NEXT_FIT',
      fixedPartitions: [],
      operations: [
        { id: '1', type: 'ALLOCATE', pid: 'P1', size: 100 },
        { id: '2', type: 'ALLOCATE', pid: 'P2', size: 200 },
        { id: '3', type: 'DEALLOCATE', pid: 'P1' }, // 100 KB hole at 0
        { id: '4', type: 'ALLOCATE', pid: 'P3', size: 80 }, // Next Fit picks 300 (cursor=300), not 0
      ],
    });
    const p3Next = next.steps.at(-1)!.state.blocks.find((b) => b.pid === 'P3');
    expect(p3Next?.startAddr).toBe(300);
  });

  it('tracks internal fragmentation in Fixed Partitioning', () => {
    const res = memoryAllocationEngine.run({
      totalMemory: 300,
      partitionMode: 'FIXED',
      fitStrategy: 'BEST_FIT',
      fixedPartitions: [100, 200],
      operations: [{ id: '1', type: 'ALLOCATE', pid: 'P1', size: 65 }],
    });
    expect(res.finalMetrics.internalFragmentation).toBe(35);
  });

  it('resolves external fragmentation via Compaction', () => {
    const res = memoryAllocationEngine.run({
      totalMemory: 512,
      partitionMode: 'VARIABLE',
      fitStrategy: 'FIRST_FIT',
      fixedPartitions: [],
      operations: [
        { id: '1', type: 'ALLOCATE', pid: 'P1', size: 120 },
        { id: '2', type: 'ALLOCATE', pid: 'P2', size: 140 },
        { id: '3', type: 'ALLOCATE', pid: 'P3', size: 100 },
        { id: '4', type: 'DEALLOCATE', pid: 'P2' },
        { id: '5', type: 'ALLOCATE', pid: 'P4', size: 220 }, // fails
        { id: '6', type: 'COMPACT' },
        { id: '7', type: 'ALLOCATE', pid: 'P4', size: 220 }, // succeeds
      ],
    });
    expect(res.finalMetrics.allocationFailCount).toBe(1);
    expect(res.finalMetrics.allocationSuccessCount).toBe(4);
  });
});
