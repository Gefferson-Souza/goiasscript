# GoiásScript 3 — Plano 2 (Fase 3: CLI + REPL, `3.0.0-alpha` em `next`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Execução igual à do plano 1 (D12): grafo de unidades, worktree por unidade, TDD, revisor independente em contexto
> fresco, passada de limpeza ("de-sloppify"), fila de merge e gate humano ao fim da fase.

**Goal:** Entregar o sub-projeto 3 do spec: o pacote `goiasscript` (CLI `goiasscript` e REPL `goias`), instalável do
tarball em pasta limpa, com a matriz de nomes de arquivo verde, revisão de segurança sem CRITICAL/HIGH e a primeira
publicação `3.0.0-alpha` no dist-tag `next`.

**Architecture:** Pacote novo `packages/cli` (npm `goiasscript`) sobre `@goiasscript/compiler`, `@goiasscript/optimizer`
e `@goiasscript/language`, que viram devDependencies e são embutidos por esbuild: o `goiasscript` publicado tem zero
dependências. Toda E/S passa por `CliIo` (saída, entrada, sistema de arquivos e ambiente injetáveis); só `src/entry/`
e o adaptador de processo tocam `process`. Comandos são funções puras sobre `CliIo`, testadas com um `MemoryIo`;
o que depende do processo real (importar o programa, `exit`, `unhandledRejection`) fica atrás de `ProcessHost`.
O REPL é um motor (`ReplEngine`: `compile()` com `ReplSession` + `vm.Context`) separado do laço interativo (readline).

**Tech Stack:** Node `>=22.12` (engines) com toolchain `>=22.22.1`; `node:util` `parseArgs`; `node:readline`;
`node:vm`; esbuild 0.28.2 (já fixado no `compiler`), sem dependência nova de runtime; Vitest 5 (unidade e E2E);
npm trusted publishing (OIDC) com provenance.

**Spec:** `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md`: §4.10, §4.11 (GS07xx e GS09xx), §5.7, §5.9, §5.10,
§6.1, §6.2, §8.1–§8.6, §9.5, §10.1 (Fase 3), §10.3, §11. Pendências herdadas: `docs/fase-2/relatorio-gate.md`.

## Global Constraints

Valem todas as do plano 1 (Node, TypeScript 6.0.3 fixado, versões exatas, `corepack pnpm`, identificadores em inglês
inclusive testes e nomes de arquivo, comentários R1–R4, sem `any`/`@ts-ignore`, `readonly`, funções < 50 linhas,
arquivos ≤ 400 alvo e 800 máximo, TDD com RED visto falhar, cobertura ≥ 80% por pacote e de patch, Conventional
Commits em português minúsculo com escopo do `scope-enum`, sem trailer de IA, nada de push/PR/publicação sem
aprovação explícita). Específicas do CLI:

- **Sem `console`.** O terminal escreve por `OutputSink` injetável (`process.stdout.write`/`process.stderr.write` só em
  `src/entry/real-io.ts`). `process` só aparece em `src/entry/**` e em `src/run/process-host.ts` (regra de ESLint
  com teste em `tools/config-tests`).
- **Sem shell, nunca.** Nenhum `exec`, `execSync`, `spawn` com `shell: true` nem concatenação de comando no código do
  CLI. Nome de arquivo é dado, nunca comando; o programa roda em processo, sem `spawn`.
- **Exit codes** (§6.1): `0` sucesso; `1` erro de compilação; `2` erro de execução (inclui GS0702 e GS0703); `3` uso
  incorreto (GS0902, GS0903, GS0905). Constantes em `src/exit-codes.constants.ts`; nenhum literal numérico fora dela.
- **Node `>=22.12`:** versão menor recebe o aviso GS0904 em goianês no stderr e o comando segue (best effort).
- **Stdout/stderr:** diagnósticos e avisos vão ao stderr; resultado útil (JS gerado em `-`, `--json`, `explica`,
  `dedo_de_prosa`) ao stdout. Nada em inglês, nem do motor: `error.message` do motor nunca é exibido (§5.10).
- **Segurança de arquivos:** o fonte `.gs` nunca é aberto para escrita; destino novo nasce com criação exclusiva
  (flag `wx`); comparação de identidade por dispositivo+inode, não por texto; temporários só em diretório próprio
  criado com `mkdtemp` em `os.tmpdir()`; saída ao terminal passa por `sanitizeForTerminal` (sem escape ANSI vindo do
  nome do arquivo ou do texto do aluno).
- **Pacote publicado:** `dependencies` ausente; `files` = `dist`, `README.md`, `LICENSE`; sem `.ts`, sem `src/`.
- **Workflow de release:** sem `NPM_TOKEN`/`NODE_AUTH_TOKEN`/segredo; `id-token: write` só no job de publicação;
  actions pinadas por SHA; o tarball publicado é o testado (mesmo sha256).

## Review Focus

1. **Windows**: arquivo salvo com BOM e `\r\n` (ou UTF-16 pelo Bloco de Notas, ou ANSI) lido e diagnosticado com linha
   e coluna certas; caminho `C:\Users\Aluno\Meu Programa.GS` com barra invertida e espaço; nomes reservados (`CON.gs`,
   `nul.GS`, `con.txt.gs`), `a:b.gs` (fluxo alternativo), ponto/espaço no fim; stdin com `\r\n`; temporário em
   caminho com espaço, `#` e `%` importado por URL `file:` — testes em U3-03, U3-04, U3-07 e U3-13 (matriz Windows).
2. **stdin em pipe**: programa com duas `pergunta` nos quatro cenários do §8.5.1 (tudo de uma vez, espaçado,
   escritor aberto com saída em menos de 1 s, fim cedo com exit 2 e `GS0702`, nunca 13 nem 0) e promessa pendente com
   `GS0703` e exit 2; `traduz -` lendo o programa do stdin — testes em U3-06, U3-07 e U3-13.
3. **Nome de arquivo hostil ou sem `.gs`**: `x.txt`, `x`, `X.GS`, `e.gs/f/programa.gs`, `x.gs` com `x.temp.js`
   preexistente, `a$(touch PWNED).gs`, crase, aspas, `-x.gs`, nome com ESC/ANSI no diagnóstico, saída igual à entrada
   por link físico, destino existente: o fonte fica idêntico (sha256) e nada preexistente muda — testes em U3-04, U3-06
   e U3-13.
4. **Programa que nunca termina**: laço síncrono infinito em `bota_pra_moer` (Ctrl+C mata, aviso GS0802 antes, sem
   handler de SIGINT que impeça a morte, temporário órfão varrido na execução seguinte); promessa pendente (GS0703);
   laço infinito no REPL interrompido sem matar a sessão — testes em U3-07 e U3-10.
5. **Aluno no REPL multilinha**: `faz_trem` em várias linhas, `}` seguido de `se_não` em linha nova (GS0205), cadeia
   `.mapear` na linha de continuação, `.5 mais 1` (número, não comando), erro no meio do bloco que descarta o buffer,
   Ctrl+C no meio do bloco e duplo Ctrl+C para sair, TAB com e sem acento, `pergunta` com a próxima linha como resposta
   — testes em U3-10 e U3-11.

---

## Como executar este plano

Valem as regras do plano 1 ("Como executar"). Diferenças desta fase:

- **Branch de integração:** `v3/integracao` (a mesma). Worktree por unidade: `git worktree add ../goiasscript-wt/<id> -b v3/<id> v3/integracao`.
- **Execução dos testes do pacote:** `corepack pnpm --filter goiasscript exec vitest run <arquivo>`. Os testes E2E do
  tarball (`tests/e2e/*.e2e.ts`) rodam por `corepack pnpm --filter goiasscript test:e2e` e **não** fazem parte do
  `verify` (são lentos); entram no job `tarball` de `promises-gate.yml` e no `release.yml`.
- **`verify`** continua o do plano 1; U3-01 o estende (projeto Vitest, knip, ESLint) e ele segue verde em toda unidade.
- **Gate humano (GATE 3):** relatório `docs/fase-3/relatorio-gate.md` (U3-15), aprovação do dono; só então push, PR de
  fase por rebase e as tarefas do dono de publicação (ver "Decisões do dono").

## Mapa de arquivos (estado ao fim do plano 2)

```
packages/cli/                    npm `goiasscript` (bins goiasscript e goias); devDependencies workspace; sem dependencies
  package.json  README.md  vitest.config.ts  vitest.e2e.config.ts
  src/
    io.types.ts  exit-codes.constants.ts  cli-file-error.ts  node-file-system.ts  version.ts  node-version.ts  run-cli.ts
    entry/{goiasscript.ts,goias.ts,real-io.ts,api.ts}               sem lógica; único lugar com `process`
    args/{args.types.ts,commands.data.ts,options.data.ts,resolve-command.ts,parse-args.ts}
    help/{help.ts,help.constants.ts}
    diagnostics/{render-diagnostic.ts,sanitize-terminal.ts,json-report.ts,tool-diagnostic.ts,diagnostic.types.ts}
    paths/{input-name.ts,output-plan.ts,windows-names.constants.ts,decode-source.ts,read-source.ts,paths.types.ts}
    commands/{command.types.ts,registry.ts,compile-source.ts,translate.ts,check.ts,run.ts,explain.ts,info.ts,scaffold.ts}
    run/{program-runner.ts,process-host.ts,process-host.types.ts,temp-workspace.ts,runtime-report.ts}
    scaffold/{project-name.ts,template.constants.ts,scaffold-project.ts,next-steps.ts}
    repl/{repl.types.ts,repl.constants.ts,engine.ts,host-context.ts,echo.ts,run-repl.ts,line-buffer.ts,repl-commands.ts,completer.ts}
  tests/
    support/{memory-io.ts,fake-process-host.ts,pseudo-terminal.ts,run-real-cli.ts}
    package-layout.test.ts  file-system.test.ts  memory-io.test.ts  args.test.ts  run-cli.test.ts  help.test.ts
    render-diagnostic.test.ts  json-report.test.ts  input-name.test.ts  output-plan.test.ts  decode-source.test.ts
    translate.test.ts  check.test.ts  run-lifecycle.test.ts  run-real.test.ts  temp-workspace.test.ts
    explain.test.ts  info.test.ts  scaffold.test.ts  repl-engine.test.ts  repl-loop.test.ts  completer.test.ts
    e2e/{support/tarball.ts,pack.e2e.ts,name-matrix.e2e.ts,pergunta-pipe.e2e.ts,pending-promise.e2e.ts,
         scaffold-steps.e2e.ts,english-scan.e2e.ts,api-types.e2e.ts,repl-pipe.e2e.ts}
packages/language/src/{format-message.ts,completions.ts}            (movido do compiler / novo); tools.data.ts (GS0903)
packages/compiler/src/helpers/message-source.ts                     (GS0703 em .mensagem)
scripts/{build-cli.ts,pack-cli.ts,release-target.ts}
.github/workflows/{release.yml (novo),ci.yml,promises-gate.yml}
tools/config-tests/tests/{eslint-matrix.test.mjs,release-workflow.test.mjs}
docs/fase-3/relatorio-gate.md
```

## Grafo de unidades

| id | Unidade | depende de | tier | spec |
|---|---|---|---|---|
| U3-01 | Pacote `goiasscript` (CLI), convivência do nome npm com o legado e E/S injetável | GATE 2 | medium | §5.1, §6.1, §8.1 |
| U3-02 | Argumentos, comandos goianos (com e sem acento), ajuda e GS0904/GS0905 | U3-01 | medium | §6.1 |
| U3-03 | Diagnósticos no terminal: renderização, sanitização, `--json` | U3-01 | medium | §4.11, §5.9, §6.1 |
| U3-04 | Entrada e saída seguras: nome `.gs`, destino derivado, identidade, UTF-8, stdin `-` | U3-01 | large | §6.1, §8.2 |
| U3-05 | Pendências do gate 2: GS0703 em `.mensagem`, marcadores de GS07xx, texto do GS0903 | GATE 2 | small | §4.9, §4.11, §5.10 |
| U3-06 | `traduz` e `vê_se_tá_certo` (`--json`, `--tom`, `--otimiza`, `--minifica`, `-`) | U3-02, U3-03, U3-04, U3-05 | large | §6.1 |
| U3-07 | `bota_pra_moer`: executor, tradução de erros, GS0702, GS0703, `pergunta` | U3-05, U3-06 | large | §6.1, §4.10, §5.10 |
| U3-08 | `explica` e `dedo_de_prosa` | U3-02, U3-03 | small | §6.1 |
| U3-09 | `arma_o_barraco`: template único, nome de projeto seguro, próximos passos | U3-02, U3-03, U3-04 | medium | §6.1 |
| U3-10 | Motor do REPL: contexto, sessão, eco, `pergunta`, interrupção | U3-01 | large | §5.7, §6.2 |
| U3-11 | Roda de Prosa interativa: multilinha, comandos, TAB, Ctrl+C, `goias` | U3-02, U3-03, U3-10 | large | §6.2 |
| U3-12 | Build, API exportada, tipos e tarball (`files`, README, LICENSE) | U3-07, U3-08, U3-09, U3-11 | medium | §5.1, §8.5.1 |
| U3-13 | E2E do tarball em pasta limpa: matriz de nomes, `pergunta` em pipe, GS0703, passos do template | U3-12 | large | §8.2, §8.5.1, §8.5.4 |
| U3-14 | `release.yml`: alpha em `next`, trusted publishing sem token, mesmo tarball | U3-12 | medium | §8.6, §10.3 |
| U3-15 | Revisão de segurança do CLI e relatório do gate da Fase 3 | U3-13, U3-14 | medium | §10.1 F3, §8.1 |
| **GATE 3** | Tarball instala e roda em pasta limpa; matriz de nomes verde; sem CRITICAL/HIGH; dono executa o primeiro publish | | | |

Camadas paralelas: {U3-01, U3-05} · {U3-02, U3-03, U3-04, U3-10} · {U3-06, U3-08, U3-09, U3-11} · {U3-07} ·
{U3-12} · {U3-13, U3-14} · {U3-15}. Arquivos sem sobreposição dentro de cada camada (ver "Files" de cada unidade;
`registry.ts` e os stubs de comando nascem em U3-02 e cada unidade seguinte só edita o próprio comando).

## Interfaces compartilhadas (contrato entre unidades)

