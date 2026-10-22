import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const expressionOf = (text: string) => {
  const statement = parseText(text).program.body[0];
  return statement?.type === 'ExpressionStatement' ? toSexp(statement.expression) : 'não é expressão';
};

describe('parser: expressões (Pratt)', () => {
  it.each([
    ['a mais b vezes c', 'BinaryExpression[+](a, BinaryExpression[*](b, c))'],
    ['a vezes b mais c', 'BinaryExpression[+](BinaryExpression[*](a, b), c)'],
    ['a menos b menos c', 'BinaryExpression[-](BinaryExpression[-](a, b), c)'],
    ['a + b * c', 'BinaryExpression[+](a, BinaryExpression[*](b, c))'],
    ['a menor_que b e_mais c é_igualim d', 'LogicalExpression[&&](BinaryExpression[<](a, b), BinaryExpression[===](c, d))'],
    ['a ou_então b e_mais c', 'LogicalExpression[||](a, LogicalExpression[&&](b, c))'],
    ['num_é a é_igualim b', 'BinaryExpression[===](UnaryExpression[!](a), b)'],
    ['menos a vezes b', 'BinaryExpression[*](UnaryExpression[-](a), b)'],
    ['a é b é c', 'AssignmentExpression[=](a, AssignmentExpression[=](b, c))'],
    ['x é_tipo_de Pequi', 'BinaryExpression[instanceof](x, Pequi)'],
    ['a.b(c)[d].e', 'MemberExpression(MemberExpression(CallExpression(MemberExpression(a, b), c), d), e)'],
    ['faz_um Pequi("verde").nome', 'MemberExpression(NewExpression(Pequi, "verde"), nome)'],
    ['espera_um_cadim f(x) mais 1', 'BinaryExpression[+](AwaitExpression(CallExpression(f, x)), 1)'],
  ])('%s', (text, expected) => {
    expect(expressionOf(text)).toBe(expected);
  });
  it('aceita palavra goiana como nome de propriedade e de chave, preservando a grafia', () => {
    expect(codes(parseText('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)'))).toEqual([]);
    expect(expressionOf('obj.mais')).toBe('MemberExpression(obj, mais)');
  });
  it('trata "de" e "em" como identificadores fora do cabeçalho do vai_indo', () => {
    expect(codes(parseText('uai de é 1\nuai em é 5\nvai_indo (uai x de de) { }\nvai_indo (uai k em em) { }'))).toEqual([]);
  });
  it('aceita vírgula final em lista, coisa, parâmetros e argumentos', () => {
    expect(codes(parseText('uai l é [1, 2,]\nuai o é { a: 1, }\nfaz_trem f(a, b,) { }\nf(1, 2,)'))).toEqual([]);
  });
});
