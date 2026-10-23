import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
  EXEC_MAX_BUFFER_BYTES,
  INFO_COMMAND,
  LICENSE_FILE,
  NODE_MODULES_DIR,
  NOT_VERSION_CHAR,
  NPM_COMMAND,
  PACKAGE_NAME,
  PREFIX_BIN_DIR,
  PREFIX_LIB_DIR,
  SMOKE_DISTS,
  SUCCESS_MESSAGE,
  TMP_DIR_PREFIX,
} from './smoke-release.constants.ts';
import type { ExecPort, ExecResult, ReleaseSmokeOptions, SmokeDist, SmokeResult, SmokeStep } from './smoke-release.types.ts';

class SmokeStepError extends Error {
  readonly step: SmokeStep;

  constructor(step: SmokeStep, message: string) {
    super(message);
    this.step = step;
  }
}

const execFileAsync = promisify(execFile);

const fail = (step: SmokeStep, message: string): SmokeResult => ({ ok: false, step, message });
const detail = (result: ExecResult): string => (result.stderr.trim() || result.stdout.trim() || 'sem saída');

function containsVersion(output: string, version: string): boolean {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`(^|${NOT_VERSION_CHAR})${escaped}($|${NOT_VERSION_CHAR})`, 'u').test(output);
}

interface SmokeContext {
  readonly options: ReleaseSmokeOptions;
  readonly bin: string;
  readonly version: string;
}

type StepRunner = (context: SmokeContext) => Promise<SmokeResult | null>;

async function readRegistryVersion(options: ReleaseSmokeOptions): Promise<string> {
  const spec = `${PACKAGE_NAME}@${options.dist}`;
  const view = await options.exec.run(NPM_COMMAND, ['view', spec, 'version']);
  const version = view.stdout.trim();
  if (view.exitCode === 0 && version !== '') return version;
  throw new SmokeStepError('registry', `Eita! O registro não respondeu a versão de ${spec}: ${detail(view)}`);
}

const stepInstall: StepRunner = async ({ options }) => {
  const install = await options.exec.run(NPM_COMMAND, ['install', '-g', `${PACKAGE_NAME}@${options.dist}`, '--prefix', options.tmpDir]);
  return install.exitCode === 0 ? null : fail('install', `Ô sô! A instalação global falhou: ${detail(install)}`);
};

const stepVersion: StepRunner = async ({ options, bin, version }) => {
  const reported = await options.exec.run(bin, [INFO_COMMAND]);
  if (reported.exitCode === 0 && containsVersion(reported.stdout, version)) return null;
  return fail('version', `Eita! O ${INFO_COMMAND} do binário instalado não diz ${version}: ${detail(reported)}`);
};

const stepLicense: StepRunner = async ({ options }) => {
  const license = path.join(options.tmpDir, PREFIX_LIB_DIR, NODE_MODULES_DIR, PACKAGE_NAME, LICENSE_FILE);
  return (await options.exec.exists(license)) ? null : fail('license', `Ô rapaz! O pacote instalado veio sem ${LICENSE_FILE}.`);
};

// Só Linux: no Windows o npm é um .cmd (execFile sem shell não roda) e o prefixo muda de layout.
const STEPS: ReadonlyArray<readonly [SmokeStep, StepRunner]> = [
  ['install', stepInstall],
  ['version', stepVersion],
  ['license', stepLicense],
];

async function guarded<T>(step: SmokeStep, task: () => Promise<T>): Promise<T | SmokeResult> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof SmokeStepError) return fail(error.step, error.message);
    return fail(step, `Ô rapaz! Estourou no passo "${step}": ${error instanceof Error ? error.message : String(error)}`);
  }
}

const isFailure = (value: unknown): value is Extract<SmokeResult, { ok: false }> =>
  typeof value === 'object' && value !== null && 'ok' in value && value.ok === false;

export async function runReleaseSmoke(options: ReleaseSmokeOptions): Promise<SmokeResult> {
  const version = await guarded('registry', () => readRegistryVersion(options));
  if (typeof version !== 'string') return version;
  const context: SmokeContext = { options, bin: path.join(options.tmpDir, PREFIX_BIN_DIR, PACKAGE_NAME), version };
  for (const [step, runner] of STEPS) {
    const failure = await guarded(step, () => runner(context));
    if (isFailure(failure)) return failure;
  }
  return { ok: true, version };
}

export const realExecPort: ExecPort = {
  async run(command, args) {
    try {
      const { stdout, stderr } = await execFileAsync(command, [...args], { maxBuffer: EXEC_MAX_BUFFER_BYTES });
      return { exitCode: 0, stdout, stderr };
    } catch (error) {
      const failure = error as { readonly code?: unknown; readonly stdout?: unknown; readonly stderr?: unknown; readonly message: string };
      return {
        exitCode: typeof failure.code === 'number' ? failure.code : 1,
        stdout: typeof failure.stdout === 'string' ? failure.stdout : '',
        stderr: typeof failure.stderr === 'string' && failure.stderr !== '' ? failure.stderr : failure.message,
      };
    }
  },
  exists: (file) => fs.promises.access(file).then(() => true, () => false),
};

export function parseDist(value: string | undefined): SmokeDist {
  const dist = SMOKE_DISTS.find((candidate) => candidate === value);
  if (dist === undefined) throw new Error(`Ô sô! A dist-tag tem que ser ${SMOKE_DISTS.join(' ou ')}.`);
  return dist;
}

export async function main(argv: readonly string[], exec: ExecPort = realExecPort): Promise<number> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), TMP_DIR_PREFIX));
  try {
    const result = await runReleaseSmoke({ dist: parseDist(argv[2]), exec, tmpDir });
    if (result.ok) {
      process.stdout.write(`${SUCCESS_MESSAGE} (${result.version})\n`);
      return 0;
    }
    process.stderr.write(`Passo ${result.step}: ${result.message}\n`);
    return 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv));
}
