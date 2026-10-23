import { execFile, type ExecFileException } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCli } from './build-cli.ts';
import {
  CLI_BINARY_NAME,
  CLI_MANIFEST_PATH,
  CLI_MAX_BUFFER_BYTES,
  ENGOIANADOR_PATH,
  ENGOIANADOR_TIMEOUT_MS,
  ENGOIANADOR_URL_ENV,
  MESSAGES,
  VITEST_BIN_PATH,
  VITEST_MAX_BUFFER_BYTES,
  VITEST_TIMEOUT_MS,
  WORK_PREFIX,
} from './video-facts.constants.ts';
import { countTestsFromReport } from './video-facts-report.ts';
import type { CliRun, CliRunOptions, VideoFactsDeps, VideoFactsRuntime } from './video-facts.types.ts';

type Env = Readonly<Record<string, string | undefined>>;

const CLI_ENTRY = 'goiasscript.mjs';
const WORK_SUBDIR = 'work';
const BUILD_SUBDIR = 'cli';
const REPORT_FILE = 'vitest-report.json';
const TEXT_FIELD = 'text';

function execNode(args: readonly string[], options: { readonly cwd: string; readonly stdin?: string; readonly maxBuffer: number; readonly timeout?: number }): Promise<CliRun> {
  return new Promise((resolve) => {
    const child = execFile(
      process.execPath,
      [...args],
      { cwd: options.cwd, maxBuffer: options.maxBuffer, ...(options.timeout === undefined ? {} : { timeout: options.timeout }) },
      (error: ExecFileException | null, stdout: string, stderr: string) => {
        resolve({ command: '', stdout, stderr, exitCode: error === null ? 0 : typeof error.code === 'number' ? error.code : 1 });
      },
    );
    child.stdin?.end(options.stdin ?? '');
  });
}

function createCliRunner(workDir: string, builtCli: Promise<string>): VideoFactsDeps['runCli'] {
  return async (args, options: CliRunOptions = {}) => {
    const entry = await builtCli;
    const cwd = path.join(workDir, WORK_SUBDIR, options.cwd ?? '');
    fs.mkdirSync(cwd, { recursive: true });
    const run = await execNode([entry, ...args], { cwd, maxBuffer: CLI_MAX_BUFFER_BYTES, ...(options.stdin === undefined ? {} : { stdin: options.stdin }) });
    return { ...run, command: `${CLI_BINARY_NAME} ${args.join(' ')}` };
  };
}

async function countWithLocalVitest(root: string, workDir: string): Promise<number> {
  const report = path.join(workDir, REPORT_FILE);
  await execNode([path.join(root, VITEST_BIN_PATH), 'run', '--reporter=json', `--outputFile=${report}`], {
    cwd: root,
    maxBuffer: VITEST_MAX_BUFFER_BYTES,
    timeout: VITEST_TIMEOUT_MS,
  });
  return countTestsFromReport(fs.readFileSync(report, 'utf8'));
}

function createEngoianadorFetcher(baseUrl: string): (text: string) => Promise<string> {
  return async (text) => {
    const response = await fetch(new URL(ENGOIANADOR_PATH, baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [TEXT_FIELD]: text }),
      signal: AbortSignal.timeout(ENGOIANADOR_TIMEOUT_MS),
    });
    const body = (await response.json()) as Readonly<Record<string, unknown>>;
    const answer = body[TEXT_FIELD];
    if (!response.ok || typeof answer !== 'string' || answer === '') throw new Error(MESSAGES.engoianadorFailed);
    return answer;
  };
}

export function createRealVideoFactsRuntime(root: string, env: Env, testsFrom: () => string | null): VideoFactsRuntime {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), WORK_PREFIX));
  const builtCli = buildCli({ outDir: path.join(workDir, BUILD_SUBDIR) }).then(() => path.join(workDir, BUILD_SUBDIR, CLI_ENTRY));
  builtCli.catch(() => undefined);
  const baseUrl = env[ENGOIANADOR_URL_ENV];
  const deps: VideoFactsDeps = {
    readVersion: () => {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, CLI_MANIFEST_PATH), 'utf8')) as { readonly version: string };
      return Promise.resolve(manifest.version);
    },
    countTests: async () => {
      const reportPath = testsFrom();
      if (reportPath !== null) return { count: countTestsFromReport(fs.readFileSync(reportPath, 'utf8')), source: 'ci' };
      return { count: await countWithLocalVitest(root, workDir), source: 'local' };
    },
    runCli: createCliRunner(workDir, builtCli),
    fetchEngoianador: baseUrl === undefined || baseUrl === '' ? null : createEngoianadorFetcher(baseUrl),
    now: () => new Date(),
  };
  return {
    deps,
    dispose: () => {
      fs.rmSync(workDir, { recursive: true, force: true });
    },
  };
}
