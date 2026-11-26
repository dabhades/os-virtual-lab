import type { CommandResult, LinuxEnvState, VfsNode } from './types';
import {
  cloneEnv,
  cloneVfsNode,
  getNodeAt,
  getParentAndName,
  octalToPermString,
  resolvePath,
} from './vfs';

export const SUPPORTED_COMMANDS = [
  'pwd', 'ls', 'cd', 'mkdir', 'rmdir', 'touch', 'cat', 'echo', 'cp', 'mv',
  'rm', 'head', 'tail', 'grep', 'find', 'wc', 'sort', 'uniq', 'tree',
  'chmod', 'chown', 'ps', 'top', 'kill', 'whoami', 'uname', 'date',
  'df', 'free', 'history', 'man', 'help', 'clear',
] as const;

const MAN_PAGES: Record<string, string> = {
  pwd: 'pwd - print name of current/working directory',
  ls: 'ls [-l] [-a] [path] - list directory contents',
  cd: 'cd [dir] - change the shell working directory',
  mkdir: 'mkdir [-p] <dir> - make directories',
  rmdir: 'rmdir <dir> - remove empty directories',
  touch: 'touch <file> - create empty file or update timestamp',
  cat: 'cat [file...] - concatenate files and print on standard output',
  echo: 'echo [text...] - display a line of text',
  cp: 'cp [-r] <src> <dst> - copy files and directories',
  mv: 'mv <src> <dst> - move or rename files and directories',
  rm: 'rm [-r] [-f] <target> - remove files or directories',
  head: 'head [-n N] [file] - output the first N lines (default 10)',
  tail: 'tail [-n N] [file] - output the last N lines (default 10)',
  grep: 'grep [-i] [-n] <pattern> [file] - print lines matching a pattern',
  find: 'find [path] [-name pattern] - search for files in a directory hierarchy',
  wc: 'wc [-l] [-w] [-c] [file] - print newline, word, and byte counts',
  sort: 'sort [-r] [file] - sort lines of text files',
  uniq: 'uniq [file] - report or omit repeated lines',
  tree: 'tree [path] - list contents of directories in a tree-like format',
  chmod: 'chmod <octal|u+x> <file> - change file mode bits',
  chown: 'chown <owner> <file> - change file owner',
  ps: 'ps - report a snapshot of the current processes',
  top: 'top - display simulated Linux processes and CPU/MEM usage',
  kill: 'kill <pid> - terminate a simulated process by PID',
  whoami: 'whoami - print effective user name',
  uname: 'uname [-a] - print system information',
  date: 'date - print the current date and time',
  df: 'df [-h] - report file system disk space usage',
  free: 'free [-h] - display amount of free and used memory',
  history: 'history - display command history list',
  man: 'man <cmd> - format and display manual pages',
  help: 'help - list all available commands',
  clear: 'clear - clear the terminal screen',
};

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = '';
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
      continue;
    }
    if (ch === '|' || ch === ';' || ch === '<' || ch === '>') {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
      if (ch === '>' && input[i + 1] === '>') {
        tokens.push('>>');
        i += 1;
      } else {
        tokens.push(ch);
      }
      continue;
    }
    if (ch === '&' && input[i + 1] === '&') {
      if (cur) {
        tokens.push(cur);
        cur = '';
      }
      tokens.push('&&');
      i += 1;
      continue;
    }
    cur += ch;
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function readTextInput(
  fileArg: string | undefined,
  stdin: string,
  env: LinuxEnvState,
  cmd: string
): { text?: string; err?: string } {
  if (!fileArg) return { text: stdin };
  const node = getNodeAt(env.root, resolvePath(env.cwd, fileArg));
  if (!node) return { err: `${cmd}: ${fileArg}: No such file or directory` };
  if (node.type === 'dir') return { err: `${cmd}: ${fileArg}: Is a directory` };
  if (!node.permissions.startsWith('r')) return { err: `${cmd}: ${fileArg}: Permission denied` };
  return { text: node.content };
}

