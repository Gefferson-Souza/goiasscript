import { compile } from '@goiasscript/compiler';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { loadExampleSource, loadExamples } from '../lib/examples.ts';
import { buildExamples, runBuildExamples } from '../scripts/build-examples.ts';

const SOURCE_DIR = join(import.meta.dirname, '..', 'examples');
const roots: string[] = [];
const makeRoot = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'build-examples-'));
  roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function seedSource(entries: readonly { readonly id: string; readonly title: string; readonly code: string }[]): string {
  const dir = makeRoot();
  writeFileSync(join(dir, 'index.json'), JSON.stringify(entries.map(({ id, title }) => ({ id, title }))));
  for (const entry of entries) writeFileSync(join(dir, `${entry.id}.gs`), entry.code);
  return dir;
}

function runInVm(code: string): string {
  const lines: string[] = [];
  vm.runInNewContext(code, { console: { log: (...values: unknown[]) => lines.push(values.join(' ')) } });
  return lines.map((line) => `${line}\n`).join('');
}

describe('buildExamples', () => {
  it('gera o manifest com id, title e file e copia os .gs', () => {
    const sourceDir = seedSource([
      { id: 'um', title: 'Primeiro', code: 'prosa("1")\n' },
      { id: 'dois', title: 'Segundo', code: 'prosa("2")\n' },
    ]);
    const outDir = join(makeRoot(), 'saida');
    const manifest = buildExamples({ sourceDir, outDir });
    expect(manifest).toEqual([
      { id: 'um', title: 'Primeiro', file: 'um.gs' },
      { id: 'dois', title: 'Segundo', file: 'dois.gs' },
    ]);
    expect(JSON.parse(readFileSync(join(outDir, 'manifest.json'), 'utf8'))).toEqual(manifest);
    expect(readFileSync(join(outDir, 'um.gs'), 'utf8')).toBe('prosa("1")\n');
  });

  it('falha com mensagem em goianês, sem escrever nada, se um exemplo não compila', () => {
    const sourceDir = seedSource([{ id: 'ruim', title: 'Ruim', code: 'uai x é ;\n' }]);
    const outDir = join(makeRoot(), 'saida');
    expect(() => buildExamples({ sourceDir, outDir })).toThrow(/Ô sô.*ruim/su);
    expect(existsSync(join(outDir, 'manifest.json'))).toBe(false);
  });

  it('recusa id que sai da pasta (traversal)', () => {
    const sourceDir = seedSource([{ id: '../fora', title: 'Fora', code: 'prosa("x")\n' }]);
    expect(() => buildExamples({ sourceDir, outDir: join(makeRoot(), 'saida') })).toThrow(/Ô sô/u);
  });

  it('runBuildExamples devolve 1 e escreve o erro no canal de erro', () => {
    const sourceDir = seedSource([{ id: 'ruim', title: 'Ruim', code: 'uai x é ;\n' }]);
    const written: string[] = [];
    const exitCode = runBuildExamples({ sourceDir, outDir: join(makeRoot(), 'saida') }, { out: (text) => written.push(text), err: (text) => written.push(text) });
    expect(exitCode).toBe(1);
    expect(written.join('')).toMatch(/Ô sô/u);
  });

  it('runBuildExamples devolve 0 quando tudo compila', () => {
    const sourceDir = seedSource([{ id: 'um', title: 'Primeiro', code: 'prosa("1")\n' }]);
    const written: string[] = [];
    const exitCode = runBuildExamples({ sourceDir, outDir: join(makeRoot(), 'saida') }, { out: (text) => written.push(text), err: (text) => written.push(text) });
    expect(exitCode).toBe(0);
    expect(written.join('')).toMatch(/1 exemplo/u);
  });
});

describe('exemplos do playground', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'playground-examples-'));
  let manifest: ReturnType<typeof buildExamples> = [];

  beforeAll(() => {
    manifest = buildExamples({ sourceDir: SOURCE_DIR, outDir });
  });

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('são cinco', () => {
    expect(manifest).toHaveLength(5);
  });

  it('cada exemplo compila no alvo playground e imprime o esperado', () => {
    for (const { id, file } of manifest) {
      const source = readFileSync(join(outDir, file), 'utf8');
      const result = compile(source, { target: 'playground', tone: 'raiz', fileName: file });
      expect(result.diagnostics, id).toEqual([]);
      if (!result.ok) throw new Error(`exemplo ${id} não compilou`);
      expect(runInVm(result.code), id).toBe(readFileSync(join(SOURCE_DIR, `${id}.stdout.txt`), 'utf8'));
    }
  });
});

describe('leitura dos exemplos no navegador', () => {
  const entries = [{ id: 'um', title: 'Primeiro', file: 'um.gs' }];
  const reply = (body: unknown, ok = true) => () => Promise.resolve({ ok, json: () => Promise.resolve(body), text: () => Promise.resolve(String(body)) });

  it('lista os exemplos do manifest', async () => {
    expect(await loadExamples(reply(entries))).toEqual(entries);
  });

  it('devolve lista vazia se o manifest falha ou vem torto', async () => {
    expect(await loadExamples(reply([], false))).toEqual([]);
    expect(await loadExamples(reply({ not: 'list' }))).toEqual([]);
    expect(await loadExamples(reply([{ id: 1 }, { id: 'a', title: 'A', file: '../x.gs' }]))).toEqual([]);
    expect(await loadExamples(() => Promise.reject(new Error('rede')))).toEqual([]);
  });

  it('lê o código de um exemplo pelo nome do arquivo e recusa nome estranho', async () => {
    expect(await loadExampleSource('um.gs', reply('prosa("1")'))).toBe('prosa("1")');
    expect(await loadExampleSource('../segredo', reply('x'))).toBeNull();
    expect(await loadExampleSource('um.gs', reply('x', false))).toBeNull();
    expect(await loadExampleSource('um.gs', () => Promise.reject(new Error('rede')))).toBeNull();
  });
});
