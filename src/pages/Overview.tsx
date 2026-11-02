import { Brain, Search, Gamepad2, Sparkles, Compass, Zap, Target, Layers, ArrowRight } from 'lucide-react';
import type { PageId } from '../types';

interface OverviewProps {
  onNavigate: (page: PageId) => void;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const searchQuickCards = [
    {
      id: 'dfs',
      title: 'Depth First Search',
      type: 'Uninformed',
      desc: 'Systematic deep branch exploration using LIFO stack backtracking.',
      icon: Layers,
      color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    },
    {
      id: 'a-star',
      title: 'A* Grid Search',
      type: 'Optimal (g+h)',
      desc: 'Shortest path heuristic search on 2D obstacle grids.',
      icon: Sparkles,
      color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'best-first-search',
      title: 'Best First Search',
      type: 'Greedy (h)',
      desc: 'Greedy heuristic priority queue expansion towards target.',
      icon: Compass,
      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    },
    {
      id: 'hill-climbing',
      title: 'Hill Climbing',
      type: 'Local Search',
      desc: 'Steepest-ascent neighbor evaluation to find local peaks.',
      icon: Zap,
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      id: 'generate-and-test',
      title: 'Generate & Test',
      type: 'Systematic',
      desc: 'Exhaustive candidate state generation and criterion testing.',
      icon: Target,
      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
  ];

  return (
    <div className="h-full overflow-y-auto px-5 py-7 md:px-8 md:py-9 xl:px-12">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col gap-8">
        {/* Block 1: Prominent Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-600/20 via-dark-900 to-dark-900 border border-accent-500/25 p-7 md:p-10 shadow-xl">
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 border border-accent-500/30 text-accent-300 text-xs font-semibold">
                <Brain size={14} />
                <span>Interactive AI Laboratory Platform</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Cognitia – AI Search & Game Theory Lab
              </h1>
              <p className="text-sm md:text-base text-dark-200 leading-7 max-w-2xl">
                Step-by-step interactive algorithm visualizer with real-time state trees, priority frontiers, live pseudocode highlighting, and theoretical matrix metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('search-lab')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-accent-600 hover:bg-accent-500 text-white text-sm font-bold shadow-lg shadow-accent-600/30 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Search size={15} />
                <span>Launch Search Lab</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => onNavigate('game-theory-lab')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-200 text-sm font-bold transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <Gamepad2 size={15} />
                <span>Game Theory</span>
              </button>
            </div>
          </div>
        </div>

        {/* Block 2: The Two Core Laboratories */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Lab A */}
          <div
            onClick={() => onNavigate('search-lab')}
            className="group min-w-0 rounded-3xl bg-dark-900 border border-dark-700/80 hover:border-accent-500/60 p-6 md:p-7 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-accent-600/20 border border-accent-500/30 flex items-center justify-center text-accent-400 group-hover:scale-105 transition-transform">
                    <Search size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-accent-300 transition-colors">
                      Lab A: AI Search Algorithms
                    </h2>
                    <span className="text-sm text-dark-400">Uninformed, Heuristic & Local Search</span>
                  </div>
                </div>
                <span className="text-[11px] uppercase font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  5 Ready • 6 In Pipeline
                </span>
              </div>
              <p className="text-sm text-dark-300 leading-6 max-w-2xl">
                Execute uninformed (DFS), heuristic (Best-First, A*), and local optimizations (Hill Climbing) with interactive visualizers, step debugging, and state inspection.
              </p>
            </div>

            <div className="pt-5 border-t border-dark-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {['DFS', 'Generate & Test', 'Hill Climbing', 'Best-First', 'A*'].map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-dark-800 text-dark-200 border border-dark-700 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-sm text-accent-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enter Search Lab <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Lab B */}
          <div
            onClick={() => onNavigate('game-theory-lab')}
            className="group min-w-0 rounded-3xl bg-dark-900 border border-dark-700/80 hover:border-purple-500/60 p-6 md:p-7 transition-all duration-200 cursor-pointer shadow-lg flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                    <Gamepad2 size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      Lab B: Game Theory & Adversarial Search
                    </h2>
                    <span className="text-sm text-dark-400">Zero-Sum Multi-Agent Decision Trees</span>
                  </div>
                </div>
                <span className="text-[11px] uppercase font-mono px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
                  Phase 4 Architecture
                </span>
              </div>
              <p className="text-sm text-dark-300 leading-6 max-w-2xl">
                Explore zero-sum game trees with alternating MAX/MIN layers, interactive alpha-beta branch cutoff visualization, and recursive move evaluations.
              </p>
            </div>

            <div className="pt-5 border-t border-dark-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {['Minimax', 'Alpha-Beta Pruning', 'Game Trees', 'Alpha/Beta Bounds'].map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-lg bg-dark-800 text-dark-200 border border-dark-700 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
              <span className="text-sm text-purple-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Preview Game Lab <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </section>

        {/* Block 3: 5 Algorithm Quick-Launch Cards */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-accent-400 font-semibold">Search toolkit</p>
              <h2 className="text-xl font-bold text-white mt-1">Choose an algorithm</h2>
            </div>
            <button onClick={() => onNavigate('search-lab')} className="hidden sm:flex items-center gap-2 text-sm font-semibold text-accent-300 hover:text-white transition-colors cursor-pointer">
              Open Search Lab <ArrowRight size={15} />
            </button>
          </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {searchQuickCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onNavigate('search-lab')}
                className="min-w-0 p-5 rounded-2xl bg-dark-900 border border-dark-700/80 hover:border-accent-500/50 hover:bg-dark-800 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-md min-h-[210px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-dark-400 font-semibold">
                      {card.type}
                    </span>
                    <div className={`p-1.5 rounded-lg border ${card.color}`}>
                      <Icon size={14} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-accent-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-dark-400 mt-2 leading-5">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-dark-800/80 flex items-center justify-between text-sm text-accent-400 font-semibold">
                  <span>Launch Visualizer</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
        </section>

        {/* Block 4: Algorithm Classification Matrix Table */}
        <section className="rounded-3xl bg-dark-900 border border-dark-700/80 p-5 md:p-7 shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-dark-400 font-semibold">At a glance</p>
              <h2 className="text-xl font-bold text-white mt-1">Algorithm properties</h2>
            </div>
            <p className="text-sm text-dark-400">Completeness and optimality depend on the search conditions.</p>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-dark-700 text-dark-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Time Complexity</th>
                  <th className="py-2.5 px-3">Space Complexity</th>
                  <th className="py-2.5 px-3">Complete</th>
                  <th className="py-2.5 px-3">Optimal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800/80 text-dark-200">
                <tr className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs">Depth First Search (DFS)</td>
                  <td className="py-3 px-4 text-dark-300 text-xs">Uninformed</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b^m)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(bm)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Finite only
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      No
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs">Generate & Test</td>
                  <td className="py-3 px-4 text-dark-300 text-xs">Systematic</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(n)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(1)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Yes (finite)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      No
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs">Hill Climbing</td>
                  <td className="py-3 px-4 text-dark-300 text-xs">Local Search</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b × m)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      No (local peak)
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      No
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs">Best First Search</td>
                  <td className="py-3 px-4 text-dark-300 text-xs">Informed (h)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b^m)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b^m)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Consistent h
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      No
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-dark-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white text-xs">A* Search</td>
                  <td className="py-3 px-4 text-dark-300 text-xs">Informed (g + h)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b^d)</td>
                  <td className="py-3 px-4 font-mono text-xs text-dark-200">O(b^d)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Yes
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Yes (optimal)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
