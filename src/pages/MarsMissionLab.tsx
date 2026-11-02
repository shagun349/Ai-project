import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Konva from 'konva';
import { Circle, Group, Layer, Line, Rect, Stage, Text } from 'react-konva';
import { CarFront, Pause, Play, RotateCcw, Route, Shuffle, SkipBack, SkipForward, Timer, Volume2, VolumeX } from 'lucide-react';
import { createRoverTerrain, runRoverSearch, type Point, type RoverAlgorithm, type RoverTerrain, type TerrainKind } from '../algorithms/search/roverSearch';
import { useAlgorithmExecution } from '../hooks/useAlgorithmExecution';
import { useSimulationSounds } from '../hooks/useSimulationSounds';

type EditMode = 'obstacle' | 'start' | 'goal' | 'smooth' | 'sand' | 'rocky';
const algorithms: Array<{ id: RoverAlgorithm; label: string; description: string }> = [
  { id: 'a-star', label: 'A* Search', description: 'Balances travelled road cost with distance to the destination.' },
  { id: 'best-first', label: 'Best First Search', description: 'Prioritizes intersections estimated to be closest to the destination.' },
  { id: 'dfs', label: 'Depth First Search', description: 'Follows one branch deeply before backtracking to alternatives.' },
  { id: 'generate-and-test', label: 'Generate & Test', description: 'Generates candidate driving routes, then tests each one against the destination.' },
  { id: 'hill-climbing', label: 'Hill Climbing', description: 'Moves to the neighboring tile with the best heuristic value until it reaches a peak or the goal.' },
  { id: 'beam-search', label: 'Beam Search', description: 'Keeps only the strongest few route candidates at every search depth.' },
];
const pseudocode: Record<RoverAlgorithm, string[]> = {
  'a-star': ['initialize frontier with start point', 'while frontier is not empty', 'select state with lowest f(n)', 'mark the selected state explored', 'if destination reached, rebuild route', 'inspect each neighboring intersection', 'update route cost and add improved neighbor', 'continue until route found or frontier empty'],
  'best-first': ['initialize frontier with start point', 'while frontier is not empty', 'select state with lowest h(n)', 'mark the selected state explored', 'if destination reached, rebuild route', 'inspect each neighboring intersection', 'add traversable unvisited neighbor', 'continue until route found or frontier empty'],
  dfs: ['push start point onto stack', 'while stack is not empty', 'take newest discovered state', 'mark the selected state explored', 'if destination reached, rebuild route', 'inspect each neighboring intersection', 'push traversable unvisited neighbor', 'continue until route found or stack empty'],
  'generate-and-test': ['generate an initial route candidate', 'while candidates remain', 'select a candidate to test', 'test it against the goal condition', 'if it reaches the destination, accept route', 'generate extended route candidates', 'place candidates in the test pool', 'continue until a solution is found'],
  'hill-climbing': ['set the start point as current', 'while a better neighbor exists', 'evaluate current heuristic h(n)', 'mark current intersection visited', 'inspect unvisited neighbors', 'select neighbor with lowest h(n)', 'stop if no neighbor improves h(n)', 'return route if the destination was reached'],
  'beam-search': ['initialize beam with start point', 'while beam is not empty', 'expand every candidate in the beam', 'mark expanded candidates visited', 'test candidates for the destination', 'generate next-level candidates', 'keep only the best k candidates', 'continue with the next beam level'],
};

function pointKey(point: Point) { return `${point.row},${point.col}`; }
function heuristic(point: Point, goal: Point) { return Math.abs(point.row - goal.row) + Math.abs(point.col - goal.col); }
function cloneTerrain(terrain: RoverTerrain) { return { ...terrain, cells: terrain.cells.map(row => [...row]) }; }
function useSize() {
  const ref = useRef<HTMLDivElement>(null); const [size, setSize] = useState({ width: 480, height: 440 });
  useEffect(() => { const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height })); if (ref.current) observer.observe(ref.current); return () => observer.disconnect(); }, []);
  return { ref, size };
}

