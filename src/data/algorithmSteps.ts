export interface AlgorithmStepDef {
  title: string;
  detail: string;
}

export const LAB_ALGORITHM_STEPS: Record<string, AlgorithmStepDef[]> = {
  'Linux / UNIX Command Simulator': [
    {
      title: '1. Tokenize & Parse',
      detail: 'Split command line by quotes, chains (;, &&), pipes (|), and redirections (>, >>, <).',
    },
    {
      title: '2. Resolve Paths',
      detail: 'Normalize relative/tilde paths against the current working directory (cwd).',
    },
    {
      title: '3. Execute & Pipe',
      detail: 'Run each command against the isolated Linux FHS and pass stdout to the next stage.',
    },
    {
      title: '4. Sync Explorer',
      detail: 'Update the live directory tree, permissions, and simulated process table.',
    },
  ],
  'CPU Scheduling': [
    {
      title: '1. Admit Arrivals',
      detail: 'Move processes whose Arrival Time equals the current tick into the Ready Queue.',
    },
    {
      title: '2. Check Preemption / Quantum',
      detail: 'In SRTF, Priority (Preemptive), or Round Robin, check if the running process must yield.',
    },
    {
      title: '3. Select Next Process',
      detail: 'Pick the winning process from the Ready Queue using the active algorithm rule and tie-breakers.',
    },
    {
      title: '4. Execute & Update Metrics',
      detail: 'Run 1 time unit on CPU, update Gantt Chart, and compute CT, TAT, WT, and RT on completion.',
    },
  ],
  'Process Synchronization & Semaphores': [
    {
      title: '1. Request Resource / Lock',
      detail: 'Process calls wait(S) on a mutex or semaphore before entering its Critical Section.',
    },
    {
      title: '2. Block or Acquire',
      detail: 'If S > 0, decrement S and proceed; if S == 0, move the process to the Blocked Queue.',
    },
    {
      title: '3. Critical Section / Buffer Op',
      detail: 'Execute shared counter update, bounded buffer produce/consume, or fork acquisition.',
    },
    {
      title: '4. Release & Wakeup',
      detail: 'Call signal(S) to wake one blocked process or increment S, preserving invariants.',
    },
  ],
  "Banker's Algorithm": [
    {
      title: '1. Compute Need Matrix',
      detail: 'Calculate Need[i][j] = Maximum[i][j] − Allocation[i][j] for every process.',
    },
    {
      title: '2. Validate Request (If Any)',
      detail: 'Check Request <= Need and Request <= Available, then tentatively allocate.',
    },
    {
      title: '3. Safety Scan',
      detail: 'Find an unfinished process with Need[i] <= Work; mark Finish[i] = true and reclaim Work += Allocation[i].',
    },
    {
      title: '4. Confirm Safe or Rollback',
      detail: 'If all Finish[i] are true, the state is Safe; otherwise Unsafe (roll back tentative request).',
    },
  ],
  'Memory Allocation': [
    {
      title: '1. Inspect Free Holes',
      detail: 'Scan RAM blocks for free holes large enough to fit the requested process size.',
    },
    {
      title: '2. Apply Fit Strategy',
      detail: 'Select hole via First Fit, Best Fit, Worst Fit, or Next Fit (from last cursor).',
    },
    {
      title: '3. Allocate / Split Block',
      detail: 'Assign fixed partition (tracking internal waste) or split variable hole.',
    },
    {
      title: '4. Coalesce or Compact',
      detail: 'Merge adjacent free holes on deallocation, or compact RAM to remove external fragmentation.',
    },
  ],
  'Page Replacement': [
    {
      title: '1. Lookup Page in Frames',
      detail: 'Check if the requested page is already resident in physical frames (Page Hit vs. Page Fault).',
    },
    {
      title: '2. Use Free Frame if Available',
      detail: 'On a fault, load the page directly into any empty frame without eviction.',
    },
    {
      title: '3. Select Victim Page',
      detail: 'When frames are full, evict a victim using FIFO, LRU, Optimal, LFU, or Second Chance.',
    },
    {
      title: '4. Update Counters & Ratios',
      detail: 'Record hit/fault counts, reference bits, frequencies, and cumulative Hit/Fault ratios.',
    },
  ],
  'Disk Scheduling': [
    {
      title: '1. Read Head & Direction',
      detail: 'Start at initial cylinder head position moving LEFT (0) or RIGHT (max cylinder).',
    },
    {
      title: '2. Choose Next Cylinder',
      detail: 'Select next target via FCFS, SSTF, SCAN/LOOK (reverse), or C-SCAN/C-LOOK (circular).',
    },
    {
      title: '3. Move Arm & Accumulate Seek',
      detail: 'Add |target − current| to Total Head Movement and mark request serviced.',
    },
    {
      title: '4. Compute Average Seek',
      detail: 'Divide Total Head Movement by total requests to compare algorithm efficiency.',
    },
  ],
  'File Management': [
    {
      title: '1. Validate Directory Path',
      detail: 'Check path rules against Single-Level, Two-Level, Tree, or Acyclic Graph structure.',
    },
    {
      title: '2. Allocate / Free Blocks',
      detail: 'Assign Contiguous runs, Linked pointer chains, or an Index Block + data blocks.',
    },
    {
      title: '3. Update Inode & Bitmap',
      detail: 'Maintain permissions, linkCount (for shared links), and Free Space Bitmap.',
    },
    {
      title: '4. Update Open File Table',
      detail: 'Track active file descriptors (fd) and file contents across read/write/append.',
    },
  ],
};
