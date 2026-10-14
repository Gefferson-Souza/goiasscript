

## T1 Métricas por pacote

| Pacote | Arquivos | Linhas | Linhas de código | Funções | Arquivos sem violação |
| --- | --- | --- | --- | --- | --- |
| core | 16 | 4213 | 3088 | 298 | 0/16 |
| vscode-extension | 1 | 133 | 102 | 7 | 0/1 |
| playground | 21 | 1476 | 1284 | 80 | 3/21 |
| engoianador-api | 9 | 504 | 418 | 40 | 2/9 |
| playground-e2e | 5 | 171 | 145 | 27 | 1/5 |

Total: 52 arquivos, 6497 linhas, 5037 de código, 452 funções.


## T2 Regra x pacote (ocorrências (arquivos afetados/aplicáveis))

| Regra | Descrição | core | vscode-extension | playground | engoianador-api | playground-e2e | Total | Conformes |
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

Arquivos sem nenhuma violação: 6/52. Conformes nas regras do hook (R06 R07 R08 R09 R10 R14): 19/52. Conformes nas regras de tamanho (R01 a R05): 38/52. Células arquivo x regra conformes: 87.7%. Ocorrências totais: 769.


## T3 Top 20 piores arquivos

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


## T4 Top 20 maiores funções

| # | Local | Função | Linhas | Sem JSX/template | Linhas de código | Tipo | Aninhamento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `packages/core/bin/goiasscript.js:162` | arma_o_barraco | 272 | 188 | 210 | method | 5 |
| 2 | `packages/core/src/goianoMethods/GoianoBuiltins.js:118` | gerarImplementacaoGoiana | 248 | 3 | 194 | method | 0 |
| 3 | `packages/core/tests/unit/compiler.test.js:3` | callback(describe) | 241 | 203 | 192 | describe | 3 |
| 4 | `packages/core/tests/unit/lexer.test.js:3` | callback(describe) | 217 | 212 | 177 | describe | 2 |
| 5 | `packages/core/tests/unit/goianoBuiltins.test.js:3` | callback(describe) | 171 | 163 | 139 | describe | 2 |
| 6 | `packages/core/tests/unit/cli.test.js:9` | callback(describe) | 162 | 162 | 121 | describe | 3 |
| 7 | `apps/playground/app/engoianador/page.tsx:34` | EngoianadorPage | 153 | 56 | 140 | function | 2 |
| 8 | `packages/core/src/compiler/simpleTranspiler.js:68` | _applySubstitutions | 137 | 137 | 89 | method | 2 |
| 9 | `packages/core/tests/unit/lexer.test.js:10` | callback(describe) | 125 | 120 | 102 | describe | 1 |
| 10 | `packages/core/src/goianoMethods/GoianoBuiltins.js:5` | constructor | 111 | 111 | 93 | constructor | 0 |
| 11 | `packages/core/src/compiler/lexer.js:6` | constructor | 94 | 94 | 63 | constructor | 0 |
| 12 | `apps/playground/components/DonationLinks.tsx:11` | DonationLinks | 92 | 21 | 87 | function | 2 |
| 13 | `packages/core/src/compiler.js:89` | compile | 82 | 82 | 70 | method | 3 |
| 14 | `packages/core/src/cli/index.js:148` | initProject | 79 | 48 | 56 | method | 1 |
| 15 | `apps/playground/lib/use-runner.ts:16` | useRunner | 74 | 74 | 64 | function | 3 |
| 16 | `packages/core/tests/unit/errors.test.js:52` | callback(describe) | 72 | 72 | 57 | describe | 1 |
| 17 | `packages/core/bin/goiasscript.js:27` | traduz | 70 | 70 | 58 | method | 4 |
| 18 | `packages/core/src/compiler/simpleTranspiler.js:220` | _convertJSMethodsToGoiano | 70 | 70 | 57 | method | 0 |
| 19 | `apps/playground/components/Toolbar.tsx:13` | Toolbar | 69 | 25 | 63 | function | 2 |
| 20 | `apps/engoianador-api/src/index.ts:47` | handleEngoiana | 66 | 66 | 60 | function | 1 |


