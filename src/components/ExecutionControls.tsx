import {
  Play, Pause, RotateCcw, SkipForward, SkipBack, Gauge,
} from 'lucide-react';
import type { ExecutionStatus } from '../types';

interface ExecutionControlsProps {
  status: ExecutionStatus;
  currentStep: number;
  totalSteps: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
}

const speedOptions = [
  { label: '0.25×', value: 2000 },
  { label: '0.5×', value: 1000 },
  { label: '1×', value: 500 },
  { label: '2×', value: 250 },
  { label: '4×', value: 125 },
  { label: '8×', value: 62 },
];

export default function ExecutionControls({
  status,
  currentStep,
  totalSteps,
  speed,
  onPlay,
  onPause,
  onReset,
  onStepForward,
  onStepBackward,
  onSpeedChange,
}: ExecutionControlsProps) {
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl p-3">
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-dark-300 mb-1.5">
          <span>Step {Math.max(0, currentStep + 1)} / {totalSteps}</span>
          <span className={`font-medium ${
            status === 'running' ? 'text-emerald-400' :
            status === 'paused' ? 'text-amber-400' :
            status === 'completed' ? 'text-accent-400' :
            status === 'failed' ? 'text-rose-400' :
            'text-dark-400'
          }`}>
            {status === 'running' ? 'Running' :
             status === 'paused' ? 'Paused' :
             status === 'completed' ? 'Completed' :
             status === 'failed' ? 'Failed' :
             'Ready'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200 bg-accent-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onStepBackward}
          disabled={currentStep <= 0 || status === 'running'}
          className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Step Backward"
        >
          <SkipBack size={16} />
        </button>

        {status === 'running' ? (
          <button
            onClick={onPause}
            className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25
                       transition-colors cursor-pointer"
            title="Pause"
          >
            <Pause size={18} />
          </button>
        ) : (
          <button
            onClick={onPlay}
            disabled={status === 'completed' || totalSteps === 0}
            className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25
                       disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Play"
          >
            <Play size={18} />
          </button>
        )}

        <button
          onClick={onStepForward}
          disabled={currentStep >= totalSteps - 1 || status === 'running'}
          className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Step Forward"
        >
          <SkipForward size={16} />
        </button>

        <button
          onClick={onReset}
          disabled={status === 'idle'}
          className="p-2 rounded-lg text-dark-300 hover:text-white hover:bg-dark-600
                     disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-dark-600 mx-1" />

        {/* Speed control */}
        <div className="flex items-center gap-1.5">
          <Gauge size={14} className="text-dark-400" />
          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1.5
                       border border-dark-600 outline-none focus:border-accent-500
                       cursor-pointer"
          >
            {speedOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
