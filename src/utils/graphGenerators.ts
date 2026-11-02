import type { Graph } from '../types';

/** Generates a default graph for DFS/BFS/Best First Search demonstrations. */
export function generateDefaultSearchGraph(): Graph {
  return {
    nodes: [
      { id: 'A', label: 'A', x: 300, y: 50, heuristic: 6 },
      { id: 'B', label: 'B', x: 150, y: 150, heuristic: 4 },
      { id: 'C', label: 'C', x: 450, y: 150, heuristic: 5 },
      { id: 'D', label: 'D', x: 80, y: 270, heuristic: 3 },
      { id: 'E', label: 'E', x: 230, y: 270, heuristic: 2 },
      { id: 'F', label: 'F', x: 370, y: 270, heuristic: 4 },
      { id: 'G', label: 'G', x: 520, y: 270, heuristic: 6 },
      { id: 'H', label: 'H', x: 160, y: 390, heuristic: 1 },
      { id: 'I', label: 'I', x: 300, y: 390, heuristic: 0 },
    ],
    edges: [
      { source: 'A', target: 'B', weight: 2 },
      { source: 'A', target: 'C', weight: 3 },
      { source: 'B', target: 'D', weight: 1 },
      { source: 'B', target: 'E', weight: 4 },
      { source: 'C', target: 'F', weight: 2 },
      { source: 'C', target: 'G', weight: 5 },
      { source: 'D', target: 'H', weight: 3 },
      { source: 'E', target: 'I', weight: 2 },
      { source: 'E', target: 'H', weight: 1 },
      { source: 'F', target: 'I', weight: 3 },
    ],
  };
}

/** Generates a default graph for Hill Climbing. */
export function generateHillClimbingGraph(): Graph {
  return {
    nodes: [
      { id: 'S', label: 'S', x: 60, y: 200, heuristic: 10 },
      { id: 'A', label: 'A', x: 180, y: 100, heuristic: 8 },
      { id: 'B', label: 'B', x: 180, y: 300, heuristic: 12 },
      { id: 'C', label: 'C', x: 320, y: 60, heuristic: 5 },
      { id: 'D', label: 'D', x: 320, y: 200, heuristic: 7 },
      { id: 'E', label: 'E', x: 320, y: 340, heuristic: 9 },
      { id: 'F', label: 'F', x: 460, y: 100, heuristic: 3 },
      { id: 'G', label: 'G', x: 460, y: 250, heuristic: 4 },
      { id: 'H', label: 'H', x: 580, y: 180, heuristic: 2 },
    ],
    edges: [
      { source: 'S', target: 'A', weight: 1 },
      { source: 'S', target: 'B', weight: 1 },
      { source: 'A', target: 'C', weight: 1 },
      { source: 'A', target: 'D', weight: 1 },
      { source: 'B', target: 'D', weight: 1 },
      { source: 'B', target: 'E', weight: 1 },
      { source: 'C', target: 'F', weight: 1 },
      { source: 'D', target: 'G', weight: 1 },
      { source: 'F', target: 'H', weight: 1 },
      { source: 'G', target: 'H', weight: 1 },
    ],
  };
}

/** Generate a random graph with n nodes. */
export function generateRandomGraph(nodeCount: number, edgeDensity: number = 0.3): Graph {
  const nodes: Graph['nodes'] = [];
  const edges: Graph['edges'] = [];

  const cols = Math.ceil(Math.sqrt(nodeCount));
  const spacing = 120;

  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const label = String.fromCharCode(65 + i);  // A, B, C...
    nodes.push({
      id: label,
      label,
      x: col * spacing + 80 + (Math.random() - 0.5) * 30,
      y: row * spacing + 60 + (Math.random() - 0.5) * 30,
      heuristic: Math.floor(Math.random() * 15),
    });
  }

  // Generate edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() < edgeDensity) {
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          weight: Math.floor(Math.random() * 9) + 1,
        });
      }
    }
  }

  // Ensure connectivity – add edges to make a spanning tree
  for (let i = 1; i < nodeCount; i++) {
    const hasEdge = edges.some(
      e => (e.source === nodes[i].id || e.target === nodes[i].id) &&
           nodes.slice(0, i).some(n => n.id === e.source || n.id === e.target)
    );
    if (!hasEdge) {
      const j = Math.floor(Math.random() * i);
      edges.push({
        source: nodes[j].id,
        target: nodes[i].id,
        weight: Math.floor(Math.random() * 9) + 1,
      });
    }
  }

  return { nodes, edges };
}

/** Generate a default grid for A*. */
export function generateDefaultAStarGrid(rows: number, cols: number, wallPercentage: number = 0.25) {
  const walls: Array<{ row: number; col: number }> = [];
  const start = { row: 1, col: 1 };
  const goal = { row: rows - 2, col: cols - 2 };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === start.row && c === start.col) continue;
      if (r === goal.row && c === goal.col) continue;
      // Keep some clearance around start and goal
      const distStart = Math.abs(r - start.row) + Math.abs(c - start.col);
      const distGoal = Math.abs(r - goal.row) + Math.abs(c - goal.col);
      if (distStart <= 1 || distGoal <= 1) continue;

      if (Math.random() < wallPercentage) {
        walls.push({ row: r, col: c });
      }
    }
  }

  return { rows, cols, walls, start, goal };
}
