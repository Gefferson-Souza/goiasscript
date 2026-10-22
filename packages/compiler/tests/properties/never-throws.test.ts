import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { createSourceText } from '../../src/source/source-text.ts';

const TOKEN_TEXTS = ['uai', 'trem', 'é', 'faz_trem', 'se_ocê_quiser', 'mais', '(', ')', '{', '}', '[', ']', ',', '.', '=>', '"', "'", '/', '/*', '//', '\n', '\r\n', ' ', 'x', '1', '1.5', '`', '$', 'vixe', 'pergunta'];
const tokenSequence = fc.array(fc.constantFrom(...TOKEN_TEXTS), { maxLength: 60 }).map((parts) => parts.join(' '));

describe('nunca lança (a)', () => {
  it('lexer e compile aceitam string Unicode arbitrária', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (text) => {
      const lexer = createLexer(createSourceText(text, 'programa.gs'));
      for (let guard = 0; guard < text.length + 2; guard += 1) if (lexer.next().kind === 'end-of-file') break;
      expect(() => compile(text)).not.toThrow();
    }));
  });
  it('compile aceita sequências de tokens da tabela', () => {
    fc.assert(fc.property(tokenSequence, (text) => {
      expect(() => compile(text)).not.toThrow();
      expect(() => compile(text, { target: 'repl' })).not.toThrow();
    }));
  });
  it.each([
    ['parênteses', () => '('.repeat(100_000)],
    ['chaves', () => '{'.repeat(100_000)],
    ['soma encadeada', () => `1${' mais 1'.repeat(100_000)}`],
    ['cadeia de membros', () => `a${'.a'.repeat(100_000)}`],
    ['espaços', () => ' '.repeat(100_000)],
    ['10 mil linhas', () => 'prosa(1)\n'.repeat(10_000)],
  ])('entrada enorme: %s (Review Focus 4)', (_name, build) => {
    const result = compile(build());
    expect(result).toBeDefined();
    if (!result.ok) expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