## T5 Sensibilidade do R03 (funções acima de 50 linhas)

| Definição | Funções | Arquivos |
| --- | --- | --- |
| linhas brutas, incluindo callbacks de describe (ESLint max-lines-per-function padrão) | 25 | 18 |
| linhas brutas, excluindo describe (definição do scanner, R03) | 19 | 13 |
| descontando JSX e template literal | 12 | 9 |
| só linhas de código (sem brancos e sem comentários) | 16 | 13 |
| limite 100 linhas brutas | 5 | 4 |


## T6 R06 console.* fora de testes por categoria

| Categoria | Chamadas | Arquivos | Métodos |
| --- | --- | --- | --- |
| bin (CLI e REPL) | 128 | 2 | log:103 error:16 warn:8 clear:1 |
| src/cli | 39 | 1 | log:28 error:11 |
| script de build | 5 | 1 | warn:2 log:2 error:1 |
| biblioteca core | 3 | 1 | error:3 |
| Worker (servidor) | 2 | 2 | warn:1 error:1 |
| extensão VS Code | 2 | 1 | log:2 |
| UI do playground | 1 | 1 | error:1 |


## T7 R14 identificadores em português

| Categoria | Ocorrências | Nomes distintos | Conta no R14? |
| --- | --- | --- | --- |
| interno (declarado no código do projeto) | 254 | 108 | sim |
| espelho de comando (método interno com o nome do comando) | 11 | 11 | sim |
| interno no runtime embutido (parâmetros no template literal) | 18 | 10 | sim |
| superfície exata da linguagem (keywords, métodos e globais do runtime) | 131 | 105 | não (superfície) |
| nome próprio do produto (Goiano, Engoiana) | 24 | 13 | não (domínio) |

Identificadores declarados no total: 2006 (inclui 131 do runtime embutido). R14 conta 283 (14.1%), 128 nomes distintos.

Por pacote:

| Pacote | R14 (ocorrências) | Declarados | % dos declarados | Em testes |
| --- | --- | --- | --- | --- |
| core | 202 | 1167 | 17.3% | 71 |
| vscode-extension | 2 | 39 | 5.1% | 0 |
| playground | 55 | 515 | 10.7% | 0 |
| engoianador-api | 20 | 218 | 9.2% | 4 |
| playground-e2e | 4 | 67 | 6.0% | 4 |

Por tipo de declaração:

| Tipo | Ocorrências |
| --- | --- |
| variable | 111 |
| object-key | 57 |
| param | 55 |
| method | 34 |
| field | 9 |
| function | 8 |
| property | 6 |
| class | 3 |

Nomes mais frequentes:

| Nome | Ocorrências |
| --- | --- |
| codigo | 32 |
| resultado | 26 |
| texto | 22 |
| erro | 19 |
| arquivo | 16 |
| metodo | 7 |
| nome | 6 |
| ErroGoiano | 5 |
| tipo | 5 |
| caminhoCompleto | 3 |
| coluna | 3 |
| dica | 3 |

Subconjunto sem falso positivo possível (nome com acento, detectável por id-match): 5 de 283 (1.8%) ocorrências contadas: história, lembra_aí, cabô_a_prosa, mostra_métodos_goianos, vê_se_tá_certo.


## T8 Comentários

