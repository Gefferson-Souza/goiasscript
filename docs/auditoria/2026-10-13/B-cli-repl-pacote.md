# Auditoria — CLI, REPL e pacote npm (`packages/core`)

- Data: 2026-10-13. Branch `feat/v1.5-launch-playground-engoianador`, HEAD `cacbbcd` (conteúdo de `origin/main`).
- Escopo: `packages/core/bin/goiasscript.js`, `bin/goias.js`, `src/cli/index.js`, `templates/**`, `examples/**`, `package.json` e as seções de uso do CLI em `README.md` e `CLAUDE.md` da raiz.
- Método: somente leitura no repo. Probes em `.../scratchpad/audit/probes-cli/`: 153 execuções registradas em `logs/`, harness com `strace` (escritas, `execve`, rede), matriz Node 18/20/22/24, driver PTY para o REPL, cópia limpa por `git archive` (`pkgclean/`) e `npm pack` real.
- Convenções: **(verificado)** = executado ou lido com número de linha; **(hipótese)** = não verificado. `[label]` = log em `probes-cli/logs/<label>.{out,err,code,strace,fsdiff}`. Trechos de saída reproduzidos sem o emoji de prefixo; o texto é literal.
- Reprodução: `source .../probes-cli/harness/env.sh; run <label> <cwd> <comando...>`.

## Resumo executivo

1. O CLI real (`bin/goiasscript.js`, 654 linhas) e o REPL (`bin/goias.js`, 424) funcionam no caminho feliz: 5 comandos goianos, tom de mensagem consistente e saída idêntica em Node 18, 20, 22 e 24. O problema está em tudo que foge do caminho feliz: quase toda falha vira sucesso falso (exit 0 em erro de execução; "Tá tudo certo, sô!" para JS inválido; "Barraco armado com sucesso!" para projeto quebrado).
2. Achado crítico, perda de dados: `filePath.replace('.gs', ...)` faz `traduz x.txt` sobrescrever o fonte com JS e `bota_pra_moer x` ou `X.GS` apagá-lo (também apaga um `x.temp.js` alheio). `bin/goiasscript.js:75,102-108`.
3. `src/cli/index.js` (357 linhas) é um segundo CLI que não é o `bin`: só scripts npm o alcançam, 3 de seus caminhos quebram, tem 0% de cobertura e arrasta `chalk`/`fs-extra` (~520 KB em 10 pacotes) para o tarball.
4. REPL: variáveis e funções não persistem (um `eval` por linha), multilinha quebra com chaves aninhadas, TAB e `.mostra_os_trem` não funcionam e a ajuda cita 6 métodos que não existem.
5. Só o template `basic` funciona; `web` e `framework` geram projetos quebrados e dizem "sucesso"; os templates que o `package.json` publica nunca são lidos por código; 6 dos 11 exemplos publicados dão SyntaxError.
6. Regra de ouro: inglês vaza no `--help`/erros do commander, em "Warnings", nas mensagens do V8/Node e em 5 aliases do CLI e 8 comandos do REPL. PoCs verificadas mostram que commander 10.0.1, o `ErrorTranslator` do núcleo e `vm.Script` com `lineOffset` resolvem isso com pouco código.
7. Pacote: 29 arquivos, 33,6 kB, sem README/LICENSE/CHANGELOG (entradas de `files` são no-ops), 16,7% do conteúdo sem uso em produção; `main`/`exports`/`bin` coerentes e `engines >=18` confirmado.
8. Veredito: reescrever `bin/goiasscript.js` e `bin/goias.js` preservando nomes, textos e UX; remover `src/cli/index.js`; colapsar os templates num só, executado em CI; refatorar examples e `package.json`.

**Contagem: CRITICAL 1 · HIGH 8 · MEDIUM 8 · LOW 7.**

## Métricas

### A. Arquivos auditados

| Métrica | `bin/goiasscript.js` | `bin/goias.js` | `src/cli/index.js` |
|---|---|---|---|
| Linhas (`wc -l`) / código aprox. | 654 / 502 | 424 / 335 | 357 / 248 |
| Funções e métodos | 26 | 27 | 17 |
| Funções > 50 linhas | 3: `arma_o_barraco` 272, `traduz` 70, `createFrameworkFiles` 53 | 0 (`handleCommand` = 50) | 3: `initProject` 79, `runFile` 59, `setupCommands` 53 |
| Aninhamento máximo | 4 | 3 | 4 |
| `console.log` / `error` / `warn` | 62 / 11 / 5 | 40 / 4 / 2 (+1 `console.clear`) | 28 / 11 / 0 |
| `process.exit` | 8 | 1 | 1 |
| `eval` / `child_process` | 1 (L86) / `spawn` (L383) | 1 (L187) / nenhum | nenhum / `exec` (L317) |
| Comentários (AST) | 52: 50 narram o quê (R2), 2 explicam um porquê (L164-165) | 19: todos narram o quê; 1 afirma algo falso (L173) | 24: todos narram o quê; 8 são JSDoc de método interno (R3) |
| Identificadores declarados em português | 5 (+7 chaves de tipo) | 11 (4 não-ASCII) | 8 |
| ESLint do repo (`.eslintrc.js`) | 28 erros / 81 avisos | 38 erros / 51 avisos | 0 erros / 41 avisos |
| Cobertura jest | fora de `collectCoverageFrom` | fora | 0% (KNOWN-FACTS) |
| `TODO`/`eslint-disable`/`@ts-ignore` | 0 | 0 | 0 |

### B. Códigos de saída em cenários de falha (16 cenários, tabela completa no Apêndice B)

| Resultado | Cenários |
|---|---|
| Exit ≠ 0 correto (9) | arquivo inexistente ×3 comandos; erro de sintaxe detectado ×3 comandos; `-o` em diretório inexistente; diretório como entrada; projeto já existente |
| Exit 0 indevido (7) | JS inválido em `traduz`, `bota_pra_moer` e `vê_se_tá_certo`; erro de execução; `vixe(...)`; erro de execução em `traduz -r`; `-t xyz` aceito |

### C. Pacote npm (`npm pack` real em cópia limpa; 29 arquivos)

| Categoria | Arquivos | Bytes |
|---|---|---|
| `bin/` (usado) | 2 | 34.971 |
| `src/` núcleo usado | 6 | 46.259 |
| `examples/` | 12 | 21.019 |
| `package.json` | 1 | 2.251 |
| `src/cli/index.js` (CLI duplicado) | 1 | 10.352 |
| `src/compiler/lexer.js` (sem uso em produção, KNOWN-FACTS) | 1 | 4.724 |
| `templates/` (nenhum código os lê) | 6 | 5.850 |
| **Total** (tarball 33.597 B) | **29** | **125.426** |

Sem uso em produção: 20.926 B = 16,7%. Ausentes do tarball: `README.md`, `LICENSE`, `CHANGELOG.md`.

### D. Matriz de versões do Node (mesmos comandos, `probes-cli/harness/nodematrix.sh`)

| Node | `--version` | `bota_pra_moer` | REPL (`faz_favor 40 mais 2`) | 4 exemplos | md5 do JS gerado |
|---|---|---|---|---|---|
| 18.20.8 | 1.5.0 | ok | `42` | exit 0 ×4 | `30457679` |
| 20.19.6 | 1.5.0 | ok | `42` | exit 0 ×4 | `30457679` |
| 22.21.1 | 1.5.0 | ok | `42` | exit 0 ×4 | `30457679` |
| 24.21.0 | 1.5.0 | ok | `42` | exit 0 ×4 | `30457679` |

## Achados

### [CRITICAL] F01 — `traduz` e `bota_pra_moer` sobrescrevem ou apagam o arquivo-fonte

- Evidência:
  - `bin/goiasscript.js:75` — `const outputPath = options.output || filePath.replace('.gs', '.js');`
  - `bin/goiasscript.js:102` — `output: filePath.replace('.gs', '.temp.js')`; `:105-108` — `const tempFile = filePath.replace('.gs', '.temp.js'); if (fs.existsSync(tempFile)) { fs.unlinkSync(tempFile); }`
  - Nenhuma validação de extensão no CLI real (a única está no CLI duplicado, `src/cli/index.js:101`).
  - Reproduzido (verificado) `[o-traduz-txt]` `[o-moer-semext]` `[o-moer-maiusculo]` `[h-clobber]`:
    ```
    $ goiasscript traduz programa.txt          # exit 0
    Tradução concluída com sucesso!
    Arquivo gerado: programa.txt               # 42 B -> 5515 B (sha256 efb55baf... -> 9716adbe...): o fonte virou JS
    $ goiasscript bota_pra_moer programa       # exit 0; strace: open(O_WRONLY|O_TRUNC) + unlink; o arquivo deixa de existir
    $ goiasscript bota_pra_moer MAIUSCULO.GS   # exit 0; o fonte é apagado
    $ goiasscript bota_pra_moer ola.gs         # com um ola.temp.js do usuário já existente: sobrescrito e apagado
    ```
  - Variante: `replace` troca a primeira ocorrência de `.gs` no caminho inteiro; `traduz e.gs/f/programa.gs` tenta gravar em `e.js/f/programa.gs` e falha com ENOENT, exit 1 `[o-traduz-dirgs]`.
- Regra/critério violado: `code-review.md` (CRITICAL = risco de perda de dados); `coding-style.md` (validar entrada nas fronteiras, erro explícito).
- Impacto: perda silenciosa e irreversível do código do usuário, com mensagem de sucesso e exit 0. Plausível com extensão em maiúsculas (Windows/macOS), arquivos sem extensão e scripts de CI.
- Recomendação: (1) aceitar só entrada terminada em `.gs` (case-insensitive), com mensagem goiana e exit 2; (2) derivar a saída com `path.parse`/`path.format` (troca só a extensão final) e recusar quando a saída for igual à entrada ou já existir sem opção explícita; (3) eliminar o arquivo temporário (F10), que remove a causa dos casos de `bota_pra_moer`; (4) teste E2E com matriz de nomes (`x.txt`, `x`, `X.GS`, `a.gs/b.gs`, `x.temp.js` pré-existente) afirmando que a entrada permanece idêntica byte a byte.

