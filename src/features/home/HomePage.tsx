import { Link } from 'react-router-dom';
import { LABS_CATALOGUE } from '../../data/labsCatalogue';

/* ─── Plain-English descriptions per lab ─── */
const LAB_EXPLAINERS: Record<
  string,
  { tagline: string; how: string[]; formula?: string }
> = {
  'linux-terminal': {
    tagline:
      'A safe sandbox where you type real Linux commands and see exactly what the OS does.',
    how: [
      'The shell reads your command, splits it into words, and finds the matching program.',
      "Input/output can be chained with pipes ( | ) — each program's output becomes the next one's input.",
      'Every file has permission bits (rwx) that decide who can read, write, or run it.',
    ],
  },
  'cpu-scheduling': {
    tagline:
      'The OS must share one CPU fairly among many programs — scheduling decides who runs next.',
    how: [
      'Each process gets a "burst time" — how long it needs the CPU.',
      'FCFS runs jobs in arrival order. Round Robin gives each a fixed time-slice (quantum) then switches.',
      'SJF/SRTF picks the shortest job first, minimising average waiting time.',
    ],
    formula: 'TAT = CT − AT  |  WT = TAT − BT  |  RT = First CPU time − AT',
  },
  synchronization: {
    tagline:
      'When multiple threads share data, they can corrupt it — synchronisation prevents that.',
    how: [
      'A mutex is a lock: only one thread can hold it at a time.',
      'Semaphores count available resources; threads wait (P) or signal (V).',
      'The Producer–Consumer problem shows how bounded buffers must be coordinated.',
    ],
    formula: 'P(s): s-- (wait if s<0)  |  V(s): s++ (wake waiter)',
  },
  'bankers-algorithm': {
    tagline:
      'Before granting a resource request, the OS checks whether a safe completion order still exists.',
    how: [
      'Need = Max − Allocation tells how much more each process might still need.',
      'The algorithm simulates finishing processes in some order using available resources.',
      'If every process can eventually finish, the state is "safe" and the request is granted.',
    ],
    formula: 'Need[i] = Max[i] − Allocation[i]  |  Safe ⟺ ∃ safe sequence',
  },
  'memory-allocation': {
    tagline:
      'RAM is divided into holes; the OS must fit new processes into free gaps efficiently.',
    how: [
      'First Fit places a process in the first hole that is big enough.',
      'Best Fit finds the smallest hole that fits — wastes less space but is slower.',
      'Worst Fit uses the largest hole, hoping the leftover space is still useful.',
    ],
    formula: 'Fragmentation = Total free memory − Largest usable block',
  },
  'page-replacement': {
    tagline:
      'When RAM is full and a new page is needed, the OS must evict an old page — which one?',
    how: [
      'FIFO evicts the page that has been in memory the longest.',
      'LRU evicts the page that was used least recently.',
      'Optimal evicts the page that won\'t be needed for the longest time (theoretical best).',
    ],
    formula: 'Hit Ratio = Hits / (Hits + Misses)  |  Miss penalty = disk access time',
  },
  'disk-scheduling': {
    tagline:
      'The disk head moves to read sectors — good scheduling minimises total head movement.',
    how: [
      'FCFS serves requests in arrival order — simple but can cause lots of arm movement.',
      'SSTF always picks the nearest pending request, reducing seek time.',
      'SCAN sweeps the arm back and forth like an elevator, serving requests on the way.',
    ],
    formula: 'Total seek time = Σ |current track − next track|',
  },
  'file-management': {
    tagline:
      'Files must be stored, named, and found on disk — the File Allocation Table tracks it all.',
    how: [
      'Contiguous allocation stores a file in adjacent blocks — fast but causes fragmentation.',
      'Linked allocation chains blocks together — no fragmentation but slow random access.',
      'Indexed allocation keeps a block of pointers — fast access with small overhead.',
    ],
    formula: 'Space utilisation = Used blocks / Total blocks × 100%',
  },
};

/* ─── Icon map (emoji for zero deps) ─── */
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

/* ─── Difficulty badge colours ─── */
const DIFF_COLOURS: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-red-50 text-red-700 border-red-200',
};

