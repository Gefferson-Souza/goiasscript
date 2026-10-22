import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const accepted = [
  'uai f é { ano: 1999 }',
  'uai f é { dia: 5 }',
  'uai f é { hora: 9 }',
  'uai f é { maior: 3 }',
  'uai f é { tem: certeza }',
  'uai f é { pergunta: "x" }',
  'uai f é { ano: 1999 }\nprosa(f.ano)',
  'uai f é { ano: 1999 }\nuai agora é faz_um Data()\nprosa(agora.ano())',
  'uai fila é [1]\nprosa(Coisa.tem({ a: 1 }, "a"))',
  'uai t é "a"\nprosa(t.trocar("a", "US$$"))',
];
const rejected: ReadonlyArray<readonly [string, string]> = [
  ['uai f é { o_tanto: 3 }', 'GS0601'],
  ['uai f é { mensagem: "oi" }', 'GS0601'],
  ['arruma_trem Fila { o_tanto() { faz_favor 1 } }', 'GS0601'],
  ['arruma_trem A { mapear(f) { faz_favor f } }', 'GS0601'],
  ['uai f é { ano: (x) => x }', 'GS0601'],
  ['uai ano é 1\nuai f é { ano: ano }', 'GS0601'],
  ['faz_trem calcula() { faz_favor 1 }\nuai f é { ano: calcula }', 'GS0601'],
  ['uai l é "abc"\nprosa(l.o_tanto())', 'GS0603'],
  ['prosa(Conta.PI())', 'GS0603'],
  ['uai l é [1]\nuai f é l.mapear', 'GS0603'],
  ['uai l é [1]\nl.amontoar(x => x)', 'GS0604'],
  ['uai t é "a"\nt.trocar("a")', 'GS0604'],
  ['uai l é [1]\nl.arruma(x => x)', 'GS0604'],
  ['prosa(Conta.maior())', 'GS0604'],
];

describe('reserva por forma', () => {
  it.each(accepted)('aceita %s', (src) => {
    expect(analyzeSource(src).codes.filter((code) => code.startsWith('GS06'))).toEqual([]);
  });
  it.each(rejected)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('mensagem só leitura: atribuir dá GS0601', () => {
    expect(analyzeSource('uai e é faz_um Erro("a")\ne.mensagem é "b"').codes).toContain('GS0601');
  });
  it('GS0601 descreve o receptor e sugere alternativa da tabela', () => {
    const { analysis } = analyzeSource('uai f é { mensagem: "oi" }');
    expect(analysis.diagnostics[0]?.args).toEqual({ name: 'mensagem', description: 'mensagem de erro', suggestion: 'texto' });
  });
  it('GS0601 sem alternativa na tabela sugere nome novo', () => {
    const { analysis } = analyzeSource('arruma_trem A { mapear(f) { faz_favor f } }');
    expect(analysis.diagnostics[0]?.args).toMatchObject({ name: 'mapear', suggestion: 'meu_mapear' });
  });
  it('GS0603 diz a forma certa', () => {
    expect(analyzeSource('uai l é "abc"\nprosa(l.o_tanto())').analysis.diagnostics[0]?.args).toEqual({
      name: 'o_tanto',
      expected: 'é propriedade e não leva parênteses',
    });
    expect(analyzeSource('uai l é [1]\nuai f é l.mapear').analysis.diagnostics[0]?.args).toMatchObject({
      expected: 'é método e precisa de parênteses',
    });
  });
  it('GS0604 diz quantos argumentos e a assinatura', () => {
    expect(analyzeSource('uai t é "a"\nt.trocar("a")').analysis.diagnostics[0]?.args).toEqual({
      name: 'trocar',
      arity: '2 argumentos',
      received: '1',
      signature: 'trocar(valor, valor)',
    });
    expect(analyzeSource('prosa(Conta.maior())').analysis.diagnostics[0]?.args).toMatchObject({ arity: 'pelo menos 1' });
    expect(analyzeSource('uai l é [1]\nl.arruma(1)').analysis.diagnostics[0]?.args).toMatchObject({ arity: '0 argumentos' });
    expect(analyzeSource('uai l é "a"\nl.naco()').analysis.diagnostics[0]?.args).toMatchObject({ arity: 'de 1 a 2 argumentos' });
    expect(analyzeSource('uai l é "a"\nl.repete()').analysis.diagnostics[0]?.args).toMatchObject({ arity: '1 argumento' });
  });
});
