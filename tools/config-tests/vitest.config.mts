import { defineConfig } from 'vitest/config';

// A primeira execução do ESLint com regras que usam tipos leva vários segundos no runner do CI.
const SLOW_TOOLING_TIMEOUT_MS = 60_000;

export default defineConfig({ test: { testTimeout: SLOW_TOOLING_TIMEOUT_MS, hookTimeout: SLOW_TOOLING_TIMEOUT_MS } });
