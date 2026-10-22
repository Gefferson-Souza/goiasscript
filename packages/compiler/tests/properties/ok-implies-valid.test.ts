import { parse as acornParse } from 'acorn';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';
import { acceptanceRates } from '../support/acceptance.ts';
import { mutatedCorpus, programArbitrary } from '../support/arbitraries.ts';
import { readCorpus } from '../support/corpus.ts';
import { printProgram } from '../support/gs-printer.ts';

const CORPUS = readCorpus();
const ACCEPTANCE_FLOOR = 0.05;
const MUTATION_RUNS = 500;
const PROGRAM_RUNS = 300;

function expectValidWhenOk(text: string): void {
  const result = compile(text);
  if (result.ok) expect(() => acornParse(result.code, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
}

describe('ok implica JS válido (b)', () => {
  it('mutação do corpus', () => {
    fc.assert(fc.property(mutatedCorpus(CORPUS), expectValidWhenOk), { numRuns: MUTATION_RUNS });
  });
  it('AST arbitrária impressa em .gs', () => {
    fc.assert(fc.property(programArbitrary, (program) => { expectValidWhenOk(printProgram(program)); }), { numRuns: PROGRAM_RUNS });
  });
  it('a geração aceita uma fração mínima, para o teste não passar sem exercitar o JS emitido', () => {
    const rates = acceptanceRates(CORPUS);
    expect(rates.mutation).toBeGreaterThanOrEqual(ACCEPTANCE_FLOOR);
    expect(rates.programs).toBeGreaterThanOrEqual(ACCEPTANCE_FLOOR);
  });
});
