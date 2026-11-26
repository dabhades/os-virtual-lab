import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  FitStrategy,
  MemoryAllocationInput,
  MemoryAllocationMetrics,
  MemoryBlock,
  MemoryEvent,
  MemoryStepState,
  PartitionMode,
} from './types';

function computeMetrics(
  blocks: MemoryBlock[],
  totalMemory: number,
  partitionMode: PartitionMode
) {
  let allocatedMemory = 0;
  let freeMemory = 0;
  let internalFragmentation = 0;
  let largestFreeBlock = 0;
  let freeBlockCount = 0;

  for (const b of blocks) {
    if (b.status === 'ALLOCATED') {
      allocatedMemory += b.size;
      if (typeof b.requestedSize === 'number') {
        internalFragmentation += Math.max(0, b.size - b.requestedSize);
      }
    } else {
      freeMemory += b.size;
      freeBlockCount += 1;
      if (b.size > largestFreeBlock) largestFreeBlock = b.size;
    }
  }

  const externalFragmentation =
    partitionMode === 'VARIABLE' && freeBlockCount > 1
      ? freeMemory - largestFreeBlock
      : 0;

  const utilizationPercent =
    totalMemory > 0
      ? Number((((allocatedMemory - internalFragmentation) / totalMemory) * 100).toFixed(2))
      : 0;

  return {
    allocatedMemory,
    freeMemory,
    internalFragmentation,
    externalFragmentation,
    largestFreeBlock,
    utilizationPercent,
  };
}

function coalesceFreeBlocks(blocks: MemoryBlock[]): MemoryBlock[] {
  const result: MemoryBlock[] = [];
  for (const block of blocks) {
    const prev = result[result.length - 1];
    if (prev && prev.status === 'FREE' && block.status === 'FREE') {
      prev.size += block.size;
    } else {
      result.push({ ...block });
    }
  }
  return result;
}

function selectBlockIndex(
  blocks: MemoryBlock[],
  size: number,
  strategy: FitStrategy,
  nextFitCursorAddr: number
): number {
  const candidates: { idx: number; block: MemoryBlock }[] = [];
  blocks.forEach((b, idx) => {
    if (b.status === 'FREE' && b.size >= size) {
      candidates.push({ idx, block: b });
    }
  });
  if (candidates.length === 0) return -1;

  switch (strategy) {
    case 'FIRST_FIT':
      return candidates[0].idx;
    case 'BEST_FIT':
      candidates.sort((a, b) => a.block.size - b.block.size || a.idx - b.idx);
      return candidates[0].idx;
    case 'WORST_FIT':
      candidates.sort((a, b) => b.block.size - a.block.size || a.idx - b.idx);
      return candidates[0].idx;
    case 'NEXT_FIT': {
      const forward = candidates.find(
        (c) =>
          c.block.startAddr >= nextFitCursorAddr ||
          c.block.startAddr + c.block.size > nextFitCursorAddr
      );
      return (forward ?? candidates[0]).idx;
    }
  }
}

export const memoryAllocationEngine: SimulationEngine<
  MemoryAllocationInput,
  MemoryStepState,
  MemoryEvent,
  MemoryAllocationMetrics