### [HIGH] F02 — Falhas de execução saem com exit 0

- Evidência:
  - `bin/goiasscript.js:87-89` — `catch (execError) { console.error(...) }` não define `process.exitCode`; `bota_pra_moer` (`:99-110`) nunca verifica o resultado.
  - Verificado: `[r-erro-exec]` (`prosa(x.y)` com `x` nulo) exit 0 e stderr `Deu ruim na execução: Cannot read properties of null (reading 'y')`; `[r-vixe]` (`vixe("estourou de proposito")`) exit 0; `[r-sintaxe-js]` exit 0; `[t-r-erro]` (`traduz -r`) exit 0.
  - Único caso correto: `process.exit(3)` dentro do programa propaga 3.
  - Contraste: erro detectado pelo transpilador sai com 1 `[e-traduz-sintaxe-detectada]`.
- Regra/critério violado: `code-generation-quality.md` item 7 (erro explícito, nunca engolir).
- Impacto: `npm start`, CI e `goiasscript bota_pra_moer x.gs && deploy` seguem como se tivesse dado certo. Dos 16 cenários de falha medidos, 7 saem com 0.
- Recomendação: `process.exitCode = 1` (ou lançar um erro tipado capturado no topo) quando a execução lançar; ponto único de saída (`main().catch(...)`) em vez de 8 `process.exit` espalhados em métodos; erros goianizados (F06).

### [HIGH] F03 — `vê_se_tá_certo` e `traduz` declaram sucesso para programa inválido

- Evidência:
  - `src/compiler.js:19-23,59` — `NoopTypeAnalyzer.analyze()` devolve `typeCount: 0, symbolTable: {}`; `loadOptional('./types/TypeAnalyzer', ...)` aponta para módulo arquivado. Resultado: "Símbolos analisados: 0" sempre.
  - `src/compiler/simpleTranspiler.js:336-374` — `_validateSyntax` só detecta `{{{`/`}}}` e `uai` sem `é`/`=`/`{`/`[`.
  - `[v-sintaxe_js_gs]` (`prosa("oi"` + `uai y é 3;`): exit 0, `Símbolos analisados: 0 ... Tá tudo certo, sô! Nenhum problema encontrado!`; `node --check` do JS gerado: `SyntaxError: missing ) after argument list`.
  - Nos exemplos, 6 de 11 geram JS inválido (`node --check`) e `traduz`/`vê_se_tá_certo` retornam 0 para todos os 11 (`harness/examples-check.sh`).
  - `traduz -v` imprime `Tipos analisados: 0` / `Módulos: Não` sempre `[t-verbose]`.
  - `README.md:78` descreve o comando como "Valida sintaxe e tipos".
- Regra/critério violado: honestidade de UX (`subagent-delegation-and-ui.md` §2: evidência observada, não otimismo); `coding-style.md` (validar na fronteira).
- Impacto: o único comando de verificação não verifica; o usuário recebe "Tá tudo certo" e descobre o erro só na execução.
- Recomendação: validar o JS gerado com `new vm.Script(js, { filename })` (parse sem executar; equivale ao `node --check`) e reportar em goianês com a linha do `.gs` (F06); retirar "tipos" do texto do comando até existir análise de tipos; remover as métricas zeradas do `-v`.

### [HIGH] F04 — O REPL `goias` não é um REPL funcional

- Evidência (verificado, logs `repl-*` e driver PTY `harness/pty_repl.py`):
  1. Sem persistência: `bin/goias.js:187` — `eval(\`(function() { ${code} })()\`)`. `uai x é 5` e depois `prosa(x)` → `x is not defined`; idem `trem y é 10` e `faz_trem soma(a, b)` (`soma is not defined`).
  2. `this.variables = new Map()` (L16) nunca recebe `set`: `.mostra_os_trem` responde "Nenhuma variável ainda, sô" mesmo após `uai z é 3`; `.zera_o_trem` limpa um Map sempre vazio.
  3. Valor de expressão não é exibido: `1 mais 2` não imprime nada; só `faz_favor 1 mais 2` imprime `3` (com prefixo de balão de fala; L162-165 depende do retorno da IIFE).
  4. Multilinha: `isMultilineStart` (L96-113) usa `input.includes('se')` (substring) + `{` sem `}`. `prosa("use { para abrir bloco")` entra em modo multilinha ("use" contém "se") e engole as linhas seguintes sem executar nada `[repl-chaves-em-string]`. O bloco termina na primeira linha com `}` (L125): bloco aninhado dá `Unexpected token ')'`, `Unexpected token '}'` e `f is not defined` `[repl-multi-aninhado]`. `input === ''` (L125) é inalcançável porque linha vazia retorna em L76-79. Linha de continuação começando com `.` (`.mapear(...)`) é tratada como comando do REPL: `Não entendi esse comando: .mapear(n => n vezes 2)` `[repl-ponto-continuacao]`.
  5. TAB: `this.rl.on('completer', ...)` (L46) — `completer` é opção de `createInterface`, não evento. PTY: `faz_f<TAB><TAB>` não lista candidatos (cenário `tab`).
  6. A ajuda mente: `.desenrola` (L296-297) exibe `"texto".gritando()` e `GoianoMath.sorteia_um()`; `.methods` (L354-371) lista `.gritando() .cochichando() .tem_no_meio() .bota_no_final() .arranca_o_rabo() .sorteia_um()`. Nenhum existe no runtime gerado (63 definições): `"texto".gritando is not a function`, `GoianoMath.sorteia_um is not a function`. Nomes reais: `pra_maiusculo`, `pra_minusculo`, `contem`, `empurrar`, `tirar_ultimo`, `sorteio`.
  7. `.mostra_as_tralha` (L343-352) e o autocomplete (L392-395: `pega`, `troca_ideia`, `vai_na_frente`) anunciam balaios, módulos e `gs-balaio` arquivados na 1.5.
  8. `safeEval` (L173-184) monta `context` que nunca é usado (ESLint `no-unused-vars`) e o comentário L173 diz "contexto isolado": falso, o eval roda no escopo do módulo.
  9. O banner (L60) anuncia 4 comandos; existem 8 goianos (um deles, `.cabô_a_prosa`, não documentado) + 8 em inglês (`.help .vars .history .clear .reset .packages .exit .methods`), que funcionam `[repl-*]` e contrariam a regra de ouro.
  10. A cada entrada o núcleo recompila e reavalia o runtime de 246 linhas.
- Regra/critério violado: README/CLAUDE.md vendem a "Roda de Prosa" como ferramenta principal; `testing.md` (comportamento nunca exercitado).
- Impacto: o primeiro uso (`uai x é 5`, `prosa(x)`) falha. Estado conhecido (KNOWN-FACTS) ampliado com 9 outros defeitos.
- Recomendação: reescrever sobre `node:repl` + `vm.createContext`. PoC `probes-cli/poc/repl-poc.js` (~45 linhas, verificado): `uai x é 5` → `prosa(x mais 1)` imprime 6; `soma(2, 3)` → 5; `lista.mapear(n => n vezes 2)` → `[ 2, 4, 6 ]` (eco do valor); bloco `se_ocê_quiser` multilinha via `repl.Recoverable`; `defineCommand` para `.desenrola`/`.vaza`. Carregar o runtime uma vez no contexto; autocomplete real via `completer` do `repl.start` alimentado pela tabela de keywords do transpilador (fonte única); gerar a lista de métodos da ajuda a partir de `getGoianoMethods()` (57 nomes reais) para a ajuda não divergir. Ressalva (não testada): redeclarar `uai x` no mesmo contexto exige tratamento.

### [HIGH] F05 — `arma_o_barraco -t web|framework` entrega projetos quebrados e declara sucesso

- Evidência (verificado em clone limpo via `git archive` e no disco do autor):
  - `--help` anuncia "basic, web, framework" (`bin/goiasscript.js:616`), mas os arquivos que `web` lê (`web-app.gs`, `web-index.html`, `dev-server.js`, `web-package.json`; L202, 273, 281, 288) e o diretório `goias-web-framework` (L259) não existem no pacote (arquivados; `KEEP-OR-ARCHIVE.md:94-96`).
  - `-t web` (pacote): fallback embutido (L207-223) com typo `prosta_serviço` (L218); `bota_pra_moer src/app.gs` → `Unexpected identifier 'iniciarApp'` `[b-web-run]`; não gera `package.json` (L288-298 só copia se `web-package.json` existir); `npm install` roda sem manifesto; a saída final é "Barraco armado com sucesso!" e manda executar `npm run dev`, que não existe `[bc-web-ok]`.
  - `-t framework` (pacote limpo): fallback `createFrameworkFiles` (L464-517) gera `package.json` cujos scripts `dev`/`build`/`serve` apontam para `scripts/dev-server.js`, `build.js`, `serve.js` inexistentes: `npm run dev` → `MODULE_NOT_FOUND` `[bc-fw-dev]`; `check: goiasscript vê_se_tá_certo src/**/*.gs` (glob; o CLI aceita 1 arquivo); `src/main.gs` com `pega "./app.module" em { AppModule }` (sintaxe arquivada) → `Unexpected string` `[bc-fw-run]`.
  - `-t framework` no disco do autor: 18 diretórios vazios não rastreados (`templates/goias-web-framework/{dist,public,src/config,src/models}`, `roda-de-prosa/**`, `src/cli/commands`, `src/stdlib`). `existsSync` dá verdadeiro, só diretórios vazios são copiados e o projeto sai SEM `package.json`; `npm install` falha com ENOENT `[b-framework]`. O mesmo comando se comporta diferente na máquina do autor e no pacote publicado.
  - `-t xyz` é aceito: cria projeto `basic`, imprime `(template: xyz)`, exit 0 `[ed-tinvalido]`.
  - A lista final promete "Hot Reload com WebSocket", "TailwindCSS com tema goiano", "Arquitetura modular (NestJS style)" (L402-405): recursos arquivados.
  - 98 das 654 linhas do arquivo são templates embutidos (L209-222, 226-249, 328-376, 502-512).
