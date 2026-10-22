import nodePath from 'node:path';
import { CliFileError } from '../../src/cli-file-error.ts';
import type { CliFileSystem, PathKind } from '../../src/io.types.ts';
import type { MemoryEntry, MemoryIo, MemoryIoOptions } from './memory-io.types.ts';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEFAULT_NODE_VERSION = '24.0.0';

const toBytes = (content: string | Uint8Array): Uint8Array => (typeof content === 'string' ? encoder.encode(content) : content);
const normalize = (path: string): string => path.replaceAll('\\', '/').replace(/\/+$/u, '');

function createMemoryFileSystem(options: MemoryIoOptions): CliFileSystem & { paths(): readonly string[]; entry(path: string): MemoryEntry | undefined } {
  const keyOf = (path: string): string => (options.caseSensitive === false ? normalize(path).toLowerCase() : normalize(path));
  const files = new Map<string, MemoryEntry>();
  const directories = new Map<string, number>();
  let clock = 0;
  const tick = (): number => (clock += 1);
  const failing = new Set((options.failingWrites ?? []).map(keyOf));
  const put = (path: string, bytes: Uint8Array): void => {
    const previous = files.get(keyOf(path));
    files.set(keyOf(path), { displayPath: normalize(path), id: previous?.id ?? tick(), bytes, modifiedAt: tick() });
  };
  Object.entries(options.files ?? {}).forEach(([path, content]) => {
    put(path, toBytes(content));
  });
  const isDirectory = (path: string): boolean => {
    const key = keyOf(path);
    return directories.has(key) || [...files.keys()].some((file) => file.startsWith(`${key}/`));
  };
  const kindOf = (path: string): PathKind => {
    if (files.has(keyOf(path))) return 'file';
    return isDirectory(path) ? 'directory' : 'missing';
  };
  const mustFind = (path: string): MemoryEntry => {
    const found = files.get(keyOf(path));
    if (!found) throw new CliFileError(isDirectory(path) ? 'EISDIR' : 'ENOENT', path);
    return found;
  };
  return {
    paths: () => [...files.values()].map((entry) => entry.displayPath),
    entry: (path) => files.get(keyOf(path)),
    readBytes: (path) => Promise.resolve().then(() => mustFind(path).bytes),
    stat: (path) => Promise.resolve(kindOf(path)),
    identity: (path) => Promise.resolve(files.has(keyOf(path)) ? `mem:${String(mustFind(path).id)}` : null),
    writeText(path, content, mode) {
      if (failing.has(keyOf(path))) return Promise.reject(new CliFileError('OTHER', path));
      if (mode === 'create-new' && kindOf(path) !== 'missing') return Promise.reject(new CliFileError('EEXIST', path));
      put(path, encoder.encode(content));
      return Promise.resolve();
    },
    makeDirectory(path) {
      if (kindOf(path) !== 'missing') return Promise.reject(new CliFileError('EEXIST', path));
      directories.set(keyOf(path), tick());
      return Promise.resolve();
    },
    makeTempDirectory(prefix) {
      const path = `${prefix}${String(tick())}`;
      directories.set(keyOf(path), tick());
      return Promise.resolve(path);
    },
    listDirectory(path) {
      const key = `${keyOf(path)}/`;
      const names = [...files.values()].filter((entry) => keyOf(entry.displayPath).startsWith(key)).map((entry) => entry.displayPath.slice(key.length).split('/')[0] ?? '');
      return Promise.resolve([...new Set(names)]);
    },
    modifiedAt(path) {
      const entry = files.get(keyOf(path));
      return Promise.resolve(entry?.modifiedAt ?? directories.get(keyOf(path)) ?? 0);
    },
    remove(path) {
      this.removeSync(path);
      return Promise.resolve();
    },
    removeSync(path) {
      const key = keyOf(path);
      [...files.keys()].filter((file) => file === key || file.startsWith(`${key}/`)).forEach((file) => files.delete(file));
      directories.delete(key);
    },
  };
}

export function createMemoryIo(options: MemoryIoOptions = {}): MemoryIo {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const memoryFs = createMemoryFileSystem(options);
  const platform = options.platform ?? 'linux';
  const sinkInto = (target: string[]): MemoryIo['out'] => ({
    write: (text) => void target.push(text),
    writeSync: (text) => void target.push(text),
  });
  const stdinBytes = toBytes(options.stdin ?? '');
  return {
    out: sinkInto(stdout),
    err: sinkInto(stderr),
    stdin: { readAll: () => Promise.resolve(stdinBytes), isTty: false },
    streams: { input: process.stdin, output: process.stdout, isTty: false },
    fs: memoryFs,
    env: {
      cwd: options.cwd ?? '/work',
      tmpDir: '/tmp',
      platform,
      nodeVersion: options.nodeVersion ?? DEFAULT_NODE_VERSION,
      path: platform === 'win32' ? nodePath.win32 : nodePath.posix,
      variables: {},
    },
    stdoutText: () => stdout.join(''),
    stderrText: () => stderr.join(''),
    fileText: (path) => decoder.decode(memoryFs.entry(path)?.bytes),
    fileBytes: (path) => memoryFs.entry(path)?.bytes ?? new Uint8Array(),
    paths: () => memoryFs.paths(),
  };
}
