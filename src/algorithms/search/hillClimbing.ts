import type { Graph } from '../../types';
import type { AlgorithmResult } from '../core/executor';
import { createEventFactory } from '../core/executor';

export interface HillClimbingConfig {
  graph: Graph;
  startNodeId: string;
  /** If true, we minimize heuristic. If false, we maximize value. */
  minimize: boolean;
}

/**
 * Hill Climbing (Steepest Ascent) implementation.
 * Greedily moves to the best neighbor until a local optimum is reached.
 */
export function executeHillClimbing(config: HillClimbingConfig): AlgorithmResult {
  const { graph, startNodeId, minimize } = config;
  const createEvent = createEventFactory();
  const events: ReturnType<typeof createEvent>[] = [];

  const startTime = performance.now();

  // Build adjacency list and value map
  const adjacency = new Map<string, string[]>();
  const nodeValues = new Map<string, number>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
    nodeValues.set(node.id, node.heuristic ?? node.value ?? 0);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  }

  let currentNode = startNodeId;
  let currentValue = nodeValues.get(currentNode) ?? 0;
  const path: string[] = [currentNode];
  let iterations = 0;
  let isLocalOptimum = false;
  let nodesExplored = 1;

  events.push(createEvent(
    'current-state-changed', 1,
    `Start at node "${currentNode}" with value ${currentValue}`,
    { currentNode, currentValue, path: [...path] }
  ));

  while (true) {
    iterations++;
    const neighbors = adjacency.get(currentNode) || [];
    const neighborData = neighbors.map(id => ({
      id,
      value: nodeValues.get(id) ?? 0,
    }));

    events.push(createEvent(
      'neighbor-evaluated', 3,
      `Evaluate ${neighborData.length} neighbors of "${currentNode}": ${neighborData.map(n => `${n.id}(${n.value})`).join(', ')}`,
      {
        currentNode,
        currentValue,
        neighbors: neighborData,
      }
    ));

    if (neighborData.length === 0) {
      isLocalOptimum = true;
      events.push(createEvent(
        'local-optimum-detected', 4,
        `No neighbors available. Stuck at "${currentNode}" with value ${currentValue}`,
        { currentNode, currentValue, reason: 'no-neighbors' }
      ));
      break;
    }

    // Find best neighbor
    const bestNeighbor = minimize
      ? neighborData.reduce((best, n) => n.value < best.value ? n : best)
      : neighborData.reduce((best, n) => n.value > best.value ? n : best);

    const isBetter = minimize
      ? bestNeighbor.value < currentValue
      : bestNeighbor.value > currentValue;

    if (!isBetter) {
      isLocalOptimum = true;
      events.push(createEvent(
        'local-optimum-detected', 7,
        `Local optimum reached at "${currentNode}" (value: ${currentValue}). Best neighbor "${bestNeighbor.id}" (value: ${bestNeighbor.value}) is not better.`,
        {
          currentNode,
          currentValue,
          bestNeighbor,
          reason: 'no-improvement',
        }
      ));
      break;
    }

    // Move to best neighbor
    currentNode = bestNeighbor.id;
    currentValue = bestNeighbor.value;
    path.push(currentNode);
    nodesExplored++;

    events.push(createEvent(
      'current-state-changed', 9,
      `Move to "${currentNode}" with ${minimize ? 'lower' : 'higher'} value ${currentValue}`,
      {
        currentNode,
        currentValue,
        selectedNeighbor: bestNeighbor,
        path: [...path],
      }
    ));
  }

  const endTime = performance.now();

  events.push(createEvent(
    'execution-completed', isLocalOptimum ? 7 : 9,
    `Hill Climbing complete. Final state: "${currentNode}" with value ${currentValue}. ${isLocalOptimum ? 'Reached local optimum.' : 'Goal reached.'}`,
    {
      finalNode: currentNode,
      finalValue: currentValue,
      path: [...path],
      isLocalOptimum,
      iterations,
    }
  ));

  return {
    events,
    stats: {
      nodesExplored,
      nodesGenerated: nodesExplored,
      maxFrontierSize: 1,
      executionTimeMs: endTime - startTime,
      solutionCost: currentValue,
      pathLength: path.length,
      iterations,
      success: !isLocalOptimum || path.length > 1,
    },
  };
}
