# CLAUDE.md

GoiásScript 3 é uma linguagem educacional em goianês que compila para JavaScript; ela não é JavaScript. O repositório está em reconstrução. O design aprovado é `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` e o plano em execução é `docs/superpowers/plans/2026-10-14-goiasscript-3-plano-1.md`. Leia os dois antes de mexer em código novo.

## O que a v3 é e o que fica de fora

- Lexer e parser escritos à mão, análise de mundo fechado, emissão por edições que preserva as linhas do `.gs`, zero runtime para programa só com operações nativas.
- Fora da v3: módulos, sistema de tipos, balaios, debugger, LSP separado, interop com JavaScript nativo e IR própria. Item novo só entra por RFC (modelo em `docs/rfc/rfc.md`).
- As decisões de arquitetura estão nos ADRs de `docs/adr/`; consulte lá em vez de copiar o conteúdo.

## Onde está cada coisa

- Código novo: `packages/language`, `packages/compiler`, `packages/optimizer`, `tools/rules-scan`, `tools/config-tests` e `scripts/`.
- Pacotes: `@goiasscript/language`, `@goiasscript/compiler` e `@goiasscript/optimizer`, nessa ordem de camadas. `language` e `compiler` não importam `node:*`, e o compilador não tem dependência de runtime.
- Legado, fora dos gates e removível na Fase 8: `packages/core`, `apps/`, `vscode-extension/` e `lsp-server/`. A prova de conceito `spikes/poc-compiler` sai no gate da Fase 2.

## Comandos

- `corepack pnpm install` instala. Use sempre `corepack pnpm`: o `pnpm` pode não estar no PATH.
- `corepack pnpm verify` roda typecheck, lint, scanner de regras, testes com cobertura, dependency-cruiser, knip e a conferência deste arquivo. Rode antes de cada commit.
- Etapas isoladas: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm rules-scan`, `corepack pnpm test`, `corepack pnpm depcruise`, `corepack pnpm knip` e `corepack pnpm agent-docs`.

## Regras que valem aqui

- Superfície em goianês: keywords, mensagens de erro, comandos e textos que o usuário vê. Identificadores de código sempre em inglês, inclusive em testes e fixtures; comentários e documentação em português (ADR-0007).
- Comentário só diz o porquê não óbvio, com no máximo 4 linhas, acima do bloco. TODO só como `TODO(GS-<n>)`, com a issue aberta.
- Sem `any`, sem `console`, sem número ou texto mágico; imutabilidade por padrão; função com menos de 50 linhas; arquivo de até 400 linhas, com limite duro de 800; aninhamento de até 4. O ESLint e o scanner de `tools/rules-scan` barram isso.
- TDD: teste que falha primeiro, implementação mínima, depois limpeza. Cobertura de pelo menos 80% por pacote e nas linhas alteradas.
- Commits em Conventional Commits, em português e minúsculos, com escopo semântico (language, compiler, optimizer, cli, vscode, playground, engoianador, docs, ci, deps, release), sem ID Jira e sem trailer de atribuição de IA (ADR-0008). Isso vale no lugar da regra global de escopo Jira.
- Precedência: hooks, depois este arquivo, depois as regras globais do dono.
- Nunca faça `git push`, abra PR, mude configuração do GitHub nem publique sem aprovação explícita do dono naquele momento.

## Fluxo

- Uma unidade pequena por vez, em worktree próprio, com revisão independente em contexto fresco antes de entrar na branch de integração.
- `.github/copilot-instructions.md` só aponta para este arquivo. Tudo que este arquivo cita é conferido por `corepack pnpm agent-docs`.
