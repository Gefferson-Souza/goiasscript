import { defineConfig } from 'vitest/config';

// O sandbox do Stryker fica dentro do pacote: testes que leem scripts e manifestos da raiz do repositório não resolvem lá.
export default defineConfig({
  test: {
    name: 'engoianador-api-mutation',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['test/check-worker-config.test.ts', 'test/verify-model.test.ts'],
  },
});
