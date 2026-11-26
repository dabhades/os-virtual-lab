export interface GlossaryEntry {
  term: string;
  category: 'Core' | 'CPU' | 'Memory' | 'Sync & Deadlock' | 'Storage & Files';
  definition: string;
}

export interface FormulaEntry {
  title: string;
  formula: string;
  lab: string;
  note: string;
}

export const OS_GLOSSARY: GlossaryEntry[] = [
  { term: 'Kernel', category: 'Core', definition: 'The privileged core of the OS that manages CPU, memory, and hardware devices.' },
  { term: 'System Call', category: 'Core', definition: 'Controlled entry point allowing user-mode programs to request OS kernel services.' },
  { term: 'Process', category: 'Core', definition: 'An executing instance of a program with its own address space, PID, and PCB.' },
  { term: 'Context Switch', category: 'CPU', definition: 'Saving the CPU state of the current process and restoring the next process’s state.' },
  { term: 'Turnaround Time (TAT)', category: 'CPU', definition: 'Total time spent by a process from arrival to completion.' },
  { term: 'Waiting Time (WT)', category: 'CPU', definition: 'Total time a process spends waiting in the Ready Queue.' },
  { term: 'Convoy Effect', category: 'CPU', definition: 'Short processes getting stuck behind one long CPU-bound process in FCFS.' },
  { term: 'Starvation', category: 'CPU', definition: 'Indefinite postponement of a low-priority process when higher-priority work keeps arriving.' },
  { term: 'Critical Section', category: 'Sync & Deadlock', definition: 'Code segment accessing shared resources that must not be executed by multiple processes concurrently.' },
  { term: 'Race Condition', category: 'Sync & Deadlock', definition: 'Bug where the final result depends on the unpredictable timing/interleaving of concurrent threads.' },
  { term: 'Semaphore', category: 'Sync & Deadlock', definition: 'Integer synchronization variable accessed only via atomic wait() and signal() operations.' },
  { term: 'Deadlock', category: 'Sync & Deadlock', definition: 'State where a set of processes are permanently blocked, each waiting for a resource held by another.' },
  { term: 'Safe State', category: 'Sync & Deadlock', definition: 'State in which the OS can find at least one sequence allowing all processes to finish without deadlock.' },
  { term: 'Internal Fragmentation', category: 'Memory', definition: 'Unused memory inside an allocated fixed partition.' },
  { term: 'External Fragmentation', category: 'Memory', definition: 'Total free memory is sufficient for a request, but split into non-contiguous holes.' },
  { term: 'Compaction', category: 'Memory', definition: 'Relocating allocated memory blocks together to merge scattered free holes into one block.' },
  { term: 'Page Fault', category: 'Memory', definition: 'Trap raised when a process accesses a virtual page not currently loaded in physical RAM frames.' },
  { term: "Belady's Anomaly", category: 'Memory', definition: 'Phenomenon in FIFO page replacement where adding more frames increases page faults.' },
  { term: 'Seek Time', category: 'Storage & Files', definition: 'Time required for the disk read/write arm to move to the target cylinder.' },
  { term: 'Inode', category: 'Storage & Files', definition: 'Filesystem metadata structure storing permissions, owner, link count, and block pointers.' },
  { term: 'Free Space Bitmap', category: 'Storage & Files', definition: 'Bit array (0=free, 1=used) tracking which disk blocks are available.' },
];

export const OS_FORMULAS: FormulaEntry[] = [
  {
    title: 'Turnaround Time (TAT)',
    formula: 'TAT = Completion Time (CT) − Arrival Time (AT)',
    lab: 'Lab 02: CPU Scheduling',
    note: 'Total time from submission to completion.',
  },
  {
    title: 'Waiting Time (WT)',
    formula: 'WT = Turnaround Time (TAT) − Burst Time (BT)',
    lab: 'Lab 02: CPU Scheduling',
    note: 'Time spent waiting in the Ready Queue.',
  },
  {
    title: 'Response Ratio (HRRN)',
    formula: 'R = (Waiting Time + Burst Time) / Burst Time',
    lab: 'Lab 02: CPU Scheduling',
    note: 'Prevents starvation of long jobs as waiting time grows.',
  },
  {
    title: "Banker's Need Matrix",
    formula: 'Need[i][j] = Maximum[i][j] − Allocation[i][j]',
    lab: "Lab 04: Banker's Algorithm",
    note: 'Remaining resources a process may still request.',
  },
  {
    title: 'Page Hit & Fault Ratios',
    formula: 'Hit Ratio = (Hits / Total Refs) × 100%',
    lab: 'Lab 06: Page Replacement',
    note: 'Fault Ratio = 100% − Hit Ratio.',
  },
  {
    title: 'Total Disk Head Movement',
    formula: 'Total Seek = Σ |Cylinder[i] − Cylinder[i−1]|',
    lab: 'Lab 07: Disk Scheduling',
    note: 'Average Seek = Total Seek / Number of Requests.',
  },
];
