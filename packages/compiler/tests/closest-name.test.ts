import { describe, expect, it } from 'vitest';
import { closestName } from '../src/analyzer/name-checks.ts';

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
    expect(performance.now() - start).toBeLessThan(MAX_MILLISECONDS);
  });
});
