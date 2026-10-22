import { defineConfig } from 'vitest/config';

const COVERAGE_MINIMUM = 80;
const COVERAGE_RUN = process.argv.includes('--coverage');
const perPackage = { lines: COVERAGE_MINIMUM, functions: COVERAGE_MINIMUM, branches: COVERAGE_MINIMUM, statements: COVERAGE_MINIMUM };

export default defineConfig({
  test: {
    projects: [
      'packages/language',
      // Os testes de tempo medem relógio: arquivos em paralelo sob cobertura geram falso positivo.
      { test: { name: 'compiler', root: 'packages/compiler', fileParallelism: false, env: { GS_TIMING_BUDGETS: COVERAGE_RUN ? 'skip' : 'enforce' } } },
      'packages/optimizer',
      'packages/cli',
      'tools/*',
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/cli/src/entry/**'],
      thresholds: { 'packages/language/src/**': perPackage, 'packages/compiler/src/**': perPackage, 'packages/optimizer/src/**': perPackage, 'packages/cli/src/**': perPackage },
    },
  },
});
