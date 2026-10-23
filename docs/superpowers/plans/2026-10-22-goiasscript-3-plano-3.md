# GoiásScript 3 — Plano 3 (Fases 4 a 9: playground, extensão, cartilha, Engoianador, docs e relançamento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Execução igual à dos planos 1 e 2 (D12): grafo de unidades, worktree por unidade, TDD, revisor independente em contexto
> fresco, passada de limpeza ("de-sloppify"), fila de merge e gate humano ao fim de cada fase.

> **Cobertura deste plano.** O volume das Fases 4 a 9 não cabe num plano só no nível de detalhe do plano 2. Este plano
> traz **as Fases 4 (playground) e 5 (extensão VS Code) com detalhe completo** (unidades `U4-NN` e `U5-NN`, com
> arquivos, interfaces, testes RED, aceite e commit) e **as Fases 6 a 9 em esboço** (`U6-NN` a `U9-NN`: id, escopo,
> dependências e aceite, sem passos). O spec (§10.2) manda escrever cada plano ao fim da fase anterior, já com os nomes
> reais do código; por isso os esboços das Fases 6 a 9 são detalhados num **plano 4**, escrito depois do GATE 5 (cartilha
> e Engoianador dependem de nomes que só existem depois do playground), e o esboço aqui serve para travar o grafo, as
> dependências entre fases e a lista de tarefas do dono.

**Goal:** Entregar os sub-projetos 4 e 5 do spec e deixar travado o caminho até o relançamento: playground no ar
(preparado para deploy), com diagnósticos ao vivo, autocomplete, "JS gerado" lado a lado, execução em Web Worker com CSP
por recurso e doação configurável; extensão `goiasscript-vscode` empacotada, testada contra nomes hostis e Modo
Restrito, com o workflow de publicação pronto para Marketplace e Open VSX.

**Architecture:**
- **Playground (Fase 4):** `apps/playground` (Next.js 15, App Router, Monaco hospedado no próprio site) passa a consumir
  `@goiasscript/compiler`, `@goiasscript/language` e `@goiasscript/optimizer` por workspace; o legado `goiasscript-legacy`
  sai das dependências. A compilação roda na thread da página (debounce), o otimizador (Terser) é um chunk carregado sob
  demanda. A execução roda no candidato escolhido no spike (`worker-file`): um runner estático em `/sandbox/runner.js`,
  servido com CSP isolada por cabeçalho, recebe o JS emitido (alvo `playground`) por `postMessage` e o executa por
  `import()` de blob; o host trata toda mensagem do Worker como dado não confiável. A fronteira de segurança é a CSP, não o
  sombreamento de globais.
- **Extensão (Fase 5):** pacote novo `packages/vscode`. O compilador vai embutido por esbuild (sem servidor LSP);
  diagnósticos, autocomplete e hover usam `@goiasscript/compiler` e `@goiasscript/language` em processo. `traduz` e
  `bota_pra_moer` executam o CLI embutido por `execFile` (lista de argumentos, nunca shell), só para `file:` e
  `bota_pra_moer` só com o workspace confiável. Toda a lógica fica em módulos puros sobre uma interface `ExtensionHost`;
  só `src/host/**` e `src/extension.ts` importam `vscode`.

**Tech Stack:** Node `>=22.12` (engines) com toolchain `>=22.22.1`; TypeScript 6.0.3; Next.js 15 (já usado), React 18,
Monaco 0.55 (já usado), Tailwind 3 (já usado); Playwright (Chromium, Firefox e WebKit) para o E2E do playground;
`@vscode/test-electron` e `@vscode/vsce` para a extensão; esbuild 0.28.2; Vitest 5; sem dependência nova de runtime no
`@goiasscript/compiler`. Dependências novas (cada uma com versão exata fixada na unidade que a introduz, conferida no
registro no dia): `@types/vscode`, `@vscode/test-electron`, `@vscode/vsce`, `ovsx` (só devDependency do pacote
`vscode`), `@playwright/test` (já existe no `playground-e2e`).

**Spec:** `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md`: §6.3, §6.4, §6.5, §6.6, §8.1 (Segurança e escopo
dos gates, item c), §8.2 (E2E, regressão dos CRITICAL da extensão), §8.3, §8.5, §8.6, §9.4, §9.5, §10.1 (Fases 4 a 9),
§10.3, §10.4, §11. Pendências herdadas: `docs/fase-2/relatorio-gate.md` e `docs/fase-3/relatorio-gate.md`. Evidência do
sandbox: `docs/fase-0/spike-sandbox.md`. Publicação da extensão: `docs/fase-0/publicacao-extensao.md`, ADR-0009.

## Global Constraints

Valem todas as dos planos 1 e 2. Repetidas aqui porque cada unidade roda em contexto fresco:

- **TDD com RED observado:** o teste é escrito antes, roda e falha pelo motivo certo (a saída da falha é colada no
  commit do teste ou na revisão), só então a implementação mínima. Cobertura ≥ 80% por pacote e de patch.
  `corepack pnpm verify` verde ao fim de toda unidade.
- **Idioma:** identificadores de código **sempre em inglês**, inclusive em testes, fixtures, nomes de arquivo internos e
  scripts. Português só em comentários, títulos de teste (`describe`/`it`) e strings que o usuário vê. A superfície é em
  goianês ("o que os goianos falam" vence clareza nacional): botões, mensagens, páginas de erro, comandos da extensão,
  descrições do manifesto.
- **Comentários:** só o porquê não óbvio, máximo de 4 linhas, acima do bloco. Nada de referência a unidade, fase, achado
  ou versão. `TODO` só como `TODO(GS-<n>)` com a issue aberta.
- **Código:** sem `any`, sem `console.log` (e sem `console` em produção), sem número ou texto mágico (constante nominal
  em `*.constants.ts`), `readonly` e imutabilidade por padrão, funções com menos de 50 linhas, arquivos de até 400
  linhas (limite duro 800), aninhamento de até 4, tipos e constantes em arquivos próprios (`*.types.ts`,
  `*.constants.ts`).
- **Commits:** Conventional Commits em português, minúsculo, `<type>(<escopo>): descrição`. Escopos aceitos pelo
  commitlint: `language`, `compiler`, `optimizer`, `cli`, `vscode`, `playground`, `engoianador`, `docs`, `ci`, `deps`,
  `release`. Cabeçalho de até 72 caracteres. **Sem trailer de atribuição de IA** e sem ID Jira. Nada de `git push`, PR,
  publicação nem mudança de configuração do GitHub, do npm, da Vercel, do Cloudflare ou dos marketplaces sem aprovação
  explícita do dono.
- **Documentos novos** não citam e-mail pessoal, caminho absoluto da máquina, dado pessoal nem empregador. Contato
  público vem de configuração, nunca do texto.
- **Tarefas do dono não são unidades.** Publicar no npm, Marketplace ou Open VSX, criar projeto/domínio na Vercel,
  registrar chaves (Groq, Cloudflare), criar ambientes e segredos no GitHub e criar tags são tarefas do dono (seção
  "Tarefas do dono"). As unidades param no ponto de entrega preparada: workflow pronto, configuração por variável de
  ambiente, **nenhum valor de segredo no repositório**, nenhum comando de publicação executado.
- **Sobreposição de arquivos:** unidades da mesma camada do grafo rodam em paralelo em worktrees e **não editam o mesmo
  arquivo**. Arquivo compartilhado nasce na unidade da camada anterior (com stubs por feature) e cada unidade seguinte
  só edita o próprio stub. Quando duas camadas diferentes tocam o mesmo arquivo, a tabela de arquivos compartilhados
  (abaixo) diz quem é o dono em cada momento.
- **Uma fase por PR** de menos de 100 commits (rebase, um commit por unidade; D13). Toda fase termina com uma unidade de
  gate que escreve `docs/fase-N/relatorio-gate.md`.
- **Escopo dos gates em `apps/*` (§8.1, item c):** catraca por arquivo. Todo arquivo de `apps/*` criado ou alterado
  nestas fases obedece a **todos** os gates (ESLint estrito, scanner, `max-lines`, knip) e **sai** de
  `tools/rules-scan/baseline.json`; o baseline só encolhe e a unidade que reescreve o arquivo faz a remoção.
  `apps/*` hoje está fora do ESLint e do knip por glob (`eslint.config.mjs`, `knip.json`): a U4-03 traz
  `apps/playground`, `apps/playground-e2e` e (na Fase 7) `apps/engoianador-api` para dentro.

Específicas do playground (Fase 4):

- **A CSP é a barreira real.** Nenhuma proteção do playground depende de checagem estática do compilador nem de
  sombreamento de globais. `x["con" mais "structor"]` compila e fica contido pela CSP do runner (`default-src 'none'`,
  `connect-src 'none'`). Texto vindo do Worker (log, pergunta, erro) é **dado**: nunca `innerHTML`, nunca `eval`, nunca
  usado como URL, sempre cortado nos tetos.
- **Sem segredo no front.** `NEXT_PUBLIC_*` é público por definição; o que for URL pública (domínio, Engoianador,
  Pix, Sponsors, Ko-fi, contato) vem de configuração validada em `site-config.ts`; valor ausente desliga o recurso,
  valor igual ao do `.env.example` derruba o build de produção.
- **Navegadores:** piso Chrome/Edge 110, Firefox 115, Safari 16. O E2E cobre Chromium, Firefox e WebKit.
- **Sem `console`** no código do app. O runner substitui `console` no escopo do Worker por um coletor que fala por
  `postMessage`; é o único lugar que menciona `console`, e o ESLint tem override de `files` restrito a esse arquivo,
  com teste em `tools/config-tests`.

Específicas da extensão (Fase 5):

- **Sem shell, nunca.** Nenhum `exec`, `execSync`, `spawn` com `shell: true`, `Terminal.sendText` com nome de arquivo nem
  concatenação de comando. O nome do arquivo chega ao `execFile` como **um único elemento** do argv, depois de `--`.
- **Só `file:`.** `document.uri.scheme !== 'file'` é recusado antes de qualquer outra coisa.
- **Modo Restrito:** `traduz` e os diagnósticos não executam código do aluno; `bota_pra_moer` executa e só roda com
  `vscode.workspace.isTrusted` (`when: isWorkspaceTrusted` nos menus e atalhos **e** checagem em runtime).
  `capabilities.untrustedWorkspaces = { supported: 'limited', description: <goianês> }`.
- **`vscode` só em `src/host/**` e `src/extension.ts`** (regra de ESLint com teste em `tools/config-tests`); tudo mais
  é testável sem VS Code.
- **Markdown de hover nunca é confiável:** `MarkdownString` com `isTrusted = false`, `supportHtml = false`; texto do
  programa do aluno entra escapado.
- **Sem debugger, sem LSP separado, sem telemetria.** Contribuição do legado (`debuggers`, temas, language pack,
  framework) não existe na casca nova.
- **Pacote publicado:** sem `.ts`, sem `src/`, sem teste, sem mapa de fonte; contém só `dist/**`, gramática, snippets,
  ícones, `language-configuration.json`, `README.md`, `LICENSE`, `CHANGELOG.md` e o manifesto.

## Review Focus

1. **Sandbox do playground** (U4-04, U4-11): fuga por `Function('return this')()`, `importScripts`, `XMLHttpRequest`,
   `WebSocket`, `fetch`, `import()` de URL externa, `[].constructor.constructor("return this")()` (falha já na
   compilação), `x["con" mais "structor"]` (compila e fica contido), `navigator.sendBeacon`, `BroadcastChannel`; Worker
   que forja `finished`/`ask`/`log` para enganar o host; log gigante; laço infinito (GS0701, depois `terminate`); laço
   dentro de `daqui_a_pouco` (o `loopLimit` do compilador não cobre; o tempo máximo do host cobre); pergunta que nunca é
   respondida; segredo do host (`localStorage` do host) inalcançável pelo Worker.
2. **Configuração pública e doação** (U4-06): link de doação ausente não renderiza; valor igual ao `.env.example` derruba
   o build de produção; URL com esquema `javascript:` ou `data:` recusada; `rel="noopener noreferrer"`; nenhuma chave
   embutida; páginas de erro e 404 em goianês sem vazar pilha.
3. **Diagnósticos ao vivo** (U4-01, U4-05): arquivo grande com milhares de diagnósticos não trava a aba (teto de
   marcadores, compilador linear); acento NFC/NFD, emoji (par substituto) e `\r\n` convertem para a posição certa do
   Monaco; programa com `pergunta` e erro de compilação juntos.
4. **Extensão e nomes hostis** (U5-04, U5-06): `a$(touch PWNED).gs`, `` a`touch PWNED`.gs ``, `a";touch PWNED;".gs`,
   `a;b.gs`, `a b.gs`, `-x.gs`; documento `untitled:`, `vscode-remote:` e `git:`; workspace não confiável; terminal
   que mostra o nome do arquivo com sequência de controle (título e eco sanitizados).
5. **Publicação** (U5-07): o `.vsix` publicado é o testado (mesmo sha256) nos dois marketplaces; token do Open VSX só no
   passo que publica; `id-token: write` só no job de Marketplace; versão do `package.json` igual à da tag;
   actions pinadas por SHA.

---

## Como executar este plano

Valem as regras dos planos 1 e 2 ("Como executar"). Diferenças:

- **Branch de integração:** `v3/integracao` (a mesma), com o GATE 3 aprovado e a Fase 3 já na `main` por PR de fase
  (rebase). Worktree por unidade: `git worktree add ../goiasscript-wt/<id> -b v3/<id> v3/integracao`.
- **Execução dos testes:** Fase 4, `corepack pnpm exec vitest run --project playground <arquivo>` (projeto novo,
  criado na U4-03); E2E, `corepack pnpm --filter playground-e2e test:e2e` (fora do `verify`: lento, entra no workflow
  `playground-e2e.yml`); Fase 5, `corepack pnpm --filter goiasscript-vscode exec vitest run <arquivo>`; testes dentro do
  VS Code, `corepack pnpm --filter goiasscript-vscode test:integration` (fora do `verify`, entra em `vscode.yml`).
- **`verify`** continua o do plano 1 e passa a cobrir também o app do playground (typecheck, ESLint, knip, Vitest) e o
  pacote `vscode`.
- **Workflows novos ficam em arquivos próprios** (`playground-e2e.yml`, `playground-smoke.yml`, `vscode.yml`,
  `release-vscode.yml`) para não gerar conflito de edição no `ci.yml`. O `ci.yml` só é editado na U4-03 (matriz de
  projetos) e na U5-01 (projeto `goiasscript-vscode`).
- **Gates humanos:** GATE 4 (`docs/fase-4/relatorio-gate.md`, U4-13) e GATE 5 (`docs/fase-5/relatorio-gate.md`, U5-08);
  aprovação do dono, e só então push, PR de fase por rebase e as tarefas do dono da fase.

### Arquivos compartilhados entre unidades (quem edita e quando)

| Arquivo | Criado por | Depois editado por (em camadas diferentes) |
|---|---|---|
| `vitest.config.mts`, `eslint.config.mjs`, `knip.json` | U4-03 | U5-01 (uma linha cada, projeto/pacote `vscode`) |
| `.dependency-cruiser.cjs` | existente | U4-09 (remove a exceção do legado), U5-01 (camada `vscode`) |
| `tools/rules-scan/baseline.json` | existente | cada unidade que reescreve um arquivo de `apps/*` remove a própria entrada |
| `.github/workflows/scheduled.yml` | existente | U4-02 (mutação do `cli`), U4-06 (URLs de doação) |
| `apps/playground/app/layout.tsx` | existente | U4-06 (metadados e configuração) — nenhuma outra unidade da Fase 4 |
| `apps/playground/app/page.tsx`, `components/**` | existente | U4-09 (casca da interface) |
| `apps/playground-e2e/playwright.config.ts`, `tests/support/**` | U4-08 | nenhuma (U4-11 e U4-12 só criam specs) |
| `packages/vscode/src/extension.ts`, `src/features/*.feature.ts` | U5-01 (stubs) | uma unidade por stub (U5-02, U5-03, U5-04) |
| `packages/vscode/package.json` (`contributes`) | U5-01 | nenhuma (os caminhos de gramática, snippets e ícones são contratados em U5-01 e criados em U5-05) |

## Mapa de arquivos (estado ao fim das Fases 4 e 5)

```
apps/playground/                  Next.js 15; consome @goiasscript/{compiler,language,optimizer}
  package.json  next.config.ts  tsconfig.json  vercel.json  .env.example  README.md
  config/{security-headers.ts,security-headers.constants.ts,site-config.ts,site-config.types.ts,run-limits.constants.ts}
  app/{layout.tsx,page.tsx,not-found.tsx,error.tsx,global-error.tsx,opengraph-image.tsx,doacao/page.tsx,engoianador/{layout,page}.tsx}
  components/{Editor,GeneratedPanel,OutputPanel,Toolbar,AskBox,TargetSwitch,DonationLinks,ShareCard}.tsx
  lib/
    compile-service.ts  compile-service.types.ts  diagnostic-markers.ts  editor-position.ts
    monaco/{register-language.ts,completion-provider.ts,hover-provider.ts,monaco-assets.ts}
    run/{runner-client.ts,runner-client.types.ts,message-guards.ts,output-buffer.ts,run-state.ts}
    {examples.ts,saved-code.ts,share-link.ts,lesson-routes.ts,engoianador-client.ts,test-ids.constants.ts}
  sandbox/{runner.ts,run-program.ts,protocol.types.ts,protocol.constants.ts}
  scripts/{build-runner.ts,build-examples.ts,copy-monaco.ts,check-public-config.ts,smoke-playground.ts}
  public/{sandbox/runner.js (gerado),examples/*.gs (gerado),vs/ (gerado)}
  tests/*.test.ts
apps/playground-e2e/
  package.json  playwright.config.ts
  tests/support/{playground-page.ts,hostile-programs.ts,canary-server.ts}
  tests/{sandbox-attacks,sandbox-limits,editor-diagnostics,editor-autocomplete,split-view,run-output,ask-box,donation-guard,engoianador}.spec.ts
packages/compiler/src/diagnostics/…                         (U4-01: ordenação e deduplicação lineares)
packages/cli/src/repl/…  packages/cli/stryker.config.mjs    (U4-02)
.github/workflows/{playground-e2e.yml,playground-smoke.yml,vscode.yml,release-vscode.yml}
packages/vscode/                  npm/Marketplace `goiasscript-vscode`; privado no workspace
  package.json  README.md  CHANGELOG.md  language-configuration.json  budgets.json
  vitest.config.ts  vitest.integration.config.ts  .vscodeignore
  src/
    extension.ts                                            sem lógica; único (com host/) que importa `vscode`
    host/{extension-host.types.ts,vscode-host.ts}
    features/{diagnostics,completion,hover,commands}.feature.ts
    diagnostics/{to-host-diagnostic.ts,live-diagnostics.ts,diagnostics.constants.ts}
    language/{completion-items.ts,hover-content.ts,word-at.ts}
    commands/{command-guards.ts,cli-invocation.ts,run-translate.ts,run-program.ts,program-terminal.ts,sanitize-terminal-text.ts,commands.types.ts}
    settings/{settings.ts,settings.types.ts}
  assets/{icons/*.svg,icon-theme.json}                      (copiados do legado, sem código)
  syntaxes/goiasscript.tmLanguage.json  snippets/goiasscript.json   (gerados; conferidos por drift test)
  tests/{manifest,manifest-assets,diagnostics,live-diagnostics,completion,hover,command-guards,cli-invocation,
         program-terminal,settings,package-contents}.test.ts
  tests/support/{fake-host.ts,fake-exec-file.ts}
  tests/integration/{runner.ts,hostile-names.test.ts,untrusted-workspace.test.ts,scheme-guard.test.ts,diagnostics.test.ts,fixtures/**}
scripts/{build-vscode.ts,pack-vscode.ts,release-target-vscode.ts,smoke-extension.ts}
tools/config-tests/tests/{eslint-matrix.test.mjs,release-vscode-workflow.test.mjs,playground-workflows.test.mjs}
docs/fase-4/relatorio-gate.md  docs/fase-5/relatorio-gate.md
```