```ts
// packages/cli/src/io.types.ts
export interface OutputSink { write(text: string): void; writeSync(text: string): void } // writeSync só no caminho de saída do processo
export interface InputSource { readAll(): Promise<Uint8Array>; readonly isTty: boolean }
export type PathKind = 'file' | 'directory' | 'other' | 'missing';
export interface CliFileSystem {
  readBytes(path: string): Promise<Uint8Array>;
  stat(path: string): Promise<PathKind>;                       // não segue link final: link para arquivo é 'file' se o alvo for arquivo
  identity(path: string): Promise<string | null>;              // `${dev}:${ino}` seguindo links; null se não existe
  writeText(path: string, content: string, mode: 'create-new' | 'replace'): Promise<void>; // create-new = flag wx
  makeDirectory(path: string): Promise<void>;                  // não recursivo; falha se existe
  makeTempDirectory(prefix: string): Promise<string>;          // mkdtemp em env.tmpDir
  listDirectory(path: string): Promise<readonly string[]>;
  modifiedAt(path: string): Promise<number>;
  remove(path: string): Promise<void>;                         // recursivo; só chamado dentro de diretório temporário próprio ou de projeto recém-criado
  removeSync(path: string): void;
}
export interface CliEnvironment {
  readonly cwd: string; readonly tmpDir: string; readonly platform: NodeJS.Platform; readonly nodeVersion: string;
  readonly path: import('node:path').PlatformPath;             // injetável para testar regras de win32 em Linux
  readonly variables: Readonly<Record<string, string | undefined>>;
}
export interface TerminalStreams { readonly input: NodeJS.ReadableStream; readonly output: NodeJS.WritableStream; readonly isTty: boolean }
export interface CliIo {
  readonly out: OutputSink; readonly err: OutputSink; readonly stdin: InputSource; readonly streams: TerminalStreams;
  readonly fs: CliFileSystem; readonly env: CliEnvironment;
}
// packages/cli/src/cli-file-error.ts — class CliFileError extends Error { readonly code: FileErrorCode }
export type FileErrorCode = 'EEXIST' | 'ENOENT' | 'EACCES' | 'EISDIR' | 'ENOTDIR' | 'OTHER';

// packages/cli/src/exit-codes.constants.ts
export const EXIT_CODE = { ok: 0, compilation: 1, runtime: 2, usage: 3 } as const;
export type ExitCode = (typeof EXIT_CODE)[keyof typeof EXIT_CODE];

// packages/cli/src/args/args.types.ts
export type CommandId = 'translate' | 'run' | 'check' | 'scaffold' | 'explain' | 'info';
export interface CommandOptions {
  readonly output?: string; readonly optimize: boolean; readonly minify: boolean;
  readonly overwrite: boolean; readonly json: boolean; readonly tone: Tone;
}
export interface ParsedCommand { readonly command: CommandId; readonly positionals: readonly string[]; readonly options: CommandOptions }
export type ParseResult = { readonly ok: true; readonly parsed: ParsedCommand } | { readonly ok: false; readonly detail: string };

// packages/cli/src/diagnostics/diagnostic.types.ts
// Diagnóstico de ferramenta (GS09xx) não tem posição: `range` ausente. Reaproveita Diagnostic do compilador quando há posição.
export interface ToolDiagnostic { readonly code: string; readonly severity: Severity; readonly message: string; readonly help?: string; readonly detail?: string }
export interface RenderRequest { readonly diagnostic: Diagnostic | ToolDiagnostic; readonly fileName: string; readonly source: string | null }
// render-diagnostic.ts
export function renderDiagnostic(request: RenderRequest): string;       // várias linhas, termina sem \n final
export function sanitizeForTerminal(text: string): string;
export function toolDiagnostic(code: string, tone: Tone, args?: Readonly<Record<string, string>>, detail?: string): ToolDiagnostic;
export function renderJsonReport(report: { readonly file: string; readonly diagnostics: readonly (Diagnostic | ToolDiagnostic)[] }): string; // uma linha + \n

// packages/cli/src/paths/paths.types.ts
export type SourceInput = { readonly kind: 'file'; readonly path: string; readonly displayName: string } | { readonly kind: 'stdin'; readonly displayName: string };
export type PathFailure = { readonly ok: false; readonly code: 'GS0902' | 'GS0903' | 'GS0905'; readonly detail: string; readonly args?: Readonly<Record<string, string>> };
export type InputNameResult = { readonly ok: true; readonly outputStem: string } | PathFailure;
export type OutputPlan = { readonly ok: true; readonly outputPath: string; readonly replacing: boolean } | PathFailure;

// packages/cli/src/commands/command.types.ts
export interface CliDependencies { readonly processHost: ProcessHost }
export interface CommandContext { readonly io: CliIo; readonly parsed: ParsedCommand; readonly dependencies: CliDependencies }
export type CommandHandler = (context: CommandContext) => Promise<ExitCode>;
// packages/cli/src/run-cli.ts
export function runCli(argv: readonly string[], io: CliIo, dependencies: CliDependencies): Promise<ExitCode>;

// packages/cli/src/run/process-host.types.ts
export interface ProcessHost {
  onExit(handler: () => void): void;                            // síncrono: roda dentro de process.on('exit')
  onUnhandledRejection(handler: (reason: unknown) => void): void;
  onUncaughtException(handler: (error: unknown) => void): void;
  importModule(fileUrl: string): Promise<unknown>;
  setExitCode(code: ExitCode): void;
  terminate(code: ExitCode): void;                              // descarrega a saída e encerra
}

// packages/cli/src/repl/repl.types.ts
export type ReplEvaluation =
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'failed'; readonly diagnostics: readonly Diagnostic[]; readonly source: string }
  | { readonly kind: 'done'; readonly diagnostics: readonly Diagnostic[]; readonly echo?: string }
  | { readonly kind: 'threw'; readonly diagnostic: Diagnostic; readonly source: string }
  | { readonly kind: 'interrupted' }
  | { readonly kind: 'cancelled' };
export interface ReplEngine {
  evaluate(source: string): Promise<ReplEvaluation>;
  hasPendingQuestion(): boolean;
  answer(line: string): void;
  cancelPendingQuestion(): void;
  endOfInput(): void;                                           // pergunta pendente falha com GS0702
  reset(): void;                                                // contexto novo e sessão vazia
  readonly session: ReplSession;
}
export interface ReplEngineOptions { readonly io: Pick<CliIo, 'out' | 'err'>; readonly tone: Tone; readonly entryTimeoutMs?: number }
```

(`Tone`, `Severity`, `Diagnostic` e `ReplSession` vêm de `@goiasscript/compiler`.)

---

## Fase 3

### U3-01: Pacote `goiasscript` (CLI), nome npm e E/S injetável
**Spec:** §5.1, §6.1 (Segurança), §8.1 (`no-console`) · **Tier:** medium · **Depende de:** GATE 2 · **Risco:** o nome npm `goiasscript` hoje é do legado em `packages/core` (1.5.0, bins `goiasscript` e `goias`); dois pacotes com o mesmo nome no workspace quebram o `pnpm install` e o playground, que importa `goiasscript/browser` do legado · **Rollback:** reverter o commit (o legado volta ao nome antigo; nenhum consumidor novo ainda)
**Decisão do nome:** o legado passa a se chamar `goiasscript-legacy` (`private: true`, sem `bin` nem `publishConfig`) até a Fase 8; o nome `goiasscript` pertence ao `packages/cli` a partir de `3.0.0-alpha.0`. As versões antigas já publicadas continuam no registro; o alpha só toca o dist-tag `next`.
**Files:**
- Create: `packages/cli/package.json`, `packages/cli/vitest.config.ts`, `packages/cli/src/{io.types.ts,exit-codes.constants.ts,cli-file-error.ts,node-file-system.ts,version.ts,run-cli.ts}`, `packages/cli/src/entry/{goiasscript.ts,goias.ts,real-io.ts}`, `packages/cli/src/repl/run-repl.ts` (esqueleto que devolve `EXIT_CODE.usage`; U3-11 o substitui), `packages/cli/tests/support/memory-io.ts`
- Modify: `packages/core/package.json` (nome, `private`, remove `bin`/`publishConfig`), `package.json` (filtros `legacy:*` → `goiasscript-legacy`), `apps/playground/{package.json,next.config.mjs,workers/runner.worker.ts,types/goiasscript.d.ts}` (dependência e importação `goiasscript-legacy/browser`), `pnpm-lock.yaml`, `tsconfig.base.json` (`resolveJsonModule`), `vitest.config.mts` (projeto `packages/cli`, limiar 80% em `packages/cli/src/**` exceto `src/entry/**`), `eslint.config.mjs`, `knip.json`, `.github/workflows/ci.yml` (`--project goiasscript` na matriz Windows/Ubuntu), `tools/config-tests/tests/eslint-matrix.test.mjs`
- Test: `packages/cli/tests/{package-layout,file-system,memory-io}.test.ts`

**Interfaces:** Consumes: nada. Produces: `CliIo`, `CliFileSystem`, `OutputSink`, `InputSource`, `CliEnvironment`, `EXIT_CODE`, `CliFileError`, `createNodeFileSystem()`, `createRealIo()`, `createMemoryIo(options)` (suporte de teste: `files`, `stdin`, `platform`, `caseSensitive`, `nodeVersion`, `cwd`, `failingWrites`; expõe `stdoutText()`, `stderrText()`, `fileText(path)`, `fileBytes(path)`, `paths()`).
**Aceite:** manifestos conforme o teste de layout; playground e `legacy:*` continuam funcionando com o nome novo; ESLint barra `process.stdout` fora de `src/entry/**`; `corepack pnpm verify` verde.

