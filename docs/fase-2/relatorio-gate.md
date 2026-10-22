# Relatório do gate da Fase 2

**Veredito:** aprovado pelo dono em 2026-10-22 (GATE 2), com a ordem de seguir para a Fase 3 e revisar depois o
que for preciso. Todos os critérios técnicos abaixo foram medidos e passaram, e o spike `spikes/poc-compiler` saiu do
repositório. Até a revisão do dono, valem as leituras padrão das decisões abertas: o teto de 150 ms é relativo à
máquina de referência, o brotli fica na catraca de 40.850 B e o caso audit-m01 segue o §5.6.

Medição: Node v26.11.1, Linux, CPU 12th Gen Intel(R) Core(TM) i5-12450H (12 núcleos). Mediana de 20 execuções depois
de 2 de aquecimento.

## 1. Unidades e commits

| Unidade | Commits principais |
| --- | --- |
| U2-01 tabelas da linguagem | ca17a39, fcc4062, 5675789 |
| U2-02 fonte, posições e alfabeto | 9840398 |
| U2-03 catálogo de diagnósticos | 501ccfe, 570eeb2, 8bd222c |
| U2-04 lexer | 015d129, 4a4ef9d |
| U2-05 AST e parser | 603589c, 12b9da1 |
| U2-06 diagnósticos de subconjunto | c4c2a0b, 9344909 |
| U2-07 análise semântica | b04c408, 5f6939d, f56433e |
| U2-08 rebaixamento e emissão | 3774ac9, e643224 |
| U2-09 source map v3 | 4adafa7, 6fa9d1b |
| U2-10 `compile()` | 287221e |
| U2-11 erros de execução e frases | dbe3c44 |
| U2-12 geradores com diff vazio | a5ab0f0, db71ad0 |
| U2-13 otimizador | 2228f9b, a9390a7 |
| U2-14 corpus e propriedades | 38ac15d a 7b1267a (inclui as correções de lexer, parser e analisador) |
| U2-15 mutação, orçamentos e gate | dd9a83f, e933309, 5deaf02, 1f5fbb3 e o commit deste relatório |

## 2. Cobertura por pacote (`vitest run --coverage`)

| Pacote | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| compiler | 99,82% | 95,56% | 99,83% |
| language | 100% | 100% | 100% |
| optimizer | 100% | 80,00% | 100% |

Total: 1.197 testes passando, 3 ignorados, 86 arquivos. Instruções 99,36%, ramos 95,54%, funções 99,84%, linhas 99,82%.
O piso por pacote é 80% e `verify` sai 0.

## 3. Mutação

Stryker 10.0.0 com `@stryker-mutator/vitest-runner`, sobre `src/{lexer,parser,analyzer,lowering,sourcemap}`
(5.107 mutantes). **Nota: 92,91** (93,45 sobre o que foi coberto); 4.300 mortos, 407 por tempo esgotado, 330
sobreviventes, 29 sem cobertura. **`thresholds.break` = 90** (nota menos 2, arredondado para baixo). A execução
completa leva cerca de 30 minutos; a incremental, bem menos.

Sobreviventes concentrados em `parser/subset-statements.ts` (70,97), `parser/properties.ts` (90,32) e `vlq.ts` (91,38).
Os mutantes de `Regex` ficam excluídos (`excludedMutations`).

## 4. Medidas e catracas

| Medida | Atual | Teto absoluto | Catraca (1,25x) |
| --- | --- | --- | --- |
| `compile()` de 10 mil linhas | 105 a 109 ms isolado; até 133 ms dentro do verify | 150 ms | 133 ms |
| 100 mil espaços | abaixo de 100 ms | 100 ms | n/a |
| runtime em programa só nativo | 0 bytes | 0 bytes | n/a |
| brotli do bundle de `src/index.ts` | 32.680 bytes | n/a | 40.850 bytes |

A catraca de tempo é aplicada só pelo `bench:check`, que roda isolado na CI. Dentro do verify a suíte disputa CPU e a
medida chegou a 133,06 ms, então lá valem só os tetos absolutos. Os tempos são normalizados pela velocidade da máquina: a calibração
fixa de `bench/budgets.ts` mede 18 ms na máquina de referência (`referenceCalibrationMs`), e numa máquina mais lenta
os tempos são divididos pelo fator. No runner do GitHub, sem isso, o `compile()` de 10 mil linhas mediu 234 ms.
O spec fixa 150 ms com a CPU no relatório; ler o teto como relativo à máquina de referência é decisão do dono.

## 5. Corpus

227 casos em `tests/conformance` (168 `audit`, 59 temáticos). `list-expected-fail`: **0 casos** expected-fail;
saída 0. Nenhuma divergência de spec ficou como expected-fail.

## 6. Propriedades de aceitação

Taxa medida: mutação 8%, programas 23%. Pisos gravados em `budgets.json`: **0,06** e **0,21** (taxa menos 2 pontos),
lidos por `ok-implies-valid.test.ts`.

## 7. Divergências do spec e como foram resolvidas

- 124 casos saíram de expected-fail na U2-14; os goldens que contradiziam a spec foram corrigidos (7b1267a).
- Número que começa em ponto passou a ser literal (bb5dbc5); palavra reservada já declarada é lida como nome
  (35e49cb).
- `.length` e `.tamanho`: a RFC-0001 vale sobre o plano (`.o_tanto`, `.naco`, `.ranca_o_rabo`, `.arruma`, `.cata`,
  `.ajunta`, `daqui_um_cadim`, `larga_mão`, `.se_der_ruim`, `.quando_der_bão`, `Promessa`), sempre lidos de
  `packages/language/src`.
- Para cumprir 150 ms em 10 mil linhas foi preciso otimizar lexer e rebaixamento (dd9a83f); o teto não foi afrouxado.
- O vitest-runner do Stryker filtrava testes por nome e confundia títulos parecidos; um patch em `patches/` roda o
  arquivo inteiro de cada teste.

## 8. Riscos abertos e prazo

- **Brotli acima do limite do ADR-0001 (29.696 bytes):** o bundle de `src/index.ts` mede 32.680 bytes, porque o
  critério da Fase 0 media só o PoC (7.560 bytes). Não é critério da Fase 2, mas o dono deve decidir se o limite de
  29 KB vale para o pacote inteiro. A catraca (40.850) impede só piora.
- **GS0703 sem frase em `.mensagem`** e **`{line}` indefinido em GS0702** (pendências baixas da U2-11): a mensagem
  de GS0702 usa um marcador `{line}` sem valor na tradução de erro de execução.
- **audit-m01:** o golden dá só GS0405 na linha 2 (`a.length é 0`); a leitura de `a.length` na linha 3 depois da
  atribuição não gera diagnóstico. A spec é ambígua; o golden fixa o comportamento atual e o dono confirma.
- **Mutação:** 330 sobreviventes, a maioria em `subset-statements.ts`; nenhuma lacuna bloqueante, mas há espaço para
  testes.
- **Disco:** só cerca de 2,7 GB livres; a mutação gera `.stryker-tmp`, removido ao fim junto de `reports/`.
- **Prazo:** a Fase 2 correu de 2026-10-21 a 2026-10-22 em datas de commit (execução automatizada), contra os 22 dias
  previstos; as horas reais do dono continuam pendentes, como na Fase 0.
