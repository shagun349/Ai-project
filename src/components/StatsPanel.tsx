import { Activity, Clock, Layers, Route, Target, Hash, CheckCircle, XCircle } from 'lucide-react';
import type { ExecutionStats } from '../types';

interface StatsPanelProps {
  stats: ExecutionStats;
  /** Additional key-value pairs to display. */
  extra?: Array<{ label: string; value: string | number }>;
}

export default function StatsPanel({ stats, extra }: StatsPanelProps) {
  const statItems = [
    { icon: Target, label: 'Nodes Explored', value: stats.nodesExplored, color: 'text-cyan-400' },
    { icon: Layers, label: 'Nodes Generated', value: stats.nodesGenerated, color: 'text-accent-400' },
    { icon: Activity, label: 'Max Frontier', value: stats.maxFrontierSize, color: 'text-amber-400' },
    { icon: Clock, label: 'Time', value: `${stats.executionTimeMs.toFixed(2)}ms`, color: 'text-emerald-400' },
    { icon: Route, label: 'Path Length', value: stats.pathLength ?? '—', color: 'text-rose-400' },
    { icon: Hash, label: 'Iterations', value: stats.iterations, color: 'text-dark-200' },
  ];

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-dark-700">
        <h3 className="text-xs font-medium text-dark-200">Statistics</h3>
        <span className={`flex items-center gap-1 text-xs font-medium ${stats.success ? 'text-emerald-400' : 'text-rose-400'}`}>
          {stats.success ? <CheckCircle size={12} /> : <XCircle size={12} />}
          {stats.success ? 'Success' : 'No Solution'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-dark-700/50">
        {statItems.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-dark-800 px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={color} />
              <span className="text-[10px] text-dark-400 uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-semibold text-dark-100 font-mono">{value}</p>
          </div>
        ))}
      </div>

      {/* Solution cost */}
      {stats.solutionCost !== null && (
        <div className="px-3 py-2.5 border-t border-dark-700/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-dark-400 uppercase tracking-wider">Solution Cost</span>
            <span className="text-sm font-semibold text-emerald-400 font-mono">
              {typeof stats.solutionCost === 'number' ? stats.solutionCost.toFixed(1) : stats.solutionCost}
            </span>
          </div>
        </div>
      )}

      {/* Extra stats */}
      {extra && extra.length > 0 && (
        <div className="border-t border-dark-700/50">
          {extra.map(({ label, value }) => (
            <div key={label} className="px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] text-dark-400 uppercase tracking-wider">{label}</span>
              <span className="text-xs font-medium text-dark-200 font-mono">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
