import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { analyzeSource } from '../../support/analyze.ts';

const session = { bindings: [{ name: 'x', kind: 'uai' as const }, { name: 'f', kind: 'faz_trem' as const }], members: ['campo'] };

describe('sessão do REPL', () => {
  it('nome da sessão não dá GS0301 e resolve como sessão', () => {
    const { analysis, codes, parsed } = analyzeSource('prosa(x)', { target: 'repl', session });
    expect(codes).toEqual([]);
    const kinds: string[] = [];
    walk(parsed.program, (node) => {
      if (node.type === 'Identifier' && node.name === 'x') kinds.push(analysis.resolutionOf(node).kind);
    });
    expect(kinds).toEqual(['session']);
  });
  it('reatribuir uai da sessão dá GS0302', () => {
    expect(analyzeSource('x é 2', { target: 'repl', session }).codes).toEqual(['GS0302']);
  });
  it('redeclarar nome da sessão substitui sem GS0304 e muda o kind', () => {
    const { analysis, codes } = analyzeSource('trem x é 9', { target: 'repl', session });
    expect(codes).toEqual([]);
    expect(analysis.topLevelBindings).toEqual([{ name: 'x', kind: 'trem' }]);
  });
  it('depois de redeclarada como trem, a sessão aceita reatribuir', () => {
    expect(analyzeSource('trem x é 9\nx é 10', { target: 'repl', session }).codes).toEqual([]);
  });
  it('redeclaração dentro da mesma entrada continua GS0304', () => {
    expect(analyzeSource('uai y é 1\nuai y é 2', { target: 'repl', session }).codes).toEqual(['GS0304']);
  });
  it('membro da sessão vale no censo D', () => {
    expect(analyzeSource('prosa({}.campo)', { target: 'repl', session }).codes).toEqual([]);
  });
  it('GS0301 sugere nomes da sessão', () => {
    const { analysis } = analyzeSource('prosa(xx)', { target: 'repl', session });
    expect(analysis.diagnostics[0]?.args).toMatchObject({ suggestion: 'x' });
  });
  it('topLevelBindings lista funções, classes e variáveis do topo', () => {
    const { analysis } = analyzeSource('uai a é 1\ntrem b é 2\nfaz_trem g() {}\narruma_trem C {}\nse_ocê_quiser (certeza) { uai d é 1 }', { target: 'repl' });
    expect(analysis.topLevelBindings).toEqual([
      { name: 'a', kind: 'uai' },
      { name: 'b', kind: 'trem' },
      { name: 'g', kind: 'faz_trem' },
      { name: 'C', kind: 'arruma_trem' },
    ]);
  });
  it('soma isolada no topo do repl não avisa; dentro de bloco avisa', () => {
    expect(analyzeSource('uai a é 1\na mais 1', { target: 'repl' }).codes).toEqual([]);
    expect(analyzeSource('se_ocê_quiser (certeza) { 1 mais 1 }', { target: 'repl' }).codes).toEqual(['GS0806']);
  });
});
