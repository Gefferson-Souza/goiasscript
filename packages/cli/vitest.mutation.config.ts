import { defineConfig } from 'vitest/config';

// O sandbox do Stryker fica dentro do pacote: testes que leem scripts e manifestos da raiz do repositório não resolvem lá.
export default defineConfig({
  test: {
    name: 'cli-mutation',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'tests/package-layout.test.ts', 'tests/cli-declarations.test.ts', 'tests/release-target.test.ts', 'tests/pnpm-invocation.test.ts'],
  },
});
