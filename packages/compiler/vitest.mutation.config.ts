import { defineConfig } from 'vitest/config';

const MUTATION_TEST_TIMEOUT_MS = 60_000;

// A suíte instrumentada roda várias vezes mais devagar; com o teto padrão de 5 s, os testes de escala abortam a rodada inicial.
export default defineConfig({
  test: {
    name: 'compiler-mutation',
    testTimeout: MUTATION_TEST_TIMEOUT_MS,
    hookTimeout: MUTATION_TEST_TIMEOUT_MS,
    env: { GS_TIMING_BUDGETS: 'skip' },
  },
});
