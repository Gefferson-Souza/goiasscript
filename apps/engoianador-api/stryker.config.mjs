export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: ['src/**/*.ts', '!src/**/*.types.ts', '!src/**/*.constants.ts'],
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'json'],
  thresholds: { high: 90, low: 80, break: null },
  coverageAnalysis: 'perTest',
  disableTypeChecks: false,
  vitest: { related: false, configFile: 'vitest.mutation.config.ts' },
  // Mutantes de regex são equivalentes em massa e inflam a nota sem exercitar lógica.
  mutator: { excludedMutations: ['Regex'] },
};