- Regra/critério violado: validar entrada na fronteira; `subagent-delegation-and-ui.md` §2 (critério de "pronto" é evidência observada); o CLI promete recursos que a 1.5 arquivou (`KEEP-OR-ARCHIVE.md:94-96`).
- Impacto: dois dos três templates anunciados no `--help` são ilusórios e o CLI não percebe.
- Recomendação: manter apenas `basic` (único funcional) ou implementar de fato outro template; validar `--template` contra uma lista (exit 2 + mensagem goiana); remover ~100 linhas de `web`/`framework`; declarar sucesso só se o projeto gerado passar num smoke test de CI (gerar + `bota_pra_moer src/main.gs`).

### [HIGH] F06 — Inglês vaza na saída e aliases em inglês (regra de ouro)

- Evidência (verificado):
  1. commander 10.0.1, textos padrão em inglês: `--help` (`Usage:`, `Options:`, `Commands:`, `Arguments:`, `output the version number`, `display help for command`, `(default: "basic")`, `help [command]`); erros `error: unknown command 'fuça'`, `error: unknown option '--foo'`, `error: missing required argument 'file'`, `error: option '-o, --output <file>' argument missing`; sugestão `(Did you mean vê_se_tá_certo?)`; placeholders `<file>`, `<name>`, `<type>`, `[options]` `[top-*]` `[h-*]` `[x-*]` `[e-traduz-semarg]`.
  2. `Warnings:` e `Warnings de Tipos:` (`bin/goiasscript.js:50,139`); `Powered by` (L221); `Hot Reload`/`Full-Stack` (L402-405).
  3. Mensagem do Node/V8 colada após o prefixo goiano: `Deu ruim na execução: Cannot read properties of null (reading 'y')`, `... Unexpected identifier 'saudar'`, `... x is not defined`, `... missing ) after argument list`; `Deu ruim aqui: ENOENT: no such file or directory ...`, `EACCES: permission denied ...`, `EISDIR: illegal operation on a directory, read`. O núcleo já tem `ErrorTranslator`/`ErroGoiano` (`src/errors/`) que CLI e REPL não usam.
  4. Aliases em inglês: CLI `compile`, `run`, `check-types`, `new`, `info` (`bin/goiasscript.js:563-645`, rotulados "compatibilidade"; a 1.5.0 nunca foi publicada e não verifiquei se a 2.0.0 do npm tinha esses nomes, sem rede); REPL `.help .vars .history .clear .reset .packages .exit .methods` (`bin/goias.js:221-258`).
  5. Mensagens do transpilador em português neutro, sem tom goiano: `Erro de sintaxe na linha 1: Declaração de variável incompleta` (`simpleTranspiler.js:346,365`).
- Regra/critério violado: `CLAUDE.md` do projeto ("Nunca misturar inglês nas mensagens para usuário"; comandos e erros SEMPRE em goianês).
- Impacto: a identidade do produto quebra justo no `--help` e nos erros, que são a tela mais vista por quem erra.
- Recomendação (com PoCs verificadas):
  - commander 10.0.1: `.version(v, '-v, --versão', 'mostra a versão')`, `.helpOption('-a, --ajuda', ...)`, `.addHelpCommand('ajuda [comando]', ...)`, `.showHelpAfterError('(use --ajuda pra ver os comandos)')`, `.configureHelp({ formatHelp })` trocando `Usage:/Options:/Commands:/Arguments:` por `Uso:/Opções:/Comandos:/Argumentos:` e `.configureOutput({ outputError })` traduzindo as 4 mensagens de erro. `poc/help-goiano.js`: `traduz x.gs --foo` → `Ô sô! Essa opção '--foo' num existe não!` (exit 1); `ajuda traduz` e `traduz --ajuda` imprimem ajuda goiana (exit 0). Não coberto: `[options]`/`[command]` no usage e `(Did you mean ...?)` (usar `.usage()`, `subcommandTerm` ou regex adicional). Em commander ≥ 12 `addHelpCommand(string)` está deprecado em favor de `.helpCommand()` (docs via Context7): encapsular numa função `aplicarGoianes(program)`.
  - Erros de execução: passar a exceção por `ErrorTranslator` e imprimir `ErroGoiano.mostrarErro()`. Linha do `.gs` correta com `new vm.Script(js, { filename, lineOffset: -prefixo })` (PoC `poc/line-offset.js`: stack `erro-linha3.gs:3` para erro na linha 3; o prefixo do runtime tem 247 linhas, calcular em vez de fixar). Observação: chamado como está, `ErrorTranslator._extractLocation` pega o primeiro `:linha:coluna` do stack; num teste com `eval` ele devolveu linha 5/coluna 7, posição do `eval` no script de teste e não do `.gs` (causa provável; hipótese).
  - Aliases: remover os em inglês (ou escondê-los com `{ hidden: true }` e depreciação) e adicionar aliases ASCII dos comandos acentuados (F18).
  - Catálogo único de mensagens (`messages.js`) em goianês para CLI e REPL, partindo do guia de tom do `CLAUDE.md` (Sucesso/Erro/Aviso).

### [HIGH] F07 — Exemplos publicados: 6 de 11 quebram; `examples/README.md` descreve o que não existe

- Evidência (verificado, `[ex-*]`, `harness/examples-check.sh`):
  - Falham com `Unexpected identifier` sob `bota_pra_moer`: `advanced/teste_classes.gs` (L5 `presta_serviço`), `advanced/teste_instanceof.gs` (L78), `async/async_exemplo.gs` (L7; também `vai_na_frente_presta_serviço`), `basic/exemplo_simples.gs` (L7), `classes/exemplo_classes.gs` (L5), `advanced/teste_classes_simples.gs` (L18 `mexe_assim`). `presta_serviço` e `mexe_assim` não estão na tabela do transpilador 1.5 (`simpleTranspiler.js:89-172`).
  - Funcionam: `basic/ola-mundo`, `basic/lista-mapeamento`, `basic/exemplo`, `classes/pequi`; `advanced/teste_erros.gs` só imprime um menu (tudo comentado).
  - Todos os 11 recebem o aviso falso (F08) e retornam exit 0 em `traduz`, `vê_se_tá_certo` e `bota_pra_moer`.
  - `npm run example:classes` (`package.json:29`) executa `exemplo_classes.gs` e imprime só `Executando: ...`, exit 0: o CLI duplicado engole o erro `[np-ex-classes]`.
  - `examples/README.md`: lista `/modules/{main,logger,utils}.gs` e `/performance/jit-demo.gs` (L51-57, inexistentes); manda usar `gs-fuça`/`gs-balaio` (L24, 30, 62, inexistentes); diz "GoiásScript v2.0" (L3, 7); links `../README.md`, `../ROADMAP.md`, `../vscode-extension/` quebrados a partir de `packages/core/`.
  - `exemplo_simples.gs:3-4` e `async_exemplo.gs:3-4` trazem "Data atual: 2025-04-13 ..." e "Usuário: Gefferson-Souza" fixos.
  - CI só executa `traduz examples/basic/exemplo.gs` (`ci.yml:58`).
- Regra/critério violado: `testing.md` (E2E dos fluxos críticos); qualidade do conteúdo publicado.
- Impacto: 55% dos exemplos que o usuário abre para aprender dão erro de sintaxe do JavaScript, sem pista goiana de causa.
- Recomendação: converter os 6 quebrados para as keywords da 1.5 (`faz_trem`, `vai_na_frente_faz_trem`; e `mexe_assim` só se for suportada) ou removê-los; remover linhas de data/usuário; reescrever `examples/README.md` listando só o que existe; job de CI que executa todo `examples/**/*.gs` com saída esperada (golden) e exit 0.

### [HIGH] F08 — Aviso falso `console.log( não é goiano` em toda execução (causa no núcleo; impacto no CLI/REPL)

- Evidência:
  - `src/compiler/simpleTranspiler.js:36,39` — `_checkForbiddenMethods` roda DEPOIS de `_applySubstitutions` (KNOWN-FACTS): todo `prosa` já virou `console.log`.
  - Exposição verificada: 11 de 11 exemplos; todo `traduz`/`bota_pra_moer`/`vê_se_tá_certo` com `prosa` (stderr); cada linha de `prosa(...)` no REPL (PTY cenário `historico`).
  - Em `vê_se_tá_certo` o aviso vem logo antes de "Tá tudo certo, sô! Nenhum problema encontrado!" `[v-ola_gs]`.
  - Sugestão malformada: `Troca esse console.log( por .prosa(` (`simpleTranspiler.js:324`).
- Regra/critério violado: UX; mensagem incorreta ao usuário.
- Impacto: todo "olá mundo" exibe um aviso errado; no REPL, a cada linha.
- Recomendação: corrigir na origem (núcleo: checar proibidos no código-fonte antes das substituições); teste "programa só com `prosa` não emite avisos". O CLI não deve filtrar por texto.

### [HIGH] F09 — Exemplo `vai_indo` do README é um laço infinito (origem no núcleo/documentação; fora do escopo estrito do CLI)

- Evidência (verificado): `README.md:131` — `vai_indo (uai i é 0; i menor_que 5; i mais 1) { prosa("Iteração", i) }` gera `for (const i = 0; i < 5; i + 1) {...}`. `bota_pra_moer` imprimiu 1.538.528 linhas `Iteração 0` em 3 s (CPU a 100%, só Ctrl+C) e deixou `readme-laco.temp.js` no disco após SIGTERM `[docs-samples]`. A forma que funciona está em `examples/basic/lista-mapeamento.gs:11`: `vai_indo (trem i é 0; ...; i é i mais 1)`.
- Regra/critério violado: documentação executável; exemplo oficial deve rodar.
- Impacto: o primeiro trecho que um novo usuário copia do README trava o terminal.
- Recomendação: corrigir o README (`trem i é 0; ...; i é i mais 1`); executar os blocos de código do README em CI (teste de documentação); repassar ao auditor do núcleo (`const` em `for` com incremento sem efeito).