> = {
  validate(input: MemoryAllocationInput): ValidationResult {
    const errors: string[] = [];
    if (!Number.isInteger(input.totalMemory) || input.totalMemory < 16) {
      errors.push('Total memory must be an integer >= 16 KB.');
    }
    if (input.partitionMode === 'FIXED') {
      if (!input.fixedPartitions || input.fixedPartitions.length === 0) {
        errors.push('Fixed partitioning requires at least one partition.');
      } else {
        const sum = input.fixedPartitions.reduce((a, b) => a + b, 0);
        if (input.fixedPartitions.some((p) => !Number.isInteger(p) || p <= 0)) {
          errors.push('All fixed partition sizes must be integers > 0.');
        }
        if (sum > input.totalMemory) {
          errors.push(
            `Sum of fixed partitions (${sum} KB) exceeds total memory (${input.totalMemory} KB).`
          );
        }
      }
    }
    if (!input.operations || input.operations.length === 0) {
      errors.push('Add at least one memory operation.');
    }
    for (const op of input.operations) {
      if (op.type === 'ALLOCATE') {
        if (!op.pid?.trim()) errors.push('Allocate operation requires a PID.');
        if (!Number.isInteger(op.size) || (op.size ?? 0) <= 0) {
          errors.push(`Allocate ${op.pid ?? ''}: size must be an integer > 0.`);
        }
      }
      if (op.type === 'DEALLOCATE' && !op.pid?.trim()) {
        errors.push('Deallocate operation requires a PID.');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  run(
    input: MemoryAllocationInput
  ): SimulationResult<MemoryStepState, MemoryEvent, MemoryAllocationMetrics> {
    let blocks: MemoryBlock[] = [];
    if (input.partitionMode === 'FIXED') {
      let addr = 0;
      input.fixedPartitions.forEach((size, idx) => {
        blocks.push({
          id: `part-${idx}`,
          startAddr: addr,
          size,
          status: 'FREE',
        });
        addr += size;
      });
    } else {
      blocks = [
        {
          id: 'free-0',
          startAddr: 0,
          size: input.totalMemory,
          status: 'FREE',
        },
      ];
    }

    let nextFitCursorAddr = 0;
    let allocationSuccessCount = 0;
    let allocationFailCount = 0;
    let blockCounter = 1;

    const steps: SimulationStep<MemoryStepState, MemoryEvent>[] = [];

    const pushStep = (
      tick: number,
      label: string,
      events: MemoryEvent[],
      whatHappened: string,
      whyItHappened: string,
      whichRule: string,
      whatNext: string,
      remember: string,
      checkpointPrompt?: SimulationStep<MemoryStepState, MemoryEvent>['checkpointPrompt']
    ) => {
      const m = computeMetrics(blocks, input.totalMemory, input.partitionMode);
      steps.push({
        stepIndex: steps.length,
        tick,
        state: {
          tick,
          blocks: blocks.map((b) => ({ ...b })),
          nextFitCursorAddr,
          ...m,
          allocationSuccessCount,
          allocationFailCount,
          lastOperationLabel: label,
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
      0,
      'Initial RAM',
      [],
      `Initialized ${input.totalMemory} KB RAM in ${input.partitionMode} mode.`,
      'Memory starts empty before any process requests.',
      `${input.partitionMode} partitioning with ${input.fitStrategy}.`,
      'Execute the first memory operation.',
      'Fixed partitions cause internal fragmentation; variable partitions can cause external fragmentation.'
    );

    input.operations.forEach((op, idx) => {
      const tick = idx + 1;
      if (op.type === 'ALLOCATE') {
        const pid = op.pid!.trim();
        const reqSize = op.size!;

        const candidateLabels = blocks
          .filter((b) => b.status === 'FREE' && b.size >= reqSize)
          .map((b) => `${b.startAddr}KB (${b.size}KB)`);

        const chosenIdx = selectBlockIndex(
          blocks,
          reqSize,
          input.fitStrategy,
          nextFitCursorAddr
        );

        if (chosenIdx === -1) {
          allocationFailCount += 1;
          const totalFree = blocks
            .filter((b) => b.status === 'FREE')
            .reduce((s, b) => s + b.size, 0);
          const extNote =
            totalFree >= reqSize
              ? `Total free RAM is ${totalFree} KB, but no single contiguous hole fits ${reqSize} KB (External Fragmentation).`
              : `Only ${totalFree} KB free RAM remains.`;

          pushStep(
            tick,
            `ALLOC ${pid} (${reqSize} KB) — FAILED`,
            [
              {
                type: 'ALLOCATE_FAIL',
                pid,
                detail: `Failed to allocate ${reqSize} KB for ${pid}.`,
              },
            ],
            `Allocation of ${pid} (${reqSize} KB) failed.`,
            extNote,
            `${input.fitStrategy} requires a single free block >= ${reqSize} KB.`,
            totalFree >= reqSize
              ? 'Run Compaction or Deallocate another process.'
              : 'Deallocate an existing process to free memory.',
            'External fragmentation happens when free memory is scattered into small non-contiguous holes.'
          );
          return;
        }

        const target = blocks[chosenIdx];
        const chosenLabel = `${target.startAddr}KB (${target.size}KB)`;

        if (input.partitionMode === 'FIXED') {
          blocks[chosenIdx] = {
            ...target,
            status: 'ALLOCATED',
            pid,
            requestedSize: reqSize,
          };
          nextFitCursorAddr = target.startAddr + target.size;
        } else {
          const leftover = target.size - reqSize;
          const allocatedBlock: MemoryBlock = {
            id: `alloc-${blockCounter++}`,
            startAddr: target.startAddr,
            size: reqSize,
            status: 'ALLOCATED',
            pid,
            requestedSize: reqSize,
          };
          const replacement: MemoryBlock[] = [allocatedBlock];
          if (leftover > 0) {
            replacement.push({
              id: `free-${blockCounter++}`,
              startAddr: target.startAddr + reqSize,
              size: leftover,
              status: 'FREE',
            });
          }
          blocks.splice(chosenIdx, 1, ...replacement);
          nextFitCursorAddr = target.startAddr + reqSize;
        }

        allocationSuccessCount += 1;

        pushStep(
          tick,
          `ALLOC ${pid} (${reqSize} KB)`,
          [
            {
              type: 'ALLOCATE_OK',
              pid,
              detail: `Allocated ${reqSize} KB to ${pid} at ${target.startAddr} KB.`,
            },
          ],
          `Allocated ${pid} (${reqSize} KB) at address ${target.startAddr} KB (block size ${target.size} KB).`,
          `Block at ${chosenLabel} satisfied the ${reqSize} KB request.`,
          `${input.fitStrategy} selected ${chosenLabel}.`,
          'Proceed to the next memory request.',
          input.partitionMode === 'FIXED'
            ? `Internal waste in this partition: ${target.size - reqSize} KB.`
            : 'Variable partitioning splits the chosen hole to minimize internal waste.',
          candidateLabels.length > 1
            ? {
                question: `Which free block does ${input.fitStrategy} pick for ${pid} (${reqSize} KB)?`,
                options: candidateLabels,
                correctOption: chosenLabel,
                hint: `Check ${input.fitStrategy} selection order among fitting holes.`,
              }
            : undefined
        );
      } else if (op.type === 'DEALLOCATE') {
        const pid = op.pid!.trim();
        let freed = 0;
        blocks = blocks.map((b) => {
          if (b.status === 'ALLOCATED' && b.pid === pid) {
            freed += b.size;
            return {
              id: b.id,
              startAddr: b.startAddr,
              size: b.size,
              status: 'FREE',
            };
          }
          return b;
        });

        if (input.partitionMode === 'VARIABLE') {
          blocks = coalesceFreeBlocks(blocks);
        }

        pushStep(
          tick,
          `FREE ${pid}`,
          [
            {
              type: 'DEALLOCATE',
              pid,
              detail: `Deallocated ${pid} (${freed} KB freed).`,
            },
          ],
          `Deallocated ${pid}, freeing ${freed} KB.`,
          `${pid} released its memory block(s) back to the OS.`,
          input.partitionMode === 'VARIABLE'
            ? 'Adjacent free blocks are coalesced into a larger free hole.'
            : 'Fixed partition is marked FREE.',
          'Freed memory is now available for upcoming allocations.',
          'Coalescing prevents unnecessary external fragmentation.'
        );
      } else if (op.type === 'COMPACT') {
        if (input.partitionMode === 'FIXED') {
          pushStep(
            tick,
            'COMPACT (Skipped)',
            [],
            'Compaction skipped in Fixed Partitioning mode.',
            'Fixed partitions have static boundaries and cannot be relocated.',
            'Compaction only applies to Variable Partitioning.',
            'Continue with remaining operations.',
            'Switch to Variable Partitioning to observe Compaction.'
          );
          return;
        }

        const allocated = blocks.filter((b) => b.status === 'ALLOCATED');
        let addr = 0;
        const compacted: MemoryBlock[] = allocated.map((b) => {
          const relocated: MemoryBlock = { ...b, startAddr: addr };
          addr += b.size;
          return relocated;
        });
        const totalFree = input.totalMemory - addr;
        if (totalFree > 0) {
          compacted.push({
            id: `free-compact-${blockCounter++}`,
            startAddr: addr,
            size: totalFree,
            status: 'FREE',
          });
        }
        blocks = compacted;
        nextFitCursorAddr = 0;

        pushStep(
          tick,
          'COMPACT RAM',
          [
            {
              type: 'COMPACT',
              detail: `Compacted RAM; consolidated ${totalFree} KB free space.`,
            },
          ],
          `Compacted RAM: relocated ${allocated.length} process(es) contiguously, creating one ${totalFree} KB free block.`,
          'External fragmentation was eliminated by shifting allocated blocks toward address 0.',
          'Dynamic relocation updates base addresses to pack all free holes together.',
          'Previously failing large allocations can now succeed.',
          'Compaction eliminates external fragmentation at the cost of CPU relocation overhead.'
        );
      }
    });

    const finalM = computeMetrics(blocks, input.totalMemory, input.partitionMode);
    return {
      steps,
      finalMetrics: {
        partitionMode: input.partitionMode,
        fitStrategy: input.fitStrategy,
        totalMemory: input.totalMemory,
        ...finalM,
        allocationSuccessCount,
        allocationFailCount,
      },
    };
  },
};
