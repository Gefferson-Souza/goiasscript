import { defineConfig } from 'vitest/config';

const BUILD_TIMEOUT_MS = 120_000;

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: BUILD_TIMEOUT_MS,
    hookTimeout: BUILD_TIMEOUT_MS,
  },
});
