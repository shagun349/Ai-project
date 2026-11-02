import type { ExecutionEvent, ExecutionStats } from '../../types';

export type RoverAlgorithm = 'dfs' | 'generate-and-test' | 'hill-climbing' | 'beam-search' | 'best-first' | 'a-star';
export type TerrainKind = 'smooth' | 'sand' | 'rocky' | 'blocked';
export interface RoverTerrain { rows: number; cols: number; cells: TerrainKind[][]; start: Point; goal: Point; }
export interface Point { row: number; col: number; }
export interface RoverSearchResult { events: ExecutionEvent[]; stats: ExecutionStats; }

const key = (p: Point) => `${p.row},${p.col}`;
const fromKey = (value: string): Point => { const [row, col] = value.split(',').map(Number); return { row, col }; };
const costOf = (kind: TerrainKind) => kind === 'sand' ? 3 : kind === 'rocky' ? 5 : 1;
const distance = (a: Point, b: Point) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
const directions = [{ row: -1, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 0 }, { row: 0, col: -1 }];

export function runRoverSearch(terrain: RoverTerrain, algorithm: RoverAlgorithm): RoverSearchResult {
  if (algorithm === 'generate-and-test' || algorithm === 'hill-climbing' || algorithm === 'beam-search') {
    return runAdditionalSearch(terrain, algorithm);
  }
  const events: ExecutionEvent[] = [];
  const begun = performance.now();
  const emit = (type: ExecutionEvent['type'], pseudocodeLine: number, description: string, data: Record<string, unknown> = {}) =>
    events.push({ type, stepIndex: events.length, pseudocodeLine, description, data, timestamp: performance.now() });
  const neighbors = (point: Point) => directions
    .map(direction => ({ row: point.row + direction.row, col: point.col + direction.col }))
    .filter(point => point.row >= 0 && point.row < terrain.rows && point.col >= 0 && point.col < terrain.cols && terrain.cells[point.row][point.col] !== 'blocked');
  const scoreData = (point: Point, g: number) => {
    if (algorithm === 'a-star') {
      const h = distance(point, terrain.goal);
      return { g, h, f: g + h };
    }
    if (algorithm === 'best-first') return { h: distance(point, terrain.goal) };
    return {};
  };

  const frontier: Point[] = [terrain.start];
  const frontierSet = new Set([key(terrain.start)]);
  const explored = new Set<string>();
  const parent = new Map<string, string>();
  const gScore = new Map<string, number>([[key(terrain.start), 0]]);
  let generated = 1;
  let maxFrontier = 1;
  let finalPath: Point[] = [];

  emit('node-added-to-frontier', 1, 'Start point added to the frontier.', { cell: terrain.start, ...scoreData(terrain.start, 0), reason: 'The start point is the initial route state.' });

  while (frontier.length) {
    if (algorithm === 'best-first') frontier.sort((a, b) => distance(a, terrain.goal) - distance(b, terrain.goal));
    if (algorithm === 'a-star') frontier.sort((a, b) => (gScore.get(key(a))! + distance(a, terrain.goal)) - (gScore.get(key(b))! + distance(b, terrain.goal)));
    const current = algorithm === 'dfs' ? frontier.pop()! : frontier.shift()!;
    const currentKey = key(current);
    frontierSet.delete(currentKey);
    if (explored.has(currentKey)) continue;

    const g = gScore.get(currentKey) ?? 0;
    const h = distance(current, terrain.goal);
    emit('node-removed-from-frontier', 4, algorithm === 'a-star'
      ? `Selected ${currentKey}: its f(n) = ${g + h} is lowest in the frontier.`
      : algorithm === 'best-first' ? `Selected ${currentKey}: it is closest to the destination by h(n) = ${h}.` : `Selected ${currentKey}: DFS follows the newest branch first.`,
      { cell: current, ...scoreData(current, g), reason: algorithm === 'a-star' ? 'Lowest f(n) = g(n) + h(n).' : algorithm === 'best-first' ? 'Lowest estimated distance h(n).' : 'Most recently discovered state.' });

    explored.add(currentKey);
    emit('node-visited', 5, `Expanded ${currentKey}; inspecting valid neighboring terrain.`, { cell: current, ...scoreData(current, g) });

    if (currentKey === key(terrain.goal)) {
      let cursor = currentKey;
      while (cursor) { finalPath.unshift(fromKey(cursor)); cursor = parent.get(cursor) ?? ''; }
      const totalCost = gScore.get(currentKey) ?? 0;
      emit('solution-found', 9, `Destination reached. The route contains ${finalPath.length} road segments at a total driving cost of ${totalCost}.`, { path: finalPath, cost: totalCost });
      finalPath.slice(1).forEach((cell, index) => emit('state-updated', 10, `EV drives to ${key(cell)} along the confirmed route.`, { rover: cell, pathIndex: index + 1 }));
      break;
    }

    for (const next of neighbors(current)) {
      const nextKey = key(next);
      const nextCost = g + costOf(terrain.cells[next.row][next.col]);
      if (explored.has(nextKey)) {
        emit('neighbor-evaluated', 6, `${nextKey} was rejected because it has already been expanded.`, { cell: next, rejected: true, reason: 'Already explored.' });
        continue;
      }
      const previous = gScore.get(nextKey);
      if (previous !== undefined && previous <= nextCost) {
        emit('neighbor-evaluated', 6, `${nextKey} was rejected because its known route costs less.`, { cell: next, rejected: true, reason: 'No lower-cost route found.' });
        continue;
      }
      parent.set(nextKey, currentKey);
      gScore.set(nextKey, nextCost);
      if (!frontierSet.has(nextKey)) { frontier.push(next); frontierSet.add(nextKey); generated++; }
      emit('node-added-to-frontier', 7, `Added ${nextKey} to the frontier (terrain cost ${costOf(terrain.cells[next.row][next.col])}).`, { cell: next, parent: current, ...scoreData(next, nextCost), reason: 'Traversable neighbor with an improved route.' });
    }
    maxFrontier = Math.max(maxFrontier, frontierSet.size);
  }

  const success = finalPath.length > 0;
  if (!success) emit('no-solution', 11, 'The frontier is empty: no road route to the destination exists.', {});
  emit('execution-completed', 12, success ? 'Search complete. Review the final route and exploration trace.' : 'Search complete without a route.', {});
  return { events, stats: { nodesExplored: explored.size, nodesGenerated: generated, maxFrontierSize: maxFrontier, executionTimeMs: performance.now() - begun, solutionCost: success ? gScore.get(key(terrain.goal)) ?? null : null, pathLength: success ? finalPath.length : null, iterations: explored.size, success } };
}

