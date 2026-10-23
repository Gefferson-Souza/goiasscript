import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLexicon } from '../src/lexicon.mjs';
import { discoverFiles, loadScope, pathSegmentFindings, scopeProblems } from '../src/files.mjs';
import { hasDictionaries } from './support/dictionaries.mjs';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../../..');
const FAKE_ROOT = '/repo';
const scope = loadScope(REPOSITORY_ROOT);
const relativePaths = (entries) => entries.map((entry) => entry.rel);

describe('descoberta de arquivos do scanner', () => {
  it('nenhum caminho excluído do escopo', () => {
    expect(scope.excluded).toEqual([]);
  });
  it('inclui o código novo e separa o que a lista excluded declara', () => {
    const withExclusion = { ...scope, excluded: [{ path: 'vendor-fixture', reason: 'teste da mecânica de exclusão' }] };
    const discovery = discoverFiles(FAKE_ROOT, withExclusion, ['packages/compiler/src/a.ts', 'vendor-fixture/src/a.mjs', 'vendor-fixture/tests/a.ts']);
    expect(relativePaths(discovery.included)).toEqual(['packages/compiler/src/a.ts']);
    expect(discovery.excluded).toEqual(['vendor-fixture/src/a.mjs', 'vendor-fixture/tests/a.ts']);
    expect(discovery.unscoped).toEqual([]);
  });
  it('acusa arquivo ts fora do escopo e da lista excluded', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/src/a.ts', 'misc/orphan.ts']);
    expect(scopeProblems(discovery)).toEqual(['arquivo rastreado fora do escopo e da lista excluded: misc/orphan.ts']);
  });
  it('falha quando nenhum arquivo é analisado', () => {
    expect(scopeProblems(discoverFiles(FAKE_ROOT, scope, ['README.md']))).toEqual(['o scanner analisou 0 arquivos']);
  });
  it('classifica declaração .d.mts como declaração, não como código-fonte', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/stryker.config.d.mts']);
    expect(discovery.included.map((entry) => entry.role)).toEqual(['declaration']);
  });
  it('ignora a saída dourada do corpus de conformidade', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/src/a.ts', 'packages/compiler/tests/conformance/a/output.mjs']);
    expect(relativePaths(discovery.included)).toEqual(['packages/compiler/src/a.ts']);
    expect(discovery.excluded).toEqual([]);
    expect(discovery.unscoped).toEqual([]);
  });
  it.skipIf(!hasDictionaries)('marca segmento de caminho em português e poupa o resto', () => {
    const findings = pathSegmentFindings(
      ['packages/compiler/src/buscarUsuario.ts', 'packages/compiler/src/lexer.ts', 'docs/gramatica.md', 'packages/compiler/tests/exemplos/programa.gs', 'docs/exemplos/arquivo.js'],
      scope,
      createLexicon(),
    );
    expect(findings).toEqual([{ file: 'packages/compiler/src/buscarUsuario.ts', line: 1, text: 'segmento de caminho em português: buscarUsuario.ts' }]);
  });
});
