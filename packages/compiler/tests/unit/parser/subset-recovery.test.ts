import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: recuperação dos diagnósticos de subconjunto', () => {
  it.each([
    ['uai a é b?.(1)', ['GS0523']],
    ['uai a é b?.[0]', ['GS0523']],
    ['uai a é ~b', ['GS0523']],
    ['++i', ['GS0404']],
    ['uai a é { ...b }', ['GS0504']],
    ['uai a é [...b, 1]', ['GS0504']],
    ['faz_trem soma(x: texto) { }', ['GS0516']],
    ['faz_trem soma(a: numero, b: numero): numero { }', ['GS0516', 'GS0516', 'GS0516']],
    ['arruma_trem A {\n  soma(a): numero { }\n}', ['GS0516']],
    ['faz_trem soma(a, b é 2) { }', ['GS0500']],
    ['faz_trem soma(a, b = 2) { }', ['GS0404', 'GS0500']],
    ['faz_trem soma(a, b é 2, ...resto) { }', ['GS0500', 'GS0504']],
    ['faz_trem soma(...resto) { }', ['GS0504']],
    ['uai a é #b', ['GS0510']],
    ['uai a é faz_trem soma(x) { }', ['GS0518']],
    ['with (o) { }', ['GS0500']],
    ['yield 1', ['GS0511']],
    ['uai a é 1, 2', ['GS0523']],
    ['mexe_assim x', ['GS0306']],
    ['uai x é new Erro("a")', ['GS0401']],
    ['uai x é this', ['GS0401']],
    ['uai x é a ? b', ['GS0523', 'GS0201']],
    ['uai x é a & b', ['GS0523']],
    ['uai x é 1 += 2', ['GS0209', 'GS0404']],
    ['arruma_trem A prosa(1)', ['GS0207']],
    ['arruma_trem A {\n  set x(v) { }\n  foo() { }\n}', ['GS0508']],
    ['arruma_trem A {\n  x\n}', ['GS0509']],
    ['arruma_trem A {\n  #x é 1\n}', ['GS0510']],
    ['uai o é { [k]: 1, f() { }, y }', ['GS0521', 'GS0520', 'GS0519']],
    ['uai o é { [k] }', ['GS0521']],
  ])('%j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('aceita o corpo na linha seguinte sem chaves e mantém Allman e o fim da entrada', () => {
    expect(codes(parseText('se_ocê_quiser (a)\n  prosa(a)'))).toEqual(['GS0207']);
    expect(codes(parseText('se_ocê_quiser (a)\n{\n}'))).toEqual([]);
    expect(codes(parseText('se_ocê_quiser (a) {', 'repl'))).toEqual(['GS0201']);
  });
  it('reconhece regex dentro de agrupamento depois de quebra de linha', () => {
    expect(codes(parseText('prosa(\n  /ab/g\n)'))).toEqual(['GS0502']);
    expect(codes(parseText('prosa(1,\n  /abc\n)'))).toContain('GS0502');
  });
  it('dá os argumentos da mensagem nos diagnósticos de JavaScript', () => {
    const word = parseText('const x é 1').diagnostics[0];
    expect(word).toMatchObject({ code: 'GS0401', args: { name: 'const', suggestion: 'uai' } });
    const operator = parseText('uai x = 1').diagnostics[0];
    expect(operator).toMatchObject({ code: 'GS0404', args: { name: '=', suggestion: 'é' } });
    expect(parseText('uai x é 2 ** 3').diagnostics[0]?.args.suggestion).toBe('Conta.elevado_a');
    expect(parseText('uai x é a ? b : c').diagnostics[0]).toMatchObject({ code: 'GS0523', args: { name: '?', suggestion: 'se_ocê_quiser' } });
    expect(parseText('uai preço é 10,50').diagnostics[0]).toMatchObject({ code: 'GS0208', args: { suggestion: '10.50' } });
  });
  it('não lança nem estoura a pilha com lixo de JavaScript aninhado', () => {
    const inputs = ['~'.repeat(100_000), 'typeof '.repeat(50_000), 'a ? '.repeat(50_000), '...'.repeat(30_000), '++'.repeat(30_000), '1,'.repeat(50_000)];
    for (const text of inputs) expect(() => parseText(text)).not.toThrow();
  });
  it('nunca lança com construções do JavaScript truncadas', () => {
    const texts = ['switch (', 'switch (x) {', 'do {', 'do { } while (', 'import', 'export', 'uai [', 'uai {', 'uai x:', 'x ?', 'x ? y :', 'a?.', '/', '/=', '#', 'vixe(', 'get', 'arruma_trem A { get x(', 'arruma_trem A { #'];
    for (const text of texts) expect(() => parseText(text)).not.toThrow();
  });
});
