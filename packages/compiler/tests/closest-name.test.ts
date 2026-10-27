import { describe, expect, it } from 'vitest';
import { closestName } from '../src/analyzer/name-checks.ts';
import { expectWithinBudget } from './support/timing.ts';

const HUGE_NAME_LENGTH = 1_000_000;
const MAX_MILLISECONDS = 500;

describe('closestName', () => {
  it('sugere o candidato mais próximo dentro da distância máxima', () => {
    expect(closestName('nomi', ['nome', 'idade'])).toBe('nome');
    expect(closestName('zzzzzz', ['nome', 'idade'])).toBeUndefined();
  });
  it('nome gigantesco não custa tempo e não gera sugestão', () => {
    const start = performance.now();
    expect(closestName('a'.repeat(HUGE_NAME_LENGTH), ['nome', 'idade'])).toBeUndefined();
    expectWithinBudget(performance.now() - start, MAX_MILLISECONDS);
  });
  it('nome gigante contra candidato de tamanho parecido também não custa tempo', () => {
    const candidate = 'b'.repeat(HUGE_NAME_LENGTH);
    const start = performance.now();
    expect(closestName('a'.repeat(HUGE_NAME_LENGTH), [candidate])).toBeUndefined();
    expectWithinBudget(performance.now() - start, MAX_MILLISECONDS);
  });
});
