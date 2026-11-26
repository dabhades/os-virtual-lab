export interface VfsNode {
  name: string;
  type: 'file' | 'dir';
  owner: string;
  permissions: string; // e.g., 'rwxr-xr-x' or 'rw-r--r--'
  content: string;
  children?: Record<string, VfsNode>;
  modifiedAt: string;
}

export interface SimProcess {
  pid: number;
  user: string;
  cmd: string;
  cpu: number;
  mem: number;
  state: 'R' | 'S';
}

export interface LinuxEnvState {
  root: VfsNode;
  cwd: string;
  user: string;
  processes: SimProcess[];
  commandHistory: string[];
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  clearTerminal?: boolean;
  explanation: {
    command: string;
    summary: string;
    rule: string;
  };
  nextEnv: LinuxEnvState;
}
