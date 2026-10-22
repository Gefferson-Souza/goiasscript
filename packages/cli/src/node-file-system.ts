import crypto from 'node:crypto';
import fs from 'node:fs';
import nodePath from 'node:path';
import { CliFileError } from './cli-file-error.ts';
import type { CliFileSystem, FileErrorCode, PathKind, WriteMode } from './io.types.ts';

const KNOWN_CODES: readonly FileErrorCode[] = ['EEXIST', 'ENOENT', 'EACCES', 'EISDIR', 'ENOTDIR'];

const toFileError = (error: unknown, path: string): CliFileError => {
  const raw = (error as NodeJS.ErrnoException | undefined)?.code;
  const code = KNOWN_CODES.find((known) => known === raw) ?? 'OTHER';
  return new CliFileError(code, path);
};

const guard = async <T>(path: string, action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    throw toFileError(error, path);
  }
};

const absentAs = async <T>(path: string, fallback: T, action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    const failure = toFileError(error, path);
    if (failure.code === 'ENOENT' || failure.code === 'ENOTDIR') return fallback;
    throw failure;
  }
};

const kindOf = (stats: fs.Stats): PathKind => {
  if (stats.isFile()) return 'file';
  if (stats.isDirectory()) return 'directory';
  return 'other';
};

// Temporário no mesmo diretório garante rename atômico; o rename troca o link em vez de seguir até o alvo.
async function replaceAtomically(path: string, content: string): Promise<void> {
  const temporary = nodePath.join(nodePath.dirname(path), `.${nodePath.basename(path)}.${crypto.randomUUID()}.tmp`);
  try {
    await fs.promises.writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await fs.promises.rename(temporary, path);
  } catch (error) {
    await fs.promises.rm(temporary, { force: true });
    throw error;
  }
}

const writeContent = (path: string, content: string, mode: WriteMode): Promise<void> =>
  mode === 'replace' ? replaceAtomically(path, content) : fs.promises.writeFile(path, content, { encoding: 'utf8', flag: 'wx' });

export function createNodeFileSystem(): CliFileSystem {
  return {
    readBytes: (path) => guard(path, () => fs.promises.readFile(path)),
    stat: (path) => absentAs<PathKind>(path, 'missing', async () => kindOf(await fs.promises.stat(path))),
    identity: (path) =>
      absentAs<string | null>(path, null, async () => {
        const stats = await fs.promises.stat(path, { bigint: true });
        return `${String(stats.dev)}:${String(stats.ino)}`;
      }),
    writeText: (path, content, mode) => guard(path, () => writeContent(path, content, mode)),
    makeDirectory: (path) => guard(path, () => fs.promises.mkdir(path)),
    makeTempDirectory: (prefix) => guard(prefix, () => fs.promises.mkdtemp(prefix)),
    listDirectory: (path) => guard(path, () => fs.promises.readdir(path)),
    modifiedAt: (path) => guard(path, async () => (await fs.promises.stat(path)).mtimeMs),
    remove: (path) => guard(path, () => fs.promises.rm(path, { recursive: true, force: true })),
    removeSync(path) {
      fs.rmSync(path, { recursive: true, force: true });
    },
  };
}
