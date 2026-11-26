export type LearningMode = 'learn' | 'experiment' | 'practice';

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed';

export interface Explanation5Q {
  whatHappened: string;
  whyItHappened: string;
  whichRule: string;
  whatNext: string;
  remember: string;
}

export interface SimulationStep<TState, TEvent = unknown> {
  stepIndex: number;
  tick: number;
  state: TState;
  events: TEvent[];
  explanation: Explanation5Q;
  checkpointPrompt?: {
    question: string;
    options: string[];
    correctOption: string;
    hint: string;
  };
}

export interface SimulationResult<TState, TEvent, TMetrics> {
  steps: SimulationStep<TState, TEvent>[];
  finalMetrics: TMetrics;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SimulationEngine<TInput, TState, TEvent, TMetrics> {
  validate(input: TInput): ValidationResult;
  run(input: TInput): SimulationResult<TState, TEvent, TMetrics>;
}
