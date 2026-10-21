# ADR-0005: Toolchain

- Status: aceito em 2026-10-20; revisão em 2027-01-20

## Contexto

O typescript-eslint exige TypeScript < 6.1 e o TypeScript 7 não tem API JS para o ESLint.

## Decisão

TypeScript 6.0.3, ESLint 10.13.0, typescript-eslint 8.72.0, Vitest 5.0.5, pnpm 10.31.0 por corepack. Node ≥ 22.22.1 no desenvolvimento e ≥ 22.12 nos pacotes publicados. Versões exatas (`.npmrc` com `save-exact`). Cobertura de patch por `diff-cover` 10.6.0 sobre o lcov do Vitest.

## Consequências

Atualizar é decisão explícita, em PR próprio.

## Confirmação

`engines`, matriz de CI (spec §8.3) e a data de revisão.
