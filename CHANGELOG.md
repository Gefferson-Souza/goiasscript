# Changelog

Todas as mudanças importantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [3.0.0] — ainda não lançada — *GoiásScript 3*

Reescrita da linguagem: vocabulário fechado, mensagens de erro com código e um
pacote só para o CLI e para a extensão do VS Code. A lista completa de mudanças
e como migrar está em `docs/spec/migracao.md`.

### Adicionado

- Compilador próprio, escrito do zero: o `.gs` vira JavaScript (`.mjs`) sem depender do transpilador da 1.5.
- Erros com código `GSnnnn`, a linha do programa onde deu o problema e o link da lição da cartilha que ensina aquilo.
- `goiasscript explica GSnnnn`: mostra o que o erro quer dizer, com exemplo e a lição.
- `goiasscript vê_se_tá_certo arquivo.gs`: só confere o programa e mostra todos os problemas, sem executar.
- `goiasscript arma_o_barraco nome`: cria um projeto novo a partir de um modelo.
- `goias`, a roda de prosa: ocê digita uma linha e ele responde na hora.
- `--otimiza` e `--minifica` no `traduz`, pra deixar o JavaScript gerado mais enxuto.
- Playground com a cartilha de 11 lições, cada uma com programas que rodam de verdade.
- Pasta `exemplos/` com 5 programas inteiros (churrasco, feira, boletim, banco e analisador), conferidos a cada
  rodada do projeto: cada um é traduzido, executado e comparado com a saída esperada.
- Extensão do VS Code: erros na hora, sugestão das palavras goianas e o comando que bota o programa pra moer.
  Ainda é pré-lançamento, fora do Marketplace (veja `packages/vscode/CHANGELOG.md`).
- Engoianador: a tela dentro do playground e a API que vira português comum em goianês.
- Campo de fora lido com colchete e aspas, tipo `dado["saldo"]`: aceito sem o compilador reclamar do campo.

### Removido

Palavras de versões anteriores que não existem mais na linguagem. Elas não são reservadas (dá pra usar o nome
como variável, por exemplo `uai fazer é 3`); o compilador só aponta a forma nova (GS0306).

Saíram de verdade, e programa da 1.5 que usava qualquer uma delas precisa ser ajustado:

- `presta_serviço` vira `faz_trem`.
- `vai_na_frente_presta_serviço` vira `vai_na_frente_faz_trem`.
- `mexe_assim` saiu, sem substituto.
- `vixe_que` vira `vixe`.
- `vazio` vira `nada`.
- `sei_lá` vira `indefinido`.
- `é_igual_a` vira `é_igualim`.
- `um_tanto_de` saiu, sem substituto.
- `ninguem_fuça` saiu, sem substituto.
- `só_da_famia` saiu, sem substituto.
- `todo_mundo_vê` saiu, sem substituto.

Estavam na documentação da 1.5, mas nunca funcionaram no código. Programa que roda na 1.5 não usa elas, então
não quebra por isso; o erro só ajuda quem seguiu a documentação antiga:

- `se` vira `se_ocê_quiser`.
- `senao` vira `se_não`.
- `fazer` vira `faz_trem`.

### Alterado

- `trem` passa a declarar `let` (na 1.5 era `var`): o escopo agora é o do bloco.
- `.tamanho()` vira `.o_tanto`, sem parênteses; chamar com parênteses é `GS0603`.
- `.ordenar()` vira `.arruma()`: sem comparador e sem mudar a lista original.
- `.arranca_o_rabo()` vira `.ranca_o_rabo()`.
- `.reduzir` vira `.amontoar(f, inicial)`, e o valor inicial agora é obrigatório.
- `.trocar` troca todas as ocorrências e trata os dois argumentos como texto, sem expressão regular
  (usar `/b/` dá `GS0502`).
- `.inverter` vira `.de_trás_pra_frente()`, e ele e `Coisa.mistura` não mudam mais o original.
- `faz_um promessa` vira `faz_um Promessa`; `.quando_resolver` vira `.quando_der_bão` e `.se_der_pobrema` vira
  `.se_der_ruim`.
- `GoianoMath` vira `Conta`.
- `.pedaco` vira `.naco`.
- `vira_número` aceita vírgula decimal (`"10,50"` vira 10.5), e `.mensagem` dos erros vem em português.
- Número escrito à brasileira (`1.000.000`, ou vírgula onde ela não cabe) vira erro com a correção.

## [1.5.0] — 2026-05-21 — *Goianês na Web (lançamento)*

Lançamento estável da v1.5 com playground web e API do engoianador. O pacote
`goiasscript` no npm sai do `-rc` e os apps ganham seus respectivos targets de
deploy (Vercel + Cloudflare Workers).

### Adicionado

- `src/browser.js` do pacote principal — entry browser-safe que envelopa só
  `SimpleTranspiler` + `GoianoBuiltins`, sem `loadOptional()` (que confunde
  bundlers).
- Campo `exports` no `package.json` do pacote principal expondo `.` (Node) e
  `./browser` (browser/bundler).
