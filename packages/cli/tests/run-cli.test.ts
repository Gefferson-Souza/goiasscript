import { describe, expect, it } from 'vitest';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
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
    const { io, code } = await run(['bota_pra_moer', 'x.gs']);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).toContain('GS0905');
    expect(io.stderrText()).not.toContain('armado');
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

describe('runCli: robustez do uso incorreto', () => {
  const ESC = String.fromCharCode(27);
  const BEL = String.fromCharCode(7);
  it.each([
    [[`${ESC}]0;pwn${BEL}x`]],
    [['traduz', 'a.gs', `--${ESC}[2Jx`]],
    [['traduz', 'a.gs', '--tom', `${ESC}[2J`]],
  ])('não deixa bytes de controle chegarem ao stderr: %j', async (argv) => {
    const { io, code } = await run(argv);
    expect(code).toBe(EXIT_CODE.usage);
    expect(io.stderrText()).not.toContain(ESC);
    expect(io.stderrText()).not.toContain(BEL);
    expect(io.stderrText()).toContain('\\u001b');
  });
  it('o tom do erro segue a última ocorrência de --tom', async () => {
    expect((await run(['traduza', '--tom', 'raiz', '--tom', 'neutro'])).io.stderrText()).toContain('Comando ou opção desconhecidos');
    expect((await run(['traduza', '--tom', 'neutro', '--tom', 'raiz'])).io.stderrText()).toContain('Ô sô');
  });
  it('--tom depois de -- não muda o tom', async () => {
    expect((await run(['traduza', '--', '--tom', 'neutro'])).io.stderrText()).toContain('Ô sô');
  });
  it('--tom=neutro é reconhecido no erro de uso', async () => {
    expect((await run(['traduza', '--tom=neutro'])).io.stderrText()).toContain('Comando ou opção desconhecidos');
  });
  it('a recusa de "-" cita só a entrada padrão no bota_pra_moer', async () => {
    expect((await run(['explica', '-'])).io.stderrText()).not.toContain('respostas');
    expect((await run(['bota_pra_moer', '-'])).io.stderrText()).toContain('respostas');
  });
  it('o GS0905 raiz aponta para goiasscript sem argumentos', async () => {
    expect((await run(['traduza'])).io.stderrText()).not.toContain('dedo_de_prosa');
  });
});
