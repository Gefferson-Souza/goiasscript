import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { CliFileError } from '../src/cli-file-error.ts';
import { runCli } from '../src/run-cli.ts';
import { extractNextSteps } from '../src/scaffold/next-steps.ts';
import { validateProjectName } from '../src/scaffold/project-name.ts';
import { TEMPLATE_FILES } from '../src/scaffold/template.constants.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const deps = { processHost: createFakeProcessHost() };

describe('arma_o_barraco', () => {
  it('cria o projeto e imprime os próximos passos', async () => {
    const io = createMemoryIo();
    expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(0);
    expect([...io.paths()].sort()).toEqual(['meu-projeto/.gitignore', 'meu-projeto/README.md', 'meu-projeto/main.gs']);
    expect(extractNextSteps(io.stdoutText())).toEqual(['cd meu-projeto', 'goiasscript bota_pra_moer main.gs']);
  });
  it('o main.gs do template compila sem nenhum diagnóstico', () => {
    const result = compile(TEMPLATE_FILES['main.gs'], { fileName: 'main.gs' });
    expect(result).toMatchObject({ ok: true, diagnostics: [] });
  });
  it.each(['../fora', '/abs', 'a/b', 'a\\b', '.oculto', '-x', 'a b', '', 'a'.repeat(65), 'café\u0000'])(
    'recusa o nome %j sem criar nada',
    async (name) => {
      const io = createMemoryIo();
      expect(await runCli(['arma_o_barraco', name], io, deps)).toBe(3);
      expect(io.stderrText()).toContain('GS0905');
      expect(io.paths()).toEqual([]);
    },
  );
  it('no Windows recusa nome reservado', async () => {
    for (const name of ['con', 'NUL.txt', 'com1']) {
      const io = createMemoryIo({ platform: 'win32' });
      expect(await runCli(['arma_o_barraco', name], io, deps)).toBe(3);
      expect(io.paths()).toEqual([]);
    }
  });
  it('recusa nome reservado também fora do Windows', () => {
    expect(validateProjectName('aux', 'linux').ok).toBe(false);
    expect(validateProjectName('projeto', 'linux').ok).toBe(true);
  });
  it('no Windows recusa nome que termina em ponto', () => {
    expect(validateProjectName('projeto.', 'win32').ok).toBe(false);
    expect(validateProjectName('projeto.', 'linux').ok).toBe(true);
  });
  it('aceita o limite de 64 caracteres e nomes com acento', () => {
    expect(validateProjectName('a'.repeat(64), 'linux').ok).toBe(true);
    expect(validateProjectName('açaí_1.0-x', 'linux').ok).toBe(true);
  });
  it('pasta existente: GS0903, exit 3 e nada alterado', async () => {
    const io = createMemoryIo({ files: { 'meu-projeto/main.gs': 'meu' } });
    expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(3);
    expect(io.stderrText()).toContain('GS0903');
    expect(io.fileText('meu-projeto/main.gs')).toBe('meu');
  });
  it('falha no meio remove só o que criou', async () => {
    const io = createMemoryIo({ files: { 'outro.txt': 'fica' }, failingWrites: ['meu-projeto/README.md'] });
    expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(3);
    expect(io.paths()).toEqual(['outro.txt']);
  });
  it('falha ao gravar mostra o código da causa', async () => {
    const io = createMemoryIo({ failingWrites: ['meu-projeto/README.md'] });
    await runCli(['arma_o_barraco', 'meu-projeto'], io, deps);
    expect(io.stderrText()).toContain('OTHER');
  });
  it('falha ao criar a pasta mostra o código da causa', async () => {
    const io = createMemoryIo();
    const failing = { ...io, fs: { ...io.fs, makeDirectory: () => Promise.reject(new CliFileError('EACCES', 'meu-projeto')) } };
    expect(await runCli(['arma_o_barraco', 'meu-projeto'], failing, deps)).toBe(3);
    expect(io.stderrText()).toContain('EACCES');
  });
  it('em tom neutro imprime os mesmos passos', async () => {
    const io = createMemoryIo();
    expect(await runCli(['arma_o_barraco', 'proj', '--tom', 'neutro'], io, deps)).toBe(0);
    expect(extractNextSteps(io.stdoutText())).toEqual(['cd proj', 'goiasscript bota_pra_moer main.gs']);
  });
  it('extractNextSteps ignora saída sem o bloco', () => {
    expect(extractNextSteps('nada aqui\n')).toEqual([]);
  });
});