## Grafo de unidades — Fase 4 (playground)

| id | Unidade | depende de | tier | spec |
|---|---|---|---|---|
| U4-01 | Compilador: diagnósticos em escala linear (achado 3 do gate 3) | GATE 3 | medium | §8.2, §5.11 |
| U4-02 | CLI: REPL linear (achado 4 do gate 3) e mutação do pacote `cli` | GATE 3 | medium | §6.2, §8.2 |
| U4-03 | Base do app: dependências novas, configuração pública, cabeçalhos de segurança, gates de `apps/playground` | GATE 3 | large | §6.3, §8.1 (c) |
| U4-04 | Sandbox: runner estático, protocolo, cliente e limites | U4-03 | large | §6.3, §8.2 |
| U4-05 | Serviço de compilação, marcadores, autocomplete e hover no Monaco | U4-01, U4-03 | large | §6.3, §5.9 |
| U4-06 | Doação, páginas de erro em goianês, imagem de compartilhamento | U4-03 | medium | §6.3 |
| U4-07 | Página do Engoianador: configuração, aviso de privacidade e erros em goianês | U4-03 | small | §6.6 |
| U4-08 | Infra do E2E: Playwright em três navegadores, servidor, fixtures e workflow | U4-03 | medium | §8.2, §8.3 |
| U4-09 | Casca da interface: tela dividida, execução, pergunta, exemplos, código salvo, compartilhar | U4-04, U4-05, U4-06 | large | §6.3 |
| U4-10 | Deploy preparado e smoke pós-deploy | U4-03, U4-06 | small | §6.3, §2.3 S7 |
| U4-11 | E2E de sandbox e segurança | U4-04, U4-08, U4-09 | medium | §8.2 |
| U4-12 | E2E do editor e da interface | U4-07, U4-08, U4-09 | medium | §8.2, §11 |
| U4-13 | Revisão de segurança do sandbox e da doação; relatório do gate da Fase 4 | U4-10, U4-11, U4-12 | medium | §10.1 F4 |
| **GATE 4** | E2E ampliado verde em três navegadores; `security-reviewer` sem CRITICAL/HIGH; guarda de doação verde; dono cria projeto Vercel/domínio | | | |

Camadas paralelas: {U4-01, U4-02, U4-03} · {U4-04, U4-05, U4-06, U4-07, U4-08} · {U4-09, U4-10} · {U4-11, U4-12} ·
{U4-13}. Arquivos sem sobreposição dentro de cada camada (ver "Files" de cada unidade).

## Interfaces compartilhadas — Fase 4 (contrato entre unidades)

```ts
// apps/playground/config/run-limits.constants.ts
export const RUN_LIMITS = {
  maxRunMs: 10_000,       // teto de relógio por execução; passou, o host chama terminate()
  idleMs: 400,            // sem mensagem do Worker por este tempo e sem pergunta pendente = execução terminou
  maxLogLines: 1_000,
  maxLogChars: 200_000,
  maxLineChars: 10_000,
  maxPromptChars: 500,
  loopLimit: 1_000_000,   // CompileOptions.loopLimit do alvo playground (GS0701)
} as const;
export type RunLimits = typeof RUN_LIMITS;

// apps/playground/sandbox/protocol.types.ts — o ajudante $gs_pergunta do alvo playground já fala `gs:pergunta`/`gs:resposta`
export type HostToRunner =
  | { readonly type: 'gs:executar'; readonly runId: number; readonly code: string }
  | { readonly type: 'gs:resposta'; readonly value: string };
export type RunnerToHost =
  | { readonly type: 'gs:pronto' }
  | { readonly type: 'gs:log'; readonly runId: number; readonly stream: 'out' | 'err'; readonly text: string }
  | { readonly type: 'gs:pergunta'; readonly prompt: string }
  | { readonly type: 'gs:terminou'; readonly runId: number }
  | { readonly type: 'gs:falhou'; readonly runId: number; readonly stack: string; readonly errorName: string };

// apps/playground/lib/run/runner-client.types.ts
export type RunEvent =
  | { readonly kind: 'out'; readonly text: string }
  | { readonly kind: 'err'; readonly text: string }
  | { readonly kind: 'ask'; readonly prompt: string }
  | { readonly kind: 'failed'; readonly diagnostic: Diagnostic }      // já traduzido por translateRuntimeError
  | { readonly kind: 'truncated'; readonly reason: 'lines' | 'chars' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'finished' }
  | { readonly kind: 'stopped' };
export interface WorkerPort { postMessage(message: HostToRunner): void; terminate(): void; onmessage: ((event: { readonly data: unknown }) => void) | null }
export interface RunnerClient {
  run(request: { readonly compiled: CompileSuccess; readonly source: string; readonly fileName: string }, onEvent: (event: RunEvent) => void): void;
  answer(value: string): void;
  stop(): void;                        // terminate() e evento 'stopped'
  dispose(): void;
}
export function createRunnerClient(options: { readonly createWorker: () => WorkerPort; readonly limits: RunLimits; readonly now: () => number; readonly timers: TimerPort }): RunnerClient;

// apps/playground/lib/compile-service.types.ts
export type TargetView = 'didactic' | 'optimized';
export interface CompileView {
  readonly result: CompileResult;                 // alvo playground, com loopLimit
  readonly generatedCode: string | null;          // didático ou otimizado, conforme TargetView
  readonly markers: readonly EditorMarker[];      // no máximo MAX_MARKERS (200)
  readonly hiddenMarkerCount: number;
}
export interface EditorMarker { readonly code: string; readonly severity: 8 | 4; /* MarkerSeverity do Monaco: 8 erro, 4 aviso */ readonly message: string; readonly startLineNumber: number; readonly startColumn: number; readonly endLineNumber: number; readonly endColumn: number; readonly lessonUrl?: string }
export function createCompileService(options: { readonly tone: Tone; readonly loadOptimizer: () => Promise<typeof import('@goiasscript/optimizer')> }): {
  compile(source: string, view: TargetView): Promise<CompileView>;
};

// apps/playground/config/site-config.types.ts
export interface SiteConfig {
  readonly siteUrl: string | null;
  readonly engoianadorUrl: string | null;
  readonly donation: { readonly pixKey: string | null; readonly sponsorsUrl: string | null; readonly kofiUrl: string | null };
  readonly contactUrl: string | null;
}
export function readSiteConfig(env: Readonly<Record<string, string | undefined>>, mode: 'development' | 'production'): SiteConfig; // lança ConfigError em produção se valor == .env.example ou URL inválida
```

(`Diagnostic`, `CompileResult`, `CompileSuccess`, `Tone` e `RuntimeErrorContext` vêm de `@goiasscript/compiler`;
`TimerPort` é `{ setTimeout, clearTimeout }` injetável para testar sem relógio real.)

---

## Fase 4

### U4-01: Compilador: diagnósticos em escala linear
**Spec:** §5.11, §8.2 (propriedades), gate 3 §6.1 achado 3 · **Tier:** medium · **Depende de:** GATE 3 · **Risco:** otimizar a ordenação/deduplicação mudando a ordem dos diagnósticos na mesma posição (a ordem na mesma posição não é especificada, §9.5, mas os goldens a fixam); quebrar o golden `diagnostics.json` · **Rollback:** reverter o commit
**Por que está aqui:** o playground recompila a cada pausa de digitação; um arquivo com milhares de diagnósticos que leva segundos congela a aba. Medido no gate 3: 1.000, 2.000 e 4.000 linhas de saída `--json` levam 0,3 s, 0,9 s e 3,1 s (crescimento acima do linear).
**Files:**
- Modify: o(s) módulo(s) de `packages/compiler/src/diagnostics/` que ordenam, deduplicam e limitam diagnósticos (o primeiro passo da unidade é **achar o gargalo com perfil**, não adivinhar)
- Create: `packages/compiler/tests/diagnostics-scale.test.ts`
- Test: `packages/compiler/tests/diagnostics-scale.test.ts` e a suíte de conformidade existente (`corepack pnpm exec vitest run --project @goiasscript/compiler`)

**Interfaces:** Consumes: `compile`. Produces: nada novo na API.
**Aceite:** `compile()` de um arquivo com N erros de mesmo tipo leva tempo com razão `T(4N)/T(N) ≤ 6` (linear com folga) e `T(4000 linhas) ≤ 1,2 s` na máquina de referência do relatório; todos os goldens seguem verdes **sem `bless`**; tetos do `bench:check` inalterados.

- [ ] **1.1 Perfil.** Gerar um programa com 4.000 linhas `uai x1 é y1`… (nome não declarado, GS0301 por linha) e rodar `node --cpu-prof` sobre `compile()`; anotar no commit o módulo e a função dominantes. Sem perfil, sem otimização.
- [ ] **1.2 Teste (RED).** `tests/diagnostics-scale.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.ts';

const undeclaredNames = (count: number): string =>
  Array.from({ length: count }, (_, index) => `uai valor${String(index)} é nome_${String(index)}`).join('\n');

const measureMs = (count: number): number => {
  const started = performance.now();
  const result = compile(undeclaredNames(count));
  expect(result.diagnostics.length).toBeGreaterThanOrEqual(count);
  return performance.now() - started;
};

describe('compile com muitos diagnósticos', () => {
  it('cresce de forma linear com a quantidade de diagnósticos', () => {
    measureMs(250);
    const small = Math.max(measureMs(1_000), 1);
    const large = measureMs(4_000);
    expect(large / small).toBeLessThan(6);
  });
  it('4 mil diagnósticos saem em menos de 1,2 s', () => {
    expect(measureMs(4_000)).toBeLessThan(1_200);
  });
});
```
- [ ] **1.3 Rodar:** `corepack pnpm exec vitest run --project @goiasscript/compiler diagnostics-scale` — esperado: falha na razão (≥ 6) ou no teto, com os tempos medidos no log.
- [ ] **1.4 Implementar.** Trocar a estrutura quadrática achada no perfil (por exemplo `includes`/`find` dentro de laço, `sort` com comparador que recalcula posição, deduplicação por varredura) por `Map`/`Set` por chave de posição e ordenação única com chave pré-computada. Sem mudar a ordem observável: a suíte de conformidade é o juiz.
- [ ] **1.5 Rodar:** o teste acima, `corepack pnpm exec vitest run --project @goiasscript/compiler` e `corepack pnpm verify` — esperado: verdes, nenhum golden regravado.
- [ ] **1.6 Commit:** `perf(compiler): torna linear a ordenação e a deduplicação de diagnósticos`.

---

### U4-02: CLI: REPL linear e mutação do pacote `cli`
**Spec:** §6.2, §8.2 (mutação), gate 3 §6.1 achado 4 e §10 (mutação do `cli` fora) · **Tier:** medium · **Depende de:** GATE 3 · **Risco:** mudar a fila de linhas e o histórico quebrando a ordem de resposta de `pergunta` no REPL com pipe; Stryker sem teto de tempo estourando o job semanal · **Rollback:** reverter o commit
**Files:**
- Modify: `packages/cli/src/repl/{line-buffer.ts,run-repl.ts,repl-commands.ts}` (somente o que o perfil apontar), `.github/workflows/scheduled.yml` (job `mutacao` ganha o filtro do `cli`)
- Create: `packages/cli/stryker.config.mjs`, `packages/cli/tests/repl-scale.test.ts`
- Test: `packages/cli/tests/repl-scale.test.ts`

**Interfaces:** Consumes: `createMemoryIo`, `runRepl`. Produces: `corepack pnpm --filter goiasscript mutate`.
**Aceite:** 40 mil linhas por pipe no REPL com razão `T(2N)/T(N) ≤ 3,5` e `T(20 mil) ≤ 3 s`; uma linha de 3 MB (identificador só) responde em ≤ 3 s; nota de mutação do `cli` medida e registrada **só como relatório** (`thresholds.break: null`), a catraca vem no plano 4.

