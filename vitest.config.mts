import { defineConfig } from 'vitest/config';

const COVERAGE_MINIMUM = 80;
const COVERAGE_RUN = process.argv.includes('--coverage');
const PLAYGROUND_COVERED = 'apps/playground/{config,lib,sandbox}/**/*.ts';
const WORKER_COVERED = 'apps/engoianador-api/src/**/*.ts';
const VSCODE_HOST_BOUND = ['packages/vscode/src/extension.ts', 'packages/vscode/src/host/vscode-host.ts'];
const PLAYGROUND_LEGACY = ['apps/playground/lib/share-image.ts'];
const perPackage = { lines: COVERAGE_MINIMUM, functions: COVERAGE_MINIMUM, branches: COVERAGE_MINIMUM, statements: COVERAGE_MINIMUM };

export default defineConfig({
  test: {
    projects: [
      'packages/language',
      // Os testes de tempo medem relógio: arquivos em paralelo sob cobertura geram falso positivo.
      { test: { name: 'compiler', root: 'packages/compiler', fileParallelism: false, env: { GS_TIMING_BUDGETS: COVERAGE_RUN ? 'skip' : 'enforce' } } },
      'packages/optimizer',
      'packages/cli',
      'packages/vscode',
      'apps/playground',
      'apps/engoianador-api',
      'tools/*',
    ],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['packages/*/src/**/*.ts', PLAYGROUND_COVERED, WORKER_COVERED],
      exclude: ['packages/cli/src/entry/**', ...VSCODE_HOST_BOUND, ...PLAYGROUND_LEGACY],
      thresholds: { 'packages/language/src/**': perPackage, 'packages/compiler/src/**': perPackage, 'packages/optimizer/src/**': perPackage, 'packages/cli/src/**': perPackage, 'packages/vscode/src/**': perPackage, [PLAYGROUND_COVERED]: perPackage },
    },
  },
});
