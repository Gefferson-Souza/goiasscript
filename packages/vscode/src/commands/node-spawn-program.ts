import { spawn } from 'node:child_process';
import type { ChildProcessLike, ExecFileCallback, ExecFileLike } from './commands.types.ts';

const OUTPUT_ENCODING = 'utf8';

function exitError(code: number | null, signal: NodeJS.Signals | null): Error | null {
  if (code === 0) return null;
  return code === null ? new Error(`terminated by ${signal ?? 'unknown'}`) : Object.assign(new Error(`exit ${String(code)}`), { code });
}

function reportOnce(callback: ExecFileCallback): ExecFileCallback {
  let reported = false;
  return (error, stdout, stderr) => {
    if (reported) return;
    reported = true;
    callback(error, stdout, stderr);
  };
}

// A saída do programa do aluno segue ao vivo para o terminal; spawn não a acumula, então não há teto que mate o filho.
export const nodeSpawnProgram: ExecFileLike = (file, args, options, callback) => {
  const done = reportOnce(callback);
  const child = spawn(file, [...args], { cwd: options.cwd, env: { ...options.env }, windowsHide: options.windowsHide, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.setEncoding(OUTPUT_ENCODING);
  child.stderr.setEncoding(OUTPUT_ENCODING);
  child.on('error', (error) => {
    done(error, '', '');
  });
  child.on('close', (code, signal) => {
    done(exitError(code, signal), '', '');
  });
  const handle: ChildProcessLike = { stdin: child.stdin, stdout: child.stdout, stderr: child.stderr, kill: () => child.kill() };
  return handle;
};