- [ ] **1.1 Perfil.** Alimentar `goias` com 20 mil linhas `prosa(1)` por pipe e perfilar; anotar a função dominante (fila de linhas, histórico, sessão copiada a cada linha).
- [ ] **1.2 Teste (RED).** `repl-scale.test.ts`: `createMemoryIo({ stdin: 'prosa(1)\n'.repeat(N) })` com N = 10 mil e 20 mil; razão < 3,5 e teto de 3 s; segundo caso com `'a'.repeat(3_000_000)` seguido de `\n.vaza\n`, teto de 3 s e stdout sem pilha do motor; terceiro caso que fixa a ordem: `pergunta` no meio do fluxo recebe a linha seguinte como resposta (comportamento que a otimização não pode mudar).
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/repl-scale.test.ts` — esperado: falha por tempo.
- [ ] **1.4 Implementar.** Fila de linhas por índice de cabeça (sem `shift`/`slice` por linha), histórico com teto (`HISTORY_LIMIT` em `repl.constants.ts`), sessão adotada por referência imutável (sem cópia profunda por linha). Linha enorme: o identificador de 3 MB não pode passar por regex de custo superlinear nem por `split` repetido.
- [ ] **1.5 Mutação.** `stryker.config.mjs` espelhando o do `compiler` (vitest-runner, incremental, `thresholds.break: null`, `mutate` só em `src/**` fora de `entry/`); no `scheduled.yml`, o passo de mutação passa a rodar `compiler` e `cli`. Rodar uma vez localmente e anotar a nota no commit.
- [ ] **1.6 Rodar:** os testes do `cli` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.7 Commit:** `perf(cli): deixa linear a fila de linhas do repl` e, separado, `test(cli): adiciona teste de mutação do pacote cli` (dois commits).

---

### U4-03: Base do app do playground
**Spec:** §6.3, §8.1 (escopo dos gates, itens c e d), §5.9 · **Tier:** large · **Depende de:** GATE 3 · **Risco:** `next.config.ts` e o resolvedor TS da Next não aceitarem `.ts` com `import … with`; ESLint 10 flat rejeitar o `eslint-config-next` (que ainda mira ESLint 8/9); `transpilePackages` dos pacotes do workspace (`exports` apontam para `.ts`) falhar no build de produção; vazamento de `NEXT_PUBLIC_*` · **Rollback:** reverter o commit (o playground legado continua montando com `goiasscript-legacy`)
**Files:**
- Create: `apps/playground/config/{security-headers.ts,security-headers.constants.ts,site-config.ts,site-config.types.ts,run-limits.constants.ts}`, `apps/playground/next.config.ts`, `apps/playground/vitest.config.ts`, `apps/playground/tests/{site-config,security-headers,package-layout}.test.ts`
- Modify: `apps/playground/{package.json,tsconfig.json,.env.example,README.md}` (acrescenta as dependências `@goiasscript/*`; `transpilePackages` lista os quatro pacotes), `pnpm-lock.yaml`, `vitest.config.mts` (projeto `playground`, limiar 80% em `apps/playground/{config,lib,sandbox}/**`), `eslint.config.mjs` (traz `apps/playground/**` e `apps/playground-e2e/**` para o ESLint estrito; override do `console` só em `sandbox/runner.ts`; remove `.eslintrc.json`), `knip.json` (workspace `apps/playground`), `.github/workflows/ci.yml` (projeto `playground` na matriz de testes), `tools/config-tests/tests/eslint-matrix.test.mjs`
- Delete: `apps/playground/next.config.mjs`, `apps/playground/.eslintrc.json` (o worker legado, o `use-runner`, `monaco-goias.ts` e `types/goiasscript.d.ts` ficam até a U4-09 para o app continuar compilando; por isso `goiasscript-legacy` **permanece** em `dependencies` e na exceção do dependency-cruiser até a U4-09, que os remove)

**Interfaces:** Consumes: `@goiasscript/{compiler,language,optimizer}`. Produces: `readSiteConfig`, `buildSecurityHeaders(config)`, `RUN_LIMITS`.
**Aceite:** `apps/playground/package.json` passa a depender de `@goiasscript/{compiler,language,optimizer}` por `workspace:*` (a saída do `goiasscript-legacy` é da U4-09); `corepack pnpm --filter playground build` gera o site; `.env.example` só traz placeholders reconhecíveis; ESLint barra `console` fora de `sandbox/runner.ts`; `verify` verde; o baseline do scanner perde `next.config.mjs`, `tailwind.config.ts` e `scripts/copy-examples.mjs` (os dois últimos são reescritos aqui ou na U4-09, quem tocar remove).

- [ ] **1.1 Teste (RED).** `tests/package-layout.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dependencies: Record<string, string>;
};

describe('manifesto do playground', () => {
  it('consome o compilador novo por workspace', () => {
    expect(manifest.dependencies).toMatchObject({
      '@goiasscript/compiler': 'workspace:*',
      '@goiasscript/language': 'workspace:*',
      '@goiasscript/optimizer': 'workspace:*',
    });
  });
});
```
- [ ] **1.2 Teste (RED).** `tests/site-config.test.ts`: (a) em `development`, variável ausente vira `null`; (b) em `production`, `NEXT_PUBLIC_DONATION_PIX_KEY` igual ao valor do `.env.example` lança `ConfigError` com mensagem em goianês que nomeia a variável; (c) `NEXT_PUBLIC_DONATION_SPONSORS_URL='javascript:alert(1)'`, `'data:text/html,x'` e `'http://exemplo.test'` (só `https:` vale em produção) são recusadas; (d) URL válida sai normalizada (sem barra dupla, sem credencial `user:pass@`); (e) `.env.example` lido do disco só tem valores que terminam em `.invalid` ou começam com `COLE_`/`SEU_` (placeholders), de modo que a comparação do item (b) nunca passe por acaso.
- [ ] **1.3 Teste (RED).** `tests/security-headers.test.ts`: o cabeçalho de `/:path*` tem `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `connect-src 'self'` (+ URL do Engoianador só se configurada), `worker-src 'self'`, **sem** `'unsafe-eval'` na página principal (o Monaco usa Workers próprios, não `eval`; se o Monaco exigir, a exigência é medida e registrada no commit) e a regra de `/sandbox/:path*` é exatamente `default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'` (a política que o spike provou), com `X-Content-Type-Options: nosniff` e `Cross-Origin-Resource-Policy: same-origin`.
- [ ] **1.4 Teste de configuração (RED).** Em `tools/config-tests/tests/eslint-matrix.test.mjs`: violação `['console fora do runner', 'apps/playground/lib/virtual.ts', 'console.warn("x");\n', 'no-console']`; aceito `['console no runner', 'apps/playground/sandbox/runner.ts', 'const original = console.log;\nexport { original };\n', 'no-console']`; violação `['any em app', 'apps/playground/lib/virtual.ts', 'export const value: any = 1;\n', '@typescript-eslint/no-explicit-any']`.
- [ ] **1.5 Rodar:** `corepack pnpm exec vitest run --project playground` e `corepack pnpm exec vitest run --project config-tests eslint-matrix` — esperado: falham (projeto e módulos inexistentes; regras ainda ignorando `apps/**`).
- [ ] **1.6 Implementar.** `site-config.ts` valida cada variável (`new URL`, `protocol === 'https:'` em produção, sem `username`/`password`), compara com a tabela de placeholders lida de `.env.example` por um módulo de teste (o app em si não lê arquivo). `security-headers.ts` monta as duas regras; `next.config.ts` importa os dois módulos e `transpilePackages: ['@goiasscript/compiler', '@goiasscript/language', '@goiasscript/optimizer']`. Migrar `tsconfig.json` do app para estender `tsconfig.base.json` (TS 6.0.3, `strict`, `noUncheckedIndexedAccess`). Trazer o app para ESLint, knip e Vitest (`environment: 'node'` para `config/`, `lib/` e `sandbox/`; testes de componente usam `@testing-library/react` só se a U4-09 provar necessidade). Se o `eslint-config-next` for incompatível com ESLint 10, **não** usar `next lint`: os plugins `react-hooks` e `@next/eslint-plugin-next` entram como plugins de flat config só nos arquivos `.tsx` do app, com versões exatas conferidas; falhando isso, registrar no relatório e seguir só com `typescript-eslint` estrito (decisão 3).
- [ ] **1.7 Rodar:** `corepack pnpm --filter playground build` (com variáveis de desenvolvimento), os testes acima e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.8 Commit:** `refactor(playground): troca o legado pelo compilador novo e adiciona gates do app` e, separado, `feat(playground): valida a configuração pública e os cabeçalhos de segurança`.

---

### U4-04: Sandbox: runner estático, protocolo, cliente e limites
**Spec:** §6.3 (Execução), §5.7 (alvo `playground`), §8.2 (E2E), `docs/fase-0/spike-sandbox.md` · **Tier:** large · **Depende de:** U4-03 · **Risco:** mensagem forjada pelo programa do aluno enganando o host; log gigante travando a aba; `terminate()` esquecido; `import()` de blob não aceito pelo CSP do runner; linha do erro fora do `.gs` · **Rollback:** reverter o commit (a casca da U4-09 ainda não consome)
**Files:**
- Create: `apps/playground/sandbox/{runner.ts,run-program.ts,protocol.types.ts,protocol.constants.ts}`, `apps/playground/lib/run/{runner-client.ts,runner-client.types.ts,message-guards.ts,output-buffer.ts,run-state.ts}`, `apps/playground/scripts/build-runner.ts`, `apps/playground/tests/{message-guards,output-buffer,runner-client,run-program,build-runner}.test.ts`, `apps/playground/tests/support/fake-worker.ts`
- Modify: `apps/playground/package.json` (scripts `prebuild`/`predev` chamam `build-runner.ts`), `.gitignore` (`apps/playground/public/sandbox/`)

**Interfaces:** Consumes: `RUN_LIMITS`, `translateRuntimeError`, `CompileSuccess`. Produces: `createRunnerClient`, `isRunnerMessage(data): data is RunnerToHost`, `createOutputBuffer(limits)`, `runProgram(port, message)` (lado do Worker), `buildRunner({ outFile })`.
**Aceite:** `public/sandbox/runner.js` é um módulo único (esbuild, `format: 'esm'`, sem `import` externo) com o corpo de `runner.ts`; o host nunca interpreta texto do Worker como HTML; cobertura ≥ 80% em `lib/run/**` e `sandbox/run-program.ts` (o `runner.ts` é fino e fica fora da cobertura, exercido pelo E2E da U4-11).

- [ ] **1.1 Teste (RED).** `tests/message-guards.test.ts`: `isRunnerMessage` aceita exatamente os cinco tipos do protocolo; rejeita `null`, array, string, objeto sem `type`, `type` desconhecido, `runId` não inteiro ou negativo, `text` não string, `prompt` acima de `maxPromptChars` (cortado, não rejeitado: o guard devolve a mensagem normalizada), `stack` acima de 20.000 caracteres (cortado); protótipo poluído (`{ __proto__: … }`) não vaza para o resultado.
- [ ] **1.2 Teste (RED).** `tests/output-buffer.test.ts`: acima de `maxLogLines` o buffer devolve `truncated: 'lines'` uma vez e descarta o resto; acima de `maxLogChars` idem para `'chars'`; linha maior que `maxLineChars` é cortada com reticências; `\r\n` e `\r` normalizam para `\n`; sequência de controle (`\u001b[31m`, bidi `‮`, ` `) é neutralizada por `visibleText` (o painel mostra, nunca interpreta).
- [ ] **1.3 Teste (RED).** `tests/runner-client.test.ts` com `FakeWorker` e `TimerPort` falso:
```ts
it('termina a execução sem mensagens depois do tempo ocioso', () => {
  const harness = createHarness();
  harness.client.run(harness.request('prosa("oi")'), harness.onEvent);
  harness.worker.emit({ type: 'gs:log', runId: 1, stream: 'out', text: 'oi' });
  harness.timers.advance(RUN_LIMITS.idleMs);
  expect(harness.events).toEqual([{ kind: 'out', text: 'oi' }, { kind: 'finished' }]);
  expect(harness.worker.terminated).toBe(true);
});
it('mensagem de outra execução é ignorada (runId diferente)', () => { /* log com runId 99 não vira evento */ });
it('o programa que forja gs:terminou antes da hora só encerra a própria execução', () => { /* terminate e evento único 'finished' */ });
it('pergunta pendente suspende o relógio ocioso e responde por answer()', () => { /* ask, timers.advance(60_000) sem finished; answer('Ana') posta gs:resposta */ });
it('estoura o tempo máximo mesmo com saída constante', () => { /* logs a cada 100 ms; em maxRunMs: evento 'timeout' e terminate */ });
it('falha traduzida: gs:falhou vira diagnóstico com a linha do .gs', () => { /* stack com a linha da trava de laço → GS0701 na linha esperada */ });
it('stop() encerra, emite stopped e ignora mensagens posteriores', () => { /* … */ });
it('segunda run() encerra a anterior antes de criar outro Worker', () => { /* terminate chamado 1 vez */ });
```
- [ ] **1.4 Teste (RED).** `tests/run-program.test.ts` (lado do Worker, sem Worker real): `runProgram` recebe `gs:executar`, instala o coletor de `console` (`log`/`info`/`debug` → `out`; `warn`/`error` → `err`; objetos formatados como o `prosa` do CLI: `nada`, `indefinido`, texto cru, JSON legível), importa o código por uma função `importModule(url)` injetada (no teste, devolve uma Promise que resolve/rejeita), e responde `gs:terminou` ou `gs:falhou` com `stack` e `errorName`. Teste de que o coletor **não** deixa o `console.log` original acessível ao programa (sombra por `Object.defineProperty` no `globalThis` do teste) e de que a rejeição com um valor que não é `Error` (a promessa do teste rejeita com um objeto qualquer) vira `gs:falhou` com `errorName: 'Error'`, sem lançar dentro do runner.
- [ ] **1.5 Teste (RED).** `tests/build-runner.test.ts`: `buildRunner({ outFile })` gera um arquivo único com `export`/`import` somente do próprio runner, sem `@goiasscript/`, sem `node:` e sem `import(` de URL literal; tamanho ≤ teto declarado em `protocol.constants.ts` (`RUNNER_MAX_BYTES`).
- [ ] **1.6 Rodar:** `corepack pnpm exec vitest run --project playground message-guards output-buffer runner-client run-program build-runner` — esperado: falham (módulos inexistentes).
- [ ] **1.7 Implementar.** `runner.ts` só liga `self.onmessage` a `runProgram`; `run-program.ts` troca `globalThis.console` por um objeto novo congelado, cria `Blob([code], { type: 'text/javascript' })`, `URL.createObjectURL` e `import(url)`, revoga a URL no `finally`. O ajudante `$gs_pergunta` do alvo `playground` já posta `gs:pergunta` e escuta `gs:resposta` no `globalThis`; **a resposta não pode ser filtrada por `runId`** (o ajudante não a conhece), então o host só posta `gs:resposta` quando há pergunta pendente. Cancelar uma pergunta = encerrar a execução (`stop()`): o ajudante não tem caminho de erro. `runner-client.ts` mantém uma máquina de estados (`idle → running → asking → finished|failed|timeout|stopped`) em `run-state.ts`, cria o Worker com `new Worker('/sandbox/runner.js', { type: 'module' })` (injetado por `createWorker`), nunca guarda referência a Worker encerrado e cancela todos os temporizadores no `dispose`. A pilha do erro vai a `translateRuntimeError(error, { map, helperRange, fileName, source }, tone)`, onde `error` é `{ stack, name }`.
- [ ] **1.8 Rodar:** os testes acima, `corepack pnpm --filter playground build` e `corepack pnpm verify` — esperado: verdes; conferir que `public/sandbox/runner.js` existe depois do build e não é rastreado.
- [ ] **1.9 Commit:** `feat(playground): adiciona o runner isolado e o cliente de execução com limites`.

---

### U4-05: Serviço de compilação, marcadores, autocomplete e hover
**Spec:** §6.3 (editor, autocomplete, hover, "JS gerado"), §5.9, §5.8, §8.4 · **Tier:** large · **Depende de:** U4-01, U4-03 · **Risco:** colunas do compilador (UTF-16? ponto de código?) diferentes das do Monaco, errando o sublinhado com emoji ou acento decomposto; Terser carregado na partida; Monaco sem acesso a `eval` sob a CSP; links de lição para páginas que ainda não existem · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/lib/{compile-service.ts,compile-service.types.ts,diagnostic-markers.ts,editor-position.ts,lesson-routes.ts}`, `apps/playground/lib/monaco/{register-language.ts,completion-provider.ts,hover-provider.ts,monaco-assets.ts}`, `apps/playground/scripts/copy-monaco.ts`, `apps/playground/budgets.json`, `apps/playground/tests/{compile-service,diagnostic-markers,editor-position,completion-provider,hover-provider,lesson-routes,bundle-budget}.test.ts`
- Modify: `apps/playground/package.json` (`prebuild`/`predev` chamam `copy-monaco.ts`), `.gitignore` (`apps/playground/public/vs/`)
- (O arquivo legado `apps/playground/lib/monaco-goias.ts` não é tocado aqui: a troca do import e a remoção acontecem na U4-09.)

**Interfaces:** Consumes: `compile`, `explainDiagnostic`, `COMPLETIONS`/`lookup` de `@goiasscript/language`, `goiasscript.monarch.json` e `glossary.json` gerados. Produces: `createCompileService`, `toEditorMarkers(diagnostics, source, lessonUrlOf)`, `registerGoiasScript(monaco)`, `lessonUrlOf(lessonId): string | undefined`.
**Aceite:** `compile()` roda com `target: 'playground'`, `loopLimit: RUN_LIMITS.loopLimit`, `sourceMap: true`; o chunk do otimizador só é pedido ao escolher "otimizado"; marcadores limitados a 200 com contagem dos escondidos; posições corretas com emoji, NFD e CRLF; hover mostra a palavra goiana, o equivalente em JS e o link da lição **só quando a lição existe**; `budgets.json` registra os bytes brotli do chunk do compilador e o teste falha se subirem (catraca).

- [ ] **1.1 Teste (RED).** `tests/editor-position.test.ts`: tabela de entrada/saída entre `SourcePosition` do compilador e `{ lineNumber, column }` do Monaco para: `prosa("oi")` (ASCII), `uai ação é 1` com `ç` NFC, o mesmo com `c` + U+0327 (NFD), `uai 😀 é 1` (par substituto antes do erro), CRLF, última linha sem `\n`, fim de arquivo. Regra a provar: coluna do Monaco é em unidades UTF-16 e 1-based; o teste lê a convenção real do compilador (`toLspPosition` subtrai 1) em vez de assumir.
- [ ] **1.2 Teste (RED).** `tests/diagnostic-markers.test.ts`: GS0301 com sugestão vira marcador com `message` + `help`, `severity` mapeada (`error` → 8, `warning` → 4 do Monaco por constante nominal), `code`; 250 diagnósticos viram 200 marcadores e `hiddenMarkerCount: 50`; `lessonUrl` só quando `lessonUrlOf` devolve valor; diagnóstico com `range` de largura zero (GS0901) vira marcador de largura 1.
- [ ] **1.3 Teste (RED).** `tests/compile-service.test.ts`: (a) `compile('prosa("oi")', 'didactic')` devolve `generatedCode` com `console.log` e `result.ok`; (b) `compile('uai x é', …)` devolve `ok: false`, `markers.length ≥ 1` e `generatedCode: null`; (c) `loadOptimizer` **não** é chamado em `didactic` e é chamado uma vez em `optimized`, com resultado reaproveitado na chamada seguinte (cache de promessa); (d) falha do import dinâmico do otimizador devolve o código didático e um marcador de aviso em goianês, nunca lança; (e) o alvo usado é `playground` com `loopLimit` (espiar o argumento de `compile`); (f) entrada idêntica à anterior devolve o mesmo objeto (memo de uma posição).
- [ ] **1.4 Teste (RED).** `tests/completion-provider.test.ts`: `provideCompletions(prefix)` devolve itens com `label` (palavra goiana), `detail` (equivalente JS, de `completions.json`), `kind` mapeado e `documentation` com o link da lição quando existir; variante sem acento aparece ao lado da acentuada; item `member: true` só depois de `.`; ordem determinística; trecho (`snippets.json`) com `insertTextRules` de snippet. `tests/hover-provider.test.ts`: hover em `uai` mostra `const`; em `se_ocê_quiser` mostra `if`; em identificador do usuário devolve `null`; texto do hover nunca contém HTML do programa (escape), e o conteúdo é `isTrusted: false`.
- [ ] **1.5 Teste (RED).** `tests/lesson-routes.test.ts`: `lessonUrlOf('licao-02')` é `undefined` enquanto `AVAILABLE_LESSONS` estiver vazio (estado da Fase 4) e `/cartilha/licao-02` quando listada; `lessonUrlOf('o-que-mudou')` idem; todo `lesson` do catálogo (`DIAGNOSTICS`) aparece em `KNOWN_LESSON_IDS` (a lista que a Fase 6 preenche), para que a U6-04 tenha o que ligar.
- [ ] **1.6 Teste (RED).** `tests/bundle-budget.test.ts`: empacota `lib/compile-service.ts` com esbuild (navegador, ESM, minify) sem o otimizador, mede bytes brotli e compara com `budgets.json` (`{ "compilerChunkBrotliBytes": <medido> }`); falha se o medido exceder o registrado + 0 (catraca: só pode melhorar; para melhorar, o teste imprime o novo valor e exige atualizar o arquivo).
- [ ] **1.7 Rodar:** `corepack pnpm exec vitest run --project playground compile-service diagnostic-markers editor-position completion-provider hover-provider lesson-routes bundle-budget` — esperado: falham (módulos inexistentes).
- [ ] **1.8 Implementar.** `compile-service.ts`: `compile(source, { target: 'playground', tone, sourceMap: true, loopLimit, fileName: 'programa.gs' })`; `optimized` chama `loadOptimizer()` (import dinâmico) e `optimize(code, map)`. `register-language.ts`: `monaco.languages.register({ id: 'goiasscript' })`, `setMonarchTokensProvider` com `goiasscript.monarch.json` (gerado da tabela, §5.2), `registerCompletionItemProvider` e `registerHoverProvider`; opções do editor com `unicode` fixo conforme o spec (`unicodeHighlight`) para não destacar acento como suspeito. `copy-monaco.ts` copia `monaco-editor/min/vs` para `public/vs` (CSP: nada de CDN). Os marcadores são aplicados por `monaco.editor.setModelMarkers(model, 'goiasscript', markers)`, só na U4-09.
- [ ] **1.9 Rodar:** os testes acima, `corepack pnpm --filter playground build` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.10 Commit:** `feat(playground): compila ao vivo com marcadores, autocomplete e hover`.

---

### U4-06: Doação, páginas de erro em goianês e imagem de compartilhamento
**Spec:** §6.3 (páginas de erro e 404, imagem de compartilhamento, doação por configuração), §8.3 (job semanal) · **Tier:** medium · **Depende de:** U4-03 · **Risco:** link de doação malicioso vindo de configuração; página de erro mostrando pilha; imagem de compartilhamento gerada de um snippet que deixou de compilar · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/app/{not-found.tsx,error.tsx,global-error.tsx}`, `apps/playground/lib/share-snippet.constants.ts`, `apps/playground/scripts/check-public-config.ts`, `apps/playground/tests/{donation-links,error-pages,share-snippet,check-public-config}.test.ts`
- Modify: `apps/playground/components/DonationLinks.tsx`, `apps/playground/app/doacao/page.tsx`, `apps/playground/app/opengraph-image.tsx`, `apps/playground/app/layout.tsx` (metadados de `siteUrl`), `apps/playground/package.json` (`prebuild` roda `check-public-config.ts` em produção), `.github/workflows/scheduled.yml` (job `links-doacao`), `tools/rules-scan/baseline.json` (remove `DonationLinks.tsx`, `doacao/page.tsx`)

**Interfaces:** Consumes: `readSiteConfig`. Produces: `resolveDonationLinks(config): readonly DonationLink[]`, `SHARE_SNIPPET` (programa de exemplo da imagem), `assertPublicConfig(env, mode)`.
**Aceite:** nenhum link configurado = a seção de doação e a rota `/doacao` não exibem botão nem chave; `scripts/check-public-config.ts` sai com 1 se um valor público de produção for igual ao do `.env.example`; `SHARE_SNIPPET` compila com `ok: true` e sem diagnósticos (teste); `not-found`, `error` e `global-error` em goianês, sem `error.stack` na tela; `rel="noopener noreferrer"` e `target="_blank"` em todo link externo.

- [ ] **1.1 Teste (RED).** `donation-links.test.ts`: config sem nada → lista vazia; só `sponsorsUrl` → um item; `pixKey` vira texto copiável e **não** link; ordem fixa (Pix, Sponsors, Ko-fi); componente renderizado (react-dom/server) sem link não contém `<a`; com link contém `rel="noopener noreferrer"`.
- [ ] **1.2 Teste (RED).** `check-public-config.test.ts`: `assertPublicConfig({ NEXT_PUBLIC_DONATION_PIX_KEY: <valor do .env.example> }, 'production')` lança; em `development` não; com todas as variáveis válidas e diferentes passa; saída do script (stderr) em goianês nomeia a variável e **não imprime o valor**.
- [ ] **1.3 Teste (RED).** `share-snippet.test.ts`: `compile(SHARE_SNIPPET, { target: 'playground' })` com `ok: true` e `diagnostics: []`; o snippet cabe em 6 linhas e 40 colunas (cabe na imagem). `error-pages.test.ts`: renderização (server) das três páginas contém texto goiano esperado (`Cabôu o caminho, sô` na 404), um botão "tenta de novo", e nenhuma ocorrência de `stack`/`Error:`/`at `; `error.tsx` recebe `{ error, reset }` e só mostra `error.digest`.
- [ ] **1.4 Rodar:** `corepack pnpm exec vitest run --project playground donation-links check-public-config share-snippet error-pages` — esperado: falham.
- [ ] **1.5 Implementar.** Componentes enxutos; textos em goianês (`Ajuda o Playground a continuar de pé, sô`); `opengraph-image.tsx` desenha `SHARE_SNIPPET`; `scheduled.yml` ganha o job `links-doacao`: `corepack pnpm --filter playground exec node scripts/check-public-config.ts --online` lê as URLs de `vars` do repositório (não segredo), faz `HEAD` com timeout e falha se Sponsors ou Ko-fi não responderem 2xx/3xx; sem variável configurada, o job passa e diz que não há link a conferir.
- [ ] **1.6 Rodar:** os testes, `corepack pnpm --filter playground build` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.7 Commit:** `feat(playground): configura a doação por variável e adiciona páginas de erro`.

---

### U4-07: Página do Engoianador: configuração, privacidade e erros em goianês
**Spec:** §6.6 (aviso de privacidade na interface), §6.3 (URLs vêm de configuração) · **Tier:** small · **Depende de:** U4-03 · **Risco:** acoplar o front a um contrato da API que a Fase 7 vai mudar (`GET /` → `GET /health`, corpo validado) · **Rollback:** reverter o commit
**Files:**
- Modify: `apps/playground/app/engoianador/{page.tsx,layout.tsx}`, `apps/playground/lib/engoianador-client.ts`, `tools/rules-scan/baseline.json` (remove as três entradas)
- Create: `apps/playground/tests/engoianador-client.test.ts`

**Interfaces:** Consumes: `SiteConfig.engoianadorUrl`. Produces: `engoianar(text, options): Promise<EngoianadorResult>` com `EngoianadorResult = { ok: true; text: string } | { ok: false; reason: 'disabled' | 'rate-limited' | 'invalid' | 'unavailable' }`.
**Aceite:** sem `engoianadorUrl` a página mostra "O Engoianador tá de folga, sô" e não faz requisição; o aviso de privacidade (texto enviado a provedor de LLM e guardado em cache) aparece junto do botão; cada `reason` tem mensagem em goianês; 429 e 5xx não são tratados como sucesso; o cliente nunca interpola a resposta como HTML.

- [ ] **1.1 Teste (RED).** `engoianador-client.test.ts` com `fetch` injetado: URL ausente → `disabled` sem chamar `fetch`; 200 com `{ texto: "…" }` → `ok`; 429 → `rate-limited`; 400 → `invalid`; 500, rede caída e JSON malformado → `unavailable`; requisição tem `Content-Type: application/json`, corpo `{ texto }`, `credentials: 'omit'` e `AbortSignal` com teto de 15 s; texto acima de `MAX_INPUT_CHARS` (constante igual à da API: 2.000) é recusado antes de enviar.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground engoianador-client` — esperado: falha.
- [ ] **1.3 Implementar.** O contrato (`texto` no corpo, `texto` na resposta) é o da API atual; a Fase 7 pode renomear e atualiza este cliente com o mesmo teste. Componentes `page.tsx` sem `dangerouslySetInnerHTML`.
- [ ] **1.4 Rodar:** o teste e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(playground): lê o engoianador da configuração e avisa sobre privacidade`.

---

### U4-08: Infra do E2E do playground
**Spec:** §8.2 (E2E Playwright; hoje só Chromium, C G15), §8.3 · **Tier:** medium · **Depende de:** U4-03 · **Risco:** flakiness por tempo; WebKit no Ubuntu exigindo dependências do sistema; build do Next dentro do job lento · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/lib/test-ids.constants.ts` (lista de `data-testid` que a U4-09 só consome), `apps/playground-e2e/tests/support/{playground-page.ts,hostile-programs.ts,canary-server.ts}`, `.github/workflows/playground-e2e.yml`, `tools/config-tests/tests/playground-workflows.test.mjs`
- Modify: `apps/playground-e2e/{package.json,playwright.config.ts}`, `tools/rules-scan/baseline.json` (specs antigos saem do baseline na U4-11/U4-12, que os reescrevem)
- Delete: nenhum (os specs legados em `apps/playground-e2e/tests/*.spec.ts` são substituídos pelas U4-11 e U4-12)

**Interfaces:** Produces: `PlaygroundPage` (`open()`, `typeProgram(source)`, `run()`, `output()`, `generatedCode()`, `markers()`, `answer(text)`), `startCanaryServer()` (servidor HTTP em porta efêmera que registra qualquer requisição; reaproveita a ideia de `spikes/sandbox/src/server.mjs`), `HOSTILE_PROGRAMS` (lista nomeada de programas de ataque em goianês), projeto Playwright por navegador.
**Aceite:** `playwright.config.ts` define os projetos `chromium`, `firefox` e `webkit`; `webServer` roda `next build && next start` na porta efêmera com variáveis de teste; workflow roda os três navegadores em Ubuntu e envia relatório e trace como artefato em falha; teste de configuração confere permissões mínimas e actions por SHA.

- [ ] **1.1 Teste de configuração (RED).** `playground-workflows.test.mjs`: `playground-e2e.yml` tem `permissions: contents: read`; todo `uses:` termina em `@` + 40 hex; matriz de navegadores é exatamente `chromium`, `firefox`, `webkit`; passo `playwright install --with-deps` presente; o job sobe artefato `playwright-report` com `if: failure()`; nenhum `secrets.` e nenhum `pull_request_target`.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project config-tests playground-workflows` — esperado: falha (workflow inexistente).
- [ ] **1.3 Implementar.** `PlaygroundPage` usa seletores por `data-testid` (a U4-09 os publica; a lista de ids é a constante `TEST_IDS`, criada **nesta** unidade em `apps/playground/lib/test-ids.constants.ts` para não haver dependência cruzada: a U4-09 só consome). `canary-server.ts` expõe `hits()`; `HOSTILE_PROGRAMS` tem pelo menos os doze ataques do §8.2 e do spike (`fetch`, XHR, WebSocket, `import()`, `Function('return this')()`, `constructor` via índice computado, `importScripts`, `sendBeacon`, laço infinito, saída gigante, pergunta sem resposta, recursão).
- [ ] **1.4 Rodar:** o teste de configuração e `corepack pnpm --filter playground-e2e exec playwright test --list` — esperado: verde e três projetos listados.
- [ ] **1.5 Commit:** `test(playground): prepara a infra do e2e em três navegadores`.

---

### U4-09: Casca da interface do playground
**Spec:** §6.3 · **Tier:** large · **Depende de:** U4-04, U4-05, U4-06 · **Risco:** regressão visual sem teste; estado de execução vazando entre execuções; Monaco carregando por CDN (bloqueado pela CSP); código salvo corrompido quebrando a abertura da página · **Rollback:** reverter o commit (volta à casca da U4-03 sem execução)
**Files:**
- Create: `apps/playground/components/{GeneratedPanel,AskBox,TargetSwitch}.tsx`, `apps/playground/lib/{examples.ts,saved-code.ts,share-link.ts}`, `apps/playground/scripts/build-examples.ts`, `apps/playground/tests/{examples,saved-code,share-link,run-state-view}.test.ts`
- Modify: `apps/playground/app/page.tsx`, `apps/playground/components/{Editor,OutputPanel,Toolbar,ShareCard}.tsx`, `apps/playground/package.json` (`prebuild` chama `build-examples.ts`; saem o `copy-examples.mjs` e a dependência `goiasscript-legacy`), `apps/playground/tests/package-layout.test.ts`, `.dependency-cruiser.cjs`, `tools/rules-scan/baseline.json`
- Delete: `apps/playground/lib/{monaco-goias.ts,use-runner.ts,share.ts}`, `apps/playground/workers/runner.worker.ts`, `apps/playground/scripts/copy-examples.mjs`, `apps/playground/types/goiasscript.d.ts`

**Interfaces:** Consumes: `createCompileService`, `registerGoiasScript`, `createRunnerClient`, `TEST_IDS`. Produces: `loadExamples()`, `readSavedCode(storage)`, `writeSavedCode(storage, source)`, `encodeShareLink(source): string | null`, `decodeShareLink(hash): string | null`.
**Aceite:** `goiasscript-legacy` sai de `apps/playground/package.json` (o teste `package-layout.test.ts` da U4-03 ganha a asserção `not.toHaveProperty('goiasscript-legacy')`) e a exceção do dependency-cruiser que deixava o playground importar `goiasscript/browser` é removida; tela dividida (editor | "JS gerado") com seletor didático/otimizado; botões Rodar e Parar; painel de saída com `out`/`err` distintos, truncamento avisado e erro de execução em goianês com linha do `.gs`; `AskBox` aparece quando há `ask` e envia `answer`; exemplos vêm de `build-examples.ts`, que lê os `.gs` dos cinco exemplos do playground já migrados para o subconjunto (os arquivos do corpus de conformidade; o script **falha** se algum não compilar com `ok: true`); código salvo em `localStorage` com `try/catch` e a página abre normal sem ele; link de compartilhamento em `#codigo=` (UTF-8 em base64url, máximo de 8 KB, recusa maior) sem executar nada ao abrir; nenhum `dangerouslySetInnerHTML`.

- [ ] **1.1 Teste (RED).** `saved-code.test.ts`: `storage` que lança em `getItem`/`setItem` (modo privado) → `readSavedCode` devolve `null` e `writeSavedCode` devolve `false` sem lançar; valor corrompido (não string, acima de 200 KB) → `null`; ida e volta de texto com acento NFD e emoji. `share-link.test.ts`: ida e volta; hash malformado → `null`; acima de 8 KB → `null`; nada além de `A–Za–z0–9_-` no resultado; `decodeShareLink('#codigo=' + base64url('<img src=x onerror=alert(1)>'))` devolve o texto cru (será mostrado em Monaco, que não interpreta HTML).
- [ ] **1.2 Teste (RED).** `examples.test.ts`: `build-examples.ts` (função `buildExamples({ sourceDir, outDir })`) gera `manifest.json` com `{ id, title, file }` e copia os `.gs`; falha com mensagem em goianês e exit 1 se um exemplo der `ok: false`; todo exemplo do manifesto compila com o alvo `playground` e executa até o fim na VM de teste com o stdout esperado do golden.
- [ ] **1.3 Teste (RED).** `run-state-view.test.ts`: reducer puro que transforma `RunEvent` em estado de tela (`status`, `lines`, `pendingPrompt`, `notice`): `out`/`err` empilham; `ask` define `pendingPrompt`; `answer` limpa; `truncated` define aviso; `failed` mostra o `message` e `help` do diagnóstico; `finished` e `stopped` fecham; evento depois de `stopped` é ignorado.
- [ ] **1.4 Rodar:** `corepack pnpm exec vitest run --project playground saved-code share-link examples run-state-view` — esperado: falham.
- [ ] **1.5 Implementar.** `page.tsx` monta Monaco (carregado de `/vs`, `dynamic` sem SSR), compila com debounce de 250 ms (`COMPILE_DEBOUNCE_MS` em constante), aplica `setModelMarkers`, mostra `GeneratedPanel`; `Run` chama `compile` final e, se `ok`, `runnerClient.run`; `Stop` chama `stop()`; `AskBox` submete por Enter e envia `answer`. Nada de `useEffect` para derivar estado (calcular no render); efeito só para Monaco, Worker e `localStorage`. Remover os arquivos legados listados e tirar as entradas do baseline.
- [ ] **1.6 Rodar:** os testes, `corepack pnpm --filter playground build` e abrir `next start` à mão para uma captura de tela da tela dividida **(evidência visual, anexada ao relatório)**; `corepack pnpm verify` — esperado: verdes.
- [ ] **1.7 Commit:** `feat(playground): monta a tela dividida com execução isolada e pergunta`.

---

### U4-10: Deploy preparado e smoke pós-deploy
**Spec:** §6.3 (deploy na Vercel: tarefa do dono), §2.3 S7, §10.3 · **Tier:** small · **Depende de:** U4-03, U4-06 · **Risco:** configuração da Vercel divergente do `next.config.ts` (cabeçalhos duplicados); smoke que passa contra uma página de erro · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/vercel.json`, `apps/playground/scripts/smoke-playground.ts`, `apps/playground/tests/{vercel-config,smoke-playground}.test.ts`, `.github/workflows/playground-smoke.yml`
- Modify: `apps/playground/README.md` (passo a passo em português para o dono, sem valores)

**Interfaces:** Produces: `runSmoke(baseUrl, fetchFn): Promise<readonly SmokeFailure[]>`.
**Aceite:** `vercel.json` só traz `framework: 'nextjs'`, `installCommand` (`corepack pnpm install --frozen-lockfile`), `buildCommand` e `outputDirectory` padrão — **sem cabeçalhos** (a fonte única é `next.config.ts`); o smoke confere: `GET /` 200 com `Content-Security-Policy` contendo `frame-ancestors 'none'`; `GET /sandbox/runner.js` 200 com `content-type` JavaScript e a CSP isolada exata; `GET /rota-que-nao-existe` 404 com texto goiano; `GET /doacao` 200; o workflow é `workflow_dispatch` com entrada `base_url`, sem segredo.

- [ ] **1.1 Teste (RED).** `smoke-playground.test.ts` com `fetchFn` falso: resposta ok em tudo → lista vazia; runner sem CSP → falha nomeando o cabeçalho; 404 que devolve 200 → falha; redirecionamento para outro host é falha. `vercel-config.test.ts`: o JSON não tem a chave `headers`; `framework` é `nextjs`.
- [ ] **1.2 Rodar:** os testes — esperado: falham.
- [ ] **1.3 Implementar.** Script sem dependência (usa `fetch` global do Node). Workflow com `permissions: contents: read`, Node 24, `base_url` validada por regex `^https://` antes de usar; actions por SHA. O teste de configuração da U4-08 passa a cobrir também este arquivo.
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes. **Nada é implantado nesta unidade.**
- [ ] **1.5 Commit:** `ci(playground): adiciona o smoke pós-deploy e a configuração da vercel`.

---

### U4-11: E2E de sandbox e segurança
**Spec:** §8.2 (E2E: fuga de sandbox, laço infinito, saída assíncrona, `pergunta`, TypeError em português), §6.3 · **Tier:** medium · **Depende de:** U4-04, U4-08, U4-09 · **Risco:** teste passando porque o ataque falha por erro de sintaxe do próprio programa (falso verde); canário sem prova de que o ataque chegou a tentar · **Rollback:** reverter o commit (só testes)
**Files:**
- Create: `apps/playground-e2e/tests/{sandbox-attacks,sandbox-limits,run-output,ask-box}.spec.ts`
- Modify: `tools/rules-scan/baseline.json` (remove `security.spec.ts` e `examples.spec.ts` legados)
- Delete: `apps/playground-e2e/tests/{security,examples}.spec.ts`

**Interfaces:** Consumes: `PlaygroundPage`, `HOSTILE_PROGRAMS`, `startCanaryServer`.
**Aceite:** nos três navegadores (**pendente de CI**: só o Chrome do sistema rodou localmente; Firefox e WebKit passam a ser exigidos na CI e qualquer falha de segurança neles bloqueia a fase): nenhum ataque alcança o canário nem lê o segredo do host; cada ataque que **compila** prova que **tentou** (o programa imprime `tentei` antes e `deu ruim: <mensagem>` depois; o teste exige as duas linhas e que a mensagem case com a lista fechada do ataque: bloqueio de CSP ou de rede, nunca SyntaxError/ReferenceError do próprio payload, e um controle prova que o canário registra acessos); o ataque que o mundo fechado barra (`[].constructor.constructor("return this")()`) mostra o diagnóstico de compilação e não executa; `x["con" mais "structor"]` compila e fica contido; laço infinito para em GS0701 com a linha certa e a aba segue responsiva (batimento do teste < 250 ms); `daqui_um_cadim` (RFC-0001) em laço estoura `maxRunMs` com aviso em goianês; saída gigante é truncada com aviso; saída assíncrona (`daqui_um_cadim`, `espera_um_cadim`) aparece completa antes de `finished`; `pergunta` sem resposta + Parar encerra; pergunta forjada sem resposta é cortada pelo teto absoluto `maxRunMs + maxAskWaitMs` (risco residual: o Worker pode consumir CPU até esse teto, ou até o aluno clicar em Parar). O E2E cobre a pergunta sem resposta pelo teto absoluto (relógio do Playwright avançado); a mensagem forjada pelo Worker sem `runId` só tem cobertura unitária em `runner-client.test.ts`, porque o programa do aluno não consegue emitir mensagens do protocolo; erro de execução capturado (`tenta_aí` com `nada.campo`) mostra `.mensagem` em português, sem frase do motor em inglês.

- [ ] **1.1 Teste (RED).** `sandbox-attacks.spec.ts`:
```ts
for (const attack of HOSTILE_PROGRAMS) {
  test(`${attack.name} não alcança nada fora do Worker`, async ({ page }) => {
    const canary = await startCanaryServer();
    const playground = new PlaygroundPage(page);
    await playground.open({ canaryUrl: canary.url });
    await playground.typeProgram(attack.source(canary.url));
    await playground.run();
    if (attack.expect === 'compile-error') {
      await expect(playground.markers()).not.toHaveCount(0);
      await expect(playground.streamLines('out')).toHaveCount(0); // o painel mostra o diagnóstico de compilação, então a prova de não execução é a ausência de saída do programa
    } else {
      await expect.poll(() => playground.output()).toContain('tentei');
      await expect.poll(() => playground.output()).toContain('deu ruim');
    }
    expect(canary.hits()).toEqual([]);
    expect(await page.evaluate(() => window.localStorage.getItem('segredo-do-host'))).toBe('valor-do-host');
    await canary.close();
  });
}
```
Antes de rodar, plantar `segredo-do-host` no `localStorage` do host pelo helper `open`.
- [ ] **1.2 Teste (RED).** `sandbox-limits.spec.ts`: `enquanto_tiver (certeza) { }` → a saída mostra a frase goiana do GS0701 com a linha do laço (o painel não exibe o código; o laço fica na linha 3); medir com `page.evaluate` um `setInterval` de 50 ms e exigir que o maior intervalo observado seja < 250 ms; `daqui_um_cadim` recursivo não termina → aviso de tempo; `vai_indo (trem i é 0; i menor_que 5000; i mais 1) { prosa("linha " mais i) }` → truncamento por linhas (teto `maxLogLines`) com aviso e a página continua responsiva. `run-output.spec.ts`: ordem síncrona/assíncrona preservada, `err` visualmente distinto (atributo `data-stream="err"`), o caso do TypeError em português. `ask-box.spec.ts`: duas `pergunta` respondidas pela caixa; Parar durante a pergunta; resposta com `<b>x</b>` aparece como texto.
- [ ] **1.3 Rodar:** `corepack pnpm --filter playground-e2e test:e2e --project=chromium` — esperado: passam onde a U4-09 já cobre; **qualquer falha de segurança é bloqueio**: corrigir o código (U4-04/U4-09), não o teste.
- [ ] **1.4 Rodar:** os três navegadores (`--project=firefox`, `--project=webkit`) — esperado: verdes; falha só de WebKit/Firefox com causa de ambiente é registrada no relatório, não escondida.
- [ ] **1.5 Commit:** `test(playground): cobre fuga de sandbox, limites e pergunta no e2e`.

---

### U4-12: E2E do editor e da interface
**Spec:** §8.2 (E2E: autocomplete, tela dividida), §11 (rastreabilidade: "Autocomplete com goianês → JS", "Tela dividida", "Playground: roda no navegador"), §6.3 (doação) · **Tier:** medium · **Depende de:** U4-07, U4-08, U4-09 · **Risco:** Monaco difícil de automatizar (lista de sugestões virtualizada) · **Rollback:** reverter o commit (só testes)
**Files:**
- Create: `apps/playground-e2e/tests/{editor-diagnostics,editor-autocomplete,split-view,donation-guard,engoianador}.spec.ts`
- Modify: `tools/rules-scan/baseline.json` (remove `engoianador.spec.ts` legado)
- Delete: `apps/playground-e2e/tests/{home,doacao,engoianador}.spec.ts` legados (recriados com os novos nomes)

**Aceite:** diagnósticos ao vivo (vários de uma vez) aparecem e somem ao corrigir; sublinhado na coluna certa com `ç` NFC, NFD e emoji; autocomplete digitando `se_` oferece `se_ocê_quiser` com detalhe `if`; digitando `prosa` mostra o equivalente `console.log`; hover em `uai` mostra `const`; tela dividida mostra o JS gerado e o seletor troca para otimizado (e o painel muda); exemplo carregado roda e produz o stdout do golden; sem variáveis de doação a página `/doacao` não tem botão; com variáveis válidas tem; build de produção com valor de exemplo falha (teste do script, não do navegador); página do Engoianador sem URL mostra "de folga" e não faz requisição (espião de rede); 404 em goianês.

- [ ] **1.1 Teste (RED).** `editor-autocomplete.spec.ts`: `await playground.typeProgram('se_')`, `await page.keyboard.press('Control+Space')`, exige `[role="listbox"]` com opção `se_ocê_quiser` e `se_ocê_quiser` com variante `se_oce_quiser` (conferir o nome real da variante sem acento na tabela antes de escrever o literal), e a documentação do item com `if`. `editor-diagnostics.spec.ts`: programa com três erros distintos mostra três marcadores; corrigir um por vez reduz; `uai ação é nome_que_nao_existe` marca a coluna de `nome_que_nao_existe` (conferida por `page.evaluate` sobre `monaco.editor.getModelMarkers`).
- [ ] **1.2 Teste (RED).** `split-view.spec.ts`, `donation-guard.spec.ts` (usa um segundo `webServer` com variáveis de doação válidas, `reuseExistingServer: false`), `engoianador.spec.ts` (espião `page.route('**/*')` contando requisições a hosts externos: zero sem URL configurada).
- [ ] **1.3 Rodar:** `corepack pnpm --filter playground-e2e test:e2e` nos três projetos — esperado: verdes; corrigir o app, não o teste.
- [ ] **1.4 Commit:** `test(playground): cobre editor, autocomplete, tela dividida e doação`.

---

### U4-13: Revisão de segurança e relatório do gate da Fase 4
**Spec:** §10.1 (Fase 4), §8.1 (Segurança), §6.3 · **Tier:** medium · **Depende de:** U4-10, U4-11, U4-12 · **Risco:** achado CRITICAL/HIGH aberto bloqueia o gate; relatório que afirma sem medir · **Rollback:** reverter o commit do relatório (correções viram commits próprios)
**Files:**
- Create: `docs/fase-4/relatorio-gate.md`
- Modify: o que os achados exigirem (teste de regressão antes de cada correção)

**Aceite:** `security-reviewer` (contexto fresco, só leitura) sem CRITICAL/HIGH abertos; Firefox e WebKit verdes na CI para os specs da U4-11 (nunca rodaram localmente); o relatório registra o desvio da mensagem forjada pelo Worker (só cobertura unitária); MEDIUM/LOW com disposição escrita; `verify`, E2E nos três navegadores e cobertura de `apps/playground` ≥ 80% (`config`, `lib`, `sandbox`) verdes; relatório com números medidos.

- [ ] **1.1 Revisão.** Despachar `everything-claude-code:security-reviewer` em contexto fresco repetindo no prompt: branch base `v3/integracao`; caminhos `apps/playground/{config,lib,sandbox,app,components,scripts}`, `apps/playground/vercel.json`, `.github/workflows/{playground-e2e,playground-smoke}.yml`; ignorar `packages/core`, `node_modules`, `.next`, `public/vs`; saída = tabela severidade/arquivo/descrição/correção, em português. Checklist: CSP da página e do runner (cada diretiva, `unsafe-eval`/`unsafe-inline` justificados), mensagens forjadas pelo Worker, XSS (`dangerouslySetInnerHTML`, `innerHTML`, `href` vindo de configuração ou de texto do aluno), link de compartilhamento (`#codigo=`) abrindo sem executar, `localStorage` (dado do aluno, sem segredo), `window.open`/`rel`, `postMessage` com `targetOrigin`, esgotamento de memória por saída, cache e cabeçalhos no `/sandbox/runner.js`, variáveis `NEXT_PUBLIC_*` (nenhum segredo), doação (esquema do link, texto da chave Pix), cliente do Engoianador (envio de texto, `credentials`), workflows (permissões, SHA, `base_url`).
- [ ] **1.2 Disposição.** CRITICAL/HIGH: RED de regressão, correção, revisão de novo. MEDIUM/LOW: corrigir agora, ticket `GS-<n>` (número vem do dono) ou aceitar com motivo.
- [ ] **1.3 Medir e escrever.** `docs/fase-4/relatorio-gate.md`: unidades e commits; cobertura por pacote e do app; resultado do E2E por navegador (contagem e tempo); tabela de ataques e resultado; bytes brotli do chunk do compilador no playground (catraca em `budgets.json`) e do chunk do otimizador; tempo de `compile()` no navegador para 1.000 e 10.000 linhas (Chromium, mediana de 20); achados e disposição; divergências do spec; riscos abertos; mapa de rastreabilidade (§11) da Fase 4 ("Autocomplete" → `editor-autocomplete.spec.ts`; "Tela dividida" → `split-view.spec.ts`; "Playground: roda no navegador" → `run-output.spec.ts` + smoke pós-deploy na Fase 9); **checklist do dono para o primeiro deploy** (seção "Tarefas do dono", Fase 4).
- [ ] **1.4 Rodar:** `corepack pnpm verify` e o E2E completo — esperado: verdes.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 4 e a revisão de segurança`.

---

## Grafo de unidades — Fase 5 (extensão VS Code)

| id | Unidade | depende de | tier | spec |
|---|---|---|---|---|
| U5-01 | Pacote `goiasscript-vscode`: manifesto, host injetável, build do bundle e do CLI embutido, gates | GATE 4 | large | §6.5, §8.1, §5.1 |
| U5-02 | Diagnósticos em tempo real | U5-01 | medium | §6.5, §5.9 |
| U5-03 | Autocomplete e hover | U5-01 | medium | §6.5, §5.2 |
| U5-04 | Comandos `traduz` e `bota_pra_moer`: guardas, invocação sem shell, terminal do programa | U5-01 | large | §6.5, §8.2 |
| U5-05 | Gramática, snippets, ícones e configuração da linguagem | U5-01 | small | §6.5, §5.2 |
| U5-06 | Testes dentro do VS Code: nomes hostis, esquema, Modo Restrito, diagnósticos | U5-02, U5-03, U5-04, U5-05 | large | §8.2, §6.5 |
| U5-07 | Release preparado: `vsix` único, Marketplace e Open VSX, smoke pós-publicação | U5-01, U5-05 | medium | §6.5, §8.6, ADR-0009 |
| U5-08 | Revisão de segurança da extensão e relatório do gate da Fase 5 | U5-06, U5-07 | medium | §10.1 F5 |
| **GATE 5** | Teste de nomes hostis e do manifesto verde nas três plataformas; `security-reviewer` sem CRITICAL/HIGH; `vsix` testado = `vsix` a publicar; dono publica | | | |

Camadas paralelas: {U5-01} · {U5-02, U5-03, U5-04, U5-05} · {U5-06, U5-07} · {U5-08}. Arquivos sem sobreposição dentro
de cada camada (cada unidade da camada 2 edita só o próprio stub em `src/features/` e a própria pasta de `src/`).

## Interfaces compartilhadas — Fase 5 (contrato entre unidades)

```ts
// packages/vscode/src/host/extension-host.types.ts — única fronteira com a API do VS Code
export interface HostDocument { readonly uri: string; readonly scheme: string; readonly fsPath: string; readonly languageId: string; readonly version: number; readonly text: string }
export interface HostDiagnostic { readonly code: string; readonly severity: 'error' | 'warning'; readonly message: string; readonly startLine: number; readonly startCharacter: number; readonly endLine: number; readonly endCharacter: number; readonly lessonUrl?: string }
export interface Disposable { dispose(): void }
export interface ProgramTerminal { write(text: string): void; onInput(handler: (text: string) => void): void; close(exitCode: number): void }
export interface ExtensionHost {
  readonly settings: () => ExtensionSettings;
  readonly isWorkspaceTrusted: () => boolean;
  readonly onDocumentEvent: (handler: (event: DocumentEvent) => void) => Disposable;   // aberto, alterado, fechado
  readonly onTrustGranted: (handler: () => void) => Disposable;
  readonly setDiagnostics: (documentUri: string, diagnostics: readonly HostDiagnostic[]) => void;
  readonly clearDiagnostics: (documentUri: string) => void;
  readonly showError: (message: string) => void;
  readonly askConfirmation: (message: string, confirmLabel: string) => Promise<boolean>;
  readonly appendOutput: (text: string) => void;
  readonly openProgramTerminal: (title: string) => ProgramTerminal;
  readonly resolvePath: (relative: string) => string;                 // caminho dentro da extensão (CLI embutido)
  readonly registerCompletionProvider: (provider: CompletionProviderPort) => Disposable;
  readonly registerHoverProvider: (provider: HoverProviderPort) => Disposable;
  readonly registerCommand: (commandId: string, handler: () => Promise<void>) => Disposable;
}
export interface CompletionProviderPort { provide(context: { readonly linePrefix: string }): readonly CompletionItemData[] }
export interface HoverProviderPort { provide(context: { readonly line: string; readonly character: number }): HoverContent | null }
export type DocumentEvent = { readonly kind: 'opened' | 'changed' | 'closed'; readonly document: HostDocument };
export interface Feature { activate(host: ExtensionHost): Disposable }   // um stub por feature em src/features/*.feature.ts

// packages/vscode/src/settings/settings.types.ts
export interface ExtensionSettings { readonly tone: Tone; readonly diagnosticsDelayMs: number; readonly lessonBaseUrl: string | null }

// packages/vscode/src/commands/commands.types.ts
export type CliCommand = 'traduz' | 'bota_pra_moer';
export interface CliInvocation {
  readonly file: string;                          // process.execPath (Electron com ELECTRON_RUN_AS_NODE) ou o node configurado
  readonly args: readonly string[];               // [cliEntry, command, '--tom', tone, ('--sobrescreve',) '--', documentPath]
  readonly options: { readonly cwd: string; readonly env: Readonly<Record<string, string | undefined>>; readonly windowsHide: true };
}
export interface ExecFileLike { (file: string, args: readonly string[], options: CliInvocation['options'], callback: (error: Error | null, stdout: string, stderr: string) => void): ChildProcessLike }
export type GuardResult = { readonly allowed: true } | { readonly allowed: false; readonly reason: 'not-file' | 'not-goiasscript' | 'untrusted' };
export function guardCommand(command: CliCommand, document: HostDocument | undefined, trusted: boolean): GuardResult;
export function buildCliInvocation(input: { readonly command: CliCommand; readonly documentPath: string; readonly cliEntry: string; readonly runtimePath: string; readonly tone: Tone; readonly overwrite: boolean }): CliInvocation;
```

(`Tone` e `compile` vêm de `@goiasscript/compiler`; `COMPLETIONS` e `lookup` de `@goiasscript/language`.)

---

## Fase 5

### U5-01: Pacote `goiasscript-vscode`, host injetável e build
**Spec:** §6.5, §8.1 (escopo dos gates: `packages/vscode` nasce com todos os gates, sem baseline), §5.1 · **Tier:** large · **Depende de:** GATE 4 · **Risco:** `main` do manifesto apontando para ESM (extensão do VS Code carrega CommonJS); bundle puxando o compilador por caminho de workspace; o CLI embutido ficando desatualizado em relação ao `packages/cli`; `vsce` reclamando de `@types/vscode` acima do `engines.vscode` · **Rollback:** reverter o commit (o legado `vscode-extension/` não é tocado)
**Files:**
- Create: `packages/vscode/{package.json,README.md,CHANGELOG.md,language-configuration.json,.vscodeignore,vitest.config.ts,budgets.json}`, `packages/vscode/src/extension.ts`, `packages/vscode/src/host/{extension-host.types.ts,vscode-host.ts}`, `packages/vscode/src/features/{diagnostics,completion,hover,commands}.feature.ts` (stubs que devolvem um `Disposable` vazio), `packages/vscode/src/settings/{settings.ts,settings.types.ts}`, `packages/vscode/tests/{manifest,package-layout,settings,gitattributes}.test.ts`, `packages/vscode/tests/support/fake-host.ts`, `scripts/{build-vscode.ts,build-vscode.types.ts,pack-vscode.ts,pack-vscode.types.ts}`
- Modify: `package.json` (`build:vscode`, `pack:vscode`), `vitest.config.mts` (projeto `goiasscript-vscode`, limiar 80% em `packages/vscode/src/**` exceto `src/extension.ts` e `src/host/vscode-host.ts`), `eslint.config.mjs`, `knip.json`, `.dependency-cruiser.cjs` (camada `vscode` acima de `optimizer`; `vscode` só importa `@goiasscript/*` e `vscode`), `.github/workflows/ci.yml` (projeto na matriz), `tools/config-tests/tests/eslint-matrix.test.mjs`, `pnpm-lock.yaml`

**Interfaces:** Consumes: `buildCli({ outDir })` (U3-12), `@goiasscript/{compiler,language}`. Produces: `ExtensionHost`, `Feature`, `readSettings(raw)`, `buildVscode({ outDir })`, `packVscode({ outDir }): Promise<{ vsix: string; sha256: string }>`.
**Aceite:** manifesto conforme o teste; `corepack pnpm build:vscode` gera `dist/extension.cjs` (CommonJS, `vscode` como `external`, compilador e tabela embutidos) e `dist/cli/**` (cópia do build do CLI); `pack:vscode` gera o `.vsix` e o sha256; `import 'vscode'` fora de `src/host/**` e `src/extension.ts` é barrado pelo ESLint; bytes brotli do bundle registrados em `budgets.json` (catraca); `verify` verde.

- [ ] **1.1 Teste (RED).** `tests/manifest.test.ts` (JSON lido do disco):
```ts
const manifest = readManifest();
it('declara a extensão como pacote CommonJS com ativação por linguagem', () => {
  expect(manifest.name).toBe('goiasscript-vscode');
  expect(manifest.main).toBe('./dist/extension.cjs');
  expect(manifest.activationEvents).toEqual(['onLanguage:goiasscript']);
  expect(manifest.version).toMatch(/^0\.3\.\d+$/u);
});
it('respeita o Modo Restrito de forma limitada, com texto em goianês', () => {
  expect(manifest.capabilities.untrustedWorkspaces).toMatchObject({ supported: 'limited' });
  expect(manifest.capabilities.untrustedWorkspaces.description.length).toBeGreaterThan(20);
});
it('não herda nada do legado', () => {
  for (const key of ['debuggers', 'themes', 'languagePacks', 'walkthroughs', 'viewsContainers']) expect(manifest.contributes).not.toHaveProperty(key);
  expect(manifest.dependencies).toBeUndefined();
});
it('executar o programa só aparece e só roda em workspace confiável de arquivo', () => {
  const runMenus = menusOf(manifest, 'goiasscript.run');
  expect(runMenus.length).toBeGreaterThan(0);
  for (const entry of runMenus) expect(entry.when).toMatch(/isWorkspaceTrusted/u), expect(entry.when).toMatch(/resourceScheme == file/u);
  for (const binding of keybindingsOf(manifest, 'goiasscript.run')) expect(binding.when).toMatch(/isWorkspaceTrusted/u);
});
it('o piso do editor acompanha @types/vscode', () => {
  expect(manifest.engines.vscode).toBe(`^${manifest.devDependencies['@types/vscode']}`);
});
it('o publisher é um valor neutro, trocado no empacotamento', () => {
  expect(manifest.publisher).toBe('goiasscript');
});
```
- [ ] **1.2 Teste (RED).** `tests/package-layout.test.ts`: `buildVscode({ outDir })` em pasta temporária gera `extension.cjs` sem `@goiasscript/`, sem `require("node:` fora de `child_process`, `path` e `os`, com `require("vscode")` e `dist/cli/goiasscript.mjs` começando em `#!/usr/bin/env node`; `packVscode` lista só `dist/**`, `syntaxes/**`, `snippets/**`, `assets/**`, `language-configuration.json`, `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json` (nenhum `.ts`, `.map`, `tests/`, `src/`); `packVscode` com `GS_EXTENSION_PUBLISHER=meu-publisher` troca o `publisher` no manifesto **empacotado** sem alterar o do repositório.
- [ ] **1.3 Teste (RED).** `tests/settings.test.ts`: `readSettings` com valores ausentes devolve `{ tone: 'raiz', diagnosticsDelayMs: 300, lessonBaseUrl: null }`; `tone` inválido cai para `'raiz'`; `diagnosticsDelayMs` fora de 0–5000 é limitado; `lessonBaseUrl` só vale com `https:`. `tests/gitattributes.test.ts`: `.gitattributes` da raiz contém `*.gs linguist-language=JavaScript` (promessa do §6.5).
- [ ] **1.4 Teste de configuração (RED).** `eslint-matrix.test.mjs`: violação `['vscode fora do host', 'packages/vscode/src/features/virtual.ts', "import * as vscode from 'vscode';\nexport const api = vscode;\n", 'no-restricted-imports']`; aceito `['vscode no host', 'packages/vscode/src/host/virtual.ts', "import * as vscode from 'vscode';\nexport const api = vscode;\n", 'no-restricted-imports']`; violação de `child_process` com `shell: true`: `['shell proibido', 'packages/vscode/src/commands/virtual.ts', "import { execFile } from 'node:child_process';\nexecFile('a', [], { shell: true });\n", 'no-restricted-syntax']`.
- [ ] **1.5 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run` e o projeto `config-tests` — esperado: falham (pacote inexistente).
- [ ] **1.6 Implementar.** `package.json` com `contributes`: `languages` (id `goiasscript`, extensão `.gs`, `configuration`, `icon`), `grammars` (`./syntaxes/goiasscript.tmLanguage.json`, escopo `source.goiasscript`), `snippets` (`./snippets/goiasscript.json`), `commands` (`goiasscript.translate` "GoiásScript: Traduz", `goiasscript.run` "GoiásScript: Bota pra moer"; **ids em inglês, títulos em goianês**), `menus` (`editor/title/run`, `explorer/context`, `commandPalette`) e `keybindings`, `configuration` (`goiasscript.tone`, `goiasscript.diagnosticsDelayMs`, `goiasscript.lessonBaseUrl`), `capabilities.untrustedWorkspaces`. Os caminhos de gramática, snippets, ícones e `language-configuration.json` são **contratados aqui e criados na U5-05**; até lá o teste de existência (`manifest-assets`) vive na U5-05. `build-vscode.ts`: esbuild `bundle`, `platform: node`, `format: cjs`, `target: node22`, `external: ['vscode']`, `minify: false`; copia `buildCli` para `dist/cli`; mede brotli e compara com `budgets.json`. `pack-vscode.ts`: copia o `LICENSE` da raiz, `execFile` (lista de argumentos) de `@vscode/vsce package --no-dependencies --out <dir>`, devolve caminho e sha256. `extension.ts`: `activate(context)` cria `createVscodeHost(context)` e ativa as quatro features, empurrando cada `Disposable` em `context.subscriptions`; sem lógica. `vscode-host.ts` implementa `ExtensionHost` com a API do VS Code (`languages.createDiagnosticCollection`, `workspace.isTrusted`, `window.createTerminal({ name, pty })` etc.).
- [ ] **1.7 Rodar:** os testes, `corepack pnpm build:vscode && corepack pnpm pack:vscode`, `corepack pnpm verify` — esperado: verdes.
- [ ] **1.8 Commit:** `feat(vscode): cria o pacote da extensão com host injetável e build do bundle` e, separado, `build(vscode): empacota o vsix e embute o cli`.

---

### U5-02: Diagnósticos em tempo real
**Spec:** §6.5 (diagnósticos em tempo real), §5.9, §8.2 (posições com emoji, NFD, CRLF) · **Tier:** medium · **Depende de:** U5-01 · **Risco:** resultado atrasado de uma versão antiga sobrescrevendo o da versão nova; milhares de diagnósticos travando o editor; conversão de coluna errada · **Rollback:** reverter o commit
**Files:**
- Create: `packages/vscode/src/diagnostics/{to-host-diagnostic.ts,live-diagnostics.ts,diagnostics.constants.ts}`, `packages/vscode/tests/{diagnostics,live-diagnostics}.test.ts`
- Modify: `packages/vscode/src/features/diagnostics.feature.ts`

**Interfaces:** Consumes: `compile`, `ExtensionHost`, `lessonUrlOf`-equivalente (`lessonUrl(base, id)`). Produces: `toHostDiagnostic(diagnostic, lessonBaseUrl)`, `createLiveDiagnostics({ host, timers })`.
**Aceite:** documento `goiasscript` aberto ou alterado é recompilado depois de `diagnosticsDelayMs` sem novas alterações; resultado de versão anterior é descartado; fechar o documento limpa os diagnósticos; no máximo 500 diagnósticos por documento, com um de informação "e mais N" ao final; `lessonUrl` só com `lessonBaseUrl` configurada; compilação nunca lança (falha vira diagnóstico `GS0901` do próprio compilador); nenhum código do programa é executado.

- [ ] **1.1 Teste (RED).** `diagnostics.test.ts`: tabela de posição (a mesma da U4-05 e do §8.2): ASCII, `ç` NFC, `c` + U+0327, emoji antes do erro, `\r\n`, última linha sem `\n`; `toHostDiagnostic` converte `line/column` 1-based do compilador para 0-based do VS Code; `severity` mapeada; `lessonUrl` = `base + '/' + lesson` sem barra dupla e `undefined` com base `null`; `message` junta `message` e `help` em linhas separadas.
- [ ] **1.2 Teste (RED).** `live-diagnostics.test.ts` com `FakeHost` e relógio falso: duas alterações em 100 ms geram **uma** compilação ao fim do atraso; alteração durante a espera reinicia o atraso; documento fechado antes do disparo não publica nada; `changed` com `version` 5 depois de `version` 4 já enviada vence mesmo se a compilação 4 terminar depois (a compilação é síncrona, o teste injeta um `compile` assíncrono para provar o descarte); 700 diagnósticos viram 500 + 1 de informação; `compile` que lança vira um diagnóstico `GS0901`-like em goianês sem derrubar o handler; documento de outro `languageId` é ignorado.
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run diagnostics live-diagnostics` — esperado: falha.
- [ ] **1.4 Implementar.** Estado `uri → { version, timerId }` guardado em campo `private` de uma classe pequena e mutado só por `this.*` (o override do ADR-0004 vale só para lexer, parser e analisador, então aqui o estado é substituído por um `Map` novo a cada evento, sem mutação); `compile(text, { fileName: basename, tone, target: 'module' })`.
- [ ] **1.5 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.6 Commit:** `feat(vscode): publica diagnósticos em tempo real com descarte de versão antiga`.

---

### U5-03: Autocomplete e hover
**Spec:** §6.5, §5.2 (tabela como fonte), §6.3 (mesmo comportamento do playground) · **Tier:** medium · **Depende de:** U5-01 · **Risco:** hover com texto do aluno virando Markdown/HTML executável; sugestão de membro fora de contexto · **Rollback:** reverter o commit
**Files:**
- Create: `packages/vscode/src/language/{completion-items.ts,hover-content.ts,word-at.ts}`, `packages/vscode/tests/{completion,hover}.test.ts`
- Modify: `packages/vscode/src/features/{completion,hover}.feature.ts`

**Interfaces:** Consumes: `COMPLETIONS`, `lookup`, `glossary.json`. Produces: `completionItemsFor(context): readonly CompletionItemData[]`, `hoverFor(word, lessonBaseUrl): HoverContent | null` (`{ markdown: string; trusted: false }`), `wordAt(line, character)`.
**Aceite:** os mesmos itens do playground (palavra goiana + equivalente JS + variante sem acento + link da lição quando houver base); `member: true` só depois de `.`; hover em palavra do usuário é `null`; o conteúdo do hover nunca é confiável nem contém HTML do programa; `wordAt` respeita o alfabeto de identificadores (acento, `_`, dígito não inicial).

- [ ] **1.1 Teste (RED).** `completion.test.ts`: prefixo `se_` oferece `se_ocê_quiser` com `detail: 'if'` e a variante sem acento; depois de `lista.` só itens `member`; depois de `.` em número (`1.`) nenhum; ordem estável; trecho de `snippets.json` entra com `kind: 'snippet'`; sem `lessonBaseUrl` nenhum item tem link. `hover.test.ts`: `hoverFor('uai')` contém `const` e a categoria; `hoverFor('ação')` é `null`; `trusted` é `false`; palavra com `<script>` num identificador (não pode existir, mas `wordAt` recebe texto livre) não aparece no Markdown.
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run completion hover` — esperado: falha.
- [ ] **1.3 Implementar.** Funções puras sobre a tabela; a feature só adapta para `languages.registerCompletionItemProvider` (gatilho `.`) e `registerHoverProvider` via `ExtensionHost` (o contrato `ExtensionHost` já nasce completo na U5-01, com `registerCompletionProvider`, `registerHoverProvider` e `registerCommand`; esta unidade **não** edita o tipo).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(vscode): adiciona autocomplete e hover a partir da tabela da linguagem`.

---

### U5-04: Comandos `traduz` e `bota_pra_moer`
**Spec:** §6.5 (comandos por `execFile`, nunca shell; só `file:`; Modo Restrito), §8.2 (regressão do CRITICAL da extensão) · **Tier:** large · **Depende de:** U5-01 · **Risco:** é o achado CRITICAL da auditoria da extensão legada: injeção de comando pelo nome do arquivo; programa do aluno executado em workspace não confiável; sequência de controle no título do terminal; `bota_pra_moer` sem `pergunta` interativa · **Rollback:** reverter o commit
**Files:**
- Create: `packages/vscode/src/commands/{command-guards.ts,cli-invocation.ts,run-translate.ts,run-program.ts,program-terminal.ts,sanitize-terminal-text.ts,commands.types.ts}`, `packages/vscode/tests/{command-guards,cli-invocation,run-translate,program-terminal}.test.ts`, `packages/vscode/tests/support/fake-exec-file.ts`
- Modify: `packages/vscode/src/features/commands.feature.ts`

**Interfaces:** Consumes: `ExtensionHost`, `ExecFileLike`. Produces: `guardCommand`, `buildCliInvocation`, `runTranslate(deps)`, `runProgram(deps)`, `createProgramTerminal(host, title)`, `sanitizeTerminalText(text)`.
**Aceite:** nome de arquivo chega ao `execFile` como **um único elemento do argv, depois de `--`**, em todos os nomes hostis; `shell` nunca é passado; `scheme !== 'file'` é recusado antes de qualquer execução, com mensagem em goianês; `bota_pra_moer` com workspace não confiável é recusado (mensagem pedindo confiança) e, ao conceder confiança, **não** executa sozinho; `traduz` roda em workspace não confiável (não executa código do aluno); destino existente (CLI sai com 3 e GS0903) oferece "Sobrescreve" só após confirmação explícita e reexecuta com `--sobrescreve`; a saída do CLI vai ao canal de saída (traduz) ou ao terminal (programa) com bytes de controle neutralizados; `pergunta` funciona (entrada do terminal vai ao `stdin` do processo).

- [ ] **1.1 Teste (RED).** `cli-invocation.test.ts`:
```ts
const HOSTILE_NAMES = ['a$(touch PWNED).gs', '`touch PWNED`.gs', 'a";touch PWNED;".gs', 'a;b.gs', 'a b.gs', '-x.gs', 'a&b.gs', 'a|b.gs', "a'b.gs", 'a\nb.gs', 'café.gs'] as const;
it.each(HOSTILE_NAMES)('%s vai como um único argumento, depois de --', (name) => {
  const invocation = buildCliInvocation({ command: 'traduz', documentPath: `/work/${name}`, cliEntry: '/ext/dist/cli/goiasscript.mjs', runtimePath: '/usr/bin/node', tone: 'raiz', overwrite: false });
  expect(invocation.args).toEqual(['/ext/dist/cli/goiasscript.mjs', 'traduz', '--tom', 'raiz', '--', `/work/${name}`]);
  expect(invocation.args.filter((arg) => arg.includes('PWNED'))).toHaveLength(name.includes('PWNED') ? 1 : 0);
  expect(invocation.options).not.toHaveProperty('shell');
  expect(invocation.options).toMatchObject({ windowsHide: true, cwd: '/work' });
});
it('ELECTRON_RUN_AS_NODE vale só para o filho e não herda variável de loader', () => { /* env do filho tem ELECTRON_RUN_AS_NODE=1; NODE_OPTIONS e LD_PRELOAD do host NÃO passam */ });
it('--sobrescreve entra antes do --, nunca depois', () => { /* … */ });
```
- [ ] **1.2 Teste (RED).** `command-guards.test.ts`: tabela `(command, scheme, languageId, trusted) → resultado`: `traduz` + `file` + `goiasscript` + `false` permitido; `bota_pra_moer` + `file` + `false` → `untrusted`; `untitled`, `git`, `vscode-remote`, `vscode-vfs`, `output`, `http` → `not-file`; `languageId: 'javascript'` → `not-goiasscript`; documento `undefined` → `not-goiasscript`. `run-translate.test.ts` com `fake-exec-file`: o espião registra `(file, args, options)` de **todas** as chamadas; nenhuma chamada acontece quando a guarda recusa; exit 0 mostra o caminho de saída (do stdout do CLI) em informação; exit 1 mostra o diagnóstico no canal de saída (stderr do CLI, já em goianês) e não reexecuta; exit 3 com `GS0903` pergunta antes de reexecutar com `--sobrescreve` e, se o usuário recusa, não chama `execFile` de novo; erro de spawn (`ENOENT`) vira mensagem em goianês, não pilha.
- [ ] **1.3 Teste (RED).** `program-terminal.test.ts`: `sanitizeTerminalText` remove ESC, BEL, C1, bidi e separadores de linha dos campos de **título e eco** (mesma classe do CLI) e preserva `\n`; o terminal escreve `\r\n` ao `write` de `\n`; entrada digitada é repassada ao `stdin` do processo com `\n`; Ctrl+C (`\u0003`) mata o processo; fechar o terminal mata o processo; processo que termina fecha o terminal com o exit code. `run-program`: processo filho é o resultado de `execFile` (stdin acessível) com o mesmo `buildCliInvocation` (`bota_pra_moer`).
- [ ] **1.4 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run command-guards cli-invocation run-translate program-terminal` — esperado: falha.
- [ ] **1.5 Implementar.** `buildCliInvocation` monta `args` por lista, `env` por `pick` (apenas `PATH`, `HOME`/`USERPROFILE`, `TMPDIR`/`TEMP`, `LANG`, `SystemRoot` + `ELECTRON_RUN_AS_NODE=1`), `cwd = dirname(documentPath)`. `runProgram` abre o terminal por `host.openProgramTerminal(sanitize(basename))`, liga `child.stdout/stderr → terminal.write` (tudo que a extensão escreve no terminal, inclusive a saída do programa do aluno, passa por `sanitizeTerminalText`, com a mesma classe de caracteres do `sanitizeForTerminal` do CLI; o CLI já neutraliza o texto do aluno, e esta é a segunda barreira) e `terminal.onInput → child.stdin.write`. `ExecFileLike` é injetado (em produção `node:child_process.execFile`).
- [ ] **1.6 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.7 Commit:** `feat(vscode): adiciona traduz e bota_pra_moer sem shell e com guarda de confiança`.

