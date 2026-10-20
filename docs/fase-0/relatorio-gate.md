# Relatório do gate da Fase 0

**Veredito:** segue (aprovado pelo dono em 2026-10-20)

A RFC-0001 tem as decisões do dono registradas, mas ainda espera o parecer dos falantes de Goiás (critério e), e esse
bloqueio é independente dos critérios técnicos. Todos os critérios
técnicos (a, b, c, d e f) passaram pela medição e pela fórmula do ADR-0001, mas a projeção (f) parte de horas
registradas pela execução automatizada; as horas reais do dono estão pendentes (ver "Fatos que não são critério").

## Critérios (spec §10.1, Fase 0)

| Critério | Limite | Medido | Resultado |
| --- | --- | --- | --- |
| a-linhas | ≤ 1.500 linhas | 1.097 linhas não vazias de `src/`, sem `vocabulary.constants.ts` | passou |
| a-tamanho | ≤ 29.696 bytes em brotli | 7.560 bytes (28.617 minificados) | passou |
| b-tempo | ≤ 150 ms para 10 mil linhas | mediana de 81,61 ms em 20 execuções, Node v24.22.0 | passou |
| c-demos | 6 demos compilam, passam no `acorn.parse` e reproduzem o stdout | 6 de 6 | passou |
| c-erros-tipicos | cada um dos 10 erros típicos dá o `GSnnnn` na linha certa, sem lançar | 10 de 10 | passou |
| d-diagnosticos | ≥ 3 códigos distintos num arquivo com vários erros | 4 códigos (GS0208, GS0401, GS0403, GS0404) | passou |
| e-rfc | RFC-0001 aprovada pelo dono | aprovada em 2026-10-20; anexo F a recolher antes da U2-01 | passou |
| f-projecao | ≤ 28 dias | 0,87 dia (9.376 linhas ÷ 13.968 linhas por dia × 1,3) | passou |

Medição: CPU 12th Gen Intel(R) Core(TM) i5-12450H, 12 núcleos, Linux; `medicao-poc.json` registra Node v24.22.0.
Os testes do PoC (`vitest run`, 97 testes em 7 arquivos) rodaram em Node v26.11.1.

## Fatos que não são critério

- **ESLint provisório:** 5 violações de `functional/immutable-data` no PoC; nenhuma de tamanho de função nem de
  profundidade.
- **Horas:** `horas.md` soma 0,5 h para U0-02 a U0-05, tempo da execução automatizada. Com isso `P` resulta em
  13.968 linhas por dia e a projeção em 0,87 dia, valor que não serve de previsão para uma pessoa. O dono decidiu
  manter essas horas (2026-10-20); o resultado de f só vale como aplicação literal da fórmula.
- **Sandbox do playground:** candidato `worker-file`, aprovado nos 4 critérios nos 3 navegadores
  (`spike-sandbox.md`).
- **Publicação da extensão:** método escolhido "nenhum", escalado ao dono; falta provar o fluxo sem PAT numa execução
  real (`publicacao-extensao.md`). Os PATs globais do Azure DevOps são aposentados em 2026-12-01.
- **Pendências do dono:** anexo F (parecer de 2 a 3 falantes de Goiás indicados pelo dono). P8–P13, P15, P16, a
  biblioteca e as lacunas do anexo D foram decididos em 2026-10-20 (P16 recusada: troca literal).

## Regra

Falhou critério técnico (a, b, c, d ou f): o trabalho para e o fato vai ao dono, que escolhe entre estender o prazo,
reduzir o subconjunto ou acionar o plano B (reabre D4). A RFC (e) é bloqueio independente e não aciona o plano B.
Não há plano B automático.

**Decisão do dono** (GATE 0): aprovado em 2026-10-20. Critérios técnicos aceitos; horas da execução automatizada
mantidas; RFC-0001 decidida nome a nome pelo critério "o que o goiano fala"; o parecer do anexo F chega antes da U2-01 e pode trocar nomes.