function visualState(events: ReturnType<typeof useAlgorithmExecution>['visibleEvents'], start: Point) {
  const frontier = new Set<string>(); const visited = new Set<string>(); const rejected = new Set<string>(); const scores = new Map<string, { g: number; h: number; f: number }>(); let current = ''; let path: Point[] = []; let rover = start;
  events.forEach(event => { const cell = event.data.cell as Point | undefined; if (cell && typeof event.data.g === 'number' && typeof event.data.h === 'number' && typeof event.data.f === 'number') scores.set(pointKey(cell), { g: event.data.g, h: event.data.h, f: event.data.f }); if (event.type === 'node-added-to-frontier' && cell) frontier.add(pointKey(cell)); if (event.type === 'node-removed-from-frontier' && cell) { frontier.delete(pointKey(cell)); current = pointKey(cell); rover = cell; } if (event.type === 'node-visited' && cell) visited.add(pointKey(cell)); if (event.type === 'neighbor-evaluated' && event.data.rejected && cell) { rejected.add(pointKey(cell)); frontier.delete(pointKey(cell)); } if (event.type === 'solution-found') path = event.data.path as Point[]; if (event.type === 'state-updated' && event.data.rover) rover = event.data.rover as Point; });
  return { frontier, visited, rejected, scores, current, path, rover };
}

