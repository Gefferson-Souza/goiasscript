import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import { runCheckLessons } from '../../scripts/check-cartilha.ts';
import { fenced, lessonSource } from '../support/lesson-source.ts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function seed(source: string | null): string {
  const dir = mkdtempSync(join(tmpdir(), 'check-cartilha-'));
  roots.push(dir);
  mkdirSync(join(dir, 'stdin'));
  if (source !== null) writeFileSync(join(dir, 'licao-01.md'), source);
  return dir;
}

async function run(dir: string, args: readonly string[] = []): Promise<{ code: number; out: string; err: string }> {
  let out = '';
  let err = '';
  const code = await runCheckLessons({ dir, args }, { out: (t) => (out += t), err: (t) => (err += t) });
  return { code, out, err };
}

const FIXTURES = join(import.meta.dirname, '..', 'fixtures', 'cartilha');

describe('runCheckLessons', () => {
  it('aceita as lições válidas em disco e recusa as inválidas', async () => {
    const valid = await run(join(FIXTURES, 'valid'));
    expect(valid.err).toBe('');
    expect(valid.code).toBe(0);
    expect((await run(join(FIXTURES, 'invalid'))).code).toBe(1);
  });

  it('sai 0 com lição válida e conta as lições', async () => {
    const result = await run(seed(lessonSource()));
    expect(result.code).toBe(0);
    expect(result.out).toContain('1 lição');
  });

  it('sai 0 com pasta sem lições', async () => {
    expect((await run(seed(null))).code).toBe(0);
  });

  it('sai 1 e cita arquivo e linha quando a solução difere', async () => {
    const result = await run(seed(lessonSource({ solution: 'prosa("Tchau")' })));
    expect(result.code).toBe(1);
    expect(result.err).toMatch(/Ô sô, licao-01\.md:\d+/u);
  });

  it('sai 1 com bloco que não compila', async () => {
    const result = await run(seed(lessonSource({ blocks: [fenced('goiasscript exemplo', 'uai preço é 10,50')] })));
    expect(result.code).toBe(1);
    expect(result.err).toContain('GS0208');
  });

  it('--somente-compila não executa a solução errada', async () => {
    const result = await run(seed(lessonSource({ solution: 'prosa("Tchau")' })), ['--somente-compila']);
    expect(result.code).toBe(0);
  });

  it('o script de verdade sai 1 numa pasta inválida', async () => {
    const dir = seed(lessonSource({ id: null }));
    const script = join(import.meta.dirname, '..', '..', 'scripts', 'check-cartilha.ts');
    const failure = await promisify(execFile)(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', script, '--dir', dir]).then(
      () => null,
      (error: unknown) => error as { readonly code?: number; readonly stderr?: string },
    );
    expect(failure?.code).toBe(1);
    expect(failure?.stderr).toContain('Ô sô');
  });
});
