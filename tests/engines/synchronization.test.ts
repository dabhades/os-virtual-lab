import { describe, expect, it } from 'vitest';
import { synchronizationEngine } from '../../src/engines/synchronization/synchronizationEngine';
import type { SyncScenario } from '../../src/engines/synchronization/types';

const BASE = {
  bufferSize: 3,
  producerCount: 2,
  consumerCount: 2,
  semaphoreCount: 2,
  triggerDeadlock: false,
};

describe('synchronizationEngine', () => {
  it('demonstrates lost update in RACE_CONDITION and prevents it in MUTEX_LOCK', () => {
    const race = synchronizationEngine.run({
      ...BASE,
      scenario: 'RACE_CONDITION',
    });
    expect(race.finalMetrics.expectedCounter).toBe(2);
    expect(race.finalMetrics.finalCounter).toBe(1);
    expect(race.finalMetrics.lostUpdates).toBe(1);

    const mutex = synchronizationEngine.run({
      ...BASE,
      scenario: 'MUTEX_LOCK',
    });
    expect(mutex.finalMetrics.finalCounter).toBe(2);
    expect(mutex.finalMetrics.lostUpdates).toBe(0);
  });

  it('maintains bounded buffer invariants in PRODUCER_CONSUMER', () => {
    const pc = synchronizationEngine.run({
      ...BASE,
      scenario: 'PRODUCER_CONSUMER',
    });
    expect(pc.finalMetrics.deadlockDetected).toBe(false);
    expect(pc.steps.some((s) => s.events.some((e) => e.type === 'BLOCKED'))).toBe(true);
    expect(pc.steps.some((s) => s.events.some((e) => e.type === 'WAKEUP'))).toBe(true);
  });

  it('detects circular wait deadlock vs deadlock-free Dining Philosophers', () => {
    const dead = synchronizationEngine.run({
      ...BASE,
      scenario: 'DINING_PHILOSOPHERS',
      triggerDeadlock: true,
    });
    expect(dead.finalMetrics.deadlockDetected).toBe(true);

    const safe = synchronizationEngine.run({
      ...BASE,
      scenario: 'DINING_PHILOSOPHERS',
      triggerDeadlock: false,
    });
    expect(safe.finalMetrics.deadlockDetected).toBe(false);
  });

  it('runs all 8 scenarios without error', () => {
    const scenarios: SyncScenario[] = [
      'CRITICAL_SECTION',
      'RACE_CONDITION',
      'MUTEX_LOCK',
      'BINARY_SEMAPHORE',
      'COUNTING_SEMAPHORE',
      'PRODUCER_CONSUMER',
      'DINING_PHILOSOPHERS',
      'READERS_WRITERS',
    ];
    for (const scenario of scenarios) {
      const res = synchronizationEngine.run({ ...BASE, scenario });
      expect(res.steps.length).toBeGreaterThan(2);
    }
  });
});
