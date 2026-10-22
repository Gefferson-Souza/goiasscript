import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { analyzeSource } from '../../support/analyze.ts';

function resolutionKinds(text: string, name: string): readonly string[] {
  const { analysis, parsed } = analyzeSource(text);
  const kinds: string[] = [];
  walk(parsed.program, (node) => {
    if (node.type === 'Identifier' && node.name === name) kinds.push(analysis.resolutionOf(node).kind);
  });
  return kinds;
}

describe('escopos e biblioteca', () => {
  it('nome não declarado dá GS0301 com sugestão', () => {
    const { analysis } = analyzeSource('uai nome é "a"\nprosa(nomi)');
    const found = analysis.diagnostics.find((item) => item.code === 'GS0301');
    expect(found?.args).toMatchObject({ name: 'nomi', suggestion: 'nome' });
  });
  it('nome sem parecido não leva sugestão', () => {
    const { analysis } = analyzeSource('prosa(zzzzzz)');
    expect(analysis.diagnostics[0]?.args).toEqual({ name: 'zzzzzz' });
  });
  it('sugere nome da biblioteca quando é o mais parecido', () => {
    const { analysis } = analyzeSource('prosaa("oi")');
    expect(analysis.diagnostics[0]?.args).toMatchObject({ suggestion: 'prosa' });
  });
  it('reatribuir uai dá GS0302 e trem não', () => {
    expect(analyzeSource('uai a é 1\na é 2').codes).toEqual(['GS0302']);
    expect(analyzeSource('trem a é 1\na é 2').codes).toEqual([]);
  });
  it('parâmetro e topo do corpo contam como um escopo (GS0304)', () => {
    expect(analyzeSource('faz_trem f(a) { uai a é 1 }').codes).toEqual(['GS0304']);
    expect(analyzeSource('faz_trem f(a, a) { faz_favor a }').codes).toEqual(['GS0304']);
    expect(analyzeSource('uai a é 1\nfaz_trem f() { uai a é 2; faz_favor a }').codes).toEqual([]);
  });
  it('bloco interno pode esconder o nome de fora', () => {
    expect(analyzeSource('uai a é 1\nse_ocê_quiser (certeza) { uai a é 2; prosa(a) }').codes).toEqual([]);
  });
  it('declaração vale no escopo todo, também antes da linha', () => {
    expect(analyzeSource('prosa(dobro(2))\nfaz_trem dobro(n) { faz_favor n vezes 2 }').codes).toEqual([]);
  });
  it('declarar global da biblioteca dá aviso GS0804, nunca GS0304', () => {
    expect(analyzeSource('uai Data é 1\nprosa(Data)').codes).toEqual(['GS0804']);
  });
  it('referência que resolve para o programa não é biblioteca', () => {
    expect(resolutionKinds('faz_trem pergunta() { faz_favor 1 }\npergunta()', 'pergunta')).toEqual(['program', 'program']);
  });
  it('prosa sem declaração resolve para a biblioteca', () => {
    expect(resolutionKinds('prosa("oi")', 'prosa')).toEqual(['library']);
  });
  it('parâmetro, laço e erro capturado resolvem para o programa', () => {
    const text = 'faz_trem f(p) { vai_indo (uai x de [p]) { prosa(x) } }\ntenta_aí { f(1) } se_der_ruim (e) { prosa(e.mensagem) }';
    expect(analyzeSource(text).codes).toEqual([]);
    expect(resolutionKinds(text, 'x')).toEqual(['program', 'program']);
  });
  it('seta tem escopo próprio para os parâmetros', () => {
    expect(analyzeSource('uai l é [1]\nprosa(l.mapear(n => n mais 1))').codes).toEqual([]);
    expect(analyzeSource('uai l é [1]\nl.mapear(n => n)\nprosa(n)').codes).toEqual(['GS0301']);
  });
  it('classe e método: nome da classe resolve no corpo', () => {
    expect(analyzeSource('arruma_trem A { cria() { faz_favor faz_um A() } }').codes).toEqual([]);
  });
  it('palavra aposentada não declarada dá GS0306 no lugar de GS0301', () => {
    expect(analyzeSource('prosa(vazio)').codes).toEqual(['GS0306']);
    expect(analyzeSource('uai vazio é 0\nprosa(vazio)').codes).toEqual([]);
  });
  it('chave de coisa, método e membro não são referências', () => {
    expect(analyzeSource('uai p é { nome: 1 }\nprosa(p.nome)').codes).toEqual([]);
  });
});
