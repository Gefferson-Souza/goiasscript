# ADR-0011: Fluxo de PR e histórico

- Status: aceito em 2026-10-14

## Contexto

A reescrita do histórico e a revisão por agente mudam como o código entra na `main`. O fluxo precisa estar escrito e ser verificado pelo CI.

## Decisão

- O merge exige CI verde, checklist de auto-revisão e a revisão do agente colada na seção "Revisão".
- Histórico linear: squash, ou rebase no PR de fase com um commit por unidade. Sem merge commit; `delete_branch_on_merge` ligado.
- Histórico público reescrito na Fase 1. A tag `legacy/1.5`, a branch `archive/v2-experimental` e a tag `v2.0-pre-archive` ficam protegidas.

## Consequências

A revisão por agente é etapa manual; um job só confere que a seção existe.

## Confirmação

Rulesets em `.github/rulesets`, job `pr-body`, leitura por `gh api` no gate de release e `git grep -nE '/hom[e]/'` vazio.
