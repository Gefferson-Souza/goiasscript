import { describe, expect, it } from 'vitest';
import { createLexer } from '../../../src/lexer/lexer.ts';
import { createSourceText } from '../../../src/source/source-text.ts';
import { codesOf, valuesOf } from '../../support/lex.ts';

const lexerFor = (text: string) => createLexer(createSourceText(text, 't.gs'));

describe('lexer: pontuação', () => {
  it('lê por maior casamento os operadores do JS que a v3 recusa', () => {
    expect(valuesOf('=== !== == != && || ?? ?. ** ++ -- += >>> ...')).toEqual(['===', '!==', '==', '!=', '&&', '||', '??', '?.', '**', '++', '--', '+=', '>>>', '...']);
    expect(valuesOf('=> ( ) [ ] { } , . ; : < > <= >= + - * / % # ?')).toHaveLength(22);
  });
  it('junta operador colado pelo maior casamento', () => {
    expect(valuesOf('a>>>=b')).toEqual(['a', '>>>=', 'b']);
    expect(valuesOf('x=>{}')).toEqual(['x', '=>', '{', '}']);
  });
  it('trata "/" como divisão, inclusive "/="', () => {
    expect(valuesOf('a / b / c')).toEqual(['a', '/', 'b', '/', 'c']);
    expect(valuesOf('a /= 2')).toEqual(['a', '/=', '2']);
  });
});

describe('lexer: rescanAsRegex', () => {
  it('relê /ab+/g como um token e descarta o que já tinha lido adiante', () => {
    const lexer = lexerFor('/"/g mais 1');
    const slash = lexer.peek();
    lexer.peek(3);
    const regex = lexer.rescanAsRegex(slash);
    expect([regex.kind, regex.text]).toEqual(['invalid', '/"/g']);
    expect(lexer.diagnostics).toEqual([]);
    expect(lexer.next().text).toBe('mais');
  });
  it('respeita \\/ e classes [..] e entende /=abc/', () => {
    const escaped = lexerFor(String.raw`/a\//`);
    expect(escaped.rescanAsRegex(escaped.peek()).text).toBe(String.raw`/a\//`);
    const lexer = lexerFor('/[/]x/ y');
    expect(lexer.rescanAsRegex(lexer.peek()).text).toBe('/[/]x/');
    const equals = lexerFor('/=abc/');
    expect(equals.rescanAsRegex(equals.peek()).text).toBe('/=abc/');
  });
  it('sem "/" de fechamento na linha cobre só a "/" e segue no newline', () => {
    const lexer = lexerFor('/abc\nx');
    const regex = lexer.rescanAsRegex(lexer.peek());
    expect(regex.text).toBe('/');
    expect(lexer.next().text).toBe('abc');
  });
  it('mantém os diagnósticos anteriores à regex e não gera os de aspas dentro dela', () => {
    expect(codesOf('/"/')).toContain('GS0103');
    const lexer = lexerFor('@ /"/');
    lexer.next();
    lexer.rescanAsRegex(lexer.peek());
    expect(lexer.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(['GS0107']);
  });
  it('depois da regex a precedência de newline recomeça do zero', () => {
    const lexer = lexerFor('/a/\nb');
    lexer.rescanAsRegex(lexer.peek());
    expect([lexer.next().kind, lexer.next().kind]).toEqual(['newline', 'identifier']);
  });
});
