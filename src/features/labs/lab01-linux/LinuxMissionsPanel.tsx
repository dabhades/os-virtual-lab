import { CheckCircle2, Circle } from 'lucide-react';
import type { LinuxEnvState } from '../../../engines/linux/types';
import { getNodeAt } from '../../../engines/linux/vfs';

interface Mission {
  id: string;
  title: string;
  hintCmd: string;
  check: (env: LinuxEnvState) => boolean;
}

export const LINUX_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'List files with details (ls -l)',
    hintCmd: 'ls -l',
    check: (env) => env.commandHistory.some((c) => c.startsWith('ls')),
  },
  {
    id: 'm2',
    title: 'Create a directory named "oslab"',
    hintCmd: 'mkdir oslab',
    check: (env) => getNodeAt(env.root, '/home/student/oslab')?.type === 'dir',
  },
  {
    id: 'm3',
    title: 'Filter logs with pipe & grep -> file',
    hintCmd: 'cat notes.log | grep INFO > info.txt',
    check: (env) =>
      env.commandHistory.some((c) => c.includes('|') && c.includes('grep')) &&
      getNodeAt(env.root, '/home/student/info.txt')?.type === 'file',
  },
  {
    id: 'm4',
    title: 'Inspect running processes (ps)',
    hintCmd: 'ps',
    check: (env) => env.commandHistory.some((c) => c === 'ps' || c === 'top'),
  },
];

export function LinuxMissionsPanel({
  env,
  onRunHint,
}: {
  env: LinuxEnvState;
  onRunHint: (cmd: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
        Beginner Missions
      </h2>
      <ul className="space-y-2">
        {LINUX_MISSIONS.map((m) => {
          const done = m.check(env);
          return (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-subtle bg-canvas/60 px-3 py-2 text-xs"
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                )}
                <span className={done ? 'text-emerald-700' : 'text-slate-800'}>
                  {m.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRunHint(m.hintCmd)}
                className="shrink-0 rounded-md border border-subtle bg-surface px-2 py-0.5 font-mono text-[10px] text-blue-700 hover:border-blue-500"
              >
                Try
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
