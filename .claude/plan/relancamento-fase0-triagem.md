# Plano de Implementação — GoiásScript v1.5 "Goianês na Web" — Fase 0 (Triagem)

**Criado:** 2026-05-03 · **Owner:** Gefferson · **Sprint atual:** W19 (4-10/05/2026)
**Macro-plano:** `goiasscript/PLANO-RELANCAMENTO.md` · **Visão:** `goiasscript/index.md`
**Status:** 📋 Planejado, aguardando confirmação para execução

---

## 🎯 Tipo de tarefa

- [x] **Backend / Refactor** — Triagem + slim down do core JS
- [ ] Frontend (Fase 1 — não escopo deste plano)
- [ ] Fullstack

**Modelo de referência:** synth solo (Codex/Gemini wrapper indisponível) + agente Explore para validação técnica de dependências.

---

## 📋 Contexto e premissas

### Estado atual (verificado)

| Branch  | Arquivos | Status                                            |
|---------|----------|---------------------------------------------------|
| `main`  | 24       | v1.0 enxuta (set/2025) — Syntax Highlight v0.2.0  |
| `staging` | 140    | v2.0 inflada nunca lançada (38k+ linhas)          |

**Branch atual de trabalho:** `staging` (15 commits ahead de main, untracked: `goiasscript/`).
**Pasta `goiasscript/`** contém apenas docs de planejamento (PLANO-RELANCAMENTO.md, index.md) — não é código.

### Decisão arquitetural — Branch base

**Recomendação:** criar `feat/v1.5-slim` a partir de **`staging`**, NÃO de `main`.

**Razão:** `main` (v1.0) não tem os assets que vamos manter (`GoianoBuiltins`, `simpleTranspiler`, `ErroGoiano`, mensagens em goianês refinadas). Vamos triar a `staging`, não recriar do zero.

A pergunta original ("a partir dessa") era ambígua entre main/staging — esta é a recomendação técnica fundamentada.

### Achado crítico (auditoria do Explore agent)

`src/compiler.js` (KEEP) importa hard:
- `./types/TypeAnalyzer` (ARCHIVE proposto)
- `./modules/ModuleResolver` (ARCHIVE proposto)
- `./performance/JITCompiler` (ARCHIVE proposto)

⚠️ **Remover esses arquivos quebra compiler.js.** Precisa refactor antes de arquivar.

**Solução:** trocar `compiler.js` por `simpleTranspiler.js` como entrypoint do v1.5, OU manter feature flags com fallback no-op (já existem: `enableTypeChecking`, `enableModuleResolution`, `enableJIT`). Recomendação: **trocar para simpleTranspiler.js como entrypoint** — é menor blast radius e aderente ao princípio "playground web é só transpilar".

### Esquecimento na triagem original

`src/cli/index.js` (410 linhas) — implementação Command Pattern da CLI principal, não estava em nenhuma categoria. **Adicionar a KEEP.**

---

## 🔪 Solução técnica

### Estratégia em camadas

1. **Não deletar nada nesta fase** — toda a v2 vai pra `archive/v2-experimental` (branch arquivo, não tag).
2. **Branch nova** `feat/v1.5-slim` baseada em `staging` recebe **apenas** o subset KEEP.
3. **Refactor mínimo** do `compiler.js` para remover deps de TypeAnalyzer/ModuleResolver/JITCompiler antes do strip.
4. **Sanity tests** passando ao final (jest com KEEP-only).
5. **PR único** `staging → feat/v1.5-slim` documentando tudo.

### Triagem final consolidada (com ajustes)

#### ✅ KEEP (vai pra v1.5-slim)

**Core transpiler:**
- `src/compiler.js` (refactored — sem deps de archive)
- `src/compiler/index.js`
- `src/compiler/simpleTranspiler.js` ← **entrypoint principal v1.5**
- `src/compiler/lexer.js`
- `src/goianoMethods/GoianoBuiltins.js` ← runtime nativo goiano

**Erros em goianês:**
- `src/errors/ErroGoiano.js`
- `src/errors/errorTranslator.js`

**CLI (esquecido na triagem original, agora incluído):**
- `src/cli/index.js`
- `bin/goiasscript.js`
- `bin/goias.js` (REPL)

**Editor:**
- `vscode-extension/` (já funciona, não tocar nada)

**Exemplos enxutos:**
- `examples/basic/`
- `examples/classes/`

**Testes compatíveis com KEEP:**
- `tests/unit/compiler.test.js`
- `tests/unit/lexer.test.js`
- `tests/unit/errors.test.js`
- `tests/unit/goianoBuiltins.test.js`
- `tests/unit/cli.test.js` (refatorar mocks — só compilar simpleTranspiler)