---

### U5-05: Gramática, snippets, ícones e configuração da linguagem
**Spec:** §6.5 (gramática, snippets e ícones gerados da tabela), §5.2, §9.4 (`.gitattributes`) · **Tier:** small · **Depende de:** U5-01 · **Risco:** arquivo gerado divergindo do `packages/language/generated` (cópia obsoleta); `wordPattern` quebrando palavra com acento; ícone ausente derrubando o empacotamento · **Rollback:** reverter o commit
**Files:**
- Create: `packages/vscode/{syntaxes/goiasscript.tmLanguage.json,snippets/goiasscript.json,assets/icons/*.svg,assets/icons/goiasscript-icon.png,language-configuration.json}`, `packages/vscode/tests/{manifest-assets,generated-drift,language-configuration}.test.ts`
- Modify: `scripts/build-vscode.ts` (copia `generated/goiasscript.tmLanguage.json` e `generated/snippets.json` para `syntaxes/` e `snippets/` antes do empacotamento, e `generate:check` do pacote `vscode` confere)

**Interfaces:** Consumes: `packages/language/generated/{goiasscript.tmLanguage.json,snippets.json}`; ícones de `vscode-extension/icons/` (copiados uma vez; o legado sai na Fase 8). Produces: nada novo.
**Aceite:** gramática e snippets do pacote são **idênticos byte a byte** aos gerados; todo caminho citado no manifesto existe e é rastreado; `language-configuration.json` tem comentários `//` e `/* */`, pares de colchetes, `wordPattern` do alfabeto de identificadores (P5) e nada do legado que não valha; o ícone PNG tem 128×128.

