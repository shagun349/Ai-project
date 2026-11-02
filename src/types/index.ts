// ─── Core Algorithm Types ───────────────────────────────────────────────────

export type AlgorithmCategory = 'search' | 'game-theory';

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: AlgorithmCategory;
  shortDescription: string;
  overview: string;
  workingPrinciple: string;
  pseudocode: string[];
  timeComplexity: string;
  spaceComplexity: string;
  completeness: string;
  optimality: string;
  advantages: string[];
  limitations: string[];
}

// ─── Execution Event Types ──────────────────────────────────────────────────

export type ExecutionEventType =
  | 'node-visited'
  | 'node-added-to-frontier'
  | 'node-removed-from-frontier'
  | 'current-state-changed'
  | 'solution-found'
  | 'backtracking'
  | 'branch-pruned'
  | 'execution-completed'
  | 'no-solution'
  | 'neighbor-evaluated'
  | 'state-updated'
  | 'iteration-start'
  | 'candidate-generated'
  | 'candidate-tested'
  | 'local-optimum-detected';

export interface ExecutionEvent {
  type: ExecutionEventType;
  stepIndex: number;
  pseudocodeLine: number;
  description: string;
  data: Record<string, unknown>;
  timestamp: number;
}

// ─── Execution State ────────────────────────────────────────────────────────

export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';

export interface ExecutionState {
  status: ExecutionStatus;
  currentStepIndex: number;
  totalSteps: number;
  events: ExecutionEvent[];
  startTime: number | null;
  endTime: number | null;
  stats: ExecutionStats;
}

export interface ExecutionStats {
  nodesExplored: number;
  nodesGenerated: number;
  maxFrontierSize: number;
  executionTimeMs: number;
  solutionCost: number | null;
  pathLength: number | null;
  iterations: number;
  success: boolean;
}

// ─── Graph / Grid Types ─────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  heuristic?: number;
  value?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type CellType = 'empty' | 'wall' | 'start' | 'goal' | 'weight';

export interface GridCell {
  row: number;
  col: number;
  type: CellType;
  weight: number;
  g: number;
  h: number;
  f: number;
}

export interface Grid {
  rows: number;
  cols: number;
  cells: GridCell[][];
  start: { row: number; col: number } | null;
  goal: { row: number; col: number } | null;
}

// ─── Search Algorithm State Types ───────────────────────────────────────────

export interface DFSState {
  graph: Graph;
  startNodeId: string;
  goalNodeId: string;
  visited: Set<string>;
  stack: string[];
  currentNode: string | null;
  path: string[];
  backtrackingFrom: string | null;
}

export interface AStarState {
  grid: Grid;
  openSet: Array<{ row: number; col: number }>;
  closedSet: Array<{ row: number; col: number }>;
  currentNode: { row: number; col: number } | null;
  path: Array<{ row: number; col: number }>;
  cameFrom: Map<string, { row: number; col: number }>;
}

export interface HillClimbingState {
  graph: Graph;
  currentNode: string;
  currentValue: number;
  neighbors: Array<{ id: string; value: number }>;
  selectedNext: string | null;
  isLocalOptimum: boolean;
  path: string[];
}

export interface BestFirstSearchState {
  graph: Graph;
  startNodeId: string;
  goalNodeId: string;
  frontier: Array<{ id: string; heuristic: number }>;
  explored: Set<string>;
  currentNode: string | null;
  path: string[];
}

export interface GenerateAndTestState {
  candidates: Array<{ id: string; value: unknown; tested: boolean; isSolution: boolean }>;
  currentCandidate: number;
  solutionFound: boolean;
  solutionIndex: number | null;
  totalGenerated: number;
  totalTested: number;
}

// ─── Navigation Types ───────────────────────────────────────────────────────

export type PageId = 'overview' | 'search-lab' | 'game-theory-lab' | 'comparison' | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}

// ─── Comparison Types ───────────────────────────────────────────────────────

export interface ComparisonResult {
  algorithmId: string;
  algorithmName: string;
  stats: ExecutionStats;
  trialResults?: ExecutionStats[];
}
