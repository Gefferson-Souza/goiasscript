# ADR-0008: Commits

- Status: proposto; a exceção ao ID de ticket depende da aprovação do dono

## Contexto

O repositório é público e o histórico alimenta o CHANGELOG. ID de ticket interno e mensagem vaga não ajudam quem lê de fora.

## Decisão

Conventional Commits em português, minúsculo, sem ID de ticket. Tipos e escopos da lista de `commitlint.config.mjs`. Cabeçalho com até 72 colunas, assunto sem ponto final e nunca vago. Sem trailer de atribuição de IA (co-autor humano é permitido). Merge por squash, ou rebase no PR de fase (D13).

## Consequências

Commit fora do padrão é barrado no hook e no CI.

## Confirmação

Job `commitlint` obrigatório e testes de `commitlint.config.mjs`.
