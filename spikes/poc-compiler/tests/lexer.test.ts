import { describe, expect, it } from 'vitest';
import { createLexer } from '../src/lexer.ts';
import type { Token } from '../src/token.types.ts';

function scanAll(text: string): { tokens: Token[]; codes: string[] } {
  const lexer = createLexer(text);
  const tokens: Token[] = [];
  for (let token = lexer.next(); token.kind !== 'end-of-file'; token = lexer.next()) tokens.push(token);
  return { tokens, codes: lexer.diagnostics.map((diagnostic) => diagnostic.code) };
}

const kinds = (text: string): string[] => scanAll(text).tokens.map((token) => token.kind);

describe('palavras', () => {
  it('separa keyword de identificador, marca a classe e aceita a variante sem acento', () => {
    const [uai, nome, de, plain, accented] = scanAll('uai nome de se_oce_quiser se_ocê_quiser').tokens;
    expect([uai?.keyword?.keywordClass, nome?.kind, de?.keyword?.keywordClass]).toEqual(['reserved', 'identifier', 'contextual']);
    expect(plain?.keyword).toBe(accented?.keyword);
  });

  it('normaliza para NFC mantendo texto e offsets originais; BOM não conta', () => {
    const { tokens } = scanAll('\uFEFFse_na\u0303o cafe\u0301 \u00E9');
    expect(tokens.map((t) => [t.kind, t.value])).toEqual([['keyword', 'se_não'], ['identifier', 'café'], ['keyword', 'é']]);
    expect(tokens[1]).toMatchObject({ start: 9, end: 14, text: 'café' });
  });

  it('aceita ç e acentos; $, emoji e outro alfabeto dão GS0104; @ dá GS0107', () => {
    expect(scanAll('preço ação').codes).toEqual([]);
    expect(['$x', '😀', 'α', '@'].map((text) => scanAll(text).codes)).toEqual([['GS0104'], ['GS0104'], ['GS0104'], ['GS0107']]);
  });
});

describe('quebras de linha e comentários', () => {
  it('um Newline por \\n, \\r\\n ou \\r; comentário de linha e de bloco sem quebra somem', () => {
    expect(kinds('a\nb\r\nc\rd')).toEqual(['identifier', 'newline', 'identifier', 'newline', 'identifier', 'newline', 'identifier']);
    expect(kinds('a // x\nb /* y */ c')).toEqual(['identifier', 'newline', 'identifier', 'identifier']);
  });

  it('comentário de bloco com quebra vira Newline; sem fechar dá GS0106', () => {
    expect(kinds('a /* x\ny */ b')).toEqual(['identifier', 'newline', 'identifier']);
    expect(scanAll('a /* x').codes).toEqual(['GS0106']);
  });
});

describe('números, textos e pontuação', () => {
  it.each(['12', '1.5', '1e3', '2.5e-2'])('aceita o número %s', (text) => {
    expect(scanAll(text)).toMatchObject({ tokens: [{ kind: 'number' }], codes: [] });
  });

  it.each(['08', '01310', '1.000.000'])('número malformado %s dá GS0101 e token invalid', (text) => {
    expect(scanAll(text)).toMatchObject({ tokens: [{ kind: 'invalid' }], codes: ['GS0101'] });
  });

  it('10,50 é número, vírgula e número; o operador mais longo vence e / é sempre divisão', () => {
    expect(kinds('10,50')).toEqual(['number', 'punctuator', 'number']);
    expect(scanAll('=== => && / /=').tokens.map((t) => t.text)).toEqual(['===', '=>', '&&', '/', '/=']);
  });

  it('texto com escape é um token só; sem fechar na linha dá GS0103 e o resto segue', () => {
    expect(scanAll(String.raw`"a\"b" 'c'`).tokens.map((t) => [t.kind, t.value])).toEqual([['string', String.raw`a\"b`], ['string', 'c']]);
    expect(scanAll('"abc\nuai')).toMatchObject({ codes: ['GS0103'], tokens: [{ kind: 'invalid' }, { kind: 'newline' }, { kind: 'keyword' }] });
  });
});

describe('contrato do Lexer', () => {
  it('peek não consome e next devolve end-of-file repetidamente', () => {
    const lexer = createLexer('a b');
    expect(lexer.peek(1).text).toBe('b');
    expect([lexer.next().text, lexer.next().text, lexer.next().kind, lexer.next().kind]).toEqual(['a', 'b', 'end-of-file', 'end-of-file']);
  });

  it('nunca lança com lixo de todo tipo, nem com 100 mil tokens de lookahead', () => {
    const palette = ['"', "'", '`', '/*', '//', '\\', '\r', '\n', ' ', '\ud800', '$', '0', '.', 'é', '(', '=>'];
    for (let seed = 0; seed < 100; seed += 1) {
      expect(() => scanAll(Array.from({ length: 12 }, (_, i) => palette[(seed * 7 + i * 13) % palette.length]).join(''))).not.toThrow();
    }
    expect(createLexer('('.repeat(100_000)).peek(99_999).text).toBe('(');
  });
});
