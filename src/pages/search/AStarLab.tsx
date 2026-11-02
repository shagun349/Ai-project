import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Play, Shuffle, RotateCcw, Compass } from 'lucide-react';
import { executeAStar } from '../../algorithms';
import { getAlgorithmById } from '../../data/algorithms';
import { generateDefaultAStarGrid } from '../../utils/graphGenerators';
import { useAlgorithmExecution } from '../../hooks/useAlgorithmExecution';
import ExecutionControls from '../../components/ExecutionControls';
import PseudocodePanel from '../../components/PseudocodePanel';
import StatsPanel from '../../components/StatsPanel';
import AlgorithmInfoPanel from '../../components/AlgorithmInfoPanel';
import GridVisualizer from '../../components/visualizers/GridVisualizer';

export default function AStarLab() {
  const algo = getAlgorithmById('a-star')!;
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  const rows = 12;
  const cols = 18;

  const [initialData, setInitialData] = useState(() => generateDefaultAStarGrid(rows, cols, 0.22));
  const [heuristic, setHeuristic] = useState<'manhattan' | 'euclidean'>('manhattan');
  const [allowDiagonal, setAllowDiagonal] = useState<boolean>(false);

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

  const wallsSet = useMemo(() => {
    const s = new Set<string>();
    for (const w of initialData.walls) {
      s.add(`${w.row},${w.col}`);
    }
    return s;
  }, [initialData.walls]);

  const handleRun = useCallback(() => {
    const result = executeAStar({
      rows,
      cols,
      walls: initialData.walls,
      start: initialData.start,
      goal: initialData.goal,
      heuristic,
      allowDiagonal,
    });
    execution.loadExecution(result.events, result.stats);
    execution.play();
  }, [rows, cols, initialData, heuristic, allowDiagonal, execution]);

  const handleRandomize = useCallback(() => {
    const newGrid = generateDefaultAStarGrid(rows, cols, 0.25);
    setInitialData(newGrid);
    execution.reset();
  }, [rows, cols, execution]);

  const handleClearWalls = useCallback(() => {
    setInitialData(prev => ({ ...prev, walls: [] }));
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
            onClick={handleClearWalls}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-dark-700 text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Clear Walls
          </button>
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-dark-700 text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <Shuffle size={13} />
            Random Maze
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-accent-600 text-white hover:bg-accent-500 transition-colors cursor-pointer"
          >
            <Play size={13} />
            Run A*
          </button>
        </div>
      </div>

      {/* Config Bar */}
      <div className="flex flex-wrap items-center gap-4 shrink-0 bg-dark-900/60 p-2.5 rounded-xl border border-dark-700/60">
        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Heuristic h(n):</label>
          <select
            value={heuristic}
            onChange={(e) => setHeuristic(e.target.value as 'manhattan' | 'euclidean')}
            className="bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500 cursor-pointer"
          >
            <option value="manhattan">Manhattan (|Δx| + |Δy|)</option>
            <option value="euclidean">Euclidean (√(Δx² + Δy²))</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Movement:</label>
          <button
            onClick={() => setAllowDiagonal(!allowDiagonal)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
              allowDiagonal 
                ? 'bg-accent-600/20 border-accent-500 text-accent-300 font-medium'
                : 'bg-dark-700 border-dark-600 text-dark-300 hover:text-white'
            }`}
          >
            <Compass size={13} />
            {allowDiagonal ? '8-Way (With Diagonals)' : '4-Way (Orthogonal Only)'}
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-[10px] text-dark-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#10b981]" /> Start</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#f43f5e]" /> Goal</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#1c2030] border border-dark-600" /> Wall</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#78350f]" /> Open Set</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#164e63]" /> Closed Set</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-[#6366f1]" /> Final Path</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden" ref={containerRef}>
          <GridVisualizer
            rows={rows}
            cols={cols}
            walls={wallsSet}
            start={initialData.start}
            goal={initialData.goal}
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
