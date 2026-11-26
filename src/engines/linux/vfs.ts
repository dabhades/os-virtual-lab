import type { LinuxEnvState, VfsNode } from './types';

function dir(
  name: string,
  owner = 'root',
  permissions = 'rwxr-xr-x',
  children: Record<string, VfsNode> = {}
): VfsNode {
  return {
    name,
    type: 'dir',
    owner,
    permissions,
    content: '',
    modifiedAt: 'Nov 26 10:00',
    children,
  };
}

function file(
  name: string,
  content: string,
  owner = 'root',
  permissions = 'rw-r--r--'
): VfsNode {
  return {
    name,
    type: 'file',
    owner,
    permissions,
    content,
    modifiedAt: 'Nov 26 10:00',
  };
}

export function createInitialLinuxEnv(): LinuxEnvState {
  const root = dir('/', 'root', 'rwxr-xr-x', {
    bin: dir('bin', 'root', 'rwxr-xr-x', {
      bash: file('bash', '[ELF binary: GNU bash 5.2]', 'root', 'rwxr-xr-x'),
      ls: file('ls', '[ELF binary: GNU coreutils ls]', 'root', 'rwxr-xr-x'),
      cat: file('cat', '[ELF binary: GNU coreutils cat]', 'root', 'rwxr-xr-x'),
      grep: file('grep', '[ELF binary: GNU grep 3.11]', 'root', 'rwxr-xr-x'),
    }),
    etc: dir('etc', 'root', 'rwxr-xr-x', {
      hostname: file('hostname', 'ubuntu-oslab'),
      'os-release': file(
        'os-release',
        'NAME="Ubuntu"\nVERSION="24.04.1 LTS (Noble Numbat)"\nID=ubuntu\nPRETTY_NAME="Ubuntu 24.04.1 LTS"'
      ),
      passwd: file(
        'passwd',
        'root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:OS Student:/home/student:/bin/bash'
      ),
      fstab: file(
        'fstab',
        '/dev/sda1  /      ext4  errors=remount-ro  0  1\ntmpfs      /tmp   tmpfs defaults           0  0'
      ),
    }),
    home: dir('home', 'root', 'rwxr-xr-x', {
      student: dir('student', 'student', 'rwxr-xr-x', {
        '.bashrc': file(
          '.bashrc',
          'export PS1="\\u@\\h:\\w\\$ "\nalias ll="ls -la"',
          'student'
        ),
        Desktop: dir('Desktop', 'student', 'rwxr-xr-x', {}),
        Documents: dir('Documents', 'student', 'rwxr-xr-x', {
          'os_syllabus.txt': file(
            'os_syllabus.txt',
            '1. Process Scheduling\n2. Synchronization\n3. Deadlocks\n4. Memory & Paging\n5. File Systems',
            'student'
          ),
        }),
        Downloads: dir('Downloads', 'student', 'rwxr-xr-x', {}),
        projects: dir('projects', 'student', 'rwxr-xr-x', {
          'hello.sh': file(
            'hello.sh',
            '#!/bin/bash\necho "Hello from Linux OS Lab!"',
            'student',
            'rwxr-xr-x'
          ),
          'Makefile': file(
            'Makefile',
            'all:\n\techo "Building kernel module..."',
            'student'
          ),
        }),
        'readme.txt': file(
          'readme.txt',
          'Welcome to Ubuntu 24.04 Virtual Shell!\nTry: ls -la, cd /etc, cat /proc/cpuinfo, or pipe commands with |.',
          'student'
        ),
        'notes.log': file(
          'notes.log',
          'INFO kernel boot complete\nWARN memory pressure at 72%\nINFO scheduler running FCFS\nERROR disk seek timeout\nINFO process P1 exited',
          'student'
        ),
      }),
    }),
    proc: dir('proc', 'root', 'r-xr-xr-x', {
      cpuinfo: file(
        'cpuinfo',
        'processor\t: 0\nmodel name\t: Virtual x86_64 CPU @ 2.40GHz\ncpu cores\t: 4',
        'root',
        'r--r--r--'
      ),
      meminfo: file(
        'meminfo',
        'MemTotal:        8192000 kB\nMemFree:         5941200 kB\nMemAvailable:    6410000 kB',
        'root',
        'r--r--r--'
      ),
      version: file(
        'version',
        'Linux version 6.8.0-45-generic (gcc 13.2.0)',
        'root',
        'r--r--r--'
      ),
    }),
    usr: dir('usr', 'root', 'rwxr-xr-x', {
      local: dir('local', 'root', 'rwxr-xr-x', {
        bin: dir('bin', 'root', 'rwxr-xr-x', {}),
      }),
    }),
    var: dir('var', 'root', 'rwxr-xr-x', {
      log: dir('log', 'root', 'rwxr-xr-x', {
        syslog: file(
          'syslog',
          'Nov 26 10:00:01 ubuntu-oslab kernel: Linux 6.8.0 booted\nNov 26 10:01:12 ubuntu-oslab systemd[1]: Started Virtual Shell\nNov 26 10:02:45 ubuntu-oslab kernel: ext4 mounted on /',
          'root'
        ),
        'auth.log': file(
          'auth.log',
          'Nov 26 10:00:05 ubuntu-oslab login: session opened for user student',
          'root'
        ),
      }),
    }),
    tmp: dir('tmp', 'root', 'rwxrwxrwx', {}),
  });

  return {
    root,
    cwd: '/home/student',
    user: 'student',
    processes: [
      { pid: 1, user: 'root', cmd: '/sbin/init', cpu: 0.1, mem: 0.4, state: 'S' },
      { pid: 102, user: 'student', cmd: '-bash', cpu: 0.3, mem: 1.2, state: 'R' },
      { pid: 215, user: 'student', cmd: 'top', cpu: 0.8, mem: 0.9, state: 'R' },
      { pid: 340, user: 'root', cmd: 'sshd: /usr/sbin/sshd', cpu: 0.0, mem: 0.8, state: 'S' },
    ],
    commandHistory: [],
  };
}

