import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const warned: ReadonlyArray<readonly [string, string]> = [
  ['trem a é 1\nse_ocê_quiser (a é 2) { prosa(a) }', 'GS0801'],
  ['trem a é 1\nenquanto_tiver (a é 2) { para_com_isso }', 'GS0801'],
  ['uai l é [1]\nl.filtrar(n => n é 2)', 'GS0801'],
  ['enquanto_tiver (certeza) { prosa(1) }', 'GS0802'],
  ['faz_trem f() { faz_favor 1\nprosa(2) }', 'GS0803'],
  ['vai_indo (trem i é 0; i menor_que 5; i mais 1) { prosa(i) }', 'GS0806'],
  ['trem i é 0\ni mais 1', 'GS0806'],
  ['tenta_aí { prosa(1) } se_der_ruim (erro) { prosa(erro) }', 'GS0807'],
  ['prosa(soma(1.000,50))', 'GS0805'],
  ['uai l é [1.000,50]', 'GS0805'],
  ['faz_trem f() { uai n é pergunta("x") }', 'GS0602'],
];

describe('avisos pedagógicos', () => {
  it.each(warned)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('sem falso positivo de GS0806 e GS0602', () => {
    expect(analyzeSource('uai a é 1\nprosa(a mais 1)').codes).toEqual([]);
    expect(analyzeSource('vai_na_frente faz_trem f() { uai n é pergunta("x") }').codes).toEqual([]);
    expect(analyzeSource('uai n é pergunta("x")').codes).toEqual([]);
    expect(analyzeSource('uai n é [1,2,3]\nprosa(Conta.maior(2,3))').codes).toEqual([]);
  });
  it('sem falso positivo dos demais avisos', () => {
    expect(analyzeSource('trem a é 1\nse_ocê_quiser (a é_igualim 2) { prosa(a) }').codes).toEqual([]);
    expect(analyzeSource('enquanto_tiver (certeza) { faz_trem f() { para_com_isso } }').codes).toEqual(['GS0802', 'GS0308']);
    expect(analyzeSource('enquanto_tiver (certeza) { enquanto_tiver (certeza) { para_com_isso } }').codes).toEqual(['GS0802']);
    expect(analyzeSource('faz_trem f() { enquanto_tiver (certeza) { faz_favor 1 } }').codes).toEqual([]);
    expect(analyzeSource('faz_trem f() { faz_favor g()\nfaz_trem g() { faz_favor 1 } }').codes).toEqual([]);
    expect(analyzeSource('tenta_aí { prosa(1) } se_der_ruim (erro) { prosa(erro.mensagem) }').codes).toEqual([]);
    expect(analyzeSource('prosa(1, 2.5)').codes).toEqual([]);
    expect(analyzeSource('uai t é "a"\nprosa(t.trocar("a", "US$$"))').codes).toEqual([]);
  });
  it('GS0801 diz em que construção apareceu', () => {
    expect(analyzeSource('trem a é 1\nse_ocê_quiser (a é 2) { prosa(a) }').analysis.diagnostics[0]?.args).toEqual({ construct: 'se_ocê_quiser' });
    expect(analyzeSource('uai l é [1]\nl.filtrar(n => n é 2)').analysis.diagnostics[0]?.args).toEqual({ construct: 'filtrar' });
  });
  it('GS0806 sugere a atribuição só para soma de nome', () => {
    expect(analyzeSource('trem i é 0\ni mais 1').analysis.diagnostics[0]?.args).toEqual({ suggestion: 'i é i mais 1' });
    expect(analyzeSource('trem i é 0\ni vezes 2').analysis.diagnostics[0]?.args).toEqual({ suggestion: 'i é i vezes 2' });
    expect(analyzeSource('trem i é 0\ni menos 1').analysis.diagnostics[0]?.args).toEqual({ suggestion: 'i é i menos 1' });
    expect(analyzeSource('trem i é 0\ni dividido 2').analysis.diagnostics[0]?.args).toEqual({ suggestion: 'i é i dividido 2' });
    expect(analyzeSource('trem i é 0\ni maior_que 2').analysis.diagnostics[0]?.args).toEqual({});
  });
  it('GS0801 cobre é como argumento direto de chamada', () => {
    expect(analyzeSource('trem a é 1\nprosa(a é 2)').analysis.diagnostics[0]).toMatchObject({ code: 'GS0801', args: { construct: 'prosa' } });
    expect(analyzeSource('uai l é [1]\nl.some(a é 2)').analysis.diagnostics.map((item) => item.code)).toContain('GS0801');
    expect(analyzeSource('trem a é 1\nprosa(a é_igualim 2)').codes).toEqual([]);
  });
  it('GS0805 traz o texto dos dois números', () => {
    expect(analyzeSource('prosa(1.000,50)').analysis.diagnostics[0]?.args).toEqual({ text: '1.000,50' });
  });
  it('GS0807 diz a função que recebeu o erro', () => {
    const { analysis } = analyzeSource('tenta_aí { prosa(1) } se_der_ruim (erro) { reclama(erro) }');
    expect(analysis.diagnostics[0]?.args).toEqual({ name: 'reclama' });
  });
  it('relançamento: vixe(erro) com o parâmetro do se_der_ruim entra em rethrowStatements', () => {
    const { analysis } = analyzeSource('tenta_aí { prosa(1) } se_der_ruim (erro) { vixe(erro) }');
    expect(analysis.rethrowStatements.size).toBe(1);
  });
  it('vixe com texto ou com outra variável não é relançamento', () => {
    expect(analyzeSource('vixe("a")').analysis.rethrowStatements.size).toBe(0);
    expect(analyzeSource('uai e é 1\ntenta_aí { prosa(1) } se_der_ruim (erro) { vixe(e) }').analysis.rethrowStatements.size).toBe(0);
  });
  it('await no topo e última expressão do topo são expostos para o rebaixamento', () => {
    const { analysis } = analyzeSource('uai a é 1\nespera_um_cadim a\na mais 1', { target: 'repl' });
    expect(analysis.hasTopLevelAwait).toBe(true);
    expect(analysis.lastTopLevelExpression?.type).toBe('ExpressionStatement');
  });
  it('await dentro de função assíncrona não conta como topo', () => {
    const { analysis } = analyzeSource('vai_na_frente faz_trem f() { espera_um_cadim cochila(1) }');
    expect(analysis.hasTopLevelAwait).toBe(false);
    expect(analysis.lastTopLevelExpression).toBeUndefined();
  });
});