function TerrainCanvas({ terrain, state, onCellClick }: { terrain: RoverTerrain; state: ReturnType<typeof visualState>; onCellClick: (point: Point) => void }) {
  const { ref, size } = useSize(); const cell = Math.max(18, Math.min(42, Math.floor(Math.min((size.width - 30) / terrain.cols, (size.height - 30) / terrain.rows)))); const offsetX = (size.width - cell * terrain.cols) / 2; const offsetY = (size.height - cell * terrain.rows) / 2;
  const roverRef = useRef<Konva.Group>(null);
  const path = new Set(state.path.map(pointKey));
  const terrainColors: Record<TerrainKind, string> = { smooth: '#334155', sand: '#475569', rocky: '#64748B', blocked: '#172033' };
  const roverX = offsetX + (state.rover.col + .5) * cell;
  const roverY = offsetY + (state.rover.row + .5) * cell;
  useEffect(() => {
    roverRef.current?.to({ x: roverX, y: roverY, duration: 0.32, easing: Konva.Easings.EaseInOut });
  }, [roverX, roverY]);
  return <div ref={ref} className="h-full min-h-[370px] w-full"><Stage width={size.width} height={size.height}><Layer>
    {terrain.cells.map((row, r) => row.map((kind, c) => { const point = { row: r, col: c }; const id = pointKey(point); const overlay = state.current === id ? '#00FFFF' : path.has(id) ? '#39FF14' : state.visited.has(id) ? '#0E7490' : state.frontier.has(id) ? '#06B6D4' : state.rejected.has(id) ? '#475569' : null; const x = offsetX + c * cell; const y = offsetY + r * cell; const isBuilding = kind === 'blocked'; return <Group key={id} onClick={() => onCellClick(point)}>
      <Rect x={x + 1} y={y + 1} width={cell - 2} height={cell - 2} cornerRadius={4} fill={terrainColors[kind]} stroke={state.current === id ? '#00FFFF' : '#64748B'} strokeWidth={state.current === id ? 2 : 1} shadowColor={state.current === id ? '#00FFFF' : '#020617'} shadowBlur={state.current === id ? 8 : 3} shadowOpacity={.4} shadowOffsetY={1} />
      {!isBuilding && <><Rect x={x + cell * .1} y={y + cell * .1} width={cell * .8} height={cell * .8} cornerRadius={3} fill="#0F172A" opacity={.6} /><Line points={[x + cell * .12, y + cell / 2, x + cell * .88, y + cell / 2]} stroke="#94A3B8" strokeWidth={Math.max(1, cell * .04)} dash={[cell * .14, cell * .12]} opacity={.7} /><Line points={[x + cell / 2, y + cell * .12, x + cell / 2, y + cell * .88]} stroke="#94A3B8" strokeWidth={Math.max(1, cell * .04)} dash={[cell * .14, cell * .12]} opacity={.42} /></>}
      {kind === 'sand' && <><Rect x={x + cell * .1} y={y + cell * .1} width={cell * .8} height={cell * .8} cornerRadius={3} fill="#64748B" opacity={.45} /><Line points={[x + cell * .22, y + cell * .25, x + cell * .78, y + cell * .75]} stroke="#CBD5E1" strokeWidth={1.2} opacity={.7} /><Line points={[x + cell * .78, y + cell * .25, x + cell * .22, y + cell * .75]} stroke="#CBD5E1" strokeWidth={1.2} opacity={.7} /></>}
      {kind === 'rocky' && <><Rect x={x + cell * .1} y={y + cell * .1} width={cell * .8} height={cell * .8} cornerRadius={3} fill="#475569" opacity={.65} /><Line points={[x + cell * .18, y + cell * .72, x + cell * .78, y + cell * .28]} stroke="#CBD5E1" strokeWidth={1.2} opacity={.75} /><Line points={[x + cell * .34, y + cell * .83, x + cell * .9, y + cell * .42]} stroke="#CBD5E1" strokeWidth={1.2} opacity={.4} /></>}
      {isBuilding && <><Rect x={x + cell * .2} y={y + cell * .16} width={cell * .62} height={cell * .65} cornerRadius={2} fill="#52606d" stroke="#9aa8b7" strokeWidth={.7} shadowColor="#02060a" shadowBlur={4} shadowOpacity={.8} shadowOffset={{ x: cell * .07, y: cell * .08 }} />{cell >= 28 && [0, 1, 2, 3].map(index => <Rect key={index} x={x + cell * (.3 + (index % 2) * .22)} y={y + cell * (.29 + Math.floor(index / 2) * .25)} width={cell * .1} height={cell * .1} fill="#d7b56d" opacity={.9} />)}</>}
      {overlay && <Rect x={x + 2} y={y + 2} width={cell - 4} height={cell - 4} cornerRadius={3} fill={overlay} opacity={state.current === id ? .78 : .55} />}
      {kind !== 'blocked' && state.scores.get(id) && <Text x={x + 3} y={y + cell - 12} width={cell - 6} align="right" text={`g:${state.scores.get(id)!.g} f:${state.scores.get(id)!.f}`} fontSize={Math.max(6, Math.min(8, cell * .18))} fill="#b8f4ff" />}
      {kind === 'sand' && <Text x={x} y={y + cell / 2 - 5} width={cell} align="center" text="c:3" fontSize={10} fill="#fde0ad" />}
      {kind === 'rocky' && <Text x={x} y={y + cell / 2 - 5} width={cell} align="center" text="c:5" fontSize={10} fill="#f2bd9a" />}
      {terrain.start.row === r && terrain.start.col === c && <Group><Circle x={x + cell / 2} y={y + cell / 2} radius={cell * .28} fill="#39FF14" /><Text x={x} y={y + cell / 2 - 7} width={cell} text="S" align="center" fontStyle="bold" fontSize={14} fill="#0B0F19" /></Group>}
      {terrain.goal.row === r && terrain.goal.col === c && <Group><Rect x={x + cell * .27} y={y + cell * .27} width={cell * .46} height={cell * .46} cornerRadius={4} fill="#E2E8F0" /><Text x={x} y={y + cell / 2 - 7} width={cell} text="D" align="center" fontStyle="bold" fontSize={14} fill="#0B0F19" /></Group>}
    </Group>; }))}
    <Group ref={roverRef} x={roverX} y={roverY}>
      <Rect x={-cell * .28} y={-cell * .16} width={cell * .56} height={cell * .32} cornerRadius={cell * .08} fill="#d9fbff" stroke="#22d3ee" strokeWidth={2} shadowColor="#22d3ee" shadowBlur={10} shadowOpacity={.6} />
      <Rect x={-cell * .13} y={-cell * .12} width={cell * .26} height={cell * .12} cornerRadius={2} fill="#34758a" />
      <Circle x={-cell * .18} y={cell * .17} radius={Math.max(1.5, cell * .055)} fill="#0e2530" />
      <Circle x={cell * .18} y={cell * .17} radius={Math.max(1.5, cell * .055)} fill="#0e2530" />
    </Group>
  </Layer></Stage></div>;
}

