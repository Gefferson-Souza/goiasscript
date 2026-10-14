# Auditoria — Núcleo do compilador (packages/core)
> Consolidado pelo coordenador a partir das mensagens do auditor-nucleo (o harness bloqueou a gravação direta). Dados brutos: scratchpad/audit/probes-core/ (results.txt/json com os 173 casos).

## Resumo
0 CRITICAL · 12 HIGH · 15 MEDIUM · 3 LOW. Bateria 173 casos: 69 ✅ / 104 ❌. 9 de 15 `.gs` versionados não executam; 3 de 25 blocos da doc falham.
Veredito: manter browser.js; refatorar compiler.js, ErroGoiano.js, errorTranslator.js; reescrever simpleTranspiler.js e GoianoBuiltins.js; remover lexer.js. PoC de 97 linhas com acorn.tokenizer corrige 89/100 casos comparáveis, sem runtime, 5–40x mais rápida.

## Métricas
- Linhas: compiler.js 397 · simpleTranspiler.js 434 · lexer.js 205 · GoianoBuiltins.js 449 · ErroGoiano.js 90 · errorTranslator.js 193 · browser.js 32 · total 1.800
- Funções >50 linhas: gerarImplementacaoGoiana 248 · _applySubstitutions 137 · ctor GoianoBuiltins 111 · ctor lexer 94 · compile 82 · _convertJSMethodsToGoiano 70
- Comentários: 330 linhas (18%), 47 JSDoc, 18 blocos >4 linhas, 1 eslint-disable
- Reatribuições/.push/var: 85 (63 em simpleTranspiler) / 14 / 0; console.* 3; eval 1 (compiler.js:299)
- Identificadores em português: 35 de 201 (17%)
- Cobertura: simpleTranspiler 98,5 · lexer 97,4 · GoianoBuiltins 96,2 · errorTranslator 82,5 · ErroGoiano 81,8 · compiler.js 63,8 · browser.js 0
- ErroGoiano construído em fluxos reais: 0 em 197; erros que apontam para o .gs: 0 de 12
- Runtime: 5.464 B, 246 linhas, 52 propriedades novas
- transpile(): 10k linhas 384 ms, 40k linhas 3,3 s (98% na restauração de strings)
- Código morto ≈ 476/1.800 linhas (26%)

## Achados (parte 1)
- [HIGH] F01 Tradução por regex sobre texto inteiro, sem lexer/parser (simpleTranspiler.js:68-204).
- [HIGH] F02 Comentários, templates e regex não protegidos (apóstrofo em comentário → SyntaxError; keywords dentro de template traduzidas; "Clica em" → "Clica in").
- [HIGH] F03 Restauração de strings via String.replace corrompe/injeta ("US$$" perde $, "$'" injeta código; placeholder colide).
- [HIGH] F04 Keywords reservadas em qualquer posição: `{ de: "SP" }` → `{"of":"SP"}`, `o.de` → `o.of`, parâmetro `em` → `in`, `nadação` → `nullção` (\b ASCII).
- [HIGH] F05 Delimitadores incompletos: `faz_favor ocê;`, `faz_favor;`, `continua_aí;`, `(ocê.x)` não traduzem.
- [HIGH] F06 Reescrita JS→goiano sem conhecer receptor: quebra a.length=0, slice de array, Map/Set.forEach, Number.isNaN, métodos do usuário; JS puro falha 4/14.
- [HIGH] F07 Wrappers mudam semântica: trocar via RegExp ("1.5".replace(".", ",") → ",,,"), reduzir sem inicial → NaN (doc promete 15), parseInt com base, emendar, juntar.
- [HIGH] F08 GoianoMath.PI/E documentados viram GoianoGoianoMath → ReferenceError.
- [HIGH] F09 Runtime estende protótipos nativos (13 String, 17 Array, 1 Object.prototype, 6 Date, 11 globais), tudo enumerável; execute() polui o processo host (JSON.parse passa a trazer tem_propriedade); for...in 9–18x mais lento.
- [HIGH] F10 Erros nunca apontam para o .gs (offset 247; ErrorTranslator inalcançável; CLI imprime .message em inglês). Sugestão: vm.Script com lineOffset se preservar linhas.
- [HIGH] F11 validate()/vê_se_tá_certo não valida (aprova `uai x é (;`, reprova objetos aninhados); README promete "sintaxe e tipos".
- [HIGH] F12 Exemplos/templates/docs divergem: presta_serviço, mexe_assim, é_igual_a, se/senao, fazer, vixe_que não existem; README:131 laço infinito; README:164-171 quebra por ASI.
- [MEDIUM] F13 _checkForbiddenMethods roda depois da reescrita → aviso falso em todo prosa; demais avisos nunca disparam.
- [MEDIUM] F14 loadOptional engole falhas reais; 3 módulos inexistentes → compile() passos 1,2,4 no-op.

