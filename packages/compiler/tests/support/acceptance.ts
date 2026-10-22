import fc from 'fast-check';
import { compile } from '../../src/compile.ts';
import { mutatedCorpus, programArbitrary } from './arbitraries.ts';
import { printProgram } from './gs-printer.ts';

const SAMPLE_SEED = 20_261_014;
const MUTATION_RUNS = 500;
const PROGRAM_RUNS = 300;

const rateOf = (texts: readonly string[]): number => texts.filter((text) => compile(text).ok).length / texts.length;

export function acceptanceRates(corpus: readonly string[]): { readonly mutation: number; readonly programs: number } {
  return {
    mutation: rateOf(fc.sample(mutatedCorpus(corpus), { numRuns: MUTATION_RUNS, seed: SAMPLE_SEED })),
    programs: rateOf(fc.sample(programArbitrary.map(printProgram), { numRuns: PROGRAM_RUNS, seed: SAMPLE_SEED })),
  };
}
