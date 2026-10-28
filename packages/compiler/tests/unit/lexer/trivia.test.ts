import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: trivia e quebras', () => {
  it('entrega um newline por intervalo, mesmo com linhas em branco e comentários', () => {
    expect(kindsOf('a\n\n  // x\n/* y */\nb')).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
  });
  it.each([['a\nb'], ['a\r\nb'], ['a\rb']])('trata %j como uma quebra só', (text) => {
    expect(kindsOf(text)).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
    expect(lexAll(text).tokens[2]?.precededByNewline).toBe(true);
    expect(lexAll(text).tokens[1]?.precededByNewline).toBe(false);
  });
  it('comentário de bloco com quebra conta como quebra; sem quebra, não', () => {
    const { tokens } = lexAll('a /* x\ny */ b');
    expect(tokens.map((token) => token.kind)).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
    expect([tokens[1]?.start, tokens[1]?.end, tokens[1]?.text]).toEqual([2, 11, '/* x\ny */']);
    expect(kindsOf('a /* x */ b')).toEqual(['identifier', 'identifier', 'end-of-file']);
  });
  it('anexa espaço e comentário ao token seguinte como trivia com posição', () => {
    const newline = lexAll('a  // oi\nb').tokens[1];
    expect(newline?.leadingTrivia).toEqual([
      { kind: 'whitespace', start: 1, end: 3, containsNewline: false },
      { kind: 'line-comment', start: 3, end: 8, containsNewline: false },
    ]);
  });
  it('junta linhas em branco e comentários do intervalo seguinte na trivia do token', () => {
    const token = lexAll('a\n\n// x\n /* y */ b').tokens[2];
    expect(token?.leadingTrivia.map((trivia) => [trivia.kind, trivia.containsNewline])).toEqual([
      ['whitespace', true], ['line-comment', false], ['whitespace', true], ['block-comment', false], ['whitespace', false],
    ]);
  });
  it('trata BOM no início como trivia e fora do início como GS0105', () => {
    const { tokens } = lexAll('\ufeffuai');
    expect([tokens[0]?.leadingTrivia[0]?.kind, tokens[0]?.start]).toEqual(['bom', 1]);
    expect(codesOf('uai \ufeff x')).toEqual(['GS0105']);
  });
  it('proíbe U+2028 e U+2029 em código e comentário', () => {
    expect(codesOf('uai\u2028x')).toEqual(['GS0105']);
    expect(codesOf('// a\u2029b')).toEqual(['GS0105']);
    expect(codesOf('/* a\u2028b */')).toEqual(['GS0105']);
    expect(kindsOf('uai\u2028x')).toEqual(['keyword', 'invalid', 'identifier', 'end-of-file']);
  });
  it('aceita NBSP e separadores de espaço do ECMA-262; outro caractere solto é GS0107', () => {
    expect(codesOf('a\u00a0b\u3000c\u2003d')).toEqual([]);
    expect(codesOf('a \u0001 b')).toEqual(['GS0107']);
  });
  it('comentário de bloco sem fechar é Invalid com GS0106', () => {
    expect(kindsOf('a /* x')).toEqual(['identifier', 'invalid', 'end-of-file']);
    expect(codesOf('a /* x')).toEqual(['GS0106']);
    expect(codesOf('a /* x *')).toEqual(['GS0106']);
  });
  it('termina em comentário de linha ou quebra no fim do texto', () => {
    expect(kindsOf('a //')).toEqual(['identifier', 'end-of-file']);
    expect(kindsOf('\n')).toEqual(['newline', 'end-of-file']);
  });
  it('o BOM inicial não conta como quebra de linha', () => {
    expect(lexAll('\ufeffuai').tokens[0]?.leadingTrivia).toEqual([{ kind: 'bom', start: 0, end: 1, containsNewline: false }]);
  });
  it('aponta U+2028 e U+2029 em comentários pela posição exata', () => {
    const spans = (text: string) => lexAll(text).diagnostics.map((item) => [item.code, item.start, item.end]);
    expect(spans('// a\u2029b')).toEqual([['GS0105', 4, 5]]);
    expect(spans('/* a\u2028b */')).toEqual([['GS0105', 4, 5]]);
  });
});