## Achados (parte 2)
- [MEDIUM] F15 API inconsistente: compiler.js → {success, javascript, errors[]}; browser.js → {success, code, error, warnings, tokens}; src/cli/index.js quebra (mostrarErro undefined).
- [MEDIUM] F16 execute() usa eval direto em API pública; erros assíncronos derrubam processo após success:true.
- [MEDIUM] F17 Semântica strict (bota_pra_moer/playground) × sloppy (.js emitido rodado com node).
- [MEDIUM] F18 Desempenho: restauração O(n·m) (98% do tempo); `\s+é\s+` quadrático (100k espaços = 11,6 s). PoC por tokens: 54 ms/10k linhas.
- [MEDIUM] F19 Fonte da verdade triplicada (transpiler × lexer × GoianoBuiltins) + quarta no Monaco (14/78 palavras realçadas sem tradução).
- [MEDIUM] F20 Mensagens: tipos faltando ("Deu trem desconhecido"), gramática do molde ("Deu faltou um parêntese"), `\w` ASCII trunca `número_inexistente`, inglês vazando.
- [MEDIUM] F21 Código morto ≈26% (lexer inteiro, 12 métodos públicos do compiler sem consumidor, 7 helpers do GoianoBuiltins, _generateTokens).
- [MEDIUM] F22 Cobertura enganosa: 98,5% no transpiler com 100/168 casos falhando; asserts por substring; só 3 testes executam o JS.
- [MEDIUM] F23 Sem NFC na entrada; `é` consome quebras de linha (numeração diverge).
- [MEDIUM] F24 Runtime 5,4 KB em todo arquivo, usado 0 vezes em ola-mundo/pequi; "JS limpo" não é limpo.
- [MEDIUM] F25 Estilo sem `;` do README quebra por ASI.
- [MEDIUM] F26 Comentários fora de R1–R4 (18 blocos >4 linhas, histórico "v2 corrigido aqui"); idioma misto; 35 identificadores PT.
- [MEDIUM] F27 Dados como código em funções gigantes (gerarImplementacaoGoiana 248 linhas; 55 new RegExp por chamada).
- [LOW] F28 Hash de código para JIT Noop. [LOW] F29 ErroGoiano com console.error/timestamp/strings mágicas. [LOW] F30 bordas menores.

Observações cruzadas: bota_pra_moer sai 0 com ReferenceError; traduz grava .js inválido e sai 0; src/cli/index.js em inglês.

## Conformidade (resumo)
❌ identificadores EN (35/201 PT), comentários R1/R2, magic values, imutabilidade (85 reatribuições), constants em arquivos próprios, funções <50 (6/89), erro explícito, validação de entrada, cobertura ≥80% (compiler 63,8, browser 0), testes de comportamento, coesão.
⚠️ mensagens goianas, R3/R4, console (3 em ErroGoiano), eslint-disable, segurança (eval, protótipos).
✅ arquivos ≤800 (máx 449), aninhamento ≤4 (máx 3), 0 TODO sem ticket.

## Veredito por arquivo
browser.js manter · compiler.js refatorar (fachada ~100–150 linhas) · simpleTranspiler.js reescrever · lexer.js remover (+ lexer.test.js) · GoianoBuiltins.js reescrever/dividir · ErroGoiano.js refatorar · errorTranslator.js refatorar.

## Reaproveitar
Tabela de 53 keywords; catálogo de 57 métodos/10 tipos; catálogo de mensagens goianas (tom aprovado); exemplos que funcionam como golden tests; a bateria de 173 casos (probes-core/cases-1…6.js) + docs-blocks.js, docs-expected.js, run-repo-gs-files.js como gates; técnicas: tokenização, vm.Script com lineOffset, restauração em passada única, Object.hasOwn, normalize('NFC'); exports `.` e `./browser`.

## Apêndices (resumo da parte 3)
- A. Pipeline: bin/goiasscript.js:99 → compile (compiler.js:89; módulos/tipos/JIT = Noop via loadOptional) → simpleTranspiler.transpile (validateSyntax → applySubstitutions [proteger strings, JS→goiano, tipos, 55 passadas, restaurar] → checkForbiddenMethods → prefixa runtime → tokens) → eval no bin (strict); browser.js chama transpile direto; playground executa com new Function + "use strict".
- B. Bateria por grupo (✅/❌): identificador 9/9, estrutura 9/14, string 5/8, comentário 1/4, template 2/6, regex 1/3, operador 6/1, operador-é 4/5, unicode 1/2, formato 4/1, validação 2/6, aviso 0/2, reescrita 8/12, wrapper 0/9, trocar 1/6, colisão 1/2, runtime 1/7, js-puro 10/4, entrada 4/3.
- C. Runtime: 52 props enumeráveis; Array.prototype 42→59 chaves; fast properties preservadas; parse 0,22 ms, exec 0,48 ms; for...in 16–18x mais lento; wrappers String 4–5x em sloppy.
- D. 12 cenários de erro: tom bom, linha sempre errada (host:28); vm.Script com lineOffset:-247 dá prog.gs:3.
- E. PoC proto-transpile.js (97 linhas): NFC → acorn.tokenizer → tabela extraída do simpleTranspiler → regras de posição (não após `.`, não como chave, de/em só em vai_indo) → aliases por token sem runtime → edição só dos intervalos (linhas preservadas) → acorn.parse do JS com linha do .gs. Resultado 155✅/13❌ de 168 (produção 68/100); corrige 89/100, 2 regressões (V05 tipos, M42 alias colide com método do usuário). 10k linhas 54 ms vs 304 ms; 20k só strings 53 ms vs 9.061 ms. acorn hoje só vem via eslint.
- F. Reprodução: tudo em probes-core/ (battery.js, harness.js, t.js, run-repo-gs-files.js, docs-blocks.js, docs-expected.js, runtime-analysis.js, errors-probe.js, lineoffset-demo.js, ast-metrics.js, perf-*.js, proto-transpile.js, battery-poc.js).
Limites: sem REPL interativo, sem browser real, sem Windows/Node<24, benchmarks de uma máquina.