- [ ] **1.1 Teste (RED).** `manifest-assets.test.ts`: percorre `contributes` e `icon` do manifesto e exige `fs.existsSync` em cada caminho. `generated-drift.test.ts`: `readFileSync('syntaxes/goiasscript.tmLanguage.json')` igual ao de `packages/language/generated/`; idem snippets; falha com a instrução "rode `corepack pnpm build:vscode`". `language-configuration.test.ts`: `wordPattern` (RegExp) casa `ação`, `se_ocê_quiser`, `lista2` como uma palavra só e não casa `$`, `1abc` inteiro; `comments` e `brackets` presentes; `onEnterRules` ausente.
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run manifest-assets generated-drift language-configuration` — esperado: falha (arquivos inexistentes).
- [ ] **1.3 Implementar.** `build-vscode.ts` copia os gerados; os arquivos copiados são **versionados** (o drift test é o juiz). Ícones SVG e PNG copiados do legado; o PNG é conferido pelo cabeçalho (largura/altura).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(vscode): inclui gramática, snippets e ícones gerados da tabela`.

---

### U5-06: Testes dentro do VS Code
**Spec:** §8.2 (regressão do CRITICAL da extensão: nomes hostis, esquema, `untrustedWorkspaces`), §11 · **Tier:** large · **Depende de:** U5-02, U5-03, U5-04, U5-05 · **Risco:** teste que passa porque o comando nunca rodou (falso verde); VS Code baixado a cada execução; display ausente no Linux; nomes com `"` inválidos no NTFS · **Rollback:** reverter o commit (só testes e workflow)
**Files:**
- Create: `packages/vscode/vitest.integration.config.ts` (não usado: o runner é o do `@vscode/test-electron`), `packages/vscode/tests/integration/{runner.ts,hostile-names.test.ts,untrusted-workspace.test.ts,scheme-guard.test.ts,diagnostics.test.ts,fixtures.ts}`, `.github/workflows/vscode.yml`, `tools/config-tests/tests/vscode-workflow.test.mjs`
- Modify: `packages/vscode/package.json` (script `test:integration`, devDependencies `@vscode/test-electron` e `mocha` conforme o runner do pacote)

