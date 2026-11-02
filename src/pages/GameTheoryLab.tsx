import { useState } from 'react';
import { Gamepad2, GitFork, Sparkles } from 'lucide-react';
import { gameTheoryAlgorithms } from '../data/algorithms';
import AlgorithmInfoPanel from '../components/AlgorithmInfoPanel';
import PseudocodePanel from '../components/PseudocodePanel';
import type { AlgorithmInfo } from '../types';

export default function GameTheoryLab() {
  const [selectedAlgoId, setSelectedAlgoId] = useState<'minimax' | 'alpha-beta'>('minimax');
  const algo = gameTheoryAlgorithms.find((a: AlgorithmInfo) => a.id === selectedAlgoId)!;

  return (
    <div className="h-full flex flex-col bg-dark-950 overflow-hidden">
      {/* Header Tabs */}
      <div className="border-b border-dark-700 bg-dark-900/70 px-4 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-dark-400 mr-2">
              Adversarial Search:
            </span>
            <button
              onClick={() => setSelectedAlgoId('minimax')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedAlgoId === 'minimax'
                  ? 'bg-accent-600 text-white shadow-sm shadow-accent-600/30'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
              }`}
            >
              <Gamepad2 size={13} />
              <span>Minimax</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-dark-700 text-dark-300 font-mono">
                Phase 4
              </span>
            </button>

            <button
              onClick={() => setSelectedAlgoId('alpha-beta')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedAlgoId === 'alpha-beta'
                  ? 'bg-accent-600 text-white shadow-sm shadow-accent-600/30'
                  : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
              }`}
            >
              <GitFork size={13} />
              <span>Alpha-Beta Pruning</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-dark-700 text-dark-300 font-mono">
                Phase 4
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs">
            <Sparkles size={12} />
            <span>Scheduled for Phase 4</span>
          </div>
        </div>
      </div>

      {/* Main Content Preview */}
      <div className="flex-1 flex gap-3 p-4 min-h-0 overflow-hidden">
        {/* Visualizer Area / Architecture Preview */}
        <div className="flex-1 bg-dark-900 border border-dark-700 rounded-xl p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{algo.name}</h2>
                <p className="text-xs text-dark-300">{algo.shortDescription}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-dark-800/60 border border-dark-700/60 space-y-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Phase 4 Implementation Scope
              </h3>
              <p className="text-xs text-dark-300 leading-relaxed">
                As specified in the project roadmap, Phase 1 (Architecture & Foundation) and Phase 2 (Basic Search: DFS, Generate & Test, Hill Climbing, Best-First, A*) are currently active. Phase 4 will bring the full interactive React Flow game tree canvas, real-time Alpha/Beta cutoff pruning, and evaluation function inspection.
              </p>
            </div>

            {/* Tree Architecture Preview */}
            <div className="rounded-xl border border-dark-700/80 bg-dark-950/60 p-4 space-y-3">
              <span className="text-xs font-semibold text-dark-300 uppercase tracking-wider block">
                Game Tree Structure Preview
              </span>
              <div className="flex flex-col items-center gap-3 py-4">
                {/* MAX Root */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-600/20 border border-accent-500 text-accent-300 text-xs font-mono">
                  <span>MAX (Root) [v = 3]</span>
                </div>
                <div className="w-0.5 h-4 bg-dark-600" />
                {/* MIN Level */}
                <div className="flex items-center gap-12">
                  <div className="flex flex-col items-center">
                    <div className="px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500 text-rose-300 text-xs font-mono">
                      MIN A [v = 3]
                    </div>
                    <div className="w-0.5 h-3 bg-dark-600 my-1" />
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-dark-800 border border-dark-700 text-dark-200 text-[10px] rounded font-mono">3</span>
                      <span className="px-2 py-0.5 bg-dark-800 border border-dark-700 text-dark-200 text-[10px] rounded font-mono">5</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500 text-rose-300 text-xs font-mono">
                      MIN B [v = 2] (Pruned)
                    </div>
                    <div className="w-0.5 h-3 bg-dark-600 my-1" />
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-dark-800 border border-dark-700 text-dark-200 text-[10px] rounded font-mono">2</span>
                      <span className="px-2 py-0.5 bg-rose-950/40 border border-rose-800 text-rose-400 text-[10px] rounded font-mono line-through">✂ Cut</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-dark-800 flex items-center justify-between text-xs text-dark-400">
            <span>Phase 1 & Phase 2 Verified Active</span>
            <span className="text-purple-400 font-mono">Coming next in Phase 4</span>
          </div>
        </div>

        {/* Right Info Panels */}
        <div className="w-80 flex flex-col gap-3 shrink-0 overflow-y-auto">
          <PseudocodePanel pseudocode={algo.pseudocode} currentEvent={null} />
          <AlgorithmInfoPanel algorithm={algo} />
        </div>
      </div>
    </div>
  );
}