### [MEDIUM] F10 — `bota_pra_moer`: arquivo temporário inútil, `eval` no escopo do CLI e semântica divergente do JS emitido

- Evidência (verificado):
  1. O `.temp.js` é gravado (L102 → L76) e nunca lido: a execução usa a string (`eval(result.javascript)`, L86). Efeitos: `EACCES: permission denied, open 'ola.temp.js'` em diretório somente leitura (p.ex. rodar `examples/` de uma instalação global em pasta de root) `[h-ro]`; `.temp.js` vazado quando o programa chama `process.exit()` (`sai.temp.js`) ou é interrompido por sinal em laço síncrono (`readme-laco.temp.js`); texto enganoso `Arquivo gerado: X.temp.js` para um arquivo apagado em seguida.
  2. `eval` direto dentro do método: o programa enxerga `require`, `fs`, `program`, `cli`, `result`, `options`, `filePath` `[ev-leak]`; `__dirname`/`__filename` apontam para `packages/core/bin` e `require('./local.js')` falha com `Cannot find module './local.js'` (stack `.../bin/goiasscript.js`) `[ev-req]`: o programa não importa seus próprios módulos.
  3. Semântica divergente: o eval roda em strict mode (corpo de classe é sempre strict). `x é 5; prosa(x)` falha com `x is not defined` em `bota_pra_moer` e imprime `x = 5` com `node saida.js`; parâmetros duplicados falham só no primeiro (`harness`, casos `implicita` e `param-dup`).
  4. Ordem: com código assíncrono o rodapé `====` aparece ANTES da saída assíncrona (`async-ordem`); dois separadores consecutivos no fim (L82-90 + L109).
  5. Execução sem sandbox por design (equivale a `node arquivo.js`); a documentação não avisa que rodar `.gs` de terceiros é rodar JS de terceiros. `compiler.js:294-295` diz que `execute()` "é chamado só pelo CLI (bin/goiasscript.js bota_pra_moer)", mas o único chamador de produção é `src/cli/index.js:136` (comentário desatualizado).
- Regra/critério violado: `code-generation-quality.md` itens 7 e 8 (`eval` sem `-- motivo`); ESLint `no-eval` (erro) fora do alcance de `npm run lint` (F15).
- Impacto: efeitos colaterais no disco, programa sem acesso ao próprio contexto de módulo e comportamento diferente entre `traduz`+`node` e `bota_pra_moer`.
- Recomendação: executar em memória com `vm.Script({ filename, lineOffset })` (verificado, F06); para o contexto de módulo do usuário, `createRequire(caminhoDoFonte)` e `vm.compileFunction` com `require/module/__filename/__dirname` (combinação não testada nesta auditoria; hipótese); sem arquivo temporário; decidir strict ou sloppy e documentar (recomendo que `traduz`+`node` e `bota_pra_moer` coincidam); rodapé em `process.on('beforeExit')`; aviso "não rode `.gs` de terceiros" no README.

### [MEDIUM] F11 — `arma_o_barraco`: robustez e efeitos colaterais

- Evidência (verificado):
  1. `spawn('npm', ['install'], ...)` sem `on('error')` (L385-421): com `npm` fora do PATH, `Error: spawn npm ENOENT ... Unhandled 'error' event` com stack trace e exit 1, depois de criar o projeto `[sem-npm]`. Em Windows `spawn('npm')` sem `shell` pode não resolver `npm.cmd` (hipótese, não testado).
  2. `npm install` automático sem opção de desligar. Como `-t web` não gera `package.json` (F05), o npm sobe até o `package.json` mais próximo e opera no projeto PAI: `[pw-web]` criou `package-lock.json` no diretório pai, fora do projeto gerado.
  3. Nome do projeto sem validação (L163-166): `../escapou` cria fora do cwd `[ed-traversal]`; caminho absoluto vira `"name": "/tmp/.../abs-proj"` no `package.json`; `Meu App Goiânia` vira nome npm inválido; `a/b/c` falha com `mkdir` não recursivo (L177) e erro ENOENT em inglês `[ed-aninhado]`; aspas no nome são interpoladas cruas em `.gs` e README (L210, 229, 234, 328): `a"); prosa("INJETADO"); prosa("b` gera `.gs` quebrado. Não é vetor de ataque (o nome vem do próprio usuário), mas gera projeto inválido.
  4. `package.json` gerado: `engines: { goiasscript: '^2.0.0' }` (L316-318): `engines` só vale para node/npm e `^2.0.0` aponta para o monólito arquivado; README gerado diz "Projeto GoiásScript v2.0" (L330); `docs/` vazio (L179) some em `git add`; sem `.gitignore`.
  5. Exit 0 quando o `npm install` falha (L413-420).
  6. Template `basic` usa JS cru: `trem numero_sorte = Math.floor(Math.random() * 100);` (L244) em template "100% goiano".
- Regra/critério violado: `coding-style.md` (validar fronteira; erro explícito); `security.md` (efeito colateral implícito).
- Impacto: crash com stack trace, lockfile criado em projeto alheio, projetos com nome inválido.
- Recomendação: validar nome (`^[a-z0-9][a-z0-9-_]*$`, sem `/`, `..`, espaço) e separar "nome do pacote" de "caminho"; `on('error')` no spawn e exit coerente; `--sem-instalar` e perguntar antes do `npm install` (ou não instalar); `mkdir -p`; corrigir `engines`/versões; gerar `.gitignore`; trocar `Math.*` por `GoianoMath`.

### [MEDIUM] F12 — `src/cli/index.js`: CLI duplicado, morto para usuários e quebrado

- Evidência (verificado, `[oc-*]`):
  - Não está em `bin` (`package.json:14-17`). Só os scripts `start`, `dev`, `example:*` (L19-29) o executam; `cli.test.js` não o importa. 357 linhas, 0% de cobertura (KNOWN-FACTS). Único chamador de produção de `compiler.execute()` (`:136`).
  - Sem argumentos: imprime `Uso:` e `\nExemplos:` com `\n` literal (L87), exit 0.
  - `--compiled` com erro: `Erro: Cannot read properties of undefined (reading 'mostrarErro')` (L129 usa `resultado.error`; `compile()` devolve `errors[]`).
  - `transpile` grava o `.js` e depois falha com `Cannot read properties of undefined (reading 'originalLines')` (L303; `compile()` não devolve `stats`, só `compileWithStats()`).
  - `validate` imprime `[object Object]` para avisos (L261).
  - Executar arquivo com erro: nada impresso, exit 0 (`execute()` devolve `{ success: false }` e L136 ignora).
  - Arquivo inexistente e extensão errada: exit 0 (L96-104).
  - `--watch`, `--debug`, `--source-map` aceitos e ignorados (L36-38).
  - `init` gera `main.gs` com `presta_serviço` (L182) que não roda: `Unexpected identifier 'exemploFuncao'`.
  - Mensagens em português neutro e help em inglês.
  - `openDocs` usa `exec(\`${command} ${url}\`)` (L327) com string de shell (URL constante hoje).
- Dependências: `chalk` e `fs-extra` são importados só aqui: 10 pacotes, ~520 KB (cópia dereferenciada) contra ~216 KB do commander.
- Regra/critério violado: `coding-style.md` (alta coesão; sem código morto); `testing.md` (0%).
- Impacto: dois CLIs com comportamento divergente e mesmo nome; `npm start` mostra uma UX diferente da real; custo de instalação para o usuário final sem benefício.
- Recomendação: remover o arquivo; apontar `scripts` (`start`, `dev`, `example:*`) para `bin/goiasscript.js`; remover `chalk` e `fs-extra` de `dependencies`; remover o diretório vazio `src/cli/commands/`.

### [MEDIUM] F13 — Templates e assets publicados que nenhum código usa

- Evidência (verificado):
  - `package.json:65-67` publica `templates/projeto-basico/`, `basic-template.gs`, `template-info.json`. Nenhum código em `src/`, `bin/`, `tests/`, `apps/` ou CI os lê (`grep`: só `package.json` e o próprio `template-info.json`).
  - Conteúdo quebrado: `projeto-basico/src/main.gs:12` (`presta_serviço`) e `tests/test.gs:8,12` (`é_igual_a`, `senao`) não rodam `[tp-*]` (`Unexpected identifier 'saudar'`, `Unexpected identifier 'é_igual_a'`).
  - `projeto-basico/package.json`: `scripts` só tem `install-goiasscript`; `devDependencies.goiasscript` = `^2.0.0` (monólito arquivado).
  - README do template manda usar `gs-fuça` (L30, 60), `gs-balaio` (L62) e `npm run dev|check|debug` (L67-69), nenhum existente.
  - `{{projeto_descricao}}` (`package.json` L4, README L3) nunca é preenchido: `copyTemplateDirectory` só substitui 5 variáveis (L453-457).
  - `template-info.json:23` promete `arma_o_barraco --list-templates` (inexistente) e declara `versao: "1.5.0-rc.1"`.
  - `basic-template.gs` roda, mas diz "v2.0".
  - 14 ocorrências de `v2.0`/`^2.0.0` nos arquivos do escopo.
- Regra/critério violado: fonte única da verdade; `coding-style.md` (sem duplicação).
- Impacto: duas fontes de template (disco e strings embutidas em `bin/goiasscript.js`); o que é publicado nunca é usado.
- Recomendação: um único template `templates/basico/` (`main.gs` + teste) que rode, lido pelo CLI e coberto por teste de scaffolding, com substituição de variáveis centralizada; apagar `template-info.json` e `basic-template.gs`; ajustar `files`.

### [MEDIUM] F14 — Empacotamento

