import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { parseText } from '../../support/parse.ts';

const FUZZ_RUNS = 300;
const PIECES = [
  'uai', 'trem', 'é', 'faz_trem', 'faz_favor', 'se_ocê_quiser', 'se_não', 'tenta_aí', 'se_der_ruim', 'vai_na_frente', 'arruma_trem',
  'vai_indo', 'de', 'em', 'mais', 'menos', 'num_é', 'x', 'y', '1', '"a"', '=>', '(', ')', '[', ']', '{', '}', ',', ';', '.', ':', '\n', ' ', '/*', '`',
] as const;

describe('parser: robustez', () => {
  it('nunca lança, sempre termina e entrega diagnósticos ordenados, com pedaços de sintaxe embaralhados', () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...PIECES), { maxLength: 60 }), fc.constantFrom('module', 'repl', 'playground'), (parts, target) => {
        const result = parseText(parts.join(' '), target);
        const starts = result.diagnostics.map((diagnostic) => diagnostic.start);
        expect(starts).toEqual([...starts].sort((left, right) => left - right));
        walk(result.program, () => undefined);
      }),
      { numRuns: FUZZ_RUNS },
    );
  });
  it('nunca lança com strings Unicode arbitrárias', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (text) => parseText(text).program.end === text.length), { numRuns: FUZZ_RUNS });
  });
});
