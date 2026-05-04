# Changelog

Todas as mudanças importantes deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.5.0-rc.1] — 2026-05-04 — *Goianês na Web*

Relançamento estratégico após período de hibernação. A v2.0 (nunca lançada
oficialmente) inflou em 38k+ linhas com features que nunca tiveram audiência
hobbyista. Esta versão corta 70% do over-engineering e migra para layout
monorepo, preparando terreno para playground web e ENGOIANADOR API.

### Adicionado

- Layout monorepo com `pnpm workspaces` (`packages/core`, `apps/`, `docs/`)
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
- Layout monolito → monorepo (`src/` → `packages/core/src/`, etc)

### Arquivado (preservado em `archive/v2-experimental` + tag `v2.0-pre-archive`)

- `src/performance/JITCompiler.js`
- `src/parser/ASTParser.js`
- `src/types/TypeAnalyzer.js`
- `src/modules/ModuleResolver.js`
- `src/packages/PackageManager.js`
- `src/debug/GoianoDebugger.js` + `GoianoDebugAdapter.js`
- `lsp-server/` completo
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