- `apps/playground/` — Next.js 15 + Monaco Editor, executando GoiásScript no
  navegador via Web Worker isolado com timeout de 3s. Inclui página
  `/engoianador` integrada à API.
- `apps/engoianador-api/` — Cloudflare Worker que engoiana texto qualquer via
  Groq (`llama-3.1-70b-versatile`) com fallback opcional pro Workers AI,
  rate limit de 10 req/min/IP via KV, CORS por allowlist.
- Scripts root: `playground:dev`/`build`/`start`, `engoianador:dev`/`deploy`/
  `typecheck`.
- Job `build-apps` no CI, dependente do job `test`.
- Smoke test do browser entry no CI.

### Modificado

- Versão `1.5.0-rc.1` → `1.5.0`.
- README, CONTRIBUTING e KEEP-OR-ARCHIVE refletem a entrega do W20 e W23.
- `.gitignore` cobre `.wrangler/`, `apps/*/.env.local`,
  `apps/*/.next/`, `apps/playground/public/examples/` (gerado em build).

## [1.5.0-rc.1] — 2026-05-04 — *Goianês na Web*

Relançamento estratégico após período de hibernação. A v2.0 (nunca lançada
oficialmente) inflou em 38k+ linhas com features que nunca tiveram audiência
hobbyista. Esta versão corta 70% do over-engineering e migra para layout
monorepo, preparando terreno para playground web e ENGOIANADOR API.

### Adicionado

- Layout monorepo com `pnpm workspaces` (pacote principal, `apps/`, `docs/`)
- Documentação de plano em `docs/plano/` (PLANO-RELANCAMENTO, STACK-ZERO-CUSTO, DESIGN-BRIEF)
- `KEEP-OR-ARCHIVE.md` documentando a triagem v1.5
- Padrão `loadOptional()` em `compiler.js` para deps opcionais com no-op fallback
- `path.resolve` em `arma_o_barraco` (suporta caminho absoluto)

### Corrigido

- `_validateSyntax` rejeitava `uai x = valor` (forma JS) e desestruturação
- 3 bugs em `GoianoBuiltins.gerarImplementacaoGoiana()`:
  - Faltavam `const certeza = true` / `const de_jeito_nenhum = false` no runtime
  - `GoianoMath.<método>` em forma de atribuição (era objeto literal)
  - Documentação prefixa o nome do método
- Duplicate keys `indexOf`/`includes` em `metodosGoianos`
- Version drift: `bin/goiasscript.js` e `bin/goias.js` exibiam `v2.0` hardcoded

### Modificado

- Versão `2.0.0` → `1.5.0-rc.1`
- `engines.node`: `>=14.0.0` → `>=18.0.0`
- ESLint thresholds estilísticos (`no-useless-escape`, `max-len`) `error` → `warn`
- Coverage threshold 80% → 50% (debt documentado, retorna na Fase 1)
- Layout monolito → monorepo (`src/` → pasta do pacote principal, etc)

### Arquivado (preservado em `archive/v2-experimental` + tag `v2.0-pre-archive`)

- `src/performance/JITCompiler.js`
- `src/parser/ASTParser.js`
- `src/types/TypeAnalyzer.js`
- `src/modules/ModuleResolver.js`
- `src/packages/PackageManager.js`
- `src/debug/GoianoDebugger.js` + `GoianoDebugAdapter.js`
- servidor LSP completo
- 6 binários CLI: `gs-balaio`, `gs-fuça`, `gspack`, `gsdebug`, `gs-debug-adapter`, `gsrepl`
- Templates `goias-web-framework`, `roda-de-prosa`, `projeto-web`
- Balaios `goiano-http`, `goiano-utils`
- 4 test suites de módulos arquivados
- Docs `RELEASE_NOTES_v2.0.md`, `INSTALACAO_E_TESTES.md`, `PROXIMOS_PASSOS.md`, `ROADMAP.md`

### Removido

- `src/compiler/index.js` (façade dead code com `require()` injection)
- Cruft v1: `goiasscript.js` raiz, `goiasscript.bat`, `scripts/build.js`

### Métricas

| | Staging (v2 inflada) | feat/v1.5-slim |
|---|---:|---:|
| Arquivos rastreados | 140 | 74 (-47%) |
| Tests passando | 160/188 | 85/85 |
| Cobertura | 45.98% | 65.17% |
| Lint errors | 63 | 0 |
| Bin entries | 8 | 2 |

## [1.0.3] — 2025-04-13

### Adicionado

- Sistema de erros goianos personalizados (`ErroGoiano` class)
- Suporte completo a programação assíncrona (async/await)
- Classes e herança com sintaxe goiana
- Extensão VS Code com syntax highlighting v0.2.0

### Corrigido

- Melhoria na tradução de erros JavaScript para português goiano
- Correções na sintaxe de operadores e comparadores

## [1.0.0] — 2025-04-13

### Adicionado

- Lançamento inicial do GoiásScript
- Transpiler básico de GoiásScript para JavaScript
- Sintaxe completa com palavras-chave goianas
- Suporte a todas as funcionalidades JavaScript modernas
- Extensão básica para VS Code
- Documentação completa da linguagem
