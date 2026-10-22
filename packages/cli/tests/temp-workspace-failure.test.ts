import { describe, expect, it } from 'vitest';
import { CliFileError } from '../src/cli-file-error.ts';
import { EXIT_CODE } from '../src/exit-codes.constants.ts';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

describe('bota_pra_moer: temporário indisponível', () => {
  it('pasta temporária sem permissão vira diagnóstico, sem pilha nem caminho do sistema', async () => {
    const base = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n' } });
    const io = {
      ...base,
      fs: { ...base.fs, makeTempDirectory: (prefix: string) => Promise.reject(new CliFileError('EACCES', prefix)) },
    };
    const host = createFakeProcessHost({ importModule: () => Promise.resolve({}) });
    const exit = await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host });
    expect(exit).toBe(EXIT_CODE.usage);
    expect(base.stderrText()).toContain('GS0903');
    expect(base.stderrText()).toContain('não consegui preparar o programa pra rodar');
    expect(base.stderrText()).not.toMatch(/EACCES|CliFileError|\/tmp/u);
  });
});
