import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '<scratchpad>/audit/probes-apps/api',
  server: { fs: { strict: false } },
  test: { environment: 'node', include: ['probe.test.ts'], reporters: ['verbose'] },
});
