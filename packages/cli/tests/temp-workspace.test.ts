import { describe, expect, it } from 'vitest';
import { STALE_WORKSPACE_MS } from '../src/run/temp-workspace.constants.ts';
import { createTempWorkspace, sweepStaleWorkspaces } from '../src/run/temp-workspace.ts';
import { createMemoryIo } from './support/memory-io.ts';

const NOW = STALE_WORKSPACE_MS * 3;

describe('sweepStaleWorkspaces', () => {
  it('remove só goiasscript-* com mais de 24 h e preserva o resto', async () => {
    const io = createMemoryIo({
      files: {
        '/tmp/goiasscript-velho/program.mjs': 'a',
        '/tmp/goiasscript-novo/program.mjs': 'b',
        '/tmp/outra-pasta/program.mjs': 'c',
      },
      directories: { '/tmp/goiasscript-velho': NOW - STALE_WORKSPACE_MS - 1, '/tmp/goiasscript-novo': NOW - 1000, '/tmp/outra-pasta': 0 },
    });
    await sweepStaleWorkspaces(io, NOW);
    expect([...io.paths()].sort()).toEqual(['/tmp/goiasscript-novo/program.mjs', '/tmp/outra-pasta/program.mjs']);
  });

  it('preserva symlink, arquivo solto e pasta de outro dono mesmo velhos', async () => {
    const io = createMemoryIo({
      files: { '/tmp/goiasscript-link/x': 'a', '/tmp/goiasscript-solto': 'b', '/tmp/goiasscript-alheio/x': 'c' },
      directories: { '/tmp/goiasscript-link': 0, '/tmp/goiasscript-alheio': 0 },
      symlinks: ['/tmp/goiasscript-link'],
      foreignOwned: ['/tmp/goiasscript-alheio'],
    });
    await sweepStaleWorkspaces(io, NOW);
    expect([...io.paths()].sort()).toEqual(['/tmp/goiasscript-alheio/x', '/tmp/goiasscript-link/x', '/tmp/goiasscript-solto']);
  });

  it('não lança quando a pasta temporária não pode ser listada', async () => {
    const io = createMemoryIo();
    const broken = { ...io, fs: { ...io.fs, listDirectory: () => Promise.reject(new Error('negado')) } };
    await expect(sweepStaleWorkspaces(broken, NOW)).resolves.toBeUndefined();
  });

  it('segue varrendo quando uma remoção falha', async () => {
    const io = createMemoryIo({
      files: { '/tmp/goiasscript-a/program.mjs': 'a', '/tmp/goiasscript-b/program.mjs': 'b' },
      directories: { '/tmp/goiasscript-a': 0, '/tmp/goiasscript-b': 0 },
    });
    const flaky = { ...io, fs: { ...io.fs, remove: (path: string) => (path.endsWith('goiasscript-a') ? Promise.reject(new Error('negado')) : io.fs.remove(path)) } };
    await sweepStaleWorkspaces(flaky, NOW);
    expect(io.paths()).toEqual(['/tmp/goiasscript-a/program.mjs']);
  });
});

describe('createTempWorkspace', () => {
  it('cria goiasscript-XXXX dentro do diretório temporário do ambiente', async () => {
    const io = createMemoryIo();
    const workspace = await createTempWorkspace(io);
    expect(workspace.directory).toMatch(/^\/tmp\/goiasscript-/u);
    expect(workspace.programPath).toBe(`${workspace.directory}/program.mjs`);
  });

  it('dispose é idempotente e remove o conteúdo', async () => {
    const io = createMemoryIo();
    const workspace = await createTempWorkspace(io);
    await io.fs.writeText(workspace.programPath, 'x', 'create-new');
    expect(workspace.dispose()).toBe(true);
    expect(workspace.dispose()).toBe(true);
    expect(io.paths()).toEqual([]);
  });

  it('dispose devolve false, sem lançar, se a remoção falhar', async () => {
    const io = createMemoryIo();
    const broken = {
      ...io,
      fs: {
        ...io.fs,
        removeSync: () => {
          throw new Error('negado');
        },
      },
    };
    const workspace = await createTempWorkspace(broken);
    expect(workspace.dispose()).toBe(false);
  });
});
