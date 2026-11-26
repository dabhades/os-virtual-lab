import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  PageAlgorithm,
  PageEvent,
  PageHistoryColumn,
  PageReplacementInput,
  PageReplacementMetrics,
  PageStepState,
} from './types';

export const pageReplacementEngine: SimulationEngine<
  PageReplacementInput,
  PageStepState,
  PageEvent,
  PageReplacementMetrics
> = {
  validate(input: PageReplacementInput): ValidationResult {
    const errors: string[] = [];
    if (!Number.isInteger(input.frameCount) || input.frameCount < 1 || input.frameCount > 8) {
      errors.push('Frame count must be an integer between 1 and 8.');
    }
    if (!input.referenceString || input.referenceString.length === 0) {
      errors.push('Reference string must contain at least one page number.');
    } else if (
      input.referenceString.some((p) => !Number.isInteger(p) || p < 0)
    ) {
      errors.push('All page numbers in the reference string must be integers >= 0.');
    }
    return { valid: errors.length === 0, errors };
  },

  run(
    input: PageReplacementInput
  ): SimulationResult<PageStepState, PageEvent, PageReplacementMetrics> {
    const frames: (number | null)[] = Array(input.frameCount).fill(null);
    const loadedAt: number[] = Array(input.frameCount).fill(-1);
    const lastUsedAt: number[] = Array(input.frameCount).fill(-1);
    const refBits: number[] = Array(input.frameCount).fill(0);
    const freqMap: Record<number, number> = {};
    let clockPointer = 0;

    let hits = 0;
    let faults = 0;
    const history: PageHistoryColumn[] = [];
    const steps: SimulationStep<PageStepState, PageEvent>[] = [];

    input.referenceString.forEach((page, i) => {
      const residentIdx = frames.indexOf(page);
      let outcome: 'HIT' | 'FAULT' = 'HIT';
      let replacedPage: number | null = null;
      let reason = '';
      const events: PageEvent[] = [];
      let checkpointPrompt:
        | SimulationStep<PageStepState, PageEvent>['checkpointPrompt']
        | undefined;

      if (residentIdx !== -1) {
        hits += 1;
        outcome = 'HIT';
        lastUsedAt[residentIdx] = i;
        refBits[residentIdx] = 1;
        freqMap[page] = (freqMap[page] ?? 0) + 1;
        reason = `Page ${page} is already in Frame ${residentIdx + 1} (Page Hit).`;
        events.push({
          type: 'HIT',
          page,
          detail: reason,
        });
      } else {
        faults += 1;
        outcome = 'FAULT';
        const emptyIdx = frames.indexOf(null);

        if (emptyIdx !== -1) {
          frames[emptyIdx] = page;
          loadedAt[emptyIdx] = i;
          lastUsedAt[emptyIdx] = i;
          refBits[emptyIdx] = 1;
          freqMap[page] = (freqMap[page] ?? 0) + 1;
          if (input.algorithm === 'SECOND_CHANCE') {
            clockPointer = (emptyIdx + 1) % input.frameCount;
          }
          reason = `Free frame available at Frame ${emptyIdx + 1}; loaded Page ${page}.`;
          events.push({
            type: 'FAULT_LOAD',
            page,
            detail: reason,
          });
        } else {
          // Replacement needed
          const residentBefore = frames.filter((p): p is number => p !== null);
          let victimIdx = 0;

          switch (input.algorithm) {
            case 'FIFO': {
              victimIdx = loadedAt.indexOf(Math.min(...loadedAt));
              reason = `FIFO evicted Page ${frames[victimIdx]} (loaded earliest at step ${loadedAt[victimIdx] + 1}).`;
              break;
            }
            case 'LRU': {
              victimIdx = lastUsedAt.indexOf(Math.min(...lastUsedAt));
              reason = `LRU evicted Page ${frames[victimIdx]} (least recently used at step ${lastUsedAt[victimIdx] + 1}).`;
              break;
            }
            case 'OPTIMAL': {
              let furthestDist = -1;
              for (let f = 0; f < input.frameCount; f += 1) {
                const candidate = frames[f]!;
                const nextPos = input.referenceString.indexOf(candidate, i + 1);
                const dist = nextPos === -1 ? Infinity : nextPos;
                if (
                  dist > furthestDist ||
                  (dist === furthestDist && loadedAt[f] < loadedAt[victimIdx])
                ) {
                  furthestDist = dist;
                  victimIdx = f;
                }
              }
              reason =
                furthestDist === Infinity
                  ? `Optimal evicted Page ${frames[victimIdx]} (never used again; FIFO tie-break if multiple).`
                  : `Optimal evicted Page ${frames[victimIdx]} (used furthest in future at step ${furthestDist + 1}).`;
              break;
            }
            case 'LFU': {
              let minFreq = Infinity;
              for (let f = 0; f < input.frameCount; f += 1) {
                const candidate = frames[f]!;
                const freq = freqMap[candidate] ?? 0;
                if (
                  freq < minFreq ||
                  (freq === minFreq && loadedAt[f] < loadedAt[victimIdx])
                ) {
                  minFreq = freq;
                  victimIdx = f;
                }
              }
              reason = `LFU evicted Page ${frames[victimIdx]} (lowest frequency=${minFreq}; ties broken by FIFO).`;
              break;
            }
            case 'SECOND_CHANCE': {
              let swept = 0;
              while (refBits[clockPointer] === 1) {
                refBits[clockPointer] = 0;
                clockPointer = (clockPointer + 1) % input.frameCount;
                swept += 1;
              }
              victimIdx = clockPointer;
              clockPointer = (clockPointer + 1) % input.frameCount;
              reason = `Second Chance (Clock) evicted Page ${frames[victimIdx]} (R=0 after clearing ${swept} R=1 bit(s)).`;
              break;
            }
          }

          replacedPage = frames[victimIdx]!;
          if (input.algorithm === 'LFU') {
            delete freqMap[replacedPage];
          }
          frames[victimIdx] = page;
          loadedAt[victimIdx] = i;
          lastUsedAt[victimIdx] = i;
          refBits[victimIdx] = 1;
          freqMap[page] = (freqMap[page] ?? 0) + 1;

          events.push({
            type: 'FAULT_REPLACE',
            page,
            replacedPage,
            detail: reason,
          });

          if (residentBefore.length > 1) {
            checkpointPrompt = {
              question: `Page ${page} caused a fault with full frames [${residentBefore.join(', ')}]. Which page is evicted under ${input.algorithm}?`,
              options: residentBefore.map(String),
              correctOption: String(replacedPage),
              hint: reason,
            };
          }
        }
      }

      const totalSoFar = i + 1;
      const hitRatio = Number(((hits / totalSoFar) * 100).toFixed(2));
      const faultRatio = Number(((faults / totalSoFar) * 100).toFixed(2));

      history.push({
        refIndex: i,
        page,
        frames: [...frames],
        outcome,
        replacedPage,
        reason,
      });

      steps.push({
        stepIndex: i,
        tick: i + 1,
        state: {
          tick: i + 1,
          currentPage: page,
          frames: [...frames],
          referenceBits: [...refBits],
          frequencies: { ...freqMap },
          clockPointer,
          outcome,
          replacedPage,
          replacementReason: reason,
          history: history.map((h) => ({ ...h, frames: [...h.frames] })),
          hits,
          faults,
          hitRatio,
          faultRatio,
        },
        events,
        explanation: {
          whatHappened:
            outcome === 'HIT'
              ? `Reference #${i + 1} (Page ${page}) resulted in a PAGE HIT.`
              : replacedPage !== null
                ? `Reference #${i + 1} (Page ${page}) caused a PAGE FAULT and replaced Page ${replacedPage}.`
                : `Reference #${i + 1} (Page ${page}) caused a PAGE FAULT and loaded into a free frame.`,
          whyItHappened: reason,
          whichRule: `${input.algorithm} policy with ${input.frameCount} frame(s).`,
          whatNext:
            i < input.referenceString.length - 1
              ? `Next reference is Page ${input.referenceString[i + 1]}.`
              : 'All page references processed.',
          remember:
            input.algorithm === 'FIFO'
              ? "FIFO is simple but can suffer from Belady's Anomaly (more frames can yield more faults)."
              : input.algorithm === 'OPTIMAL'
                ? 'Optimal gives the theoretical minimum page faults but requires future knowledge.'
                : `${input.algorithm} uses past access patterns to approximate Optimal replacement.`,
        },
        checkpointPrompt,
      });
    });

    const total = input.referenceString.length;
    return {
      steps,
      finalMetrics: {
        algorithm: input.algorithm,
        frameCount: input.frameCount,
        totalReferences: total,
        hits,
        faults,
        hitRatio: Number(((hits / total) * 100).toFixed(2)),
        faultRatio: Number(((faults / total) * 100).toFixed(2)),
      },
    };
  },
};

export const ALL_PAGE_ALGORITHMS: PageAlgorithm[] = [
  'FIFO',
  'LRU',
  'OPTIMAL',
  'LFU',
  'SECOND_CHANCE',
];

export function comparePageAlgorithms(
  referenceString: number[],
  frameCount: number
): PageReplacementMetrics[] {
  return ALL_PAGE_ALGORITHMS.map(
    (algorithm) =>
      pageReplacementEngine.run({
        referenceString,
        frameCount,
        algorithm,
      }).finalMetrics
  );
}
