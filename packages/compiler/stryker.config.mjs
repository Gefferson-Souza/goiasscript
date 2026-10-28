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
  // O patch em patches/ roda só os arquivos afetados; `related` filtraria pelo grafo de importação e perderia testes.
  vitest: { related: false, configFile: 'vitest.mutation.config.ts' },
  // Mutantes de regex do lexer são equivalentes em massa e inflam a nota sem exercitar lógica.
  mutator: { excludedMutations: ['Regex'] },
};
