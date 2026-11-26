import { describe, expect, it } from 'vitest';
import { SimulationController } from '../../src/core/SimulationController';
import type { SimulationEngine } from '../../src/types/simulation';

interface MockInput {
  count: number;
}
interface MockState {
  value: number;
}
interface MockMetrics {
  finalValue: number;
}

const mockEngine: SimulationEngine<MockInput, MockState, string, MockMetrics> = {
  validate(input) {
    if (input.count < 1) {
      return { valid: false, errors: ['count must be >= 1'] };
    }
    return { valid: true, errors: [] };
  },
  run(input) {
    const steps = Array.from({ length: input.count }, (_, idx) => ({
      stepIndex: idx,
      tick: idx * 2,
      state: { value: idx + 1 },
      events: [`STEP_${idx}`],
      explanation: {
        whatHappened: `Executed step ${idx}`,
        whyItHappened: 'Deterministic mock step',
        whichRule: 'Sequential rule',
        whatNext: idx < input.count - 1 ? `Step ${idx + 1}` : 'Done',
        remember: 'Steps are deterministic',
      },
      ...(idx === 1
        ? {
            checkpointPrompt: {
              question: 'What is the next value?',
              options: ['2', '3'],
              correctOption: '3',
              hint: 'Increment by 1',
            },
          }
        : {}),
    }));
    return {
      steps,
      finalMetrics: { finalValue: input.count },
    };
  },
};

describe('SimulationController', () => {
  it('rejects invalid inputs with validation errors', () => {
    const ctrl = new SimulationController<MockInput, MockState, string, MockMetrics>();
    const snap = ctrl.load(mockEngine, { count: 0 });
    expect(snap.errors).toEqual(['count must be >= 1']);
    expect(snap.totalSteps).toBe(0);
    expect(snap.currentStep).toBeNull();
  });

  it('supports deterministic stepForward, stepBackward, seek, and reset', () => {
    const ctrl = new SimulationController<MockInput, MockState, string, MockMetrics>();
    ctrl.load(mockEngine, { count: 4 });

    expect(ctrl.getSnapshot().currentStep?.state.value).toBe(1);

    ctrl.stepForward();
    expect(ctrl.getSnapshot().currentStepIndex).toBe(1);
    expect(ctrl.getSnapshot().currentStep?.state.value).toBe(2);

    ctrl.stepForward();
    expect(ctrl.getSnapshot().currentStepIndex).toBe(2);

    // Step backward restores exact previous state
    ctrl.stepBackward();
    expect(ctrl.getSnapshot().currentStepIndex).toBe(1);
    expect(ctrl.getSnapshot().currentStep?.state.value).toBe(2);

    // Seek & reset
    ctrl.seekToStep(3);
    expect(ctrl.getSnapshot().status).toBe('completed');
    expect(ctrl.getSnapshot().currentStep?.state.value).toBe(4);

    ctrl.reset();
    expect(ctrl.getSnapshot().currentStepIndex).toBe(0);
    expect(ctrl.getSnapshot().currentStep?.state.value).toBe(1);
    expect(ctrl.getSnapshot().finalMetrics?.finalValue).toBe(4);
  });

  it('pauses at Practice Mode checkpoints until answered or revealed', () => {
    const ctrl = new SimulationController<MockInput, MockState, string, MockMetrics>();
    ctrl.setMode('practice');
    ctrl.load(mockEngine, { count: 4 });

    // Move to step 1 which has checkpointPrompt
    const atCheckpoint = ctrl.stepForward();
    expect(atCheckpoint.currentStepIndex).toBe(1);
    expect(atCheckpoint.awaitingPrediction).toBe(true);

    // Stepping forward is blocked until answered
    const blocked = ctrl.stepForward();
    expect(blocked.currentStepIndex).toBe(1);

    // Wrong prediction gives feedback and keeps checkpoint locked
    const wrong = ctrl.submitPrediction('2');
    expect(wrong.predictionFeedback?.isCorrect).toBe(false);
    expect(wrong.awaitingPrediction).toBe(true);

    // Correct prediction unlocks stepping
    const right = ctrl.submitPrediction('3');
    expect(right.predictionFeedback?.isCorrect).toBe(true);
    expect(right.awaitingPrediction).toBe(false);

    const advanced = ctrl.stepForward();
    expect(advanced.currentStepIndex).toBe(2);
  });
});
