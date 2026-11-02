import type { Graph } from '../../types';
import type { AlgorithmResult } from '../core/executor';
import { createEventFactory } from '../core/executor';
import { MinPriorityQueue } from '../utils/priorityQueue';

export interface BestFirstSearchConfig {
  graph: Graph;
  startNodeId: string;
  goalNodeId: string;
}

/**
 * Best First Search (Greedy Best-First Search) implementation.
 * Expands the node with the lowest heuristic value first.
 */
export function executeBestFirstSearch(config: BestFirstSearchConfig): AlgorithmResult {
  const { graph, startNodeId, goalNodeId } = config;
  const createEvent = createEventFactory();
  const events: ReturnType<typeof createEvent>[] = [];

  const startTime = performance.now();

  // Build adjacency list and heuristic map
  const adjacency = new Map<string, Array<{ id: string; weight: number }>>();
  const heuristics = new Map<string, number>();

  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
    heuristics.set(node.id, node.heuristic ?? 0);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push({ id: edge.target, weight: edge.weight });
    adjacency.get(edge.target)?.push({ id: edge.source, weight: edge.weight });
  }

  const frontier = new MinPriorityQueue<string>();
  const explored = new Set<string>();
  const parent = new Map<string, string | null>();
  const inFrontier = new Set<string>();

  frontier.push(startNodeId, heuristics.get(startNodeId) ?? 0);
  inFrontier.add(startNodeId);
  parent.set(startNodeId, null);

  let nodesExplored = 0;
  let nodesGenerated = 1;
  let maxFrontierSize = 1;
  let solutionFound = false;
  let solutionPath: string[] = [];

  events.push(createEvent(
    'node-added-to-frontier', 2,
    `Initialize frontier with start node "${startNodeId}" (h=${heuristics.get(startNodeId)})`,
    {
      frontier: [{ id: startNodeId, h: heuristics.get(startNodeId) }],
      explored: [],
    }
  ));

  while (!frontier.isEmpty()) {
    maxFrontierSize = Math.max(maxFrontierSize, frontier.size());

    const node = frontier.pop()!;
    inFrontier.delete(node);

    events.push(createEvent(
      'node-removed-from-frontier', 6,
      `Remove "${node}" from frontier (h=${heuristics.get(node)})`,
      {
        node,
        heuristic: heuristics.get(node),
        frontier: frontier.toArray().map(id => ({ id, h: heuristics.get(id) })),
        explored: [...explored],
      }
    ));

    if (node === goalNodeId) {
      // Reconstruct path
      solutionPath = [];
      let current: string | null = node;
      while (current !== null) {
        solutionPath.unshift(current);
        current = parent.get(current) ?? null;
      }
      solutionFound = true;

      events.push(createEvent(
        'solution-found', 8,
        `Goal "${goalNodeId}" found! Path: ${solutionPath.join(' → ')}`,
        { path: solutionPath, node }
      ));
      break;
    }

    explored.add(node);
    nodesExplored++;

    events.push(createEvent(
      'node-visited', 9,
      `Mark "${node}" as explored`,
      { node, explored: [...explored] }
    ));

    const neighbors = adjacency.get(node) || [];
    for (const neighbor of neighbors) {
      if (!explored.has(neighbor.id) && !inFrontier.has(neighbor.id)) {
        parent.set(neighbor.id, node);
        const h = heuristics.get(neighbor.id) ?? 0;
        frontier.push(neighbor.id, h);
        inFrontier.add(neighbor.id);
        nodesGenerated++;

        events.push(createEvent(
          'node-added-to-frontier', 13,
          `Add "${neighbor.id}" to frontier (h=${h}, parent: "${node}")`,
          {
            node: neighbor.id,
            heuristic: h,
            parent: node,
            frontier: frontier.toArray().map(id => ({ id, h: heuristics.get(id) })),
            explored: [...explored],
          }
        ));
      }
    }
  }

  const endTime = performance.now();

  if (!solutionFound) {
    events.push(createEvent(
      'no-solution', 14,
      `No path found from "${startNodeId}" to "${goalNodeId}"`,
      { explored: [...explored] }
    ));
  }

  events.push(createEvent(
    'execution-completed', solutionFound ? 8 : 14,
    solutionFound
      ? `Best First Search complete. Path of length ${solutionPath.length} found.`
      : `Best First Search complete. No solution exists.`,
    { path: solutionPath, nodesExplored, nodesGenerated }
  ));

  return {
    events,
    stats: {
      nodesExplored,
      nodesGenerated,
      maxFrontierSize,
      executionTimeMs: endTime - startTime,
      solutionCost: solutionFound ? solutionPath.length - 1 : null,
      pathLength: solutionFound ? solutionPath.length : null,
      iterations: nodesExplored,
      success: solutionFound,
    },
  };
}
