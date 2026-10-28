import { describe, expect, it } from 'vitest';
import { lexAll } from '../../support/lex.ts';

const BACKTICK_MARK = '¨';
const NESTING_LIMIT = 201;

const ticks = (text: string): string => text.replaceAll(BACKTICK_MARK, '`');
const wrap = (body: string): string => ticks(`¨\${ ${body} }¨`);

function expectWholeTemplate(source: string): void {
  const { tokens, diagnostics } = lexAll(source);
  expect(tokens.map((token) => [token.kind, token.text])).toEqual([['template', source], ['end-of-file', '']]);
  expect(diagnostics).toEqual([]);
}

function expectUnterminated(source: string): void {
  const { tokens, diagnostics } = lexAll(source);
  expect(tokens.map((token) => [token.kind, token.value])).toEqual([['invalid', source], ['end-of-file', '']]);
  expect(diagnostics.map((item) => [item.code, item.start, item.end])).toEqual([['GS0103', 0, source.length]]);
}

describe('lexer: expressões dentro de template', () => {
  describe('textos entre aspas dentro da expressão', () => {
    it.each([
      ["'}' ¨m¨"],
      ['"}" ¨m¨'],
      ["'a\\'}' ¨m¨"],
      ['"a\\"}" ¨m¨'],
      ['"\\\\" ¨m¨'],
      ['\'"}\' ¨m¨'],
      ['"\'}" ¨m¨'],
    ])('não deixa a chave de %s fechar a expressão', (body) => {
      expectWholeTemplate(wrap(ticks(body)));
    });
  });

  describe('comentários dentro da expressão', () => {
    it.each([
      ['comentário de linha com chave', 'x // }\n ¨m¨'],
      ['comentário de linha logo após quebra', '\n// }\n ¨m¨'],
      ['comentário de linha terminado por CR', 'x // }\r ¨m¨'],
      ['comentário de bloco com chave', '/* } */ ¨m¨'],
      ['comentário de bloco colado a outro', '/* a *//* } */ ¨m¨'],
      ['comentário de bloco vazio', '/**/ ¨m¨'],
      ['comentário de bloco com várias chaves', '/* a } b } c */ ¨m¨'],
      ['comentário de bloco com quebra', '/* \n } */ ¨m¨'],
    ])('%s não fecha a expressão', (_title, body) => {
      expectWholeTemplate(wrap(body));
    });
  });

  describe('barra como divisão', () => {
    it.each([
      ['x / 2'], ['7 / 2'], ['x$ / 2'], ['(x) / 2'], ['[1] / 2'], ['{} / 2'], ['x\n\t/ 2'], ['x/2'], ['café / 2'], ['a_ / 2'],
    ])('depois de operando, %j é divisão', (body) => {
      expectWholeTemplate(ticks(`¨\${ ${body} } / ¨`));
    });
  });

  describe('barra como regex', () => {
    it.each([
      ['/¨/ ¨m¨'],
      ['\n\t /¨/ ¨m¨'],
      ['= /¨/ ¨m¨'],
      ['( /¨/ ) ¨m¨'],
      [', /¨/ ¨m¨'],
      ['[ /¨/ ] ¨m¨'],
      ['{ a: /¨/ } ¨m¨'],
      ['! /¨/ ¨m¨'],
      ['&& /¨/ ¨m¨'],
      ['= /\\/¨/ ¨m¨'],
      ['= /[/¨]/ ¨m¨'],
      ['= /[\\]/¨]/ ¨m¨'],
      ['= /[a]¨/ ¨m¨'],
      ['= /\\\\/ ¨m¨'],
      ['= /a/gi ¨m¨'],
      ['= /a¨/ ¨m¨'],
      ['= /ab¨/ ¨m¨'],
      ['[/}/, ¨a¨]'],
    ])('depois de operador, %j abre regex', (body) => {
      expectWholeTemplate(wrap(ticks(body)));
    });
    it('regex sem fechar na linha deixa a barra solta e segue o código', () => {
      expectWholeTemplate(ticks('¨${ /ab\n }/ ¨'));
    });
  });

  describe('chaves e aninhamento', () => {
    it.each([['{a:1}, ¨x¨'], ['{a:{b:1}} ¨m¨'], ['¨a${ ¨b¨ }¨ ¨m¨']])('mantém a conta de chaves em %s', (body) => {
      expectWholeTemplate(wrap(ticks(body)));
    });
    it('cifrão sem chave é texto e não abre expressão', () => {
      expectWholeTemplate('`$a`');
      expectWholeTemplate('`a$`');
      expectWholeTemplate('`$ {x} ${1}`');
    });
    it('aceita aninhamento até o limite e rejeita o seguinte', () => {
      const nest = (levels: number): string => '`${'.repeat(levels) + '1' + '}`'.repeat(levels);
      expectWholeTemplate(nest(NESTING_LIMIT));
      expect(lexAll(nest(NESTING_LIMIT + 1)).diagnostics.map((item) => item.code)).toEqual(['GS0103']);
    });
  });

  describe('template sem fechar', () => {
    it.each([
      ['`abc'], ['`${ x'], ['`${ // x'], ['`${ /* x'], ['`${ "x'], ["`${ 'x\\"], ['`${ /ab'], ['`${ ¨x'], ['`${ "x }`'], ['`${ {a} '],
    ])('%s vira um token inválido até o fim', (source) => {
      expectUnterminated(ticks(source));
    });
  });

  it('o valor do template é só o trecho entre as crases, com o que vem antes e depois fora', () => {
    const { tokens } = lexAll('x `a${1}` y');
    expect(tokens.map((token) => [token.kind, token.value])).toEqual([['identifier', 'x'], ['template', '`a${1}`'], ['identifier', 'y'], ['end-of-file', '']]);
  });

  it('o template sem fechar leva só o trecho a partir da crase no valor do token inválido', () => {
    const { tokens } = lexAll('x `abc');
    expect(tokens.map((token) => [token.kind, token.value])).toEqual([['identifier', 'x'], ['invalid', '`abc'], ['end-of-file', '']]);
  });

  it('aponta o separador proibido dentro do template pela posição exata', () => {
    const { tokens, diagnostics } = lexAll('`a b `');
    expect(tokens[0]?.kind).toBe('template');
    expect(diagnostics.map((item) => [item.code, item.start, item.end])).toEqual([['GS0105', 2, 3], ['GS0105', 4, 5]]);
  });

  it('pula o caractere depois da barra invertida no texto do template', () => {
    expectWholeTemplate('`a\\`b\\\\`');
  });
});