- [ ] **1.1 Teste (RED).** Criar `packages/cli/tests/package-layout.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readJson = (relative: string): Record<string, unknown> =>
  JSON.parse(readFileSync(new URL(relative, import.meta.url), 'utf8')) as Record<string, unknown>;

describe('manifestos', () => {
  it('o pacote publicável é o goiasscript novo, sem dependências de runtime', () => {
    const manifest = readJson('../package.json');
    expect(manifest.name).toBe('goiasscript');
    expect(manifest.version).toMatch(/^3\.0\.0-alpha\.\d+$/u);
    expect(Object.keys(manifest.bin as object).sort()).toEqual(['goias', 'goiasscript']);
    expect(manifest.dependencies).toBeUndefined();
    expect(manifest.files).toEqual(['dist', 'README.md', 'LICENSE']);
    expect((manifest.engines as { node: string }).node).toBe('>=22.12');
  });
  it('o legado deixa o nome e não publica mais nada', () => {
    const legacy = readJson('../../core/package.json');
    expect(legacy).toMatchObject({ name: 'goiasscript-legacy', private: true });
    expect([legacy.bin, legacy.publishConfig]).toEqual([undefined, undefined]);
  });
  it('o playground consome o legado pelo nome novo', () => {
    const playground = readJson('../../../apps/playground/package.json');
    expect(playground.dependencies).toMatchObject({ 'goiasscript-legacy': 'workspace:*' });
    expect(playground.dependencies).not.toHaveProperty('goiasscript');
  });
});
```
- [ ] **1.2 Teste (RED) do sistema de arquivos.** `packages/cli/tests/file-system.test.ts` (diretório real em `os.tmpdir()`):
```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CliFileError } from '../src/cli-file-error.ts';
import { createNodeFileSystem } from '../src/node-file-system.ts';

describe('createNodeFileSystem', () => {
  const nodeFs = createNodeFileSystem();
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-cli-test-'));
  it('create-new nunca sobrescreve e devolve EEXIST', async () => {
    const target = path.join(scratch, 'a.mjs');
    await nodeFs.writeText(target, 'um', 'create-new');
    await expect(nodeFs.writeText(target, 'dois', 'create-new')).rejects.toMatchObject({ code: 'EEXIST' });
    await expect(nodeFs.writeText(target, 'dois', 'create-new')).rejects.toBeInstanceOf(CliFileError);
    expect(fs.readFileSync(target, 'utf8')).toBe('um');
  });
  it('identity iguala link físico ao original e distingue arquivos diferentes', async () => {
    const original = path.join(scratch, 'x.gs');
    fs.writeFileSync(original, 'prosa(1)');
    fs.linkSync(original, path.join(scratch, 'x-link.mjs'));
    fs.writeFileSync(path.join(scratch, 'outro.mjs'), 'prosa(1)');
    const [first, linked, other] = await Promise.all(['x.gs', 'x-link.mjs', 'outro.mjs'].map((name) => nodeFs.identity(path.join(scratch, name))));
    expect(linked).toBe(first);
    expect(other).not.toBe(first);
    expect(await nodeFs.identity(path.join(scratch, 'nao-existe'))).toBeNull();
  });
  it('makeTempDirectory cria diretório novo e remove apaga a árvore', async () => {
    const dir = await nodeFs.makeTempDirectory(path.join(scratch, 'goiasscript-'));
    expect(await nodeFs.stat(dir)).toBe('directory');
    await nodeFs.remove(dir);
    expect(await nodeFs.stat(dir)).toBe('missing');
  });
});
```
- [ ] **1.3 Teste (RED) do `MemoryIo`.** `tests/memory-io.test.ts`: com `caseSensitive: false`, `identity('x.gs')` é igual a `identity('X.GS')`; com `true`, são diferentes; `writeText(..., 'create-new')` em arquivo existente lança `CliFileError` com `code: 'EEXIST'`; `failingWrites: ['p/README.md']` faz esse destino lançar `code: 'OTHER'`; `out.write('a')` aparece em `stdoutText()` e `err.write('b')` só em `stderrText()`.
- [ ] **1.4 Teste de configuração (RED).** Em `tools/config-tests/tests/eslint-matrix.test.mjs`, acrescentar à matriz de violações: `['sem process fora de entry', 'packages/cli/src/virtual.ts', 'export const sink = process.stdout;\n', 'no-restricted-globals']` e à de aceitos `['process em entry', 'packages/cli/src/entry/virtual.ts', 'export const sink = process.stdout;\n', 'no-restricted-globals']`.
- [ ] **1.5 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/package-layout.test.ts` (a pasta ainda não existe; criar `package.json` mínimo primeiro) — esperado: falha em `expect(manifest.name).toBe('goiasscript')` e nos nomes do legado.
- [ ] **1.6 Implementar.** `packages/cli/package.json`: `type: module`, `bin` apontando para `./dist/goiasscript.mjs` e `./dist/goias.mjs`, `exports` (U3-12 completa), `engines.node: ">=22.12"`, `files`, `publishConfig.access: public`, `devDependencies` com `workspace:*` para `language`, `compiler`, `optimizer` e `esbuild` 0.28.2 exato. Renomear o legado e ajustar playground, `legacy:*` e lockfile (`corepack pnpm install`). `CliIo` e adaptadores conforme "Interfaces". `node-file-system.ts` mapeia `NodeJS.ErrnoException.code` para `FileErrorCode`; `create-new` usa `flag: 'wx'`; `identity` usa `fs.stat` (segue links) e `${dev}:${ino}` como `bigint`. `real-io.ts` liga `process.stdout/stderr` (`writeSync` por `fs.writeSync` com número limitado de tentativas em `EAGAIN`) e lê o stdin inteiro como bytes. ESLint: `no-restricted-globals` para `process` em `packages/cli/src/**` com override de `files` em `src/entry/**` (que também ganha `functional/immutable-data` com `ignoreAccessorPattern: 'process.**'` para `process.exitCode`).
- [ ] **1.7 Rodar:** `corepack pnpm --filter goiasscript exec vitest run` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.8 Commit:** `feat(cli): cria o pacote goiasscript com e/s injetável e renomeia o legado`.

---

### U3-02: Argumentos, comandos goianos e ajuda
**Spec:** §6.1 (tabela de comandos, variantes sem acento, sem apelidos em inglês, GS0904, GS0905) · **Tier:** medium · **Depende de:** U3-01 · **Risco:** `parseArgs` do Node aceita abreviações e formas que o spec não promete; comando com acento digitado decomposto (NFD no macOS) não casaria · **Rollback:** reverter o commit (só despacho e ajuda)
**Files:**
- Create: `packages/cli/src/args/{args.types.ts,commands.data.ts,options.data.ts,resolve-command.ts,parse-args.ts}`, `src/help/{help.ts,help.constants.ts}`, `src/node-version.ts`, `src/commands/{command.types.ts,registry.ts}` e um stub por comando (`translate.ts`, `check.ts`, `run.ts`, `explain.ts`, `info.ts`, `scaffold.ts`, cada um devolvendo `EXIT_CODE.usage`; as unidades seguintes os substituem)
- Modify: `packages/cli/src/run-cli.ts`
- Test: `packages/cli/tests/{args,run-cli,help}.test.ts`

**Interfaces:** Consumes: `CliIo`, `EXIT_CODE`, `toolDiagnostic` (usa a assinatura de U3-03; até lá, `run-cli.ts` imprime pelo `ToolDiagnostic` montado localmente com `lookupDiagnostic`). Produces: `resolveCommandName`, `suggestCommandName`, `parseCommandLine`, `renderHelp(tone)`, `isSupportedNode(version)`, `COMMANDS`.
**Aceite:** os seis comandos resolvem em acentuado, sem acento e decomposto; nenhum apelido em inglês; `--help`/`-h`/`--version` são GS0905 com dica em goianês; ajuda sem palavra inglesa.

- [ ] **1.1 Teste (RED).** `tests/args.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseCommandLine } from '../src/args/parse-args.ts';
import { resolveCommandName, suggestCommandName } from '../src/args/resolve-command.ts';

describe('resolveCommandName', () => {
  it.each([
    ['traduz', 'translate'], ['bota_pra_moer', 'run'], ['vê_se_tá_certo', 'check'], ['ve_se_ta_certo', 'check'],
    ['ve\u0301_se_ta\u0301_certo', 'check'], ['arma_o_barraco', 'scaffold'], ['explica', 'explain'], ['dedo_de_prosa', 'info'],
  ])('%s resolve para %s', (typed, expected) => {
    expect(resolveCommandName(typed)).toBe(expected);
  });
  it('não aceita apelidos em inglês', () => {
    for (const english of ['translate', 'run', 'check', 'compile', 'help', 'version', 'init', 'explain']) {
      expect(resolveCommandName(english)).toBeNull();
    }
  });
  it('sugere o comando mais próximo até distância 2', () => {
    expect(suggestCommandName('bota_pra_moe')).toBe('bota_pra_moer');
    expect(suggestCommandName('traduza')).toBe('traduz');
    expect(suggestCommandName('zzzzzzzz')).toBeNull();
  });
});

describe('parseCommandLine', () => {
  it('lê opções do traduz', () => {
    const result = parseCommandLine(['traduz', 'x.gs', '-s', 'saida.mjs', '--minifica', '--tom', 'neutro']);
    expect(result).toMatchObject({ ok: true, parsed: { command: 'translate', positionals: ['x.gs'], options: { output: 'saida.mjs', minify: true, optimize: false, tone: 'neutro' } } });
  });
  it('aceita nome começando com hífen depois de --', () => {
    expect(parseCommandLine(['traduz', '--', '-x.gs'])).toMatchObject({ ok: true, parsed: { positionals: ['-x.gs'] } });
  });
  it.each([
    [['traduz', 'x.gs', '--help'], '--help'], [['traduz'], 'arquivo'], [['traduz', 'a.gs', 'b.gs'], 'arquivo'],
    [['traduz', 'x.gs', '--otimiza', '--minifica'], '--otimiza'], [['traduz', 'x.gs', '--tom', 'gritado'], 'gritado'],
    [['bota_pra_moer', 'x.gs', '--json'], '--json'], [['bota_pra_moer', '-'], '-'], [['--tom', 'neutro', 'traduz', 'x.gs'], '--tom'],
  ])('recusa %j', (argv, mention) => {
    const result = parseCommandLine(argv);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail).toContain(mention);
  });
});
```
- [ ] **1.2 Teste (RED).** `tests/run-cli.test.ts` com `createMemoryIo` e `ProcessHost` falso (`tests/support/fake-process-host.ts`, criado aqui com a interface completa para as unidades seguintes):
```ts
import { describe, expect, it } from 'vitest';
import { runCli } from '../src/run-cli.ts';
import { createFakeProcessHost } from './support/fake-process-host.ts';
import { createMemoryIo } from './support/memory-io.ts';

const run = async (argv: readonly string[], options = {}) => {
  const io = createMemoryIo(options);
  const code = await runCli(argv, io, { processHost: createFakeProcessHost() });
  return { io, code };
};

describe('runCli', () => {
  it('sem argumentos mostra a ajuda e sai com 0', async () => {
    const { io, code } = await run([]);
    expect(code).toBe(0);
    expect(io.stdoutText()).toContain('dedo_de_prosa');
  });
  it('comando desconhecido é GS0905 com sugestão e exit 3', async () => {
    const { io, code } = await run(['traduza', 'x.gs']);
    expect(code).toBe(3);
    expect(io.stderrText()).toContain('GS0905');
    expect(io.stderrText()).toContain('Cê quis dizer "traduz"?');
    expect(io.stdoutText()).toBe('');
  });
  it('avisa GS0904 em Node abaixo do mínimo e segue', async () => {
    const { io } = await run([], { nodeVersion: '20.11.0' });
    expect(io.stderrText()).toContain('GS0904');
    expect(io.stderrText()).toContain('22.12');
    expect((await run([], { nodeVersion: '22.12.0' })).io.stderrText()).not.toContain('GS0904');
    expect((await run([], { nodeVersion: '22.11.9' })).io.stderrText()).toContain('GS0904');
    expect((await run([], { nodeVersion: '24.0.0' })).io.stderrText()).not.toContain('GS0904');
  });
});
```
- [ ] **1.3 Teste (RED).** `tests/help.test.ts`: a ajuda lista os seis comandos pelos nomes goianos e as opções `-s`, `--otimiza`, `--minifica`, `--sobrescreve`, `--json`, `--tom`; não casa `/\b(usage|options?|commands?|file|version|help|error)\b/iu`; a versão sem acento aparece como dica (`ve_se_ta_certo`).
- [ ] **1.4 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/args.test.ts tests/run-cli.test.ts tests/help.test.ts` — esperado: falha por import inexistente de `../src/args/resolve-command.ts`.
- [ ] **1.5 Implementar.** `commands.data.ts`: tabela `COMMANDS` (`id`, `name` NFC, `asciiName?`, `summary`, `usage`, `options`, `positionals {min,max}`) em `as const`; `resolve-command.ts` normaliza `NFC` e compara com `name` e `asciiName`; `suggestCommandName` por distância de edição ≤ 2 sobre os nomes e variantes. `parse-args.ts` usa `util.parseArgs` com `strict: true` e `allowPositionals`, opções por comando, `--` como terminador, `-` como posicional; `--otimiza` e `--minifica` mutuamente exclusivos; `--tom` só `raiz|neutro`; qualquer `TypeError` de `parseArgs` vira `{ ok: false, detail }` em goianês. `bota_pra_moer -` e `--json` fora de `traduz`/`vê_se_tá_certo` recusados. `run-cli.ts`: avisa GS0904 (comparação numérica de `major.minor` contra a constante `MINIMUM_NODE`), resolve, executa o handler do `registry`, e traduz `{ ok: false }` em `toolDiagnostic('GS0905', tone, {}, detail)` + sugestão, exit 3.
- [ ] **1.6 Rodar:** os mesmos testes — esperado: passam. `corepack pnpm verify` verde.
- [ ] **1.7 Commit:** `feat(cli): adiciona comandos goianos, opções e ajuda do goiasscript`.

---

### U3-03: Diagnósticos no terminal
**Spec:** §4.11, §5.9 (`Diagnostic`), §6.1 (`--json`, `--tom`) · **Tier:** medium · **Depende de:** U3-01 · **Risco:** coluna do diagnóstico é UTF-16 e o caractere pode ser grafema composto (NFD) ou o arquivo ter BOM/`\r\n`: o sublinhado sai fora do lugar; texto do aluno ou nome de arquivo com sequência ANSI/OSC controla o terminal; linha de 100 mil caracteres trava a renderização · **Rollback:** reverter o commit
**Files:**
- Create: `packages/cli/src/diagnostics/{render-diagnostic.ts,sanitize-terminal.ts,json-report.ts,tool-diagnostic.ts,diagnostic.types.ts}`
- Move: `packages/compiler/src/diagnostics/format-message.ts` → `packages/language/src/format-message.ts` (o contrato de marcadores `{nome}` e `[[ … ]]` é do catálogo); atualizar todos os imports e o teste correspondente (incluindo os do U3-05)
- Modify: `packages/language/src/index.ts` (exporta `formatMessage`), `packages/compiler/src/diagnostics/report.ts` e demais importadores
- Test: `packages/cli/tests/{render-diagnostic,json-report}.test.ts`, `packages/language/tests/format-message.test.ts` (movido)

**Interfaces:** Consumes: `Diagnostic`, `lookupDiagnostic`, `formatMessage`. Produces: `renderDiagnostic`, `sanitizeForTerminal`, `toolDiagnostic`, `renderJsonReport` (ver "Interfaces compartilhadas").
**Aceite:** sublinhado alinhado com NFD, BOM e `\r\n`; nenhum caractere de controle sai cru; linha enorme é recortada em janela de 120 colunas; JSON em uma linha com `version: 1`.

- [ ] **1.1 Teste (RED).** `tests/render-diagnostic.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Diagnostic } from '@goiasscript/compiler';
import { renderDiagnostic, sanitizeForTerminal } from '../src/diagnostics/render-diagnostic.ts';

const at = (line: number, column: number, length: number, offset = 0): Diagnostic['range'] => ({
  start: { offset, line, column },
  end: { offset: offset + length, line, column: column + length },
});
const diagnostic = (range: Diagnostic['range']): Diagnostic => ({ code: 'GS0301', severity: 'error', range, message: 'Esse trem "nomi" não existe por aqui.' });

describe('renderDiagnostic', () => {
  it('mostra cabeçalho, linha e sublinhado', () => {
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 10, 4, 9)), fileName: 'programa.gs', source: 'uai x é nomi\n' });
    expect(text.split('\n')).toEqual([
      'programa.gs:1:10: erro GS0301: Esse trem "nomi" não existe por aqui.',
      '1 | uai x é nomi',
      `  | ${' '.repeat(9)}^^^^`,
    ]);
  });
  it('alinha o sublinhado quando o nome está em NFD', () => {
    const source = 'uai cafe\u0301 é nomi';
    const column = source.indexOf('nomi') + 1;
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(1, column, 4, column - 1)), fileName: 'a.gs', source }).split('\n');
    expect(lines[2]).toBe(`  | ${' '.repeat(11)}^^^^`);
  });
  it('lê a linha certa com BOM e CRLF, sem \\r na tela', () => {
    const source = '\uFEFFuai x é 1\r\nuai y é nomi\r\n';
    const offset = source.indexOf('nomi');
    const lines = renderDiagnostic({ diagnostic: diagnostic(at(2, 10, 4, offset)), fileName: 'a.gs', source }).split('\n');
    expect(lines[1]).toBe('2 | uai y é nomi');
    expect(lines.join('')).not.toMatch(/[\r\uFEFF]/u);
  });
  it('diagnóstico de ferramenta não tem linha de código', () => {
    const text = renderDiagnostic({ diagnostic: { code: 'GS0905', severity: 'error', message: 'Ô sô, esse comando não existe.', detail: '"traduza" não é comando.' }, fileName: 'x.gs', source: null });
    expect(text.split('\n')).toEqual(['erro GS0905: Ô sô, esse comando não existe.', '  "traduza" não é comando.']);
  });
  it('recorta linha gigante em janela e não demora', () => {
    const source = `${'a'.repeat(5000)}nomi${'b'.repeat(5000)}`;
    const started = performance.now();
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 5001, 4, 5000)), fileName: 'a.gs', source });
    expect(performance.now() - started).toBeLessThan(200);
    expect(Math.max(...text.split('\n').map((row) => row.length))).toBeLessThanOrEqual(140);
    expect(text).toContain('^^^^');
  });
});

describe('sanitizeForTerminal', () => {
  it('troca controles e invisíveis por escape visível', () => {
    expect(sanitizeForTerminal('a\u001b[31mb')).toBe('a\\u001b[31mb');
    expect(sanitizeForTerminal('a\u2028b\u202eb\u009bc')).toBe('a\\u2028b\\u202eb\\u009bc');
    expect(sanitizeForTerminal('nome.gs\n')).toBe('nome.gs\\u000a');
  });
  it('mantém acento, emoji e tab', () => {
    expect(sanitizeForTerminal('café 😀\t')).toBe('café 😀\t');
  });
  it('o nome de arquivo hostil sai sanitizado no cabeçalho', () => {
    const text = renderDiagnostic({ diagnostic: diagnostic(at(1, 1, 1)), fileName: 'a\u001b]0;pwn\u0007.gs', source: 'x' });
    expect(text).not.toContain('\u001b');
  });
});
```
- [ ] **1.2 Teste (RED).** `tests/json-report.test.ts`: `renderJsonReport({ file: 'a.gs', diagnostics: [d] })` termina em um único `\n`, tem uma só linha e `JSON.parse` devolve `{ version: 1, file: 'a.gs', ok: false, diagnostics: [d] }`; `ok` é `true` quando só há `warning`; nome com `\u001b` sai escapado pelo JSON (`"\\u001b"`).
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/render-diagnostic.test.ts tests/json-report.test.ts` — esperado: falha por import inexistente.
- [ ] **1.4 Implementar.** Cabeçalho `arquivo:linha:coluna: erro|aviso CÓDIGO: mensagem`; `help` em linha `  ajuda: …` e `lesson` em `  lição: …`; goteira com a largura do maior número de linha; coluna → índice de grafema por `Intl.Segmenter` sobre o prefixo da linha (BOM removido e quebra `\r\n|\r|\n|U+2028|U+2029` dividida antes de sanitizar); intervalo multilinha sublinha até o fim da primeira linha; largura zero vira um `^`; janela de 120 colunas ao redor do trecho com `…` nas pontas; tabs viram um espaço para o alinhamento. `sanitizeForTerminal` substitui `\p{Cc}` (exceto tab), `\p{Cf}`, U+2028/2029 e C1 por `\uXXXX` minúsculo de 4 dígitos. `toolDiagnostic` usa `lookupDiagnostic` + `formatMessage` com o tom. Mover `formatMessage` e corrigir importadores.
- [ ] **1.5 Rodar:** os testes acima, `corepack pnpm --filter @goiasscript/compiler exec vitest run` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.6 Commit:** `feat(cli): renderiza diagnósticos no terminal com sublinhado e saída json`.

---

### U3-04: Entrada e saída seguras
**Spec:** §6.1 (Segurança), §8.2 (regressão dos CRITICAL do CLI) · **Tier:** large · **Depende de:** U3-01 · **Risco:** o CLI legado derivava a saída trocando `.gs` em qualquer parte do caminho e sobrescrevia o fonte; no Windows `CON.gs`, `x.gs.` e `a:b.gs` têm semântica própria; arquivo ANSI ou UTF-16 vira texto corrompido sem aviso · **Rollback:** reverter o commit (só funções puras e leitura)
**Files:**
- Create: `packages/cli/src/paths/{paths.types.ts,input-name.ts,output-plan.ts,windows-names.constants.ts,decode-source.ts,read-source.ts}`
- Test: `packages/cli/tests/{input-name,output-plan,decode-source}.test.ts`

**Interfaces:** Consumes: `CliIo`, `CliFileSystem`. Produces: `validateInputName(inputPath, pathApi, platform)`, `planOutput({ inputPath, outputOption, overwrite, override }, io)`, `decodeSource(bytes)`, `readSource(inputArg, io)`, `isReservedWindowsName(name)` (reutilizado por U3-09), `STDIN_DISPLAY_NAME = '<entrada>'`.
**Aceite:** tabela de nomes abaixo inteira; saída derivada troca só a extensão final preservando os code units do nome; GS0903 para saída = entrada (por identidade), destino existente sem `--sobrescreve`, pasta e destino terminando em `.gs`; arquivo não UTF-8 vira `GS0905` com orientação.

- [ ] **1.1 Teste (RED).** `tests/input-name.test.ts`:
```ts
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateInputName } from '../src/paths/input-name.ts';

const ok = (output: string) => ({ ok: true, outputStem: output });
describe('validateInputName (posix)', () => {
  it.each([
    ['x.gs', ok('x')], ['X.GS', ok('X')], ['a.b.gs', ok('a.b')], ['e.gs/f/programa.gs', ok('programa')],
    ['nome com espaço.gs', ok('nome com espaço')], ['-x.gs', ok('-x')], ['a$(touch PWNED).gs', ok('a$(touch PWNED)')],
    ['`touch PWNED`.gs', ok('`touch PWNED`')], ['a";touch PWNED;".gs', ok('a";touch PWNED;"')],
    ['cafe\u0301.gs', ok('cafe\u0301')],
  ])('aceita %s', (input, expected) => {
    expect(validateInputName(input, path.posix, 'linux')).toEqual(expected);
  });
  it.each(['x.txt', 'x', 'x.gs.txt', '.gs', 'x.gs ', 'x.gs.', 'x.gs/'])('recusa %s com GS0902', (input) => {
    expect(validateInputName(input, path.posix, 'linux')).toMatchObject({ ok: false, code: 'GS0902' });
  });
});

describe('validateInputName (win32)', () => {
  it.each([['C:\\Users\\Aluno\\Meu Programa.GS', 'Meu Programa'], ['..\\x.gs', 'x'], ['\\\\srv\\pasta\\x.gs', 'x']])('aceita %s', (input, stem) => {
    expect(validateInputName(input, path.win32, 'win32')).toEqual(ok(stem));
  });
  it.each(['CON.gs', 'nul.GS', 'Aux.gs', 'COM1.gs', 'lpt9.gs', 'con.txt.gs', 'C:\\x\\PRN.gs'])('recusa nome reservado %s com GS0905', (input) => {
    expect(validateInputName(input, path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0905' });
  });
  it('recusa fluxo alternativo e aceita console.gs', () => {
    expect(validateInputName('a:b.gs', path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0905' });
    expect(validateInputName('x.gs:evil', path.win32, 'win32')).toMatchObject({ ok: false, code: 'GS0902' });
    expect(validateInputName('console.gs', path.win32, 'win32')).toEqual(ok('console'));
  });
});
```
- [ ] **1.2 Teste (RED).** `tests/output-plan.test.ts` com `createMemoryIo({ files, caseSensitive })`:
```ts
import { describe, expect, it } from 'vitest';
import { planOutput } from '../src/paths/output-plan.ts';
import { createMemoryIo } from './support/memory-io.ts';

const plan = (io: ReturnType<typeof createMemoryIo>, extra: object = {}) =>
  planOutput({ inputPath: 'x.gs', outputStem: 'x', overwrite: false, override: '--sobrescreve', ...extra }, io);

describe('planOutput', () => {
  it('deriva x.mjs ao lado do fonte', async () => {
    expect(await plan(createMemoryIo({ files: { 'x.gs': 'prosa(1)' } }))).toEqual({ ok: true, outputPath: 'x.mjs', replacing: false });
  });
  it('mantém o diretório e não mexe em x.temp.js preexistente', async () => {
    const io = createMemoryIo({ files: { 'pasta/x.gs': 'a', 'pasta/x.temp.js': 'velho' } });
    expect(await plan(io, { inputPath: 'pasta/x.gs' })).toMatchObject({ ok: true, outputPath: 'pasta/x.mjs' });
    expect(io.fileText('pasta/x.temp.js')).toBe('velho');
  });
  it('recusa destino existente sem --sobrescreve e aceita com ele', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'x.mjs': 'velho' } });
    expect(await plan(io)).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'já existe', override: '--sobrescreve' } });
    expect(await plan(io, { overwrite: true })).toEqual({ ok: true, outputPath: 'x.mjs', replacing: true });
  });
  it('recusa saída igual à entrada, inclusive em sistema sem diferença de caixa', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' }, caseSensitive: false });
    expect(await plan(io, { outputOption: 'x.gs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
    expect(await plan(io, { outputOption: 'X.GS', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
  });
  it('recusa saída que é o mesmo arquivo por link físico', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' }, hardLinks: [['x.gs', 'copia.mjs']] });
    expect(await plan(io, { outputOption: 'copia.mjs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903', args: { reason: 'é o mesmo arquivo da entrada' } });
  });
  it('recusa pasta como destino e destino que termina em .gs, mesmo com --sobrescreve', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a', 'saida/dentro.txt': 'b', 'outro.gs': 'c' } });
    expect(await plan(io, { outputOption: 'saida', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
    expect(await plan(io, { outputOption: 'outro.gs', overwrite: true })).toMatchObject({ ok: false, code: 'GS0903' });
  });
  it('pasta de saída inexistente é GS0905, sem criar nada', async () => {
    const io = createMemoryIo({ files: { 'x.gs': 'a' } });
    expect(await plan(io, { outputOption: 'nao/existe/x.mjs' })).toMatchObject({ ok: false, code: 'GS0905' });
    expect(io.paths()).toEqual(['x.gs']);
  });
});
```
- [ ] **1.3 Teste (RED).** `tests/decode-source.test.ts`: `decodeSource(new TextEncoder().encode('é'))` → `{ ok: true, text: 'é' }`; com BOM `EF BB BF` o texto começa em `\uFEFF` (o compilador trata o BOM); bytes Latin-1 `[0x63, 0xE9]` → `{ ok: false }` com detalhe contendo `UTF-8`; UTF-16 LE com BOM `FF FE` → `{ ok: false }` com detalhe contendo `UTF-8`. `readSource('-', io)` devolve `{ kind: 'stdin', displayName: '<entrada>' }` e os bytes do `stdin`; `readSource('nao-existe.gs', io)` → `GS0905` com detalhe "não achei".
- [ ] **1.4 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/input-name.test.ts tests/output-plan.test.ts tests/decode-source.test.ts` — esperado: falha por import inexistente de `../src/paths/input-name.ts`.
- [ ] **1.5 Implementar.** `validateInputName`: extensão final comparada com `.gs` minúsculo (`toLowerCase`) sobre o **último segmento** do caminho, sem `normalize` e sem cortar espaço/ponto final; stem vazio recusa; em `win32`, nome reservado é o trecho antes do **primeiro** ponto (lista em `windows-names.constants.ts`), `:` no nome fora do prefixo de unidade recusa, `\\` e `/` separam. `planOutput`: saída padrão `dirname + stem + '.mjs'` (só a extensão final muda); `outputOption` passa pelas mesmas recusas (termina em `.gs`, é pasta, pasta pai ausente) e por identidade (`fs.identity` de entrada e saída, ambos existentes) além da comparação textual; mensagens `reason` em goianês: `"é o mesmo arquivo da entrada"`, `"já existe"`, `"é uma pasta"`, `"termina em .gs"`. `decodeSource`: `TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`; bytes `FF FE`/`FE FF` ou falha de decodificação → orientação "salva o arquivo de novo como UTF-8". `readSource` lê arquivo (`stat` deve ser `file`; senão GS0905) ou `-`.
- [ ] **1.6 Rodar:** os mesmos testes — esperado: passam. `corepack pnpm verify` verde.
- [ ] **1.7 Commit:** `feat(cli): valida nome do fonte e planeja a saída sem tocar no fonte`.

---

### U3-05: Pendências do gate 2
**Spec:** §4.9 (`.mensagem`), §4.11, §5.10 · **Tier:** small · **Depende de:** GATE 2 · **Risco:** `$gs_mensagem` cai no `error.message` do motor (inglês) quando o erro traz `gsCode: 'GS0703'`; um marcador sem valor (`{line}`, `«line»`, `undefined`) aparece em mensagem de GS07xx; o texto do GS0903 não cobre as recusas novas do CLI · **Rollback:** reverter o commit (texto de catálogo e ajudante)
**Files:**
- Modify: `packages/compiler/src/helpers/message-source.ts`, `packages/language/src/diagnostics/tools.data.ts` (GS0903 com `{reason}` e segmento opcional `[[ … {override} … ]]`), `packages/language/generated/**` (regenerar), `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` §4.11 só se o dono aprovar a nova descrição do GS0903 (ver "Decisões do dono")
- Test: `packages/compiler/tests/unit/helpers/message-source.test.ts`, `packages/language/tests/diagnostics-markers.test.ts`

**Interfaces:** Consumes: `DIAGNOSTICS`, `formatMessage`. Produces: `$gs_mensagem` cobrindo GS0701, GS0702 e GS0703; GS0903 com marcadores `{reason}` (obrigatório) e `{override}` (opcional).
**Aceite:** `.mensagem` de erro com `gsCode` GS0701/GS0702/GS0703 devolve a frase raiz do catálogo; nenhuma frase GS07xx ou GS09xx, formatada com os argumentos que o produtor fornece, contém `«`, `{` ou `undefined`; `verify` verde (geradores com diff vazio).

- [ ] **1.1 Teste (RED).** `message-source.test.ts`:
```ts
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '@goiasscript/language';
import { buildMessageSource, phrasesFromCatalog } from '../../../src/helpers/message-source.ts';

const message = vm.runInNewContext(`${buildMessageSource(phrasesFromCatalog())}\n$gs_mensagem`) as (error: unknown) => string;
const raiz = (code: string): string => lookupDiagnostic(code)?.messages.raiz ?? '';

describe('$gs_mensagem', () => {
  it('traduz GS0703 e GS0702 para a frase do catálogo, sem undefined', () => {
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0703' }))).toBe(raiz('GS0703'));
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0702' }))).toBe(raiz('GS0702'));
  });
  it('preenche a linha do GS0701', () => {
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0701', gsLine: 3 }))).toContain('linha 3');
  });
});
```
- [ ] **1.2 Teste (RED).** `packages/language/tests/diagnostics-markers.test.ts`: para todo código `GS07xx`, formatar `messages.raiz` e `messages.neutro` com `{ file: 'a.gs', line: '3' }` e exigir ausência de `«`, `{` e `undefined`; para `GS0903`, com `{ reason: 'já existe', override: '--sobrescreve' }` a frase contém `já existe` e `--sobrescreve`, e só com `{ reason: 'já existe' }` não contém `sobrescreve` nem `[[`; para `GS0904`, com `{ minimum: '22.12' }` contém `22.12`.
- [ ] **1.3 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/helpers/message-source.test.ts` e `corepack pnpm --filter @goiasscript/language exec vitest run tests/diagnostics-markers.test.ts` — esperado: falha em `toBe(raiz('GS0703'))` (devolve `'x'`) e em `GS0903` sem `{reason}`.
- [ ] **1.4 Implementar.** `MARKER_CODES` passa a incluir `GS0703`; o ajudante só substitui `{line}` quando `gsLine` é número; GS0903: `Ô sô, essa saída não rola: {reason}.[[ Usa "{override}" se quiser trocar.]]` (raiz) e `Saída recusada: {reason}.[[ Use "{override}" para substituir.]]` (neutro); rodar `corepack pnpm --filter @goiasscript/language generate`.
- [ ] **1.5 Rodar:** os testes acima e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.6 Commit:** `fix(compiler): traduz GS0703 em .mensagem e amplia a frase do GS0903`.

---

### U3-06: `traduz` e `vê_se_tá_certo`
**Spec:** §6.1 (comandos, `--json`, `--tom`, stdin `-`, exit codes), §5.8 · **Tier:** large · **Depende de:** U3-02, U3-03, U3-04, U3-05 · **Risco:** perder diagnósticos (só o primeiro erro), gravar saída parcial ou sobrescrever, exit code errado, `--json` misturado com texto · **Rollback:** reverter o commit
**Files:**
- Create: `packages/cli/src/commands/compile-source.ts` (lê, compila e renderiza; reaproveitado por U3-07)
- Modify: `packages/cli/src/commands/{translate.ts,check.ts}`
- Test: `packages/cli/tests/{translate,check}.test.ts`

**Interfaces:** Consumes: `readSource`, `validateInputName`, `planOutput`, `renderDiagnostic`, `renderJsonReport`, `toolDiagnostic`, `compile`, `optimize` (import dinâmico de `@goiasscript/optimizer`). Produces: `compileSource(request, io): Promise<CompiledSource>` (`{ kind: 'ok'; result: CompileSuccess; source: string; displayName } | { kind: 'failed'; exit: ExitCode }`).
**Aceite:** erro de compilação → exit 1, nada gravado; só aviso → exit 0; `--json` tem stdout só com o JSON; `-` lê o programa do stdin; falha do Terser grava a saída didática com nota em goianês.

- [ ] **1.1 Teste (RED).** `tests/translate.test.ts` (`runCli` com `createMemoryIo` e `createFakeProcessHost`):
```ts
const habit = 'const a = 1\nconsole.log(a)\n';
it('grava x.mjs, avisa no stdout e sai com 0', async () => {
  const io = createMemoryIo({ files: { 'ola.gs': 'prosa("oi")\n' } });
  expect(await runCli(['traduz', 'ola.gs'], io, deps)).toBe(0);
  expect(io.fileText('ola.mjs')).toContain('console.log("oi")');
  expect(io.stdoutText()).toContain('ola.mjs');
});
it('erro de compilação: exit 1, nada gravado, posição certa com BOM e CRLF', async () => {
  const io = createMemoryIo({ files: { 'ola.gs': '\uFEFFuai a é 1\r\nprosa(nomi)\r\n' } });
  expect(await runCli(['traduz', 'ola.gs'], io, deps)).toBe(1);
  expect(io.stderrText()).toContain('ola.gs:2:7');
  expect(io.stderrText()).toContain('GS0301');
  expect(io.paths()).toEqual(['ola.gs']);
});
it('hábito de JavaScript mostra vários diagnósticos de uma vez', async () => {
  const io = createMemoryIo({ files: { 'js.gs': habit } });
  await runCli(['traduz', 'js.gs'], io, deps);
  expect(io.stderrText()).toMatch(/GS0401/u);
  expect(io.stderrText()).toMatch(/GS0403/u);
  expect(io.stderrText()).toMatch(/GS0404/u);
});
it('--json imprime só o relatório e sai com 1', async () => {
  const io = createMemoryIo({ files: { 'ola.gs': 'prosa(nomi)\n' } });
  expect(await runCli(['traduz', 'ola.gs', '--json'], io, deps)).toBe(1);
  expect(io.stderrText()).toBe('');
  expect(JSON.parse(io.stdoutText())).toMatchObject({ version: 1, file: 'ola.gs', ok: false });
});
it('lê o programa do stdin e escreve o JS no stdout', async () => {
  const io = createMemoryIo({ stdin: 'prosa("oi")\n' });
  expect(await runCli(['traduz', '-'], io, deps)).toBe(0);
  expect(io.stdoutText()).toContain('console.log("oi")');
  expect(io.paths()).toEqual([]);
});
it('--otimiza inlina constantes; destino existente exige --sobrescreve', async () => {
  const io = createMemoryIo({ files: { 'a.gs': 'uai a é 1\nprosa(a mais 2)\n', 'a.mjs': 'velho' } });
  expect(await runCli(['traduz', 'a.gs', '--otimiza'], io, deps)).toBe(3);
  expect(io.fileText('a.mjs')).toBe('velho');
  expect(io.stderrText()).toContain('GS0903');
  expect(await runCli(['traduz', 'a.gs', '--otimiza', '--sobrescreve'], io, deps)).toBe(0);
  expect(io.fileText('a.mjs')).toContain('console.log(3)');
});
it('arquivo que não termina em .gs: exit 3 e fonte intacto', async () => {
  const io = createMemoryIo({ files: { 'x.txt': 'prosa(1)' } });
  expect(await runCli(['traduz', 'x.txt'], io, deps)).toBe(3);
  expect(io.stderrText()).toContain('GS0902');
  expect(io.fileText('x.txt')).toBe('prosa(1)');
});
```
- [ ] **1.2 Teste (RED).** `tests/check.test.ts`: programa certo → exit 0 e stdout com `Tá certo` e o nome do arquivo, nenhum arquivo criado; programa só com aviso (`uai i é 1\ni mais 1\n`, GS0806) → exit 0 e `aviso GS0806` no stderr; `--tom neutro` troca a frase (`O nome "nomi" não foi declarado.`); `--json` com aviso dá `ok: true`; erro → exit 1.
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/translate.test.ts tests/check.test.ts` — esperado: falha (stubs devolvem exit 3).
- [ ] **1.4 Implementar.** `compileSource`: valida nome (exceto `-`), lê e decodifica, `compile(source, { fileName: displayName, target: 'module', tone, sourceMap: false })`; imprime **todos** os diagnósticos (erros e avisos) em ordem; `ok: false` → exit 1. `translate`: planeja a saída **antes** de compilar mais de uma vez? Não: valida e planeja, compila, só então grava com `create-new` (ou `replace` quando `replacing`); com `--otimiza`/`--minifica` chama `optimize` por `import()` dinâmico; rejeição do Terser → grava a saída didática e escreve a nota `Não deu pra otimizar, sô; gravei a saída normal.` no stderr. Sucesso: stdout `Tá pronto, sô! <saida>`. `check`: `Tá certo, sô! Nenhum erro em <arquivo>.`
- [ ] **1.5 Rodar:** os mesmos testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.6 Commit:** `feat(cli): implementa traduz e vê_se_tá_certo com json e leitura do stdin`.

---

### U3-07: `bota_pra_moer`
**Spec:** §6.1 (`bota_pra_moer`), §4.10 (ciclo de vida de `pergunta`, GS0702, GS0703), §5.10 · **Tier:** large · **Depende de:** U3-05, U3-06 · **Risco:** `await` de topo no importador faz o Node imprimir `Warning: Detected unsettled top-level await` em inglês e sair com 13; erro assíncrono sem handler vira stack do motor; temporário órfão em Ctrl+C; handler de `exit` que escreve de forma assíncrona perde o GS0703 · **Rollback:** reverter o commit
**Files:**
- Create: `packages/cli/src/run/{program-runner.ts,process-host.ts,process-host.types.ts,temp-workspace.ts,runtime-report.ts}`
- Modify: `packages/cli/src/commands/run.ts`, `packages/cli/src/entry/goiasscript.ts` (passa o `ProcessHost` real)
- Test: `packages/cli/tests/{run-lifecycle,run-real,temp-workspace}.test.ts`

**Interfaces:** Consumes: `compileSource`, `translateRuntimeError`, `ProcessHost`. Produces: `runProgram(request, io, host)`, `createProcessHost()`, `createTempWorkspace(io)`, `sweepStaleWorkspaces(io, nowMs)`, `reportRuntimeError(error, context, io, tone)`.
**Aceite:** os quatro desfechos do `ProcessHost` (término, rejeição, exceção, saída com promessa pendente) com exit e mensagem corretos; erro de execução com a linha do `.gs`; laço infinito morre por sinal e deixa o diretório órfão que a execução seguinte varre; nunca stack do motor.

- [ ] **1.1 Teste (RED).** `tests/run-lifecycle.test.ts` com `FakePh = createFakeProcessHost({ importModule })` (guarda os handlers e expõe `fireExit()`, `fireUnhandledRejection(reason)`, `fireUncaughtException(error)`, `exitCode`, `terminated`):
```ts
it('programa que termina: exit 0, sem GS0703, temporário removido', async () => {
  const host = createFakeProcessHost({ importModule: async () => ({}) });
  const io = createMemoryIo({ files: { 'ok.gs': 'prosa(1)\n' } });
  await runCli(['bota_pra_moer', 'ok.gs'], io, { processHost: host });
  host.fireExit();
  expect(host.exitCode ?? 0).toBe(0);
  expect(io.stderrText()).not.toContain('GS0703');
  expect(io.paths().filter((p) => p.includes('goiasscript-'))).toEqual([]);
});
it('promessa pendente: o exit síncrono imprime GS0703 e define exit 2', async () => {
  const host = createFakeProcessHost({ importModule: () => new Promise(() => undefined) });
  const io = createMemoryIo({ files: { 'p.gs': 'espera_um_cadim faz_um Promessa((resolve_aí) => { })\n' } });
  await runCli(['bota_pra_moer', 'p.gs'], io, { processHost: host });
  host.fireExit();
  expect(host.exitCode).toBe(2);
  expect(io.stderrSyncText()).toContain('O programa ficou esperando uma resposta que nunca veio, sô.');
  expect(io.stderrText()).not.toMatch(/Warning|unsettled/u);
});
it('GS0702 vindo do ajudante: traduzido, exit 2, sem stack do motor', async () => {
  const host = createFakeProcessHost({ importModule: () => new Promise(() => undefined) });
  const io = createMemoryIo({ files: { 'q.gs': 'prosa(pergunta("a"))\n' } });
  await runCli(['bota_pra_moer', 'q.gs'], io, { processHost: host });
  host.fireUnhandledRejection(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }));
  expect(host.terminated).toBe(2);
  expect(io.stderrText()).toContain('Acabou a entrada, sô');
  expect(io.stderrText()).not.toMatch(/\bat \S+ \(/u);
});
it('erro de compilação não importa nada e sai com 1', async () => {
  const host = createFakeProcessHost({ importModule: async () => { throw new Error('não devia importar'); } });
  const io = createMemoryIo({ files: { 'e.gs': 'prosa(nomi)\n' } });
  expect(await runCli(['bota_pra_moer', 'e.gs'], io, { processHost: host })).toBe(1);
});
```
- [ ] **1.2 Teste (RED).** `tests/run-real.test.ts` (processo real: `run-real-cli.ts` faz `spawn(process.execPath, ['src/entry/goiasscript.ts', ...args], { cwd, shell: false })` em diretório temporário; rodado também no Windows pela matriz):
```ts
it('erro de execução aponta a linha do .gs e sai com 2', async () => {
  const dir = fixture({ 'programa.gs': 'uai p é { x: 1 }\nuai o é nada\nprosa(p.x)\nprosa(o.x)\n' });
  const run = await runCliProcess(['bota_pra_moer', 'programa.gs'], { cwd: dir });
  expect(run.exitCode).toBe(2);
  expect(run.stdout).toBe('1\n');
  expect(run.stderr).toContain('programa.gs:4');
  expect(run.stderr).toContain('GS0710');
  expect(run.stderr).not.toMatch(/Cannot read|is not a function|TypeError/u);
});
it('diretório temporário com espaço, # e % também funciona', async () => {
  const dir = fixture({ 'a.gs': 'prosa("oi")\n' });
  const run = await runCliProcess(['bota_pra_moer', 'a.gs'], { cwd: dir, env: { TMPDIR: tmpWithOddName(), TEMP: tmpWithOddName(), TMP: tmpWithOddName() } });
  expect([run.exitCode, run.stdout]).toEqual([0, 'oi\n']);
});
it('laço infinito não termina sozinho: GS0802 antes, kill encerra, órfão é varrido', async () => {
  const dir = fixture({ 'laco.gs': 'enquanto_tiver (certeza) {\n}\n' });
  const child = startCliProcess(['bota_pra_moer', 'laco.gs'], { cwd: dir });
  await delay(1500);
  expect(child.exited).toBe(false);
  expect(child.stderr()).toContain('GS0802');
  child.kill();
  await child.closed;
  const next = await runCliProcess(['bota_pra_moer', 'ok.gs'], { cwd: fixture({ 'ok.gs': 'prosa(1)\n' }), env: sameTmp(child) });
  expect(orphanWorkspaces(child.tmpDir)).toEqual([]);
  expect(next.exitCode).toBe(0);
});
```
- [ ] **1.3 Teste (RED).** `tests/temp-workspace.test.ts`: `sweepStaleWorkspaces` remove só `goiasscript-*` com `modifiedAt` anterior a 24 h (constante `STALE_WORKSPACE_MS`), preserva recentes e pastas de outros nomes; `createTempWorkspace` cria `goiasscript-XXXX` dentro de `env.tmpDir` e `dispose()` é idempotente e devolve `false` (não lança) se a remoção falhar.
- [ ] **1.4 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/run-lifecycle.test.ts tests/temp-workspace.test.ts tests/run-real.test.ts` — esperado: falha (o stub de `run.ts` devolve exit 3; `fake-process-host` completo vem de U3-02).
- [ ] **1.5 Implementar.** `runProgram`: `compileSource` com `target: 'module'`, `sourceMap: true`, saída didática; avisos no stderr; varre órfãos; cria o workspace; grava `program.mjs`; registra `onExit` (síncrono: remove o workspace; se `!finished`, escreve GS0703 por `err.writeSync` e `setExitCode(2)`), `onUnhandledRejection` e `onUncaughtException` (`translateRuntimeError` com `RuntimeErrorContext { map, helperRange, fileName: displayName, source }`, imprime com `renderDiagnostic` e `terminate(2)`); depois `host.importModule(pathToFileURL(file).href).then(() => { finished = true }, report)`, **sem** `await` de topo e **sem** handler de `SIGINT`/`SIGTERM`. `createProcessHost`: `process.on`, `process.exitCode`, `terminate` = `err.writeSync` pendente + `process.exit`. Entradas `-` recusadas (já em U3-02).
- [ ] **1.6 Rodar:** os três arquivos e `corepack pnpm verify` — esperado: verdes (Linux e, na CI, Windows).
- [ ] **1.7 Commit:** `feat(cli): implementa bota_pra_moer com tradução de erros de execução`.

---

### U3-08: `explica` e `dedo_de_prosa`
**Spec:** §6.1, §4.11 · **Tier:** small · **Depende de:** U3-02, U3-03 · **Risco:** versão do banner divergente do `package.json` do tarball; código digitado em minúscula ou sem prefixo · **Rollback:** reverter o commit
**Files:**
- Modify: `packages/cli/src/commands/{explain.ts,info.ts}`, `packages/cli/src/version.ts`
- Test: `packages/cli/tests/{explain,info}.test.ts`

**Interfaces:** Consumes: `explainDiagnostic`, `DIAGNOSTICS`, `renderHelp`. Produces: nada novo.
**Aceite:** `explica GS0301` mostra título, explicação, exemplo e lição; `explica` sem argumento lista código e título de todos; código inexistente é GS0905 com sugestão; `dedo_de_prosa` mostra versão, Node, sistema e a ajuda.

- [ ] **1.1 Teste (RED).** `tests/explain.test.ts`: `['explica','GS0301']` → exit 0, stdout contém `Nome não declarado`, o `example` do catálogo e `lição`; `gs0301` e `0301` equivalem; `['explica']` lista tantas linhas `GSnnnn  título` quanto `DIAGNOSTICS.length`; `['explica','GS0302','--tom','neutro']` usa a explicação neutra; `['explica','GS9999']` → exit 3, stderr com `GS0905`; `['explica','GS030']` sugere `GS0301`? (distância ≤ 1 entre códigos existentes). `tests/info.test.ts`: `['dedo_de_prosa']` contém `GoiásScript`, a versão lida de `../package.json`, `Node v22.12.0` com `nodeVersion: '22.12.0'`, `linux`, e os seis comandos.
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/explain.test.ts tests/info.test.ts` — esperado: falha (stubs devolvem exit 3).
- [ ] **1.3 Implementar.** `version.ts`: `import pkg from '../package.json' with { type: 'json' }` (esbuild embute); `explica` normaliza `gs`/dígitos para `GSnnnn`; sem prefixo numérico não adivinha.
- [ ] **1.4 Rodar:** os mesmos testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(cli): adiciona explica e dedo_de_prosa`.

---

### U3-09: `arma_o_barraco`
**Spec:** §6.1 (`arma_o_barraco`, "o CI gera o projeto e roda os próximos passos"), §8.1 (nome hostil) · **Tier:** medium · **Depende de:** U3-02, U3-03, U3-04 · **Risco:** nome de projeto com `..`, caminho absoluto, separador ou nome reservado cria arquivos fora do alvo; falha no meio deixa pasta pela metade; passos impressos que não funcionam · **Rollback:** reverter o commit
**Files:**
- Create: `packages/cli/src/scaffold/{project-name.ts,template.constants.ts,scaffold-project.ts,next-steps.ts}`
- Modify: `packages/cli/src/commands/scaffold.ts`
- Test: `packages/cli/tests/scaffold.test.ts`

**Interfaces:** Consumes: `isReservedWindowsName`, `CliFileSystem`. Produces: `validateProjectName(name, platform)`, `scaffoldProject(name, io)`, `extractNextSteps(stdout)`.
**Aceite:** cria `main.gs`, `README.md` e `.gitignore` num diretório novo; nomes hostis recusados antes de criar qualquer coisa; falha no meio remove só o que foi criado; o `main.gs` do template compila sem diagnóstico; passos impressos são `cd <nome>` e `goiasscript bota_pra_moer main.gs`.

- [ ] **1.1 Teste (RED).** `tests/scaffold.test.ts`:
```ts
it('cria o projeto e imprime os próximos passos', async () => {
  const io = createMemoryIo();
  expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(0);
  expect(io.paths().sort()).toEqual(['meu-projeto/.gitignore', 'meu-projeto/README.md', 'meu-projeto/main.gs']);
  expect(extractNextSteps(io.stdoutText())).toEqual(['cd meu-projeto', 'goiasscript bota_pra_moer main.gs']);
});
it('o main.gs do template compila sem nenhum diagnóstico', () => {
  const result = compile(TEMPLATE_FILES['main.gs'], { fileName: 'main.gs' });
  expect(result).toMatchObject({ ok: true, diagnostics: [] });
});
it.each(['../fora', '/abs', 'a/b', 'a\\b', '.oculto', '-x', 'a b', '', 'a'.repeat(65), 'café\u0000'])('recusa o nome %j sem criar nada', async (name) => {
  const io = createMemoryIo();
  expect(await runCli(['arma_o_barraco', name], io, deps)).toBe(3);
  expect(io.stderrText()).toContain('GS0905');
  expect(io.paths()).toEqual([]);
});
it('no Windows recusa nome reservado', async () => {
  for (const name of ['con', 'NUL.txt', 'com1']) {
    const io = createMemoryIo({ platform: 'win32' });
    expect(await runCli(['arma_o_barraco', name], io, deps)).toBe(3);
  }
});
it('pasta existente: GS0903, exit 3 e nada alterado', async () => {
  const io = createMemoryIo({ files: { 'meu-projeto/main.gs': 'meu' } });
  expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(3);
  expect(io.stderrText()).toContain('GS0903');
  expect(io.fileText('meu-projeto/main.gs')).toBe('meu');
});
it('falha no meio remove só o que criou', async () => {
  const io = createMemoryIo({ files: { 'outro.txt': 'fica' }, failingWrites: ['meu-projeto/README.md'] });
  expect(await runCli(['arma_o_barraco', 'meu-projeto'], io, deps)).toBe(3);
  expect(io.paths()).toEqual(['outro.txt']);
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/scaffold.test.ts` — esperado: falha (stub; `TEMPLATE_FILES` inexistente).
- [ ] **1.3 Implementar.** Nome: um só segmento, `^[\p{L}\p{N}][\p{L}\p{N}_.-]*$`, até 64 code points, sem nome reservado do Windows (qualquer plataforma, para o projeto andar entre máquinas). Template embutido em `template.constants.ts` (`main.gs` com `uai nome é "mundo"` e `prosa("Bão, sô! Olá, " mais nome)`, `README.md` em goianês, `.gitignore`). Cria o diretório com `makeDirectory` (falha se existe → GS0903 com `reason: 'já existe'`, sem `override`), grava cada arquivo com `create-new`; qualquer erro depois do `makeDirectory` remove o diretório recém-criado. Próximos passos impressos em bloco `Próximos passos:` com cada comando em linha própria indentada.
- [ ] **1.4 Rodar:** o teste e `corepack pnpm verify` — esperado: verdes. A execução real dos passos fica no E2E do tarball (U3-13).
- [ ] **1.5 Commit:** `feat(cli): adiciona arma_o_barraco com template único e nome de projeto seguro`.

---

### U3-10: Motor do REPL
**Spec:** §5.7 (regras do alvo `repl`), §6.2, §4.10 · **Tier:** large · **Depende de:** U3-01 · **Risco:** `vm.Context` sem `console` do hospedeiro escreve fora do `OutputSink`; sessão não adotada quando a execução lança, ou adotada quando a compilação falha; `pergunta` com segundo leitor; laço infinito trava a sessão · **Rollback:** reverter o commit (nenhum consumidor ainda)
**Files:**
- Create: `packages/cli/src/repl/{repl.types.ts,repl.constants.ts,engine.ts,host-context.ts,echo.ts}`
- Test: `packages/cli/tests/repl-engine.test.ts`

**Interfaces:** Consumes: `compile`, `translateRuntimeError`, `ReplSession`. Produces: `createReplEngine(options): ReplEngine`, `formatEcho(value)` (ver "Interfaces compartilhadas").
**Aceite:** persistência, redeclaração (P14), `GS0302` ao reatribuir `uai` da sessão, falha de compilação não registra nada, erro de execução adota a sessão, nome com inicialização que lança fica `indefinido`, eco, `await` no topo, `pergunta`, `e é_tipo_de Erro`, interrupção por tempo, `reset`.

- [ ] **1.1 Teste (RED).** `tests/repl-engine.test.ts`:
```ts
const setup = () => {
  const io = createMemoryIo();
  return { io, engine: createReplEngine({ io, tone: 'raiz' }) };
};
const echoOf = async (engine: ReplEngine, source: string) => {
  const result = await engine.evaluate(source);
  return result.kind === 'done' ? result.echo : result.kind;
};

describe('motor do REPL', () => {
  it('persiste declarações entre entradas e mostra o eco', async () => {
    const { io, engine } = setup();
    await engine.evaluate('uai x é 5');
    await engine.evaluate('prosa(x)');
    expect(io.stdoutText()).toBe('5\n');
    expect(await echoOf(engine, '1 mais 2')).toBe('3');
    expect(await echoOf(engine, '[1, 2]')).toBe('[ 1, 2 ]');
    expect(await echoOf(engine, '"oi"')).toBe('oi');
    expect(await echoOf(engine, 'indefinido')).toBeUndefined();
    expect(await echoOf(engine, 'prosa(1)')).toBeUndefined();
  });
  it('redeclarar substitui; reatribuir uai da sessão é GS0302', async () => {
    const { engine } = setup();
    await engine.evaluate('uai x é 1');
    await engine.evaluate('uai x é 2');
    expect(await echoOf(engine, 'x')).toBe('2');
    const result = await engine.evaluate('x é 3');
    expect(result).toMatchObject({ kind: 'failed' });
    expect(result.kind === 'failed' && result.diagnostics.map((d) => d.code)).toContain('GS0302');
  });
  it('entrada incompleta pede continuação; entrada com erro não registra nada', async () => {
    const { engine } = setup();
    expect(await engine.evaluate('faz_trem f() {')).toEqual({ kind: 'incomplete' });
    expect(await engine.evaluate('uai z é nomi')).toMatchObject({ kind: 'failed' });
    expect(await engine.evaluate('z')).toMatchObject({ kind: 'failed' });
  });
  it('erro de execução vira GS0710 com a linha e a sessão é adotada', async () => {
    const { engine } = setup();
    await engine.evaluate('uai q é { campo: 1 }\nuai nulo é nada');
    const result = await engine.evaluate('uai a é 1\nnulo.campo');
    expect(result).toMatchObject({ kind: 'threw', diagnostic: { code: 'GS0710' } });
    expect(await echoOf(engine, 'a')).toBe('1');
  });
  it('inicialização que lança deixa o nome indefinido e permite redeclarar', async () => {
    const { engine } = setup();
    await engine.evaluate('uai q é { campo: 1 }\nuai nulo é nada');
    await engine.evaluate('uai b é nulo.campo');
    expect(await echoOf(engine, 'b')).toBeUndefined();
    await engine.evaluate('uai b é 7');
    expect(await echoOf(engine, 'b')).toBe('7');
  });
  it('espera_um_cadim no topo e função assíncrona', async () => {
    const { engine } = setup();
    await engine.evaluate('vai_na_frente faz_trem g() { faz_favor 4 }');
    expect(await echoOf(engine, 'espera_um_cadim g()')).toBe('4');
  });
  it('pergunta usa a próxima linha como resposta e não abre segundo leitor', async () => {
    const { io, engine } = setup();
    const pending = engine.evaluate('uai n é pergunta("Nome?")');
    expect(engine.hasPendingQuestion()).toBe(true);
    engine.answer('Ana');
    await pending;
    expect(io.stdoutText()).toContain('Nome? ');
    expect(await echoOf(engine, 'n')).toBe('Ana');
  });
  it('fim da entrada com pergunta pendente falha com GS0702', async () => {
    const { engine } = setup();
    const pending = engine.evaluate('prosa(pergunta("a"))');
    engine.endOfInput();
    expect(await pending).toMatchObject({ kind: 'threw', diagnostic: { code: 'GS0702' } });
  });
  it('Erro do contexto vale para é_tipo_de e laço infinito é interrompido', async () => {
    const { io, engine } = setup();
    await engine.evaluate('tenta_aí { vixe("x") } se_der_ruim (e) { prosa(e é_tipo_de Erro) }');
    expect(io.stdoutText()).toBe('true\n');
    const looping = createReplEngine({ io, tone: 'raiz', entryTimeoutMs: 50 });
    expect(await looping.evaluate('enquanto_tiver (certeza) {\n}')).toEqual({ kind: 'interrupted' });
  });
  it('reset esvazia a sessão', async () => {
    const { engine } = setup();
    await engine.evaluate('uai x é 1');
    engine.reset();
    expect(engine.session.bindings).toEqual([]);
    expect(await engine.evaluate('x')).toMatchObject({ kind: 'failed' });
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/repl-engine.test.ts` — esperado: falha por import inexistente de `../src/repl/engine.ts`.
- [ ] **1.3 Implementar.** `host-context.ts`: `vm.createContext` só com `console` (objeto do hospedeiro: `log`, `error`, `warn`, `info` escrevem em `out`/`err` com `util.format`), `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval` e `pergunta` (escreve `prompt + ' '`, registra a promessa pendente, cria erros com o `Error` do contexto). `evaluate`: `compile(source, { target: 'repl', fileName: REPL_FILE_NAME, tone, session, sourceMap: true })`; `ok: false` → `incomplete` ou `failed` sem tocar na sessão; `ok: true` → adota `result.session` **antes** de executar; `new vm.Script(code, { filename })` e `runInContext(context, { breakOnSigint: true, ...(timeout) })`; valor de retorno (ou promessa aguardada, para entrada em `async`) vira eco quando `result.echo`, via `formatEcho` (`util.format` do valor; `undefined` não ecoa); exceção → `translateRuntimeError` (o `Error` do contexto é reconhecido pelo `name`); `ERR_SCRIPT_EXECUTION_INTERRUPTED` e timeout → `interrupted`. `endOfInput` rejeita a pergunta pendente com `Object.assign(new Error('GS0702'), { gsCode: 'GS0702' })`.
- [ ] **1.4 Rodar:** o teste e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(cli): adiciona o motor do repl com sessão, eco e pergunta`.

---

### U3-11: Roda de Prosa interativa (`goias`)
**Spec:** §6.2 (multilinha, Ctrl+C, comandos com variantes sem acento, TAB, uma entrada por vez) · **Tier:** large · **Depende de:** U3-02, U3-03, U3-10 · **Risco:** `.5 mais 1` tratado como comando; `.mapear` em linha de continuação tratado como comando; Ctrl+C durante laço síncrono não interrompe porque o terminal está em modo bruto; TAB oferece variantes sem acento duplicadas; nova linha lida enquanto a entrada anterior ainda executa · **Rollback:** reverter o commit
**Files:**
- Create: `packages/language/src/completions.ts` (`COMPLETION_LABELS`, extraído da lógica do gerador), `packages/cli/src/repl/{line-buffer.ts,repl-commands.ts,completer.ts}`, `packages/cli/tests/support/pseudo-terminal.ts`
- Modify: `packages/cli/src/repl/run-repl.ts`, `packages/cli/src/entry/goias.ts`, `packages/language/src/index.ts`, `packages/language/generators/completions.ts` (passa a usar `COMPLETION_LABELS`; saída gerada com diff vazio)
- Test: `packages/cli/tests/{completer,repl-loop}.test.ts`, `packages/language/tests/completions.test.ts`

**Interfaces:** Consumes: `ReplEngine`, `renderDiagnostic`, `readline`. Produces: `runRepl(io, { tone })`, `completeLine(line, bindings)`, `parseReplCommand(line)`.
**Aceite:** os cenários do Review Focus 5 passam num pseudo-terminal por streams (`readline` com `terminal: true`), sem dependência nativa; `goias` aceita só `--tom`.

- [ ] **1.1 Teste (RED).** `tests/completer.test.ts`:
```ts
import { completeLine } from '../src/repl/completer.ts';

it('completa pelo prefixo sem acento e devolve só a grafia oficial', () => {
  expect(completeLine('se_oc', [])).toEqual([['se_ocê_quiser'], 'se_oc']);
  expect(completeLine('se_oce', [])).toEqual([['se_ocê_quiser'], 'se_oce']);
});
it('lista candidatos pelo trecho final e inclui os nomes da sessão', () => {
  const [hits, token] = completeLine('prosa(ma', []);
  expect(token).toBe('ma');
  expect(hits).toEqual(expect.arrayContaining(['mapear', 'mais']));
  expect(completeLine('tota', [{ name: 'total', kind: 'uai' }])[0]).toEqual(['total']);
});
it('completa estático e membro depois do ponto', () => {
  expect(completeLine('Conta.so', [])[0]).toEqual(['Conta.sorteia_um']);
  expect(completeLine('lista.ma', [])[0]).toEqual(['lista.mapear']);
});
it('sem trecho não despeja o vocabulário inteiro', () => {
  expect(completeLine('prosa(', [])).toEqual([[], '']);
});
```
Mais `parseReplCommand`: `.vaza`, `.lembra_ai`, `.lembra_aí`, `.mostra_os_trem`, `.zera_o_trem`, `.limpa_o_terreiro`, `.desenrola` resolvem; `.vazaa` → desconhecido com sugestão `.vaza`; `.5 mais 1` e `.5` **não** são comando (`null`).
- [ ] **1.2 Teste (RED).** `tests/repl-loop.test.ts` com `createPseudoTerminal()` (`PassThrough` de entrada e saída, `type(text)`, `press('tab' | 'ctrl-c' | 'ctrl-d')`, `screen()` sem ANSI, `closed`):
```ts
it('multilinha por incomplete, com continuação e resultado', async () => {
  const term = startRepl();
  term.type('faz_trem soma(a, b) {\n');
  expect(term.screen()).toContain('... ');
  term.type('  faz_favor a mais b\n}\n');
  term.type('soma(1, 2)\n');
  await term.settled();
  expect(term.screen()).toMatch(/^3$/mu);
});
it('erro no meio do bloco mostra o diagnóstico e descarta o buffer', async () => {
  const term = startRepl();
  term.type('faz_trem f() {\n  prosa(nomi)\n}\n');
  await term.settled();
  expect(term.screen()).toContain('GS0301');
  term.type('1 mais 1\n');
  await term.settled();
  expect(term.screen()).toMatch(/^2$/mu);
});
it('linha que começa com ponto é continuação dentro do buffer e comando fora dele', async () => {
  const term = startRepl();
  term.type('uai l é [1, 2]\nuai d é l\n  .mapear((n) => n vezes 2)\nd\n');
  await term.settled();
  expect(term.screen()).toContain('[ 2, 4 ]');
  term.type('.5 mais 1\n.mostra_os_trem\n');
  await term.settled();
  expect(term.screen()).toContain('6');
  expect(term.screen()).toMatch(/l\s+uai/u);
});
it('Ctrl+C descarta a entrada pendente e só sai no segundo, Ctrl+D sai', async () => {
  const term = startRepl();
  term.type('faz_trem f() {\n');
  term.press('ctrl-c');
  term.type('1 mais 1\n');
  await term.settled();
  expect(term.screen()).toMatch(/^2$/mu);
  term.press('ctrl-c');
  expect(term.closedYet()).toBe(false);
  term.press('ctrl-c');
  expect(await term.exitCode).toBe(0);
});
it('pergunta consome a próxima linha e a entrada seguinte espera', async () => {
  const term = startRepl();
  term.type('uai n é pergunta("Nome?")\nAna\nn\n');
  await term.settled();
  expect(term.screen()).toContain('Nome? ');
  expect(term.screen()).toMatch(/^Ana$/mu);
});
it('TAB completa no terminal', async () => {
  const term = startRepl();
  term.type('se_oc');
  term.press('tab');
  expect(term.screen()).toContain('se_ocê_quiser');
});
it('.zera_o_trem limpa a sessão e .vaza sai com 0', async () => {
  const term = startRepl();
  term.type('uai x é 1\n.zera_o_trem\nx\n');
  await term.settled();
  expect(term.screen()).toContain('GS0301');
  term.type('.vaza\n');
  expect(await term.exitCode).toBe(0);
});
```
`tests/completions.test.ts` (language): `COMPLETION_LABELS` contém `se_ocê_quiser`, `se_oce_quiser`, `mapear`, `Conta.maior` e é igual, rótulo a rótulo, ao `completions.json` gerado.
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/completer.test.ts tests/repl-loop.test.ts` — esperado: falha por import inexistente de `../src/repl/completer.ts`.
- [ ] **1.4 Implementar.** `run-repl.ts`: `readline.createInterface({ input, output, terminal: io.streams.isTty || forced, prompt: 'goiás> ', completer })`; fila de entradas (uma por vez); `line` → se há pergunta pendente, `answer`; se o buffer está vazio e `parseReplCommand` reconhece, executa; senão `line-buffer` acumula (separador `\n`) e `engine.evaluate(buffer)`; `incomplete` → prompt `... `; `failed` e `threw` → `renderDiagnostic` no stderr e buffer descartado; `done` → avisos no stderr e eco no stdout; `close`/Ctrl+D → `engine.endOfInput()` e exit 0. `SIGINT` do readline: com buffer ou pergunta pendente, descarta (`cancelPendingQuestion`); sem nada, primeira vez imprime `(pra sair, aperta Ctrl+C de novo ou digita .vaza)` e a segunda sai. Em TTY real, durante a execução síncrona desliga o modo bruto (`setRawMode(false)`) para o `breakOnSigint` do `vm` valer e religa depois; `.limpa_o_terreiro` só emite a sequência de limpar tela se `isTty`. Sem arquivo de histórico em disco; `.lembra_aí` lista as entradas aceitas da sessão. Banner só em TTY.
- [ ] **1.5 Rodar:** os testes, `corepack pnpm --filter @goiasscript/language generate:check` e `corepack pnpm verify` — esperado: verdes. **Verificação manual registrada no relatório (U3-15):** num terminal real, `enquanto_tiver (certeza) {}` no `goias` é interrompido por Ctrl+C sem fechar a sessão (não há PTY real na CI; ver "Decisões do dono").
- [ ] **1.6 Commit:** `feat(cli): adiciona a roda de prosa interativa com multilinha, comandos e tab`.

---

### U3-12: Build, API exportada e tarball
**Spec:** §5.1 (`goiasscript` exporta a API), §8.5.1, §8.6 · **Tier:** medium · **Depende de:** U3-07, U3-08, U3-09, U3-11 · **Risco:** o Node não remove tipos de arquivo dentro de `node_modules`, então o pacote publicado precisa de JavaScript; bundle puxando `src/` ou `@goiasscript/*` por caminho de workspace; Terser carregado na partida; tipos da API vazando importação interna · **Rollback:** reverter o commit
**Files:**
- Create: `scripts/{build-cli.ts,pack-cli.ts}`, `packages/cli/src/entry/api.ts`, `packages/cli/README.md` (goianês: instalar, comandos, REPL), `packages/cli/vitest.e2e.config.ts`, `packages/cli/tests/e2e/support/tarball.ts`, `packages/cli/tests/e2e/pack.e2e.ts`
- Modify: `packages/cli/package.json` (`exports`, `types`, scripts `build`, `test:e2e`), `package.json` (`build:cli`, `pack:cli`), `knip.json`

**Interfaces:** Consumes: esbuild. Produces: `buildCli({ outDir })`, `packCli({ outDir }): Promise<{ tarball: string; sha256: string }>`; `dist/goiasscript.mjs`, `dist/goias.mjs`, `dist/index.mjs` (+ `index.d.ts`) e um chunk do otimizador carregado só sob demanda.
**Aceite:** `npm pack` do pacote contém só `dist/**`, `README.md`, `LICENSE` e `package.json`; manifesto sem `dependencies` nem `workspace:`; os dois binários começam com `#!/usr/bin/env node`; a API é `compile`, `explainDiagnostic`, `translateRuntimeError`, `optimize` e os tipos da §5.9.

- [ ] **1.1 Teste (RED).** `tests/e2e/pack.e2e.ts`:
```ts
it('o tarball traz só o que deve, com README e LICENSE', async () => {
  const { tarball } = await getTarball();
  const entries = await listTarball(tarball);
  expect(entries).toEqual(expect.arrayContaining(['package/README.md', 'package/LICENSE', 'package/package.json', 'package/dist/goiasscript.mjs', 'package/dist/goias.mjs', 'package/dist/index.mjs', 'package/dist/index.d.ts']));
  expect(entries.filter((entry) => /\.(ts|map)$/u.test(entry) && !entry.endsWith('.d.ts'))).toEqual([]);
  expect(entries.some((entry) => entry.startsWith('package/src/'))).toBe(false);
  const manifest = await readTarballJson(tarball, 'package/package.json');
  expect(manifest.dependencies).toBeUndefined();
  expect(JSON.stringify(manifest)).not.toContain('workspace:');
});
it('os binários têm shebang e o bundle não aponta para o workspace', async () => {
  const dist = await extractTarball(await getTarball());
  for (const bin of ['goiasscript.mjs', 'goias.mjs']) expect(readText(dist, `dist/${bin}`).startsWith('#!/usr/bin/env node\n')).toBe(true);
  expect(allDistText(dist)).not.toMatch(/@goiasscript\/|\.\.\/src\/|node_modules\//u);
});
it('a partida não carrega o Terser', async () => {
  const run = await runInstalled(['dedo_de_prosa']);
  expect(run.exitCode).toBe(0);
  expect(run.loadedModules).not.toContain('terser');
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter goiasscript exec vitest run --config vitest.e2e.config.ts tests/e2e/pack.e2e.ts` — esperado: falha (`scripts/pack-cli.ts` inexistente).
- [ ] **1.3 Implementar.** `build-cli.ts`: esbuild `bundle`, `platform: node`, `format: esm`, `target: node22`, `splitting` com `outdir`, `minify: false`, `sourcemap: false`, entradas `src/entry/{goiasscript,goias,api}.ts`; `src/entry/goiasscript.ts` faz a checagem de versão e só então `await import('./cli.mjs')` para que Node antigo chegue a imprimir o GS0904; `optimize` na API e no CLI via `import()` dinâmico. Shebang e `chmod 755` aplicados depois do build só nos binários. `index.d.ts`: expande `api.types.ts` e `source-map.types.ts` sem importações e acrescenta as quatro assinaturas da §5.9. `pack-cli.ts`: copia o `LICENSE` da raiz, roda `corepack pnpm pack`, devolve caminho e sha256.
- [ ] **1.4 Rodar:** o E2E acima e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `build(cli): empacota o goiasscript com esbuild e gera o tarball`.

---

### U3-13: E2E do tarball em pasta limpa
**Spec:** §8.2 (regressão dos CRITICAL do CLI, matriz de nomes), §8.5.1, §8.5.4, §11 · **Tier:** large · **Depende de:** U3-12 · **Risco:** teste que passa contra o código-fonte e falha no pacote instalado (caminho, shim do Windows, versão do Node); hostilidade de shell no Windows ao usar o shim `.cmd` · **Rollback:** reverter o commit (só testes e job de CI)
**Files:**
- Create: `packages/cli/tests/e2e/{name-matrix,pergunta-pipe,pending-promise,scaffold-steps,english-scan,api-types,repl-pipe}.e2e.ts`
- Modify: `packages/cli/tests/e2e/support/tarball.ts` (instalação em pasta limpa: `package.json` mínimo + `npm install <tarball> --no-audit --no-fund`), `.github/workflows/promises-gate.yml` (job `tarball`: Ubuntu, Windows, macOS × Node 22 e 24; baixa/gera o tarball e roda `test:e2e`)

**Interfaces:** Consumes: o tarball. Produces: `runInstalled(args, options)` (`node <pasta>/node_modules/goiasscript/dist/goiasscript.mjs`; um único teste por SO usa o shim em `node_modules/.bin`, no Windows via `ComSpec` com argumentos fixos e benignos).
**Aceite:** todos os E2E verdes nas três plataformas; sha256 e listagem de arquivos antes/depois idênticos nos casos de recusa.

- [ ] **1.1 Teste (RED).** `name-matrix.e2e.ts`, para `traduz` e para `bota_pra_moer`:
```ts
const CASES = [
  { name: 'x.txt', outcome: 'refused', code: 'GS0902' }, { name: 'x', outcome: 'refused', code: 'GS0902' },
  { name: 'X.GS', outcome: 'works' }, { name: 'x.gs', outcome: 'works' }, { name: 'e.gs/f/programa.gs', outcome: 'works' },
  { name: 'nome com espaço.gs', outcome: 'works' }, { name: 'a$(touch PWNED).gs', outcome: 'works' }, { name: '`touch PWNED`.gs', outcome: 'works', skipOn: ['win32'] },
  { name: 'a";touch PWNED;".gs', outcome: 'works', skipOn: ['win32'] }, { name: '-x.gs', outcome: 'works', afterDoubleDash: true },
  { name: 'cafe\u0301.gs', outcome: 'works' },
] as const;
describe.each(['traduz', 'bota_pra_moer'])('%s com nomes hostis', (command) => {
  it.each(CASES)('$name', async (testCase) => {
    const dir = fixtureDir({ [testCase.name]: 'prosa("oi")\n', 'x.temp.js': 'velho' });
    const before = snapshotTree(dir);
    const run = await runInstalled([command, ...(testCase.afterDoubleDash ? ['--', testCase.name] : [testCase.name])], { cwd: dir });
    if (testCase.outcome === 'refused') {
      expect(run.exitCode).toBe(3);
      expect(run.stderr).toContain(testCase.code);
      expect(snapshotTree(dir)).toEqual(before);
    } else {
      expect(run.exitCode).toBe(0);
      expect(sha256(path.join(dir, testCase.name))).toBe(before.get(testCase.name));
      expect(fs.existsSync(path.join(dir, 'PWNED'))).toBe(false);
      expect(fs.readFileSync(path.join(dir, 'x.temp.js'), 'utf8')).toBe('velho');
    }
  });
});
it('saída igual à entrada e destino existente são recusados sem tocar no fonte', async () => { /* -s x.gs --sobrescreve; -s com link físico; x.mjs existente sem --sobrescreve: exit 3, GS0903, sha256 do fonte igual */ });
it('X.GS e x.gs convivem em diretórios separados em sistema sem diferença de caixa', async () => { /* cada um em sua pasta; ambos passam */ });
```
- [ ] **1.2 Teste (RED).** `pergunta-pipe.e2e.ts` com o programa de duas `pergunta` (`Nome?` e `Cidade?`, imprime `nome mais " de " mais cidade`): (i) tudo de uma vez, também com `\r\n`; (ii) segunda linha escrita 300 ms depois; (iii) escritor mantido aberto: o processo fecha em menos de 1000 ms depois da última resposta e o teste só então encerra o pipe; (iv) uma linha só e fim: exit 2, `GS0702` no stderr, nem 13 nem 0, stderr sem `Warning`. Em todos, stdout `Ana de Goiânia\n` quando completo e nenhuma frase da lista de inglês proibido.
- [ ] **1.3 Teste (RED).** `pending-promise.e2e.ts`: `espera_um_cadim faz_um Promessa((resolve_aí) => { })` → exit 2, stderr contém `O programa ficou esperando uma resposta que nunca veio, sô.`, sem `unsettled`/`Warning`. `scaffold-steps.e2e.ts`: `arma_o_barraco meu-projeto` em pasta limpa, extrai os passos impressos, executa `cd` como mudança de `cwd` e `goiasscript …` como `runInstalled`, e exige stdout `Bão, sô! Olá, mundo\n`. `english-scan.e2e.ts`: percorre `dedo_de_prosa`, `explica GS0301`, um erro de compilação e um de execução, e falha se stdout/stderr casar com `Cannot read properties`, `is not a function`, `is not a constructor`, `before initialization`, `Maximum call stack`, `Invalid count value`, `toFixed()`; snapshot do `dedo_de_prosa`. `api-types.e2e.ts`: instala o tarball, compila com o `tsc` do repositório um `consumer.ts` que faz `import { compile, type CompileResult } from 'goiasscript'` (NodeNext, `strict`) sem erros e executa `compile('prosa(1)')` por `node` com `ok: true`. `repl-pipe.e2e.ts`: `goias` com stdin em pipe (`uai x é 5\nx mais 1\n.vaza\n`) imprime `6` e sai com 0.
- [ ] **1.4 Rodar:** `GS_TARBALL=<tarball> corepack pnpm --filter goiasscript test:e2e` — esperado: falha onde ainda não existe cobertura (`scaffold-steps` e `api-types` falham se U3-12 não exportou a API) e verde nos demais; corrigir o código, não o teste.
- [ ] **1.5 Rodar:** `corepack pnpm pack:cli` e o `test:e2e` completo em Linux; o job `tarball` cobre Windows e macOS na CI — esperado: verdes.
- [ ] **1.6 Commit:** `test(cli): cobre o tarball instalado com matriz de nomes, pipes e passos do template`.

---

### U3-14: `release.yml` do alpha
**Spec:** §8.6, §10.3 (trusted publisher), §9.5 (alpha fora da promessa) · **Tier:** medium · **Depende de:** U3-12 · **Risco:** token de npm no workflow; publicar tarball diferente do testado; dist-tag errada empurrando o alpha para `latest`; actions por tag móvel · **Rollback:** reverter o commit (o workflow só dispara por tag; sem trusted publisher configurado ele não publica nada)
**Files:**
- Create: `.github/workflows/release.yml`, `scripts/release-target.ts`, `tools/config-tests/tests/release-workflow.test.mjs`, `packages/cli/tests/release-target.test.ts`
- Modify: `knip.json`

**Interfaces:** Consumes: `packCli`. Produces: `resolveReleaseTarget(tag, packageVersion): { ok: true; version; distTag: 'next' } | { ok: false; reason }`.
**Aceite:** a tag `v3.0.0-alpha.N` com `packages/cli/package.json` igual publica em `next`; qualquer versão sem pré-lançamento é recusada nesta fase; o workflow não contém `NPM_TOKEN`, `NODE_AUTH_TOKEN` nem `secrets.`; o job de publicação confere o sha256 do tarball baixado contra o do job que o testou.

- [ ] **1.1 Teste (RED).** `release-target.test.ts`:
```ts
import { resolveReleaseTarget } from '../../../scripts/release-target.ts';

