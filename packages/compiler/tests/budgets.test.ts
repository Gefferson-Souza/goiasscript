import { describe, expect, it } from 'vitest';
import { ABSOLUTE_BUDGETS, helperBytes, measureBudgets, readRatchets } from '../bench/budgets.ts';
import { compile } from '../src/compile.ts';
import { timingEnforced } from './support/timing.ts';

// A instrumentação de cobertura dobra o tempo: os tetos de tempo rodam no passo `budgets` do verify, sem cobertura.
const TIMING_TIMEOUT_MS = 60_000;
const timed = timingEnforced ? it : it.skip;

describe('orçamentos absolutos', () => {
  it('programa só nativo tem 0 bytes de runtime no alvo module', () => {
    const result = compile('uai l é [1, 2]\nprosa(l.mapear(x => x mais 1).ajunta(","))');
    if (!result.ok) throw new Error('esperava ok');
    expect(helperBytes(result)).toBeLessThanOrEqual(ABSOLUTE_BUDGETS.runtimeBytesNative);
    expect(result.helperRange).toBeNull();
  });
  timed('100 mil espaços compilam em menos de 100 ms', () => {
    const { pathologicalSpacesMs } = measureBudgets();
    expect(pathologicalSpacesMs).toBeLessThan(ABSOLUTE_BUDGETS.pathologicalSpacesMs);
  }, TIMING_TIMEOUT_MS);
  timed('compile() de 10 mil linhas cumpre o teto', () => {
    expect(measureBudgets().compile10kLinesMs).toBeLessThanOrEqual(ABSOLUTE_BUDGETS.compile10kLinesMs);
  }, TIMING_TIMEOUT_MS);
  it('100 mil parênteses não lançam nem estouram a pilha', () => {
    expect(() => compile('('.repeat(100_000))).not.toThrow();
  });
});

// A catraca relativa é medida pelo bench:check, que roda isolado; aqui a suíte disputa CPU e só valem os tetos absolutos.
describe('catracas relativas', () => {
  it('budgets.json tem as catracas de tempo e de tamanho numéricas depois do gate', () => {
    const ratchets = readRatchets();
    expect(typeof ratchets.compile10kLinesMs).toBe('number');
    expect(typeof ratchets.brotliBytes).toBe('number');
  });
});
