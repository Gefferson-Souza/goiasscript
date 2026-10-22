import { describe, expect, it } from 'vitest';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';
import type { MemoryIoOptions } from './support/memory-io.types.ts';

const run = async (argv: readonly string[], options: MemoryIoOptions) => {
  const io = createMemoryIo(options);
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('vê_se_tá_certo', () => {
  it('programa certo: exit 0, mensagem com o arquivo e nada criado', async () => {
    const { io, code } = await run(['vê_se_tá_certo', 'ola.gs'], { files: { 'ola.gs': 'prosa("oi")\n' } });
    expect(code).toBe(0);
    expect(io.stdoutText()).toContain('Tá certo');
    expect(io.stdoutText()).toContain('ola.gs');
    expect(io.paths()).toEqual(['ola.gs']);
  });
  it('só aviso: exit 0 e aviso no stderr', async () => {
    const { io, code } = await run(['ve_se_ta_certo', 'a.gs'], { files: { 'a.gs': 'uai i é 1\ni mais 1\n' } });
    expect(code).toBe(0);
    expect(io.stderrText()).toContain('aviso GS0806');
  });
  it('--tom neutro troca a frase', async () => {
    const { io, code } = await run(['vê_se_tá_certo', 'a.gs', '--tom', 'neutro'], { files: { 'a.gs': 'prosa(nomi)\n' } });
    expect(code).toBe(1);
    expect(io.stderrText()).toContain('O nome "nomi" não foi declarado.');
  });
  it('--json com aviso dá ok: true', async () => {
    const { io, code } = await run(['vê_se_tá_certo', 'a.gs', '--json'], { files: { 'a.gs': 'uai i é 1\ni mais 1\n' } });
    expect(code).toBe(0);
    expect(io.stderrText()).toBe('');
    expect(JSON.parse(io.stdoutText())).toMatchObject({ version: 1, ok: true });
  });
  it('erro: exit 1', async () => {
    const { code } = await run(['vê_se_tá_certo', 'a.gs'], { files: { 'a.gs': 'prosa(nomi)\n' } });
    expect(code).toBe(1);
  });
  it('lê o programa do stdin', async () => {
    const { io, code } = await run(['vê_se_tá_certo', '-'], { stdin: 'prosa(1)\n' });
    expect(code).toBe(0);
    expect(io.stdoutText()).toContain('<entrada>');
  });
  it('arquivo sem .gs: exit 3', async () => {
    const { io, code } = await run(['vê_se_tá_certo', 'x.txt'], { files: { 'x.txt': 'prosa(1)' } });
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0902');
  });
});
