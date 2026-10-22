import { describe, expect, it, vi } from 'vitest';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

vi.mock('@goiasscript/optimizer', () => ({
  optimize: () => Promise.reject(new Error('falha interna do motor')),
}));

describe('traduz quando o otimizador falha', () => {
  it('grava a saída didática, avisa em goianês e não vaza a mensagem do motor', async () => {
    const io = createMemoryIo({ files: { 'a.gs': 'prosa(1)\n' } });
    const code = await runCli(['traduz', 'a.gs', '--otimiza'], io, { processHost: createFakeProcessHost() });
    expect(code).toBe(0);
    expect(io.fileText('a.mjs')).toContain('console.log(1)');
    expect(io.stderrText()).toContain('Não deu pra otimizar, sô; gravei a saída normal.');
    expect(io.stderrText()).not.toContain('falha interna');
  });
  it('em tom neutro o aviso também é em português', async () => {
    const io = createMemoryIo({ files: { 'a.gs': 'prosa(1)\n' } });
    await runCli(['traduz', 'a.gs', '--minifica', '--tom', 'neutro'], io, { processHost: createFakeProcessHost() });
    expect(io.stderrText()).toContain('Não foi possível otimizar');
  });
});
