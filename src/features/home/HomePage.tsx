import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';

const LAB_EXPLAINERS: Record<
  string,
  { tagline: string; how: string[]; formula?: string }
> = {
  'linux-terminal': {
    tagline:
      'Practice real Linux commands, pipes, and permissions in a safe browser terminal.',
    how: [
      'The shell reads your command, splits it into words, and runs the matching program.',
      "Pipes ( | ) pass one command's output directly into the next command.",
      'File permissions (rwx) control who can read, write, or execute.',
    ],
  },
  'cpu-scheduling': {
    tagline:
      'See how the OS shares one CPU among waiting processes using FCFS, SJF, Priority, or Round Robin.',
    how: [
      'Each process waits in the ready queue until the scheduler picks it.',
      'FCFS runs in arrival order; Round Robin gives each process a short time slice.',
      'SJF and SRTF pick the shortest job first to cut down waiting time.',
    ],
    formula: 'TAT = CT − AT  |  WT = TAT − BT',
  },
  synchronization: {
    tagline:
      'Prevent race conditions when multiple threads share data using mutexes and semaphores.',
    how: [
      'A mutex is a lock: only one thread enters the critical section at a time.',
      'Semaphores count available slots; threads wait (P) when empty and signal (V) when free.',
      'Producer–Consumer shows how bounded buffers stay safe under concurrency.',
    ],
    formula: 'P(s): wait if s ≤ 0  |  V(s): wake waiting thread',
  },
  'bankers-algorithm': {
    tagline:
      'Check if granting a resource request keeps the system in a safe, deadlock-free state.',
    how: [
      'Need = Max − Allocation shows how much more each process can still request.',
      'The OS simulates running processes that can finish with currently available resources.',
      'If all processes can finish in some order, the state is safe.',
    ],
    formula: 'Need = Max − Allocation',
  },
  'memory-allocation': {
    tagline:
      'Compare how First Fit, Best Fit, and Worst Fit place processes into free RAM blocks.',
    how: [
      'First Fit picks the first free block large enough for the process.',
      'Best Fit picks the smallest block that fits to leave minimal waste.',
      'Worst Fit picks the largest block so the leftover gap stays usable.',
    ],
    formula: 'Internal / External Fragmentation = Unusable free RAM',
  },
  'page-replacement': {
    tagline:
      'Watch how FIFO, LRU, and Optimal decide which page to evict when RAM frames are full.',
    how: [
      'FIFO replaces the oldest page in memory.',
      'LRU replaces the page that has gone longest without being used.',
      'Optimal replaces the page needed furthest in the future.',
    ],
    formula: 'Hit Ratio = Hits / Total References',
  },
  'disk-scheduling': {
    tagline:
      'Minimize disk arm movement across tracks using FCFS, SSTF, SCAN, and C-SCAN.',
    how: [
      'FCFS serves track requests in arrival order.',
      'SSTF always moves to the closest pending track next.',
      'SCAN sweeps the disk arm end-to-end like an elevator.',
    ],
    formula: 'Total Seek = Σ |current track − next track|',
  },
  'file-management': {
    tagline:
      'See how files are stored on disk blocks using Contiguous, Linked, and Indexed allocation.',
    how: [
      'Contiguous puts all file blocks side-by-side — fast reads, harder to grow.',
      'Linked chains blocks with pointers — easy to grow, slower random access.',
      'Indexed keeps a pointer table in one index block for fast direct access.',
    ],
    formula: 'Space Used = Allocated Blocks / Total Blocks',
  },
};

const LAB_ICONS: Record<string, string> = {
  'linux-terminal': '🖥️',
  'cpu-scheduling': '⚙️',
  synchronization: '🔒',
  'bankers-algorithm': '🏦',
  'memory-allocation': '🧠',
  'page-replacement': '📄',
  'disk-scheduling': '💿',
  'file-management': '📁',
};

const DIFF_COLOURS: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};

export function HomePage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-xs sm:px-8 sm:py-14">
        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          OS Virtual Laboratory
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Learn Operating Systems by Trying Them
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          8 interactive simulators with step-by-step explanations. Pick any topic
          below to jump straight in — no setup required.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/labs"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span>Browse All Simulators</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/explore"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            OS Reference
          </Link>
        </div>

        {/* Instant 1-click shortcuts */}
        <div className="mx-auto mt-8 max-w-3xl border-t border-slate-100 pt-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quick Jump to a Simulator
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {LABS_CATALOGUE.map((lab) => (
              <Link
                key={lab.id}
                to={lab.route}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <span aria-hidden="true">{LAB_ICONS[lab.id]}</span>
                <span>{lab.shortTitle}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Topic Cards */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Interactive Topics
            </h2>
            <p className="text-sm text-slate-500">
              Simple explanations and direct access to every simulator.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LABS_CATALOGUE.map((lab) => {
            const explainer = LAB_EXPLAINERS[lab.id];
            const icon = LAB_ICONS[lab.id] ?? '🔬';
            const diffColour =
              DIFF_COLOURS[lab.difficulty] ??
              'bg-slate-50 text-slate-600 border-slate-200';
            const isExpanded = expandedId === lab.id;

            return (
              <article
                key={lab.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl"
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {lab.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${diffColour}`}
                          >
                            {lab.difficulty}
                          </span>
                          <span className="text-xs text-slate-400">
                            ~{lab.estimatedMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {explainer && (
                    <p className="text-sm leading-relaxed text-slate-600">
                      {explainer.tagline}
                    </p>
                  )}

                  {explainer && (
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : lab.id)
                        }
                        aria-expanded={isExpanded}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>How it actually works</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <ul className="space-y-1.5">
                            {explainer.how.map((point, i) => (
                              <li
                                key={i}
                                className="flex gap-2 text-xs leading-snug text-slate-600"
                              >
                                <span className="mt-0.5 shrink-0 text-blue-500">
                                  •
                                </span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                          {explainer.formula && (
                            <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5 font-mono text-[11px] text-blue-700">
                              {explainer.formula}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {lab.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={lab.route}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    aria-label={`Open ${lab.title} simulator`}
                  >
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Quick Reference Formulas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="mb-4 text-center text-base font-bold text-slate-900">
          Key Formulas at a Glance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            {
              label: 'Turnaround',
              formula: 'TAT = CT − AT',
              sub: 'completion − arrival',
            },
            {
              label: 'Waiting',
              formula: 'WT = TAT − BT',
              sub: 'turnaround − burst',
            },
            {
              label: 'Need (Banker)',
              formula: 'Need = Max − Alloc',
              sub: 'remaining demand',
            },
            {
              label: 'Hit Ratio',
              formula: 'HR = H / (H + M)',
              sub: 'page cache efficiency',
            },
          ].map(({ label, formula, sub }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                {formula}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
