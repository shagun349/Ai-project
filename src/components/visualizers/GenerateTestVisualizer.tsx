import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import type { ExecutionEvent } from '../../types';
import { useMemo } from 'react';

interface GenerateTestVisualizerProps {
  width: number;
  height: number;
  visibleEvents: ExecutionEvent[];
  currentEvent: ExecutionEvent | null;
}

interface CandidateVisual {
  id: string;
  value: number;
  tested: boolean;
  isSolution: boolean;
}

export default function GenerateTestVisualizer({
  width,
  height,
  visibleEvents,
}: GenerateTestVisualizerProps) {
  const visualState = useMemo(() => {
    let candidates: CandidateVisual[] = [];
    let currentIndex = -1;
    let solutionFound = false;

    for (const event of visibleEvents) {
      if (event.data.candidates) {
        candidates = (event.data.candidates as CandidateVisual[]).map(c => ({ ...c }));
      }
      if (event.type === 'candidate-generated') {
        currentIndex = candidates.length - 1;
      }
      if (event.type === 'candidate-tested') {
        currentIndex = candidates.findIndex(c => c.id === (event.data.candidate as CandidateVisual)?.id);
      }
      if (event.type === 'solution-found') {
        solutionFound = true;
      }
    }

    return { candidates, currentIndex, solutionFound };
  }, [visibleEvents]);

  const { candidates } = visualState;

  // Layout: grid of candidate cards
  const cardWidth = 54;
  const cardHeight = 54;
  const gap = 6;
  const cols = Math.max(1, Math.floor((width - 40) / (cardWidth + gap)));

  return (
    <Stage width={width} height={height}>
      <Layer>
        {/* Title */}
        <Text
          x={20}
          y={12}
          text="Candidate Space"
          fontSize={12}
          fill="#8b93b0"
          fontFamily="Inter"
          fontStyle="600"
        />

        {candidates.map((candidate, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const x = 20 + col * (cardWidth + gap);
          const y = 36 + row * (cardHeight + gap);

          const isCurrent = idx === visualState.currentIndex;
          let fillColor = '#1a1d2b'; // untested
          let strokeColor = '#252a3a';

          if (candidate.isSolution) {
            fillColor = '#064e3b';
            strokeColor = '#10b981';
          } else if (candidate.tested) {
            fillColor = '#1c1520';
            strokeColor = '#4a3040';
          }
          if (isCurrent) {
            strokeColor = '#6366f1';
          }

          return (
            <Group key={candidate.id}>
              <Rect
                x={x}
                y={y}
                width={cardWidth}
                height={cardHeight}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isCurrent ? 2 : 1}
                cornerRadius={6}
              />
              <Text
                x={x}
                y={y + 12}
                width={cardWidth}
                text={String(candidate.value)}
                fontSize={16}
                fill={candidate.isSolution ? '#34d399' : candidate.tested ? '#6b7394' : '#b0b7cc'}
                fontFamily="JetBrains Mono"
                fontStyle="bold"
                align="center"
              />
              <Text
                x={x}
                y={y + 34}
                width={cardWidth}
                text={candidate.isSolution ? '✓' : candidate.tested ? '✗' : '?'}
                fontSize={11}
                fill={candidate.isSolution ? '#10b981' : candidate.tested ? '#f43f5e' : '#4a5168'}
                fontFamily="Inter"
                align="center"
              />
            </Group>
          );
        })}

        {candidates.length === 0 && (
          <Text
            x={width / 2 - 80}
            y={height / 2 - 10}
            text="Run algorithm to see candidates"
            fontSize={12}
            fill="#4a5168"
            fontFamily="Inter"
          />
        )}
      </Layer>
    </Stage>
  );
}
