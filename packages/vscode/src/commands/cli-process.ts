import type { ChildProcessLike, CliInvocation, CliOutcome, ExecFileLike } from './commands.types.ts';

export function exitCodeOf(error: Error | null): number | null {
  if (error === null) return 0;
  return 'code' in error && typeof error.code === 'number' ? error.code : null;
}

// Falha ao iniciar o processo traz código textual (ENOENT); saída por sinal (Ctrl+C) não.
export function isStartFailure(error: Error | null): boolean {
  return error !== null && 'code' in error && typeof error.code === 'string';
}

export function startCli(execFile: ExecFileLike, invocation: CliInvocation, onDone: (error: Error | null, stdout: string, stderr: string) => void): ChildProcessLike {
  return execFile(invocation.file, invocation.args, invocation.options, onDone);
}

export function runCliToCompletion(execFile: ExecFileLike, invocation: CliInvocation): Promise<CliOutcome> {
  return new Promise((resolve) => {
    try {
      startCli(execFile, invocation, (error, stdout, stderr) => {
        const exitCode = exitCodeOf(error);
        resolve(exitCode === null ? { kind: 'not-started' } : { kind: 'exited', exitCode, stdout, stderr });
      });
    } catch {
      // execFile recusa argumentos inválidos de forma síncrona; para o usuário é o mesmo que não ter iniciado.
      resolve({ kind: 'not-started' });
      return;
    }
  });
}

