import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import type { PlaybackStatus } from '../../types/simulation';

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

interface TransportBarProps {
  status: PlaybackStatus;
  currentStepIndex: number;
  totalSteps: number;
  speed: number;
  awaitingPrediction: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
}

export function TransportBar({
  status,
  currentStepIndex,
  totalSteps,
  speed,
  awaitingPrediction,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onSeek,
  onSpeedChange,
}: TransportBarProps) {
  const maxIndex = Math.max(0, totalSteps - 1);
  const isPlaying = status === 'playing';
  const disabled = totalSteps === 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSeek(0)}
          disabled={disabled || currentStepIndex === 0}
          aria-label="Jump to start"
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <SkipBack className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onStepBackward}
          disabled={disabled || currentStepIndex === 0}
          aria-label="Step backward"
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={isPlaying ? onPause : onPlay}
          disabled={disabled || awaitingPrediction}
          aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onStepForward}
          disabled={disabled || awaitingPrediction || currentStepIndex >= maxIndex}
          aria-label="Step forward"
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onSeek(maxIndex)}
          disabled={disabled || awaitingPrediction || currentStepIndex >= maxIndex}
          aria-label="Jump to end"
          className="rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <SkipForward className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          aria-label="Reset simulation"
          className="ml-1 rounded-md p-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-w-[160px] flex-1 items-center gap-2.5 px-2">
        <input
          type="range"
          min={0}
          max={maxIndex}
          value={currentStepIndex}
          disabled={disabled || awaitingPrediction}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Simulation timeline step"
          className="w-full accent-blue-600"
        />
        <span className="shrink-0 font-mono text-xs text-slate-600 tabular-nums">
          {totalSteps === 0 ? '0/0' : `${currentStepIndex + 1}/${totalSteps}`}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Speed</span>
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          aria-label="Simulation playback speed"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs text-slate-800"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s}>
              {s}x
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
