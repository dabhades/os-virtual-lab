import type { LabId } from '../../types/learning';

export function TopicPreview({ labId }: { labId: LabId }) {
  switch (labId) {
    case 'linux-terminal':
      return (
        <div className="flex h-24 flex-col justify-between rounded-lg border border-slate-200 bg-slate-900 p-2.5 font-mono text-[10px] text-slate-200">
          <div className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <div>
              <span className="text-emerald-400">$</span> ls -l | grep log
            </div>
            <div className="text-slate-400">-rw-r--r-- notes.log</div>
          </div>
        </div>
      );

    case 'cpu-scheduling':
      return (
        <div className="flex h-24 flex-col justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex h-7 w-full overflow-hidden rounded-md border border-slate-200 font-mono text-[10px] font-semibold">
            <div className="flex w-[28%] items-center justify-center bg-blue-100 text-blue-800">
              P1
            </div>
            <div className="flex w-[20%] items-center justify-center border-l border-slate-200 bg-emerald-100 text-emerald-800">
              P2
            </div>
            <div className="flex w-[32%] items-center justify-center border-l border-slate-200 bg-amber-100 text-amber-800">
              P3
            </div>
            <div className="flex w-[20%] items-center justify-center border-l border-slate-200 bg-slate-200 text-slate-700">
              P1
            </div>
          </div>
          <div className="flex justify-between font-mono text-[9px] text-slate-400">
            <span>0</span>
            <span>4</span>
            <span>7</span>
            <span>12</span>
            <span>15</span>
          </div>
        </div>
      );

    case 'synchronization':
      return (
        <div className="flex h-24 flex-col justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>mutex = 1</span>
            <span>empty = 2</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <div className="rounded border border-emerald-300 bg-emerald-50 py-1.5 text-center font-semibold text-emerald-700">
              Item 1
            </div>
            <div className="rounded border border-emerald-300 bg-emerald-50 py-1.5 text-center font-semibold text-emerald-700">
              Item 2
            </div>
            <div className="rounded border border-dashed border-slate-300 bg-white py-1.5 text-center text-slate-400">
              Empty
            </div>
            <div className="rounded border border-dashed border-slate-300 bg-white py-1.5 text-center text-slate-400">
              Empty
            </div>
          </div>
        </div>
      );

    case 'bankers-algorithm':
      return (
        <div className="flex h-24 flex-col justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Work: [3, 3, 2]</span>
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-semibold text-emerald-700">
              SAFE
            </span>
          </div>
          <div className="flex items-center gap-1 text-blue-700">
            <span className="rounded border border-blue-200 bg-white px-1.5 py-0.5">P1</span>
            <span>→</span>
            <span className="rounded border border-blue-200 bg-white px-1.5 py-0.5">P3</span>
            <span>→</span>
            <span className="rounded border border-blue-200 bg-white px-1.5 py-0.5">P4</span>
            <span>→</span>
            <span className="rounded border border-blue-200 bg-white px-1.5 py-0.5">P0</span>
          </div>
        </div>
      );

    case 'memory-allocation':
      return (
        <div className="flex h-24 flex-col justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex h-8 w-full overflow-hidden rounded-md border border-slate-200 font-mono text-[10px]">
            <div className="flex w-[30%] items-center justify-center bg-blue-100 font-semibold text-blue-800">
              P1 120K
            </div>
            <div className="flex w-[22%] items-center justify-center border-l border-slate-200 bg-white text-slate-400">
              Free
            </div>
            <div className="flex w-[28%] items-center justify-center border-l border-slate-200 bg-emerald-100 font-semibold text-emerald-800">
              P3 100K
            </div>
            <div className="flex w-[20%] items-center justify-center border-l border-slate-200 bg-white text-slate-400">
              Free
            </div>
          </div>
          <div className="flex justify-between font-mono text-[9px] text-slate-400">
            <span>0 KB</span>
            <span>First / Best / Worst / Compact</span>
            <span>512 KB</span>
          </div>
        </div>
      );

    case 'page-replacement':
      return (
        <div className="flex h-24 flex-col justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px]">
          <div className="grid grid-cols-5 gap-1 text-center">
            {['7', '0', '1', '2', '0'].map((n, i) => (
              <div
                key={i}
                className={`rounded border py-1 font-semibold ${
                  i === 4
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-blue-200 bg-white text-slate-800'
                }`}
              >
                {n}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-1 text-center text-[9px]">
            <span className="text-rose-600">F</span>
            <span className="text-rose-600">F</span>
            <span className="text-rose-600">F</span>
            <span className="text-rose-600">F</span>
            <span className="font-bold text-emerald-600">H</span>
          </div>
        </div>
      );

    case 'disk-scheduling':
      return (
        <div className="flex h-24 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2">
          <svg viewBox="0 0 200 60" className="h-full w-full" aria-hidden="true">
            <line x1="10" y1="8" x2="190" y2="8" stroke="#CBD5E1" strokeWidth="1.5" />
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              points="55,14 35,26 16,38 115,50 175,56"
            />
            <circle cx="55" cy="14" r="3" fill="#2563EB" />
            <circle cx="35" cy="26" r="3" fill="#16A34A" />
            <circle cx="16" cy="38" r="3" fill="#16A34A" />
            <circle cx="115" cy="50" r="3" fill="#16A34A" />
            <circle cx="175" cy="56" r="3.5" fill="#2563EB" />
          </svg>
        </div>
      );

    case 'file-management':
      return (
        <div className="flex h-24 flex-col justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-[10px]">
          <div className="grid grid-cols-6 gap-1 text-center">
            <div className="rounded border border-amber-300 bg-amber-50 py-1 text-amber-800">IDX</div>
            <div className="rounded border border-blue-300 bg-blue-50 py-1 text-blue-800">a.c</div>
            <div className="rounded border border-blue-300 bg-blue-50 py-1 text-blue-800">a.c</div>
            <div className="rounded border border-slate-200 bg-white py-1 text-slate-400">·</div>
            <div className="rounded border border-blue-300 bg-blue-50 py-1 text-blue-800">a.c</div>
            <div className="rounded border border-slate-200 bg-white py-1 text-slate-400">·</div>
          </div>
          <div className="text-[9px] text-slate-500">
            Inode #100 · Contiguous / Linked / Indexed
          </div>
        </div>
      );
  }
}
