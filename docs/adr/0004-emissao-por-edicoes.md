# ADR-0004: Emissão por edições

- Status: proposto; a exceção depende da aprovação do dono (spec §10.3)

## Contexto

A emissão preserva linhas e o source map sai por token. Lexer, parser e analisador guardam estado mutável.

## Decisão

Lista imutável de edições, saída em módulo ES. A exceção de imutabilidade vale só para `this.*` em `packages/compiler/src/{lexer,parser,analyzer}` (`ignoreAccessorPattern: 'this.**'`). Parâmetro e AST seguem imutáveis.

Nos testes (`**/*.test.ts`, `**/tests/**/*.ts`) a regra `functional/immutable-data` fica desligada: acumular em array local e montar `error.stack` são o caminho direto para o teste. No código de produção a regra vale inteira.

## Consequências

Fora desses diretórios, `this.x = 1` é erro de lint.

## Confirmação

Fixtures de lint que passam e que falham em `tools/config-tests` (`eslint-matrix.test.mjs`).
