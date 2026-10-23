# CLAUDE.md

GoiásScript 3 é uma linguagem educacional em goianês que compila para JavaScript; ela não é JavaScript. O design aprovado está em `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md`; a gramática, a referência e a migração estão em `docs/spec`.

## O que a v3 é e o que fica de fora

- Lexer e parser escritos à mão, análise de mundo fechado, emissão por edições que preserva as linhas do `.gs`, zero runtime para programa só com operações nativas.
- Fora da v3: módulos, sistema de tipos, balaios, debugger, LSP separado, interop com JavaScript nativo e IR própria (ADR-0010). Item novo só entra por RFC (modelo em `docs/rfc/rfc.md`).
- As decisões de arquitetura estão nos ADRs de `docs/adr/`; consulte lá em vez de copiar o conteúdo. O vocabulário aprovado está na RFC `docs/rfc/0001-vocabulario-e-biblioteca.md` e no travamento `docs/spec/vocabulario.lock.json`.

## Onde está cada coisa

- `packages/language`: tabelas de vocabulário, geradores e diagnósticos. `packages/compiler`: lexer, parser, análise e emissão. `packages/optimizer`: otimizações opcionais. Nessa ordem de camadas; `language` e `compiler` não importam `node:*`, e o compilador não tem dependência de runtime.
- `packages/cli`: o pacote publicado `goiasscript`, com os binários `goiasscript` e `goias`.
- `packages/vscode`: a extensão `goiasscript-vscode`, versionada junto com o CLI.
- `apps/playground`: o site (Next.js). `apps/engoianador-api`: o Worker que traduz código JavaScript para goianês. `apps/playground-e2e`: testes de navegador, que rodam só na CI.
- `tools/rules-scan`: scanner das regras de código. `tools/config-tests` e `tools/script-tests`: testes das configurações e dos scripts. `tools/promises`: a tabela de rastreabilidade das promessas públicas.
- `scripts/`: verificações e builds em TypeScript; `docs/operacao.md` é o runbook do dono.

## Comandos

- `corepack pnpm install` instala. Use sempre `corepack pnpm`: o `pnpm` pode não estar no PATH.
- `corepack pnpm verify` roda typecheck, lint, scanner de regras, conferência dos arquivos gerados, testes com cobertura, dependency-cruiser, knip e as conferências de documentação, de inglês na interface, de dependências do compilador e de rastreabilidade. Rode antes de cada commit.
- Etapas isoladas: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm rules-scan`, `corepack pnpm test`, `corepack pnpm depcruise`, `corepack pnpm knip`, `corepack pnpm agent-docs`, `corepack pnpm docs:blocks`, `corepack pnpm docs:commands`, `corepack pnpm english-ui`, `corepack pnpm compiler-dependencies` e `corepack pnpm traceability`.
- Builds: `corepack pnpm build:cli`, `corepack pnpm pack:cli`, `corepack pnpm build:vscode` e `corepack pnpm pack:vscode`. Playground: `corepack pnpm playground:dev` e `corepack pnpm playground:build`. Navegador: `corepack pnpm e2e`.

## Regras que valem aqui

- Superfície em goianês: keywords, mensagens de erro, comandos e textos que o usuário vê. Identificadores de código sempre em inglês, inclusive em testes e fixtures; comentários e documentação em português (ADR-0007).
- Comentário só diz o porquê não óbvio, com no máximo 4 linhas, acima do bloco. TODO só como `TODO(GS-<n>)`, com a issue aberta.
- Sem `any`, sem `console`, sem número ou texto mágico; imutabilidade por padrão; função com menos de 50 linhas; arquivo de até 400 linhas, com limite duro de 800; aninhamento de até 4. O ESLint e o scanner de `tools/rules-scan` barram isso.
- TDD: teste que falha primeiro, implementação mínima, depois limpeza. Cobertura de pelo menos 80% por pacote e nas linhas alteradas.
- Commits em Conventional Commits, em português e minúsculos, com escopo semântico (language, compiler, optimizer, cli, vscode, playground, engoianador, docs, ci, deps, release), sem ID Jira e sem trailer de atribuição de IA (ADR-0008). Isso vale no lugar da regra global de escopo Jira.
- Precedência: hooks, depois este arquivo, depois as regras globais do dono.
- Nunca faça `git push`, abra PR, mude configuração do GitHub nem publique sem aprovação explícita do dono naquele momento. O fluxo de PR e o histórico estão no ADR-0011; a publicação, no ADR-0009.

## Fluxo

- Uma unidade pequena por vez, em worktree próprio, com revisão independente em contexto fresco antes de entrar na branch de integração.
- `.github/copilot-instructions.md` só aponta para este arquivo. Tudo que este arquivo cita é conferido por `corepack pnpm agent-docs`.