**Interfaces:** Consumes: o `.vsix`/diretório da extensão da U5-01. Produces: `runIntegration({ vscodeVersion })`.
**Aceite:** nas três plataformas, com a versão estável do VS Code e a do `engines`: (1) para cada nome hostil criado em tempo de execução numa pasta temporária (`a$(touch PWNED).gs`, `` a`touch PWNED`.gs ``, `a";touch PWNED;".gs`, `a;b.gs`, `a b.gs`; nomes com `"` só em Linux e macOS), `goiasscript.translate` e `goiasscript.run` **não** criam o marcador `PWNED` e o nome chega ao `execFile` como um elemento do argv (espião no módulo `node:child_process`, que é o mesmo objeto no host de extensão e no teste); (2) `document.uri.scheme !== 'file'` (`untitled:`) é recusado sem chamar `execFile`; (3) o manifesto exige `capabilities.untrustedWorkspaces`; (4) com a confiança do workspace negada (perfil de teste com `security.workspace.trust.enabled`), `goiasscript.run` não executa e `goiasscript.translate` sim; (5) abrir um `.gs` com erro publica diagnóstico do `source` esperado.

- [ ] **1.1 Teste (RED).** `hostile-names.test.ts`:
```ts
const childProcess = require('node:child_process') as typeof import('node:child_process');
suite('nomes hostis', () => {
  for (const name of HOSTILE_NAMES.filter((candidate) => isValidOnThisPlatform(candidate))) {
    test(`${name} não vira comando`, async () => {
      const dir = makeTempDir();
      const file = path.join(dir, name);
      fs.writeFileSync(file, 'prosa("oi")\n');
      const calls: ExecCall[] = [];
      const restore = spyOnExecFile(childProcess, calls);
      try {
        await openAndRun('goiasscript.translate', file);
        await openAndRun('goiasscript.run', file);
      } finally { restore(); }
      assert.ok(calls.length >= 2, 'o comando precisa ter executado de verdade');
      for (const call of calls) {
        assert.strictEqual(call.options.shell, undefined);
        assert.strictEqual(call.args.filter((arg) => arg === file).length, 1);
        assert.strictEqual(call.args[call.args.indexOf(file) - 1], '--');
      }
      assert.strictEqual(fs.existsSync(path.join(dir, 'PWNED')), false);
      assert.strictEqual(fs.readFileSync(file, 'utf8'), 'prosa("oi")\n');
    });
  }
});
```
- [ ] **1.2 Teste (RED).** `scheme-guard.test.ts` (`untitled:` e um provedor de documento virtual registrado pelo teste com esquema `gs-test:`): comando recusado, `calls` vazio, mensagem de erro em goianês exibida (espiar `window.showErrorMessage`). `untrusted-workspace.test.ts`: lançar o VS Code com `--disable-workspace-trust` **desligado** e a pasta marcada não confiável pelo perfil de teste; `run` recusado e `translate` permitido; depois de `workspace.isTrusted` verdadeiro (simulado via perfil confiável em segunda execução do runner), `run` funciona. `diagnostics.test.ts`: abre fixture com `uai x é` e espera `languages.getDiagnostics(uri)` não vazio com `source === 'goiasscript'`.
- [ ] **1.3 Teste de configuração (RED).** `vscode-workflow.test.mjs`: `vscode.yml` roda a matriz Ubuntu (com `xvfb-run`), Windows e macOS; `permissions: contents: read`; versões do VS Code `stable` e a do `engines`; actions por SHA; sem `secrets.`.
- [ ] **1.4 Rodar:** `corepack pnpm build:vscode && corepack pnpm --filter goiasscript-vscode test:integration` — esperado: falha nos primeiros casos (runner inexistente); em seguida cada falha de segurança é bloqueio: corrigir o código, não o teste.
- [ ] **1.5 Rodar:** a matriz completa pelo workflow (`workflow_dispatch` local não existe; a CI roda no push da fase) — esperado: verde; falha de ambiente (display, download do VS Code) registrada, não escondida. O resultado por plataforma entra no relatório da U5-08.
- [ ] **1.6 Commit:** `test(vscode): cobre nomes hostis, esquema e modo restrito dentro do vs code`.

