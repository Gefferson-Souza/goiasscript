import { describe, expect, it } from 'vitest';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';
import type { MemoryIoOptions } from './support/memory-io.types.ts';

const habit = 'const a = 1\nconsole.log(a)\n';
const run = async (argv: readonly string[], options: MemoryIoOptions) => {
  const io = createMemoryIo(options);
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('traduz', () => {
  it('grava x.mjs, avisa no stdout e sai com 0', async () => {
    const { io, code } = await run(['traduz', 'ola.gs'], { files: { 'ola.gs': 'prosa("oi")\n' } });
    expect(code).toBe(0);
    expect(io.fileText('ola.mjs')).toContain('console.log("oi")');
    expect(io.stdoutText()).toContain('ola.mjs');
    expect(io.stderrText()).toBe('');
  });
  it('erro de compilação: exit 1, nada gravado, posição certa com BOM e CRLF', async () => {
    const { io, code } = await run(['traduz', 'ola.gs'], { files: { 'ola.gs': '﻿uai a é 1\r\nprosa(nomi)\r\n' } });
    expect(code).toBe(1);
    expect(io.stderrText()).toContain('ola.gs:2:7');
    expect(io.stderrText()).toContain('GS0301');
    expect(io.paths()).toEqual(['ola.gs']);
  });
  it('hábito de JavaScript mostra vários diagnósticos de uma vez', async () => {
    const { io } = await run(['traduz', 'js.gs'], { files: { 'js.gs': habit } });
    expect(io.stderrText()).toMatch(/GS0401/u);
    expect(io.stderrText()).toMatch(/GS0403/u);
    expect(io.stderrText()).toMatch(/GS0404/u);
  });
  it('--json imprime só o relatório e sai com 1', async () => {
    const { io, code } = await run(['traduz', 'ola.gs', '--json'], { files: { 'ola.gs': 'prosa(nomi)\n' } });
    expect(code).toBe(1);
    expect(io.stderrText()).toBe('');
    expect(JSON.parse(io.stdoutText())).toMatchObject({ version: 1, file: 'ola.gs', ok: false });
  });
  it('--json em sucesso grava a saída e imprime só o relatório', async () => {
    const { io, code } = await run(['traduz', 'ola.gs', '--json'], { files: { 'ola.gs': 'prosa(1)\n' } });
    expect(code).toBe(0);
    expect(JSON.parse(io.stdoutText())).toMatchObject({ ok: true, diagnostics: [] });
    expect(io.fileText('ola.mjs')).toContain('console.log(1)');
  });
  it('--json também reporta recusa de destino, em uma única linha de JSON', async () => {
    const { io, code } = await run(['traduz', 'a.gs', '--json'], { files: { 'a.gs': 'prosa(1)\n', 'a.mjs': 'velho' } });
    expect(code).toBe(3);
    expect(io.stderrText()).toBe('');
    expect(JSON.parse(io.stdoutText())).toMatchObject({ ok: false, diagnostics: [{ code: 'GS0903' }] });
    expect(io.fileText('a.mjs')).toBe('velho');
  });
  it('lê o programa do stdin e escreve o JS no stdout', async () => {
    const { io, code } = await run(['traduz', '-'], { stdin: 'prosa("oi")\n' });
    expect(code).toBe(0);
    expect(io.stdoutText()).toContain('console.log("oi")');
    expect(io.paths()).toEqual([]);
  });
  it('erro no programa do stdin usa <entrada> como nome', async () => {
    const { io, code } = await run(['traduz', '-'], { stdin: 'prosa(nomi)\n' });
    expect(code).toBe(1);
    expect(io.stderrText()).toContain('<entrada>:1:');
    expect(io.stdoutText()).toBe('');
  });
  it('stdin com --saida grava no arquivo pedido', async () => {
    const { io, code } = await run(['traduz', '-', '--saida', 'fora.mjs'], { stdin: 'prosa(1)\n' });
    expect(code).toBe(0);
    expect(io.fileText('fora.mjs')).toContain('console.log(1)');
  });
  it('--otimiza inlina constantes; destino existente exige --sobrescreve', async () => {
    const { io } = await run(['traduz', 'a.gs', '--otimiza'], { files: { 'a.gs': 'uai a é 1\nprosa(a mais 2)\n', 'a.mjs': 'velho' } });
    expect(io.fileText('a.mjs')).toBe('velho');
    expect(io.stderrText()).toContain('GS0903');
    expect(await runCli(['traduz', 'a.gs', '--otimiza'], io, { processHost: createFakeProcessHost() })).toBe(3);
    expect(await runCli(['traduz', 'a.gs', '--otimiza', '--sobrescreve'], io, { processHost: createFakeProcessHost() })).toBe(0);
    expect(io.fileText('a.mjs')).toContain('console.log(3)');
  });
  it('arquivo que não termina em .gs: exit 3 e fonte intacto', async () => {
    const { io, code } = await run(['traduz', 'x.txt'], { files: { 'x.txt': 'prosa(1)' } });
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0902');
    expect(io.fileText('x.txt')).toBe('prosa(1)');
  });
  it('arquivo inexistente é uso incorreto', async () => {
    const { io, code } = await run(['traduz', 'nada.gs'], {});
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0905');
  });
  it('arquivo fora de UTF-8 é recusado sem gravar nada', async () => {
    const { io, code } = await run(['traduz', 'a.gs'], { files: { 'a.gs': new Uint8Array([0xff, 0xfe, 0x70]) } });
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('UTF-8');
    expect(io.paths()).toEqual(['a.gs']);
  });
  it('falha de gravação vira saída recusada (GS0903) sem derrubar a CLI', async () => {
    const { io, code } = await run(['traduz', 'a.gs'], { files: { 'a.gs': 'prosa(1)\n' }, failingWrites: ['a.mjs'] });
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0903');
    expect(io.stderrText()).not.toContain('GS0905');
  });
  it('--minifica grava a saída apertada', async () => {
    const { io, code } = await run(['traduz', 'a.gs', '--minifica'], { files: { 'a.gs': 'uai nomeLongo é 1\nprosa(nomeLongo)\n' } });
    expect(code).toBe(0);
    expect(io.fileText('a.mjs')).not.toContain('nomeLongo');
  });
  it('tom neutro troca o texto de sucesso', async () => {
    const { io } = await run(['traduz', 'ola.gs', '--tom', 'neutro'], { files: { 'ola.gs': 'prosa(1)\n' } });
    expect(io.stdoutText()).not.toContain('sô');
    expect(io.stdoutText()).toContain('ola.mjs');
  });
});