function runAdditionalSearch(terrain: RoverTerrain, algorithm: 'generate-and-test' | 'hill-climbing' | 'beam-search'): RoverSearchResult {
  const events: ExecutionEvent[] = [];
  const begun = performance.now();
  const emit = (type: ExecutionEvent['type'], pseudocodeLine: number, description: string, data: Record<string, unknown> = {}) =>
    events.push({ type, stepIndex: events.length, pseudocodeLine, description, data, timestamp: performance.now() });
  const neighbors = (point: Point) => directions.map(direction => ({ row: point.row + direction.row, col: point.col + direction.col }))
    .filter(point => point.row >= 0 && point.row < terrain.rows && point.col >= 0 && point.col < terrain.cols && terrain.cells[point.row][point.col] !== 'blocked');
  const emitRoute = (path: Point[], cost: number) => {
    emit('solution-found', 9, `Destination reached. Candidate route has ${path.length} road segments and cost ${cost}.`, { path, cost });
    path.slice(1).forEach((cell, index) => emit('state-updated', 10, `EV drives to ${key(cell)} along the confirmed route.`, { rover: cell, pathIndex: index + 1 }));
  };
  const explored = new Set<string>();
  let generated = 1;
  let maxFrontier = 1;
  let finalPath: Point[] = [];
  let solutionCost: number | null = null;

  if (algorithm === 'hill-climbing') {
    let current = terrain.start;
    let currentCost = 0;
    const route = [current];
    emit('node-added-to-frontier', 1, 'Landing site is the initial local-search state.', { cell: current, h: distance(current, terrain.goal) });
    for (let iteration = 0; iteration < terrain.rows * terrain.cols; iteration++) {
      const currentKey = key(current);
      emit('node-removed-from-frontier', 3, `Evaluate ${currentKey} with h(n) = ${distance(current, terrain.goal)}.`, { cell: current, h: distance(current, terrain.goal) });
      explored.add(currentKey);
      emit('node-visited', 4, `Current local-search position is ${currentKey}.`, { cell: current, h: distance(current, terrain.goal) });
      if (currentKey === key(terrain.goal)) { finalPath = route; solutionCost = currentCost; emitRoute(route, currentCost); break; }
      const candidates = neighbors(current).filter(point => !explored.has(key(point))).sort((a, b) => distance(a, terrain.goal) - distance(b, terrain.goal));
      const next = candidates[0];
      if (!next || distance(next, terrain.goal) >= distance(current, terrain.goal)) {
        emit('local-optimum-detected', 7, 'No unvisited neighbor improves h(n); hill climbing stopped at a local optimum.', { cell: current });
        break;
      }
      generated += candidates.length;
      candidates.forEach(point => emit('neighbor-evaluated', 5, `Neighbor ${key(point)} has h(n) = ${distance(point, terrain.goal)}.`, { cell: point, h: distance(point, terrain.goal) }));
      currentCost += costOf(terrain.cells[next.row][next.col]);
      emit('node-added-to-frontier', 6, `Move uphill toward the goal: ${key(next)} has the lowest h(n).`, { cell: next, h: distance(next, terrain.goal) });
      current = next;
      route.push(next);
    }
  } else if (algorithm === 'beam-search') {
    const width = 3;
    let beam: Point[][] = [[terrain.start]];
    emit('node-added-to-frontier', 1, `Initialize beam with start point (beam width ${width}).`, { cell: terrain.start, h: distance(terrain.start, terrain.goal) });
    for (let depth = 0; beam.length && depth < terrain.rows * terrain.cols; depth++) {
      const candidates: Point[][] = [];
      for (const route of beam) {
        const current = route[route.length - 1];
        emit('node-removed-from-frontier', 3, `Expand beam candidate ${key(current)} at depth ${depth}.`, { cell: current, h: distance(current, terrain.goal) });
        if (!explored.has(key(current))) { explored.add(key(current)); emit('node-visited', 4, `Marked ${key(current)} explored.`, { cell: current, h: distance(current, terrain.goal) }); }
        if (key(current) === key(terrain.goal)) { finalPath = route; solutionCost = route.slice(1).reduce((sum, point) => sum + costOf(terrain.cells[point.row][point.col]), 0); break; }
        neighbors(current).filter(point => !route.some(item => key(item) === key(point))).forEach(point => {
          candidates.push([...route, point]); generated++;
          emit('node-added-to-frontier', 6, `Generated beam candidate ${key(point)} with h(n) = ${distance(point, terrain.goal)}.`, { cell: point, h: distance(point, terrain.goal) });
        });
      }
      if (finalPath.length) { emitRoute(finalPath, solutionCost!); break; }
      const rankedCandidates = candidates.sort((a, b) => distance(a[a.length - 1], terrain.goal) - distance(b[b.length - 1], terrain.goal));
      beam = rankedCandidates.slice(0, width);
      rankedCandidates.slice(width).forEach(route => {
        const pruned = route[route.length - 1];
        emit('neighbor-evaluated', 7, `Pruned ${key(pruned)}: it fell outside the beam width of ${width}.`, { cell: pruned, rejected: true, h: distance(pruned, terrain.goal) });
      });
      maxFrontier = Math.max(maxFrontier, beam.length);
      emit('state-updated', 7, `Retained the ${beam.length} best candidates for the next beam level.`, {});
    }
  } else {
    const candidates: Point[][] = [[terrain.start]];
    emit('candidate-generated', 1, 'Generated the initial candidate route at the start point.', { cell: terrain.start });
    while (candidates.length && generated < 800) {
      const route = candidates.pop()!;
      const current = route[route.length - 1];
      emit('node-removed-from-frontier', 3, `Test candidate route ending at ${key(current)}.`, { cell: current });
      emit('candidate-tested', 4, `Candidate ${key(current)} is ${key(current) === key(terrain.goal) ? 'a solution' : 'not yet a solution'}.`, { cell: current });
      if (!explored.has(key(current))) { explored.add(key(current)); emit('node-visited', 5, `Recorded ${key(current)} as tested.`, { cell: current }); }
      if (key(current) === key(terrain.goal)) { finalPath = route; solutionCost = route.slice(1).reduce((sum, point) => sum + costOf(terrain.cells[point.row][point.col]), 0); emitRoute(route, solutionCost); break; }
      neighbors(current).filter(point => !route.some(item => key(item) === key(point))).forEach(point => {
        candidates.push([...route, point]); generated++;
        emit('candidate-generated', 6, `Generated a candidate route through ${key(point)}.`, { cell: point });
        emit('node-added-to-frontier', 6, `Candidate ending at ${key(point)} is waiting to be tested.`, { cell: point });
      });
      maxFrontier = Math.max(maxFrontier, candidates.length);
    }
  }
  const success = finalPath.length > 0;
  if (!success) emit('no-solution', 11, algorithm === 'hill-climbing' ? 'Hill climbing stopped without reaching the destination.' : 'No candidate route reached the destination.', {});
  emit('execution-completed', 12, success ? 'Search complete. Review the explored states and confirmed route.' : 'Search complete without a route.', {});
  return { events, stats: { nodesExplored: explored.size, nodesGenerated: generated, maxFrontierSize: maxFrontier, executionTimeMs: performance.now() - begun, solutionCost, pathLength: success ? finalPath.length : null, iterations: explored.size, success } };
}

export function createRoverTerrain(rows = 10, cols = 14): RoverTerrain {
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'smooth' as TerrainKind));
  [[1, 3], [2, 3], [3, 3], [5, 2], [5, 3], [5, 4], [6, 9], [7, 9], [8, 9], [3, 10], [4, 10]].forEach(([row, col]) => { if (row < rows && col < cols) cells[row][col] = 'blocked'; });
  [[1, 7], [2, 7], [4, 5], [6, 5], [7, 6]].forEach(([row, col]) => { if (row < rows && col < cols) cells[row][col] = 'sand'; });
  [[1, 9], [2, 9], [4, 8], [6, 7]].forEach(([row, col]) => { if (row < rows && col < cols) cells[row][col] = 'rocky'; });
  return { rows, cols, cells, start: { row: 1, col: 1 }, goal: { row: rows - 2, col: cols - 2 } };
}
