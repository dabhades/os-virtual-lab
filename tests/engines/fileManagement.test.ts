import { describe, expect, it } from 'vitest';
import { fileManagementEngine } from '../../src/engines/fileManagement/fileManagementEngine';

describe('fileManagementEngine', () => {
  it('detects external fragmentation in Contiguous allocation', () => {
    const res = fileManagementEngine.run({
      diskBlockCount: 20,
      allocationMethod: 'CONTIGUOUS',
      directoryStructure: 'SINGLE_LEVEL',
      operations: [
        { id: '1', type: 'CREATE', path: '/a.txt', blocks: 6 },
        { id: '2', type: 'CREATE', path: '/b.txt', blocks: 6 },
        { id: '3', type: 'CREATE', path: '/c.txt', blocks: 6 },
        { id: '4', type: 'DELETE', path: '/b.txt' },
        { id: '5', type: 'CREATE', path: '/big.txt', blocks: 8 },
      ],
    });
    expect(res.finalMetrics.failedOps).toBe(1);
    expect(res.finalMetrics.freeBlocks).toBe(8);
  });

  it('allocates index block + data blocks in Indexed allocation', () => {
    const res = fileManagementEngine.run({
      diskBlockCount: 16,
      allocationMethod: 'INDEXED',
      directoryStructure: 'TREE',
      operations: [
        { id: '1', type: 'CREATE', path: '/docs/report.pdf', blocks: 3 },
      ],
    });
    expect(res.finalMetrics.indexOverheadBlocks).toBe(1);
    expect(res.finalMetrics.usedBlocks).toBe(4);
  });

  it('preserves shared file blocks in Acyclic Graph until linkCount reaches 0', () => {
    const res = fileManagementEngine.run({
      diskBlockCount: 16,
      allocationMethod: 'LINKED',
      directoryStructure: 'ACYCLIC_GRAPH',
      operations: [
        { id: '1', type: 'CREATE', path: '/alice/shared.txt', blocks: 3 },
        { id: '2', type: 'SHARE_LINK', path: '/alice/shared.txt', targetPath: '/bob/shared.txt' },
        { id: '3', type: 'DELETE', path: '/alice/shared.txt' },
      ],
    });
    expect(res.finalMetrics.fileCount).toBe(1);
    expect(res.finalMetrics.usedBlocks).toBe(3);
  });
});
