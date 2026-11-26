import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  DEFAULT_PROGRESS,
  LocalRepository,
} from '../../src/core/storage/LocalRepository';

describe('LocalRepository', () => {
  it('returns defaults when storage is empty and persists updates', () => {
    const repo = new LocalRepository();

    expect(repo.getPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(repo.getProgress()).toEqual(DEFAULT_PROGRESS);

    repo.savePreferences({
      ...DEFAULT_PREFERENCES,
      prefer2DOnly: true,
      reducedMotion: true,
    });
    expect(repo.getPreferences().prefer2DOnly).toBe(true);
    expect(repo.getPreferences().reducedMotion).toBe(true);

    repo.saveProgress({
      ...DEFAULT_PROGRESS,
      completedLessons: ['what-is-an-os'],
      lastVisitedRoute: '/labs/cpu-scheduling',
      lastVisitedLabel: 'LAB 02: CPU Scheduling',
    });
    expect(repo.getProgress().completedLessons).toEqual(['what-is-an-os']);
    expect(repo.getProgress().lastVisitedRoute).toBe('/labs/cpu-scheduling');
  });

  it('saves, lists, fetches, and clears experiment runs using localStorage fallback', async () => {
    const repo = new LocalRepository();
    await repo.clearHistory();

    await repo.saveExperimentRun({
      id: 'run-1',
      labId: 'cpu-scheduling',
      labTitle: 'CPU Scheduling',
      algorithm: 'FCFS',
      timestamp: '2026-11-25T10:00:00.000Z',
      summaryMetric: 'Avg WT: 4.50',
    });

    const list = await repo.listRecentExperiments();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('run-1');

    const fetched = await repo.getExperimentRun('run-1');
    expect(fetched?.algorithm).toBe('FCFS');

    await repo.clearHistory();
    expect(await repo.listRecentExperiments()).toHaveLength(0);
  });
});