function runSingleCommand(
  args: string[],
  stdin: string,
  env: LinuxEnvState
): { stdout: string; stderr: string; exitCode: number; clear?: boolean } {
  const cmd = args[0];
  const rest = args.slice(1);

  switch (cmd) {
    case 'pwd':
      return { stdout: env.cwd, stderr: '', exitCode: 0 };

    case 'whoami':
      return { stdout: env.user, stderr: '', exitCode: 0 };

    case 'help':
      return {
        stdout: `Available commands (${SUPPORTED_COMMANDS.length}):\n${SUPPORTED_COMMANDS.join(', ')}\n\nSupports pipes (|), redirection (>, >>, <), chaining (;, &&), and Tab autocomplete.`,
        stderr: '',
        exitCode: 0,
      };

    case 'history':
      return {
        stdout: env.commandHistory
          .map((c, idx) => `${String(idx + 1).padStart(4)}  ${c}`)
          .join('\n'),
        stderr: '',
        exitCode: 0,
      };

    case 'uname':
      return {
        stdout: rest.includes('-a')
          ? 'Linux ubuntu-oslab 6.8.0-45-generic #45-Ubuntu SMP x86_64 GNU/Linux'
          : 'Linux',
        stderr: '',
        exitCode: 0,
      };

    case 'date':
      return { stdout: new Date().toString(), stderr: '', exitCode: 0 };

    case 'clear':
      return { stdout: '', stderr: '', exitCode: 0, clear: true };

    case 'df':
      return {
        stdout: rest.includes('-h')
          ? 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        20G  4.2G   15G  22% /\ntmpfs           4.0G     0  4.0G   0% /tmp'
          : 'Filesystem     1K-blocks    Used Available Use% Mounted on\n/dev/sda1       20971520 4404019  16567501  22% /',
        stderr: '',
        exitCode: 0,
      };

    case 'free':
      return {
        stdout: rest.includes('-h')
          ? '               total        used        free      shared  buff/cache   available\nMem:           7.8Gi       2.1Gi       5.7Gi       120Mi       460Mi       6.1Gi'
          : '               total        used        free\nMem:         8192000     2250800     5941200',
        stderr: '',
        exitCode: 0,
      };

    case 'ps':
    case 'top': {
      const header = '  PID USER     STAT  %CPU  %MEM COMMAND';
      const rows = env.processes.map(
        (p) =>
          `${String(p.pid).padStart(5)} ${p.user.padEnd(8)} ${p.state.padEnd(5)} ${p.cpu.toFixed(1).padStart(4)}  ${p.mem.toFixed(1).padStart(4)} ${p.cmd}`
      );
      return { stdout: [header, ...rows].join('\n'), stderr: '', exitCode: 0 };
    }

    case 'kill': {
      const pid = Number(rest[0]);
      if (!pid || Number.isNaN(pid)) {
        return { stdout: '', stderr: 'kill: usage: kill <pid>', exitCode: 1 };
      }
      if (pid === 1) {
        return {
          stdout: '',
          stderr: 'kill: (1) - Operation not permitted (init is protected)',
          exitCode: 1,
        };
      }
      const idx = env.processes.findIndex((p) => p.pid === pid);
      if (idx === -1) {
        return {
          stdout: '',
          stderr: `kill: (${pid}) - No such process`,
          exitCode: 1,
        };
      }
      env.processes.splice(idx, 1);
      return { stdout: `Terminated process ${pid}`, stderr: '', exitCode: 0 };
    }

    case 'man': {
      const target = rest[0];
      if (!target) {
        return { stdout: '', stderr: 'What manual page do you want?', exitCode: 1 };
      }
      const entry = MAN_PAGES[target];
      return entry
        ? { stdout: entry, stderr: '', exitCode: 0 }
        : { stdout: '', stderr: `No manual entry for ${target}`, exitCode: 1 };
    }

    case 'echo':
      return { stdout: rest.join(' '), stderr: '', exitCode: 0 };

    case 'cd': {
      const target = rest[0] ?? '/home/student';
      const abs = resolvePath(env.cwd, target);
      const node = getNodeAt(env.root, abs);
      if (!node) {
        return { stdout: '', stderr: `bash: cd: ${target}: No such file or directory`, exitCode: 1 };
      }
      if (node.type !== 'dir') {
        return { stdout: '', stderr: `bash: cd: ${target}: Not a directory`, exitCode: 1 };
      }
      env.cwd = abs;
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'ls': {
      const flags = rest.filter((a) => a.startsWith('-')).join('');
      const showLong = flags.includes('l');
      const showAll = flags.includes('a');
      const pathArg = rest.find((a) => !a.startsWith('-'));
      const abs = pathArg ? resolvePath(env.cwd, pathArg) : env.cwd;
      const node = getNodeAt(env.root, abs);
      if (!node) {
        return { stdout: '', stderr: `ls: cannot access '${pathArg}': No such file or directory`, exitCode: 1 };
      }
      if (node.type === 'file') {
        return {
          stdout: showLong
            ? `-${node.permissions} 1 ${node.owner.padEnd(7)} ${String(node.content.length).padStart(5)} ${node.modifiedAt} ${node.name}`
            : node.name,
          stderr: '',
          exitCode: 0,
        };
      }
      let entries = Object.values(node.children ?? {}).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
      if (!showAll) {
        entries = entries.filter((e) => !e.name.startsWith('.'));
      }
      if (showLong) {
        const lines = entries.map((e) => {
          const prefix = e.type === 'dir' ? 'd' : '-';
          const size = e.type === 'dir' ? 4096 : e.content.length;
          return `${prefix}${e.permissions} 1 ${e.owner.padEnd(7)} ${String(size).padStart(5)} ${e.modifiedAt} ${e.name}${e.type === 'dir' ? '/' : ''}`;
        });
        return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
      }
      return {
        stdout: entries
          .map((e) => (e.type === 'dir' ? `${e.name}/` : e.name))
          .join('  '),
        stderr: '',
        exitCode: 0,
      };
    }

    case 'tree': {
      const target = rest[0] ?? '.';
      const abs = resolvePath(env.cwd, target);
      const node = getNodeAt(env.root, abs);
      if (!node) return { stdout: '', stderr: `${target} [error opening dir]`, exitCode: 1 };
      const out: string[] = [target];
      const walk = (n: VfsNode, prefix: string) => {
        if (n.type !== 'dir' || !n.children) return;
        const kids = Object.values(n.children)
          .filter((k) => !k.name.startsWith('.'))
          .sort((a, b) => a.name.localeCompare(b.name));
        kids.forEach((k, idx) => {
          const isLast = idx === kids.length - 1;
          out.push(`${prefix}${isLast ? '└── ' : '├── '}${k.name}${k.type === 'dir' ? '/' : ''}`);
          if (k.type === 'dir') {
            walk(k, prefix + (isLast ? '    ' : '│   '));
          }
        });
      };
      walk(node, '');
      return { stdout: out.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'mkdir': {
      const pFlag = rest.includes('-p');
      const targets = rest.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        return { stdout: '', stderr: 'mkdir: missing operand', exitCode: 1 };
      }
      for (const t of targets) {
        const abs = resolvePath(env.cwd, t);
        if (pFlag) {
          const parts = abs.split('/').filter(Boolean);
          let cur = env.root;
          for (const part of parts) {
            cur.children ??= {};
            if (!cur.children[part]) {
              cur.children[part] = {
                name: part,
                type: 'dir',
                owner: env.user,
                permissions: 'rwxr-xr-x',
                content: '',
                children: {},
                modifiedAt: 'Nov 26 10:00',
              };
            }
            cur = cur.children[part];
          }
        } else {
          const { parent, name } = getParentAndName(env.root, abs);
          if (!parent || parent.type !== 'dir') {
            return { stdout: '', stderr: `mkdir: cannot create directory '${t}': No such file or directory`, exitCode: 1 };
          }
          if (parent.children?.[name]) {
            return { stdout: '', stderr: `mkdir: cannot create directory '${t}': File exists`, exitCode: 1 };
          }
          parent.children ??= {};
          parent.children[name] = {
            name,
            type: 'dir',
            owner: env.user,
            permissions: 'rwxr-xr-x',
            content: '',
            children: {},
            modifiedAt: 'Nov 26 10:00',
          };
        }
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'rmdir': {
      const target = rest[0];
      if (!target) return { stdout: '', stderr: 'rmdir: missing operand', exitCode: 1 };
      const abs = resolvePath(env.cwd, target);
      const { parent, name } = getParentAndName(env.root, abs);
      const node = parent?.children?.[name];
      if (!node) return { stdout: '', stderr: `rmdir: failed to remove '${target}': No such file or directory`, exitCode: 1 };
      if (node.type !== 'dir') return { stdout: '', stderr: `rmdir: failed to remove '${target}': Not a directory`, exitCode: 1 };
      if (Object.keys(node.children ?? {}).length > 0) {
        return { stdout: '', stderr: `rmdir: failed to remove '${target}': Directory not empty`, exitCode: 1 };
      }
      delete parent!.children![name];
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'touch': {
      const target = rest[0];
      if (!target) return { stdout: '', stderr: 'touch: missing file operand', exitCode: 1 };
      const abs = resolvePath(env.cwd, target);
      const { parent, name } = getParentAndName(env.root, abs);
      if (!parent || parent.type !== 'dir') {
        return { stdout: '', stderr: `touch: cannot touch '${target}': No such directory`, exitCode: 1 };
      }
      parent.children ??= {};
      if (!parent.children[name]) {
        parent.children[name] = {
          name,
          type: 'file',
          owner: env.user,
          permissions: 'rw-r--r--',
          content: '',
          modifiedAt: 'Nov 26 10:00',
        };
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'cat': {
      if (rest.length === 0) return { stdout: stdin, stderr: '', exitCode: 0 };
      const outputs: string[] = [];
      for (const f of rest) {
        const res = readTextInput(f, stdin, env, 'cat');
        if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
        outputs.push(res.text ?? '');
      }
      return { stdout: outputs.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'head':
    case 'tail': {
      let n = 10;
      const files: string[] = [];
      for (let i = 0; i < rest.length; i += 1) {
        if (rest[i] === '-n' && rest[i + 1]) {
          n = Math.max(0, Number(rest[i + 1]));
          i += 1;
        } else if (rest[i].startsWith('-n')) {
          n = Math.max(0, Number(rest[i].slice(2)));
        } else {
          files.push(rest[i]);
        }
      }
      const res = readTextInput(files[0], stdin, env, cmd);
      if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
      const lines = res.text ? res.text.split('\n') : [];
      const sliced = cmd === 'head' ? lines.slice(0, n) : lines.slice(-n);
      return { stdout: sliced.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'wc': {
      const flags = rest.filter((a) => a.startsWith('-')).join('');
      const fileArg = rest.find((a) => !a.startsWith('-'));
      const res = readTextInput(fileArg, stdin, env, 'wc');
      if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
      const text = res.text ?? '';
      const lines = text ? text.split('\n').length : 0;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const bytes = text.length;
      if (flags.includes('l')) return { stdout: String(lines), stderr: '', exitCode: 0 };
      if (flags.includes('w')) return { stdout: String(words), stderr: '', exitCode: 0 };
      if (flags.includes('c')) return { stdout: String(bytes), stderr: '', exitCode: 0 };
      return {
        stdout: `${String(lines).padStart(4)} ${String(words).padStart(4)} ${String(bytes).padStart(4)}${fileArg ? ' ' + fileArg : ''}`,
        stderr: '',
        exitCode: 0,
      };
    }

    case 'sort': {
      const rev = rest.includes('-r');
      const fileArg = rest.find((a) => !a.startsWith('-'));
      const res = readTextInput(fileArg, stdin, env, 'sort');
      if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
      const lines = (res.text ?? '').split('\n').sort((a, b) => a.localeCompare(b));
      if (rev) lines.reverse();
      return { stdout: lines.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'uniq': {
      const fileArg = rest.find((a) => !a.startsWith('-'));
      const res = readTextInput(fileArg, stdin, env, 'uniq');
      if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
      const lines = (res.text ?? '').split('\n');
      const deduped = lines.filter((line, idx) => idx === 0 || line !== lines[idx - 1]);
      return { stdout: deduped.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'grep': {
      const flags = rest.filter((a) => a.startsWith('-')).join('');
      const argsNoFlag = rest.filter((a) => !a.startsWith('-'));
      const pattern = argsNoFlag[0];
      if (!pattern) return { stdout: '', stderr: 'grep: missing pattern', exitCode: 1 };

      const res = readTextInput(argsNoFlag[1], stdin, env, 'grep');
      if (res.err) return { stdout: '', stderr: res.err, exitCode: 1 };
      const ignoreCase = flags.includes('i');
      const showLine = flags.includes('n');
      const matched = (res.text ?? '')
        .split('\n')
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(({ line }) =>
          ignoreCase
            ? line.toLowerCase().includes(pattern.toLowerCase())
            : line.includes(pattern)
        )
        .map(({ line, num }) => (showLine ? `${num}:${line}` : line));
      return { stdout: matched.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'find': {
      const startArg = rest[0] && !rest[0].startsWith('-') ? rest[0] : '.';
      const nameIdx = rest.indexOf('-name');
      const namePattern = nameIdx !== -1 ? rest[nameIdx + 1] : null;
      const startAbs = resolvePath(env.cwd, startArg);
      const startNode = getNodeAt(env.root, startAbs);
      if (!startNode) {
        return { stdout: '', stderr: `find: '${startArg}': No such file or directory`, exitCode: 1 };
      }
      const matches: string[] = [];
      const walk = (node: VfsNode, p: string) => {
        const ok =
          !namePattern ||
          (namePattern.includes('*')
            ? new RegExp('^' + namePattern.replace(/\*/g, '.*') + '$').test(node.name)
            : node.name === namePattern);
        if (ok) matches.push(p);
        if (node.type === 'dir' && node.children) {
          Object.values(node.children).forEach((child) =>
            walk(child, p === '/' ? `/${child.name}` : `${p}/${child.name}`)
          );
        }
      };
      walk(startNode, startAbs);
      return { stdout: matches.join('\n'), stderr: '', exitCode: 0 };
    }

    case 'cp':
    case 'mv': {
      const rFlag = rest.includes('-r');
      const paths = rest.filter((a) => !a.startsWith('-'));
      if (paths.length < 2) {
        return { stdout: '', stderr: `${cmd}: missing destination file operand`, exitCode: 1 };
      }
      const srcAbs = resolvePath(env.cwd, paths[0]);
      const dstAbs = resolvePath(env.cwd, paths[1]);
      const { parent: srcParent, name: srcName } = getParentAndName(env.root, srcAbs);
      const srcNode = srcParent?.children?.[srcName];
      if (!srcNode) {
        return { stdout: '', stderr: `${cmd}: cannot stat '${paths[0]}': No such file or directory`, exitCode: 1 };
      }
      if (cmd === 'cp' && srcNode.type === 'dir' && !rFlag) {
        return { stdout: '', stderr: `cp: -r not specified; omitting directory '${paths[0]}'`, exitCode: 1 };
      }

      const existingDst = getNodeAt(env.root, dstAbs);
      if (existingDst && existingDst.type === 'dir') {
        existingDst.children ??= {};
        existingDst.children[srcName] = cloneVfsNode(srcNode);
      } else {
        const { parent: dstParent, name: dstName } = getParentAndName(env.root, dstAbs);
        if (!dstParent || dstParent.type !== 'dir') {
          return { stdout: '', stderr: `${cmd}: cannot create '${paths[1]}': No such directory`, exitCode: 1 };
        }
        const cloned = cloneVfsNode(srcNode);
        cloned.name = dstName;
        dstParent.children ??= {};
        dstParent.children[dstName] = cloned;
      }

      if (cmd === 'mv') {
        delete srcParent!.children![srcName];
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'rm': {
      const rFlag = rest.includes('-r') || rest.includes('-rf');
      const fFlag = rest.includes('-f') || rest.includes('-rf');
      const targets = rest.filter((a) => !a.startsWith('-'));
      if (targets.length === 0) {
        return { stdout: '', stderr: 'rm: missing operand', exitCode: 1 };
      }
      for (const t of targets) {
        const abs = resolvePath(env.cwd, t);
        const { parent, name } = getParentAndName(env.root, abs);
        const node = parent?.children?.[name];
        if (!node) {
          if (fFlag) continue;
          return { stdout: '', stderr: `rm: cannot remove '${t}': No such file or directory`, exitCode: 1 };
        }
        if (node.type === 'dir' && !rFlag) {
          return { stdout: '', stderr: `rm: cannot remove '${t}': Is a directory`, exitCode: 1 };
        }
        delete parent!.children![name];
      }
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    case 'chmod': {
      const modeArg = rest[0];
      const target = rest[1];
      if (!modeArg || !target) {
        return { stdout: '', stderr: 'chmod: usage: chmod <octal|u+x> <file>', exitCode: 1 };
      }
      const node = getNodeAt(env.root, resolvePath(env.cwd, target));
      if (!node) {
        return { stdout: '', stderr: `chmod: cannot access '${target}': No such file or directory`, exitCode: 1 };
      }
      const octal = octalToPermString(modeArg);
      if (octal) {
        node.permissions = octal;
        return { stdout: '', stderr: '', exitCode: 0 };
      }
      if (modeArg === 'u+x' || modeArg === '+x') {
        const chars = node.permissions.split('');
        chars[2] = 'x';
        node.permissions = chars.join('');
        return { stdout: '', stderr: '', exitCode: 0 };
      }
      return { stdout: '', stderr: `chmod: invalid mode '${modeArg}'`, exitCode: 1 };
    }

    case 'chown': {
      const owner = rest[0];
      const target = rest[1];
      if (!owner || !target) {
        return { stdout: '', stderr: 'chown: usage: chown <owner> <file>', exitCode: 1 };
      }
      const node = getNodeAt(env.root, resolvePath(env.cwd, target));
      if (!node) {
        return { stdout: '', stderr: `chown: cannot access '${target}': No such file or directory`, exitCode: 1 };
      }
      node.owner = owner;
      return { stdout: '', stderr: '', exitCode: 0 };
    }

    default:
      return {
        stdout: '',
        stderr: `bash: ${cmd}: command not found (type 'help' or 'man ls')`,
        exitCode: 127,
      };
  }
}

function executePipeline(
  tokens: string[],
  env: LinuxEnvState
): { stdout: string; stderr: string; exitCode: number; clear?: boolean } {
  const stages: string[][] = [];
  let current: string[] = [];
  for (const t of tokens) {
    if (t === '|') {
      if (current.length > 0) stages.push(current);
      current = [];
    } else {
      current.push(t);
    }
  }
  if (current.length > 0) stages.push(current);
  if (stages.length === 0) return { stdout: '', stderr: '', exitCode: 0 };

  let pipeStdin = '';
  let lastOut = '';
  let lastErr = '';
  let lastCode = 0;
  let clearFlag = false;

  for (const stage of stages) {
    const cleanArgs: string[] = [];
    let outRedirect: { file: string; append: boolean } | null = null;
    let inRedirectFile: string | null = null;

    for (let i = 0; i < stage.length; i += 1) {
      if (stage[i] === '>' || stage[i] === '>>') {
        outRedirect = { file: stage[i + 1] ?? '', append: stage[i] === '>>' };
        i += 1;
      } else if (stage[i] === '<') {
        inRedirectFile = stage[i + 1] ?? '';
        i += 1;
      } else {
        cleanArgs.push(stage[i]);
      }
    }

    if (inRedirectFile) {
      const inNode = getNodeAt(env.root, resolvePath(env.cwd, inRedirectFile));
      if (!inNode || inNode.type !== 'file') {
        return {
          stdout: '',
          stderr: `bash: ${inRedirectFile}: No such file or directory`,
          exitCode: 1,
        };
      }
      pipeStdin = inNode.content;
    }

    const res = runSingleCommand(cleanArgs, pipeStdin, env);
    if (res.clear) clearFlag = true;
    lastErr = res.stderr;
    lastCode = res.exitCode;

    if (outRedirect) {
      if (!outRedirect.file) {
        return { stdout: '', stderr: 'bash: syntax error near unexpected token', exitCode: 2 };
      }
      const abs = resolvePath(env.cwd, outRedirect.file);
      const { parent, name } = getParentAndName(env.root, abs);
      if (!parent || parent.type !== 'dir') {
        return { stdout: '', stderr: `bash: ${outRedirect.file}: No such directory`, exitCode: 1 };
      }
      parent.children ??= {};
      const existing = parent.children[name];
      if (existing && existing.type === 'dir') {
        return { stdout: '', stderr: `bash: ${outRedirect.file}: Is a directory`, exitCode: 1 };
      }
      const nextContent =
        outRedirect.append && existing
          ? existing.content
            ? `${existing.content}\n${res.stdout}`
            : res.stdout
          : res.stdout;
      parent.children[name] = {
        name,
        type: 'file',
        owner: env.user,
        permissions: existing?.permissions ?? 'rw-r--r--',
        content: nextContent,
        modifiedAt: 'Nov 26 10:00',
      };
      lastOut = '';
      pipeStdin = '';
    } else {
      lastOut = res.stdout;
      pipeStdin = res.stdout;
    }
  }

  return { stdout: lastOut, stderr: lastErr, exitCode: lastCode, clear: clearFlag };
}

export function executeLinuxCommand(
  rawInput: string,
  prevEnv: LinuxEnvState
): CommandResult {
  const trimmed = rawInput.trim();
  const nextEnv = cloneEnv(prevEnv);

  if (!trimmed) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      explanation: {
        command: '',
        summary: 'Empty command line.',
        rule: 'Enter a Linux command such as ls, pwd, tree, or help.',
      },
      nextEnv,
    };
  }

  nextEnv.commandHistory.push(trimmed);
  const tokens = tokenize(trimmed);

  const chains: { tokens: string[]; op: ';' | '&&' | null }[] = [];
  let buf: string[] = [];
  for (const t of tokens) {
    if (t === ';' || t === '&&') {
      chains.push({ tokens: buf, op: t });
      buf = [];
    } else {
      buf.push(t);
    }
  }
  if (buf.length > 0) chains.push({ tokens: buf, op: null });

  const outParts: string[] = [];
  const errParts: string[] = [];
  let finalExit = 0;
  let clearTerminal = false;

  for (let i = 0; i < chains.length; i += 1) {
    const chain = chains[i];
    const res = executePipeline(chain.tokens, nextEnv);
    if (res.stdout) outParts.push(res.stdout);
    if (res.stderr) errParts.push(res.stderr);
    if (res.clear) clearTerminal = true;
    finalExit = res.exitCode;

    if (chain.op === '&&' && finalExit !== 0) {
      break;
    }
  }

  const primaryCmd = tokens[0] ?? '';
  return {
    stdout: outParts.join('\n'),
    stderr: errParts.join('\n'),
    exitCode: finalExit,
    clearTerminal,
    explanation: {
      command: primaryCmd,
      summary:
        MAN_PAGES[primaryCmd] ??
        `Executed "${trimmed}" in virtual shell (exit code ${finalExit}).`,
      rule: trimmed.includes('|')
        ? 'Pipes (|) connect stdout of one command to stdin of the next.'
        : trimmed.includes('>')
          ? 'Redirection (> / >>) writes command output to a virtual file.'
          : 'Commands operate safely on the isolated Linux FHS tree.',
    },
    nextEnv,
  };
}
