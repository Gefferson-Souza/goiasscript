import { describe, expect, it } from 'vitest';
import { lexAll } from '../../support/lex.ts';

const spans = (text: string) => lexAll(text).diagnostics.map((item) => [item.code, item.start, item.end]);
const stringValue = (text: string) => lexAll(text).tokens[0]?.value;

describe('lexer: escapes de texto', () => {
  it.each([
    [String.raw`"\n"`, '\n'], [String.raw`"\r"`, '\r'], [String.raw`"\t"`, '\t'], [String.raw`"\b"`, '\b'], [String.raw`"\f"`, '\f'],
    [String.raw`"\v"`, '\v'], [String.raw`"\\"`, '\\'], [String.raw`"\'"`, "'"], [String.raw`"\""`, '"'], [String.raw`"\0"`, '\0'],
  ])('decodifica %s', (text, expected) => {
    expect(stringValue(text)).toBe(expected);
    expect(lexAll(text).diagnostics).toEqual([]);
  });

  it('aceita escape de caractere comum sem reclamar', () => {
    expect(lexAll(String.raw`"\q"`).diagnostics).toEqual([]);
    expect(stringValue(String.raw`"\q"`)).toBe('q');
  });

  it('aponta o separador proibido depois da barra invertida pela posição exata', () => {
    expect(spans('"a\\ b"')).toEqual([['GS0105', 3, 4]]);
  });

  it('aponta o separador proibido solto no texto pela posição exata', () => {
    expect(spans('"a b"')).toEqual([['GS0105', 2, 3]]);
  });

  it('descarta o escape inválido e segue com o que vem depois', () => {
    expect(stringValue(String.raw`"a\07b"`)).toBe('a7b');
    expect(stringValue(String.raw`"a\x4zb"`)).toBe('azb');
    expect(stringValue(String.raw`"a\u12zb"`)).toBe('azb');
    expect(spans(String.raw`"a\x4zb"`)).toEqual([['GS0102', 2, 5]]);
  });

  it('lê \\u{} com até seis dígitos e rejeita o sétimo', () => {
    expect(stringValue(String.raw`"\u{000041}"`)).toBe('A');
    expect(spans(String.raw`"\u{0000041}"`)).toEqual([['GS0102', 1, 12]]);
  });

  it('aceita o maior ponto de código e rejeita o seguinte', () => {
    expect(stringValue(String.raw`"\u{10FFFF}"`)).toBe('\u{10FFFF}');
    expect(spans(String.raw`"\u{110000}"`)).toEqual([['GS0102', 1, 11]]);
  });

  it('\\u{ sem chave de fechamento é inválido e não consome o próximo caractere', () => {
    expect(stringValue(String.raw`"\u{41x"`)).toBe('x');
    expect(spans(String.raw`"\u{41x"`)).toEqual([['GS0102', 1, 6]]);
  });

  it('barra invertida no fim do texto termina o token exatamente no fim', () => {
    const { tokens, diagnostics } = lexAll('"abc\\');
    expect(tokens[0]?.end).toBe(5);
    expect(diagnostics.map((item) => [item.code, item.start, item.end])).toEqual([['GS0103', 0, 5]]);
  });

  it('escape em fim de texto no meio de dígitos hexadecimais não quebra', () => {
    expect(spans(String.raw`"\x4`)).toEqual([['GS0102', 1, 4], ['GS0103', 0, 4]]);
  });
});
