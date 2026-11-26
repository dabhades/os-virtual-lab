import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  DiskAlgorithm,
  DiskDirection,
  DiskEvent,
  DiskHop,
  DiskSchedulingInput,
  DiskSchedulingMetrics,
  DiskStepState,
} from './types';

interface PlannedMove {
  target: number;
  isRequestServed: boolean;
  isReturnJump: boolean;
  reason: string;
  rule: string;
  candidates?: number[];
}

function buildMoveSequence(input: DiskSchedulingInput): PlannedMove[] {
  const maxCyl = input.cylinderCount - 1;
  const head = input.initialHead;
  const reqs = [...input.requests];
  const moves: PlannedMove[] = [];

  switch (input.algorithm) {
    case 'FCFS': {
      for (const r of reqs) {
        moves.push({
          target: r,
          isRequestServed: true,
          isReturnJump: false,
          reason: `Next request in arrival queue is cylinder ${r}.`,
          rule: 'FCFS services requests strictly in FIFO queue order.',
        });
      }
      break;
    }

    case 'SSTF': {
      let cur = head;
      const remaining = [...reqs];
      while (remaining.length > 0) {
        let bestIdx = 0;
        let bestDist = Math.abs(remaining[0] - cur);
        for (let i = 1; i < remaining.length; i += 1) {
          const d = Math.abs(remaining[i] - cur);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        }
        const target = remaining.splice(bestIdx, 1)[0];
        moves.push({
          target,
          isRequestServed: true,
          isReturnJump: false,
          reason: `Cylinder ${target} has the shortest seek distance (${bestDist}) from ${cur}.`,
          rule: 'SSTF greedily selects the pending request closest to the current head.',
          candidates: [target, ...remaining].slice(0, 4),
        });
        cur = target;
      }
      break;
    }

    case 'SCAN':
    case 'LOOK': {
      const isScan = input.algorithm === 'SCAN';
      const left = reqs.filter((r) => r < head).sort((a, b) => b - a);
      const right = reqs.filter((r) => r >= head).sort((a, b) => a - b);

      const firstSide = input.direction === 'LEFT' ? left : right;
      const secondSide = input.direction === 'LEFT' ? right : left;
      const boundary = input.direction === 'LEFT' ? 0 : maxCyl;

      for (const r of firstSide) {
        moves.push({
          target: r,
          isRequestServed: true,
          isReturnJump: false,
          reason: `Sweeping ${input.direction} toward cylinder ${r}.`,
          rule: `${input.algorithm} services all requests in the current direction (${input.direction}).`,
        });
      }

      if (secondSide.length > 0) {
        if (isScan && (firstSide.at(-1) ?? head) !== boundary) {
          moves.push({
            target: boundary,
            isRequestServed: false,
            isReturnJump: false,
            reason: `SCAN must travel all the way to disk boundary cylinder ${boundary} before reversing.`,
            rule: 'SCAN touches the physical end cylinder before reversing (unlike LOOK).',
          });
        }
        const revDir = input.direction === 'LEFT' ? 'RIGHT' : 'LEFT';
        for (const r of secondSide) {
          moves.push({
            target: r,
            isRequestServed: true,
            isReturnJump: false,
            reason: `Reversed direction to ${revDir}; servicing cylinder ${r}.`,
            rule: `${input.algorithm} services remaining requests on the return sweep.`,
          });
        }
      }
      break;
    }

    case 'C_SCAN':
    case 'C_LOOK': {
      const isCScan = input.algorithm === 'C_SCAN';
      const right = reqs.filter((r) => r >= head).sort((a, b) => a - b);
      const left = reqs.filter((r) => r < head).sort((a, b) => a - b);

      if (input.direction === 'RIGHT') {
        for (const r of right) {
          moves.push({
            target: r,
            isRequestServed: true,
            isReturnJump: false,
            reason: `Sweeping RIGHT toward cylinder ${r}.`,
            rule: `${input.algorithm} services requests moving RIGHT.`,
          });
        }
        if (left.length > 0) {
          if (isCScan && (right.at(-1) ?? head) !== maxCyl) {
            moves.push({
              target: maxCyl,
              isRequestServed: false,
              isReturnJump: false,
              reason: `C-SCAN reaches end cylinder ${maxCyl} before wrapping.`,
              rule: 'C-SCAN travels to max cylinder (unlike C-LOOK).',
            });
          }
          if (isCScan) {
            moves.push({
              target: 0,
              isRequestServed: false,
              isReturnJump: true,
              reason: `Circular return jump from ${maxCyl} to cylinder 0 without servicing.`,
              rule: 'C-SCAN jumps back to cylinder 0 and continues RIGHT.',
            });
          }
          left.forEach((r, idx) => {
            moves.push({
              target: r,
              isRequestServed: true,
              isReturnJump: !isCScan && idx === 0,
              reason:
                !isCScan && idx === 0
                  ? `C-LOOK jumps directly to lowest pending request (${r}).`
                  : `Continuing RIGHT sweep to cylinder ${r}.`,
              rule: `${input.algorithm} only services requests in one direction (RIGHT).`,
            });
          });
        }
      } else {
        const leftDesc = reqs.filter((r) => r <= head).sort((a, b) => b - a);
        const rightDesc = reqs.filter((r) => r > head).sort((a, b) => b - a);
        for (const r of leftDesc) {
          moves.push({
            target: r,
            isRequestServed: true,
            isReturnJump: false,
            reason: `Sweeping LEFT toward cylinder ${r}.`,
            rule: `${input.algorithm} services requests moving LEFT.`,
          });
        }
        if (rightDesc.length > 0) {
          if (isCScan && (leftDesc.at(-1) ?? head) !== 0) {
            moves.push({
              target: 0,
              isRequestServed: false,
              isReturnJump: false,
              reason: `C-SCAN reaches cylinder 0 before wrapping.`,
              rule: 'C-SCAN travels to cylinder 0 (unlike C-LOOK).',
            });
          }
          if (isCScan) {
            moves.push({
              target: maxCyl,
              isRequestServed: false,
              isReturnJump: true,
              reason: `Circular return jump from 0 to cylinder ${maxCyl}.`,
              rule: 'C-SCAN jumps to max cylinder and continues LEFT.',
            });
          }
          rightDesc.forEach((r, idx) => {
            moves.push({
              target: r,
              isRequestServed: true,
              isReturnJump: !isCScan && idx === 0,
              reason:
                !isCScan && idx === 0
                  ? `C-LOOK jumps directly to highest pending request (${r}).`
                  : `Continuing LEFT sweep to cylinder ${r}.`,
              rule: `${input.algorithm} only services requests in one direction (LEFT).`,
            });
          });
        }
      }
      break;
    }
  }

  return moves;
}

