# ADR-0003: Zero runtime

- Status: aceito em 2026-10-14

## Contexto

O runtime da 1.5 tinha 5.464 B (92,9% da saída) e alterava protótipos.

## Decisão

Apelidos viram chamadas nativas. Ajudantes existem só para entradas didáticas e só entram se usados. Nenhum protótipo é alterado.

## Consequências

Entrada nova da biblioteca é nativa ou didática com ajudante declarado.

## Confirmação

Orçamento de 0 bytes para programa só nativo no alvo `module` (spec §8.4).
