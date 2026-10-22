import type { CliIo } from '../io.types.ts';
import { PROGRAM_FILE_NAME, STALE_WORKSPACE_MS, WORKSPACE_PREFIX } from './temp-workspace.constants.ts';
import type { TempWorkspace } from './temp-workspace.types.ts';

type WorkspaceIo = Pick<CliIo, 'fs' | 'env'>;

async function isStale(io: WorkspaceIo, path: string, nowMs: number): Promise<boolean> {
  try {
    return (await io.fs.modifiedAt(path)) < nowMs - STALE_WORKSPACE_MS;
  } catch {
    return false;
  }
}

async function removeQuietly(io: WorkspaceIo, path: string): Promise<void> {
  try {
    await io.fs.remove(path);
  } catch {
    return;
  }
}

async function listNames(io: WorkspaceIo): Promise<readonly string[]> {
  try {
    return await io.fs.listDirectory(io.env.tmpDir);
  } catch {
    return [];
  }
}

// Programa morto por sinal não passa pelo evento de saída; a varredura limpa o que ficou para trás.
export async function sweepStaleWorkspaces(io: WorkspaceIo, nowMs: number): Promise<void> {
  const { tmpDir, path } = io.env;
  const names = await listNames(io);
  const candidates = names.filter((name) => name.startsWith(WORKSPACE_PREFIX)).map((name) => path.join(tmpDir, name));
  for (const candidate of candidates) {
    if (await isStale(io, candidate, nowMs)) await removeQuietly(io, candidate);
  }
}

export async function createTempWorkspace(io: WorkspaceIo): Promise<TempWorkspace> {
  const { tmpDir, path } = io.env;
  const directory = await io.fs.makeTempDirectory(path.join(tmpDir, WORKSPACE_PREFIX));
  return {
    directory,
    programPath: path.join(directory, PROGRAM_FILE_NAME),
    dispose() {
      try {
        io.fs.removeSync(directory);
        return true;
      } catch {
        return false;
      }
    },
  };
}
