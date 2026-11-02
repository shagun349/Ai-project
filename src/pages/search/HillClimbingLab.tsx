import { useState, useCallback, useRef, useEffect } from 'react';
import { Shuffle, Play, ArrowDown, ArrowUp } from 'lucide-react';
import { executeHillClimbing } from '../../algorithms';
import { getAlgorithmById } from '../../data/algorithms';
import { generateHillClimbingGraph, generateRandomGraph } from '../../utils/graphGenerators';
import { useAlgorithmExecution } from '../../hooks/useAlgorithmExecution';
import ExecutionControls from '../../components/ExecutionControls';
import PseudocodePanel from '../../components/PseudocodePanel';
import StatsPanel from '../../components/StatsPanel';
import AlgorithmInfoPanel from '../../components/AlgorithmInfoPanel';
import GraphVisualizer from '../../components/visualizers/GraphVisualizer';
import type { Graph } from '../../types';

export default function HillClimbingLab() {
  const algo = getAlgorithmById('hill-climbing')!;
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  const [graph, setGraph] = useState<Graph>(generateHillClimbingGraph);
  const [startNode, setStartNode] = useState('S');
  const [minimize, setMinimize] = useState(true);

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
    const result = executeHillClimbing({
      graph,
      startNodeId: startNode,
      minimize,
    });
    execution.loadExecution(result.events, result.stats);
    execution.play();
  }, [graph, startNode, minimize, execution]);

  const handleRandomize = useCallback(() => {
    const newGraph = generateRandomGraph(8, 0.4);
    setGraph(newGraph);
    setStartNode(newGraph.nodes[0].id);
    execution.reset();
  }, [execution]);

  // Extract path from events
  const solutionPath: string[] = (() => {
    for (let i = execution.visibleEvents.length - 1; i >= 0; i--) {
      const ev = execution.visibleEvents[i];
      if (ev.data.path) {
        return ev.data.path as string[];
      }
    }
    return [];
  })();

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
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-dark-700 text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <Shuffle size={13} />
            Random Graph
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-accent-600 text-white hover:bg-accent-500 transition-colors cursor-pointer"
          >
            <Play size={13} />
            Run Hill Climbing
          </button>
        </div>
      </div>

      {/* Config Bar */}
      <div className="flex flex-wrap items-center gap-4 shrink-0 bg-dark-900/60 p-2.5 rounded-xl border border-dark-700/60">
        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Start State:</label>
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            className="bg-dark-700 text-dark-200 text-xs rounded-md px-2 py-1
                       border border-dark-600 outline-none focus:border-accent-500 cursor-pointer"
          >
            {graph.nodes.map(n => (
              <option key={n.id} value={n.id}>
                {n.label} (h={n.heuristic ?? 0})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-dark-400">Optimization Goal:</label>
          <div className="flex items-center rounded-lg bg-dark-700 p-0.5 border border-dark-600">
            <button
              onClick={() => setMinimize(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                minimize ? 'bg-accent-600 text-white font-medium' : 'text-dark-300 hover:text-white'
              }`}
            >
              <ArrowDown size={12} />
              Minimize Heuristic
            </button>
            <button
              onClick={() => setMinimize(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                !minimize ? 'bg-accent-600 text-white font-medium' : 'text-dark-300 hover:text-white'
              }`}
            >
              <ArrowUp size={12} />
              Maximize Value
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 ml-auto text-[10px] text-dark-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /> Current State</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Path Traversed</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#313849]" /> Unexplored</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 bg-dark-900 border border-dark-700 rounded-xl overflow-hidden" ref={containerRef}>
          <GraphVisualizer
            graph={graph}
            width={canvasSize.width}
            height={canvasSize.height}
            visibleEvents={execution.visibleEvents}
            currentEvent={execution.currentEvent}
            highlightPath={solutionPath}
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
