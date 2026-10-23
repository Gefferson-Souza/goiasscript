import { describe, expect, it } from 'vitest';
import { runTranslate } from '../src/commands/run-translate.ts';
import type { FakeOutcome } from './support/fake-exec-file.types.ts';
import { createFakeExecFile } from './support/fake-exec-file.ts';
import { createFakeHost } from './support/fake-host.ts';
import type { FakeHostOptions } from './support/fake-host.types.ts';

const RUNTIME = '/usr/bin/node';
const DOCUMENT_PATH = '/work/programa.gs';
const CLI_ENTRY = '/extension/dist/cli/goiasscript.mjs';
const OVERWRITE_STDERR = 'erro GS0903: Ô sô, essa saída não rola: já existe. Usa "--sobrescreve" se quiser trocar.\n';

const ok = (stdout: string): FakeOutcome => ({ exitCode: 0, stdout, stderr: '' });
const failed = (exitCode: number, stderr: string): FakeOutcome => ({ exitCode, stdout: '', stderr });

function setup(outcomes: readonly FakeOutcome[], hostOptions: FakeHostOptions = {}) {
  const base = createFakeHost();
  const activeDocument = hostOptions.activeDocument ?? base.makeDocument({});
  const host = createFakeHost({ ...hostOptions, activeDocument });
  const exec = createFakeExecFile({ outcomes });
  const handler = runTranslate({ host, execFile: exec.execFile, runtimePath: RUNTIME });
  return { host, exec, handler, activeDocument };
}

describe('runTranslate', () => {
  it('executa o CLI embutido com o arquivo depois de -- e sem shell', async () => {
    const { exec, handler, host } = setup([ok('Tá pronto, sô! /work/programa.mjs\n')]);
    await handler();
    expect(exec.calls).toHaveLength(1);
    const [call] = exec.calls;
    expect(call?.file).toBe(RUNTIME);
    expect(call?.args).toEqual([CLI_ENTRY, 'traduz', '--tom', 'raiz', '--', DOCUMENT_PATH]);
    expect(call?.options).not.toHaveProperty('shell');
    expect(host.infos).toEqual(['Tá pronto, sô! /work/programa.mjs']);
  });

  it('usa o tom das configurações', async () => {
    const { exec, handler } = setup([ok('Pronto! /work/programa.mjs\n')], { settings: { tone: 'neutro' } });
    await handler();
    expect(exec.calls[0]?.args).toContain('neutro');
  });

  it('traduz o arquivo clicado, e não o documento ativo', async () => {
    const clicked = createFakeHost().makeDocument({ uri: 'file:///work/outro.gs', fsPath: '/work/outro.gs' });
    const { exec, handler } = setup([ok('')], { documents: [clicked] });
    await handler('file:///work/outro.gs');
    expect(exec.calls[0]?.args.at(-1)).toBe('/work/outro.gs');
  });

  it.each([
    ['untitled', 'goiasscript'],
    ['git', 'goiasscript'],
    ['file', 'javascript'],
  ])('recusa esquema %s e linguagem %s antes de executar qualquer coisa', async (scheme, languageId) => {
    const document = createFakeHost().makeDocument({ scheme, languageId });
    const { exec, handler, host } = setup([ok('')], { activeDocument: document });
    await handler();
    expect(exec.calls).toHaveLength(0);
    expect(host.errors).toHaveLength(1);
    expect(host.infos).toHaveLength(0);
  });

  it('recusa quando não há documento', async () => {
    const exec = createFakeExecFile();
    const host = createFakeHost();
    await runTranslate({ host, execFile: exec.execFile, runtimePath: RUNTIME })();
    expect(exec.calls).toHaveLength(0);
    expect(host.errors).toHaveLength(1);
  });

  it('traduz mesmo em workspace não confiável, porque não executa código do aluno', async () => {
    const { exec, handler } = setup([ok('')], { trusted: false });
    await handler();
    expect(exec.calls).toHaveLength(1);
  });

  it('mostra o diagnóstico no canal de saída e não reexecuta quando o CLI sai com 1', async () => {
    const { exec, handler, host } = setup([failed(1, 'erro GS0101: faltou fechar o parêntese\n')]);
    await handler();
    expect(exec.calls).toHaveLength(1);
    expect(host.output.join('')).toContain('GS0101');
    expect(host.errors).toHaveLength(1);
    expect(host.infos).toHaveLength(0);
  });

  it('neutraliza bytes de controle da saída do CLI', async () => {
    const escape = String.fromCharCode(0x1b);
    const { handler, host } = setup([failed(1, `${escape}]0;falso\u0007erro\n`)]);
    await handler();
    expect(host.output.join('')).not.toContain(escape);
    const info = setup([ok(`Pronto! ${escape}[2J/work/a.mjs\n`)]);
    await info.handler();
    expect(info.host.infos.join('')).not.toContain(escape);
  });

  it('pergunta antes de sobrescrever e reexecuta com --sobrescreve após a confirmação', async () => {
    const { exec, handler, host } = setup([failed(3, OVERWRITE_STDERR), ok('Tá pronto, sô! /work/programa.mjs\n')], { confirmation: true });
    await handler();
    expect(host.confirmations).toHaveLength(1);
    expect(host.confirmations[0]?.confirmLabel).toBe('Sobrescreve');
    expect(exec.calls).toHaveLength(2);
    expect(exec.calls[1]?.args).toEqual([CLI_ENTRY, 'traduz', '--tom', 'raiz', '--sobrescreve', '--', DOCUMENT_PATH]);
    expect(host.infos).toHaveLength(1);
  });

  it('não sobrescreve nem chama o CLI de novo quando o usuário recusa', async () => {
    const { exec, handler, host } = setup([failed(3, OVERWRITE_STDERR), ok('')], { confirmation: false });
    await handler();
    expect(host.confirmations).toHaveLength(1);
    expect(exec.calls).toHaveLength(1);
    expect(host.infos).toHaveLength(0);
  });

  it('não pergunta de novo se a reexecução com --sobrescreve também falha', async () => {
    const { exec, handler, host } = setup([failed(3, OVERWRITE_STDERR), failed(3, OVERWRITE_STDERR)], { confirmation: true });
    await handler();
    expect(exec.calls).toHaveLength(2);
    expect(host.confirmations).toHaveLength(1);
    expect(host.errors).toHaveLength(1);
  });

  it('saída 3 sem GS0903 é erro comum, sem oferecer sobrescrever', async () => {
    const { exec, handler, host } = setup([failed(3, 'A opção "--x" não existe nesse comando.\n')]);
    await handler();
    expect(host.confirmations).toHaveLength(0);
    expect(exec.calls).toHaveLength(1);
    expect(host.errors).toHaveLength(1);
  });

  it('erro de spawn vira mensagem em goianês, sem pilha', async () => {
    const { handler, host } = setup([{ exitCode: 1, stdout: '', stderr: '', spawnErrorCode: 'ENOENT' }]);
    await handler();
    expect(host.errors).toHaveLength(1);
    expect(host.errors[0]).not.toMatch(/\bat \w|spawn|Error:/u);
  });
});
