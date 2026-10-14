# Auditoria — Conformidade quantitativa (scanner)
> Consolidado pelo coordenador (Write bloqueado para o subagente). Dados: scanner/ (scan-rules.mjs, scan-result.json, out/report-tables.md, validate/, gate/).

## Resumo executivo
- 52 arquivos, 6.497 linhas, 452 funções, 21 regras; 769 ocorrências; só 6/52 arquivos (11,5%) sem violação.
- R14 (identificadores em PT): 283 declarações em 32/52 arquivos (128 nomes; 14,1% dos identificadores); 71 em testes. Superfície da linguagem (131) e nome próprio (24) não contados.
- packages/core concentra 78,4% das ocorrências (19,5 por 100 LOC vs 6,9–10 nos apps); bin/ fora do lint.
- Defeito funcional: comandos de src/cli/index.js e --run de bin/goiasscript.js terminam com exit 0 após erro.
- Falso positivo medido: 0% nas regras de AST; R16 14,3%; R20 16,7%; R21 4,4%; R14 0/23. Batimento com ESLint 8.57.1/typescript-eslint 8.59.4: 12/16 regras exatas.
- Gate proposto: scanner em ratchet (PR simulada bloqueia 5, avisa 2) + config ESLint (21 erros, 254 avisos hoje). Resultado idêntico em Node 18/20/22/24.
- Veredito: REPROVADO.

# Resumo agregado do scanner de conformidade

Commit auditado: `cacbbcd25bbc48bb9d2d88c00bba35cecc2765da` (feat/v1.5-launch-playground-engoianador). Arquivos analisados: 52.
Células da tabela: ocorrências (arquivos afetados/arquivos aplicáveis).

## Regra por pacote

