import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: textos', () => {
  it('decodifica os escapes do JS estrito', () => {
    const decoded = lexAll(String.raw`"a\n\t\\\"\x41\u0042\u{1F600}\0\q"`).tokens[0]?.value;
    expect(decoded).toBe('a\n\t\\"AB😀\u0000q');
  });
  it('aceita aspas simples e preserva o texto original', () => {
    const token = lexAll(String.raw`'it\'s'`).tokens[0];
    expect([token?.kind, token?.value, token?.text]).toEqual(['string', "it's", String.raw`'it\'s'`]);
  });
  it.each([String.raw`"\07"`, String.raw`"\1"`, String.raw`"\8"`, String.raw`"\x4"`, String.raw`"\u12"`, String.raw`"\u{110000}"`, String.raw`"\u{}"`])('%s é GS0102 e segue como texto', (text) => {
    expect(codesOf(text)).toEqual(['GS0102']);
    expect(kindsOf(text)).toEqual(['string', 'end-of-file']);
  });
  it('texto sem fechar na linha é Invalid com GS0103 e o resto da linha some', () => {
    expect(kindsOf('"oi\nprosa(1)')).toEqual(['invalid', 'newline', 'identifier', 'punctuator', 'number', 'punctuator', 'end-of-file']);
    expect(codesOf('"oi')).toEqual(['GS0103']);
    expect(codesOf('"a\\\nb"')).toContain('GS0102');
    expect(codesOf('"abc\\')).toEqual(['GS0103']);
  });
  it('U+2028 e U+2029 dentro de texto dão GS0105 sem interromper o texto', () => {
    expect(codesOf('"a\u2028b"')).toEqual(['GS0105']);
    expect(kindsOf('"a\u2029b"')).toEqual(['string', 'end-of-file']);
    expect(codesOf('"a\\\u2028b"')).toEqual(['GS0105']);
  });
  it('escape de par substituto devolve o caractere inteiro', () => {
    expect(lexAll('"\\😀"').tokens[0]?.value).toBe('😀');
  });
  it('template é um token só, com ${} aninhado, e sem fechar é Invalid GS0103 até o fim', () => {
    expect(kindsOf('`a ${"}" mais `b ${1}`} c`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`a \\` ${\'}\\\'\'} b`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`abc')).toEqual(['invalid', 'end-of-file']);
    expect(codesOf('`abc')).toEqual(['GS0103']);
    expect(codesOf('`a ${ {x} ')).toEqual(['GS0103']);
    expect(codesOf('`a ${"x} `')).toEqual(['GS0103']);
  });
  it('chave dentro de comentário ou regex na expressão não fecha o ${}', () => {
    expect(kindsOf('`a ${ /* } */ 1 } b`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`a ${ 1 // }\n } b`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`a ${ /}/.test(x) } b`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`a ${ x / 2 } b ${ y }`')).toEqual(['template', 'end-of-file']);
    expect(lexAll('`a ${ /* } */ 1 } b` 2').tokens[0]?.text).toBe('`a ${ /* } */ 1 } b`');
  });
  it('template aceita aninhamento real próximo do limite', () => {
    const depth = 150;
    const nested = '`${'.repeat(depth) + '1' + '}`'.repeat(depth);
    expect(kindsOf(nested)).toEqual(['template', 'end-of-file']);
  });
  it('U+2028 e U+2029 dentro de template dão GS0105 sem interromper o token', () => {
    expect(codesOf('`a\u2028b`')).toEqual(['GS0105']);
    expect(kindsOf('`a\u2029b`')).toEqual(['template', 'end-of-file']);
  });
  it('template com aninhamento patológico vira GS0103 sem estourar a pilha', () => {
    const nested = '`${'.repeat(100_000);
    expect(codesOf(nested)).toEqual(['GS0103']);
  });
});
