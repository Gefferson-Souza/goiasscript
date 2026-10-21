import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blessCase, loadCase, loadCases, runCase } from '../support/conformance.ts';
import type { ActualDiagnostic, CompileFunction, ConformanceCase, ExecuteFunction } from '../support/conformance.types.ts';

const diagnostic = (code: string, line: number, column = 1, severity: 'error' | 'warning' = 'error'): ActualDiagnostic => ({ code, severity, range: { start: { line, column } } });
const baseCase: ConformanceCase = { id: 'sample', input: 'prosa("oi")', config: {}, diagnostics: [], output: null, stdout: null, stdin: null };
const succeeds = (code: string, diagnostics: readonly ActualDiagnostic[] = []): CompileFunction => () => ({ ok: true, code, diagnostics });
const fails = (diagnostics: readonly ActualDiagnostic[]): CompileFunction => () => ({ ok: false, diagnostics });
const execute: ExecuteFunction = (code, stdin) => Promise.resolve(`${code}|${stdin ?? ''}`);

let temporary: readonly string[] = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});
function corpus(files: Readonly<Record<string, string>>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-'));
  temporary = [...temporary, root];
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

describe('executor do corpus', () => {
  it('passa quando saída, diagnósticos e stdout conferem', async () => {
    await expect(runCase({ ...baseCase, output: 'out', stdout: 'out|entrada', stdin: 'entrada' }, succeeds('out'), execute)).resolves.toBeUndefined();
  });
  it('falha quando a saída ou o stdout diferem do golden', async () => {
    await expect(runCase({ ...baseCase, output: 'esperado' }, succeeds('obtido'), execute)).rejects.toThrow();
    await expect(runCase({ ...baseCase, stdout: 'esperado' }, succeeds('obtido'), execute)).rejects.toThrow();
  });
  it('compara código e linha, e falha com diagnóstico a mais', async () => {
    const testCase = { ...baseCase, diagnostics: [{ code: 'GS0403', line: 1 }] };
    await expect(runCase(testCase, fails([diagnostic('GS0403', 1)]), execute)).resolves.toBeUndefined();
    await expect(runCase(testCase, fails([diagnostic('GS0403', 2)]), execute)).rejects.toThrow();
    await expect(runCase(baseCase, fails([diagnostic('GS0301', 1)]), execute)).rejects.toThrow();
  });
  it('compara coluna e severidade só quando o golden traz', async () => {
    const strict = { ...baseCase, diagnostics: [{ code: 'GS0806', line: 1, column: 5, severity: 'warning' as const }] };
    await expect(runCase(strict, succeeds('x', [diagnostic('GS0806', 1, 6, 'warning')]), execute)).rejects.toThrow();
    await expect(runCase({ ...baseCase, diagnostics: [{ code: 'GS0806', line: 1 }] }, succeeds('x', [diagnostic('GS0806', 1, 9, 'warning')]), execute)).resolves.toBeUndefined();
  });
  it('programa que não compila não tem saída nem stdout esperados', async () => {
    await expect(runCase({ ...baseCase, stdout: 'x' }, fails([]), execute)).rejects.toThrow();
  });
});

describe('carregador do corpus', () => {
  it('lê o caso sem normalizar o texto e deixa os opcionais nulos', () => {
    const root = corpus({ 'a/input.gs': 'prosa("oi")\r\n', 'a/diagnostics.json': '[{"code":"GS0403","line":1,"column":2}]', 'a/stdout.txt': 'oi\n', 'b/input.gs': '', 'b/diagnostics.json': '[]' });
    expect(loadCase(root, 'a')).toEqual({ id: 'a', input: 'prosa("oi")\r\n', config: {}, diagnostics: [{ code: 'GS0403', line: 1, column: 2 }], output: null, stdout: 'oi\n', stdin: null });
    expect(loadCases(root).map((testCase) => testCase.id)).toEqual(['a', 'b']);
  });
  it('recusa caso sem diagnostics.json e expected-fail sem rfc nem issue', () => {
    expect(() => loadCase(corpus({ 'a/input.gs': '' }), 'a')).toThrow(/sem diagnostics.json/);
    const files = { 'a/input.gs': '', 'a/diagnostics.json': '[]' };
    expect(() => loadCase(corpus({ ...files, 'a/case.json': '{"status":"expected-fail"}' }), 'a')).toThrow(/exige rfc ou issue/);
    expect(loadCase(corpus({ ...files, 'a/case.json': '{"status":"expected-fail","rfc":"RFC-0001"}' }), 'a').config.rfc).toBe('RFC-0001');
  });
});

describe('bless', () => {
  const warning = diagnostic('GS0806', 1, 3, 'warning');
  it('regrava output e diagnósticos completos, e só o stdout de quem já tem stdout.txt', async () => {
    const compile = succeeds('js', [warning]);
    const files = await blessCase(baseCase, compile, () => Promise.resolve('saida\n'));
    expect([files.output, files.stdout, JSON.parse(files.diagnostics)]).toEqual(['js', null, [{ code: 'GS0806', severity: 'warning', line: 1, column: 3 }]]);
    expect((await blessCase({ ...baseCase, stdout: 'antigo' }, compile, () => Promise.resolve('saida\n'))).stdout).toBe('saida\n');
  });
  it('programa que não compila não ganha output', async () => {
    expect((await blessCase(baseCase, fails([warning]), execute)).output).toBeNull();
  });
});