export function cloneVfsNode(node: VfsNode): VfsNode {
  const copy: VfsNode = { ...node };
  if (node.children) {
    copy.children = {};
    for (const [k, v] of Object.entries(node.children)) {
      copy.children[k] = cloneVfsNode(v);
    }
  }
  return copy;
}

export function cloneEnv(env: LinuxEnvState): LinuxEnvState {
  return {
    root: cloneVfsNode(env.root),
    cwd: env.cwd,
    user: env.user,
    processes: env.processes.map((p) => ({ ...p })),
    commandHistory: [...env.commandHistory],
  };
}

export function formatPromptPath(cwd: string): string {
  if (cwd === '/home/student') return '~';
  if (cwd.startsWith('/home/student/')) {
    return '~/' + cwd.slice('/home/student/'.length);
  }
  return cwd;
}

export function resolvePath(cwd: string, target: string): string {
  const raw =
    target === '~'
      ? '/home/student'
      : target.startsWith('~/')
        ? `/home/student/${target.slice(2)}`
        : target;
  const baseParts = raw.startsWith('/') ? [] : cwd.split('/').filter(Boolean);
  const parts = raw.split('/').filter(Boolean);

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (baseParts.length > 0) baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  return '/' + baseParts.join('/');
}

export function getNodeAt(root: VfsNode, absPath: string): VfsNode | null {
  if (absPath === '/') return root;
  const parts = absPath.split('/').filter(Boolean);
  let cur: VfsNode = root;
  for (const part of parts) {
    if (cur.type !== 'dir' || !cur.children || !cur.children[part]) {
      return null;
    }
    cur = cur.children[part];
  }
  return cur;
}

export function getParentAndName(
  root: VfsNode,
  absPath: string
): { parent: VfsNode | null; name: string } {
  if (absPath === '/') return { parent: null, name: '/' };
  const parts = absPath.split('/').filter(Boolean);
  const name = parts.pop()!;
  const parentPath = '/' + parts.join('/');
  return { parent: getNodeAt(root, parentPath), name };
}

export function octalToPermString(octal: string): string | null {
  if (!/^[0-7]{3}$/.test(octal)) return null;
  const map = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  return octal
    .split('')
    .map((d) => map[Number(d)])
    .join('');
}
