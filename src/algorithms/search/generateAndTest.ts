import type { AlgorithmResult } from '../core/executor';
import { createEventFactory } from '../core/executor';

export interface GenerateAndTestConfig {
  /** Target number to find. */
  target: number;
  /** Range of candidates [min, max]. */
  candidateRange: [number, number];
  /** Test function type: 'exact' matches target, 'predicate' uses custom test. */
  testType: 'exact' | 'divisible' | 'prime-closest';
}

export interface Candidate {
  id: string;
  value: number;
  tested: boolean;
  isSolution: boolean;
}

/**
 * Generate and Test algorithm implementation.
 * Generates candidates systematically and tests each against the goal criteria.
 */
export function executeGenerateAndTest(config: GenerateAndTestConfig): AlgorithmResult {
  const { target, candidateRange, testType } = config;
  const createEvent = createEventFactory();
  const events: ReturnType<typeof createEvent>[] = [];

  const startTime = performance.now();

  const [min, max] = candidateRange;
  const candidates: Candidate[] = [];
  let totalGenerated = 0;
  let totalTested = 0;
  let solutionFound = false;
  let solutionIndex: number | null = null;

  const testCandidate = (value: number): boolean => {
    switch (testType) {
      case 'exact':
        return value === target;
      case 'divisible':
        return target !== 0 && value % target === 0 && value !== 0;
      case 'prime-closest': {
        // Check if value is prime and closest to target
        if (value < 2) return false;
        for (let i = 2; i <= Math.sqrt(value); i++) {
          if (value % i === 0) return false;
        }
        return true;
      }
      default:
        return value === target;
    }
  };

  events.push(createEvent(
    'iteration-start', 0,
    `Starting Generate and Test: searching for ${testType === 'exact' ? `value ${target}` : testType === 'divisible' ? `multiples of ${target}` : `prime closest to ${target}`} in range [${min}, ${max}]`,
    { target, range: [min, max], testType }
  ));

  for (let value = min; value <= max; value++) {
    const candidate: Candidate = {
      id: `c-${totalGenerated}`,
      value,
      tested: false,
      isSolution: false,
    };
    candidates.push(candidate);
    totalGenerated++;

    events.push(createEvent(
      'candidate-generated', 2,
      `Generate candidate: ${value}`,
      {
        candidate: { ...candidate },
        candidates: candidates.map(c => ({ ...c })),
        totalGenerated,
      }
    ));

    // Test the candidate
    candidate.tested = true;
    totalTested++;
    const result = testCandidate(value);
    candidate.isSolution = result;

    events.push(createEvent(
      'candidate-tested', 5,
      result
        ? `Test candidate ${value}: ✓ PASS – solution found!`
        : `Test candidate ${value}: ✗ FAIL`,
      {
        candidate: { ...candidate },
        result,
        candidates: candidates.map(c => ({ ...c })),
        totalTested,
      }
    ));

    if (result) {
      solutionFound = true;
      solutionIndex = candidates.length - 1;

      events.push(createEvent(
        'solution-found', 6,
        `Solution found: candidate ${value} at index ${solutionIndex}`,
        {
          solution: value,
          solutionIndex,
          totalGenerated,
          totalTested,
          candidates: candidates.map(c => ({ ...c })),
        }
      ));

      if (testType !== 'prime-closest') break;
      // For prime-closest, keep searching to find the closest one
      if (testType === 'prime-closest') {
        const currentDist = Math.abs(value - target);
        // Continue searching for a closer prime
        let foundCloser = false;
        const remaining = max - value;
        if (remaining > 0 && currentDist > 0) {
          foundCloser = true;
        }
        if (!foundCloser || currentDist === 0) break;
      }
    }
  }

  const endTime = performance.now();

  if (!solutionFound) {
    events.push(createEvent(
      'no-solution', 4,
      `All ${totalGenerated} candidates exhausted. No solution found.`,
      { totalGenerated, totalTested }
    ));
  }

  events.push(createEvent(
    'execution-completed', solutionFound ? 6 : 4,
    solutionFound
      ? `Generate and Test complete. Solution found after testing ${totalTested} candidates.`
      : `Generate and Test complete. No solution in ${totalGenerated} candidates.`,
    {
      totalGenerated,
      totalTested,
      solutionFound,
      solutionIndex,
      candidates: candidates.map(c => ({ ...c })),
    }
  ));

  return {
    events,
    stats: {
      nodesExplored: totalTested,
      nodesGenerated: totalGenerated,
      maxFrontierSize: 1,
      executionTimeMs: endTime - startTime,
      solutionCost: solutionFound ? totalTested : null,
      pathLength: null,
      iterations: totalTested,
      success: solutionFound,
    },
  };
}