it('alpha vai para next', () => {
  expect(resolveReleaseTarget('v3.0.0-alpha.0', '3.0.0-alpha.0')).toEqual({ ok: true, version: '3.0.0-alpha.0', distTag: 'next' });
});
it.each([['v3.0.0', '3.0.0'], ['v3.0.0-alpha.1', '3.0.0-alpha.0'], ['3.0.0-alpha.0', '3.0.0-alpha.0'], ['v2.0.0-alpha.0', '2.0.0-alpha.0']])('recusa %s / %s', (tag, version) => {
  expect(resolveReleaseTarget(tag, version)).toMatchObject({ ok: false });
});
```
- [ ] **1.2 Teste (RED).** `release-workflow.test.mjs` (usa `yaml` e o harness existente): dispara só em `push` de `tags: ['v3.*-alpha.*']`; `permissions` do arquivo é `contents: read` e `id-token: write` aparece apenas no job `publish`, que declara `environment: npm-release`; nenhum `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `secrets.`; todo `uses:` termina em `@` + 40 hex; `publish` depende de `tarball-gate`, que depende de `pack`; o passo de publicação usa o arquivo baixado e o `distTag` calculado, e há um passo que compara `sha256sum` antes de publicar.
- [ ] **1.3 Rodar:** `corepack pnpm --filter goiasscript exec vitest run tests/release-target.test.ts` e `corepack pnpm exec vitest run --project config-tests release-workflow` — esperado: falha por arquivo inexistente.
- [ ] **1.4 Implementar.** `release.yml` com quatro jobs: `verify` (Ubuntu, Node 24, `pnpm verify`); `pack` (`pack:cli`, upload do `.tgz` e do sha256 como artefato); `tarball-gate` (matriz Ubuntu/Windows/macOS, baixa o artefato, roda `test:e2e` com `GS_TARBALL`); `publish` (Ubuntu, `environment: npm-release`, `id-token: write`, baixa o artefato, confere o sha256, usa o npm do runner na versão exata conferida com `npm view npm version` no dia, e publica com `npm stage publish <tarball> --tag next` conforme a §8.6; o comando e a flag são **conferidos com `npm stage --help` antes da primeira execução** e o resultado fica no relatório). SHAs das actions reaproveitam as do `ci.yml`; `upload-artifact`/`download-artifact` pinados após conferir a tag com `gh api`. Comentário curto no topo: "O trusted publisher é criado só imediatamente antes do primeiro publish e expira em 2 dias sem publish validado".
- [ ] **1.5 Rodar:** os testes acima e `corepack pnpm verify` — esperado: verdes. **Nenhuma tag é criada e nada é publicado nesta unidade.**
- [ ] **1.6 Commit:** `ci(release): adiciona o release do alpha em next com publicação por oidc`.

