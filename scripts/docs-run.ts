import { execFile, type ExecFileException } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RUN_ALLOW_FS_READ_FLAG, RUN_DIR_PREFIX, RUN_ENV_KEYS, RUN_FILE_NAME, RUN_MAX_BUFFER_BYTES, RUN_TIMEOUT_MS } from './docs-gate.constants.ts';
import type { DocRunResult } from './docs-gate.types.ts';

function minimalEnv(): NodeJS.ProcessEnv {
  const inherited = RUN_ENV_KEYS.flatMap((key) => {
    const value = process.env[key];
    return value === undefined ? [] : [[key, value] as const];
  });
  return { NODE_ENV: 'production', NODE_NO_WARNINGS: '1', ...Object.fromEntries(inherited) };
}

function toResult(error: ExecFileException | null, stdout: string, stderr: string): DocRunResult {
  if (error === null) return { stdout, stderr, exitCode: 0, timedOut: false };
  const exitCode = typeof error.code === 'number' ? error.code : null;
  const timedOut = error.killed === true;
  return { stdout, stderr: exitCode === null && !timedOut && stderr === '' ? error.message : stderr, exitCode, timedOut };
}

// O modelo de permissão do Node nega rede, filho e escrita; leitura só na pasta do programa.
function execute(file: string, dir: string, stdin: string): Promise<DocRunResult> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      ['--permission', `${RUN_ALLOW_FS_READ_FLAG}${dir}`, file],
      { cwd: dir, env: minimalEnv(), timeout: RUN_TIMEOUT_MS, killSignal: 'SIGKILL', maxBuffer: RUN_MAX_BUFFER_BYTES, encoding: 'utf8' },
      (error, stdout, stderr) => {
        resolve(toResult(error, stdout, stderr));
      },
    );
    // O programa pode terminar antes de ler tudo: EPIPE aqui não é falha do bloco.
    child.stdin?.on('error', () => undefined);
    child.stdin?.end(stdin);
  });
}

export async function runDocProgram(code: string, stdin: string): Promise<DocRunResult> {
  const dir = await mkdtemp(join(tmpdir(), RUN_DIR_PREFIX));
  try {
    const file = join(dir, RUN_FILE_NAME);
    await writeFile(file, code, 'utf8');
    return await execute(file, dir, stdin);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
