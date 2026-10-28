import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: palavras', () => {
  it('separa keyword de identificador pela tabela, sem decidir a posição', () => {
    const { tokens } = lexAll('uai de total');
    expect(tokens.map((token) => [token.kind, token.keyword?.js])).toEqual([['keyword', 'const'], ['keyword', 'of'], ['identifier', undefined], ['end-of-file', undefined]]);
  });
  it('reconhece a variante sem acento e a keyword em NFD', () => {
    expect(lexAll('se_oce_quiser').tokens[0]?.keyword?.js).toBe('if');
    expect(lexAll('se_no\u0302').tokens[0]?.kind).toBe('identifier');
    expect(lexAll('se_nao\u0301').tokens[0]?.kind).toBe('identifier');
    expect(lexAll('oce\u0302').tokens[0]?.keyword?.js).toBe('this');
    expect(lexAll('se_na\u0303o').tokens[0]?.keyword?.js).toBe('else');
    expect(lexAll('se_não').tokens[0]?.keyword?.js).toBe('else');
  });
  it('normaliza identificador para NFC e preserva o texto original', () => {
    const token = lexAll('cafe\u0301').tokens[0];
    expect([token?.value, token?.text, token?.end]).toEqual(['café', 'cafe\u0301', 5]);
  });
  it.each([['uai $x é 1', 'GS0104'], ['uai αβ é 1', 'GS0104'], ['uai 😀 é 1', 'GS0104'], ['uai x é 1 @', 'GS0107']])('%s dá %s', (text, code) => {
    expect(codesOf(text)).toEqual([code]);
  });
  it('transforma palavra fora do alfabeto em um token invalid só', () => {
    expect(kindsOf('$x')).toEqual(['invalid', 'end-of-file']);
  });
  it('DEL (U+007F) não é letra de palavra e vira caractere inesperado isolado', () => {
    const { tokens, diagnostics } = lexAll('x\u007fy');
    expect(tokens.map((token) => [token.kind, token.text])).toEqual([['identifier', 'x'], ['invalid', '\u007f'], ['identifier', 'y'], ['end-of-file', '']]);
    expect(diagnostics.map((item) => item.code)).toEqual(['GS0107']);
  });
  it('informa o caractere inesperado, inclusive fora do plano básico', () => {
    expect(lexAll('@').diagnostics[0]?.args).toEqual({ character: '@' });
    expect(lexAll('\u{1F600}').diagnostics[0]?.args).toEqual({ character: '😀' });
  });
  it('informa o primeiro caractere inválido do nome, mesmo depois de letras válidas', () => {
    expect(lexAll('ab$cd').diagnostics[0]?.args).toEqual({ character: '$' });
    expect(lexAll('xα').diagnostics[0]?.args).toEqual({ character: 'α' });
    expect(lexAll('$x').diagnostics[0]?.args).toEqual({ character: '$' });
  });
});
