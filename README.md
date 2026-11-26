# Operating Systems Virtual Laboratory

An interactive, browser-based Operating Systems Virtual Laboratory built with React, TypeScript, Vite, Tailwind CSS, Zustand, and React Three Fiber.

**Presented by:** Sopan Dabhade & Ritik Bhavle  
**Presented to:** Prof. S.D. Gavande

## Included Simulators
1. **Linux / UNIX Command Simulator** (`/labs/linux-terminal`) — Isolated FHS shell with 30+ commands, pipes, redirection, and Tab autocomplete.
2. **CPU Scheduling** (`/labs/cpu-scheduling`) — FCFS, SJF, SRTF, Priority, Round Robin, HRRN with Gantt Chart and comparison chart.
3. **Process Synchronization & Semaphores** (`/labs/synchronization`) — Critical Section, Race Condition, Mutex, Semaphores, Producer–Consumer, Dining Philosophers, Readers–Writers.
4. **Banker's Algorithm** (`/labs/bankers-algorithm`) — Need matrix, Safety Algorithm, and Resource Request rollback.
5. **Memory Allocation** (`/labs/memory-allocation`) — First/Best/Worst/Next Fit, Fixed/Variable Partitioning, Compaction.
6. **Page Replacement** (`/labs/page-replacement`) — FIFO, LRU, Optimal, LFU, Second Chance, and Belady's Anomaly.
7. **Disk Scheduling** (`/labs/disk-scheduling`) — FCFS, SSTF, SCAN, C-SCAN, LOOK, C-LOOK.
8. **File Management** (`/labs/file-management`) — Contiguous, Linked, Indexed allocation & 4 directory structures.

## Local Development & Verification

```bash
npm install
npm run dev      # Start local dev server
npm test         # Run all 42 unit & UI tests (Vitest)
npm run build    # Type-check and build production bundle into dist/
```

## Deployment
This is a 100% static client-side Single Page Application (`dist/`).
- **Vercel:** Included `vercel.json` handles SPA routing automatically. Run `vercel --prod`.
- **Netlify / Cloudflare Pages:** Included `public/_redirects` handles SPA routing automatically. Set build command to `npm run build` and publish directory to `dist`.
