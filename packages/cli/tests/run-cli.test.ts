import { describe, expect, it } from 'vitest';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runRepl } from '../src/repl/run-repl.ts';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';
import type { MemoryIoOptions } from './support/memory-io.types.ts';

const run = async (argv: readonly string[], options: MemoryIoOptions = {}) => {
  const io = createMemoryIo(options);
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('runCli', () => {
  it('sem argumentos mostra a ajuda e sai com 0', async () => {
    const { io, code } = await run([]);
    expect(code).toBe(0);
    expect(io.stdoutText()).toContain('dedo_de_prosa');
    expect(io.stderrText()).toBe('');
  });
  it('comando desconhecido é GS0905 com sugestão e exit 3', async () => {
    const { io, code } = await run(['traduza', 'x.gs']);
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0905');
    expect(io.stderrText()).toContain('Cê quis dizer "traduz"?');
    expect(io.stdoutText()).toBe('');
  });
  it('a sugestão sai em tom neutro quando pedido', async () => {
    const { io } = await run(['traduza', 'x.gs', '--tom', 'neutro']);
    expect(io.stderrText()).toContain('Você quis dizer "traduz"?');
  });
  it.each(['--help', '-h', '--version'])('%s é GS0905 com dica em goianês', async (flag) => {
    const { io, code } = await run([flag]);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('GS0905');
    expect(io.stderrText()).toContain(`"${flag}" não existe`);
    expect(io.stderrText()).not.toContain('Cê quis dizer');
  });
  it('opção inválida num comando é GS0905 e não executa nada', async () => {
    const { io, code } = await run(['traduz', 'x.gs', '--otimiza', '--minifica']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('GS0905');
  });
  it('despacha o comando acertado, inclusive sem acento', async () => {
    const { io, code } = await run(['ve_se_ta_certo', 'x.gs']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('armado');
    expect(io.stderrText()).not.toContain('GS0905');
  });
  it('avisa GS0904 em Node abaixo do mínimo e segue', async () => {
    const { io } = await run([], { nodeVersion: '20.11.0' });
    expect(io.stderrText()).toContain('GS0904');
    expect(io.stderrText()).toContain('22.12');
    expect(io.stdoutText()).toContain('dedo_de_prosa');
    expect((await run([], { nodeVersion: '22.12.0' })).io.stderrText()).not.toContain('GS0904');
    expect((await run([], { nodeVersion: '22.11.9' })).io.stderrText()).toContain('GS0904');
    expect((await run([], { nodeVersion: '24.0.0' })).io.stderrText()).not.toContain('GS0904');
  });
});

describe('runRepl', () => {
  it('devolve uso incorreto até a roda de prosa existir', async () => {
    const io = createMemoryIo();
    expect(await runRepl(io)).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('roda de prosa');
  });
});
