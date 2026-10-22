import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: diagnósticos de instrução', () => {
  it.each([
    ['uai f é x => { vixe("a") }', []],
    ['uai f é x => vixe("a")', ['GS0206']],
    ['uai a é b ou_então vixe("b")', ['GS0206']],
    ['vixe("a", "b")', ['GS0206']],
    ['vixe()', ['GS0206']],
    ['vixe("a") mais "b"', ['GS0206']],
    ['tenta_aí { } se_der_ruim (erro) { vixe(erro) }', []],
    ['vixe(faz_um Erro("a"))', []],
  ])('vixe: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it.each([
    ['se_ocê_quiser (a) prosa(a)', ['GS0207']],
    ['enquanto_tiver (a) a é a menos 1', ['GS0207']],
    ['vai_indo (uai x de l) prosa(x)', ['GS0207']],
    ['faz_trem f() faz_favor 1', ['GS0207']],
    ['tenta_aí prosa(1)', ['GS0207', 'GS0202']],
  ])('corpo sem chaves: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('mantém o corpo-expressão de seta sem chaves e dá a dica de parênteses no rótulo', () => {
    expect(codes(parseText('uai f é x => x vezes 2'))).toEqual([]);
    expect(codes(parseText('uai f é x => { nome: x }'))).toEqual(['GS0507']);
  });
  it.each([
    ['uai preço é 10,50', ['GS0208']],
    ['faz_trem f() { faz_favor 10,50 }', ['GS0208']],
    ['10,50', ['GS0208']],
    ['uai l é [1,2,3]\nsoma(2,3)\nuai pi é 3.141', []],
  ])('vírgula decimal: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('dá GS0209 para alvo de atribuição inválido e aceita nome e membro', () => {
    expect(codes(parseText('1 é x'))).toEqual(['GS0209']);
    expect(codes(parseText('f() é 2'))).toEqual(['GS0209']);
    expect(codes(parseText('ocê.campo é 1\nlista[0] é 2\nx é 3'))).toEqual([]);
  });
  it('dá GS0306 para palavra aposentada no início de instrução, sem reservá-la (P13)', () => {
    const result = parseText('presta_serviço soma(a, b) { faz_favor a mais b }');
    expect(result.diagnostics[0]).toMatchObject({ code: 'GS0306', args: { word: 'presta_serviço', replacement: 'faz_trem' } });
    expect(codes(parseText('uai vazio é 0'))).toEqual([]);
    expect(codes(parseText('uai se é 1'))).toEqual([]);
    expect(codes(parseText('uai lista é [1]'))).toEqual([]);
    expect(parseText('um_tanto_de x').diagnostics[0]).toMatchObject({ code: 'GS0306', args: { gone: 'saiu da linguagem, sem substituto na v3' } });
  });
  it('troca a instrução com palavra aposentada por nó de erro, para a análise não repetir o GS0306', () => {
    const { program } = parseText('presta_serviço soma(a, b) { faz_favor a mais b }');
    expect(program.body).toMatchObject([{ type: 'ErrorNode', code: 'GS0306' }]);
  });
  it('mantém a seta async e dá GS0518 para faz_trem sem nome como valor (P6)', () => {
    expect(codes(parseText('uai f é vai_na_frente x => x'))).toEqual([]);
    expect(codes(parseText('uai f é faz_trem() { }'))).toEqual(['GS0518']);
  });
});
