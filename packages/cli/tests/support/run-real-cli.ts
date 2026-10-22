import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { RealRunOptions, RealRunResult, RunningCli } from './run-real-cli.types.ts';

const ENTRY = path.resolve(import.meta.dirname, './source-main.ts');
const ORPHAN_PREFIX = 'goiasscript-';
const cleanups: string[] = [];

const track = (directory: string): string => {
  cleanups.push(directory);
  return directory;
};

export function cleanupFixtures(): void {
  cleanups.splice(0).forEach((directory) => {
    fs.rmSync(directory, { recursive: true, force: true });
  });
}

export function fixture(files: Readonly<Record<string, string>>): string {
  const directory = track(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-fixture-')));
  Object.entries(files).forEach(([name, content]) => {
    fs.writeFileSync(path.join(directory, name), content);
  });
  return directory;
}

export function tmpWithOddName(): string {
  const parent = track(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-tmp-')));
  const odd = path.join(parent, 'pasta com espaço #1 100%');
  fs.mkdirSync(odd);
  return odd;
}

export function orphanWorkspaces(tmpDir: string): readonly string[] {
  return fs.readdirSync(tmpDir).filter((name) => name.startsWith(ORPHAN_PREFIX));
}

export function backdateWorkspaces(tmpDir: string, ageMs: number): void {
  const past = new Date(Date.now() - ageMs);
  orphanWorkspaces(tmpDir).forEach((name) => {
    fs.utimesSync(path.join(tmpDir, name), past, past);
  });
}

export function startCliProcess(args: readonly string[], options: RealRunOptions): RunningCli {
  const tmpDir = options.env?.['TMPDIR'] ?? track(fs.mkdtempSync(path.join(os.tmpdir(), 'gs-run-tmp-')));
  const child = spawn(process.execPath, [ENTRY, ...args], {
    cwd: options.cwd,
    shell: false,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, TMPDIR: tmpDir, TEMP: tmpDir, TMP: tmpDir, ...options.env },
  });
  const out: Buffer[] = [];
  const err: Buffer[] = [];
  child.stdout.on('data', (chunk: Buffer) => void out.push(chunk));
  child.stderr.on('data', (chunk: Buffer) => void err.push(chunk));
  const state = { exited: false };
  const closed = new Promise<RealRunResult>((resolve) => {
    child.on('close', (exitCode) => {
      state.exited = true;
      resolve({ exitCode, stdout: Buffer.concat(out).toString('utf8'), stderr: Buffer.concat(err).toString('utf8') });
    });
  });
  return {
    tmpDir,
    exited: () => state.exited,
    stderr: () => Buffer.concat(err).toString('utf8'),
    kill: () => void child.kill('SIGKILL'),
    closed,
  };
}

export const runCliProcess = (args: readonly string[], options: RealRunOptions): Promise<RealRunResult> => startCliProcess(args, options).closed;
