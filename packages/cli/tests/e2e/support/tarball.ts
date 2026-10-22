import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { InstalledRun, InstalledRunOptions, PackedTarball } from './tarball.types.ts';

const execFileAsync = promisify(execFile);
const TARBALL_ENV = 'GS_TARBALL';
const LOAD_LOG_ENV = 'GS_LOAD_LOG';
const MAX_LISTING_BYTES = 16 * 1024 * 1024;

const HOOKS_SOURCE = `import { appendFileSync } from 'node:fs';
export async function load(url, context, nextLoad) {
  appendFileSync(process.env.${LOAD_LOG_ENV}, url + '\\n');
  return nextLoad(url, context);
}`;
const PRELOAD_SOURCE = `import { register } from 'node:module';
register('data:text/javascript;base64,${Buffer.from(HOOKS_SOURCE).toString('base64')}');`;

const workspaces: string[] = [];
const state: { tarball: Promise<PackedTarball> | undefined; extracted: Promise<string> | undefined } = { tarball: undefined, extracted: undefined };

const makeWorkspace = (prefix: string): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  workspaces.push(directory);
  return directory;
};

export function cleanupWorkspaces(): void {
  workspaces.splice(0).forEach((directory) => {
    fs.rmSync(directory, { recursive: true, force: true });
  });
  state.tarball = undefined;
  state.extracted = undefined;
}

async function packFresh(): Promise<PackedTarball> {
  const outDir = makeWorkspace('gs-pack-');
  const { packCli } = await import('../../../../../scripts/pack-cli.ts');
  return packCli({ outDir });
}

export function getTarball(): Promise<PackedTarball> {
  const provided = process.env[TARBALL_ENV];
  state.tarball ??= provided === undefined ? packFresh() : Promise.resolve({ tarball: path.resolve(provided), sha256: '' });
  return state.tarball;
}

export function fixture(files: Readonly<Record<string, string>>): string {
  const directory = makeWorkspace('gs-fixture-');
  Object.entries(files).forEach(([name, content]) => {
    fs.writeFileSync(path.join(directory, name), content);
  });
  return directory;
}

export async function listTarball(tarball: string): Promise<readonly string[]> {
  const { stdout } = await execFileAsync('tar', ['-tzf', tarball], { maxBuffer: MAX_LISTING_BYTES });
  return stdout.split(/\r?\n/u).filter((entry) => entry !== '').map((entry) => entry.replace(/\/$/u, ''));
}

export async function extractTarball(packed: PackedTarball): Promise<string> {
  state.extracted ??= (async () => {
    const directory = makeWorkspace('gs-extract-');
    await execFileAsync('tar', ['-xzf', packed.tarball, '-C', directory]);
    return path.join(directory, 'package');
  })();
  return state.extracted;
}

export async function readTarballJson(tarball: string, entry: string): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync('tar', ['-xzOf', tarball, entry], { maxBuffer: MAX_LISTING_BYTES });
  return JSON.parse(stdout) as Record<string, unknown>;
}

export const readText = (root: string, relative: string): string => fs.readFileSync(path.join(root, relative), 'utf8');

export function allDistText(root: string): string {
  const dist = path.join(root, 'dist');
  return fs
    .readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((name) => fs.statSync(path.join(dist, name)).isFile())
    .map((name) => fs.readFileSync(path.join(dist, name), 'utf8'))
    .join('\n');
}

export async function runInstalled(args: readonly string[], options: InstalledRunOptions = {}): Promise<InstalledRun> {
  const root = await extractTarball(await getTarball());
  const scratch = makeWorkspace('gs-run-');
  const preload = path.join(scratch, 'preload.mjs');
  const loadLog = path.join(scratch, 'loaded.log');
  fs.writeFileSync(preload, PRELOAD_SOURCE);
  fs.writeFileSync(loadLog, '');
  const child = spawn(process.execPath, ['--import', preload, path.join(root, 'dist/goiasscript.mjs'), ...args], {
    cwd: options.cwd ?? scratch,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...options.env, [LOAD_LOG_ENV]: loadLog },
  });
  const out: Buffer[] = [];
  const err: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => void out.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => void err.push(chunk));
  const exitCode = await new Promise<number | null>((resolve) => {
    child.on('close', resolve);
  });
  return {
    exitCode,
    stdout: Buffer.concat(out).toString('utf8'),
    stderr: Buffer.concat(err).toString('utf8'),
    loadedModules: fs.readFileSync(loadLog, 'utf8').split('\n').filter((line) => line !== ''),
  };
}
