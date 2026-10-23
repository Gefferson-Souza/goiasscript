import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NTFS_FORBIDDEN_CHARACTERS, TEMP_DIR_PREFIX } from './integration.constants.ts';
import type { ChildCall, ChildProcessModule, ChildSpy } from './integration.types.ts';

type AnyFunction = (...params: readonly unknown[]) => unknown;

export function isValidOnThisPlatform(name: string, platform: NodeJS.Platform = process.platform): boolean {
  return platform !== 'win32' || !NTFS_FORBIDDEN_CHARACTERS.some((character) => name.includes(character));
}

const createdTempDirs: string[] = [];

export function makeTempDir(): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX)));
  createdTempDirs.push(dir);
  return dir;
}

export function removeTempDirs(): void {
  for (const dir of createdTempDirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
}

function stringsOf(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function optionsOf(params: readonly unknown[]): Readonly<Record<string, unknown>> {
  const candidate = params.find((param, index) => index >= 2 && typeof param === 'object' && param !== null && !Array.isArray(param));
  return (candidate ?? {}) as Readonly<Record<string, unknown>>;
}

function wrapCallback(params: readonly unknown[], onDone: () => void): readonly unknown[] {
  const last = params.length - 1;
  const callback = params[last];
  if (typeof callback !== 'function') return params;
  const wrapped = (...results: readonly unknown[]): unknown => {
    onDone();
    return (callback as AnyFunction)(...results);
  };
  return [...params.slice(0, last), wrapped];
}

function whenChildEnds(child: unknown, onDone: () => void): void {
  const emitter = child as { once?: (event: string, listener: () => void) => unknown } | undefined;
  if (typeof emitter?.once !== 'function') {
    onDone();
    return;
  }
  emitter.once('close', onDone);
  emitter.once('error', onDone);
}

// O espião repassa a chamada ao módulo real: o comando precisa rodar de verdade para o teste valer.
export function spyOnChildProcess(target: ChildProcessModule, calls: ChildCall[]): ChildSpy {
  const originalExecFile = target.execFile;
  const originalSpawn = target.spawn;
  const pending: Promise<void>[] = [];
  const track = (): (() => void) => {
    let finish: () => void = () => undefined;
    pending.push(new Promise<void>((resolve) => {
      finish = resolve;
    }));
    return finish;
  };
  const record = (api: ChildCall['api'], params: readonly unknown[]): void => {
    calls.push({ api, file: String(params[0]), args: stringsOf(params[1]), options: optionsOf(params) });
  };
  Object.assign(target, {
    execFile: (...params: readonly unknown[]) => {
      record('execFile', params);
      return originalExecFile(...wrapCallback(params, track()));
    },
    spawn: (...params: readonly unknown[]) => {
      record('spawn', params);
      const child = originalSpawn(...params);
      whenChildEnds(child, track());
      return child;
    },
  });
  return {
    restore: () => {
      Object.assign(target, { execFile: originalExecFile, spawn: originalSpawn });
    },
    settled: async () => {
      await Promise.all(pending);
    },
  };
}
