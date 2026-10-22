import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const statements = (text: string) => parseText(text).program.body.map((statement) => toSexp(statement));

describe('parser: fim de instrução (§4.6)', () => {
  it('a quebra termina a instrução simples e o ";" separa instruções na mesma linha', () => {
    expect(statements('uai a é 1\ntrem b é 2; trem c é 3')).toHaveLength(3);
  });
  it('callback em bloco dentro de chamada separa as instruções sem ";" (Review Focus 5)', () => {
    const result = parseText('lista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})\nprosa(2)');
    expect(codes(result)).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    const arrow = toSexp(result.program.body[0] ?? result.program);
    expect(arrow.match(/ExpressionStatement/gu)).toHaveLength(3);
  });
  it('callback em bloco dentro de lista e seta com bloco dentro de coisa de várias linhas', () => {
    expect(codes(parseText('uai fs é [x => {\n  prosa(1)\n  prosa(2)\n}]'))).toEqual([]);
    expect(codes(parseText('uai acoes é {\n  dobra: x => {\n    uai y é x\n    faz_favor y\n  },\n  triplo: 3\n}'))).toEqual([]);
  });
  it('ignora a quebra dentro de ( ), [ ] e coisa, e depois de operador, "é", vírgula, ponto, "(" e "=>"', () => {
    expect(codes(parseText('soma(1,\n  2)\nuai l é [1,\n2]\nuai a é 1 mais\n  2\nuai b é\n  3\nl\n  .mapear(x => x)'))).toEqual([]);
  });
  it('continua a linha quando a próxima começa com "."', () => {
    expect(statements('lista\n  .mapear(x => x)\n  .filtrar(x => x)')).toHaveLength(1);
  });
  it('aceita Allman em função, condicional, laço, classe e tenta_aí', () => {
    const text =
      'faz_trem f()\n{\n  faz_favor 1\n}\nse_ocê_quiser (certeza)\n{\n}\nenquanto_tiver (de_jeito_nenhum)\n{\n}\nvai_indo (trem i é 0; i menor_que 1; i é i mais 1)\n{\n}\narruma_trem A inherda_de B\n{\n}\ntenta_aí\n{\n}\nse_der_ruim (e)\n{\n}';
    expect(codes(parseText(text))).toEqual([]);
  });
  it('termina composta no "}" sem ";" e aceita "faz_trem soma(a, b) { faz_favor a mais b }" em uma linha', () => {
    expect(statements('faz_trem soma(a, b) { faz_favor a mais b }')).toHaveLength(1);
    expect(codes(parseText('uai o é { a: 1 }\n[1]\nuai f é x => { faz_favor x }\n(2)'))).toEqual([]);
  });
  it('faz_favor seguido de quebra devolve nada', () => {
    const result = parseText('faz_trem f() {\n  faz_favor\n  1\n}');
    expect(toSexp(result.program.body[0] ?? result.program)).toContain('ReturnStatement');
    expect(result.program.body).toHaveLength(1);
  });
  it('dá GS0202 quando a instrução simples não termina', () => {
    expect(codes(parseText('uai x é 1 2'))).toEqual(['GS0202']);
  });
});
