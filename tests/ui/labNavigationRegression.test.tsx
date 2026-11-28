import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CpuVisualizer2D } from '../../src/features/labs/lab02-cpu/CpuVisualizer2D';
import { MemoryVisualizer2D } from '../../src/features/labs/lab05-memory/MemoryVisualizer2D';
import { useSimulationStore } from '../../src/core/useSimulationStore';
import { cpuSchedulingEngine } from '../../src/engines/cpuScheduling/cpuSchedulingEngine';
import { CPU_PRESETS } from '../../src/data/presets/cpuPresets';
import type { CpuStepState } from '../../src/engines/cpuScheduling/types';
import type { MemoryStepState } from '../../src/engines/memoryAllocation/types';

describe('Lab navigation state safety', () => {
  it('resets snapshot on dispose so switching labs never leaves stale step state', () => {
    const preset = CPU_PRESETS[0];
    useSimulationStore.getState().loadSimulation(cpuSchedulingEngine, {
      algorithm: preset.algorithm,
      timeQuantum: preset.timeQuantum,
      priorityConvention: 'lower-is-higher',
      processes: preset.processes,
    });

    expect(useSimulationStore.getState().snapshot.currentStep).not.toBeNull();

    useSimulationStore.getState().dispose();

    const afterDispose = useSimulationStore.getState().snapshot;
    expect(afterDispose.currentStep).toBeNull();
    expect(afterDispose.totalSteps).toBe(0);
    expect(afterDispose.finalMetrics).toBeNull();
  });

  it('does not crash if a visualizer receives mismatched state shape', () => {
    const mismatched = {} as unknown;
    expect(() =>
      render(<CpuVisualizer2D state={mismatched as CpuStepState} />)
    ).not.toThrow();
    expect(() =>
      render(<MemoryVisualizer2D state={mismatched as MemoryStepState} />)
    ).not.toThrow();
  });
});
