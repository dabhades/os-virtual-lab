export interface LessonTerm {
  term: string;
  meaning: string;
}

export interface LessonQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface BeginnerLesson {
  slug: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  simpleExplanation: string;
  analogy: string;
  demoType:
    | 'os-layers'
    | 'resource-referee'
    | 'syscall-bridge'
    | 'hardware-trio'
    | 'program-vs-process'
    | 'process-states'
    | 'cpu-queue'
    | 'ram-blocks'
    | 'file-tree'
    | 'mutex-lock';
  terms: LessonTerm[];
  activityPrompt: string;
  questions: LessonQuestion[];
  recommendedLabRoute: string;
  recommendedLabTitle: string;
}

export const BEGINNER_LESSON_CONTENT: BeginnerLesson[] = [
  {
    slug: 'what-is-an-os',
    order: 1,
    title: 'What is an Operating System?',
    estimatedMinutes: 5,
    simpleExplanation:
      'An Operating System (OS) is the master software that sits between you (and your apps) and the physical computer hardware. Without an OS, every app would have to manually talk to memory chips, screens, and keyboards.',
    analogy:
      'Think of a restaurant manager: customers (apps) place orders, the kitchen (hardware) cooks them, and the manager (OS) coordinates everything smoothly.',
    demoType: 'os-layers',
    terms: [
      { term: 'Kernel', meaning: 'The core part of the OS that talks directly to hardware.' },
      { term: 'Application', meaning: 'A program you use, like a browser or music player.' },
    ],
    activityPrompt: 'Click each layer in the stack below to see its role.',
    questions: [
      {
        question: 'Where does the Operating System sit?',
        options: ['Between apps and hardware', 'Inside the monitor cable', 'Only on the internet'],
        correctIndex: 0,
        explanation: 'The OS bridges user applications and physical hardware.',
      },
    ],
    recommendedLabRoute: '/labs/linux-terminal',
    recommendedLabTitle: 'Lab 01: Linux Terminal',
  },
  {
    slug: 'why-we-need-an-os',
    order: 2,
    title: 'Why do we need an OS?',
    estimatedMinutes: 5,
    simpleExplanation:
      'Modern computers run dozens of programs at the same time. The OS acts as a fair referee so programs do not overwrite each other’s memory or hog the CPU forever.',
    analogy:
      'Like traffic lights at a busy intersection—without them, cars (programs) would collide or block everyone.',
    demoType: 'resource-referee',
    terms: [
      { term: 'Resource Allocation', meaning: 'Sharing CPU time, RAM, and disk fairly among apps.' },
      { term: 'Isolation', meaning: 'Keeping one crashing app from crashing the whole computer.' },
    ],
    activityPrompt: 'Toggle the OS Referee ON/OFF to see what happens when two apps want the same printer.',
    questions: [
      {
        question: 'What happens if two programs write to the same RAM address without an OS referee?',
        options: ['Data corruption / crashes', 'The computer doubles its speed', 'Nothing changes'],
        correctIndex: 0,
        explanation: 'Without isolation, programs overwrite each other’s data.',
      },
    ],
    recommendedLabRoute: '/labs/synchronization',
    recommendedLabTitle: 'Lab 03: Synchronization',
  },
  {
    slug: 'os-and-hardware',
    order: 3,
    title: 'How does the OS interact with hardware?',
    estimatedMinutes: 6,
    simpleExplanation:
      'Apps run in safe User Mode and cannot touch hardware directly. When an app needs a file or screen update, it makes a System Call, switching briefly into Kernel Mode where the OS uses Device Drivers.',
    analogy:
      'Like a bank teller window: you (User Mode) hand a slip (System Call) to the teller (Kernel Mode), who accesses the vault (Hardware).',
    demoType: 'syscall-bridge',
    terms: [
      { term: 'System Call', meaning: 'A safe request an app sends to the OS kernel (e.g., open, read).' },
      { term: 'Device Driver', meaning: 'Translator software for a specific printer, GPU, or disk.' },
    ],
    activityPrompt: 'Step through a file-read request from User Mode to Hardware.',
    questions: [
      {
        question: 'Why are normal apps restricted to User Mode?',
        options: ['To protect hardware and system stability', 'To make apps slower', 'Because keyboards only work in User Mode'],
        correctIndex: 0,
        explanation: 'User Mode prevents buggy apps from damaging hardware or kernel memory.',
      },
    ],
    recommendedLabRoute: '/labs/linux-terminal',
    recommendedLabTitle: 'Lab 01: Linux Terminal',
  },
  {
    slug: 'cpu-ram-storage-io',
    order: 4,
    title: 'CPU, RAM, Storage and I/O',
    estimatedMinutes: 6,
    simpleExplanation:
      'The CPU is the brain that executes instructions, RAM is the fast short-term desk for active work, Storage (SSD/HDD) is the long-term filing cabinet, and I/O devices connect you to the outside world.',
    analogy:
      'A chef (CPU) chops ingredients on a counter (RAM) fetched from a pantry (Storage) and serves dishes to guests (I/O).',
    demoType: 'hardware-trio',
    terms: [
      { term: 'Volatile Memory (RAM)', meaning: 'Super fast, but clears when power turns off.' },
      { term: 'Non-Volatile Storage', meaning: 'Keeps files saved even after shutdown.' },
    ],
    activityPrompt: 'Click each hardware component to inspect its speed and purpose.',
    questions: [
      {
        question: 'Which component loses its contents when you turn off the computer?',
        options: ['RAM', 'SSD Storage', 'Both'],
        correctIndex: 0,
        explanation: 'RAM is volatile; files must be saved to Storage to persist.',
      },
    ],
    recommendedLabRoute: '/labs/memory-allocation',
    recommendedLabTitle: 'Lab 05: Memory Allocation',
  },
  {
    slug: 'what-is-a-process',
    order: 5,
    title: 'What is a process?',
    estimatedMinutes: 5,
    simpleExplanation:
      'A program sitting on your disk is passive code. The moment you double-click it and the OS loads it into RAM with its own memory and CPU state, it becomes an active Process.',
    analogy:
      'A recipe book on a shelf is a Program; actually cooking that recipe in the kitchen is a Process.',
    demoType: 'program-vs-process',
    terms: [
      { term: 'PID', meaning: 'Process ID—a unique number assigned by the OS to track each process.' },
      { term: 'PCB', meaning: 'Process Control Block—the OS’s ID card storing a process’s state and registers.' },
    ],
    activityPrompt: 'Launch the same program twice to see two independent processes with unique PIDs.',
    questions: [
      {
        question: 'Can one program create multiple running processes?',
        options: ['Yes, each gets its own PID and memory', 'No, only one is allowed', 'Only on Linux'],
        correctIndex: 0,
        explanation: 'Opening two browser windows or tabs often spawns separate processes.',
      },
    ],
    recommendedLabRoute: '/labs/cpu-scheduling',
    recommendedLabTitle: 'Lab 02: CPU Scheduling',
  },
  {
    slug: 'process-lifecycle',
    order: 6,
    title: 'Process lifecycle',
    estimatedMinutes: 6,
    simpleExplanation:
      'A process moves through 5 main states: New (being created), Ready (waiting for CPU), Running (executing on CPU), Waiting (paused for I/O like disk/network), and Terminated (finished).',
    analogy:
      'Like a student at an office: Arriving (New), in line (Ready), talking to advisor (Running), filling out a form (Waiting), and leaving (Terminated).',
    demoType: 'process-states',
    terms: [
      { term: 'Ready Queue', meaning: 'Line of processes ready to run as soon as the CPU is free.' },
      { term: 'Context Switch', meaning: 'Saving one process’s state and loading another’s on the CPU.' },
    ],
    activityPrompt: 'Click the transition buttons to move a process through its 5 states.',
    questions: [
      {
        question: 'Where does a Running process go if it waits for a file from disk?',
        options: ['Waiting (Blocked) state', 'Terminated state', 'New state'],
        correctIndex: 0,
        explanation: 'It enters Waiting so another Ready process can use the CPU.',
      },
    ],
    recommendedLabRoute: '/labs/cpu-scheduling',
    recommendedLabTitle: 'Lab 02: CPU Scheduling',
  },
  {
    slug: 'cpu-scheduling-intro',
    order: 7,
    title: 'CPU scheduling',
    estimatedMinutes: 6,
    simpleExplanation:
      'When many processes are Ready, the CPU Scheduler picks who runs next. Different rules trade off fairness, average wait time, and responsiveness.',
    analogy:
      'An ER triage desk vs. a grocery checkout line: First-Come First-Served is simple, while Priority/Shortest-First helps urgent or quick tasks finish faster.',
    demoType: 'cpu-queue',
    terms: [
      { term: 'Turnaround Time', meaning: 'Total time from arrival to completion (CT − AT).' },
      { term: 'Preemption', meaning: 'Pausing a running process to give the CPU to a higher-priority/shorter one.' },
    ],
    activityPrompt: 'Try Lab 02 to compare FCFS, SJF, and Round Robin on live Gantt charts.',
    questions: [
      {
        question: 'Which algorithm gives every process a small fixed time slice (quantum)?',
        options: ['Round Robin', 'FCFS', 'SJF'],
        correctIndex: 0,
        explanation: 'Round Robin cycles through the Ready Queue with a fixed time quantum.',
      },
    ],
    recommendedLabRoute: '/labs/cpu-scheduling',
    recommendedLabTitle: 'Lab 02: CPU Scheduling',
  },
  {
    slug: 'memory-management-intro',
    order: 8,
    title: 'Memory management',
    estimatedMinutes: 6,
    simpleExplanation:
      'RAM is limited, so the OS must place processes into free memory holes and use Virtual Memory (paging) to swap unused pages to disk when RAM fills up.',
    analogy:
      'Keeping only the pages you are currently reading on your desk (RAM) and leaving the rest of the book on the bookshelf (Disk).',
    demoType: 'ram-blocks',
    terms: [
      { term: 'Fragmentation', meaning: 'Wasted free RAM that is either trapped inside a partition or split into tiny holes.' },
      { term: 'Page Fault', meaning: 'When a program needs a page not currently in RAM, so the OS loads it from disk.' },
    ],
    activityPrompt: 'Explore First Fit vs. Best Fit in Lab 05 and LRU in Lab 06.',
    questions: [
      {
        question: 'What is External Fragmentation?',
        options: ['Enough total free RAM exists, but it is split into non-contiguous small holes', 'A broken RAM stick', 'Saving files to USB'],
        correctIndex: 0,
        explanation: 'External fragmentation prevents large contiguous allocations even when total free RAM is sufficient.',
      },
    ],
    recommendedLabRoute: '/labs/memory-allocation',
    recommendedLabTitle: 'Lab 05: Memory Allocation',
  },
  {
    slug: 'file-management-intro',
    order: 9,
    title: 'File management',
    estimatedMinutes: 5,
    simpleExplanation:
      'Disks only store raw numbered blocks. The OS File System organizes those blocks into named files, folders (directories), permissions, and metadata (Inodes).',
    analogy:
      'A library catalog: the book title in the index (Directory) points to a card (Inode) telling you which shelves (Disk Blocks) hold the chapters.',
    demoType: 'file-tree',
    terms: [
      { term: 'Inode', meaning: 'Structure storing file size, owner, permissions, and disk block pointers.' },
      { term: 'Seek Time', meaning: 'Time it takes the disk arm to move to the target cylinder.' },
    ],
    activityPrompt: 'Practice Contiguous, Linked, and Indexed allocation in Lab 08.',
    questions: [
      {
        question: 'Which allocation method uses a dedicated Index Block storing pointers to all data blocks?',
        options: ['Indexed Allocation', 'Contiguous Allocation', 'Single-Level Directory'],
        correctIndex: 0,
        explanation: 'Indexed allocation stores all data block addresses in one index block.',
      },
    ],
    recommendedLabRoute: '/labs/file-management',
    recommendedLabTitle: 'Lab 08: File Management',
  },
  {
    slug: 'synchronization-deadlocks-intro',
    order: 10,
    title: 'Synchronization and deadlocks',
    estimatedMinutes: 7,
    simpleExplanation:
      'When two processes share data, uncoordinated updates cause Race Conditions. Locks (Mutexes/Semaphores) protect critical sections—but careless locking can cause Deadlock, where everyone waits forever.',
    analogy:
      'Two polite people trying to pass through a narrow doorway, each waiting for the other to go first—neither ever moves (Deadlock).',
    demoType: 'mutex-lock',
    terms: [
      { term: 'Mutex / Semaphore', meaning: 'Synchronization tools that coordinate access to shared resources.' },
      { term: 'Deadlock', meaning: 'A permanent standstill where processes hold resources while waiting for each other.' },
    ],
    activityPrompt: 'Trigger a Race Condition in Lab 03 and check Safe Sequences in Lab 04.',
    questions: [
      {
        question: 'What does Banker’s Algorithm check before granting a resource request?',
        options: ['Whether the system remains in a Safe State', 'Whether the CPU is idle', 'Whether the disk is full'],
        correctIndex: 0,
        explanation: 'Banker’s Algorithm avoids deadlock by ensuring a Safe Sequence still exists.',
      },
    ],
    recommendedLabRoute: '/labs/bankers-algorithm',
    recommendedLabTitle: "Lab 04: Banker's Algorithm",
  },
];
