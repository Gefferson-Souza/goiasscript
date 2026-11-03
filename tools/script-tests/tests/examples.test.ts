import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { compile } from '../../../packages/compiler/src/index.ts';
import type { DocBlockDeps, ExampleProgram } from '../../../scripts/docs-gate.types.ts';
import { runDocProgram } from '../../../scripts/docs-run.ts';
import { checkExamples, readExamples } from '../../../scripts/examples-check.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const realDeps: DocBlockDeps = { compile: (source) => compile(source, { target: 'module' }), run: runDocProgram };
const roots: string[] = [];

const program = (overrides: Partial<ExampleProgram>): ExampleProgram => ({
  name: 'teste',
  file: 'exemplos/teste/main.gs',
  source: 'prosa("oi")\n',
  stdin: '',
  expectedStdout: 'oi\n',
  ...overrides,
});

const seedRoot = (apps: Readonly<Record<string, Readonly<Record<string, string>>>>): string => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-exemplos-'));
  roots.push(root);
  for (const [name, files] of Object.entries(apps)) {
    fs.mkdirSync(path.join(root, 'exemplos', name), { recursive: true });
    for (const [file, text] of Object.entries(files)) fs.writeFileSync(path.join(root, 'exemplos', name, file), text);
  }
  return root;
};

afterEach(() => {
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

describe('readExamples', () => {
  it('lê cada pasta com main.gs, saida.txt e a entrada opcional, em ordem de nome', () => {
    const root = seedRoot({
      beta: { 'main.gs': 'a', 'saida.txt': 'b', 'entrada.txt': 'c' },
      alpha: { 'main.gs': 'x', 'saida.txt': 'y' },
    });
    expect(readExamples(root)).toEqual([
      { name: 'alpha', file: 'exemplos/alpha/main.gs', source: 'x', stdin: '', expectedStdout: 'y' },
      { name: 'beta', file: 'exemplos/beta/main.gs', source: 'a', stdin: 'c', expectedStdout: 'b' },
    ]);
  });

  it('pasta sem saida.txt vira erro em goianês', () => {
    const root = seedRoot({ alpha: { 'main.gs': 'x' } });
    expect(() => readExamples(root)).toThrow(/Ô sô.*alpha.*saida\.txt/su);
  });
});

describe('checkExamples', () => {
  it('programa que imprime o esperado passa', async () => {
    expect(await checkExamples([program({})], realDeps)).toEqual([]);
  });

  it('usa a entrada.txt como o que a pessoa digitou', async () => {
    const source = 'uai nome é pergunta("Nome?")\nprosa("Eai", nome)\n';
    const problems = await checkExamples([program({ source, stdin: 'Maria\n', expectedStdout: 'Nome? Eai Maria\n' })], realDeps);
    expect(problems).toEqual([]);
  });

  it('saída diferente aponta a primeira linha que mudou', async () => {
    const problems = await checkExamples([program({ source: 'prosa("a")\nprosa("b")\n', expectedStdout: 'a\nc\n' })], realDeps);
    expect(problems).toEqual([{ file: 'exemplos/teste/main.gs', line: 2, message: 'a linha 2 da saída devia ser "c", mas saiu "b".' }]);
  });

  it('programa que não compila mostra os códigos do erro', async () => {
    const problems = await checkExamples([program({ source: 'prosa(nomi)\n' })], realDeps);
    expect(problems).toEqual([{ file: 'exemplos/teste/main.gs', line: 0, message: 'o exemplo não compila: GS0301.' }]);
  });

  it('programa que termina com erro mostra a saída de erro', async () => {
    const problems = await checkExamples([program({ source: 'vixe("caiu")\n' })], realDeps);
    expect(problems.map((item) => item.message)).toEqual([expect.stringMatching(/^o exemplo terminou com erro \(saída 1\): .*caiu/su)]);
  });
});

describe('exemplos do repositório', () => {
  it('cada app de exemplos/ imprime exatamente a saida.txt', async () => {
    const examples = readExamples(ROOT_DIR);
    expect(examples.length).toBeGreaterThanOrEqual(5);
    expect(await checkExamples(examples, realDeps)).toEqual([]);
  });
});
