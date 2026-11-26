import { describe, expect, it } from 'vitest';
import {
  compareDiskAlgorithms,
  diskSchedulingEngine,
} from '../../src/engines/diskScheduling/diskSchedulingEngine';

const CLASSIC_QUEUE = [98, 183, 37, 122, 14, 124, 65, 67];

describe('diskSchedulingEngine', () => {
  it('validates cylinder bounds and request queue', () => {
    expect(
      diskSchedulingEngine.validate({
        cylinderCount: 200,
        initialHead: 250,
        direction: 'LEFT',
        requests: [10, 20],
        algorithm: 'FCFS',
      }).valid
    ).toBe(false);
  });

  it('matches textbook head movement for FCFS (640) and SSTF (236)', () => {
    const fcfs = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'RIGHT',
      requests: CLASSIC_QUEUE,
      algorithm: 'FCFS',
    });
    expect(fcfs.finalMetrics.totalHeadMovement).toBe(640);

    const sstf = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'LEFT',
      requests: CLASSIC_QUEUE,
      algorithm: 'SSTF',
    });
    expect(sstf.finalMetrics.totalHeadMovement).toBe(236);
  });

  it('distinguishes SCAN (236) vs LOOK (208) moving LEFT', () => {
    const scan = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'LEFT',
      requests: CLASSIC_QUEUE,
      algorithm: 'SCAN',
    });
    expect(scan.finalMetrics.totalHeadMovement).toBe(236);

    const look = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'LEFT',
      requests: CLASSIC_QUEUE,
      algorithm: 'LOOK',
    });
    expect(look.finalMetrics.totalHeadMovement).toBe(208);
  });

  it('distinguishes C-SCAN (382) vs C-LOOK (322) moving RIGHT', () => {
    const cscan = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'RIGHT',
      requests: CLASSIC_QUEUE,
      algorithm: 'C_SCAN',
    });
    expect(cscan.finalMetrics.totalHeadMovement).toBe(382);

    const clook = diskSchedulingEngine.run({
      cylinderCount: 200,
      initialHead: 53,
      direction: 'RIGHT',
      requests: CLASSIC_QUEUE,
      algorithm: 'C_LOOK',
    });
    expect(clook.finalMetrics.totalHeadMovement).toBe(322);

    expect(
      compareDiskAlgorithms(200, 53, 'RIGHT', CLASSIC_QUEUE)
    ).toHaveLength(6);
  });
});
