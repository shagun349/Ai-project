import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { ExecutionEvent } from '../../types';
import { useMemo } from 'react';

interface GridVisualizerProps {
  rows: number;
  cols: number;
  walls: Set<string>;
  start: { row: number; col: number };
  goal: { row: number; col: number };
  width: number;
  height: number;
  visibleEvents: ExecutionEvent[];
  currentEvent: ExecutionEvent | null;
}

function coordKey(row: number, col: number): string {
  return `${row},${col}`;
}

export default function GridVisualizer({
  rows,
  cols,
  walls,
  start,
  goal,
  width,
  height,
  visibleEvents,
  currentEvent: _currentEvent,
}: GridVisualizerProps) {
  const cellSize = Math.min(
    Math.floor((width - 20) / cols),
    Math.floor((height - 20) / rows),
    40
  );

  const offsetX = (width - cellSize * cols) / 2;
  const offsetY = (height - cellSize * rows) / 2;

  // Derive visual state
  const visualState = useMemo(() => {
    const openSet = new Map<string, { g: number; h: number; f: number }>();
    const closedSet = new Set<string>();
    let currentNode: string | null = null;
    let path: Array<{ row: number; col: number }> = [];

    for (const event of visibleEvents) {
      const data = event.data;
      if (event.type === 'node-added-to-frontier' && data.node) {
        const n = data.node as { row: number; col: number; g: number; h: number; f: number };
        openSet.set(coordKey(n.row, n.col), { g: n.g, h: n.h, f: n.f });
      }
      if (event.type === 'node-removed-from-frontier' && data.node) {
        const n = data.node as { row: number; col: number };
        openSet.delete(coordKey(n.row, n.col));
        currentNode = coordKey(n.row, n.col);
      }
      if (event.type === 'node-visited' && data.node) {
        const n = data.node as { row: number; col: number };
        closedSet.add(coordKey(n.row, n.col));
      }
      if (event.type === 'solution-found' && data.path) {
        path = data.path as Array<{ row: number; col: number }>;
      }
    }

    return { openSet, closedSet, currentNode, path };
  }, [visibleEvents]);

  const pathSet = useMemo(() => {
    return new Set(visualState.path.map(p => coordKey(p.row, p.col)));
  }, [visualState.path]);

  const getCellColor = (row: number, col: number) => {
    const key = coordKey(row, col);
    if (row === start.row && col === start.col) return '#10b981';
    if (row === goal.row && col === goal.col) return '#f43f5e';
    if (walls.has(key)) return '#1c2030';
    if (pathSet.has(key)) return '#6366f1';
    if (visualState.currentNode === key) return '#818cf8';
    if (visualState.closedSet.has(key)) return '#164e63';
    if (visualState.openSet.has(key)) return '#78350f';
    return '#1a1d2b';
  };

  const getCellStroke = (row: number, col: number) => {
    const key = coordKey(row, col);
    if (visualState.currentNode === key) return '#a5b4fc';
    if (pathSet.has(key)) return '#818cf8';
    return '#252a3a';
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const key = coordKey(r, c);
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            const color = getCellColor(r, c);
            const stroke = getCellStroke(r, c);
            const isWall = walls.has(key);
            const openData = visualState.openSet.get(key);

            return (
              <Group key={key}>
                <Rect
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  fill={color}
                  stroke={stroke}
                  strokeWidth={0.5}
                  cornerRadius={2}
                />

                {/* Start / Goal labels */}
                {r === start.row && c === start.col && (
                  <Text
                    x={x}
                    y={y + cellSize / 2 - 5}
                    width={cellSize}
                    text="S"
                    fontSize={12}
                    fill="#ffffff"
                    fontStyle="bold"
                    align="center"
                    fontFamily="Inter"
                  />
                )}
                {r === goal.row && c === goal.col && (
                  <Text
                    x={x}
                    y={y + cellSize / 2 - 5}
                    width={cellSize}
                    text="G"
                    fontSize={12}
                    fill="#ffffff"
                    fontStyle="bold"
                    align="center"
                    fontFamily="Inter"
                  />
                )}

                {/* Wall marker */}
                {isWall && (
                  <Text
                    x={x}
                    y={y + cellSize / 2 - 5}
                    width={cellSize}
                    text="▪"
                    fontSize={10}
                    fill="#4a5168"
                    align="center"
                  />
                )}

                {/* f, g, h values for open/closed cells */}
                {!isWall && cellSize >= 32 && openData && (
                  <>
                    <Text
                      x={x + 2}
                      y={y + 2}
                      text={`f${openData.f.toFixed(0)}`}
                      fontSize={7}
                      fill="#fbbf24"
                      fontFamily="JetBrains Mono"
                    />
                    <Text
                      x={x + 2}
                      y={y + cellSize - 10}
                      text={`g${openData.g.toFixed(0)}`}
                      fontSize={7}
                      fill="#34d399"
                      fontFamily="JetBrains Mono"
                    />
                    <Text
                      x={x + cellSize - 16}
                      y={y + cellSize - 10}
                      text={`h${openData.h.toFixed(0)}`}
                      fontSize={7}
                      fill="#fb7185"
                      fontFamily="JetBrains Mono"
                    />
                  </>
                )}
              </Group>
            );
          })
        )}
      </Layer>
    </Stage>
  );
}
