import { useState, useMemo } from 'react';
import { Play, BarChart3, Shuffle } from 'lucide-react';
import { executeDFS, executeBestFirstSearch } from '../algorithms';
import { generateDefaultSearchGraph, generateRandomGraph } from '../utils/graphGenerators';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { Graph, GraphNode } from '../types';

interface ComparisonRow {
  name: string;
  category: string;
  nodesExplored: number;
  nodesGenerated: number;
  maxFrontier: number;
  executionTimeMs: number;
  pathLength: number | null;
  success: boolean;
}

export default function ComparisonLab() {
  const [graph, setGraph] = useState<Graph>(generateDefaultSearchGraph);
  const [startNode, setStartNode] = useState('A');
  const [goalNode, setGoalNode] = useState('I');
  const [results, setResults] = useState<ComparisonRow[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleRunComparison = () => {
    // 1. DFS
    const dfsRes = executeDFS({ graph, startNodeId: startNode, goalNodeId: goalNode });
    // 2. Best-First Search
    const bfsRes = executeBestFirstSearch({ graph, startNodeId: startNode, goalNodeId: goalNode });

    const newResults: ComparisonRow[] = [
      {
        name: 'Depth First Search (DFS)',
        category: 'Uninformed',
        nodesExplored: dfsRes.stats.nodesExplored,
        nodesGenerated: dfsRes.stats.nodesGenerated,
        maxFrontier: dfsRes.stats.maxFrontierSize,
        executionTimeMs: Number(dfsRes.stats.executionTimeMs.toFixed(3)),
        pathLength: dfsRes.stats.pathLength,
        success: dfsRes.stats.success,
      },
      {
        name: 'Best First Search',
        category: 'Informed (Greedy)',
        nodesExplored: bfsRes.stats.nodesExplored,
        nodesGenerated: bfsRes.stats.nodesGenerated,
        maxFrontier: bfsRes.stats.maxFrontierSize,
        executionTimeMs: Number(bfsRes.stats.executionTimeMs.toFixed(3)),
        pathLength: bfsRes.stats.pathLength,
        success: bfsRes.stats.success,
      },
    ];

    setResults(newResults);
    setHasRun(true);
  };

  const handleRandomize = () => {
    const newGraph = generateRandomGraph(10, 0.4);
    setGraph(newGraph);
    setStartNode(newGraph.nodes[0].id);
    setGoalNode(newGraph.nodes[newGraph.nodes.length - 1].id);
    setHasRun(false);
  };

  const chartData = useMemo(() => {
    return results.map(r => ({
      name: r.name.replace(' (DFS)', ''),
      'Nodes Explored': r.nodesExplored,
      'Nodes Generated': r.nodesGenerated,
      'Max Frontier': r.maxFrontier,
      'Path Length': r.pathLength ?? 0,
    }));
  }, [results]);

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-accent-400" size={22} />
            Search Algorithm Benchmarking & Comparison
          </h1>
          <p className="text-xs text-dark-300 mt-1">
            Execute search algorithms across identical topologies and compare frontier expansion, nodes explored, and path optimality.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                       bg-dark-700 text-dark-200 hover:bg-dark-600 transition-colors cursor-pointer"
          >
            <Shuffle size={13} />
            Randomize Topology
          </button>
          <button
            onClick={handleRunComparison}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                       bg-accent-600 text-white hover:bg-accent-500 shadow-md shadow-accent-600/30 transition-all cursor-pointer"
          >
            <Play size={14} />
            Run Benchmark
          </button>
        </div>
      </div>

      {/* Config Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-dark-900 border border-dark-700 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <label className="text-dark-400">Start Node:</label>
          <select
            value={startNode}
            onChange={(e) => setStartNode(e.target.value)}
            className="bg-dark-800 text-dark-200 rounded px-2 py-1 border border-dark-600"
          >
            {graph.nodes.map((n: GraphNode) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-dark-400">Goal Node:</label>
          <select
            value={goalNode}
            onChange={(e) => setGoalNode(e.target.value)}
            className="bg-dark-800 text-dark-200 rounded px-2 py-1 border border-dark-600"
          >
            {graph.nodes.map((n: GraphNode) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>

        <span className="text-dark-500 ml-auto">
          Nodes: {graph.nodes.length} | Edges: {graph.edges.length}
        </span>
      </div>

      {/* Results Section */}
      {hasRun ? (
        <div className="space-y-6">
          {/* Metrics Table */}
          <div className="rounded-xl bg-dark-900 border border-dark-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-700 bg-dark-800/40">
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Benchmark Output Summary
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-700 text-dark-400 font-medium">
                    <th className="py-2.5 px-4">Algorithm</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Explored</th>
                    <th className="py-2.5 px-4">Generated</th>
                    <th className="py-2.5 px-4">Max Frontier</th>
                    <th className="py-2.5 px-4">Path Length</th>
                    <th className="py-2.5 px-4">Execution (ms)</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800 text-dark-200 font-mono text-[11px]">
                  {results.map(r => (
                    <tr key={r.name} className="hover:bg-dark-800/40">
                      <td className="py-3 px-4 font-sans font-medium text-white">{r.name}</td>
                      <td className="py-3 px-4 font-sans text-dark-400">{r.category}</td>
                      <td className="py-3 px-4 text-cyan-400">{r.nodesExplored}</td>
                      <td className="py-3 px-4 text-amber-400">{r.nodesGenerated}</td>
                      <td className="py-3 px-4">{r.maxFrontier}</td>
                      <td className="py-3 px-4 text-emerald-400">{r.pathLength ?? 'N/A'}</td>
                      <td className="py-3 px-4">{r.executionTimeMs} ms</td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${r.success ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400'}`}>
                          {r.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visualization Charts */}
          <div className="rounded-xl bg-dark-900 border border-dark-700 p-5">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider mb-4">
              Exploration & Frontier Comparison Chart
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
                  <XAxis dataKey="name" stroke="#6b7394" fontSize={11} />
                  <YAxis stroke="#6b7394" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f1117', borderColor: '#252a3a', borderRadius: 8, fontSize: 12 }} 
                    itemStyle={{ color: '#b0b7cc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Bar dataKey="Nodes Explored" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Nodes Generated" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Max Frontier" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Path Length" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-dark-900 border border-dark-700 p-12 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-accent-600/10 border border-accent-500/20 flex items-center justify-center text-accent-400">
            <BarChart3 size={24} />
          </div>
          <h2 className="text-sm font-semibold text-white">Ready to Benchmark</h2>
          <p className="text-xs text-dark-400 max-w-sm">
            Click &quot;Run Benchmark&quot; above to execute algorithms side-by-side on the selected topology and inspect comparative stats and charts.
          </p>
        </div>
      )}
    </div>
  );
}