**Configs essenciais:**
- `package.json` (slim down — remover bin extras)
- `jest.config.js`, `.eslintrc.js`, `.prettierrc`, `.babelrc`
- `LICENSE`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.gitignore`
- `README.md` (reescrever — escopo v1.5)

#### 🗄️ ARCHIVE (mover pra branch `archive/v2-experimental`)

**Over-engineering técnico (legal mas inútil pra audiência hobbyista):**
- `src/performance/JITCompiler.js`
- `src/parser/ASTParser.js`
- `src/types/TypeAnalyzer.js`
- `src/modules/ModuleResolver.js`
- `src/packages/PackageManager.js`
- `src/debug/GoianoDebugger.js` + `GoianoDebugAdapter.js`
- `lsp-server/` (LSP completo)

**CLIs extras sem público:**
- `bin/gs-balaio.js`, `bin/gs-fuça.js`, `bin/gspack.js`
- `bin/gsdebug.js`, `bin/gs-debug-adapter.js`, `bin/gsrepl.js`

**Templates pesados:**
- `templates/goias-web-framework/` (NestJS-like, 17 arquivos)
- `templates/roda-de-prosa/` (DDD-like)
- `templates/projeto-web/` + `templates/dev-server.js`

**Balaios sem ecosystem:**
- `balaios/goiano-http/`
- `balaios/goiano-utils/`

**Testes de archive:**
- `tests/unit/typeAnalyzer.test.js`
- `tests/unit/moduleResolver.test.js`
- `tests/unit/packageManager.test.js`
- `tests/unit/goianoDebugger.test.js`

**Docs antigas:**
- `RELEASE_NOTES_v2.0.md`, `INSTALACAO_E_TESTES.md`, `PROXIMOS_PASSOS.md`, `ROADMAP.md` (reescrever pós-launch)

#### 🗑️ DELETE (zero — tudo vai pra archive primeiro)

Nenhum arquivo deletado nesta fase. Decisão pós-launch (W30+).

---

## 🚶 Passos de implementação

> **Tempo total estimado: 4h** (3h Fase 0 + 1h Fase 0.5 monorepo)

### Sessão 1 — Setup & branches (30 min)

1. **Verificar estado limpo do working tree**
   - `git status` → confirmar `goiasscript/` é a única pasta untracked (planejamento, não-código)
   - Decisão: commitar `goiasscript/PLANO-RELANCAMENTO.md` + `index.md` em `staging` ANTES de branchear (esses docs vão junto)

2. **Commit dos docs de planejamento na staging**
   ```bash
   git add goiasscript/
   git commit -m "docs: adiciona plano de relançamento v1.5"
   ```

3. **Criar branches a partir de staging**
   ```bash
   # Branch arquivo — staging completa preservada
   git branch archive/v2-experimental staging
   git push -u origin archive/v2-experimental

   # Branch de trabalho — onde vai acontecer o slim down
   git checkout -b feat/v1.5-slim
   git push -u origin feat/v1.5-slim
   ```

4. **Tag de safety net**
   ```bash
   git tag -a v2.0-pre-archive staging -m "Snapshot da v2 inflada antes do slim down"
   git push origin v2.0-pre-archive
   ```

**Entregável:** 2 branches novas + 1 tag, todas no remote.

---

### Sessão 2 — Audit + KEEP-OR-ARCHIVE.md (1h)

5. **Inventário completo da staging** (na branch `feat/v1.5-slim`)
   ```bash
   git ls-tree -r HEAD --name-only > /tmp/staging-files.txt
   ```

6. **Criar `KEEP-OR-ARCHIVE.md` no repo**
   - Documenta as 3 listas (KEEP / ARCHIVE / DELETE)
   - Inclui rationale para cada item
   - Inclui o achado das deps quebradas em `compiler.js`

7. **Validar dependências cruzadas**
   ```bash
   # Buscar imports de arquivos ARCHIVE em arquivos KEEP
   grep -rn "require.*\(types\|modules\|performance\|parser\|packages\|debug\)" src/compiler.js src/compiler/ src/goianoMethods/ src/errors/ bin/goiasscript.js bin/goias.js src/cli/
   ```
   - Documentar cada dep encontrada e como vai ser tratada

**Entregável:** `KEEP-OR-ARCHIVE.md` commitado no `feat/v1.5-slim` (ainda não removeu nada).

---

### Sessão 3 — Refactor preventivo do compiler.js (45 min)

**⚠️ Etapa crítica — não pular.**

8. **Refatorar `src/compiler.js`** para tornar deps opcionais com no-op fallback
   - Wrapping em try/catch nos requires de TypeAnalyzer/ModuleResolver/JITCompiler
   - Default behavior quando módulo ausente: pass-through (não quebrar)
   - OU: trocar entrypoint para `simpleTranspiler.js` direto e marcar `compiler.js` como façade legacy

9. **Atualizar `bin/goiasscript.js` e `bin/goias.js`** para usar `simpleTranspiler.js` direto quando feature flags estiverem off

10. **Rodar testes na branch como está**
    ```bash
    npm test
    ```
    - Esperado: passa tudo (refactor não quebrou nada porque deps ainda existem)
    - Salvar baseline de cobertura

**Entregável:** commit de refactor `refactor: torna deps opcionais antes do slim down`.

---

### Sessão 4 — Slim down propriamente (45 min)

11. **Remover ARCHIVE files (em commits separados por categoria)**
    ```bash
    # Commit 1: archive over-engineering técnico
    git rm -r src/performance/ src/parser/ src/types/ src/modules/ src/packages/ src/debug/ lsp-server/
    git commit -m "chore: arquiva over-engineering técnico (JIT/AST/types/modules/packages/debug/lsp)"

    # Commit 2: archive CLIs extras
    git rm bin/gs-balaio.js bin/gs-fuça.js bin/gspack.js bin/gsdebug.js bin/gs-debug-adapter.js bin/gsrepl.js
    git commit -m "chore: arquiva binários CLI sem público (balaio/fuça/pack/debug/repl)"

    # Commit 3: archive templates pesados
    git rm -r templates/goias-web-framework/ templates/roda-de-prosa/ templates/projeto-web/ templates/dev-server.js
    git commit -m "chore: arquiva templates over-engineered (web-framework/roda-de-prosa/projeto-web)"

    # Commit 4: archive balaios
    git rm -r balaios/
    git commit -m "chore: arquiva balaios sem ecosystem"

    # Commit 5: archive testes orfãos
    git rm tests/unit/typeAnalyzer.test.js tests/unit/moduleResolver.test.js tests/unit/packageManager.test.js tests/unit/goianoDebugger.test.js
    git commit -m "chore: arquiva testes de módulos arquivados"
    ```

12. **Atualizar `package.json`**
    - Remover `bin` entries: `gs-balaio`, `gspack`, `gsrepl`, `gsdebug`, `gs-debug-adapter`, `gs-fuça`
    - Manter apenas: `goiasscript`, `goias`
    - Bump versão: `2.0.0` → `1.5.0-rc.1` (sinaliza simplificação consciente)
    - Remover `vscode-debugadapter` das deps
    - Commit: `chore: simplifica package.json para v1.5`

13. **Rodar tests + lint pra confirmar saúde**
    ```bash
    npm test
    npm run lint
    ```

**Entregável:** branch `feat/v1.5-slim` com ~32-35 arquivos, tests passando.

---

### Sessão 5 — Fase 0.5 — Migração para monorepo pnpm (1h)

**Objetivo:** preparar o repo para receber `apps/playground` (W20) e `apps/engoianador-api` (W23) sem migração futura.

**Layout alvo:**
```
goiasscript/                         ← raiz do monorepo
├── packages/
│   └── core/                        ← npm package "goiasscript@1.5.0"
│       ├── src/                     ← (movido de raiz)
│       ├── bin/                     ← (movido de raiz)
│       ├── tests/                   ← (movido de raiz)
│       ├── examples/                ← (movido de raiz)
│       └── package.json             ← bin/files paths atualizados
├── apps/                            ← vazio nesta fase (W20+ enche)
├── docs/
│   └── plano/                       ← goiasscript/PLANO-RELANCAMENTO.md + index.md
├── vscode-extension/                ← MANTÉM na raiz (já é standalone)
├── pnpm-workspace.yaml
├── package.json                     ← root workspace (privado, sem bin)
├── .gitignore, README.md, LICENSE   ← raiz
```

**Steps:**

14. **Decisão sobre pnpm vs npm workspaces**
    - Verificar se `pnpm` está disponível: `pnpm --version`
    - Se não: usar `npm workspaces` (suportado nativamente desde npm 7) — semanticamente equivalente, zero install extra
    - Salvar a escolha no commit message

15. **Criar layout de monorepo**
    ```bash
    mkdir -p packages/core docs/plano apps
    git mv src packages/core/src
    git mv bin packages/core/bin
    git mv tests packages/core/tests
    git mv examples packages/core/examples
    git mv goiasscript/PLANO-RELANCAMENTO.md docs/plano/PLANO-RELANCAMENTO.md
    git mv goiasscript/index.md docs/plano/index.md
    rmdir goiasscript  # se ficou vazia
    ```

16. **Mover `package.json` atual pra `packages/core/package.json`**
    - Atualizar `name`: continua `goiasscript`
    - `version`: `1.5.0-rc.1`
    - `main`: `src/compiler/simpleTranspiler.js`
    - `bin`: paths agora relativos a packages/core (mantém `./bin/goiasscript.js`, `./bin/goias.js`)
    - `files`: `["src/", "bin/", "examples/", "README.md", "LICENSE", "CHANGELOG.md"]` (paths locais ao package)

17. **Criar root `package.json`** (workspace root)
    ```json
    {
      "name": "goiasscript-monorepo",
      "private": true,
      "version": "0.0.0",
      "workspaces": ["packages/*", "apps/*"],
      "scripts": {
        "test": "npm test --workspace=goiasscript",
        "lint": "npm run lint --workspace=goiasscript"
      }
    }
    ```
    - Se pnpm disponível: criar `pnpm-workspace.yaml` em vez disso
    - Husky/lint-staged ficam no root (pre-commit aplica em todos)

18. **Ajustar paths que quebraram**
    - `jest.config.js`: mover pra `packages/core/jest.config.js` ou ajustar `rootDir`
    - `.eslintrc.js`: mover pra `packages/core/` ou estender no root
    - `.babelrc`, `.prettierrc`: ficam no root (aplicam globalmente)
    - `.gitignore`: revisar paths (e.g., `coverage/` agora é em `packages/core/coverage/`)

19. **Validar funcionamento**
    ```bash
    npm install                     # instala workspaces
    npm test --workspace=goiasscript
    npm run lint --workspace=goiasscript
    cd packages/core && node bin/goiasscript.js --version
    ```
    - Esperado: tudo passa, CLI continua executável

20. **Commit final do monorepo**
    ```bash
    git add -A
    git commit -m "refactor: migra para layout monorepo (npm workspaces)"
    ```

**Entregável Sessão 5:** repo no layout final monorepo, `goiasscript` package isolado em `packages/core`, `apps/` vazia pronta pra W20, tests passando.

---

## 📁 Arquivos chave

### Modificações

| Arquivo                              | Operação      | Descrição                                                                |
|--------------------------------------|---------------|--------------------------------------------------------------------------|
| `goiasscript/PLANO-RELANCAMENTO.md`  | Commitar      | Move docs de untracked pra staging                                       |
| `goiasscript/index.md`               | Commitar      | idem                                                                     |
| `src/compiler.js`                    | Refatorar     | Deps opcionais com fallback no-op (ou alternativa: trocar entrypoint)   |
| `bin/goiasscript.js`                 | Refatorar     | Usa simpleTranspiler.js direto                                           |
| `bin/goias.js`                       | Refatorar     | idem                                                                     |
| `package.json`                       | Modificar     | Remove 6 bin entries, bump versão pra 1.5.0-rc.1                         |
| `KEEP-OR-ARCHIVE.md` (NOVO)          | Criar         | Documenta a triagem, rationale, deps quebradas                           |
| `README.md`                          | Não tocar     | Reescrita fica pra W25 (launch day)                                      |
| `tests/unit/cli.test.js`             | Refatorar     | Mocks só do `simpleTranspiler.js`                                        |

### Removidos (vão pra archive/v2-experimental)

- `src/performance/JITCompiler.js`
- `src/parser/ASTParser.js`
- `src/types/TypeAnalyzer.js`
- `src/modules/ModuleResolver.js`
- `src/packages/PackageManager.js`
- `src/debug/GoianoDebugger.js`, `GoianoDebugAdapter.js`
- `lsp-server/` (3 arquivos)
- `bin/gs-balaio.js`, `bin/gs-fuça.js`, `bin/gspack.js`, `bin/gsdebug.js`, `bin/gs-debug-adapter.js`, `bin/gsrepl.js`
- `templates/goias-web-framework/` (17 arquivos)
- `templates/roda-de-prosa/`
- `templates/projeto-web/`, `templates/dev-server.js`
- `balaios/goiano-http/`, `balaios/goiano-utils/`
- 4 arquivos de teste

### Layout final do repo (pós Sessão 5)

```
goiasscript/
├── .claude/, .github/, .husky/, .vscode/    ← config dirs (raiz)
├── apps/                                     ← VAZIO (W20+ enche)
├── docs/plano/                               ← PLANO-RELANCAMENTO.md, index.md
├── packages/core/                            ← npm package goiasscript@1.5.0-rc.1
│   ├── src/{compiler,goianoMethods,errors,cli}/
│   ├── bin/{goiasscript.js, goias.js}
│   ├── tests/unit/{compiler,lexer,errors,goianoBuiltins,cli}.test.js
│   ├── examples/{basic,classes}/
│   ├── package.json (bin paths locais)
│   └── jest.config.js
├── vscode-extension/                         ← intocado
├── package.json                              ← root workspace (privado)
├── pnpm-workspace.yaml | (npm workspaces)
├── README.md, LICENSE, CHANGELOG.md
└── .gitignore, .eslintrc.js, .prettierrc, .babelrc
```

### Branches/tags resultantes

| Ref                          | Conteúdo                                            |
|------------------------------|-----------------------------------------------------|
| `staging` (intocada)         | v2 inflada original (referência histórica)          |
| `archive/v2-experimental`    | Cópia idêntica de staging (preserva tudo)           |
| `feat/v1.5-slim`             | Branch de trabalho com slim down aplicado          |
| `v2.0-pre-archive` (tag)     | Snapshot imutável antes do corte                    |

---

## ⚠️ Riscos e mitigações

| Risco                                              | Mitigação                                                                  |
|----------------------------------------------------|----------------------------------------------------------------------------|
| Refactor de `compiler.js` quebra testes existentes | Rodar `npm test` antes/depois de cada commit. Reverter granularmente se quebrar. |
| Esquecer dep cruzada e quebrar build no W20        | Sessão 2 audita 100% dos imports. Plus: tag `v2.0-pre-archive` permite rollback completo. |
| Decidir errado o que arquiva e perder confiança    | Tudo vai pra `archive/v2-experimental` — recuperável a qualquer momento.   |
| Push força perda de histórico                      | Usar somente push normal (`-u`), nunca `--force`. Branch é nova.           |
| Dúvida do user sobre branch base (main vs staging) | Plano deixa explícito: `staging` é a base certa. User decide antes de executar. |
| Tempo passar de 3h e atrasar Fase 1 (W20)          | Cada sessão tem boundary clara. Se sessão N estoura, congela e revisa antes de continuar. |

---

## ✅ Critério de aceite (Fase 0 / W19)

- [ ] Branch `archive/v2-experimental` no remote, idêntica à staging atual
- [ ] Tag `v2.0-pre-archive` no remote
- [ ] Branch `feat/v1.5-slim` no remote com:
  - [ ] `KEEP-OR-ARCHIVE.md` documentando triagem + deps cruzadas
  - [ ] Refactor de `compiler.js` (deps opcionais)
  - [ ] ~32-35 arquivos versus 140 da staging
  - [ ] `npm test` passando (KEEP-only suite)
  - [ ] `npm run lint` limpo
  - [ ] `package.json` com versão `1.5.0-rc.1` e bin reduzidos
- [ ] `goiasscript/PLANO-RELANCAMENTO.md` commitado em staging (não untracked)
- [ ] Pronto para Sessão 1 da Fase 1 (W20 — Playground Web MVP)

---

## 🔄 Próximas fases (resumo do macro-plano)

| Sprint | Foco                                                                | Esforço |
|--------|---------------------------------------------------------------------|---------|
| **W19 (este plano)** | Triagem + slim down                                       | 3h      |
| W20    | Playground web MVP local (Next.js + Monaco + transpiler)            | 5h      |
| W21-W22 | **PAUSA** — foco 100% Tyrus pre-launch & launch                    | 0h      |
| W23    | ENGOIANADOR backend (Cloudflare Worker + Groq)                      | 6h      |
| W24    | ENGOIANADOR frontend + asset viral pré-produzido (Reels/TikTok 30s) | 6h      |
| W25    | **RELAUNCH DAY** — v1.5.0 tag + Cloudflare Pages + Hashnode + viral | 4h      |

---

## 🧠 SESSION_ID (para uso futuro do /multi-execute)

> ⚠️ Wrapper Codex/Gemini indisponível neste ambiente — análise feita com Claude solo + agente Explore.

- CODEX_SESSION: `n/a (wrapper missing)`
- GEMINI_SESSION: `n/a (wrapper missing)`
- ANALYST_AGENT: Explore agent (validou triagem, identificou deps quebradas em compiler.js + arquivo esquecido `src/cli/index.js`)

Para `/multi-execute` deste plano, executor pode operar com Claude direto — todas as decisões e steps estão pre-cooked.

---

## 🏷️ Tags

#plan #goiasscript #relaunch #v1.5 #fase-0-triagem #2026-W19
