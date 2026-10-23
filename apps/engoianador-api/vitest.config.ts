import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'engoianador-api',
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
