import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  BankersEvent,
  BankersInput,
  BankersMetrics,
  BankersStepState,
} from './types';

function leq(a: number[], b: number[]): boolean {
  return a.every((v, idx) => v <= b[idx]);
}

function addVec(a: number[], b: number[]): number[] {
  return a.map((v, idx) => v + b[idx]);
}

function subVec(a: number[], b: number[]): number[] {
  return a.map((v, idx) => v - b[idx]);
}

function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => [...row]);
}

function computeNeed(max: number[][], alloc: number[][]): number[][] {
  return max.map((row, i) => row.map((v, j) => v - alloc[i][j]));
}

export const bankersEngine: SimulationEngine<
  BankersInput,
  BankersStepState,
  BankersEvent,
  BankersMetrics
> = {
  validate(input: BankersInput): ValidationResult {
    const errors: string[] = [];
    const n = input.allocation.length;
    const m = input.available.length;

    if (n < 1 || n > 8) errors.push('Process count must be between 1 and 8.');
    if (m < 1 || m > 5) errors.push('Resource types must be between 1 and 5.');

    if (input.maximum.length !== n) {
      errors.push('Maximum and Allocation matrices must have the same number of processes.');
    }

    if (input.available.some((v) => !Number.isInteger(v) || v < 0)) {
      errors.push('Available vector values must be integers >= 0.');
    }

    for (let i = 0; i < n; i += 1) {
      const allocRow = input.allocation[i];
      const maxRow = input.maximum[i];
      if (!allocRow || allocRow.length !== m || !maxRow || maxRow.length !== m) {
        errors.push(`P${i}: Row length must match ${m} resource types.`);
        continue;
      }
      for (let j = 0; j < m; j += 1) {
        if (!Number.isInteger(allocRow[j]) || allocRow[j] < 0) {
          errors.push(`P${i}: Allocation values must be integers >= 0.`);
        }
        if (!Number.isInteger(maxRow[j]) || maxRow[j] < 0) {
          errors.push(`P${i}: Maximum values must be integers >= 0.`);
        }
        if (allocRow[j] > maxRow[j]) {
          errors.push(
            `P${i} Resource ${String.fromCharCode(65 + j)}: Allocation (${allocRow[j]}) cannot exceed Maximum (${maxRow[j]}).`
          );
        }
      }
    }

    if (input.resourceRequest) {
      const { processIndex, request } = input.resourceRequest;
      if (processIndex < 0 || processIndex >= n) {
        errors.push('Resource request process index is out of range.');
      }
      if (request.length !== m || request.some((v) => !Number.isInteger(v) || v < 0)) {
        errors.push('Resource request values must be non-negative integers.');
      }
    }

    return { valid: errors.length === 0, errors };
  },

  run(
    input: BankersInput
  ): SimulationResult<BankersStepState, BankersEvent, BankersMetrics> {
    const n = input.allocation.length;
    const m = input.available.length;
    const resourceNames = Array.from({ length: m }, (_, i) =>
      String.fromCharCode(65 + i)
    );

    let available = [...input.available];
    const maximum = cloneMatrix(input.maximum);
    let allocation = cloneMatrix(input.allocation);
    let need = computeNeed(maximum, allocation);

    const origAvailable = [...available];
    const origAllocation = cloneMatrix(allocation);
    const origNeed = cloneMatrix(need);

    let work = [...available];
    const finish = Array<boolean>(n).fill(false);
    const safeSequence: string[] = [];
    const steps: SimulationStep<BankersStepState, BankersEvent>[] = [];

    const pushStep = (
      events: BankersEvent[],
      activeProcessIndex: number | null,
      systemStatus: BankersStepState['systemStatus'],
      whatHappened: string,
      whyItHappened: string,
      whichRule: string,
      whatNext: string,
      remember: string,
      checkpointPrompt?: SimulationStep<BankersStepState, BankersEvent>['checkpointPrompt']
    ) => {
      steps.push({
        stepIndex: steps.length,
        tick: steps.length,
        state: {
          tick: steps.length,
          resourceNames,
          available: [...available],
          work: [...work],
          maximum: cloneMatrix(maximum),
          allocation: cloneMatrix(allocation),
          need: cloneMatrix(need),
          finish: [...finish],
          safeSequence: [...safeSequence],
          activeProcessIndex,
          systemStatus,
        },
        events,
        explanation: {
          whatHappened,
          whyItHappened,
          whichRule,
          whatNext,
          remember,
        },
        checkpointPrompt,
      });
    };

    pushStep(
      [{ type: 'INIT', detail: 'Computed Need = Maximum - Allocation.' }],
      null,
      'CHECKING',
      `Initialized Banker's Algorithm for ${n} processes and ${m} resource types.`,
      'Need matrix is computed as Need[i] = Maximum[i] - Allocation[i], and Work is initialized to Available.',
      'Need = Maximum - Allocation.',
      input.resourceRequest
        ? `Validate Resource Request for P${input.resourceRequest.processIndex}.`
        : 'Run the Safety Algorithm to check for a Safe Sequence.',
      'Banker’s Algorithm avoids deadlock by only granting requests that leave the system in a Safe State.'
    );

    let requestGranted: boolean | null = null;

    // Resource Request Algorithm (if provided)
    if (input.resourceRequest) {
      const { processIndex, request } = input.resourceRequest;
      const pName = `P${processIndex}`;

      if (!leq(request, need[processIndex])) {
        requestGranted = false;
        pushStep(
          [
            {
              type: 'REQUEST_DENIED_ROLLBACK',
              processIndex,
              detail: `${pName} request [${request.join(',')}] exceeds Need [${need[processIndex].join(',')}].`,
            },
          ],
          processIndex,
          'REQUEST_REJECTED',
          `Rejected ${pName} request [${request.join(', ')}]: exceeded its declared Need.`,
          `Need[${pName}] is [${need[processIndex].join(', ')}].`,
          'Condition 1: Request[i] <= Need[i] failed.',
          'Process must not request more than its declared Maximum.',
          'A process cannot claim more resources than its initial Maximum declaration.'
        );
        return {
          steps,
          finalMetrics: {
            processCount: n,
            resourceCount: m,
            isSafe: false,
            requestGranted: false,
            safeSequence: [],
            finalWork: work,
            systemStatus: 'REQUEST_REJECTED',
          },
        };
      }

      if (!leq(request, available)) {
        requestGranted = false;
        pushStep(
          [
            {
              type: 'REQUEST_DENIED_ROLLBACK',
              processIndex,
              detail: `${pName} must wait: request [${request.join(',')}] > Available [${available.join(',')}].`,
            },
          ],
          processIndex,
          'REQUEST_REJECTED',
          `${pName} must wait: request [${request.join(', ')}] exceeds Available [${available.join(', ')}].`,
          'Not enough free instances are currently in the resource pool.',
          'Condition 2: Request[i] <= Available failed.',
          `${pName} waits until other processes release resources.`,
          'Waiting for Available resources is not yet a deadlock.'
        );
        return {
          steps,
          finalMetrics: {
            processCount: n,
            resourceCount: m,
            isSafe: false,
            requestGranted: false,
            safeSequence: [],
            finalWork: work,
            systemStatus: 'REQUEST_REJECTED',
          },
        };
      }

      // Tentatively allocate
      available = subVec(available, request);
      allocation[processIndex] = addVec(allocation[processIndex], request);
      need[processIndex] = subVec(need[processIndex], request);
      work = [...available];

      pushStep(
        [
          {
            type: 'REQUEST_TENTATIVE',
            processIndex,
            detail: `Tentatively allocated [${request.join(',')}] to ${pName}.`,
          },
        ],
        processIndex,
        'CHECKING',
        `Tentatively granted [${request.join(', ')}] to ${pName}; Available is now [${available.join(', ')}].`,
        'Request passed both Need and Available checks.',
        'Tentatively update Available, Allocation, and Need, then run Safety Algorithm.',
        'Verify whether a Safe Sequence still exists.',
        'If the resulting state is Unsafe, the OS rolls back the tentative allocation.'
      );
    }

    // Safety Algorithm (circular scan pointer matches standard Silberschatz textbook order)
    let progress = true;
    let scanStart = 0;
    while (safeSequence.length < n && progress) {
      progress = false;
      const eligibleIndices: number[] = [];
      for (let offset = 0; offset < n; offset += 1) {
        const i = (scanStart + offset) % n;
        if (!finish[i] && leq(need[i], work)) {
          eligibleIndices.push(i);
        }
      }

      if (eligibleIndices.length > 0) {
        const chosen = eligibleIndices[0];
        scanStart = (chosen + 1) % n;
        const pName = `P${chosen}`;
        const prevWork = [...work];
        finish[chosen] = true;
        work = addVec(work, allocation[chosen]);
        safeSequence.push(pName);
        progress = true;

        pushStep(
          [
            {
              type: 'PROCESS_FINISH',
              processIndex: chosen,
              detail: `${pName} can finish (Need [${need[chosen].join(',')}] <= Work [${prevWork.join(',')}]).`,
            },
          ],
          chosen,
          'CHECKING',
          `${pName} completed and released Allocation [${allocation[chosen].join(', ')}] → Work = [${work.join(', ')}].`,
          `Need[${pName}] = [${need[chosen].join(', ')}] <= Work = [${prevWork.join(', ')}].`,
          'Safety Algorithm: find unfinished P_i with Need[i] <= Work, then Work += Allocation[i].',
          safeSequence.length < n
            ? 'Scan remaining unfinished processes with updated Work.'
            : 'All processes finished! Confirm Safe State.',
          'Each finishing process returns its held resources, growing Work for the next process.',
          eligibleIndices.length > 1
            ? {
                question: `With Work = [${prevWork.join(', ')}], which eligible process is chosen next in scan order?`,
                options: eligibleIndices.map((idx) => `P${idx}`),
                correctOption: pName,
                hint: 'Safety scan checks processes in index order among those with Need <= Work.',
              }
            : undefined
        );
      }
    }

    const isSafe = safeSequence.length === n;

    if (isSafe) {
      if (input.resourceRequest) requestGranted = true;
      pushStep(
        [
          {
            type: 'SAFE_STATE',
            detail: `System is SAFE. Sequence: <${safeSequence.join(', ')}>`,
          },
        ],
        null,
        'SAFE',
        input.resourceRequest
          ? `Request GRANTED! Safe Sequence found: <${safeSequence.join(', ')}>.`
          : `System is in a SAFE STATE! Safe Sequence: <${safeSequence.join(', ')}>.`,
        'Every process was able to finish and release its resources.',
        'All Finish[i] == true.',
        'No further steps needed.',
        'A Safe State guarantees deadlock cannot occur along this execution sequence.'
      );
    } else {
      if (input.resourceRequest) {
        requestGranted = false;
        available = origAvailable;
        allocation = origAllocation;
        need = origNeed;
      }
      pushStep(
        [
          {
            type: 'UNSAFE_STATE',
            detail: 'No Safe Sequence exists — System is UNSAFE.',
          },
        ],
        null,
        'UNSAFE',
        input.resourceRequest
          ? `Request DENIED & ROLLED BACK! Granting it would leave the system in an UNSAFE STATE.`
          : `System is in an UNSAFE STATE (only ${safeSequence.length}/${n} processes could finish).`,
        'Remaining unfinished processes all have Need > Work.',
        'Safety Algorithm terminated with Finish[i] == false for at least one process.',
        'Note: Unsafe does NOT always mean already deadlocked, but deadlock is possible if processes request max Need.',
        'Unsafe state != Deadlock: an unsafe state merely removes the guarantee of deadlock freedom.'
      );
    }

    return {
      steps,
      finalMetrics: {
        processCount: n,
        resourceCount: m,
        isSafe,
        requestGranted,
        safeSequence,
        finalWork: work,
        systemStatus: isSafe ? 'SAFE' : 'UNSAFE',
      },
    };
  },
};