- Evidência (verificado):
  - `npm pack --dry-run` (cópia do disco e `git archive`) e `npm pack` real: 29 arquivos, 33.597 B empacotado, 125.426 B descompactado.
  - `package.json:68-70` lista `README.md`, `LICENSE`, `CHANGELOG.md`, que não existem em `packages/core` (vivem na raiz): o tarball sai sem README, LICENSE e CHANGELOG (confirma KNOWN-FACTS).
  - 16,7% do conteúdo (20.926 B) sem uso em produção (CLI duplicado 10.352, `lexer.js` 4.724, templates 5.850).
  - `bin`: ambos com shebang e modo 755 no tarball (`-rwxr-xr-x`). `main`, `exports` (`.`, `./browser`, `./package.json`) e `bin` resolvem (`require.resolve`/`existsSync`). `exports` não expõe `bin/` nem `src/*`. Sem campo `types`.
  - Dependências: `commander@^10.0.1` necessário; `chalk` e `fs-extra` só servem ao CLI morto (F12).
  - `engines >=18` confirmado: matriz 18.20.8/20.19.6/22.21.1/24.21.0 (tabela D) e varredura de APIs recentes (`toSorted`, `structuredClone`, `Object.groupBy`, `fs.glob` etc.) sem ocorrência; CI roda 18/20/22.
  - Pacote extraído do tarball (com dependências planas) executa `--version`, `dedo_de_prosa`, `bota_pra_moer` e o REPL. `npm install -g` real não foi executado (sem rede).
  - Do KNOWN-FACTS: no npm só existe `goiasscript@2.0.0` e a 1.5.0 exige `--tag` no npm 11.
- Regra/critério violado: publicar o que roda e a licença junto ao código.
- Impacto: página do npm sem README no lançamento; licença MIT sem o texto no pacote; 17% de peso morto.
- Recomendação: `prepack`/`postpack` copiando `../../README.md` e `../../LICENSE` (ou README próprio do pacote com o quickstart do CLI); `files` só com o que roda; job de CI que faz `npm pack --dry-run` com lista permitida, instala o tarball em diretório temporário e executa `goiasscript --version` e um exemplo; `types` opcional.

### [MEDIUM] F15 — Os gates de qualidade não cobrem o CLI

- Evidência (verificado):
  - `package.json:24` — `"lint": "eslint src/ tests/"`: `bin/` fora. ESLint do próprio repo sobre `bin/` e `src/cli/`: 66 erros e 173 avisos (`goiasscript.js`: 23 `quotes`, 4 `comma-dangle`, 1 `no-eval`; `goias.js`: 36 `indent`, 1 `no-eval`, 1 `no-unused-vars`; `cli/index.js`: 0 erros e 41 avisos).
  - `jest.config.js`: `collectCoverageFrom: ['src/**/*.js']` exclui `bin/`; threshold 50% (regra do dono: 80%).
  - `tests/unit/cli.test.js` (169 linhas, 16 testes) mocka `fs`/`path` e testa os próprios mocks e `process.argv.slice`; nenhum `require` de código de produção.
  - CI smoke (`ci.yml:54-58`): `--version`, `dedo_de_prosa`, `traduz examples/basic/exemplo.gs`. Nenhum exit code de falha, `bota_pra_moer`, `vê_se_tá_certo`, `arma_o_barraco` ou REPL.
- Regra/critério violado: `testing.md` (80%, unit + integração + E2E, TDD).
- Impacto: todos os defeitos F01–F13 passam pelo CI verde.
- Recomendação: E2E com `spawnSync(process.execPath, [bin, ...])` em diretório temporário e tabela de casos (a deste relatório; `probes-cli/harness/run.sh` serve de base); REPL via streams injetadas; lint cobrindo `bin/`; mover a lógica para `src/cli/*.js` com `run(argv, io)` testável e deixar `bin/*.js` com poucas linhas, para o `collectCoverageFrom` existente cobri-lo.

### [MEDIUM] F16 — Documentação de uso diverge do comportamento (README e CLAUDE.md)

- Evidência (verificado):
  - `README.md:20` — `npm install -g goiasscript` instalaria hoje a 2.0.0 arquivada (KNOWN-FACTS).
  - `README.md:72-83` — marcador `AUTO-GENERATED:cli-commands` sem gerador no repo (`grep` sem resultado).
  - `README.md:78` — "Valida sintaxe e tipos" (F03). `README.md:85-92` documenta 4 comandos do REPL; existem 8 goianos + 8 em inglês.
  - `CLAUDE.md` (raiz): seções `gs-balaio` (L30-48) e `gs-fuçá` (L51-66) descrevem binários que não existem na 1.5 (`README.md:63` e `package.json:14-17` dizem 2 binários); `.mostra_as_tralha` (L80) lista balaios arquivados; métodos `.gritando()`, `.cochichando()`, `.tem_no_meio()`, `.bota_no_final()`, `.arranca_o_rabo()`, `sorteia_um()` (L156-169) não existem no runtime; keywords `se`, `senao`, `fazer` (L97-100) não existem na tabela: `se (idade pelo_menos 18) { ... } senao { ... }` → `Unexpected token '{'`; `fazer dobra(n) { ... }` → `Unexpected identifier 'dobra'` `[docs-samples]`.
  - `CLAUDE.md` está rastreado (`git ls-files CLAUDE.md`; commits `a8155f1`, `b6d7dc1`) E listado em `.gitignore:38`: contradição (o ignore não vale para arquivo já rastreado).
  - Conflito entre camadas (digest): o `CLAUDE.md` do projeto manda "comentários de código interno em inglês"; `comments.md` global (R3) manda português. Os 3 arquivos auditados usam português, ou seja, seguem a regra global (precedência declarada: rules/common acima do `CLAUDE.md` do projeto).
- Regra/critério violado: documentação de usuário deve refletir o produto; regra de ouro.
- Impacto: README e CLAUDE.md prometem ferramentas, métodos e keywords que dão erro.
- Recomendação: gerar a seção de comandos de um registro único (nome, aliases, descrição, handler) usado por `--help`, README e CLAUDE.md; remover do CLAUDE.md o que não existe ou marcá-lo "arquivado v2"; decidir rastreado ou ignorado; alinhar o CLAUDE.md do projeto à regra global de comentários (português, só o porquê não óbvio).

### [MEDIUM] F17 — Estrutura e conformidade de `bin/goiasscript.js` e `bin/goias.js`

- Evidência (verificado, tabela A e `harness/metrics.js`, `harness/declared-names.js`):
  - God class: `GoiasScriptCLI` com `arma_o_barraco` de 272 linhas (limite 50), `traduz` 70, `createFrameworkFiles` 53.
  - 78 chamadas `console.*` diretas em `goiasscript.js` (+47 em `goias.js`) e `process.exit` dentro de métodos (impede teste e limpeza).
  - Strings mágicas: `'src'` ×8, `'web'` ×7, `'framework'` ×6, `'utf8'`/`'utf-8'` misturados, `'Desenvolvedor Goiano'` ×4, `'='.repeat(50)`; nomes de template como string solta.
  - Mutação: reatribuições em cadeia de `mainFile`/`htmlContent`/`packageContent`/`content` (L205-206, 276, 291-296, 453-457); estado mutável de classe no REPL (`multilineBuffer +=`, `história.push`).
  - Identificadores em português (24 declarados): `traduz`, `bota_pra_moer`, `vê_se_tá_certo` (não-ASCII), `arma_o_barraco`, `dedo_de_prosa`; `RodaDeProsa`, `história` (não-ASCII), `cabô_a_prosa` (não-ASCII), `lembra_aí` (não-ASCII), `mostra_métodos_goianos` (não-ASCII), `mostra_os_trem`, `zera_o_trem`, `mostra_as_tralha`, `desenrola`, `setupRodaDeProsa`, `getMensagemBoasVindas`; em `cli/index.js`: `arquivo`, `erro`, `caminhoCompleto`, `codigo`, `codigoMain`, `diretorio`, `nome`, `resultado`. As 7 chaves de `getTypeIcon` (`TEXTO`, `NUMERO`, `BOOLEANO`, `LISTA`, `COISA`, `FAZ_TREM`, `NADA`) são nomes de tipo da superfície da linguagem (a avaliar, não contadas).
  - Comentários: 50 de 52 narram o quê (`// Comando: traduz (compile)`, `// Mostrar warnings`, `// Salvar arquivo JavaScript`, `// README.md`); L164-165 (`path.resolve` vs `path.join`) é o único porquê legítimo. JSDoc de método interno em `cli/index.js` com `@param` óbvio.
- Regra/critério violado: `coding-style.md` (funções < 50, imutabilidade, sem valores mágicos); `code-generation-quality.md` itens 2, 3, 6, 9; `comments.md` R1–R4.
- Impacto: manutenção cara e CLI intestável; cada correção deste relatório toca a mesma classe.
- Recomendação (estrutura-alvo, sugestão):
  ```
  bin/goiasscript.js          # poucas linhas: require('../src/cli').main(process.argv)
  bin/goias.js                # idem para o REPL
  src/cli/commands.js         # registro: nome goianês, aliases ASCII, descrição, handler (nomes em inglês)
  src/cli/messages.js         # catálogo único de mensagens goianas
  src/cli/run-file.js         # execução em memória (vm), sem .temp.js
  src/cli/scaffold.js         # template único, nome validado
  src/repl/index.js           # node:repl + vm
  ```
  Handlers em inglês (`translate`, `run`, `checkTypes`, `scaffold`, `showInfo`) mapeados para nomes goianos no registro.

### [LOW] F18 — Comandos acentuados sem alias ASCII; NFD falha

