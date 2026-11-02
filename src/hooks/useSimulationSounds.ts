import { useCallback, useEffect, useRef, useState } from 'react';

export type SimulationSound = 'start' | 'frontier' | 'expand' | 'visit' | 'reject' | 'success' | 'failure' | 'pause';

const soundSettings: Record<SimulationSound, { frequency: number; duration: number; volume: number; type: OscillatorType }> = {
  start: { frequency: 520, duration: 0.08, volume: 0.05, type: 'sine' },
  frontier: { frequency: 440, duration: 0.035, volume: 0.025, type: 'sine' },
  expand: { frequency: 600, duration: 0.05, volume: 0.035, type: 'triangle' },
  visit: { frequency: 350, duration: 0.035, volume: 0.02, type: 'sine' },
  reject: { frequency: 170, duration: 0.06, volume: 0.03, type: 'sawtooth' },
  success: { frequency: 740, duration: 0.15, volume: 0.055, type: 'sine' },
  failure: { frequency: 135, duration: 0.14, volume: 0.04, type: 'triangle' },
  pause: { frequency: 280, duration: 0.05, volume: 0.025, type: 'sine' },
};

export function useSimulationSounds() {
  const [enabled, setEnabled] = useState(true);
  const contextRef = useRef<AudioContext | null>(null);

  const play = useCallback((sound: SimulationSound) => {
    if (!enabled || typeof window === 'undefined') return;
    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;
    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;
    if (context.state === 'suspended') void context.resume();
    const setting = soundSettings[sound];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = setting.type;
    oscillator.frequency.setValueAtTime(setting.frequency, context.currentTime);
    gain.gain.setValueAtTime(setting.volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + setting.duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + setting.duration);
  }, [enabled]);

  useEffect(() => () => { void contextRef.current?.close(); }, []);
  return { enabled, setEnabled, play };
}
