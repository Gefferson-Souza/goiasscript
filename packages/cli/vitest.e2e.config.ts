import { defineConfig } from 'vitest/config';

const E2E_TIMEOUT_MS = 120_000;

export default defineConfig({
  test: {
    name: 'cli-e2e',
    include: ['tests/e2e/**/*.e2e.ts'],
    testTimeout: E2E_TIMEOUT_MS,
    hookTimeout: E2E_TIMEOUT_MS,
    fileParallelism: false,
  },
});
