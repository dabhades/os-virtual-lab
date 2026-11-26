import type {
  SimulationEngine,
  SimulationResult,
  SimulationStep,
  ValidationResult,
} from '../../types/simulation';
import type {
  SemaphoreSnapshot,
  SyncEvent,
  SyncInput,
  SyncMetrics,
  SyncProcessSnapshot,
  SyncStepState,
} from './types';

interface SimOp {
  pid: string;
  role: string;
  action:
    | { kind: 'ENTER_CS' }
    | { kind: 'EXIT_CS' }
    | { kind: 'LOAD_REG'; reg: string }
    | { kind: 'INC_REG'; reg: string }
    | { kind: 'STORE_REG'; reg: string }
    | { kind: 'WAIT'; sem: string }
    | { kind: 'SIGNAL'; sem: string }
    | { kind: 'PRODUCE'; item: string }
    | { kind: 'CONSUME' }
    | { kind: 'TAKE_FORK'; forkIdx: number }
    | { kind: 'PUT_FORK'; forkIdx: number }
    | { kind: 'START_READ' }
    | { kind: 'END_READ' }
    | { kind: 'START_WRITE' }
    | { kind: 'END_WRITE' };
}

function buildScenarioSchedule(input: SyncInput): {
  semaphores: Record<string, SemaphoreSnapshot>;
  ops: SimOp[];
  bufferSize: number;
  forkCount: number;
} {
  const sems: Record<string, SemaphoreSnapshot> = {};
  const ops: SimOp[] = [];
  let bufferSize = 0;
  let forkCount = 0;

  switch (input.scenario) {
    case 'CRITICAL_SECTION': {
      sems.mutex = { name: 'mutex', kind: 'MUTEX', value: 1, blockedQueue: [] };
      ops.push(
        { pid: 'P1', role: 'Worker', action: { kind: 'WAIT', sem: 'mutex' } },
        { pid: 'P1', role: 'Worker', action: { kind: 'ENTER_CS' } },
        { pid: 'P2', role: 'Worker', action: { kind: 'WAIT', sem: 'mutex' } },
        { pid: 'P1', role: 'Worker', action: { kind: 'EXIT_CS' } },
        { pid: 'P1', role: 'Worker', action: { kind: 'SIGNAL', sem: 'mutex' } },
        { pid: 'P2', role: 'Worker', action: { kind: 'ENTER_CS' } },
        { pid: 'P2', role: 'Worker', action: { kind: 'EXIT_CS' } },
        { pid: 'P2', role: 'Worker', action: { kind: 'SIGNAL', sem: 'mutex' } }
      );
      break;
    }

    case 'RACE_CONDITION': {
      // Interleave P1 and P2 reading counter=0 before either stores 1 -> lost update!
      ops.push(
        { pid: 'P1', role: 'Writer', action: { kind: 'LOAD_REG', reg: 'R1' } },
        { pid: 'P2', role: 'Writer', action: { kind: 'LOAD_REG', reg: 'R2' } },
        { pid: 'P1', role: 'Writer', action: { kind: 'INC_REG', reg: 'R1' } },
        { pid: 'P2', role: 'Writer', action: { kind: 'INC_REG', reg: 'R2' } },
        { pid: 'P1', role: 'Writer', action: { kind: 'STORE_REG', reg: 'R1' } },
        { pid: 'P2', role: 'Writer', action: { kind: 'STORE_REG', reg: 'R2' } }
      );
      break;
    }

    case 'MUTEX_LOCK': {
      sems.mutex = { name: 'mutex', kind: 'MUTEX', value: 1, blockedQueue: [] };
      ops.push(
        { pid: 'P1', role: 'Thread', action: { kind: 'WAIT', sem: 'mutex' } },
        { pid: 'P2', role: 'Thread', action: { kind: 'WAIT', sem: 'mutex' } },
        { pid: 'P1', role: 'Thread', action: { kind: 'LOAD_REG', reg: 'R1' } },
        { pid: 'P1', role: 'Thread', action: { kind: 'INC_REG', reg: 'R1' } },
        { pid: 'P1', role: 'Thread', action: { kind: 'STORE_REG', reg: 'R1' } },
        { pid: 'P1', role: 'Thread', action: { kind: 'SIGNAL', sem: 'mutex' } },
        { pid: 'P2', role: 'Thread', action: { kind: 'LOAD_REG', reg: 'R2' } },
        { pid: 'P2', role: 'Thread', action: { kind: 'INC_REG', reg: 'R2' } },
        { pid: 'P2', role: 'Thread', action: { kind: 'STORE_REG', reg: 'R2' } },
        { pid: 'P2', role: 'Thread', action: { kind: 'SIGNAL', sem: 'mutex' } }
      );
      break;
    }

    case 'BINARY_SEMAPHORE': {
      sems.sync = { name: 'sync', kind: 'BINARY', value: 0, blockedQueue: [] };
      ops.push(
        { pid: 'P2', role: 'Waiter', action: { kind: 'WAIT', sem: 'sync' } },
        { pid: 'P1', role: 'Signaler', action: { kind: 'ENTER_CS' } },
        { pid: 'P1', role: 'Signaler', action: { kind: 'EXIT_CS' } },
        { pid: 'P1', role: 'Signaler', action: { kind: 'SIGNAL', sem: 'sync' } },
        { pid: 'P2', role: 'Waiter', action: { kind: 'ENTER_CS' } },
        { pid: 'P2', role: 'Waiter', action: { kind: 'EXIT_CS' } }
      );
      break;
    }

    case 'COUNTING_SEMAPHORE': {
      const cap = Math.max(1, input.semaphoreCount);
      sems.pool = {
        name: 'pool',
        kind: 'COUNTING',
        value: cap,
        blockedQueue: [],
      };
      const workers = ['P1', 'P2', 'P3', 'P4'];
      workers.forEach((pid) => {
        ops.push({ pid, role: 'Client', action: { kind: 'WAIT', sem: 'pool' } });
      });
      workers.slice(0, cap).forEach((pid) => {
        ops.push({ pid, role: 'Client', action: { kind: 'SIGNAL', sem: 'pool' } });
      });
      workers.slice(cap).forEach((pid) => {
        ops.push({ pid, role: 'Client', action: { kind: 'SIGNAL', sem: 'pool' } });
      });
      break;
    }

    case 'PRODUCER_CONSUMER': {
      bufferSize = Math.max(2, Math.min(6, input.bufferSize));
      sems.mutex = { name: 'mutex', kind: 'MUTEX', value: 1, blockedQueue: [] };
      sems.empty = {
        name: 'empty',
        kind: 'COUNTING',
        value: bufferSize,
        blockedQueue: [],
      };
      sems.full = {
        name: 'full',
        kind: 'COUNTING',
        value: 0,
        blockedQueue: [],
      };

      const pCount = Math.max(1, Math.min(3, input.producerCount));
      const cCount = Math.max(1, Math.min(3, input.consumerCount));

      // Consumer tries first on empty buffer -> blocks on `full`!
      ops.push(
        { pid: 'C1', role: 'Consumer', action: { kind: 'WAIT', sem: 'full' } }
      );

      for (let i = 0; i < pCount; i += 1) {
        const pid = `P${i + 1}`;
        ops.push(
          { pid, role: 'Producer', action: { kind: 'WAIT', sem: 'empty' } },
          { pid, role: 'Producer', action: { kind: 'WAIT', sem: 'mutex' } },
          { pid, role: 'Producer', action: { kind: 'PRODUCE', item: `Item-${i + 1}` } },
          { pid, role: 'Producer', action: { kind: 'SIGNAL', sem: 'mutex' } },
          { pid, role: 'Producer', action: { kind: 'SIGNAL', sem: 'full' } }
        );
      }

      // C1 wakes up and consumes, then remaining consumers run
      ops.push(
        { pid: 'C1', role: 'Consumer', action: { kind: 'WAIT', sem: 'mutex' } },
        { pid: 'C1', role: 'Consumer', action: { kind: 'CONSUME' } },
        { pid: 'C1', role: 'Consumer', action: { kind: 'SIGNAL', sem: 'mutex' } },
        { pid: 'C1', role: 'Consumer', action: { kind: 'SIGNAL', sem: 'empty' } }
      );

      for (let i = 1; i < Math.min(cCount, pCount); i += 1) {
        const cid = `C${i + 1}`;
        ops.push(
          { pid: cid, role: 'Consumer', action: { kind: 'WAIT', sem: 'full' } },
          { pid: cid, role: 'Consumer', action: { kind: 'WAIT', sem: 'mutex' } },
          { pid: cid, role: 'Consumer', action: { kind: 'CONSUME' } },
          { pid: cid, role: 'Consumer', action: { kind: 'SIGNAL', sem: 'mutex' } },
          { pid: cid, role: 'Consumer', action: { kind: 'SIGNAL', sem: 'empty' } }
        );
      }
      break;
    }

    case 'DINING_PHILOSOPHERS': {
      forkCount = 5;
      for (let i = 0; i < 5; i += 1) {
        sems[`fork${i}`] = {
          name: `fork${i}`,
          kind: 'BINARY',
          value: 1,
          blockedQueue: [],
        };
      }
      if (input.triggerDeadlock) {
        // Every philosopher grabs left fork first -> circular wait deadlock!
        for (let i = 0; i < 5; i += 1) {
          ops.push({
            pid: `Phil${i}`,
            role: 'Philosopher',
            action: { kind: 'TAKE_FORK', forkIdx: i },
          });
        }
        for (let i = 0; i < 5; i += 1) {
          ops.push({
            pid: `Phil${i}`,
            role: 'Philosopher',
            action: { kind: 'TAKE_FORK', forkIdx: (i + 1) % 5 },
          });
        }
      } else {
        // Asymmetric order: Phil4 picks right fork (0) first, breaking circular wait
        for (let i = 0; i < 4; i += 1) {
          ops.push({
            pid: `Phil${i}`,
            role: 'Philosopher',
            action: { kind: 'TAKE_FORK', forkIdx: i },
          });
        }
        ops.push(
          { pid: 'Phil4', role: 'Philosopher', action: { kind: 'TAKE_FORK', forkIdx: 0 } },
          { pid: 'Phil0', role: 'Philosopher', action: { kind: 'TAKE_FORK', forkIdx: 1 } },
          { pid: 'Phil1', role: 'Philosopher', action: { kind: 'TAKE_FORK', forkIdx: 2 } },
          { pid: 'Phil3', role: 'Philosopher', action: { kind: 'TAKE_FORK', forkIdx: 4 } },
          { pid: 'Phil3', role: 'Philosopher', action: { kind: 'PUT_FORK', forkIdx: 3 } },
          { pid: 'Phil3', role: 'Philosopher', action: { kind: 'PUT_FORK', forkIdx: 4 } },
          { pid: 'Phil4', role: 'Philosopher', action: { kind: 'TAKE_FORK', forkIdx: 4 } },
          { pid: 'Phil4', role: 'Philosopher', action: { kind: 'PUT_FORK', forkIdx: 0 } },
          { pid: 'Phil4', role: 'Philosopher', action: { kind: 'PUT_FORK', forkIdx: 4 } }
        );
      }
      break;
    }

    case 'READERS_WRITERS': {
      sems.mutex = { name: 'mutex', kind: 'MUTEX', value: 1, blockedQueue: [] };
      sems.rw_mutex = { name: 'rw_mutex', kind: 'MUTEX', value: 1, blockedQueue: [] };
      ops.push(
        { pid: 'R1', role: 'Reader', action: { kind: 'START_READ' } },
        { pid: 'R2', role: 'Reader', action: { kind: 'START_READ' } },
        { pid: 'W1', role: 'Writer', action: { kind: 'WAIT', sem: 'rw_mutex' } },
        { pid: 'R1', role: 'Reader', action: { kind: 'END_READ' } },
        { pid: 'R2', role: 'Reader', action: { kind: 'END_READ' } },
        { pid: 'W1', role: 'Writer', action: { kind: 'START_WRITE' } },
        { pid: 'W1', role: 'Writer', action: { kind: 'END_WRITE' } },
        { pid: 'W1', role: 'Writer', action: { kind: 'SIGNAL', sem: 'rw_mutex' } }
      );
      break;
    }
  }

  return { semaphores: sems, ops, bufferSize, forkCount };
}

