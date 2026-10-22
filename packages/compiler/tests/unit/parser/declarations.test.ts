import { describe, expect, it } from 'vitest';
import type { ClassDeclaration, Statement } from '../../../src/ast/ast.types.ts';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const first = (text: string): Statement => {
  const statement = parseText(text).program.body[0];
  if (statement === undefined) throw new Error('programa vazio');
  return statement;
};

describe('parser: declarações e classes', () => {
  it('lê classe com herança, construtor, método estático e método assíncrono', () => {
    const text = 'arruma_trem Pequi inherda_de Fruta {\n  aprepara_trem(n) { a_raiz(n) }\n  num_muda criar() { }\n  vai_na_frente busca() { }\n  mais() { }\n}';
    const result = parseText(text);
    expect(codes(result)).toEqual([]);
    const declaration = result.program.body[0] as ClassDeclaration;
    expect(declaration.body.map((method) => [method.key.name, method.kind, method.static, method.async])).toEqual([
      ['constructor', 'constructor', false, false],
      ['criar', 'method', true, false],
      ['busca', 'method', false, true],
      ['mais', 'method', false, false],
    ]);
  });
  it('guarda a keyword reservada em posição de nome para a análise dar GS0303', () => {
    const statement = first('uai mais é 1');
    expect(statement.type === 'VariableDeclaration' && statement.declarations[0]?.id.reservedKeyword?.js).toBe('+');
  });
  it('lê vixe com vários argumentos para a U2-06 diagnosticar a quantidade', () => {
    const statement = first('vixe("a", "b")');
    expect(statement.type === 'ThrowStatement' && statement.arguments).toHaveLength(2);
  });
  it('lê laços, tenta_aí completo e saltos', () => {
    const text =
      'vai_indo (uai x de lista) { continua_aí }\nenquanto_tiver (certeza) { para_com_isso }\ntenta_aí { } se_der_ruim (e) { } por_fim { }';
    const result = parseText(text);
    expect(codes(result)).toEqual([]);
    expect(result.program.body.map((statement) => statement.type)).toEqual(['ForOfStatement', 'WhileStatement', 'TryStatement']);
  });
  it('lê vai_indo clássico com partes vazias', () => {
    expect(toSexp(first('vai_indo (;;) { }'))).toBe('ForStatement(BlockStatement())');
  });
  it('lê faz_um sem argumentos e normaliza o nome em NFC', () => {
    expect(codes(parseText('uai p é faz_um Pequi'))).toEqual([]);
    const decomposed = 'uai café é 1';
    const statement = first(decomposed);
    expect(statement.type === 'VariableDeclaration' && statement.declarations[0]?.id.name).toBe('café');
  });
  it('mantém a posição de cada nó dentro do texto', () => {
    const statement = first('uai a é 1');
    expect([statement.start, statement.end]).toEqual([0, 9]);
  });
});
