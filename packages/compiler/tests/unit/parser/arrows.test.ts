import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const arrowOf = (text: string) => {
  const statement = parseText(text).program.body[0];
  return statement?.type === 'VariableDeclaration' ? toSexp(statement) : 'não é declaração';
};

describe('parser: setas', () => {
  it('lê seta de um parâmetro, de vários, com corpo-expressão e com bloco', () => {
    expect(arrowOf('uai f é x => x vezes 2')).toContain('ArrowFunctionExpression');
    expect(codes(parseText('uai g é (a, b) => { faz_favor a mais b }\nuai h é () => 1\nuai i é (a, b,) => a'))).toEqual([]);
    expect(codes(parseText('uai j é x => ({ nome: x })'))).toEqual([]);
  });
  it('lê vai_na_frente antes de seta e de faz_trem nomeada', () => {
    expect(
      codes(
        parseText(
          'uai f é vai_na_frente x => x\nuai g é vai_na_frente (a, b) => { faz_favor a }\nvai_na_frente faz_trem h() { }\nvai_na_frente_faz_trem k() { }',
        ),
      ),
    ).toEqual([]);
    expect(arrowOf('uai f é vai_na_frente (a) => a')).toContain('ArrowFunctionExpression');
  });
  it('dá GS0204 para quebra entre parâmetros e "=>", dentro e fora de ( )', () => {
    expect(codes(parseText('uai f é x\n=> x'))).toEqual(['GS0204']);
    expect(codes(parseText('uai f é (a, b)\n=> a'))).toEqual(['GS0204']);
    expect(codes(parseText('prosa(x\n=> x)'))).toEqual(['GS0204']);
  });
  it('dá GS0202 para quebra entre vai_na_frente e o que vem depois', () => {
    expect(codes(parseText('vai_na_frente\nfaz_trem f() { }'))).toEqual(['GS0202']);
  });
  it('dá GS0202 para "5.com_casas(2)" (número literal seguido de ponto e nome)', () => {
    expect(codes(parseText('prosa(5.com_casas(2))'))).toEqual(['GS0202']);
    expect(codes(parseText('prosa((5).com_casas(2))'))).toEqual([]);
  });
});
