# Relatório do gate da Fase 0

**Veredito:** para-e-leva-ao-dono

A RFC-0001 segue em rascunho (critério e), e esse bloqueio é independente dos critérios técnicos. Todos os critérios
técnicos (a, b, c, d e f) passaram pela medição e pela fórmula do ADR-0001, mas a projeção (f) parte de horas
registradas pela execução automatizada; as horas reais do dono estão pendentes (ver "Fatos que não são critério").

## Critérios (spec §10.1, Fase 0)

| Critério | Limite | Medido | Resultado |
| --- | --- | --- | --- |
| a-linhas | ≤ 1.500 linhas | 1.101 linhas não vazias de `src/`, sem `vocabulary.constants.ts` | passou |
| a-tamanho | ≤ 29.696 bytes em brotli | 7.585 bytes (28.641 minificados) | passou |
| b-tempo | ≤ 150 ms para 10 mil linhas | mediana de 72,73 ms em 20 execuções, Node v24.22.0 | passou |
| c-demos | 6 demos compilam, passam no `acorn.parse` e reproduzem o stdout | 6 de 6 | passou |
| c-erros-tipicos | cada um dos 10 erros típicos dá o `GSnnnn` na linha certa, sem lançar | 10 de 10 | passou |
| d-diagnosticos | ≥ 3 códigos distintos num arquivo com vários erros | 4 códigos (GS0208, GS0401, GS0403, GS0404) | passou |
| e-rfc | RFC-0001 aprovada pelo dono | `Status`: rascunho da Fase 0; todas as decisões `pendente` | bloqueia |
| f-projecao | ≤ 28 dias | 0,87 dia (9.376 linhas ÷ 14.016 linhas por dia × 1,3) | passou |

Medição: CPU 12th Gen Intel(R) Core(TM) i5-12450H, 12 núcleos, Linux; `medicao-poc.json` registra Node v24.22.0.
Os testes do PoC (`vitest run`, 97 testes em 7 arquivos) rodaram em Node v26.11.1.

## Fatos que não são critério

- **ESLint provisório:** 1 violação de `functional/immutable-data` no PoC; nenhuma de tamanho de função nem de
  profundidade.
- **Horas:** `horas.md` soma 0,5 h para U0-02 a U0-05, tempo da execução automatizada. Com isso `P` resulta em
  14.016 linhas por dia e a projeção em 0,87 dia, valor que não serve de previsão para uma pessoa. As horas reais ficam
  pendentes para o dono; o resultado de f só vale como aplicação literal da fórmula.
- **Sandbox do playground:** candidato `worker-file`, aprovado nos 4 critérios nos 3 navegadores
  (`spike-sandbox.md`).
- **Publicação da extensão:** método escolhido "nenhum", escalado ao dono; falta provar o fluxo sem PAT numa execução
  real (`publicacao-extensao.md`). Os PATs globais do Azure DevOps são aposentados em 2026-12-01.
- **Pendências do dono:** anexo F (parecer dos falantes de Goiás), propostas P8–P13, P15 e P16, cada nome da biblioteca
  e as lacunas do anexo D, todos `pendente` na RFC-0001.

## Regra

Falhou critério técnico (a, b, c, d ou f): o trabalho para e o fato vai ao dono, que escolhe entre estender o prazo,
reduzir o subconjunto ou acionar o plano B (reabre D4). A RFC (e) é bloqueio independente e não aciona o plano B.
Não há plano B automático.

**Decisão do dono** (GATE 0): pendente (GATE 0). Registrar aqui a decisão, a data e o que muda.
