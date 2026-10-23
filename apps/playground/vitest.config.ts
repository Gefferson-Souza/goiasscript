import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Vários testes sobem processos Node, e o runner Windows da CI leva mais de 5 s para isso.
const TEST_TIMEOUT_MS = 30_000;

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'node',
    css: false,
    testTimeout: TEST_TIMEOUT_MS,
    include: ['tests/**/*.test.ts'],
  },
});
