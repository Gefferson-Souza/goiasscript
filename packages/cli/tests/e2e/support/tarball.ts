import { execFile, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import type { InstalledProcess, InstalledRun, InstalledRunOptions, PackedTarball, ShimArgument, ShimName } from './tarball.types.ts';

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
const state: { tarball: Promise<PackedTarball> | undefined; extracted: Promise<string> | undefined; installed: Promise<string> | undefined } = {
  tarball: undefined,
  extracted: undefined,
  installed: undefined,
};

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
  state.installed = undefined;
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
    const target = path.join(directory, name);
    const relative = path.relative(directory, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`nome de fixture fora do diretório: ${name}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
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

const PACKAGE_NAME = 'goiasscript';
const BIN_RELATIVE = ['node_modules', PACKAGE_NAME, 'dist', 'goiasscript.mjs'] as const;
const NPM_CLI_SEGMENTS = ['node_modules', 'npm', 'bin', 'npm-cli.js'] as const;

const NPM_CLI_FILE = 'npm-cli.js';

// Sob "pnpm run" o npm_execpath aponta para o pnpm; só vale se for o npm-cli.js.
function npmCliCandidates(): readonly string[] {
  const nodeDir = path.dirname(process.execPath);
  const execPath = process.env['npm_execpath'];
  const fromEnv = execPath !== undefined && path.basename(execPath) === NPM_CLI_FILE ? [execPath] : [];
  const besideNode = [path.join(nodeDir, ...NPM_CLI_SEGMENTS), path.join(nodeDir, '..', 'lib', ...NPM_CLI_SEGMENTS)];
  const onPath = (process.env['PATH'] ?? '')
    .split(path.delimiter)
    .filter((entry) => entry !== '')
    .flatMap((entry) => [path.join(entry, ...NPM_CLI_SEGMENTS), path.join(entry, '..', 'lib', ...NPM_CLI_SEGMENTS)]);
  return [...fromEnv, ...besideNode, ...onPath];
}

function npmCliPath(): string {
  const found = npmCliCandidates().find((candidate) => fs.existsSync(candidate));
  if (found === undefined) throw new Error('npm-cli.js não encontrado (npm_execpath, ao lado do Node ou no PATH)');
  return found;
}

async function installFresh(): Promise<string> {
  const { tarball } = await getTarball();
  const directory = makeWorkspace('gs-install-');
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  await execFileAsync(process.execPath, [npmCliPath(), 'install', tarball, '--no-audit', '--no-fund'], { cwd: directory });
  return directory;
}

export function getInstallDir(): Promise<string> {
  state.installed ??= installFresh();
  return state.installed;
}

export function sha256(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

export function snapshotTree(directory: string): ReadonlyMap<string, string> {
  const entries = fs
    .readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .map((name) => name.split(path.sep).join('/'))
    .sort()
    .map((name): readonly [string, string] => [name, fs.statSync(path.join(directory, name)).isFile() ? sha256(path.join(directory, name)) : 'directory']);
  return new Map(entries);
}

function collect(child: ReturnType<typeof spawn>, loadLog: string): Promise<InstalledRun> {
  const out: Buffer[] = [];
  const err: Buffer[] = [];
  child.stdout?.on('data', (chunk: Buffer) => void out.push(chunk));
  child.stderr?.on('data', (chunk: Buffer) => void err.push(chunk));
  return new Promise((resolve) => {
    child.on('close', (exitCode) => {
      resolve({
        exitCode,
        stdout: Buffer.concat(out).toString('utf8'),
        stderr: Buffer.concat(err).toString('utf8'),
        loadedModules: fs.existsSync(loadLog) ? fs.readFileSync(loadLog, 'utf8').split('\n').filter((line) => line !== '') : [],
      });
    });
  });
}

export async function startInstalled(args: readonly string[], options: InstalledRunOptions = {}): Promise<InstalledProcess> {
  const installDir = await getInstallDir();
  const scratch = makeWorkspace('gs-run-');
  const preload = path.join(scratch, 'preload.mjs');
  const loadLog = path.join(scratch, 'loaded.log');
  fs.writeFileSync(preload, PRELOAD_SOURCE);
  fs.writeFileSync(loadLog, '');
  const preloadArgs = options.trackModules === true ? ['--import', preload] : [];
  const child = spawn(process.execPath, [...preloadArgs, path.join(installDir, ...BIN_RELATIVE), ...args], {
    cwd: options.cwd ?? scratch,
    shell: false,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...options.env, [LOAD_LOG_ENV]: loadLog },
  });
  child.stdin.on('error', () => undefined);
  return { stdin: child.stdin, result: collect(child, loadLog) };
}

export async function runInstalled(args: readonly string[], options: InstalledRunOptions = {}): Promise<InstalledRun> {
  const running = await startInstalled(args, options);
  running.stdin.end(options.input ?? '');
  return running.result;
}

// Os argumentos são um conjunto literal fixo: no Windows o cmd.exe interpreta metacaracteres.
export async function runShim(shim: ShimName, args: readonly ShimArgument[], options: InstalledRunOptions = {}): Promise<InstalledRun> {
  const installDir = await getInstallDir();
  const bin = path.join(installDir, 'node_modules', '.bin');
  const windows = process.platform === 'win32';
  const command = windows ? (process.env['ComSpec'] ?? 'cmd.exe') : path.join(bin, shim);
  const commandArgs = windows ? ['/d', '/c', path.join(bin, `${shim}.cmd`), ...args] : [...args];
  const child = spawn(command, commandArgs, { cwd: options.cwd ?? installDir, shell: false, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, ...options.env } });
  child.stdin.end(options.input ?? '');
  return collect(child, '');
}
