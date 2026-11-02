import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Clock, HardDrive, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { AlgorithmInfo } from '../types';

interface AlgorithmInfoPanelProps {
  algorithm: AlgorithmInfo;
}

export default function AlgorithmInfoPanel({ algorithm }: AlgorithmInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-dark-700/30
                   transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Info size={14} className="text-accent-400" />
          <h3 className="text-xs font-medium text-dark-200">Algorithm Information</h3>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-dark-400" /> : <ChevronDown size={14} className="text-dark-400" />}
      </button>

      {isExpanded && (
        <div className="border-t border-dark-700 animate-fade-in">
          {/* Overview */}
          <div className="px-4 py-3 border-b border-dark-700/50">
            <h4 className="text-[10px] text-dark-400 uppercase tracking-wider mb-1.5">Overview</h4>
            <p className="text-xs text-dark-200 leading-relaxed">{algorithm.overview}</p>
          </div>

          {/* Working Principle */}
          <div className="px-4 py-3 border-b border-dark-700/50">
            <h4 className="text-[10px] text-dark-400 uppercase tracking-wider mb-1.5">Working Principle</h4>
            <p className="text-xs text-dark-200 leading-relaxed">{algorithm.workingPrinciple}</p>
          </div>

          {/* Complexity */}
          <div className="grid grid-cols-2 gap-px bg-dark-700/50 border-b border-dark-700/50">
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={11} className="text-amber-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Time</h4>
              </div>
              <p className="text-xs text-dark-200 font-mono">{algorithm.timeComplexity}</p>
            </div>
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <HardDrive size={11} className="text-cyan-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Space</h4>
              </div>
              <p className="text-xs text-dark-200 font-mono">{algorithm.spaceComplexity}</p>
            </div>
          </div>

          {/* Completeness & Optimality */}
          <div className="grid grid-cols-2 gap-px bg-dark-700/50 border-b border-dark-700/50">
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle size={11} className="text-emerald-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Completeness</h4>
              </div>
              <p className="text-xs text-dark-200">{algorithm.completeness}</p>
            </div>
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle size={11} className="text-rose-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Optimality</h4>
              </div>
              <p className="text-xs text-dark-200">{algorithm.optimality}</p>
            </div>
          </div>

          {/* Advantages & Limitations */}
          <div className="grid grid-cols-2 gap-px bg-dark-700/50">
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ThumbsUp size={11} className="text-emerald-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Advantages</h4>
              </div>
              <ul className="space-y-1">
                {algorithm.advantages.map((adv, i) => (
                  <li key={i} className="text-xs text-dark-300 flex gap-1.5">
                    <span className="text-emerald-500 shrink-0">+</span>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-dark-800 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <ThumbsDown size={11} className="text-rose-400" />
                <h4 className="text-[10px] text-dark-400 uppercase tracking-wider">Limitations</h4>
              </div>
              <ul className="space-y-1">
                {algorithm.limitations.map((lim, i) => (
                  <li key={i} className="text-xs text-dark-300 flex gap-1.5">
                    <span className="text-rose-500 shrink-0">−</span>
                    {lim}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
