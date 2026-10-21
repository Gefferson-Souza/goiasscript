# ADR-0006: Versionamento e compatibilidade

- Status: aceito em 2026-10-14

## Contexto

A 1.0 e a 1.5 tinham palavras que a v3 retira ou renomeia, e reservar um nome novo quebra o programa de quem já escreveu.

## Decisão

SemVer único. Crescer o conjunto de nomes reservados é MAJOR (P17). A 3.0.0 não tem alias das palavras do 1.0 e 1.5 (`retiredWords`, P13) e a 2.0.0 recebe `npm deprecate`.

## Consequências

A 3.x só recebe MINOR que não reserva nome. Toda remoção entra em `docs/spec/migracao.md`.

## Confirmação

Job `compat` (Fase 2).