---

### U5-07: Release preparado da extensão
**Spec:** §6.5 (publicação pelo CI no Marketplace e no Open VSX), §8.6, ADR-0009, `docs/fase-0/publicacao-extensao.md` · **Tier:** medium · **Depende de:** U5-01, U5-05 · **Risco:** token do Open VSX vazando para outro passo; publicar `.vsix` diferente do testado; Marketplace sem método aprovado (Entra ID federado ou `--oidc`); versão pré-lançamento publicada como estável · **Rollback:** reverter o commit (o workflow só dispara por tag; sem ambientes e segredos configurados pelo dono ele não publica nada)
**Files:**
- Create: `.github/workflows/{release-vscode.yml,smoke-extension.yml}`, `scripts/{release-target-vscode.ts,release-target-vscode.types.ts,smoke-extension.ts}`, `packages/vscode/tests/{release-target,smoke-extension}.test.ts`, `tools/config-tests/tests/release-vscode-workflow.test.mjs`
- Modify: `knip.json`, `packages/vscode/README.md` (instalação, comandos, Modo Restrito; em goianês)

**Interfaces:** Consumes: `packVscode`. Produces: `resolveVscodeReleaseTarget(tag, manifestVersion): { ok: true; version: string; preRelease: boolean } | { ok: false; reason: string }`, `runExtensionSmoke(fetchFn, ids): Promise<readonly SmokeFailure[]>`.
**Aceite:** tag `vscode-v0.3.N` com o `package.json` igual publica como pré-lançamento (`preRelease: true`); versão `>= 3.0.0` publica como estável; tag que não bate com o manifesto, sem prefixo ou com sufixo é recusada; o workflow não contém valor de segredo, `id-token: write` só no job de Marketplace, o token do Open VSX só no `env` do passo que publica, o `.vsix` publicado nos dois é o baixado do job de teste com o sha256 conferido, o commit da tag está na `main`; o smoke pós-publicação (manual, `workflow_dispatch`) confere por API pública que a versão existe no Marketplace e no Open VSX.

- [ ] **1.1 Teste (RED).** `release-target.test.ts`: `('vscode-v0.3.0', '0.3.0')` → `{ ok: true, preRelease: true }`; `('vscode-v3.0.0', '3.0.0')` → `preRelease: false`; recusa `('v0.3.0', '0.3.0')`, `('vscode-v0.3.1', '0.3.0')`, `('vscode-v0.3.0-rc.1', '0.3.0')`, `('vscode-v3.0.0-alpha.0', '3.0.0-alpha.0')` (o Marketplace não aceita sufixo). `smoke-extension.test.ts` com `fetchFn` falso: ambos respondem a versão esperada → vazio; Open VSX 404 → falha nomeada; Marketplace devolve versão antiga → falha.
- [ ] **1.2 Teste de configuração (RED).** `release-vscode-workflow.test.mjs`: gatilho só `push` de `tags: ['vscode-v*']`; `permissions` do arquivo `contents: read`; `id-token: write` apenas no job `publish-marketplace`, que declara `environment: marketplace`; `secrets.` aparece **uma única vez**, no `env` de um passo do job `publish-openvsx` (`environment: open-vsx`); nenhum `VSCE_PAT`; todo `uses:` por SHA; `publish-*` dependem de `integration`, que depende de `package`; há passo que confere o `sha256sum` do `.vsix` baixado e passo que confere que o commit da tag é ancestral de `origin/main`; o passo de Marketplace usa `--packagePath` do artefato, `--azure-credential` e `--pre-release` condicionado ao `preRelease` calculado.
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript-vscode exec vitest run release-target smoke-extension` e `corepack pnpm exec vitest run --project config-tests release-vscode-workflow` — esperado: falham.
- [ ] **1.4 Implementar.** Jobs: `verify` (Ubuntu, Node 24, `pnpm verify`) → `package` (`pack:vscode`, artefato `.vsix` + `.sha256`, saída `preRelease` de `release-target-vscode.ts`) → `integration` (mesma matriz da U5-06 sobre o `.vsix` baixado) → `publish-marketplace` (`azure/login` com `vars.AZURE_CLIENT_ID` e `vars.AZURE_TENANT_ID`, `npx @vscode/vsce@<versão exata> publish --packagePath … --azure-credential`) e `publish-openvsx` (`npx ovsx@<versão exata> publish <vsix>` com `OVSX_PAT` no `env` do passo). **O método do Marketplace é o `--azure-credential` por padrão** (documentado, `docs/fase-0/publicacao-extensao.md`); trocar por `--oidc` é editar uma linha e o teste de configuração, quando o dono decidir. Comentário curto no topo: "Os ambientes `marketplace` e `open-vsx` e as variáveis são criados pelo dono antes da primeira tag". Nenhuma tag criada, nada publicado.
- [ ] **1.5 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.6 Commit:** `ci(vscode): adiciona o release da extensão para marketplace e open vsx`.

---

### U5-08: Revisão de segurança da extensão e relatório do gate da Fase 5
**Spec:** §10.1 (Fase 5), §8.1 (Segurança), §8.2 · **Tier:** medium · **Depende de:** U5-06, U5-07 · **Risco:** achado CRITICAL/HIGH aberto bloqueia o gate; relatório afirmando sem medir · **Rollback:** reverter o commit do relatório
**Files:**
- Create: `docs/fase-5/relatorio-gate.md`
- Modify: o que os achados exigirem (RED de regressão antes de cada correção)

**Aceite:** `security-reviewer` (contexto fresco, só leitura) sem CRITICAL/HIGH abertos; MEDIUM/LOW com disposição escrita; `verify`, `test:integration` nas três plataformas e cobertura de `packages/vscode` verdes; conteúdo do `.vsix` listado e conferido; relatório com os números medidos.

- [ ] **1.1 Revisão.** Despachar `everything-claude-code:security-reviewer` em contexto fresco repetindo no prompt: branch base `v3/integracao`; caminhos `packages/vscode`, `scripts/{build-vscode,pack-vscode,release-target-vscode,smoke-extension}.ts`, `.github/workflows/{release-vscode,vscode,smoke-extension}.yml`; ignorar `packages/core`, `vscode-extension`, `node_modules`, `dist`; saída = tabela severidade/arquivo/descrição/correção, em português. Checklist: execução de comando por nome de arquivo (nenhum `shell`, nenhum `sendText`), esquema do documento, Modo Restrito (menus, atalhos **e** checagem em runtime), variáveis de ambiente do filho (`NODE_OPTIONS`, `LD_PRELOAD`, `ELECTRON_RUN_AS_NODE`), `cwd` controlado pelo usuário, Markdown de hover não confiável, sequência de controle no terminal e no canal de saída, regex/loop sobre documento grande, `lessonBaseUrl` (só `https:`), conteúdo do `.vsix` (nenhum `.ts`, mapa, teste, segredo, `.env`), workflow (escopo de `id-token`, token do Open VSX, SHAs, `vsix` único, commit da tag na `main`).
- [ ] **1.2 Disposição.** CRITICAL/HIGH: RED de regressão, correção, revisão de novo. MEDIUM/LOW: corrigir agora, ticket `GS-<n>` ou aceitar com motivo.
- [ ] **1.3 Medir e escrever.** `docs/fase-5/relatorio-gate.md`: unidades e commits; cobertura; resultado do `test:integration` por SO e versão do VS Code; tabela de nomes hostis; listagem do `.vsix` (`vsce ls`) e tamanho; bytes brotli do bundle (`budgets.json`); achados e disposição; verificação manual do dono num VS Code real (Modo Restrito, `pergunta` no terminal, ícone, snippets) com capturas de tela; divergências do spec; riscos abertos; mapa de rastreabilidade (§11) da Fase 5 ("A extensão não executa comando a partir do nome do arquivo e respeita o Modo Restrito" → `hostile-names.test.ts` + `untrusted-workspace.test.ts` + `manifest.test.ts`; "Extensão: realce, ícones, snippets" → `generated-drift.test.ts` + smoke pós-publicação); **checklist do dono para a primeira publicação** (seção "Tarefas do dono", Fase 5).
- [ ] **1.4 Rodar:** `corepack pnpm verify`, `corepack pnpm pack:vscode` e `test:integration` — esperado: verdes.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 5 e a revisão de segurança`.

---

## Fases 6 a 9 (esboço — detalhado no plano 4)

Cada unidade abaixo vira passos TDD no plano 4. Aqui ficam id, escopo, dependências, aceite e o arquivo-dono principal
(para o grafo não colidir). Regras globais deste plano valem para todas. **Cada fase termina com uma unidade de gate**
que escreve `docs/fase-N/relatorio-gate.md`.

### Fase 6 — Cartilha + piloto (6 dias; depende do GATE 4)

| id | Escopo | depende de | aceite | dono dos arquivos |
|---|---|---|---|---|
| U6-01 | Motor de lições: Markdown com frontmatter (`id`, `title`, bloco de exemplo, exercício com `expectedStdout`, `stdin` opcional e `solution`) validado por schema; carregador em tempo de build | GATE 4 | lição inválida (id repetido, exercício sem saída, bloco que não compila) derruba o build com mensagem em goianês; testes de unidade do parser | `apps/playground/lib/cartilha/**` |
| U6-02 | Interface `/cartilha`: índice, página da lição, editor com o exemplo, correção automática comparando a saída com a esperada (reusa `RunnerClient`), progresso em `localStorage` (com `try/catch`) | U6-01 | E2E: abrir lição, rodar, acertar e errar um exercício, perder o armazenamento sem quebrar | `apps/playground/app/cartilha/**`, `components/cartilha/**` |
| U6-03a | Lições 1 a 4 (`prosa`; `uai` e `trem`; texto e `mais`; `se_ocê_quiser`), com a lição 2 ensinando o decimal com ponto e o exercício `uai preço é 10,50` (GS0208, P12) | U6-01 | todo bloco compila e roda no CI; solução produz a saída esperada | `apps/playground/content/cartilha/licao-01..04.md` |
| U6-03b | Lições 5 a 8 (laços; listas; `faz_trem`; coisas) | U6-01 | idem | `content/cartilha/licao-05..08.md` |
| U6-03c | Lições 9 a 11 (`arruma_trem` e `a_raiz` com `Fruta`/`Pequi`; `tenta_aí` e `vixe`; `pergunta` e `espera_um_cadim` com `stdin.txt` e o exercício `vira_número(pergunta("Quanto custa?"))` respondido `10,50`) | U6-01 | idem; nenhum exemplo usa `Conta`/`Data` como nome de classe (P4) nem membros de nome reservado (P3) | `content/cartilha/licao-09..11.md`, `content/cartilha/stdin/**` |
| U6-04 | Liga erro → lição: `AVAILABLE_LESSONS` e `KNOWN_LESSON_IDS` (U4-05) preenchidos; rota `/cartilha/<id>` para todo `lesson` do catálogo; página `o-que-mudou` servida de `docs/spec/o-que-mudou.md`; glossário (`glossary.json`) | U6-02, U6-03a..c | teste percorre `DIAGNOSTICS` e exige página existente para cada `lesson`; hover do playground e da extensão passam a mostrar o link | `apps/playground/lib/lesson-routes.ts`, `app/glossario/**`, `app/o-que-mudou/**` |
| U6-05 | Kit do piloto: roteiro de 3 a 5 aprendizes (inclusive de fora de Goiás), formulário de retorno sobre mensagens e lições, modelo do relatório em `docs/piloto/` (sem dado pessoal; respostas anonimizadas) | U6-02 | documento revisado; nenhum nome, e-mail ou local de aprendiz; o plano 4 define como o dono executa | `docs/piloto/**` |
| U6-06 | Aplicar o retorno do piloto (ajustes de mensagens do catálogo, lições e exercícios) | **tarefa do dono: piloto realizado** | cada ajuste com teste (golden ou lição); relatório registra o que mudou e o que ficou fora | conforme o retorno |
| U6-07 | **Gate 6:** E2E da cartilha nos três navegadores, blocos de código no CI, relatório do piloto (S8: ≥ 3 aprendizes concluem as lições 1 a 5) | U6-04, U6-06 | `docs/fase-6/relatorio-gate.md` com números; sem revisão de segurança obrigatória no spec para esta fase (revisão leve de XSS no Markdown renderizado) | `docs/fase-6/**` |

