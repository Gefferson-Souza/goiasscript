import { describe, expect, it } from 'vitest';
import config from '../stryker.config.mjs';
import mutationConfig from '../vitest.mutation.config.ts';

const MIN_MUTATION_TEST_TIMEOUT_MS = 30_000;

describe('stryker', () => {
  it('é incremental e cobre o núcleo', () => {
    expect(config.incremental).toBe(true);
    expect(config.mutate.some((glob) => glob.includes('src/parser'))).toBe(true);
  });
  it('depois do gate, break é numérico e positivo', () => {
    expect(typeof config.thresholds.break).toBe('number');
    expect(config.thresholds.break).toBeGreaterThan(0);
  });
  it('roda a suíte instrumentada com teto de tempo folgado e sem orçamento de relógio', () => {
    expect(config.vitest.configFile).toBe('vitest.mutation.config.ts');
    expect(mutationConfig.test?.testTimeout).toBeGreaterThanOrEqual(MIN_MUTATION_TEST_TIMEOUT_MS);
    expect(mutationConfig.test?.env?.['GS_TIMING_BUDGETS']).toBe('skip');
  });
});
