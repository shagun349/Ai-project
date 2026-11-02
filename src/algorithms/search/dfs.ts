import type { Graph } from '../../types';
import type { AlgorithmResult } from '../core/executor';
import { createEventFactory } from '../core/executor';

export interface DFSConfig {
  graph: Graph;
  startNodeId: string;
  goalNodeId: string;
}

/**
 * Depth First Search implementation.
 * Uses an explicit stack to explore the graph depth-first.
 * Produces execution events for each step of the search.
 */
export function executeDFS(config: DFSConfig): AlgorithmResult {
  const { graph, startNodeId, goalNodeId } = config;
  const createEvent = createEventFactory();
  const events: ReturnType<typeof createEvent>[] = [];

  const startTime = performance.now();

  // Build adjacency list
  const adjacency = new Map<string, Array<{ id: string; weight: number }>>();
  for (const node of graph.nodes) {
    adjacency.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push({ id: edge.target, weight: edge.weight });
    adjacency.get(edge.target)?.push({ id: edge.source, weight: edge.weight });
  }

  const visited = new Set<string>();
  const parent = new Map<string, string | null>();
  const stack: string[] = [startNodeId];
  parent.set(startNodeId, null);

  let nodesExplored = 0;
  let nodesGenerated = 1;
  let maxFrontierSize = 1;
  let solutionFound = false;
  let solutionPath: string[] = [];

  events.push(createEvent(
    'node-added-to-frontier', 1,
    `Initialize stack with start node "${startNodeId}"`,
    { stack: [startNodeId], visited: [] }
  ));

  while (stack.length > 0) {
    maxFrontierSize = Math.max(maxFrontierSize, stack.length);

    const node = stack.pop()!;

    events.push(createEvent(
      'node-removed-from-frontier', 5,
      `Pop "${node}" from stack`,
      { node, stack: [...stack], visited: [...visited] }
    ));

    // Check if goal
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
        'solution-found', 7,
        `Goal "${goalNodeId}" found! Path: ${solutionPath.join(' → ')}`,
        { path: solutionPath, node }
      ));
      break;
    }

    if (visited.has(node)) {
      events.push(createEvent(
        'backtracking', 8,
        `"${node}" already visited, skip`,
        { node, visited: [...visited] }
      ));
      continue;
    }

    visited.add(node);
    nodesExplored++;

    events.push(createEvent(
      'node-visited', 9,
      `Visit "${node}" – mark as explored`,
      { node, visited: [...visited], stack: [...stack] }
    ));

    // Get neighbors (reverse for correct DFS order)
    const neighbors = adjacency.get(node) || [];
    const unvisitedNeighbors = neighbors.filter(n => !visited.has(n.id));

    for (const neighbor of unvisitedNeighbors.reverse()) {
      if (!visited.has(neighbor.id)) {
        if (!parent.has(neighbor.id)) {
          parent.set(neighbor.id, node);
        }
        stack.push(neighbor.id);
        nodesGenerated++;

        events.push(createEvent(
          'node-added-to-frontier', 13,
          `Push "${neighbor.id}" onto stack (parent: "${node}")`,
          {
            node: neighbor.id,
            parent: node,
            stack: [...stack],
            visited: [...visited],
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
      { visited: [...visited] }
    ));
  }

  events.push(createEvent(
    'execution-completed', solutionFound ? 7 : 14,
    solutionFound
      ? `DFS complete. Path found with ${solutionPath.length} nodes.`
      : `DFS complete. No solution exists.`,
    {
      path: solutionPath,
      nodesExplored,
      nodesGenerated,
    }
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
