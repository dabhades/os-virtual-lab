import type {
  LearningMode,
  PlaybackStatus,
  SimulationEngine,
  SimulationResult,
  SimulationStep,
} from '../types/simulation';

export interface ControllerSnapshot<TState, TEvent, TMetrics> {
  status: PlaybackStatus;
  mode: LearningMode;
  speed: number;
  currentStepIndex: number;
  totalSteps: number;
  currentStep: SimulationStep<TState, TEvent> | null;
  finalMetrics: TMetrics | null;
  errors: string[];
  awaitingPrediction: boolean;
  predictionFeedback: {
    selected: string;
    isCorrect: boolean;
    hint: string;
  } | null;
}

/**
 * Pure, UI-agnostic deterministic playback controller over a SimulationResult.
 * Supports stepping forward, stepping backward, scrubbing, reset, replay, and Practice checkpoints.
 */
export class SimulationController<TInput, TState, TEvent, TMetrics> {
  private result: SimulationResult<TState, TEvent, TMetrics> | null = null;
  private status: PlaybackStatus = 'idle';
  private mode: LearningMode = 'learn';
  private speed = 1;
  private currentStepIndex = 0;
  private errors: string[] = [];
  private answeredCheckpoints = new Set<number>();
  private predictionFeedback: ControllerSnapshot<TState, TEvent, TMetrics>['predictionFeedback'] =
    null;

  load(
    engine: SimulationEngine<TInput, TState, TEvent, TMetrics>,
    input: TInput
  ): ControllerSnapshot<TState, TEvent, TMetrics> {
    const validation = engine.validate(input);
    if (!validation.valid) {
      this.result = null;
      this.status = 'idle';
      this.currentStepIndex = 0;
      this.errors = validation.errors;
      this.answeredCheckpoints.clear();
      this.predictionFeedback = null;
      return this.getSnapshot();
    }

    this.result = engine.run(input);
    this.errors = [];
    this.currentStepIndex = 0;
    this.answeredCheckpoints.clear();
    this.predictionFeedback = null;
    this.status =
      this.result.steps.length <= 1 ? 'completed' : 'paused';
    return this.getSnapshot();
  }

  private isCheckpointPending(): boolean {
    if (this.mode !== 'practice' || !this.result) return false;
    const step = this.result.steps[this.currentStepIndex];
    return Boolean(
      step?.checkpointPrompt &&
        !this.answeredCheckpoints.has(this.currentStepIndex)
    );
  }

  play(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result || this.result.steps.length === 0) return this.getSnapshot();
    if (this.isCheckpointPending()) {
      this.status = 'paused';
      return this.getSnapshot();
    }
    if (this.currentStepIndex >= this.result.steps.length - 1) {
      this.currentStepIndex = 0;
    }
    this.status = 'playing';
    return this.getSnapshot();
  }

  pause(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (this.status === 'playing') {
      this.status = 'paused';
    }
    return this.getSnapshot();
  }

  reset(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result) return this.getSnapshot();
    this.currentStepIndex = 0;
    this.answeredCheckpoints.clear();
    this.predictionFeedback = null;
    this.status = this.result.steps.length <= 1 ? 'completed' : 'paused';
    return this.getSnapshot();
  }

  stepForward(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result || this.result.steps.length === 0) return this.getSnapshot();
    if (this.isCheckpointPending()) {
      this.status = 'paused';
      return this.getSnapshot();
    }
    this.predictionFeedback = null;
    if (this.currentStepIndex < this.result.steps.length - 1) {
      this.currentStepIndex += 1;
    }
    if (this.currentStepIndex >= this.result.steps.length - 1) {
      this.status = 'completed';
    } else if (this.isCheckpointPending()) {
      this.status = 'paused';
    }
    return this.getSnapshot();
  }

  stepBackward(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result || this.result.steps.length === 0) return this.getSnapshot();
    this.predictionFeedback = null;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex -= 1;
    }
    this.status = 'paused';
    return this.getSnapshot();
  }

  seekToStep(index: number): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result || this.result.steps.length === 0) return this.getSnapshot();
    const clamped = Math.max(
      0,
      Math.min(index, this.result.steps.length - 1)
    );
    this.currentStepIndex = clamped;
    this.predictionFeedback = null;
    this.status =
      clamped >= this.result.steps.length - 1 ? 'completed' : 'paused';
    return this.getSnapshot();
  }

  setSpeed(speed: number): ControllerSnapshot<TState, TEvent, TMetrics> {
    this.speed = Math.max(0.25, Math.min(4, speed));
    return this.getSnapshot();
  }

  setMode(mode: LearningMode): ControllerSnapshot<TState, TEvent, TMetrics> {
    this.mode = mode;
    this.predictionFeedback = null;
    if (this.isCheckpointPending() && this.status === 'playing') {
      this.status = 'paused';
    }
    return this.getSnapshot();
  }

  submitPrediction(
    option: string
  ): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result) return this.getSnapshot();
    const step = this.result.steps[this.currentStepIndex];
    if (!step?.checkpointPrompt) return this.getSnapshot();

    const isCorrect = option === step.checkpointPrompt.correctOption;
    if (isCorrect) {
      this.answeredCheckpoints.add(this.currentStepIndex);
    }
    this.predictionFeedback = {
      selected: option,
      isCorrect,
      hint: step.checkpointPrompt.hint,
    };
    return this.getSnapshot();
  }

  revealCheckpointAnswer(): ControllerSnapshot<TState, TEvent, TMetrics> {
    if (!this.result) return this.getSnapshot();
    const step = this.result.steps[this.currentStepIndex];
    if (!step?.checkpointPrompt) return this.getSnapshot();
    this.answeredCheckpoints.add(this.currentStepIndex);
    this.predictionFeedback = {
      selected: step.checkpointPrompt.correctOption,
      isCorrect: true,
      hint: step.checkpointPrompt.hint,
    };
    return this.getSnapshot();
  }

  getResult(): SimulationResult<TState, TEvent, TMetrics> | null {
    return this.result;
  }

  getSnapshot(): ControllerSnapshot<TState, TEvent, TMetrics> {
    const steps = this.result?.steps ?? [];
    return {
      status: this.status,
      mode: this.mode,
      speed: this.speed,
      currentStepIndex: this.currentStepIndex,
      totalSteps: steps.length,
      currentStep: steps[this.currentStepIndex] ?? null,
      finalMetrics: this.result?.finalMetrics ?? null,
      errors: this.errors,
      awaitingPrediction: this.isCheckpointPending(),
      predictionFeedback: this.predictionFeedback,
    };
  }
}