export function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Hero ── */}
      <section className="border-b border-slate-100 bg-gradient-to-b from-blue-50/60 to-white px-4 py-16 text-center sm:py-20">
        <span className="mb-4 inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
          OS Virtual Laboratory
        </span>
        <h1 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
          Learn How Operating Systems Work — by Doing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 sm:text-lg">
          8 interactive simulators covering CPU scheduling, memory management,
          synchronisation, and more. No setup needed — open a lab and experiment
          right in the browser.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/labs"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Explore All Simulators →
          </Link>
          <Link
            to="/explore"
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            OS Reference &amp; Glossary
          </Link>
        </div>

        {/* Quick stats */}
        <div className="mx-auto mt-10 flex max-w-sm flex-wrap justify-center gap-6 text-center">
          {[
            { n: '8', label: 'Simulators' },
            { n: '6', label: 'Algorithms' },
            { n: '0', label: 'Setup needed' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-blue-600">{n}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lab cards ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 pb-28">
        <h2 className="mb-2 text-center text-xl font-bold text-slate-800 sm:text-2xl">
          Topics Covered
        </h2>
        <p className="mb-10 text-center text-sm text-slate-500">
          Click any card to open the simulator directly.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {LABS_CATALOGUE.map((lab) => {
            const explainer = LAB_EXPLAINERS[lab.id];
            const icon = LAB_ICONS[lab.id] ?? '🔬';
            const diffColour =
              DIFF_COLOURS[lab.difficulty] ??
              'bg-slate-50 text-slate-600 border-slate-200';

            return (
              <article
                key={lab.id}
                className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-blue-200"
              >
                {/* Card header */}
                <div className="flex items-start gap-4 p-5 pb-3">
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {lab.number}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${diffColour}`}
                      >
                        {lab.difficulty}
                      </span>
                      <span className="text-xs text-slate-400">
                        ~{lab.estimatedMinutes} min
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-slate-900">
                      {lab.title}
                    </h3>
                  </div>
                </div>

                {/* Tagline */}
                {explainer && (
                  <p className="px-5 pb-2 text-sm text-slate-600 leading-relaxed">
                    {explainer.tagline}
                  </p>
                )}

                {/* How it actually works */}
                {explainer && (
                  <div className="mx-5 mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      How it actually works
                    </p>
                    <ul className="space-y-1.5">
                      {explainer.how.map((point, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-xs text-slate-600 leading-snug"
                        >
                          <span className="mt-0.5 flex-shrink-0 text-blue-400">
                            ▸
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                    {/* Formula strip */}
                    {explainer.formula && (
                      <div className="mt-2.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                        <p className="font-mono text-[10px] text-blue-700 leading-relaxed">
                          {explainer.formula}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Topics */}
                <div className="flex flex-wrap gap-1.5 px-5 pb-3">
                  {lab.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto border-t border-slate-100 px-5 py-3">
                  <Link
                    to={lab.route}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    aria-label={`Open ${lab.title} simulator`}
                  >
                    Open Simulator
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── How OS Concepts Connect strip ── */}
      <section className="border-t border-slate-100 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-lg font-bold text-slate-800">
            How These Topics Connect
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Process lifecycle',
                desc: 'A process starts in Linux Terminal, gets scheduled by CPU Scheduling, and may wait on a Semaphore (Synchronisation).',
                icon: '🔄',
              },
              {
                title: 'Memory hierarchy',
                desc: "RAM is managed by Memory Allocation. When RAM fills up, Page Replacement evicts pages. The Banker's Algorithm ensures we don't deadlock waiting for RAM.",
                icon: '🏗️',
              },
              {
                title: 'Storage & files',
                desc: 'Disk Scheduling decides the order sectors are read. File Management decides how data is laid out on those sectors.',
                icon: '💾',
              },
            ].map(({ title, desc, icon }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <span className="text-2xl">{icon}</span>
                <h3 className="mt-2 text-sm font-bold text-slate-800">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick reference formulas ── */}
      <section className="border-t border-slate-100 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-lg font-bold text-slate-800">
            Quick Reference
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
                sub: 'resource demand left',
              },
              {
                label: 'Hit Ratio',
                formula: 'HR = H / (H + M)',
                sub: 'page cache efficiency',
              },
            ].map(({ label, formula, sub }) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {label}
                </p>
                <p className="mt-1 font-mono text-sm font-bold text-slate-900">
                  {formula}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jump-to shortcuts ── */}
      <section className="border-t border-slate-100 bg-blue-50/40 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-5 text-center text-base font-bold text-slate-700">
            Jump Directly to a Simulator
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {LABS_CATALOGUE.map((lab) => (
              <Link
                key={lab.id}
                to={lab.route}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <span>{LAB_ICONS[lab.id]}</span>
                {lab.shortTitle}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
