import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lexAll } from '../../support/lex.ts';
import { expectWithinBudget } from '../../support/timing.ts';

const MAX_MILLISECONDS = 1500;
const REPETITIONS = 100_000;
const FUZZ_RUNS = 300;

const elapsedFor = (text: string): number => {
  const started = performance.now();
  lexAll(text);
  return performance.now() - started;
};

describe('lexer: robustez', () => {
  it('nunca lança, com strings Unicode arbitrárias, e sempre termina em end-of-file', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (text) => {
      const { tokens } = lexAll(text);
      expect(tokens.at(-1)?.kind).toBe('end-of-file');
    }), { numRuns: FUZZ_RUNS });
  });
  it('nunca lança com pedaços de sintaxe embaralhados', () => {
    const pieces = fc.constantFrom('"', "'", '`', '${', '}', '/*', '*/', '//', '\\', '\n', '\r\n', '1', '.', 'e', '0x', '_', '$', 'uai', '\u2028', '\ufeff', '😀', ' ');
    fc.assert(fc.property(fc.array(pieces, { maxLength: 40 }), (parts) => {
      expect(lexAll(parts.join('')).tokens.at(-1)?.kind).toBe('end-of-file');
    }), { numRuns: FUZZ_RUNS });
  });
  it('cobre o texto sem buracos: cada token começa depois do anterior', () => {
    fc.assert(fc.property(fc.string(), (text) => {
      const { tokens } = lexAll(text);
      expect(tokens.every((token, index) => index === 0 || token.start >= (tokens[index - 1]?.end ?? 0))).toBe(true);
    }), { numRuns: FUZZ_RUNS });
  });
  it.each([
    ['espaços', ' '],
    ['parênteses', '('],
    ['linhas', 'prosa(1)\n'],
    ['linhas em branco', '\n'],
    ['comentários de bloco', '/**/'],
    ['caracteres desconhecidos', '@'],
    ['palavras', 'a '],
    ['números', '1 '],
    ['textos sem fechar', '"\n'],
    ['textos', '"a" '],
  ])('lê 100 mil repetições de %s em tempo linear', (_name, unit) => {
    expectWithinBudget(elapsedFor(unit.repeat(REPETITIONS)), MAX_MILLISECONDS);
  });
  it('junta 100 mil espaços em uma trivia só', () => {
    const { tokens } = lexAll(' '.repeat(REPETITIONS));
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.leadingTrivia).toHaveLength(1);
  });
  it('lê um texto enorme com muitos templates e aspas desencontradas', () => {
    expectWithinBudget(elapsedFor('`${"'.repeat(REPETITIONS)), MAX_MILLISECONDS);
  });
});