export const synchronizationEngine: SimulationEngine<
  SyncInput,
  SyncStepState,
  SyncEvent,
  SyncMetrics
> = {
  validate(input: SyncInput): ValidationResult {
    const errors: string[] = [];
    if (input.bufferSize < 2 || input.bufferSize > 6) {
      errors.push('Buffer size must be between 2 and 6 slots.');
    }
    if (input.semaphoreCount < 1 || input.semaphoreCount > 5) {
      errors.push('Counting semaphore capacity must be between 1 and 5.');
    }
    return { valid: errors.length === 0, errors };
  },

  run(
    input: SyncInput
  ): SimulationResult<SyncStepState, SyncEvent, SyncMetrics> {
    const { semaphores, ops, bufferSize, forkCount } =
      buildScenarioSchedule(input);

    const processMap = new Map<string, SyncProcessSnapshot>();
    ops.forEach((op) => {
      if (!processMap.has(op.pid)) {
        processMap.set(op.pid, {
          id: op.pid,
          role: op.role,
          state: 'READY',
          lastAction: 'Initialized',
          blockedOn: null,
        });
      }
    });

    const registers: Record<string, number> = {};
    let sharedCounter = 0;
    let expectedCounter = 0;
    let csOccupants: string[] = [];
    let csViolations = 0;
    let lostUpdates = 0;
    const buffer: (string | null)[] = Array(bufferSize).fill(null);
    let bufIn = 0;
    let bufOut = 0;
    const forks: (string | null)[] = Array(forkCount).fill(null);
    let activeReaders = 0;
    let activeWriter: string | null = null;
    let deadlockDetected = false;

    const steps: SimulationStep<SyncStepState, SyncEvent>[] = [];

    const snapshot = (
      tick: number,
      events: SyncEvent[],
      whatHappened: string,
      whyItHappened: string,
      whichRule: string,
      whatNext: string,
      remember: string,
      checkpointPrompt?: SimulationStep<SyncStepState, SyncEvent>['checkpointPrompt']
    ) => {
      steps.push({
        stepIndex: steps.length,
        tick,
        state: {
          tick,
          scenario: input.scenario,
          processes: Array.from(processMap.values()).map((p) => ({ ...p })),
          semaphores: Object.values(semaphores).map((s) => ({
            ...s,
            blockedQueue: [...s.blockedQueue],
          })),
          sharedCounter,
          expectedCounter,
          csOccupants: [...csOccupants],
          csViolations,
          lostUpdates,
          buffer: [...buffer],
          forks: [...forks],
          activeReaders,
          activeWriter,
          deadlockDetected,
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

    snapshot(
      0,
      [],
      `Initialized ${input.scenario.replace(/_/g, ' ')} scenario.`,
      'Processes and synchronization primitives are ready.',
      'Discrete-event deterministic scheduler.',
      'Step forward to observe process interleaving.',
      'Deterministic stepping lets you inspect race conditions and deadlocks reliably.'
    );

    ops.forEach((op, idx) => {
      const tick = idx + 1;
      const proc = processMap.get(op.pid)!;
      const events: SyncEvent[] = [];
      let what = '';
      let why = '';
      let rule = '';
      let next = 'Proceed to next scheduled operation.';
      let rem = 'Mutual exclusion guarantees only one process modifies shared state at a time.';

      const a = op.action;
      switch (a.kind) {
        case 'WAIT': {
          const sem = semaphores[a.sem];
          if (sem.value > 0) {
            sem.value -= 1;
            proc.state = 'RUNNING';
            proc.lastAction = `wait(${a.sem}) -> acquired`;
            proc.blockedOn = null;
            events.push({
              type: 'WAIT',
              pid: op.pid,
              detail: `${op.pid} acquired ${a.sem} (val=${sem.value}).`,
            });
            what = `${op.pid} called wait(${a.sem}) and acquired it (${a.sem}=${sem.value}).`;
            why = `${a.sem} was > 0, so ${op.pid} decremented it without blocking.`;
            rule = 'wait(S): if S > 0 then S-- else block.';
          } else {
            proc.state = 'BLOCKED';
            proc.blockedOn = a.sem;
            proc.lastAction = `wait(${a.sem}) -> BLOCKED`;
            sem.blockedQueue.push(op.pid);
            events.push({
              type: 'BLOCKED',
              pid: op.pid,
              detail: `${op.pid} blocked on ${a.sem}.`,
            });
            what = `${op.pid} called wait(${a.sem}) and BLOCKED.`;
            why = `${a.sem} is 0, so ${op.pid} cannot proceed.`;
            rule = 'Blocked processes sleep in the semaphore queue until signal().';
          }
          break;
        }
        case 'SIGNAL': {
          const sem = semaphores[a.sem];
          if (sem.blockedQueue.length > 0) {
            const wokenId = sem.blockedQueue.shift()!;
            const wokenProc = processMap.get(wokenId)!;
            wokenProc.state = 'READY';
            wokenProc.blockedOn = null;
            wokenProc.lastAction = `Woken by ${a.sem}`;
            events.push({
              type: 'WAKEUP',
              pid: wokenId,
              detail: `${op.pid} signaled ${a.sem}, waking ${wokenId}.`,
            });
            what = `${op.pid} called signal(${a.sem}) and woke up ${wokenId}.`;
            why = `${wokenId} was waiting in ${a.sem}'s blocked queue.`;
            rule = 'signal(S): if queue non-empty, wake one waiting process.';
          } else {
            sem.value += 1;
            events.push({
              type: 'SIGNAL',
              pid: op.pid,
              detail: `${op.pid} signaled ${a.sem} (val=${sem.value}).`,
            });
            what = `${op.pid} called signal(${a.sem}) → ${a.sem}=${sem.value}.`;
            why = 'No processes were waiting on this semaphore.';
            rule = 'signal(S): increment S when queue is empty.';
          }
          proc.state = 'READY';
          proc.lastAction = `signal(${a.sem})`;
          break;
        }
        case 'ENTER_CS': {
          csOccupants.push(op.pid);
          proc.state = 'IN_CS';
          proc.lastAction = 'Entered Critical Section';
          if (csOccupants.length > 1) csViolations += 1;
          events.push({
            type: 'CS_ENTER',
            pid: op.pid,
            detail: `${op.pid} entered Critical Section.`,
          });
          what = `${op.pid} entered the Critical Section.`;
          why = 'It holds the required synchronization lock.';
          rule = 'Mutual Exclusion: at most 1 process in CS.';
          break;
        }
        case 'EXIT_CS': {
          csOccupants = csOccupants.filter((p) => p !== op.pid);
          proc.state = 'DONE';
          proc.lastAction = 'Exited Critical Section';
          events.push({
            type: 'CS_EXIT',
            pid: op.pid,
            detail: `${op.pid} exited Critical Section.`,
          });
          what = `${op.pid} exited the Critical Section.`;
          why = 'Critical section work finished.';
          rule = 'Always release locks after exiting CS.';
          break;
        }
        case 'LOAD_REG': {
          registers[a.reg] = sharedCounter;
          proc.state = 'RUNNING';
          proc.lastAction = `${a.reg} = counter (${sharedCounter})`;
          what = `${op.pid} loaded sharedCounter (${sharedCounter}) into ${a.reg}.`;
          why = 'Incrementing a variable takes Load → Inc → Store at the CPU level.';
          rule = 'Context switch between Load and Store can cause a Race Condition.';
          rem = 'Without a mutex, interleaved Load/Store loses updates!';
          break;
        }
        case 'INC_REG': {
          registers[a.reg] = (registers[a.reg] ?? 0) + 1;
          proc.lastAction = `${a.reg}++ (${registers[a.reg]})`;
          what = `${op.pid} incremented ${a.reg} to ${registers[a.reg]}.`;
          why = 'Local CPU register updated before writing back to RAM.';
          rule = 'Local register changes are invisible to other threads until Store.';
          break;
        }
        case 'STORE_REG': {
          expectedCounter += 1;
          const prev = sharedCounter;
          sharedCounter = registers[a.reg];
          if (sharedCounter < expectedCounter) {
            lostUpdates = expectedCounter - sharedCounter;
            events.push({
              type: 'RACE_LOSS',
              pid: op.pid,
              detail: `Race condition! Expected ${expectedCounter}, got ${sharedCounter}.`,
            });
          }
          proc.state = 'DONE';
          proc.lastAction = `counter = ${a.reg} (${sharedCounter})`;
          what = `${op.pid} stored ${a.reg} (${sharedCounter}) into sharedCounter (was ${prev}).`;
          why =
            lostUpdates > 0
              ? `${op.pid} overwrote another thread's update using a stale register value!`
              : 'Exclusive access preserved the update.';
          rule = 'Race condition occurs when final state depends on interleaving.';
          break;
        }
        case 'PRODUCE': {
          buffer[bufIn] = a.item;
          bufIn = (bufIn + 1) % buffer.length;
          proc.state = 'DONE';
          proc.lastAction = `Produced ${a.item}`;
          what = `${op.pid} placed ${a.item} into bounded buffer.`;
          why = 'Producer acquired both `empty` slot and `mutex` lock.';
          rule = 'Producer order: wait(empty) → wait(mutex) → produce → signal(mutex) → signal(full).';
          rem = 'Reversing wait(empty) and wait(mutex) can cause deadlock!';
          break;
        }
        case 'CONSUME': {
          const item = buffer[bufOut] ?? 'Item';
          buffer[bufOut] = null;
          bufOut = (bufOut + 1) % buffer.length;
          proc.state = 'DONE';
          proc.lastAction = `Consumed ${item}`;
          what = `${op.pid} removed ${item} from bounded buffer.`;
          why = 'Consumer acquired both `full` item count and `mutex` lock.';
          rule = 'Consumer order: wait(full) → wait(mutex) → consume → signal(mutex) → signal(empty).';
          break;
        }
        case 'TAKE_FORK': {
          const sem = semaphores[`fork${a.forkIdx}`];
          if (sem.value > 0) {
            sem.value = 0;
            forks[a.forkIdx] = op.pid;
            proc.state = 'RUNNING';
            proc.lastAction = `Picked up Fork ${a.forkIdx}`;
            what = `${op.pid} picked up Fork ${a.forkIdx}.`;
            why = `Fork ${a.forkIdx} was available.`;
            rule = 'Philosopher needs both left and right forks to eat.';
          } else {
            proc.state = 'BLOCKED';
            proc.blockedOn = `fork${a.forkIdx}`;
            sem.blockedQueue.push(op.pid);
            proc.lastAction = `Waiting on Fork ${a.forkIdx}`;
            what = `${op.pid} blocked waiting for Fork ${a.forkIdx}.`;
            why = `Fork ${a.forkIdx} is held by ${forks[a.forkIdx]}.`;
            rule = 'All 5 philosophers holding 1 fork each creates a Circular Wait Deadlock.';
          }
          break;
        }
        case 'PUT_FORK': {
          const sem = semaphores[`fork${a.forkIdx}`];
          sem.value = 1;
          forks[a.forkIdx] = null;
          proc.state = 'DONE';
          proc.lastAction = `Put down Fork ${a.forkIdx}`;
          what = `${op.pid} ate and released Fork ${a.forkIdx}.`;
          why = 'Releasing forks lets neighbors eat.';
          rule = 'Breaking symmetry (one philosopher picks right fork first) prevents deadlock.';
          break;
        }
        case 'START_READ': {
          activeReaders += 1;
          if (activeReaders === 1) semaphores.rw_mutex.value = 0;
          proc.state = 'IN_CS';
          proc.lastAction = `Reading (activeReaders=${activeReaders})`;
          what = `${op.pid} started reading (active readers: ${activeReaders}).`;
          why = 'Multiple readers can read concurrently; first reader locks out writers.';
          rule = 'First reader calls wait(rw_mutex); subsequent readers enter immediately.';
          break;
        }
        case 'END_READ': {
          activeReaders = Math.max(0, activeReaders - 1);
          if (activeReaders === 0) {
            semaphores.rw_mutex.value = 1;
            const woken = semaphores.rw_mutex.blockedQueue.shift();
            if (woken) {
              const wp = processMap.get(woken)!;
              wp.state = 'READY';
              wp.blockedOn = null;
            }
          }
          proc.state = 'DONE';
          proc.lastAction = 'Finished reading';
          what = `${op.pid} finished reading (active readers: ${activeReaders}).`;
          why = activeReaders === 0 ? 'Last reader released rw_mutex for waiting writers.' : 'Other readers still active.';
          rule = 'Last reader calls signal(rw_mutex).';
          break;
        }
        case 'START_WRITE': {
          activeWriter = op.pid;
          proc.state = 'IN_CS';
          proc.lastAction = 'Writing exclusively';
          what = `${op.pid} acquired exclusive write access.`;
          why = 'All readers finished and released rw_mutex.';
          rule = 'Writers require exclusive access (no other readers or writers).';
          break;
        }
        case 'END_WRITE': {
          activeWriter = null;
          proc.state = 'DONE';
          proc.lastAction = 'Finished writing';
          what = `${op.pid} finished writing.`;
          why = 'Write operation completed.';
          rule = 'Writer releases rw_mutex after finishing.';
          break;
        }
      }

      const allVals = Array.from(processMap.values());
      if (
        allVals.length > 0 &&
        allVals.every((p) => p.state === 'BLOCKED')
      ) {
        deadlockDetected = true;
        events.push({
          type: 'DEADLOCK',
          detail: 'All processes are BLOCKED in a circular wait!',
        });
        next = 'DEADLOCK DETECTED: Every process is waiting on another.';
      }

      snapshot(tick, events, what, why, rule, next, rem);
    });

    return {
      steps,
      finalMetrics: {
        scenario: input.scenario,
        totalSteps: steps.length,
        csViolations,
        lostUpdates,
        deadlockDetected,
        finalCounter: sharedCounter,
        expectedCounter,
      },
    };
  },
};
