import type { LabId } from '../../types/learning';

export interface VivaItem {
  id: string;
  labId: LabId;
  labTitle: string;
  question: string;
  answer: string;
  commonMistake: string;
}

export interface McqItem {
  id: string;
  labId: LabId;
  labTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ChallengeItem {
  id: string;
  labId: LabId;
  title: string;
  prompt: string;
  route: string;
  goal: string;
}

export const VIVA_BANK: VivaItem[] = [
  {
    id: 'v-linux-1',
    labId: 'linux-terminal',
    labTitle: 'Lab 01: Linux Terminal',
    question: 'What is the difference between > and >> in shell redirection?',
    answer: '> overwrites the target file with stdout, whereas >> appends stdout to the end of the target file without erasing existing content.',
    commonMistake: 'Using > when you meant to append logs, accidentally wiping previous lines.',
  },
  {
    id: 'v-cpu-1',
    labId: 'cpu-scheduling',
    labTitle: 'Lab 02: CPU Scheduling',
    question: 'What is the Convoy Effect and which algorithm suffers from it?',
    answer: 'In FCFS, when one long CPU-bound process runs first, many short processes wait behind it, inflating Average Waiting Time.',
    commonMistake: 'Computing Waiting Time as StartTime - ArrivalTime in preemptive algorithms instead of WT = TAT - BT.',
  },
  {
    id: 'v-sync-1',
    labId: 'synchronization',
    labTitle: 'Lab 03: Synchronization',
    question: 'In Producer–Consumer, why must wait(empty) be called before wait(mutex)?',
    answer: 'If the producer acquires mutex first when the buffer is full, it blocks on empty while holding mutex—preventing any consumer from entering to free a slot (deadlock).',
    commonMistake: 'Confusing Binary Semaphore (signaling) with Mutex (ownership-based locking).',
  },
  {
    id: 'v-bank-1',
    labId: 'bankers-algorithm',
    labTitle: "Lab 04: Banker's Algorithm",
    question: 'Is an Unsafe state the same as a Deadlocked state?',
    answer: 'No. Every deadlocked state is unsafe, but an unsafe state is not necessarily deadlocked—it simply means the OS can no longer guarantee deadlock freedom if all processes claim max Need.',
    commonMistake: 'Forgetting to roll back tentative allocation when a Resource Request leads to an unsafe state.',
  },
  {
    id: 'v-mem-1',
    labId: 'memory-allocation',
    labTitle: 'Lab 05: Memory Allocation',
    question: 'How does Internal Fragmentation differ from External Fragmentation?',
    answer: 'Internal fragmentation is wasted space inside an allocated fixed partition; External fragmentation is free memory scattered into non-contiguous holes between variable partitions.',
    commonMistake: 'Assuming Best Fit always beats First Fit—Best Fit can leave tiny unusable slivers.',
  },
  {
    id: 'v-page-1',
    labId: 'page-replacement',
    labTitle: 'Lab 06: Page Replacement',
    question: "What is Belady's Anomaly?",
    answer: 'In FIFO page replacement, increasing the number of physical frames can counterintuitively increase the number of page faults.',
    commonMistake: 'Applying Optimal replacement by looking backward instead of looking forward in the reference string.',
  },
  {
    id: 'v-disk-1',
    labId: 'disk-scheduling',
    labTitle: 'Lab 07: Disk Scheduling',
    question: 'What is the exact difference between SCAN and LOOK?',
    answer: 'SCAN sweeps all the way to the physical disk boundary (0 or maxCylinder) before reversing, whereas LOOK reverses immediately at the last pending request in that direction.',
    commonMistake: 'Including cylinder 0 or maxCylinder in LOOK/C-LOOK calculations when no request targets them.',
  },
  {
    id: 'v-file-1',
    labId: 'file-management',
    labTitle: 'Lab 08: File Management',
    question: 'Why does Deleting one path in an Acyclic Graph directory not always free disk blocks?',
    answer: 'Shared files have an Inode linkCount > 1. Deleting one link decrements linkCount; blocks are only freed when linkCount reaches 0.',
    commonMistake: 'Forgetting to count the dedicated Index Block when calculating total blocks used in Indexed allocation.',
  },
];

export const MCQ_BANK: McqItem[] = [
  {
    id: 'm1',
    labId: 'cpu-scheduling',
    labTitle: 'Lab 02: CPU Scheduling',
    question: 'Which scheduling algorithm has the provably minimum average waiting time for a given set of processes?',
    options: ['FCFS', 'SJF / SRTF', 'Round Robin', 'Priority'],
    correctIndex: 1,
    explanation: 'SJF (and preemptive SRTF) minimizes average waiting time by executing shortest bursts first.',
  },
  {
    id: 'm2',
    labId: 'bankers-algorithm',
    labTitle: "Lab 04: Banker's Algorithm",
    question: 'In Banker’s Algorithm, how is the Need matrix calculated?',
    options: ['Allocation + Maximum', 'Maximum − Allocation', 'Available − Allocation', 'Maximum − Available'],
    correctIndex: 1,
    explanation: 'Need[i][j] = Maximum[i][j] − Allocation[i][j].',
  },
  {
    id: 'm3',
    labId: 'page-replacement',
    labTitle: 'Lab 06: Page Replacement',
    question: "Which page replacement algorithm can suffer from Belady's Anomaly?",
    options: ['LRU', 'Optimal', 'FIFO', 'Second Chance? No, FIFO only among these'],
    correctIndex: 2,
    explanation: 'FIFO is not a stack algorithm and can exhibit Belady’s Anomaly.',
  },
  {
    id: 'm4',
    labId: 'disk-scheduling',
    labTitle: 'Lab 07: Disk Scheduling',
    question: 'Which disk scheduling algorithm reverses direction at the last pending request without touching cylinder 0 or max?',
    options: ['SCAN', 'C-SCAN', 'LOOK', 'FCFS'],
    correctIndex: 2,
    explanation: 'LOOK stops at the last pending request in the current direction before reversing.',
  },
  {
    id: 'm5',
    labId: 'memory-allocation',
    labTitle: 'Lab 05: Memory Allocation',
    question: 'Which technique eliminates External Fragmentation in variable partitioning?',
    options: ['Best Fit', 'Compaction', 'Fixed Partitions', 'Paging? (Non-contiguous)'],
    correctIndex: 1,
    explanation: 'Compaction relocates allocated blocks together to merge all free holes into one contiguous block.',
  },
  {
    id: 'm6',
    labId: 'linux-terminal',
    labTitle: 'Lab 01: Linux Terminal',
    question: 'Which command filters lines matching a pattern from stdin or a file?',
    options: ['find', 'grep', 'chmod', 'ps'],
    correctIndex: 1,
    explanation: 'grep searches text lines matching a pattern.',
  },
];

export const CHALLENGE_BANK: ChallengeItem[] = [
  {
    id: 'c1',
    labId: 'page-replacement',
    title: "Reproduce Belady's Anomaly",
    prompt: 'Open Lab 06, load the Belady preset, and compare FIFO with 3 frames vs 4 frames.',
    route: '/labs/page-replacement',
    goal: 'Observe faults increasing from 9 (3 frames) to 10 (4 frames).',
  },
  {
    id: 'c2',
    labId: 'memory-allocation',
    title: 'Fix External Fragmentation',
    prompt: 'Open Lab 05 with the Compaction preset and trace how P4 fails before COMPACT and succeeds after.',
    route: '/labs/memory-allocation',
    goal: 'Eliminate external fragmentation via Compaction.',
  },
  {
    id: 'c3',
    labId: 'synchronization',
    title: 'Trigger & Fix Dining Philosophers Deadlock',
    prompt: 'Open Lab 03, select Dining Philosophers, toggle Deadlock ON, then toggle OFF to see asymmetric fork ordering.',
    route: '/labs/synchronization',
    goal: 'Distinguish circular-wait deadlock from deadlock-free execution.',
  },
];
