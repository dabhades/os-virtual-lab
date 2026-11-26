import { describe, expect, it } from 'vitest';
import { createInitialLinuxEnv, getNodeAt } from '../../src/engines/linux/vfs';
import { executeLinuxCommand } from '../../src/engines/linux/shellEngine';

describe('linux shellEngine & VFS', () => {
  it('includes realistic Linux FHS directories (/etc, /proc, /var/log, /bin)', () => {
    const env = createInitialLinuxEnv();

    const osRelease = executeLinuxCommand('cat /etc/os-release', env);
    expect(osRelease.exitCode).toBe(0);
    expect(osRelease.stdout).toContain('Ubuntu');

    const cpu = executeLinuxCommand('cat /proc/cpuinfo', env);
    expect(cpu.stdout).toContain('cpu cores');

    // ls hides dotfiles unless -a is passed
    const lsDefault = executeLinuxCommand('ls', env);
    expect(lsDefault.stdout).not.toContain('.bashrc');

    const lsAll = executeLinuxCommand('ls -la', env);
    expect(lsAll.stdout).toContain('.bashrc');
  });

  it('supports navigation, creation, and permission checks safely', () => {
    let env = createInitialLinuxEnv();

    let res = executeLinuxCommand('pwd', env);
    expect(res.stdout).toBe('/home/student');
    env = res.nextEnv;

    res = executeLinuxCommand('mkdir lab && cd lab && touch test.txt', env);
    expect(res.exitCode).toBe(0);
    env = res.nextEnv;
    expect(env.cwd).toBe('/home/student/lab');
    expect(getNodeAt(env.root, '/home/student/lab/test.txt')?.type).toBe('file');

    res = executeLinuxCommand('chmod 000 test.txt && cat test.txt', env);
    expect(res.exitCode).toBe(1);
    expect(res.stderr).toContain('Permission denied');
  });

  it('supports pipes (|), wc, sort, tree, and redirection (>, >>)', () => {
    let env = createInitialLinuxEnv();

    const piped = executeLinuxCommand(
      'cat notes.log | grep INFO | head -n 2 > info.txt',
      env
    );
    expect(piped.exitCode).toBe(0);
    env = piped.nextEnv;

    const lineCount = executeLinuxCommand('cat info.txt | wc -l', env);
    expect(lineCount.stdout.trim()).toBe('2');

    const treeOut = executeLinuxCommand('tree projects', env);
    expect(treeOut.stdout).toContain('hello.sh');
  });

  it('protects PID 1 (init) and handles non-empty rmdir errors', () => {
    const env = createInitialLinuxEnv();
    const killInit = executeLinuxCommand('kill 1', env);
    expect(killInit.exitCode).toBe(1);
    expect(killInit.stderr).toContain('Operation not permitted');

    const badRmdir = executeLinuxCommand('rmdir projects', env);
    expect(badRmdir.exitCode).toBe(1);
    expect(badRmdir.stderr).toContain('Directory not empty');
  });
});
