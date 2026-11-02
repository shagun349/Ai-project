import { useState, useCallback, useRef, useEffect } from 'react';
import type { ExecutionEvent, ExecutionState, ExecutionStats } from '../types';

const defaultStats: ExecutionStats = {
  nodesExplored: 0,
  nodesGenerated: 0,
  maxFrontierSize: 0,
  executionTimeMs: 0,
  solutionCost: null,
  pathLength: null,
  iterations: 0,
  success: false,
};

export function useAlgorithmExecution() {
  const [state, setState] = useState<ExecutionState>({
    status: 'idle',
    currentStepIndex: -1,
    totalSteps: 0,
    events: [],
    startTime: null,
    endTime: null,
    stats: defaultStats,
  });

  const [speed, setSpeed] = useState(500); // ms per step
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsRef = useRef<ExecutionEvent[]>([]);
  const statsRef = useRef<ExecutionStats>(defaultStats);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Load events from an algorithm execution result. */
  const loadExecution = useCallback((events: ExecutionEvent[], stats: ExecutionStats) => {
    clearTimer();
    eventsRef.current = events;
    statsRef.current = stats;
    setState({
      status: 'idle',
      currentStepIndex: -1,
      totalSteps: events.length,
      events,
      startTime: null,
      endTime: null,
      stats,
    });
  }, [clearTimer]);

  /** Start or resume auto-playback. */
  const play = useCallback(() => {
    setState(prev => {
      if (prev.status === 'completed') return prev;

      const newState = {
        ...prev,
        status: 'running' as const,
        startTime: prev.startTime ?? Date.now(),
      };

      clearTimer();
      timerRef.current = setInterval(() => {
        setState(curr => {
          if (curr.status !== 'running') return curr;
          const nextIndex = curr.currentStepIndex + 1;
          if (nextIndex >= curr.totalSteps) {
            clearTimer();
            return {
              ...curr,
              status: 'completed',
              currentStepIndex: curr.totalSteps - 1,
              endTime: Date.now(),
            };
          }
          return {
            ...curr,
            currentStepIndex: nextIndex,
          };
        });
      }, speed);

      return newState;
    });
  }, [speed, clearTimer]);

  /** Pause execution. */
  const pause = useCallback(() => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: prev.status === 'running' ? 'paused' : prev.status,
    }));
  }, [clearTimer]);

  /** Step forward one event. */
  const stepForward = useCallback(() => {
    setState(prev => {
      if (prev.currentStepIndex >= prev.totalSteps - 1) {
        return { ...prev, status: 'completed', endTime: Date.now() };
      }
      return {
        ...prev,
        status: 'paused',
        currentStepIndex: prev.currentStepIndex + 1,
        startTime: prev.startTime ?? Date.now(),
      };
    });
  }, []);

  /** Step backward one event. */
  const stepBackward = useCallback(() => {
    setState(prev => {
      if (prev.currentStepIndex <= 0) return prev;
      return {
        ...prev,
        status: 'paused',
        currentStepIndex: prev.currentStepIndex - 1,
      };
    });
  }, []);

  /** Reset execution to initial state. */
  const reset = useCallback(() => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: 'idle',
      currentStepIndex: -1,
      startTime: null,
      endTime: null,
    }));
  }, [clearTimer]);

  /** Remove an old execution before the graph, terrain, or algorithm changes. */
  const clearExecution = useCallback(() => {
    clearTimer();
    eventsRef.current = [];
    statsRef.current = defaultStats;
    setState({
      status: 'idle',
      currentStepIndex: -1,
      totalSteps: 0,
      events: [],
      startTime: null,
      endTime: null,
      stats: defaultStats,
    });
  }, [clearTimer]);

  /** Jump to a specific step. */
  const jumpToStep = useCallback((stepIndex: number) => {
    clearTimer();
    setState(prev => ({
      ...prev,
      status: 'paused',
      currentStepIndex: Math.max(-1, Math.min(stepIndex, prev.totalSteps - 1)),
    }));
  }, [clearTimer]);

  /** Get the current event. */
  const currentEvent = state.currentStepIndex >= 0 && state.currentStepIndex < state.events.length
    ? state.events[state.currentStepIndex]
    : null;

  /** Get all events up to and including current step. */
  const visibleEvents = state.events.slice(0, state.currentStepIndex + 1);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Update interval when speed changes
  useEffect(() => {
    if (state.status === 'running') {
      clearTimer();
      timerRef.current = setInterval(() => {
        setState(curr => {
          if (curr.status !== 'running') return curr;
          const nextIndex = curr.currentStepIndex + 1;
          if (nextIndex >= curr.totalSteps) {
            clearTimer();
            return {
              ...curr,
              status: 'completed',
              currentStepIndex: curr.totalSteps - 1,
              endTime: Date.now(),
            };
          }
          return { ...curr, currentStepIndex: nextIndex };
        });
      }, speed);
    }
  }, [speed, state.status, clearTimer]);

  return {
    state,
    speed,
    setSpeed,
    loadExecution,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    clearExecution,
    jumpToStep,
    currentEvent,
    visibleEvents,
  };
}
