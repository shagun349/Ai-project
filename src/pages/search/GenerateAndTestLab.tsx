import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { executeGenerateAndTest } from '../../algorithms';
import { getAlgorithmById } from '../../data/algorithms';
import { useAlgorithmExecution } from '../../hooks/useAlgorithmExecution';
import ExecutionControls from '../../components/ExecutionControls';
import PseudocodePanel from '../../components/PseudocodePanel';
import StatsPanel from '../../components/StatsPanel';
import AlgorithmInfoPanel from '../../components/AlgorithmInfoPanel';
import GenerateTestVisualizer from '../../components/visualizers/GenerateTestVisualizer';

export default function GenerateAndTestLab() {
  const algo = getAlgorithmById('generate-and-test')!;
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  const [target, setTarget] = useState<number>(17);
  const [minRange, setMinRange] = useState<number>(1);
  const [maxRange, setMaxRange] = useState<number>(30);
  const [testType, setTestType] = useState<'exact' | 'divisible' | 'prime-closest'>('exact');

  const execution = useAlgorithmExecution();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      for (const entry of entries) {
        setCanvasSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleRun = useCallback(() => {
    const result = executeGenerateAndTest({
      target,
      candidateRange: [minRange, maxRange],
      testType,
    });
    execution.loadExecution(result.events, result.stats);
    execution.play();
  }, [target, minRange, maxRange, testType, execution]);

  const handleReset = useCallback(() => {
    execution.reset();
  }, [execution]);

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">{algo.name}</h2>
          <p className="text-xs text-dark-300">{algo.shortDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-dark-700 text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-accent-600 text-white hover:bg-accent-500 transition-colors cursor-pointer"
          >
            <Play size={13} />
            Run Test
          </button>
        </div>
      </div>

      {/* Config Bar */}
      <div className="flex flex-wrap items-center gap-4 shrink-0 bg-dark-900/60 p-2.5 rounded-xl border border-dark-700/60">
        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Target Value:</label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-16 bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Range:</label>
          <input
            type="number"
            value={minRange}
            onChange={(e) => setMinRange(Number(e.target.value))}
            className="w-14 bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500"
          />
          <span className="text-xs text-dark-500">to</span>
          <input
            type="number"
            value={maxRange}
            onChange={(e) => setMaxRange(Number(e.target.value))}
            className="w-14 bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Test Predicate:</label>
          <select
            value={testType}
            onChange={(e) => setTestType(e.target.value as 'exact' | 'divisible' | 'prime-closest')}
            className="bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500 cursor-pointer"
          >
            <option value="exact">Exact Match (x == target)</option>
            <option value="divisible">Multiple (x % target == 0)</option>
            <option value="prime-closest">Prime Closest to Target</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-[10px] text-dark-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-dark-600 border border-dark-500" /> Untested</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#6366f1]" /> Testing</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1c1520] border border-[#f43f5e]" /> Rejected</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#064e3b] border border-[#10b981]" /> Pass (Solution)</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden" ref={containerRef}>
          <GenerateTestVisualizer
            width={canvasSize.width}
            height={canvasSize.height}
            visibleEvents={execution.visibleEvents}
            currentEvent={execution.currentEvent}
          />
        </div>

        <div className="w-72 flex flex-col gap-3 shrink-0 overflow-y-auto">
          <PseudocodePanel
            pseudocode={algo.pseudocode}
            currentEvent={execution.currentEvent}
          />
          <StatsPanel stats={execution.state.stats} />
          <AlgorithmInfoPanel algorithm={algo} />
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0">
        <ExecutionControls
          status={execution.state.status}
          currentStep={execution.state.currentStepIndex}
          totalSteps={execution.state.totalSteps}
          speed={execution.speed}
          onPlay={execution.play}
          onPause={execution.pause}
          onReset={execution.reset}
          onStepForward={execution.stepForward}
          onStepBackward={execution.stepBackward}
          onSpeedChange={execution.setSpeed}
        />
      </div>
    </div>
  );
}