- Evidência: `ve_se_ta_certo` → `error: unknown command` (com `(Did you mean vê_se_tá_certo?)`); a forma NFD (`e` + circunflexo combinante) → `unknown command 'vê_se_tá_certo'` sem sugestão. No REPL, `.lembra_ai` e `.cabo_a_prosa` → `Não entendi esse comando` (só `.lembra_aí`/`.cabô_a_prosa`); `.VAZA` funciona (`toLowerCase`, L217).
- Impacto: teclado sem teclas mortas, copiar/colar de macOS (NFD) e shells sem UTF-8 quebram o comando.
- Recomendação: aliases ASCII silenciosos (`ve_se_ta_certo`, `.lembra_ai`, `.cabo_a_prosa`) e normalização `NFC` do `argv`.

### [LOW] F19 — "Sem argumentos → logo + ajuda" é código morto; `goiasscript` puro sai com exit 1

- Evidência: `bin/goiasscript.js:650-654` roda depois de `program.parse()`, que já encerra o processo; `[top-semargs_]`: stdout vazio, help em stderr, exit 1, logo nunca aparece.
- Recomendação: tratar `argv.length === 0` antes do `parse` (logo + ajuda em stdout, exit 0) ou remover o ramo.

### [LOW] F20 — Argumentos extras são ignorados em silêncio

- Evidência: `traduz ola.gs outro.gs` → exit 0 e só `ola.js` é gerado (`outro.js` não existe). `traduz *.gs` traduz só o primeiro arquivo.
- Recomendação: aceitar múltiplos arquivos (`<arquivos...>`) ou falhar com mensagem goiana (`allowExcessArguments(false)`).

### [LOW] F21 — Convenções de saída

- Evidência: `vê_se_tá_certo` imprime cabeçalhos em stdout (`console.log`, L139, 149) e itens em stderr (`console.warn`/`console.error`), partindo o relatório quando redirecionado; dois separadores `====` consecutivos no fim de `bota_pra_moer`; `Local:` com caminho absoluto (KNOWN-FACTS); `dedo_de_prosa` afirma `Métodos: 100% Goianos` (o runtime estende protótipos JS) e traz o autor fixo (`Autor: Gefferson Souza`).
- Recomendação: camada de saída única (stdout para resultado, stderr para diagnóstico, nunca misturados num mesmo bloco); caminho relativo no resumo; autor lido de `package.json`.

### [LOW] F22 — REPL: Ctrl+C e histórico

- Evidência (PTY): Ctrl+C sai na hora com a despedida, inclusive no meio de um bloco multilinha (`cenário ctrl_c_multilinha`); `história` guarda também entradas que falharam (L138 grava antes de compilar); `.lembra_aí` imprime o bloco multilinha como uma entrada com quebras.
- Recomendação: Ctrl+C cancela a linha/bloco atual e só sai no segundo; `node:repl` já resolve (F04).

### [LOW] F23 — Shebang em `.gs` não é suportado

- Evidência: arquivo com `#!/usr/bin/env goiasscript` na primeira linha → `Deu ruim na execução: Invalid or unexpected token`.
- Recomendação: o transpilador deve preservar/ignorar a linha de shebang (núcleo).

### [LOW] F24 — `-o` não cria diretórios intermediários

- Evidência: `traduz ola.gs -o naoexiste/sub/ola.js` → `Deu ruim aqui: ENOENT: no such file or directory, open 'naoexiste/sub/ola.js'`, exit 1 `[t-o-dirinexistente]`.
- Recomendação: `mkdirSync(dirname, { recursive: true })` e mensagem goiana.

## Conformidade com as regras

Legenda: OK = conforme; ALERTA = parcial; FALHA = violado.

| Regra | Estado | Contagem / exemplos |
|---|---|---|
| Idioma: identificadores em inglês | FALHA | 24 declarados em português: `goiasscript.js` 5 (`traduz`, `bota_pra_moer`, `vê_se_tá_certo`, `arma_o_barraco`, `dedo_de_prosa`), `goias.js` 11 (4 não-ASCII), `cli/index.js` 8 (`arquivo`, `codigo`, `resultado`...); 5 não-ASCII no total |
| Idioma: mensagens em goianês (regra de ouro) | FALHA | F06: commander, `Warnings`, V8/Node, 5 aliases do CLI e 8 comandos do REPL em inglês; transpilador em português neutro |
| Comentários R1–R4 | FALHA | 95 comentários nos 3 arquivos: 2 explicam um porquê (R1); 1 afirma algo falso (`goias.js:173`); 8 JSDoc de método interno (R3); o restante narra o quê (R2). `TODO` sem ticket: 0 (OK) |
| Tamanho de arquivo (alvo 400, máx. 800) | ALERTA | 654 (`goiasscript.js`) e 424 (`goias.js`) acima do alvo, abaixo do máximo |
| Tamanho de função (< 50) | FALHA | 6 funções acima: 272, 79, 70, 59, 53, 53 |
| Aninhamento ≤ 4 | OK | máximo 4 / 3 / 4 |
| `console.log` em produção (usar logger) | ALERTA | 78 + 47 + 39 chamadas diretas; num CLI o equivalente do logger é uma camada de saída injetável, inexistente |
| Erro explícito, nunca engolir | FALHA | F02: exit 0 em 7 de 16 cenários de falha; `catch (execError)` imprime e segue; `cli/index.js` engole tudo; 10 `process.exit` em métodos |
| Validação de entrada nas fronteiras | FALHA | extensão (F01), template (F05), nome do projeto (F11), caminho `-o` (F24) |
| Zero magic values | FALHA | `'src'` ×8, `'web'` ×7, `'framework'` ×6, `'Desenvolvedor Goiano'` ×4, `50`, `'^2.0.0'` |
| Imutabilidade | ALERTA | 4 `let` com reatribuição em cadeia; estado mutável de classe no REPL |
| Constantes e templates em arquivos próprios | FALHA | 98 de 654 linhas são template embutido; templates em disco duplicados e sem uso |
| `eval` / `eslint-disable` sem motivo | FALHA | 2 `eval` (`goiasscript.js:86`, `goias.js:187`) sem justificativa; `no-eval` é erro no ESLint do repo, mas `npm run lint` não cobre `bin/` |
| Testes ≥ 80%, TDD, E2E | FALHA | CLI/REPL 0%; `cli.test.js` tautológico (16 testes); CI smoke de 3 comandos |
| Segurança | ALERTA | sem segredos e sem rede (strace); `spawn`/`exec` com argumentos constantes (sem injeção de shell); execução de `.gs` sem sandbox por design; `npm install` automático; nome do projeto sem validação |

## Veredito por módulo/arquivo

| Arquivo | Veredito | Justificativa |
|---|---|---|
| `bin/goiasscript.js` (654) | **Reescrever**, preservando nomes de comando, textos e UX | God class; 272 linhas numa função; F01, F02, F03, F05, F10 e F11 nascem aqui; `eval` + temp file por design; 98 linhas de template embutido. O que presta (mensagens, aliases, `path.resolve`) é pequeno e sai fácil |
| `bin/goias.js` (424) | **Reescrever** sobre `node:repl` + `vm` | o defeito é de arquitetura (um `eval` por linha); PoC de ~45 linhas supera a versão atual em persistência, eco, multilinha e autocomplete |
| `src/cli/index.js` (357) | **Remover** | não é o `bin`; 3 caminhos quebrados; 0% de cobertura; arrasta `chalk`/`fs-extra`; só scripts npm o usam |
| `templates/projeto-basico/**` | **Reescrever** como único template, executado em CI (ou remover) | nenhum código o lê; conteúdo não roda; dependência `goiasscript@^2.0.0` arquivada |
| `templates/basic-template.gs` | **Remover** | duplicata do template embutido; rotulado v2.0 |
| `templates/template-info.json` | **Remover** | promete `--list-templates` inexistente; versão `1.5.0-rc.1` |
| `examples/**` (11 `.gs` + README) | **Refatorar** | manter e proteger em CI os 4 que rodam; converter ou remover os 6 quebrados; reescrever o README |
| `packages/core/package.json` | **Refatorar** | `files` com entradas no-op; dependências mortas; scripts apontando para o CLI morto; lint sem `bin/` |
| `README.md` (seção CLI) | **Refatorar** | marcador sem gerador; promessas de "tipos"; exemplo de laço infinito (F09) |
| `CLAUDE.md` (seções CLI) | **Refatorar** | descreve ferramentas, métodos e keywords inexistentes; rastreado e ignorado ao mesmo tempo |

Ordem sugerida de correção: (1) F01 (perda de dados) e F02/F03 juntos, com o módulo de execução em memória (`vm`) e a checagem de parse; (2) F06 (goianização via commander + `ErrorTranslator`); (3) REPL (F04); (4) remover `src/cli/index.js` e colapsar templates (F12, F13, F05); (5) examples + job de CI (F07, F09); (6) `prepack` e gates (F14, F15); (7) documentação (F16).

Decisões necessárias do dono: (a) remover de vez os aliases em inglês (recomendado; a 1.5.0 nunca foi publicada) ou mantê-los ocultos; (b) `bota_pra_moer` em strict (hoje) ou sloppy (igual ao `node saida.js`); (c) manter só o template `basic`; (d) idioma dos comentários (alinhar o `CLAUDE.md` do projeto à regra global); (e) `CLAUDE.md` rastreado ou ignorado.

## O que vale reaproveitar numa reescrita