---

### U3-15: Revisão de segurança e relatório do gate da Fase 3
**Spec:** §10.1 (Fase 3), §8.1 (Segurança), §8.5.1 · **Tier:** medium · **Depende de:** U3-13, U3-14 · **Risco:** achado CRITICAL/HIGH aberto bloqueia o gate; relatório que afirma sem medir · **Rollback:** reverter o commit do relatório (correções de segurança viram commits próprios)
**Files:**
- Create: `docs/fase-3/relatorio-gate.md`
- Modify: o que os achados exigirem (cada correção com teste de regressão antes)

**Interfaces:** Consumes: o diff completo do plano 2. Produces: relatório do gate.
**Aceite:** `security-reviewer` (contexto fresco, só leitura) sem CRITICAL/HIGH abertos; MEDIUM/LOW com disposição por escrito; `verify`, E2E do tarball em três plataformas e cobertura do pacote verdes; relatório com os números medidos.

- [ ] **1.1 Revisão.** Despachar `everything-claude-code:security-reviewer` em contexto fresco, repetindo no prompt: branch base `v3/integracao`, caminhos `packages/cli`, `scripts/{build-cli,pack-cli,release-target}.ts`, `.github/workflows/release.yml` e `promises-gate.yml`; ignorar `packages/core`, `node_modules`, `dist`; formato de saída = tabela severidade/arquivo/descrição/correção, em português. Checklist: execução de comando por nome de arquivo (nenhum `shell`), travessia e escrita fora do alvo (`planOutput`, `arma_o_barraco`), link simbólico e físico, TOCTOU entre checagem e escrita (criação exclusiva), permissões e limpeza de temporários, injeção de sequência de controle no terminal (nome de arquivo, texto do aluno, mensagem), ReDoS e linha gigante no renderizador, `unhandledRejection`/`uncaughtException` que vazam pilha do motor, `vm` do REPL (não é fronteira de segurança: `bota_pra_moer` e `goias` executam código do usuário com os poderes dele, e o texto de ajuda não promete isolamento), dependências embutidas no bundle (OSV), workflow de release (token, escopo de `id-token`, SHAs, dist-tag, mesmo tarball).
- [ ] **1.2 Disposição.** Para cada CRITICAL/HIGH: teste RED de regressão, correção, revisão de novo. Registrar MEDIUM/LOW com decisão (corrigir agora, ticket `GS-<n>` ou aceitar com motivo).
- [ ] **1.3 Medir e escrever.** `docs/fase-3/relatorio-gate.md` com: unidades e commits; cobertura por pacote (`vitest run --coverage`); resultado do E2E do tarball por SO e Node; saída das quatro variantes de `pergunta` e do GS0703 (tempo medido do cenário iii); tabela da matriz de nomes; achados da revisão e disposição; verificação manual do Ctrl+C em laço no REPL num terminal real; tamanho do tarball e do bundle; divergências do spec; riscos abertos; **checklist do dono para o primeiro publish** (abaixo); mapa de rastreabilidade (§11) da Fase 3: `arma_o_barraco` e `bota_pra_moer` → U3-13; "O CLI nunca apaga nem sobrescreve o seu `.gs`" → matriz de nomes; "Roda de Prosa" → `repl-loop.test.ts`; `npm install -g goiasscript` → smoke pós-publicação (Fase 9).
- [ ] **1.4 Rodar:** `corepack pnpm verify`, `corepack pnpm pack:cli` e o `test:e2e` — esperado: verdes.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 3 e a revisão de segurança do cli`.

**Checklist do dono para o primeiro publish (só depois do GATE 3 e com o `release.yml` na `main`):** (1) criar o trusted publisher do `goiasscript` no npm apontando para este repositório e o workflow `release.yml`, imediatamente antes do primeiro publish; (2) criar o ambiente `npm-release` no GitHub com aprovação manual; (3) criar a tag `v3.0.0-alpha.0`; (4) aprovar o stage com 2FA (`npm stage approve`); (5) em até 2 dias validar o publish (a configuração expira); (6) conferir `npm view goiasscript dist-tags` (`next` aponta o alpha, `latest` intacto) e a página com provenance; (7) registrar no relatório que `--tag next` funcionou com publisher só de stage (§8.6) ou o que falhou.

---

## Decisões do dono que o plano espera

Cada uma tem padrão adotado; o plano segue o padrão se o dono não disser o contrário no gate do plano.

1. **Nome npm.** Padrão: `goiasscript` vira o CLI novo e o legado vira `goiasscript-legacy` (privado, sem `bin`) até a Fase 8. Alternativa: publicar o novo com outro nome e renomear só na Fase 9 (custa trocar `bin`, README e todos os testes).
2. **Texto do GS0903.** Padrão: `{reason}` + segmento opcional de `--sobrescreve`, cobrindo também "é pasta" e "termina em .gs". Mudança de texto de mensagem é PATCH (§9.5); a descrição da §4.11 muda se o dono aprovar.
3. **Erros de leitura sem código novo.** Arquivo inexistente, ilegível ou fora de UTF-8 usam GS0905 com detalhe, exit 3. Alternativa: GS0906 dedicado (mudaria o catálogo e a §6.1).
4. **`--json` só em `traduz` e `vê_se_tá_certo`; `bota_pra_moer -` recusado** (a entrada padrão pertence às respostas do programa).
5. **Sem PTY real na CI.** O REPL é testado por `readline` com `terminal: true` sobre streams (TAB e Ctrl+C reais), mais E2E com pipe. O spec cita PTY (§8.2); `node-pty` traria compilação nativa em três SO. A verificação em terminal real de Ctrl+C em laço fica manual no relatório. Alternativa: aprovar `node-pty` como devDependency só do pacote `cli`.
6. **Sem cor, sem arquivo de histórico, sem mapa de fonte gravado pelo `traduz`.** Menos superfície no alpha; entram por RFC se pedidos.
7. **Changesets e o job `compat` (§9.5) ficam fora deste plano.** O alpha está fora da promessa de compatibilidade; a versão sai do `package.json` e da tag. Configurar Changesets e o `compat` é pré-requisito do `3.0.0` (Fase 9) e não existe no repositório hoje.
8. **Bundle legível (sem minificar) e Terser em chunk preguiçoso.** Auditável e rápido na partida; o custo é tamanho do tarball, medido no relatório.
9. **Primeiro publish e trusted publisher** são tarefas do dono (§10.3): ver o checklist da U3-15. O plano não cria tag, não publica e não altera configuração do GitHub ou do npm.
10. **macOS na matriz do E2E do tarball** (§8.3 pede macOS para o CLI): aceita o custo de minutos de CI.
