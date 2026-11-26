import { create } from 'zustand';
import {
  SimulationController,
  type ControllerSnapshot,
} from './SimulationController';
import type {
  LearningMode,
  SimulationEngine,
  SimulationResult,
} from '../types/simulation';

interface SimulationStoreState {
  controller: SimulationController<unknown, unknown, unknown, unknown>;
  snapshot: ControllerSnapshot<unknown, unknown, unknown>;
  timerId: number | null;

  loadSimulation: <TInput, TState, TEvent, TMetrics>(
    engine: SimulationEngine<TInput, TState, TEvent, TMetrics>,
    input: TInput
  ) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  seekToStep: (index: number) => void;
  setSpeed: (speed: number) => void;
  setMode: (mode: LearningMode) => void;
  submitPrediction: (option: string) => void;
  revealCheckpointAnswer: () => void;
  getResult: () => SimulationResult<unknown, unknown, unknown> | null;
  dispose: () => void;
}

const BASE_INTERVAL_MS = 900;

export const useSimulationStore = create<SimulationStoreState>((set, get) => {
  const clearTimer = () => {
    const id = get().timerId;
    if (id !== null && typeof window !== 'undefined') {
      window.clearInterval(id);
    }
  };

  const startTimer = (speed: number) => {
    clearTimer();
    if (typeof window === 'undefined') return null;
    const interval = Math.max(120, Math.round(BASE_INTERVAL_MS / speed));
    return window.setInterval(() => {
      const { controller } = get();
      const next = controller.stepForward();
      if (next.status !== 'playing') {
        clearTimer();
        set({ snapshot: next, timerId: null });
      } else {
        set({ snapshot: next });
      }
    }, interval);
  };

  const initialController = new SimulationController<
    unknown,
    unknown,
    unknown,
    unknown
  >();

  return {
    controller: initialController,
    snapshot: initialController.getSnapshot(),
    timerId: null,

    loadSimulation: (engine, input) => {
      clearTimer();
      const controller = new SimulationController<
        unknown,
        unknown,
        unknown,
        unknown
      >();
      // Preserve current mode and speed across reloads
      const prev = get().snapshot;
      controller.setMode(prev.mode);
      controller.setSpeed(prev.speed);
      const snapshot = controller.load(
        engine as SimulationEngine<unknown, unknown, unknown, unknown>,
        input
      );
      set({ controller, snapshot, timerId: null });
    },

    play: () => {
      const { controller } = get();
      const snapshot = controller.play();
      if (snapshot.status === 'playing') {
        const timerId = startTimer(snapshot.speed);
        set({ snapshot, timerId });
      } else {
        clearTimer();
        set({ snapshot, timerId: null });
      }
    },

    pause: () => {
      clearTimer();
      const snapshot = get().controller.pause();
      set({ snapshot, timerId: null });
    },

    reset: () => {
      clearTimer();
      const snapshot = get().controller.reset();
      set({ snapshot, timerId: null });
    },

    stepForward: () => {
      clearTimer();
      const snapshot = get().controller.stepForward();
      set({ snapshot, timerId: null });
    },

    stepBackward: () => {
      clearTimer();
      const snapshot = get().controller.stepBackward();
      set({ snapshot, timerId: null });
    },

    seekToStep: (index) => {
      clearTimer();
      const snapshot = get().controller.seekToStep(index);
      set({ snapshot, timerId: null });
    },

    setSpeed: (speed) => {
      const { controller, snapshot } = get();
      const next = controller.setSpeed(speed);
      if (snapshot.status === 'playing') {
        const timerId = startTimer(next.speed);
        set({ snapshot: next, timerId });
      } else {
        set({ snapshot: next });
      }
    },

    setMode: (mode) => {
      const snapshot = get().controller.setMode(mode);
      if (snapshot.status !== 'playing') {
        clearTimer();
        set({ snapshot, timerId: null });
      } else {
        set({ snapshot });
      }
    },

    submitPrediction: (option) => {
      const snapshot = get().controller.submitPrediction(option);
      set({ snapshot });
    },

    revealCheckpointAnswer: () => {
      const snapshot = get().controller.revealCheckpointAnswer();
      set({ snapshot });
    },

    getResult: () => get().controller.getResult(),

    dispose: () => {
      clearTimer();
      set({ timerId: null });
    },
  };
});
