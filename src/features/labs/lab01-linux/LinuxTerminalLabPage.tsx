import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, RotateCcw, Terminal } from 'lucide-react';
import {
  createInitialLinuxEnv,
  formatPromptPath,
  getNodeAt,
} from '../../../engines/linux/vfs';
import {
  SUPPORTED_COMMANDS,
  executeLinuxCommand,
} from '../../../engines/linux/shellEngine';
import type { LinuxEnvState, VfsNode } from '../../../engines/linux/types';
import { useAppStore } from '../../../core/useAppStore';
import { buildExperimentReport } from '../../../core/reportGenerator';
import type { ExperimentReport } from '../../../types/report';
import { ReportModal } from '../../../components/simulator/ReportModal';
import { AlgorithmStepsCard } from '../../../components/simulator/AlgorithmStepsCard';
import { ExplainerToast } from '../../../components/simulator/ExplainerToast';
import { LinuxExplorerPanel } from './LinuxExplorerPanel';
import { LinuxMissionsPanel } from './LinuxMissionsPanel';

interface TerminalLine {
  id: string;
  prompt?: string;
  promptPath?: string;
  command?: string;
  stdout?: string;
  stderr?: string;
}

export function LinuxTerminalLabPage() {
  const [env, setEnv] = useState<LinuxEnvState>(() => createInitialLinuxEnv());
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome',
      stdout:
        'Ubuntu 24.04.1 LTS (Virtual OS Lab Shell)\nType "help" for commands, "tree" to view folders, or use Tab to autocomplete.',
    },
  ]);
  const [input, setInput] = useState('');
  const [histCursor, setHistCursor] = useState<number | null>(null);
  const [lastExplain, setLastExplain] = useState<{
    command: string;
    summary: string;
    rule: string;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    path: string;
    node: VfsNode;
  } | null>(null);
  const [report, setReport] = useState<ExperimentReport | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordLastVisited = useAppStore((s) => s.recordLastVisited);
  const addExperimentRun = useAppStore((s) => s.addExperimentRun);
  const showExplainerToasts = useAppStore(
    (s) => s.preferences.showExplainerToasts
  );
  const updatePreferences = useAppStore((s) => s.updatePreferences);

  useEffect(() => {
    recordLastVisited('/labs/linux-terminal', 'Linux / UNIX Command Simulator');
  }, [recordLastVisited]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const runCommand = (raw: string) => {
    const promptUser = `${env.user}@ubuntu-oslab`;
    const promptPath = formatPromptPath(env.cwd);
    const res = executeLinuxCommand(raw, env);
    setEnv(res.nextEnv);
    setLastExplain(res.explanation);
    setHistCursor(null);

    if (res.clearTerminal) {
      setLines([]);
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        prompt: promptUser,
        promptPath,
        command: raw,
        stdout: res.stdout,
        stderr: res.stderr,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input;
    setInput('');
    runCommand(cmd);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      setLines([]);
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      setLines((prev) => [
        ...prev,
        {
          id: `${Date.now()}-ctrlc`,
          prompt: `${env.user}@ubuntu-oslab`,
          promptPath: formatPromptPath(env.cwd),
          command: `${input}^C`,
        },
      ]);
      setInput('');
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(' ');
      const last = parts[parts.length - 1] ?? '';
      if (parts.length <= 1) {
        const match = SUPPORTED_COMMANDS.find((c) => c.startsWith(last));
        if (match) setInput(`${match} `);
      } else {
        const cwdNode = getNodeAt(env.root, env.cwd);
        const names = Object.keys(cwdNode?.children ?? {});
        const match = names.find((n) => n.startsWith(last));
        if (match) {
          parts[parts.length - 1] = match;
          setInput(parts.join(' '));
        }
      }
      return;
    }

    const hist = env.commandHistory;
    if (hist.length === 0) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIdx =
        histCursor === null ? hist.length - 1 : Math.max(0, histCursor - 1);
      setHistCursor(nextIdx);
      setInput(hist[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histCursor === null) return;
      if (histCursor >= hist.length - 1) {
        setHistCursor(null);
        setInput('');
      } else {
        const nextIdx = histCursor + 1;
        setHistCursor(nextIdx);
        setInput(hist[nextIdx]);
      }
    }
  };

  const handleReset = () => {
    setEnv(createInitialLinuxEnv());
    setLines([
      {
        id: 'reset',
        stdout: 'Filesystem and process table reset to clean Ubuntu FHS state.',
      },
    ]);
    setLastExplain(null);
    setSelectedFile(null);
  };

  const handleExportReport = () => {
    const generated = buildExperimentReport(
      {
        labId: 'linux-terminal',
        labTitle: 'Linux / UNIX Command Simulator',
        aim: 'Practice Linux navigation, file manipulation, permissions, pipes, and process commands in an isolated FHS.',
        objectives: [
          'Execute shell commands with pipes and redirection.',
          'Explore /etc, /proc, /var/log, and /home/student.',
        ],
        theorySummary:
          'The UNIX shell parses command lines, sets up standard I/O pipelines, and invokes filesystem and process operations.',
        algorithmName: 'POSIX-Subset Virtual Shell',
        algorithmSteps: [
          'Tokenize input, splitting chains (;, &&) and pipes (|).',
          'Resolve paths against current working directory (cwd).',
          'Execute command against in-memory Linux FHS and update explorer.',
        ],
        inputs: { commandsExecuted: env.commandHistory },
        conclusion: `Executed ${env.commandHistory.length} virtual shell command(s) safely in browser memory.`,
      },
      {
        steps: env.commandHistory.map((cmd, idx) => ({
          stepIndex: idx,
          tick: idx + 1,
          state: {},
          events: [],
          explanation: {
            whatHappened: `Executed: ${cmd}`,
            whyItHappened: 'User shell input',
            whichRule: 'Virtual POSIX shell',
            whatNext: '',
            remember: '',
          },
        })),
        finalMetrics: {
          commandsExecuted: env.commandHistory.length,
          currentDirectory: env.cwd,
          activeProcesses: env.processes.length,
        },
      }
    );
    setReport(generated);
    void addExperimentRun({
      id: generated.id,
      labId: 'linux-terminal',
      labTitle: 'Linux Terminal',
      algorithm: 'VFS Shell',
      timestamp: generated.generatedAt,
      summaryMetric: `${env.commandHistory.length} cmds`,
    });
  };

  const promptPath = formatPromptPath(env.cwd);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div>
          <Link
            to="/labs"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>All Simulators</span>
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            Linux / UNIX Command Simulator
          </h1>
          <p className="text-xs text-slate-500">
            Realistic Ubuntu-style CLI with FHS directory tree (/bin, /etc, /home, /proc, /var/log) and Tab autocomplete.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showExplainerToasts}
              onChange={(e) =>
                updatePreferences({ showExplainerToasts: e.target.checked })
              }
              className="h-3.5 w-3.5 accent-blue-600"
            />
            <span>Explainer Toasts</span>
          </label>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileText className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Collapsible Algorithm Process Block */}
      <AlgorithmStepsCard
        labTitle="Linux / UNIX Command Simulator"
        isRunning={env.commandHistory.length > 0}
      />

      {/* Main Split: Explorer + Missions | Authentic Dark CLI */}
      <div className="grid gap-5 lg:grid-cols-12">
        <aside className="min-w-0 space-y-5 rounded-xl border border-slate-200 bg-white p-4 lg:col-span-5">
          <LinuxExplorerPanel
            root={env.root}
            cwd={env.cwd}
            selectedFile={selectedFile}
            onSelectFile={(path, node) => setSelectedFile({ path, node })}
          />
          <LinuxMissionsPanel env={env} onRunHint={runCommand} />
        </aside>

        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7">
          {/* Authentic Dark Linux Terminal */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex h-[28rem] cursor-text flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#0C0F14] shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#151922] px-4 py-2 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
                </span>
                <Terminal className="ml-2 h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                <span>{env.user}@ubuntu-oslab: {promptPath}</span>
              </div>
              <span className="hidden text-[10px] text-slate-400 sm:inline">
                Tab: complete · Ctrl+L: clear
              </span>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
              {lines.map((line) => (
                <div key={line.id} className="space-y-0.5">
                  {line.command !== undefined && (
                    <div className="break-all">
                      <span className="font-semibold text-emerald-400">
                        {line.prompt}
                      </span>
                      <span className="text-slate-400">:</span>
                      <span className="font-semibold text-sky-400">
                        {line.promptPath}
                      </span>
                      <span className="text-slate-300">$ </span>
                      <span className="text-slate-100">{line.command}</span>
                    </div>
                  )}
                  {line.stdout && (
                    <pre className="whitespace-pre-wrap break-words text-slate-200">
                      {line.stdout}
                    </pre>
                  )}
                  {line.stderr && (
                    <pre className="whitespace-pre-wrap break-words text-rose-400">
                      {line.stderr}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-1 border-t border-slate-800/80 bg-[#0C0F14] px-4 py-2.5 font-mono text-xs"
            >
              <span className="shrink-0 font-semibold text-emerald-400">
                {env.user}@ubuntu-oslab
              </span>
              <span className="text-slate-400">:</span>
              <span className="shrink-0 font-semibold text-sky-400">
                {promptPath}
              </span>
              <span className="mr-1 shrink-0 text-slate-300">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type a command (e.g., ls -la, cat /proc/cpuinfo, tree)..."
                aria-label="Linux terminal command input"
                className="w-full bg-transparent text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
            </form>
          </div>

          {/* Live Command Explanation */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs">
            <div className="mb-1 font-semibold text-slate-900">
              Command Breakdown
            </div>
            {lastExplain ? (
              <div className="space-y-1 text-slate-600">
                <p>
                  <strong className="font-mono text-blue-700">
                    {lastExplain.command || '(empty)'}:
                  </strong>{' '}
                  {lastExplain.summary}
                </p>
                <p className="text-slate-500">Rule: {lastExplain.rule}</p>
              </div>
            ) : (
              <p className="text-slate-500">
                Run any command in the dark terminal above to see how it works and watch the filesystem tree update.
              </p>
            )}
          </div>
        </div>
      </div>

      <ReportModal report={report} onClose={() => setReport(null)} />
      <ExplainerToast
        visible={showExplainerToasts}
        stepIndex={env.commandHistory.length}
        tick={env.commandHistory.length}
        explanation={
          lastExplain
            ? {
                whatHappened: lastExplain.summary,
                whyItHappened: `Executed "${lastExplain.command}" in ${env.cwd}.`,
                whichRule: lastExplain.rule,
                whatNext: 'Check the updated filesystem tree on the left.',
                remember: 'Tab completes commands and filenames.',
              }
            : null
        }
      />
    </div>
  );
}
