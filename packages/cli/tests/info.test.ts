import { describe, expect, it } from 'vitest';
import manifest from '../package.json' with { type: 'json' };
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const run = async (argv: readonly string[]) => {
  const io = createMemoryIo({ nodeVersion: '22.12.0' });
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('dedo_de_prosa', () => {
  it('mostra nome, versão do pacote, Node, sistema e os seis comandos', async () => {
    const { io, code } = await run(['dedo_de_prosa']);
    const text = io.stdoutText();
    expect(code).toBe(EXIT_CODE.ok);
    expect(text).toContain('GoiásScript');
    expect(text).toContain(manifest.version);
    expect(text).toContain('Node v22.12.0');
    expect(text).toContain('linux');
    for (const name of ['traduz', 'bota_pra_moer', 'vê_se_tá_certo', 'arma_o_barraco', 'explica', 'dedo_de_prosa']) {
      expect(text).toContain(name);
    }
    expect(io.stderrText()).toBe('');
  });
  it('não duplica o v quando a versão já vem prefixada', async () => {
    const io = createMemoryIo({ nodeVersion: 'v24.1.0' });
    await runCli(['dedo_de_prosa'], io, { processHost: createFakeProcessHost() });
    expect(io.stdoutText()).toContain('Node v24.1.0');
    expect(io.stdoutText()).not.toContain('vv24');
  });
  it('respeita o tom neutro', async () => {
    const { io, code } = await run(['dedo_de_prosa', '--tom', 'neutro']);
    expect(code).toBe(EXIT_CODE.ok);
    expect(io.stdoutText()).toContain('compila e executa o programa');
  });
});
