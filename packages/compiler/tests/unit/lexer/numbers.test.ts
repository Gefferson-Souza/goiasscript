import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll, valuesOf } from '../../support/lex.ts';

describe('lexer: números', () => {
  it.each(['0', '12', '0.5', '1.5', '1e3', '1E-3', '1e+3', '3.141', '.5', '.25e2'])('aceita %s', (text) => {
    expect(codesOf(text)).toEqual([]);
    expect(valuesOf(text)).toEqual([text]);
  });
  it.each(['.5.5', '08', '01310', '00', '1.000.000', '1.2.3', '1e', '3x', '0x', '0b102', '1_', '1__0', '1e_5', '1e+_5', '1e5_', '1e5__0', '01n', '00n', '1_n'])('%s é Invalid com GS0101', (text) => {
    expect(kindsOf(text)).toEqual(['invalid', 'end-of-file']);
    expect(codesOf(text)).toEqual(['GS0101']);
  });
  it('lê 1.000 como um número só e deixa o "," para o parser (P12)', () => {
    expect(valuesOf('1.000,50')).toEqual(['1.000', ',', '50']);
  });
  it('só lê ponto seguido de dígito como número; ponto seguido de nome segue sendo membro', () => {
    expect(valuesOf('1e3 mais .5')).toEqual(['1e3', 'mais', '.5']);
    expect(valuesOf('lista.o_tanto')).toEqual(['lista', '.', 'o_tanto']);
    expect(valuesOf('...x')).toEqual(['...', 'x']);
  });
  it('mantém "5.com_casas" como número, ponto e nome (o GS0202 é do parser)', () => {
    expect(valuesOf('5.com_casas(2)')).toEqual(['5', '.', 'com_casas', '(', '2', ')']);
    expect(valuesOf('1.5.com_casas')).toEqual(['1.5', '.', 'com_casas']);
  });
  it('marca hexadecimal, octal, binário, BigInt e separador como formas próprias', () => {
    const forms = ['0xff', '0b1', '0o7', '10n', '1_000', '7'].map((text) => lexAll(text).tokens[0]?.numberForm);
    expect(forms).toEqual(['hex', 'binary', 'octal', 'bigint', 'separator', 'decimal']);
  });
  it('aponta o número inválido inteiro, até onde a palavra colada termina', () => {
    const { diagnostics } = lexAll('1e5_ x');
    expect(diagnostics.map((item) => [item.code, item.start, item.end])).toEqual([['GS0101', 0, 4]]);
  });
});