| Métrica | Valor |
| --- | --- |
| registros de comentário (nós do parser) | 372 |
| comentários lógicos (linhas // consecutivas contam uma vez) | 322 |
| diretivas (eslint, ts) | 3 |
| idioma pt / en / indeterminado | 175 / 47 / 100 |
| JSDoc | 66 |
| JSDoc em membro privado (@private ou _nome) | 19 |
| linhas de comentário / linhas de código | 575 / 5037 (11.4%) |
| candidatos fracos de histórico (palavras antes/agora soltas), não contados | 4 |

R21 por pacote:

| Pacote | R21 | Comentários lógicos | % que só rotula/narra |
| --- | --- | --- | --- |
| core | 170 | 261 | 65.1% |
| vscode-extension | 8 | 8 | 100.0% |
| playground | 0 | 28 | 0.0% |
| engoianador-api | 0 | 16 | 0.0% |
| playground-e2e | 2 | 9 | 22.2% |


## T9 Verificação cruzada com ESLint (implementação independente)

| Regra | ESLint equivalente | Scanner | ESLint | Observação |
| --- | --- | --- | --- | --- |
| R01 | max-lines 400 | 4 | 4 | mesmos 4 arquivos |
| R02 | max-lines 800 | 0 | 0 | igual |
| R03 | max-lines-per-function 50 | 25 (com describe) | 25 | mesmas 25 funções |
| R04 | max-depth 4 | 0 | 0 | igual |
| R06 | no-console | 180 | 180 | mesmas 180 linhas |
| R07 | @typescript-eslint/no-explicit-any | 3 | 3 | mesmas 3 linhas |
| R08 | @typescript-eslint/ban-ts-comment | 0 | 0 | igual |
| R09 | eslint-comments/require-description | 2 | 2 | mesmas 2 linhas |
| R10 | no-warning-comments (location: start) | 0 | 0 | igual; com location anywhere dá 8 falsos positivos em "mé-todo" |
| R12 | no-inline-comments | 6 | 6 | mesmas 6 linhas |
| R14 | id-match (só diacríticos) | 5 | 16 | ESLint não olha nomes de método de classe e conta atribuições repetidas |
| R15 | no-magic-numbers (detectObjects) | 42 | 45 | ESLint acusa um 60 dentro de const nomeada |
| R17 | no-param-reassign (props:false) | 0 | 0 | igual |
| R18 | no-param-reassign (props:true) | 4 | 1 | ESLint não vê .push em parâmetro |
| R19 | prefer-const + no-var | 0 | 0 | igual |
| R20 | no-empty / no-restricted-syntax | 12 | 0 / 14 | complementares |

ESLint 8.57.1, typescript-eslint 8.59.4; erros fatais de parsing: 0.


## T10 Validação manual

| Grupo | População | Amostra | TP | TP-fraco | FP | Taxa de FP | IC 95% | Ruído (FP+fraco) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | 4 | 4 | 4 | 0 | 0 | 0.0% | censo | 0.0% |
| R03 | 19 | 10 | 5 | 5 | 0 | 0.0% | 0.0%–27.8% | 50.0% |
| R05 | 1 | 1 | 1 | 0 | 0 | 0.0% | censo | 0.0% |
| R06 | 180 | 10 | 3 | 7 | 0 | 0.0% | 0.0%–27.8% | 70.0% |
| R07 | 3 | 3 | 3 | 0 | 0 | 0.0% | censo | 0.0% |
| R09 | 2 | 2 | 2 | 0 | 0 | 0.0% | censo | 0.0% |
| R11 | 6 | 6 | 6 | 0 | 0 | 0.0% | censo | 0.0% |
| R12 | 6 | 6 | 6 | 0 | 0 | 0.0% | censo | 0.0% |
| R13 | 6 | 6 | 5 | 1 | 0 | 0.0% | censo | 16.7% |
| R15 | 42 | 14 | 7 | 7 | 0 | 0.0% | 0.0%–21.5% | 50.0% |
| R16 | 21 | 21 | 4 | 14 | 3 | 14.3% | censo | 81.0% |
| R18 | 4 | 4 | 1 | 3 | 0 | 0.0% | censo | 75.0% |
| R20 | 12 | 12 | 5 | 5 | 2 | 16.7% | censo | 58.3% |
| R21 | 180 | 24 | 23 | 1 | 0 | 0.0% | 0.0%–13.8% | 4.2% |
| R14/internal-strong | 254 | 14 | 14 | 0 | 0 | 0.0% | 0.0%–21.5% | 0.0% |
| R14/internal-embedded | 18 | 4 | 4 | 0 | 0 | 0.0% | 0.0%–49.0% | 0.0% |
| R14/surface-mirror | 11 | 5 | 5 | 0 | 0 | 0.0% | 0.0%–43.4% | 0.0% |


| Estrato de exclusão | População | Amostra | TN | TN? | FN | Exclusão indevida |
| --- | --- | --- | --- | --- | --- | --- |
| R14/surface-exact (excluída) | 131 | 8 | 7 | 1 | 0 | 0.0% (IC 0.0%–32.4%) |
| R14/domain (excluída) | 24 | 5 | 3 | 2 | 0 | 0.0% (IC 0.0%–43.4%) |

R14 contado: população 283, amostra 23, FP 0.0% (IC 0.0%–14.3%).
R21 (censo visual de 180 itens): FP 8, TP-fraco 7, TP 165.


## T11 Matriz de conformidade (regra x situação)

| Regra | Situação | Ocorrências | Arquivos afetados | Exemplo |
| --- | --- | --- | --- | --- |
| R01 | parcial | 4 | 4/52 (7.7%) | `packages/core/bin/goias.js:1` |
| R02 | conforme | 0 | 0/52 (0.0%) | – |
| R03 | não conforme | 19 | 13/52 (25.0%) | `packages/core/bin/goiasscript.js:27` |
| R04 | conforme | 0 | 0/52 (0.0%) | – |
| R05 | parcial | 1 | 1/52 (1.9%) | `packages/core/bin/goiasscript.js:162` |
| R06 | não conforme | 180 | 9/37 (24.3%) | `packages/core/bin/goiasscript.js:29` |
| R07 | parcial | 3 | 2/32 (6.3%) | `apps/playground-e2e/tests/security.spec.ts:26` |
| R08 | conforme | 0 | 0/52 (0.0%) | – |
| R09 | parcial | 2 | 2/52 (3.8%) | `apps/playground/workers/runner.worker.ts:73` |
| R10 | conforme | 0 | 0/52 (0.0%) | – |
| R11 | parcial | 6 | 6/52 (11.5%) | `apps/playground/next.config.mjs:3` |
| R12 | parcial | 6 | 5/52 (9.6%) | `apps/engoianador-api/src/rate-limit.ts:8` |
| R13 | parcial | 6 | 5/52 (9.6%) | `packages/core/src/compiler.js:4` |
| R14 | não conforme | 283 | 32/52 (61.5%) | `packages/core/src/goianoMethods/GoianoBuiltins.js:7` |
| R15 | não conforme | 42 | 14/37 (37.8%) | `apps/playground/app/opengraph-image.tsx:4` |
| R16 | não conforme | 21 | 7/37 (18.9%) | `packages/core/bin/goiasscript.js:178` |
| R17 | conforme | 0 | 0/52 (0.0%) | – |
| R18 | parcial | 4 | 3/52 (5.8%) | `vscode-extension/src/extension.js:96` |
| R19 | conforme | 0 | 0/52 (0.0%) | – |
| R20 | não conforme | 12 | 8/52 (15.4%) | `packages/core/src/cli/index.js:139` |
| R21 | não conforme | 180 | 15/52 (28.8%) | `packages/core/bin/goiasscript.js:9` |


## T12 Densidade por pacote

| Pacote | Ocorrências | % do total | Linhas de código | % das linhas de código | Ocorrências por 100 linhas de código |
| --- | --- | --- | --- | --- | --- |
| core | 603 | 78.4% | 3088 | 61.3% | 19.5 |
| vscode-extension | 16 | 2.1% | 102 | 2.0% | 15.7 |
| playground | 98 | 12.7% | 1284 | 25.5% | 7.6 |
| engoianador-api | 42 | 5.5% | 418 | 8.3% | 10.0 |
| playground-e2e | 10 | 1.3% | 145 | 2.9% | 6.9 |


## T13 Política de severidade do gate

| Regra | Severidade | Motivo (ruído medido) |
| --- | --- | --- |
| R01 | warn | FP 0.0%, ruído 0.0% (censo) |
| R02 | error | sem ocorrências ou não amostrada |
| R03 | warn | FP 0.0%, ruído 50.0% |
| R04 | error | sem ocorrências ou não amostrada |
| R05 | error | FP 0.0%, ruído 0.0% (censo) |
| R06 | error | FP 0.0%, ruído 70.0% |
| R07 | error | FP 0.0%, ruído 0.0% (censo) |
| R08 | error | sem ocorrências ou não amostrada |
| R09 | error | FP 0.0%, ruído 0.0% (censo) |
| R10 | error | sem ocorrências ou não amostrada |
| R11 | error | FP 0.0%, ruído 0.0% (censo) |
| R12 | error | FP 0.0%, ruído 0.0% (censo) |
| R13 | error | FP 0.0%, ruído 16.7% (censo) |
| R14 | error | FP 0%, ruído 0% nas 23 amostras |
| R15 | warn | FP 0.0%, ruído 50.0% |
| R16 | warn | FP 14.3%, ruído 81.0% (censo) |
| R17 | error | sem ocorrências ou não amostrada |
| R18 | warn | FP 0.0%, ruído 75.0% (censo) |
| R19 | error | sem ocorrências ou não amostrada |
| R20 | warn | FP 16.7%, ruído 58.3% (censo) |
| R21 | warn | FP 0.0%, ruído 4.2% |

Exceção de caminho: R06 vira warn em packages/core/bin/, packages/core/src/cli/, apps/playground/scripts/.


## T14 Custo de adoção da config ESLint do gate (ESLint do repo)

| Regra ESLint | Erros | Avisos | Arquivos |
| --- | --- | --- | --- |
| @eslint-community/eslint-comments/require-description | 2 | 0 | 2 |
| @typescript-eslint/no-explicit-any | 3 | 0 | 2 |
| @typescript-eslint/no-magic-numbers | 0 | 34 | 9 |
| id-match | 2 | 0 | 1 |
| max-lines | 0 | 4 | 4 |
| max-lines-per-function | 0 | 19 | 13 |
| no-console | 8 | 172 | 9 |
| no-inline-comments | 6 | 0 | 5 |
| no-magic-numbers | 0 | 11 | 5 |
| no-restricted-syntax | 0 | 14 | 8 |

Total hoje: 21 erros e 254 avisos (ESLint 8.57.1; erros fatais de parsing: 0).


## T15 Exemplos validados à mão (um por heurística e por tipo de veredicto)

| Regra | Local | Achado do scanner | Veredicto | Justificativa |
| --- | --- | --- | --- | --- |
| R01 | `packages/core/bin/goiasscript.js:1` | 654 linhas | TP | 654 linhas |
| R03 | `apps/engoianador-api/src/index.ts:47` | handleEngoiana: 66 linhas | TP | handleEngoiana: 66 linhas de lógica |
| R03 | `apps/playground/components/Toolbar.tsx:13` | Toolbar: 69 linhas | TP-fraco | Toolbar: 69 linhas, 44 são JSX declarativo |
| R05 | `packages/core/bin/goiasscript.js:162` | arma_o_barraco: 5 níveis | TP | 5 níveis de bloco: try, if, callback do spawn, if, if (conferido por AST e leitura das linhas 378-402) |
| R06 | `vscode-extension/src/extension.js:54` | console.log('🚀 GoiásScript LSP Client iniciado!') | TP | log de depuração deixado na extensão do VS Code |
| R06 | `packages/core/bin/goiasscript.js:52` | console.warn(` • ${warning.message}`) | TP-fraco | saída de CLI voltada ao usuário |
| R07 | `apps/playground-e2e/tests/security.spec.ts:26` | cast: window as any | TP | window as any |
| R09 | `packages/core/src/compiler.js:298` | eslint-disable-next-line no-eval | TP | diretiva sem '-- motivo'; a justificativa existe só no bloco de 5 linhas acima |
| R11 | `apps/playground/workers/runner.worker.ts:44` | 8 linhas: Defesa em profundidade. O isolamento REAL é dado | TP | 8 linhas |
| R12 | `apps/engoianador-api/src/rate-limit.ts:8` | janela diária (plano: 20 req/dia) | TP | comentário ao lado do código |
| R13 | `packages/core/src/compiler/simpleTranspiler.js:352` | [corrige:corrigido,marcador-versao:v2] Check for incomplet | TP | "corrigido aqui" (histórico) e afirma que o lexer valida, o que é falso em produção |
| R13 | `packages/core/src/browser.js:1` | [marcador-versao:v2] Browser-safe entry for goiasscript@1. | TP-fraco | explica por que a entrada existe, mas amarra o texto a "v2" |
| R14 | `packages/core/src/errors/ErroGoiano.js:83` | linha (object-key, strong, internal) | TP | chave linha do retorno de getDetalhes |
| R14 | `vscode-extension/src/extension.js:78` | botaPraMoerCommand (variable, strong, internal) | TP | variável botaPraMoerCommand |
| R14 | `packages/core/src/goianoMethods/GoianoBuiltins.js:148` | texto (param, strong, internal, embutido) | TP | parâmetro do runtime embutido |
| R14 | `packages/core/bin/goiasscript.js:99` | bota_pra_moer (method, strong, surface-mirror) | TP | método interno; commander registra o comando por string |
| R14 | `packages/core/src/compiler/lexer.js:63` | certeza (object-key, strong, surface-exact) | TN | keyword da linguagem |
| R14 | `apps/playground/components/ShareCard.tsx:4` | engoianado (property, domain, internal) | TN? | engoianado é particípio derivado do nome próprio; discutível |
| R15 | `apps/engoianador-api/src/index.ts:82` | 503 (property:status): status: 503 | TP | status HTTP literal |
| R15 | `apps/playground/app/opengraph-image.tsx:47` | 6 (property:marginTop): marginTop: 6 | TP-fraco | marginTop em objeto de estilo |
| R16 | `packages/core/bin/goiasscript.js:182` | "web" x7 | TP | nome de template comparado em 6 lugares sem enum |
| R16 | `packages/core/src/cli/index.js:106` | "utf8" x3 | TP-fraco | encoding repetido |
| R16 | `apps/playground/app/opengraph-image.tsx:16` | "column" x3 | FP | valor CSS de flexDirection, tipado por CSSProperties |
| R18 | `apps/playground/workers/runner.worker.ts:33` | mutator-push: logs.push(entry) | TP | acumulador recebido por parâmetro e mutado |
| R18 | `vscode-extension/src/extension.js:96` | mutator-push: context.subscriptions.push( traduzCommand, b | TP-fraco | context.subscriptions.push, idioma documentado da API do VS Code |
| R20 | `packages/core/src/cli/index.js:139` | log-only: { console.error(chalk.red('❌ Erro:'), error.mess | TP | CLI imprime o erro e termina com código 0 |
| R20 | `packages/core/bin/goias.js:89` | log-only: { console.error('❌ Ô rapaz! Deu ruim:', error.me | FP | REPL imprime o erro e reabre o prompt; é tratamento explícito na borda |
| R20 | `apps/engoianador-api/src/rate-limit.ts:23` | empty-with-comment: { /* corrompido — reseta */ } | TP-fraco | catch vazio com comentário; reseta estado corrompido |
| R21 | `packages/core/bin/goias.js:124` | Verificar se chegou ao final do bloco | TP | narra o if seguinte |
| R21 | `apps/playground-e2e/tests/home.spec.ts:9` | Abas com semântica acessível | TP-fraco | explicita a intenção da asserção, mas o título do teste deveria dizê-lo |

Total de itens com veredicto manual: 159.