- Nomes de comando: `traduz`, `bota_pra_moer`, `vê_se_tá_certo`, `arma_o_barraco`, `dedo_de_prosa`; REPL `.desenrola`, `.mostra_os_trem`, `.lembra_aí`, `.limpa_o_terreiro`, `.zera_o_trem`, `.vaza`, `.cabô_a_prosa`, `.mostra_as_tralha` (esta só se passar a refletir a realidade).
- Textos goianos prontos: `Ô rapaz! Arquivo '...' não foi achado não!`; `Ô rapaz! Deu ruim na tradução!`; `Tá tudo certo, sô! Nenhum problema encontrado!`; `Barraco armado com sucesso!`; `Já tem um projeto '...' aqui!`; `Terreiro limpo, sô!`; `Zerou tudo, sô!`; `Nenhuma variável ainda, sô`; `Ainda não conversamos nada`; `Pode começar a prosa, sô!`; `Tchau, sô! Volte sempre pra mais dois dedo de prosa!`; guia de tom (Sucesso/Erro/Aviso) do `CLAUDE.md`.
- Logos ASCII (`bin/goiasscript.js:10-19`, `bin/goias.js:50-63`), ícones de `getTypeIcon` (quando houver tipos) e a linha `Roda de Prosa`.
- Comportamentos corretos já existentes: `path.resolve(process.cwd(), nome)` para caminho absoluto e relativo (L166, com a nota L164-165); guarda de diretório existente; erros em stderr e resultado em stdout; opções `-o`, `-v`, `-r`; suporte a caminho com espaço/acento, BOM e CRLF (verificados).
- `ErroGoiano.mostrarErro()` e `ErrorTranslator` do núcleo para erros de execução (com mapeamento de linha por `lineOffset`).
- Conteúdo didático: `ola-mundo.gs`, `lista-mapeamento.gs`, `pequi.gs` (melhor voz), `exemplo_classes.gs` (Pamonharia) e `teste_classes.gs` (ComidaGoiana) para portar com as keywords da 1.5; a ideia de autoteste de `projeto-basico/tests/test.gs` reescrita com `faz_trem` e `é_igualim`.
- Infra de teste: `probes-cli/harness/run.sh` + `analyze-strace.js` como base de testes E2E (diff do cwd, escrita fora do diretório, processos filhos, rede); `pty_repl.py` para o REPL; PoCs `help-goiano.js`, `repl-poc.js`, `line-offset.js`.

## Apêndice A — Inventário de comandos

| Comando (canônico) | Alias | Implementado em | Usado pelo `bin` | Observação |
|---|---|---|---|---|
| `traduz <file> [-o] [-v] [-r]` | `compile` | `bin/goiasscript.js:27-96` (registro L551-573) | sim | `-v` mostra métricas zeradas; `-r` roda via `eval` |
| `bota_pra_moer <file>` | `run` | `:99-110` (L575-591) | sim | usa `traduz` com `run:true` e arquivo temporário |
| `vê_se_tá_certo <file>` | `check-types` | `:113-159` (L593-609) | sim | tipos = stub (F03) |
| `arma_o_barraco <name> [-t]` | `new` | `:162-433` (L611-629) | sim | `basic`, `web`, `framework` |
| `dedo_de_prosa` | `info` | `:534-540` (L631-645) | sim | saídas idênticas |
| `--help`, `help`, `--version` | — | commander | sim | textos em inglês |
| `goias` (REPL) | — | `bin/goias.js` | sim (`bin`) | `package.json:14-17` |
| `<arquivo>` `-c -o -w -d --source-map`, `init`, `validate`, `transpile`, `docs` | — | `src/cli/index.js` | **não** | só `npm start`, `dev`, `example:*` |

`bin` do `package.json`: `goiasscript` → `./bin/goiasscript.js`; `goias` → `./bin/goias.js`. Duplicação: os dois CLIs definem `class GoiasScriptCLI` e instanciam `GoiasScriptCompiler`, com nomes de comando e mensagens diferentes. `src/cli/index.js` é código vivo apenas via scripts npm.

## Apêndice B — Execução dos comandos (cwd isolado em `probes-cli/work/`)

| # | Comando | Exit | Saída relevante | Avaliação | Log |
|---|---|---|---|---|---|
| 1 | `--version`, `-V` | 0 | `1.5.0` | OK | `top-__version_` |
| 2 | `--help`, `-h`, `help` | 0 | help do commander em inglês | F06 | `top-__help_` |
| 3 | sem argumentos | 1 | help em stderr; logo não aparece | F19 | `top-semargs_` |
| 4 | `ajuda` | 1 | `error: unknown command 'ajuda'` | inglês | `top-ajuda_` |
| 5 | `<comando> --help` (10 comandos) | 0 | `Usage:`/`Arguments:`/`Options:`/`display help for command` | inglês | `h-*` |
| 6 | `traduz ola.gs` | 0 | `Tradução concluída com sucesso!` / `Arquivo gerado: ola.js`; stderr com aviso falso | OK + F08 | `t-ola` |
| 7 | `traduz ola.gs -o saida/ola-saida.js` | 0 | grava no destino | OK | `t-o` |
| 8 | `traduz ola.gs -o naoexiste/sub/ola.js` | 1 | `Deu ruim aqui: ENOENT: no such file or directory, open ...` | exit ok; inglês (F24) | `t-o-dirinexistente` |
| 9 | `traduz ola.gs -v` | 0 | `Tipos analisados: 0` / `Módulos: Não` | métricas fictícias | `t-verbose` |
| 10 | `compile ola.gs -o ...` | 0 | igual a `traduz` | alias em inglês | `t-compile` |
| 11 | `traduz "pasta com espaço e acento/olá mundo.gs"` | 0 | gera `olá mundo.js` ao lado | OK | `t-espaco` |
| 12 | `bota_pra_moer` no mesmo caminho | 0 | executa; `.temp.js` criado e apagado (strace) | OK | `t-espaco-run` |
| 13 | `traduz inexistente.gs` | 1 | `Ô rapaz! Arquivo 'inexistente.gs' não foi achado não!` | OK | `e-traduz-inexistente` |
| 14 | `traduz` sem arquivo | 1 | `error: missing required argument 'file'` | inglês | `e-traduz-semarg` |
| 15 | `traduz` com `uai x` (erro detectado) | 1 | `Ô rapaz! Deu ruim na tradução!` + `Erro de sintaxe na linha 1: ...` | OK | `e-traduz-sintaxe-detectada` |
| 16 | `traduz` com `prosa("oi"` | 0 | `Tradução concluída com sucesso!`; `node --check`: SyntaxError | sucesso falso (F03) | `e-traduz-sintaxe-js` |
| 17 | `traduz vazio.gs` | 0 | gera 247 linhas só de runtime | tolerável | `e-traduz-vazio` |
| 18 | `bota_pra_moer ola.gs`, `run ola.gs` | 0 | saída correta; `====` duplicado no fim | OK | `r-ola`, `r-run-alias` |
| 19 | `bota_pra_moer inexistente.gs` | 1 | igual ao 13 | OK | `r-inexistente` |
| 20 | `bota_pra_moer` com erro detectado | 1 | igual ao 15 | OK | `r-sintaxe-detectada` |
| 21 | `bota_pra_moer` com `prosa("oi"` | 0 | `Deu ruim na execução: missing ) after argument list` | exit errado + inglês | `r-sintaxe-js` |
| 22 | `bota_pra_moer` com `prosa(x.y)`, `x` nulo | 0 | `antes` + `Deu ruim na execução: Cannot read properties of null (reading 'y')` | exit errado + inglês | `r-erro-exec` |
| 23 | `bota_pra_moer` com `vixe("...")` | 0 | `Deu ruim na execução: estourou de proposito` | exit errado | `r-vixe` |
| 24 | `bota_pra_moer vazio.gs` | 0 | nada impresso | OK | `r-vazio` |
| 25 | `traduz programa.txt` | 0 | sobrescreve o fonte (42 B → 5515 B) | F01 | `o-traduz-txt` |
| 26 | `bota_pra_moer programa` | 0 | apaga o fonte | F01 | `o-moer-semext` |
| 27 | `bota_pra_moer MAIUSCULO.GS` | 0 | apaga o fonte | F01 | `o-moer-maiusculo` |
| 28 | `traduz meu.gs.bak` | 0 | cria `meu.js.bak` | estranho, não destrutivo | `o-traduz-bak` |
| 29 | `traduz e.gs/f/programa.gs` | 1 | ENOENT em `e.js/f/programa.gs` | bug do `replace` | `o-traduz-dirgs` |
| 30 | `traduz a` (diretório) | 1 | `EISDIR: illegal operation on a directory, read` | inglês | `o-traduz-diretorio` |
| 31 | `vê_se_tá_certo ola.gs`, `check-types` | 0 | `Símbolos analisados: 0`; `Warnings de Tipos:` + aviso falso; `Tá tudo certo, sô!` | F03, F08 | `v-ola_gs`, `v-alias` |
| 32 | `vê_se_tá_certo` com erro detectado | 1 | `Erros de Tipos:` + mensagem | OK | `v-sintaxe_detectada_gs` |
| 33 | `vê_se_tá_certo` com `prosa("oi"` | 0 | `Tá tudo certo, sô!` | falso positivo | `v-sintaxe_js_gs` |
| 34 | `vê_se_tá_certo inexistente.gs` | 1 | igual ao 13 | OK | `v-inexistente_gs` |
| 35 | `arma_o_barraco meu-app` | 0 | cria `src/main.gs`, `package.json`, `README.md`, `docs/` vazio; `bota_pra_moer src/main.gs` roda | OK (único template funcional) | `b-basic`, `b-basic-run` |
| 36 | `arma_o_barraco app-web -t web` | 0 | F05 | quebrado | `b-web`, `bc-web-ok` |
| 37 | `... -t framework` | 0 | F05 | quebrado | `b-framework`, `bc-framework` |
| 38 | `... -t xyz` | 0 | cria `basic`; `(template: xyz)` | aceita inválido | `ed-tinvalido` |
| 39 | `arma_o_barraco` em diretório existente | 1 | `Já tem um projeto 'proj-t' aqui!` | OK | `ed-existe` |
| 40 | `arma_o_barraco ../escapou` | 0 | cria fora do cwd | sem validação | `ed-traversal` |
| 41 | `arma_o_barraco a/b/c` | 1 | ENOENT em `mkdir` | inglês | `ed-aninhado` |
| 42 | `arma_o_barraco --list-templates` | 1 | `error: unknown option '--list-templates'` | prometido em `template-info.json:23` | `ed-list` |
| 43 | `new proj-new` | 0 | igual a `arma_o_barraco` | alias em inglês | `ed-new` |
| 44 | `dedo_de_prosa`, `info` | 0 | logo + `Versão: 1.5.0` / `Métodos: 100% Goianos` / `Autor: Gefferson Souza`; saídas idênticas | OK | `d-dedo`, `d-info` |
| 45 | `traduz ola.gs -r` | 0 | executa via eval; com erro de execução também 0 | F02 | `t-r`, `t-r-erro` |
| 46 | `traduz ola.gs outro.gs` | 0 | `outro.gs` ignorado | F20 | — |
| 47 | opção/comando desconhecido | 1 | `error: unknown option '--foo'`; `error: unknown command 'fuça'`; `error: option '-o, --output <file>' argument missing` | inglês | `x-*` |

