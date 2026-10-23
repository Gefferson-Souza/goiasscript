import { execFile, type ExecFileException } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LESSON_RUN_DIR_PREFIX, LESSON_RUN_ENV_KEYS, LESSON_RUN_FILE_NAME, LESSON_RUN_MAX_BUFFER_BYTES, LESSON_RUN_TIMEOUT_MS } from './lesson.constants.ts';
import type { RunLessonProgramOptions, RunLessonProgramResult } from './run-lesson-program.types.ts';

function minimalEnv(): NodeJS.ProcessEnv {
  const inherited = LESSON_RUN_ENV_KEYS.flatMap((key) => {
    const value = process.env[key];
    return value === undefined ? [] : [[key, value] as const];
  });
  return { NODE_ENV: 'production', NODE_NO_WARNINGS: '1', ...Object.fromEntries(inherited) };
}

function toResult(error: ExecFileException | null, stdout: string, stderr: string): RunLessonProgramResult {
  if (error === null) return { stdout, stderr, exitCode: 0, timedOut: false };
  const exitCode = typeof error.code === 'number' ? error.code : null;
  const timedOut = error.killed === true;
  return { stdout, stderr: exitCode === null && !timedOut && stderr === '' ? error.message : stderr, exitCode, timedOut };
}

function execute(file: string, dir: string, stdin: string, timeoutMs: number): Promise<RunLessonProgramResult> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      [file],
      { cwd: dir, env: minimalEnv(), timeout: timeoutMs, killSignal: 'SIGKILL', maxBuffer: LESSON_RUN_MAX_BUFFER_BYTES, encoding: 'utf8' },
      (error, stdout, stderr) => {
        resolve(toResult(error, stdout, stderr));
      },
    );
    // O programa pode terminar antes de ler tudo: EPIPE aqui não é falha da lição.
    child.stdin?.on('error', () => undefined);
    child.stdin?.end(stdin);
  });
}

export async function runLessonProgram(code: string, stdin: string, options: RunLessonProgramOptions): Promise<RunLessonProgramResult> {
  const dir = await mkdtemp(join(options.baseDir ?? tmpdir(), LESSON_RUN_DIR_PREFIX));
  try {
    const file = join(dir, LESSON_RUN_FILE_NAME);
    await writeFile(file, code, 'utf8');
    return await execute(file, dir, stdin, options.timeoutMs ?? LESSON_RUN_TIMEOUT_MS);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