function GraphCanvas({ terrain, state, algorithm, showLabels }: { terrain: RoverTerrain; state: ReturnType<typeof visualState>; algorithm: RoverAlgorithm; showLabels: boolean }) {
  const { ref, size } = useSize(); const xStep = Math.max(12, (size.width - 30) / terrain.cols); const yStep = Math.max(12, (size.height - 30) / terrain.rows); const nodeRadius = Math.max(5, Math.min(10, xStep * .14, yStep * .22)); const path = new Set(state.path.map(pointKey)); const usable = (p: Point) => terrain.cells[p.row]?.[p.col] !== 'blocked'; const color = (p: Point) => { const id = pointKey(p); if (terrain.start.row === p.row && terrain.start.col === p.col) return '#39FF14'; if (terrain.goal.row === p.row && terrain.goal.col === p.col) return '#F8FAFC'; if (state.current === id) return '#00FFFF'; if (path.has(id)) return '#39FF14'; if (state.visited.has(id)) return '#0E7490'; if (state.frontier.has(id)) return '#06B6D4'; if (state.rejected.has(id)) return '#475569'; return '#64748B'; };
  const nodeLabel = (point: Point) => {
    if (!showLabels) return '';
    const id = pointKey(point);
    const score = state.scores.get(id);
    if (algorithm === 'dfs' || algorithm === 'generate-and-test') return '';
    if (algorithm === 'best-first' || algorithm === 'hill-climbing' || algorithm === 'beam-search') return `h:${heuristic(point, terrain.goal)}`;
    return (state.visited.has(id) || state.current === id) && score ? `f:${score.f}` : `h:${heuristic(point, terrain.goal)}`;
  };
  const pos = (p: Point) => ({ x: 15 + (p.col + .5) * xStep, y: 15 + (p.row + .5) * yStep });
  return <div ref={ref} className="h-full min-h-[370px] w-full"><Stage width={size.width} height={size.height}><Layer>
    {terrain.cells.map((row, r) => row.map((kind, c) => { if (kind === 'blocked') return null; const from = { row: r, col: c }; return [{ row: r, col: c + 1 }, { row: r + 1, col: c }].map(to => usable(to) ? <Line key={`${pointKey(from)}-${pointKey(to)}`} points={[pos(from).x, pos(from).y, pos(to).x, pos(to).y]} stroke={path.has(pointKey(from)) && path.has(pointKey(to)) ? '#39FF14' : '#475569'} strokeWidth={path.has(pointKey(from)) && path.has(pointKey(to)) ? 2.5 : 1} opacity={.9} /> : null); }))}
    {terrain.cells.map((row, r) => row.map((kind, c) => kind === 'blocked' ? null : <Group key={`${r}-${c}`}><Circle x={pos({ row: r, col: c }).x} y={pos({ row: r, col: c }).y} radius={state.current === `${r},${c}` ? nodeRadius + 2 : nodeRadius} fill={color({ row: r, col: c })} stroke="#94A3B8" strokeWidth={state.current === `${r},${c}` ? 2 : 1} /><Text x={pos({ row: r, col: c }).x + nodeRadius + 3} y={pos({ row: r, col: c }).y - 6} text={nodeLabel({ row: r, col: c })} fontSize={Math.max(8, Math.min(11, xStep * .15))} fill="#CBD5E1" fontStyle="bold" /></Group>))}
  </Layer></Stage></div>;
}

