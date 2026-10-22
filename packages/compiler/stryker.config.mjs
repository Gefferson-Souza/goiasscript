export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: ['src/lexer/**/*.ts', 'src/parser/**/*.ts', 'src/analyzer/**/*.ts', 'src/lowering/**/*.ts', 'src/sourcemap/**/*.ts', '!src/**/*.types.ts', '!src/**/*.constants.ts'],
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'json'],
  thresholds: { high: 90, low: 80, break: 90 },
  coverageAnalysis: 'perTest',
  disableTypeChecks: false,
  vitest: { related: false },
  mutator: { excludedMutations: ['Regex'] },
};
