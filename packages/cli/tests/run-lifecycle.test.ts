import { describe, expect, it } from 'vitest';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const neverSettles = (): Promise<unknown> => new Promise(() => undefined);
const workspaces = (io: ReturnType<typeof createMemoryIo>): readonly string[] => io.paths().filter((path) => path.includes('goiasscript-'));

describe('bota_pra_moer: ciclo de vida do programa', () => {
  it('programa que termina: exit 0, sem GS0703, temporário removido', async () => {
    const host = createFakeProcessHost({ importModule: () => Promise.resolve({}) });
    const io = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host });
    await Promise.resolve();
    host.fireExit();
    expect(host.exitCode ?? 0).toBe(0);
    expect(io.stderrText()).not.toContain('GS0703');
    expect(workspaces(io)).toEqual([]);
  });

  it('grava o programa em um temporário próprio antes de importar', async () => {
    const imported: string[] = [];
    const host = createFakeProcessHost({
      importModule: (fileUrl) => {
        imported.push(fileUrl);
        return Promise.resolve({});
      },
    });
    const io = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host });
    expect(imported).toHaveLength(1);
    expect(imported[0]).toMatch(/^file:\/\/\/tmp\/goiasscript-[^/]+\/program\.mjs$/u);
    expect(workspaces(io)).toHaveLength(1);
  });

  it('promessa pendente: o exit síncrono imprime GS0703 e define exit 2', async () => {
    const host = createFakeProcessHost({ importModule: neverSettles });
    const io = createMemoryIo({ files: { 'p.gs': 'espera_um_cadim faz_um Promessa((resolve_aí) => { })\n' } });
    await runCli(['bota_pra_moer', 'p.gs'], io, { processHost: host });
    host.fireExit();
    expect(host.exitCode).toBe(2);
    expect(io.stderrSyncText()).toContain('O programa ficou esperando uma resposta que nunca veio, sô.');
    expect(io.stderrText()).not.toMatch(/Warning|unsettled/u);
    expect(workspaces(io)).toEqual([]);
  });

  it('promessa pendente em tom neutro usa a frase neutra', async () => {
    const host = createFakeProcessHost({ importModule: neverSettles });
    const io = createMemoryIo({ files: { 'p.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'p.gs', '--tom', 'neutro'], io, { processHost: host });
    host.fireExit();
    expect(io.stderrSyncText()).toContain('aguardando indefinidamente');
  });

  it('GS0702 vindo do ajudante: traduzido, exit 2, sem stack do motor', async () => {
    const host = createFakeProcessHost({ importModule: neverSettles });
    const io = createMemoryIo({ files: { 'q.gs': 'prosa(pergunta("a"))\n' } });
    await runCli(['bota_pra_moer', 'q.gs'], io, { processHost: host });
    host.fireUnhandledRejection(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }));
    expect(host.terminated).toBe(2);
    expect(io.stderrText()).toContain('Acabou a entrada, sô');
    expect(io.stderrText()).not.toMatch(/\bat \S+ \(/u);
    host.fireExit();
    expect(io.stderrText()).not.toContain('GS0703');
  });

  it('exceção não capturada é traduzida e encerra com 2, uma vez só', async () => {
    const host = createFakeProcessHost({ importModule: neverSettles });
    const io = createMemoryIo({ files: { 'e.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host });
    host.fireUncaughtException(new TypeError('Cannot read properties of null'));
    host.fireUnhandledRejection(new TypeError('Cannot read properties of null'));
    expect(host.terminated).toBe(2);
    expect(io.stderrText()).toContain('GS0710');
    expect(io.stderrText()).not.toContain('Cannot read');
    expect(io.stderrText().match(/GS0710/gu)).toHaveLength(1);
  });

  it('falha ao gravar o programa remove o temporário e sai com 3 sem importar', async () => {
    const imported: string[] = [];
    const host = createFakeProcessHost({ importModule: (fileUrl) => (imported.push(fileUrl), Promise.resolve({})) });
    const memory = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n' } });
    const io = { ...memory, fs: { ...memory.fs, writeText: (path: string, content: string, mode: 'create-new' | 'replace') => (path.endsWith('program.mjs') ? Promise.reject(new Error('disco cheio')) : memory.fs.writeText(path, content, mode)) } };
    expect(await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host })).toBe(3);
    expect(imported).toEqual([]);
    expect(workspaces(memory)).toEqual([]);
    expect(memory.stderrText()).toContain('GS0903');
    expect(memory.stderrText()).not.toContain('disco cheio');
  });

  it('mensagem de erro do próprio programa aparece junto do GS0714', async () => {
    const host = createFakeProcessHost({ importModule: neverSettles });
    const io = createMemoryIo({ files: { 'e.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host });
    host.fireUncaughtException(new Error('Deu ruim, sô!'));
    expect(io.stderrText()).toContain('GS0714');
    expect(io.stderrText()).toContain('o programa disse: Deu ruim, sô!');
  });

  it('mensagem do motor e de erro do Node nunca aparece', async () => {
    const io = createMemoryIo({ files: { 'e.gs': 'prosa(1)\n' } });
    const host = createFakeProcessHost({ importModule: neverSettles });
    await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host });
    host.fireUncaughtException(Object.assign(new Error('Cannot find module x'), { code: 'ERR_MODULE_NOT_FOUND' }));
    expect(io.stderrText()).not.toContain('Cannot find');
    expect(io.stderrText()).not.toContain('o programa disse');
  });

  it('erro na importação do módulo é traduzido e encerra com 2', async () => {
    const host = createFakeProcessHost({ importModule: () => Promise.reject(new ReferenceError('x is not defined')) });
    const io = createMemoryIo({ files: { 'e.gs': 'prosa(1)\n' } });
    await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host });
    await new Promise((resolve) => void setImmediate(resolve));
    expect(host.terminated).toBe(2);
    expect(io.stderrText()).toContain('GS0711');
  });

  it('erro de compilação não importa nada e sai com 1', async () => {
    const host = createFakeProcessHost({
      importModule: () => Promise.reject(new Error('não devia importar')),
    });
    const io = createMemoryIo({ files: { 'e.gs': 'prosa(nomi)\n' } });
    expect(await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host })).toBe(1);
    expect(io.paths().filter((path) => path.endsWith('program.mjs'))).toEqual([]);
  });

  it('varre o temporário órfão antigo antes de criar o novo', async () => {
    const host = createFakeProcessHost({ importModule: () => Promise.resolve({}) });
    const io = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n', '/tmp/goiasscript-velho/program.mjs': 'x' }, directories: { '/tmp/goiasscript-velho': 0 } });
    await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host });
    expect(io.paths()).not.toContain('/tmp/goiasscript-velho/program.mjs');
  });

  it('nome sem .gs é recusado com exit 3 e sem importar', async () => {
    const host = createFakeProcessHost();
    const io = createMemoryIo({ files: { 'x.txt': 'prosa(1)\n' } });
    expect(await runCli(['bota_pra_moer', 'x.txt'], io, { processHost: host })).toBe(3);
    expect(io.stderrText()).toContain('GS0902');
  });
});
