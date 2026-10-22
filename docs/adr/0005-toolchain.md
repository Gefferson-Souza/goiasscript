# ADR-0005: Toolchain

- Status: aceito em 2026-10-20; revisão em 2027-01-20

## Contexto

O typescript-eslint exige TypeScript < 6.1 e o TypeScript 7 não tem API JS para o ESLint.

## Decisão

TypeScript 6.0.3, ESLint 10.13.0, typescript-eslint 8.72.0, Vitest 5.0.5, pnpm 10.31.0 por corepack. Node ≥ 22.22.1 no desenvolvimento e ≥ 22.12 nos pacotes publicados. Versões exatas (`.npmrc` com `save-exact`). Cobertura de patch por `diff-cover` 10.6.0 sobre o lcov do Vitest. `@jridgewell/trace-mapping` 0.3.31 (devDependency do compilador) é o oráculo dos testes de source map. `terser` 5.51.2 (dependência do `@goiasscript/optimizer`) é a única que entra no código distribuído do otimizador.

## Consequências

Atualizar é decisão explícita, em PR próprio.

## Confirmação

`engines`, matriz de CI (spec §8.3) e a data de revisão.

## Mutação (compilador)

`@stryker-mutator/core` 10.0.0, `@stryker-mutator/vitest-runner` 10.0.0 e `esbuild` 0.28.2 (medida do bundle brotli). O
`vitest-runner` leva um patch (`patches/@stryker-mutator__vitest-runner@10.0.0.patch`): roda os arquivos dos testes
afetados em vez de filtrar por nome, porque os títulos em português quebram o filtro por regex.

Desvios deliberados em `packages/compiler/stryker.config.mjs`: `mutator.excludedMutations: ['Regex']` (o limiar `break`
de 90 foi fixado com essa exclusão; a nota de 92,91 não conta mutantes de regex), `vitest.related: false` e
`disableTypeChecks: false`. O job `mutacao` de `.github/workflows/scheduled.yml` aplica o limiar semanalmente.