### Fase 7 — Engoianador (3 dias; depende do GATE 4; paralela às Fases 5 e 6)

| id | Escopo | depende de | aceite | dono dos arquivos |
|---|---|---|---|---|
| U7-01 | Validação de borda com Zod (versão exata): corpo JSON, `Content-Type`, `Content-Length` antes de ler o corpo, `null`/array/tipo errado = 400 em goianês com CORS, tamanho máximo, política explícita para falha transitória do KV | GATE 4 | teste de cada caso (APP-10); cobertura de `index.ts` | `apps/engoianador-api/src/{index.ts,validation.ts}` |
| U7-02 | Limite de uso atômico: reserva e devolução da cota (só resposta bem-sucedida consome), chave por rede /64, teto global, kill switch, configuração inválida falha no deploy; Durable Object `RateLimiter` (decisão 8) | GATE 4 | teste de concorrência (`Promise.all`) e com provedor simulado em erro: o contador volta ao valor anterior (APP-02) | `apps/engoianador-api/src/{rate-limit.ts,limiter.ts}`, `wrangler.toml` |
| U7-03 | Provedor e modelo: modelo por variável de ambiente, ID verificado contra a API na hora do deploy (`scripts/verify-model.ts`, lê a chave do ambiente), fallback Workers AI configurado e testado | U7-01 | sem chave real no repositório; teste com provedor simulado cobre sucesso, 4xx, 5xx, timeout e modelo desligado | `apps/engoianador-api/src/{engoiana.ts,providers/**}` |
| U7-04 | Cache por hash do texto normalizado (chave inclui ID do modelo e versão do prompt), TTL curto; as 5 frases prontas não chamam o provedor nem consomem cota (APP-03) | U7-02, U7-03 | teste: segunda chamada igual não chama o provedor e não consome cota | `apps/engoianador-api/src/cache.ts` |
| U7-05 | `GET /health` (sem provedor, sem cota; confere modelo e bindings) | U7-01 | contrato do `/health` testado; cliente do playground (U4-07) atualizado com o mesmo teste | `apps/engoianador-api/src/health.ts`, `apps/playground/lib/engoianador-client.ts` |
| U7-06 | Teste de contrato semanal contra a API real e smoke único pós-deploy (workflows com o segredo referenciado só no passo; sem valor no repositório) | U7-03 | workflow validado por teste de configuração; **não roda sem o segredo configurado pelo dono** | `.github/workflows/{scheduled.yml (job contrato),engoianador-smoke.yml}` |
| U7-07 | Testes reais de `index.ts` e `engoiana.ts` (hoje 0/8 mutantes mortos) com Stryker em modo relatório | U7-01, U7-03 | nota de mutação medida e registrada | `apps/engoianador-api/test/**`, `stryker.config.mjs` |
| U7-08 | **Gate 7:** revisão de segurança do Worker (`security-reviewer`) e relatório | U7-04..U7-07 | sem CRITICAL/HIGH; contrato verde **quando o dono configurar a chave** (senão registrado como pendente); validação por schema coberta | `docs/fase-7/relatorio-gate.md` |

### Fase 8 — Docs, spec final e remoção do legado (3 dias; depende dos GATES 5, 6 e 7)

| id | Escopo | depende de | aceite | dono dos arquivos |
|---|---|---|---|---|
| U8-01 | Spec final em `docs/spec/` (referência gerada, gramática com ids estáveis, migração) conferida contra a tabela | GATES 5-7 | `generate:check` e drift test verdes | `docs/spec/**` |
| U8-02 | `CONTRIBUTING.md` enxuto, templates de issue e `config.yml`, `rfc.md`, README com a política "não faz parte da v3" | GATES 5-7 | comandos citados existem (§8.5.3); sem referência a Discussions desligado | `CONTRIBUTING.md`, `README.md`, `.github/ISSUE_TEMPLATE/**` |
| U8-03 | `docs/operacao.md`: rotacionar chave, kill switch, republicar extensão, `npm deprecate`/dist-tags, recriar trusted publisher, reverter deploy | GATES 5-7 | cada comando citado conferido pelo gate de promessas | `docs/operacao.md` |
| U8-04 | Gate de promessas, itens 2 e 3: compila e executa todo bloco goiano do README/`docs/`/cartilha/`CLAUDE.md`; confere comandos e keywords citados | GATES 5-7 | item 2 e 3 do §8.5 verdes no CI; blocos de "o que mudou" marcados como erro esperado (GS0306) | `scripts/check-docs-blocks.ts`, `.github/workflows/promises-gate.yml` (job novo) |
| U8-05 | Gate de promessas, itens 4, 5, 6 e 8: lista de inglês proibido com permissão versionada, snapshot do `--help`, zero dependências do compilador, tabela de rastreabilidade (§11), links com `lychee` (locais bloqueiam, externos no semanal) | U8-04 | verdes; cada afirmação do §11 aponta para teste existente e verde | `scripts/check-traceability.ts`, `tools/promises/**` |
| U8-06 | Remoção do legado: `packages/core`, `vscode-extension/`, `lsp-server/`, `.vsix`, `KEEP-OR-ARCHIVE.md`, `legacy-ci.yml`, docs obsoletos; `.gitignore` corrigido; `excluded` do `scope.json` esvaziado; tag de arquivo do protótipo Rust | U8-04, U8-05; **tag `legacy/1.5` existente (D11)** | `git grep` por `goiasscript-legacy` vazio; `verify` verde sem exceção por caminho | raiz do repositório |
| U8-07 | `CLAUDE.md` atualizado ao estado final (< 200 linhas) e `.github/copilot-instructions.md` como ponteiro | U8-06 | `agent-docs` verde | `CLAUDE.md` |
| U8-08 | **Gate 8:** relatório; gate de promessas completo (incluindo links) | U8-01..U8-07 | `docs/fase-8/relatorio-gate.md`; o e-mail de contato (tarefa do dono) vem de configuração, não do texto | `docs/fase-8/**` |

### Fase 9 — Relançamento + vídeo (3 dias; depende do GATE 8)

| id | Escopo | depende de | aceite | dono dos arquivos |
|---|---|---|---|---|
| U9-01 | Changesets (`chore(release): versiona pacotes`) e o job `compat` do §9.5 (diff de `vocabulario.lock.json` contra o bump pendente; casos `ok: true` do corpus da tag anterior) | GATE 8 | PR com remoção de palavra sem changeset `major` é barrado (teste de configuração) | `.changeset/**`, `.github/workflows/compat.yml` |
| U9-02 | `release.yml` estende para versão estável: tag `v3.0.0` publica em `latest`; `release-target.ts` aceita estável só com Changesets aplicado; CHANGELOG em português com "Removido" e "Alterado" (§8.6) | U9-01 | teste de configuração; workflow sem token; mesmo tarball testado | `.github/workflows/release.yml`, `scripts/release-target.ts`, `CHANGELOG.md` |
| U9-03 | Smoke pós-publicação: `npm install -g goiasscript` do `latest`, `--version`, `LICENSE`, `goiasscript dedo_de_prosa`, mais o do playground (U4-10) e da extensão (U5-07) | U9-02 | workflow `workflow_dispatch` sem segredo | `.github/workflows/smoke-release.yml` |
| U9-04 | Checklist dos achados da auditoria (S3): script gera, de `scripts/audit-issues.json`, a lista CRITICAL/HIGH com o teste de regressão de cada um; os dois CRITICAL ligados aos testes da §8.2 | GATE 8 | zero CRITICAL/HIGH abertos; zero `expected-fail` no corpus | `scripts/audit-checklist.ts` |
| U9-05 | Rastreabilidade §11 100% verde; descrição do repositório e README alinhados ao que foi provado | U9-03, U9-04 | `check-traceability` verde | — |
| U9-06 | Dados reais para o vídeo (§10.4): script que lê versão, contagem de testes do CI, saídas do CLI (stdout e stderr), resposta real do Engoianador, e grava JSON para o kit externo | U9-05 | JSON gerado de execução real; nenhum dado inventado | `scripts/video-facts.ts` |
| U9-07 | **Gate 9 / relatório final:** rastreabilidade, S1 a S8, riscos, retrospectiva de prazo | U9-05, U9-06 | `docs/fase-9/relatorio-gate.md` | `docs/fase-9/**` |

---

## Decisões do dono que o plano espera

Cada uma tem padrão adotado; o plano segue o padrão se o dono não disser o contrário no gate do plano.

1. **Playground continua em Next.js 15 (App Router) com Monaco hospedado no próprio site**, cabeçalhos de segurança definidos em `next.config.ts` a partir de um módulo puro testável (`vercel.json` sem cabeçalhos). O spike pedia `vercel.json`; a fonte única em código evita duas políticas divergentes e deixa o E2E ver os mesmos cabeçalhos em `next start`. Alternativa: `vercel.json` como fonte, com teste de igualdade.
2. **Compilação na thread da página (debounce), otimizador em chunk preguiçoso.** Programas de aluno são pequenos; o teto de 150 ms para 10 mil linhas cabe na página. Alternativa: Worker de compilação (mais código, mais mensagens).
3. **Lint de `apps/playground`:** ESLint estrito (typescript-eslint) com plugins `react-hooks` e `@next/eslint-plugin-next` só nos `.tsx`, sem `next lint` (depreciado). Se o ecossistema não suportar ESLint 10, o relatório registra e o app segue só com `typescript-eslint` estrito mais as regras de hooks escritas à mão no scanner. Alternativa: fixar um ESLint 9 isolado só para o app.
4. **Limites de execução do playground (`RUN_LIMITS`):** 10 s de relógio, 400 ms ociosos, 1.000 linhas e 200 mil caracteres de log, `loopLimit` de 1.000.000. Valores iniciais, medidos e ajustados no gate com os números reais.
5. **Pergunta cancelada = execução encerrada.** O ajudante `$gs_pergunta` do alvo `playground` não tem caminho de erro (aguarda `gs:resposta`); cancelar mata o Worker. Alternativa: mudar o ajudante no compilador (MINOR, mexe na Fase 2).
6. **E2E do playground: Chromium, Firefox e WebKit no Ubuntu** (o spec pede os três; Windows e macOS ficam de fora do E2E do navegador por custo). A matriz Node 22/24 × Ubuntu/Windows continua nos testes de unidade.
7. **Link de compartilhamento em `#codigo=` (UTF-8, base64url, máx. 8 KB)** e código salvo só em `localStorage`; sem servidor, sem conta, sem telemetria.
8. **Engoianador: limite atômico por Durable Object** (o KV não é atômico; o spec exige reserva e devolução atômicas). Requer plano do Cloudflare que inclua Durable Objects (o gratuito inclui, com SQLite). Alternativa: aceitar o KV com janela de corrida documentada (contraria §6.6).
9. **Versão da extensão antes do 3.0.0: `0.3.N`, em canal de pré-lançamento.** O Marketplace não aceita sufixo `-alpha`; `0.3.N` fica abaixo de `3.0.0`, então a estável `3.0.0` da Fase 9 é um aumento válido e a versão final alinha com a linguagem (§9.5). Alternativa: publicar só na Fase 9 (contraria o gate da Fase 5).
10. **`engines.vscode` `^1.90.0`** (seguir o `@types/vscode` de mesma versão, exata). Piso conferido na U5-01 contra `@vscode/test-electron`.
11. **Comandos da extensão executam o CLI embutido** (`dist/cli/goiasscript.mjs`) por `execFile` com `ELECTRON_RUN_AS_NODE=1`, em lista de argumentos; `bota_pra_moer` abre um terminal de pseudo-terminal (`Pseudoterminal`) ligado ao processo filho para `pergunta` funcionar, sem `Terminal.sendText`. Alternativa: executar em processo (contraria o spec e o teste do `execFile`).
12. **Método de publicação no Marketplace: `--azure-credential` (Entra ID federado ao GitHub Actions)** como padrão do workflow, por ser o documentado; `--oidc` só se o dono preferir e a maturidade estiver confirmada. Open VSX por token de escopo restrito só no passo de publicação. Os PATs globais do Azure DevOps são aposentados em 2026-12-01: sem decisão e execução até lá, a opção é PAT mínimo só para a primeira publicação ou adiar a Fase 5 (ver `docs/fase-0/publicacao-extensao.md`).
13. **`publisher` do manifesto fica neutro (`goiasscript`) no repositório** e é trocado no empacotamento pela variável `GS_EXTENSION_PUBLISHER` quando o dono definir o identificador real no Marketplace.
14. **Fases 6 a 9 em esboço neste plano, detalhadas num plano 4 escrito depois do GATE 5** (§10.2: planos seguintes saem já com os nomes reais). A Fase 7 não depende das Fases 5 e 6 e pode rodar em paralelo a elas, desde que o dono libere a conta Cloudflare.
15. **Mutação do pacote `cli` entra só como relatório** (U4-02) e a catraca vem no plano 4; mutação de `playground` e `vscode` não entra nestas fases.
16. **Limite de 29 KB brotli do ADR-0001 (herdado do gate 2):** o bundle de `src/index.ts` mede 32.680 bytes. O dono decide se o teto vale para o pacote inteiro; enquanto isso a catraca do playground (`budgets.json`) e a da extensão só impedem piora.

## Tarefas do dono (nenhuma é unidade executável por agente)

Cada item bloqueia a fase indicada; o relatório de gate da fase repete o seu checklist.

**Pendências da Fase 3 (antes de abrir o GATE 4)**
1. Enviar a branch da Fase 3 ao remoto e colar no relatório do gate 3 o resultado da CI do E2E do tarball em Windows e macOS (seis combinações). Se `pack-cli.ts` falhar no Windows por `corepack.cmd`, abrir correção antes da U4-03.
2. Conferir o Ctrl+C em laço no `goias` num terminal gráfico real.
3. Criar o ambiente `npm-release` no GitHub, o trusted publisher do `goiasscript` no npm **imediatamente antes** do primeiro publish, a tag `v3.0.0-alpha.0`, aprovar o stage com 2FA, validar em até 2 dias e registrar que `--tag next` funcionou com publisher só de stage (checklist do relatório do gate 3).
4. Abrir os tickets `GS-<n>` dos achados 3 e 4 (resolvidos pelas U4-01 e U4-02; os tickets servem de referência no commit).
5. Decidir o teto de 29 KB brotli (decisão 16) e confirmar o golden de `audit-m01`.

**Fase 4 (playground)**
6. Criar o projeto na Vercel apontando para `apps/playground` (diretório raiz do projeto), com as variáveis `NEXT_PUBLIC_*` do `.env.example`; registrar `goiasscript.com.br` ou adotar o domínio `.vercel.app`.
7. Fornecer a chave Pix real e/ou o link do GitHub Sponsors e do Ko-fi, ou deixar as variáveis vazias (a seção some).
8. Disparar o workflow `playground-smoke.yml` com a URL do deploy e anexar o resultado ao relatório.

**Fase 5 (extensão)**
9. Decidir o método do Marketplace (decisão 12) **antes de 2026-12-01**; criar o publisher; registrar o aplicativo Entra ID, a credencial federada (`repo:<org>/<repo>:environment:marketplace`) e adicionar o principal ao publisher; criar o ambiente `marketplace` e as variáveis `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `MARKETPLACE_PUBLISHER`.
10. Criar a conta Eclipse, assinar o Publisher Agreement do Open VSX, criar o namespace (`ovsx create-namespace`) e um token com escopo restrito; criar o ambiente `open-vsx` com o segredo `OVSX_TOKEN`.
11. Definir `GS_EXTENSION_PUBLISHER` (se o identificador não for `goiasscript`), criar a tag `vscode-v0.3.0`, aprovar os ambientes e rodar o smoke pós-publicação.
12. Conferir num VS Code real: Modo Restrito, `pergunta` no terminal, ícone, snippets (capturas anexadas ao relatório).

**Fase 6 (cartilha)**
13. Recrutar 3 a 5 aprendizes para o piloto (inclusive de fora de Goiás), aplicar o roteiro do kit e entregar o retorno anonimizado.

**Fase 7 (Engoianador)**
14. Criar a conta Cloudflare (KV, Durable Object, secret `GROQ_API_KEY`, binding Workers AI), a chave da Groq, registrar os segredos e variáveis no GitHub para o contrato semanal, e executar o `wrangler deploy`.

**Fase 8 (docs)**
15. Fornecer o contato público para `SECURITY.md` e `CODE_OF_CONDUCT.md` (por configuração do repositório, sem aparecer em documento novo), ligar o reporte privado de vulnerabilidade e aplicar as configurações do GitHub (`delete_branch_on_merge`, merge commit desligado) se ainda não estiverem.
16. Confirmar que a tag `legacy/1.5` existe no remoto antes da U8-06.

**Fase 9 (relançamento)**
17. Criar a tag `v3.0.0` (estável), aprovar o stage com 2FA, executar `npm deprecate goiasscript@2.0.0`, publicar a extensão estável (`vscode-v3.0.0`), criar o GitHub Release.
18. Renderizar de novo o vídeo no kit externo com o JSON da U9-06.