Observações de execução: nenhum comando executou código por `child_process` fora de `arma_o_barraco -t web|framework` (strace); escritas fora do cwd só ocorreram em `arma_o_barraco ../x`/caminho absoluto (escolha do usuário) e no `package-lock.json` do diretório pai (F11).

## Apêndice C — REPL `goias` (stdin, PTY e `harness/pty_repl.py`)

| Comando / recurso | Documentado em | Resultado | Avaliação |
|---|---|---|---|
| `.desenrola` | `CLAUDE.md:75`, `README.md:89`, banner | imprime a ajuda; cita `gritando` e `sorteia_um` inexistentes | funciona; conteúdo errado |
| `.mostra_os_trem` | `CLAUDE.md:76`, `README.md:90` | `Nenhuma variável ainda, sô` sempre (também após `uai z é 3`) | roda; funcionalidade morta |
| `.lembra_aí` | `CLAUDE.md:77` | lista as entradas brutas, inclusive as que falharam | funciona |
| `.limpa_o_terreiro` | `CLAUDE.md:78` | PTY: limpa a tela e imprime `Terreiro limpo, sô!` | funciona |
| `.zera_o_trem` | `CLAUDE.md:79`, `README.md:91` | zera histórico; "variáveis" é um Map sempre vazio | roda; efeito parcial |
| `.mostra_as_tralha` | `CLAUDE.md:80` | lista `goiano-utils/http/db` e manda usar `gs-balaio` | roda; conteúdo desatualizado |
| `.vaza` | `CLAUDE.md:81`, `README.md:92` | despedida, exit 0 | funciona |
| `.cabô_a_prosa`, `.exit` | só no código (L246-250) | idem | funciona (não documentado) |
| `.help .vars .history .clear .reset .packages .methods` | só no código | funcionam, em inglês | contra a regra de ouro |
| Persistência de `uai`, `trem`, `faz_trem` | implícito num REPL | não persiste | falha |
| Eco do valor da expressão | idem | só com `faz_favor expr` (imprime `3` com prefixo de balão de fala) | falha |
| Multilinha simples (`se_ocê_quiser (certeza) { ... }`) | `.desenrola` | funciona (um bloco, sem aninhamento) | parcial |
| Multilinha aninhada, `{` em string, encadeamento com `.` | — | quebra (F04) | falha |
| TAB | `setupRodaDeProsa` | sem candidatos | falha |
| Seta para cima | readline | recupera entradas anteriores | OK |
| Ctrl+D e EOF de pipe | — | despedida, exit 0 | OK |
| Ctrl+C | — | sai na hora, também no meio de bloco | F22 |
| Erros | — | prefixo goiano + mensagem V8 em inglês | parcial (F06) |

## Apêndice D — Templates e exemplos

**Templates publicados (`package.json` `files`)**

| Arquivo | Lido por código? | Roda? | Observação |
|---|---|---|---|
| `templates/projeto-basico/package.json` | não | n/a | `scripts` só com `install-goiasscript`; `goiasscript@^2.0.0` |
| `templates/projeto-basico/README.md` | não | n/a | `gs-fuça`, `gs-balaio`, `npm run dev\|check\|debug` inexistentes; `{{projeto_descricao}}` |
| `templates/projeto-basico/src/main.gs` | não | não | `presta_serviço` (L12) |
| `templates/projeto-basico/tests/test.gs` | não | não | `é_igual_a`, `senao` (L8, L12) |
| `templates/basic-template.gs` | não | sim | rotulado "v2.0" |
| `templates/template-info.json` | não | n/a | `--list-templates` inexistente; `1.5.0-rc.1` |

**Referenciados pelo CLI mas ausentes do pacote:** `web-app.gs`, `web-index.html`, `dev-server.js`, `web-package.json` (`bin/goiasscript.js:202,273,281,288`) e `goias-web-framework/` (L259). `roda-de-prosa/` não é referenciado; no disco do autor existe só como esqueleto de diretórios vazios.

**Embutidos em `bin/goiasscript.js`:** `main.gs` do `basic` (L226-249), README (L328-376), `package.json` do `basic` (L303-319), fallback `web` (L209-222), fallback `framework` (L469-512).

**Projetos gerados e os "Próximos passos" impressos**

| Template | Resultado seguindo os passos |
|---|---|
| `basic` | `goiasscript bota_pra_moer src/main.gs` roda e imprime 11 linhas corretas (ressalva: o template usa `Math.floor(Math.random()...)` em JS cru) |
| `web` (pacote) | `bota_pra_moer src/app.gs` → `Unexpected identifier 'iniciarApp'`; sem `package.json`; `npm run dev` inexistente |
| `framework` (pacote limpo) | `npm run dev` → `MODULE_NOT_FOUND`; `bota_pra_moer src/main.gs` → `Unexpected string` |
| `framework` (disco do autor) | projeto sem `package.json`; `npm install` → ENOENT |

**Exemplos (`bota_pra_moer`, `traduz`, `vê_se_tá_certo`)**

| Exemplo | `bota_pra_moer` | `node --check` do JS | Causa |
|---|---|---|---|
| `basic/ola-mundo.gs` | ok | ok | — |
| `basic/lista-mapeamento.gs` | ok | ok | — |
| `basic/exemplo.gs` | ok | ok | — |
| `classes/pequi.gs` | ok | ok | — |
| `advanced/teste_erros.gs` | ok (só um menu) | ok | tudo comentado |
| `basic/exemplo_simples.gs` | falha | SyntaxError | `presta_serviço` (L7) |
| `async/async_exemplo.gs` | falha | SyntaxError | `presta_serviço` (L7) |
| `classes/exemplo_classes.gs` | falha | SyntaxError | `presta_serviço` (L5) |
| `advanced/teste_classes.gs` | falha | SyntaxError | `presta_serviço` (L5) |
| `advanced/teste_instanceof.gs` | falha | SyntaxError | `presta_serviço` (L78) |
| `advanced/teste_classes_simples.gs` | falha | SyntaxError | `mexe_assim` (L18) |

Em todos, `traduz` e `vê_se_tá_certo` retornam 0 e `bota_pra_moer` retorna 0, mesmo nos que falham.

## Apêndice E — Empacotamento (detalhes)

- Conteúdo do tarball (29 arquivos): `bin/goias.js`, `bin/goiasscript.js`, `examples/**` (11 `.gs` + README), `package.json`, `src/browser.js`, `src/cli/index.js`, `src/compiler.js`, `src/compiler/lexer.js`, `src/compiler/simpleTranspiler.js`, `src/errors/ErroGoiano.js`, `src/errors/errorTranslator.js`, `src/goianoMethods/GoianoBuiltins.js`, `templates/basic-template.gs`, `templates/projeto-basico/**` (4), `templates/template-info.json`.
- Diretórios vazios do disco (18, incluindo `src/cli/commands` e `src/stdlib`) não entram no tarball nem no clone.
- `exports`/`main`/`bin` verificados com `require.resolve` e `existsSync`: todos resolvem; `bin` com bit de execução.
- Dependências (verificado nos `package.json` instalados): `chalk@4.1.2` (`engines.node >=10`, CJS), `commander@10.0.1` (`>=14`), `fs-extra@11.3.4` (`>=14.14`); todas compatíveis com `engines >=18`. Se subir o `commander` de major, conferir o `engines` do novo major contra `>=18` (hipótese: majors recentes elevam o mínimo; não verificado, sem rede).

## Apêndice F — Harness e PoCs (todos fora do repo)

- `probes-cli/harness/run.sh` + `analyze-strace.js`: executa em cwd isolado e registra stdout, stderr, exit, diff do cwd, escritas, `execve` e rede.
- `harness/metrics.js` e `harness/declared-names.js`: métricas por AST (funções, aninhamento, comentários, identificadores declarados).
- `harness/pty_repl.py`: TAB, seta para cima, Ctrl+C, Ctrl+D e limpa-tela no REPL.
- `harness/nodematrix.sh`, `examples-check.sh`, `depsize.sh`.
- `poc/help-goiano.js` (commander em goianês), `poc/repl-poc.js` (REPL sobre `node:repl` + `vm`), `poc/line-offset.js` (linha do `.gs` via `lineOffset`).
- `pkgclean/` (clone limpo por `git archive HEAD`) e `pkgcopy/` (cópia do disco sem `node_modules`/`coverage`); `tarball/` (pacote real extraído); `shim/` (PATH que simula `npm i -g`).

## Limites desta auditoria

- Sem rede: `npm install -g` real e a consulta ao registry não foram feitos; o estado do npm (só 2.0.0) vem do KNOWN-FACTS.
- Só Linux; Windows/macOS não testados (comportamento de `spawn('npm')` em Windows é hipótese).
- REPL em TTY verificado com driver PTY em Linux; `vm.compileFunction` + `createRequire` (F10) não foi testado.
- Correção a KNOWN-FACTS: o código do usuário começa na linha **248** do JS gerado (prefixo de 247 linhas: 246 do runtime mais 1 em branco); evidência: `wc -l ola.js` = 252 para um `.gs` de 5 linhas, e `lineOffset: -247` acertou a linha 3 em `poc/line-offset.js`. Também: `CLAUDE.md` está rastreado no git, não apenas ignorado.
- Durante a auditoria apareceu `research_notes/` não rastreado na raiz do repo (criado às 16:46, não por esta auditoria); o `git status` estava limpo no início.
