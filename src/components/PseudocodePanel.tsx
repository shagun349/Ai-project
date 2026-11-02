import { Code2 } from 'lucide-react';
import type { ExecutionEvent } from '../types';

interface PseudocodePanelProps {
  pseudocode: string[];
  currentEvent: ExecutionEvent | null;
  description?: string;
}

export default function PseudocodePanel({ pseudocode, currentEvent, description }: PseudocodePanelProps) {
  const activeLine = currentEvent?.pseudocodeLine ?? -1;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-dark-700 shrink-0">
        <Code2 size={14} className="text-accent-400" />
        <h3 className="text-xs font-medium text-dark-200">Pseudocode</h3>
      </div>

      {/* Pseudocode lines */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="font-mono text-xs leading-relaxed">
          {pseudocode.map((line, idx) => {
            const isActive = idx === activeLine;
            const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
            return (
              <div
                key={idx}
                className={`
                  px-2 py-0.5 rounded transition-all duration-150
                  ${isActive
                    ? 'bg-accent-500/15 text-accent-300 border-l-2 border-accent-500'
                    : 'text-dark-300 border-l-2 border-transparent'
                  }
                `}
                style={{ paddingLeft: `${indent * 6 + 8}px` }}
              >
                <span className="text-dark-500 mr-3 select-none inline-block w-4 text-right">
                  {idx + 1}
                </span>
                {line.trim()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live explanation */}
      {(currentEvent || description) && (
        <div className="border-t border-dark-700 px-4 py-2.5 shrink-0">
          <p className="text-xs text-dark-200 leading-relaxed">
            <span className="text-accent-400 font-medium">→ </span>
            {currentEvent?.description || description || 'Ready to execute'}
          </p>
        </div>
      )}
    </div>
  );
}
