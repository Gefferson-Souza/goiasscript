# Triagem v1.5 — KEEP / ARCHIVE / DELETE

**Branch:** `feat/v1.5-slim` · **Base:** `staging` (commit `e14b7c3`) · **Data:** 2026-05-03

> Este documento explica **o que ficou no v1.5 e o que foi arquivado**, com o
> rationale e as dependências cruzadas mapeadas. A v2 inflada está preservada
> integralmente em `archive/v2-experimental` (e na tag `v2.0-pre-archive`)
> para recuperação a qualquer momento.

---

## ✅ KEEP — vai pro v1.5

### Core transpiler

| Caminho | Razão |
|---|---|
| `src/compiler.js` | Façade principal, refatorada para deps opcionais com no-op fallback |
| `src/compiler/index.js` | Façade alternativa (não importada em runtime, mas mantida com mesmo refactor) |
| `src/compiler/simpleTranspiler.js` | **Entrypoint real do v1.5** — transpilação direta GoiásScript → JS |
| `src/compiler/lexer.js` | Tokenizer compartilhado |
| `src/goianoMethods/GoianoBuiltins.js` | Runtime nativo goiano (`.gritando()`, `.bota_no_final()` etc) |

### Mensagens em goianês

| Caminho | Razão |
|---|---|
| `src/errors/ErroGoiano.js` | Classe de erro com sotaque |
| `src/errors/errorTranslator.js` | Traduz JS exceptions para goianês |

### CLI

| Caminho | Razão |
|---|---|
| `src/cli/index.js` | **(esquecido na triagem original)** — Command Pattern, 410 linhas |
| `bin/goiasscript.js` | CLI principal (`traduz`, `bota_pra_moer`, `arma_o_barraco`) |
| `bin/goias.js` | REPL (Roda de Prosa) |

### Editor & exemplos

| Caminho | Razão |
|---|---|
| `vscode-extension/` | Já funciona, é asset de divulgação no marketplace |
| `examples/basic/` | Exemplos enxutos pro README + playground W20 |
| `examples/classes/` | Idem |

### Testes compatíveis com KEEP

| Caminho | Status baseline |
|---|---|
| `tests/unit/compiler.test.js` | ✅ PASS |
| `tests/unit/lexer.test.js` | ✅ PASS |
| `tests/unit/errors.test.js` | ✅ PASS |
| `tests/unit/cli.test.js` | ✅ PASS |
| `tests/unit/goianoBuiltins.test.js` | ⚠️ FAIL (pré-existente, não introduzido pelo slim down — investigar em sessão futura) |

### Configs essenciais