export const diskSchedulingEngine: SimulationEngine<
  DiskSchedulingInput,
  DiskStepState,
  DiskEvent,
  DiskSchedulingMetrics
> = {
  validate(input: DiskSchedulingInput): ValidationResult {
    const errors: string[] = [];
    if (!Number.isInteger(input.cylinderCount) || input.cylinderCount < 10) {
      errors.push('Cylinder count must be an integer >= 10.');
    }
    if (
      !Number.isInteger(input.initialHead) ||
      input.initialHead < 0 ||
      input.initialHead >= input.cylinderCount
    ) {
      errors.push(
        `Initial head must be an integer between 0 and ${input.cylinderCount - 1}.`
      );
    }
    if (!input.requests || input.requests.length === 0) {
      errors.push('Add at least one cylinder request.');
    } else if (
      input.requests.some(
        (r) => !Number.isInteger(r) || r < 0 || r >= input.cylinderCount
      )
    ) {
      errors.push(
        `All requests must be integers between 0 and ${input.cylinderCount - 1}.`
      );
    }
    return { valid: errors.length === 0, errors };
  },

  run(
    input: DiskSchedulingInput
  ): SimulationResult<DiskStepState, DiskEvent, DiskSchedulingMetrics> {
    const moves = buildMoveSequence(input);
    let head = input.initialHead;
    let totalMovement = 0;
    let movementWithoutJump = 0;
    const pending = [...input.requests];
    const serviceOrder: number[] = [];
    const visitedPath: DiskHop[] = [
      {
        cylinder: head,
        hopDistance: 0,
        isRequestServed: false,
        isReturnJump: false,
      },
    ];

    const steps: SimulationStep<DiskStepState, DiskEvent>[] = [];

    steps.push({
      stepIndex: 0,
      tick: 0,
      state: {
        tick: 0,
        cylinderCount: input.cylinderCount,
        headPosition: head,
        visitedPath: [...visitedPath],
        serviceOrder: [],
        pendingRequests: [...pending],
        lastSeekDistance: 0,
        totalHeadMovement: 0,
        movementWithoutReturnJump: 0,
        averageSeekMovement: 0,
      },
      events: [],
      explanation: {
        whatHappened: `Disk arm positioned at cylinder ${head} (0..${input.cylinderCount - 1}), direction ${input.direction}.`,
        whyItHappened: `${pending.length} I/O request(s) waiting in the queue.`,
        whichRule: `${input.algorithm} disk scheduling.`,
        whatNext: 'Begin moving the read/write head.',
        remember:
          'SCAN/C-SCAN travel to physical disk boundaries; LOOK/C-LOOK stop at the last pending request.',
      },
    });

    moves.forEach((move, idx) => {
      const dist = Math.abs(move.target - head);
      totalMovement += dist;
      if (!move.isReturnJump) {
        movementWithoutJump += dist;
      }

      if (move.isRequestServed) {
        serviceOrder.push(move.target);
        const remIdx = pending.indexOf(move.target);
        if (remIdx !== -1) pending.splice(remIdx, 1);
      }

      visitedPath.push({
        cylinder: move.target,
        hopDistance: dist,
        isRequestServed: move.isRequestServed,
        isReturnJump: move.isReturnJump,
      });

      const prevHead = head;
      head = move.target;

      const avg =
        serviceOrder.length > 0
          ? Number((totalMovement / serviceOrder.length).toFixed(2))
          : 0;

      const events: DiskEvent[] = [
        {
          type: move.isReturnJump
            ? 'CIRCULAR_JUMP'
            : move.isRequestServed
              ? 'SERVE'
              : 'BOUNDARY_REVERSE',
          cylinder: move.target,
          detail: `${prevHead} → ${move.target} (distance ${dist})`,
        },
      ];

      steps.push({
        stepIndex: idx + 1,
        tick: idx + 1,
        state: {
          tick: idx + 1,
          cylinderCount: input.cylinderCount,
          headPosition: head,
          visitedPath: visitedPath.map((h) => ({ ...h })),
          serviceOrder: [...serviceOrder],
          pendingRequests: [...pending],
          lastSeekDistance: dist,
          totalHeadMovement: totalMovement,
          movementWithoutReturnJump: movementWithoutJump,
          averageSeekMovement: avg,
        },
        events,
        explanation: {
          whatHappened: move.isRequestServed
            ? `Head moved ${prevHead} → ${move.target} (seek = ${dist}) and serviced request ${move.target}.`
            : `Head moved ${prevHead} → ${move.target} (seek = ${dist}) without servicing a request.`,
          whyItHappened: move.reason,
          whichRule: move.rule,
          whatNext:
            pending.length > 0
              ? `${pending.length} request(s) remaining.`
              : 'All disk requests serviced.',
          remember:
            'Total Head Movement = sum of |nextCylinder - currentCylinder| across all hops.',
        },
        ...(move.isRequestServed && pending.length > 1
          ? {
              checkpointPrompt: {
                question: `From cylinder ${prevHead} moving ${input.direction} under ${input.algorithm}, which cylinder is visited at this step?`,
                options: Array.from(new Set([move.target, ...pending])).slice(0, 4).map(String),
                correctOption: String(move.target),
                hint: move.reason,
              },
            }
          : {}),
      });
    });

    const avgFinal = Number(
      (totalMovement / input.requests.length).toFixed(2)
    );

    return {
      steps,
      finalMetrics: {
        algorithm: input.algorithm,
        cylinderCount: input.cylinderCount,
        initialHead: input.initialHead,
        direction: input.direction,
        requestCount: input.requests.length,
        serviceOrder,
        totalHeadMovement: totalMovement,
        movementWithoutReturnJump: movementWithoutJump,
        averageSeekMovement: avgFinal,
      },
    };
  },
};

export const ALL_DISK_ALGORITHMS: DiskAlgorithm[] = [
  'FCFS',
  'SSTF',
  'SCAN',
  'C_SCAN',
  'LOOK',
  'C_LOOK',
];

export function compareDiskAlgorithms(
  cylinderCount: number,
  initialHead: number,
  direction: DiskDirection,
  requests: number[]
): DiskSchedulingMetrics[] {
  return ALL_DISK_ALGORITHMS.map(
    (algorithm) =>
      diskSchedulingEngine.run({
        cylinderCount,
        initialHead,
        direction,
        requests,
        algorithm,
      }).finalMetrics
  );
}
