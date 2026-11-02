import { useState } from 'react';
import { Settings, Sliders, Moon, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [defaultSpeed, setDefaultSpeed] = useState<number>(300);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="text-accent-400" size={22} />
          Laboratory Settings & Preferences
        </h1>
        <p className="text-xs text-dark-300 mt-1">
          Customize execution defaults, visualization rendering performance, and educational telemetry.
        </p>
      </div>

      <div className="space-y-4">
        {/* Playback Settings */}
        <div className="rounded-xl bg-dark-900 border border-dark-700 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Sliders size={16} className="text-accent-400" />
            <span>Execution & Playback Defaults</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Default Step Delay</p>
                <p className="text-dark-400">Time elapsed per step during automatic playback ({defaultSpeed} ms)</p>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={defaultSpeed}
                onChange={(e) => setDefaultSpeed(Number(e.target.value))}
                className="w-36 accent-accent-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dark-800">
              <div>
                <p className="text-white font-medium">Auto-play on Run</p>
                <p className="text-dark-400">Immediately begin playing animation when algorithm is executed</p>
              </div>
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="w-4 h-4 rounded accent-accent-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Display & Audio Settings */}
        <div className="rounded-xl bg-dark-900 border border-dark-700 p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Moon size={16} className="text-cyan-400" />
            <span>Theme & Accessibility</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">High Contrast Nodes</p>
                <p className="text-dark-400">Enforce maximum luminance contrast for color-blind accessibility</p>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-4 h-4 rounded accent-accent-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-dark-800">
              <div>
                <p className="text-white font-medium">Step Sound FX</p>
                <p className="text-dark-400">Play subtle acoustic ticks on state transitions and backtracks</p>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-accent-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* System Diagnostics */}
        <div className="rounded-xl bg-dark-900 border border-dark-700 p-5 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-white font-medium text-sm">
            <Shield size={16} className="text-emerald-400" />
            <span>Platform Build Info</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-dark-300 font-mono text-[11px] pt-1">
            <div className="p-2.5 rounded bg-dark-800 border border-dark-700">
              <span className="text-dark-500 block text-[9px] uppercase">Engine</span>
              Cognitia Core v1.0.0
            </div>
            <div className="p-2.5 rounded bg-dark-800 border border-dark-700">
              <span className="text-dark-500 block text-[9px] uppercase">Renderer</span>
              Konva + React 19 Canvas
            </div>
            <div className="p-2.5 rounded bg-dark-800 border border-dark-700">
              <span className="text-dark-500 block text-[9px] uppercase">Phase Status</span>
              Phase 1 & Phase 2 Complete
            </div>
            <div className="p-2.5 rounded bg-dark-800 border border-dark-700">
              <span className="text-dark-500 block text-[9px] uppercase">Algorithms Active</span>
              5 Search Implementations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