`package.json`, `jest.config.js`, `.eslintrc.js`, `.prettierrc`, `.babelrc`,
`.gitignore`, `LICENSE`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`,
`SECURITY.md`, `README.md`.

---

## 🗄️ ARCHIVE — preservado em `archive/v2-experimental`, removido do v1.5

### Over-engineering técnico

| Caminho | Razão de arquivamento |
|---|---|
| `src/performance/JITCompiler.js` | JIT em DSL hobbyista é academic — ninguém vai bater hot path em GoiásScript |
| `src/parser/ASTParser.js` | Parser AST elaborado nunca usado pelo `simpleTranspiler.js` (paths divergentes) |
| `src/types/TypeAnalyzer.js` | Sistema de tipos sem demanda de usuário |
| `src/modules/ModuleResolver.js` | Sem ecosystem real, audiência hobbyista não usa import nativo |
| `src/packages/PackageManager.js` | `gs-balaio` sem balaios pra gerenciar |
| `src/debug/GoianoDebugger.js` + `GoianoDebugAdapter.js` | DAP completo com audiência zero |
| `lsp-server/` | LSP server para uma linguagem que ninguém escreve em IDE |

### CLIs extras sem público

| Caminho | Razão |
|---|---|
| `bin/gs-balaio.js` | Dependia de `PackageManager` (archive) |
| `bin/gs-fuça.js` (nota: nome físico é `gs-fuça.js`?) | Dependia de `GoianoDebugger` |
| `bin/gspack.js` | Idem `gs-balaio` (alias antigo) |
| `bin/gsdebug.js` | Idem `gs-fuça` |
| `bin/gs-debug-adapter.js` | DAP wrapper |
| `bin/gsrepl.js` | Substituído por `bin/goias.js` |

### Templates pesados

| Caminho | Razão |
|---|---|
| `templates/goias-web-framework/` (17 arquivos) | NestJS-like em GoiásScript — over-scoped |
| `templates/roda-de-prosa/` | DDD-like em GoiásScript — over-scoped |
| `templates/projeto-web/` + `templates/dev-server.js` | Web framework dev server, redundante com playground W20 |

### Balaios sem ecosystem

| Caminho | Razão |
|---|---|
| `balaios/goiano-http/` | Cliente HTTP em GoiásScript — sem demand |
| `balaios/goiano-utils/` | Utils — sem demand |

### Testes orfãos (módulos archive-dos)

| Caminho |
|---|
| `tests/unit/typeAnalyzer.test.js` |
| `tests/unit/moduleResolver.test.js` |
| `tests/unit/packageManager.test.js` |
| `tests/unit/goianoDebugger.test.js` |

### Docs antigas (a reescrever pós-launch)

`RELEASE_NOTES_v2.0.md`, `INSTALACAO_E_TESTES.md`, `PROXIMOS_PASSOS.md`, `ROADMAP.md`.

---

## 🗑️ DELETE — nenhum arquivo nesta fase

Decisão consciente: tudo vai pra archive primeiro. Decisão de delete fica pra W30+ (pós-validação do launch).

---

## 🔗 Mapa de dependências cruzadas (validado)

A auditoria identificou que **arquivos KEEP importavam diretamente arquivos
ARCHIVE** — situação que quebraria o build após o slim down. Soluções aplicadas
na Sessão 3 (refactor preventivo):

| Arquivo (KEEP) | Importava (ARCHIVE) | Solução |
|---|---|---|
| `src/compiler.js` | `./types/TypeAnalyzer` | `loadOptional()` + `NoopTypeAnalyzer` |
| `src/compiler.js` | `./modules/ModuleResolver` | `loadOptional()` + `NoopModuleResolver` |
| `src/compiler.js` | `./performance/JITCompiler` | `loadOptional()` + `NoopJITCompiler` |
| `src/compiler/index.js` | `../types/TypeAnalyzer` | Mesmo padrão |
| `src/compiler/index.js` | `../modules/ModuleResolver` | Mesmo padrão |

**Padrão `loadOptional`:** `try { require(path) } catch (MODULE_NOT_FOUND) { fallback }`.
Quando os módulos archive-dos são re-introduzidos no futuro (ex. Fase 5 do
macro-plano), basta restaurar os arquivos — o compiler detecta automaticamente.

**Validação:** simulação de `MODULE_NOT_FOUND` via mock de `Module._resolveFilename`
mostrou que o transpile principal (`uai`/`prosa`/expressões básicas) continua
funcionando com os fallbacks.

---

## 📊 Tamanho esperado

| Métrica | Antes (staging) | Depois (feat/v1.5-slim) |
|---|---|---|
| Arquivos rastreados | 140 | ~36 |
| Linhas (insertions desde main) | 38.692 | ~5.000 (estimativa) |
| Testes ativos | 188 (28 failing) | ~120 (compatíveis com KEEP) |
| Bin entries em `package.json` | 8 | 2 (`goiasscript`, `goias`) |
| Versão | `2.0.0` | `1.5.0-rc.1` |

---

## 🚪 Como recuperar conteúdo arquivado

```bash
# Ver tudo que foi arquivado
git diff feat/v1.5-slim..archive/v2-experimental --name-only

# Restaurar 1 arquivo específico
git checkout archive/v2-experimental -- src/types/TypeAnalyzer.js

# Trabalhar diretamente na branch arquivo
git checkout archive/v2-experimental
```

A tag `v2.0-pre-archive` aponta pro último commit da staging antes do slim
down — snapshot imutável.