| Regra | Descrição | core | vscode-extension | playground | engoianador-api | playground-e2e | Total | Arquivos conformes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | Arquivo acima de 400 linhas (alvo) | 4 (4/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 4 (4/52) | 92.3% |
| R02 | Arquivo acima de 800 linhas (máximo) | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R03 | Função/método acima de 50 linhas | 12 (6/16) | 0 (0/1) | 6 (6/21) | 1 (1/9) | 0 (0/5) | 19 (13/52) | 75% |
| R04 | Profundidade de controle > 4 (max-depth) | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R05 | Chaves aninhadas > 4 (inclui closures) | 1 (1/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 1 (1/52) | 98.1% |
| R06 | console.* fora de testes | 170 (4/10) | 2 (1/1) | 6 (2/21) | 2 (2/5) | – | 180 (9/37) | 75.7% |
| R07 | any explícito (TypeScript) | – | – | 0 (0/18) | 0 (0/9) | 3 (2/5) | 3 (2/32) | 93.8% |
| R08 | @ts-ignore/@ts-expect-error sem justificativa | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R09 | eslint-disable sem justificativa (-- motivo) | 1 (1/16) | 0 (0/1) | 1 (1/21) | 0 (0/9) | 0 (0/5) | 2 (2/52) | 96.2% |
| R10 | TODO/FIXME sem ticket | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R11 | Comentário em bloco > 4 linhas | 4 (4/16) | 0 (0/1) | 2 (2/21) | 0 (0/9) | 0 (0/5) | 6 (6/52) | 88.5% |
| R12 | Comentário ao lado do código | 2 (2/16) | 0 (0/1) | 1 (1/21) | 2 (1/9) | 1 (1/5) | 6 (5/52) | 90.4% |
| R13 | Comentário de histórico/meta-processo | 5 (4/16) | 0 (0/1) | 1 (1/21) | 0 (0/9) | 0 (0/5) | 6 (5/52) | 90.4% |
| R14 | Identificador em português (interno) | 202 (12/16) | 2 (1/1) | 55 (11/21) | 20 (5/9) | 4 (3/5) | 283 (32/52) | 38.5% |
| R15 | Número mágico | 10 (4/10) | 1 (1/1) | 16 (5/21) | 15 (4/5) | – | 42 (14/37) | 62.2% |
| R16 | String repetida >= 3x (valor nominal) | 15 (3/10) | 1 (1/1) | 5 (3/21) | 0 (0/5) | – | 21 (7/37) | 81.1% |
| R17 | Reatribuição de parâmetro | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R18 | Mutação de objeto recebido por parâmetro | 0 (0/16) | 2 (1/1) | 2 (2/21) | 0 (0/9) | 0 (0/5) | 4 (3/52) | 94.2% |
| R19 | `let` nunca reatribuído / `var` | 0 (0/16) | 0 (0/1) | 0 (0/21) | 0 (0/9) | 0 (0/5) | 0 (0/52) | 100% |
| R20 | catch que engole o erro | 7 (3/16) | 0 (0/1) | 3 (3/21) | 2 (2/9) | 0 (0/5) | 12 (8/52) | 84.6% |
| R21 | Comentário que só rotula/narra (<= 7 palavras, sem porquê) | 170 (13/16) | 8 (1/1) | 0 (0/21) | 0 (0/9) | 2 (1/5) | 180 (15/52) | 71.2% |

Arquivos sem nenhuma violação: 6/52. Conformidade média por célula arquivo×regra: 87.7%.

## Piores arquivos

| # | Arquivo | Linhas | Índice | Ocorrências por regra |
| --- | --- | --- | --- | --- |
| 1 | `packages/core/bin/goiasscript.js` | 654 | 31.1% | R01:1 R03:3 R05:1 R06:78 R14:12 R15:4 R16:13 R20:1 R21:45 |
| 2 | `packages/core/bin/goias.js` | 424 | 26.2% | R01:1 R06:50 R14:11 R15:1 R20:2 R21:16 |
| 3 | `packages/core/src/cli/index.js` | 358 | 24.9% | R03:3 R06:39 R14:19 R15:3 R16:1 R20:4 R21:13 |
| 4 | `packages/core/src/goianoMethods/GoianoBuiltins.js` | 449 | 17.3% | R01:1 R03:2 R14:46 R21:20 |
| 5 | `packages/core/src/errors/ErroGoiano.js` | 91 | 11.4% | R06:3 R11:1 R12:1 R14:36 R21:1 |
| 6 | `packages/core/tests/unit/compiler.test.js` | 243 | 11.3% | R12:1 R14:33 R21:5 |
| 7 | `apps/engoianador-api/src/index.ts` | 112 | 11% | R03:1 R06:1 R14:10 R15:9 |
| 8 | `apps/playground/scripts/copy-examples.mjs` | 58 | 10.5% | R06:5 R14:8 |
| 9 | `packages/core/src/compiler/simpleTranspiler.js` | 434 | 9.7% | R01:1 R03:2 R11:1 R13:1 R21:31 |
| 10 | `packages/core/tests/unit/errors.test.js` | 123 | 9.4% | R14:22 |
| 11 | `apps/playground/app/engoianador/page.tsx` | 186 | 9% | R03:1 R14:18 R15:1 R20:1 |
| 12 | `packages/core/tests/unit/lexer.test.js` | 219 | 8.1% | R14:8 R21:2 |
| 13 | `packages/core/tests/unit/goianoBuiltins.test.js` | 173 | 7.5% | R14:8 |
| 14 | `vscode-extension/src/extension.js` | 133 | 6.5% | R06:2 R14:2 R15:1 R16:1 R18:2 R21:8 |
| 15 | `apps/playground/components/Toolbar.tsx` | 81 | 6% | R03:1 R06:1 R12:1 R14:6 |
| 16 | `apps/engoianador-api/src/engoiana.ts` | 83 | 5.3% | R06:1 R14:4 R15:3 R20:1 |
| 17 | `apps/playground/tailwind.config.ts` | 26 | 5.3% | R14:7 |
| 18 | `packages/core/src/compiler/lexer.js` | 205 | 4.6% | R03:1 R11:1 R13:1 R14:1 R21:19 |
| 19 | `packages/core/src/compiler.js` | 397 | 4.3% | R03:1 R09:1 R11:1 R13:2 R15:2 R16:1 R21:5 |
| 20 | `packages/core/src/browser.js` | 32 | 4.3% | R13:1 R14:5 |

## Maiores funções

| # | Local | Função | Linhas | Ajustadas (sem JSX/template) | Tipo |
| --- | --- | --- | --- | --- | --- |
| 1 | `packages/core/bin/goiasscript.js:162` | arma_o_barraco | 272 | 188 | method |
| 2 | `packages/core/src/goianoMethods/GoianoBuiltins.js:118` | gerarImplementacaoGoiana | 248 | 3 | method |
| 3 | `packages/core/tests/unit/compiler.test.js:3` | callback(describe) | 241 | 203 | describe |
| 4 | `packages/core/tests/unit/lexer.test.js:3` | callback(describe) | 217 | 212 | describe |
| 5 | `packages/core/tests/unit/goianoBuiltins.test.js:3` | callback(describe) | 171 | 163 | describe |
| 6 | `packages/core/tests/unit/cli.test.js:9` | callback(describe) | 162 | 162 | describe |
| 7 | `apps/playground/app/engoianador/page.tsx:34` | EngoianadorPage | 153 | 56 | function |
| 8 | `packages/core/src/compiler/simpleTranspiler.js:68` | _applySubstitutions | 137 | 137 | method |
| 9 | `packages/core/tests/unit/lexer.test.js:10` | callback(describe) | 125 | 120 | describe |
| 10 | `packages/core/src/goianoMethods/GoianoBuiltins.js:5` | constructor | 111 | 111 | constructor |
| 11 | `packages/core/src/compiler/lexer.js:6` | constructor | 94 | 94 | constructor |
| 12 | `apps/playground/components/DonationLinks.tsx:11` | DonationLinks | 92 | 21 | function |
| 13 | `packages/core/src/compiler.js:89` | compile | 82 | 82 | method |
| 14 | `packages/core/src/cli/index.js:148` | initProject | 79 | 48 | method |
| 15 | `apps/playground/lib/use-runner.ts:16` | useRunner | 74 | 74 | function |
| 16 | `packages/core/tests/unit/errors.test.js:52` | callback(describe) | 72 | 72 | describe |
| 17 | `packages/core/bin/goiasscript.js:27` | traduz | 70 | 70 | method |
| 18 | `packages/core/src/compiler/simpleTranspiler.js:220` | _convertJSMethodsToGoiano | 70 | 70 | method |
| 19 | `apps/playground/components/Toolbar.tsx:13` | Toolbar | 69 | 25 | function |
| 20 | `apps/engoianador-api/src/index.ts:47` | handleEngoiana | 66 | 66 | function |
