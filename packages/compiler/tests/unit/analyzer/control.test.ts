import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const cases: ReadonlyArray<readonly [string, string]> = [
  ['uai x é 1\npara_com_isso', 'GS0308'],
  ['continua_aí', 'GS0308'],
  ['faz_favor 1', 'GS0309'],
  ['arruma_trem A { aprepara_trem() {} aprepara_trem() {} }', 'GS0310'],
  ['arruma_trem A { aprepara_trem() { a_raiz() } }', 'GS0311'],
  ['arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { ocê.x é 1; a_raiz() } }', 'GS0311'],
  ['arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { a_raiz(ocê.x) } }', 'GS0311'],
  ['arruma_trem B {}\narruma_trem A inherda_de B { cria() { a_raiz() } }', 'GS0311'],
  ['arruma_trem A { cria() { a_raiz.cria() } }', 'GS0311'],
  ['faz_trem f() { a_raiz.cria() }', 'GS0311'],
  ['arruma_trem B {}\narruma_trem A inherda_de B { cria() { prosa(a_raiz) } }', 'GS0311'],
  ['faz_trem f() { espera_um_cadim cochila(1) }', 'GS0312'],
  ['vai_na_frente faz_trem f() { uai g é () => espera_um_cadim cochila(1) }', 'GS0312'],
  ['uai x', 'GS0307'],
  ['uai public é 1', 'GS0402'],
  ['uai eval é 1', 'GS0402'],
  ['uai console é 1', 'GS0403'],
  ['uai mais é 1', 'GS0303'],
  ['uai se_oce_quiser é 1', 'GS0303'],
  ['uai oce é 1', 'GS0303'],
  ['faz_trem f(NaN) {}', 'GS0402'],
  ['prosa(vazio)', 'GS0306'],
  ['console.log(1)', 'GS0403'],
  ['prosa(public)', 'GS0402'],
  ['tenta_aí { prosa(1) } se_der_ruim (mais) { prosa(1) }', 'GS0303'],
];

describe('controle e nomes reservados', () => {
  it.each(cases)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('sem falso positivo', () => {
    for (const src of [
      'vai_indo (uai x de [1]) { continua_aí }',
      'enquanto_tiver (certeza) { para_com_isso }',
      'uai de é 1\nvai_indo (uai x de [de]) { prosa(x) }',
      'uai vazio é 0\nprosa(vazio)',
      'uai se é 1',
      'arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { a_raiz(); ocê.x é 1 } }',
      'arruma_trem B { oi() {} }\narruma_trem A inherda_de B { aprepara_trem() { a_raiz() } oi() { a_raiz.oi() } }',
      'arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { uai f é () => a_raiz.oi(); a_raiz() } oi() {} }',
      'espera_um_cadim cochila(1)',
      'vai_na_frente faz_trem f() { espera_um_cadim cochila(1) }',
      'faz_trem f() { enquanto_tiver (certeza) { faz_favor 1 } }',
      'faz_trem f() { uai g é () => { faz_favor 1 }; faz_favor g }',
    ]) expect(analyzeSource(src).codes, src).toEqual([]);
  });
  it('seta reinicia o contexto de laço', () => {
    expect(analyzeSource('enquanto_tiver (certeza) { uai f é () => { para_com_isso } }').codes).toContain('GS0308');
  });
  it('função aninhada reinicia o contexto de laço', () => {
    expect(analyzeSource('vai_indo (uai x de [1]) { faz_trem f() { continua_aí } }').codes).toContain('GS0308');
  });
  it('GS0303 sugere nome novo e GS0402 traz a sugestão da tabela', () => {
    expect(analyzeSource('uai mais é 1').analysis.diagnostics[0]?.args).toEqual({ name: 'mais', suggestion: 'meu_mais' });
    expect(analyzeSource('uai public é 1').analysis.diagnostics[0]?.args).toEqual({ name: 'public', suggestion: 'publico' });
  });
  it('GS0308 diz a palavra usada', () => {
    expect(analyzeSource('para_com_isso').analysis.diagnostics[0]?.args).toEqual({ name: 'para_com_isso' });
  });
});
