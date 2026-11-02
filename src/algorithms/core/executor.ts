import type { ExecutionEvent, ExecutionStats } from '../../types';

/**
 * Result of running an algorithm to completion.
 * Contains the full sequence of execution events for step-by-step replay.
 */
export interface AlgorithmResult {
  events: ExecutionEvent[];
  stats: ExecutionStats;
}

/**
 * Base interface for all algorithm executors.
 * Algorithms produce a list of execution events which the visualization layer replays.
 */
export interface AlgorithmExecutor<TConfig> {
  /** Run the algorithm with given config and return all execution events. */
  execute(config: TConfig): AlgorithmResult;
}

/** Helper to create execution events with incrementing step index. */
export function createEventFactory() {
  let stepIndex = 0;
  return function createEvent(
    type: ExecutionEvent['type'],
    pseudocodeLine: number,
    description: string,
    data: Record<string, unknown> = {}
  ): ExecutionEvent {
    return {
      type,
      stepIndex: stepIndex++,
      pseudocodeLine,
      description,
      data,
      timestamp: Date.now(),
    };
  };
}
