import type { AlgorithmResult } from '../core/executor';
import { createEventFactory } from '../core/executor';
import { MinPriorityQueue } from '../utils/priorityQueue';

export interface AStarConfig {
  rows: number;
  cols: number;
  walls: Array<{ row: number; col: number }>;
  start: { row: number; col: number };
  goal: { row: number; col: number };
  /** Heuristic: 'manhattan' or 'euclidean' */
  heuristic: 'manhattan' | 'euclidean';
  /** Allow diagonal movement */
  allowDiagonal: boolean;
}

interface AStarNode {
  row: number;
  col: number;
  g: number;
  h: number;
  f: number;
}

function coordKey(row: number, col: number): string {
  return `${row},${col}`;
}

function calcHeuristic(
  r1: number, c1: number, r2: number, c2: number,
  type: 'manhattan' | 'euclidean'
): number {
  if (type === 'euclidean') {
    return Math.sqrt((r1 - r2) ** 2 + (c1 - c2) ** 2);
  }
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

/**
 * A* Search implementation on a grid.
 * Uses f(n) = g(n) + h(n) with configurable heuristic.
 */
export function executeAStar(config: AStarConfig): AlgorithmResult {
  const { rows, cols, walls, start, goal, heuristic, allowDiagonal } = config;
  const createEvent = createEventFactory();
  const events: ReturnType<typeof createEvent>[] = [];

  const startTime = performance.now();

  // Create wall set
  const wallSet = new Set<string>();
  for (const w of walls) {
    wallSet.add(coordKey(w.row, w.col));
  }

  // Directions
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // cardinal
  ];
  if (allowDiagonal) {
    directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  }

  // Initialize
  const openSet = new MinPriorityQueue<AStarNode>();
  const openSetMap = new Map<string, AStarNode>();
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, { row: number; col: number }>();
  const gValues = new Map<string, number>();

  const startH = calcHeuristic(start.row, start.col, goal.row, goal.col, heuristic);
  const startNode: AStarNode = { row: start.row, col: start.col, g: 0, h: startH, f: startH };

  openSet.push(startNode, startNode.f);
  openSetMap.set(coordKey(start.row, start.col), startNode);
  gValues.set(coordKey(start.row, start.col), 0);

  let nodesExplored = 0;
  let nodesGenerated = 1;
  let maxFrontierSize = 1;
  let solutionFound = false;
  let solutionPath: Array<{ row: number; col: number }> = [];

  events.push(createEvent(
    'node-added-to-frontier', 1,
    `Initialize open set with start (${start.row}, ${start.col}), h=${startH.toFixed(1)}, f=${startH.toFixed(1)}`,
    {
      node: { ...start, g: 0, h: startH, f: startH },
      openSet: [{ ...start, g: 0, h: startH, f: startH }],
      closedSet: [],
    }
  ));

  while (!openSet.isEmpty()) {
    maxFrontierSize = Math.max(maxFrontierSize, openSet.size());

    const current = openSet.pop()!;
    const currentKey = coordKey(current.row, current.col);
    openSetMap.delete(currentKey);

    events.push(createEvent(
      'node-removed-from-frontier', 8,
      `Expand (${current.row}, ${current.col}) – g=${current.g.toFixed(1)}, h=${current.h.toFixed(1)}, f=${current.f.toFixed(1)}`,
      {
        node: { row: current.row, col: current.col, g: current.g, h: current.h, f: current.f },
        openSet: [...openSetMap.values()].map(n => ({ row: n.row, col: n.col, g: n.g, h: n.h, f: n.f })),
        closedSet: [...closedSet].map(k => { const [r, c] = k.split(',').map(Number); return { row: r, col: c }; }),
      }
    ));

    // Check goal
    if (current.row === goal.row && current.col === goal.col) {
      // Reconstruct path
      solutionPath = [{ row: current.row, col: current.col }];
      let key = currentKey;
      while (cameFrom.has(key)) {
        const prev = cameFrom.get(key)!;
        solutionPath.unshift(prev);
        key = coordKey(prev.row, prev.col);
      }
      solutionFound = true;

      events.push(createEvent(
        'solution-found', 10,
        `Goal (${goal.row}, ${goal.col}) reached! Path length: ${solutionPath.length}, cost: ${current.g.toFixed(1)}`,
        {
          path: solutionPath,
          cost: current.g,
        }
      ));
      break;
    }

    closedSet.add(currentKey);
    nodesExplored++;

    events.push(createEvent(
      'node-visited', 11,
      `Add (${current.row}, ${current.col}) to closed set`,
      {
        node: { row: current.row, col: current.col },
        closedSet: [...closedSet].map(k => { const [r, c] = k.split(',').map(Number); return { row: r, col: c }; }),
      }
    ));

    // Expand neighbors
    for (const [dr, dc] of directions) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      const nKey = coordKey(nr, nc);

      // Bounds check
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      // Wall check
      if (wallSet.has(nKey)) continue;
      // Closed set check
      if (closedSet.has(nKey)) continue;

      const moveCost = (dr !== 0 && dc !== 0) ? Math.SQRT2 : 1;
      const tentativeG = current.g + moveCost;
      const existingG = gValues.get(nKey);

      if (existingG === undefined || tentativeG < existingG) {
        const h = calcHeuristic(nr, nc, goal.row, goal.col, heuristic);
        const f = tentativeG + h;
        const neighborNode: AStarNode = { row: nr, col: nc, g: tentativeG, h, f };

        cameFrom.set(nKey, { row: current.row, col: current.col });
        gValues.set(nKey, tentativeG);

        if (openSetMap.has(nKey)) {
          openSet.updatePriority(n => n.row === nr && n.col === nc, f);
          openSetMap.set(nKey, neighborNode);
        } else {
          openSet.push(neighborNode, f);
          openSetMap.set(nKey, neighborNode);
          nodesGenerated++;
        }

        events.push(createEvent(
          'node-added-to-frontier', 19,
          `${existingG !== undefined ? 'Update' : 'Add'} (${nr}, ${nc}) – g=${tentativeG.toFixed(1)}, h=${h.toFixed(1)}, f=${f.toFixed(1)}`,
          {
            node: { row: nr, col: nc, g: tentativeG, h, f },
            parent: { row: current.row, col: current.col },
            openSet: [...openSetMap.values()].map(n => ({ row: n.row, col: n.col, g: n.g, h: n.h, f: n.f })),
            closedSet: [...closedSet].map(k => { const [r, c] = k.split(',').map(Number); return { row: r, col: c }; }),
          }
        ));
      }
    }
  }

  const endTime = performance.now();

  if (!solutionFound) {
    events.push(createEvent(
      'no-solution', 21,
      `No path found from (${start.row}, ${start.col}) to (${goal.row}, ${goal.col})`,
      {}
    ));
  }

  events.push(createEvent(
    'execution-completed', solutionFound ? 10 : 21,
    solutionFound
      ? `A* complete. Optimal path of length ${solutionPath.length} found with cost ${(gValues.get(coordKey(goal.row, goal.col)) ?? 0).toFixed(1)}.`
      : `A* complete. No path exists.`,
    { path: solutionPath, nodesExplored, nodesGenerated }
  ));

  return {
    events,
    stats: {
      nodesExplored,
      nodesGenerated,
      maxFrontierSize,
      executionTimeMs: endTime - startTime,
      solutionCost: solutionFound ? gValues.get(coordKey(goal.row, goal.col)) ?? null : null,
      pathLength: solutionFound ? solutionPath.length : null,
      iterations: nodesExplored,
      success: solutionFound,
    },
  };
}
