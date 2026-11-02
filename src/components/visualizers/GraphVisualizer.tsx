import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';
import type { Graph, ExecutionEvent } from '../../types';
import { useMemo } from 'react';

interface GraphVisualizerProps {
  graph: Graph;
  width: number;
  height: number;
  visibleEvents: ExecutionEvent[];
  currentEvent: ExecutionEvent | null;
  highlightPath?: string[];
}

export default function GraphVisualizer({
  graph,
  width,
  height,
  visibleEvents,
  currentEvent,
  highlightPath = [],
}: GraphVisualizerProps) {
  // Derive visual state from events
  const visualState = useMemo(() => {
    const visited = new Set<string>();
    const inFrontier = new Set<string>();
    const currentNode: string | null = currentEvent?.data?.node as string ?? null;

    for (const event of visibleEvents) {
      if (event.type === 'node-visited') {
        visited.add(event.data.node as string);
      }
      if (event.type === 'node-added-to-frontier') {
        inFrontier.add(event.data.node as string);
      }
      if (event.type === 'node-removed-from-frontier') {
        inFrontier.delete(event.data.node as string);
      }
    }

    return { visited, inFrontier, currentNode };
  }, [visibleEvents, currentEvent]);

  const pathSet = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < highlightPath.length - 1; i++) {
      set.add(`${highlightPath[i]}-${highlightPath[i + 1]}`);
      set.add(`${highlightPath[i + 1]}-${highlightPath[i]}`);
    }
    return set;
  }, [highlightPath]);

  const pathNodeSet = new Set(highlightPath);

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const node of graph.nodes) {
      map.set(node.id, { x: node.x, y: node.y });
    }
    return map;
  }, [graph.nodes]);

  const getNodeColor = (nodeId: string) => {
    if (visualState.currentNode === nodeId) return '#6366f1'; // accent - current
    if (pathNodeSet.has(nodeId)) return '#10b981'; // emerald - path
    if (visualState.visited.has(nodeId)) return '#06b6d4'; // cyan - visited
    if (visualState.inFrontier.has(nodeId)) return '#f59e0b'; // amber - frontier
    return '#313849'; // dark-500 - default
  };

  const getNodeStroke = (nodeId: string) => {
    if (visualState.currentNode === nodeId) return '#a5b4fc';
    if (pathNodeSet.has(nodeId)) return '#34d399';
    return '#4a5168';
  };

  const getEdgeColor = (source: string, target: string) => {
    const key1 = `${source}-${target}`;
    if (pathSet.has(key1)) return '#10b981';
    if (visualState.visited.has(source) && visualState.visited.has(target)) return '#1c2030';
    return '#252a3a';
  };

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Edges */}
        {graph.edges.map((edge) => {
          const from = nodeMap.get(edge.source);
          const to = nodeMap.get(edge.target);
          if (!from || !to) return null;
          const color = getEdgeColor(edge.source, edge.target);
          const isPath = pathSet.has(`${edge.source}-${edge.target}`);

          return (
            <Group key={`${edge.source}-${edge.target}`}>
              <Line
                points={[from.x, from.y, to.x, to.y]}
                stroke={color}
                strokeWidth={isPath ? 3 : 1.5}
                opacity={isPath ? 1 : 0.6}
              />
              {/* Edge weight label */}
              <Text
                x={(from.x + to.x) / 2 - 6}
                y={(from.y + to.y) / 2 - 14}
                text={String(edge.weight)}
                fontSize={10}
                fill="#6b7394"
                fontFamily="Inter"
              />
            </Group>
          );
        })}

        {/* Nodes */}
        {graph.nodes.map((node) => {
          const color = getNodeColor(node.id);
          const stroke = getNodeStroke(node.id);
          const isCurrent = visualState.currentNode === node.id;

          return (
            <Group key={node.id}>
              {/* Glow effect for current node */}
              {isCurrent && (
                <Circle
                  x={node.x}
                  y={node.y}
                  radius={28}
                  fill={color}
                  opacity={0.15}
                />
              )}
              {/* Node circle */}
              <Circle
                x={node.x}
                y={node.y}
                radius={20}
                fill={color}
                stroke={stroke}
                strokeWidth={2}
              />
              {/* Node label */}
              <Text
                x={node.x - 6}
                y={node.y - 6}
                text={node.label}
                fontSize={13}
                fill="#ffffff"
                fontFamily="Inter"
                fontStyle="bold"
              />
              {/* Heuristic value */}
              {node.heuristic !== undefined && (
                <Text
                  x={node.x - 10}
                  y={node.y + 24}
                  text={`h=${node.heuristic}`}
                  fontSize={9}
                  fill="#8b93b0"
                  fontFamily="JetBrains Mono"
                />
              )}
            </Group>
          );
        })}
      </Layer>
    </Stage>
  );
}
