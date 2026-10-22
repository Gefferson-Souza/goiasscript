# ADR-0001: Front-end próprio, escrito à mão

- **Status:** proposto; o dono confirma os limites ao aprovar o plano 1 (spec §10.3).
- **Origem:** D4 (lexer e parser próprios, emissão por edições; acorn só como oráculo de teste).
- **Confirmação (CI):** zero dependências de runtime em `@goiasscript/compiler` (spec §8.5.5).

## Decisão

O custo de um front-end escrito à mão só se conhece com um protótipo. A Fase 0 mede um PoC contra limites fixados antes
da medição. Se um critério técnico do gate falhar, o trabalho para e a decisão volta ao dono: não existe plano B automático.

## Limites a priori

Gravados antes de qualquer medição e nunca renegociados depois dela. Node 24; mediana de 20 execuções depois de 2 de aquecimento.

```json limits
{ "maxSourceLines": 1500, "maxBrotliBytes": 29696, "maxMillisecondsFor10kLines": 150, "maxProjectedDays": 28 }
```

| Critério | Limite | Definição exata |
|---|---|---|
| Linhas | 1.500 | Linhas não vazias de `spikes/poc-compiler/src/**/*.ts`, sem `vocabulary.constants.ts` (substituto do pacote `language`). Comentários contam; testes e `bench/` ficam de fora. |
| Tamanho | 29 KB em brotli | `esbuild` empacota `src/compile.ts` (ESM, `platform: 'browser'`, `minify`, tabelas dentro); brotli qualidade 11 (`node:zlib`). |
| Tempo | 150 ms | `compile()` do programa gerado de 10.000 linhas (`bench/generate-10k.ts`), sem erro; a CPU vai no relatório. |
| Projeção | 28 dias | Fórmula abaixo: 22 dias do núcleo mais 6 de folga (spec §10.1). |

**Projeção da Fase 2.** `projeção = (L_fase2 / P) × 1,3`:
- `P` = (`sourceLines` + `tableLines`) ÷ dias de U0-02 a U0-05, em blocos de 6 horas registradas em `docs/fase-0/horas.md`;
- `L_fase2` = soma, por unidade U2-01 a U2-15, das linhas estimadas de `src/` final (código, tabelas, catálogo e geradores,
  sem testes), cada uma justificada contra o que o PoC não tem;
- `1,3` = acréscimo fixo para revisão, mutação e corpus do pipeline de unidades (D12).

Depois da medição, o ADR ganha a seção "Resultado da Fase 0"; se o gate falhar, o relatório leva ao dono o critério e as
opções do spec §10.1 (estender o prazo, reduzir o subconjunto ou acionar o plano B, que reabre D4).

## Resultado da Fase 0

Medição em Node v24.22.0 (mediana de 20 execuções depois de 2 de aquecimento), sem alterar os limites acima:

| Critério | Limite | Medido | Folga |
|---|---|---|---|
| Linhas | 1.500 | 1.097 | 403 |
| Tamanho | 29.696 bytes | 7.560 bytes | 22.136 bytes |
| Tempo | 150 ms | 81,61 ms | 68,39 ms |
| Projeção | 28 dias | 0,87 dia | 27,13 dias |

A projeção aplica o fator `1,3` a 9.376 linhas estimadas para a Fase 2 (`docs/fase-0/projecao.json`) sobre `P` = 13.968
linhas por dia. As horas de `horas.md` são as da execução automatizada (0,5 h); com as horas reais do dono, `P` e a
projeção mudam e o valor acima deve ser refeito. Veredito e pendências em `docs/fase-0/relatorio-gate.md`.

## Catracas da Fase 2

As catracas relativas de `packages/compiler/bench/budgets.json` (tempo de 10 mil linhas e brotli do bundle) valem 1,25x
a medida da U2-15; os pisos de aceitação das propriedades valem a taxa medida menos 2 pontos. Os tetos absolutos
acima não se afrouxam.

### Nota sobre o tamanho

O limite de 29.696 bytes mediu só o PoC. O bundle real do compilador mede 32.680 bytes em brotli, acima do limite, e a
catraca relativa (40.850) é mais frouxa que ele. A divergência fica aberta até decisão do dono.