export default function MarsMissionLab() {
  const [terrain, setTerrain] = useState<RoverTerrain>(() => createRoverTerrain()); const [algorithm, setAlgorithm] = useState<RoverAlgorithm>('a-star'); const [mode, setMode] = useState<EditMode>('obstacle'); const execution = useAlgorithmExecution();
  const sounds = useSimulationSounds();
  const [terrainWidth, setTerrainWidth] = useState(38);
  const [isResizing, setIsResizing] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const active = algorithms.find(item => item.id === algorithm)!; const state = useMemo(() => visualState(execution.visibleEvents, terrain.start), [execution.visibleEvents, terrain.start]);
  const resetPlayback = () => execution.clearExecution();
  const editCell = (point: Point) => { if (execution.state.status === 'running') return; setTerrain(previous => { const next = cloneTerrain(previous); if (mode === 'start') { if (next.cells[point.row][point.col] !== 'blocked' && pointKey(point) !== pointKey(next.goal)) next.start = point; } else if (mode === 'goal') { if (next.cells[point.row][point.col] !== 'blocked' && pointKey(point) !== pointKey(next.start)) next.goal = point; } else if (pointKey(point) !== pointKey(next.start) && pointKey(point) !== pointKey(next.goal)) next.cells[point.row][point.col] = mode === 'obstacle' ? (next.cells[point.row][point.col] === 'blocked' ? 'smooth' : 'blocked') : mode; return next; }); resetPlayback(); };
  const randomize = () => { const next = createRoverTerrain(); for (let r = 0; r < next.rows; r++) for (let c = 0; c < next.cols; c++) if (pointKey({ row: r, col: c }) !== pointKey(next.start) && pointKey({ row: r, col: c }) !== pointKey(next.goal) && Math.random() < .13) next.cells[r][c] = Math.random() < .6 ? 'blocked' : Math.random() < .5 ? 'sand' : 'rocky'; setTerrain(next); resetPlayback(); };
  const run = () => { const result = runRoverSearch(terrain, algorithm); execution.loadExecution(result.events, result.stats); sounds.play('start'); setTimeout(execution.play, 0); };
  const statusText = execution.state.status === 'running' ? 'Exploring' : execution.state.status === 'completed' ? (execution.state.stats.success ? 'Route found' : 'No route') : execution.state.status === 'paused' ? 'Paused' : 'Ready';
  const current = execution.currentEvent;
  const resizePanels = (clientX: number) => {
    const bounds = workspaceRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTerrainWidth(Math.min(65, Math.max(26, ((clientX - bounds.left) / bounds.width) * 100)));
  };
  useEffect(() => {
    if (!isResizing) return;
    const move = (event: MouseEvent) => resizePanels(event.clientX);
    const stop = () => setIsResizing(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', stop);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', stop); };
  }, [isResizing]);
  const soundedStep = useRef(-1);
  useEffect(() => {
    if (!current) { soundedStep.current = -1; return; }
    if (soundedStep.current === current.stepIndex) return;
    soundedStep.current = current.stepIndex;
    const soundByEvent = {
      'node-added-to-frontier': 'frontier',
      'node-removed-from-frontier': 'expand',
      'node-visited': 'visit',
      'neighbor-evaluated': current.data.rejected ? 'reject' : 'visit',
      'solution-found': 'success',
      'no-solution': 'failure',
    } as const;
    const sound = soundByEvent[current.type as keyof typeof soundByEvent];
    if (sound) sounds.play(sound);
  }, [current, sounds]);
  return <div className="ev-light h-full overflow-y-auto bg-[#f4f1eb] text-[#292524]">
    <header className="sticky top-0 z-10 border-b border-[#4d302c] bg-[#161113]/95 backdrop-blur px-5 py-3 md:px-8"><div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-500/15 text-cyan-200"><CarFront size={22} /></div><div><h1 className="text-base font-bold tracking-wide text-white">PATHFINDER</h1><p className="text-xs text-[#9bb6c5]">EV Route Planning Lab</p></div></div>
      <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 rounded-lg border border-[#364c59] bg-[#132029] px-3 py-2 text-xs text-[#c1d6df]"><Route size={14} className="text-cyan-300" /><span className="hidden sm:inline">Algorithm</span><select value={algorithm} onChange={event => { setAlgorithm(event.target.value as RoverAlgorithm); resetPlayback(); }} className="cursor-pointer bg-transparent font-semibold text-white outline-none"><option value="a-star">A* Search</option><option value="best-first">Best First Search</option><option value="dfs">Depth First Search</option><option value="generate-and-test">Generate &amp; Test</option><option value="hill-climbing">Hill Climbing</option><option value="beam-search">Beam Search</option></select></label><span className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ${execution.state.status === 'running' ? 'bg-cyan-400/10 text-cyan-300' : execution.state.stats.success && execution.state.status === 'completed' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-[#1e303a] text-[#b7d2dc]'}`}><span className="h-2 w-2 rounded-full bg-current" />{statusText}</span><button onClick={() => sounds.setEnabled(!sounds.enabled)} title={sounds.enabled ? 'Mute simulation sounds' : 'Enable simulation sounds'} className="flex cursor-pointer items-center justify-center rounded-lg border border-[#3d5b68] p-2 text-cyan-100 hover:bg-[#152730]">{sounds.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><button onClick={() => { setTerrain(createRoverTerrain()); resetPlayback(); }} className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#3d5b68] px-3 py-2 text-xs font-semibold text-[#c7dbe2] hover:bg-[#152730]"><RotateCcw size={14} />Reset route</button></div>
    </div></header>
    <main className="mx-auto max-w-[1700px] space-y-5 p-5 md:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">EV route planner</p><h2 className="mt-1 text-2xl font-bold text-white">Plan a city drive</h2></div><button onClick={randomize} className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/25"><Shuffle size={15} />Generate city</button></div>
      <div ref={workspaceRef} className={`resizable-workspace ${isResizing ? 'is-resizing' : ''}`} style={{ '--terrain-width': `${terrainWidth}%` } as CSSProperties}><section className="overflow-hidden rounded-2xl border border-[#543831] bg-[#1a1315]"><div className="flex items-center justify-between gap-3 border-b border-[#49332f] px-5 py-4"><h3 className="font-semibold text-white">City roads</h3><label className="flex items-center gap-2 rounded-md border border-[#36505d] bg-[#0f1b21] px-2.5 py-1.5 text-xs text-[#b8d1dd]"><span>Edit</span><select value={mode} onChange={event => setMode(event.target.value as EditMode)} className="cursor-pointer bg-transparent font-semibold text-white outline-none"><option value="obstacle">Building</option><option value="start">Start point</option><option value="goal">Destination</option><option value="smooth">Road · 1</option><option value="sand">Traffic · 3</option><option value="rocky">Steep road · 5</option></select></label></div><div className="p-3"><TerrainCanvas terrain={terrain} state={state} onCellClick={editCell} /></div></section><div role="separator" aria-label="Resize map and graph" aria-orientation="vertical" onMouseDown={event => { event.preventDefault(); setIsResizing(true); resizePanels(event.clientX); }} className="panel-resizer"><span /></div><section className="overflow-hidden rounded-2xl border border-[#543831] bg-[#1a1315]"><div className="border-b border-[#49332f] px-5 py-4"><h3 className="font-semibold text-white">Road network graph</h3></div><div className="p-3"><GraphCanvas terrain={terrain} state={state} algorithm={algorithm} showLabels={terrainWidth <= 40} /></div></section></div>
      {algorithm !== 'hill-climbing' && <SearchLists algorithm={algorithm} state={state} terrain={terrain} />}
      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="rounded-2xl border border-[#543831] bg-[#1a1315] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-cyan-300">Playback</p><p className="mt-1 text-sm text-[#c9aaa0]">Step {Math.max(0, execution.state.currentStepIndex + 1)} of {execution.state.totalSteps}</p></div><div className="flex items-center gap-2"><button onClick={execution.stepBackward} disabled={execution.state.currentStepIndex < 1 || execution.state.status === 'running'} className="control"><SkipBack size={16} /></button>{execution.state.status === 'running' ? <button onClick={execution.pause} className="control active"><Pause size={17} /></button> : <button onClick={execution.play} disabled={execution.state.totalSteps === 0 || execution.state.status === 'completed'} className="control active"><Play size={17} /></button>}<button onClick={execution.stepForward} disabled={execution.state.currentStepIndex >= execution.state.totalSteps - 1 || execution.state.status === 'running'} className="control"><SkipForward size={16} /></button><button onClick={run} className="flex cursor-pointer items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-bold text-[#0B0F19] hover:bg-cyan-200"><Play size={15} />Run simulation</button></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#392523]"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${execution.state.totalSteps ? ((execution.state.currentStepIndex + 1) / execution.state.totalSteps) * 100 : 0}%` }} /></div><div className="mt-3 flex items-center gap-3"><span className="whitespace-nowrap text-xs text-[#b3958a]">Seek to move</span><input aria-label="Seek to simulation move" type="range" min="0" max={Math.max(0, execution.state.totalSteps - 1)} value={Math.max(0, execution.state.currentStepIndex)} disabled={execution.state.totalSteps === 0} onChange={event => execution.jumpToStep(Number(event.target.value))} className="mission-seek w-full" /></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Explored" value={execution.state.currentStepIndex < 0 ? '—' : String([...state.visited].length)} /><Metric label="Frontier" value={execution.state.currentStepIndex < 0 ? '—' : String(state.frontier.size)} />{algorithm === 'a-star' && <><Metric label="g(n) travelled cost" value={typeof current?.data.g === 'number' ? current.data.g : '—'} /><Metric label="h(n) estimate" value={typeof current?.data.h === 'number' ? current.data.h : '—'} /><Metric label="f(n) = g + h" value={typeof current?.data.f === 'number' ? current.data.f : '—'} /></>}{(algorithm === 'best-first' || algorithm === 'hill-climbing' || algorithm === 'beam-search') && <Metric label="h(n) estimate" value={typeof current?.data.h === 'number' ? current.data.h : '—'} />}<Metric label="Route cost" value={execution.state.stats.solutionCost ?? '—'} /></div><div className="mt-4 rounded-xl border border-[#49332f] bg-[#130f10] p-3 text-sm text-[#d7bbb0]"><span className="mr-2 font-semibold text-cyan-300">{current ? `Step ${current.stepIndex + 1}` : 'Mission brief'}</span>{current?.description ?? 'Choose an algorithm, configure the terrain, and run the simulation.'}</div></div>
        <div className="rounded-2xl border border-[#543831] bg-[#1a1315] p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#e28a5f]">Pseudocode</p><h3 className="mt-1 font-semibold text-white">{active.label}</h3></div><Timer size={18} className="text-[#c58b70]" /></div><ol className="mt-4 space-y-1 font-mono text-xs">{pseudocode[algorithm].map((line, index) => <li key={line} className={`rounded px-2 py-1.5 ${current?.pseudocodeLine === index + 1 ? 'bg-cyan-400/15 text-cyan-200' : 'text-[#a58a82]'}`}><span className="mr-3 text-[#75564d]">{String(index + 1).padStart(2, '0')}</span>{line}</li>)}</ol></div></section>
    </main></div>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg border border-[#49332f] bg-[#130f10] px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-[#876e67]">{label}</p><p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p></div>; }

function SearchLists({ algorithm, state, terrain }: { algorithm: RoverAlgorithm; state: ReturnType<typeof visualState>; terrain: RoverTerrain }) {
  const [showOpen, setShowOpen] = useState(true);
  const [showClosed, setShowClosed] = useState(true);
  const names = algorithm === 'generate-and-test' ? ['Candidate pool', 'Tested candidates'] : algorithm === 'beam-search' ? ['Active beam', 'Expanded candidates'] : algorithm === 'dfs' ? ['Open stack', 'Closed set'] : ['Open list', 'Closed list'];
  const label = (id: string) => {
    const [row, col] = id.split(',').map(Number);
    const point = { row, col };
    if (algorithm === 'a-star') {
      const score = state.scores.get(id);
      return score ? `(${row},${col})  f:${score.f}` : `(${row},${col})  h:${heuristic(point, terrain.goal)}`;
    }
    if (algorithm === 'best-first' || algorithm === 'beam-search') return `(${row},${col})  h:${heuristic(point, terrain.goal)}`;
    return `(${row},${col})`;
  };
  const values = (items: Set<string>) => [...items].slice(0, 16);
  return <section className="mission-panel bg-[#111b21] p-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Search lists</p><div className="flex gap-2"><button onClick={() => setShowOpen(value => !value)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${showOpen ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-400'}`}>{showOpen ? 'Hide' : 'Show'} {names[0]}</button><button onClick={() => setShowClosed(value => !value)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${showClosed ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100' : 'border-slate-700 text-slate-400'}`}>{showClosed ? 'Hide' : 'Show'} {names[1]}</button></div></div>{(showOpen || showClosed) && <div className={`mt-3 grid gap-3 ${showOpen && showClosed ? 'md:grid-cols-2' : ''}`}>{showOpen && <ListCard title={names[0]} items={values(state.frontier)} color="text-amber-300" empty="No pending states." label={label} />}{showClosed && <ListCard title={names[1]} items={values(state.visited)} color="text-cyan-300" empty="No expanded states." label={label} />}</div>}</section>;
}

function ListCard({ title, items, color, empty, label }: { title: string; items: string[]; color: string; empty: string; label: (item: string) => string }) {
  return <div className="rounded-2xl border border-[#543831] bg-[#1a1315] p-4"><div className="flex items-center justify-between"><p className={`text-xs font-semibold uppercase tracking-[.16em] ${color}`}>{title}</p><span className="rounded-full bg-[#301f1d] px-2 py-0.5 font-mono text-xs text-[#d6b4a7]">{items.length}</span></div><div className="mt-3 flex min-h-9 flex-wrap gap-2">{items.length ? items.map(item => <span key={item} className="rounded-md border border-[#533a34] bg-[#130f10] px-2 py-1 font-mono text-xs text-[#d8bdb1]">{label(item)}</span>) : <span className="text-xs text-[#7f6660]">{empty}</span>}</div></div>;
}

