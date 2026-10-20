# GoiásScript 3 — Plano 1 (Fases 0, 1 e 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Execução escolhida pelo dono (D12): **grafo de unidades com worktree por unidade** (estilo ralphinho): cada unidade
> roda em worktree próprio, com TDD, revisor independente em contexto fresco e passada de limpeza ("de-sloppify"); a
> fila de merge aplica as unidades na branch de integração; há gate humano no fim de cada fase.

**Goal:** Entregar o núcleo do GoiásScript 3 — prova de conceito com gate (Fase 0), fundação do repositório com todas
as regras do dono como gates de CI (Fase 1) e o compilador completo, `compile()` estável com corpus verde (Fase 2).

**Architecture:** Monorepo pnpm com `@goiasscript/language` (tabela única da linguagem, dados `as const` + geradores),
`@goiasscript/compiler` (lexer sob demanda → parser descendente recursivo + Pratt resiliente → análise semântica de
mundo fechado → rebaixamento em lista imutável de edições → emissão que preserva linhas, source map v3, ajudantes
`$gs_*` só se usados) e `@goiasscript/optimizer` (Terser opcional). Zero dependências de runtime no compilador; acorn só
como oráculo de teste.

**Tech Stack:** Node ≥ 22.12, pnpm 10.31 (corepack), TypeScript 6.0.3, ESLint 10 + typescript-eslint 8.71,
Vitest 5, fast-check 4, Stryker 10, terser 5.51, acorn 8.19 (só teste), dependency-cruiser 18, knip 6, husky 9,
lint-staged 17, commitlint 21, Changesets 3.

**Spec:** `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` (aprovado em 2026-10-14: D1–D13, com P1–P7, P14 e
P17). Executores leem o spec inteiro antes da primeira unidade; cada unidade cita as seções que implementa.

## Global Constraints

- Node `>=22.12` no `engines` dos pacotes publicáveis; toolchain de desenvolvimento exige Node `>=22.22.1` (§8.1).
- `typescript` fixado em `6.0.3` exato (typescript-eslint exige `<6.1.0`); `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly`.
- Versões de dependências fixadas exatas (sem `^`/`~`); conferidas com `npm view` no dia da Fase 1 (ADR-0005).
- Comandos com `corepack pnpm …` (o `pnpm` pode não estar no PATH).
- `@goiasscript/compiler` sem nenhuma dependência de runtime; `language` e `compiler` não importam `node:*` (§5.1).
- Identificadores SEMPRE em inglês, inclusive testes, fixtures e nomes de arquivo internos (`input.gs`, `output.mjs`, `stdout.txt`, `diagnostics.json`, `case.json`, `stdin.txt`); português só em comentários, títulos de teste (`describe`/`it`) e strings vistas pelo usuário; superfície e mensagens em goianês (ADR-0007).
- Comentários R1–R4: só o porquê não óbvio, em português, acima do bloco, ≤ 4 linhas, sem histórico/meta-processo; `TODO(GS-<n>)` exige issue.
- Sem `any`, sem `@ts-ignore`, sem `eslint-disable` sem motivo; sem magic numbers/strings (constantes `as const` em `*.constants.ts` ou nas tabelas); `readonly` por padrão; sem mutação fora de `this.*` de lexer/parser/analisador (ADR-0004).
- Funções < 50 linhas; arquivos alvo ≤ 400 linhas, máximo 800; aninhamento ≤ 4; sem `console` (o CLI escreve por interface de saída).
- TDD em toda unidade: teste falhando (RED, rodado e visto falhar) → implementação mínima (GREEN) → refatoração; cobertura ≥ 80% por pacote e de patch.
- Commits: Conventional Commits em português, minúsculo, escopo do `scope-enum` (language, compiler, optimizer, cli, vscode, playground, engoianador, docs, ci, deps, release), sem ID Jira, **sem trailer de atribuição de IA**; um commit por unidade ao entrar na integração.
- Nunca `git push`, `gh pr create`, alteração de configuração do GitHub ou publicação sem aprovação explícita do dono naquele momento.
- Documentos novos nunca citam onde está o material pessoal do histórico (§9.4).
- Códigos de diagnóstico exatamente os do catálogo da §4.11; API exatamente a da §5.9.

## Review Focus

1. **Arquivo salvo no Windows** (BOM + `\r\n`, ou `\r` isolado): linhas e colunas de diagnóstico, de erro de execução e do source map batem com o editor — testes em U2-02 e U2-09.
2. **Aluno com hábito de JavaScript** (`=`, `==`, `console.log`, `.length`, `;` sobrando, `function`): vários diagnósticos goianos no mesmo arquivo, nunca exceção nem só o primeiro erro — testes em U2-06 e U2-14.
3. **Nome com acento colado de outro editor (NFD)**: `café` NFD e NFC são a mesma variável e a saída sai em NFC — testes em U2-02 e U2-08.
4. **Entrada enorme ou muito aninhada** (`'('.repeat(100000)`, 100 mil espaços, 10 mil linhas): `compile()` não lança nem estoura a pilha e cumpre os tetos — testes em U2-05 e U2-15.
5. **Callback com bloco dentro de chamada ou de coisa, sem `;`** (`lista.pra_cada(x => {⏎ … ⏎})`): instruções separadas corretamente — testes em U0-03 e U2-05.

---

## Como executar este plano

- **Branch de integração:** `v3/integracao`, criada a partir de `docs/goiasscript-3-design` **depois** de U1-00 (a
  reescrita do histórico muda os SHAs; nada de worktree da Fase 1 antes dela). A Fase 0 roda num worktree próprio
  (`v3/fase-0`) cujos commits são rebaseados sobre o histórico reescrito em U1-01.
- **Worktree por unidade:** `git worktree add ../goiasscript-wt/<id> -b v3/<id> v3/integracao`. Estágios da mesma
  unidade compartilham o worktree.
- **Pipeline por tier:** `small` = implementar (TDD) → testar → revisão de código; `medium` = pesquisar → planejar →
  implementar → testar → revisão de spec + revisão de código → correção; `large` = `medium` + revisão final. Toda
  unidade termina com a passada de limpeza ("de-sloppify": remove teste de linguagem/tipo, defesa impossível,
  comentário que narra) e com `corepack pnpm verify` verde.
- **Fila de merge:** rebase em `v3/integracao` → `verify` → fast-forward. Conflito ou teste vermelho = despejo, com o
  contexto (arquivos em conflito, saída do teste) devolvido ao implementador na próxima passada. Máximo de 3 passadas
  por unidade; na terceira falha, parar e chamar o dono.
- **Gate humano por fase:** relatório de fase (unidades, cobertura, riscos), aprovação do dono, e só então push e PR
  `v3/integracao` → `main` (com aprovação explícita). O PR de fase entra por rebase (um commit por unidade; D13).
- `verify` = `typecheck` + `lint` + `rules-scan` + `test` + `depcruise` + `knip` (criado em U1-02; antes disso vale o
  `verify` do spike da Fase 0).

## Mapa de arquivos (estado ao fim do plano 1)

```
spikes/poc-compiler/            Fase 0; removido no gate da Fase 2
  package.json  tsconfig.json  vitest.config.ts  eslint.config.mjs
  src/{lexer.ts,parser.ts,emit.ts,compile.ts,ast.types.ts,token.types.ts,diagnostics.ts,vocabulary.constants.ts}
  tests/{lexer,parser,emit,demos,typical-errors,diagnostics,rfc-0001}.test.ts  tests/support/{parse-helpers,compile-helpers}.ts
  bench/{measure.ts,generate-10k.ts,rfc-tables.ts,js-members.ts}   fixtures/{demos/*.gs,typical-errors/*.gs}
spikes/sandbox/**  spikes/publish/verify-entra.workflow.yml  spikes/checks/{adr-0001,sandbox-doc,publication-doc,gate-report}.test.mjs
docs/
  adr/0001…0011-*.md   rfc/{rfc.md,0001-vocabulario-e-biblioteca.md}   spec/{gramatica.md,o-que-mudou.md,migracao.md,vocabulario.lock.json}
  fase-0/{relatorio-gate.md,spike-sandbox.md,publicacao-extensao.md,horas.md,medicao-poc.json,projecao.json}   fase-2/relatorio-gate.md
packages/language/
  src/index.ts  src/lookup.ts  src/limits.constants.ts
  src/keywords/{keywords.types.ts,keywords.data.ts}
  src/js/{js-reserved.types.ts,js-reserved.data.ts,js-members.generated.ts}
  src/retired/{retired-words.types.ts,retired-words.data.ts}
  src/stdlib/{stdlib.types.ts,stdlib-builders.ts,text.data.ts,list.data.ts,object.data.ts,math.data.ts,number.data.ts,time.data.ts,promise.data.ts,error.data.ts,date.data.ts,io.data.ts,index.ts}
  src/diagnostics/{diagnostics.types.ts,define-diagnostic.ts,lexical.data.ts,syntax.data.ts,names.data.ts,javascript.data.ts,subset.data.ts,library.data.ts,runtime.data.ts,hints.data.ts,tools.data.ts,index.ts}
  generators/{generators.types.ts,lib-root.d.ts,run.ts,js-members.ts,textmate.ts,monarch.ts,snippets.ts,reference.ts,cli-help.ts,glossary.ts,completions.ts,retired-page.ts,vocabulary-lock.ts,error-phrases.ts}
  generated/  (saídas versionadas; CI exige diff vazio)
  tests/{integrity.test.ts,lookup.test.ts,generators.test.ts}
packages/compiler/
  src/index.ts  src/api.types.ts  src/compile.ts  src/explain.ts
  src/source/{source.types.ts,source-text.ts,line-table.ts,position-convert.ts,identifier-alphabet.ts}
  src/lexer/{lexer.ts,token.types.ts,scan-word.ts,scan-number.ts,scan-string.ts,scan-template.ts,scan-trivia.ts,scan-punctuator.ts,rescan-regex.ts}
  src/ast/{ast.types.ts,walk.ts}
  src/parser/{parser.ts,parser-state.ts,newline-context.ts,precedence.constants.ts,expressions.ts,statements.ts,declarations.ts,classes.ts,recovery.ts,subset-checks.ts}
  src/analyzer/{analyzer.ts,scope.ts,library-scope.ts,member-census.ts,name-checks.ts,javascript-checks.ts,library-checks.ts,control-checks.ts,hint-checks.ts,session.ts}
  src/lowering/{edit.types.ts,lower.ts,keyword-edits.ts,library-edits.ts,macro-edits.ts,await-edits.ts,terminator-edits.ts,nfc-edits.ts,token-separation.ts,apply-edits.ts}
  src/helpers/{helper-sources.ts,emit-helpers.ts}
  src/targets/{module-target.ts,repl-target.ts,playground-target.ts,loop-guard.ts}
  src/sourcemap/{vlq.ts,source-map.ts}
  src/diagnostics/{report.ts,format-message.ts}
  src/runtime-errors/{translate.ts,stack-frames.ts,classify.ts}
  tests/unit/**  tests/conformance/<id>/{input.gs,output.mjs,stdout.txt,diagnostics.json,case.json?,stdin.txt?}
  tests/{conformance,conformance-groups,budgets,stryker-config}.test.ts  tests/audit-moved.json  tests/properties/**  tests/oracle/**
  tests/support/{conformance.types.ts,analyze.ts,lower.ts,lex.ts,parse.ts,sexp.ts,run-module.ts,seed-determinism.mjs,list-expected-fail.ts,gs-printer.ts,arbitraries.ts}
  bench/{budgets.ts,budgets.json}   stryker.config.mjs
packages/optimizer/
  src/{index.ts,optimize.ts}  tests/{optimize.test.ts,differential.test.ts}
tools/rules-scan/
  package.json  src/**  scope.json  policy.json  baseline.json  dictionaries.lock.json  fixtures/**  tests/**  (spikes/poc-compiler fica em `excluded` até o gate da Fase 2)
tsconfig.base.json  tsconfig.json  vitest.config.mts  .npmrc  eslint.config.mjs  .dependency-cruiser.cjs  knip.json  commitlint.config.mjs  .lintstagedrc.mjs
.husky/{commit-msg,pre-commit,pre-push}  .github/{rulesets/*.json,workflows/*.yml,pull_request_template.md,dependabot.yml,ISSUE_TEMPLATE/*,copilot-instructions.md}
CLAUDE.md  .gitignore  .gitattributes  .mailmap  .changeset/config.json
scripts/**  (bless, import-audit-cases, pr-body, check-pr-body, agent-docs, check-agent-docs)   tools/config-tests/**
```

## Grafo de unidades

| id | Unidade | depende de | tier | spec |
|---|---|---|---|---|
| U0-00 | ADR-0001 com os limites a priori, gravado antes de medir | — | small | §10.1 F0, §9.2 |
| U0-01 | Esqueleto do spike `spikes/poc-compiler` (TS, Vitest, ESLint provisório, `verify`) | U0-00 | small | §10.1 F0 |
| U0-02 | Lexer do PoC (subconjunto) | U0-01 | medium | §5.3 |
| U0-03 | Parser do PoC (instruções + Pratt, §4.6, vários diagnósticos) | U0-02 | large | §4.6, §5.4 |
| U0-04 | Emissão por edições do PoC (keywords, `;`, apelidos usados pelos demos) | U0-03 | medium | §5.7 |
| U0-05 | Demos, 10 erros típicos, oráculo acorn e medição (linhas, brotli, 10 mil linhas) | U0-04 | medium | §10.1 F0 |
| U0-06 | Spike do sandbox do playground | U0-01 | medium | §6.3, §5.7 |
| U0-07 | Decisão do método de publicação da extensão (sem PAT) | — | small | §6.5, ADR-0009 |
| U0-08 | Rascunho da RFC-0001 (inclui as lacunas obrigatórias da §4.9) + `docs/spec/gramatica.md` | U0-03 | large | §4, §9.3 |
| U0-09 | Relatório do gate da Fase 0 + extrapolação | U0-05, U0-06, U0-07, U0-08 | small | §10.1 F0 |
| **GATE 0** | Dono aprova a RFC-0001 (P8–P13, P15, P16 e as lacunas) e o relatório; se critério técnico falhar, decide (sem plano B automático) | | | |
| U1-00 | Reescrita do histórico público (D11) + tag `legacy/1.5` + limpeza de branches (**[dono]** em cada passo destrutivo) | GATE 0 | small | §9.4, ADR-0011 |
| U1-01 | Branch de integração; `.gitignore`, `.gitattributes`, `.mailmap` | U1-00 | trivial | §9.4 |
| U1-02 | Fundação do workspace: `tsconfig.base.json`, pacotes `language`/`compiler`/`optimizer` vazios, Vitest com cobertura, `verify` | U1-01 | medium | §5.1, §8.1 |
| U1-03 | ESLint estrito com a matriz da §8.1 e teste de configuração por linha; dependency-cruiser; knip | U1-02 | medium | §8.1 |
| U1-04 | Porte do scanner para `tools/rules-scan` (R14 com selftest, R09–R13, política e baseline) | U1-02 | large | §8.1.1 |
| U1-05 | Hooks e commits: husky, lint-staged, commitlint com regras locais do ADR-0008 | U1-02 | small | ADR-0008 |
| U1-06 | CI: workflows, matriz, jobs obrigatórios, job semanal, Dependabot, CodeQL, OSV, cobertura de patch, template de PR | U1-03, U1-04, U1-05 | medium | §8.3 |
| U1-07 | Proteção da `main` e configuração do repositório (ruleset versionado; aplicação **[dono]**) | U1-06 | small | §8.3, ADR-0011 |
| U1-08 | `CLAUDE.md` e `copilot-instructions.md` verdadeiros + item 7 do gate de promessas | U1-02 | small | §9.4, §8.5 |
| U1-09 | ADRs 0001–0011, template de RFC, esqueleto de `docs/spec` | U1-01 | small | §9.2, §9.3 |
| U1-10 | Corpus de conformidade: executor de goldens, sentinela `expected-fail`, `pnpm bless`, importação e triagem dos 173 casos | U1-02 | large | §8.2 |
| **GATE 1** | Código novo nasce dentro dos gates (§10.1 F1) | | | |
| U2-01 | `@goiasscript/language`: tabelas (keywords, jsReserved, jsMembers gerado, retiredWords, stdlib, limits) + integridade | GATE 1 | large | §5.2, §4.2–§4.9 |
| U2-02 | Fonte e posições: tabela de linhas, terminadores, BOM, conversões, alfabeto (P5) e NFC | GATE 1 | medium | §5.3, §4.3 |
| U2-03 | Catálogo de diagnósticos (todas as faixas, dois tons) + `explainDiagnostic` | U2-01 | medium | §4.11 |
| U2-04 | Lexer completo | U2-01, U2-02, U2-03 | large | §5.3 |
| U2-05 | AST + parser: instruções, Pratt, §4.6, recuperação, limite de profundidade, `incomplete` | U2-04 | large | §4.5–§4.7, §5.4, §5.5 |
| U2-06 | Parser: diagnósticos de subconjunto e de JavaScript (GS02xx, GS0401, GS0404, GS05xx), regex/template, `vixe`, P6, P7, P12 | U2-05 | large | §4.7, §4.8, §5.4 |
| U2-07 | Análise: escopos, escopo da biblioteca (P4), GS03xx, GS04xx de nomes, censo de membros (P1), reserva (P3), GS06xx, GS08xx, sessão do REPL (P14) | U2-06 | large | §5.6 |
| U2-08 | Rebaixamento e emissão: edições, ordem, separação de tokens, NFC, `await`, macros, ajudantes `$gs_*`, alvos `module`/`repl`/`playground`, trava de laço | U2-07 | large | §5.7 |
| U2-09 | Source map v3 por token, `helperRange`, `ignoreList` | U2-08 | medium | §5.7, §5.3 |
| U2-10 | API pública `compile()` (GS0901), tipos da §5.9 (consome o `explainDiagnostic` da U2-03) | U2-09 | medium | §5.9 |
| U2-11 | Tradução de erros de execução e frases de `.mensagem` | U2-10 | medium | §5.10 |
| U2-12 | Geradores de `@goiasscript/language` com diff vazio no CI | U2-03 | medium | §5.2 |
| U2-13 | `@goiasscript/optimizer` (Terser, mapa composto, diferencial) | U2-10 | small | §5.8 |
| U2-14 | Corpus verde: grupos da §8.2, 173 casos resolvidos, propriedades fast-check, paridade de reservadas | U2-10, U2-11, U2-13 | large | §8.2 |
| U2-15 | Mutação (Stryker), orçamentos (tetos absolutos e catracas) e relatório do gate da Fase 2; remoção do spike | U2-14, U2-12 | medium | §5.11, §8.2, §8.4 |
| **GATE 2** | `compile()` estável; corpus verde; catracas e limiar de mutação fixados | | | |

Camadas paralelas: {U0-02, U0-06, U0-07} · {U0-03…U0-05, U0-08} · {U1-03, U1-04, U1-05, U1-08, U1-09, U1-10} ·
{U2-01, U2-02} · {U2-03} · {U2-04, U2-12} · {U2-11, U2-13} depois de U2-10.

## Interfaces compartilhadas (contrato entre unidades)

```ts
// packages/language/src/keywords/keywords.types.ts
export type KeywordClass = 'reserved' | 'contextual';
export type KeywordCategory = 'declaration' | 'assignment' | 'function' | 'control' | 'class' | 'error' | 'literal' | 'operator';
export interface KeywordEntry {
  readonly spelling: string;          // grafia oficial NFC, ex. 'se_ocê_quiser'
  readonly asciiSpelling?: string;    // variante sem acento, ex. 'se_oce_quiser' (ausente em 'é')
  readonly js: string;                // token JS emitido, ex. 'if'
  readonly keywordClass: KeywordClass;
  readonly category: KeywordCategory;
  readonly since: string;             // '3.0.0'
  readonly deprecatedIn?: string;
}

// packages/language/src/js/js-reserved.types.ts
export type JsReservedKind = 'keyword' | 'strict-reserved' | 'non-bindable' | 'global';
export interface JsReservedEntry { readonly name: string; readonly kind: JsReservedKind; readonly suggestion: string; readonly hasEquivalent: boolean }
export interface JsMemberEntry { readonly name: string; readonly equivalent?: string } // nome equivalente na stdlib

// packages/language/src/retired/retired-words.types.ts
export interface RetiredWord { readonly word: string; readonly replacement?: string; readonly note: string }

// packages/language/src/stdlib/stdlib.types.ts
export type StdlibReceiver = 'global' | 'text' | 'list' | 'textOrList' | 'number' | 'object' | 'promise' | 'error' | 'date' | 'namespace';
export type StdlibKind = 'rename' | 'property' | 'static' | 'global' | 'macro' | 'helper';
export type StdlibSemantics = 'native' | 'didactic';
export type StdlibForm = 'property' | 'method';      // como o aluno escreve: x.nome ou x.nome(…); decide GS0601/GS0603
export type StdlibOrigin = 'owner' | '1.5' | 'proposal';
export interface Arity { readonly min: number; readonly max?: number }
export interface StdlibEntry {
  readonly name: string;              // NFC, ex. 'mapear', 'Conta.maior', 'prosa'
  readonly asciiName?: string;
  readonly receiver: StdlibReceiver;
  readonly kind: StdlibKind;
  readonly js: string;                // 'map', 'Math.max', 'console.log', 'length'
  readonly semantics: StdlibSemantics;
  readonly form?: StdlibForm;         // obrigatório quando receiver não é 'global'
  readonly origin: StdlibOrigin;
  readonly arity: Arity;              // propriedades: { min: 0, max: 0 }
  readonly helperName?: string;       // obrigatório quando kind === 'helper'
  readonly alternatives?: readonly string[]; // sugestões para GS0601
  readonly since: string;
  readonly deprecatedIn?: string;
}

// packages/language/src/diagnostics/diagnostics.types.ts
export type DiagnosticSeverity = 'error' | 'warning';
export type ToneKey = 'raiz' | 'neutro';
export interface DiagnosticDefinition {
  readonly code: string;              // 'GS0301'
  readonly severity: DiagnosticSeverity;
  readonly title: string;             // título curto em português
  readonly messages: Readonly<Record<ToneKey, string>>; // frase inteira; marcadores {name}, {suggestion}…
  readonly help?: Readonly<Record<ToneKey, string>>;
  readonly lesson?: string;           // id da lição da cartilha
  readonly example: string;           // trecho .gs que dispara o diagnóstico (usado pelo corpus)
  readonly since: string;
}

// packages/language/src/limits.constants.ts
export const LIMITS = { maxNestingDepth: 200 } as const;

// packages/language/src/lookup.ts
export function lookupKeyword(nfcSpelling: string): KeywordEntry | undefined;
export function lookupJsReserved(name: string): JsReservedEntry | undefined;
export function lookupJsMember(name: string): JsMemberEntry | undefined;
export function lookupStdlibMember(name: string): readonly StdlibEntry[];   // membros de instância com esse nome
export function lookupStdlibGlobal(name: string): StdlibEntry | undefined;  // globais e namespaces
export function lookupStdlibStatic(namespace: string, member: string): StdlibEntry | undefined;
export function lookupRetiredWord(word: string): RetiredWord | undefined;
export function lookupDiagnostic(code: string): DiagnosticDefinition | undefined;   // catálogo da U2-03
// Mensagens: marcador {nome}; trecho [[ … ]] some se faltar um marcador interno; marcador sem valor vira «nome».
// Erros de execução: GS0710 TypeError, GS0711 ReferenceError, GS0712 RangeError, GS0713 SyntaxError, GS0714 outro
// (classificação por name, nunca por error.message). GS05xx: numeração da U2-03 até a RFC-0001 renumerar.

// packages/compiler/src/api.types.ts — exatamente a API da §5.9 do spec. Nasce na U2-02 (SourcePosition, SourceRange,
// LineRange, Tone, Severity, CompileTarget, BindingKind, SessionBinding, ReplSession); a U2-03 acrescenta
// DiagnosticExplanation; a U2-10 completa (CompileOptions, CompileResult, Diagnostic, SourceMapV3…).

// packages/compiler/src/explain.ts e src/diagnostics/format-message.ts (U2-03)
export function explainDiagnostic(code: string, tone?: Tone): DiagnosticExplanation | null;
export function formatMessage(template: string, args: Readonly<Record<string, string>>): string;

// packages/compiler/src/source/*
// source.types.ts; com BOM no início, lineStarts[0] = 1 (o BOM nunca ocupa coluna)
export interface SourceText { readonly text: string; readonly fileName: string; readonly lineStarts: readonly number[] }
export function createSourceText(text: string, fileName: string): SourceText;
export function positionAt(source: SourceText, offset: number): SourcePosition;           // line/column base 1
export function rangeOf(source: SourceText, start: number, end: number): SourceRange;
export function offsetAt(source: SourceText, line: number, column: number): number;      // inversa de positionAt
export function canonicalName(text: string): string;                                     // NFC
export function isValidName(nfcName: string): boolean;                                   // alfabeto P5
export function toLspPosition(position: SourcePosition): { readonly line: number; readonly character: number };
export function toMappingPosition(position: SourcePosition): { readonly line: number; readonly column: number }; // base 0
export function isIdentifierStart(codePoint: number): boolean;   // alfabeto P5
export function isIdentifierPart(codePoint: number): boolean;
export function isCombiningMark(codePoint: number): boolean;     // U+0300–U+036F

// packages/compiler/src/lexer/token.types.ts
export type NumberForm = 'decimal' | 'hex' | 'binary' | 'octal' | 'bigint' | 'separator'; // não decimal dá GS0517
export type TokenKind = 'keyword' | 'identifier' | 'number' | 'string' | 'template' | 'punctuator' | 'newline' | 'end-of-file' | 'invalid';
export interface Token {
  readonly kind: TokenKind;
  readonly start: number; readonly end: number;     // offsets UTF-16 no texto original
  readonly text: string;                            // texto original
  readonly value: string;                           // NFC para palavras; valor decodificado para textos
  readonly keyword?: KeywordEntry;                  // quando kind === 'keyword'
  readonly numberForm?: NumberForm;                 // quando kind === 'number'
  readonly precededByNewline: boolean;
  readonly leadingTrivia: readonly Trivia[];
}
export interface Trivia { readonly kind: 'whitespace' | 'line-comment' | 'block-comment' | 'bom'; readonly start: number; readonly end: number; readonly containsNewline: boolean }
// No máximo um token 'newline' entre dois tokens; rescanAsRegex devolve 'invalid' e o parser emite GS0502.
export interface Lexer { next(): Token; peek(offset?: number): Token; rescanAsRegex(token: Token): Token; readonly diagnostics: readonly RawDiagnostic[] }
export interface RawDiagnostic { readonly code: string; readonly start: number; readonly end: number; readonly args: Readonly<Record<string, string>> }
export function createLexer(source: SourceText): Lexer;

// packages/compiler/src/ast/ast.types.ts — união discriminada por `type`, nomes ESTree, todos os campos readonly,
// cada nó com `start`/`end` (offsets) e, quando vem de keyword, `keywordToken?: Token`. Inclui `ErrorNode`.
// Identifier.reservedKeyword?: KeywordEntry (keyword em posição de nome; a análise dá GS0303);
// ThrowStatement.arguments: readonly Expression[] (GS0206 se o total não for 1). ParseResult.diagnostics já traz
// os do lexer, ordenados por start.
export function walk(node: Node, visit: (node: Node) => void): void;   // ast/walk.ts, pré-ordem, sem mutar
export interface ParseResult { readonly program: Program; readonly diagnostics: readonly RawDiagnostic[]; readonly incomplete: boolean }
export function parse(source: SourceText, lexer: Lexer, options: { readonly target: CompileTarget }): ParseResult;

// packages/compiler/src/analyzer/analyzer.ts
export interface Resolution { readonly kind: 'library' | 'program' | 'session' | 'unresolved'; readonly entry?: StdlibEntry }
export interface AnalysisResult {
  readonly diagnostics: readonly RawDiagnostic[];
  readonly resolutionOf: (node: Identifier | MemberExpression) => Resolution;
  readonly declaredMembers: ReadonlySet<string>;     // censo D
  readonly topLevelBindings: readonly SessionBinding[];
  readonly rethrowStatements: ReadonlySet<ThrowStatement>; // vixe(erro) que relança (vixe é ThrowStatement)
  readonly hasTopLevelAwait: boolean;                 // alvo repl: envolve em (async () => { … })()
  readonly lastTopLevelExpression?: ExpressionStatement; // alvo repl: recebe o return do eco
}
export function analyze(program: Program, source: SourceText, options: { readonly target: CompileTarget; readonly session?: ReplSession }): AnalysisResult;

// packages/compiler/src/lowering/edit.types.ts
export interface Edit { readonly start: number; readonly end: number; readonly text: string; readonly order: number }
export interface LoweringResult { readonly edits: readonly Edit[]; readonly helpers: readonly string[] /* helperName */ }
export function lower(program: Program, analysis: AnalysisResult, source: SourceText, options: { readonly target: CompileTarget; readonly loopLimit?: number; readonly session?: ReplSession }): LoweringResult;
export function applyEdits(source: SourceText, edits: readonly Edit[]): { readonly code: string; readonly segments: readonly MappingSegment[] };
export interface MappingSegment {
  readonly generatedOffset: number; readonly originalOffset: number | null;
  readonly length: number; readonly kind: 'copy' | 'replace' | 'insert';  // o mapa por token expande 'copy' por palavra
}

// packages/compiler/src/targets/module-target.ts — ponto único que encadeia lower, applyEdits e os ajudantes
export function emitProgram(program: Program, analysis: AnalysisResult, source: SourceText, options: { readonly target: CompileTarget; readonly loopLimit?: number; readonly session?: ReplSession }): { readonly code: string; readonly segments: readonly MappingSegment[]; readonly helperRange: LineRange | null; readonly helpers: readonly string[] };

// packages/compiler/src/sourcemap/source-map.ts
export function buildSourceMap(source: SourceText, generatedCode: string, segments: readonly MappingSegment[]): SourceMapV3; // ajudantes nascem sem segmento
// SourceMapV3 em sourcemap/source-map.types.ts (U2-09); a U2-10 reexporta

// packages/compiler/tests/support/conformance.types.ts (U1-10): CaseConfig, ExpectedDiagnostic, CompileFunction
// (subconjunto estrutural de CompileResult) e ExecuteFunction, consumidos por U2-10 e U2-14.

// packages/compiler/src/diagnostics/report.ts
export function toDiagnostic(raw: RawDiagnostic, source: SourceText, tone: Tone): Diagnostic;   // ordena por posição quem chama
```

Os nomes acima são o contrato. Uma unidade que precise mudá-los registra a mudança no próprio commit e atualiza este
bloco no mesmo commit.

---

## Unidades

## Fase 0

### U0-00: ADR-0001 com os limites a priori
**Spec:** §10.1 F0, §9.2 · **Tier:** small · **Depende de:** — · **Risco:** limite escolhido depois de ver o número esvazia o gate · **Rollback:** `git revert` (nada depende dele antes de U0-05)
**Files:** Create `docs/adr/0001-front-end-proprio-a-mao.md` · Test `spikes/checks/adr-0001.test.mjs`
**Interfaces:** Consumes: — · Produces: bloco `json limits` do ADR, lido por `bench/measure.ts` (U0-05) e pelo teste de U0-09
**Aceite:** ADR com os 4 limites, as definições de medição, a fórmula da projeção e "sem plano B automático"; teste verde; este commit é anterior a qualquer commit de `spikes/poc-compiler/bench`

- [ ] **Preparo.** `git branch v3/fase-0 docs/goiasscript-3-design && git worktree add ../goiasscript-wt/U0-00 -b v3/U0-00 v3/fase-0` (só branches locais). Nas outras unidades da Fase 0 troque o id e parta de `v3/fase-0`.
- [ ] **Teste que falha.** `spikes/checks/adr-0001.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const adr = readFileSync(new URL('../../docs/adr/0001-front-end-proprio-a-mao.md', import.meta.url), 'utf8');
const flat = adr.replace(/\s+/g, ' ');
const LIMITS = { maxSourceLines: 1500, maxBrotliBytes: 29696, maxMillisecondsFor10kLines: 150, maxProjectedDays: 28 };

test('o ADR-0001 grava os limites a priori no bloco json', () => {
  const block = /```json limits\n([\s\S]*?)\n```/.exec(adr)?.[1];
  assert.deepEqual(JSON.parse(block ?? 'null'), LIMITS);
});

test('o ADR-0001 define medição, projeção e a regra sem plano B antes de medir', () => {
  for (const text of ['Node 24', 'mediana de 20 execuções depois de 2 de aquecimento', 'brotli', '× 1,3', 'não existe plano B automático', '**Status:** proposto']) {
    assert.ok(flat.includes(text), text);
  }
});
```

- [ ] **RED.** `node --test spikes/checks/adr-0001.test.mjs` → `ENOENT: no such file or directory, open '…/docs/adr/0001-front-end-proprio-a-mao.md'`.
- [ ] **Implementar.** Criar o ADR (29.696 bytes = 29 KB):

````markdown
# ADR-0001: Front-end próprio, escrito à mão

- **Status:** proposto; o dono confirma os limites ao aprovar o plano 1 (spec §10.3).
- **Origem:** D4 (lexer e parser próprios, emissão por edições; acorn só como oráculo de teste).
- **Confirmação (CI):** zero dependências de runtime em `@goiasscript/compiler` (spec §8.5.5).

## Decisão

O custo de um front-end escrito à mão só se conhece com um protótipo. A Fase 0 mede um PoC contra limites fixados antes
da medição. Se um critério técnico do gate falhar, o trabalho para e a decisão volta ao dono: não existe plano B automático.

## Limites a priori

Gravados antes de qualquer medição e nunca renegociados depois dela. Node 24; mediana de 20 execuções depois de 2 de aquecimento.

```json limits
{ "maxSourceLines": 1500, "maxBrotliBytes": 29696, "maxMillisecondsFor10kLines": 150, "maxProjectedDays": 28 }
```

| Critério | Limite | Definição exata |
|---|---|---|
| Linhas | 1.500 | Linhas não vazias de `spikes/poc-compiler/src/**/*.ts`, sem `vocabulary.constants.ts` (substituto do pacote `language`). Comentários contam; testes e `bench/` ficam de fora. |
| Tamanho | 29 KB em brotli | `esbuild` empacota `src/compile.ts` (ESM, `platform: 'browser'`, `minify`, tabelas dentro); brotli qualidade 11 (`node:zlib`). |
| Tempo | 150 ms | `compile()` do programa gerado de 10.000 linhas (`bench/generate-10k.ts`), sem erro; a CPU vai no relatório. |
| Projeção | 28 dias | Fórmula abaixo: 22 dias do núcleo mais 6 de folga (spec §10.1). |

**Projeção da Fase 2.** `projeção = (L_fase2 / P) × 1,3`:
- `P` = (`sourceLines` + `tableLines`) ÷ dias de U0-02 a U0-05, em blocos de 6 horas registradas em `docs/fase-0/horas.md`;
- `L_fase2` = soma, por unidade U2-01 a U2-15, das linhas estimadas de `src/` final (código, tabelas, catálogo e geradores,
  sem testes), cada uma justificada contra o que o PoC não tem;
- `1,3` = acréscimo fixo para revisão, mutação e corpus do pipeline de unidades (D12).

Depois da medição, o ADR ganha a seção "Resultado da Fase 0"; se o gate falhar, o relatório leva ao dono o critério e as
opções do spec §10.1 (estender o prazo, reduzir o subconjunto ou acionar o plano B, que reabre D4).
````
- [ ] **GREEN e limpeza.** o mesmo comando → 2 testes passam; o ADR não tem histórico de desenvolvimento nem caminho de máquina.
- [ ] **Commit.** `git add docs/adr spikes/checks && git commit -m "docs(docs): registra adr-0001 com os limites da fase 0 antes da medição"`. Fila de merge do orquestrador: rebase em `v3/fase-0`, verificação, fast-forward.

### U0-01: Esqueleto do spike `spikes/poc-compiler`
**Spec:** §10.1 F0 · **Tier:** small · **Depende de:** U0-00 · **Risco:** o workspace mexe no `pnpm-lock.yaml` legado e as versões do esqueleto podem ter mudado · **Rollback:** `git revert`
**Files:** Create `spikes/poc-compiler/{package.json,tsconfig.json,vitest.config.ts,eslint.config.mjs}`, `src/{token.types.ts,diagnostics.ts}` · Modify `pnpm-workspace.yaml`, `pnpm-lock.yaml` · Test `spikes/poc-compiler/tests/diagnostics.test.ts`
**Interfaces:** Consumes: — · Produces: `Token`, `TokenKind`, `KeywordInfo`, `Lexer`, `RawDiagnostic`, `SourcePosition`, `Diagnostic`; `createLineTable`, `positionAt` (base 1, UTF-16, BOM fora da coluna), `toDiagnostic`. O spike troca o `SourceText` do contrato por `string` + `LineTable` e não tem catálogo de frases
**Aceite:** `corepack pnpm verify` (`tsc --noEmit`, ESLint provisório só com avisos, Vitest) verde; `typescript` 6.0.3 exato

- [ ] **Preparo.** Worktree `U0-01`. Conferir as versões no dia (`for p in typescript@6.0.3 vitest@5 eslint@10 typescript-eslint@8.71 eslint-plugin-functional@10 acorn@8.19 esbuild; do npm view $p version | tail -1; done`); troca de versão vai no corpo do commit.
- [ ] **Configuração** (infraestrutura, sem TDD). Em `pnpm-workspace.yaml` acrescentar `  - 'spikes/*'`. Em `spikes/poc-compiler/`:

`package.json`
```json
{
  "name": "poc-compiler", "version": "0.0.0", "private": true, "type": "module",
  "scripts": {
    "verify": "tsc --noEmit && eslint src bench tests && vitest run",
    "test": "vitest run", "lint": "eslint src bench tests", "measure": "node bench/measure.ts"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1", "@types/node": "24.19.2", "acorn": "8.19.0", "esbuild": "0.28.2", "eslint": "10.13.0",
    "eslint-plugin-functional": "10.0.1", "typescript": "6.0.3", "typescript-eslint": "8.71.2", "vitest": "5.0.5"
  }
}
```
`tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2023", "lib": ["ES2023"], "module": "nodenext", "moduleResolution": "nodenext", "types": ["node"],
    "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true, "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true, "allowImportingTsExtensions": true, "noEmit": true, "skipLibCheck": true
  },
  "include": ["src", "tests", "bench", "vitest.config.ts", "eslint.config.mjs"]
}
```
`vitest.config.ts`
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'], testTimeout: 20_000 } });
```
`eslint.config.mjs` (tamanho e profundidade só avisam, para serem contados em U0-05; `this.**` é a exceção do ADR-0004)
```js
import functional from 'eslint-plugin-functional';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { files: ['**/*.ts'], languageOptions: { parser: tseslint.parser, parserOptions: { projectService: true } } },
  {
    files: ['**/*.ts'],
    plugins: { functional },
    rules: {
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 4],
      'functional/immutable-data': 'warn',
    },
  },
  { files: ['src/lexer.ts', 'src/parser.ts'], rules: { 'functional/immutable-data': ['warn', { ignoreAccessorPattern: ['this.**'] }] } },
);
```
Rodar `corepack pnpm install --filter poc-compiler --ignore-scripts`.
- [ ] **Teste que falha.** `tests/diagnostics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createLineTable, positionAt, toDiagnostic } from '../src/diagnostics.ts';

describe('tabela de linhas', () => {
  it('conta \\n, \\r\\n e \\r isolado como uma quebra cada', () => {
    expect(createLineTable('a\nb\r\nc\rd').lineStarts).toEqual([0, 2, 5, 7]);
  });

  it('devolve linha e coluna base 1 em unidades UTF-16', () => {
    const table = createLineTable('uai x\n😀 y');
    expect(positionAt(table, 4)).toEqual({ offset: 4, line: 1, column: 5 });
    expect(positionAt(table, 9)).toEqual({ offset: 9, line: 2, column: 4 });
  });

  it('ignora o BOM na coluna e, com \\r\\n, dá as mesmas linhas que \\n sem BOM', () => {
    expect(positionAt(createLineTable('﻿uai x'), 1)).toEqual({ offset: 1, line: 1, column: 1 });
    expect(positionAt(createLineTable('﻿a\r\nb\r\nc'), 7).line).toBe(positionAt(createLineTable('a\nb\nc'), 4).line);
  });

  it('monta o Diagnostic com a posição do início', () => {
    const raw = { code: 'GS0401', start: 6, end: 11, args: { word: 'const' } };
    expect(toDiagnostic(raw, createLineTable('uai x\nconst y'))).toEqual({ code: 'GS0401', severity: 'error', line: 2, column: 1, args: { word: 'const' } });
  });
});
```
- [ ] **RED.** `cd spikes/poc-compiler && corepack pnpm exec vitest run tests/diagnostics.test.ts` → `Error: Cannot find module '../src/diagnostics.ts'`.
- [ ] **Implementar.** `src/token.types.ts` e `src/diagnostics.ts`:

```ts
export type KeywordClass = 'reserved' | 'contextual';
export interface KeywordInfo { readonly spelling: string; readonly js: string; readonly keywordClass: KeywordClass }

export type TokenKind = 'keyword' | 'identifier' | 'number' | 'string' | 'template' | 'punctuator' | 'newline' | 'end-of-file' | 'invalid';
export interface Token {
  readonly kind: TokenKind; readonly start: number; readonly end: number; readonly text: string; readonly value: string;
  readonly keyword?: KeywordInfo; readonly precededByNewline: boolean;
}

export interface RawDiagnostic { readonly code: string; readonly start: number; readonly end: number; readonly args: Readonly<Record<string, string>> }
export interface Lexer { next(): Token; peek(offset?: number): Token; readonly diagnostics: readonly RawDiagnostic[] }

export interface SourcePosition { readonly offset: number; readonly line: number; readonly column: number }
export interface Diagnostic { readonly code: string; readonly severity: 'error' | 'warning'; readonly line: number; readonly column: number; readonly args: Readonly<Record<string, string>> }
```
```ts
import type { Diagnostic, RawDiagnostic, SourcePosition } from './token.types.ts';

const BOM = '﻿';

export interface LineTable { readonly lineStarts: readonly number[]; readonly bomLength: number }

export function createLineTable(text: string): LineTable {
  const lineStarts = [0];
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '\r' && text[index + 1] === '\n') index += 1;
    if (char === '\n' || char === '\r') lineStarts.push(index + 1);
  }
  return { lineStarts, bomLength: text.startsWith(BOM) ? BOM.length : 0 };
}

// Busca binária do início da linha; offset, linha e coluna em unidades UTF-16.
export function positionAt(table: LineTable, offset: number): SourcePosition {
  let low = 0;
  let high = table.lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((table.lineStarts[middle] ?? 0) <= offset) low = middle;
    else high = middle - 1;
  }
  const bomOffset = low === 0 ? table.bomLength : 0;
  return { offset, line: low + 1, column: offset - (table.lineStarts[low] ?? 0) + 1 - bomOffset };
}

export function toDiagnostic(raw: RawDiagnostic, table: LineTable): Diagnostic {
  const { line, column } = positionAt(table, raw.start);
  return { code: raw.code, severity: 'error', line, column, args: raw.args };
}
```
- [ ] **GREEN e verify.** o mesmo comando → 4 testes passam; `corepack pnpm verify` → `tsc` e ESLint sem erro (avisos de `functional/immutable-data` em arrays locais são esperados e contados em U0-05) e Vitest verde.
- [ ] **Commit.** `git add pnpm-workspace.yaml pnpm-lock.yaml spikes/poc-compiler && git commit -m "chore(compiler): cria o esqueleto do spike poc-compiler"`.

### U0-02: Lexer do PoC
**Spec:** §5.3, §4.3 · **Tier:** medium · **Depende de:** U0-01 · **Risco:** lookahead grande vira custo quadrático (`Array.shift` com 100 mil tokens à frente levou o teste de aninhamento a 11 s) · **Rollback:** `git revert`; U0-03 em diante dependem dele
**Files:** Create `spikes/poc-compiler/src/{vocabulary.constants.ts,lexer.ts}`, `docs/fase-0/horas.md` · Test `spikes/poc-compiler/tests/lexer.test.ts`
**Interfaces:** Consumes: `Token`, `Lexer`, `RawDiagnostic`, `KeywordInfo` (U0-01) · Produces: `createLexer(text: string): Lexer` (o contrato usa `SourceText`); `KEYWORDS` (grafia NFC e variante sem acento apontam para a mesma entrada), `IDENTIFIER_PATTERN`, `PUNCTUATORS`
**Aceite:** nunca lança; um `Newline` por `\n`, `\r\n` ou `\r`; comentário de bloco com quebra vira `Newline`; nomes em NFC com offsets do texto original; GS0101, GS0103, GS0104, GS0106, GS0107; `peek` não consome; sem `Array.shift`

- [ ] **Preparo.** Worktree `U0-02`; `corepack pnpm install --filter poc-compiler --ignore-scripts`. Criar `docs/fase-0/horas.md` com `| Unidade | Horas |` e `|---|---|`; ao fechar cada unidade de U0-02 a U0-05 acrescentar `| U0-02 | 2,5 h |` com o tempo real (insumo do ADR-0001).
- [ ] **Ciclo 1, testes que falham (palavras, quebras, comentários).** `tests/lexer.test.ts`, começando por:

```ts
import { describe, expect, it } from 'vitest';
import { createLexer } from '../src/lexer.ts';
import type { Token } from '../src/token.types.ts';

function scanAll(text: string): { tokens: Token[]; codes: string[] } {
  const lexer = createLexer(text);
  const tokens: Token[] = [];
  for (let token = lexer.next(); token.kind !== 'end-of-file'; token = lexer.next()) tokens.push(token);
  return { tokens, codes: lexer.diagnostics.map((diagnostic) => diagnostic.code) };
}

const kinds = (text: string): string[] => scanAll(text).tokens.map((token) => token.kind);

describe('palavras', () => {
  it('separa keyword de identificador, marca a classe e aceita a variante sem acento', () => {
    const [uai, nome, de, plain, accented] = scanAll('uai nome de se_oce_quiser se_ocê_quiser').tokens;
    expect([uai?.keyword?.keywordClass, nome?.kind, de?.keyword?.keywordClass]).toEqual(['reserved', 'identifier', 'contextual']);
    expect(plain?.keyword).toBe(accented?.keyword);
  });

  it('normaliza para NFC mantendo texto e offsets originais; BOM não conta', () => {
    const { tokens } = scanAll('﻿se_não café é');
    expect(tokens.map((t) => [t.kind, t.value])).toEqual([['keyword', 'se_não'], ['identifier', 'café'], ['keyword', 'é']]);
    expect(tokens[1]).toMatchObject({ start: 9, end: 14, text: 'café' });
  });

  it('aceita ç e acentos; $, emoji e outro alfabeto dão GS0104; @ dá GS0107', () => {
    expect(scanAll('preço ação').codes).toEqual([]);
    expect(['$x', '😀', 'α', '@'].map((text) => scanAll(text).codes)).toEqual([['GS0104'], ['GS0104'], ['GS0104'], ['GS0107']]);
  });
});

describe('quebras de linha e comentários', () => {
  it('um Newline por \\n, \\r\\n ou \\r; comentário de linha e de bloco sem quebra somem', () => {
    expect(kinds('a\nb\r\nc\rd')).toEqual(['identifier', 'newline', 'identifier', 'newline', 'identifier', 'newline', 'identifier']);
    expect(kinds('a // x\nb /* y */ c')).toEqual(['identifier', 'newline', 'identifier', 'identifier']);
  });

  it('comentário de bloco com quebra vira Newline; sem fechar dá GS0106', () => {
    expect(kinds('a /* x\ny */ b')).toEqual(['identifier', 'newline', 'identifier']);
    expect(scanAll('a /* x').codes).toEqual(['GS0106']);
  });
});
```
- [ ] **RED.** `corepack pnpm exec vitest run tests/lexer.test.ts` → `Error: Cannot find module '../src/lexer.ts'`.
- [ ] **Implementar o ciclo 1.** `src/vocabulary.constants.ts` (a §4.2 como dados; a variante sem acento é entrada explícita, nunca dobra de acento; só estas exportações por enquanto):

```ts
import type { KeywordInfo } from './token.types.ts';

type KeywordRow = readonly [spelling: string, js: string, contextual?: boolean, asciiSpelling?: string];

const KEYWORD_ROWS: readonly KeywordRow[] = [
  ['uai', 'const'], ['trem', 'let'], ['é', '='], ['faz_trem', 'function'], ['faz_favor', 'return'],
  ['vai_na_frente', 'async'], ['vai_na_frente_faz_trem', 'async function'], ['espera_um_cadim', 'await'],
  ['se_ocê_quiser', 'if', false, 'se_oce_quiser'], ['se_num_for', 'else if'], ['se_não', 'else', false, 'se_nao'],
  ['vai_indo', 'for'], ['enquanto_tiver', 'while'], ['para_com_isso', 'break'], ['continua_aí', 'continue', false, 'continua_ai'],
  ['de', 'of', true], ['em', 'in', true], ['arruma_trem', 'class'], ['inherda_de', 'extends'], ['aprepara_trem', 'constructor'],
  ['num_muda', 'static'], ['a_raiz', 'super'], ['ocê', 'this', false, 'oce'], ['faz_um', 'new'],
  ['é_tipo_de', 'instanceof', false, 'e_tipo_de'], ['tenta_aí', 'try', false, 'tenta_ai'], ['se_der_ruim', 'catch'],
  ['por_fim', 'finally'], ['vixe', 'throw'], ['certeza', 'true'], ['de_jeito_nenhum', 'false'], ['nada', 'null'],
  ['indefinido', 'undefined'], ['é_igualim', '===', false, 'e_igualim'], ['diferente', '!=='], ['maior_que', '>'],
  ['menor_que', '<'], ['pelo_menos', '>='], ['no_máximo', '<=', false, 'no_maximo'], ['e_mais', '&&'],
  ['ou_então', '||', false, 'ou_entao'], ['num_é', '!', false, 'num_e'], ['mais', '+'], ['menos', '-'],
  ['vezes', '*'], ['dividido', '/'], ['sobrou', '%'],
];

export const KEYWORDS: ReadonlyMap<string, KeywordInfo> = new Map(
  KEYWORD_ROWS.flatMap(([spelling, js, contextual, ascii]) => {
    const info: KeywordInfo = { spelling, js, keywordClass: contextual ? 'contextual' : 'reserved' };
    return ascii ? [[spelling, info], [ascii, info]] : [[spelling, info]];
  }),
);

export const IDENTIFIER_PATTERN = /^[A-Za-z_áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ][A-Za-z0-9_áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]*$/;

export const PUNCTUATORS: readonly string[] = [
  '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '=>', '?.', '??',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '(', ')', '[', ']', '{', '}', ',', '.', ';', ':', '?',
];
```
`src/lexer.ts`: um padrão sticky (`/y`) por classe de token, mais `class LexerImpl implements Lexer` com `diagnostics`, `buffer`, `head`, `pos` e `lastWasNewline`. `next()` lê `peek()` e avança `head` (zera o buffer ao esvaziar; nada de `Array.shift`); `peek(offset)` escaneia sob demanda; `take(pattern)` posiciona `lastIndex` e avança `pos`; `make(kind, start, value?, keyword?)` monta o `Token` (`value` em NFC nas palavras) e guarda se o token anterior foi `Newline`; `skipTrivia()` consome espaço, `//` e `/* */` e devolve o início de comentário de bloco com quebra (vira `Newline`; sem fechar, `GS0106`); `wordToken` normaliza com `normalize('NFC')`, valida em `IDENTIFIER_PATTERN` (`GS0104`) e consulta `KEYWORDS`; `invalidCharacter` avança um ponto de código (`GS0104` se não ASCII ou `$`, senão `GS0107`); `createLexer(text)` devolve `new LexerImpl(text)`. O BOM no início só avança `pos`. No ciclo 1, `scan()` só tem as ramificações de comentário, newline, fim do arquivo e palavra; as demais entram no ciclo 2. Constantes e `scan()`:

```ts
const SPACE = /[ \t\v\f   -   　]+/y;
const LINE_COMMENT = /\/\/[^\r\n]*/y;
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//y;
const NEWLINE = /\r\n|[\r\n]/y;
const WORD = /[A-Za-z_À-ÿ̀-ͯ][A-Za-z0-9_À-ÿ̀-ͯ]*/y;
const NUMBER = /\d+(?:\.\d+)*(?:[eE][+-]?\d+)?/y;
const STRING = /"(?:\\.|[^"\\\r\n])*"|'(?:\\.|[^'\\\r\n])*'/y;
const TEMPLATE = /`[^`]*(?:`|$)/y;
const LINE_REST = /[^\r\n]*/y;
const PUNCTUATOR = new RegExp(PUNCTUATORS.map((symbol) => symbol.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')).join('|'), 'y');

  private scan(): Token {
    const commentWithNewline = this.skipTrivia();
    if (commentWithNewline !== undefined) return this.make('newline', commentWithNewline);
    const start = this.pos;
    if (this.take(NEWLINE) !== undefined) return this.make('newline', start);
    if (start >= this.text.length) return this.make('end-of-file', start);
    const word = this.take(WORD);
    if (word !== undefined) return this.wordToken(start, word);
    const number = this.take(NUMBER);
    if (number !== undefined) return this.numberToken(start, number);
    if (this.text[start] === '"' || this.text[start] === "'") return this.stringToken(start);
    if (this.take(TEMPLATE) !== undefined) return this.make('template', start);
    if (this.take(PUNCTUATOR) !== undefined) return this.make('punctuator', start);
    return this.invalidCharacter(start);
  }
```
- [ ] **GREEN do ciclo 1.** `corepack pnpm exec vitest run tests/lexer.test.ts -t "palavras|quebras"` → 5 testes passam.
- [ ] **Ciclo 2, testes que falham (números, textos, pontuação, contrato).** Acrescentar ao arquivo:

```ts
describe('números, textos e pontuação', () => {
  it.each(['12', '1.5', '1e3', '2.5e-2'])('aceita o número %s', (text) => {
    expect(scanAll(text)).toMatchObject({ tokens: [{ kind: 'number' }], codes: [] });
  });

  it.each(['08', '01310', '1.000.000'])('número malformado %s dá GS0101 e token invalid', (text) => {
    expect(scanAll(text)).toMatchObject({ tokens: [{ kind: 'invalid' }], codes: ['GS0101'] });
  });

  it('10,50 é número, vírgula e número; o operador mais longo vence e / é sempre divisão', () => {
    expect(kinds('10,50')).toEqual(['number', 'punctuator', 'number']);
    expect(scanAll('=== => && / /=').tokens.map((t) => t.text)).toEqual(['===', '=>', '&&', '/', '/=']);
  });

  it('texto com escape é um token só; sem fechar na linha dá GS0103 e o resto segue', () => {
    expect(scanAll(String.raw`"a\"b" 'c'`).tokens.map((t) => [t.kind, t.value])).toEqual([['string', String.raw`a\"b`], ['string', 'c']]);
    expect(scanAll('"abc\nuai')).toMatchObject({ codes: ['GS0103'], tokens: [{ kind: 'invalid' }, { kind: 'newline' }, { kind: 'keyword' }] });
  });
});

describe('contrato do Lexer', () => {
  it('peek não consome e next devolve end-of-file repetidamente', () => {
    const lexer = createLexer('a b');
    expect(lexer.peek(1).text).toBe('b');
    expect([lexer.next().text, lexer.next().text, lexer.next().kind, lexer.next().kind]).toEqual(['a', 'b', 'end-of-file', 'end-of-file']);
  });

  it('nunca lança com lixo de todo tipo, nem com 100 mil tokens de lookahead', () => {
    const palette = ['"', "'", '`', '/*', '//', '\\', '\r', '\n', ' ', '\ud800', '$', '0', '.', 'é', '(', '=>'];
    for (let seed = 0; seed < 100; seed += 1) {
      expect(() => scanAll(Array.from({ length: 12 }, (_, i) => palette[(seed * 7 + i * 13) % palette.length]).join(''))).not.toThrow();
    }
    expect(createLexer('('.repeat(100_000)).peek(99_999).text).toBe('(');
  });
});
```
- [ ] **RED, implementar, GREEN do ciclo 2.** Rodar: falham `número malformado 08 …` e `texto com escape …` (o lexer devolve `invalid`). Acrescentar a `scan()` as ramificações de número, texto, template e pontuação (as quatro últimas antes de `invalidCharacter`, como acima) e:
  - `numberToken(start, raw)`: `GS0101` e token `invalid` se `/^0\d/.test(raw)` ou `raw.split('.').length > 2`; senão `number`;
  - `stringToken(start)`: `take(STRING)` dá o token `string` com o valor sem aspas; sem fechar na linha, `take(LINE_REST)`, `GS0103` e token `invalid`.

  Rodar de novo → 16 testes passam.
- [ ] **Limpeza e verify.** Sem teste que só prova o TypeScript; `corepack pnpm verify` verde. Registrar as horas.
- [ ] **Commit.** `git add docs/fase-0 spikes/poc-compiler && git commit -m "feat(compiler): adiciona o lexer do poc"`.

### U0-03: Parser do PoC (instruções, Pratt, §4.6 e vários diagnósticos)
**Spec:** §4.5–§4.7, §5.4 · **Tier:** large · **Depende de:** U0-02 · **Risco:** a regra de fim de instrução (pilha de contextos) é o ponto que mais quebrou a v1.5; callback com bloco dentro de chamada e entrada muito aninhada são os casos de falha · **Rollback:** `git revert`; U0-04, U0-05 e U0-08 dependem dele
**Files:** Create `spikes/poc-compiler/src/{ast.types.ts,parser.ts}`, `tests/support/parse-helpers.ts` · Modify `src/vocabulary.constants.ts` · Test `tests/parser.test.ts`
**Interfaces:** Consumes: `createLexer`, `KEYWORDS`, `Lexer`, `Token`, `RawDiagnostic` (U0-02) · Produces: `parse(text, lexer): ParseResult` (`{ program, diagnostics, incomplete }`; o contrato recebe `SourceText` e `options`); AST ESTree-like `readonly` com campos `*Token` e `needsTerminator`; `MAX_NESTING_DEPTH = 200` (espelha `LIMITS.maxNestingDepth`)
**Aceite:** vários diagnósticos por execução; nunca lança nem estoura a pilha com 100 mil `(`, `[`, `{`, ` mais 1`, `.a` ou `()`; callback com bloco dentro de chamada separa as instruções sem `;`; precedência e associatividade da tabela G24; `incomplete` só quando todo erro é fim inesperado
**Review Focus:** o item 5 (callback com bloco dentro de chamada ou de coisa, sem `;`) e o item 4 em escala de PoC têm teste explícito nos ciclos 2 e 4.

- [ ] **Preparo.** Worktree `U0-03`; instalar.
- [ ] **Ciclo 1, teste que falha (Pratt).** Criar `tests/support/parse-helpers.ts` e abrir `tests/parser.test.ts`:

```ts
import type { Expression, ParseResult, Statement } from '../../src/ast.types.ts';
import { createLineTable, positionAt } from '../../src/diagnostics.ts';
import { createLexer } from '../../src/lexer.ts';
import { parse } from '../../src/parser.ts';

export interface ParsedFile { readonly result: ParseResult; readonly found: readonly string[] }

// Cada achado vira "GS0404@2" (código e linha), na ordem de posição.
export function parseText(text: string): ParsedFile {
  const lexer = createLexer(text);
  const result = parse(text, lexer);
  const table = createLineTable(text);
  const found = [...lexer.diagnostics, ...result.diagnostics]
    .sort((a, b) => a.start - b.start)
    .map((raw) => `${raw.code}@${positionAt(table, raw.start).line}`);
  return { result, found };
}

export function firstExpression(text: string): Expression {
  const [statement] = parseText(text).result.program.body;
  if (statement?.type === 'ExpressionStatement') return statement.expression;
  if (statement?.type === 'VariableDeclaration' && statement.init) return statement.init;
  throw new Error(`o primeiro item não é expressão: ${statement?.type ?? 'nada'}`);
}

export function sexp(expression: Expression, source: string): string {
  switch (expression.type) {
    case 'Identifier': return expression.name;
    case 'Literal': return source.slice(expression.start, expression.end);
    case 'BinaryExpression': return `(${expression.operatorToken.value} ${sexp(expression.left, source)} ${sexp(expression.right, source)})`;
    case 'AssignmentExpression': return `(é ${sexp(expression.left, source)} ${sexp(expression.right, source)})`;
    case 'UnaryExpression': return `(${expression.operatorToken.value} ${sexp(expression.argument, source)})`;
    case 'CallExpression': return `(call ${[expression.callee, ...expression.args].map((e) => sexp(e, source)).join(' ')})`;
    case 'MemberExpression':
      return `(. ${sexp(expression.object, source)} ${'name' in expression.property ? expression.property.name : sexp(expression.property, source)})`;
    case 'ThisExpression': return 'ocê';
    default: return expression.type;
  }
}

export const bodyTypes = (statements: readonly Statement[]): string[] => statements.map((statement) => statement.type);
```
```ts
import { describe, expect, it } from 'vitest';
import type { ArrowFunction, ForEachStatement, IfStatement } from '../src/ast.types.ts';
import { bodyTypes, firstExpression, parseText, sexp } from './support/parse-helpers.ts';

const expressionOf = (text: string): string => sexp(firstExpression(text), text);
const clean = (text: string): readonly string[] => parseText(text).found;

describe('precedência e associatividade (Pratt)', () => {
  it.each([
    ['a mais b vezes c', '(mais a (vezes b c))'],
    ['a menos b menos c', '(menos (menos a b) c)'],
    ['num_é a é_igualim b', '(é_igualim (num_é a) b)'],
    ['a menor_que b e_mais c maior_que d', '(e_mais (menor_que a b) (maior_que c d))'],
    ['a ou_então b e_mais c', '(ou_então a (e_mais b c))'],
    ['n sobrou 2 é_igualim 0', '(é_igualim (sobrou n 2) 0)'],
    ['a menos -1', '(menos a (- 1))'],
    ['x é y é 3', '(é x (é y 3))'],
    ['ocê.campo é 1', '(é (. ocê campo) 1)'],
  ])('%s', (text, expected) => {
    expect(expressionOf(text)).toBe(expected);
  });
});
```
- [ ] **RED.** `corepack pnpm exec vitest run tests/parser.test.ts` → `Cannot find module '../src/parser.ts'`.
- [ ] **Ciclo 1, implementar.** Acrescentar a `src/vocabulary.constants.ts` a precedência (níveis do JavaScript) e os conjuntos do parser:

```ts
export const BINARY_PRECEDENCE: ReadonlyMap<string, number> = new Map([
  ['ou_então', 3], ['||', 3], ['e_mais', 4], ['&&', 4],
  ['é_igualim', 8], ['diferente', 8], ['==', 8], ['===', 8], ['!=', 8], ['!==', 8],
  ['<', 9], ['>', 9], ['<=', 9], ['>=', 9], ['maior_que', 9], ['menor_que', 9], ['pelo_menos', 9], ['no_máximo', 9], ['é_tipo_de', 9],
  ['+', 11], ['-', 11], ['mais', 11], ['menos', 11],
  ['*', 12], ['/', 12], ['%', 12], ['vezes', 12], ['dividido', 12], ['sobrou', 12],
]);

export const PRECEDENCE_ASSIGNMENT = 1;
export const PRECEDENCE_UNARY = 14;
export const MAX_NESTING_DEPTH = 200;

export const JS_OPERATOR_FORMS: ReadonlyMap<string, string> = new Map([
  ['=', 'é'], ['==', 'é_igualim'], ['===', 'é_igualim'], ['!=', 'diferente'], ['!==', 'diferente'], ['&&', 'e_mais'],
  ['||', 'ou_então'], ['!', 'num_é'], ['++', 'i é i mais 1'], ['--', 'i é i menos 1'], ['+=', 'i é i mais 1'],
  ['-=', 'i é i menos 1'], ['*=', 'i é i vezes 2'], ['/=', 'i é i dividido 2'], ['%=', 'i é i sobrou 2'],
]);

export const ASSIGNMENT_PUNCTUATORS: ReadonlySet<string> = new Set(['=', '+=', '-=', '*=', '/=', '%=']);
export const BINARY_ONLY_PUNCTUATORS: ReadonlySet<string> = new Set(['*', '/', '%', '<', '>', '<=', '>=', '&&', '||', '==', '===', '!=', '!==']);

export const JS_KEYWORD_EQUIVALENT: ReadonlyMap<string, string> = new Map([
  ['const', 'uai'], ['let', 'trem'], ['var', 'trem'], ['function', 'faz_trem'], ['return', 'faz_favor'], ['if', 'se_ocê_quiser'],
  ['else', 'se_não'], ['for', 'vai_indo'], ['while', 'enquanto_tiver'], ['break', 'para_com_isso'], ['continue', 'continua_aí'],
  ['class', 'arruma_trem'], ['extends', 'inherda_de'], ['new', 'faz_um'], ['this', 'ocê'], ['try', 'tenta_aí'],
  ['catch', 'se_der_ruim'], ['finally', 'por_fim'], ['throw', 'vixe'], ['async', 'vai_na_frente'], ['await', 'espera_um_cadim'],
  ['true', 'certeza'], ['false', 'de_jeito_nenhum'], ['null', 'nada'], ['undefined', 'indefinido'], ['instanceof', 'é_tipo_de'],
]);

export const JS_GLOBALS: ReadonlyMap<string, string> = new Map([
  ['console', 'prosa'], ['setTimeout', 'daqui_a_pouco'], ['setInterval', 'toda_hora'], ['Math', 'Conta'], ['Promise', 'promessa'],
  ['Error', 'Erro'], ['Date', 'Data'], ['Object', 'Coisa'],
]);
```
`src/ast.types.ts`: um tipo por nó ESTree, todo campo `readonly`, todo nó com `start` e `end`, mais `ErrorNode`. Cada keyword que a emissão troca fica num campo `*Token` do nó (`keywordToken`, `operatorToken`, `assignToken`, `elseToken`, `asyncToken`, `staticToken`, `extendsToken`, `declarationToken`, `relationToken`, `finalizerToken`); `PropertyName` (membro, chave de coisa e método) não guarda token, então `obj.mais` sai `obj.mais`; `Identifier` tem `reference: boolean`; as instruções simples (`VariableDeclaration`, `ExpressionStatement`, `Return`, `Jump`, `Throw`) têm `needsTerminator`, e `Throw` tem `wrapsInError`; `TryStatement.handler` é um `CatchClause` (`type: 'CatchClause'`).

`src/parser.ts`: classe `Parser(lexer, textLength)` com a pilha `contexts: ('statement' | 'grouping')[] = ['statement']`, `previous`, `depth`. O miolo de expressões é o laço de Pratt: operador de associatividade à esquerda consome o lado direito com `power + 1`; a atribuição `é` com o próprio nível (direita); `parsePrefix` pede o operando com `PRECEDENCE_UNARY`, o que faz `num_é a é_igualim b` virar `(num_é a) é_igualim b`; `depth + chain` limita cadeias à esquerda:

```ts
  private parseExpression(minPower: number): Ast.Expression {
    if (!this.enter()) {
      this.depth -= 1;
      this.synchronize();
      return this.error(this.lexer.peek().start, this.lexer.peek().start);
    }
    let left = this.parsePrefix();
    let chain = 0;
    for (;;) {
      const token = this.cur();
      const assignment = this.isKeyword(token, 'é') || (token.kind === 'punctuator' && ASSIGNMENT_PUNCTUATORS.has(token.text));
      const power = assignment ? PRECEDENCE_ASSIGNMENT : this.binaryPower(token);
      if (power === undefined || power < minPower) break;
      chain += 1;
      if (this.depth + chain > MAX_NESTING_DEPTH) {
        this.reportDepth();
        this.synchronize();
        break;
      }
      this.advance();
      this.reportJsOperator(token);
      this.skipNewlines();
      if (assignment) left = this.finishAssignment(left, token);
      else left = { type: 'BinaryExpression', start: left.start, end: 0, operatorToken: token, left, right: this.parseExpression(power + 1) };
      left = { ...left, end: this.lastEnd() };
    }
    this.depth -= 1;
    return left;
  }
```
Completar o ciclo: `parsePrefix` (`num_é`, `menos`, `-`, `!`, `espera_um_cadim`), `binaryPower` (consulta `BINARY_PRECEDENCE` pela grafia da keyword ou do símbolo), `finishAssignment` (alvo que não é nome nem membro: `GS0209`), `reportJsOperator` (`GS0404` com `JS_OPERATOR_FORMS`), `parsePostfix` (laço de chamada, índice, membro e `++`/`--`; se a próxima linha começa com `.`, `continuesWithDot` consome as quebras), `parseProgram` (`skipSeparators` + `parseStatementWithProgress`, que avança um token se nada foi consumido), `parseStatement` (padrão: instrução-expressão), `parsePrimary` (número, texto, nome, `ocê`, parênteses, `[ ]`), `parseMember` e `parseArguments`/`parseIndex`.
- [ ] **GREEN do ciclo 1.** `corepack pnpm exec vitest run tests/parser.test.ts -t precedência` → 9 casos passam.
- [ ] **Ciclo 2, teste que falha (fim de instrução, §4.6).** Acrescentar:

```ts
describe('fim de instrução (§4.6)', () => {
  it('a quebra, o ; e o } terminam a instrução simples; o ; do aluno não é duplicado', () => {
    expect(bodyTypes(parseText('uai x é 1\ntrem y\nprosa(x)').result.program.body)).toEqual(['VariableDeclaration', 'VariableDeclaration', 'ExpressionStatement']);
    const { result, found } = parseText('uai a é 1; uai b é 2\nfaz_trem soma(a, b) { faz_favor a mais b }');
    expect(found).toEqual([]);
    expect(result.program.body.map((s) => s.type === 'VariableDeclaration' && s.needsTerminator)).toEqual([false, true, false]);
  });

  it('operador, é, vírgula e ponto no fim da linha, e ponto no começo da próxima, continuam a instrução', () => {
    expect(expressionOf('uai t é a mais\n b')).toBe('(mais a b)');
    expect(expressionOf('uai t é\n 5')).toBe('5');
    expect(expressionOf('soma(1,\n 2)')).toBe('(call soma 1 2)');
    expect(expressionOf('lista\n  .mapear(f)\n  // x\n  .filtrar(g)')).toBe('(call (. (call (. lista mapear) f) filtrar) g)');
  });

  it('callback com bloco dentro de chamada, sem ;, separa as instruções', () => {
    const text = 'lista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})\nprosa("fim")';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    const call = firstExpression(text);
    const arrow = call.type === 'CallExpression' ? (call.args[0] as ArrowFunction) : undefined;
    expect(arrow?.body.type === 'BlockStatement' && arrow.body.body).toHaveLength(2);
  });

  it('callback com bloco dentro de lista, seta com bloco em coisa de várias linhas e seta seguida de [ ou (', () => {
    expect(clean('uai a é [\n  lista.pra_cada(x => {\n    prosa(x)\n    prosa(x)\n  })\n]')).toEqual([]);
    const object = parseText('uai acoes é {\n  dobra: x => {\n    uai d é x vezes 2\n    faz_favor d\n  },\n  nome: "a"\n}\nprosa(1)');
    expect([object.found, object.result.program.body.length]).toEqual([[], 2]);
    expect(parseText('uai f é x => { faz_favor x }\n[1]\n(2)').result.program.body).toHaveLength(3);
  });
});
```
- [ ] **RED e implementar.** Falha: declarações e `faz_trem` caem em `GS0202`. A pilha de contextos decide tudo: dentro de `( )`, `[ ]` e `{ }` de coisa, `cur()` descarta o `Newline`; abrir `{` de bloco empilha `'statement'` mesmo dentro de uma chamada; `finishSimple()` termina a instrução simples em `;`, quebra, `}` ou fim do arquivo e devolve se a emissão precisa inserir `;`:

```ts
  private cur(): Token {
    while (this.contexts.at(-1) === 'grouping' && this.lexer.peek().kind === 'newline') this.lexer.next();
    return this.swapJsWord(this.lexer.peek());
  }

  // Devolve true quando a emissão precisa inserir o `;`.
  private finishSimple(): boolean {
    const token = this.cur();
    if (this.isPunct(token, ';')) {
      this.advance();
      return false;
    }
    if (token.kind === 'newline') {
      this.advance();
      return true;
    }
    if (token.kind === 'end-of-file' || this.isPunct(token, '}')) return true;
    this.reportBadEnd(token);
    this.synchronize();
    return true;
  }
```
Completar: `withContext(context, fn)` (empilha, executa e desempilha), `advance`, `skipNewlines`, `nextPastNewlines` (olha além das quebras sem consumir), `parseBlock` (Allman: pula quebras antes de `{`; empilha `'statement'` e conta profundidade) + `parseBlockBody`, `parseVariable` (G03; `trem` sem valor vale `indefinido`), `parseFunction` + `parseParams` (G04/G05), `parseReturn` (quebra depois de `faz_favor` devolve `indefinido`), `isArrowAhead` + `parseArrow` (varre até o `)` par e olha o `=>`; corpo com `{` é bloco), `parseArray`, `parseObject` (chave por leitura crua do lexer, para palavra goiana valer como nome) e `parseNew`.
- [ ] **GREEN do ciclo 2.** `-t "fim de instrução"` → 4 testes passam.
- [ ] **Ciclo 3, teste que falha (palavra pela posição e instruções compostas).** Acrescentar:

```ts
describe('palavra ou nome pela posição (§5.4)', () => {
  it('palavra goiana serve de chave e de membro; de e em são nomes fora do cabeçalho do vai_indo', () => {
    expect(clean('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)')).toEqual([]);
    expect(clean('uai de é [1]\nuai em é 5\nvai_indo (uai x de de) { prosa(x mais em) }')).toEqual([]);
  });

  it('vai_indo aceita laço clássico, de e em', () => {
    const classic = parseText('vai_indo (trem i é 0; i menor_que 3; i é i mais 1) { prosa(i) }');
    const each = parseText('vai_indo (uai x de lista) { prosa(x) }\nvai_indo (uai k em coisa) { prosa(k) }');
    expect([classic.found, each.found]).toEqual([[], []]);
    expect(classic.result.program.body[0]?.type).toBe('ForStatement');
    expect((each.result.program.body[0] as ForEachStatement).relationToken.keyword?.spelling).toBe('de');
  });
});

describe('instruções compostas', () => {
  it('se_num_for e se_não continuam na linha seguinte, com Allman e comentário; outra instrução encerra', () => {
    const text = 'se_ocê_quiser (a)\n{\n  prosa(1)\n}\nse_num_for (b) {\n  prosa(2)\n}\n\n// x\n\nse_não {\n  prosa(3)\n}\nprosa(4)';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    expect(bodyTypes(result.program.body)).toEqual(['IfStatement', 'ExpressionStatement']);
    expect((result.program.body[0] as IfStatement).alternate?.type).toBe('IfStatement');
    expect(bodyTypes(parseText('se_ocê_quiser (a) { prosa(1) }\nprosa(2)').result.program.body)).toEqual(['IfStatement', 'ExpressionStatement']);
  });

  it('tenta_aí com se_der_ruim e por_fim em linhas separadas', () => {
    const { result, found } = parseText('tenta_aí {\n  prosa(1)\n}\nse_der_ruim (erro) {\n  prosa(erro)\n}\npor_fim {\n  prosa(3)\n}');
    expect([found, bodyTypes(result.program.body)]).toEqual([[], ['TryStatement']]);
  });

  it('classe com herança, construtor, static e async; função assíncrona e vixe como instrução', () => {
    const text = 'arruma_trem Pequi inherda_de Fruta\n{\n  aprepara_trem(n) { a_raiz(n) }\n  num_muda criar() { faz_favor faz_um Pequi("verde") }\n  vai_na_frente busca() { faz_favor 1 }\n}';
    const { result, found } = parseText(text);
    expect(found).toEqual([]);
    const declaration = result.program.body[0];
    expect(declaration?.type === 'ClassDeclaration' && declaration.members.map((m) => m.key.name)).toEqual(['constructor', 'criar', 'busca']);
    expect(clean('vai_na_frente faz_trem busca() {\n  espera_um_cadim cochila(1)\n  vixe("Deu ruim, sô!")\n}')).toEqual([]);
  });
});
```
- [ ] **RED e implementar.** Falha: `se_ocê_quiser`, `vai_indo`, `arruma_trem` e `tenta_aí` caem em `GS0202`. A continuação `se_num_for`/`se_não` olha além das quebras e só as consome se a palavra continua a instrução:

```ts
  private parseIf(): Ast.IfStatement {
    this.enter();
    const keywordToken = this.advance();
    const test = this.parseParenthesized();
    const consequent = this.parseBlock();
    const next = this.nextPastNewlines();
    let alternate: Ast.IfStatement | Ast.BlockStatement | null = null;
    let elseToken: Token | undefined;
    if (this.isKeyword(next, 'se_num_for')) {
      this.skipNewlines();
      alternate = this.parseIf();
    } else if (this.isKeyword(next, 'se_não')) {
      this.skipNewlines();
      elseToken = this.advance();
      alternate = this.parseBlock();
    }
    this.depth -= 1;
    return { type: 'IfStatement', start: keywordToken.start, end: this.lastEnd(), keywordToken, test, consequent, alternate, ...(elseToken ? { elseToken } : {}) };
  }
```
Completar: `parseParenthesized`; `parseWhile`; `parseFor` + `parseForHeader` (abre `'grouping'`; `uai`/`trem` seguido, duas posições depois, de `de`/`em` é `ForEach`, senão laço clássico com exatamente dois `;`); `parseTry` + `parseCatch` (G12–G14; sem `se_der_ruim` nem `por_fim` é `GS0202`); `parseClass`, `parseClassMembers`, `parseMethod` (G15/G16; `aprepara_trem` vira `PropertyName` `constructor` com `keywordToken`); `parseJump`; `parseThrow` (`vixe`: um argumento, senão `GS0206`; `wrapsInError` é falso se o argumento é `faz_um …` ou o parâmetro do `se_der_ruim`); `skipNewlinesBeforeBrace` (Allman).
- [ ] **GREEN do ciclo 3.** `-t "palavra ou nome|instruções compostas"` → passam.
- [ ] **Ciclo 4, teste que falha (diagnósticos, recuperação e limites).** Acrescentar:

```ts
describe('diagnósticos e recuperação', () => {
  it.each([
    ['uai x = 5', ['GS0404@1']],
    ['se_ocê_quiser (x == 1) {\n}', ['GS0404@1']],
    ['const total é 5', ['GS0401@1']],
    ['console.log("oi")', ['GS0403@1']],
    ['uai preço é 10,50', ['GS0208@1']],
    ['uai t é a\n  mais b', ['GS0203@2']],
    ['uai x é 1\nse_não {\n}', ['GS0205@2']],
    ['se_ocê_quiser (a) prosa(a)', ['GS0207@1']],
    ['faz_trem f() {\n  faz_favor 1\n', ['GS0201@3']],
    ['uai mais é 1', ['GS0303@1']],
    ['1 é x', ['GS0209@1']],
    ['vixe("a", "b")', ['GS0206@1']],
    ['uai f é x => vixe("a")', ['GS0206@1']],
    ['uai f é (a, b)\n=> a', ['GS0204@1']],
    ['uai t é `oi ${x}`', ['GS0500@1']],
    ['uai x', ['GS0307@1']],
  ])('%j', (text, expected) => {
    expect(clean(text)).toEqual(expected);
  });

  it('reporta vários diagnósticos de uma vez e continua depois do erro', () => {
    const text = 'uai nome = "Goiás"\nse_ocê_quiser (nome == "Goiás") {\n  console.log(nome)\n}\nconst idade é 18\nuai preço é 10,50\nprosa("fim")';
    const { found, result } = parseText(text);
    expect(found).toEqual(['GS0404@1', 'GS0404@2', 'GS0403@3', 'GS0401@5', 'GS0208@6']);
    expect(result.program.body).toHaveLength(5);
  });

  it('incomplete só quando todo erro é fim inesperado da entrada', () => {
    expect([parseText('se_ocê_quiser (a) {'), parseText('uai x = 5'), parseText('uai ok é 1')].map((parsed) => parsed.result.incomplete)).toEqual([true, false, false]);
  });

  it('nunca lança nem estoura a pilha com entrada muito aninhada, e limita com GS0500', () => {
    const huge = 100_000;
    const inputs = ['('.repeat(huge), '['.repeat(huge), '{'.repeat(huge), `1${' mais 1'.repeat(huge)}`, `a${'.a'.repeat(huge)}`, `a${'()'.repeat(huge)}`, 'se_ocê_quiser (a) {\n'.repeat(1000)];
    for (const input of inputs) expect(() => parseText(input)).not.toThrow();
    expect(clean('('.repeat(huge))).toContain('GS0500@1');
    expect(clean(`1${' mais 1'.repeat(huge)}`)).toContain('GS0500@1');
  });
});
```
- [ ] **RED e implementar.** Falham os GS0401, GS0403, GS0404, GS0208, GS0203, GS0205, GS0207, GS0209, GS0303, GS0307, GS0500, GS0204 e o limite. A palavra do JavaScript vira a keyword goiana equivalente, com `GS0401`, para o parser seguir e achar mais erros (leituras cruas do lexer, em propriedade e chave, não passam por aqui):

```ts
  private swapJsWord(token: Token): Token {
    const goiano = token.kind === 'identifier' ? JS_KEYWORD_EQUIVALENT.get(token.value) : undefined;
    const keyword = goiano ? KEYWORDS.get(goiano) : undefined;
    if (!goiano || !keyword) return token;
    const cached = this.swapped.get(token);
    if (cached) return cached;
    this.report('GS0401', token.start, token.end, { word: token.value, suggestion: goiano });
    const replacement: Token = { ...token, kind: 'keyword', keyword };
    this.swapped.set(token, replacement);
    return replacement;
  }
```
Completar: `reportBadEnd` (`,` depois de número e antes de outro número: `GS0208` de um ao outro; senão `GS0202`/`GS0201`), `parseBracelessBody` (`GS0207`; lê uma instrução como corpo), `enter()`/`reportDepth()` (passou de `MAX_NESTING_DEPTH`: `GS0500` uma vez e `ErrorNode`), `parseDangling` (`GS0205`; lê cabeçalho e bloco para ressincronizar), `parseBindingName` (`GS0303` para keyword reservada como nome), o teste `isBinaryOnly` no início de instrução (`GS0203`), `synchronize` (descarta até quebra, `;`, `}` ou fim), `swapped: WeakMap<Token, Token>` e `parse()` com `incomplete` (todo erro é `GS0201` ou `GS0106`).
- [ ] **GREEN do ciclo 4.** `corepack pnpm exec vitest run tests/parser.test.ts` → 37 testes passam em menos de 3 s.
- [ ] **Limpeza e verify.** Sem defesa impossível nem comentário que narra; funções ≤ 50 linhas (as violações restantes entram na contagem de U0-05); `corepack pnpm verify` verde. Registrar as horas.
- [ ] **Commit.** `git add spikes/poc-compiler docs/fase-0 && git commit -m "feat(compiler): adiciona o parser do poc com pratt e fim de instrução"`.

### U0-04: Emissão por edições do PoC
**Spec:** §5.7, §4.6 (emissão de `;`), §4.8 (`vixe`) · **Tier:** medium · **Depende de:** U0-03 · **Risco:** montar a saída concatenando e lendo `.at(-1)` da string é quadrático (23 mil edições levaram quase 1 s); `compile()` precisa preservar as linhas · **Rollback:** `git revert`; U0-05 depende dele
**Files:** Create `spikes/poc-compiler/src/{emit.ts,compile.ts}`, `tests/support/compile-helpers.ts` · Modify `src/vocabulary.constants.ts` · Test `tests/emit.test.ts`
**Interfaces:** Consumes: `parse`, `createLexer`, `Program` e os nós com `*Token` e `needsTerminator` (U0-03), `createLineTable`, `toDiagnostic` (U0-01) · Produces: `Edit { start, end, text, order }`; `lower(program, text): readonly Edit[]`; `applyEdits(text, edits): string` (o contrato devolve também `segments`; o spike não gera source map); `compile(text): CompileResult` = `{ ok: true, code, diagnostics } | { ok: false, diagnostics, incomplete }`, nunca lança (exceção interna vira `GS0901`)
**Aceite:** keyword trocada só no token que o nó referencia; `;` inserido por tipo de instrução, sem duplicar o do aluno nem entrar no cabeçalho do `vai_indo`; linhas preservadas; BOM omitido; `x menos-1` → `x - -1`; JS passa no `acorn.parse` (`ecmaVersion: 2022`, módulo); 50 mil edições em menos de 1 s

- [ ] **Preparo.** Worktree `U0-04`; instalar.
- [ ] **Ciclo 1, teste que falha (keywords e ponto e vírgula).** `tests/support/compile-helpers.ts` e o início de `tests/emit.test.ts`:

```ts
import { parse } from 'acorn';
import { compile } from '../../src/compile.ts';

export function jsOf(source: string): string {
  const result = compile(source);
  if (!result.ok) throw new Error(`não compilou: ${result.diagnostics.map((d) => d.code).join(',')}`);
  return result.code;
}

export function parsesAsModule(code: string): boolean {
  try {
    parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    return true;
  } catch {
    return false;
  }
}
```
```ts
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { applyEdits } from '../src/emit.ts';
import { jsOf, parsesAsModule } from './support/compile-helpers.ts';

describe('keywords e ponto e vírgula', () => {
  it('troca a keyword pelo token JS e insere ; em instrução simples', () => {
    expect(jsOf('uai x é 1\ntrem y é 2\nprosa(x mais y)')).toBe('const x = 1;\nlet y = 2;\nconsole.log(x + y);');
  });

  it('não duplica o ; do aluno nem põe ; depois de instrução composta', () => {
    expect(jsOf('uai a é 1;\nse_ocê_quiser (a) {\n  prosa(a)\n}')).toBe('const a = 1;\nif (a) {\n  console.log(a);\n}');
  });

  it('põe ; depois de seta com bloco e de coisa literal, e não dentro do cabeçalho do vai_indo', () => {
    const js = jsOf('uai f é x => { faz_favor x }\nuai o é { a: 1 }\nvai_indo (trem i é 0; i menor_que 3; i é i mais 1) {\n  prosa(i)\n}');
    expect(js).toBe('const f = x => { return x; };\nconst o = { a: 1 };\nfor (let i = 0; i < 3; i = i + 1) {\n  console.log(i);\n}');
  });

  it('se_num_for vira else if e se_não vira else, nas linhas de origem', () => {
    expect(jsOf('se_ocê_quiser (a) {\n}\nse_num_for (b) {\n}\nse_não {\n}')).toBe('if (a) {\n}\nelse if (b) {\n}\nelse {\n}');
  });

  it('for-of, for-in, while, break e continue', () => {
    const js = jsOf('vai_indo (uai x de lista) {\n  para_com_isso\n}\nvai_indo (uai k em coisa) {\n  continua_aí\n}\nenquanto_tiver (certeza) {\n  para_com_isso\n}');
    expect(js).toBe('for (const x of lista) {\n  break;\n}\nfor (const k in coisa) {\n  continue;\n}\nwhile (true) {\n  break;\n}');
  });

  it('classe, herança, construtor, static, a_raiz, ocê, faz_um e async/await', () => {
    const source = 'arruma_trem Pequi inherda_de Fruta {\n  aprepara_trem(n) { a_raiz(n) }\n  num_muda criar() { faz_favor faz_um Pequi("verde") }\n  vai_na_frente busca() { espera_um_cadim ocê.achar() }\n}';
    expect(jsOf(source)).toBe('class Pequi extends Fruta {\n  constructor(n) { super(n); }\n  static criar() { return new Pequi("verde"); }\n  async busca() { await this.achar(); }\n}');
  });

  it('vai_na_frente_faz_trem vira async function; tenta_aí, se_der_ruim e por_fim viram try, catch e finally', () => {
    expect(jsOf('vai_na_frente faz_trem f() {\n}\nvai_na_frente_faz_trem g() {\n}')).toBe('async function f() {\n}\nasync function g() {\n}');
    expect(jsOf('tenta_aí {\n  prosa(1)\n} se_der_ruim (erro) {\n  prosa(2)\n} por_fim {\n  prosa(3)\n}')).toBe(
      'try {\n  console.log(1);\n} catch (erro) {\n  console.log(2);\n} finally {\n  console.log(3);\n}',
    );
  });
});
```
- [ ] **RED.** `corepack pnpm exec vitest run tests/emit.test.ts` → `Cannot find module '../src/compile.ts'`.
- [ ] **Ciclo 1, implementar.** O rebaixamento percorre a AST uma vez, de forma genérica: todo campo cujo nome termina em `Token` e que guarda uma keyword vira uma edição de troca pelo token JS (`KeywordInfo.js`); toda instrução simples com `needsTerminator` ganha um `;` de largura zero em `end`; `ThrowStatement` troca `vixe` por `throw new Error` (`wrapsInError`) ou `throw ` (a keyword vem antes do `(` do argumento, então sai `throw (new Error("a"))`). A ordem final é por `start` e, no mesmo `start`, pela ordem de emissão (`order`); sobreposição é bug interno (`GS0901`).

```ts
  visit(value: unknown): void {
    if (Array.isArray(value)) value.forEach((item) => this.visit(item));
    else if (isNode(value)) this.visitNode(value);
  }

  private visitNode(node: Visitable): void {
    for (const [key, child] of Object.entries(node)) {
      if (key.endsWith('Token') && isKeywordToken(child)) this.replaceKeyword(node, child);
      else this.visit(child);
    }
    this.visitSpecial(node);
  }

  private replaceKeyword(node: Visitable, token: Token): void {
    const isThrow = node.type === 'ThrowStatement';
    const text = isThrow ? (node['wrapsInError'] === true ? 'throw new Error' : 'throw ') : (token.keyword?.js ?? token.text);
    this.add(token.start, token.end, text);
  }
```
No mesmo `emit.ts`: `interface Edit`; `Visitable` (objeto com `type`, `start`, `end`); a classe `EditCollector` (`edits`, `add(start, end, text)` com `order = edits.length`, os métodos acima e `visitSpecial`); `lower(program, text)` (`collector.visit(program.body)`; BOM apagado com `add(0, 1, '')`). A montagem da saída acumula pedaços num array e guarda só o último caractere:

```ts
const MERGING_PAIRS = new Set(['++', '--', '//', '/*', '+=', '-=', '*=', '/=', '%=', '<=', '>=', '==', '=>', '**', '&&', '||']);

function needsSpace(left: string | undefined, right: string | undefined): boolean {
  return left !== undefined && right !== undefined && MERGING_PAIRS.has(left + right);
}

export function applyEdits(text: string, edits: readonly Edit[]): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start || a.order - b.order);
  const parts: string[] = [];
  let lastChar: string | undefined;
  let cursor = 0;
  const push = (piece: string): void => {
    if (piece === '') return;
    parts.push(piece);
    lastChar = piece.at(-1);
  };
  for (const edit of sorted) {
    if (edit.start < cursor) throw new Error('edições sobrepostas');
    push(text.slice(cursor, edit.start));
    if (needsSpace(lastChar, edit.text[0])) push(' ');
    push(edit.text);
    cursor = edit.end;
    if (needsSpace(lastChar, text[cursor])) push(' ');
  }
  push(text.slice(cursor));
  return parts.join('');
}
```
`src/compile.ts`:

```ts
import { createLineTable, toDiagnostic } from './diagnostics.ts';
import { applyEdits, lower } from './emit.ts';
import { createLexer } from './lexer.ts';
import { parse } from './parser.ts';
import type { Diagnostic } from './token.types.ts';

export type CompileResult =
  | { readonly ok: true; readonly code: string; readonly diagnostics: readonly Diagnostic[] }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[]; readonly incomplete: boolean };

export function compile(text: string): CompileResult {
  const table = createLineTable(text);
  try {
    const lexer = createLexer(text);
    const { program, diagnostics, incomplete } = parse(text, lexer);
    const raws = [...lexer.diagnostics, ...diagnostics].sort((a, b) => a.start - b.start);
    if (raws.length > 0) return { ok: false, diagnostics: raws.map((raw) => toDiagnostic(raw, table)), incomplete };
    return { ok: true, code: applyEdits(text, lower(program, text)), diagnostics: [] };
  } catch {
    return { ok: false, diagnostics: [toDiagnostic({ code: 'GS0901', start: 0, end: 0, args: {} }, table)], incomplete: false };
  }
}
```
- [ ] **GREEN do ciclo 1.** `-t "keywords e ponto"` → 7 testes passam.
- [ ] **Ciclo 2, teste que falha (biblioteca e nomes).** Acrescentar:

```ts
describe('biblioteca e nomes', () => {
  it('rebaixa globais e membros da biblioteca para o nativo', () => {
    expect(jsOf('uai d é lista.mapear(n => n vezes 2)\nprosa(d.tamanho)\nreclama("x")')).toBe(
      'const d = lista.map(n => n * 2);\nconsole.log(d.length);\nconsole.error("x");',
    );
  });

  it('palavra goiana como chave e como membro sai com a grafia original', () => {
    expect(jsOf('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)')).toBe('const o = { de: "SP", mais: 1 };\nconsole.log(o.de, o.mais);');
  });

  it('vixe: mensagem embrulha em Error, faz_um e relançamento mantêm o erro', () => {
    expect(jsOf('vixe("a")')).toBe('throw new Error("a");');
    expect(jsOf('vixe(faz_um Erro("a"))')).toBe('throw (new Error("a"));');
    expect(jsOf('tenta_aí {\n  prosa(1)\n} se_der_ruim (erro) {\n  vixe(erro)\n}')).toContain('throw (erro);');
  });
});
```
- [ ] **RED, implementar, GREEN.** Falha: `prosa` e `.mapear` saem como estão. Acrescentar a `src/vocabulary.constants.ts` as tabelas da biblioteca do PoC e a `visitSpecial` o rebaixamento de `Identifier` com `reference: true` (global) e de `MemberExpression` sem `computed` (membro; chave de coisa e método não passam por aqui):

```ts
export const LIBRARY_GLOBALS: ReadonlyMap<string, string> = new Map([
  ['prosa', 'console.log'], ['reclama', 'console.error'], ['avisa', 'console.warn'], ['daqui_a_pouco', 'setTimeout'],
  ['toda_hora', 'setInterval'], ['promessa', 'Promise'], ['Erro', 'Error'], ['Data', 'Date'],
]);

export const LIBRARY_MEMBERS: ReadonlyMap<string, string> = new Map([
  ['mapear', 'map'], ['filtrar', 'filter'], ['pra_cada', 'forEach'], ['juntar', 'join'], ['tamanho', 'length'],
  ['bota_no_final', 'push'], ['arranca_o_rabo', 'pop'], ['gritando', 'toUpperCase'], ['cochichando', 'toLowerCase'],
]);
```
`-t biblioteca` → 3 testes passam. O PoC não resolve escopo: nome do aluno que esconde a biblioteca (P4) fica fora do PoC.
- [ ] **Ciclo 3, teste que falha (separação de tokens, arquivo e desempenho).** Acrescentar:

```ts
describe('separação de tokens e arquivo', () => {
  it('não funde símbolo com o sinal seguinte: x menos-1 vira x - -1', () => {
    expect(jsOf('uai r é x menos-1')).toBe('const r = x - -1;');
    expect(jsOf('uai r é a mais -b')).toBe('const r = a + -b;');
    expect(jsOf('uai r é a menos - b')).toBe('const r = a - - b;');
  });

  it('omite o BOM e preserva \\r\\n', () => {
    expect(jsOf('﻿uai x é 1\r\nprosa(x)\r\n')).toBe('const x = 1;\r\nconsole.log(x);\r\n');
  });

  it('preserva o número de linhas e o JS sai válido para o acorn', () => {
    const source = 'uai x é [\n  1,\n  2,\n]\n\n// comentário\nlista.pra_cada(n => {\n  prosa(n)\n})\n';
    const code = jsOf(source);
    expect(code.split('\n')).toHaveLength(source.split('\n').length);
    expect(parsesAsModule(code)).toBe(true);
  });

  it('não emite código quando há erro', () => {
    const result = compile('uai x = 5');
    expect(result.ok).toBe(false);
    expect('code' in result).toBe(false);
  });

  it('applyEdits é linear: 50 mil edições em menos de 1 s', () => {
    const count = 50_000;
    const edits = Array.from({ length: count }, (_, index) => ({ start: index * 2, end: index * 2 + 1, text: 'bb', order: index }));
    const started = performance.now();
    expect(applyEdits('a '.repeat(count), edits)).toHaveLength(count * 3);
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
```
- [ ] **RED, implementar, GREEN.** Falha: `x --1`. `needsSpace` (acima) já cobre; confira o caso de BOM e `\r\n`. Rodar tudo: `corepack pnpm exec vitest run tests/emit.test.ts` → 16 testes passam.
- [ ] **Limpeza e verify.** `corepack pnpm verify` verde; registrar as horas.
- [ ] **Commit.** `git add spikes/poc-compiler docs/fase-0 && git commit -m "feat(compiler): adiciona a emissão por edições do poc"`.

### U0-05: Demos, 10 erros típicos, oráculo acorn e medição
**Spec:** §10.1 F0 (critérios a–d), §5.11 · **Tier:** medium · **Depende de:** U0-04 · **Risco:** falha de demo ou de erro típico é bug real do PoC (não relaxar o teste); medir fora do Node 24 ou depois de mexer nos limites invalida o gate · **Rollback:** `git revert`; U0-09 depende da medição
**Files:** Create `spikes/poc-compiler/fixtures/demos/{hello,first-example,list-map,pequi,async-timer,video-demo}.gs`, `fixtures/typical-errors/{assign-equals,js-const,js-console,decimal-comma,leading-zero,unterminated-string,braceless-body,leading-operator,dangling-else,unexpected-eof,multi-error}.gs`, `bench/{generate-10k.ts,measure.ts}`, `docs/fase-0/medicao-poc.json` (gerado) · Test `tests/{demos,typical-errors}.test.ts`
**Interfaces:** Consumes: `compile(text): CompileResult` (U0-04), bloco `json limits` do ADR-0001 (U0-00) · Produces: `generateProgram(lineCount?)`; `docs/fase-0/medicao-poc.json` (`node`, `machine`, `limits`, `sourceLines`, `tableLines`, `files`, `minifiedBytes`, `brotliBytes`, `medianMs`, `runsMs`, `lintViolations`, `verdict`)
**Aceite:** os 6 demos compilam, passam no `acorn.parse` e reproduzem o stdout; cada um dos 10 erros típicos dá o `GSnnnn` na linha certa sem lançar; o arquivo com vários erros dá ≥ 3 códigos distintos; `medicao-poc.json` gerado em Node 24 com os limites lidos do ADR

- [ ] **Preparo.** Worktree `U0-05`; instalar.
- [ ] **Ciclo 1, teste que falha (demos).** `tests/demos.test.ts` (os exemplos do playground não são versionados; os fixtures abaixo são o subconjunto da v3 já migrado: `.length` → `.tamanho`, `presta_serviço` → `faz_trem`, `setTimeout` → `daqui_a_pouco`, `=` → `é`, função construtora → `arruma_trem`; `video-demo.gs` é o demo do vídeo, sem mudança):

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { parsesAsModule } from './support/compile-helpers.ts';

const DEMOS_DIRECTORY = join(import.meta.dirname, '..', 'fixtures', 'demos');

const DEMOS: readonly (readonly [name: string, stdout: string])[] = [
  ['hello', 'Eai sô, bão demais da conta!\nSalve, Goiás!\n'],
  ['first-example', 'Bão demais da conta!\nOi, João!\nOi, Maria!\n'],
  ['list-map', 'Os número: [ 1, 2, 3, 4, 5 ]\nDobrados, sô: [ 2, 4, 6, 8, 10 ]\nSó os par: [ 2, 4 ]\nItem 0: 2\nItem 1: 4\nItem 2: 6\nItem 3: 8\nItem 4: 10\n'],
  ['pequi', 'Pequi verde, com espinho: cuidado pra num se furar!\nO pequi amadureceu, sô! Tá no ponto de pôr no arroz.\nPequi maduro, com espinho: cuidado pra num se furar!\n'],
  ['async-timer', '=== Programa GoiásScript ===\nIniciando teste...\nEsperando 20 milissegundos...\nO programa principal continua executando enquanto a função assíncrona trabalha\nContando: 0\nContando: 1\nContando: 2\nTempo de espera concluído!\nResultado: Processamento de 20ms finalizado!\nTeste concluído com sucesso!\n'],
  ['video-demo', 'Bão, sô\n'],
];

describe('demos do subconjunto da v3', () => {
  it.each(DEMOS)('%s compila, o JS passa no acorn e reproduz o stdout', (name, stdout) => {
    const result = compile(readFileSync(join(DEMOS_DIRECTORY, `${name}.gs`), 'utf8'));
    if (!result.ok) throw new Error(result.diagnostics.map((d) => `${d.code}@${d.line}`).join(','));
    expect(parsesAsModule(result.code)).toBe(true);
    expect(execFileSync(process.execPath, ['--input-type=module'], { input: result.code, encoding: 'utf8' })).toBe(stdout);
  });
});
```
- [ ] **RED.** `corepack pnpm exec vitest run tests/demos.test.ts` → `ENOENT: no such file or directory, open '…/fixtures/demos/hello.gs'`.
- [ ] **Criar os fixtures** (a partir de `spikes/poc-compiler/`):

```bash
mkdir -p fixtures/demos fixtures/typical-errors
cat > fixtures/demos/hello.gs <<'EOF'
uai saudacao é "Eai sô, bão demais da conta!";
prosa(saudacao);
uai nome é "Goiás";
prosa("Salve, " mais nome mais "!");
EOF
cat > fixtures/demos/first-example.gs <<'EOF'
uai saudacao é "Bão demais da conta!";
prosa(saudacao);
uai listaDeNomes é [
  "João",
  "Maria",
];
vai_indo (uai nome de listaDeNomes) {
  prosa("Oi, " mais nome mais "!");
}
EOF
cat > fixtures/demos/list-map.gs <<'EOF'
uai numeros é [1, 2, 3, 4, 5];
prosa("Os número:", numeros);
uai dobrados é numeros.mapear(n => n vezes 2);
prosa("Dobrados, sô:", dobrados);
uai pares é numeros.filtrar(n => n sobrou 2 é_igualim 0);
prosa("Só os par:", pares);
vai_indo (trem i é 0; i menor_que dobrados.tamanho; i é i mais 1) {
  prosa("Item " mais i mais ": " mais dobrados[i]);
}
EOF
cat > fixtures/demos/pequi.gs <<'EOF'
arruma_trem Pequi {
  aprepara_trem(maturacao) {
    ocê.maturacao é maturacao ou_então "verde"
  }

  amadurecer() {
    ocê.maturacao é "maduro"
    prosa("O pequi amadureceu, sô! Tá no ponto de pôr no arroz.")
    faz_favor ocê
  }

  descrever() {
    prosa("Pequi " mais ocê.maturacao mais ", com espinho: cuidado pra num se furar!")
    faz_favor ocê
  }
}

uai meuPequi é faz_um Pequi("verde")
meuPequi.descrever()
meuPequi.amadurecer()
meuPequi.descrever()
EOF
cat > fixtures/demos/async-timer.gs <<'EOF'
prosa("=== Programa GoiásScript ===")

vai_na_frente faz_trem testaDelay(tempo) {
  prosa("Esperando " + tempo + " milissegundos...")
  espera_um_cadim faz_um promessa((resolve_aí) => {
    daqui_a_pouco(() => {
      prosa("Tempo de espera concluído!")
      resolve_aí("Concluído após " mais tempo mais "ms")
    }, tempo)
  })
  faz_favor "Processamento de " mais tempo mais "ms finalizado!"
}

vai_na_frente faz_trem executar() {
  tenta_aí {
    prosa("Iniciando teste...")
    uai resultado é espera_um_cadim testaDelay(20)
    prosa("Resultado: " mais resultado)
    prosa("Teste concluído com sucesso!")
  } se_der_ruim (erro) {
    reclama("Erro durante execução: " mais erro)
  }
}

executar()
prosa("O programa principal continua executando enquanto a função assíncrona trabalha")

trem contador é 0
enquanto_tiver (contador menor_que 3) {
  prosa("Contando: " mais contador)
  contador é contador mais 1
}
EOF
cat > fixtures/demos/video-demo.gs <<'EOF'
uai idade é 18

faz_trem saudacao(nome) {
  faz_favor "Bão, " mais nome
}

se_ocê_quiser (idade pelo_menos 18) {
  prosa(saudacao("sô"))
}
EOF
```
- [ ] **GREEN.** o mesmo comando → 6 testes passam. Se um demo falhar, o bug é do PoC: escreva o teste de regressão em `parser.test.ts` ou `emit.test.ts`, corrija na unidade dona e rode de novo; não mude o fixture para esconder o erro.
- [ ] **Ciclo 2, teste que falha (10 erros típicos).** `tests/typical-errors.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';

const ERRORS_DIRECTORY = join(import.meta.dirname, '..', 'fixtures', 'typical-errors');
const load = (name: string): string => readFileSync(join(ERRORS_DIRECTORY, `${name}.gs`), 'utf8');

const TYPICAL_ERRORS = [
  ['assign-equals', 'GS0404', 2],
  ['js-const', 'GS0401', 1],
  ['js-console', 'GS0403', 2],
  ['decimal-comma', 'GS0208', 2],
  ['leading-zero', 'GS0101', 2],
  ['unterminated-string', 'GS0103', 1],
  ['braceless-body', 'GS0207', 2],
  ['leading-operator', 'GS0203', 2],
  ['dangling-else', 'GS0205', 2],
  ['unexpected-eof', 'GS0201', 3],
] as const;

describe('10 erros típicos de quem vem do JavaScript', () => {
  it.each(TYPICAL_ERRORS)('%s dá %s na linha %i, sem lançar', (name, code, line) => {
    const result = compile(load(name));
    expect(result.ok).toBe(false);
    expect(result.diagnostics.find((diagnostic) => diagnostic.code === code)?.line).toBe(line);
  });

  it('um arquivo com vários erros devolve pelo menos 3 códigos distintos', () => {
    const result = compile(load('multi-error'));
    expect(result.ok).toBe(false);
    expect([...new Set(result.diagnostics.map((diagnostic) => diagnostic.code))].sort()).toEqual(['GS0208', 'GS0401', 'GS0403', 'GS0404']);
    expect(result.diagnostics.map((diagnostic) => diagnostic.line)).toEqual([1, 2, 3, 5, 6]);
  });
});
```
- [ ] **RED.** Rodar → `ENOENT … fixtures/typical-errors/assign-equals.gs`. Criar os fixtures (um erro por arquivo, como o aluno com hábito de JavaScript escreveria):

```bash
printf 'uai nome é "Goiás"\nuai idade = 18\nprosa(nome)\n' > fixtures/typical-errors/assign-equals.gs
printf 'const total = 5\nprosa(total)\n' > fixtures/typical-errors/js-const.gs
printf 'uai nome é "Goiás"\nconsole.log(nome)\n' > fixtures/typical-errors/js-console.gs
printf 'uai nome é "Goiás"\nuai preço é 10,50\n' > fixtures/typical-errors/decimal-comma.gs
printf 'uai nome é "Goiás"\nuai cep é 01310\n' > fixtures/typical-errors/leading-zero.gs
printf 'uai saudacao é "Bão, sô\nprosa(saudacao)\n' > fixtures/typical-errors/unterminated-string.gs
printf 'uai idade é 18\nse_ocê_quiser (idade pelo_menos 18) prosa("maior")\n' > fixtures/typical-errors/braceless-body.gs
printf 'uai total é 10\n  mais 5\n' > fixtures/typical-errors/leading-operator.gs
printf 'uai x é 1\nse_não {\n  prosa(x)\n}\n' > fixtures/typical-errors/dangling-else.gs
printf 'faz_trem soma(a, b) {\n  faz_favor a mais b\n' > fixtures/typical-errors/unexpected-eof.gs
printf 'uai nome = "Goiás"\nse_ocê_quiser (nome == "Goiás") {\n  console.log(nome)\n}\nconst idade é 18\nuai preço é 10,50\nprosa("fim")\n' > fixtures/typical-errors/multi-error.gs
```
- [ ] **GREEN.** → 11 testes passam.
- [ ] **Ciclo 3, gerador de 10 mil linhas.** O programa gerado repete um bloco de 16 linhas (função, condicional, callback com bloco, laço) e completa com `// fim` até exatamente 10.000 linhas; `measure.ts` falha se ele não compilar sem erro. Criar `bench/generate-10k.ts`:

```ts
const BLOCK_TEMPLATE: readonly string[] = [
  'uai valor_{n} é {n} mais 2 vezes 3',
  'faz_trem soma_{n}(a, b) {',
  '  faz_favor a mais b',
  '}',
  'se_ocê_quiser (valor_{n} maior_que 10 e_mais num_é (valor_{n} é_igualim 7)) {',
  '  prosa("maior:" mais valor_{n})',
  '} se_não {',
  '  prosa("menor")',
  '}',
  'uai lista_{n} é [1, 2, 3].mapear(x => {',
  '  prosa(x)',
  '  faz_favor x vezes {n}',
  '})',
  'vai_indo (trem i é 0; i menor_que 3; i é i mais 1) {',
  '  prosa(soma_{n}(i, valor_{n}))',
  '}',
];

export const GENERATED_LINE_COUNT = 10_000;

export function generateProgram(lineCount: number = GENERATED_LINE_COUNT): string {
  const lines: string[] = [];
  for (let block = 0; lines.length + BLOCK_TEMPLATE.length <= lineCount; block += 1) {
    lines.push(...BLOCK_TEMPLATE.map((line) => line.replaceAll('{n}', String(block))));
  }
  while (lines.length < lineCount) lines.push('// fim');
  return lines.join('\n');
}
```
- [ ] **Script de medição.** `bench/measure.ts` lê os limites do ADR (nunca de constantes), exige Node 24, conta linhas sem testes e sem a tabela, empacota com `esbuild` e comprime com `node:zlib`, mede `compile()` do programa de 10 mil linhas (mediana de 20 depois de 2 de aquecimento), conta as violações de ESLint em `src/` e grava o relatório:

```ts
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
import { build } from 'esbuild';
import { compile } from '../src/compile.ts';
import { generateProgram } from './generate-10k.ts';

const ROOT = join(import.meta.dirname, '..');
const REQUIRED_NODE_MAJOR = 24;
const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;
const WARMUP_RUNS = 2;
const MEASURED_RUNS = 20;
const TABLE_FILES = new Set(['vocabulary.constants.ts']);
const REPORT_PATH = join(ROOT, '..', '..', 'docs', 'fase-0', 'medicao-poc.json');
const ADR_PATH = join(ROOT, '..', '..', 'docs', 'adr', '0001-front-end-proprio-a-mao.md');

interface Limits { readonly maxSourceLines: number; readonly maxBrotliBytes: number; readonly maxMillisecondsFor10kLines: number; readonly maxProjectedDays: number }

function readLimits(): Limits {
  const block = /```json limits\n([\s\S]*?)\n```/.exec(readFileSync(ADR_PATH, 'utf8'));
  if (!block?.[1]) throw new Error('ADR-0001 sem o bloco "json limits"');
  return JSON.parse(block[1]) as Limits;
}

const countNonBlankLines = (path: string): number => readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '').length;

function countSourceLines(): { sourceLines: number; tableLines: number; files: Record<string, number> } {
  const names = readdirSync(join(ROOT, 'src')).filter((name) => name.endsWith('.ts'));
  const files = Object.fromEntries(names.map((name) => [name, countNonBlankLines(join(ROOT, 'src', name))]));
  const sum = (wanted: boolean): number => names.filter((name) => TABLE_FILES.has(name) === wanted).reduce((total, name) => total + (files[name] ?? 0), 0);
  return { sourceLines: sum(false), tableLines: sum(true), files };
}

async function measureBrotli(): Promise<{ minifiedBytes: number; brotliBytes: number }> {
  const bundle = await build({ entryPoints: [join(ROOT, 'src', 'compile.ts')], bundle: true, minify: true, format: 'esm', platform: 'browser', write: false });
  const code = Buffer.from(bundle.outputFiles[0]?.contents ?? new Uint8Array());
  const brotli = brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } });
  return { minifiedBytes: code.length, brotliBytes: brotli.length };
}

function measureCompileMilliseconds(): { medianMs: number; runsMs: number[] } {
  const program = generateProgram();
  const runsMs: number[] = [];
  for (let run = 0; run < WARMUP_RUNS + MEASURED_RUNS; run += 1) {
    const started = performance.now();
    const result = compile(program);
    const elapsed = performance.now() - started;
    if (!result.ok) throw new Error(`o programa gerado não compilou: ${result.diagnostics[0]?.code ?? '?'}`);
    if (run >= WARMUP_RUNS) runsMs.push(elapsed);
  }
  return { medianMs: median(runsMs), runsMs };
}

function countLintViolations(): Record<string, number> {
  const eslint = join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const run = spawnSync(process.execPath, [eslint, 'src', '--format', 'json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const files = JSON.parse(run.stdout) as { messages: { ruleId: string | null }[] }[];
  const counts: Record<string, number> = {};
  for (const message of files.flatMap((file) => file.messages)) counts[message.ruleId ?? 'sem-regra'] = (counts[message.ruleId ?? 'sem-regra'] ?? 0) + 1;
  return counts;
}

async function main(): Promise<void> {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor !== REQUIRED_NODE_MAJOR) throw new Error(`a medição vale só em Node ${REQUIRED_NODE_MAJOR}; este é ${process.version}`);
  const limits = readLimits();
  const report = {
    node: process.version, machine: { cpu: cpus()[0]?.model ?? 'desconhecida', cores: cpus().length, platform: platform() }, limits,
    ...countSourceLines(), ...(await measureBrotli()), ...measureCompileMilliseconds(), lintViolations: countLintViolations(),
  };
  const verdict = {
    sourceLines: report.sourceLines <= limits.maxSourceLines,
    brotliBytes: report.brotliBytes <= limits.maxBrotliBytes,
    compileMilliseconds: report.medianMs <= limits.maxMillisecondsFor10kLines,
  };
  writeFileSync(REPORT_PATH, `${JSON.stringify({ ...report, verdict }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...report, runsMs: undefined, verdict }, null, 2)}\n`);
}

await main();
```
- [ ] **Medir.** `cd spikes/poc-compiler && corepack pnpm exec tsc --noEmit && npx --yes node@24 bench/measure.ts`. Esperado: JSON com `verdict` por critério e `docs/fase-0/medicao-poc.json` gravado. Referência da implementação de validação deste plano (não é critério): ≈ 1.100 linhas, ≈ 8 KB em brotli, 50–75 ms, ≈ 11 avisos de `functional/immutable-data` e nenhum de tamanho de função; número muito diferente sugere custo quadrático ou parser inchado. **Não mexa nos limites do ADR depois de ver o número**: se um `verdict` for `false`, siga para U0-09, que leva o fato ao dono.
- [ ] **Limpeza e verify.** `corepack pnpm verify` verde. Registrar as horas de U0-05.
- [ ] **Commit.** `git add spikes/poc-compiler docs/fase-0 && git commit -m "test(compiler): mede o poc com demos, erros típicos e orçamento"`.

### U0-06: Spike do sandbox do playground
**Spec:** §6.3, §5.7 (alvo `playground`), §8.2 (E2E de fuga) · **Tier:** medium · **Depende de:** U0-01 · **Risco:** CSP de Worker de blob herda a da página e o isolamento some; iframe pode congelar a página; navegador novo pode mudar a medida · **Rollback:** `git revert`; só U0-09 e a Fase 4 leem o relatório
**Files:** Create `spikes/sandbox/{package.json,playwright.config.mjs}`, `src/{runner-source.mjs,attacks.mjs,server.mjs}`, `public/host.js`, `tests/sandbox.spec.mjs`, `spikes/checks/sandbox-doc.test.mjs`, `docs/fase-0/spike-sandbox.md`
**Interfaces:** Consumes: — (o spike não usa o compilador; o JS emitido preserva linhas, então o programa de teste já é o JS) · Produces: `startServers(): { hostUrl, canaryUrl, canaryHits(), close() }`, `buildAttackProgram(canary)`, `ATTACK_IDS`; o "Candidato escolhido" que o alvo `playground` e a Fase 4 seguem
**Aceite:** o candidato escolhido passa nos 4 critérios nos 3 navegadores (`playwright test --grep <candidato>` com saída 0) e é o mais simples que passa; o relatório traz a tabela medida e o teste `node:test` passa; se nenhum passar, o relatório diz "nenhum" e escala ao dono

- [ ] **Preparo.** Worktree `U0-06`. Criar `spikes/sandbox/package.json` com `{ "name": "sandbox-spike", "version": "0.0.0", "private": true, "type": "module", "scripts": { "test": "playwright test" }, "devDependencies": { "@playwright/test": "1.64.1" } }` (confirmar com `npm view @playwright/test version`), rodar `corepack pnpm install --filter sandbox-spike --ignore-scripts` e `cd spikes/sandbox && corepack pnpm exec playwright install chromium firefox webkit`. Dependências de sistema que faltarem (`playwright install-deps`) pedem `sudo`: **[dono]**.
- [ ] **Teste que falha (o relatório).** `spikes/checks/sandbox-doc.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const doc = readFileSync(new URL('../../docs/fase-0/spike-sandbox.md', import.meta.url), 'utf8');
const CANDIDATES = ['worker-blob', 'worker-file', 'iframe-sandbox'];
const CRITERIA_PER_CANDIDATE = 4;

test('o relatório traz critérios, resultados, decisão e consequências', () => {
  for (const heading of ['## Critérios', '## Resultados', '## Decisão', '## Consequências para a Fase 4']) assert.ok(doc.includes(heading), heading);
});

test('a tabela cobre os 3 candidatos nos 3 navegadores', () => {
  for (const candidate of CANDIDATES) {
    const rows = doc.split('\n').filter((line) => line.startsWith(`| ${candidate} › `));
    assert.equal(rows.length, CRITERIA_PER_CANDIDATE, candidate);
    for (const row of rows) assert.match(row, /\| (passou|FALHOU) \| (passou|FALHOU) \| (passou|FALHOU) \|$/, row);
  }
});

test('o candidato escolhido passa em todos os critérios nos 3 navegadores', () => {
  const chosen = /\*\*Candidato escolhido:\*\* (worker-blob|worker-file|iframe-sandbox|nenhum)/.exec(doc)?.[1];
  assert.ok(chosen, 'linha "Candidato escolhido" ausente');
  if (chosen === 'nenhum') return assert.ok(doc.includes('**Escalado ao dono:** sim'));
  for (const row of doc.split('\n').filter((line) => line.startsWith(`| ${chosen} › `))) assert.ok(!row.includes('FALHOU'), row);
});
```
- [ ] **RED.** `node --test spikes/checks/sandbox-doc.test.mjs` → `ENOENT … docs/fase-0/spike-sandbox.md`.
- [ ] **Teste que falha (a matriz).** `spikes/sandbox/tests/sandbox.spec.mjs` roda, por candidato, os 4 critérios: 6 ataques com um canário HTTP que registra qualquer requisição, o mesmo com a página host liberando rede, a linha do erro e o laço infinito:

```js
import { expect, test } from '@playwright/test';
import { ATTACK_IDS, HOST_SECRET, LINE_PROGRAM, LOOP_PROGRAM, buildAttackProgram } from '../src/attacks.mjs';
import { startServers } from '../src/server.mjs';

const CANDIDATES = ['worker-blob', 'worker-file', 'iframe-sandbox'];
const FREEZE_LIMIT_MS = 3000;
const RESPONSIVE_GAP_MS = 250;
const LOOP_OBSERVATION_MS = 600;
const EXPECTED_ERROR_LINE = 3;
const WAIT_TIMEOUT_MS = 10_000;

let servers;
test.beforeAll(async () => { servers = await startServers(); });
test.afterAll(async () => { await servers.close(); });

const finished = () => window.sandboxMessages.some((message) => message.type === 'done' || message.type === 'error');
const loopStarted = () => window.sandboxMessages.some((message) => message.type === 'loop-started');

async function openAndRun(page, candidate, code, until, query = '') {
  await page.goto(`${servers.hostUrl}/${candidate}.html${query}`);
  await page.evaluate((program) => window.start(program), code);
  await page.waitForFunction(until, null, { timeout: WAIT_TIMEOUT_MS });
}

const snapshot = (page) => page.evaluate(() => ({ messages: window.sandboxMessages, maxGap: window.heartbeat.maxGap }));

async function expectAttacksBlocked(page, candidate, query) {
  const before = servers.canaryHits().length;
  await openAndRun(page, candidate, buildAttackProgram(servers.canaryUrl), finished, query);
  const { messages } = await snapshot(page);
  const attacks = Object.fromEntries(messages.filter((message) => message.type === 'attack').map((message) => [message.id, message]));
  expect(Object.keys(attacks).sort()).toEqual([...ATTACK_IDS].sort());
  for (const id of ATTACK_IDS.filter((name) => name !== 'host-secrets')) expect(attacks[id].outcome, id).toBe('blocked');
  expect(attacks['host-secrets'].detail).not.toContain(HOST_SECRET);
  expect(servers.canaryHits().length - before).toBe(0);
}

for (const candidate of CANDIDATES) {
  test.describe(candidate, () => {
    test('nenhum ataque alcança o canário e nenhum segredo do host vaza', async ({ page }) => {
      await expectAttacksBlocked(page, candidate, '');
    });

    test('com a rede da página liberada, o isolamento não herda a CSP do host', async ({ page }) => {
      await expectAttacksBlocked(page, candidate, '?net=1');
    });

    test('o erro de execução aponta a linha exata do programa', async ({ page }) => {
      await openAndRun(page, candidate, LINE_PROGRAM, finished);
      const { messages } = await snapshot(page);
      const error = messages.find((message) => message.type === 'error');
      expect(error?.name).toBe('ReferenceError');
      const frame = /blob:\S*?:(\d+):(\d+)/.exec(error.stack);
      expect(Number(frame?.[1])).toBe(EXPECTED_ERROR_LINE);
    });

    test('laço infinito não congela a página e o encerramento funciona', async ({ page }) => {
      await openAndRun(page, candidate, LOOP_PROGRAM, loopStarted);
      await page.waitForTimeout(LOOP_OBSERVATION_MS);
      const outcome = await Promise.race([
        page.evaluate(() => { window.stop(); return window.heartbeat.maxGap; }),
        new Promise((resolve) => setTimeout(() => resolve('freeze'), FREEZE_LIMIT_MS)),
      ]);
      expect(outcome).not.toBe('freeze');
      expect(outcome).toBeLessThan(RESPONSIVE_GAP_MS);
    });
  });
}
```
`playwright.config.mjs`:

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  workers: 1,
  reporter: 'list',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```
- [ ] **RED.** `corepack pnpm exec playwright test --project=chromium` → `Cannot find module '../src/attacks.mjs'`.
- [ ] **Implementar a matriz.** O programa roda por `import()` de um blob dentro do isolamento; nenhuma CSP tem `unsafe-eval`. `src/runner-source.mjs` (o runner, igual nos três candidatos) e `src/attacks.mjs` (os 6 ataques, o programa de linha e o laço):

```js
// Roda dentro do isolamento (Worker de módulo ou iframe): executa o programa por import() de um blob.
export const RUNNER_SOURCE = `
globalThis.report = (message) => (typeof parent === 'undefined' ? self.postMessage(message) : parent.postMessage(message, '*'));
addEventListener('message', async ({ data }) => {
  try {
    await import(URL.createObjectURL(new Blob([data.code], { type: 'text/javascript' })));
    report({ type: 'done' });
  } catch (error) {
    report({ type: 'error', name: String(error?.name), stack: String(error?.stack) });
  }
});
`;
```
```js
export const HOST_SECRET = 'host-secret-value';
export const ATTACK_IDS = ['fetch', 'xhr', 'websocket', 'dynamic-import', 'eval-escape', 'host-secrets'];
export const LINE_PROGRAM = 'const first = 1;\nconst second = 2;\nnaoExiste();\n';
export const LOOP_PROGRAM = 'report({ type: "loop-started" });\nwhile (true) {}\n';

// Cada ataque roda como se fosse o programa do aluno; `report` vem do runner.
export function buildAttackProgram(canary) {
  return `
const CANARY = ${JSON.stringify(canary)};
const attempt = async (id, action) => {
  try {
    report({ type: 'attack', id, outcome: 'allowed', detail: String(await action()) });
  } catch (error) {
    report({ type: 'attack', id, outcome: 'blocked', detail: String(error?.name ?? error) });
  }
};
const whenSettled = (setup) => new Promise((resolve, reject) => { setup(resolve, reject); setTimeout(() => reject(new Error('Timeout')), 1500); });
await attempt('fetch', () => fetch(CANARY + '/fetch').then((response) => response.status));
await attempt('xhr', () => whenSettled((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.open('GET', CANARY + '/xhr');
  request.onload = () => resolve(request.status);
  request.onerror = () => reject(new Error('XhrBlocked'));
  request.send();
}));
await attempt('websocket', () => whenSettled((resolve, reject) => {
  const socket = new WebSocket(CANARY.replace('http', 'ws') + '/websocket');
  socket.onopen = () => resolve('open');
  socket.onerror = () => reject(new Error('SocketBlocked'));
}));
await attempt('dynamic-import', () => import(CANARY + '/evil.js'));
await attempt('eval-escape', () => {
  const key = 'con' + 'structor';
  return [Function('return 42')(), [].constructor.constructor('return 42')(), [][key][key]('return 42')()];
});
await attempt('host-secrets', () => [
  typeof document === 'undefined' ? 'sem-document' : document.cookie,
  typeof localStorage === 'undefined' ? 'sem-localStorage' : localStorage.getItem('secret'),
  typeof parent === 'undefined' || parent === self ? 'sem-parent' : parent.document.cookie,
].join('|'));
`;
}
```
`src/server.mjs` exporta `startServers()`: um servidor canário que registra todo `method url` recebido (`canaryHits()`) e um servidor host com as rotas `/<candidato>.html` (`worker-blob`, `worker-file`, `iframe-sandbox`), `/host.js`, `/runner.js`, `/runner-source.mjs` (exporta `RUNNER_SOURCE`) e `/frame.html`. CSP isolada: `default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'`; vai no cabeçalho de `/runner.js` e de `/frame.html` (este com `; sandbox allow-scripts`). A página host do `worker-blob` usa essa mesma política, só com `connect-src 'self'` mais o canário quando a URL tem `?net=1` (simula a página real, que precisa de rede para o Engoianador); as do `worker-file` e do `iframe-sandbox` usam `default-src 'self'; script-src 'self'; worker-src 'self'; frame-src 'self'; connect-src 'self'` (mais o canário em `?net=1`). `public/host.js` expõe `window.start(code)`, `window.stop()`, `window.sandboxMessages` e `window.heartbeat.maxGap` (batimento a cada 50 ms), grava `document.cookie` e `localStorage` com `host-secret-value` e, por candidato, cria o Worker de módulo (de blob para `worker-blob`, de `/runner.js` para `worker-file`) ou o iframe `sandbox="allow-scripts"` apontando para `/frame.html`; as mensagens do Worker e as do iframe (`message` na janela) caem em `sandboxMessages`.
- [ ] **Medir.** `corepack pnpm exec playwright test` (≈ 2,5 min; o laço infinito do iframe congela a página e espera 30 s por navegador). Esperado, e é o fato que decide: `worker-file` passa nos 4 critérios em Chromium, Firefox e WebKit; `worker-blob` falha o critério 2 nos três (herda a CSP da página); `iframe-sandbox` falha o critério 4 nos três (congela a página). Prova do candidato escolhido: `corepack pnpm exec playwright test --grep worker-file` → saída 0.
- [ ] **Relatório.** Criar `docs/fase-0/spike-sandbox.md` com as seções `## Critérios` (os 4, com a definição de cada candidato), `## Resultados`, `## Decisão` e `## Consequências para a Fase 4`. Em `## Resultados`, uma linha por candidato e critério, na forma `| <candidato> › <título do teste> | passou | passou | passou |` (colunas chromium, firefox, webkit; `FALHOU` onde falhou), copiada da saída do `playwright test`: 12 linhas. Em `## Decisão`, `**Candidato escolhido:** <candidato>` e `**Escalado ao dono:** sim|não`, com a regra (o mais simples que passa nos 4 critérios nos 3 navegadores) e o motivo de cada reprovação. Em `## Consequências`, o que a Fase 4 herda: runner estático `/sandbox/runner.js` com a CSP isolada por cabeçalho no `vercel.json`, JS emitido entregue por `postMessage` e executado por `import()` de blob (módulo ES, `await` de topo, linha exata no `stack`), `pergunta` e saída como mensagens ao host, encerramento por `worker.terminate()`, e o E2E do playground reaproveitando `attacks.mjs` com `x["con" mais "structor"]` compilado.
- [ ] **GREEN.** `node --test spikes/checks/` → os testes do relatório passam.
- [ ] **Limpeza.** `spikes/sandbox/.gitignore` com `test-results/` e `playwright-report/`; sem caminho de máquina nos arquivos.
- [ ] **Commit.** `git add spikes docs/fase-0 pnpm-lock.yaml && git commit -m "test(playground): compara isolamentos do sandbox e documenta o spike"`.

### U0-07: Decisão do método de publicação da extensão (sem PAT)
**Spec:** §6.5, §10.3, ADR-0009 · **Tier:** small · **Depende de:** — · **Risco:** os PATs globais do Azure DevOps acabam em 2026-12-01, antes do fim da Fase 5; `vsce publish --oidc` é opção oculta no `--help` e só o README do vsce 4.0.0 a descreve · **Rollback:** `git revert` do relatório; a branch descartável e a identidade no Azure são do dono
**Files:** Create `docs/fase-0/publicacao-extensao.md`, `spikes/publish/verify-entra.workflow.yml` (modelo, fora de `.github/` para não rodar sozinho) · Test `spikes/checks/publication-doc.test.mjs`
**Interfaces:** Consumes: — · Produces: "Método escolhido" e a evidência de execução que entram no ADR-0009 e no `release.yml` da Fase 5
**Aceite:** uma execução real de GitHub Actions com `vsce verify-pat <publisher> --azure-credential` (ou, na falta, `vsce publish --oidc` de uma extensão descartável) termina com sucesso e a URL está no relatório; sem a execução, o método é "nenhum (escalado ao dono)" e o dono decide antes de 2026-12-01

- [ ] **Preparo.** Worktree `U0-07` (parte de `v3/fase-0`; não toca em `spikes/poc-compiler`).
- [ ] **Teste que falha.** `spikes/checks/publication-doc.test.mjs`:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const doc = readFileSync(new URL('../../docs/fase-0/publicacao-extensao.md', import.meta.url), 'utf8');
const METHODS = ['Entra ID federado (--azure-credential)', 'vsce --oidc', 'nenhum (escalado ao dono)'];
const ACTIONS_RUN_URL = /https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/actions\/runs\/(?!0+\b)\d+/;

test('o documento traz decisão, evidências, prazo e a entrada do ADR-0009', () => {
  for (const heading of ['## Decisão', '## Evidências', '## Prazo e fallback', '## Entrada para o ADR-0009']) assert.ok(doc.includes(heading), heading);
  assert.ok(doc.includes('2026-12-01'), 'prazo dos PATs');
  assert.ok(/Open VSX/.test(doc) && /escopo/i.test(doc), 'token restrito do Open VSX');
});

test('a decisão é um dos métodos permitidos e vem com a execução real que a prova', () => {
  const method = /\*\*Método escolhido:\*\* (.+)/.exec(doc)?.[1]?.trim();
  assert.ok(METHODS.includes(method ?? ''), `método inválido: ${method}`);
  if (method !== 'nenhum (escalado ao dono)') assert.match(doc, ACTIONS_RUN_URL);
});
```
- [ ] **RED.** `node --test spikes/checks/publication-doc.test.mjs` → `ENOENT … docs/fase-0/publicacao-extensao.md`.
- [ ] **Fatos que não dependem de conta** (anotar a saída no relatório): `npm view @vscode/vsce version dist-tags`; `npx --yes @vscode/vsce@4.0.0 publish --help | grep -c -- '--oidc'` → `0` (oculta) e `| grep -c -- '--azure-credential'` → `1`; `npm pack @vscode/vsce@4.0.0 && tar xzf vscode-vsce-4.0.0.tgz` e `grep -n "OIDC_AUDIENCE\|oidcTokenProviders" package/out/oidc.js` → audiência `marketplace.visualstudio.com` e único provedor "GitHub Actions"; `grep -n "499b84ac" package/out/auth.js` → o `--azure-credential` pede token do Azure DevOps por `EnvironmentCredential`, `AzureCliCredential` ou identidade gerenciada. Confirmar a documentação oficial de publicação por Entra ID com o Context7.
- [ ] **Execução real (identidade e conta)** — **[dono]**, cada passo com aprovação explícita: (1) registrar um aplicativo Entra ID e uma credencial federada para o GitHub (`repo:<org>/<repo>:environment:marketplace`); (2) adicionar o principal como membro do publisher no Marketplace; (3) numa branch descartável, copiar o modelo abaixo para `.github/workflows/verify-entra.yml`, resolvendo os SHAs com `gh api repos/azure/login/commits/v2 --jq .sha` e `gh api repos/actions/setup-node/commits/v4 --jq .sha`, e disparar por `workflow_dispatch`; (4) copiar a URL da execução; (5) apagar a branch. Se o Marketplace oferecer política de publicação confiável para o repositório e o dono preferir o caminho sem Azure, repetir com `npx @vscode/vsce publish --oidc` de uma extensão descartável e despublicar depois.

```yaml
name: verify-entra
on: workflow_dispatch
permissions:
  contents: read
  id-token: write
jobs:
  verify:
    runs-on: ubuntu-latest
    environment: marketplace
    steps:
      - uses: azure/login@${LOGIN_SHA}
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          allow-no-subscriptions: true
      - uses: actions/setup-node@${SETUP_NODE_SHA}
        with:
          node-version: 22
      - run: npx --yes @vscode/vsce@4.0.0 verify-pat "$PUBLISHER" --azure-credential
        env:
          PUBLISHER: ${{ vars.MARKETPLACE_PUBLISHER }}
```
- [ ] **Regra de decisão.** Execução de `--azure-credential` com sucesso → "Entra ID federado (--azure-credential)" (documentada, sem segredo de longa duração). Senão, execução de `--oidc` com sucesso → "vsce --oidc" (opção não documentada fora do README). Senão → "nenhum (escalado ao dono)", com o prazo de 2026-12-01.
- [ ] **Relatório.** Criar `docs/fase-0/publicacao-extensao.md` com `## Decisão` (`**Método escolhido:** Entra ID federado (--azure-credential)` ou `vsce --oidc` ou `nenhum (escalado ao dono)`, e o motivo), `## Evidências` (a saída dos fatos acima e, fora de "nenhum", a URL real `https://github.com/<org>/<repo>/actions/runs/<número>`; o teste recusa número só de zeros), `## Prazo e fallback` (PATs globais do Azure DevOps aposentados em 2026-12-01, antes do fim da Fase 5; sem a execução até lá, o dono decide entre PAT de escopo mínimo só para a primeira publicação e adiar a Fase 5) e `## Entrada para o ADR-0009` (Marketplace pelo método escolhido, Open VSX por token de escopo restrito guardado só no ambiente de release e usado só no job de publicação, `release.yml` com `permissions: id-token: write` e ambiente protegido, reavaliar `--oidc` quando sair do `--help` oculto).
- [ ] **GREEN.** `node --test spikes/checks/` → os testes do relatório passam.
- [ ] **Limpeza.** Sem segredo, ID de tenant nem token no relatório; o modelo de workflow usa só `vars.*`.
- [ ] **Commit.** `git add docs/fase-0 spikes && git commit -m "docs(vscode): decide o método de publicação sem pat"`.

### U0-08: Rascunho da RFC-0001 e `docs/spec/gramatica.md`
**Spec:** §4, §9.3, §3.1 (P8–P13, P15, P16) · **Tier:** large · **Depende de:** U0-03 · **Risco:** a RFC é bloqueio independente do gate e depende do dono e de 2 a 3 falantes de Goiás; nome sem resposta ao teste da prosa passa batido se o teste de estrutura for frouxo · **Rollback:** `git revert`; nada de código depende da RFC antes da Fase 2
**Files:** Create `docs/rfc/0001-vocabulario-e-biblioteca.md`, `docs/spec/gramatica.md`, `spikes/poc-compiler/bench/{js-members.ts,rfc-tables.ts}` · Test `spikes/poc-compiler/tests/rfc-0001.test.ts`
**Interfaces:** Consumes: `KEYWORDS`, o texto de `src/parser.ts` (U0-02/U0-03), as tabelas do spec §3.1, §4.2, §4.7 e §4.9, o runtime da 1.5 (`packages/core/src/goianoMethods/GoianoBuiltins.js`, ainda no checkout) · Produces: RFC com vocabulário, decisões de gramática (§4.7), biblioteca (origem, forma verbal e teste da prosa por nome), propostas P8–P13, P15 e P16 para o dono e anexos A–F; EBNF com ids `Gnn` estáveis
**Aceite:** o teste confere nomes do spec × RFC, origem e respostas do teste da prosa de toda proposta, a lista exata de propostas, o anexo A cobrindo o runtime da 1.5, uma produção por instrução do parser e as keywords e operadores do parser na gramática; as colunas "Decisão do dono" ficam `pendente` até o dono aprovar (GATE 0)

- [ ] **Preparo.** Worktree `U0-08` (depois de U0-03).
- [ ] **Teste que falha.** `tests/rfc-0001.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readTable, REPO_ROOT, SPEC_PATH } from '../bench/rfc-tables.ts';
import { KEYWORDS } from '../src/vocabulary.constants.ts';

const read = (...parts: string[]): string => readFileSync(join(REPO_ROOT, ...parts), 'utf8');
const rfc = read('docs', 'rfc', '0001-vocabulario-e-biblioteca.md');
const grammar = read('docs', 'spec', 'gramatica.md');
const spec = readFileSync(SPEC_PATH, 'utf8');
const LIBRARY_HEADER = '| Área | GoiásScript | JavaScript | Semântica | Origem';
const OWNER_PROPOSALS = ['P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P15', 'P16'];
const REQUIRED_LIBRARY_GAPS = ['JSON.stringify', 'JSON.parse', 'Promise.all', '.some', '.every', '.splice', '.findIndex', 'Date.now'];
const VERBAL_FORMS = new Set(['imperativo', 'infinitivo', 'substantivo']);
const ANSWERS = new Set(['sim', 'não']);
const REQUIRED_HEADINGS = [
  '## 2. Vocabulário', '## 3. Alfabeto', '## 4. Decisões de gramática', '## 5. Biblioteca padrão', '## 6. Propostas',
  '### Anexo A', '### Anexo B', '### Anexo C', '### Anexo D', '### Anexo E', '### Anexo F', '## 8. Notas de migração', '## 9. Aprovação',
];
const STATEMENT_PRODUCTIONS: Readonly<Record<string, string>> = {
  VariableDeclaration: 'G03', FunctionDeclaration: 'G04', IfStatement: 'G07', WhileStatement: 'G08', ForStatement: 'G10',
  ForEachStatement: 'G11', TryStatement: 'G12', ClassDeclaration: 'G15', ReturnStatement: 'G17', JumpStatement: 'G18',
  ThrowStatement: 'G19', ExpressionStatement: 'G20',
};

describe('RFC-0001 (rascunho)', () => {
  it('não deixa marcador de geração e tem as seções e anexos da §9.3', () => {
    expect(rfc).not.toContain('<!-- gerado:');
    for (const heading of REQUIRED_HEADINGS) expect(rfc, heading).toContain(heading);
  });

  it('lista todo nome do vocabulário (§4.2) e da biblioteca (§4.9) do spec', () => {
    const names = [...readTable(spec, '| Categoria | GoiásScript'), ...readTable(spec, '| Área | GoiásScript')].map((row) => row[1] ?? '');
    expect(names.length).toBeGreaterThan(100);
    for (const name of names) expect(rfc, name).toContain(name.replaceAll('|', '\\|'));
  });

  it('registra origem, forma verbal e as duas respostas do teste da prosa por nome', () => {
    const rows = readTable(rfc, LIBRARY_HEADER);
    expect(rows.length).toBe(readTable(spec, '| Área | GoiásScript').length);
    for (const [, name = '', , , origin = '', form = '', proseA = '', proseB = ''] of rows) {
      expect(['dono', '1.5', 'proposta'], name).toContain(origin);
      if (origin !== 'proposta') continue;
      expect(VERBAL_FORMS.has(form), `${name}: forma verbal`).toBe(true);
      expect(ANSWERS.has(proseA) && ANSWERS.has(proseB), `${name}: teste da prosa`).toBe(true);
    }
  });

  it('o anexo A cobre todo nome goiano do runtime da 1.5', () => {
    const builtins = read('packages', 'core', 'src', 'goianoMethods', 'GoianoBuiltins.js');
    const block = /this\.metodosGoianos = \{([\s\S]*?)\n\s{4}\};/.exec(builtins)?.[1] ?? '';
    const names = [...block.matchAll(/^\s+(\w+): '(\w+)',/gm)].map((match) => match[2] ?? '');
    const annex = rfc.slice(rfc.indexOf('### Anexo A'), rfc.indexOf('### Anexo B'));
    expect(names.length).toBeGreaterThan(40);
    for (const name of names) expect(annex, name).toContain(name);
  });

  it('põe as propostas P8–P13, P15 e P16 na decisão do dono', () => {
    expect(readTable(rfc, '| # | Proposta').map((row) => row[0])).toEqual(OWNER_PROPOSALS);
  });

  it('o anexo D traz cada lacuna obrigatória da §4.9 com decisão do dono', () => {
    const annex = rfc.slice(rfc.indexOf('### Anexo D'), rfc.indexOf('### Anexo E'));
    const rows = readTable(annex, '| Item |');
    for (const gap of REQUIRED_LIBRARY_GAPS) {
      const row = rows.find((cells) => cells.some((cell) => cell.includes(gap)));
      expect(row, gap).toBeDefined();
      expect(row?.at(-1), `${gap}: decisão do dono`).toMatch(/^(pendente|aprovad[oa]|fora da v3)/);
    }
  });
});

describe('gramática (EBNF) coerente com o protótipo', () => {
  it('tem uma produção para cada tipo de instrução do parser', () => {
    for (const id of Object.values(STATEMENT_PRODUCTIONS)) expect(grammar, id).toMatch(new RegExp(`^${id} `, 'm'));
  });

  it('cita toda keyword que o parser trata como início de instrução e todo operador da tabela de precedência', () => {
    const parser = readFileSync(join(import.meta.dirname, '..', 'src', 'parser.ts'), 'utf8');
    const statementKeywords = [...parser.matchAll(/case '([a-zçãáéíóúêôõ_]+)'/g)].map((match) => match[1] ?? '').filter((word) => KEYWORDS.has(word));
    expect(statementKeywords.length).toBeGreaterThan(10);
    for (const keyword of statementKeywords) expect(grammar, keyword).toContain(`"${keyword}"`);
    const operatorWords = [...KEYWORDS.values()].filter((entry) => /^[a-zç_é]+$/.test(entry.spelling) && ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '===', '!==', '&&', '||'].includes(entry.js));
    for (const entry of operatorWords) expect(grammar, entry.spelling).toContain(`\`${entry.spelling}\``);
  });
});
```
- [ ] **RED.** `corepack pnpm exec vitest run tests/rfc-0001.test.ts` → `ENOENT … docs/rfc/0001-vocabulario-e-biblioteca.md`.
- [ ] **Gramática.** Criar `docs/spec/gramatica.md`: título, a frase de que é lista de permissão (o que não está aqui é `GS0500`) e de que os ids `Gnn` são estáveis, o bloco EBNF abaixo, a tabela G24 de precedência (um nível por linha, com os operadores em crase, igual a `BINARY_PRECEDENCE`) e as regras G42–G45 da §4.6 (agrupamento ignora a quebra; ela também é ignorada depois de operador, `é`, `,`, `.`, `=>`, `(`, `[`, `{` e antes de `.`; `se_num_for`/`se_não`/`se_der_ruim`/`por_fim` continuam a instrução; linha que começa com operador binário é `GS0203`):

```ebnf
G01 Program     = { Separator | Statement } ;
G02 Statement   = VarDecl | FuncDecl | ClassDecl | If | While | For | Try | Return | Jump | Throw | ExprStmt ;
G03 VarDecl     = ( "uai" | "trem" ) Name [ "é" Expr ] ;               (* "uai" sem valor: GS0307 *)
G04 FuncDecl    = [ "vai_na_frente" ] "faz_trem" Name Params Block
                | "vai_na_frente_faz_trem" Name Params Block ;
G05 Params      = "(" [ Name { "," Name } [ "," ] ] ")" ;
G06 Block       = "{" { Separator | Statement } "}" ;                   (* corpo sempre entre chaves: GS0207 *)
G07 If          = "se_ocê_quiser" "(" Expr ")" Block { "se_num_for" "(" Expr ")" Block } [ "se_não" Block ] ;
G08 While       = "enquanto_tiver" "(" Expr ")" Block ;
G09 For         = "vai_indo" "(" ( ForClassic | ForEach ) ")" Block ;
G10 ForClassic  = [ VarDecl | Expr ] ";" [ Expr ] ";" [ Expr ] ;
G11 ForEach     = ( "uai" | "trem" ) Name ( "de" | "em" ) Expr ;        (* "de" e "em" só aqui são keywords *)
G12 Try         = "tenta_aí" Block ( Catch [ Finally ] | Finally ) ;
G13 Catch       = "se_der_ruim" [ "(" Name ")" ] Block ;
G14 Finally     = "por_fim" Block ;
G15 ClassDecl   = "arruma_trem" Name [ "inherda_de" Postfix ] "{" { Method } "}" ;
G16 Method      = [ "num_muda" ] [ "vai_na_frente" ] ( "aprepara_trem" | PropName ) Params Block ;
G17 Return      = "faz_favor" [ Expr ] ;                                (* quebra depois: devolve indefinido *)
G18 Jump        = "para_com_isso" | "continua_aí" ;
G19 Throw       = "vixe" "(" Expr ")" ;                                 (* instrução; um argumento: GS0206 *)
G20 ExprStmt    = Expr ;

G21 Expr        = Assign ;
G22 Assign      = Binary [ "é" Assign ] ;                               (* alvo: nome ou membro: GS0209 *)
G23 Binary      = Unary { BinOp Unary } ;                               (* precedência: tabela G24 *)
G25 Unary       = ( "num_é" | "menos" | "-" | "espera_um_cadim" ) Unary | Postfix ;
G26 Postfix     = Primary { Args | "[" Expr "]" | "." PropName } ;
G27 Primary     = Number | String | Literal | Name | "ocê" | "a_raiz" | New | Array | Object | Arrow | "(" Expr ")" ;
G28 New         = "faz_um" Postfix [ Args ] ;
G29 Arrow       = ( Name | Params ) "=>" ( Block | Expr ) ;             (* quebra antes do "=>": GS0204 *)
G30 Args        = "(" [ Expr { "," Expr } [ "," ] ] ")" ;
G31 Array       = "[" [ Expr { "," Expr } [ "," ] ] "]" ;
G32 Object      = "{" [ Pair { "," Pair } [ "," ] ] "}" ;
G33 Pair        = ( PropName | String | Number ) ":" Expr ;
G34 Literal     = "certeza" | "de_jeito_nenhum" | "nada" | "indefinido" ;
G35 PropName    = Name | AnyKeyword ;                                   (* depois de ".", antes de ":" e em método *)

G40 Separator   = Newline | ";" ;
G41 Terminator  = Separator | "}" | EndOfFile ;                         (* termina instrução simples *)
```
- [ ] **Geradores das tabelas.** O rascunho nasce das tabelas do spec, para não haver nome esquecido ou copiado errado. `bench/js-members.ts` lista os membros nativos de `lib.es2023.d.ts` do TypeScript fixado (nunca do motor: ele muda entre Node 22 e 24): cria um `ts.createProgram` com `lib: ['lib.es2023.d.ts']` sobre um arquivo virtual que declara um valor de cada receptor (`unknown[]`, `string`, `Object`, `Promise`, `number`, `Date`, `Error`, os `*Constructor`, `Math`, `JSON`) e devolve `Map<receptor, nomes[]>` por `checker.getPropertiesOfType`, sem os símbolos `__@…`. `bench/rfc-tables.ts` exporta `readTable(markdown, headerPrefix)` (linhas de dados da primeira tabela cujo cabeçalho começa com o prefixo; `|` escapado como `\|`), `REPO_ROOT` (`GS_REPO` ou três níveis acima) e `SPEC_PATH`, e quando executado troca cada `<!-- gerado:nome -->` do arquivo recebido por uma tabela. Seções: `vocabulario` (§4.2 + `Variante sem acento` + `Decisão do dono`), `gramatica` (§4.7; propostas P1–P7, P14 e P17 saem `aprovada no spec`), `biblioteca` (§4.9 + `Origem`: ✅ é `dono`, `(1.5)` é `1.5`, o resto `proposta`; `Forma verbal`, `Prosa (a)` e `Prosa (b)` herdados para dono e 1.5, `pendente` para proposta), `aposentadas` (§4.2), `propostas` (linhas de §3.1 com `RFC-0001`) e `membros-nativos` (`js-members` menos os nomes JS da tabela da §4.9). A execução só escreve quando `process.argv[1]` termina em `rfc-tables.ts`, para o teste poder importar `readTable`.
- [ ] **RFC.** Criar `docs/rfc/0001-vocabulario-e-biblioteca.md` com o esqueleto abaixo e rodar `cd spikes/poc-compiler && node bench/rfc-tables.ts ../../docs/rfc/0001-vocabulario-e-biblioteca.md` (o script reescreve o arquivo; depois a RFC é editada à mão). Preencher os anexos D (as lacunas obrigatórias (a)–(g) da §4.9 do spec, uma linha por item, com a decisão `pendente` até o dono escolher o nome ou registrar "fora da v3" com o GS0406/GS0403 e a alternativa; (a) também decide `vira_texto(lista)` e `vira_texto(coisa)`; mais `h` para as achadas ao passar os exemplos e o demo pelo mundo fechado) e E (as alternativas de nome da §4.9) como tabelas `| Item | … | Decisão do dono |`, o F com o parecer dos falantes e o §8 com a migração (`.tamanho()` → `.tamanho`, `trem` → `let`, palavras do anexo B só melhoram o erro GS0306). Cada seção numerada, anexo e a tabela do anexo A têm este cabeçalho (os marcadores ficam onde indicado):

```markdown
# RFC-0001: Vocabulário e biblioteca padrão do GoiásScript 3

| Campo | Valor |
|---|---|
| Status | rascunho da Fase 0; o dono aprova nome a nome |
| Spec | §3.1, §4 e §9.3 de `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` |
| Decide | P8, P9, P10, P11, P12, P13, P15 e P16 |

## 1. Resumo
(Congela keywords, operadores, alfabeto, gramática e biblioteca; mudar nome depois é MAJOR, spec §9.5; falantes de Goiás dão parecer consultivo, a decisão é do dono, D8.)

## 2. Vocabulário (keywords, operadores e literais)
<!-- gerado:vocabulario -->

## 3. Alfabeto de identificadores (P5)
(`A–Z`, `a–z`, letras acentuadas do português em NFC, `0–9` e `_`; fora disso é GS0104; ampliar só por RFC.)

## 4. Decisões de gramática (§4.7)
<!-- gerado:gramatica -->

## 5. Biblioteca padrão
(Teste da prosa: (a) alguém de Goiás diria isso numa prosa, ou o nome é composição transparente de palavras que se dizem? (b) o nome não é calco de termo técnico do inglês ou do JavaScript? Responder `sim` ou `não`. Forma verbal: `imperativo`, `infinitivo` ou `substantivo`.)
<!-- gerado:biblioteca -->

## 6. Propostas para decisão do dono
<!-- gerado:propostas -->

## 7. Anexos

### Anexo A. De-para 1.5 → v3

| JavaScript | Nome no CLAUDE.md | Nome no runtime 1.5 | Nome na v3 | Semântica | Decisão do dono |
|---|---|---|---|---|---|

### Anexo B. Palavras aposentadas (`retiredWords`, P13)
<!-- gerado:aposentadas -->

### Anexo C. Membros nativos do JavaScript sem nome goiano (ES2023)
<!-- gerado:membros-nativos -->

### Anexo D. Lacunas da biblioteca

### Anexo E. Alternativas de nome

### Anexo F. Parecer dos falantes de Goiás

## 8. Notas de migração

## 9. Aprovação do dono
```
- [ ] **Completar à mão, como autor.** (a) **Teste da prosa** das linhas `proposta` da §5: forma verbal e `sim`/`não` para (a) e (b); `não` em (b) quando o nome é calco (`sem_sinal` vem de *unsigned*), com o motivo. (b) **Anexo A:** `node -e "const s=require('fs').readFileSync('packages/core/src/goianoMethods/GoianoBuiltins.js','utf8');const b=/this\.metodosGoianos = \{([\s\S]*?)\n\s{4}\};/.exec(s)[1];for(const m of b.matchAll(/^\s+(\w+): '(\w+)',/gm))console.log(m[1],m[2])"` e `grep -n '→' CLAUDE.md`; uma linha por nome, com o nome v3 da §5 (`replace` → `.trocar`, `parseInt` → `vira_número`) ou "sem equivalente na v3". (c) Passar o `demo` do vídeo e os exemplos de `docs/` pelo mundo fechado; lacuna nova vira linha `h` do anexo D.
- [ ] **GREEN.** o mesmo comando do teste → 8 testes passam.
- [ ] **Limpeza e verify.** `corepack pnpm verify` verde; a RFC não cita caminho de máquina nem o material pessoal do histórico. Registrar as horas.
- [ ] **Revisão e GATE 0 (fora do código).** Revisor em contexto fresco confere a RFC contra a §4; o dono recolhe o parecer de 2 a 3 falantes de Goiás (anexo F) e decide: **[dono]** P8, P9, P10, P11, P12, P13, P15 e P16; **[dono]** cada linha da biblioteca (inclui `oce`/`senao`, as lacunas do anexo D e as alternativas do anexo E); **[dono]** `Status | aprovada em AAAA-MM-DD`, que é o que o veredito de U0-09 lê.
- [ ] **Commit.** `git add docs/rfc docs/spec spikes/poc-compiler docs/fase-0 && git commit -m "docs(docs): adiciona rascunho da rfc-0001 e a gramática ebnf"`.

### U0-09: Relatório do gate da Fase 0 e extrapolação da Fase 2
**Spec:** §10.1 F0 (critérios a–f), §9.2 (ADR-0001), §12 · **Tier:** small · **Depende de:** U0-05, U0-06, U0-07, U0-08 · **Risco:** relatório suavizar um critério que falhou, ou a fórmula da projeção ser refeita depois de ver o resultado · **Rollback:** `git revert`; o GATE 0 não abre sem este relatório
**Files:** Create `docs/fase-0/{projecao.json,relatorio-gate.md}` · Modify `docs/adr/0001-front-end-proprio-a-mao.md` (seção "Resultado da Fase 0"), `docs/fase-0/horas.md` · Test `spikes/checks/gate-report.test.mjs`
**Interfaces:** Consumes: `docs/fase-0/medicao-poc.json` e `horas.md` (U0-05), `spike-sandbox.md` (U0-06), `publicacao-extensao.md` (U0-07), o `Status` da RFC-0001 (U0-08), a fórmula e os limites do ADR-0001 (U0-00) · Produces: veredito `segue` | `para-e-leva-ao-dono`, que o dono lê no GATE 0
**Aceite:** os critérios a, b e f do relatório batem com a medição e com a fórmula; falhou critério técnico ou RFC sem aprovação ⇒ `para-e-leva-ao-dono`, **sem plano B automático**; cada estimativa da projeção vem com o motivo; o ADR-0001 ganha o resultado sem mudar os limites

- [ ] **Preparo.** Worktree `U0-09` com U0-05 a U0-08 já em `v3/fase-0`.
- [ ] **Teste que falha.** `spikes/checks/gate-report.test.mjs` recalcula a projeção do ADR (linhas da Fase 2 ÷ produtividade do PoC × 1,3) e confere o relatório:

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const report = read('docs/fase-0/relatorio-gate.md');
const measured = JSON.parse(read('docs/fase-0/medicao-poc.json'));
const projection = JSON.parse(read('docs/fase-0/projecao.json'));
const HOURS_PER_DAY = 6;
const hours = [...read('docs/fase-0/horas.md').matchAll(/^\| U0-0[2-5] \| (\d+(?:[.,]\d+)?) h \|$/gm)].reduce((sum, row) => sum + Number(row[1].replace(',', '.')), 0);

// Fórmula do ADR-0001: (L_fase2 / P) × fator, com P = linhas do PoC por dia de 6 horas.
function projectedDays() {
  const fromBasis = (item) => item.basis.reduce((total, file) => total + (measured.files[file] ?? 0), 0) * item.factor;
  const phase2Lines = projection.items.reduce((total, item) => total + (item.lines ?? fromBasis(item)), 0);
  return (phase2Lines / ((measured.sourceLines + measured.tableLines) / (hours / HOURS_PER_DAY))) * projection.pipelineFactor;
}

const rows = Object.fromEntries([...report.matchAll(/^\| ([a-f]-[\w-]+) \|.*\| (passou|FALHOU|bloqueia) \|$/gm)].map((row) => [row[1], row[2]]));
const verdict = /\*\*Veredito:\*\* (segue|para-e-leva-ao-dono)/.exec(report)?.[1];

test('o relatório traz os 8 critérios e as horas de U0-02 a U0-05', () => {
  assert.deepEqual(Object.keys(rows).sort(), ['a-linhas', 'a-tamanho', 'b-tempo', 'c-demos', 'c-erros-tipicos', 'd-diagnosticos', 'e-rfc', 'f-projecao']);
  assert.ok(hours > 0, 'horas.md sem horas de U0-02 a U0-05');
});

test('os critérios a, b e f do relatório batem com a medição e com a fórmula do ADR-0001', () => {
  const { limits } = measured;
  const expected = {
    'a-linhas': measured.sourceLines <= limits.maxSourceLines,
    'a-tamanho': measured.brotliBytes <= limits.maxBrotliBytes,
    'b-tempo': measured.node.startsWith('v24.') && measured.medianMs <= limits.maxMillisecondsFor10kLines,
    'f-projecao': projectedDays() <= limits.maxProjectedDays,
  };
  for (const [id, passed] of Object.entries(expected)) assert.equal(rows[id] === 'passou', passed, id);
});

test('falhou critério técnico ou RFC sem aprovação: para e leva ao dono, sem plano B automático', () => {
  const allPassed = Object.values(rows).every((result) => result === 'passou');
  assert.equal(verdict, allPassed ? 'segue' : 'para-e-leva-ao-dono');
  assert.ok(report.includes('Não há plano B automático'));
  assert.ok(report.includes('**Decisão do dono**'));
});
```
- [ ] **RED.** `node --test spikes/checks/gate-report.test.mjs` → `ENOENT … docs/fase-0/relatorio-gate.md`.
- [ ] **Projeção.** Criar `docs/fase-0/projecao.json`. Cada unidade da Fase 2 vale linhas fixas ou as linhas medidas de arquivos do PoC (`basis`) vezes um `factor`; os valores são hipóteses do plano: ajuste cada uma, com o motivo, contra o que o PoC mediu e o que ele não tem, nunca para fechar a conta:

```json
{
  "pipelineFactor": 1.3,
  "items": [
    { "id": "U2-01", "lines": 900, "reason": "keywords, jsReserved, stdlib (60 entradas), retiredWords, limits, lookup" },
    { "id": "U2-02", "lines": 220, "reason": "fonte, posições, conversões de base, alfabeto P5" },
    { "id": "U2-03", "lines": 1000, "reason": "cerca de 70 códigos em dois tons, com ajuda e exemplo, e explainDiagnostic" },
    { "id": "U2-04", "basis": ["lexer.ts"], "factor": 4, "reason": "alfabeto, NFC, template e regex, trivia, números à brasileira" },
    { "id": "U2-05", "basis": ["parser.ts", "ast.types.ts"], "factor": 2, "reason": "subconjunto inteiro, §4.6 completo, incomplete, profundidade" },
    { "id": "U2-06", "basis": ["parser.ts"], "factor": 0.6, "reason": "diagnósticos de subconjunto e de JavaScript, regex, P6, P7, P12" },
    { "id": "U2-07", "lines": 1500, "reason": "sem base no PoC: escopos, censo de membros, reservas, avisos, sessão do REPL" },
    { "id": "U2-08", "basis": ["emit.ts", "compile.ts"], "factor": 12, "reason": "macros, ajudantes, alvos, trava de laço, NFC, await automático" },
    { "id": "U2-09", "lines": 300, "reason": "VLQ, source map por token, helperRange, ignoreList" },
    { "id": "U2-10", "lines": 250, "reason": "API da §5.9 e GS0901" },
    { "id": "U2-11", "lines": 450, "reason": "tradução de erros de execução e frases de .mensagem" },
    { "id": "U2-12", "lines": 700, "reason": "doze geradores da tabela" },
    { "id": "U2-13", "lines": 120, "reason": "Terser com mapa composto" },
    { "id": "U2-14", "lines": 400, "reason": "executor do corpus e propriedades fast-check" },
    { "id": "U2-15", "lines": 250, "reason": "orçamentos, Stryker, relatório" }
  ]
}
```
- [ ] **Relatório.** Criar `docs/fase-0/relatorio-gate.md`. Cabeçalho `**Veredito:** segue` ou `**Veredito:** para-e-leva-ao-dono`; uma tabela `| Critério | Limite | Medido | Resultado |` com exatamente estas linhas, a primeira célula sendo o id (`a-linhas`, `a-tamanho`, `b-tempo`, `c-demos`, `c-erros-tipicos`, `d-diagnosticos`, `e-rfc`, `f-projecao`) e o resultado `passou`, `FALHOU` ou, só em `e-rfc`, `bloqueia` (a, b e f vêm de `medicao-poc.json`, `horas.md` e `projecao.json`; c e d, do `vitest run`; e, do `Status` da RFC); seção "Fatos que não são critério" (violações do ESLint provisório, candidato do sandbox, método de publicação e o prazo de 2026-12-01); a frase `Não há plano B automático.`; e, por último, `**Decisão do dono**` com a decisão, a data e o que muda. Regra: falhou critério técnico (a, b, c, d ou f) ⇒ o trabalho para e o fato vai ao dono, que escolhe entre estender o prazo, reduzir o subconjunto ou acionar o plano B (reabre D4); a RFC (e) é bloqueio independente e não aciona o plano B.
- [ ] **GREEN.** `node --test spikes/checks/gate-report.test.mjs` → 3 testes passam. Não edite o resultado nem os limites do ADR para fazê-los passar.
- [ ] **ADR-0001.** Acrescentar `## Resultado da Fase 0` com a medida, a projeção (fator `1,3`) e a folga restante; `node --test spikes/checks/adr-0001.test.mjs` continua verde. Conferir a ordem dos commits: `git merge-base --is-ancestor $(git log --format=%H --diff-filter=A -- docs/adr/0001-front-end-proprio-a-mao.md | tail -1) $(git log --format=%H --diff-filter=A -- spikes/poc-compiler/bench | tail -1) && echo ok`.
- [ ] **Limpeza e verify.** `node --test spikes/checks/` e `cd spikes/poc-compiler && corepack pnpm verify` verdes.
- [ ] **Commit.** `git add docs spikes && git commit -m "docs(docs): adiciona o relatório do gate da fase 0"`. O orquestrador para aqui: **GATE 0** é do dono; U1-00 só começa com a decisão registrada.

### GATE 0

**GATE 0 (dono).** Lê `docs/fase-0/relatorio-gate.md` e a RFC-0001. Aprova P8–P13, P15, P16, cada nome da biblioteca e
as lacunas do anexo D. Se um critério técnico falhou, decide entre estender o prazo, reduzir o subconjunto ou acionar o
plano B (reabre D4); nada disso é automático. Só depois disso começa a U1-00.

## Fase 1

### U1-00: Reescrita do histórico público, tag legacy/1.5 e limpeza de branches
**Spec:** §9.4, ADR-0011 · **Tier:** small · **Depende de:** GATE 0 · **Risco:** a reescrita não alcança clones, PRs e SHAs antigos; só vale se o espelho for conferido antes do force-push · **Rollback:** o espelho de backup guarda o estado anterior; restaurar por force-push dele **[dono]**
**Files:** nenhum arquivo do repositório muda; insumos FORA dele em `$GS_REWRITE_DIR` (`paths.txt` preparado pelo dono, `verify.sh`, `old-heads.txt`, `backup.git`, `work.git`, `local.bundle`, `purge-shas.txt`).
**Interfaces:** Consumes: nada. Produces: histórico reescrito em `origin`, tag `legacy/1.5` e `old-heads.txt` (SHAs antigos de `main`, `docs/goiasscript-3-design`, `v3/fase-0`) para U1-01.
**Aceite:** `verify.sh` imprime `verificação ok` no espelho e no repositório local; `git ls-remote --heads origin` lista só `DEVELOPMENT`, `archive/v2-experimental`, `main`; a tag anotada `legacy/1.5` existe local e remota no último commit da 1.5 em `main`; `v2.0-pre-archive` segue no remoto.

Sem ciclo TDD (não há código): a prova de cada passo é o comando e a saída esperada.

- [ ] **0. Pré-condição [dono].** `paths.txt` (um caminho por linha, ou `glob:<padrão>`; sem `regex:`) fora do repositório.
```bash
export GS_REWRITE_DIR="<pasta fora do repositório>"
test -s "$GS_REWRITE_DIR/paths.txt" && case "$(realpath "$GS_REWRITE_DIR")/" in "$(git rev-parse --show-toplevel)/"*) echo "ERRO: dentro do repositório"; exit 1;; esac; echo ok
```
Esperado: `ok`.
- [ ] **1. verify.sh e SHAs antigos.**
```bash
cat > "$GS_REWRITE_DIR/verify.sh" <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail
git_dir="$1"; shift
if [ "$#" -eq 0 ]; then refs=(--all); else refs=("$@"); fi
paths_file="$(dirname "$0")/paths.txt"
if grep -q '^regex:' "$paths_file"; then echo "paths.txt não pode ter regex:"; exit 2; fi
failed=0
while IFS= read -r entry; do
  [ -z "$entry" ] && continue
  spec="${entry#glob:}"; [ "$spec" != "$entry" ] && spec=":(glob)$spec"
  if [ -n "$(git -C "$git_dir" log "${refs[@]}" --oneline -- "$spec")" ]; then echo "AINDA NO HISTÓRICO: $entry"; failed=1; fi
done < "$paths_file"
[ "$failed" -eq 0 ] && echo "verificação ok"
exit "$failed"
SCRIPT
chmod +x "$GS_REWRITE_DIR/verify.sh"
git rev-parse origin/main docs/goiasscript-3-design v3/fase-0 > "$GS_REWRITE_DIR/old-heads.txt"
"$GS_REWRITE_DIR/verify.sh" . || true
```
Esperado: uma linha `AINDA NO HISTÓRICO` por entrada (a verificação enxerga o material antes da reescrita).
- [ ] **2. Backup.**
```bash
git clone --mirror git@github.com:Gefferson-Souza/goiasscript.git "$GS_REWRITE_DIR/backup.git"
git bundle create "$GS_REWRITE_DIR/local.bundle" --all && git bundle verify "$GS_REWRITE_DIR/local.bundle"
```
- [ ] **3. Reescrita no espelho de trabalho** (o `filter-repo` exige clone novo).
```bash
git clone --mirror "$GS_REWRITE_DIR/backup.git" "$GS_REWRITE_DIR/work.git"
git -C "$GS_REWRITE_DIR/work.git" filter-repo --invert-paths --paths-from-file "$GS_REWRITE_DIR/paths.txt"
git -C "$GS_REWRITE_DIR/work.git" for-each-ref --format='delete %(refname)' refs/pull | git -C "$GS_REWRITE_DIR/work.git" update-ref --stdin
"$GS_REWRITE_DIR/verify.sh" "$GS_REWRITE_DIR/work.git"
diff <(git -C "$GS_REWRITE_DIR/backup.git" for-each-ref --format='%(refname)' refs/heads refs/tags) <(git -C "$GS_REWRITE_DIR/work.git" for-each-ref --format='%(refname)' refs/heads refs/tags) && echo "mesmas refs"
```
Esperado: `Completely finished`, `verificação ok`, `mesmas refs`. Outra saída: parar.
- [ ] **4. Force-push [dono].** `gh api repos/Gefferson-Souza/goiasscript/branches/main --jq .protected` deve dar `false`.
```bash
git -C "$GS_REWRITE_DIR/work.git" push --force git@github.com:Gefferson-Souza/goiasscript.git 'refs/heads/*:refs/heads/*' 'refs/tags/*:refs/tags/*'
test "$(git ls-remote origin refs/heads/main | cut -f1)" = "$(git -C "$GS_REWRITE_DIR/work.git" rev-parse refs/heads/main)" && echo "remoto igual ao espelho"
```
- [ ] **5. Suporte do GitHub [dono].** Gerar `purge-shas.txt` (mesmo laço do `verify.sh`, com `git log --all --format=%H` sobre `backup.git`, `sort -u`) e abrir pedido em `https://support.github.com/contact`: "Reescrevi o histórico de Gefferson-Souza/goiasscript com git filter-repo para remover dados pessoais e enviei por force-push. Peço a purga de `refs/pull/*`, das views em cache e dos objetos órfãos dos SHAs anexos."
- [ ] **6. Alinhar o repositório local.**
```bash
git fetch "$GS_REWRITE_DIR/work.git" '+refs/heads/*:refs/rewritten/heads/*'
OLD_MAIN="$(sed -n 1p "$GS_REWRITE_DIR/old-heads.txt")"
NEW_MAIN="$(awk -v old="$OLD_MAIN" '$1==old{print $2}' "$GS_REWRITE_DIR/work.git/filter-repo/commit-map")"
test -n "$NEW_MAIN" && test "$NEW_MAIN" != 0000000000000000000000000000000000000000
git rebase --onto "$NEW_MAIN" "$OLD_MAIN" docs/goiasscript-3-design
git branch -f main "$NEW_MAIN"
git branch -f archive/v2-experimental refs/rewritten/heads/archive/v2-experimental
git branch -D staging feat/v1.5-slim feat/v1.5-launch-playground-engoianador
git fetch origin --prune --prune-tags --force --tags
"$GS_REWRITE_DIR/verify.sh" . docs/goiasscript-3-design main archive/v2-experimental --glob='refs/rewritten/heads/*'
```
Esperado: `Successfully rebased` e `verificação ok` (as refs antigas de `v3/fase-0` ficam para U1-01).
- [ ] **7. Tag.** `git tag -a legacy/1.5 "$NEW_MAIN" -m "último commit da 1.5 antes do GoiásScript 3"`; `git cat-file -t legacy/1.5` dá `tag`. **[dono]** `git push origin legacy/1.5` (antes de qualquer commit da v3 na `main`).
- [ ] **8. Branches obsoletas [dono].** `git push origin --delete staging feat/v1.5-slim feat/v1.5-launch-playground-engoianador feat/increase-test-coverage`; `git ls-remote --heads origin | awk '{print $2}'` deve listar `DEVELOPMENT`, `archive/v2-experimental`, `main` (`DEVELOPMENT` fica até portar o teste e a correção do `;`, E F15).
- [ ] **9. Fechamento.** Sem commit. **[dono]** apaga `backup.git`, `work.git` e `local.bundle` quando o Suporte confirmar.

### U1-01: Branch de integração, .gitignore, .gitattributes e .mailmap
**Spec:** §9.4 · **Tier:** small · **Depende de:** U1-00 · **Risco:** o rebase de `v3/fase-0` pode conflitar · **Rollback:** `git branch -D v3/integracao` e restaurar os 3 arquivos
**Files:** Modify `.gitignore`; Create `.gitattributes`, `.mailmap`.
**Interfaces:** Consumes: `old-heads.txt`, `verify.sh`. Produces: branch `v3/integracao` (base dos worktrees) e `-text` no corpus de conformidade (protege BOM e CRLF dos goldens).
**Aceite:** `v3/integracao` contém a Fase 0 sobre `docs/goiasscript-3-design`; `verify.sh .` dá `verificação ok` em todas as refs; `git grep -nE '/hom[e]/'` sai com 1.

- [ ] **1. Rebasear a Fase 0 e criar a branch.**
```bash
PHASE0_WORKTREE="$(git worktree list --porcelain | awk '/^worktree /{path=$2} /^branch refs\/heads\/v3\/fase-0$/{print path}')"
git -C "${PHASE0_WORKTREE:-.}" rebase --onto docs/goiasscript-3-design "$(sed -n 2p "$GS_REWRITE_DIR/old-heads.txt")" v3/fase-0
git switch -c v3/integracao v3/fase-0
git for-each-ref --format='delete %(refname)' refs/rewritten | git update-ref --stdin
git reflog expire --expire=now --all && git gc --prune=now --quiet
"$GS_REWRITE_DIR/verify.sh" .
```
- [ ] **2. Arquivos.** `.gitattributes`:
```
* text=auto
*.gs linguist-language=JavaScript
.husky/* text eol=lf
*.vsix binary
packages/compiler/tests/conformance/** -text
```
`.mailmap`: gerado das autorias reais, para nenhum e-mail ser digitado no plano. **[dono]** confirma a identidade canônica (o e-mail de noreply do GitHub) antes do commit:
```bash
CANONICAL='Gefferson Souza <124531599+Gefferson-Souza@users.noreply.github.com>'
git log --all --format='%aN <%aE>%n%cN <%cE>' | sort -u | grep -vxF "$CANONICAL" | sed "s|^|$CANONICAL |" > .mailmap
```
Fim de `.gitignore`: `research_notes/` e `reports/`.
- [ ] **3. Verificar.** `git log --all --use-mailmap --format='%aN <%aE>' | sort -u` mostra uma única identidade; `git check-attr text linguist-language -- packages/compiler/tests/conformance/a/input.gs` dá `text: unset` e `JavaScript`; `git check-ignore research_notes/x reports/y` lista os dois; `git status --short` mostra só os 3 arquivos.
- [ ] **4. Commit.** `git add .gitignore .gitattributes .mailmap && git commit -m "chore(release): unifica autoria e define atributos e ignores do repositório"`

### U1-02: Fundação do workspace
**Spec:** §5.1, §8.1 · **Tier:** medium · **Depende de:** U1-01 · **Risco:** o legado (`packages/core`, `apps/`) segue no workspace · **Rollback:** `git revert`
**Files:** Create `.npmrc`, `tsconfig.base.json`, `tsconfig.json`, `vitest.config.mts`, `scripts/package.json`, `packages/{language,compiler,optimizer}/{package.json,src/index.ts}`; Modify `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, Mapa de arquivos do plano (acrescentar `tsconfig.json vitest.config.mts .npmrc scripts/** tools/config-tests/** .github/rulesets/*` e `workflows/{legacy-ci,codeql,osv,scheduled,promises-gate}.yml`).
**Interfaces:** Consumes: nada. Produces: pacotes privados `@goiasscript/{language,compiler,optimizer}` (`exports` → `src/index.ts`), scripts `typecheck`, `test`, `verify`; `@goiasscript/language` entra no compilador só em U2-04 (antes disso o knip a acusa).
**Aceite:** `corepack pnpm verify` dá 0; pacote com código sem teste reprova o limiar de 80%; legado continua instalando.

Worktree: `git worktree add ../goiasscript-wt/U1-02 -b v3/U1-02 v3/integracao && cd ../goiasscript-wt/U1-02`.
- [ ] **1. RED.** `corepack pnpm run verify` → `ERR_PNPM_NO_SCRIPT  Missing script: verify`.
- [ ] **2. Arquivos.** `.npmrc`: `save-exact=true`. `pnpm-workspace.yaml`: `packages: ['packages/*','apps/*','tools/*']`. `scripts/package.json`: `{ "private": true, "type": "module" }`. Cada pacote: `{ "name": "@goiasscript/<p>", "private": true, "version": "0.0.0", "type": "module", "exports": { ".": "./src/index.ts" }, "engines": { "node": ">=22.12" } }` e `src/index.ts` = `export {};`.
`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023", "lib": ["ES2023"], "module": "NodeNext", "moduleResolution": "NodeNext", "types": ["node"],
    "strict": true, "noUncheckedIndexedAccess": true, "exactOptionalPropertyTypes": true, "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true, "isolatedModules": true, "noImplicitOverride": true, "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true, "noUnusedParameters": true, "allowImportingTsExtensions": true, "noEmit": true, "skipLibCheck": true
  }
}
```
`tsconfig.json`:
```json
{
  "extends": "./tsconfig.base.json",
  "include": ["packages/*/src", "packages/*/tests", "packages/*/generators", "tools/**/*.ts", "scripts/**/*.ts", "*.config.mts"],
  "exclude": ["**/node_modules"]
}
```
`vitest.config.mts` (`.mts` porque a raiz ainda é CommonJS por causa do legado; `projects` exclui `packages/core`, que usa Jest):
```ts
import { defineConfig } from 'vitest/config';

const COVERAGE_MINIMUM = 80;
const perPackage = { lines: COVERAGE_MINIMUM, functions: COVERAGE_MINIMUM, branches: COVERAGE_MINIMUM, statements: COVERAGE_MINIMUM };

export default defineConfig({
  test: {
    projects: ['packages/language', 'packages/compiler', 'packages/optimizer', 'tools/*'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'lcov'],
      include: ['packages/*/src/**/*.ts'],
      thresholds: { 'packages/language/src/**': perPackage, 'packages/compiler/src/**': perPackage, 'packages/optimizer/src/**': perPackage },
    },
  },
});
```
- [ ] **3. `package.json` da raiz.** `scripts`: trocar `test`, `test:coverage`, `lint`, `lint:fix`, `format`, `format:check` por `legacy:*` (o `legacy:lint` leva `ESLINT_USE_FLAT_CONFIG=false`, senão o ESLint 8 lê o `eslint.config.mjs` e quebra) e acrescentar `"typecheck": "tsc -p tsconfig.json"`, `"test": "vitest run --coverage"`, `"verify": "tsc -p tsconfig.json && vitest run --coverage"`. `engines`: `{ "node": ">=22.22.1", "pnpm": ">=10.31.0" }`.
```bash
corepack pnpm add -D -w typescript@6.0.3 vitest@5.0.5 @vitest/coverage-v8@5.0.5 @types/node@22.20.5
corepack pnpm install
```
- [ ] **4. GREEN e prova do limiar.** `corepack pnpm verify` (0). Criar `packages/compiler/src/uncovered.ts` com uma função e rodar `corepack pnpm test`: `ERROR: Coverage for lines (0%) does not meet "packages/compiler/src/**" threshold (80%)`, exit 1; apagar o arquivo: exit 0.
- [ ] **5. Commit.** `corepack pnpm verify`; `git add` dos arquivos de **Files**; `git commit -m "build(deps): cria a fundação do workspace com typescript estrito e vitest"`.

### U1-03: ESLint estrito, dependency-cruiser e knip, com um teste por linha da matriz
**Spec:** §8.1 · **Tier:** medium · **Depende de:** U1-02 · **Risco:** regra estrita demais barra código legítimo da Fase 2 · **Rollback:** `git revert`
**Files:** Create `eslint.config.mjs`, `.dependency-cruiser.cjs`, `knip.json`, `tools/config-tests/{package.json,tests/{typescript,eslint-matrix,depcruise,knip,hygiene}.test.mjs}`; Modify `package.json`, `pnpm-lock.yaml`.
**Interfaces:** Consumes: `tsconfig.base.json`. Produces: `createConfig(projectService)` em `eslint.config.mjs`; scripts `lint`, `depcruise`, `knip`; override do ADR-0004 por glob; projeto `@goiasscript/config-tests`. Linhas de scanner, commit, CodeQL e OSV têm teste em U1-04 a U1-06.
**Aceite:** fixture que viola e é barrada, e parecida que passa, para TS estrito, any, `@ts-*`/`eslint-disable`, números mágicos, imutabilidade (`this.pos += 1`, `this.items.push(1)`, `this.scopes.set(k, v)` passam em lexer/parser/analyzer; `param.x = 1`, `list.push(x)` e `this.x` fora deles falham), catch engolido, types em `*.types.ts`, tamanhos, console, nomes, fronteiras (depcruise) e código morto (knip); `verify` dá 0 com o legado ignorado.

Worktree `U1-03` (mesmo padrão). `corepack pnpm add -D -w eslint@10.13.0 @eslint/js@10.0.1 typescript-eslint@8.72.0 eslint-plugin-functional@10.0.1 @eslint-community/eslint-plugin-eslint-comments@4.8.1 dependency-cruiser@18.7.0 knip@6.42.1`; `tools/config-tests/package.json`: `{"name":"@goiasscript/config-tests","private":true,"version":"0.0.0","type":"module"}`; `corepack pnpm install`.

**Ciclo A: TypeScript.** Teste `tools/config-tests/tests/typescript.test.mjs`:
```js
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const raw = ts.readConfigFile(path.join(ROOT, 'tsconfig.base.json'), ts.sys.readFile).config.compilerOptions;
const { options } = ts.convertCompilerOptionsFromJson(raw, ROOT);
const FILE = path.join(ROOT, 'packages/language/src/virtual.ts');

function codes(source) {
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...rest) => (name === FILE ? ts.createSourceFile(name, source, options.target ?? ts.ScriptTarget.ES2023) : original(name, ...rest));
  return ts.getPreEmitDiagnostics(ts.createProgram([FILE], options, host)).map((d) => d.code);
}

describe('tsconfig.base.json', () => {
  it('erro de catch é unknown', () => { expect(codes('export function f(g: () => void): string {\n  try {\n    g();\n  } catch (error) {\n    return error.message;\n  }\n  return "";\n}\n')).toContain(18046); });
  it('noUncheckedIndexedAccess', () => { expect(codes('const list: number[] = [];\nexport const first: number = list[0];\n')).toContain(2322); });
  it('exactOptionalPropertyTypes', () => { expect(codes('export const entry: { readonly a?: number } = { a: undefined };\n')).toContain(2375); });
  it('erasableSyntaxOnly', () => { expect(codes('export enum Color {\n  Red,\n}\n')).toContain(1294); });
  it('strict', () => { expect(codes('export function f(value) {\n  return value;\n}\n')).toContain(7006); });
  it('aceita código correto', () => { expect(codes('export const value = 1;\n')).toEqual([]); });
});
```
RED por sabotagem: `sed -i 's/"strict": true/"strict": false/; s/"noUncheckedIndexedAccess": true/"noUncheckedIndexedAccess": false/; s/"exactOptionalPropertyTypes": true/"exactOptionalPropertyTypes": false/; s/"erasableSyntaxOnly": true/"erasableSyntaxOnly": false/' tsconfig.base.json` e `corepack pnpm exec vitest run tools/config-tests/tests/typescript.test.mjs`: 5 falhas (`expected [] to include 18046` …). `git checkout tsconfig.base.json`; GREEN: `6 passed`.

**Ciclo B: matriz do ESLint.** Teste `tools/config-tests/tests/eslint-matrix.test.mjs` (o `allowDefaultProject` deixa lintar arquivos virtuais):
```js
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { createConfig } from '../../../eslint.config.mjs';

const projectService = { allowDefaultProject: ['packages/*/src/*.ts', 'packages/*/src/*/*.ts'], maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 200 };
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: createConfig(projectService) });
const messagesFor = async (code, filePath) => (await eslint.lintText(code, { filePath }))[0].messages.map((m) => m.ruleId ?? m.message);

const SRC = 'packages/language/src/virtual.ts';
const LEXER = 'packages/compiler/src/lexer/virtual.ts';
const NOOP = 'function noop(): void {\n  return;\n}\n';
const fn = (body, params = '') => `${NOOP}export function f(${params}): void {\n${body}\n}\n`;
const tryCatch = (handler) => fn(`  try {\n    noop();\n  } catch (error) {${handler}}`);
const holder = (body) => `export class Holder {\n  pos = 0;\n  items: number[] = [];\n  scopes = new Map<string, number>();\n  run(): void {\n    ${body}\n  }\n}\n`;
const nested = 'if (a) {'.repeat(5);

const violations = [
  ['sem any', SRC, 'export const value: any = 1;\n', '@typescript-eslint/no-explicit-any'],
  ['@ts-ignore proibido', SRC, '// @ts-ignore\nexport const value: number = "a";\n', '@typescript-eslint/ban-ts-comment'],
  ['@ts-expect-error exige descrição', SRC, '// @ts-expect-error\nexport const value: number = "a";\n', '@typescript-eslint/ban-ts-comment'],
  ['eslint-disable exige motivo', SRC, '/* eslint-disable no-console */\nconsole.log(1);\n', '@eslint-community/eslint-comments/require-description'],
  ['eslint-disable sem efeito é erro', SRC, '// eslint-disable-next-line no-console -- motivo qualquer\nexport const value = 1;\n', /Unused eslint-disable/],
  ['sem número mágico', SRC, 'export const total = 37 * 3;\n', '@typescript-eslint/no-magic-numbers'],
  ['sem reatribuir parâmetro', SRC, fn('  a = 2;', 'a: number'), 'no-param-reassign'],
  ['sem mutar lista recebida', SRC, fn('  list.push(1);', 'list: number[]'), 'functional/immutable-data'],
  ['parâmetro continua imutável no lexer', LEXER, fn('  p.x = 1;', 'p: { x: number }'), 'functional/immutable-data'],
  ['this fora de lexer, parser e analyzer', 'packages/compiler/src/lowering/virtual.ts', holder('this.pos += 1;'), 'functional/immutable-data'],
  ['prefer-const', SRC, 'let value = 1;\nexport const copy = value;\n', 'prefer-const'],
  ['sem var', SRC, 'export var value = 1;\n', 'no-var'],
  ['catch vazio', SRC, tryCatch(''), 'no-empty'],
  ['catch que engole o erro', SRC, tryCatch('\n    noop();\n  '), 'no-restricted-syntax'],
  ['interface exportada fora de *.types.ts', SRC, 'export interface Entry {\n  readonly name: string;\n}\n', 'no-restricted-syntax'],
  ['arquivo acima de 800 linhas', SRC, `export {};\n${'\n'.repeat(800)}`, 'max-lines'],
  ['função acima de 50 linhas', SRC, `${NOOP}export function f(): void {\n${'  noop();\n'.repeat(49)}}\n`, 'max-lines-per-function'],
  ['aninhamento acima de 4', SRC, fn(`  ${nested}\n  f(a);\n${'}'.repeat(5)}`, 'a: boolean'), 'max-depth'],
  ['sem console', SRC, 'console.log(1);\n', 'no-console'],
  ['função fora de camelCase', SRC, 'export function Foo_bar(): void {\n  return;\n}\n', '@typescript-eslint/naming-convention'],
];
const accepted = [
  ['this.pos no lexer', LEXER, holder('this.pos += 1;'), 'functional/immutable-data'],
  ['this.items.push no parser', 'packages/compiler/src/parser/virtual.ts', holder('this.items.push(1);'), 'functional/immutable-data'],
  ['this.scopes.set no analyzer', 'packages/compiler/src/analyzer/virtual.ts', holder("this.scopes.set('a', 1);"), 'functional/immutable-data'],
  ['interface em *.types.ts', 'packages/language/src/virtual.types.ts', 'export interface Entry {\n  readonly name: string;\n}\n', 'no-restricted-syntax'],
  ['catch que relança', SRC, tryCatch('\n    throw error;\n  '), 'no-restricted-syntax'],
];

describe('matriz de regras do ESLint (§8.1)', () => {
  it.each(violations)('barra: %s', async (_title, filePath, code, expected) => {
    expect(await messagesFor(code, filePath)).toContainEqual(typeof expected === 'string' ? expected : expect.stringMatching(expected));
  });
  it.each(accepted)('aceita: %s', async (_title, filePath, code, ruleId) => {
    expect(await messagesFor(code, filePath)).not.toContain(ruleId);
  });
});
```
RED: `Cannot find module '../../../eslint.config.mjs'`. `eslint.config.mjs`:
```js
import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import functional from 'eslint-plugin-functional';
import tseslint from 'typescript-eslint';

const MAX_FILE_LINES = 800;
const MAX_FUNCTION_LINES = 50;
const MAX_DEPTH = 4;
const MAGIC_NUMBERS_ALLOWED = [-1, 0, 1, 2];
const MIN_DIRECTIVE_DESCRIPTION = 6;
const MUTABLE_STATE_GLOBS = ['packages/compiler/src/lexer/**/*.ts', 'packages/compiler/src/parser/**/*.ts', 'packages/compiler/src/analyzer/**/*.ts'];
const TS_FILES = ['packages/**/*.ts', 'tools/**/*.ts', 'scripts/**/*.ts', '*.config.mts'];
const TEST_FILES = ['**/*.test.ts', '**/tests/**/*.ts'];

const typeDeclarationSelectors = [
  { selector: 'ExportNamedDeclaration > TSInterfaceDeclaration', message: 'Interface exportada vive em arquivo *.types.ts.' },
  { selector: 'ExportNamedDeclaration > TSTypeAliasDeclaration', message: 'Tipo exportado vive em arquivo *.types.ts.' },
];
const swallowedCatchSelector = {
  selector: "CatchClause > BlockStatement:not(:has(ThrowStatement, ReturnStatement, CallExpression[callee.object.name='process'][callee.property.name='exit']))",
  message: 'catch precisa relançar, retornar ou encerrar o processo; nunca engolir o erro.',
};

export function createConfig(projectService = true) {
  return tseslint.config(
    { ignores: ['**/node_modules/**', '**/coverage/**', '**/dist/**', '**/generated/**', 'packages/core/**', 'vscode-extension/**', 'lsp-server/**', 'apps/**', 'docs/**', 'spikes/**', 'packages/compiler/tests/conformance/**'] },
    { linterOptions: { reportUnusedDisableDirectives: 'error' } },
    {
      files: TS_FILES,
      extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
      languageOptions: { parserOptions: { projectService, tsconfigRootDir: import.meta.dirname } },
      plugins: { '@eslint-community/eslint-comments': eslintComments, functional },
      rules: {
        '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: MIN_DIRECTIVE_DESCRIPTION }],
        '@eslint-community/eslint-comments/require-description': 'error',
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': ['error', { ignore: MAGIC_NUMBERS_ALLOWED, ignoreArrayIndexes: true, detectObjects: true, ignoreEnums: true, ignoreNumericLiteralTypes: true, ignoreTypeIndexes: true, ignoreReadonlyClassProperties: true }],
        'no-param-reassign': ['error', { props: true }],
        'prefer-const': 'error',
        'no-var': 'error',
        'functional/immutable-data': 'error',
        'no-empty': ['error', { allowEmptyCatch: false }],
        'no-restricted-syntax': ['error', ...typeDeclarationSelectors, swallowedCatchSelector],
        'max-lines': ['error', { max: MAX_FILE_LINES, skipBlankLines: false, skipComments: false }],
        'max-lines-per-function': ['error', { max: MAX_FUNCTION_LINES, skipBlankLines: false, skipComments: false, IIFEs: true }],
        'max-depth': ['error', MAX_DEPTH],
        'no-console': 'error',
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'default', format: ['camelCase'] },
          { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
          { selector: ['property', 'objectLiteralProperty', 'typeProperty'], format: null },
          { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        ],
      },
    },
    { files: MUTABLE_STATE_GLOBS, rules: { 'functional/immutable-data': ['error', { ignoreAccessorPattern: 'this.**' }] } },
    { files: ['**/*.types.ts'], rules: { 'no-restricted-syntax': ['error', swallowedCatchSelector] } },
    { files: TEST_FILES, rules: { 'max-lines-per-function': 'off', 'no-magic-numbers': 'off', '@typescript-eslint/no-magic-numbers': 'off', 'functional/immutable-data': 'off' } },
    {
      files: ['**/*.mjs', '**/*.cjs'],
      extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
      languageOptions: { sourceType: 'module', globals: { process: 'readonly', URL: 'readonly', module: 'writable' } },
    },
  );
}

export default createConfig();
```
GREEN: `25 passed`.

**Ciclo C: dependency-cruiser.** Teste `tools/config-tests/tests/depcruise.test.mjs`:
```js
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { cruise } from 'dependency-cruiser';
import { afterEach, describe, expect, it } from 'vitest';

const config = createRequire(import.meta.url)('../../../.dependency-cruiser.cjs');
const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
let temporary = [];
afterEach(() => { for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true }); temporary = []; });

async function violatedRules(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'depcruise-'));
  temporary = [...temporary, root];
  fs.symlinkSync(path.join(ROOT_DIR, 'node_modules'), path.join(root, 'node_modules'), 'junction');
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  const result = await cruise(['packages'], { baseDir: root, validate: true, ruleSet: { forbidden: config.forbidden }, tsPreCompilationDeps: true }, { exportsFields: ['exports'], conditionNames: ['import', 'node', 'default'] });
  return result.output.summary.violations.map((violation) => violation.rule.name);
}

describe('dependency-cruiser', () => {
  it('language não importa compiler', async () => { expect(await violatedRules({ 'packages/language/src/a.ts': "import '../../compiler/src/b.ts';\n", 'packages/compiler/src/b.ts': 'export const b = 1;\n' })).toContain('language-nao-importa-camada-acima'); });
  it('language e compiler não importam node:*', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n" })).toContain('isomorfico-sem-node'); });
  it('compiler não tem dependência de runtime', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import { expect } from 'vitest';\nexport const e = expect;\n" })).toContain('sem-dependencia-de-runtime-no-compiler'); });
  it('proíbe ciclos', async () => { expect(await violatedRules({ 'packages/language/src/a.ts': "import './b.ts';\n", 'packages/language/src/b.ts': "import './a.ts';\n" })).toContain('sem-ciclos'); });
  it('aceita a camada certa', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import '../../language/src/b.ts';\n", 'packages/language/src/b.ts': 'export const b = 1;\n' })).toEqual([]); });
});
```
RED: `Cannot find module '../../../.dependency-cruiser.cjs'`. `.dependency-cruiser.cjs`:
```js
const PACKAGE_LAYERS = ['language', 'compiler', 'optimizer', 'cli', 'vscode'];
const above = (layer) => PACKAGE_LAYERS.slice(PACKAGE_LAYERS.indexOf(layer) + 1).map((name) => `packages/${name}/`);
const layerRule = (layer) => ({
  name: `${layer}-nao-importa-camada-acima`,
  severity: 'error',
  comment: 'Camadas: language <- compiler <- optimizer <- cli/vscode/apps (spec 5.1).',
  from: { path: `(^|/)packages/${layer}/` },
  to: { path: [...above(layer), '(^|/)apps/'] },
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...['language', 'compiler', 'optimizer'].map(layerRule),
    { name: 'isomorfico-sem-node', severity: 'error', from: { path: '(^|/)packages/(language|compiler)/src/' }, to: { dependencyTypes: ['core'] } },
    { name: 'sem-ciclos', severity: 'error', from: {}, to: { circular: true } },
    { name: 'sem-dependencia-de-runtime-no-compiler', severity: 'error', from: { path: '(^|/)packages/compiler/src/' }, to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'] } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|coverage|dist|generated|fixtures)/|(^|/)packages/core/|(^|/)vscode-extension/|(^|/)lsp-server/|(^|/)spikes/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
```
GREEN: `5 passed`.

**Ciclo D: knip.** Teste `tools/config-tests/tests/knip.test.mjs`:
```js
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
let temporary = [];
afterEach(() => { for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true }); temporary = []; });

function runKnip(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'knip-'));
  temporary = [...temporary, root];
  fs.symlinkSync(path.join(ROOT_DIR, 'node_modules'), path.join(root, 'node_modules'), 'junction');
  fs.copyFileSync(path.join(ROOT_DIR, 'knip.json'), path.join(root, 'knip.json'));
  const base = { 'package.json': '{"name":"fixture","private":true,"type":"module"}', 'pnpm-workspace.yaml': 'packages:\n  - packages/*\n', 'packages/language/package.json': '{"name":"@fixture/language","private":true,"type":"module","exports":{".":"./src/index.ts"}}' };
  for (const [rel, text] of Object.entries({ ...base, ...files })) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return spawnSync('node', [path.join(ROOT_DIR, 'node_modules/knip/bin/knip.js'), '--no-progress'], { cwd: root, encoding: 'utf8' });
}

describe('knip', () => {
  it('barra arquivo morto e export sem uso', () => {
    const result = runKnip({ 'packages/language/src/index.ts': "import { used } from './helper.ts';\nexport const live = used;\n", 'packages/language/src/helper.ts': 'export const used = 1;\nexport const unusedExport = 2;\n', 'packages/language/src/dead.ts': 'export const dead = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('packages/language/src/dead.ts');
    expect(result.stdout).toContain('unusedExport');
  });
  it('aprova projeto sem código morto', () => { expect(runKnip({ 'packages/language/src/index.ts': 'export const live = 1;\n' }).status).toBe(0); });
});
```
RED: `ENOENT … copyfile '…/knip.json'`. `knip.json`:
```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "ignoreWorkspaces": ["packages/core", "apps/*"],
  "ignoreExportsUsedInFile": true,
  "workspaces": {
    ".": { "entry": ["scripts/*.ts"], "project": ["*.{ts,mts,mjs}", "scripts/**"], "ignoreDependencies": ["lint-staged"] },
    "packages/language": { "entry": ["generators/run.ts", "tests/**/*.test.ts"], "project": ["src/**/*.ts", "generators/**/*.ts", "tests/**/*.ts"] },
    "packages/compiler": { "entry": ["tests/**/*.test.ts", "tests/support/deterministic-preload.mjs"], "project": ["src/**/*.ts", "tests/**/*.{ts,mjs}"] },
    "packages/optimizer": { "entry": ["tests/**/*.test.ts"], "project": ["src/**/*.ts", "tests/**/*.ts"] },
    "tools/rules-scan": { "entry": ["tests/**/*.test.mjs"], "project": ["src/**/*.mjs", "tests/**/*.mjs"] },
    "tools/config-tests": { "entry": ["tests/**/*.test.mjs"], "project": ["tests/**/*.mjs"] }
  }
}
```
GREEN: `2 passed`.

**Ciclo E: higiene do GATE 1 e limiar de cobertura.** Teste `tools/config-tests/tests/hygiene.test.mjs`:
```js
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import config from '../../../vitest.config.mts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const git = (...args) => spawnSync('git', args, { cwd: ROOT_DIR, encoding: 'utf8' });
const GREP_NO_MATCH = 1;
const MINIMUM = 80;

describe('higiene do repositório (GATE 1)', () => {
  it('nenhum arquivo rastreado cita caminho da máquina do autor', () => { expect(git('grep', '-nE', '/hom[e]/').status).toBe(GREP_NO_MATCH); });
  it('research_notes e reports ficam fora do git', () => {
    expect(git('check-ignore', 'research_notes/nota.md').status).toBe(0);
    expect(git('check-ignore', 'reports/relatorio.md').status).toBe(0);
  });
  it('o corpus é -text e .gs é JavaScript para o Linguist', () => {
    const attributes = git('check-attr', 'text', 'linguist-language', '--', 'packages/compiler/tests/conformance/a/input.gs').stdout;
    expect(attributes).toContain('text: unset');
    expect(attributes).toContain('linguist-language: JavaScript');
  });
  it('toda autoria do histórico vira uma só identidade', () => {
    const identities = git('log', '--all', '--use-mailmap', '--format=%aN <%aE>').stdout.trim().split('\n');
    expect(new Set(identities).size).toBe(1);
  });
  it('cobertura mínima de 80% em cada pacote', () => {
    const thresholds = config.test.coverage.thresholds;
    expect(Object.keys(thresholds)).toHaveLength(3);
    for (const limits of Object.values(thresholds)) expect(limits).toEqual({ lines: MINIMUM, functions: MINIMUM, branches: MINIMUM, statements: MINIMUM });
  });
});
```
Passa de imediato (U1-01 e U1-02 entregaram); para morder: `sed -i '/conformance/d' .gitattributes`, rodar (1 falha), `git checkout .gitattributes`; esperado final `5 passed`.

- [ ] **F. Ligar ao `verify`.** `scripts`: `"lint": "eslint . --max-warnings 0"`, `"depcruise": "depcruise packages tools --config .dependency-cruiser.cjs"`, `"knip": "knip"`, `"verify": "tsc -p tsconfig.json && eslint . --max-warnings 0 && vitest run --coverage && depcruise packages tools --config .dependency-cruiser.cjs && knip"`. Limpeza (sem teste que só confere tipo; `legacy:lint` segue com 0 erros). `corepack pnpm verify`; `git add eslint.config.mjs .dependency-cruiser.cjs knip.json tools/config-tests package.json pnpm-lock.yaml`; `git commit -m "build(ci): adiciona eslint, dependency-cruiser e knip com testes de configuração"`.

### U1-04: Porte do scanner de regras para tools/rules-scan
**Spec:** §8.1, §8.1.1 · **Tier:** large · **Depende de:** U1-02 · **Risco:** o hash dos dicionários muda com a versão do Ubuntu: se o job divergir da máquina local, regerar com `lock-dictionaries` (decisão explícita) · **Rollback:** `git revert`
**Files:** Create `tools/rules-scan/{package.json,scope.json,policy.json,baseline.json,dictionaries.lock.json}`, `src/{cli,deps,files,baseline,dictionary-lock}.mjs`, `src/{analyze-file,ast-utils,embedded,lexicon,parse,rules}.mjs`, `src/analyzers/*.mjs` (portados de `docs/auditoria/2026-10-13/scanner/lib`), `fixtures/{pt-names,en-names}.txt`, `tests/{dictionary-lock,selftest,rules,files,baseline,gate}.test.mjs`, `tests/support/dictionaries.mjs`; Modify `package.json`.
**Interfaces:** Produces: `node tools/rules-scan/src/cli.mjs check [--root <dir>] [--write-baseline]` e `lock-dictionaries`; script `rules-scan`; `scope.json` com `excluded` (inclui `spikes/poc-compiler` até o gate da Fase 2: seus `.ts` são rastreados e a §8.1.1 só lista três caminhos); `policy.json` (R02, R04–R14, R17, R19 bloqueiam; R01, R03, R15, R16, R18, R20, R21 avisam); baseline vazio para código novo e em catraca só para `apps/`.
**Aceite:** selftest do R14 (≥ 100 nomes com `existente` e `buscarUsuario`, recall ≥ 90%, zero falso positivo); `const existente` em `packages/compiler` é barrado ponta a ponta (R14), idem comentário de histórico (R13), `TODO` sem `GS-<n>` (R10) e nome de arquivo em português; falha com 0 arquivos, `.ts` fora do escopo e da lista `excluded`, dicionário ausente ou hash divergente; `--write-baseline` só grava `apps/` e nunca sobe; `verify` dá 0.

Worktree `U1-04`; `export TMPDIR="$(mktemp -d)"`; `sudo apt-get install --yes wbrazilian wamerican wbritish`. Ler `docs/auditoria/2026-10-13/scanner/lib` e `selftest.mjs` antes. `tools/rules-scan/package.json`:
```json
{ "name": "@goiasscript/rules-scan", "private": true, "version": "0.0.0", "type": "module", "bin": { "rules-scan": "./src/cli.mjs" },
  "dependencies": { "@babel/parser": "7.29.9", "@babel/traverse": "7.29.10", "@babel/types": "7.29.8" } }
```
`src/dictionary-lock.mjs`:
```js
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DICTIONARY_DIR = '/usr/share/dict';
export const DICTIONARY_FILES = ['brazilian', 'american-english', 'british-english'];

export function hashDictionaries(dir = DICTIONARY_DIR) {
  const hashes = {};
  for (const name of DICTIONARY_FILES) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) throw new Error(`dicionário indisponível: ${file} (instale wbrazilian, wamerican e wbritish)`);
    hashes[name] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  return hashes;
}

export function verifyDictionaryLock(lockPath, dir = DICTIONARY_DIR) {
  const locked = JSON.parse(fs.readFileSync(lockPath, 'utf8')).files;
  const actual = hashDictionaries(dir);
  const diverged = DICTIONARY_FILES.filter((name) => locked[name] !== actual[name]);
  if (diverged.length > 0) throw new Error(`hash de dicionário divergente (${diverged.join(', ')}); atualizar é decisão explícita: rode "lock-dictionaries". Atual: ${JSON.stringify(actual)}`);
}

export function writeDictionaryLock(lockPath, dir = DICTIONARY_DIR) {
  fs.writeFileSync(lockPath, `${JSON.stringify({ files: hashDictionaries(dir) }, null, 2)}\n`);
}
```
**Ciclo L (lock):** teste `tests/dictionary-lock.test.mjs`, com dicionários falsos em `os.tmpdir()`:
```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DICTIONARY_FILES, hashDictionaries, verifyDictionaryLock, writeDictionaryLock } from '../src/dictionary-lock.mjs';

const SHA256_HEX = /^[0-9a-f]{64}$/;
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createDirectory() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dictionary-lock-'));
  temporary = [...temporary, dir];
  return dir;
}

function createDictionaries(names) {
  const dir = createDirectory();
  for (const name of names) fs.writeFileSync(path.join(dir, name), `palavras de ${name}\n`);
  return dir;
}

describe('trava dos dicionários do gate de idioma', () => {
  it('aceita o lock gravado e barra o dicionário que mudou', () => {
    const dictionaries = createDictionaries(DICTIONARY_FILES);
    const lockPath = path.join(createDirectory(), 'dictionaries.lock.json');
    writeDictionaryLock(lockPath, dictionaries);
    expect(Object.keys(hashDictionaries(dictionaries))).toEqual(DICTIONARY_FILES);
    for (const hash of Object.values(hashDictionaries(dictionaries))) expect(hash).toMatch(SHA256_HEX);
    expect(() => verifyDictionaryLock(lockPath, dictionaries)).not.toThrow();
    fs.writeFileSync(path.join(dictionaries, 'brazilian'), 'outra versão do dicionário\n');
    expect(() => verifyDictionaryLock(lockPath, dictionaries)).toThrow(/divergente \(brazilian\)/);
  });
  it('barra a falta de um dicionário', () => {
    expect(() => hashDictionaries(createDictionaries(['brazilian']))).toThrow(/dicionário indisponível/);
  });
});
```
RED: `Cannot find module '../src/dictionary-lock.mjs'`; implementar o módulo acima; `2 passed`.

**Ciclo S (selftest do R14 e regras portadas, RED primeiro):** criar `fixtures/pt-names.txt` e `en-names.txt` (nomes separados por espaço; ≥ 100 e ≥ 100), `tests/support/dictionaries.mjs` e `tests/selftest.test.mjs`.

`fixtures/pt-names.txt`:
```
existente buscarUsuario proximoToken tabelaDeSimbolos contarLinhas posicaoAtual escopoAtual lerCaractere
ehDigito fimDoArquivo listaDeErros mensagemDeErro nomeDoArquivo pularEspacos lerNumero lerTexto
tokenAtual valorInicial tamanhoMaximo profundidadeMaxima limiteDeProfundidade colunaInicial linhaFinal numeroDaLinha
erroEncontrado palavraReservada palavrasReservadas chaveDoObjeto valorDaChave resultadoFinal retornoDaFuncao parametroAtual
argumentoInvalido declaracaoDuplicada variavelNaoDeclarada funcaoAninhada corpoDaFuncao blocoAtual instrucaoSimples expressaoBinaria
operadorLogico operandoEsquerdo operandoDireito precedenciaDoOperador associatividade sugestaoDeNome distanciaDeEdicao casoDeTeste
saidaEsperada entradaDoUsuario arquivoDeSaida caminhoDoArquivo diretorioTemporario conteudoDoArquivo quebraDeLinha espacoEmBranco
comentarioDeLinha comentarioDeBloco textoSemFechar numeroMalformado caractereInvalido inicioDoTexto fimDoTexto substituirTexto
removerAcentos normalizarNome gerarCodigo emitirSaida aplicarEdicoes listaDeEdicoes mapaDeOrigem segmentoDoMapa
contagemDeLinhas tabelaDeLinhas posicaoNoTexto fonteOriginal codigoGerado ajudanteUsado ajudantes escopoGlobal
escopoLocal filhoDoNo paiDoNo irmaoDoNo raizDaArvore folhaDaArvore visitarNo percorrerArvore
resolverNome buscarMembro membroDeclarado membroNativo equivalenteGoiano tipoDoErro codigoDoErro severidadeDoErro
tituloDoErro ajudaDoErro exemploDoErro licaoDaCartilha tomDaMensagem frasePronta valorPadrao configuracaoGlobal
opcoesDeCompilacao destinoDaSaida nomeDoPacote versaoDoPacote dataDeCriacao horaDeInicio
```
`fixtures/en-names.txt`:
```
existing findUser nextToken symbolTable countLines currentPosition currentScope readCharacter
isDigit endOfFile errorList errorMessage fileName skipWhitespace readNumber readString
currentToken initialValue maxLength maxNestingDepth depthLimit startColumn endLine lineNumber
foundError reservedWord reservedWords objectKey keyValue finalResult returnValue currentParameter
invalidArgument duplicateDeclaration undeclaredVariable nestedFunction functionBody currentBlock simpleStatement binaryExpression
logicalOperator leftOperand rightOperand operatorPrecedence associativity nameSuggestion editDistance testCase
expectedOutput userInput outputFile filePath temporaryDirectory fileContent lineBreak whitespace
lineComment blockComment unterminatedString malformedNumber invalidCharacter textStart textEnd replaceText
stripAccents normalizeName generateCode emitOutput applyEdits editList sourceMap mapSegment
lineCount lineTable textPosition originalSource generatedCode usedHelper helpers globalScope
localScope childNode parentNode siblingNode treeRoot treeLeaf visitNode walkTree
resolveName lookupMember declaredMember nativeMember errorType errorCode errorSeverity errorTitle
errorHelp errorExample lessonId messageTone readyPhrase defaultValue globalConfig compileOptions
outputTarget packageName packageVersion createdAt startTime stdout argv tsconfig lexer parser analyzer
```
`tests/support/dictionaries.mjs`:
```js
import fs from 'node:fs';
import path from 'node:path';
import { DICTIONARY_DIR } from '../../src/dictionary-lock.mjs';

export const hasDictionaries = fs.existsSync(path.join(DICTIONARY_DIR, 'brazilian'));
```
`tests/selftest.test.mjs`:
```js
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createLexicon } from '../src/lexicon.mjs';
import { hasDictionaries } from './support/dictionaries.mjs';

const MIN_RECALL = 0.9;
const MIN_NAMES = 100;
const readNames = (file) => fs.readFileSync(new URL(`../fixtures/${file}`, import.meta.url), 'utf8').split(/\s+/).filter(Boolean);
const lexicon = createLexicon();
const isFlagged = (name) => ['strong', 'weak'].includes(lexicon.analyzeName(name).tier);

describe.skipIf(!hasDictionaries)('selftest do gate de idioma (R14)', () => {
  const portuguese = readNames('pt-names.txt');
  const english = readNames('en-names.txt');
  it('o corpus em português tem 100 nomes ou mais, com existente e buscarUsuario', () => {
    expect(portuguese.length).toBeGreaterThanOrEqual(MIN_NAMES);
    expect(portuguese).toEqual(expect.arrayContaining(['existente', 'buscarUsuario']));
  });
  it('marca pelo menos 90% dos nomes em português', () => {
    const missed = portuguese.filter((name) => !isFlagged(name));
    expect((portuguese.length - missed.length) / portuguese.length, `não marcados: ${missed.join(' ')}`).toBeGreaterThanOrEqual(MIN_RECALL);
  });
  it('marca existente e buscarUsuario', () => { expect(['existente', 'buscarUsuario'].filter((name) => !isFlagged(name))).toEqual([]); });
  it('não marca nenhum nome em inglês', () => { expect(english.filter(isFlagged)).toEqual([]); });
});
```
Para as regras R03–R21 portadas, o script de porte (fora do repositório, `$TMPDIR/port-scanner.mjs`) gera `tests/rules.test.mjs` a partir de `selftest.mjs` (cada `check(...)` vira `it(...)`; R10 passa a esperar `TODO(GS-<n>)`, então `R10.count === 2`) e copia as fontes com quatro mudanças:
```js
import fs from 'node:fs';
import path from 'node:path';

const [repoArg = '.', mode = 'sources'] = process.argv.slice(2);
const repoRoot = path.resolve(repoArg);
const audit = path.join(repoRoot, 'docs/auditoria/2026-10-13/scanner');
const target = path.join(repoRoot, 'tools/rules-scan');
const read = (rel) => fs.readFileSync(path.join(audit, rel), 'utf8');
function write(rel, text) {
  const file = path.join(target, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
function replaceOnce(text, from, to) {
  if (!text.includes(from)) throw new Error(`trecho não encontrado: ${from.slice(0, 60)}`);
  return text.replace(from, to);
}
function split(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = endMarker === undefined ? text.length : text.indexOf(endMarker);
  if (start < 0 || end < 0) throw new Error(`marcador não encontrado: ${startMarker}`);
  return { before: text.slice(0, start), after: text.slice(end) };
}

function portTests() {
  const original = read('selftest.mjs');
  const afterHelpers = original.slice(original.indexOf('function run('));
  const withoutCheck = afterHelpers.replace(/function check\(name, fn\) \{[\s\S]*?\n\}\n\n/, '');
  const body = withoutCheck
    .slice(0, withoutCheck.indexOf('process.stdout.write(`\\n${passed}'))
    .replace('analyzeFile(ctx, lexicon, emptySurface)', 'analyzeFile(ctx, lexicon)')
    .replaceAll("check('", "it('")
    .replaceAll('.todos', '.todoMarkers')
    .replace(/; \/\/ \d+ linhas$/gm, ';')
    .replace('assert.equal(evaluation.R10.count, 1);', 'assert.equal(evaluation.R10.count, 2);');
  const header = `import assert from 'node:assert/strict';
import { it as baseIt } from 'vitest';
import { analyzeFile, buildContext } from '../src/analyze-file.mjs';
import { deps } from '../src/deps.mjs';
import { createLexicon } from '../src/lexicon.mjs';
import { evaluateFile } from '../src/rules.mjs';
import { hasDictionaries } from './support/dictionaries.mjs';

const it = hasDictionaries ? baseIt : baseIt.skip;
const lexicon = createLexicon();

`;
  write('tests/rules.test.mjs', header + body);
}

function portSources() {
  for (const name of ['analyze-file', 'ast-utils', 'embedded', 'parse']) write(`src/${name}.mjs`, read(`lib/${name}.mjs`));
  for (const name of fs.readdirSync(path.join(audit, 'lib/analyzers'))) write(`src/analyzers/${name}`, read(`lib/analyzers/${name}`));
  const lexicon = split(replaceOnce(read('lib/lexicon.mjs'), "['brazilian', 'portuguese']", "['brazilian']"), 'export function normalizeName', 'export function createLexicon');
  write('src/lexicon.mjs', lexicon.before + lexicon.after);
  const rules = split(read('lib/rules.mjs'), 'export function fileScore');
  write('src/rules.mjs', `${rules.before.trimEnd().replace(/\btodos\b/g, 'todoMarkers')}\n`);
  const suppressions = read('lib/analyzers/suppressions.mjs');
  const withTicket = replaceOnce(suppressions, /const TICKET_PATTERN = .*/.exec(suppressions)[0], 'const TICKET_PATTERN = /^GS-\\d+$/;');
  write('src/analyzers/suppressions.mjs', withTicket.replace(/\btodos\b/g, 'todoMarkers'));
  const identifiers = read('lib/analyzers/identifiers.mjs')
    .replace(/^import \{ normalizeName \}.*\n/m, '')
    .replace(/^import \{ OBJECT_KEY_SURFACE_FILES \}.*\n/m, '')
    .replace(/^const SURFACE_MIRROR_KINDS.*\n/m, '');
  const surface = split(identifiers, 'function classifySurface', 'export function analyzeIdentifiers');
  const replacement = "// A superfície da linguagem vive só em valores string das tabelas; nunca isenta identificador.\nfunction classifySurface() {\n  return 'internal';\n}\n\n";
  write('src/analyzers/identifiers.mjs', surface.before + replacement + surface.after);
}

if (mode === 'tests') portTests();
else if (mode === 'sources') portSources();
else throw new Error('uso: node port-scanner.mjs <raiz do repositório> tests|sources');
```
- S.2 `node "$TMPDIR/port-scanner.mjs" . tests`; `corepack pnpm install && corepack pnpm exec vitest run tools/rules-scan/tests/selftest.test.mjs tools/rules-scan/tests/rules.test.mjs`: `Cannot find module '../src/lexicon.mjs'` / `'../src/analyze-file.mjs'`.
- S.3 `node "$TMPDIR/port-scanner.mjs" . sources` e `src/deps.mjs`:
```js
import * as parser from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as types from '@babel/types';

// O pacote CJS do traverse expõe a função em `.default` quando importado por ESM.
const traverse = traverseModule.default ?? traverseModule;

export const deps = { parser, traverse, types };
```
- S.4 mesmo comando: `25 passed`.

**Ciclo F (escopo, `excluded`, segmentos de caminho).** Teste `tests/files.test.mjs`:
```js
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createLexicon } from '../src/lexicon.mjs';
import { discoverFiles, loadScope, pathSegmentFindings, scopeProblems } from '../src/files.mjs';
import { hasDictionaries } from './support/dictionaries.mjs';

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, '../../..');
const FAKE_ROOT = '/repo';
const scope = loadScope(REPOSITORY_ROOT);
const relativePaths = (entries) => entries.map((entry) => entry.rel);

describe('descoberta de arquivos do scanner', () => {
  it('inclui o código novo e separa o legado e o spike em excluded', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/src/a.ts', 'packages/core/src/a.mjs', 'packages/core/tests/a.ts', 'spikes/poc-compiler/src/a.ts']);
    expect(relativePaths(discovery.included)).toEqual(['packages/compiler/src/a.ts']);
    expect(discovery.excluded).toEqual(['packages/core/src/a.mjs', 'packages/core/tests/a.ts', 'spikes/poc-compiler/src/a.ts']);
    expect(discovery.unscoped).toEqual([]);
  });
  it('acusa arquivo ts fora do escopo e da lista excluded', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/src/a.ts', 'misc/orphan.ts']);
    expect(scopeProblems(discovery)).toEqual(['arquivo rastreado fora do escopo e da lista excluded: misc/orphan.ts']);
  });
  it('falha quando nenhum arquivo é analisado', () => {
    expect(scopeProblems(discoverFiles(FAKE_ROOT, scope, ['README.md']))).toEqual(['o scanner analisou 0 arquivos']);
  });
  it('ignora a saída dourada do corpus de conformidade', () => {
    const discovery = discoverFiles(FAKE_ROOT, scope, ['packages/compiler/src/a.ts', 'packages/compiler/tests/conformance/a/output.mjs']);
    expect(relativePaths(discovery.included)).toEqual(['packages/compiler/src/a.ts']);
    expect(discovery.excluded).toEqual([]);
    expect(discovery.unscoped).toEqual([]);
  });
  it.skipIf(!hasDictionaries)('marca segmento de caminho em português e poupa o resto', () => {
    const findings = pathSegmentFindings(
      ['packages/compiler/src/buscarUsuario.ts', 'packages/compiler/src/lexer.ts', 'docs/gramatica.md', 'packages/compiler/tests/exemplos/programa.gs', 'packages/core/src/arquivo.js'],
      scope,
      createLexicon(),
    );
    expect(findings).toEqual([{ file: 'packages/compiler/src/buscarUsuario.ts', line: 1, text: 'segmento de caminho em português: buscarUsuario.ts' }]);
  });
});
```
RED: `Cannot find module '../src/files.mjs'`. Implementar `scope.json`:
```json
{
  "extensions": [".ts", ".mts", ".tsx", ".mjs", ".cjs"],
  "roots": [
    { "pkg": "language", "path": "packages/language", "dirs": ["src", "tests", "generators"] },
    { "pkg": "compiler", "path": "packages/compiler", "dirs": ["src", "tests"] },
    { "pkg": "optimizer", "path": "packages/optimizer", "dirs": ["src", "tests"] },
    { "pkg": "cli", "path": "packages/cli", "dirs": ["src", "tests"] },
    { "pkg": "vscode", "path": "packages/vscode", "dirs": ["src", "tests"] },
    { "pkg": "scripts", "path": "scripts", "dirs": ["."] },
    { "pkg": "tools", "path": "tools", "dirs": ["."] },
    { "pkg": "apps", "path": "apps", "dirs": ["."] },
    { "pkg": "root", "path": ".", "files": ["eslint.config.mjs", "commitlint.config.mjs", ".lintstagedrc.mjs", "vitest.config.mts"] }
  ],
  "ignoredSegments": ["node_modules", ".next", "coverage", "dist", "generated"],
  "ignoredPrefixes": ["docs", "packages/compiler/tests/conformance", "apps/playground/public/vs", "apps/playground/public/examples", "apps/playground/next-env.d.ts"],
  "excluded": [
    { "path": "packages/core", "reason": "legado removido na Fase 8" },
    { "path": "vscode-extension", "reason": "legado removido na Fase 8" },
    { "path": "lsp-server", "reason": "legado removido na Fase 8" },
    { "path": "spikes/poc-compiler", "reason": "prova de conceito removida no gate da Fase 2" }
  ],
  "pathSegmentsExemptPrefixes": ["docs"]
}
```
`src/files.mjs`:
```js
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TEST_DIR = /(^|\/)(tests?|__tests__)\//;
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const CHECKED_ROOTS = ['packages', 'tools', 'scripts'];
const EXAMPLE_EXTENSION = '.gs';

export const loadScope = (root) => JSON.parse(fs.readFileSync(path.join(root, 'tools/rules-scan/scope.json'), 'utf8'));
export const listTrackedFiles = (root) => execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
export const isInside = (rel, prefix) => rel === prefix || rel.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);

function classifyRole(rel) {
  if (TEST_DIR.test(rel) || TEST_FILE.test(rel)) return 'test';
  if (rel.endsWith('.d.ts')) return 'declaration';
  return rel.startsWith('scripts/') ? 'script' : 'src';
}

const matchRoot = (rel, roots) => roots.find((entry) => (entry.files ?? []).includes(rel) || (entry.dirs ?? []).some((dir) => isInside(rel, path.posix.join(entry.path, dir))));

export function discoverFiles(root, scope, files = listTrackedFiles(root)) {
  const included = [];
  const excluded = [];
  const unscoped = [];
  for (const rel of files) {
    const ext = path.extname(rel);
    if (!scope.extensions.includes(ext)) continue;
    if (scope.excluded.some((entry) => isInside(rel, entry.path))) excluded.push(rel);
    else if (scope.ignoredPrefixes.some((prefix) => isInside(rel, prefix)) || rel.split('/').some((segment) => scope.ignoredSegments.includes(segment))) continue;
    else {
      const entry = matchRoot(rel, scope.roots);
      if (entry) included.push({ rel, abs: path.join(root, rel), pkg: entry.pkg, role: classifyRole(rel), ext });
      else if (['.ts', '.mts', '.tsx'].includes(ext)) unscoped.push(rel);
    }
  }
  return { included, excluded, unscoped };
}

export function scopeProblems(discovery) {
  const problems = discovery.unscoped.map((rel) => `arquivo rastreado fora do escopo e da lista excluded: ${rel}`);
  return discovery.included.length === 0 ? [...problems, 'o scanner analisou 0 arquivos'] : problems;
}

// Pasta e arquivo seguem o mesmo critério de idioma dos identificadores (ADR-0007).
export function pathSegmentFindings(files, scope, lexicon) {
  const findings = [];
  for (const rel of files) {
    if (!CHECKED_ROOTS.includes(rel.split('/')[0] ?? '') || path.extname(rel) === EXAMPLE_EXTENSION) continue;
    if (scope.excluded.some((entry) => isInside(rel, entry.path)) || scope.pathSegmentsExemptPrefixes.some((prefix) => isInside(rel, prefix))) continue;
    for (const segment of rel.split('/')) {
      const tier = lexicon.analyzeName(path.basename(segment, path.extname(segment))).tier;
      if (tier === 'strong' || tier === 'weak') findings.push({ file: rel, line: 1, text: `segmento de caminho em português: ${segment}` });
    }
  }
  return findings;
}
```
GREEN: `5 passed`.

**Ciclo B (baseline em catraca).** Teste `tests/baseline.test.mjs`:
```js
import { describe, expect, it } from 'vitest';
import { compareWithBaseline, nextBaseline } from '../src/baseline.mjs';

const policy = { severity: { R14: 'error', R16: 'warn' } };
const violation = (count) => ({ count, items: Array.from({ length: count }, (_unused, index) => ({ line: index + 1, text: `ocorrência ${String(index + 1)}` })) });

describe('baseline em catraca', () => {
  it('piora em regra de erro bloqueia e em regra de aviso só avisa', () => {
    const current = { 'apps/a.ts': { R14: violation(3), R16: violation(3) } };
    const comparison = compareWithBaseline(current, { 'apps/a.ts': { R14: 2, R16: 2 } }, policy);
    expect(comparison.errors).toMatchObject([{ file: 'apps/a.ts', id: 'R14', allowed: 2, now: 3, sample: [{ line: 3, text: 'ocorrência 3' }] }]);
    expect(comparison.warnings).toMatchObject([{ file: 'apps/a.ts', id: 'R16', allowed: 2, now: 3 }]);
    expect(comparison.slack).toEqual([]);
  });
  it('melhora vira folga que bloqueia até o baseline ser atualizado', () => {
    const comparison = compareWithBaseline({ 'apps/a.ts': { R14: violation(1) } }, { 'apps/a.ts': { R14: 2 } }, policy);
    expect(comparison.slack).toEqual([{ file: 'apps/a.ts', id: 'R14', allowed: 2, now: 1 }]);
    expect(comparison.errors).toEqual([]);
  });
  it('violação fora do baseline é erro', () => {
    const comparison = compareWithBaseline({ 'packages/compiler/src/a.ts': { R14: violation(1) } }, {}, policy);
    expect(comparison.errors).toMatchObject([{ file: 'packages/compiler/src/a.ts', id: 'R14', allowed: 0, now: 1 }]);
  });
  it('só grava baseline de apps/ e só quando melhora', () => {
    expect(() => nextBaseline({ 'packages/compiler/src/a.ts': { R14: violation(1) } }, undefined, policy)).toThrow(/só vale para apps\//);
    expect(() => nextBaseline({ 'apps/a.ts': { R14: violation(3) } }, { 'apps/a.ts': { R14: 2 } }, policy)).toThrow(/só pode melhorar/);
    expect(nextBaseline({ 'apps/a.ts': { R14: violation(1), R16: violation(5) } }, { 'apps/a.ts': { R14: 2 } }, policy)).toEqual({ version: 1, files: { 'apps/a.ts': { R14: 1 } } });
  });
});
```
RED: `Cannot find module '../src/baseline.mjs'`. `policy.json`:
```json
{ "severity": {
  "R01": "warn", "R02": "error", "R03": "warn", "R04": "error", "R05": "error", "R06": "error", "R07": "error",
  "R08": "error", "R09": "error", "R10": "error", "R11": "error", "R12": "error", "R13": "error", "R14": "error",
  "R15": "warn", "R16": "warn", "R17": "error", "R18": "warn", "R19": "error", "R20": "warn", "R21": "warn" } }
```
`src/baseline.mjs`:
```js
import fs from 'node:fs';
import { RULES, evaluateFile } from './rules.mjs';

const BASELINABLE_PREFIX = 'apps/';
const severityOf = (policy, ruleId) => policy.severity[ruleId] ?? 'warn';

export function currentViolations(results) {
  const state = {};
  for (const file of results) {
    const evaluation = evaluateFile(file);
    for (const rule of RULES) {
      if (evaluation[rule.id].count === 0) continue;
      state[file.file] ??= {};
      state[file.file][rule.id] = { count: evaluation[rule.id].count, items: evaluation[rule.id].items };
    }
  }
  return state;
}

// Piora em regra de erro bloqueia; melhora sem baseline atualizado também bloqueia.
export function compareWithBaseline(current, baselineFiles, policy) {
  const errors = [];
  const warnings = [];
  const slack = [];
  for (const file of [...new Set([...Object.keys(current), ...Object.keys(baselineFiles)])].sort()) {
    for (const rule of RULES) {
      const now = current[file]?.[rule.id]?.count ?? 0;
      const allowed = baselineFiles[file]?.[rule.id] ?? 0;
      const blocking = severityOf(policy, rule.id) === 'error';
      if (now > allowed) (blocking ? errors : warnings).push({ file, id: rule.id, title: rule.title, allowed, now, sample: current[file][rule.id].items.slice(-(now - allowed)) });
      else if (now < allowed && blocking) slack.push({ file, id: rule.id, allowed, now });
    }
  }
  return { errors, warnings, slack };
}

export function nextBaseline(current, existing, policy) {
  const files = {};
  for (const [file, rules] of Object.entries(current)) {
    const blocking = Object.entries(rules).filter(([id]) => severityOf(policy, id) === 'error');
    if (blocking.length === 0) continue;
    if (!file.startsWith(BASELINABLE_PREFIX)) throw new Error(`baseline só vale para ${BASELINABLE_PREFIX}*; corrija ${file}`);
    files[file] = Object.fromEntries(blocking.map(([id, entry]) => [id, entry.count]));
    for (const [id, count] of Object.entries(files[file])) {
      if (existing && count > (existing[file]?.[id] ?? 0)) throw new Error(`o baseline só pode melhorar: ${file} ${id} subiria para ${count}`);
    }
  }
  return { version: 1, files };
}

export const readBaseline = (baselinePath) => (fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')).files : undefined);
```
GREEN: `4 passed`.

**Ciclo G (gate ponta a ponta).** Teste `tests/gate.test.mjs`: `createProject` monta um repositório temporário com `git init`, os três arquivos de configuração da ferramenta e um baseline vazio, e o gate roda o CLI sobre ele:
```js
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { hasDictionaries } from './support/dictionaries.mjs';

const TOOL_DIR = path.resolve(import.meta.dirname, '..');
const CLI = path.join(TOOL_DIR, 'src/cli.mjs');
const TOOL_FILES = ['scope.json', 'policy.json', 'dictionaries.lock.json'];
const EMPTY_BASELINE = '{"version":1,"files":{}}\n';
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rules-scan-gate-'));
  temporary = [...temporary, root];
  spawnSync('git', ['init', '--quiet'], { cwd: root });
  fs.mkdirSync(path.join(root, 'tools/rules-scan'), { recursive: true });
  for (const name of TOOL_FILES) fs.copyFileSync(path.join(TOOL_DIR, name), path.join(root, 'tools/rules-scan', name));
  fs.writeFileSync(path.join(root, 'tools/rules-scan/baseline.json'), EMPTY_BASELINE);
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

const check = (files) => spawnSync('node', [CLI, 'check', '--root', createProject(files)], { encoding: 'utf8' });

describe.skipIf(!hasDictionaries)('gate ponta a ponta do scanner', () => {
  it('barra identificador em português no compilador (R14)', () => {
    const result = check({ 'packages/compiler/src/a.ts': 'export const existente = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('R14');
    expect(result.stdout).toContain('existente');
  });
  it('barra TODO sem ticket (R10) e comentário de histórico (R13)', () => {
    const result = check({ 'packages/compiler/src/a.ts': '// TODO ajustar\n// corrige o bug do gate F2\nexport const value = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('R10');
    expect(result.stdout).toContain('R13');
  });
  it('barra nome de arquivo em português', () => {
    const result = check({ 'packages/compiler/src/buscarUsuario.ts': 'export const value = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('segmento de caminho em português');
  });
  it('aprova código novo em inglês', () => {
    const result = check({ 'packages/compiler/src/a.ts': 'export const currentValue = 1;\n' });
    expect(result.status).toBe(0);
  });
});
```
RED: 4 × `ENOENT … copyfile '…/dictionaries.lock.json'`. `src/cli.mjs`:
```js
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeFile, buildContext } from './analyze-file.mjs';
import { compareWithBaseline, currentViolations, nextBaseline, readBaseline } from './baseline.mjs';
import { deps } from './deps.mjs';
import { verifyDictionaryLock, writeDictionaryLock } from './dictionary-lock.mjs';
import { discoverFiles, listTrackedFiles, loadScope, pathSegmentFindings, scopeProblems } from './files.mjs';
import { createLexicon } from './lexicon.mjs';

const TOOL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXIT_VIOLATION = 1;
const EXIT_USAGE = 2;
const out = (text) => process.stdout.write(`${text}\n`);

function readOptions(argv) {
  const rootIndex = argv.indexOf('--root');
  return {
    command: argv.find((arg) => !arg.startsWith('--')) ?? 'check',
    root: rootIndex >= 0 ? path.resolve(argv[rootIndex + 1]) : path.resolve(TOOL_DIR, '../..'),
    writeBaseline: argv.includes('--write-baseline'),
  };
}

function violationsOf(root) {
  const scope = loadScope(root);
  const files = listTrackedFiles(root);
  const discovery = discoverFiles(root, scope, files);
  const lexicon = createLexicon();
  const current = currentViolations(discovery.included.map((file) => analyzeFile(buildContext(file, deps), lexicon)));
  for (const finding of pathSegmentFindings(files, scope, lexicon)) {
    current[finding.file] ??= {};
    current[finding.file].R14 = { count: (current[finding.file].R14?.count ?? 0) + 1, items: [finding] };
  }
  return { discovery, current };
}

function check(options) {
  const dir = path.join(options.root, 'tools/rules-scan');
  verifyDictionaryLock(path.join(dir, 'dictionaries.lock.json'));
  const policy = JSON.parse(fs.readFileSync(path.join(dir, 'policy.json'), 'utf8'));
  const { discovery, current } = violationsOf(options.root);
  const baselinePath = path.join(dir, 'baseline.json');
  if (options.writeBaseline) {
    fs.writeFileSync(baselinePath, `${JSON.stringify(nextBaseline(current, readBaseline(baselinePath), policy), null, 2)}\n`);
    out('baseline gravado');
    return 0;
  }
  const comparison = compareWithBaseline(current, readBaseline(baselinePath) ?? {}, policy);
  const problems = scopeProblems(discovery);
  for (const problem of problems) out(`[ERRO] ${problem}`);
  for (const entry of comparison.errors) {
    out(`[ERRO] ${entry.file} ${entry.id} (${entry.title}): ${entry.allowed} -> ${entry.now}`);
    for (const item of entry.sample.slice(0, 3)) out(`        linha ${item.line}: ${item.text}`);
  }
  for (const entry of comparison.slack) out(`[FOLGA] ${entry.file} ${entry.id}: baseline ${entry.allowed}, atual ${entry.now}; rode --write-baseline`);
  out(`${comparison.warnings.length} aviso(s) de regras não bloqueantes.`);
  return problems.length + comparison.errors.length + comparison.slack.length > 0 ? EXIT_VIOLATION : 0;
}

function main() {
  const options = readOptions(process.argv.slice(2));
  if (options.command === 'lock-dictionaries') {
    writeDictionaryLock(path.join(options.root, 'tools/rules-scan/dictionaries.lock.json'));
    return 0;
  }
  if (options.command !== 'check') {
    out(`comando desconhecido: ${options.command}`);
    return EXIT_USAGE;
  }
  return check(options);
}

try {
  process.exitCode = main();
} catch (error) {
  out(`[ERRO] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = EXIT_USAGE;
}
```
Gerar lock e baseline do legado (só `apps/`; única vez em que `--write-baseline` parte de arquivo ausente): `node tools/rules-scan/src/cli.mjs lock-dictionaries`; `... check --write-baseline` (`baseline gravado`); `... check; echo "exit=$?"` → `exit=0`. GREEN: `corepack pnpm exec vitest run tools/rules-scan` → `40 passed`.

- [ ] **H. Ligar e fechar.** `scripts`: `"rules-scan": "node tools/rules-scan/src/cli.mjs check"` e, no `verify`, o scanner depois do ESLint (`tsc … && eslint … && node tools/rules-scan/src/cli.mjs check && vitest … && depcruise … && knip`). Limpeza: o scanner, o ESLint e o knip passam sobre `tools/rules-scan` sem alterar o código portado (as regras de tamanho R01 e R03 só avisam). `corepack pnpm install && corepack pnpm verify`; `git add tools/rules-scan package.json pnpm-lock.yaml`; `git commit -m "ci(ci): porta o gate de idioma e de comentários para tools/rules-scan"`.

### U1-05: Hooks e commits (husky, lint-staged, commitlint)
**Spec:** §8.1, ADR-0008 · **Tier:** small · **Depende de:** U1-02 (testes em `tools/config-tests`, de U1-03; enfileirar depois) · **Risco:** `pre-push` roda `verify` inteiro; é o guardrail contra push com build quebrado · **Rollback:** `git revert` e `git config --unset core.hooksPath`
**Files:** Create `commitlint.config.mjs`, `.lintstagedrc.mjs`, `.husky/{commit-msg,pre-commit,pre-push}`, `tools/config-tests/tests/commitlint.test.mjs`; Modify `package.json`, `pnpm-lock.yaml`.
**Interfaces:** Produces: `commitlint.config.mjs` (tipos, escopos, `header-max-length` 72, `subject-vague`, `subject-starts-lowercase`, `footer-no-ai-attribution`), reutilizado pelo job `commitlint` de U1-06; hooks do git.
**Aceite:** commitlint rejeita escopo com ID Jira, escopo fora do `scope-enum`, tipo inexistente, assunto em maiúscula ou vago, ponto final, cabeçalho > 72 e trailer `Co-Authored-By` de Claude, bot ou Copilot, e aceita co-autor humano; o hook `commit-msg` barra e aceita; `verify` dá 0.

Worktree `U1-05`. Dependências (o legado tinha `^`): `corepack pnpm remove -D -w husky lint-staged`; `corepack pnpm add -D -w husky@9.1.7 lint-staged@17.6.0 @commitlint/cli@21.2.4 @commitlint/config-conventional@21.2.4`; em `package.json`, `"prepare": "husky"` e apagar o bloco `lint-staged` do legado.

**Ciclo C.** Teste `tools/config-tests/tests/commitlint.test.mjs`:
```js
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const CLI = path.join(ROOT_DIR, 'node_modules/@commitlint/cli/cli.js');
const lint = (message) => spawnSync('node', [CLI, '--config', 'commitlint.config.mjs'], { cwd: ROOT_DIR, input: message, encoding: 'utf8' });

const rejected = [
  ['escopo com ID Jira', 'feat(SIGAGPC-1234): adiciona lexer'],
  ['escopo fora da lista', 'feat(core): adiciona lexer'],
  ['tipo inexistente', 'feature(compiler): adiciona lexer'],
  ['assunto em maiúscula', 'feat(compiler): Adiciona lexer'],
  ['assunto vago "ajustes"', 'fix(compiler): ajustes'],
  ['assunto vago "wip"', 'chore: wip'],
  ['ponto final', 'feat(compiler): adiciona lexer.'],
  ['cabeçalho acima de 72', `feat(compiler): ${'a'.repeat(60)}`],
  ['trailer da Claude', 'feat(compiler): adiciona lexer\n\ncorpo\n\nCo-Authored-By: Claude <noreply@anthropic.com>'],
  ['trailer de bot', 'chore(deps): atualiza typescript\n\nCo-authored-by: dependabot[bot] <bot@example.com>'],
  ['trailer do Copilot', 'feat(cli): adiciona comando\n\nCo-authored-by: Copilot <copilot@example.com>'],
];
const accepted = [
  ['feature com escopo', 'feat(compiler): adiciona lexer sob demanda'],
  ['sem escopo', 'docs: atualiza o claude.md'],
  ['acento e identificador no meio', 'fix(language): corrige variante sem acento de se_não'],
  ['co-autor humano', 'refactor(compiler): extrai tabela de linhas\n\ncorpo\n\nCo-authored-by: Abbott Silva <abbott@example.com>'],
];

describe('commitlint (ADR-0008)', () => {
  it.each(rejected)('rejeita: %s', (_title, message) => { expect(lint(message).status).toBe(1); });
  it.each(accepted)('aceita: %s', (_title, message) => { expect(lint(message).status).toBe(0); });
});
```
RED: `4 failed | 11 passed` (sem config o commitlint sai 1; os `aceita` falham). `commitlint.config.mjs`:
```js
const TYPES = ['feat', 'fix', 'refactor', 'docs', 'test', 'chore', 'perf', 'ci', 'style', 'build', 'revert'];
const SCOPES = ['language', 'compiler', 'optimizer', 'cli', 'vscode', 'playground', 'engoianador', 'docs', 'ci', 'deps', 'release'];
const MAX_HEADER_LENGTH = 72;
const VAGUE_SUBJECTS = new Set(['ajustes', 'ajuste', 'fix', 'updates', 'update', 'wip']);
const AI_TRAILER = /^co-authored-by:.*(\[bot\]|\bbot\b|claude|anthropic|copilot)/im;

const localRules = {
  rules: {
    'subject-vague': ({ subject }) => [!VAGUE_SUBJECTS.has((subject ?? '').trim().toLowerCase()), 'o assunto é vago; diga o que mudou'],
    'subject-starts-lowercase': ({ subject }) => {
      const first = (subject ?? '').trim().charAt(0);
      return [first === first.toLowerCase(), 'o assunto começa em minúscula'];
    },
    'footer-no-ai-attribution': ({ raw }) => [!AI_TRAILER.test(raw ?? ''), 'trailer Co-Authored-By de IA ou bot não é permitido'],
  },
};

export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [localRules],
  rules: {
    'type-enum': [2, 'always', TYPES],
    'scope-enum': [2, 'always', SCOPES],
    'subject-case': [0],
    'header-max-length': [2, 'always', MAX_HEADER_LENGTH],
    'subject-full-stop': [2, 'never', '.'],
    'subject-vague': [2, 'always'],
    'subject-starts-lowercase': [2, 'always'],
    'footer-no-ai-attribution': [2, 'always'],
  },
};
```
GREEN: `15 passed`.

**Ciclo H (hooks e lint-staged).** `.lintstagedrc.mjs` (ESLint nos staged; scanner e typecheck uma vez, porque olham o repositório inteiro):
```js
const ESLINT = 'eslint --max-warnings 0 --no-warn-ignored';

export default {
  '*.{ts,mts,mjs,cjs}': [ESLINT],
  '*.{ts,mts,mjs,cjs,json}': () => 'node tools/rules-scan/src/cli.mjs check',
  '*.{ts,mts}': () => 'tsc -p tsconfig.json',
};
```
Hooks (husky 9 dispensa shebang):
```bash
printf 'corepack pnpm exec commitlint --edit "$1"\n' > .husky/commit-msg
printf 'corepack pnpm exec lint-staged\n' > .husky/pre-commit
printf 'corepack pnpm run verify\n' > .husky/pre-push
chmod +x .husky/commit-msg .husky/pre-commit .husky/pre-push
corepack pnpm install
git config core.hooksPath
printf 'feat(SIGAGPC-1): x\n' > "$TMPDIR/m"; sh .husky/commit-msg "$TMPDIR/m"; echo "ruim=$?"
printf 'feat(compiler): adiciona lexer\n' > "$TMPDIR/m"; sh .husky/commit-msg "$TMPDIR/m"; echo "bom=$?"
```
Esperado: `.husky/_`, `ruim=1` (com `scope must be one of`), `bom=0`. Limpeza: o knip não deve acusar `husky` nem `@commitlint/cli` (só `lint-staged` está em `ignoreDependencies`). `corepack pnpm verify`; `git add commitlint.config.mjs .lintstagedrc.mjs .husky/commit-msg .husky/pre-commit .husky/pre-push tools/config-tests/tests/commitlint.test.mjs package.json pnpm-lock.yaml`; `git commit -m "chore(ci): adiciona hooks de commit com husky, lint-staged e commitlint"`.

### U1-06: CI, segurança, rotina semanal, Dependabot e template de PR
**Spec:** §8.3, §8.5 · **Tier:** medium · **Depende de:** U1-03, U1-04, U1-05 · **Risco:** o OSV pode acusar dependência do legado (registrar em `osv-scanner.toml` com motivo até a Fase 8) e o lock dos dicionários pode divergir no runner (regerar só por decisão explícita) · **Rollback:** `git revert`
**Files:** Rename `.github/workflows/ci.yml` → `legacy-ci.yml`; Create `.github/workflows/{ci,codeql,osv,scheduled}.yml`, `.github/dependabot.yml`, `scripts/{pr-body.ts,check-pr-body.ts}`, `tools/config-tests/tests/{workflows,pr-body}.test.mjs`; Modify `.github/pull_request_template.md`, `package.json`.
**Interfaces:** Produces: jobs `verify`, `test`, `commitlint`, `patch-coverage`, `pr-body` (nomes que o ruleset exige); `checkPullRequestBody(body: string): readonly string[]`; template com `## Revisão` e `teste de regressão incluído`. `compat` nasce na Fase 2 e `promises-gate` em U1-08; o Node 26 entra na matriz em 2026-10-28.
**Aceite:** toda action pinada por SHA de 40 caracteres com a versão em comentário e `permissions` mínimas no topo (inclusive no legado); matriz Node 22/24 × Ubuntu/Windows só para os pacotes e o gate de idioma só no job Ubuntu `verify`; cobertura de patch ≥ 80% por `diff-cover` 10.6.0 sobre o lcov; título e corpo do PR nunca interpolados direto no script; `verify` dá 0.

Worktree `U1-06`. Resolver o SHA de cada tag (a saída repete os valores de "Esperado" logo abaixo, que são os usados nos arquivos) e instalar `yaml`:
```bash
for r in actions/checkout:v7.0.1 actions/setup-node:v7.1.0 actions/setup-python:v7.0.0 actions/upload-artifact:v7.0.2 pnpm/action-setup:v6.1.0 github/codeql-action:v4.39.0 google/osv-scanner-action:v2.7.0; do
  echo "${r%%:*}@${r##*:} $(gh api "repos/${r%%:*}/tags" --paginate --jq ".[] | select(.name==\"${r##*:}\") | .commit.sha")"
done
corepack pnpm add -D -w yaml@2.9.1
```
Esperado (2026-10-20): checkout `3d3c42e5aac5ba805825da76410c181273ba90b1`, setup-node `949feb2413d6458794dcd2491c4babbbce0c15c1`, setup-python `5fda3b95a4ea91299a34e894583c3862153e4b97`, upload-artifact `cf430e030ddbb5b0abf93d22962f4752f3646cd9`, pnpm/action-setup `ea17c68df8912ef543352723c149a84f56e3d413`, codeql `6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee`, osv-scanner-action `b1d267aea5211fa648d9d442fa64b90dbdcbdd36`.

**Ciclo P (corpo do PR).** Teste `tools/config-tests/tests/pr-body.test.mjs`:
```js
import { describe, expect, it } from 'vitest';
import { checkPullRequestBody } from '../../../scripts/pr-body.ts';

describe('corpo do PR', () => {
  it('aceita seção Revisão preenchida', () => { expect(checkPullRequestBody('## Resumo\nx\n\n## Revisão\nAchado A: corrigido.\n\n## Teste\ny')).toEqual([]); });
  it('barra seção ausente, vazia ou só com comentário', () => {
    expect(checkPullRequestBody('## Resumo\nx')).toEqual(['o corpo do PR precisa da seção "## Revisão"']);
    expect(checkPullRequestBody('## Revisão\n\n## Teste')).toEqual(['a seção "## Revisão" está vazia']);
    expect(checkPullRequestBody('## Revisão\n<!-- cole aqui -->\n')).toEqual(['a seção "## Revisão" está vazia']);
  });
  it('barra o rodapé Generated with', () => { expect(checkPullRequestBody('## Revisão\nok\n\nGenerated with algo')).toEqual(['o corpo do PR não pode ter o rodapé "Generated with"']); });
});
```
RED: `Cannot find module '../../../scripts/pr-body.ts'`. `scripts/pr-body.ts`:
```ts
const REVIEW_HEADING = /^##\s+Revisão\s*$/m;
const NEXT_HEADING = /^##\s/m;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const GENERATED_FOOTER = /generated with/i;

function reviewProblems(body: string): readonly string[] {
  const heading = REVIEW_HEADING.exec(body);
  if (heading === null) return ['o corpo do PR precisa da seção "## Revisão"'];
  const section = body.slice(heading.index + heading[0].length).split(NEXT_HEADING)[0] ?? '';
  return section.replace(HTML_COMMENT, '').trim() === '' ? ['a seção "## Revisão" está vazia'] : [];
}

export function checkPullRequestBody(body: string): readonly string[] {
  return [...reviewProblems(body), ...(GENERATED_FOOTER.test(body) ? ['o corpo do PR não pode ter o rodapé "Generated with"'] : [])];
}
```
`scripts/check-pr-body.ts`:
```ts
import { checkPullRequestBody } from './pr-body.ts';

const problems = checkPullRequestBody(process.env['PR_BODY'] ?? '');
for (const problem of problems) process.stderr.write(`${problem}\n`);
process.exit(problems.length === 0 ? 0 : 1);
```
GREEN: `3 passed`.

**Ciclo W (workflows).** Teste `tools/config-tests/tests/workflows.test.mjs` (a lista de workflows vem da pasta; cada arquivo novo entra sozinho nas três verificações do `describe.each`):
```js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKFLOWS_DIR = path.join(ROOT_DIR, '.github/workflows');
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const VERSION_COMMENT = /#\s*v\d+\.\d+\.\d+\s*$/;
const USES_LINE = /^\s*(?:-\s+)?uses:\s*(\S+)/;
const PULL_REQUEST_TEXT = /github\.event\.pull_request\.(?:title|body)/;
const MINIMUM_PATCH_COVERAGE = '--fail-under=80';
const REQUIRED_JOBS = ['verify', 'test', 'commitlint', 'patch-coverage', 'pr-body'];
const MATRIX = { node: ['22', '24'], os: ['ubuntu-24.04', 'windows-2025'] };

const readText = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
const readYaml = (rel) => parse(readText(rel));
const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((name) => name.endsWith('.yml')).sort();
const stepsOf = (job) => job.steps ?? [];
const runScripts = (workflow) => Object.values(workflow.jobs).flatMap((job) => stepsOf(job).map((step) => step.run ?? ''));
const commandsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');

describe.each(workflowFiles)('workflow %s', (file) => {
  const rel = `.github/workflows/${file}`;
  it('pina cada action por SHA de 40 caracteres com a versão em comentário', () => {
    const usesLines = readText(rel).split('\n').filter((line) => USES_LINE.test(line));
    const offenders = usesLines.filter((line) => !PINNED_ACTION.test(USES_LINE.exec(line)?.[1] ?? '') || !VERSION_COMMENT.test(line));
    expect(offenders).toEqual([]);
  });
  it('declara permissions mínimas no topo', () => {
    expect(readYaml(rel).permissions).toEqual({ contents: 'read' });
  });
  it('nunca interpola título nem corpo do PR no script', () => {
    expect(runScripts(readYaml(rel)).filter((script) => PULL_REQUEST_TEXT.test(script))).toEqual([]);
  });
});

describe('ci.yml', () => {
  const ci = readYaml('.github/workflows/ci.yml');
  it('define os jobs que o ruleset exige', () => {
    expect(Object.keys(ci.jobs)).toEqual(expect.arrayContaining(REQUIRED_JOBS));
  });
  it('cancela execuções antigas da mesma ref', () => {
    expect(ci.concurrency.group).toContain('github.ref');
  });
  it('roda os testes na matriz Node 22 e 24 em Ubuntu e Windows', () => {
    expect(ci.jobs.tests.strategy.matrix).toEqual(MATRIX);
  });
  it('roda o gate de idioma só no job verify, em Ubuntu', () => {
    expect(ci.jobs.verify['runs-on']).toBe('ubuntu-24.04');
    expect(commandsOf(ci.jobs.verify)).toContain('wbrazilian wamerican wbritish');
    expect(commandsOf(ci.jobs.verify)).toContain('pnpm run verify');
    expect(JSON.stringify(ci.jobs.tests)).not.toContain('rules-scan');
  });
  it('exige 80% de cobertura nas linhas alteradas', () => {
    expect(commandsOf(ci.jobs['patch-coverage'])).toContain(MINIMUM_PATCH_COVERAGE);
  });
});

describe('demais arquivos de .github', () => {
  it('codeql analisa javascript-typescript', () => {
    expect(readText('.github/workflows/codeql.yml')).toContain('languages: javascript-typescript');
  });
  it('osv lê o lockfile do pnpm', () => {
    expect(readText('.github/workflows/osv.yml')).toContain('--lockfile=pnpm-lock.yaml');
  });
  it('a rotina semanal tem exatamente um agendamento', () => {
    expect(readYaml('.github/workflows/scheduled.yml').on.schedule).toHaveLength(1);
  });
  it('dependabot cobre npm e github-actions', () => {
    expect(readYaml('.github/dependabot.yml').updates.map((update) => update['package-ecosystem'])).toEqual(['npm', 'github-actions']);
  });
  it('o template de PR tem a seção Revisão e o item de teste de regressão', () => {
    const template = readText('.github/pull_request_template.md');
    expect(template).toMatch(/^## Revisão$/m);
    expect(template).toContain('- [ ] teste de regressão incluído');
  });
});
```
RED: com o `ci.yml` do legado, `expected [ '        uses: actions/checkout@v4', … ] to deeply equal []` e `ENOENT … codeql.yml`.
Implementar. Legado:
```bash
git mv .github/workflows/ci.yml .github/workflows/legacy-ci.yml
sed -i \
 -e 's|^name: .*|name: CI legado|' \
 -e "s#branches: \[main, staging, 'feat/\*\*'\]#branches: [main, 'v3/**']#" \
 -e 's#branches: \[main, staging\]#branches: [main]#' \
 -e 's|actions/checkout@v4|actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1|' \
 -e 's|actions/setup-node@v4|actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0|' \
 -e 's|actions/upload-artifact@v4|actions/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9 # v7.0.2|' \
 -e 's|pnpm/action-setup@v4|pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413 # v6.1.0|' \
 -e 's|run: pnpm lint$|run: pnpm legacy:lint|' \
 -e 's|run: pnpm format:check$|run: pnpm legacy:format:check|' \
 -e 's|run: pnpm test:coverage$|run: pnpm legacy:test:coverage|' \
 -e '/Upload coverage para Codecov/,/continue-on-error: true/d' \
 -e '/^jobs:/i permissions:\n  contents: read\n\nconcurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true\n' \
 .github/workflows/legacy-ci.yml
```
`.github/workflows/ci.yml` (`corepack enable` antes do `setup-node`: o Node 26 não traz corepack):
```yaml
name: CI

on:
  push:
    branches: [main, 'v3/**']
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}

env:
  HUSKY: '0'

jobs:
  verify:
    name: verify
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - name: Dicionários do gate de idioma
        run: sudo apt-get update && sudo apt-get install --yes wbrazilian wamerican wbritish
      - run: corepack enable
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run verify

  tests:
    name: tests (node ${{ matrix.node }}, ${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        node: ['22', '24']
        os: [ubuntu-24.04, windows-2025]
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - run: corepack enable
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec vitest run --coverage --project @goiasscript/language --project @goiasscript/compiler --project @goiasscript/optimizer

  test:
    name: test
    needs: tests
    if: always()
    runs-on: ubuntu-24.04
    steps:
      - name: Resultado da matriz
        env:
          RESULT: ${{ needs.tests.result }}
        run: test "$RESULT" = success

  commitlint:
    name: commitlint
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { fetch-depth: 0 }
      - run: corepack enable
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Commits do PR
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: pnpm exec commitlint --from "$BASE_SHA" --to "$HEAD_SHA" --verbose
      - name: Título do PR
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: printf '%s\n' "$PR_TITLE" | pnpm exec commitlint --verbose

  patch-coverage:
    name: patch-coverage
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with: { fetch-depth: 0 }
      - run: corepack enable
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24, cache: pnpm }
      - uses: actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97 # v7.0.0
        with: { python-version: '3.13' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec vitest run --coverage --project @goiasscript/language --project @goiasscript/compiler --project @goiasscript/optimizer
      - run: pip install diff-cover==10.6.0
      - name: Cobertura das linhas alteradas
        env:
          BASE_REF: ${{ github.base_ref }}
        run: diff-cover coverage/lcov.info --compare-branch="origin/$BASE_REF" --fail-under=80

  pr-body:
    name: pr-body
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24 }
      - name: Seção Revisão e rodapé proibido
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: node scripts/check-pr-body.ts
```
`codeql.yml`:
```yaml
name: CodeQL

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '17 4 * * 1'

permissions:
  contents: read

jobs:
  analyze:
    runs-on: ubuntu-24.04
    permissions:
      actions: read
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: github/codeql-action/init@6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee # v4.39.0
        with: { languages: javascript-typescript, build-mode: none }
      - uses: github/codeql-action/analyze@6f2ac81f5cd81fe351a197ba0b00d91d03cd2aee # v4.39.0
        with: { category: /language:javascript-typescript }
```
`osv.yml`:
```yaml
name: OSV

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '41 5 * * 1'

permissions:
  contents: read

jobs:
  scan:
    permissions:
      actions: read
      contents: read
      security-events: write
    uses: google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@b1d267aea5211fa648d9d442fa64b90dbdcbdd36 # v2.7.0
    with:
      scan-args: |-
        --lockfile=pnpm-lock.yaml
```
`scheduled.yml` (hoje só dependências; contrato do Engoianador, links e URLs de doação entram nas Fases 7, 8 e 4):
```yaml
name: Semanal

on:
  schedule:
    - cron: '0 6 * * 1'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  dependencies:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - run: corepack enable
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Auditoria de dependências
        run: pnpm audit --audit-level=high
```
`.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: 'chore(deps)'
    groups:
      toolchain:
        patterns: ['*']
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: 'ci'
```
`.github/pull_request_template.md` (substitui o do legado):
```markdown
## Resumo

<!-- O que muda e por quê. -->

## Revisão

<!-- Cole aqui o resultado do agente revisor em contexto fresco: cada ponto levantado e o que foi feito com ele. -->

## Checklist de auto-revisão

- [ ] `corepack pnpm verify` passou localmente
- [ ] teste de regressão incluído
- [ ] sem `any`, sem `console`, sem número ou texto mágico novo
- [ ] identificadores em inglês; comentários só do porquê, em português
- [ ] mensagens para o usuário em goianês
- [ ] commits no padrão do ADR-0008 e sem trailer de atribuição de IA
```
GREEN: `28 passed` (25 de `workflows.test.mjs` e 3 de `pr-body.test.mjs`). `corepack pnpm install && corepack pnpm verify`; `git add .github scripts/pr-body.ts scripts/check-pr-body.ts tools/config-tests/tests/workflows.test.mjs tools/config-tests/tests/pr-body.test.mjs package.json pnpm-lock.yaml`; `git commit -m "ci(ci): adiciona workflows de verificação, segurança e cobertura de patch"`.

### U1-07: Rulesets da main, das branches de arquivo e das tags
**Spec:** §8.3, ADR-0011 · **Tier:** small · **Depende de:** U1-06 (e, na fila, de U1-08, que cria o job `promises-gate`) · **Risco:** ruleset sem bypass trava o dono se o check nunca rodar; aplicar só com o PR de fase aberto · **Rollback:** `gh api -X DELETE repos/Gefferson-Souza/goiasscript/rulesets/<id>` **[dono]**
**Files:** Create `.github/rulesets/{main,archive,tags}.json`, `tools/config-tests/tests/rulesets.test.mjs`.
**Interfaces:** Consumes: jobs `verify`, `test`, `commitlint`, `patch-coverage`, `pr-body`, `promises-gate`. Produces: três rulesets versionados e `delete_branch_on_merge=true`, `allow_merge_commit=false` (squash e rebase ligados, D13).
**Aceite:** `main` exige PR, histórico linear, sem force-push nem exclusão, sem merge commit e seis checks, cada um nome de job existente; `archive/**` e as tags `legacy/*` e `v2.0-pre-archive` não podem ser apagadas nem movidas; após a aplicação `gh api` lê o esperado.

Worktree `U1-07`. Teste `tools/config-tests/tests/rulesets.test.mjs`, que lê os JSON e os jobs de todos os workflows:
```js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const REQUIRED_CHECKS = ['verify', 'test', 'commitlint', 'patch-coverage', 'pr-body', 'promises-gate'];
const readRuleset = (name) => JSON.parse(fs.readFileSync(path.join(ROOT_DIR, '.github/rulesets', `${name}.json`), 'utf8'));
const ruleTypes = (ruleset) => ruleset.rules.map((rule) => rule.type);
const ruleOf = (ruleset, type) => ruleset.rules.find((rule) => rule.type === type);

function workflowJobNames() {
  const dir = path.join(ROOT_DIR, '.github/workflows');
  return fs.readdirSync(dir).filter((file) => file.endsWith('.yml')).flatMap((file) =>
    Object.entries(parse(fs.readFileSync(path.join(dir, file), 'utf8')).jobs).map(([id, job]) => job.name ?? id));
}

describe('rulesets versionados', () => {
  it('a main exige PR, histórico linear, sem force-push nem exclusão, e só squash ou rebase', () => {
    const main = readRuleset('main');
    expect(main.target).toBe('branch');
    expect(main.conditions.ref_name.include).toEqual(['refs/heads/main']);
    expect(ruleTypes(main)).toEqual(expect.arrayContaining(['pull_request', 'required_linear_history', 'non_fast_forward', 'deletion', 'required_status_checks']));
    expect(ruleOf(main, 'pull_request').parameters.allowed_merge_methods).toEqual(['squash', 'rebase']);
    expect(main.bypass_actors).toEqual([]);
  });
  it('cada check exigido na main é nome de job existente e os seis estão presentes', () => {
    const contexts = ruleOf(readRuleset('main'), 'required_status_checks').parameters.required_status_checks.map((check) => check.context);
    expect(contexts).toEqual(expect.arrayContaining(REQUIRED_CHECKS));
    expect(workflowJobNames()).toEqual(expect.arrayContaining(contexts));
  });
  it('as branches archive/** não podem ser apagadas nem movidas', () => {
    const archive = readRuleset('archive');
    expect(archive.conditions.ref_name.include).toEqual(['refs/heads/archive/**']);
    expect(ruleTypes(archive)).toEqual(['deletion', 'non_fast_forward']);
  });
  it('as tags legacy/* e v2.0-pre-archive não podem ser apagadas, movidas nem atualizadas', () => {
    const tags = readRuleset('tags');
    expect(tags.target).toBe('tag');
    expect(tags.conditions.ref_name.include).toEqual(['refs/tags/legacy/*', 'refs/tags/v2.0-pre-archive']);
    expect(ruleTypes(tags)).toEqual(['deletion', 'non_fast_forward', 'update']);
  });
});
```
RED: `ENOENT … main.json`. Arquivos:
`main.json`:
```json
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "bypass_actors": [],
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_linear_history" },
    { "type": "pull_request", "parameters": { "required_approving_review_count": 0, "dismiss_stale_reviews_on_push": false, "require_code_owner_review": false, "require_last_push_approval": false, "required_review_thread_resolution": false, "allowed_merge_methods": ["squash", "rebase"] } },
    { "type": "required_status_checks", "parameters": { "strict_required_status_checks_policy": true, "required_status_checks": [
      { "context": "verify" }, { "context": "test" }, { "context": "commitlint" }, { "context": "patch-coverage" }, { "context": "pr-body" }, { "context": "promises-gate" } ] } }
  ]
}
```
`archive.json`:
```json
{ "name": "archive", "target": "branch", "enforcement": "active", "conditions": { "ref_name": { "include": ["refs/heads/archive/**"], "exclude": [] } }, "bypass_actors": [], "rules": [{ "type": "deletion" }, { "type": "non_fast_forward" }] }
```
`tags.json`:
```json
{ "name": "tags", "target": "tag", "enforcement": "active", "conditions": { "ref_name": { "include": ["refs/tags/legacy/*", "refs/tags/v2.0-pre-archive"], "exclude": [] } }, "bypass_actors": [], "rules": [{ "type": "deletion" }, { "type": "non_fast_forward" }, { "type": "update" }] }
```
GREEN: `4 passed`; `corepack pnpm verify`; `git add .github/rulesets tools/config-tests/tests/rulesets.test.mjs`; `git commit -m "ci(ci): versiona os rulesets da main, das branches de arquivo e das tags"`.
- [ ] **Aplicar [dono]** (PR de fase aberto e `verify` rodado uma vez nele):
```bash
gh api -X PATCH repos/Gefferson-Souza/goiasscript -F delete_branch_on_merge=true -F allow_merge_commit=false -F allow_squash_merge=true -F allow_rebase_merge=true --jq '{delete_branch_on_merge, allow_merge_commit, allow_squash_merge, allow_rebase_merge}'
for name in main archive tags; do gh api -X POST repos/Gefferson-Souza/goiasscript/rulesets --input ".github/rulesets/$name.json" --jq .name; done
gh api repos/Gefferson-Souza/goiasscript/rulesets --jq '.[].name'
```
Esperado: `{"delete_branch_on_merge":true,"allow_merge_commit":false,"allow_squash_merge":true,"allow_rebase_merge":true}`, depois `main`, `archive`, `tags` e a listagem com os três.

### U1-08: CLAUDE.md e copilot-instructions.md verdadeiros, com o gate de promessas
**Spec:** §9.4, §8.5 (item 7) · **Tier:** small · **Depende de:** U1-02 (merge na fila depois de U1-03, U1-04 e U1-09: o arquivo cita `lint`, `rules-scan` e `docs/adr/`; antes disso o `agent-docs` o despeja) · **Risco:** instrução que cita comando inexistente volta a mentir; o `verify` a confere · **Rollback:** `git revert`
**Files:** Create `scripts/{agent-docs.ts,check-agent-docs.ts}`, `.github/workflows/promises-gate.yml`, `tools/config-tests/tests/agent-docs.test.mjs`; Modify `CLAUDE.md`, `.github/copilot-instructions.md`, `.gitignore`, `package.json`.
**Interfaces:** Produces: `findAgentDocProblems(root: string, docs: readonly string[]): readonly string[]`; script `agent-docs`; job `promises-gate`; `CLAUDE.md` com menos de 200 linhas, rastreado.
**Aceite:** o checador barra script, caminho (de pasta conhecida ou arquivo solto como `legado.js`) e pacote inexistentes, arquivo ausente e `CLAUDE.md` com 200 linhas ou mais, e ignora glob e texto livre; os dois documentos passam; `git check-ignore CLAUDE.md` não imprime nada; `verify` (com `agent-docs`) dá 0.

Worktree `U1-08`. **Ciclo A.** Teste `tools/config-tests/tests/agent-docs.test.mjs`; `createRoot` monta um diretório temporário com `package.json` (`scripts: { verify, test }`), `packages/compiler/` e o `CLAUDE.md` recebido:
```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findAgentDocProblems } from '../../../scripts/agent-docs.ts';

const CLAUDE_DOC = 'CLAUDE.md';
const COPILOT_DOC = '.github/copilot-instructions.md';
const MAX_LINES = 200;
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createRoot(claude) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docs-'));
  temporary = [...temporary, root];
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ scripts: { verify: 'tsc', test: 'vitest run' } }));
  fs.mkdirSync(path.join(root, 'packages/compiler'), { recursive: true });
  if (claude !== undefined) fs.writeFileSync(path.join(root, CLAUDE_DOC), claude);
  return root;
}

const problemsFor = (claude) => findAgentDocProblems(createRoot(claude), [CLAUDE_DOC]);

describe('conferência dos documentos de agentes', () => {
  it('aceita script, caminho e pacote que existem', () => {
    expect(problemsFor('Rode `corepack pnpm verify` e `corepack pnpm exec vitest`; veja `packages/compiler` e `@goiasscript/compiler`.\n')).toEqual([]);
  });
  it('barra caminho inexistente, inclusive arquivo solto', () => {
    expect(problemsFor('Veja `package.json` e `legado.js`.\n')).toEqual(['CLAUDE.md: caminho "legado.js" não existe']);
  });
  it('barra script que não está no package.json', () => {
    expect(problemsFor('Rode `corepack pnpm bless`.\n')).toEqual(['CLAUDE.md: script "bless" não existe no package.json']);
  });
  it('barra pasta e pacote inexistentes e ignora glob', () => {
    expect(problemsFor('Leia `docs/adr/0001.md`, `packages/*/src` e `@goiasscript/cli`.\n')).toEqual([
      'CLAUDE.md: caminho "docs/adr/0001.md" não existe',
      'CLAUDE.md: pacote "@goiasscript/cli" não existe no workspace',
    ]);
  });
  it('barra documento ausente', () => {
    expect(findAgentDocProblems(createRoot('texto livre\n'), [COPILOT_DOC])).toEqual(['.github/copilot-instructions.md: arquivo não existe']);
  });
  it('exige CLAUDE.md com menos de 200 linhas', () => {
    expect(problemsFor('linha\n'.repeat(MAX_LINES))).toEqual(['CLAUDE.md: CLAUDE.md precisa ter menos de 200 linhas']);
    expect(problemsFor('linha\n'.repeat(MAX_LINES - 2))).toEqual([]);
  });
});
```
RED: `Cannot find module '../../../scripts/agent-docs.ts'`. `scripts/agent-docs.ts`:
```ts
import fs from 'node:fs';
import path from 'node:path';

const CODE_SPAN = /`([^`\n]+)`/g;
const PNPM_COMMAND = /^(?:corepack )?pnpm (?:run )?([a-z][\w:-]*)/;
const PNPM_BUILTINS = new Set(['install', 'add', 'exec', 'dlx', 'remove', 'update', 'why', 'list', 'audit', 'outdated']);
const PATH_LIKE = /^\.?[\w@-][\w.@-]*(?:\/[\w.@-]+)+\/?$/;
const FILE_LIKE = /^[\w-][\w.-]*\.(?:md|json|js|mjs|cjs|ts|mts|yml|yaml|gs)$/;
const PACKAGE_NAME = /^@goiasscript\/([\w-]+)$/;
const NOT_A_PATH = /[*<>\s]/;
const MAX_CLAUDE_LINES = 200;
const WORKSPACE_ROOTS = ['packages', 'tools'];

function rootScripts(root: string): ReadonlySet<string> {
  const manifest: unknown = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const scripts = typeof manifest === 'object' && manifest !== null && 'scripts' in manifest ? manifest.scripts : {};
  return new Set(Object.keys(typeof scripts === 'object' && scripts !== null ? scripts : {}));
}

function workspaceNames(root: string): ReadonlySet<string> {
  return new Set(WORKSPACE_ROOTS.flatMap((group) => (fs.existsSync(path.join(root, group)) ? fs.readdirSync(path.join(root, group)) : [])));
}

function problemsInSpan(span: string, root: string, scripts: ReadonlySet<string>, workspaces: ReadonlySet<string>): readonly string[] {
  const pnpm = PNPM_COMMAND.exec(span)?.[1];
  if (pnpm !== undefined) return PNPM_BUILTINS.has(pnpm) || scripts.has(pnpm) ? [] : [`script "${pnpm}" não existe no package.json`];
  const packageName = PACKAGE_NAME.exec(span)?.[1];
  if (packageName !== undefined) return workspaces.has(packageName) ? [] : [`pacote "${span}" não existe no workspace`];
  const isPath = !NOT_A_PATH.test(span) && (PATH_LIKE.test(span) || FILE_LIKE.test(span));
  return isPath && !fs.existsSync(path.join(root, span)) ? [`caminho "${span}" não existe`] : [];
}

export function findAgentDocProblems(root: string, docs: readonly string[]): readonly string[] {
  const scripts = rootScripts(root);
  const workspaces = workspaceNames(root);
  return docs.flatMap((doc) => {
    if (!fs.existsSync(path.join(root, doc))) return [`${doc}: arquivo não existe`];
    const text = fs.readFileSync(path.join(root, doc), 'utf8');
    const spans = [...text.matchAll(CODE_SPAN)].map((match) => match[1] ?? '');
    const sizeProblem = doc === 'CLAUDE.md' && text.split('\n').length >= MAX_CLAUDE_LINES ? [`CLAUDE.md precisa ter menos de ${String(MAX_CLAUDE_LINES)} linhas`] : [];
    return [...sizeProblem, ...spans.flatMap((span) => problemsInSpan(span, root, scripts, workspaces))].map((problem) => `${doc}: ${problem}`);
  });
}
```
`scripts/check-agent-docs.ts`:
```ts
import path from 'node:path';
import { findAgentDocProblems } from './agent-docs.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const problems = findAgentDocProblems(ROOT_DIR, ['CLAUDE.md', '.github/copilot-instructions.md']);
for (const problem of problems) process.stderr.write(`${problem}\n`);
process.exit(problems.length === 0 ? 0 : 1);
```
GREEN: `6 passed`. O `workflows.test.mjs` de U1-06 passa a cobrir também `promises-gate.yml` quando este arquivo existe (3 testes a mais, `31 passed` no total com `pr-body`).
**Ciclo B.** RED: `node scripts/check-agent-docs.ts; echo "exit=$?"` com os documentos do legado → `CLAUDE.md: CLAUDE.md precisa ter menos de 200 linhas`, linhas `.github/copilot-instructions.md: caminho "goiasscript.js" não existe` e `exit=1`. `CLAUDE.md` (substitui o atual):
```markdown
# CLAUDE.md

GoiásScript 3 é uma linguagem educacional em goianês que compila para JavaScript; ela não é JavaScript. O repositório está em reconstrução. O design aprovado é `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md` e o plano em execução é `docs/superpowers/plans/2026-10-14-goiasscript-3-plano-1.md`. Leia os dois antes de mexer em código novo.

## O que a v3 é e o que fica de fora

- Lexer e parser escritos à mão, análise de mundo fechado, emissão por edições que preserva as linhas do `.gs`, zero runtime para programa só com operações nativas.
- Fora da v3: módulos, sistema de tipos, balaios, debugger, LSP separado, interop com JavaScript nativo e IR própria. Item novo só entra por RFC (modelo em `docs/rfc/rfc.md`).
- As decisões de arquitetura estão nos ADRs de `docs/adr/`; consulte lá em vez de copiar o conteúdo.

## Onde está cada coisa

- Código novo: `packages/language`, `packages/compiler`, `packages/optimizer`, `tools/rules-scan`, `tools/config-tests` e `scripts/`.
- Pacotes: `@goiasscript/language`, `@goiasscript/compiler` e `@goiasscript/optimizer`, nessa ordem de camadas. `language` e `compiler` não importam `node:*`, e o compilador não tem dependência de runtime.
- Legado, fora dos gates e removível na Fase 8: `packages/core`, `apps/`, `vscode-extension/` e `lsp-server/`. A prova de conceito `spikes/poc-compiler` sai no gate da Fase 2.

## Comandos

- `corepack pnpm install` instala. Use sempre `corepack pnpm`: o `pnpm` pode não estar no PATH.
- `corepack pnpm verify` roda typecheck, lint, scanner de regras, testes com cobertura, dependency-cruiser, knip e a conferência deste arquivo. Rode antes de cada commit.
- Etapas isoladas: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm rules-scan`, `corepack pnpm test`, `corepack pnpm depcruise`, `corepack pnpm knip` e `corepack pnpm agent-docs`.

## Regras que valem aqui

- Superfície em goianês: keywords, mensagens de erro, comandos e textos que o usuário vê. Identificadores de código sempre em inglês, inclusive em testes e fixtures; comentários e documentação em português (ADR-0007).
- Comentário só diz o porquê não óbvio, com no máximo 4 linhas, acima do bloco. TODO só como `TODO(GS-<n>)`, com a issue aberta.
- Sem `any`, sem `console`, sem número ou texto mágico; imutabilidade por padrão; função com menos de 50 linhas; arquivo de até 400 linhas, com limite duro de 800; aninhamento de até 4. O ESLint e o scanner de `tools/rules-scan` barram isso.
- TDD: teste que falha primeiro, implementação mínima, depois limpeza. Cobertura de pelo menos 80% por pacote e nas linhas alteradas.
- Commits em Conventional Commits, em português e minúsculos, com escopo semântico (language, compiler, optimizer, cli, vscode, playground, engoianador, docs, ci, deps, release), sem ID Jira e sem trailer de atribuição de IA (ADR-0008). Isso vale no lugar da regra global de escopo Jira.
- Precedência: hooks, depois este arquivo, depois as regras globais do dono.
- Nunca faça `git push`, abra PR, mude configuração do GitHub nem publique sem aprovação explícita do dono naquele momento.

## Fluxo

- Uma unidade pequena por vez, em worktree próprio, com revisão independente em contexto fresco antes de entrar na branch de integração.
- `.github/copilot-instructions.md` só aponta para este arquivo. Tudo que este arquivo cita é conferido por `corepack pnpm agent-docs`.
```
`.github/copilot-instructions.md`:
```markdown
# Instruções para agentes

As instruções deste repositório estão em `CLAUDE.md`; leia esse arquivo e os ADRs de `docs/adr/` antes de contribuir.
```
`.github/workflows/promises-gate.yml`:
```yaml
name: Promessas públicas

on:
  push:
    branches: [main, 'v3/**']
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  promises-gate:
    name: promises-gate
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
        with: { node-version: 24 }
      - name: CLAUDE.md e copilot-instructions.md só citam o que existe
        run: node scripts/check-agent-docs.ts
```
Em `.gitignore` apagar a linha `CLAUDE.md`. Em `package.json`: `"agent-docs": "node scripts/check-agent-docs.ts"` e fechar o `verify` com `&& node scripts/check-agent-docs.ts`. GREEN: `exit=0` e `git check-ignore CLAUDE.md; echo $?` dá `1`. Limpeza: cada afirmação precisa ser verdadeira hoje. `corepack pnpm verify`; `git add scripts/agent-docs.ts scripts/check-agent-docs.ts .github/workflows/promises-gate.yml tools/config-tests/tests/agent-docs.test.mjs CLAUDE.md .github/copilot-instructions.md .gitignore package.json`; `git commit -m "docs(docs): reescreve claude.md e copilot-instructions com o gate de promessas"`.

### U1-09: ADRs 0002 a 0011, template de RFC e esqueleto do spec
**Spec:** §9.1–§9.3 · **Tier:** small · **Depende de:** U1-01 · **Risco:** ADR que promete check inexistente; cada "Confirmação" nomeia um check real · **Rollback:** `git revert`
**Files:** Create `docs/adr/{0002-mundo-fechado-e-reserva-de-nomes,0003-zero-runtime,0004-emissao-por-edicoes,0005-toolchain,0006-versionamento-e-compatibilidade,0007-idioma,0008-commits,0009-publicacao,0010-fora-da-v3,0011-fluxo-de-pr-e-historico}.md`, `docs/rfc/rfc.md`, `docs/spec/{migracao.md,o-que-mudou.md}`, `tools/config-tests/tests/docs.test.mjs`. ADR-0001, `docs/rfc/0001-*.md` e `docs/spec/gramatica.md` vêm da Fase 0.
**Interfaces:** Produces: formato MADR enxuto (`# ADR-NNNN: …`, `- Status: proposto|aceito …`, `## Contexto`, `## Decisão`, `## Consequências`, `## Confirmação`) conferido por teste; template de RFC com o ciclo da §9.3.
**Aceite:** um arquivo por número de 0001 a 0011, com as quatro seções preenchidas de 0002 em diante e `## Decisão` no 0001; template com `Resumo`, `Motivação`, `Delta de EBNF`, `Exemplos`, `Notas de migração`, `Casos de conformidade`, `Revisão`; ADR-0004, 0007 e 0008 ficam `proposto` até o **[dono]** aprovar as exceções do §10.3.

Worktree `U1-09`. Teste `tools/config-tests/tests/docs.test.mjs`. O ADR-0001 da Fase 0 registra a confirmação como item de lista, então só ele dispensa as quatro seções e precisa de `## Decisão`; de 0002 em diante as quatro são obrigatórias:
```js
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const ADR_DIR = path.join(ROOT_DIR, 'docs/adr');
const ADR_COUNT = 11;
const ADR_FULL_FORMAT_FROM = 2;
const ADR_SECTIONS = ['Contexto', 'Decisão', 'Consequências', 'Confirmação'];
const RFC_SECTIONS = ['Resumo', 'Motivação', 'Delta de EBNF', 'Exemplos', 'Notas de migração', 'Casos de conformidade', 'Revisão'];
const RFC_STATUSES = 'rascunho | proposto | aceito | implementado | lançado';
const STATUS_LINE = /^- (?:\*\*)?Status:(?:\*\*)? (?:proposto|aceito)/m;

const readDoc = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
const sectionBody = (text, heading) => text.split(new RegExp(`^## ${heading}\\s*$`, 'm'))[1]?.split(/^## /m)[0]?.trim() ?? '';
const adrFiles = fs.readdirSync(ADR_DIR).filter((name) => /^\d{4}-.+\.md$/.test(name)).sort();
const expectedNumbers = Array.from({ length: ADR_COUNT }, (_unused, index) => String(index + 1).padStart(4, '0'));

describe('docs/adr', () => {
  it('numera os ADRs de 0001 a 0011, um arquivo por número', () => {
    expect(adrFiles.map((name) => name.slice(0, 4))).toEqual(expectedNumbers);
  });
  describe.each(adrFiles)('%s', (file) => {
    const text = readDoc(`docs/adr/${file}`);
    const number = file.slice(0, 4);
    it('tem título com o número e uma linha de status', () => {
      expect(text.startsWith(`# ADR-${number}: `)).toBe(true);
      expect(text).toMatch(STATUS_LINE);
    });
    it('tem as seções preenchidas', () => {
      const required = Number(number) < ADR_FULL_FORMAT_FROM ? ['Decisão'] : ADR_SECTIONS;
      expect(required.filter((heading) => sectionBody(text, heading) === '')).toEqual([]);
    });
  });
});

describe('docs/rfc e docs/spec', () => {
  it('o template de RFC tem as sete seções e o ciclo de status', () => {
    const template = readDoc('docs/rfc/rfc.md');
    expect(RFC_SECTIONS.filter((heading) => sectionBody(template, heading) === '')).toEqual([]);
    expect(template).toContain(RFC_STATUSES);
  });
  it('o spec tem a página de migração e a de mudanças', () => {
    expect(readDoc('docs/spec/migracao.md').startsWith('# Migração entre versões')).toBe(true);
    expect(readDoc('docs/spec/o-que-mudou.md').startsWith('# O que mudou')).toBe(true);
  });
});
```
RED: `expected [ '0001' ] to deeply equal` a lista de `0001` a `0011`, e `ENOENT … docs/rfc/rfc.md`. Documentos (cada ADR resume a §9.2 do spec e abre com `# ADR-NNNN: título` e a linha `- Status:`):
- `0002-mundo-fechado-e-reserva-de-nomes.md` — Status: aceito em 2026-10-14. Contexto: sem tipos, o erro só é útil se o compilador conhece todo nome. Decisão: mundo fechado para nomes e membros (P1); palavra do JavaScript não serve de nome em posição nenhuma (P2); membro de instância da biblioteca reservado por forma (P3); global da biblioteca sombreável com aviso (P4). Consequências: `tamanho` e `mensagem` ficam indisponíveis para campos e métodos; descartado ajudante por apelido com despacho (exige runtime, contra o ADR-0003); reabre por RFC se o piloto (S8) mostrar fricção. Confirmação: propriedade "todo acesso `.nome` do JS emitido, fora de `helperRange`, pertence a D mais a imagem da `stdlib`" e goldens de reserva por forma (§8.2).
- `0003-zero-runtime.md` — aceito. Contexto: o runtime da 1.5 tinha 5.464 B (92,9% da saída) e alterava protótipos. Decisão: apelidos viram chamadas nativas; ajudantes só para entradas didáticas e só se usados; nenhum protótipo alterado. Consequências: entrada nova da biblioteca é nativa ou didática com ajudante declarado. Confirmação: orçamento de 0 bytes para programa só nativo no alvo `module` (§8.4).
- `0004-emissao-por-edicoes.md` — Status: proposto; a exceção depende da aprovação do dono (§10.3). Contexto: a emissão preserva linhas e o source map sai por token; lexer, parser e analisador guardam estado mutável. Decisão: lista imutável de edições, saída em módulo ES; exceção de imutabilidade só em `this.*` de `packages/compiler/src/{lexer,parser,analyzer}` (`ignoreAccessorPattern: 'this.**'`); parâmetro e AST seguem imutáveis. Consequências: fora desses diretórios `this.x = 1` é erro de lint. Confirmação: fixtures de lint que passam e que falham em `tools/config-tests` (`eslint-matrix.test.mjs`). Nos testes (`**/*.test.ts`, `**/tests/**/*.ts`) `functional/immutable-data` fica desligado: acumular em array local e montar `error.stack` são o caminho direto para o teste; a regra vale inteira no código de produção.
- `0005-toolchain.md` — aceito em 2026-10-20; Revisão: 2027-01-20. Contexto: typescript-eslint exige TypeScript < 6.1 e o TypeScript 7 não tem API JS para o ESLint. Decisão: TypeScript 6.0.3, ESLint 10.13.0, typescript-eslint 8.72.0, Vitest 5.0.5, pnpm 10.31.0 por corepack, Node ≥ 22.22.1 no desenvolvimento e ≥ 22.12 nos pacotes publicados; versões exatas (`.npmrc` com `save-exact`); cobertura de patch por `diff-cover` 10.6.0 sobre o lcov do Vitest. Consequências: atualizar é decisão explícita, em PR próprio. Confirmação: `engines`, matriz de CI (§8.3) e a data de revisão.
- `0006-versionamento-e-compatibilidade.md` — aceito. Contexto: a 1.0 e a 1.5 tinham palavras que a v3 retira ou renomeia, e reservar um nome novo quebra o programa de quem já escreveu. Decisão: SemVer único; crescer o conjunto de nomes reservados é MAJOR (P17); 3.0.0 sem alias das palavras do 1.0 e 1.5 (`retiredWords`, P13) e `npm deprecate` da 2.0.0. Consequências: a 3.x só recebe MINOR que não reserva nome; toda remoção entra em `docs/spec/migracao.md`. Confirmação: job `compat` (Fase 2).
- `0007-idioma.md` — Status: proposto; exceções dependem da aprovação do dono (§10.3). Contexto: a linguagem é para quem aprende em português, e o código do projeto precisa continuar legível para quem contribui de fora. Decisão: identificadores e nomes de arquivo internos em inglês; comentários e documentação em português; superfície, mensagens, comandos e valores de opção em goianês; discriminantes que o usuário não digita (`CompileTarget`, `receiver`, `kind`, `severity`) em inglês; `+ - * / %` e `< > <= >=` valem ao lado das palavras, `=`, `==`, `===`, `!=`, `&&`, `||` e `!` dão erro; chave de TODO `GS-<n>`. Consequências: vocabulário goiano só como valor string de dado. Confirmação: scanner R14 (`tools/rules-scan`), estendido aos segmentos de caminho, e `@typescript-eslint/naming-convention`.
- `0008-commits.md` — Status: proposto; a exceção ao ID Jira depende da aprovação do dono. Contexto: o repositório é público e o histórico alimenta o CHANGELOG; ID de ticket interno e mensagem vaga não ajudam quem lê de fora. Decisão: Conventional Commits em português, minúsculo, sem ID Jira; tipos e escopos da lista de `commitlint.config.mjs`; cabeçalho ≤ 72; assunto sem ponto final e nunca vago; sem trailer de atribuição de IA (co-autor humano permitido); merge por squash, ou rebase no PR de fase (D13). Consequências: commit fora do padrão é barrado no hook e no CI. Confirmação: job `commitlint` obrigatório e testes de `commitlint.config.mjs`.
- `0009-publicacao.md` — aceito. Contexto: PATs globais do Azure DevOps acabam em 2026-12-01; o trusted publisher do npm expira se o primeiro publish não for validado em 2 dias. Decisão: npm por OIDC com provenance, o mesmo tarball testado; trusted publisher só com o `release.yml` definitivo em `main`; Marketplace sem PAT; Open VSX com token restrito. Consequências: o alpha da Fase 3 é planejado em torno da janela de 2 dias. Confirmação: job de release com `npm stage publish` e smoke pós-publicação.
- `0010-fora-da-v3.md` — aceito. Contexto: um compilador educacional mantido por uma pessoa precisa de escopo fechado; cada recurso extra é superfície a manter e a ensinar. Decisão: ficam fora balaios, debugger, módulos, tipos, LSP separado, níveis graduais, interop com JavaScript nativo e IR própria. Consequências: cada item só entra por RFC. Confirmação: só entra por RFC (§9.3); mudança de linguagem sem RFC aceita não passa na revisão.
- `0011-fluxo-de-pr-e-historico.md` — aceito. Contexto: a reescrita do histórico (U1-00) e a revisão por agente mudam como o código entra na `main`; o fluxo precisa estar escrito e ser verificado pelo CI. Decisão: merge exige CI verde, checklist de auto-revisão e a revisão do agente colada na seção "Revisão"; histórico linear (squash, ou rebase no PR de fase, um commit por unidade), sem merge commit, `delete_branch_on_merge`; histórico público reescrito na Fase 1, tag `legacy/1.5`, `archive/v2-experimental` e `v2.0-pre-archive` protegidos. Consequências: a revisão por agente é etapa manual; um job só confere que a seção existe. Confirmação: rulesets em `.github/rulesets`, job `pr-body`, leitura por `gh api` no gate de release e `git grep -nE '/hom[e]/'` vazio.
`docs/rfc/rfc.md`:
```markdown
# RFC-NNNN: título

- Status: rascunho | proposto | aceito | implementado | lançado
- Autor:
- Data:
- Propostas do spec que decide (P#):

## Resumo
Uma frase sobre a mudança de linguagem.

## Motivação
Qual dor de aluno ou de mantenedor justifica a mudança.

## Delta de EBNF
Trecho da gramática que muda, com os ids estáveis de `docs/spec/gramatica.md`.

## Exemplos
Programas `.gs` antes e depois, e o diagnóstico que cada um gera.

## Notas de migração
O que quebra, quem é afetado e o texto que entra em `docs/spec/migracao.md`.

## Casos de conformidade
Casos em `packages/compiler/tests/conformance` com `status: expected-fail` ligado a esta RFC; o marcador sai no PR da implementação.

## Revisão
Resultado da revisão por agente em contexto fresco e a disposição de cada ponto.
```
`docs/spec/migracao.md`:
```markdown
# Migração entre versões

Toda remoção, renomeação e nome novo reservado entra aqui e no CHANGELOG, uma linha por mudança (ADR-0006).

| Versão | Mudança | Tipo | Como migrar |
|---|---|---|---|
```
`docs/spec/o-que-mudou.md`:
```markdown
# O que mudou da 1.5 para a 3.0

Esta página será gerada a partir da tabela `retiredWords` de `@goiasscript/language`, com a forma da v3 de cada palavra que a 1.0 e a 1.5 usavam.
```
GREEN: `25 passed`. **[dono]** troca `proposto` por `aceito em <data>` nos ADR-0004, 0007 e 0008 ao aprovar as exceções; sem isso o GATE 1 não fecha. `corepack pnpm verify`; `git add docs/adr docs/rfc/rfc.md docs/spec/migracao.md docs/spec/o-que-mudou.md tools/config-tests/tests/docs.test.mjs`; `git commit -m "docs(docs): adiciona adrs 0002 a 0011, template de rfc e esqueleto do spec"`.

### U1-10: Corpus de conformidade (executor, sentinela, bless) e importação dos 173 casos
**Spec:** §8.2, §4.7 · **Tier:** large · **Depende de:** U1-02 (merge na fila depois de U1-03 e U1-04) · **Risco:** a triagem por regra é heurística; os goldens importados são provisórios e a Fase 2 os reabençoa com revisão · **Rollback:** `git revert`
**Files:** Create `packages/compiler/tests/support/{conformance.types.ts,conformance.ts,execute-module.ts,deterministic-preload.mjs}`, `packages/compiler/tests/unit/{conformance,execute-module}.test.ts`, `packages/compiler/tests/conformance.test.ts`, `packages/compiler/tests/audit-moved.json` e `tests/conformance/audit-*/` (gerados), `scripts/{bless.ts,import-audit-cases.ts,audit-issues.json}`, `tools/config-tests/tests/import-audit.test.mjs`; Modify `package.json`, bloco de interfaces do plano.
**Interfaces:** Consumes: `compile(source, options?): CompileResult` da §5.9 (só existe em U2-10; até lá `pickCompile` o procura por nome e, ausente, lança, o que mantém verdes os `expected-fail`). Produces: `ConformanceCase`, `CaseConfig`, `ExpectedDiagnostic`, `CompileFunction`, `ExecuteFunction`, `loadCases`, `runCase`, `blessCase`, `pickCompile`, `executeModule` e o script `bless` (U2-10 a U2-15). Caso = `input.gs`, `diagnostics.json` (`{ code, line }`, com `column` e `severity` opcionais), `stdout.txt`, `stdin.txt`, `case.json`, `output.mjs` (ausente = ainda não abençoado).
**Aceite:** compara diagnósticos, `output.mjs` e stdout do módulo (com `Math.random` semeado e `Date` congelado), sem normalizar BOM nem CRLF; `expected-fail` roda como `test.fails` (vermelho quando passa) e exige `rfc` ou `issue`; `pnpm bless` recusa, listando, todo `expected-fail`; 173 casos triados: 168 viram pasta (91 intencionais com diagnóstico esperado e `rfc`; 40 bugs com `issue`; 37 controles — a 1.5 já acertava — com `rfc`) e 5 vão para `audit-moved.json`; `conformance.test.ts` mostra `168 expected fail`.

Worktree `U1-10`. **Ciclo 1 (executor, carregador, bless).** Teste `packages/compiler/tests/unit/conformance.test.ts`:
```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blessCase, loadCase, loadCases, runCase } from '../support/conformance.ts';
import type { ActualDiagnostic, CompileFunction, ConformanceCase, ExecuteFunction } from '../support/conformance.types.ts';

const diagnostic = (code: string, line: number, column = 1, severity: 'error' | 'warning' = 'error'): ActualDiagnostic => ({ code, severity, range: { start: { line, column } } });
const baseCase: ConformanceCase = { id: 'sample', input: 'prosa("oi")', config: {}, diagnostics: [], output: null, stdout: null, stdin: null };
const succeeds = (code: string, diagnostics: readonly ActualDiagnostic[] = []): CompileFunction => () => ({ ok: true, code, diagnostics });
const fails = (diagnostics: readonly ActualDiagnostic[]): CompileFunction => () => ({ ok: false, diagnostics });
const execute: ExecuteFunction = (code, stdin) => Promise.resolve(`${code}|${stdin ?? ''}`);

let temporary: readonly string[] = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});
function corpus(files: Readonly<Record<string, string>>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'corpus-'));
  temporary = [...temporary, root];
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return root;
}

describe('executor do corpus', () => {
  it('passa quando saída, diagnósticos e stdout conferem', async () => {
    await expect(runCase({ ...baseCase, output: 'out', stdout: 'out|entrada', stdin: 'entrada' }, succeeds('out'), execute)).resolves.toBeUndefined();
  });
  it('falha quando a saída ou o stdout diferem do golden', async () => {
    await expect(runCase({ ...baseCase, output: 'esperado' }, succeeds('obtido'), execute)).rejects.toThrow();
    await expect(runCase({ ...baseCase, stdout: 'esperado' }, succeeds('obtido'), execute)).rejects.toThrow();
  });
  it('compara código e linha, e falha com diagnóstico a mais', async () => {
    const testCase = { ...baseCase, diagnostics: [{ code: 'GS0403', line: 1 }] };
    await expect(runCase(testCase, fails([diagnostic('GS0403', 1)]), execute)).resolves.toBeUndefined();
    await expect(runCase(testCase, fails([diagnostic('GS0403', 2)]), execute)).rejects.toThrow();
    await expect(runCase(baseCase, fails([diagnostic('GS0301', 1)]), execute)).rejects.toThrow();
  });
  it('compara coluna e severidade só quando o golden traz', async () => {
    const strict = { ...baseCase, diagnostics: [{ code: 'GS0806', line: 1, column: 5, severity: 'warning' as const }] };
    await expect(runCase(strict, succeeds('x', [diagnostic('GS0806', 1, 6, 'warning')]), execute)).rejects.toThrow();
    await expect(runCase({ ...baseCase, diagnostics: [{ code: 'GS0806', line: 1 }] }, succeeds('x', [diagnostic('GS0806', 1, 9, 'warning')]), execute)).resolves.toBeUndefined();
  });
  it('programa que não compila não tem saída nem stdout esperados', async () => {
    await expect(runCase({ ...baseCase, stdout: 'x' }, fails([]), execute)).rejects.toThrow();
  });
});

describe('carregador do corpus', () => {
  it('lê o caso sem normalizar o texto e deixa os opcionais nulos', () => {
    const root = corpus({ 'a/input.gs': 'prosa("oi")\r\n', 'a/diagnostics.json': '[{"code":"GS0403","line":1,"column":2}]', 'a/stdout.txt': 'oi\n', 'b/input.gs': '', 'b/diagnostics.json': '[]' });
    expect(loadCase(root, 'a')).toEqual({ id: 'a', input: 'prosa("oi")\r\n', config: {}, diagnostics: [{ code: 'GS0403', line: 1, column: 2 }], output: null, stdout: 'oi\n', stdin: null });
    expect(loadCases(root).map((testCase) => testCase.id)).toEqual(['a', 'b']);
  });
  it('recusa caso sem diagnostics.json e expected-fail sem rfc nem issue', () => {
    expect(() => loadCase(corpus({ 'a/input.gs': '' }), 'a')).toThrow(/sem diagnostics.json/);
    const files = { 'a/input.gs': '', 'a/diagnostics.json': '[]' };
    expect(() => loadCase(corpus({ ...files, 'a/case.json': '{"status":"expected-fail"}' }), 'a')).toThrow(/exige rfc ou issue/);
    expect(loadCase(corpus({ ...files, 'a/case.json': '{"status":"expected-fail","rfc":"RFC-0001"}' }), 'a').config.rfc).toBe('RFC-0001');
  });
});

describe('bless', () => {
  const warning = diagnostic('GS0806', 1, 3, 'warning');
  it('regrava output e diagnósticos completos, e só o stdout de quem já tem stdout.txt', async () => {
    const compile = succeeds('js', [warning]);
    const files = await blessCase(baseCase, compile, () => Promise.resolve('saida\n'));
    expect([files.output, files.stdout, JSON.parse(files.diagnostics)]).toEqual(['js', null, [{ code: 'GS0806', severity: 'warning', line: 1, column: 3 }]]);
    expect((await blessCase({ ...baseCase, stdout: 'antigo' }, compile, () => Promise.resolve('saida\n'))).stdout).toBe('saida\n');
  });
  it('programa que não compila não ganha output', async () => {
    expect((await blessCase(baseCase, fails([warning]), execute)).output).toBeNull();
  });
});
```
RED: `Cannot find module '../support/conformance.ts'`. Implementar. `conformance.types.ts` (tipos exportados vivem em `*.types.ts`):
```ts
export type CaseTriage = 'bug' | 'intentional' | 'control';

export interface CaseConfig {
  readonly status?: 'expected-fail';
  readonly triage?: CaseTriage;
  readonly rfc?: string;
  readonly issue?: string;
  readonly source?: string;
  readonly differential?: boolean;
}

export interface ExpectedDiagnostic {
  readonly code: string;
  readonly line: number;
  readonly column?: number;
  readonly severity?: 'error' | 'warning';
}

export interface ConformanceCase {
  readonly id: string;
  readonly input: string;
  readonly config: CaseConfig;
  readonly diagnostics: readonly ExpectedDiagnostic[];
  readonly output: string | null;
  readonly stdout: string | null;
  readonly stdin: string | null;
}

export interface ActualDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly range: { readonly start: { readonly line: number; readonly column: number } };
}

export type CompileResultLike =
  | { readonly ok: true; readonly code: string; readonly diagnostics: readonly ActualDiagnostic[] }
  | { readonly ok: false; readonly diagnostics: readonly ActualDiagnostic[] };

export type CompileFunction = (source: string) => CompileResultLike;
export type ExecuteFunction = (code: string, stdin: string | null) => Promise<string>;

export interface BlessedFiles {
  readonly output: string | null;
  readonly diagnostics: string;
  readonly stdout: string | null;
}
```
`conformance.ts`:
```ts
import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import type { ActualDiagnostic, BlessedFiles, CaseConfig, CompileFunction, ConformanceCase, ExecuteFunction, ExpectedDiagnostic } from './conformance.types.ts';

const readOptional = (file: string): string | null => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function toDiagnostic(value: unknown): ExpectedDiagnostic {
  if (!isRecord(value) || typeof value['code'] !== 'string' || typeof value['line'] !== 'number') throw new Error(`diagnóstico inválido no golden: ${JSON.stringify(value)}`);
  const { code, line, column, severity } = value;
  return { code, line, ...(typeof column === 'number' ? { column } : {}), ...(severity === 'error' || severity === 'warning' ? { severity } : {}) };
}

function parseConfig(text: string | null): CaseConfig {
  const parsed: unknown = text === null ? {} : JSON.parse(text);
  if (!isRecord(parsed)) throw new Error('case.json precisa ser um objeto');
  if (parsed['status'] === 'expected-fail' && typeof parsed['rfc'] !== 'string' && typeof parsed['issue'] !== 'string') throw new Error('expected-fail exige rfc ou issue no case.json');
  return parsed;
}

export function loadCase(root: string, id: string): ConformanceCase {
  const dir = path.join(root, id);
  const diagnostics: unknown = JSON.parse(readOptional(path.join(dir, 'diagnostics.json')) ?? 'null');
  if (!Array.isArray(diagnostics)) throw new Error(`caso ${id} sem diagnostics.json com uma lista`);
  return {
    id,
    input: fs.readFileSync(path.join(dir, 'input.gs'), 'utf8'),
    config: parseConfig(readOptional(path.join(dir, 'case.json'))),
    diagnostics: diagnostics.map(toDiagnostic),
    output: readOptional(path.join(dir, 'output.mjs')),
    stdout: readOptional(path.join(dir, 'stdout.txt')),
    stdin: readOptional(path.join(dir, 'stdin.txt')),
  };
}

export function loadCases(root: string): readonly ConformanceCase[] {
  return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().map((id) => loadCase(root, id));
}

// Coluna e severidade só entram na comparação quando o golden as traz.
function project(actual: ActualDiagnostic, template?: ExpectedDiagnostic): ExpectedDiagnostic {
  return {
    code: actual.code,
    line: actual.range.start.line,
    ...(template?.column === undefined ? {} : { column: actual.range.start.column }),
    ...(template?.severity === undefined ? {} : { severity: actual.severity }),
  };
}

export async function runCase(testCase: ConformanceCase, compile: CompileFunction, execute: ExecuteFunction): Promise<void> {
  const result = compile(testCase.input);
  expect(result.diagnostics.map((diagnostic, index) => project(diagnostic, testCase.diagnostics[index]))).toEqual(testCase.diagnostics);
  if (!result.ok) {
    expect(testCase.output).toBeNull();
    expect(testCase.stdout).toBeNull();
    return;
  }
  if (testCase.output !== null) expect(result.code).toBe(testCase.output);
  if (testCase.stdout !== null) expect(await execute(result.code, testCase.stdin)).toBe(testCase.stdout);
}

export async function blessCase(testCase: ConformanceCase, compile: CompileFunction, execute: ExecuteFunction): Promise<BlessedFiles> {
  const result = compile(testCase.input);
  const diagnostics = result.diagnostics.map((d) => ({ code: d.code, severity: d.severity, line: d.range.start.line, column: d.range.start.column }));
  const stdout = result.ok && testCase.stdout !== null ? await execute(result.code, testCase.stdin) : testCase.stdout;
  return { output: result.ok ? result.code : null, diagnostics: `${JSON.stringify(diagnostics, null, 2)}\n`, stdout };
}

export function pickCompile(moduleExports: object): CompileFunction {
  const candidate = (moduleExports as Record<string, unknown>)['compile'];
  if (typeof candidate !== 'function') throw new Error('compile() ainda não existe em @goiasscript/compiler');
  return candidate as CompileFunction;
}
```
GREEN: `9 passed`.

**Ciclo 2 (execução determinística).** Teste `packages/compiler/tests/unit/execute-module.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { executeModule } from '../support/execute-module.ts';

describe('execução determinística', () => {
  it('semeia Math.random e congela Date', async () => {
    expect(await executeModule('console.log(Math.random() === Math.random(), Date.now(), new Date().toISOString());\n', null)).toBe('false 1768478400000 2026-01-15T12:00:00.000Z\n');
    expect(await executeModule('console.log(Math.random());\n', null)).toBe(await executeModule('console.log(Math.random());\n', null));
  });
  it('alimenta o stdin do programa', async () => {
    expect(await executeModule("process.stdin.on('data', (chunk) => process.stdout.write(`eco:${chunk}`));\n", 'oi')).toBe('eco:oi');
  });
});
```
RED: `Cannot find module '../support/execute-module.ts'`. `deterministic-preload.mjs`:
```js
const FIXED_TIME = Date.UTC(2026, 0, 15, 12, 0, 0);
const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;
const LCG_MODULUS = 4294967296;
let seed = 123456789;

Math.random = () => {
  seed = (seed * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;
  return seed / LCG_MODULUS;
};

const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) {
    super(...(args.length === 0 ? [FIXED_TIME] : args));
  }

  static now() {
    return FIXED_TIME;
  }
};
```
`execute-module.ts`:
```ts
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const EXECUTION_TIMEOUT_MS = 10_000;
const PRELOAD = pathToFileURL(path.join(import.meta.dirname, 'deterministic-preload.mjs')).href;

export function executeModule(code: string, stdin: string | null): Promise<string> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-case-'));
  const file = path.join(dir, 'program.mjs');
  fs.writeFileSync(file, code);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--import', PRELOAD, file], { timeout: EXECUTION_TIMEOUT_MS });
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.on('error', reject);
    child.on('close', () => {
      fs.rmSync(dir, { recursive: true, force: true });
      resolve(stdout);
    });
    child.stdin.end(stdin ?? '');
  });
}
```
GREEN: `2 passed`.

**Ciclo 3 (`bless`).** `scripts/bless.ts` (o comportamento de `blessCase` já tem teste) e `"bless": "node scripts/bless.ts"` em `scripts`:
```ts
import fs from 'node:fs';
import path from 'node:path';
import * as compiler from '../packages/compiler/src/index.ts';
import { executeModule } from '../packages/compiler/tests/support/execute-module.ts';
import { blessCase, loadCases, pickCompile } from '../packages/compiler/tests/support/conformance.ts';

const CONFORMANCE_ROOT = path.join(import.meta.dirname, '../packages/compiler/tests/conformance');
const write = (text: string): void => {
  process.stdout.write(`${text}\n`);
};

async function main(ids: readonly string[]): Promise<number> {
  const selected = loadCases(CONFORMANCE_ROOT).filter((testCase) => ids.length === 0 || ids.includes(testCase.id));
  const pending = selected.filter((testCase) => testCase.config.status === 'expected-fail');
  if (pending.length > 0) {
    write(`bless recusa ${String(pending.length)} caso(s) expected-fail; remova o marcador de cada um e rode de novo: ${pending.map((testCase) => testCase.id).join(' ')}`);
    return 1;
  }
  const compile = pickCompile(compiler);
  for (const testCase of selected) {
    const files = await blessCase(testCase, compile, executeModule);
    const dir = path.join(CONFORMANCE_ROOT, testCase.id);
    fs.writeFileSync(path.join(dir, 'diagnostics.json'), files.diagnostics);
    if (files.output !== null) fs.writeFileSync(path.join(dir, 'output.mjs'), files.output);
    if (files.stdout !== null) fs.writeFileSync(path.join(dir, 'stdout.txt'), files.stdout);
  }
  write(`${String(selected.length)} caso(s) abençoado(s)`);
  return 0;
}

process.exit(await main(process.argv.slice(2)));
```
**Ciclo 4 (triagem e importação, regra de pertinência §4.7).** Teste `tools/config-tests/tests/import-audit.test.mjs`:
```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blankLiterals, caseFiles, findOutsideV3, loadAuditCases, planCases, triageCase, writeCorpus } from '../../../scripts/import-audit-cases.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const AUDIT_DIR = path.join(ROOT_DIR, 'docs/auditoria/2026-10-13/probes-core');
const AUDIT_TOTAL = 173;
const WRITTEN_TOTAL = 168;
const BUG_GROUPS = ['aviso', 'comentario', 'estrutura', 'formato', 'identificador', 'operador-é', 'runtime', 'string', 'trocar', 'unicode', 'validacao'];
const ISSUES = Object.fromEntries(BUG_GROUPS.map((group, index) => [group, index + 1]));
const auditCases = loadAuditCases(AUDIT_DIR);
const auditCase = (id) => auditCases.find((candidate) => candidate.id === id);
const syntheticCase = (overrides) => ({ id: 'Z01', group: 'string', category: 'defeito', gs: 'uai a é 1; prosa(a);', expected: '1', ...overrides });

let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

describe('blankLiterals', () => {
  it('mantém o tamanho e as quebras de linha e apaga palavra dentro de texto e de comentário', () => {
    const source = 'uai a é "const x"; // trem\nprosa(a);\n';
    const blanked = blankLiterals(source);
    expect(blanked).toHaveLength(source.length);
    expect(blanked.split('\n')).toHaveLength(source.split('\n').length);
    expect(blanked).not.toContain('const');
    expect(blanked).not.toContain('trem');
  });
});

describe('findOutsideV3', () => {
  it('acusa o que a v3 não aceita, com a linha certa', () => {
    expect(findOutsideV3('uai a é 1\nconsole.log(a)')).toEqual([{ code: 'GS0403', line: 2 }]);
    expect(findOutsideV3('uai a é 1\nuai b é a.length')).toEqual([{ code: 'GS0405', line: 2 }]);
    expect(findOutsideV3('uai t é `oi`')).toEqual([{ code: 'GS0501', line: 1 }]);
    expect(findOutsideV3('presta_serviço')).toEqual([{ code: 'GS0306', line: 1 }]);
  });
  it('aceita goianês válido com texto, <= e seta', () => {
    expect(findOutsideV3('uai a é "const x"\nuai b é 2 <= 3\nuai f é (x) => x\nprosa(f(b))')).toEqual([]);
  });
});

describe('triagem dos casos da auditoria', () => {
  it('classifica em intencional, bug, controle e movido', () => {
    expect(triageCase(syntheticCase({ gs: 'uai a é 1\nconsole.log(a)' }))).toEqual({ kind: 'intentional', diagnostics: [{ code: 'GS0403', line: 2 }], stdout: null });
    expect(triageCase(syntheticCase({}))).toEqual({ kind: 'bug', diagnostics: [], stdout: '1\n' });
    expect(triageCase(syntheticCase({ category: 'controle' }))).toMatchObject({ kind: 'control', stdout: '1\n' });
    expect(triageCase(auditCase('A11'))).toEqual({ kind: 'intentional', diagnostics: [{ code: 'GS0303', line: 1 }], stdout: null });
    expect(triageCase(auditCase('K07'))).toMatchObject({ kind: 'moved' });
  });
  it('lê os 173 casos, com ids únicos, e separa 168 para o corpus e 5 movidos', () => {
    const planned = planCases(auditCases);
    const countOf = (kind) => planned.filter(({ triage }) => triage.kind === kind).length;
    expect(auditCases).toHaveLength(AUDIT_TOTAL);
    expect(new Set(planned.map(({ id }) => id)).size).toBe(AUDIT_TOTAL);
    expect([countOf('intentional'), countOf('bug'), countOf('control'), countOf('moved')]).toEqual([91, 40, 37, 5]);
  });
});

describe('arquivos do caso', () => {
  it('liga o bug à issue do grupo e o intencional à RFC-0001', () => {
    const bug = auditCase('A12');
    const intentional = auditCase('A11');
    expect(JSON.parse(caseFiles(bug, triageCase(bug), ISSUES)['case.json'])).toEqual({ status: 'expected-fail', triage: 'bug', source: 'A12', issue: String(ISSUES.identificador) });
    expect(JSON.parse(caseFiles(intentional, triageCase(intentional), ISSUES)['case.json'])).toEqual({ status: 'expected-fail', triage: 'intentional', source: 'A11', rfc: 'RFC-0001' });
  });
  it('recusa bug sem a issue do grupo', () => {
    const bug = auditCase('A12');
    expect(() => caseFiles(bug, triageCase(bug), {})).toThrow(/falta a issue do grupo "identificador"/);
  });
});

describe('writeCorpus', () => {
  it('grava 168 pastas e preserva BOM, CRLF e tab do programa original', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'import-audit-'));
    temporary = [...temporary, base];
    const root = path.join(base, 'conformance');
    fs.mkdirSync(root);
    expect(writeCorpus(root, auditCases, ISSUES)).toBe(WRITTEN_TOTAL);
    expect(fs.readdirSync(root)).toHaveLength(WRITTEN_TOTAL);
    expect(fs.readFileSync(path.join(root, 'audit-l02/input.gs'), 'utf8').startsWith('﻿')).toBe(true);
    expect(fs.readFileSync(path.join(root, 'audit-l01/input.gs'), 'utf8')).toContain('\r\n');
    expect(fs.readFileSync(path.join(root, 'audit-e09/input.gs'), 'utf8')).toContain('\t');
    expect(JSON.parse(fs.readFileSync(path.join(base, 'audit-moved.json'), 'utf8')).map((entry) => entry.id)).toEqual(['K07', 'D04', 'D05', 'D06', 'D07']);
  });
});
```
RED: `Cannot find module '../../../scripts/import-audit-cases.ts'`. `scripts/import-audit-cases.ts` (algoritmo completo; os `cases-*.js` importam um harness que exige o código 1.5, então são avaliados num contexto isolado com `require` falso; os códigos GS05xx seguem a numeração fixada pela U2-03):
```ts
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

interface AuditCase { readonly id: string; readonly group: string; readonly category: string; readonly gs: string | null; readonly expected: string | null }
interface Hit { readonly code: string; readonly line: number }
interface Override { readonly intentional: boolean; readonly diagnostics: readonly Hit[] }
type Triage =
  | { readonly kind: 'intentional'; readonly diagnostics: readonly Hit[]; readonly stdout: null }
  | { readonly kind: 'bug' | 'control'; readonly diagnostics: readonly Hit[]; readonly stdout: string | null }
  | { readonly kind: 'moved'; readonly target: string };

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const AUDIT_DIR = path.join(ROOT_DIR, 'docs/auditoria/2026-10-13/probes-core');
const CONFORMANCE_ROOT = path.join(ROOT_DIR, 'packages/compiler/tests/conformance');
const ISSUES_FILE = path.join(import.meta.dirname, 'audit-issues.json');
const RFC = 'RFC-0001';
const word = (names: string): RegExp => new RegExp(`(?<![\\w$.])(?:${names})(?![\\w$])`, 'g');
const member = (names: string): RegExp => new RegExp(`(?<=\\.\\s{0,3})(?:${names})(?![\\w$])`, 'g');

// Padrões do que a linguagem não aceita; a ordem não importa, o resultado sai ordenado por posição.
const OUTSIDE: readonly (readonly [string, RegExp])[] = [
  ['GS0401', word('const|let|var|function|return|if|else|for|while|break|continue|class|extends|super|this|new|instanceof|try|catch|finally|throw|async|await|static|in|of|true|false|null|undefined')],
  ['GS0512', word('typeof')],
  ['GS0513', word('delete')],
  ['GS0514', word('void')],
  ['GS0505', word('switch|case|default')],
  ['GS0506', word('do')],
  ['GS0511', word('yield')],
  ['GS0515', word('import|export')],
  ['GS0402', word('eval|NaN|Infinity|arguments')],
  ['GS0403', word('console|Math|JSON|Object|Array|String|Number|Boolean|Promise|Date|Error|RegExp|Map|Set|Symbol|setTimeout|setInterval|parseInt|parseFloat|isNaN|globalThis|Function|Reflect|Proxy|Intl')],
  ['GS0306', word('presta_serviço|vixe_que|sei_lá|vazio|senao|fazer|é_igual_a|mexe_assim')],
  ['GS0306', /(?<![\w$.])se(?=\s*\()/g],
  ['GS0301', word('GoianoMath')],
  ['GS0404', /===|!==|==|!=|&&|\|\||\+\+|--|[-+*/%]=|(?<![=!<>])=(?![=>])|!(?!=)/g],
  ['GS0501', /`(?:\\.|[^`\\])*`?/g],
  ['GS0523', /\*\*|\?\.|\?\?|\s\?\s/g],
  ['GS0504', /\.\.\./g],
  ['GS0518', /faz_trem\s*\(/g],
  ['GS0502', /(?<=[(,=:[!&|?{};]|^|return)\s*\/(?![/*])(?:\\.|\[[^\]\n]*\]|[^/\n\\])+\/[a-z]*/gmu],
  ['GS0516', /\b(?:uai|trem)\s+[\p{L}\w]+\s*:|faz_trem\s+\w+\s*\([^)]*:/gu],
  ['GS0405', member('map|filter|reduce|forEach|push|pop|shift|unshift|length|toUpperCase|toLowerCase|includes|indexOf|split|join|trim|slice|replace|replaceAll|startsWith|endsWith|find|sort|reverse|concat|then|catch|message|keys|values|entries')],
  ['GS0406', member('some|every|flat|at|padStart|toString|valueOf|hasOwnProperty|call|apply|bind|charAt|substring|toFixed|splice|constructor|prototype')],
  ['GS0305', member('reduzir|empurrar|pra_maiusculo|pegar_ano|absoluto|achar|emendar')],
];
const GLOBAL_MEMBER = /\b(?:console|Math|JSON|Object|Array|String|Number|Date|Promise)\s*\.\s*(\w+)/g;

// Revisões feitas à mão onde a heurística não alcança: diagnóstico esperado e se o caso é mudança intencional.
const OVERRIDES: Readonly<Record<string, Override>> = {
  A11: { intentional: true, diagnostics: [{ code: 'GS0303', line: 1 }] },
  A15: { intentional: true, diagnostics: [{ code: 'GS0104', line: 1 }] },
  A16: { intentional: true, diagnostics: [{ code: 'GS0520', line: 1 }] },
  S10: { intentional: true, diagnostics: [{ code: 'GS0103', line: 1 }] },
  O07: { intentional: true, diagnostics: [{ code: 'GS0806', line: 1 }] },
  S13: { intentional: false, diagnostics: [{ code: 'GS0103', line: 2 }] },
  V04: { intentional: false, diagnostics: [{ code: 'GS0202', line: 1 }] },
  V08: { intentional: false, diagnostics: [{ code: 'GS0307', line: 1 }] },
};
const STDOUTS: Readonly<Record<string, string>> = { S12: 'use .replace( pra trocar\n', C01: 'ok\n', E04b: '5\n', L05: '1 2\n', W01: 'oi\n', X03: '', D01: '', D02: '', D03: '' };
const MOVED: Readonly<Record<string, string>> = { K07: 'teste do REPL por PTY (Fase 3)', D04: 'API pública de compile() (U2-10)', D05: 'API pública de compile() (U2-10)', D06: 'API pública de compile() (U2-10)', D07: 'diagnóstico de sintaxe do parser (U2-05)' };

const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);

function toAuditCase(value: unknown): AuditCase {
  const record = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  const id = text(record['id']);
  const group = text(record['grupo']);
  const category = text(record['classe']);
  if (id === null || group === null || category === null) throw new Error(`caso da auditoria inválido: ${JSON.stringify(value)}`);
  return { id, group, category, gs: text(record['gs']), expected: text(record['esperado']) };
}

export function loadAuditCases(auditDir: string): readonly AuditCase[] {
  return fs.readdirSync(auditDir).filter((name) => /^cases-.*\.js$/.test(name)).sort().flatMap((name) => {
    const sandbox: { exports: unknown } = { exports: [] };
    new vm.Script(fs.readFileSync(path.join(auditDir, name), 'utf8')).runInNewContext({ module: sandbox, require: () => ({}) });
    if (!Array.isArray(sandbox.exports)) throw new Error(`${name} não exporta uma lista`);
    return sandbox.exports.map(toAuditCase);
  });
}

// Mantém o tamanho e as quebras de linha, para o índice valer na linha original.
export function blankLiterals(source: string): string {
  const blank = (value: string): string => value.replace(/[^\n]/g, ' ');
  return source
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, blank)
    .replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (quoted) => `"${blank(quoted.slice(1, -1))}"`)
    .replace(/`(?:\\.|[^`\\])*`/g, (template) => `\`${blank(template.slice(1, -1))}\``);
}

export function findOutsideV3(gs: string): readonly Hit[] {
  const clean = blankLiterals(gs);
  const skipped = new Set([...clean.matchAll(GLOBAL_MEMBER)].map((match) => match.index + match[0].length - (match[1]?.length ?? 0)));
  return OUTSIDE.flatMap(([code, pattern]) =>
    [...clean.matchAll(pattern)].filter((match) => !(code.startsWith('GS040') && skipped.has(match.index))).map((match) => ({ code, index: match.index })),
  )
    .toSorted((left, right) => left.index - right.index)
    .map(({ code, index }) => ({ code, line: clean.slice(0, index).split('\n').length }));
}

export function triageCase(source: AuditCase): Triage {
  const target = MOVED[source.id];
  if (target !== undefined || source.gs === null) return { kind: 'moved', target: target ?? 'caso sem programa .gs' };
  const override = OVERRIDES[source.id];
  const diagnostics = override?.diagnostics ?? findOutsideV3(source.gs);
  if (override?.intentional ?? (override === undefined && diagnostics.length > 0)) return { kind: 'intentional', diagnostics, stdout: null };
  const stdout = STDOUTS[source.id] ?? (source.expected === null || source.expected === '' ? source.expected : `${source.expected}\n`);
  return { kind: source.category === 'controle' ? 'control' : 'bug', diagnostics, stdout };
}

export function planCases(cases: readonly AuditCase[]): readonly { readonly id: string; readonly source: AuditCase; readonly triage: Triage }[] {
  return cases.map((source) => ({ id: `audit-${source.id.toLowerCase()}`, source, triage: triageCase(source) }));
}

export function caseFiles(source: AuditCase, triage: Triage, issues: Readonly<Record<string, number>>): Readonly<Record<string, string>> {
  if (triage.kind === 'moved' || source.gs === null) return {};
  const issue = issues[source.group];
  if (triage.kind === 'bug' && issue === undefined) throw new Error(`falta a issue do grupo "${source.group}" em audit-issues.json`);
  const link = triage.kind === 'bug' ? { issue: String(issue) } : { rfc: RFC };
  const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
  return {
    'input.gs': source.gs,
    'diagnostics.json': json(triage.diagnostics),
    'case.json': json({ status: 'expected-fail', triage: triage.kind, source: source.id, ...link }),
    ...(triage.stdout === null ? {} : { 'stdout.txt': triage.stdout }),
  };
}

export function writeCorpus(root: string, cases: readonly AuditCase[], issues: Readonly<Record<string, number>>): number {
  const planned = planCases(cases);
  let written = 0;
  for (const { id, source, triage } of planned) {
    const files = caseFiles(source, triage, issues);
    if (Object.keys(files).length === 0) continue;
    fs.mkdirSync(path.join(root, id), { recursive: true });
    for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(root, id, name), content);
    written += 1;
  }
  const moved = planned.flatMap(({ source, triage }) => (triage.kind === 'moved' ? [{ id: source.id, target: triage.target }] : []));
  fs.writeFileSync(path.join(root, '../audit-moved.json'), `${JSON.stringify(moved, null, 2)}\n`);
  return written;
}

function main(command: string | undefined): void {
  const write = (line: string): void => void process.stdout.write(`${line}\n`);
  const planned = planCases(loadAuditCases(AUDIT_DIR));
  if (command === 'plan') {
    for (const kind of new Set(planned.map(({ triage }) => triage.kind))) write(`${kind}: ${String(planned.filter(({ triage }) => triage.kind === kind).length)}`);
    const groups = [...new Set(planned.filter(({ triage }) => triage.kind === 'bug').map(({ source }) => source.group))].sort();
    for (const group of groups) {
      const ids = planned.filter(({ source, triage }) => triage.kind === 'bug' && source.group === group).map(({ source }) => source.id);
      write(`gh issue create --title "Corpus: casos da auditoria do grupo ${group} falham na v3" --body "Casos: ${ids.join(', ')}. Cada case.json liga o expected-fail a esta issue."`);
    }
  } else if (command === 'import') {
    const issues = JSON.parse(fs.readFileSync(ISSUES_FILE, 'utf8')) as Record<string, number>;
    write(`${String(writeCorpus(CONFORMANCE_ROOT, loadAuditCases(AUDIT_DIR), issues))} casos escritos em ${CONFORMANCE_ROOT}`);
  } else {
    write('uso: node scripts/import-audit-cases.ts plan|import');
    process.exit(2);
  }
}

if (process.argv[1] === import.meta.filename) main(process.argv[2]);
```
GREEN: `8 passed`.

**Ciclo 5 (o corpus no Vitest e a sentinela).** Teste `packages/compiler/tests/conformance.test.ts`:
```ts
import path from 'node:path';
import { describe, test } from 'vitest';
import * as compiler from '../src/index.ts';
import { loadCases, pickCompile, runCase } from './support/conformance.ts';
import { executeModule } from './support/execute-module.ts';

const CONFORMANCE_ROOT = path.join(import.meta.dirname, 'conformance');

describe('corpus de conformidade', () => {
  for (const testCase of loadCases(CONFORMANCE_ROOT)) {
    const register = testCase.config.status === 'expected-fail' ? test.fails : test;
    register(testCase.id, () => runCase(testCase, pickCompile(compiler), executeModule));
  }
});
```
RED: `mkdir -p packages/compiler/tests/conformance && corepack pnpm exec vitest run packages/compiler/tests/conformance.test.ts` → `Error: No test found in suite corpus de conformidade`. Importar: `node scripts/import-audit-cases.ts plan` mostra `control: 37`, `bug: 40`, `intentional: 91`, `moved: 5` e onze `gh issue create` (um por grupo de bug: aviso, comentario, estrutura, formato, identificador, operador-é, runtime, string, trocar, unicode, validacao). **[dono]** os executa e grava os números em `scripts/audit-issues.json` (`{ "aviso": <n>, "comentario": <n>, … }` com os onze grupos); sem a issue do grupo a importação recusa o caso. Depois `node scripts/import-audit-cases.ts import` → `168 casos escritos em …`. GREEN: o comando do RED → `Tests  168 expected fail (168)`.
Prova da sentinela e do `bless`:
```bash
printf 'export function compile(): { ok: true; code: string; diagnostics: [] } {\n  return { ok: true, code: "", diagnostics: [] };\n}\n' > packages/compiler/src/index.ts
corepack pnpm exec vitest run packages/compiler/tests/conformance.test.ts
git checkout packages/compiler/src/index.ts
corepack pnpm bless; echo "exit=$?"
```
Esperado: `4 failed | 164 expected fail (168)` com `Error: Expect test to fail` em `audit-d01`, `audit-d02`, `audit-d03` e `audit-x03`; depois `bless recusa 168 caso(s) expected-fail; …` e `exit=1`.
- [ ] **Interfaces.** No bloco de interfaces do plano, antes de "Os nomes acima são o contrato", acrescentar `CaseConfig`, `ExpectedDiagnostic`, `CompileFunction = (source: string) => CompileResultLike` (subconjunto de `CompileResult`, §5.9) e `ExecuteFunction = (code: string, stdin: string | null) => Promise<string>`, de `packages/compiler/tests/support/conformance.types.ts`.
- [ ] **Limpeza e commit.** Sem teste de tipo, sem comentário que narra, sem identificador em português. `corepack pnpm verify`; `git add packages/compiler/tests scripts tools/config-tests/tests/import-audit.test.mjs package.json docs/superpowers/plans/2026-10-14-goiasscript-3-plano-1.md`; `git commit -m "test(compiler): adiciona o corpus de conformidade e importa os 173 casos"`.

### GATE 1

**GATE 1 (dono).** Lê o relatório da Fase 1 (unidades, `verify`, riscos), aprova as exceções dos ADR-0004, 0007 e 0008
e autoriza o push de `v3/integracao` e o PR de fase para a `main` por rebase (D13).

## Fase 2

### U2-01: Tabelas da linguagem (`@goiasscript/language`)
**Spec:** §5.2, §4.2–§4.4, §4.9, §8.2 (integridade) · **Tier:** large · **Depende de:** GATE 1 · **Risco:** nome, aridade ou forma errados na tabela viram diagnóstico errado em todo o compilador; `jsMembers` gerado do motor (e não do `.d.ts`) quebraria o determinismo · **Rollback:** reverter o commit (só dados e lookups; nenhuma unidade consome ainda)
**Files:**
- Create: `packages/language/src/keywords/{keywords.types.ts,keywords.data.ts}`, `src/js/{js-reserved.types.ts,js-reserved.data.ts,js-members.generated.ts}`, `src/retired/{retired-words.types.ts,retired-words.data.ts}`, `src/stdlib/{stdlib.types.ts,stdlib-builders.ts,text.data.ts,list.data.ts,object.data.ts,math.data.ts,number.data.ts,time.data.ts,promise.data.ts,error.data.ts,date.data.ts,io.data.ts,index.ts}`, `src/limits.constants.ts`, `src/lookup.ts`, `generators/{run.ts,js-members.ts,generators.types.ts,lib-root.d.ts}`
- Modify: `packages/language/src/index.ts`, `packages/language/package.json` (devDependency `typescript` 6.0.3 exato; scripts `generate` e `generate:check`)
- Test: `packages/language/tests/integrity.test.ts`, `packages/language/tests/lookup.test.ts`

**Interfaces:** Consumes: nada. Produces: tipos do bloco do esqueleto (keywords, js-reserved, retired, stdlib, `LIMITS`) e `lookupKeyword`, `lookupJsReserved`, `lookupJsMember`, `lookupStdlibMember`, `lookupStdlibGlobal`, `lookupStdlibStatic`, `lookupRetiredWord` (`lookupDiagnostic` entra em U2-03); constantes `KEYWORDS`, `JS_RESERVED`, `RETIRED_WORDS`, `STDLIB`, `JS_MEMBER_NAMES`.
**Aceite:** 47 keywords e 10 variantes sem acento; toda grafia única entre as três tabelas; `jsMembers` sem `try`/`escape` (ES2025) e com `toSorted`; `corepack pnpm verify` verde.

- [ ] **0. Convenção de import.** Os geradores rodam por type stripping do Node, então imports relativos levam extensão `.ts`. O `tsconfig.base.json` da U1-02 já traz `allowImportingTsExtensions` com `noEmit` (nada é emitido por `tsc` no plano 1); nenhuma alteração aqui.

**Ciclo 1 — keywords**
- [ ] **1.1 Teste (RED).** Criar `packages/language/tests/integrity.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { KEYWORDS } from '../src/keywords/keywords.data.ts';

const EXPECTED_KEYWORD_COUNT = 47;
const EXPECTED_ASCII_VARIANTS = ['oce', 'se_oce_quiser', 'se_nao', 'no_maximo', 'continua_ai', 'tenta_ai', 'e_igualim', 'e_tipo_de', 'ou_entao', 'num_e'];

describe('keywords', () => {
  it('traz as 47 entradas da §4.2 com grafia em NFC', () => {
    expect(KEYWORDS).toHaveLength(EXPECTED_KEYWORD_COUNT);
    expect(KEYWORDS.every((entry) => entry.spelling === entry.spelling.normalize('NFC'))).toBe(true);
  });
  it('registra exatamente as dez variantes sem acento da §4.3', () => {
    const variants = KEYWORDS.flatMap((entry) => (entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling]));
    expect([...variants].sort()).toEqual([...EXPECTED_ASCII_VARIANTS].sort());
  });
  it('toda keyword acentuada, exceto "é", tem variante', () => {
    const withoutVariant = KEYWORDS.filter((entry) => /[^\p{ASCII}]/u.test(entry.spelling) && entry.asciiSpelling === undefined);
    expect(withoutVariant.map((entry) => entry.spelling)).toEqual(['é']);
  });
  it('só "de" e "em" são contextuais', () => {
    const contextual = KEYWORDS.filter((entry) => entry.keywordClass === 'contextual').map((entry) => entry.spelling);
    expect([...contextual].sort()).toEqual(['de', 'em']);
  });
  it('mapeia o token JS emitido', () => {
    const jsOf = (spelling: string) => KEYWORDS.find((entry) => entry.spelling === spelling)?.js;
    expect([jsOf('se_num_for'), jsOf('vai_na_frente_faz_trem'), jsOf('sobrou'), jsOf('trem')]).toEqual(['else if', 'async function', '%', 'let']);
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/language exec vitest run tests/integrity.test.ts` — esperado: falha `Failed to resolve import "../src/keywords/keywords.data.ts"`.
- [ ] **1.3 Implementar.** `keywords.types.ts` = bloco do esqueleto (`KeywordClass`, `KeywordCategory`, `KeywordEntry`). `keywords.data.ts`:
```ts
import type { KeywordCategory, KeywordClass, KeywordEntry } from './keywords.types.ts';

const LANGUAGE_SINCE = '3.0.0';

function keyword(spelling: string, js: string, category: KeywordCategory, asciiSpelling?: string, keywordClass: KeywordClass = 'reserved'): KeywordEntry {
  return { spelling, js, category, keywordClass, since: LANGUAGE_SINCE, ...(asciiSpelling === undefined ? {} : { asciiSpelling }) };
}

export const KEYWORDS: readonly KeywordEntry[] = [
  keyword('uai', 'const', 'declaration'), keyword('trem', 'let', 'declaration'), keyword('é', '=', 'assignment'),
  keyword('faz_trem', 'function', 'function'), keyword('faz_favor', 'return', 'function'),
  keyword('vai_na_frente', 'async', 'function'), keyword('vai_na_frente_faz_trem', 'async function', 'function'),
  keyword('espera_um_cadim', 'await', 'function'),
  keyword('se_ocê_quiser', 'if', 'control', 'se_oce_quiser'), keyword('se_num_for', 'else if', 'control'),
  keyword('se_não', 'else', 'control', 'se_nao'), keyword('vai_indo', 'for', 'control'),
  keyword('enquanto_tiver', 'while', 'control'), keyword('para_com_isso', 'break', 'control'),
  keyword('continua_aí', 'continue', 'control', 'continua_ai'),
  keyword('de', 'of', 'control', undefined, 'contextual'), keyword('em', 'in', 'control', undefined, 'contextual'),
  keyword('arruma_trem', 'class', 'class'), keyword('inherda_de', 'extends', 'class'),
  keyword('aprepara_trem', 'constructor', 'class'), keyword('num_muda', 'static', 'class'),
  keyword('a_raiz', 'super', 'class'), keyword('ocê', 'this', 'class', 'oce'), keyword('faz_um', 'new', 'class'),
  keyword('é_tipo_de', 'instanceof', 'class', 'e_tipo_de'),
  keyword('tenta_aí', 'try', 'error', 'tenta_ai'), keyword('se_der_ruim', 'catch', 'error'),
  keyword('por_fim', 'finally', 'error'), keyword('vixe', 'throw', 'error'),
  keyword('certeza', 'true', 'literal'), keyword('de_jeito_nenhum', 'false', 'literal'),
  keyword('nada', 'null', 'literal'), keyword('indefinido', 'undefined', 'literal'),
  keyword('é_igualim', '===', 'operator', 'e_igualim'), keyword('diferente', '!==', 'operator'),
  keyword('maior_que', '>', 'operator'), keyword('menor_que', '<', 'operator'),
  keyword('pelo_menos', '>=', 'operator'), keyword('no_máximo', '<=', 'operator', 'no_maximo'),
  keyword('e_mais', '&&', 'operator'), keyword('ou_então', '||', 'operator', 'ou_entao'),
  keyword('num_é', '!', 'operator', 'num_e'), keyword('mais', '+', 'operator'), keyword('menos', '-', 'operator'),
  keyword('vezes', '*', 'operator'), keyword('dividido', '/', 'operator'), keyword('sobrou', '%', 'operator'),
];
```
- [ ] **1.4 Rodar:** mesmo comando — esperado: 5 testes passam.

**Ciclo 2 — reservadas do JS e palavras aposentadas**
- [ ] **2.1 Teste (RED).** Acrescentar ao `integrity.test.ts` (imports novos no topo):
```ts
import { JS_RESERVED } from '../src/js/js-reserved.data.ts';
import { RETIRED_WORDS } from '../src/retired/retired-words.data.ts';

const MUST_BE_RESERVED = ['var', 'let', 'const', 'function', 'return', 'switch', 'typeof', 'yield', 'await', 'enum', 'public', 'package', 'static', 'constructor', 'console', 'Math', 'JSON', 'setTimeout', 'parseInt', 'Intl', 'arguments', 'eval', 'NaN', 'Infinity'];

describe('jsReserved', () => {
  const find = (name: string) => JS_RESERVED.find((entry) => entry.name === name);
  it('cobre as palavras e globais da §4.4', () => {
    expect(MUST_BE_RESERVED.filter((name) => find(name) === undefined)).toEqual([]);
  });
  it('classifica por categoria e equivalente', () => {
    expect(find('const')).toMatchObject({ kind: 'keyword', hasEquivalent: true, suggestion: 'uai' });
    expect(find('public')).toMatchObject({ kind: 'strict-reserved', hasEquivalent: false, suggestion: 'publico' });
    expect(find('console')).toMatchObject({ kind: 'global', hasEquivalent: true, suggestion: 'prosa' });
    expect(['arguments', 'eval', 'NaN', 'Infinity'].map((name) => find(name)?.kind)).toEqual(Array(4).fill('non-bindable'));
  });
});

describe('retiredWords', () => {
  it('traz as 14 palavras aposentadas da §4.2 com destino quando há', () => {
    expect(RETIRED_WORDS).toHaveLength(14);
    const replacementOf = (word: string) => RETIRED_WORDS.find((entry) => entry.word === word)?.replacement;
    expect([replacementOf('presta_serviço'), replacementOf('vixe_que'), replacementOf('um_tanto_de')]).toEqual(['faz_trem', 'vixe', undefined]);
  });
});
```
- [ ] **2.2 Rodar:** mesmo comando — esperado: falha por import inexistente de `js-reserved.data.ts`.
- [ ] **2.3 Implementar.** `js-reserved.types.ts` e `retired-words.types.ts` = blocos do esqueleto. `js-reserved.data.ts`:
```ts
import type { JsReservedEntry, JsReservedKind } from './js-reserved.types.ts';

const STRICT_RESERVED: ReadonlySet<string> = new Set(['implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield']);

const KEYWORDS_WITH_EQUIVALENT = {
  var: 'trem', let: 'trem', const: 'uai', function: 'faz_trem', return: 'faz_favor', if: 'se_ocê_quiser', else: 'se_não',
  for: 'vai_indo', while: 'enquanto_tiver', break: 'para_com_isso', continue: 'continua_aí', class: 'arruma_trem',
  extends: 'inherda_de', constructor: 'aprepara_trem', static: 'num_muda', super: 'a_raiz', this: 'ocê', new: 'faz_um',
  instanceof: 'é_tipo_de', try: 'tenta_aí', catch: 'se_der_ruim', finally: 'por_fim', throw: 'vixe',
  async: 'vai_na_frente', await: 'espera_um_cadim', true: 'certeza', false: 'de_jeito_nenhum', null: 'nada',
  undefined: 'indefinido', in: 'em', of: 'de',
} as const;
const KEYWORDS_WITHOUT_EQUIVALENT = {
  switch: 'opcao', case: 'caso', default: 'padrao', do: 'repeticao', typeof: 'tipo', delete: 'apagar', void: 'vago',
  yield: 'cede', import: 'importar', export: 'exportar', debugger: 'depurar', with: 'com', enum: 'enumeracao',
  implements: 'implementacao', interface: 'contrato', package: 'pacote', private: 'privado', protected: 'protegido', public: 'publico',
} as const;
const GLOBALS_WITH_EQUIVALENT = {
  console: 'prosa', Math: 'Conta', Object: 'Coisa', String: 'vira_texto', Number: 'vira_número', Promise: 'promessa',
  Date: 'Data', Error: 'Erro', setTimeout: 'daqui_a_pouco', setInterval: 'toda_hora', clearTimeout: 'deixa_pra_lá',
  clearInterval: 'deixa_pra_lá', parseInt: 'vira_número', parseFloat: 'vira_número', isNaN: 'é_número',
} as const;
const GLOBALS_WITHOUT_EQUIVALENT = {
  JSON: 'dados', Array: 'lista', Boolean: 'valor_logico', RegExp: 'padrao', Map: 'mapa', Set: 'conjunto', Symbol: 'simbolo',
  isFinite: 'e_finito', globalThis: 'global', window: 'janela', document: 'documento', fetch: 'busca', require: 'requisito',
  module: 'modulo', process: 'processo', Function: 'funcao', Reflect: 'reflexo', Proxy: 'intermediario', Intl: 'internacional',
} as const;
const NON_BINDABLE = { arguments: 'argumentos', eval: 'avaliar', NaN: 'nao_numero', Infinity: 'infinito' } as const;

function entries(source: Readonly<Record<string, string>>, kind: JsReservedKind, hasEquivalent: boolean): readonly JsReservedEntry[] {
  return Object.entries(source).map(([name, suggestion]) => ({
    name, suggestion, hasEquivalent, kind: kind === 'keyword' && STRICT_RESERVED.has(name) ? 'strict-reserved' : kind,
  }));
}

export const JS_RESERVED: readonly JsReservedEntry[] = [
  ...entries(KEYWORDS_WITH_EQUIVALENT, 'keyword', true), ...entries(KEYWORDS_WITHOUT_EQUIVALENT, 'keyword', false),
  ...entries(GLOBALS_WITH_EQUIVALENT, 'global', true), ...entries(GLOBALS_WITHOUT_EQUIVALENT, 'global', false),
  ...entries(NON_BINDABLE, 'non-bindable', false),
];

export const JS_MEMBER_EXTRA_EQUIVALENTS: Readonly<Record<string, string>> = { sort: 'ordenar', reverse: 'de_trás_pra_frente', replace: 'trocar' };
```
`retired-words.data.ts`:
```ts
import type { RetiredWord } from './retired-words.types.ts';

const GONE = 'saiu da linguagem, sem substituto na v3';

export const RETIRED_WORDS: readonly RetiredWord[] = [
  { word: 'presta_serviço', replacement: 'faz_trem', note: 'função se declara com faz_trem' },
  { word: 'vai_na_frente_presta_serviço', replacement: 'vai_na_frente_faz_trem', note: 'função assíncrona se declara com vai_na_frente_faz_trem' },
  { word: 'mexe_assim', note: 'método de classe não leva palavra; o construtor é aprepara_trem' },
  { word: 'vixe_que', replacement: 'vixe', note: 'vixe recebe a mensagem direto' },
  { word: 'vazio', replacement: 'nada', note: 'valor ausente é nada' },
  { word: 'sei_lá', replacement: 'indefinido', note: 'valor não definido é indefinido' },
  { word: 'se', replacement: 'se_ocê_quiser', note: 'condicional é se_ocê_quiser' },
  { word: 'senao', replacement: 'se_não', note: 'senão é se_não' },
  { word: 'fazer', replacement: 'faz_trem', note: 'função é faz_trem' },
  { word: 'é_igual_a', replacement: 'é_igualim', note: 'igualdade é é_igualim' },
  { word: 'um_tanto_de', note: GONE },
  { word: 'ninguem_fuça', note: GONE },
  { word: 'só_da_famia', note: GONE },
  { word: 'todo_mundo_vê', note: GONE },
];
```
(14 entradas: 10 com destino e 4 sem equivalente; `presta_serviço` e `vai_na_frente_presta_serviço` são entradas distintas.)
- [ ] **2.4 Rodar:** mesmo comando do passo 2.2 — esperado: passa.

**Ciclo 3 — biblioteca padrão**
- [ ] **3.1 Teste (RED).** Acrescentar (import `STDLIB` de `../src/stdlib/index.ts`):
```ts
import { STDLIB } from '../src/stdlib/index.ts';

const OWNER_NAMES = ['prosa', 'gritando', 'cochichando', 'tem_no_meio', 'trocar', 'dividir', 'bota_no_final', 'arranca_o_rabo', 'mapear', 'filtrar', 'Conta.sorteia_um', 'Conta.arredondar', 'Conta.maior'];
const DIDACTIC_NAMES = ['pergunta', 'ordenar', 'Conta.sorteia_um', 'vira_número', 'é_número', 'cochila', 'mensagem', 'mês'];

describe('stdlib', () => {
  const names = (predicate: (entry: (typeof STDLIB)[number]) => boolean) => STDLIB.filter(predicate).map((entry) => entry.name).sort();
  it('marca como "owner" exatamente os nomes ✅ da §4.9', () => {
    expect(names((entry) => entry.origin === 'owner')).toEqual([...OWNER_NAMES].sort());
  });
  it('marca como didática exatamente as entradas da §4.9', () => {
    expect(names((entry) => entry.semantics === 'didactic')).toEqual([...DIDACTIC_NAMES].sort());
  });
  it('só entrada didática é ajudante, com helperName ASCII e único', () => {
    const helpers = STDLIB.filter((entry) => entry.kind === 'helper');
    expect(helpers.every((entry) => entry.semantics === 'didactic' && /^[a-z_]+$/u.test(entry.helperName ?? ''))).toBe(true);
    expect(new Set(helpers.map((entry) => entry.helperName)).size).toBe(helpers.length);
  });
  it('exige form fora dos globais e aridade coerente', () => {
    expect(STDLIB.filter((entry) => entry.receiver !== 'global' && entry.form === undefined)).toEqual([]);
    expect(STDLIB.filter((entry) => entry.arity.max !== undefined && entry.arity.max < entry.arity.min)).toEqual([]);
  });
  it('propriedades de instância trazem alternativas para o GS0601', () => {
    const properties = STDLIB.filter((entry) => entry.form === 'property' && entry.receiver !== 'namespace');
    expect(properties.map((entry) => entry.name).sort()).toEqual(['mensagem', 'tamanho']);
    expect(properties.every((entry) => (entry.alternatives?.length ?? 0) > 0)).toBe(true);
  });
  it('registra variante sem acento explícita em todo nome acentuado', () => {
    const accented = STDLIB.filter((entry) => /[^\p{ASCII}]/u.test(entry.name));
    expect(accented.every((entry) => entry.asciiName !== undefined && /^\p{ASCII}+$/u.test(entry.asciiName))).toBe(true);
    expect(STDLIB.find((entry) => entry.name === 'pedaço')?.asciiName).toBe('pedaco');
  });
});
```
- [ ] **3.2 Rodar:** esperado: falha por `../src/stdlib/index.ts` inexistente.
- [ ] **3.3 Implementar.** `stdlib.types.ts` = bloco do esqueleto, mais:
```ts
export type StdlibEntrySpec = Omit<StdlibEntry, 'asciiName' | 'semantics' | 'since'> & { readonly semantics?: StdlibSemantics; readonly since?: string };
```
`stdlib-builders.ts`:
```ts
import type { Arity, StdlibEntry, StdlibEntrySpec, StdlibForm, StdlibOrigin, StdlibReceiver } from './stdlib.types.ts';

const LANGUAGE_SINCE = '3.0.0';

export const ARITY = {
  none: { min: 0, max: 0 }, optional: { min: 0, max: 1 }, one: { min: 1, max: 1 }, two: { min: 2, max: 2 },
  oneOrTwo: { min: 1, max: 2 }, atLeastOne: { min: 1 }, any: { min: 0 },
} as const satisfies Readonly<Record<string, Arity>>;

export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '');
}

export function defineEntry(spec: StdlibEntrySpec): StdlibEntry {
  const asciiName = stripDiacritics(spec.name);
  return { semantics: 'native', since: LANGUAGE_SINCE, ...spec, ...(asciiName === spec.name ? {} : { asciiName }) };
}

export function instanceMethod(name: string, receiver: StdlibReceiver, js: string, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver, kind: 'rename', js, form: 'method', arity, origin, ...extra });
}
export function instanceProperty(name: string, receiver: StdlibReceiver, js: string, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver, kind: 'property', js, form: 'property', arity: ARITY.none, origin, ...extra });
}
export function staticMember(namespace: string, member: string, js: string, form: StdlibForm, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name: `${namespace}.${member}`, receiver: 'namespace', kind: 'static', js, form, arity, origin, ...extra });
}
export function globalEntry(name: string, js: string, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver: 'global', kind: 'global', js, arity, origin, ...extra });
}
```
Arquivos de dados (todos `export const X: readonly StdlibEntry[] = [...]`, importando os construtores):
`text.data.ts` (`TEXT_ENTRIES`):
```ts
instanceMethod('gritando', 'text', 'toUpperCase', ARITY.none, 'owner'),
instanceMethod('cochichando', 'text', 'toLowerCase', ARITY.none, 'owner'),
instanceMethod('tem_no_meio', 'textOrList', 'includes', ARITY.one, 'owner'),
instanceMethod('trocar', 'text', 'replaceAll', ARITY.two, 'owner'),
instanceMethod('dividir', 'text', 'split', ARITY.one, 'owner'),
instanceMethod('tira_os_espaço', 'text', 'trim', ARITY.none, 'proposal'),
instanceMethod('começa_com', 'text', 'startsWith', ARITY.one, 'proposal'),
instanceMethod('termina_com', 'text', 'endsWith', ARITY.one, 'proposal'),
instanceMethod('pedaço', 'textOrList', 'slice', ARITY.oneOrTwo, 'proposal'),
instanceMethod('onde_tá', 'textOrList', 'indexOf', ARITY.one, 'proposal'),
instanceProperty('tamanho', 'textOrList', 'length', 'proposal', { alternatives: ['quantidade', 'total'] }),
instanceMethod('repete', 'text', 'repeat', ARITY.one, 'proposal', { alternatives: ['repeticoes'] }),
globalEntry('vira_texto', 'String', ARITY.one, 'proposal'),
```
`list.data.ts` (`LIST_ENTRIES`, receiver `'list'`):
```ts
instanceMethod('bota_no_final', 'list', 'push', ARITY.atLeastOne, 'owner'),
instanceMethod('arranca_o_rabo', 'list', 'pop', ARITY.none, 'owner'),
instanceMethod('bota_no_começo', 'list', 'unshift', ARITY.atLeastOne, 'proposal'),
instanceMethod('arranca_a_cabeça', 'list', 'shift', ARITY.none, 'proposal'),
instanceMethod('mapear', 'list', 'map', ARITY.one, 'owner'),
instanceMethod('filtrar', 'list', 'filter', ARITY.one, 'owner'),
instanceMethod('amontoar', 'list', 'reduce', ARITY.two, 'proposal'),
instanceMethod('pra_cada', 'list', 'forEach', ARITY.one, 'proposal'),
instanceMethod('caça', 'list', 'find', ARITY.one, 'proposal', { alternatives: ['procura'] }),
instanceMethod('juntar', 'list', 'join', ARITY.one, 'proposal', { alternatives: ['unir'] }),
instanceMethod('emenda', 'list', 'concat', ARITY.one, 'proposal'),
instanceMethod('de_trás_pra_frente', 'list', 'toReversed', ARITY.none, 'proposal'),
instanceMethod('ordenar', 'list', 'toSorted', ARITY.none, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'ordem' }),
```
`object.data.ts` (`OBJECT_ENTRIES`):
```ts
globalEntry('Coisa', 'Object', ARITY.any, 'proposal'),
staticMember('Coisa', 'chaves', 'Object.keys', 'method', ARITY.one, 'proposal'),
staticMember('Coisa', 'valores', 'Object.values', 'method', ARITY.one, 'proposal'),
staticMember('Coisa', 'entradas', 'Object.entries', 'method', ARITY.one, 'proposal'),
staticMember('Coisa', 'tem', 'Object.hasOwn', 'method', ARITY.two, 'proposal'),
staticMember('Coisa', 'mistura', 'Object.assign', 'method', ARITY.two, 'proposal', { kind: 'macro' }),
```
`math.data.ts` (`MATH_ENTRIES`):
```ts
globalEntry('Conta', 'Math', ARITY.any, 'proposal'),
staticMember('Conta', 'sorteia_um', '$gs_sorteia_um', 'method', ARITY.two, 'owner', { kind: 'helper', semantics: 'didactic', helperName: 'sorteia_um' }),
staticMember('Conta', 'arredondar', 'Math.round', 'method', ARITY.one, 'owner'),
staticMember('Conta', 'arredondar_pra_baixo', 'Math.floor', 'method', ARITY.one, 'proposal'),
staticMember('Conta', 'arredondar_pra_cima', 'Math.ceil', 'method', ARITY.one, 'proposal'),
staticMember('Conta', 'maior', 'Math.max', 'method', ARITY.atLeastOne, 'owner'),
staticMember('Conta', 'menor', 'Math.min', 'method', ARITY.atLeastOne, 'proposal'),
staticMember('Conta', 'sem_sinal', 'Math.abs', 'method', ARITY.one, 'proposal'),
staticMember('Conta', 'raiz_quadrada', 'Math.sqrt', 'method', ARITY.one, 'proposal'),
staticMember('Conta', 'elevado', 'Math.pow', 'method', ARITY.two, 'proposal'),
staticMember('Conta', 'PI', 'Math.PI', 'property', ARITY.none, 'proposal'),
staticMember('Conta', 'E', 'Math.E', 'property', ARITY.none, 'proposal'),
```
`number.data.ts` (`NUMBER_ENTRIES`):
```ts
globalEntry('vira_número', '$gs_vira_numero', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'vira_numero' }),
globalEntry('é_número', '$gs_e_numero', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'e_numero' }),
instanceMethod('com_casas', 'number', 'toFixed', ARITY.one, 'proposal'),
```
`time.data.ts` (`TIME_ENTRIES`):
```ts
globalEntry('daqui_a_pouco', 'setTimeout', ARITY.two, 'proposal'),
globalEntry('toda_hora', 'setInterval', ARITY.two, 'proposal'),
globalEntry('deixa_pra_lá', 'clearTimeout', ARITY.one, 'proposal'),
globalEntry('cochila', '$gs_cochila', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'cochila' }),
```
`promise.data.ts` (`PROMISE_ENTRIES`):
```ts
globalEntry('promessa', 'Promise', ARITY.one, '1.5'),
instanceMethod('quando_resolver', 'promise', 'then', ARITY.one, '1.5'),
instanceMethod('se_der_pobrema', 'promise', 'catch', ARITY.one, '1.5'),
```
`error.data.ts` (`ERROR_ENTRIES`):
```ts
globalEntry('Erro', 'Error', ARITY.optional, 'proposal'),
instanceProperty('mensagem', 'error', 'message', 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'mensagem', alternatives: ['texto', 'aviso'] }),
```
`date.data.ts` (`DATE_ENTRIES`):
```ts
globalEntry('Data', 'Date', ARITY.any, 'proposal'),
instanceMethod('ano', 'date', 'getFullYear', ARITY.none, 'proposal', { alternatives: ['ano_do_evento'] }),
instanceMethod('dia', 'date', 'getDate', ARITY.none, 'proposal', { alternatives: ['dia_do_evento'] }),
instanceMethod('hora', 'date', 'getHours', ARITY.none, 'proposal', { alternatives: ['horario'] }),
instanceMethod('minuto', 'date', 'getMinutes', ARITY.none, 'proposal', { alternatives: ['minutos'] }),
instanceMethod('segundo', 'date', 'getSeconds', ARITY.none, 'proposal', { alternatives: ['segundos'] }),
instanceMethod('mês', 'date', 'getMonth', ARITY.none, 'proposal', { kind: 'macro', semantics: 'didactic', alternatives: ['mes_do_evento'] }),
```
`io.data.ts` (`IO_ENTRIES`):
```ts
globalEntry('prosa', 'console.log', ARITY.any, 'owner'),
globalEntry('reclama', 'console.error', ARITY.any, '1.5'),
globalEntry('avisa', 'console.warn', ARITY.any, 'proposal'),
globalEntry('pergunta', '$gs_pergunta', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'pergunta' }),
```
`index.ts` do stdlib: `export const STDLIB: readonly StdlibEntry[] = [...TEXT_ENTRIES, ...LIST_ENTRIES, ...OBJECT_ENTRIES, ...MATH_ENTRIES, ...NUMBER_ENTRIES, ...TIME_ENTRIES, ...PROMISE_ENTRIES, ...ERROR_ENTRIES, ...DATE_ENTRIES, ...IO_ENTRIES];`
- [ ] **3.4 Rodar:** mesmo comando — esperado: todos passam.

**Ciclo 4 — `jsMembers` gerado do `.d.ts`**
- [ ] **4.1 Teste (RED).** Acrescentar ao `integrity.test.ts`:
```ts
import { JS_MEMBER_NAMES } from '../src/js/js-members.generated.ts';

describe('jsMembers', () => {
  const has = (name: string) => (JS_MEMBER_NAMES as readonly string[]).includes(name);
  it('inclui membros nativos até o ES2023', () => {
    expect(['map', 'some', 'toSorted', 'toString', 'constructor', 'prototype', 'hasOwnProperty', 'at', 'flat', 'padStart', '__proto__'].filter((name) => !has(name))).toEqual([]);
  });
  it('não inclui o que é de ES posterior nem vem do motor (Promise.try, RegExp.escape)', () => {
    expect(['try', 'escape'].filter(has)).toEqual([]);
  });
  it('está ordenado e sem duplicatas', () => {
    expect([...new Set(JS_MEMBER_NAMES)].sort()).toEqual([...JS_MEMBER_NAMES]);
  });
});
```
- [ ] **4.2 Rodar:** esperado: falha por `js-members.generated.ts` inexistente.
- [ ] **4.3 Implementar.** `generators/lib-root.d.ts`: `export {};`. `generators/generators.types.ts`: `export interface GeneratedFile { readonly path: string; readonly content: string }` (caminho relativo à raiz do repositório). `generators/js-members.ts`:
```ts
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { GeneratedFile } from './generators.types.ts';

const BUILTIN_INTERFACES: ReadonlySet<string> = new Set([
  'Object', 'ObjectConstructor', 'Function', 'FunctionConstructor', 'Array', 'ArrayConstructor', 'ReadonlyArray', 'String',
  'StringConstructor', 'Number', 'NumberConstructor', 'Boolean', 'Math', 'JSON', 'Date', 'DateConstructor', 'RegExp', 'Error',
  'ErrorConstructor', 'Promise', 'PromiseConstructor', 'Map', 'Set', 'Symbol',
]);
const ALWAYS_NATIVE = ['__proto__'] as const;
export const JS_MEMBERS_PATH = 'packages/language/src/js/js-members.generated.ts';

function memberName(member: ts.TypeElement): string | undefined {
  const name = member.name;
  return name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined;
}

export function collectJsMemberNames(): readonly string[] {
  const rootFile = fileURLToPath(new URL('./lib-root.d.ts', import.meta.url));
  const program = ts.createProgram({ rootNames: [rootFile], options: { lib: ['lib.es2023.d.ts'], target: ts.ScriptTarget.ESNext, types: [] } });
  const names = program.getSourceFiles().filter((file) => program.isSourceFileDefaultLibrary(file)).flatMap((file) =>
    file.statements.filter(ts.isInterfaceDeclaration).filter((declaration) => BUILTIN_INTERFACES.has(declaration.name.text))
      .flatMap((declaration) => declaration.members.map(memberName)));
  const defined = names.filter((name): name is string => name !== undefined);
  return [...new Set([...defined, ...ALWAYS_NATIVE])].toSorted();
}

export function renderJsMembers(names: readonly string[]): string {
  const body = names.map((name) => `  '${name}',`).join('\n');
  return `// Gerado por generators/js-members.ts a partir de lib.es2023.*.d.ts; não editar.\nexport const JS_MEMBER_NAMES = [\n${body}\n] as const;\n`;
}

export function renderJsMembersFiles(): readonly GeneratedFile[] {
  return [{ path: JS_MEMBERS_PATH, content: renderJsMembers(collectJsMemberNames()) }];
}
```
`generators/run.ts`:
```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GeneratedFile } from './generators.types.ts';
import { renderJsMembersFiles } from './js-members.ts';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../..');
export const GENERATORS: readonly (() => readonly GeneratedFile[])[] = [renderJsMembersFiles];

export function renderAll(): readonly GeneratedFile[] {
  return GENERATORS.flatMap((generate) => generate());
}

async function main(mode: string | undefined): Promise<number> {
  const stale = await Promise.all(renderAll().map(async (file) => {
    const target = resolve(REPOSITORY_ROOT, file.path);
    if (mode === '--check') {
      const current = await readFile(target, 'utf8').catch(() => null);
      return current === file.content ? null : file.path;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content);
    return null;
  }));
  const outdated = stale.filter((path): path is string => path !== null);
  if (outdated.length === 0) return 0;
  process.stderr.write(`Arquivos gerados desatualizados:\n${outdated.join('\n')}\nRode: corepack pnpm --filter @goiasscript/language generate\n`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv[2]));
}
```
Em `package.json`: `"generate": "node generators/run.ts"`, `"generate:check": "node generators/run.ts --check"`, e `"typescript": "6.0.3"` em `devDependencies`; rodar `corepack pnpm install`.
- [ ] **4.4 Gerar:** `corepack pnpm --filter @goiasscript/language generate` e `corepack pnpm --filter @goiasscript/language generate:check` (esperado: exit 0). Rodar o teste — esperado: passa (a lista tem cerca de 250 nomes).

**Ciclo 5 — integridade entre tabelas e lookups**
- [ ] **5.1 Teste (RED).** Acrescentar ao `integrity.test.ts`:
```ts
import { LIMITS } from '../src/limits.constants.ts';

describe('integridade entre tabelas (§8.2)', () => {
  const spellings = [
    ...KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling]),
    ...JS_RESERVED.map((entry) => entry.name),
    ...STDLIB.flatMap((entry) => [entry.name, entry.asciiName]),
  ].filter((spelling): spelling is string => spelling !== undefined);
  it('nenhuma grafia aparece em mais de uma entrada', () => {
    const duplicated = spellings.filter((spelling, index) => spellings.indexOf(spelling) !== index);
    expect(duplicated).toEqual([]);
  });
  it('palavra aposentada nunca é reservada nem da biblioteca', () => {
    const reserved = new Set(spellings);
    expect(RETIRED_WORDS.filter((entry) => reserved.has(entry.word)).map((entry) => entry.word)).toEqual([]);
  });
  it('fixa o limite de aninhamento em 200', () => {
    expect(LIMITS.maxNestingDepth).toBe(200);
  });
});
```
Criar `tests/lookup.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { lookupJsMember, lookupJsReserved, lookupKeyword, lookupRetiredWord, lookupStdlibGlobal, lookupStdlibMember, lookupStdlibStatic } from '../src/lookup.ts';

describe('lookup', () => {
  it('acha keyword pela grafia oficial e pela variante sem acento', () => {
    expect(lookupKeyword('se_ocê_quiser')).toBe(lookupKeyword('se_oce_quiser'));
    expect(lookupKeyword('se_ocê_quiser')?.js).toBe('if');
    expect(lookupKeyword('lista')).toBeUndefined();
  });
  it('acha reservada do JS, palavra aposentada e membros da biblioteca', () => {
    expect(lookupJsReserved('const')?.suggestion).toBe('uai');
    expect(lookupRetiredWord('vazio')?.replacement).toBe('nada');
    expect(lookupStdlibMember('tamanho').map((entry) => entry.js)).toEqual(['length']);
    expect(lookupStdlibMember('comeca_com')).toHaveLength(1);
    expect(lookupStdlibMember('prosa')).toEqual([]);
    expect(lookupStdlibGlobal('prosa')?.js).toBe('console.log');
    expect(lookupStdlibGlobal('Conta')?.js).toBe('Math');
    expect(lookupStdlibStatic('Conta', 'maior')?.js).toBe('Math.max');
    expect(lookupStdlibStatic('Conta', 'nada')).toBeUndefined();
  });
  it('liga membro nativo do JS ao equivalente goiano', () => {
    expect(['map', 'length', 'sort', 'keys', 'catch', 'message'].map((name) => lookupJsMember(name)?.equivalent)).toEqual(['mapear', 'tamanho', 'ordenar', 'Coisa.chaves', 'se_der_pobrema', 'mensagem']);
    expect(lookupJsMember('some')).toEqual({ name: 'some' });
    expect(lookupJsMember('gato')).toBeUndefined();
  });
});
```
- [ ] **5.2 Rodar:** `corepack pnpm --filter @goiasscript/language exec vitest run` — esperado: falha por `limits.constants.ts` e `lookup.ts` inexistentes.
- [ ] **5.3 Implementar.** `limits.constants.ts`: `export const LIMITS = { maxNestingDepth: 200 } as const;`. `lookup.ts`:
```ts
import { JS_MEMBER_EXTRA_EQUIVALENTS, JS_RESERVED } from './js/js-reserved.data.ts';
import { JS_MEMBER_NAMES } from './js/js-members.generated.ts';
import type { JsMemberEntry, JsReservedEntry } from './js/js-reserved.types.ts';
import { KEYWORDS } from './keywords/keywords.data.ts';
import type { KeywordEntry } from './keywords/keywords.types.ts';
import { RETIRED_WORDS } from './retired/retired-words.data.ts';
import type { RetiredWord } from './retired/retired-words.types.ts';
import { STDLIB } from './stdlib/index.ts';
import type { StdlibEntry } from './stdlib/stdlib.types.ts';

const isDefined = (value: string | undefined): value is string => value !== undefined;
const KEYWORDS_BY_SPELLING: ReadonlyMap<string, KeywordEntry> = new Map(
  KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling].filter(isDefined).map((name) => [name, entry] as const)),
);
const RESERVED_BY_NAME: ReadonlyMap<string, JsReservedEntry> = new Map(JS_RESERVED.map((entry) => [entry.name, entry]));
const RETIRED_BY_WORD: ReadonlyMap<string, RetiredWord> = new Map(RETIRED_WORDS.map((entry) => [entry.word, entry]));
const JS_MEMBER_SET: ReadonlySet<string> = new Set(JS_MEMBER_NAMES);
const INSTANCE_ENTRIES = STDLIB.filter((entry) => entry.receiver !== 'global' && entry.receiver !== 'namespace');
const jsMemberName = (js: string): string => js.slice(js.lastIndexOf('.') + 1);
const EQUIVALENT_BY_JS_NAME: ReadonlyMap<string, string> = new Map([
  ...Object.entries(JS_MEMBER_EXTRA_EQUIVALENTS),
  ...STDLIB.filter((entry) => entry.receiver !== 'global' && !entry.js.startsWith('$gs_')).map((entry) => [jsMemberName(entry.js), entry.name] as const),
]);
const matchesName = (entry: StdlibEntry, name: string): boolean => entry.name === name || entry.asciiName === name;

export const lookupKeyword = (nfcSpelling: string): KeywordEntry | undefined => KEYWORDS_BY_SPELLING.get(nfcSpelling);
export const lookupJsReserved = (name: string): JsReservedEntry | undefined => RESERVED_BY_NAME.get(name);
export const lookupRetiredWord = (word: string): RetiredWord | undefined => RETIRED_BY_WORD.get(word);
export const lookupStdlibMember = (name: string): readonly StdlibEntry[] => INSTANCE_ENTRIES.filter((entry) => matchesName(entry, name));
export const lookupStdlibGlobal = (name: string): StdlibEntry | undefined => STDLIB.find((entry) => entry.receiver === 'global' && matchesName(entry, name));
export const lookupStdlibStatic = (namespace: string, member: string): StdlibEntry | undefined =>
  STDLIB.find((entry) => entry.receiver === 'namespace' && matchesName(entry, `${namespace}.${member}`));

export function lookupJsMember(name: string): JsMemberEntry | undefined {
  if (!JS_MEMBER_SET.has(name)) return undefined;
  const equivalent = EQUIVALENT_BY_JS_NAME.get(name);
  return equivalent === undefined ? { name } : { name, equivalent };
}
```
Atenção: `Object.keys → Coisa.chaves` e `Array.keys` colidem no nome `keys`; o último do mapa vence, e só `Coisa.chaves` tem `keys`, então vale. `lookupJsReserved` de `mensagem`: o `js` de `.mensagem` é `message` (não começa com `$gs_`), por isso entra no mapa.
`index.ts` do pacote: reexporta (`export type { … }` e `export { … }`) todos os tipos, `KEYWORDS`, `JS_RESERVED`, `RETIRED_WORDS`, `STDLIB`, `JS_MEMBER_NAMES`, `LIMITS` e os lookups acima.
- [ ] **5.4 Rodar:** `corepack pnpm --filter @goiasscript/language exec vitest run` — esperado: todos passam.
- [ ] **6. Limpeza (de-sloppify)** (sem comentário que narra, sem `any`, arquivos < 400 linhas) e `corepack pnpm verify` verde.
- [ ] **7. Commit:** `git add packages/language tsconfig.base.json pnpm-lock.yaml && git commit -m "feat(language): adiciona tabelas da linguagem e testes de integridade"`

---

### U2-02: Fonte, posições e alfabeto de nomes
**Spec:** §5.3 (posições, alfabeto), §4.3, Review Focus 1 e 3 · **Tier:** medium · **Depende de:** GATE 1 · **Risco:** coluna ou linha deslocada em arquivo do Windows (BOM, `\r`) ou NFD · **Rollback:** reverter o commit (módulos novos e isolados)
**Files:**
- Create: `packages/compiler/src/api.types.ts` (só `SourcePosition`, `SourceRange`, `LineRange`, `Tone`, `Severity`, `CompileTarget`, `BindingKind`, `SessionBinding`, `ReplSession` da §5.9; U2-10 completa), `src/source/{source.types.ts,source-text.ts,line-table.ts,position-convert.ts,identifier-alphabet.ts}`
- Test: `packages/compiler/tests/unit/source/{positions.test.ts,alphabet.test.ts}`
**Interfaces:** Consumes: nada. Produces: `SourceText`, `createSourceText`, `positionAt`, `rangeOf`, `toLspPosition`, `toMappingPosition`, `isIdentifierStart`, `isIdentifierPart`, `isCombiningMark` (esqueleto) e, adicionados, `offsetAt(source, line, column): number`, `canonicalName(text): string`, `isValidName(nfcName): boolean`.
**Aceite:** `\r\n` conta uma quebra; `\r` isolado quebra; U+2028/U+2029 não quebram; BOM não ocupa coluna; coluna em UTF-16; ida e volta posição↔offset; `café` NFD vira NFC.

**Ciclo 1 — posições**
- [ ] **1.1 Teste (RED).** `packages/compiler/tests/unit/source/positions.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createSourceText, offsetAt, positionAt, rangeOf } from '../../../src/source/source-text.ts';
import { toLspPosition, toMappingPosition } from '../../../src/source/position-convert.ts';

const BOM = '\uFEFF';

describe('posições', () => {
  it('conta \\r\\n como uma quebra e \\r isolado como quebra', () => {
    const source = createSourceText('a\r\nb\rc\nd', 't.gs');
    expect(source.lineStarts).toEqual([0, 3, 5, 7]);
    expect([3, 5, 7].map((offset) => positionAt(source, offset).line)).toEqual([2, 3, 4]);
  });
  it('arquivo do Windows com BOM e \\r\\n tem as mesmas linhas e colunas do editor', () => {
    const windows = createSourceText(`${BOM}uai x\r\nprosa(x)`, 't.gs');
    const unix = createSourceText('uai x\nprosa(x)', 't.gs');
    expect(positionAt(windows, 5)).toEqual({ offset: 5, line: 1, column: 5 });
    expect(positionAt(windows, 8)).toMatchObject({ line: 2, column: 1 });
    expect(positionAt(windows, 0)).toMatchObject({ line: 1, column: 1 });
    expect(positionAt(unix, 4)).toMatchObject({ line: 1, column: 5 });
  });
  it('não trata U+2028 como quebra e conta coluna em unidades UTF-16', () => {
    expect(positionAt(createSourceText('a\u2028b', 't.gs'), 2)).toMatchObject({ line: 1, column: 3 });
    expect(positionAt(createSourceText('😀x', 't.gs'), 2)).toMatchObject({ line: 1, column: 3 });
  });
  it('trata fim de arquivo, última linha sem \\n e offset fora do texto', () => {
    const source = createSourceText('a\n', 't.gs');
    expect(positionAt(source, 2)).toMatchObject({ line: 2, column: 1 });
    expect(positionAt(source, 999).offset).toBe(2);
    expect(createSourceText('', 't.gs').lineStarts).toEqual([0]);
  });
  it('faz ida e volta offset → posição → LSP → offset', () => {
    const source = createSourceText('uai a\r\nb\rç😀\n', 't.gs');
    const offsets = Array.from({ length: source.text.length + 1 }, (_, index) => index);
    const roundTrip = offsets.map((offset) => {
      const lsp = toLspPosition(positionAt(source, offset));
      return offsetAt(source, lsp.line + 1, lsp.character + 1);
    });
    expect(roundTrip).toEqual(offsets);
  });
  it('converte bases: LSP e mappings são base 0', () => {
    const position = positionAt(createSourceText('a\nbc', 't.gs'), 3);
    expect(toLspPosition(position)).toEqual({ line: 1, character: 1 });
    expect(toMappingPosition(position)).toEqual({ line: 1, column: 1 });
    expect(rangeOf(createSourceText('ab', 't.gs'), 0, 2).end.column).toBe(3);
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/source/positions.test.ts` — esperado: falha `Failed to resolve import "../../../src/source/source-text.ts"`.
- [ ] **1.3 Implementar.** `source.types.ts`: `export interface SourceText { readonly text: string; readonly fileName: string; readonly lineStarts: readonly number[] }`. `api.types.ts` com os tipos da §5.9 listados acima, copiados literalmente. `line-table.ts`:
```ts
const BYTE_ORDER_MARK = 0xfeff;
const LINE_BREAK = /\r\n|\r|\n/gu;

// O BOM não conta como coluna: o editor não o mostra.
export function computeLineStarts(text: string): readonly number[] {
  const firstLineStart = text.codePointAt(0) === BYTE_ORDER_MARK ? 1 : 0;
  return [firstLineStart, ...[...text.matchAll(LINE_BREAK)].map((match) => match.index + match[0].length)];
}

export function lineIndexOf(lineStarts: readonly number[], offset: number): number {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if ((lineStarts[middle] ?? 0) <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}
```
`source-text.ts`:
```ts
import type { SourcePosition, SourceRange } from '../api.types.ts';
import { computeLineStarts, lineIndexOf } from './line-table.ts';
import type { SourceText } from './source.types.ts';

export function createSourceText(text: string, fileName: string): SourceText {
  return { text, fileName, lineStarts: computeLineStarts(text) };
}

export function positionAt(source: SourceText, offset: number): SourcePosition {
  const clamped = Math.min(Math.max(offset, 0), source.text.length);
  const index = lineIndexOf(source.lineStarts, clamped);
  const lineStart = source.lineStarts[index] ?? 0;
  return { offset: clamped, line: index + 1, column: Math.max(clamped - lineStart, 0) + 1 };
}

export function rangeOf(source: SourceText, start: number, end: number): SourceRange {
  return { start: positionAt(source, start), end: positionAt(source, end) };
}

export function offsetAt(source: SourceText, line: number, column: number): number {
  const lineStart = source.lineStarts[line - 1] ?? source.text.length;
  return Math.min(lineStart + column - 1, source.text.length);
}
```
`position-convert.ts`: `toLspPosition = (p) => ({ line: p.line - 1, character: p.column - 1 })` e `toMappingPosition = (p) => ({ line: p.line - 1, column: p.column - 1 })`.
- [ ] **1.4 Rodar:** mesmo comando — esperado: 6 testes passam.

**Ciclo 2 — alfabeto (P5) e NFC**
- [ ] **2.1 Teste (RED).** `tests/unit/source/alphabet.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { canonicalName, isCombiningMark, isIdentifierPart, isIdentifierStart, isValidName } from '../../../src/source/identifier-alphabet.ts';

describe('alfabeto de nomes (P5)', () => {
  it.each([
    ['caf\u00e9', true], ['A\u00e7\u00e3o', true], ['_x1', true], ['\u00e7a', true],
    ['1x', false], ['\u03b1\u03b2', false], ['a$b', false], ['\u{1F600}', false], ['x\u0301', false],
  ])('valida %j como %s', (name, expected) => {
    expect(isValidName(name)).toBe(expected);
  });
  it('trata café em NFD e NFC como o mesmo nome canônico (NFC)', () => {
    expect(canonicalName('cafe\u0301')).toBe('caf\u00e9');
    expect(isValidName(canonicalName('cafe\u0301'))).toBe(true);
    expect(canonicalName('abc')).toBe('abc');
  });
  it('separa início, continuação e marca combinante', () => {
    expect([isIdentifierStart(0x31), isIdentifierPart(0x31), isIdentifierStart(0x5f)]).toEqual([false, true, true]);
    expect([isCombiningMark(0x300), isCombiningMark(0x36f), isCombiningMark(0x2ff), isCombiningMark(0x370)]).toEqual([true, true, false, false]);
  });
});
```
- [ ] **2.2 Rodar:** `... exec vitest run tests/unit/source/alphabet.test.ts` — esperado: falha por import inexistente.
- [ ] **2.3 Implementar** `identifier-alphabet.ts`:
```ts
const CODE = { upperA: 0x41, upperZ: 0x5a, lowerA: 0x61, lowerZ: 0x7a, zero: 0x30, nine: 0x39, underscore: 0x5f, combiningStart: 0x300, combiningEnd: 0x36f } as const;
const ACCENTED_LETTERS = 'áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ';
const ACCENTED_CODE_POINTS: ReadonlySet<number> = new Set(Array.from(ACCENTED_LETTERS, (letter) => letter.codePointAt(0) ?? 0));

const inRange = (codePoint: number, low: number, high: number): boolean => codePoint >= low && codePoint <= high;

export function isIdentifierStart(codePoint: number): boolean {
  return inRange(codePoint, CODE.upperA, CODE.upperZ) || inRange(codePoint, CODE.lowerA, CODE.lowerZ)
    || codePoint === CODE.underscore || ACCENTED_CODE_POINTS.has(codePoint);
}
export function isIdentifierPart(codePoint: number): boolean {
  return isIdentifierStart(codePoint) || inRange(codePoint, CODE.zero, CODE.nine);
}
export function isCombiningMark(codePoint: number): boolean {
  return inRange(codePoint, CODE.combiningStart, CODE.combiningEnd);
}
export function canonicalName(text: string): string {
  return /^\p{ASCII}*$/u.test(text) ? text : text.normalize('NFC');
}
export function isValidName(nfcName: string): boolean {
  const [first, ...rest] = Array.from(nfcName, (character) => character.codePointAt(0) ?? 0);
  return first !== undefined && isIdentifierStart(first) && rest.every(isIdentifierPart);
}
```
- [ ] **2.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/source` — esperado: todos passam.
- [ ] **3. Limpeza** e `corepack pnpm verify` verde.
- [ ] **4. Commit:** `git add packages/compiler && git commit -m "feat(compiler): adiciona fonte, tabela de linhas e alfabeto de nomes"`

---

### U2-03: Catálogo de diagnósticos e `explainDiagnostic`
**Spec:** §4.11, §5.2, §5.9 · **Tier:** medium · **Depende de:** U2-01 · **Risco:** código renumerado ou frase sem concordância; marcador esquecido na mensagem · **Rollback:** reverter o commit
**Files:**
- Create: `packages/language/src/diagnostics/{diagnostics.types.ts,define-diagnostic.ts,lexical.data.ts,syntax.data.ts,names.data.ts,javascript.data.ts,subset.data.ts,library.data.ts,runtime.data.ts,hints.data.ts,tools.data.ts,index.ts}`; `packages/compiler/src/explain.ts`, `src/diagnostics/format-message.ts`
- Modify: `packages/language/src/lookup.ts` (acrescenta `lookupDiagnostic`), `packages/language/src/index.ts`, `packages/compiler/src/api.types.ts` (acrescenta `DiagnosticExplanation`), `packages/compiler/src/index.ts`
- Test: `packages/language/tests/integrity.test.ts` (acrescentar), `packages/compiler/tests/unit/explain.test.ts`
**Interfaces:** Consumes: tipos de U2-01. Produces: `DiagnosticDefinition` e companhia (esqueleto), `DIAGNOSTICS`, `lookupDiagnostic(code)`, `formatMessage(template, args)`, `explainDiagnostic(code, tone?)`. Convenção de mensagem: marcador `{nome}`; trecho opcional `[[ … ]]` some se algum marcador dentro dele não vier em `args`; marcador sem valor vira `«nome»`.
**Numeração fixada para GS0501+** (RFC-0001 não renumera): 0501 template · 0502 regex · 0503 desestruturação · 0504 spread/rest · 0505 `switch` · 0506 `do…while` · 0507 rótulo · 0508 getter/setter · 0509 campo de classe · 0510 campo privado `#` · 0511 generator · 0512 `typeof` · 0513 `delete` · 0514 `void` · 0515 módulos · 0516 anotação de tipo · 0517 número com `_`, hex, octal ou BigInt · 0518 função anônima como valor (P6) · 0519 `{ x }` abreviado · 0520 método abreviado em coisa · 0521 chave computada · 0522 aninhamento acima do limite · 0523 operador fora da v3 (`?:`, `?.`, `??`, bit a bit, `,`). Texto multilinha é GS0103. Erros do motor: 0710 TypeError, 0711 ReferenceError, 0712 RangeError, 0713 SyntaxError, 0714 outro (genéricos); 0720 leitura de propriedade de `nada`/`indefinido`, 0721 chamada de valor que não é função, 0722 uso antes da declaração, 0723 `.repete` com contagem inválida, 0724 `.com_casas` fora de 0–100, 0725 recursão infinita.
**Aceite:** todos os códigos da §4.11 existem nos dois tons; as seis frases de exemplo da §4.11 saem idênticas; `explainDiagnostic` devolve `null` para código desconhecido.

**Ciclo 1 — mensagens formatadas e catálogo completo**
- [ ] **1.1 Teste (RED).** Acrescentar ao `packages/language/tests/integrity.test.ts` (imports `DIAGNOSTICS` de `../src/diagnostics/index.ts`):
```ts
import { DIAGNOSTICS } from '../src/diagnostics/index.ts';

const CODE_RANGES: readonly (readonly [string, number, number])[] = [
  ['GS01', 1, 7], ['GS02', 1, 9], ['GS03', 1, 12], ['GS04', 1, 6], ['GS05', 0, 23], ['GS06', 1, 4],
  ['GS07', 1, 3], ['GS07', 10, 14], ['GS08', 1, 9], ['GS09', 1, 5],
];
const EXPECTED_CODES = CODE_RANGES.flatMap(([prefix, first, last]) =>
  Array.from({ length: last - first + 1 }, (_, index) => `${prefix}${String(first + index).padStart(2, '0')}`));
const EXAMPLE_OPTIONAL = /^GS(07(1[1-4])|09)/u;
const markers = (text: string) => [...text.matchAll(/\{(\w+)\}/gu)].map((match) => match[1]).sort();

describe('catálogo de diagnósticos', () => {
  it('tem exatamente os códigos da §4.11 e da numeração fixada', () => {
    expect(DIAGNOSTICS.map((entry) => entry.code).sort()).toEqual([...EXPECTED_CODES].sort());
  });
  it('traz os dois tons com os mesmos marcadores e exemplo (exceto genéricos de execução e ferramentas)', () => {
    expect(DIAGNOSTICS.filter((entry) => entry.messages.raiz === '' || entry.messages.neutro === '')).toEqual([]);
    expect(DIAGNOSTICS.filter((entry) => markers(entry.messages.raiz).join() !== markers(entry.messages.neutro).join()).map((entry) => entry.code)).toEqual([]);
    expect(DIAGNOSTICS.filter((entry) => entry.example === '' && !EXAMPLE_OPTIONAL.test(entry.code)).map((entry) => entry.code)).toEqual([]);
  });
  it('é aviso só na faixa GS08xx e no GS0904', () => {
    const warnings = DIAGNOSTICS.filter((entry) => entry.severity === 'warning').map((entry) => entry.code);
    expect(warnings.every((code) => code.startsWith('GS08') || code === 'GS0904')).toBe(true);
    expect(warnings).toHaveLength(10);
  });
});
```
Criar `packages/compiler/tests/unit/format-message.test.ts` (as seis frases da §4.11, com os `args` de cada uma):
```ts
import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '@goiasscript/language';
import { formatMessage } from '../../src/diagnostics/format-message.ts';

const say = (code: string, tone: 'raiz' | 'neutro', args: Record<string, string>) => formatMessage(lookupDiagnostic(code)?.messages[tone] ?? '', args);

describe('formatMessage e frases da §4.11', () => {
  it('troca marcadores e esconde trecho opcional sem valor', () => {
    expect(formatMessage('a {x}[[ b {y}]]', { x: '1' })).toBe('a 1');
    expect(formatMessage('a {x}[[ b {y}]]', { x: '1', y: '2' })).toBe('a 1 b 2');
    expect(formatMessage('{z}', {})).toBe('«z»');
  });
  it.each([
    ['GS0401', { name: 'const', suggestion: 'uai' }, 'Ô sô, "const" é palavra do JavaScript. Aqui em GoiásScript a gente fala "uai".', '"const" é do JavaScript. Em GoiásScript, use "uai".'],
    ['GS0301', { name: 'nomi', suggestion: 'nome' }, 'Esse trem "nomi" não existe por aqui. Cê quis dizer "nome"?', 'O nome "nomi" não foi declarado. Você quis dizer "nome"?'],
    ['GS0801', { construct: 'se_ocê_quiser' }, 'Dentro do "se_ocê_quiser" cê usou "é", que guarda valor. Pra comparar é "é_igualim".', 'Na condição foi usado "é" (atribuição). Para comparar, use "é_igualim".'],
    ['GS0601', { name: 'tamanho', description: 'tamanho de texto e de lista', suggestion: 'quantidade' }, 'Ô sô, "tamanho" já é nome de trem da biblioteca (tamanho de texto e de lista). Pra esse campo, que tal "quantidade"?', '"tamanho" é nome da biblioteca padrão (tamanho de texto e de lista). Para este campo, use outro nome, como "quantidade".'],
    ['GS0406', { name: 'some' }, 'Ô sô, ".some" é do JavaScript e esse trem ainda não tem nome goiano por aqui.', '".some" é um recurso do JavaScript que ainda não tem nome em GoiásScript.'],
    ['GS0208', { suggestion: '10.50' }, 'Ô sô, número com vírgula não rola. Aqui o decimal é com ponto: 10.50.', 'Decimais usam ponto, não vírgula. Escreva 10.50.'],
  ])('%s reproduz a frase do spec nos dois tons', (code, args, raiz, neutro) => {
    expect(say(code, 'raiz', args)).toBe(raiz);
    expect(say(code, 'neutro', args)).toBe(neutro);
  });
  it('GS0305 segue o formato do GS0301, sem a pergunta quando não há sugestão', () => {
    expect(say('GS0305', 'raiz', { name: 'nomi', suggestion: 'nome' })).toBe('Esse trem ".nomi" não existe por aqui. Cê quis dizer ".nome"?');
    expect(say('GS0305', 'raiz', { name: 'nomi' })).toBe('Esse trem ".nomi" não existe por aqui.');
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/language exec vitest run tests/integrity.test.ts` e `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/format-message.test.ts` — esperado: falha por imports inexistentes (`diagnostics/index.ts`, `format-message.ts`).
- [ ] **1.3 Implementar.** `diagnostics.types.ts` = bloco do esqueleto. `define-diagnostic.ts`:
```ts
import type { DiagnosticDefinition, DiagnosticSeverity, ToneKey } from './diagnostics.types.ts';

type Tones = Readonly<Record<ToneKey, string>>;
interface Extra { readonly help?: Tones; readonly lesson?: string }

export const tones = (raiz: string, neutro: string): Tones => ({ raiz, neutro });

export function defineDiagnostic(code: string, severity: DiagnosticSeverity, title: string, messages: Tones, example: string, extra: Extra = {}): DiagnosticDefinition {
  return { code, severity, title, messages, example, since: '3.0.0', ...extra };
}
```
(`Tones` e `Extra` são locais não exportados; `tones` e `defineDiagnostic` exportados.) `format-message.ts`:
```ts
const OPTIONAL_SEGMENT = /\[\[(.*?)\]\]/gu;
const MARKER = /\{(\w+)\}/gu;

export function formatMessage(template: string, args: Readonly<Record<string, string>>): string {
  const visible = template.replace(OPTIONAL_SEGMENT, (_match, inner: string) =>
    [...inner.matchAll(MARKER)].every((marker) => args[marker[1] ?? ''] !== undefined) ? inner : '');
  return visible.replace(MARKER, (_match, key: string) => args[key] ?? `«${key}»`);
}
```
Dados (cada arquivo exporta um array `readonly DiagnosticDefinition[]`, `import { defineDiagnostic as d, tones as t }`; o argumento depois do exemplo é `{ help: t(raiz, neutro), lesson }` quando houver). `lexical.data.ts` (`LEXICAL_DIAGNOSTICS`):
```ts
d('GS0101', 'error', 'Número malformado', t('Ô sô, esse número não rola: sem zero na frente e sem ponto de milhar.', 'Número malformado: não use zero à esquerda nem ponto de milhar.'), 'uai cep é 01310', { help: t('Pra CEP e telefone, usa texto: "01310". O milhar vai sem ponto: 1000000.', 'Para CEP e telefone, use texto: "01310". Escreva o milhar sem ponto: 1000000.') }),
d('GS0102', 'error', 'Escape inválido em texto', t('Eita, essa barra invertida no texto não vale.', 'Sequência de escape inválida no texto.'), 'uai t é "a\\8"'),
d('GS0103', 'error', 'Texto sem fechar', t('Ô sô, faltou fechar as aspas desse texto na mesma linha.', 'O texto não foi fechado na mesma linha.'), 'uai t é "oi', { help: t('Pra juntar várias linhas, usa "mais".', 'Para juntar linhas, use "mais".') }),
d('GS0104', 'error', 'Caractere inválido em nome', t('Ô sô, "{character}" não vale em nome de trem. Só letra, número e "_".', 'O caractere "{character}" não é permitido em nomes. Use letras, números e "_".'), 'uai $x é 1'),
d('GS0105', 'error', 'Caractere invisível proibido', t('Ô sô, tem um caractere invisível aí que atrapalha. Apaga ele.', 'Caractere invisível não permitido. Remova-o.'), '// a\u2028b'),
d('GS0106', 'error', 'Comentário sem fechar', t('Faltou fechar o comentário com "*/", sô.', 'O comentário de bloco não foi fechado com "*/".'), '/* oi'),
d('GS0107', 'error', 'Caractere desconhecido', t('Ô sô, não conheço esse "{character}" aí.', 'Caractere desconhecido: "{character}".'), 'uai x é 1 @'),
```
`syntax.data.ts` (`SYNTAX_DIAGNOSTICS`):
```ts
d('GS0201', 'error', 'Fim da entrada inesperado', t('Ô sô, o código acabou antes da hora. Falta fechar algum trem?', 'O código terminou inesperadamente. Falta fechar algo?'), 'se_ocê_quiser (x) {'),
d('GS0202', 'error', 'Trecho inesperado', t('Ô sô, não entendi esse trecho: "{found}" não cabe aqui.', 'Trecho inesperado: "{found}".'), 'uai x é 1 2', { help: t('Confere se terminou a instrução direito. Pra chamar método de número literal, usa parênteses: (5).com_casas(2).', 'Verifique o fim da instrução. Para chamar método de número literal, use parênteses: (5).com_casas(2).') }),
d('GS0203', 'error', 'Linha começa com operador', t('Ô sô, a linha não pode começar com "{found}". Termina a conta na linha de cima ou usa parênteses.', 'A linha não pode começar com o operador "{found}". Termine a conta na linha anterior ou use parênteses.'), 'uai a é 1\nmais 2'),
d('GS0204', 'error', 'Quebra antes da seta', t('Ô sô, não pode quebrar a linha entre os parâmetros e o "=>".', 'Não quebre a linha entre os parâmetros e "=>".'), 'uai f é x\n=> x'),
d('GS0205', 'error', 'Continuação sem início', t('Ô sô, esse "{found}" não tem o que continuar.', 'O "{found}" não continua nenhuma instrução anterior.'), 'se_não {\n}', { help: t('Bota o "{found}" na linha do "}" ou na seguinte.', 'Coloque o "{found}" na linha do "}" ou na seguinte.') }),
d('GS0206', 'error', 'vixe fora de lugar', t('Ô sô, "vixe" é instrução e leva exatamente uma coisa.', '"vixe" é uma instrução e recebe exatamente um valor.'), 'uai f é x => vixe("a")', { help: t('"vixe" é instrução; usa bloco: x => { vixe("…") }', 'Use bloco: x => { vixe("…") }') }),
d('GS0207', 'error', 'Corpo sem chaves', t('Ô sô, o corpo precisa das chaves.', 'O corpo precisa estar entre chaves.'), 'se_ocê_quiser (x) prosa(x)', { help: t('Bota as chaves: se_ocê_quiser (x) { prosa(x) }', 'Coloque as chaves: se_ocê_quiser (x) { prosa(x) }') }),
d('GS0208', 'error', 'Vírgula decimal', t('Ô sô, número com vírgula não rola. Aqui o decimal é com ponto: {suggestion}.', 'Decimais usam ponto, não vírgula. Escreva {suggestion}.'), 'uai preço é 10,50'),
d('GS0209', 'error', 'Alvo de atribuição inválido', t('Ô sô, não dá pra guardar valor aí. O "é" quer um nome ou um campo do lado esquerdo.', 'Alvo de atribuição inválido. Use um nome ou um membro.'), '1 é x'),
```
`names.data.ts` (`NAMES_DIAGNOSTICS`):
```ts
d('GS0301', 'error', 'Nome não declarado', t('Esse trem "{name}" não existe por aqui.[[ Cê quis dizer "{suggestion}"?]]', 'O nome "{name}" não foi declarado.[[ Você quis dizer "{suggestion}"?]]'), 'prosa(nomi)'),
d('GS0302', 'error', 'Reatribuição de uai', t('Ô sô, "{name}" foi guardado com "uai" e não muda. Se muda, declara com "trem".', '"{name}" foi declarado com "uai" e não pode ser reatribuído. Use "trem" se o valor muda.'), 'uai x é 1\nx é 2'),
d('GS0303', 'error', 'Palavra da linguagem usada como nome', t('"{name}" é palavra da linguagem; que tal "{suggestion}"?', '"{name}" é palavra reservada da linguagem; use outro nome, como "{suggestion}".'), 'uai mais é 1'),
d('GS0304', 'error', 'Nome declarado duas vezes', t('Ô sô, "{name}" já foi declarado aqui.', '"{name}" já foi declarado neste escopo.'), 'uai x é 1\nuai x é 2'),
d('GS0305', 'error', 'Membro não declarado', t('Esse trem ".{name}" não existe por aqui.[[ Cê quis dizer ".{suggestion}"?]]', 'O membro ".{name}" não foi declarado.[[ Você quis dizer ".{suggestion}"?]]'), 'uai o é { nome: 1 }\nprosa(o.nmoe)'),
d('GS0306', 'error', 'Palavra de versão anterior', t('"{word}" era de uma versão antiga.[[ Agora a gente fala "{replacement}".]][[ Esse trem {gone}.]]', '"{word}" era de uma versão anterior.[[ Agora use "{replacement}".]][[ Este recurso {gone}.]]'), 'presta_serviço soma(a, b) { faz_favor a mais b }', { help: t('Dá uma olhada na página "o que mudou" pra ver a forma nova.', 'Consulte a página "o que mudou" para a forma nova.'), lesson: 'o-que-mudou' }),
d('GS0307', 'error', 'uai sem valor inicial', t('Ô sô, "uai" precisa de valor na hora de nascer.', '"uai" exige valor inicial.'), 'uai x', { help: t('Dá um valor: uai x é 0. Se o valor vem depois, usa "trem".', 'Atribua um valor: uai x é 0. Se o valor vem depois, use "trem".') }),
d('GS0308', 'error', 'Fora de laço', t('Ô sô, "{name}" só serve dentro de um laço.', '"{name}" só pode ser usado dentro de laço.'), 'para_com_isso'),
d('GS0309', 'error', 'faz_favor fora de função', t('Ô sô, "faz_favor" só serve dentro de função.', '"faz_favor" só pode ser usado dentro de função.'), 'faz_favor 1'),
d('GS0310', 'error', 'Dois construtores', t('Ô sô, a classe só pode ter um "aprepara_trem".', 'A classe só pode ter um "aprepara_trem".'), 'arruma_trem A {\n  aprepara_trem() { }\n  aprepara_trem() { }\n}'),
d('GS0311', 'error', 'Uso inválido de a_raiz', t('Ô sô, "a_raiz" não cabe aí: vale no "aprepara_trem" (antes de usar "ocê") ou em método de classe que herda.', 'Uso inválido de "a_raiz": use no construtor (antes de "ocê") ou em método de classe que herda.'), 'uai x é a_raiz(1)'),
d('GS0312', 'error', 'espera_um_cadim fora de função assíncrona', t('Ô sô, "espera_um_cadim" só funciona em função "vai_na_frente".', '"espera_um_cadim" só pode ser usado em função assíncrona ("vai_na_frente").'), 'faz_trem f() { espera_um_cadim cochila(1) }'),
```
`javascript.data.ts` (`JAVASCRIPT_DIAGNOSTICS`):
```ts
d('GS0401', 'error', 'Keyword do JavaScript', t('Ô sô, "{name}" é palavra do JavaScript. Aqui em GoiásScript a gente fala "{suggestion}".', '"{name}" é do JavaScript. Em GoiásScript, use "{suggestion}".'), 'const x é 1', { lesson: 'licao-02' }),
d('GS0402', 'error', 'Palavra do JavaScript sem equivalente', t('Ô sô, "{name}" é palavra do JavaScript e não serve de nome; que tal "{suggestion}"?', '"{name}" é palavra do JavaScript e não serve de nome; use outro, como "{suggestion}".'), 'uai public é 1'),
d('GS0403', 'error', 'Global do JavaScript', t('Ô sô, "{name}" é do JavaScript.[[ Aqui a gente fala "{suggestion}".]]', '"{name}" é um recurso do JavaScript.[[ Em GoiásScript, use "{suggestion}".]]'), 'console.log(1)'),
d('GS0404', 'error', 'Operador do JavaScript', t('Ô sô, "{name}" é do JavaScript. Aqui a gente fala "{suggestion}".', '"{name}" é um operador do JavaScript. Em GoiásScript, use "{suggestion}".'), 'uai x = 1'),
d('GS0405', 'error', 'Membro do JavaScript com nome goiano', t('Ô sô, ".{name}" é do JavaScript. Em goianês é ".{suggestion}".', '".{name}" é do JavaScript. Em GoiásScript, use ".{suggestion}".'), 'uai l é [1]\nl.map(x => x)'),
d('GS0406', 'error', 'Membro do JavaScript sem nome goiano', t('Ô sô, ".{name}" é do JavaScript e esse trem ainda não tem nome goiano por aqui.[[ Que tal "{alternative}"?]]', '".{name}" é um recurso do JavaScript que ainda não tem nome em GoiásScript.[[ Considere "{alternative}".]]'), 'uai l é [1]\nl.some(x => x)'),
```
`subset.data.ts` (`SUBSET_DIAGNOSTICS`, severidade `error`, `since` padrão):
```ts
d('GS0500', 'error', 'Construção do JavaScript fora da v3', t('Ô sô, isso do JavaScript ainda não existe em GoiásScript 3.', 'Esta construção do JavaScript ainda não existe em GoiásScript 3.'), 'debugger'),
d('GS0501', 'error', 'Template literal', t('Ô sô, crase não rola. Junta os pedaços com "mais".', 'Template literals não existem em GoiásScript 3. Junte os textos com "mais".'), 'uai t é `oi`'),
d('GS0502', 'error', 'Expressão regular', t('Ô sô, expressão regular ainda não existe por aqui.', 'Expressões regulares ainda não existem em GoiásScript 3.'), 'uai r é /ab+/g'),
d('GS0503', 'error', 'Desestruturação', t('Ô sô, desestruturar não rola. Pega cada campo com ponto.', 'Desestruturação não existe em GoiásScript 3. Acesse cada campo com ".".'), 'uai [a, b] é [1, 2]'),
d('GS0504', 'error', 'Spread e rest', t('Ô sô, o "..." não existe por aqui.', 'O operador "..." não existe em GoiásScript 3.'), 'prosa(...[1])'),
d('GS0505', 'error', 'switch', t('Ô sô, "switch" não existe. Usa "se_ocê_quiser" e "se_num_for".', '"switch" não existe em GoiásScript 3. Use "se_ocê_quiser" e "se_num_for".'), 'switch (1) { }'),
d('GS0506', 'error', 'do…while', t('Ô sô, "do…while" não existe. Usa "enquanto_tiver".', '"do…while" não existe em GoiásScript 3. Use "enquanto_tiver".'), 'do { } while (certeza)'),
d('GS0507', 'error', 'Rótulo', t('Ô sô, rótulo não existe por aqui.', 'Rótulos não existem em GoiásScript 3.'), 'uai f é x => { a: x }', { help: t('Pra devolver uma coisa direto, usa parênteses: x => ({ a: x }).', 'Para devolver uma coisa direto, use parênteses: x => ({ a: x }).') }),
d('GS0508', 'error', 'Getter e setter', t('Ô sô, "get" e "set" não existem. Faz um método normal.', 'Getters e setters não existem em GoiásScript 3. Use um método.'), 'arruma_trem A {\n  get x() { faz_favor 1 }\n}'),
d('GS0509', 'error', 'Campo no corpo da classe', t('Ô sô, campo no corpo da classe não existe. Declara no "aprepara_trem" com "ocê.campo é …".', 'Campos no corpo da classe não existem. Declare no construtor com "ocê.campo é …".'), 'arruma_trem A {\n  x é 1\n}'),
d('GS0510', 'error', 'Campo privado', t('Ô sô, campo privado com "#" não existe.', 'Campos privados com "#" não existem em GoiásScript 3.'), 'arruma_trem A {\n  #x\n}'),
d('GS0511', 'error', 'Generator', t('Ô sô, gerador ("function*", "yield") não existe.', 'Geradores não existem em GoiásScript 3.'), 'faz_trem* f() { }'),
d('GS0512', 'error', 'typeof', t('Ô sô, "typeof" não existe por aqui.', '"typeof" não existe em GoiásScript 3.'), 'prosa(typeof 1)'),
d('GS0513', 'error', 'delete', t('Ô sô, "delete" não existe por aqui.', '"delete" não existe em GoiásScript 3.'), 'uai o é { a: 1 }\ndelete o.a'),
d('GS0514', 'error', 'void', t('Ô sô, "void" não existe por aqui.', '"void" não existe em GoiásScript 3.'), 'prosa(void 0)'),
d('GS0515', 'error', 'Módulos', t('Ô sô, módulo ("import", "export") não existe na v3. É um arquivo só.', 'Módulos não existem em GoiásScript 3. Use um arquivo só.'), 'import x from "y"'),
d('GS0516', 'error', 'Tipo na declaração', t('Ô sô, tipo na declaração não existe. Tira o ": tipo".', 'Anotações de tipo não existem em GoiásScript 3. Remova o ": tipo".'), 'uai x: texto é "a"'),
d('GS0517', 'error', 'Formato numérico fora da v3', t('Ô sô, número em hexadecimal, com "_" ou BigInt não existe. Usa decimal.', 'Números hexadecimais, com "_" ou BigInt não existem. Use decimal.'), 'uai n é 0xff'),
d('GS0518', 'error', 'Função como valor sem seta', t('Ô sô, função como valor é só com seta. Usa "x => …".', 'Função como valor só existe com seta ("x => …").'), 'uai f é faz_trem(x) { faz_favor x }', { help: t('Ou declara com nome: faz_trem soma(a, b) { … }.', 'Ou declare com nome: faz_trem soma(a, b) { … }.') }),
d('GS0519', 'error', 'Chave abreviada em coisa', t('Ô sô, na coisa escreve "chave: valor"; "{ x }" sozinho não rola.', 'Em coisas, escreva "chave: valor"; a forma abreviada não existe.'), 'uai x é 1\nuai o é { x }'),
d('GS0520', 'error', 'Método abreviado em coisa', t('Ô sô, método em coisa não rola. Usa "chave: x => …".', 'Métodos abreviados em coisas não existem. Use "chave: x => …".'), 'uai o é { f() { } }'),
d('GS0521', 'error', 'Chave computada', t('Ô sô, chave entre colchetes na coisa não existe.', 'Chaves computadas não existem em GoiásScript 3.'), 'uai k é "a"\nuai o é { [k]: 1 }'),
d('GS0522', 'error', 'Trem muito aninhado', t('Ô sô, esse trem tá aninhado demais (passou de {limit} níveis). Quebra em pedaços menores.', 'Aninhamento acima do limite de {limit} níveis. Divida o código.'), '('.repeat(LIMITS.maxNestingDepth + 100)),
d('GS0523', 'error', 'Operador fora da v3', t('Ô sô, "{name}" não existe em GoiásScript 3.[[ Usa "{suggestion}".]]', 'O operador "{name}" não existe em GoiásScript 3.[[ Use "{suggestion}".]]'), 'uai x é 1 ?? 2'),
```
(importar `LIMITS` de `../limits.constants.ts` em `subset.data.ts`.) `library.data.ts` (`LIBRARY_DIAGNOSTICS`):
```ts
d('GS0601', 'error', 'Membro com nome da biblioteca', t('Ô sô, "{name}" já é nome de trem da biblioteca ({description}). Pra esse campo, que tal "{suggestion}"?', '"{name}" é nome da biblioteca padrão ({description}). Para este campo, use outro nome, como "{suggestion}".'), 'uai o é { tamanho: 3 }'),
d('GS0602', 'error', 'pergunta fora de contexto assíncrono', t('Ô sô, "pergunta" precisa de função "vai_na_frente" pra esperar a resposta.', '"pergunta" precisa estar no topo ou em função assíncrona ("vai_na_frente").'), 'faz_trem f() { faz_favor pergunta("a") }', { help: t('Troca por: vai_na_frente faz_trem f() { … }', 'Use: vai_na_frente faz_trem f() { … }') }),
d('GS0603', 'error', 'Forma errada de membro da biblioteca', t('Ô sô, ".{name}" {expected}.', '".{name}" {expected}.'), 'uai l é [1]\nprosa(l.tamanho())'),
d('GS0604', 'error', 'Número de argumentos', t('Ô sô, ".{name}" quer {arity} e veio {received}.', '".{name}" espera {arity}, mas recebeu {received}.'), 'uai l é [1]\nprosa(l.amontoar(x => x))', { help: t('Jeito certo: {signature}', 'Forma correta: {signature}') }),
```
`runtime.data.ts` (`RUNTIME_DIAGNOSTICS`):
```ts
d('GS0701', 'error', 'Laço passou do limite', t('Ô sô, esse laço rodou demais (linha {line}). Será que ele nunca termina?', 'O laço excedeu o limite de iterações (linha {line}).'), 'enquanto_tiver (certeza) {\n}'),
d('GS0702', 'error', 'Acabou a entrada', t('Acabou a entrada, sô: o programa pediu uma resposta e não veio mais nada.', 'A entrada terminou: o programa pediu uma resposta e não há mais dados.'), 'prosa(pergunta("a"))'),
d('GS0703', 'error', 'Programa esperando para sempre', t('O programa ficou esperando uma resposta que nunca veio, sô.', 'O programa ficou aguardando indefinidamente uma resposta que nunca chegou.'), 'espera_um_cadim faz_um promessa((resolve_aí) => { })'),
d('GS0710', 'error', 'Erro de tipo', t('Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.', 'Erro de tipo: um valor foi usado de forma inválida.'), 'uai o é { a: 1 }\nprosa(faz_um o.a())'),
d('GS0711', 'error', 'Erro de referência', t('Ô sô, o programa usou um nome que ainda não existe.', 'Erro de referência: nome usado antes de existir.'), ''),
d('GS0712', 'error', 'Erro de faixa', t('Ô sô, um número ficou fora do que o trem aceita.', 'Erro de faixa: valor fora do intervalo permitido.'), ''),
d('GS0713', 'error', 'Erro de sintaxe em execução', t('Ô sô, o motor não entendeu um trecho do código.', 'Erro de sintaxe detectado em execução.'), ''),
d('GS0714', 'error', 'Erro desconhecido', t('Ô sô, deu um erro que a gente não conhece.', 'Ocorreu um erro desconhecido.'), ''),
```
`hints.data.ts` (`HINTS_DIAGNOSTICS`, severidade `warning`):
```ts
d('GS0801', 'warning', 'é como condição', t('Dentro do "{construct}" cê usou "é", que guarda valor. Pra comparar é "é_igualim".', 'Na condição foi usado "é" (atribuição). Para comparar, use "é_igualim".'), 'trem x é 1\nse_ocê_quiser (x é 2) { prosa(x) }'),
d('GS0802', 'warning', 'Laço sem saída aparente', t('Esse laço parece não ter saída, sô. Falta um "para_com_isso"?', 'O laço não parece ter saída. Falta um "para_com_isso"?'), 'enquanto_tiver (certeza) { prosa(1) }'),
d('GS0803', 'warning', 'Código depois de faz_favor', t('Esse código nunca roda: vem depois do "faz_favor".', 'Código inalcançável depois de "faz_favor".'), 'faz_trem f() {\n  faz_favor 1\n  prosa(2)\n}'),
d('GS0804', 'warning', 'Declaração esconde nome da biblioteca', t('Cuidado, sô: "{name}" já é nome da biblioteca. O seu esconde o dela aqui.', '"{name}" esconde um nome da biblioteca padrão neste escopo.'), 'uai Data é 1'),
d('GS0805', 'warning', 'Vírgula decimal em argumentos', t('Ô sô, "{text}" vira dois valores (a vírgula separa). Decimal é com ponto.', '"{text}" é lido como dois valores. Use ponto decimal.'), 'prosa(1.000,50)'),
d('GS0806', 'warning', 'Expressão sem efeito', t('Esse trem não faz nada, sô.[[ Pra somar, é "{suggestion}".]]', 'A expressão não tem efeito.[[ Para somar, use "{suggestion}".]]'), 'trem i é 0\ni mais 1'),
d('GS0807', 'warning', 'Erro passado direto', t('Passou o erro direto pro "{name}", sô. Usa "erro.mensagem".', 'O erro foi passado direto para "{name}". Use "erro.mensagem".'), 'tenta_aí {\n  vixe("a")\n} se_der_ruim (erro) {\n  prosa(erro)\n}'),
d('GS0808', 'warning', '$ especial em .trocar', t('Ô sô, "$&", "$$" e parentes no ".trocar" têm sentido especial.', 'Sequências como "$&" e "$$" têm significado especial em ".trocar".'), 'prosa("x".trocar("x", "US$$"))'),
d('GS0809', 'warning', 'Acesso por texto a nome da biblioteca', t('Acessar por texto não troca o nome da biblioteca, sô. Usa o ponto.', 'O acesso por texto não é traduzido para a biblioteca. Use ".".'), 'uai l é []\nprosa(l["mapear"])'),
```
`tools.data.ts` (`TOOLS_DIAGNOSTICS`, exemplos vazios):
```ts
d('GS0901', 'error', 'Erro interno do compilador', t('Ô sô, deu erro dentro do compilador. Isso é bug nosso: relata, por favor.', 'Erro interno do compilador. Relate o problema, por favor.'), ''),
d('GS0902', 'error', 'Arquivo sem .gs', t('Ô sô, o arquivo precisa terminar em ".gs".', 'O arquivo de entrada precisa terminar em ".gs".'), ''),
d('GS0903', 'error', 'Saída igual à entrada ou destino existente', t('Ô sô, a saída é igual à entrada ou já existe. Usa "--sobrescreve" se quiser trocar.', 'A saída é igual à entrada ou já existe. Use "--sobrescreve" para substituir.'), ''),
d('GS0904', 'warning', 'Node abaixo do mínimo', t('Seu Node é antigo, sô. Precisa do {minimum} ou mais.', 'Versão do Node abaixo do mínimo ({minimum}).'), ''),
d('GS0905', 'error', 'Uso incorreto do CLI', t('Ô sô, esse comando ou opção não existe. Dá uma olhada em "dedo_de_prosa".', 'Comando ou opção desconhecidos.'), ''),
```
`index.ts`: `export const DIAGNOSTICS: readonly DiagnosticDefinition[] = [...LEXICAL_DIAGNOSTICS, ...SYNTAX_DIAGNOSTICS, ...NAMES_DIAGNOSTICS, ...JAVASCRIPT_DIAGNOSTICS, ...SUBSET_DIAGNOSTICS, ...LIBRARY_DIAGNOSTICS, ...RUNTIME_DIAGNOSTICS, ...HINTS_DIAGNOSTICS, ...TOOLS_DIAGNOSTICS];`. Em `lookup.ts` acrescentar `const DIAGNOSTICS_BY_CODE = new Map(DIAGNOSTICS.map((entry) => [entry.code, entry]))` e `export const lookupDiagnostic = (code: string): DiagnosticDefinition | undefined => DIAGNOSTICS_BY_CODE.get(code);`; reexportar tudo em `index.ts`.
- [ ] **1.4 Rodar:** os dois comandos do passo 1.2 — esperado: passam (o catálogo tem 10 avisos: GS0801–GS0809 e GS0904).

**Ciclo 2 — `explainDiagnostic`**
- [ ] **2.1 Teste (RED).** `packages/compiler/tests/unit/explain.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { explainDiagnostic } from '../../src/explain.ts';

describe('explainDiagnostic', () => {
  it('devolve null para código desconhecido', () => {
    expect(explainDiagnostic('GS9999')).toBeNull();
  });
  it('explica no tom raiz por padrão e no neutro quando pedido', () => {
    const raiz = explainDiagnostic('GS0307');
    expect(raiz).toMatchObject({ code: 'GS0307', title: 'uai sem valor inicial', example: 'uai x' });
    expect(raiz?.explanation).toContain('Ô sô');
    expect(explainDiagnostic('GS0307', 'neutro')?.explanation).not.toContain('Ô sô');
  });
  it('troca marcadores sem valor por «nome» e usa lesson vazia quando não há', () => {
    expect(explainDiagnostic('GS0301')?.explanation).toContain('«name»');
    expect(explainDiagnostic('GS0301')?.lesson).toBe('');
  });
});
```
- [ ] **2.2 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/explain.test.ts` — esperado: falha por `src/explain.ts` inexistente.
- [ ] **2.3 Implementar.** Em `api.types.ts` acrescentar `export interface DiagnosticExplanation { readonly code: string; readonly title: string; readonly explanation: string; readonly example: string; readonly lesson: string }`. `explain.ts`:
```ts
import { lookupDiagnostic } from '@goiasscript/language';
import type { DiagnosticExplanation, Tone } from './api.types.ts';
import { formatMessage } from './diagnostics/format-message.ts';

export function explainDiagnostic(code: string, tone: Tone = 'raiz'): DiagnosticExplanation | null {
  const definition = lookupDiagnostic(code);
  if (definition === undefined) return null;
  const parts = [definition.messages[tone], definition.help?.[tone]].filter((part): part is string => part !== undefined);
  return { code: definition.code, title: definition.title, explanation: formatMessage(parts.join(' '), {}), example: definition.example, lesson: definition.lesson ?? '' };
}
```
Exportar `explainDiagnostic` em `packages/compiler/src/index.ts`.
- [ ] **2.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit` — esperado: passam.
- [ ] **3. Limpeza** e `corepack pnpm verify` verde.
- [ ] **4. Commit:** `git add packages && git commit -m "feat(language): adiciona catálogo de diagnósticos e explainDiagnostic"`

---

### U2-04: Lexer completo
**Spec:** §5.3, §4.3, §4.6 (quebra de linha), §4.7 (números e textos) · **Tier:** large · **Depende de:** U2-01, U2-02, U2-03 · **Risco:** lexer lançar ou ser quadrático (100 mil espaços levava 11,6 s); posição errada com U+2028/BOM · **Rollback:** reverter o commit (módulo novo; o parser ainda não existe)
**Files:**
- Create: `packages/compiler/src/lexer/{token.types.ts,lexer.ts,scan-trivia.ts,scan-word.ts,scan-number.ts,scan-string.ts,scan-template.ts,scan-punctuator.ts,rescan-regex.ts}`, `packages/compiler/tests/support/lex.ts`
- Test: `packages/compiler/tests/unit/lexer/{words.test.ts,numbers.test.ts,strings.test.ts,trivia.test.ts,punctuators-regex.test.ts,robustness.test.ts}`
**Interfaces:** Consumes: `createSourceText`, `SourceText`, `isIdentifierStart`, `isIdentifierPart`, `isCombiningMark`, `canonicalName`, `isValidName` (U2-02); `lookupKeyword` (U2-01); códigos GS0101–GS0107 (U2-03). Produces: `Token`, `TokenKind`, `Trivia`, `Lexer`, `RawDiagnostic`, `createLexer(source)` (esqueleto), mais `Token.numberForm?: NumberForm` (`'decimal' | 'hex' | 'binary' | 'octal' | 'bigint' | 'separator'`) e `ScanContext`.
**Regras desta unidade:** (a) entre dois tokens, a sequência de terminadores, espaços e comentários gera no máximo um token `newline` (no primeiro terminador; comentário de bloco com quebra vira o `newline` cobrindo o comentário inteiro) e o token seguinte leva `precededByNewline: true`; (b) texto com escape ruim continua `string` com GS0102; texto sem fechar, número malformado, palavra fora do alfabeto, `U+2028/9` em código e comentário sem fechar viram `invalid`; (c) `rescanAsRegex` devolve token `invalid` cobrindo a regex (ou só a `/` quando não fecha na linha), sem diagnóstico (o parser diagnostica em U2-06); (d) U+2028/U+2029 em comentário ou texto: GS0105 sem interromper; `U+FEFF` fora do offset 0: GS0105 só em código.

- [ ] **0. Dependência.** `grep -n '"@goiasscript/language"' packages/compiler/package.json` deve mostrar `workspace:*`; se não, adicionar em `devDependencies` (o `goiasscript` publicado embute o language; compiler segue com zero dependências de runtime, §8.5.5) e rodar `corepack pnpm install`.
- [ ] **1. Tipos e ajudante de teste.** `token.types.ts` = bloco do esqueleto (`TokenKind`, `Token`, `Trivia`, `Lexer`, `RawDiagnostic`) mais:
```ts
export type NumberForm = 'decimal' | 'hex' | 'binary' | 'octal' | 'bigint' | 'separator';
export interface ScanContext {
  readonly text: string;
  report(code: string, start: number, end: number, args?: Readonly<Record<string, string>>): void;
}
export interface ScannedToken { readonly kind: TokenKind; readonly end: number; readonly value: string; readonly numberForm?: NumberForm; readonly keyword?: KeywordEntry }
```
(`Token` ganha `readonly numberForm?: NumberForm;`; importar `KeywordEntry` de `@goiasscript/language`.) `tests/support/lex.ts`:
```ts
import { createLexer } from '../../src/lexer/lexer.ts';
import { createSourceText } from '../../src/source/source-text.ts';
import type { Lexer, Token } from '../../src/lexer/token.types.ts';

function* drain(lexer: Lexer): Generator<Token> {
  for (;;) {
    const token = lexer.next();
    yield token;
    if (token.kind === 'end-of-file') return;
  }
}
export function lexAll(text: string) {
  const lexer = createLexer(createSourceText(text, 't.gs'));
  const tokens = [...drain(lexer)];
  return { tokens, diagnostics: lexer.diagnostics };
}
export const kindsOf = (text: string) => lexAll(text).tokens.map((token) => token.kind);
export const codesOf = (text: string) => lexAll(text).diagnostics.map((diagnostic) => diagnostic.code);
export const valuesOf = (text: string) => lexAll(text).tokens.filter((token) => token.kind !== 'end-of-file').map((token) => token.value);
```

**Ciclo 1 — palavras, keywords e alfabeto**
- [ ] **1.1 Teste (RED).** `tests/unit/lexer/words.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: palavras', () => {
  it('separa keyword de identificador pela tabela, sem decidir a posição', () => {
    const { tokens } = lexAll('uai de total');
    expect(tokens.map((token) => [token.kind, token.keyword?.js])).toEqual([['keyword', 'const'], ['keyword', 'of'], ['identifier', undefined], ['end-of-file', undefined]]);
  });
  it('reconhece a variante sem acento e a keyword em NFD', () => {
    expect(lexAll('se_oce_quiser').tokens[0]?.keyword?.js).toBe('if');
    expect(lexAll('se_no\u0302').tokens[0]?.kind).toBe('identifier');
    expect(lexAll('se_na\u0303o').tokens[0]?.kind).toBe('identifier');
    expect(lexAll('se_nao\u0301').tokens[0]?.kind).toBe('identifier');
    expect(lexAll('oce\u0302').tokens[0]?.keyword?.js).toBe('this');
    expect(lexAll('se_na\u0303o'.replace('a\u0303', '\u00e3')).tokens[0]?.keyword?.js).toBe('else');
  });
  it('normaliza identificador para NFC e preserva o texto original', () => {
    const token = lexAll('cafe\u0301').tokens[0];
    expect([token?.value, token?.text, token?.end]).toEqual(['caf\u00e9', 'cafe\u0301', 5]);
  });
  it.each([['uai $x é 1', 'GS0104'], ['uai αβ é 1', 'GS0104'], ['uai 😀 é 1', 'GS0104'], ['uai x é 1 @', 'GS0107']])('%s dá %s', (text, code) => {
    expect(codesOf(text)).toEqual([code]);
  });
  it('transforma palavra fora do alfabeto em um token invalid só', () => {
    expect(kindsOf('$x')).toEqual(['invalid', 'end-of-file']);
  });
});
```
Observação: as linhas de NFD de keyword com marca que não compõe (`se_no\u0302`) servem para provar que só a forma NFC casa; o caso de `se_na\u0303o` composto na linha seguinte prova o NFD→NFC de keyword. (Se o título parecer redundante na revisão, manter só `oce\u0302` e `se_na\u0303o`.)
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/lexer/words.test.ts` — esperado: falha `Failed to resolve import "../../support/lex.ts"` / `lexer.ts`.
- [ ] **1.3 Implementar `lexer.ts` (esqueleto completo, com os demais scanners ainda mínimos)**:
```ts
export function createLexer(source: SourceText): Lexer { return new LexerImpl(source); }

class LexerImpl implements Lexer {
  private position = skipsBom(source.text);   // BOM no offset 0 vira trivia
  private buffer: readonly Token[] = [];
  private items: readonly RawDiagnostic[] = [];
  private newlineEmitted = false;
  constructor(private readonly source: SourceText) {}

  get diagnostics(): readonly RawDiagnostic[] { return this.items; }
  next(): Token { return this.buffer.length > 0 ? this.takeBuffered() : this.scan(); }
  peek(offset = 0): Token {
    while (this.buffer.length <= offset) this.buffer = [...this.buffer, this.scan()];
    return this.buffer[offset] ?? this.scan();
  }
  rescanAsRegex(token: Token): Token { /* ciclo 5 */ }

  private context: ScanContext = { text: this.source.text, report: (code, start, end, args = {}) => { this.items = [...this.items, { code, start, end, args }]; } };
  private scan(): Token { /* trivia -> token; mantém newlineEmitted */ }
}
```
O `scan()` faz: (1) chama `scanTrivia(context, position)` (ciclo 4) que devolve `{ trivia, end, newline: {start,end,text} | null }`; (2) se `newline` e `!this.newlineEmitted`, emite o token `newline` e marca `newlineEmitted = true`; (3) senão, despacha pelo primeiro caractere: fim do texto → `end-of-file`; dígito → `scanNumber`; `"`/`'` → `scanString`; crase → `scanTemplate`; início de palavra (`isWordStart`) → `scanWord`; pontuação → `scanPunctuator`; outro → `invalid` com GS0107 (um code point); (4) monta o `Token` com `precededByNewline = newlineEmitted || trivia viu quebra`, zera `newlineEmitted` ao emitir token que não é `newline`. `scan-word.ts`:
```ts
const isWordRunCharacter = (codePoint: number): boolean => isIdentifierPart(codePoint) || isCombiningMark(codePoint) || codePoint === DOLLAR || (codePoint > ASCII_MAX && !isSpaceOrLineTerminator(codePoint));

export function scanWord(context: ScanContext, start: number): ScannedToken {
  const end = runEnd(context.text, start, isWordRunCharacter);
  const value = canonicalName(context.text.slice(start, end));
  if (!isValidName(value)) {
    context.report('GS0104', start, end, { character: firstInvalidCharacter(value) });
    return { kind: 'invalid', end, value };
  }
  const keyword = lookupKeyword(value);
  return keyword === undefined ? { kind: 'identifier', end, value } : { kind: 'keyword', end, value, keyword };
}
```
com `runEnd(text, start, predicate)` iterando por code point e `firstInvalidCharacter(value)` devolvendo o primeiro code point fora do alfabeto. Constantes (`DOLLAR = 0x24`, `ASCII_MAX = 0x7f`) em `scan-word.ts`. `isSpaceOrLineTerminator` vem de `scan-trivia.ts`.
- [ ] **1.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 2 — números (GS0101)**
- [ ] **2.1 Teste (RED).** `tests/unit/lexer/numbers.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll, valuesOf } from '../../support/lex.ts';

describe('lexer: números', () => {
  it.each(['0', '12', '0.5', '1.5', '1e3', '1E-3', '1e+3', '3.141'])('aceita %s', (text) => {
    expect(codesOf(text)).toEqual([]);
    expect(valuesOf(text)).toEqual([text]);
  });
  it.each(['08', '01310', '00', '1.000.000', '1.2.3', '1e', '3x'])('%s é Invalid com GS0101', (text) => {
    expect(kindsOf(text)).toEqual(['invalid', 'end-of-file']);
    expect(codesOf(text)).toEqual(['GS0101']);
  });
  it('lê 1.000 como um número só e deixa o "," para o parser (P12)', () => {
    expect(valuesOf('1.000,50')).toEqual(['1.000', ',', '50']);
  });
  it('mantém "5.com_casas" como número, ponto e nome (o GS0202 é do parser)', () => {
    expect(valuesOf('5.com_casas(2)')).toEqual(['5', '.', 'com_casas', '(', '2', ')']);
    expect(valuesOf('1.5.com_casas')).toEqual(['1.5', '.', 'com_casas']);
  });
  it('marca hexadecimal, octal, binário, BigInt e separador como formas próprias', () => {
    const forms = ['0xff', '0b1', '0o7', '10n', '1_000'].map((text) => lexAll(text).tokens[0]?.numberForm);
    expect(forms).toEqual(['hex', 'binary', 'octal', 'bigint', 'separator']);
  });
});
```
- [ ] **2.2 Rodar:** `... exec vitest run tests/unit/lexer/numbers.test.ts` — esperado: falha (números hoje caem no GS0107).
- [ ] **2.3 Implementar `scan-number.ts`** (cada passo uma função pequena):
```ts
const isDigit = (character: string | undefined): boolean => character !== undefined && character >= '0' && character <= '9';

export function scanNumber(context: ScanContext, start: number): ScannedToken {
  const { text } = context;
  const prefixed = scanPrefixedForm(text, start);            // 0x 0b 0o -> { end, numberForm } | undefined
  if (prefixed !== undefined) return finish(context, start, prefixed.end, prefixed.numberForm);
  const integerEnd = digitsEnd(text, start);                  // aceita '_' entre dígitos e marca separator
  const leadingZero = text[start] === '0' && integerEnd - start > 1;
  const fractionEnd = isDigit(text[integerEnd + 1]) && text[integerEnd] === '.' ? digitsEnd(text, integerEnd + 1) : integerEnd;
  const exponentEnd = scanExponent(text, fractionEnd);        // -1 se 'e' sem dígitos
  const thousandsEnd = extraDotGroupsEnd(text, exponentEnd === fractionEnd ? fractionEnd : -1); // '.ddd' repetido
  const glued = text[Math.max(exponentEnd, thousandsEnd)] ... isIdentifierStart  // '3x'
  // inválido: leadingZero || exponentEnd === -1 || thousandsEnd > fractionEnd || glued
}
```
Regras exatas: bigint = dígitos seguidos de `n` (sem `.`); `separator` = qualquer `_` entre dígitos; `finish` devolve `{ kind: 'number', end, value: text.slice(start,end), numberForm }`. Em caso inválido: estende `end` até o fim da corrida de palavra/dígitos/pontos-de-milhar, reporta `GS0101` (`context.report('GS0101', start, end)`) e devolve `{ kind: 'invalid', end, value }`. `.` só entra no número quando o próximo caractere é dígito (então `5.com_casas` e `1.5.com_casas` param antes do `.`).
- [ ] **2.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 3 — textos, escapes e template (GS0102, GS0103, GS0105)**
- [ ] **3.1 Teste (RED).** `tests/unit/lexer/strings.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: textos', () => {
  it('decodifica os escapes do JS estrito', () => {
    const decoded = lexAll(String.raw`"a\n\t\\\"\x41\u0042\u{1F600}\0\q"`).tokens[0]?.value;
    expect(decoded).toBe('a\n\t\\"AB😀\u0000q');
  });
  it.each([String.raw`"\07"`, String.raw`"\1"`, String.raw`"\8"`, String.raw`"\x4"`, String.raw`"\u12"`, String.raw`"\u{110000}"`])('%s é GS0102 e segue como texto', (text) => {
    expect(codesOf(text)).toEqual(['GS0102']);
    expect(kindsOf(text)).toEqual(['string', 'end-of-file']);
  });
  it('texto sem fechar na linha é Invalid com GS0103 e o resto da linha some', () => {
    expect(kindsOf('"oi\nprosa(1)')).toEqual(['invalid', 'newline', 'identifier', 'punctuator', 'number', 'punctuator', 'end-of-file']);
    expect(codesOf('"oi')).toEqual(['GS0103']);
    expect(codesOf('"a\\\nb"')).toContain('GS0102');
  });
  it('U+2028 e U+2029 dentro de texto dão GS0105 sem interromper o texto', () => {
    expect(codesOf('"a\u2028b"')).toEqual(['GS0105']);
    expect(kindsOf('"a\u2029b"')).toEqual(['string', 'end-of-file']);
  });
  it('template é um token só, com ${} aninhado, e sem fechar é Invalid GS0103 até o fim', () => {
    expect(kindsOf('`a ${"}" mais `b ${1}`} c`')).toEqual(['template', 'end-of-file']);
    expect(kindsOf('`abc')).toEqual(['invalid', 'end-of-file']);
    expect(codesOf('`abc')).toEqual(['GS0103']);
  });
});
```
- [ ] **3.2 Rodar:** `... exec vitest run tests/unit/lexer/strings.test.ts` — esperado: falha (textos ainda caem em GS0107).
- [ ] **3.3 Implementar `scan-string.ts`**:
```ts
const SIMPLE_ESCAPES: Readonly<Record<string, string>> = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', '\\': '\\', "'": "'", '"': '"' };

export function scanString(context: ScanContext, start: number): ScannedToken {
  const { text } = context;
  const quote = text[start];
  let index = start + 1;
  let value = '';
  while (index < text.length && text[index] !== quote) {
    const character = text[index] ?? '';
    if (isLineBreak(character)) return failUnterminated(context, start, index);
    if (isForbiddenSeparator(character)) context.report('GS0105', index, index + 1);
    if (character === '\\') {
      const escape = readEscape(context, index);        // { end, value }; reporta GS0102 e segue
      value += escape.value;
      index = escape.end;
    } else { value += character; index += 1; }
  }
  return index >= text.length ? failUnterminated(context, start, index) : { kind: 'string', end: index + 1, value };
}
```
`readEscape(context, at)`: caractere seguinte `c`: se `SIMPLE_ESCAPES[c]` → valor; `0` sem dígito depois → `\0`; `0`-`9` restantes (octal, `\8`, `\9`) → GS0102 (`[at, at+2]`); `x` + 2 hex / `u` + 4 hex / `u{1..6 hex, <= 10FFFF}` → `String.fromCodePoint`, senão GS0102 cobrindo a sequência lida; quebra de linha depois de `\` → GS0102 (sem consumir a quebra); qualquer outro caractere → ele mesmo. `failUnterminated` reporta GS0103 em `[start, index)` e devolve `{ kind: 'invalid', end: index, value: '' }`. `scan-template.ts`:
```ts
export function scanTemplate(context: ScanContext, start: number): ScannedToken {
  const end = templateEnd(context.text, start + 1);        // -1 quando não fecha
  if (end < 0) { context.report('GS0103', start, context.text.length); return { kind: 'invalid', end: context.text.length, value: context.text.slice(start) }; }
  return { kind: 'template', end, value: context.text.slice(start, end) };
}
```
`templateEnd(text, from)` percorre: `\` pula o próximo; crase fecha; `${` chama `expressionEnd(text, from + 2)` que conta `{`/`}` pulando textos `"`/`'` (com `\`) e templates (recursão em `templateEnd`); devolve o índice depois do `}` ou -1. A recursão fica limitada pelo tamanho do texto; aninhamento patológico de templates é protegido por `depth > LIMITS.maxNestingDepth` retornando -1 (vira GS0103).
- [ ] **3.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 4 — trivia, quebras de linha, BOM, U+2028/9 (GS0105, GS0106, GS0107)**
- [ ] **4.1 Teste (RED).** `tests/unit/lexer/trivia.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codesOf, kindsOf, lexAll } from '../../support/lex.ts';

describe('lexer: trivia e quebras', () => {
  it('entrega um newline por intervalo, mesmo com linhas em branco e comentários', () => {
    expect(kindsOf('a\n\n  // x\n/* y */\nb')).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
  });
  it.each([['a\nb'], ['a\r\nb'], ['a\rb']])('trata %j como uma quebra só', (text) => {
    expect(kindsOf(text)).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
    expect(lexAll(text).tokens[2]?.precededByNewline).toBe(true);
  });
  it('comentário de bloco com quebra conta como quebra; sem quebra, não', () => {
    expect(kindsOf('a /* x\ny */ b')).toEqual(['identifier', 'newline', 'identifier', 'end-of-file']);
    expect(kindsOf('a /* x */ b')).toEqual(['identifier', 'identifier', 'end-of-file']);
  });
  it('anexa espaço e comentário ao token seguinte como trivia com posição', () => {
    const token = lexAll('a  // oi\nb').tokens[2];
    expect(token?.leadingTrivia.map((trivia) => trivia.kind)).toEqual(['line-comment']);
  });
  it('trata BOM no início como trivia e fora do início como GS0105', () => {
    const { tokens } = lexAll('\uFEFFuai');
    expect([tokens[0]?.leadingTrivia[0]?.kind, tokens[0]?.start]).toEqual(['bom', 1]);
    expect(codesOf('uai \uFEFF x')).toEqual(['GS0105']);
  });
  it('proíbe U+2028 e U+2029 em código, comentário e texto', () => {
    expect(codesOf('uai\u2028x')).toEqual(['GS0105']);
    expect(codesOf('// a\u2029b')).toEqual(['GS0105']);
  });
  it('aceita NBSP e separadores de espaço do ECMA-262; outro caractere solto é GS0107', () => {
    expect(codesOf('a\u00a0b\u3000c\u2003d')).toEqual([]);
    expect(codesOf('a \u0001 b')).toEqual(['GS0107']);
  });
  it('comentário de bloco sem fechar é Invalid com GS0106', () => {
    expect(kindsOf('a /* x')).toEqual(['identifier', 'invalid', 'end-of-file']);
    expect(codesOf('a /* x')).toEqual(['GS0106']);
  });
});
```
- [ ] **4.2 Rodar:** `... exec vitest run tests/unit/lexer/trivia.test.ts` — esperado: falha (newline e trivia ainda não implementados).
- [ ] **4.3 Implementar `scan-trivia.ts`**:
```ts
const WHITESPACE: ReadonlySet<number> = new Set([0x09, 0x0b, 0x0c, 0x20, 0xa0, 0x1680, 0x202f, 0x205f, 0x3000, ...range(0x2000, 0x200a)]);
export const isSpaceOrLineTerminator = (codePoint: number): boolean => WHITESPACE.has(codePoint) || [0x0a, 0x0d, 0x2028, 0x2029, 0xfeff].includes(codePoint);

export interface TriviaStep {            // em token.types.ts
  readonly trivia: readonly Trivia[];
  readonly end: number;                  // onde o próximo token (ou quebra) começa
  readonly newline: { readonly start: number; readonly end: number; readonly text: string } | null;
  readonly sawNewline: boolean;
  readonly invalid?: ScannedToken & { readonly start: number };   // comentário de bloco sem fechar
}
export function scanTrivia(context: ScanContext, from: number): TriviaStep { /* laço: BOM em 0 -> trivia 'bom'; espaços -> 'whitespace'; '//' até \n|\r|EOF (GS0105 se U+2028/9); '/*' até '*/' (sem fechar -> GS0106 + invalid até o fim); no primeiro terminador \n | \r\n | \r devolve newline e para; comentário de bloco com \n/\r devolve newline cobrindo o comentário */ }
```
O `scan()` do lexer, depois de emitir um `newline`, chama `scanTrivia` de novo para o intervalo seguinte, mas com `newlineEmitted = true` ignora novos `newline` (só junta ao `leadingTrivia` do próximo token, incluindo linhas em branco como `whitespace` com `containsNewline: true`). U+2028/U+2029 e U+FEFF em posição de código viram token `invalid` com GS0105; outro caractere de controle ou desconhecido, GS0107.
- [ ] **4.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/lexer` — esperado: words, numbers, strings e trivia passam.

**Ciclo 5 — pontuação ("aceitar mais") e `rescanAsRegex`**
- [ ] **5.1 Teste (RED).** `tests/unit/lexer/punctuators-regex.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createLexer } from '../../../src/lexer/lexer.ts';
import { createSourceText } from '../../../src/source/source-text.ts';
import { codesOf, valuesOf } from '../../support/lex.ts';

const lexerFor = (text: string) => createLexer(createSourceText(text, 't.gs'));

describe('lexer: pontuação', () => {
  it('lê por maior casamento os operadores do JS que a v3 recusa', () => {
    expect(valuesOf('=== !== == != && || ?? ?. ** ++ -- += >>> ...')).toEqual(['===', '!==', '==', '!=', '&&', '||', '??', '?.', '**', '++', '--', '+=', '>>>', '...']);
    expect(valuesOf('=> ( ) [ ] { } , . ; : < > <= >= + - * / % # ?')).toHaveLength(22);
  });
  it('trata "/" como divisão, inclusive "/="', () => {
    expect(valuesOf('a / b / c')).toEqual(['a', '/', 'b', '/', 'c']);
    expect(valuesOf('a /= 2')).toEqual(['a', '/=', '2']);
  });
});

describe('lexer: rescanAsRegex', () => {
  it('relê /ab+/g como um token e descarta o que já tinha lido adiante', () => {
    const lexer = lexerFor('/"/g mais 1');
    const slash = lexer.peek();
    lexer.peek(3);
    const regex = lexer.rescanAsRegex(slash);
    expect([regex.kind, regex.text]).toEqual(['invalid', '/"/g']);
    expect(lexer.diagnostics).toEqual([]);
    expect(lexer.next().text).toBe('mais');
  });
  it('respeita \\/ e classes [..] e entende /=abc/', () => {
    expect(lexerFor(String.raw`/a\//`).rescanAsRegex(lexerFor(String.raw`/a\//`).peek()).text).toBe(String.raw`/a\//`);
    const lexer = lexerFor('/[/]x/ y');
    expect(lexer.rescanAsRegex(lexer.peek()).text).toBe('/[/]x/');
    const equals = lexerFor('/=abc/');
    expect(equals.rescanAsRegex(equals.peek()).text).toBe('/=abc/');
  });
  it('sem "/" de fechamento na linha cobre só a "/" e segue no newline', () => {
    const lexer = lexerFor('/abc\nx');
    const regex = lexer.rescanAsRegex(lexer.peek());
    expect(regex.text).toBe('/');
    expect(lexer.next().text).toBe('abc');
  });
  it('não gera diagnóstico de texto sem fechar para aspas dentro da regex', () => {
    expect(codesOf('/"/')).toContain('GS0103');
    const lexer = lexerFor('/"/');
    lexer.rescanAsRegex(lexer.peek());
    expect(lexer.diagnostics).toEqual([]);
  });
});
```
- [ ] **5.2 Rodar:** `... exec vitest run tests/unit/lexer/punctuators-regex.test.ts` — esperado: falha (pontuação ainda não existe; `rescanAsRegex` vazio).
- [ ] **5.3 Implementar `scan-punctuator.ts`**:
```ts
const PUNCTUATORS = [
  '>>>=', '===', '!==', '**=', '...', '<<=', '>>=', '>>>', '&&=', '||=', '??=',
  '=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '**', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<', '>>',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '&', '|', '^', '~', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '#',
] as const;   // do mais longo para o mais curto

export function scanPunctuator(text: string, start: number): ScannedToken | undefined {
  const found = PUNCTUATORS.find((candidate) => text.startsWith(candidate, start));
  return found === undefined ? undefined : { kind: 'punctuator', end: start + found.length, value: found };
}
```
`rescan-regex.ts`:
```ts
export function regexEnd(text: string, slashIndex: number): number {          // -1 quando não fecha na linha
  let index = slashIndex + 1;
  let inClass = false;
  while (index < text.length && !isLineBreak(text[index] ?? '')) {
    const character = text[index];
    if (character === '\\') { index += 2; continue; }
    if (character === '[') inClass = true;
    else if (character === ']') inClass = false;
    else if (character === '/' && !inClass) return flagsEnd(text, index + 1);
    index += 1;
  }
  return -1;
}
```
`flagsEnd` consome `[A-Za-z]*`. Em `LexerImpl.rescanAsRegex(token)`: `const end = regexEnd(text, token.start)`; novo `end` = `end < 0 ? token.start + 1 : end`; `this.position = newEnd`; `this.buffer = []`; `this.items = this.items.filter((item) => item.start < token.start)`; `this.newlineEmitted = false`; devolve `{ ...token, kind: 'invalid', end: newEnd, text: text.slice(token.start, newEnd), value: same }`. Precondição: `token` é a `/` ou `/=` ainda não consumida (o parser a obtém por `peek()`); se já foi consumida por `next()`, o mesmo código vale porque o buffer só tem tokens à frente.
- [ ] **5.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/lexer` — esperado: todos passam.

**Ciclo 6 — robustez e desempenho**
- [ ] **6.1 Teste (RED).** `tests/unit/lexer/robustness.test.ts`:
```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { lexAll } from '../../support/lex.ts';

const MAX_SPACES_MILLISECONDS = 100;
const SPACES = 100_000;

describe('lexer: robustez', () => {
  it('nunca lança, com strings Unicode arbitrárias, e sempre termina em end-of-file', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (text) => {
      const { tokens } = lexAll(text);
      expect(tokens.at(-1)?.kind).toBe('end-of-file');
    }), { numRuns: 300 });
  });
  it('cobre o texto sem buracos: tokens e trivia reconstroem o fonte', () => {
    fc.assert(fc.property(fc.string(), (text) => {
      const { tokens } = lexAll(text);
      expect(tokens.every((token, index) => index === 0 || token.start >= (tokens[index - 1]?.end ?? 0) - 1)).toBe(true);
    }), { numRuns: 200 });
  });
  it('lê 100 mil espaços, 10 mil linhas e 100 mil parênteses em tempo linear', () => {
    const started = performance.now();
    expect(lexAll(' '.repeat(SPACES)).tokens).toHaveLength(1);
    expect(lexAll('prosa(1)\n'.repeat(10_000)).tokens.length).toBeGreaterThan(10_000);
    expect(lexAll('('.repeat(SPACES)).tokens).toHaveLength(SPACES + 1);
    expect(performance.now() - started).toBeLessThan(MAX_SPACES_MILLISECONDS * 5);
  });
});
```
- [ ] **6.2 Rodar:** `... exec vitest run tests/unit/lexer/robustness.test.ts` — esperado: falha com estouro de tempo ou exceção enquanto algum scanner for quadrático; com os scanners lineares dos ciclos anteriores o teste passa, e `--reporter verbose` lista o teste de tempo como executado.
- [ ] **6.3 Implementar** a correção do que o teste achar. Pontos de atenção: `runEnd` e `digitsEnd` não podem fatiar a string a cada passo; `leadingTrivia` de 100 mil espaços é **uma** trivia `whitespace`; `peek` não reescaneia (buffer).
- [ ] **6.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/lexer` — esperado: passa.
- [ ] **7. Limpeza (de-sloppify)**: nenhuma função ≥ 50 linhas (`scan()` e `scanTrivia` quebrados em auxiliares), sem `any`, sem comentário que narra; `corepack pnpm verify` verde.
- [ ] **8. Commit:** `git add packages/compiler && git commit -m "feat(compiler): adiciona lexer sob demanda que nunca lança"`

---

### U2-05: AST e parser (instruções, Pratt, §4.6, recuperação)
**Spec:** §4.5, §4.6, §4.7, §5.4, §5.5 · **Tier:** large · **Depende de:** U2-04 · **Risco:** fim de instrução errado une ou parte linhas; recursão estourar a pilha com entrada profunda; loop sem progresso na recuperação · **Rollback:** reverter o commit (módulo novo)
**Files:**
- Create: `packages/compiler/src/ast/{ast.types.ts,walk.ts}`, `src/parser/{parser.ts,parser-state.ts,list-builder.ts,newline-context.ts,precedence.constants.ts,expressions.ts,statements.ts,declarations.ts,classes.ts,recovery.ts}`, `tests/support/{parse.ts,sexp.ts}`
- Test: `packages/compiler/tests/unit/parser/{statement-end.test.ts,expressions.test.ts,arrows.test.ts,continuations.test.ts,recovery.test.ts,limits.test.ts,chain-depth.test.ts}`, `tests/unit/ast/walk.test.ts`
**Interfaces:** Consumes: `createLexer`, `Lexer`, `Token`, `RawDiagnostic` (U2-04), `LIMITS`, `lookupKeyword` (U2-01), `CompileTarget` (U2-02). Produces: `Program` e demais nós, `ErrorNode`, `parse(source, lexer, { target }): ParseResult` (esqueleto; `ParseResult.diagnostics` já inclui os diagnósticos do lexer, ordenados por `start`), `forEachChild(node, visit)` e `walk` em `ast/walk.ts`. Nós novos: `Identifier.reservedKeyword?: KeywordEntry` (só quando keyword reservada ocupa posição de nome: a análise dá GS0303) e `ThrowStatement.arguments: readonly Expression[]` (U2-06 diagnostica a quantidade).
**Aceite:** cobre a §4.6 inteira (callback em bloco, Allman, continuação por palavra, `;`), precedência do JS, GS0201–GS0205, vários diagnósticos por arquivo, `incomplete`, `'('.repeat(100000)` sem lançar e sem estourar a pilha; cadeias de 100 mil operadores, membros, chamadas, índices ou atribuições dão exatamente um GS0522 e `walk` sobre o `Program` não estoura (profundidade efetiva da árvore ≤ `LIMITS.maxNestingDepth`).

- [ ] **1. Tipos da AST** (`ast.types.ts`; todos `readonly`, todo nó com `start`/`end`; nós que vêm de keyword levam `keywordToken?: Token`):
```ts
interface NodeBase { readonly start: number; readonly end: number }
export interface Identifier extends NodeBase { readonly type: 'Identifier'; readonly name: string; readonly reservedKeyword?: KeywordEntry }
export interface Literal extends NodeBase { readonly type: 'Literal'; readonly raw: string; readonly value: string | number | boolean | null | undefined; readonly keywordToken?: Token }
export interface ErrorNode extends NodeBase { readonly type: 'ErrorNode'; readonly code: string }
export interface ThisExpression extends NodeBase { readonly type: 'ThisExpression'; readonly keywordToken: Token }
export interface Super extends NodeBase { readonly type: 'Super'; readonly keywordToken: Token }
export interface ArrayExpression extends NodeBase { readonly type: 'ArrayExpression'; readonly elements: readonly Expression[] }
export interface Property extends NodeBase { readonly type: 'Property'; readonly key: Identifier | Literal; readonly value: Expression }
export interface ObjectExpression extends NodeBase { readonly type: 'ObjectExpression'; readonly properties: readonly Property[] }
export interface MemberExpression extends NodeBase { readonly type: 'MemberExpression'; readonly object: Expression; readonly property: Expression; readonly computed: boolean }
export interface CallExpression extends NodeBase { readonly type: 'CallExpression'; readonly callee: Expression; readonly arguments: readonly Expression[] }
export interface NewExpression extends NodeBase { readonly type: 'NewExpression'; readonly callee: Expression; readonly arguments: readonly Expression[]; readonly keywordToken: Token }
export interface UnaryExpression extends NodeBase { readonly type: 'UnaryExpression'; readonly operator: string; readonly argument: Expression; readonly operatorToken: Token }
export interface AwaitExpression extends NodeBase { readonly type: 'AwaitExpression'; readonly argument: Expression; readonly keywordToken: Token }
export interface BinaryExpression extends NodeBase { readonly type: 'BinaryExpression' | 'LogicalExpression'; readonly operator: string; readonly left: Expression; readonly right: Expression; readonly operatorToken: Token }
export interface AssignmentExpression extends NodeBase { readonly type: 'AssignmentExpression'; readonly operator: string; readonly left: Expression; readonly right: Expression; readonly operatorToken: Token }
export interface ArrowFunctionExpression extends NodeBase { readonly type: 'ArrowFunctionExpression'; readonly params: readonly Identifier[]; readonly body: BlockStatement | Expression; readonly async: boolean; readonly keywordToken?: Token }
export type Expression = Identifier | Literal | ErrorNode | ThisExpression | Super | ArrayExpression | ObjectExpression | MemberExpression | CallExpression | NewExpression | UnaryExpression | AwaitExpression | BinaryExpression | AssignmentExpression | ArrowFunctionExpression;

export interface BlockStatement extends NodeBase { readonly type: 'BlockStatement'; readonly body: readonly Statement[]; readonly synthetic?: boolean }
export interface ExpressionStatement extends NodeBase { readonly type: 'ExpressionStatement'; readonly expression: Expression }
export interface VariableDeclarator extends NodeBase { readonly type: 'VariableDeclarator'; readonly id: Identifier; readonly init: Expression | null }
export interface VariableDeclaration extends NodeBase { readonly type: 'VariableDeclaration'; readonly kind: 'const' | 'let'; readonly declarations: readonly VariableDeclarator[]; readonly keywordToken: Token }
export interface FunctionDeclaration extends NodeBase { readonly type: 'FunctionDeclaration'; readonly id: Identifier; readonly params: readonly Identifier[]; readonly body: BlockStatement; readonly async: boolean; readonly keywordToken: Token }
export interface MethodDefinition extends NodeBase { readonly type: 'MethodDefinition'; readonly key: Identifier; readonly params: readonly Identifier[]; readonly body: BlockStatement; readonly kind: 'constructor' | 'method'; readonly static: boolean; readonly async: boolean; readonly keywordTokens: readonly Token[] }
export interface ClassDeclaration extends NodeBase { readonly type: 'ClassDeclaration'; readonly id: Identifier; readonly superClass: Expression | null; readonly body: readonly MethodDefinition[]; readonly keywordToken: Token }
export interface IfStatement extends NodeBase { readonly type: 'IfStatement'; readonly test: Expression; readonly consequent: BlockStatement; readonly alternate: IfStatement | BlockStatement | null; readonly keywordToken: Token }
export interface WhileStatement extends NodeBase { readonly type: 'WhileStatement'; readonly test: Expression; readonly body: BlockStatement; readonly keywordToken: Token }
export interface ForStatement extends NodeBase { readonly type: 'ForStatement'; readonly init: VariableDeclaration | Expression | null; readonly test: Expression | null; readonly update: Expression | null; readonly body: BlockStatement; readonly keywordToken: Token }
export interface ForEachStatement extends NodeBase { readonly type: 'ForOfStatement' | 'ForInStatement'; readonly left: VariableDeclaration; readonly right: Expression; readonly body: BlockStatement; readonly keywordToken: Token }
export interface JumpStatement extends NodeBase { readonly type: 'BreakStatement' | 'ContinueStatement'; readonly keywordToken: Token }
export interface ReturnStatement extends NodeBase { readonly type: 'ReturnStatement'; readonly argument: Expression | null; readonly keywordToken: Token }
export interface ThrowStatement extends NodeBase { readonly type: 'ThrowStatement'; readonly arguments: readonly Expression[]; readonly keywordToken: Token }
export interface CatchClause extends NodeBase { readonly type: 'CatchClause'; readonly param: Identifier | null; readonly body: BlockStatement; readonly keywordToken: Token }
export interface TryStatement extends NodeBase { readonly type: 'TryStatement'; readonly block: BlockStatement; readonly handler: CatchClause | null; readonly finalizer: BlockStatement | null; readonly keywordToken: Token }
export type Statement = BlockStatement | ExpressionStatement | VariableDeclaration | FunctionDeclaration | ClassDeclaration | IfStatement | WhileStatement | ForStatement | ForEachStatement | JumpStatement | ReturnStatement | ThrowStatement | TryStatement | ErrorNode;
export interface Program extends NodeBase { readonly type: 'Program'; readonly body: readonly Statement[] }
export type AstNode = Program | Statement | Expression | Property | VariableDeclarator | MethodDefinition | CatchClause;
export interface ParseResult { readonly program: Program; readonly diagnostics: readonly RawDiagnostic[]; readonly incomplete: boolean }
```
`walk.ts`:
```ts
const CHILD_KEYS: Readonly<Record<AstNode['type'], readonly string[]>> = {
  Program: ['body'], BlockStatement: ['body'], ExpressionStatement: ['expression'], VariableDeclaration: ['declarations'],
  VariableDeclarator: ['id', 'init'], FunctionDeclaration: ['id', 'params', 'body'], MethodDefinition: ['key', 'params', 'body'],
  ClassDeclaration: ['id', 'superClass', 'body'], IfStatement: ['test', 'consequent', 'alternate'], WhileStatement: ['test', 'body'],
  ForStatement: ['init', 'test', 'update', 'body'], ForOfStatement: ['left', 'right', 'body'], ForInStatement: ['left', 'right', 'body'],
  BreakStatement: [], ContinueStatement: [], ReturnStatement: ['argument'], ThrowStatement: ['arguments'],
  TryStatement: ['block', 'handler', 'finalizer'], CatchClause: ['param', 'body'], Identifier: [], Literal: [], ErrorNode: [],
  ThisExpression: [], Super: [], ArrayExpression: ['elements'], ObjectExpression: ['properties'], Property: ['key', 'value'],
  MemberExpression: ['object', 'property'], CallExpression: ['callee', 'arguments'], NewExpression: ['callee', 'arguments'],
  UnaryExpression: ['argument'], AwaitExpression: ['argument'], BinaryExpression: ['left', 'right'], LogicalExpression: ['left', 'right'],
  AssignmentExpression: ['left', 'right'], ArrowFunctionExpression: ['params', 'body'],
};

export function forEachChild(node: AstNode, visit: (child: AstNode) => void): void {
  for (const key of CHILD_KEYS[node.type]) {
    const value: unknown = (node as unknown as Readonly<Record<string, unknown>>)[key];
    for (const child of Array.isArray(value) ? value : [value]) if (isAstNode(child)) visit(child);
  }
}
export function walk(node: AstNode, visit: (node: AstNode) => void): void {
  visit(node);
  forEachChild(node, (child) => walk(child, visit));
}
```
(`isAstNode` = objeto com `type` string; o parser garante profundidade efetiva da árvore ≤ `maxNestingDepth`, inclusive em cadeias à esquerda e de membro/chamada/índice (ciclo 6), então a recursão é segura.) Ajudantes de teste: `tests/support/parse.ts`: `parseText(text, target: CompileTarget = 'module')` cria fonte, lexer e chama `parse`; `codes(result)` = `result.diagnostics.map(d => d.code)`. `tests/support/sexp.ts`: `toSexp(node)` devolve `Identifier` → nome, `Literal` → `raw`, demais `Tipo[operador](filho, filho)` usando `forEachChild` (operador só quando o nó tem `operator`).
- [ ] **2. Teste do `walk`** (`tests/unit/ast/walk.test.ts`): `parseText('uai a é b mais 1')` e `walk` coletando `Identifier` na ordem `['a', 'b']`; espera falha inicial por import e passa depois do passo 3.

**Ciclo 1 — contextos de newline e fim de instrução (§4.6)**
- [ ] **1.1 Teste (RED).** `tests/unit/parser/statement-end.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const statements = (text: string) => parseText(text).program.body.map((statement) => toSexp(statement));

describe('parser: fim de instrução (§4.6)', () => {
  it('a quebra termina a instrução simples e o ";" separa instruções na mesma linha', () => {
    expect(statements('uai a é 1\ntrem b é 2; trem c é 3')).toHaveLength(3);
  });
  it('callback em bloco dentro de chamada separa as instruções sem ";" (Review Focus 5)', () => {
    const result = parseText('lista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})\nprosa(2)');
    expect(codes(result)).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    const arrow = toSexp(result.program.body[0] ?? result.program);
    expect(arrow.match(/ExpressionStatement/gu)).toHaveLength(3);
  });
  it('callback em bloco dentro de lista e seta com bloco dentro de coisa de várias linhas', () => {
    expect(codes(parseText('uai fs é [x => {\n  prosa(1)\n  prosa(2)\n}]'))).toEqual([]);
    expect(codes(parseText('uai acoes é {\n  dobra: x => {\n    uai y é x\n    faz_favor y\n  },\n  triplo: 3\n}'))).toEqual([]);
  });
  it('ignora a quebra dentro de ( ), [ ] e coisa, e depois de operador, "é", vírgula, ponto, "(" e "=>"', () => {
    expect(codes(parseText('soma(1,\n  2)\nuai l é [1,\n2]\nuai a é 1 mais\n  2\nuai b é\n  3\nl\n  .mapear(x => x)'))).toEqual([]);
  });
  it('continua a linha quando a próxima começa com "."', () => {
    expect(statements('lista\n  .mapear(x => x)\n  .filtrar(x => x)')).toHaveLength(1);
  });
  it('aceita Allman em função, condicional, laço, classe e tenta_aí', () => {
    const text = 'faz_trem f()\n{\n  faz_favor 1\n}\nse_ocê_quiser (certeza)\n{\n}\nenquanto_tiver (de_jeito_nenhum)\n{\n}\nvai_indo (trem i é 0; i menor_que 1; i é i mais 1)\n{\n}\narruma_trem A inherda_de B\n{\n}\ntenta_aí\n{\n}\nse_der_ruim (e)\n{\n}';
    expect(codes(parseText(text))).toEqual([]);
  });
  it('termina composta no "}" sem ";" e aceita "faz_trem soma(a, b) { faz_favor a mais b }" em uma linha', () => {
    expect(statements('faz_trem soma(a, b) { faz_favor a mais b }')).toHaveLength(1);
    expect(codes(parseText('uai o é { a: 1 }\n[1]\nuai f é x => { faz_favor x }\n(2)'))).toEqual([]);
  });
  it('faz_favor seguido de quebra devolve nada', () => {
    expect(toSexp(parseText('faz_trem f() {\n  faz_favor\n  1\n}').program.body[0] ?? ({} as never))).toContain('ReturnStatement');
    expect(parseText('faz_trem f() {\n  faz_favor\n  1\n}').program.body).toHaveLength(1);
  });
  it('dá GS0202 quando a instrução simples não termina', () => {
    expect(codes(parseText('uai x é 1 2'))).toEqual(['GS0202']);
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/parser/statement-end.test.ts` — esperado: falha por `src/parser/parser.ts` inexistente.
- [ ] **1.3 Implementar o núcleo.** `precedence.constants.ts`:
```ts
export const PRECEDENCE = { assignment: 1, logicalOr: 3, logicalAnd: 4, equality: 8, relational: 9, additive: 11, multiplicative: 12, unary: 14, postfix: 17 } as const;
export const BINARY_OPERATORS: Readonly<Record<string, { readonly precedence: number; readonly logical?: boolean }>> = {
  '||': { precedence: PRECEDENCE.logicalOr, logical: true }, '&&': { precedence: PRECEDENCE.logicalAnd, logical: true },
  '===': { precedence: PRECEDENCE.equality }, '!==': { precedence: PRECEDENCE.equality },
  '<': { precedence: PRECEDENCE.relational }, '>': { precedence: PRECEDENCE.relational }, '<=': { precedence: PRECEDENCE.relational },
  '>=': { precedence: PRECEDENCE.relational }, instanceof: { precedence: PRECEDENCE.relational },
  '+': { precedence: PRECEDENCE.additive }, '-': { precedence: PRECEDENCE.additive },
  '*': { precedence: PRECEDENCE.multiplicative }, '/': { precedence: PRECEDENCE.multiplicative }, '%': { precedence: PRECEDENCE.multiplicative },
};
export const ALLOWED_SYMBOL_OPERATORS: ReadonlySet<string> = new Set(['+', '-', '*', '/', '%', '<', '>', '<=', '>=']);
```
`newline-context.ts`: `export type NewlineContext = 'statement' | 'grouping';`. `list-builder.ts` (única forma de acumular lista; o override do ESLint só libera `this.**`, então função livre nunca faz `push` em array local):
```ts
export class ListBuilder<T> {
  private readonly items: T[] = [];
  add(item: T): void { this.items.push(item); }
  build(): readonly T[] { return [...this.items]; }
}
```
`parser-state.ts` (classe com estado mutável só em `this.*`):
```ts
export class ParserState {
  private contexts: readonly NewlineContext[] = ['statement'];
  private readonly items: RawDiagnostic[] = [];
  cursor = 0;                       // cresce a cada advance; garante progresso na recuperação
  depth = 0;
  aborted = false;
  depthReported = false;
  constructor(readonly lexer: Lexer, readonly target: CompileTarget) {}

  get top(): NewlineContext { return this.contexts.at(-1) ?? 'statement'; }
  push(context: NewlineContext): void { this.contexts = [...this.contexts, context]; }
  pop(): void { this.contexts = this.contexts.slice(0, -1); }
  report(code: string, start: number, end: number, args: Readonly<Record<string, string>> = {}): void { this.items.push({ code, start, end, args }); }
  get reported(): readonly RawDiagnostic[] { return this.items; }

  // Token visível: em agrupamento a quebra é transparente.
  current(): Token { return this.top === 'grouping' ? this.skipNewlinesAt(0).token : this.lexer.peek(); }
  peekAfter(count: number): Token { /* count-ésimo token visível à frente */ }
  rawPeek(offset: number): Token { return this.lexer.peek(offset); }
  advance(): Token { const token = this.current(); this.consumeThrough(token); this.cursor += 1; return token; }
  skipNewlines(): void { while (this.lexer.peek().kind === 'newline') this.lexer.next(); }
}
```
`skipNewlinesAt(i)` percorre `lexer.peek(i)` pulando tokens `newline` (no máximo um por intervalo); `consumeThrough(token)` chama `lexer.next()` até consumir `token`. `expressions.ts` (Pratt, funções livres recebendo `parser: Parser`):
```ts
export function parseExpression(parser: Parser, minimum = 0): Expression {
  let left = parseUnary(parser);
  for (;;) {
    const operator = binaryOperatorAt(parser.state.current());       // { precedence, js, logical?, assignment? } | undefined
    if (operator === undefined || operator.precedence < Math.max(minimum, PRECEDENCE.assignment)) return left;
    const token = parser.state.advance();
    parser.state.skipNewlines();                                      // regra 1: operador no fim da linha
    const rightMinimum = operator.assignment ? operator.precedence : operator.precedence + 1;
    const right = parser.nested(left.start, () => parseExpression(parser, rightMinimum));
    left = parser.build(buildBinary(operator, token, left, right));
  }
}
```
com `binaryOperatorAt`: token `keyword` → `BINARY_OPERATORS[entry.js]` ou, se `entry.js === '='`, `{ precedence: PRECEDENCE.assignment, assignment: true }`; token `punctuator` em `ALLOWED_SYMBOL_OPERATORS` → tabela. `parseUnary`: `num_é` (`!`) e `menos` (`-`)/`-` → `UnaryExpression` com `parser.nested(token.start, () => parseExpression(parser, PRECEDENCE.unary))`; `espera_um_cadim` → `AwaitExpression`; senão `parsePostfix(parseOperand)`. `parsePostfix` repete: `(` → chamada (push `'grouping'`, argumentos separados por `,` com vírgula final, pop no `)`); `[` → índice (grouping); `.` → membro cujo nome aceita identificador **ou qualquer keyword** (vira `Identifier` sem `keywordToken`); regra 2: se o token cru atual é `newline` e `peek(1)` é `.`, consome a quebra e segue; cada nó de membro, chamada ou índice criado passa por `parser.build` (ciclo 6). Listas de argumentos, elementos, propriedades e parâmetros acumulam em `ListBuilder`; nenhuma função livre do parser faz `push` ou atribuição de propriedade em array/objeto local. `parseOperand`: literal (`number` → `Literal` numérico; `string`; `certeza`/`de_jeito_nenhum`/`nada`/`indefinido`), `ocê` → `ThisExpression`, `a_raiz` → `Super`, `faz_um` → `NewExpression` (callee = `parseMemberOnly`, argumentos opcionais), identificador e keyword contextual `de`/`em` → `Identifier`, `[` → lista (grouping), `{` → coisa (grouping, pares `chave: valor`, vírgula final; chave = identificador, keyword qualquer, texto ou número), `(` → agrupamento ou parâmetros de seta (ciclo 3); qualquer outro token → `parser.unexpected()` (GS0202, ou GS0201 em `end-of-file`) e `ErrorNode`.
`statements.ts`: `parseStatement(parser)` despacha por `token.keyword?.js`: `'const' | 'let'` → `parseVariableDeclaration`; `'function'` e `'async function'` → `parseFunctionDeclaration`; `'async'` seguido de `faz_trem`... (ver ciclo 3); `'class'` → `parseClass`; `'if'` → `parseIf`; `'while'`; `'for'`; `'break' | 'continue'`; `'return'`: sem argumento se o token visível é `newline`, `;`, `}` ou `end-of-file`; `'throw'` (vixe): `(` lista de expressões `)` → `ThrowStatement.arguments`; `'try'`; `{` em posição de instrução → `BlockStatement`; qualquer outra coisa → `ExpressionStatement`. `endSimpleStatement(parser)`: aceita `;`, `newline`, `}` (sem consumir) ou `end-of-file`; senão `parser.unexpected()` (GS0202) e `synchronize()`. Blocos: `parseBlock(parser)` faz `skipNewlinesBeforeBlock()` (estilo Allman: quebra seguida de `{`), `expect('{')`, `push('statement')`, laço de `parseStatement` até `}` (em `end-of-file` reporta GS0201 e para), `pop()`. `parseProgram`: laço que pula `newline` e `;`, chama `parseStatement` e, se `cursor` não mudou, avança um token e emite `ErrorNode`. `declarations.ts`: `parseVariableDeclaration` (nome via `parseBindingName`: identificador, keyword contextual ou keyword reservada → `Identifier` com `reservedKeyword`; `é` init opcional), `parseFunctionDeclaration`, `parseParameters` (`(` a, b, `)` com vírgula final; push grouping). `classes.ts`: `parseClass`: nome, `inherda_de` expressão opcional, `{` Allman, push `statement`, membros sem separador (pula `newline`): `aprepara_trem` → construtor; `num_muda` e `vai_na_frente` como prefixos; nome = qualquer palavra; parâmetros; bloco.
`parser.ts`: classe `Parser` com `state`, `enter()`/`leave()`/`nested(start, parse)`, `build(node)` e `abort(start)` (contratos no ciclo 6) e `unexpected()`; `parse(source, lexer, options)` monta `ParseResult`: `diagnostics` = lexer + parser ordenados por `start`; `incomplete = options.target === 'repl' && diagnostics.length > 0 && diagnostics.every(d => d.code === 'GS0201' || d.code === 'GS0106')`.
- [ ] **1.4 Rodar:** mesmo comando — esperado: 9 testes passam.

**Ciclo 2 — precedência e associatividade (Pratt)**
- [ ] **2.1 Teste (RED).** `tests/unit/parser/expressions.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const expressionOf = (text: string) => {
  const statement = parseText(text).program.body[0];
  return statement?.type === 'ExpressionStatement' ? toSexp(statement.expression) : 'não é expressão';
};

describe('parser: expressões (Pratt)', () => {
  it.each([
    ['a mais b vezes c', 'BinaryExpression[+](a, BinaryExpression[*](b, c))'],
    ['a vezes b mais c', 'BinaryExpression[+](BinaryExpression[*](a, b), c)'],
    ['a menos b menos c', 'BinaryExpression[-](BinaryExpression[-](a, b), c)'],
    ['a + b * c', 'BinaryExpression[+](a, BinaryExpression[*](b, c))'],
    ['a menor_que b e_mais c é_igualim d', 'LogicalExpression[&&](BinaryExpression[<](a, b), BinaryExpression[===](c, d))'],
    ['a ou_então b e_mais c', 'LogicalExpression[||](a, LogicalExpression[&&](b, c))'],
    ['num_é a é_igualim b', 'BinaryExpression[===](UnaryExpression[!](a), b)'],
    ['menos a vezes b', 'BinaryExpression[*](UnaryExpression[-](a), b)'],
    ['a é b é c', 'AssignmentExpression[=](a, AssignmentExpression[=](b, c))'],
    ['x é_tipo_de Pequi', 'BinaryExpression[instanceof](x, Pequi)'],
    ['a.b(c)[d].e', 'MemberExpression(MemberExpression(CallExpression(MemberExpression(a, b), c), d), e)'],
    ['faz_um Pequi("verde").nome', 'MemberExpression(NewExpression(Pequi, "verde"), nome)'],
    ['espera_um_cadim f(x) mais 1', 'BinaryExpression[+](AwaitExpression(CallExpression(f, x)), 1)'],
  ])('%s', (text, expected) => {
    expect(expressionOf(text)).toBe(expected);
  });
  it('aceita palavra goiana como nome de propriedade e de chave, preservando a grafia', () => {
    expect(codes(parseText('uai o é { de: "SP", mais: 1 }\nprosa(o.de, o.mais)'))).toEqual([]);
    expect(expressionOf('obj.mais')).toBe('MemberExpression(obj, mais)');
  });
  it('trata "de" e "em" como identificadores fora do cabeçalho do vai_indo', () => {
    expect(codes(parseText('uai de é 1\nuai em é 5\nvai_indo (uai x de de) { }\nvai_indo (uai k em em) { }'))).toEqual([]);
  });
  it('aceita vírgula final em lista, coisa, parâmetros e argumentos', () => {
    expect(codes(parseText('uai l é [1, 2,]\nuai o é { a: 1, }\nfaz_trem f(a, b,) { }\nf(1, 2,)'))).toEqual([]);
  });
});
```
(`toSexp` imprime `Literal` pelo `raw`, e o `raw` de um texto inclui as aspas; por isso a expectativa de `NewExpression` traz `"verde"` entre aspas duplas.)
- [ ] **2.2 Rodar:** `... exec vitest run tests/unit/parser/expressions.test.ts` — esperado: falha só no teste `trata "de" e "em" como identificadores fora do cabeçalho do vai_indo` (o cabeçalho `vai_indo` ainda não existe); os demais já passam com o núcleo do passo 1.3.
- [ ] **2.3 Implementar** `parseForHeader` em `statements.ts`: `vai_indo (` push `grouping`; se `uai`/`trem`, lê o nome e, **imediatamente depois dele**, se o token é keyword contextual `de`/`em` → `ForOfStatement`/`ForInStatement` (init sem `é`, `VariableDeclarator.init = null`); senão cabeçalho de três partes separadas por `;` (cada parte opcional); `)` pop; corpo via `parseBlock`. A tabela `PRECEDENCE` do passo 1.3 não muda: `é_tipo_de` (js `instanceof`) já está em `BINARY_OPERATORS` com `PRECEDENCE.relational` (9), e `espera_um_cadim` é tratado em `parseUnary` como `AwaitExpression` cujo argumento é `parseExpression(parser, PRECEDENCE.unary)` (14), de modo que `espera_um_cadim f(x) mais 1` vira `BinaryExpression[+](AwaitExpression(CallExpression(f, x)), 1)`.
- [ ] **2.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 3 — setas, GS0202/GS0204 e `vai_na_frente`**
- [ ] **3.1 Teste (RED).** `tests/unit/parser/arrows.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

const arrowOf = (text: string) => {
  const statement = parseText(text).program.body[0];
  return statement?.type === 'VariableDeclaration' ? toSexp(statement) : 'não é declaração';
};

describe('parser: setas', () => {
  it('lê seta de um parâmetro, de vários, com corpo-expressão e com bloco', () => {
    expect(arrowOf('uai f é x => x vezes 2')).toContain('ArrowFunctionExpression');
    expect(codes(parseText('uai g é (a, b) => { faz_favor a mais b }\nuai h é () => 1\nuai i é (a, b,) => a'))).toEqual([]);
    expect(codes(parseText('uai j é x => ({ nome: x })'))).toEqual([]);
  });
  it('lê vai_na_frente antes de seta e de faz_trem nomeada', () => {
    expect(codes(parseText('uai f é vai_na_frente x => x\nuai g é vai_na_frente (a, b) => { faz_favor a }\nvai_na_frente faz_trem h() { }\nvai_na_frente_faz_trem k() { }'))).toEqual([]);
    expect(arrowOf('uai f é vai_na_frente (a) => a')).toContain('ArrowFunctionExpression');
  });
  it('dá GS0204 para quebra entre parâmetros e "=>", dentro e fora de ( )', () => {
    expect(codes(parseText('uai f é x\n=> x'))).toEqual(['GS0204']);
    expect(codes(parseText('uai f é (a, b)\n=> a'))).toEqual(['GS0204']);
    expect(codes(parseText('prosa(x\n=> x)'))).toEqual(['GS0204']);
  });
  it('dá GS0202 para quebra entre vai_na_frente e o que vem depois', () => {
    expect(codes(parseText('vai_na_frente\nfaz_trem f() { }'))).toEqual(['GS0202']);
  });
  it('dá GS0202 para "5.com_casas(2)" (número literal seguido de ponto e nome)', () => {
    expect(codes(parseText('prosa(5.com_casas(2))'))).toEqual(['GS0202']);
    expect(codes(parseText('prosa((5).com_casas(2))'))).toEqual([]);
  });
});
```
- [ ] **3.2 Rodar:** `... exec vitest run tests/unit/parser/arrows.test.ts` — esperado: falha (setas ainda não existem).
- [ ] **3.3 Implementar.** No `parseOperand`: identificador seguido de `=>` visto **cruamente** (`rawPeek`) → seta de um parâmetro; se o cru for `newline` e o seguinte `=>` → `GS0204` (consome a quebra e segue). `(`: push `grouping`, lê lista de expressões (vazia e vírgula final permitidas), pop no `)`; depois do `)` olha cru como acima: `=>` (ou `newline` + `=>` com `GS0204`) → converte cada elemento em parâmetro (`Identifier`; outro nó vira `GS0202` no elemento) e lê o corpo, senão exige exatamente um elemento (`()` ou vírgula soltos dão `GS0202`). Isso é O(n): não há varredura à frente para achar o `)`. Corpo: `skipNewlines()` depois de `=>`; `{` → `parseBlock` (empilha `statement`), senão `parseExpression(parser, PRECEDENCE.assignment)`. `vai_na_frente`: se o cru seguinte é `newline` → `GS0202`; se o visível seguinte é `faz_trem` em posição de instrução → declaração async (`async: true`), senão seta com `async: true`. Em `parsePostfix`, depois de um `Literal` numérico, `.` colado (`token.start === literal.end`) seguido de nome → `GS0202` no `.nome`.
- [ ] **3.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 4 — continuações por palavra, GS0205 e o alvo `repl`**
- [ ] **4.1 Teste (RED).** `tests/unit/parser/continuations.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';
import { toSexp } from '../../support/sexp.ts';

describe('parser: continuação por palavra (§4.6, regra 4)', () => {
  it('continua se_ocê_quiser com se_num_for e se_não, na linha do "}" ou na seguinte, com comentário e linha em branco', () => {
    const text = 'se_ocê_quiser (a) { } se_não { }\nse_ocê_quiser (a) { }\n\n// c\nse_num_for (b) { }\nse_não { }';
    const result = parseText(text);
    expect(codes(result)).toEqual([]);
    expect(result.program.body).toHaveLength(2);
    expect(toSexp(result.program.body[1] ?? result.program)).toContain('IfStatement');
  });
  it('continua tenta_aí com se_der_ruim e por_fim em linhas separadas, com e sem parâmetro', () => {
    expect(codes(parseText('tenta_aí { }\nse_der_ruim (erro) { }\npor_fim { }'))).toEqual([]);
    expect(codes(parseText('tenta_aí { } se_der_ruim { }'))).toEqual([]);
    expect(codes(parseText('tenta_aí { }\npor_fim { }'))).toEqual([]);
  });
  it('exige se_der_ruim ou por_fim depois de tenta_aí (GS0202)', () => {
    expect(codes(parseText('tenta_aí { }'))).toEqual(['GS0202']);
  });
  it('qualquer outra palavra depois do "}" deixa a quebra terminar a instrução', () => {
    const result = parseText('se_ocê_quiser (a) { }\nprosa(1)');
    expect(result.program.body).toHaveLength(2);
    expect(codes(result)).toEqual([]);
  });
  it.each(['se_não { }', 'se_num_for (a) { }', 'se_der_ruim (e) { }', 'por_fim { }'])('%s solto é GS0205', (text) => {
    expect(codes(parseText(text))).toEqual(['GS0205']);
  });
  it('no alvo repl a palavra de continuação em linha nova dá GS0205 (§6.2)', () => {
    expect(codes(parseText('se_ocê_quiser (a) { }\nse_não { }', 'repl'))).toEqual(['GS0205']);
    expect(codes(parseText('se_ocê_quiser (a) { } se_não { }', 'repl'))).toEqual([]);
  });
  it('dá GS0203 quando a linha começa com operador binário, símbolo ou palavra', () => {
    expect(codes(parseText('uai a é 1\nmais 2'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\ne_mais x'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\n* 2'))).toEqual(['GS0203']);
    expect(codes(parseText('uai a é 1\nmenos 2'))).toEqual([]);
  });
});
```
- [ ] **4.2 Rodar:** `... exec vitest run tests/unit/parser/continuations.test.ts` — esperado: falha (continuações e GS0203/GS0205 ainda não existem).
- [ ] **4.3 Implementar** em `recovery.ts`/`statements.ts`:
```ts
export function continuesWith(parser: Parser, allowed: ReadonlySet<string>): boolean {
  const state = parser.state;
  const sameLine = state.rawPeek(0);
  if (isContinuation(sameLine, allowed)) return true;
  if (state.target === 'repl' || sameLine.kind !== 'newline') return false;
  if (!isContinuation(state.rawPeek(1), allowed)) return false;
  state.skipNewlines();            // o lexer junta linhas em branco e comentários em um só newline
  return true;
}
const isContinuation = (token: Token, allowed: ReadonlySet<string>): boolean => token.kind === 'keyword' && allowed.has(token.keyword?.js ?? '');
```
Conjuntos: `se_ocê_quiser`/`se_num_for` → `{'else if', 'else'}`; `tenta_aí` → `{'catch', 'finally'}`; depois de `se_der_ruim` → `{'finally'}`. `parseIf` encadeia `se_num_for` como `IfStatement` aninhado em `alternate`. `parseTry` exige um dos dois, senão `GS0202`. `parseStatement` em `else if | else | catch | finally` (início de instrução) → `GS0205` com `{ found: texto }`, consome a palavra e a cláusula (parênteses opcionais e bloco, via `parseBlock`) e devolve `ErrorNode`. `GS0203`: `parseStatement` em token `punctuator` de `BINARY_OPERATORS` (exceto `-`) ou keyword de operador binário (exceto `menos`) → `GS0203`, consome o token e `synchronize()` até o fim da linha.
- [ ] **4.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 5 — recuperação: vários diagnósticos, `incomplete`, profundidade**
- [ ] **5.1 Teste (RED).** `tests/unit/parser/recovery.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: recuperação', () => {
  it('reporta vários erros no mesmo arquivo e segue parseando (Review Focus 2)', () => {
    const result = parseText('uai a é 1 2\nuai b é )\nse_não { }\nuai c é 3\nprosa(c)');
    expect(codes(result)).toEqual(['GS0202', 'GS0202', 'GS0205']);
    expect(result.program.body.filter((node) => node.type === 'VariableDeclaration').length).toBeGreaterThanOrEqual(2);
    expect(result.program.body.some((node) => node.type === 'ErrorNode')).toBe(true);
  });
  it('ordena os diagnósticos por posição, inclusive os do lexer', () => {
    const result = parseText('uai a é "oi\nuai b é 08\nuai c é )');
    const starts = result.diagnostics.map((diagnostic) => diagnostic.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
    expect(codes(result)).toEqual(['GS0103', 'GS0101', 'GS0202']);
  });
  it('nunca lança e sempre progride, com lixo arbitrário', () => {
    for (const text of [')))', '}}}', 'uai', 'uai é', '(', '[', '{', 'faz_trem', 'a mais', '=> =>', '. . .']) {
      expect(() => parseText(text)).not.toThrow();
    }
  });
  it('liga incomplete só no alvo repl e só com GS0201 ou GS0106', () => {
    const incompletes = ['se_ocê_quiser (a) {', 'uai x é (1', 'uai l é [1,', 'uai x é 1 mais', 'uai x é 1 é', 'lista.', 'uai f é x =>', '/* aberto'];
    expect(incompletes.map((text) => parseText(text, 'repl').incomplete)).toEqual(incompletes.map(() => true));
    expect(parseText('uai x é 1 mais', 'module').incomplete).toBe(false);
    expect(parseText('uai x é "aberto', 'repl').incomplete).toBe(false);
    expect(parseText('uai x é )', 'repl').incomplete).toBe(false);
  });
  it('dá GS0201 no fim da entrada dentro de bloco, parênteses e lista', () => {
    expect(codes(parseText('se_ocê_quiser (a) {'))).toEqual(['GS0201']);
    expect(codes(parseText('prosa(1,'))).toEqual(['GS0201']);
  });
});
```
- [ ] **5.2 Rodar:** `... exec vitest run tests/unit/parser/recovery.test.ts` — esperado: falha (a ressincronização e o `incomplete` ainda não cobrem todos os casos).
- [ ] **5.3 Implementar `recovery.ts`**:
```ts
const STATEMENT_START: ReadonlySet<string> = new Set(['const', 'let', 'function', 'async', 'async function', 'class', 'if', 'for', 'while', 'break', 'continue', 'return', 'throw', 'try']);

export function synchronize(parser: Parser): void {
  const state = parser.state;
  for (;;) {
    const token = state.rawPeek(0);
    const atStatementStart = token.kind === 'keyword' && STATEMENT_START.has(token.keyword?.js ?? '');
    if (token.kind === 'end-of-file' || atStatementStart || (state.top === 'statement' && token.kind === 'newline') || (token.kind === 'punctuator' && token.value === '}')) return;
    state.advance();
  }
}
```
`Parser.unexpected()`: se o token visível é `end-of-file` → `GS0201`; senão `GS0202` com `{ found: token.text }`, `ErrorNode` cobrindo o token e **consome um token** quando `synchronize` não avançaria (garantia de progresso: laços de `parseProgram` e de bloco comparam `cursor` antes/depois). `parseProgram` e `parseBlock` chamam `synchronize` depois de cada `ErrorNode`.
- [ ] **5.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 6 — entrada enorme ou muito aninhada (Review Focus 4)**
- [ ] **6.1 Teste (RED).** `tests/unit/parser/limits.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

const HUGE = 100_000;
const MAX_MILLISECONDS = 1_000;

describe('parser: limites de profundidade (Review Focus 4)', () => {
  it.each([
    ['parênteses', '('.repeat(HUGE)],
    ['colchetes', '['.repeat(HUGE)],
    ['chaves de coisa', 'uai o é ' + '{ a: '.repeat(HUGE)],
    ['blocos', 'se_ocê_quiser (certeza) {\n'.repeat(HUGE)],
    ['cadeia à esquerda de operadores', '1' + ' mais 1'.repeat(HUGE)],
    ['cadeia de membros', 'a' + '.a'.repeat(HUGE)],
    ['cadeia de chamadas', 'f' + '()'.repeat(HUGE)],
    ['setas aninhadas', 'uai f é ' + 'x => '.repeat(HUGE) + '1'],
  ])('não lança nem estoura a pilha com %s e dá GS0522 uma vez', (_name, text) => {
    const started = performance.now();
    const result = parseText(text);
    expect(codes(result).filter((code) => code === 'GS0522')).toHaveLength(1);
    expect(performance.now() - started).toBeLessThan(MAX_MILLISECONDS);
  });
  it('aceita aninhamento até o limite e recusa acima dele', () => {
    expect(codes(parseText('uai x é ' + '('.repeat(150) + '1' + ')'.repeat(150)))).toEqual([]);
    expect(codes(parseText('uai x é ' + '('.repeat(250) + '1' + ')'.repeat(250)))).toContain('GS0522');
  });
  it('lê 100 mil espaços e 10 mil linhas dentro do teto', () => {
    expect(codes(parseText(' '.repeat(HUGE)))).toEqual([]);
    expect(codes(parseText('prosa(1)\n'.repeat(10_000)))).toEqual([]);
  });
});
```
- [ ] **6.1b Teste (RED): profundidade efetiva da árvore.** O laço de Pratt é iterativo, mas `1 mais 1 mais …`, `a.a.a…` e `f()()()…` produzem árvore esquerda profunda, e os visitantes recursivos posteriores (`walk`, análise, geração) estourariam a pilha, trocando o GS0522 por GS0901. `tests/unit/parser/chain-depth.test.ts`:
```ts
import { LIMITS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { codes, parseText } from '../../support/parse.ts';

const HUGE = 100_000;
const MAX = LIMITS.maxNestingDepth;
const MAX_VISITED_NODES = MAX * 5;

const CHAINS: readonly (readonly [string, (count: number) => string])[] = [
  ['cadeia à esquerda de operadores', (count) => `1${' mais 1'.repeat(count)}`],
  ['cadeia de membros', (count) => `a${'.a'.repeat(count)}`],
  ['cadeia de chamadas', (count) => `f${'()'.repeat(count)}`],
  ['cadeia de índices', (count) => `a${'[0]'.repeat(count)}`],
];
const RIGHT_NESTED: readonly (readonly [string, (count: number) => string])[] = [
  ['atribuições à direita', (count) => `${'a é '.repeat(count)}a`],
  ['negações empilhadas', (count) => `${'menos '.repeat(count)}1`],
];

const visitedNodes = (text: string): number => {
  let visited = 0;
  walk(parseText(text).program, () => { visited += 1; });
  return visited;
};

describe('parser: profundidade efetiva das cadeias (§5.4)', () => {
  it.each(CHAINS)('%s: aceita até o limite sem diagnóstico e recusa um nível a mais com um GS0522', (_name, build) => {
    expect(codes(parseText(build(MAX - 1)))).toEqual([]);
    expect(codes(parseText(build(MAX)))).toEqual([]);
    expect(codes(parseText(build(MAX + 1)))).toEqual(['GS0522']);
  });
  it.each(CHAINS)('%s: 100 mil níveis dão exatamente um GS0522, sem lançar, e o walk não estoura', (_name, build) => {
    const result = parseText(build(HUGE), 'repl');
    expect(codes(result)).toEqual(['GS0522']);
    expect(result.incomplete).toBe(false);
    expect(visitedNodes(build(HUGE))).toBeLessThan(MAX_VISITED_NODES);
  });
  it.each(RIGHT_NESTED)('%s: aceita até o limite e, com 100 mil, dá um GS0522 e o walk não estoura', (_name, build) => {
    expect(codes(parseText(build(MAX)))).toEqual([]);
    expect(codes(parseText(build(HUGE))).filter((code) => code === 'GS0522')).toHaveLength(1);
    expect(visitedNodes(build(HUGE))).toBeLessThan(MAX_VISITED_NODES);
  });
  it('soma a cadeia de chamadas com a de operadores sobre o mesmo nó', () => {
    const call = (operators: number) => `f${'()'.repeat(MAX - 50)}${' mais 1'.repeat(operators)}`;
    expect(codes(parseText(call(50)))).toEqual([]);
    expect(codes(parseText(call(51)))).toEqual(['GS0522']);
  });
  it('conta o aninhamento de fora junto com a cadeia de dentro', () => {
    const inner = `1${' mais 1'.repeat(MAX - 10)}`;
    expect(codes(parseText(`(${inner})`))).toEqual([]);
    expect(codes(parseText(`${'('.repeat(11)}${inner}${')'.repeat(11)}`))).toEqual(['GS0522']);
  });
  it('troca só a subárvore excedente por ErrorNode e segue parseando o resto do arquivo', () => {
    const result = parseText(`uai a é 1${' mais 1'.repeat(MAX + 1)}\nuai b é 2\nprosa(b)`);
    expect(codes(result)).toEqual(['GS0522']);
    expect(result.program.body.map((node) => node.type)).toEqual(['VariableDeclaration', 'VariableDeclaration', 'ExpressionStatement']);
  });
});
```
- [ ] **6.2 Rodar:** `... exec vitest run tests/unit/parser/limits.test.ts tests/unit/parser/chain-depth.test.ts` — esperado: falha (estouro de pilha `RangeError` no `walk`, ausência de GS0522 ou mais de um GS0522) até a altura efetiva existir.
- [ ] **6.3 Implementar.** `Parser` guarda `private readonly heights = new WeakMap<AstNode, number>()`: a altura de um nó é 1 mais a maior altura de seus filhos (folhas e nós não registrados valem 0). Contratos:
```ts
enter(): boolean { this.state.depth += 1; return this.state.depth <= LIMITS.maxNestingDepth; }
leave(): void { this.state.depth -= 1; }

nested(start: number, parse: () => Expression): Expression {
  if (this.enter()) {
    const result = parse();
    this.leave();
    return result;
  }
  this.leave();
  return this.abort(start);
}

// Altura = níveis empilhados a partir da folha mais funda; o excedente vira ErrorNode.
build(node: Expression): Expression {
  let tallest = 0;
  forEachChild(node, (child) => { tallest = Math.max(tallest, this.heights.get(child) ?? 0); });
  const height = tallest + 1;
  if (this.state.depth + height > LIMITS.maxNestingDepth) {
    this.reportDepth(node.start, node.end);
    return { type: 'ErrorNode', code: 'GS0522', start: node.start, end: node.end };
  }
  this.heights.set(node, height);
  return node;
}

abort(start: number): ErrorNode {
  const end = this.state.rawPeek(0).end;
  this.reportDepth(start, end);
  this.state.aborted = true;
  while (this.state.rawPeek(0).kind !== 'end-of-file') this.state.advance();
  return { type: 'ErrorNode', code: 'GS0522', start, end };
}

private reportDepth(start: number, end: number): void {
  if (this.state.depthReported) return;
  this.state.depthReported = true;
  this.state.report('GS0522', start, end, { limit: String(LIMITS.maxNestingDepth) });
}
```
`parseOperand`/`parseStatement` chamam `nested` ao entrar em `(`, `[`, `{`, seta e bloco, e `parsePostfix` ao abrir os argumentos de chamada e o índice; o operando direito do laço de Pratt e o argumento de `parseUnary` também passam por `nested`, o que cobre atribuições à direita e prefixos empilhados (recursão nativa do próprio parser). Todo nó de expressão com filhos (binário, lógico, atribuição, unário, `espera_um_cadim`, membro, chamada, índice, `faz_um`, lista, coisa, seta) é criado por `parser.build`, o que cobre cadeias à esquerda: ao passar de `LIMITS.maxNestingDepth` níveis, o nó vira `ErrorNode` de altura 0, o `GS0522` sai uma única vez (`depthReported`) e o parse continua sem consumir o resto, então `incomplete` segue `false` quando o resto parseia. `abort` fica só para recursão nativa profunda: marca `aborted` e todos os laços de parse checam `state.aborted` para sair. Corpo de bloco de seta conta pelo `state.depth` de `parseBlock`, sem altura própria; a soma continua abaixo de `2 × maxNestingDepth`, seguro para a pilha.
- [ ] **6.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/parser tests/unit/ast` — esperado: todos passam.
- [ ] **7. Limpeza (de-sloppify)**: funções < 50 linhas, nesting ≤ 4, arquivos ≤ 400 linhas (`statements.ts` e `expressions.ts` se aproximam; extrair `parseTry`/`parseFor` para `declarations.ts` se passar), sem `any`; `corepack pnpm verify` verde (o lint inclui `functional/immutable-data`: fora de `this.**`, nada de `push` nem atribuição de propriedade em array/objeto local; listas via `ListBuilder`).
- [ ] **8. Commit:** `git add packages/compiler && git commit -m "feat(compiler): adiciona parser resiliente com contextos de fim de instrução"`

---

### U2-06: Parser, diagnósticos de subconjunto e de JavaScript
**Spec:** §4.7, §4.8, §4.4, §5.4, §4.11, Review Focus 2 · **Tier:** large · **Depende de:** U2-05 · **Risco:** diagnóstico em cascata esconde o erro real, ou palavra goiana legítima disparar GS04xx/GS05xx · **Rollback:** reverter o commit (só acrescenta ramos de erro; o caminho válido do parser não muda)
**Files:**
- Create: `packages/compiler/src/parser/subset-checks.ts`
- Modify: `packages/compiler/src/parser/{expressions.ts,statements.ts,declarations.ts,classes.ts,parser.ts}`
- Test: `packages/compiler/tests/unit/parser/{javascript-habits.test.ts,subset.test.ts,statement-diagnostics.test.ts}`
**Interfaces:** Consumes: `lookupJsReserved`, `lookupKeyword`, `lookupRetiredWord`, `lookupStdlibGlobal` (U2-01); catálogo GS02xx/GS04xx/GS05xx (U2-03); `Parser`, `ParserState`, `rescanAsRegex` (U2-04/05). Produces: o mesmo `parse(...)` com os códigos GS0206–GS0209, GS0306 (início de instrução), GS0401, GS0404, GS0500–GS0523 do parser; nós de erro tratados como válidos para a recuperação (nunca exceção).
**Aceite:** toda construção da §4.7 "Fora" tem seu código; o arquivo com hábitos de JavaScript dá um diagnóstico por problema, na ordem; `uai vazio é 0` e `uai se é 1` compilam sem diagnóstico (P13).

**Tabelas de `subset-checks.ts`** (dados completos; funções logo abaixo):
```ts
export const SUBSET_BY_WORD: Readonly<Record<string, string>> = {
  switch: 'GS0505', do: 'GS0506', typeof: 'GS0512', delete: 'GS0513', void: 'GS0514', import: 'GS0515', export: 'GS0515',
  yield: 'GS0511', with: 'GS0500', debugger: 'GS0500',
};
export const JS_OPERATOR_FORMS: Readonly<Record<string, string>> = {
  '=': 'é', '==': 'é_igualim', '===': 'é_igualim', '!=': 'diferente', '!==': 'diferente', '&&': 'e_mais', '||': 'ou_então', '!': 'num_é',
  '++': 'i é i mais 1', '--': 'i é i menos 1', '+=': 'i é i mais 1', '-=': 'i é i menos 1', '*=': 'i é i vezes 2', '/=': 'i é i dividido 2',
  '%=': 'i é i sobrou 2', '**': 'Conta.elevado',
};
export const OUT_OF_V3_OPERATORS: ReadonlySet<string> = new Set(['?', '?.', '??', '&', '|', '^', '~', '<<', '>>', '>>>', '&=', '|=', '^=', '??=', '&&=', '||=', '<<=', '>>=', '>>>=', '**=']);
export const PUNCTUATOR_FORMS = { spread: '...', private: '#' } as const;
```
Funções (cada uma ≤ 15 linhas; chamadas nos pontos de gancho):
```ts
// Palavra do JS em posição de sintaxe: devolve o token já visto como a keyword goiana, ou undefined.
export function reportJsWord(parser: Parser, token: Token): Token | undefined {
  const code = SUBSET_BY_WORD[token.value];
  if (code !== undefined) { parser.state.report(code, token.start, token.end, { name: token.value }); return undefined; }
  const reserved = lookupJsReserved(token.value);
  if (reserved === undefined || !reserved.hasEquivalent || reserved.kind === 'global') return undefined;
  parser.state.report('GS0401', token.start, token.end, { name: token.value, suggestion: reserved.suggestion });
  const entry = lookupKeyword(reserved.suggestion);
  return entry === undefined ? undefined : { ...token, kind: 'keyword', keyword: entry };
}
// Operador do JS usado no lugar do goiano: reporta e devolve o precedence equivalente.
export function reportJsOperator(parser: Parser, token: Token): boolean {
  const suggestion = JS_OPERATOR_FORMS[token.value];
  if (suggestion !== undefined) { parser.state.report('GS0404', token.start, token.end, { name: token.value, suggestion }); return true; }
  if (!OUT_OF_V3_OPERATORS.has(token.value)) return false;
  parser.state.report('GS0523', token.start, token.end, { name: token.value, ...(token.value === '?' ? { suggestion: 'se_ocê_quiser' } : {}) });
  return true;
}
```
**Pontos de gancho (onde cada código é emitido):**
1. `parseStatement`, ramo de `Identifier` no início de instrução: `reportJsWord`; se devolver token-keyword, despacha como a keyword goiana (continua o parse: `const x = 1` dá GS0401 em `const` **e** GS0404 em `=`). `presta_serviço soma(a, b)`: quando o fim da instrução falharia (GS0202) e a expressão é um `Identifier` com `lookupRetiredWord(name)` → `GS0306` com `{ word, replacement }` ou `{ word, gone: 'saiu da linguagem, sem substituto na v3' }` no lugar do GS0202. Nunca reserva a palavra: `uai vazio é 0` não passa por aqui.
2. `parseOperand`: identificador-palavra do JS em operando (`this`, `new`, `true`, `null`, `undefined`, `function`, `async`, `await`, `typeof`…) → `reportJsWord`; `template` → `GS0501` (consome o token); `/` ou `/=` em posição de operando → `lexer.rescanAsRegex(token)` e `GS0502` no token devolvido (sem `/` de fechamento, GS0502 cobre só a `/`, e `synchronize()` até a quebra); `number` com `numberForm` diferente de `decimal` → `GS0517`; `...` → `GS0504`; `#` → `GS0510`; `faz_trem` → `GS0518` (lê a função para recuperar e devolve `ErrorNode`); `vixe` em operando → `GS0206` (lê `( args )`, devolve `ErrorNode`).
3. `binaryOperatorAt` (Pratt): token `punctuator` com `reportJsOperator` verdadeiro → trata como o operador equivalente (`=`/`==`/`===`/`&&`/`||`/`**` e compostos como binário ou atribuição de mesma precedência; `?` consome `consequente :`, `alternativo` para não cascatear; `?.` como `.`; `,` fora de lista de argumentos → `GS0523`). `!`, `++`, `--` prefixos entram em `parseUnary`.
4. `parseBlock`: se o token visível não é `{` → `GS0207` (cobre o token) e lê **uma** instrução como corpo (`BlockStatement` com `synthetic: true`); vale para `se_ocê_quiser`, `se_num_for`, `se_não`, `vai_indo`, `enquanto_tiver`, `tenta_aí`, `se_der_ruim`, `por_fim`, função, método e classe.
5. `parseVariableDeclaration` e `parseParameters`: `[`/`{` no lugar do nome → `GS0503` (consome o agrupamento balanceado por contagem, sem recursão); `:` depois do nome → `GS0516` (consome `: palavra`); `uai`/`trem` seguido de keyword reservada → `Identifier.reservedKeyword`.
6. `endSimpleStatement` e `parseReturn`: vírgula decimal. Se o token visível é `,` colado em um `number` anterior e o `number` seguinte começa em `vírgula.end`, `GS0208` com `{ suggestion: anterior.text + '.' + seguinte.text }`, consome os dois e aceita o fim.
7. `parseThrow`: `arguments.length !== 1` → `GS0206`; token seguinte na mesma linha que não é terminador (`vixe("a") mais "b"`) → `GS0206` e `synchronize()`.
8. `parseExpression`, atribuição: lado esquerdo que não é `Identifier`/`MemberExpression` → `GS0209` no lado esquerdo.
9. `parseStatement` com identificador seguido de `:` (rótulo) → `GS0507`; `switch`/`do` etc. vêm da tabela `SUBSET_BY_WORD` (consome a palavra e o cabeçalho `( … )` e o bloco `{ … }` por contagem, para não cascatear).
10. `classes.ts`: membro `get`/`set` seguido de nome e `(` → `GS0508`; nome seguido de `é`/`=`/`;`/quebra (campo) → `GS0509`; `#nome` → `GS0510`; `*` depois de `faz_trem` → `GS0511`.
11. Coisa literal: chave seguida de `,` ou `}` → `GS0519`; chave seguida de `(` → `GS0520`; `[` no lugar da chave → `GS0521`.

**Ciclo 1 — tabela de diagnósticos de subconjunto**
- [ ] **1.1 Teste (RED).** `tests/unit/parser/subset.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '@goiasscript/language';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: fora do subconjunto (§4.7)', () => {
  it.each([
    ['uai t é `oi ${1}`', ['GS0501']],
    ['uai r é /ab+/g', ['GS0502']],
    ['uai r é /"/', ['GS0502']],
    ['uai r é /a\\//', ['GS0502']],
    ['uai r é /=abc/', ['GS0502']],
    ['uai r é /abc', ['GS0502']],
    ['uai m é a / b / c', []],
    ['uai [a, b] é lista', ['GS0503']],
    ['uai { a } é coisa', ['GS0503']],
    ['prosa(...lista)', ['GS0504']],
    ['switch (x) { }', ['GS0505']],
    ['do { } while (certeza)', ['GS0506']],
    ['rotulo: prosa(1)', ['GS0507']],
    ['uai f é x => { a: x }', ['GS0507']],
    ['arruma_trem A {\n  get x() { faz_favor 1 }\n}', ['GS0508']],
    ['arruma_trem A {\n  x é 1\n}', ['GS0509']],
    ['arruma_trem A {\n  #x\n}', ['GS0510']],
    ['faz_trem* f() { }', ['GS0511']],
    ['prosa(typeof 1)', ['GS0512']],
    ['delete o.a', ['GS0513']],
    ['prosa(void 0)', ['GS0514']],
    ['import x from "y"', ['GS0515']],
    ['export uai x é 1', ['GS0515']],
    ['uai x: texto é "a"', ['GS0516']],
    ['uai n é 0xff', ['GS0517']],
    ['uai n é 1_000', ['GS0517']],
    ['uai n é 10n', ['GS0517']],
    ['uai f é faz_trem(x) { faz_favor x }', ['GS0518']],
    ['uai o é { x }', ['GS0519']],
    ['uai o é { f() { } }', ['GS0520']],
    ['uai o é { [k]: 1 }', ['GS0521']],
    ['uai x é a ?? b', ['GS0523']],
    ['uai x é a ? b : c', ['GS0523']],
    ['uai x é a?.b', ['GS0523']],
    ['debugger', ['GS0500']],
  ])('%j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('todo código de subconjunto usado existe no catálogo, nos dois tons', () => {
    const used = ['GS0500', 'GS0501', 'GS0502', 'GS0503', 'GS0504', 'GS0505', 'GS0506', 'GS0507', 'GS0508', 'GS0509', 'GS0510', 'GS0511', 'GS0512', 'GS0513', 'GS0514', 'GS0515', 'GS0516', 'GS0517', 'GS0518', 'GS0519', 'GS0520', 'GS0521', 'GS0523'];
    expect(used.filter((code) => lookupDiagnostic(code) === undefined)).toEqual([]);
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/parser/subset.test.ts` — esperado: falha (hoje todos dão `GS0202`).
- [ ] **1.3 Implementar** `subset-checks.ts` (tabelas e funções acima) e os ganchos 2, 5, 9, 10 e 11 da lista.
- [ ] **1.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 2 — JS com forma goiana (GS0401, GS0404) e hábito de JavaScript (Review Focus 2)**
- [ ] **2.1 Teste (RED).** `tests/unit/parser/javascript-habits.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: hábito de JavaScript', () => {
  it.each([
    ['const x é 1', ['GS0401']],
    ['uai x = 1', ['GS0404']],
    ['var x = 1', ['GS0401', 'GS0404']],
    ['function soma(a, b) { return a + b }', ['GS0401', 'GS0401']],
    ['se_ocê_quiser (a == b) { }', ['GS0404']],
    ['se_ocê_quiser (a === b && c || !d) { }', ['GS0404', 'GS0404', 'GS0404', 'GS0404']],
    ['i++', ['GS0404']],
    ['i += 1', ['GS0404']],
    ['uai x é 2 ** 3', ['GS0404']],
    ['if (a) { }', ['GS0401']],
  ])('%j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('dá vários diagnósticos goianos no mesmo arquivo, na ordem, nunca exceção nem só o primeiro', () => {
    const text = 'var total = 0\nfunction soma(a, b) {\n  return a + b\n}\nif (total == 1) {\n  console.log(total);\n}\nprosa(lista.length);;';
    const result = parseText(text);
    const found = result.diagnostics.map((diagnostic) => diagnostic.code);
    expect(found.slice(0, 4)).toEqual(['GS0401', 'GS0404', 'GS0401', 'GS0401']);
    expect(found.length).toBeGreaterThanOrEqual(6);
    const starts = result.diagnostics.map((diagnostic) => diagnostic.start);
    expect(starts).toEqual([...starts].sort((left, right) => left - right));
  });
  it('não dá GS04xx para palavra goiana nem para nome comum', () => {
    expect(codes(parseText('uai lista é [1]\nuai e é 2\nuai fazer é 3'))).toEqual([]);
  });
});
```
(`console` e `.length` não são do parser: GS0403 e GS0405 vêm da análise, U2-07; por isso o teste só fixa os quatro primeiros códigos e conta o total mínimo.)
- [ ] **2.2 Rodar:** `... exec vitest run tests/unit/parser/javascript-habits.test.ts` — esperado: falha (hoje `GS0202`).
- [ ] **2.3 Implementar** os ganchos 1, 3 e 8 (palavras do JS no início de instrução, operadores com forma goiana, alvo de atribuição) e o `;` sobrando (`;;`) como instrução vazia aceita.
- [ ] **2.4 Rodar:** mesmo comando — esperado: passa.

**Ciclo 3 — diagnósticos de instrução: `vixe`, corpo sem chaves, vírgula decimal, alvo, P13**
- [ ] **3.1 Teste (RED).** `tests/unit/parser/statement-diagnostics.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { codes, parseText } from '../../support/parse.ts';

describe('parser: diagnósticos de instrução', () => {
  it.each([
    ['uai f é x => { vixe("a") }', []],
    ['uai f é x => vixe("a")', ['GS0206']],
    ['uai a é b ou_então vixe("b")', ['GS0206']],
    ['vixe("a", "b")', ['GS0206']],
    ['vixe()', ['GS0206']],
    ['vixe("a") mais "b"', ['GS0206']],
    ['tenta_aí { } se_der_ruim (erro) { vixe(erro) }', []],
    ['vixe(faz_um Erro("a"))', []],
  ])('vixe: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it.each([
    ['se_ocê_quiser (a) prosa(a)', ['GS0207']],
    ['enquanto_tiver (a) a é a menos 1', ['GS0207']],
    ['vai_indo (uai x de l) prosa(x)', ['GS0207']],
    ['faz_trem f() faz_favor 1', ['GS0207']],
    ['tenta_aí prosa(1)', ['GS0207', 'GS0202']],
  ])('corpo sem chaves: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('mantém o corpo-expressão de seta sem chaves e dá a dica de parênteses no rótulo', () => {
    expect(codes(parseText('uai f é x => x vezes 2'))).toEqual([]);
    expect(codes(parseText('uai f é x => { nome: x }'))).toEqual(['GS0507']);
  });
  it.each([
    ['uai preço é 10,50', ['GS0208']],
    ['faz_trem f() { faz_favor 10,50 }', ['GS0208']],
    ['10,50', ['GS0208']],
    ['uai l é [1,2,3]\nsoma(2,3)\nuai pi é 3.141', []],
  ])('vírgula decimal: %j dá %j', (text, expected) => {
    expect(codes(parseText(text))).toEqual(expected);
  });
  it('dá GS0209 para alvo de atribuição inválido e aceita nome e membro', () => {
    expect(codes(parseText('1 é x'))).toEqual(['GS0209']);
    expect(codes(parseText('f() é 2'))).toEqual(['GS0209']);
    expect(codes(parseText('ocê.campo é 1\nlista[0] é 2\nx é 3'))).toEqual([]);
  });
  it('dá GS0306 para palavra aposentada no início de instrução, sem reservá-la (P13)', () => {
    const result = parseText('presta_serviço soma(a, b) { faz_favor a mais b }');
    expect(result.diagnostics[0]).toMatchObject({ code: 'GS0306', args: { word: 'presta_serviço', replacement: 'faz_trem' } });
    expect(codes(parseText('uai vazio é 0'))).toEqual([]);
    expect(codes(parseText('uai se é 1'))).toEqual([]);
    expect(codes(parseText('uai lista é [1]'))).toEqual([]);
    expect(parseText('um_tanto_de x').diagnostics[0]).toMatchObject({ code: 'GS0306', args: { gone: 'saiu da linguagem, sem substituto na v3' } });
  });
  it('mantém a seta async e dá GS0518 para faz_trem sem nome como valor (P6)', () => {
    expect(codes(parseText('uai f é vai_na_frente x => x'))).toEqual([]);
    expect(codes(parseText('uai f é faz_trem() { }'))).toEqual(['GS0518']);
  });
});
```
- [ ] **3.2 Rodar:** `... exec vitest run tests/unit/parser/statement-diagnostics.test.ts` — esperado: falha nos casos de `vixe`, GS0207, GS0208, GS0209 e GS0306.
- [ ] **3.3 Implementar** os ganchos 4, 6, 7, 8 e a parte de `retiredWords` do gancho 1. Para `tenta_aí prosa(1)`, `GS0207` cobre o corpo e o `GS0202` seguinte vem da exigência de `se_der_ruim`/`por_fim`.
- [ ] **3.4 Rodar:** `corepack pnpm --filter @goiasscript/compiler exec vitest run tests/unit/parser` — esperado: todos passam (inclusive os de U2-05, que não podem regredir).
- [ ] **4. Limpeza (de-sloppify)**: nenhum ramo de erro com `any`, nenhum gancho que lance exceção, `subset-checks.ts` < 400 linhas, funções < 50 linhas; `corepack pnpm verify` verde.
- [ ] **5. Commit:** `git add packages/compiler && git commit -m "feat(compiler): adiciona diagnósticos de subconjunto e de javascript no parser"`

---

### U2-07: Análise semântica de mundo fechado
**Spec:** §5.6, §4.4, §4.9 (P1, P3, P4, P14) · **Tier:** large · **Depende de:** U2-06 · **Risco:** falso positivo de GS0305/GS0601 trava programa válido do aluno; o corpus de U2-14 é a rede. · **Rollback:** reverter o commit; `compile()` ainda não consome a análise.
**Files:**
- Create: `packages/compiler/src/analyzer/{analyzer.ts,scope.ts,library-scope.ts,member-census.ts,name-checks.ts,javascript-checks.ts,library-checks.ts,control-checks.ts,hint-checks.ts,session.ts}`
- Create: `packages/compiler/tests/support/analyze.ts`
- Test: `packages/compiler/tests/unit/analyzer/{scope,members,reservation,control,hints,session}.test.ts`

**Interfaces:**
- Consumes: `parse`, `createLexer`, `createSourceText`, `ParseResult`, `walk(node, visit)` e `forEachChild` (de `ast/walk.ts`), os tipos de nó de `ast/ast.types.ts` (`Identifier.reservedKeyword`, `ThrowStatement.arguments`, `Property`, `MethodDefinition`, `AwaitExpression`), `lookupStdlibGlobal`, `lookupStdlibMember`, `lookupStdlibStatic`, `lookupJsReserved`, `lookupJsMember`, `lookupRetiredWord`, `LIMITS`, `RawDiagnostic`, `ReplSession`, `SessionBinding`, `BindingKind` (de `api.types.ts`, U2-02).
- Produces: `analyze(program, source, { target, session? }): AnalysisResult` como no bloco de interfaces (`resolutionOf`, `declaredMembers`, `topLevelBindings`, `diagnostics`), com três mudanças no contrato, registradas no corpo do commit e no bloco de interfaces compartilhado: (1) `rethrowCalls: ReadonlySet<CallExpression>` vira `rethrowStatements: ReadonlySet<ThrowStatement>`, porque o parser entrega `vixe(...)` como `ThrowStatement` e não como chamada; (2) `hasTopLevelAwait: boolean`; (3) `lastTopLevelExpression: ExpressionStatement | undefined`.

**Recursão:** `analyze` e `lower` percorrem a AST de forma recursiva porque o parser entrega profundidade no máximo `LIMITS.maxNestingDepth` e diagnostica o excesso com `GS0522`; sem esse teto, `'('.repeat(100000)` estouraria a pilha.

**Aceite:** todos os códigos GS0301–GS0312, GS0402, GS0403, GS0405, GS0406, GS0305, GS0306 (nome não declarado), GS0601–GS0604, GS0801–GS0809 saem com `args` para a mensagem, usando os marcadores do catálogo da U2-03; análise nunca lança; a AST não é mutada; sessão do REPL cumpre P14. Os códigos que o parser já emite (GS0306 em início de instrução, GS0401 e GS0404 em palavra ou operador do JavaScript) não são repetidos aqui.

- [ ] **Passo 1: helper de teste**

`packages/compiler/tests/support/analyze.ts`:
```ts
import { analyze } from '../../src/analyzer/analyzer.ts';
import type { AnalysisResult } from '../../src/analyzer/analyzer.ts';
import type { CompileTarget, ReplSession } from '../../src/api.types.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { parse } from '../../src/parser/parser.ts';
import { createSourceText } from '../../src/source/source-text.ts';

export interface AnalyzeOptions { readonly target?: CompileTarget; readonly session?: ReplSession }

export function analyzeSource(text: string, options: AnalyzeOptions = {}) {
  const source = createSourceText(text, 'programa.gs');
  const target = options.target ?? 'module';
  const parsed = parse(source, createLexer(source), { target });
  const analysis: AnalysisResult = analyze(parsed.program, source, {
    target,
    ...(options.session ? { session: options.session } : {}),
  });
  const codes = [...analysis.diagnostics].sort((a, b) => a.start - b.start).map((item) => item.code);
  return { analysis, codes, parsed, source };
}
```

**Ciclo 1 — escopos, biblioteca como escopo externo (P4), GS0301/0302/0304/0804**

- [ ] **Teste (RED)** `tests/unit/analyzer/scope.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { walk } from '../../../src/ast/walk.ts';
import { analyzeSource } from '../../support/analyze.ts';

describe('escopos e biblioteca', () => {
  it('nome não declarado dá GS0301 com sugestão', () => {
    const { analysis } = analyzeSource('uai nome é "a"\nprosa(nomi)');
    const found = analysis.diagnostics.find((item) => item.code === 'GS0301');
    expect(found?.args).toMatchObject({ name: 'nomi', suggestion: 'nome' });
  });
  it('reatribuir uai dá GS0302 e trem não', () => {
    expect(analyzeSource('uai a é 1\na é 2').codes).toEqual(['GS0302']);
    expect(analyzeSource('trem a é 1\na é 2').codes).toEqual([]);
  });
  it('parâmetro e topo do corpo contam como um escopo (GS0304)', () => {
    expect(analyzeSource('faz_trem f(a) { uai a é 1 }').codes).toEqual(['GS0304']);
    expect(analyzeSource('faz_trem f(a, a) { faz_favor a }').codes).toEqual(['GS0304']);
    expect(analyzeSource('uai a é 1\nfaz_trem f() { uai a é 2; faz_favor a }').codes).toEqual([]);
  });
  it('declarar global da biblioteca dá aviso GS0804, nunca GS0304', () => {
    expect(analyzeSource('uai Data é 1\nprosa(Data)').codes).toEqual(['GS0804']);
  });
  it('referência que resolve para o programa não é biblioteca', () => {
    const { analysis, parsed } = analyzeSource('faz_trem pergunta() { faz_favor 1 }\npergunta()');
    const kinds: string[] = [];
    walk(parsed.program, (node) => {
      if (node.type === 'Identifier' && node.name === 'pergunta') kinds.push(analysis.resolutionOf(node).kind);
    });
    expect(kinds).toEqual(['program', 'program']);
  });
  it('prosa sem declaração resolve para a biblioteca', () => {
    const { analysis, parsed } = analyzeSource('prosa("oi")');
    const kinds: string[] = [];
    walk(parsed.program, (node) => {
      if (node.type === 'Identifier' && node.name === 'prosa') kinds.push(analysis.resolutionOf(node).kind);
    });
    expect(kinds).toEqual(['library']);
  });
});
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/compiler test -- tests/unit/analyzer/scope.test.ts` → falha: `Cannot find module '../../src/analyzer/analyzer.ts'`.
- [ ] **Implementar.** `scope.ts` (estado mutável só em `this.*`, ADR-0004):
```ts
import type { BindingKind } from '../api.types.ts';

export type DeclarationKind = BindingKind | 'param' | 'catch' | 'loop';
export interface Binding { readonly name: string; readonly kind: DeclarationKind; readonly start: number; readonly fromSession: boolean }
export type ScopeKind = 'program' | 'function' | 'block';

export class Scope {
  private readonly bindings = new Map<string, Binding>();
  constructor(readonly kind: ScopeKind, readonly parent: Scope | null) {}
  declare(binding: Binding): 'ok' | 'duplicate' {
    if (this.bindings.has(binding.name)) return 'duplicate';
    this.bindings.set(binding.name, binding);
    return 'ok';
  }
  replace(binding: Binding): void { this.bindings.set(binding.name, binding); }
  own(name: string): Binding | undefined { return this.bindings.get(name); }
  lookup(name: string): Binding | undefined {
    return this.bindings.get(name) ?? this.parent?.lookup(name);
  }
}
```
`library-scope.ts`: `export const resolveLibraryGlobal = (name: string) => lookupStdlibGlobal(name);` (a biblioteca é externa; não popula `Scope`). `analyzer.ts`: classe `Analyzer` com `visit(node)` por `switch (node.type)`. Regras: (1) pré-passada `hoist(body)` declara `faz_trem`/`arruma_trem`/`uai`/`trem` do bloco inteiro antes de visitar (declaração vale no escopo todo, como em JS); a declaração acontece só nessa passada e a visita apenas consulta; (2) em `declare(name, kind, node)`: se `resolveLibraryGlobal(name)` existe, emitir `GS0804` (aviso) e declarar; se `declare` devolve `duplicate`, `GS0304`; (3) `Identifier` em posição de referência: `scope.lookup(name)` → `program`, ou `session` quando o binding tem `fromSession`; senão biblioteca → `library` com `entry`; senão `unresolved` e, nesta ordem, `GS0306` se `lookupRetiredWord(name)` existe, `GS0403` se `lookupJsReserved(name)` é `global` (com `suggestion` do catálogo), senão `GS0301` com `suggestion = closestName(name, candidates)`; (4) atribuição a binding `uai` → `GS0302`. Não são referências: a chave de `Property`, a `key` de `MethodDefinition` e a `property` não computada de `MemberExpression`. `resolutionOf` é um `WeakMap<Node, Resolution>` preenchido na visita. Marcadores dos args que não são óbvios: `GS0301`/`GS0305` levam `name` e, quando há candidato, `suggestion`; `GS0303` leva `name` e `suggestion = suggestFreshName(name)`; `GS0306` leva `word` e `replacement` (ou `gone: 'saiu da linguagem, sem substituto na v3'`, o mesmo texto do parser); `GS0801` leva `construct` (a grafia goiana da keyword do `if`/`for`/`while`). `name-checks.ts`:
```ts
const MAX_SUGGESTION_DISTANCE = 2;
const FRESH_NAME_PREFIX = 'meu_';

export const suggestFreshName = (name: string): string => `${FRESH_NAME_PREFIX}${name}`;

function nextRow(previous: readonly number[], a: string, b: string, rowIndex: number): readonly number[] {
  let left = rowIndex;
  const cells = Array.from({ length: b.length }, (_, column) => {
    const cost = a[rowIndex - 1] === b[column] ? 0 : 1;
    left = Math.min((previous[column + 1] ?? 0) + 1, left + 1, (previous[column] ?? 0) + cost);
    return left;
  });
  return [rowIndex, ...cells];
}

export function editDistance(a: string, b: string): number {
  const firstRow = Array.from({ length: b.length + 1 }, (_, index) => index);
  const rowIndexes = Array.from({ length: a.length }, (_, index) => index + 1);
  const lastRow = rowIndexes.reduce<readonly number[]>((row, rowIndex) => nextRow(row, a, b, rowIndex), firstRow);
  return lastRow[b.length] ?? 0;
}
export function closestName(name: string, candidates: Iterable<string>): string | undefined {
  let best: { readonly name: string; readonly distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = editDistance(name, candidate);
    if (distance <= MAX_SUGGESTION_DISTANCE && (!best || distance < best.distance)) best = { name: candidate, distance };
  }
  return best?.name;
}
```
Candidatos: declarações visíveis, depois biblioteca (nessa precedência); no repl, também a sessão.

**Mutabilidade no analyzer (ADR-0004).** O estado mutável (`diagnostics`, `contexts`, `resolutions`, `topLevelBindings`, `rethrowStatements`, escopos) vive só em campos `this.*` de `Analyzer`, de `Scope` e das classes de visitante. Função livre do analyzer (`editDistance`, `closestName`, `reservedEntries`, `reservationArgs`, as funções dos `*-checks.ts`) não faz `push`, `add`, `set` nem atribui a índice de array ou a propriedade de objeto local: devolve valor (`RawDiagnostic | undefined` ou `readonly RawDiagnostic[]`) e quem tem `this` acumula. Visitante que percorre a árvore inteira (`HintVisitor` em `hint-checks.ts`, `MemberCensus` em `member-census.ts`) é classe com campo `private readonly` acumulado por `this.found.push(...)` ou `this.declared.add(...)`. Predicado de subárvore ("tem `BreakStatement` próprio") usa `let` booleano reatribuído dentro de `forEachChild`, sem coleção.
- [ ] **Rodar de novo** → passa (6 testes).

**Ciclo 2 — censo de membros D (P1): GS0305/GS0405/GS0406**

- [ ] **Teste (RED)** `tests/unit/analyzer/members.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

describe('censo de membros', () => {
  it.each([
    ['uai l é [1]\nl.some(x => x)', ['GS0406']],
    ['uai l é [1]\nl.map(x => x)', ['GS0405']],
    ['uai p é { nome: "a" }\nprosa(p.nmoe)', ['GS0305']],
    ['uai p é { a: 1 }\nprosa(p.constructor)', ['GS0406']],
    ['uai p é { a: 1 }\nprosa(p.__proto__)', ['GS0406']],
    ['uai p é { length: 3 }', ['GS0405']],
  ])('%s', (src, expected) => {
    expect(analyzeSource(src).codes).toEqual(expected);
  });
  it('aceita membro declarado em qualquer ponto do arquivo (pré-passada)', () => {
    expect(analyzeSource('prosa(p.campo)\nuai p é { campo: 1 }').codes).toEqual([]);
    expect(analyzeSource('arruma_trem A { aprepara_trem() { ocê.x é 1 } }\nuai a é faz_um A()\nprosa(a.x)').codes).toEqual([]);
    expect(analyzeSource('uai l é [1]\nprosa(l[0])\nprosa(l["mapear"])').codes).toEqual(['GS0809']);
  });
  it('GS0305 sugere por distância sobre D e biblioteca', () => {
    const { analysis } = analyzeSource('uai p é { nome: 1 }\nprosa(p.nmoe)');
    expect(analysis.diagnostics[0]?.args).toMatchObject({ name: 'nmoe', suggestion: 'nome' });
  });
  it('declaredMembers expõe o censo D', () => {
    expect([...analyzeSource('uai p é { a: 1, "b": 2 }\np.c é 3').analysis.declaredMembers].sort()).toEqual(['a', 'b', 'c']);
  });
});
```
- [ ] **Rodar:** `… test -- tests/unit/analyzer/members.test.ts` → falha: `expected [] to deeply equal ['GS0406']`.
- [ ] **Implementar** `member-census.ts`:
```ts
import type { AstNode, MemberExpression, Program, Property } from '../ast/ast.types.ts';
import { walk } from '../ast/walk.ts';

export function propertyKeyName(key: Property['key']): string {
  return key.type === 'Identifier' ? key.name : String(key.value);
}

export function memberName(member: MemberExpression): string | undefined {
  const { property } = member;
  if (!member.computed) return property.type === 'Identifier' ? property.name : undefined;
  return property.type === 'Literal' && typeof property.value === 'string' ? property.value : undefined;
}

class MemberCensus {
  private readonly declared = new Set<string>();

  collect(program: Program): ReadonlySet<string> {
    walk(program, (node) => this.record(node));
    return this.declared;
  }

  private record(node: AstNode): void {
    if (node.type === 'Property') this.declared.add(propertyKeyName(node.key));
    else if (node.type === 'MethodDefinition' && node.kind === 'method') this.declared.add(node.key.name);
    else if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression') {
      const name = memberName(node.left);
      if (name !== undefined) this.declared.add(name);
    }
  }
}

export const collectDeclaredMembers = (program: Program): ReadonlySet<string> => new MemberCensus().collect(program);
```
Em `javascript-checks.ts`, duas funções com a mesma ordem de decisão, em que `GS0401`/`GS0402` vêm de `lookupJsReserved` (`hasEquivalent ? GS0401 : GS0402`, com `suggestion` da tabela):
- `checkMemberAccess(name, receiver)` para `x.nome` e `x["nome"]`: `constructor`, `prototype` e `__proto__` sempre `GS0406`; nome em D (união do censo com `session.members`) → ok; membro de instância da biblioteca (`lookupStdlibMember(name).length > 0`) → ok; receptor resolvido para `Conta`/`Coisa` com `lookupStdlibStatic(namespace, name)` → ok; `lookupJsMember(name)` com `equivalent` → `GS0405`; `lookupJsReserved(name)` de `kind` `keyword` ou `strict-reserved` → `GS0401`/`GS0402` (P2: `obj.public`, `obj.default`); `lookupJsMember(name)` sem `equivalent` → `GS0406`; desconhecido → `GS0305` com `suggestion = closestName(name, D ∪ nomes de instância da biblioteca)`. Receptor `unresolved` não gera diagnóstico de membro: o `GS0301`/`GS0403` do receptor já explica. Acesso literal a nome da biblioteca por `["mapear"]` → `GS0809`, sem reescrever.
- `checkDeclaredMember(name)` para chave de coisa, método de classe e alvo `x.nome é …`: `constructor`, `prototype` e `__proto__` → `GS0406`; `lookupJsMember(name)` com `equivalent` (`{ length: 3 }`) → `GS0405`; palavra reservada do JS (`{ new: 1 }`) → `GS0401`/`GS0402`.
O método `aprepara_trem` (`kind: 'constructor'`) não entra em D nem passa por `checkDeclaredMember`.
- [ ] **Rodar** → passa.

**Ciclo 3 — reserva por forma (P3) e uso da biblioteca: GS0601/0603/0604**

- [ ] **Teste (RED)** `tests/unit/analyzer/reservation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const accepted = [
  'uai f é { ano: 1999 }', 'uai f é { dia: 5 }', 'uai f é { hora: 9 }', 'uai f é { maior: 3 }',
  'uai f é { tem: certeza }', 'uai f é { pergunta: "x" }', 'uai f é { ano: 1999 }\nprosa(f.ano)',
  'uai f é { ano: 1999 }\nuai agora é faz_um Data()\nprosa(agora.ano())',
  'uai fila é [1]\nprosa(Coisa.tem({ a: 1 }, "a"))',
];
const rejected: ReadonlyArray<readonly [string, string]> = [
  ['uai f é { tamanho: 3 }', 'GS0601'],
  ['uai f é { mensagem: "oi" }', 'GS0601'],
  ['arruma_trem Fila { tamanho() { faz_favor 1 } }', 'GS0601'],
  ['arruma_trem A { mapear(f) { faz_favor f } }', 'GS0601'],
  ['uai f é { ano: (x) => x }', 'GS0601'],
  ['uai ano é 1\nuai f é { ano: ano }', 'GS0601'],
  ['faz_trem calcula() { faz_favor 1 }\nuai f é { ano: calcula }', 'GS0601'],
  ['uai l é "abc"\nprosa(l.tamanho())', 'GS0603'],
  ['prosa(Conta.PI())', 'GS0603'],
  ['uai l é [1]\nuai f é l.mapear', 'GS0603'],
  ['uai l é [1]\nl.amontoar(x => x)', 'GS0604'],
  ['uai t é "a"\nt.trocar("a")', 'GS0604'],
  ['uai l é [1]\nl.ordenar(x => x)', 'GS0604'],
];

describe('reserva por forma', () => {
  it.each(accepted)('aceita %s', (src) => {
    expect(analyzeSource(src).codes.filter((code) => code.startsWith('GS06'))).toEqual([]);
  });
  it.each(rejected)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('mensagem só leitura: atribuir dá GS0601', () => {
    expect(analyzeSource('uai e é faz_um Erro("a")\ne.mensagem é "b"').codes).toContain('GS0601');
  });
});
```
- [ ] **Rodar** → falha: `expected [] to include 'GS0601'`.
- [ ] **Implementar** `library-checks.ts`. Núcleo da reserva:
```ts
import type { Arity, StdlibEntry, StdlibReceiver } from '@goiasscript/language';
import { lookupStdlibMember } from '@goiasscript/language';
import type { Expression } from '../ast/ast.types.ts';
import { suggestFreshName } from './name-checks.ts';

const GUARANTEED_DATA: ReadonlySet<string> = new Set(['Literal', 'ArrayExpression', 'ObjectExpression', 'NewExpression']);
const RECEIVER_LABEL: Readonly<Record<StdlibReceiver, string>> = {
  global: 'biblioteca', text: 'texto', list: 'lista', textOrList: 'texto e de lista', number: 'número',
  object: 'coisa', promise: 'promessa', error: 'erro', date: 'data', namespace: 'biblioteca',
};
const EXPECTED_FORM = { property: 'é propriedade e não leva parênteses', method: 'é método e precisa de parênteses' } as const;

export type MemberValue = Expression | 'method';

const isCallableValue = (value: MemberValue): boolean => value === 'method' || !GUARANTEED_DATA.has(value.type);

// Propriedade reserva sempre; método reserva só como membro que pode ser chamado (P3).
export function reservedEntries(name: string, value: MemberValue): readonly StdlibEntry[] {
  const entries = lookupStdlibMember(name);
  if (entries.some((entry) => entry.form === 'property')) return entries;
  return entries.some((entry) => entry.form === 'method') && isCallableValue(value) ? entries : [];
}

export function reservationArgs(name: string, entries: readonly StdlibEntry[]): Readonly<Record<string, string>> {
  const labels = [...new Set(entries.map((entry) => RECEIVER_LABEL[entry.receiver]))];
  const suggestion = entries.flatMap((entry) => entry.alternatives ?? [])[0] ?? suggestFreshName(name);
  return { name, description: `${name} de ${labels.join(' e de ')}`, suggestion };
}

export const expectedFormArgs = (entry: StdlibEntry): Readonly<Record<string, string>> => ({ name: entry.name, expected: EXPECTED_FORM[entry.form ?? 'method'] });

export function arityPhrase(arity: Arity): string {
  if (arity.max === undefined) return `pelo menos ${arity.min}`;
  if (arity.min === arity.max) return `${arity.min} ${arity.min === 1 ? 'argumento' : 'argumentos'}`;
  return `de ${arity.min} a ${arity.max} argumentos`;
}

export const isArityViolation = (arity: Arity, received: number): boolean =>
  received < arity.min || (arity.max !== undefined && received > arity.max);

export function arityArgs(entry: StdlibEntry, received: number): Readonly<Record<string, string>> {
  const slots = Array.from({ length: entry.arity.max ?? entry.arity.min }, () => 'valor').join(', ');
  return { name: entry.name, arity: arityPhrase(entry.arity), received: String(received), signature: `${entry.name}(${slots})` };
}
```
`namespace` nunca reserva e `Conta`/`Coisa` não entram em `lookupStdlibMember`. `reservedEntries` é chamado em chave de coisa (`value` = valor da propriedade), em `MethodDefinition` (`'method'`) e em alvo `x.nome é …` (`value` = lado direito); entrada não vazia dá `GS0601` com `reservationArgs`. GS0603: em `CallExpression` cujo callee é `MemberExpression` resolvido para entrada `form: 'property'` (inclui `Conta.PI` via `lookupStdlibStatic`), ou `MemberExpression` fora de callee e de alvo de atribuição com `form: 'method'` e `name ∉ D`; args por `expectedFormArgs`. GS0604: no `CallExpression` de membro resolvido, `isArityViolation(entry.arity, call.arguments.length)` dá o diagnóstico com `arityArgs`.
- [ ] **Rodar** → passa.

**Ciclo 4 — palavras do JS e controle: GS0303/0306/0307/0308–0312/0401–0403**

- [ ] **Teste (RED)** `tests/unit/analyzer/control.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const cases: ReadonlyArray<readonly [string, string]> = [
  ['uai x é 1\npara_com_isso', 'GS0308'],
  ['faz_favor 1', 'GS0309'],
  ['arruma_trem A { aprepara_trem() {} aprepara_trem() {} }', 'GS0310'],
  ['arruma_trem A { aprepara_trem() { a_raiz() } }', 'GS0311'],
  ['arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { ocê.x é 1; a_raiz() } }', 'GS0311'],
  ['faz_trem f() { espera_um_cadim cochila(1) }', 'GS0312'],
  ['uai x', 'GS0307'],
  ['uai public é 1', 'GS0402'],
  ['uai eval é 1', 'GS0402'],
  ['uai console é 1', 'GS0403'],
  ['uai mais é 1', 'GS0303'],
  ['uai se_oce_quiser é 1', 'GS0303'],
  ['uai oce é 1', 'GS0303'],
  ['faz_trem f(NaN) {}', 'GS0402'],
  ['prosa(vazio)', 'GS0306'],
  ['console.log(1)', 'GS0403'],
];

describe('controle e nomes reservados', () => {
  it.each(cases)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('sem falso positivo', () => {
    for (const src of [
      'vai_indo (uai x de [1]) { continua_aí }', 'enquanto_tiver (certeza) { para_com_isso }',
      'uai de é 1\nvai_indo (uai x de [de]) { prosa(x) }', 'uai vazio é 0\nprosa(vazio)', 'uai se é 1',
      'arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem() { a_raiz(); ocê.x é 1 } }',
      'espera_um_cadim cochila(1)',
    ]) expect(analyzeSource(src).codes, src).toEqual([]);
  });
  it('seta reinicia o contexto de laço', () => {
    expect(analyzeSource('enquanto_tiver (certeza) { uai f é () => { para_com_isso } }').codes).toContain('GS0308');
  });
});
```
- [ ] **Rodar** → falha (`expected [] to include 'GS0308'`).
- [ ] **Implementar** `control-checks.ts` com pilha de contexto `{ inLoop, inFunction, async, classHasParent, inConstructor, usedThis }`, empilhada em função/seta/método/classe (`this.contexts.push(...)`). Todo nome declarado (variável, função, classe, parâmetro, parâmetro do `se_der_ruim`, variável de `vai_indo`) passa por `checkBindingName(identifier)` em `javascript-checks.ts`, nesta ordem: `identifier.reservedKeyword !== undefined` (o parser marca a keyword reservada que ocupa posição de nome, inclusive a variante sem acento) → `GS0303`; `lookupJsReserved(name)` com `kind: 'non-bindable'` → `GS0402`; `kind: 'global'` → `GS0403`; `keyword`/`strict-reserved` → `hasEquivalent ? GS0401 : GS0402`, com `suggestion` da tabela. Nome não declarado que é palavra aposentada dá `GS0306` no lugar do `GS0301` (regra (3) do ciclo 1); o `GS0306` de início de instrução (`presta_serviço soma(a, b)`) é do parser e tem teste na U2-06. `uai` sem `init` fora de `vai_indo (uai x de|em …)` → `GS0307`.
- [ ] **Rodar** → passa.

**Ciclo 5 — GS0602 e avisos GS0801–GS0809**

- [ ] **Teste (RED)** `tests/unit/analyzer/hints.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const warned: ReadonlyArray<readonly [string, string]> = [
  ['uai a é 1\nse_ocê_quiser (a é 2) { prosa(a) }', 'GS0801'],
  ['uai l é [1]\nl.filtrar(n => n é 2)', 'GS0801'],
  ['enquanto_tiver (certeza) { prosa(1) }', 'GS0802'],
  ['faz_trem f() { faz_favor 1\nprosa(2) }', 'GS0803'],
  ['vai_indo (trem i é 0; i menor_que 5; i mais 1) { prosa(i) }', 'GS0806'],
  ['trem i é 0\ni mais 1', 'GS0806'],
  ['tenta_aí { prosa(1) } se_der_ruim (erro) { prosa(erro) }', 'GS0807'],
  ['uai t é "a"\nt.trocar("a", "US$$")', 'GS0808'],
  ['prosa(soma(1.000,50))', 'GS0805'],
  ['faz_trem f() { uai n é pergunta("x") }', 'GS0602'],
];

describe('avisos pedagógicos', () => {
  it.each(warned)('%s dá %s', (src, code) => {
    expect(analyzeSource(src).codes).toContain(code);
  });
  it('sem falso positivo de GS0806 e GS0602', () => {
    expect(analyzeSource('uai a é 1\nprosa(a mais 1)').codes).toEqual([]);
    expect(analyzeSource('vai_na_frente faz_trem f() { uai n é pergunta("x") }').codes).toEqual([]);
    expect(analyzeSource('uai n é pergunta("x")').codes).toEqual([]);
    expect(analyzeSource('uai n é [1,2,3]\nprosa(Conta.maior(2,3))').codes).toEqual([]);
  });
  it('relançamento: vixe(erro) com o parâmetro do se_der_ruim entra em rethrowStatements', () => {
    const { analysis } = analyzeSource('tenta_aí { prosa(1) } se_der_ruim (erro) { vixe(erro) }');
    expect(analysis.rethrowStatements.size).toBe(1);
  });
  it('vixe com texto ou com faz_um não é relançamento', () => {
    expect(analyzeSource('vixe("a")').analysis.rethrowStatements.size).toBe(0);
  });
  it('await no topo e última expressão do topo são expostos para o rebaixamento', () => {
    const { analysis } = analyzeSource('uai a é 1\nespera_um_cadim a\na mais 1', { target: 'repl' });
    expect(analysis.hasTopLevelAwait).toBe(true);
    expect(analysis.lastTopLevelExpression?.type).toBe('ExpressionStatement');
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `hint-checks.ts`: classe `HintVisitor` (acumula em `this.found`, regra de mutabilidade do ciclo 1), um método por aviso, cada um com menos de 50 linhas; GS0801 (alvo de `é` como expressão inteira de condição/meio do `vai_indo`/argumento ou corpo de seta cujo alvo é parâmetro da própria seta); GS0802 (`enquanto_tiver (certeza)` sem `BreakStatement` próprio, ignorando funções aninhadas); GS0803 (irmão após `ReturnStatement` no mesmo bloco); GS0806 (instrução isolada ou incremento do `vai_indo` com raiz operador/identificador/literal; alvo `repl` e topo isolado não avisa); GS0805 por regex `/^\d{1,3}(\.\d{3})+,\d+$/` sobre o texto de dois números adjacentes na lista de argumentos/elementos (o parser entrega `1.000` e `50` como elementos separados: comparar `source.text.slice(a.start, b.end)`); GS0807; GS0808 (`/\$[$&`']/` no texto literal do 2º argumento de `.trocar`). `pergunta` resolvida para biblioteca fora de função async e fora do topo → `GS0602`; `rethrowStatements` = `ThrowStatement` cujo único argumento é um `Identifier` que resolve ao parâmetro do `se_der_ruim` envolvente; `hasTopLevelAwait` = existe `AwaitExpression` fora de qualquer função; `lastTopLevelExpression` = último elemento de `program.body` quando é `ExpressionStatement`. Args: `GS0801` leva `construct`, `GS0804` e `GS0807` levam `name`, `GS0805` leva `text`, `GS0806` leva `suggestion` (`i é i mais 1`) só quando a raiz é soma com identificador à esquerda.
- [ ] **Rodar** → passa.

**Ciclo 6 — sessão do REPL (P14)**

- [ ] **Teste (RED)** `tests/unit/analyzer/session.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { analyzeSource } from '../../support/analyze.ts';

const session = { bindings: [{ name: 'x', kind: 'uai' as const }, { name: 'f', kind: 'faz_trem' as const }], members: ['campo'] };

describe('sessão do REPL', () => {
  it('nome da sessão não dá GS0301', () => {
    expect(analyzeSource('prosa(x)', { target: 'repl', session }).codes).toEqual([]);
  });
  it('reatribuir uai da sessão dá GS0302', () => {
    expect(analyzeSource('x é 2', { target: 'repl', session }).codes).toEqual(['GS0302']);
  });
  it('redeclarar nome da sessão substitui sem GS0304 e muda o kind', () => {
    const { analysis, codes } = analyzeSource('trem x é 9', { target: 'repl', session });
    expect(codes).toEqual([]);
    expect(analysis.topLevelBindings).toEqual([{ name: 'x', kind: 'trem' }]);
  });
  it('redeclaração dentro da mesma entrada continua GS0304', () => {
    expect(analyzeSource('uai y é 1\nuai y é 2', { target: 'repl', session }).codes).toEqual(['GS0304']);
  });
  it('membro da sessão vale no censo D', () => {
    expect(analyzeSource('prosa({}.campo)', { target: 'repl', session }).codes).toEqual([]);
  });
  it('GS0301 sugere nomes da sessão', () => {
    const { analysis } = analyzeSource('prosa(xx)', { target: 'repl', session });
    expect(analysis.diagnostics[0]?.args).toMatchObject({ suggestion: 'x' });
  });
  it('soma isolada no topo do repl não avisa; dentro de bloco avisa', () => {
    expect(analyzeSource('uai a é 1\na mais 1', { target: 'repl' }).codes).toEqual([]);
    expect(analyzeSource('se_ocê_quiser (certeza) { 1 mais 1 }', { target: 'repl' }).codes).toEqual(['GS0806']);
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `session.ts`: `seedScope(scope, session)` declara cada item de `session.bindings` com o `kind` recebido e `fromSession: true` (é o que faz `Resolution.kind` ser `'session'`); redeclaração de nome vindo da sessão faz `scope.replace(...)` sem `duplicate`; `session.members` entram na união com o censo D da regra de `checkMemberAccess`; `topLevelBindings` = declarações do topo da entrada, com o `BindingKind` de cada uma (a soma com a sessão recebida é feita em `compile()`, U2-10).
- [ ] **Rodar** → passa.

- [ ] **De-sloppify:** remover teste que só checa tipo, defesa impossível e comentário que narra; deixar toda função com menos de 50 linhas e `analyzer.ts` com no máximo 400 linhas (a lógica de cada família de código fica no seu arquivo).
- [ ] **Verify:** `corepack pnpm verify` verde.
- [ ] **Commit:** `feat(compiler): adiciona análise semântica de mundo fechado`, com o corpo registrando `rethrowStatements`, `hasTopLevelAwait` e `lastTopLevelExpression` no contrato de `AnalysisResult` e a atualização do bloco de interfaces do plano no mesmo commit.

---

### U2-08: Rebaixamento e emissão
**Spec:** §5.7, §4.6, §4.8, §4.10, §4.3 · **Tier:** large · **Depende de:** U2-07 · **Risco:** edição sobreposta ou linha deslocada gera JS inválido ou desalinha pilha e mapa. · **Rollback:** reverter o commit; sem consumidor ainda.
**Files:**
- Create: `packages/compiler/src/lowering/{edit.types.ts,lower.ts,traversal.ts,keyword-edits.ts,library-edits.ts,macro-edits.ts,await-edits.ts,terminator-edits.ts,nfc-edits.ts,token-separation.ts,apply-edits.ts}`, `packages/compiler/src/helpers/{helper-sources.ts,emit-helpers.ts}`, `packages/compiler/src/targets/{module-target.ts,repl-target.ts,playground-target.ts,loop-guard.ts}`
- Create: `packages/compiler/tests/support/lower.ts`
- Test: `packages/compiler/tests/unit/lowering/{apply-edits,traversal,keywords,separation,nfc,await,vixe,terminators,macros,helpers,targets,lines}.test.ts`

**Mutabilidade (ADR-0004):** `lowering/`, `helpers/`, `targets/` e `sourcemap/` ficam fora da exceção de `this.*`. Nenhum arquivo ali faz `push`, `add`, `set`, `splice`, `sort` ou `reverse` em coleção, nem atribui a índice ou propriedade, nem `++` em elemento. Cada família de edição é função pura `(node, parent, context) => readonly Edit[]`; as partes se juntam por `flatMap`, `map` e `join`; `.sort` vira `.toSorted`; `let` só guarda primitivo reatribuído (contador, posição, acumulador de deslocamento).

**Interfaces:**
- Consumes: `parse`, `createLexer`, `createSourceText`, `analyze`/`AnalysisResult` (`resolutionOf`, `rethrowStatements`, `topLevelBindings`, `hasTopLevelAwait`, `lastTopLevelExpression`, como definidos na U2-07), os nós de `ast/ast.types.ts` e `forEachChild`, `StdlibEntry` (`kind`, `js`, `helperName`), `Token.keyword` (`KeywordEntry.js`), `LIMITS`.
- Produces: `lower(...)`, `applyEdits(...)`, `LoweringResult`, `Edit`, `MappingSegment` (o bloco de interfaces compartilhado ganha `length` e `kind: 'copy' | 'replace' | 'insert'`, registrado no commit), `emitProgram(program, analysis, source, { target, loopLimit? }): { code, segments, helperRange, helpers }`.
- Fonte dos tokens de keyword: os nós que carregam `keywordToken`, `keywordTokens` ou `operatorToken` (declaração, `faz_trem`, `if`, laços, `vixe`, `faz_um`, `ocê`, `a_raiz`, operadores unários e binários) e, para as keywords que a AST não guarda (`é` do declarador, `se_não`, `por_fim`, `inherda_de`, `de`/`em` do `vai_indo`, nome `aprepara_trem`), a releitura do trecho entre os nós vizinhos com `createLexer` sobre a fatia do texto (função `keywordInGap`, em `keyword-edits.ts`). Propriedade (`obj.mais`) e chave de coisa nunca são keyword: a AST as entrega como `Identifier` sem token.

**Aceite:** para cada comportamento abaixo o JS emitido passa em `acorn.parse` (ES2022, módulo); a linha do token no `.gs` é a do JS; programa só nativo tem 0 bytes de runtime; edições nunca se sobrepõem.

- [ ] **Passo 1: helper** `tests/support/lower.ts`:
```ts
import { parse as acornParse } from 'acorn';
import { analyze } from '../../src/analyzer/analyzer.ts';
import type { CompileTarget, ReplSession } from '../../src/api.types.ts';
import { emitProgram } from '../../src/targets/module-target.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { parse } from '../../src/parser/parser.ts';
import { createSourceText } from '../../src/source/source-text.ts';

export function emit(text: string, target: CompileTarget = 'module', loopLimit?: number, session?: ReplSession) {
  const source = createSourceText(text, 'programa.gs');
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, { target, ...(session === undefined ? {} : { session }) });
  const out = emitProgram(parsed.program, analysis, source, { target, ...(loopLimit === undefined ? {} : { loopLimit }) });
  if (target === 'module') acornParse(out.code, { ecmaVersion: 2022, sourceType: 'module' });
  return out;
}
```
(`emitProgram` em `targets/module-target.ts` chama `lower` → `applyEdits` → `emitHelpers` e devolve `{ code, segments, helperRange, helpers }`.)

**Ciclo 1 — ordem das edições e sobreposição**

- [ ] **Teste (RED)** `apply-edits.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { applyEdits } from '../../../src/lowering/apply-edits.ts';
import { createSourceText } from '../../../src/source/source-text.ts';

const source = createSourceText('uai a é 1', 'programa.gs');

describe('applyEdits', () => {
  it('ordena por start; inserção de largura zero antes da troca; empate por order', () => {
    const { code } = applyEdits(source, [
      { start: 0, end: 3, text: 'const', order: 1 },
      { start: 0, end: 0, text: '/*i*/', order: 2 },
      { start: 0, end: 0, text: '/*h*/', order: 0 },
    ]);
    expect(code).toBe('/*h*//*i*/const a é 1');
  });
  it('sobreposição é erro interno', () => {
    expect(() => applyEdits(source, [
      { start: 0, end: 3, text: 'x', order: 0 },
      { start: 2, end: 4, text: 'y', order: 1 },
    ])).toThrow(/sobrepõe/);
  });
  it('segmentos: trecho copiado, trocado e inserido', () => {
    const { segments } = applyEdits(source, [{ start: 0, end: 3, text: 'const', order: 0 }, { start: 9, end: 9, text: ';', order: 1 }]);
    expect(segments.map((s) => s.kind)).toEqual(['replace', 'copy', 'insert']);
  });
});
```
- [ ] **Rodar:** `… test -- tests/unit/lowering/apply-edits.test.ts` → falha: módulo ausente.
- [ ] **Implementar** `edit.types.ts` (tipos do bloco de interfaces) e `apply-edits.ts`:
```ts
import type { SourceText } from '../source/source.types.ts';
import type { Edit, MappingSegment } from './edit.types.ts';

interface Piece {
  readonly text: string;
  readonly originalOffset: number | null;
  readonly kind: MappingSegment['kind'];
}

export const compareEdits = (a: Edit, b: Edit): number =>
  a.start - b.start || Number(b.end === b.start) - Number(a.end === a.start) || a.order - b.order;

const copyPiece = (source: SourceText, from: number, to: number): readonly Piece[] =>
  from < to ? [{ text: source.text.slice(from, to), originalOffset: from, kind: 'copy' }] : [];

function piecesOf(source: SourceText, ordered: readonly Edit[]): readonly Piece[] {
  const edited = ordered.flatMap((edit, index): readonly Piece[] => {
    const cursor = index === 0 ? 0 : (ordered[index - 1]?.end ?? 0);
    if (edit.start < cursor) throw new Error(`edição se sobrepõe em ${edit.start}`);
    const insertion = edit.start === edit.end;
    const replacement: Piece = { text: edit.text, originalOffset: insertion ? null : edit.start, kind: insertion ? 'insert' : 'replace' };
    return [...copyPiece(source, cursor, edit.start), replacement];
  });
  const tailStart = ordered.at(-1)?.end ?? 0;
  return [...edited, ...copyPiece(source, tailStart, source.text.length)];
}

// Pedaços + join: concatenar `code` a cada edição e ler o fim dela é quadrático (spike da Fase 0).
export function applyEdits(source: SourceText, edits: readonly Edit[]): { readonly code: string; readonly segments: readonly MappingSegment[] } {
  const pieces = piecesOf(source, edits.toSorted(compareEdits));
  let generatedOffset = 0;
  const segments = pieces.map((piece): MappingSegment => {
    const segment = { generatedOffset, originalOffset: piece.originalOffset, length: piece.text.length, kind: piece.kind };
    generatedOffset += piece.text.length;
    return segment;
  });
  return { code: pieces.map((piece) => piece.text).join(''), segments };
}
```
(O BOM no offset 0 vira edição `{ start: 0, end: 1, text: '' }` criada em `lower`. `ordered[index - 1]` só é lido com `index > 0`: `.at(-1)` no índice 0 devolveria a última edição.)
- [ ] **Rodar** → passa.

**Percurso da árvore sem mutação.** `forEachChild` entrega os filhos por callback, e juntar o resultado num array local violaria `functional/immutable-data` (copiar o array a cada filho seria quadrático). `traversal.ts` resolve com lista encadeada e dá o percurso em pré-ordem que todas as famílias de edição usam.

- [ ] **Teste (RED)** `traversal.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { createLexer } from '../../../src/lexer/lexer.ts';
import { createOrderCounter, flatMapTree } from '../../../src/lowering/traversal.ts';
import { parse } from '../../../src/parser/parser.ts';
import { createSourceText } from '../../../src/source/source-text.ts';

const WIDE_PROGRAM_STATEMENTS = 5000;

function programOf(text: string) {
  const source = createSourceText(text, 'programa.gs');
  return parse(source, createLexer(source), { target: 'module' }).program;
}

describe('traversal', () => {
  it('flatMapTree visita em pré-ordem e entrega o pai de cada nó', () => {
    const found = flatMapTree(programOf('uai a é b mais 1'), (node, parent) =>
      node.type === 'Identifier' ? [`${node.name}<${parent?.type ?? 'raiz'}`] : []);
    expect(found).toEqual(['a<VariableDeclarator', 'b<BinaryExpression']);
  });
  it('programa largo percorre sem custo quadrático', () => {
    const statements = flatMapTree(programOf('prosa(1)\n'.repeat(WIDE_PROGRAM_STATEMENTS)), (node) =>
      node.type === 'ExpressionStatement' ? [node] : []);
    expect(statements).toHaveLength(WIDE_PROGRAM_STATEMENTS);
  });
  it('contador de ordem cresce de um em um', () => {
    const nextOrder = createOrderCounter();
    expect([nextOrder(), nextOrder(), nextOrder()]).toEqual([0, 1, 2]);
  });
});
```
- [ ] **Rodar:** `… test -- tests/unit/lowering/traversal.test.ts` → falha: módulo ausente. **Implementar** `traversal.ts`:
```ts
import type { AstNode } from '../ast/ast.types.ts';
import { forEachChild } from '../ast/walk.ts';

interface ChildLink {
  readonly child: AstNode;
  readonly previous: ChildLink | null;
}

function* linkValues(last: ChildLink | null): Generator<AstNode> {
  for (let link = last; link !== null; link = link.previous) yield link.child;
}

export function childrenOf(node: AstNode): readonly AstNode[] {
  let last = null as ChildLink | null;
  forEachChild(node, (child) => {
    last = { child, previous: last };
  });
  return Array.from(linkValues(last)).toReversed();
}

export function flatMapTree<T>(
  root: AstNode,
  select: (node: AstNode, parent: AstNode | null) => readonly T[],
  parent: AstNode | null = null,
): readonly T[] {
  return select(root, parent).concat(childrenOf(root).flatMap((child) => flatMapTree(child, select, root)));
}

export function createOrderCounter(): () => number {
  let next = 0;
  return () => {
    const current = next;
    next += 1;
    return current;
  };
}
```
- [ ] **Rodar** → passa.

**Ciclo 2 — keywords, operadores e separação de tokens**

- [ ] **Teste (RED)** `keywords.test.ts` e `separation.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('keywords', () => {
  it.each([
    ['uai a é 1', 'const a = 1;'],
    ['trem a é 1', 'let a = 1;'],
    ['faz_trem f(a) { faz_favor a }', 'function f(a) { return a; }'],
    ['uai o é { de: "SP" }\nprosa(o.de)', 'const o = { de: "SP" };\nconsole.log(o.de);'],
    ['uai a é 1\nuai b é a mais 2 vezes 3 sobrou 4', 'const a = 1;\nconst b = a + 2 * 3 % 4;'],
    ['uai b é num_é certeza e_mais de_jeito_nenhum ou_então nada', 'const b = !true && false || null;'],
    ['uai o é { mais: 1 }\nprosa(o.mais)', 'const o = { mais: 1 };\nconsole.log(o.mais);'],
    ['se_ocê_quiser (certeza) { prosa(1) } se_num_for (certeza) { prosa(2) } se_não { prosa(3) }', 'if (true) { console.log(1); } else if (true) { console.log(2); } else { console.log(3); }'],
    ['tenta_aí { prosa(1) } se_der_ruim (e) { prosa(2) } por_fim { prosa(3) }', 'try { console.log(1); } catch (e) { console.log(2); } finally { console.log(3); }'],
    ['vai_indo (uai x de [1]) { prosa(x) }', 'for (const x of [1]) { console.log(x); }'],
    ['arruma_trem B {}\narruma_trem A inherda_de B { aprepara_trem(x) { a_raiz(x) } }', 'class B {}\nclass A extends B { constructor(x) { super(x); } }'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
});

describe('separação de tokens', () => {
  it.each([
    ['uai x é 5\nuai y é x menos-1', 'const x = 5;\nconst y = x - -1;'],
    ['uai x é 5\nuai y é x menos -1', 'const x = 5;\nconst y = x - -1;'],
  ])('%s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
});
```
- [ ] **Rodar** → falha (`emitProgram` ausente). **Implementar** `keyword-edits.ts`: `keywordEdits(node, parent, context): readonly Edit[]`, função pura aplicada a cada nó por `flatMapTree` (pré-ordem, `traversal.ts`), emitindo, para cada token de keyword da regra "Fonte dos tokens" acima, `{ start: token.start, end: token.end, text: token.keyword.js, order: context.nextOrder() }`. O trecho entre nós vizinhos é lido por:
```ts
import { createLexer } from '../lexer/lexer.ts';
import type { Token } from '../lexer/token.types.ts';
import { createSourceText } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';

export function keywordInGap(source: SourceText, from: number, to: number): Token | undefined {
  const slice = createSourceText(source.text.slice(from, to), source.fileName);
  const lexer = createLexer(slice);
  for (let token = lexer.next(); token.kind !== 'end-of-file'; token = lexer.next()) {
    if (token.kind === 'keyword') return { ...token, start: token.start + from, end: token.end + from };
  }
  return undefined;
}
```
Usos: `é` do declarador entre `id.end` e `init.start`; `se_não` entre `consequent.end` e `alternate.start` quando `alternate` é `BlockStatement`; `por_fim` entre o fim do `catch` (ou do bloco do `tenta_aí`) e `finalizer.start`; `inherda_de` entre `id.end` e `superClass.start`; `de`/`em` entre `left.end` e `right.start`; `vai_na_frente` antes de `faz_trem`, quando `FunctionDeclaration.async` é verdadeiro e o `keywordToken` guardado é o `faz_trem`, entre `node.start` e `keywordToken.start`. Em `MethodDefinition` de `kind: 'constructor'` a edição troca `key` por `constructor`; nos demais métodos, `key` é nome comum e não é editado. `token-separation.ts`:
```ts
const SYMBOL_PAIRS = new Set(['++', '--', '//', '/*', '+=', '-=', '*=', '/=', '%=', '<=', '>=', '==', '=>']);
export function needsSpace(before: string, replacement: string, after: string): boolean {
  const left = before.slice(-1) + replacement.slice(0, 1);
  const right = replacement.slice(-1) + after.slice(0, 1);
  return SYMBOL_PAIRS.has(left) || SYMBOL_PAIRS.has(right);
}
```
`keywordEdits` aplica `needsSpace` às edições de operador (`texto antes` e `texto depois` lidos de `source.text`) e devolve uma edição nova com um espaço a mais no `text` quando verdadeiro; a edição recebida não é alterada.

**Coleta de edições.** `edit.types.ts` ganha o contexto que todas as famílias recebem, e `lower.ts` junta as famílias sem coleção mutável:
```ts
// edit.types.ts (acrescentar)
export interface EditContext {
  readonly source: SourceText;
  readonly analysis: AnalysisResult;
  readonly nextOrder: () => number;
}
```
```ts
// lower.ts
const BYTE_ORDER_MARK = '﻿';

const byteOrderMarkEdits = (context: EditContext): readonly Edit[] =>
  context.source.text.startsWith(BYTE_ORDER_MARK) ? [{ start: 0, end: 1, text: '', order: context.nextOrder() }] : [];

// Terminadores numa segunda passada: no mesmo offset o `;` entra depois de qualquer `)` inserido.
export function collectEdits(program: Program, context: EditContext): readonly Edit[] {
  const byteOrderMark = byteOrderMarkEdits(context);
  const structural = flatMapTree(program, (node, parent) => [
    ...keywordEdits(node, parent, context),
    ...nfcEdits(node, context),
    ...libraryEdits(node, parent, context),
    ...macroEdits(node, parent, context),
    ...askAwaitEdits(node, parent, context),
  ]);
  const terminators = flatMapTree(program, (node) => terminatorEdits(node, context));
  return [...byteOrderMark, ...structural, ...terminators];
}

export const collectHelpers = (program: Program, context: EditContext): readonly string[] =>
  [...new Set(flatMapTree(program, (node) => helperNamesOf(node, context)))];
```
`lower` cria o `context` uma vez por compilação, com `nextOrder: createOrderCounter()`, e chama `collectEdits` e `collectHelpers`. `helperNamesOf(node, context)` (em `library-edits.ts`) devolve `[entry.helperName]` quando o nó é referência de biblioteca com `entry.kind === 'helper'` e `helperName` definido, senão `[]`. Cada família devolve `[]` para o nó que não é dela.
- [ ] **Rodar** → passa.

**Ciclo 3 — NFC dos identificadores (Review Focus 3)**

- [ ] **Teste (RED)** `nfc.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

const NFD = 'cafe\u0301';
const NFC = 'caf\u00e9';

describe('NFC na emissão', () => {
  it('declarar em NFC e usar em NFD gera uma variável só, em NFC', () => {
    const { code } = emit(`uai ${NFC} é 1\nprosa(${NFD})`);
    expect(code).toBe(`const ${NFC} = 1;\nconsole.log(${NFC});`);
    expect(code.normalize('NFC')).toBe(code);
  });
  it('propriedade, método e parâmetro também saem em NFC', () => {
    const { code } = emit(`uai o é { ${NFD}: 1 }\nprosa(o.${NFC})\nfaz_trem f(${NFD}) { faz_favor ${NFC} }`);
    expect(code).toBe(`const o = { ${NFC}: 1 };\nconsole.log(o.${NFC});\nfunction f(${NFC}) { return ${NFC}; }`);
  });
  it('texto e comentário com NFD ficam intactos', () => {
    const { code } = emit(`// ${NFD}\nprosa("${NFD}")`);
    expect(code).toBe(`// ${NFD}\nconsole.log("${NFD}");`);
  });
  it('keyword em NFD é reconhecida', () => {
    const elseInNfd = 'se_n' + 'a\u0303' + 'o';
    const { code } = emit(`se_ocê_quiser (certeza) { prosa(1) } ${elseInNfd} { prosa(2) }`);
    expect(code).toBe('if (true) { console.log(1); } else { console.log(2); }');
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `nfc-edits.ts`: `nfcEdits(node, context): readonly Edit[]` devolve `[]` salvo para nó `Identifier` (inclui parâmetro, chave de coisa e `property` de `MemberExpression`) com `context.source.text.slice(node.start, node.end) !== node.name`, e então `[{ start: node.start, end: node.end, text: node.name, order: context.nextOrder() }]`. O lexer já entrega `value` em NFC e o parser copia esse valor para `name`.
- [ ] **Rodar** → passa.

**Ciclo 4 — `await` de `pergunta` e ajudante `$gs_pergunta`**

- [ ] **Teste (RED)** `await.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('await de pergunta', () => {
  it.each([
    ['pergunta("Nome?").gritando()', '(await $gs_pergunta("Nome?")).toUpperCase();'],
    ['uai c é pergunta("Nome?")[0]', 'const c = (await $gs_pergunta("Nome?"))[0];'],
    ['uai n é pergunta("Nome?").tamanho', 'const n = (await $gs_pergunta("Nome?")).length;'],
    ['uai nome é pergunta("Nome?")', 'const nome = await $gs_pergunta("Nome?");'],
    ['prosa(pergunta("x"))', 'console.log(await $gs_pergunta("x"));'],
    ['uai n é espera_um_cadim pergunta("x")', 'const n = await $gs_pergunta("x");'],
    ['uai n é vira_número(pergunta("Idade?")) mais 1', 'const n = $gs_vira_numero(await $gs_pergunta("Idade?")) + 1;'],
  ])('%s', (src, line) => {
    expect(emit(src).code.split('\n')[0]).toBe(line);
  });
  it('encadeamento quebrado em duas linhas preserva as linhas', () => {
    const lines = emit('pergunta("a")\n  .trocar("x", "y")\n  .gritando()').code.split('\n');
    expect(lines[0]).toBe('(await $gs_pergunta("a"))');
    expect(lines[1]).toBe('  .replaceAll("x", "y")');
  });
  it('pergunta do usuário não recebe await nem ajudante', () => {
    const { code, helpers } = emit('faz_trem pergunta() { faz_favor 1 }\npergunta()');
    expect(code).not.toContain('await');
    expect(helpers).toEqual([]);
  });
  it('em async: await dentro de vai_na_frente faz_trem', () => {
    expect(emit('vai_na_frente faz_trem f() { uai n é pergunta("x") }').code).toContain('async function f() { const n = await $gs_pergunta("x");');
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `await-edits.ts`:
```ts
import type { AstNode, CallExpression } from '../ast/ast.types.ts';
import type { Edit } from './edit.types.ts';

const isMemberObject = (parent: AstNode, call: CallExpression): boolean => parent.type === 'MemberExpression' && parent.object === call;
const isCallee = (parent: AstNode, call: CallExpression): boolean =>
  (parent.type === 'CallExpression' || parent.type === 'NewExpression') && parent.callee === call;

export function awaitEdits(call: CallExpression, parent: AstNode, nextOrder: () => number): readonly Edit[] {
  const wrapped = isMemberObject(parent, call) || isCallee(parent, call);
  const opening: Edit = { start: call.start, end: call.start, text: wrapped ? '(await ' : 'await ', order: nextOrder() };
  return wrapped ? [opening, { start: call.end, end: call.end, text: ')', order: nextOrder() }] : [opening];
}
```
O pai de cada nó vem de `flatMapTree`. O ponto de entrada da família, no mesmo arquivo, é:
```ts
export function askAwaitEdits(node: AstNode, parent: AstNode | null, context: EditContext): readonly Edit[] {
  if (node.type !== 'CallExpression' || parent === null || parent.type === 'AwaitExpression') return [];
  const resolution = context.analysis.resolutionOf(node.callee);
  const isAsk = resolution.kind === 'library' && resolution.entry.name === 'pergunta';
  return isAsk ? awaitEdits(node, parent, context.nextOrder) : [];
}
```
(com `import type { EditContext } from './edit.types.ts'`). `pergunta(...)` cujo pai já é `AwaitExpression` (o aluno escreveu `espera_um_cadim pergunta("x")`) não recebe segundo `await`. A troca do nome (`pergunta` → `$gs_pergunta`, `vira_número` → `$gs_vira_numero`) vem de `library-edits.ts`: entrada `helper` global ou estática troca o nome por `entry.js`, que a tabela já grava como `$gs_<helperName>`; só quando `resolutionOf(callee).kind === 'library'`. Helper de instância (`.ordenar()`, `.mensagem`) segue a regra própria da seção de macros e membros.
- [ ] **Rodar** → passa.

**Ciclo 5 — `vixe`, `;`, macros e membros da biblioteca**

- [ ] **Testes (RED)** `vixe.test.ts`, `terminators.test.ts`, `macros.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('vixe', () => {
  it.each([
    ['vixe("Deu ruim, sô!")', 'throw new Error("Deu ruim, sô!");'],
    ['vixe(faz_um Erro("a"))', 'throw (new Error("a"));'],
    ['tenta_aí { prosa(1) } se_der_ruim (erro) { vixe(erro) }', 'try { console.log(1); } catch (erro) { throw (erro); }'],
  ])('%s', (src, js) => expect(emit(src).code).toBe(js));
});

describe('ponto e vírgula', () => {
  it('callback em bloco sem ; (Review Focus 5)', () => {
    const { code } = emit('uai lista é [1]\nlista.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})');
    expect(code).toBe('const lista = [1];\nlista.forEach(x => {\n  console.log(x);\n  console.log(x + 1);\n});');
  });
  it('declaração com seta recebe ; e a linha seguinte começada por ( não vira chamada', () => {
    expect(emit('uai f é x => { faz_favor x }\n(1)').code).toBe('const f = x => { return x; };\n(1);');
  });
  it('não duplica o ; do aluno e não põe ; depois de instrução composta', () => {
    expect(emit('uai a é 1;\nse_ocê_quiser (certeza) { prosa(a) }').code).toBe('const a = 1;\nif (true) { console.log(a); }');
  });
  it('cabeçalho do vai_indo mantém só 2 ;', () => {
    expect(emit('vai_indo (trem i é 0; i menor_que 3; i é i mais 1) { prosa(i) }').code).toBe('for (let i = 0; i < 3; i = i + 1) { console.log(i); }');
  });
});

describe('macros e membros', () => {
  it.each([
    ['uai d é faz_um Data()\nprosa(d.mês() vezes 2)', 'const d = new Date();\nconsole.log((d.getMonth() + 1) * 2);'],
    ['uai m é Coisa.mistura({ a: 1 }, { b: 2 })', 'const m = Object.assign({}, { a: 1 }, { b: 2 });'],
    ['uai t é "ab"\nprosa(t.tamanho)', 'const t = "ab";\nconsole.log(t.length);'],
    ['prosa(Conta.maior(1, 2))', 'console.log(Math.max(1, 2));'],
    ['prosa(Conta.PI)', 'console.log(Math.PI);'],
    ['uai x é "a"\nprosa(x.começa_com("a"))', 'const x = "a";\nconsole.log(x.startsWith("a"));'],
  ])('%s', (src, js) => expect(emit(src).code).toBe(js));
  it.each([
    ['vai_na_frente_faz_trem f() { faz_favor 1 }', 'async function f() { return 1; }'],
    ['vai_na_frente faz_trem f() { faz_favor 1 }', 'async function f() { return 1; }'],
  ])('função assíncrona: %s', (src, js) => {
    expect(emit(src).code).toBe(js);
  });
});
```
(`emit` no alvo `module` não coloca `'use strict'`.)
- [ ] **Rodar** → falha. **Implementar:** `macro-edits.ts` (`vixe` é `ThrowStatement`, e é este arquivo, não `keyword-edits.ts`, que troca o `keywordToken` dele, conforme a ordem da §4.8: argumento `NewExpression` (`faz_um`) → `vixe` vira `throw `; instrução em `analysis.rethrowStatements` → `throw `; demais → `throw new Error`; `.mês()` insere `(` antes do receptor e troca `.mês()` por `.getMonth() + 1)`; `Coisa.mistura` troca o callee por `Object.assign` e insere `{}, ` antes do 1º argumento), `library-edits.ts` (`rename`/`property`/`static`/`global` por `entry.js`; para `static` com callee `Conta.maior`, uma edição cobrindo `Conta.maior`; `.ordenar()` troca `ordenar()` por `toSorted($gs_ordem)` com uma edição do nome do membro até o fim da chamada), `terminator-edits.ts`:
```ts
import type { AstNode, Statement } from '../ast/ast.types.ts';
import type { SourceText } from '../source/source.types.ts';
import type { Edit, EditContext } from './edit.types.ts';

const SIMPLE: ReadonlySet<string> = new Set(['VariableDeclaration', 'ExpressionStatement', 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'ThrowStatement']);

export function terminatorEdit(statement: Statement, source: SourceText, order: number): Edit | null {
  if (!SIMPLE.has(statement.type) || source.text[statement.end - 1] === ';') return null;
  return { start: statement.end, end: statement.end, text: ';', order };
}

export function terminatorEdits(node: AstNode, context: EditContext): readonly Edit[] {
  if (node.type !== 'Program' && node.type !== 'BlockStatement') return [];
  return node.body.flatMap((statement) => {
    const edit = terminatorEdit(statement, context.source, context.nextOrder());
    return edit === null ? [] : [edit];
  });
}
```
`collectEdits` chama `terminatorEdits` só para `Program.body` e `BlockStatement.body`; a declaração do cabeçalho do `vai_indo` fica fora porque não é elemento de `body`. O `end` de uma instrução não inclui o `newline` final e inclui o `;` do aluno, quando existe, o que evita duplicar.
- [ ] **Rodar** → passa.

**Ciclo 6 — ajudantes `$gs_*` (function + var, depois da última linha)**

- [ ] **Teste (RED)** `helpers.test.ts`:
```ts
import { runInNewContext } from 'node:vm';
import { lookupJsReserved } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('ajudantes', () => {
  it('programa só nativo não emite runtime', () => {
    const { code, helperRange, helpers } = emit('prosa(1)');
    expect(code).toBe('console.log(1);');
    expect(helperRange).toBeNull();
    expect(helpers).toEqual([]);
  });
  it('ajudante entra depois da última linha, é function e só é emitido se usado', () => {
    const { code, helperRange } = emit('uai l é [3, 1]\nprosa(l.ordenar())');
    const lines = code.split('\n');
    expect(lines[0]).toBe('const l = [3, 1];');
    expect(lines[1]).toBe('console.log(l.toSorted($gs_ordem));');
    expect(helperRange).toEqual({ startLine: 3, endLine: lines.length });
    expect(code).toMatch(/\nfunction \$gs_ordem\(/);
    expect(code).not.toMatch(/\$gs_pergunta/);
  });
  it('estado global dos ajudantes usa var, nunca let/const no topo', () => {
    const { code } = emit('uai n é pergunta("x")');
    expect(code).toMatch(/\nvar \$gs_/);
    const helperText = code.split('\n').slice(1).join('\n');
    expect(helperText).not.toMatch(/^(let|const)\s/m);
  });
  it('$gs_ordem é ordem total: números, textos pt-BR, resto estável', () => {
    const { code } = emit('uai l é [1]\nl.ordenar()');
    const helper = code.slice(code.indexOf('function $gs_ordem'));
    const order = runInNewContext(`${helper}; $gs_ordem`) as (a: unknown, b: unknown) => number;
    const sorted = [NaN, 'b', 2, null, 'a', 1].toSorted(order);
    expect(sorted.slice(0, 2)).toEqual([1, 2]);
    expect(Number.isNaN(sorted[2])).toBe(true);
    expect(sorted.slice(3, 5)).toEqual(['a', 'b']);
    expect(sorted[5]).toBeNull();
  });
  it('só cita globais que estão em jsReserved', () => {
    const { code } = emit('uai n é pergunta("x")\nprosa(Conta.sorteia_um(1, 2))\nprosa(vira_número("1,5"))\nprosa(é_número(1))\ncochila(1)');
    const cited = new Set(code.match(/\b(Math|Number|Intl|Promise|Error|process|String|Object)\b/g));
    for (const name of cited) expect(lookupJsReserved(name), name).toBeDefined();
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `helper-sources.ts` com `export const HELPER_SOURCES: Readonly<Record<string, string>>` (chave = `helperName`): cada valor é uma declaração `function $gs_<nome>(…) {…}`, precedida de `var` de estado quando preciso. Fontes completas:
```ts
export const HELPER_SOURCES: Readonly<Record<string, string>> = {
  ordem: `function $gs_ordem(a, b) {
  const rank = (v) => (typeof v === 'number' ? (Number.isNaN(v) ? 1 : 0) : typeof v === 'string' ? 2 : 3);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return a - b;
  if (ra === 2) return a.localeCompare(b, 'pt-BR');
  return 0;
}`,
  vira_numero: `function $gs_vira_numero(t) {
  const s = String(t).trim().replace(',', '.');
  return s === '' ? NaN : Number(s);
}`,
  e_numero: `function $gs_e_numero(x) {
  return typeof x === 'number' && !Number.isNaN(x);
}`,
  sorteia_um: `function $gs_sorteia_um(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}`,
  cochila: `function $gs_cochila(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}`,
  pergunta: `var $gs_reader;
var $gs_ended;
async function $gs_pergunta(prompt) {
  if ($gs_ended) throw Object.assign(new Error('GS0702'), { gsCode: 'GS0702' });
  if (!$gs_reader) {
    const { createInterface } = await import('node:readline/promises');
    $gs_reader = createInterface({ input: process.stdin, output: process.stdout, terminal: false })[Symbol.asyncIterator]();
  }
  process.stdout.write(prompt + ' ');
  process.stdin.resume();
  const item = await $gs_reader.next();
  if (item.done) { $gs_ended = true; throw Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }); }
  process.stdin.pause();
  return item.value;
}`,
};
```
O erro leva `gsCode`, e `translateRuntimeError` (U2-11) classifica por essa propriedade, nunca por `error.message`; a frase em português vem do catálogo. O ajudante `mensagem` é definido na U2-11. `emit-helpers.ts`:
```ts
const LINE_BREAK = /\r\n|\r|\n/gu;

export function emitHelpers(code: string, sources: readonly string[]): { readonly code: string; readonly helperRange: LineRange | null } {
  if (sources.length === 0) return { code, helperRange: null };
  const appended = `${code}\n${sources.join('\n')}`;
  const startLine = Array.from(code.matchAll(LINE_BREAK)).length + 2;
  return { code: appended, helperRange: { startLine, endLine: Array.from(appended.matchAll(LINE_BREAK)).length + 1 } };
}
```
com `import type { LineRange } from '../api.types.ts'`. `collectHelpers` (ciclo 2) devolve `helpers` (nomes únicos, na ordem da primeira aparição, por `new Set` sobre o resultado do `flatMap`) quando `entry.kind === 'helper'` e a referência resolve para a biblioteca; `playground-target.ts` acrescenta o nome `tick` ao fim da lista com `[...helpers, 'tick']` quando `loopGuardEdits` devolve alguma edição. `module-target.ts` converte cada nome em fonte: `tick` por `tickSource(limit)` e os demais por `HELPER_SOURCES[name]`, que sempre existe para os nomes da tabela (a integridade é testada na U2-11), e passa a lista a `emitHelpers`.
- [ ] **Rodar** → passa.

**Ciclo 7 — alvos `module`, `repl`, `playground` e trava de laço**

- [ ] **Teste (RED)** `targets.test.ts`:
```ts
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('alvos', () => {
  it('playground e repl começam com use strict na linha 1', () => {
    expect(emit('prosa(1)', 'playground').code.startsWith("'use strict'; ")).toBe(true);
    expect(emit('uai a é 1', 'repl').code.split('\n')[0]).toBe("'use strict'; let a; a = 1;");
  });
  it('repl: declarações do topo viram atribuição e let lista todos os nomes', () => {
    const { code } = emit('uai x é 5\nfaz_trem f() { faz_favor x }\narruma_trem C {}', 'repl');
    expect(code).toBe("'use strict'; let x, f, C; x = 5;\nf = function f() { return x; };\nC = class C {};");
  });
  it('repl: await no topo vai em (async () => { … })() e a última expressão recebe return', () => {
    const { code } = emit('uai a é 1\nespera_um_cadim a\na mais 1', 'repl');
    expect(code.split('\n')[0]).toContain('(async () => {');
    expect(code).toMatch(/return a \+ 1;/);
    expect(code.trimEnd().endsWith('})()')).toBe(true);
  });
  it('trava de laço: tick global logo depois da { na mesma linha', () => {
    const { code } = emit('enquanto_tiver (certeza) {\n  prosa(1)\n}', 'playground', 1000);
    expect(code.split('\n')[0]).toContain('{ $gs_tick(1);');
    expect(code).toMatch(/function \$gs_tick\(/);
    expect(code).toContain('1000');
  });
  it('o tick usa um contador só e relança depois de estourar', () => {
    const { code } = emit('vai_indo (trem i é 0; i menor_que 2; i é i mais 1) { prosa(i) }', 'playground', 3);
    const helper = code.slice(code.indexOf('function $gs_tick'));
    const tick = runInNewContext(`${helper}; $gs_tick`) as (line: number) => void;
    tick(1); tick(1); tick(1);
    expect(() => tick(7)).toThrow(/GS0701/);
    expect(() => tick(7)).toThrow(/GS0701/);
  });
  it('nome que já está na sessão não entra no let do repl', () => {
    const session = { bindings: [{ name: 'z', kind: 'trem' as const }], members: [] };
    const { code } = emit('uai w é 1\ntrem z é 2', 'repl', undefined, session);
    expect(code).toBe("'use strict'; let w; w = 1;\nz = 2;");
  });
});
```
- [ ] **Rodar** → falha. **Implementar** `loop-guard.ts`:
```ts
export const DEFAULT_LOOP_LIMIT = 1_000_000;
export const tickSource = (limit: number): string =>
  `function $gs_tick(line) {\n  $gs_tick.n = ($gs_tick.n || 0) + 1;\n  if ($gs_tick.n > ${limit}) { throw Object.assign(new Error('GS0701'), { gsCode: 'GS0701', gsLine: line }); }\n}`;
```
(`n` fica em propriedade da função; depois de estourar `n` continua acima do limite, então todo tick relança.) `playground-target.ts`: insere `'use strict'; ` no offset 0 e, por `loopGuardEdits(node, context): readonly Edit[]` (pura, aplicada por `flatMapTree`), para cada `WhileStatement`/`ForStatement`/`ForOfStatement`/`ForInStatement`, uma inserção em `body.start + 1` com o texto `" $gs_tick(" + linha + ");"`, em que `linha` é `positionAt(source, node.start).line`. As edições do alvo são concatenadas às de `collectEdits` antes de `applyEdits`, sem alterar a lista recebida. `repl-target.ts`: monta o prefixo `'use strict'; let a, b;` com `topLevelBindings` menos os nomes da sessão, converte declarações do topo (`uai x é 5` → `x = 5;`, função → `f = function f() {…};`, classe → `C = class C {…};`) e, com `hasTopLevelAwait`, abre `(async () => {` na linha 1, fecha em linha própria depois da última linha e põe `return ` antes de `lastTopLevelExpression`. `module-target.ts` é o caso base.
- [ ] **Rodar** → passa.

**Ciclo 8 — preservação de linhas**

- [ ] **Teste (RED)** `lines.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('preservação de linhas', () => {
  it('token da linha N sai na linha N', () => {
    const src = 'uai a é 1\n\n// c\nse_ocê_quiser (a é_igualim 1)\n{\n  prosa(a)\n}';
    const lines = emit(src).code.split('\n');
    expect(lines[3]).toBe('if (a === 1)');
    expect(lines[5]).toBe('  console.log(a);');
  });
  it('terminadores \\r\\n e \\r isolado são preservados', () => {
    expect(emit('uai a é 1\r\nprosa(a)').code).toBe('const a = 1;\r\nconsole.log(a);');
    expect(emit('uai a é 1\rprosa(a)').code).toBe('const a = 1;\rconsole.log(a);');
  });
  it('BOM é omitido', () => {
    expect(emit('\uFEFFprosa(1)').code).toBe('console.log(1);');
  });
});
```
- [ ] **Rodar** → passa. Este ciclo não acrescenta código: fixa como teste de regressão a regra de que nenhuma edição insere quebra de linha, exceto o `\n` que antecede o bloco de ajudantes.

- [ ] **De-sloppify** (remover teste de tipo/defesa impossível; deixar `lower.ts` com no máximo 400 linhas). **Verify:** `corepack pnpm verify`.
- [ ] **Commit:** `feat(compiler): adiciona rebaixamento por edições e emissão por alvo`, com o corpo registrando `length` e `kind` em `MappingSegment` e a atualização do bloco de interfaces do plano no mesmo commit.

---

### U2-09: Source map v3 por token
**Spec:** §5.7, §5.3 · **Tier:** medium · **Depende de:** U2-08 · **Risco:** coluna ou linha errada com BOM, `\r\n` ou par substituto desalinha erro de execução. · **Rollback:** reverter; `compile()` ainda monta `map: null`.
**Files:**
- Create: `packages/compiler/src/sourcemap/{vlq.ts,source-map.ts,source-map.types.ts}`
- Test: `packages/compiler/tests/unit/sourcemap/{vlq,source-map}.test.ts`
- Modify: `packages/compiler/package.json` (devDependency `@jridgewell/trace-mapping` em versão exata, lida de `npm view @jridgewell/trace-mapping version` no dia e registrada no ADR-0005)

**Interfaces:** Consumes `MappingSegment { generatedOffset, originalOffset | null, length, kind }` (U2-08), `createSourceText`, `positionAt`, `toMappingPosition`, `SourceText`. Produces `encodeVlq(value): string`, `SourceMapV3` (em `source-map.types.ts`; a U2-10 o reexporta em `api.types.ts`) e `buildSourceMap(source, generatedCode, segments): SourceMapV3` com `version: 3`, `file`, `sources: [fileName]`, `sourcesContent: [source.text]`, `names: []` e `mappings`. O quarto parâmetro `helperRange` do bloco de interfaces compartilhado sai, registrado no commit: as linhas de ajudante nascem sem segmento de mapeamento (o texto dos ajudantes é anexado depois de `applyEdits`), logo o mapa não precisa conhecê-las; `ignoreList` não é emitido porque há uma só fonte.

**Aceite:** `originalPositionFor` do trace-mapping resolve cada token; nenhuma origem para linhas de ajudante; linhas corretas com BOM + `\r\n` e `\r`.

- [ ] **Teste (RED)** `vlq.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { encodeVlq } from '../../../src/sourcemap/vlq.ts';

describe('VLQ', () => {
  it.each([[0, 'A'], [1, 'C'], [-1, 'D'], [15, 'e'], [16, 'gB'], [-16, 'hB'], [123, '2H']])('%i → %s', (value, text) => {
    expect(encodeVlq(value)).toBe(text);
  });
});
```
- [ ] **Rodar:** `… test -- tests/unit/sourcemap/vlq.test.ts` → falha: módulo ausente.
- [ ] **Implementar** `vlq.ts`:
```ts
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CONTINUATION = 0b100000;
const PAYLOAD_MASK = 0b11111;
const PAYLOAD_BITS = 5;

export function encodeVlq(value: number): string {
  let remaining = value < 0 ? (-value << 1) | 1 : value << 1;
  let out = '';
  do {
    let digit = remaining & PAYLOAD_MASK;
    remaining >>>= PAYLOAD_BITS;
    if (remaining > 0) digit |= CONTINUATION;
    out += BASE64[digit];
  } while (remaining > 0);
  return out;
}
```
- [ ] **Rodar** → passa.
- [ ] **Teste (RED)** `source-map.test.ts`:
```ts
import { originalPositionFor, TraceMap } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { buildSourceMap } from '../../../src/sourcemap/source-map.ts';
import { emit } from '../../support/lower.ts';
import { createSourceText } from '../../../src/source/source-text.ts';

function mapOf(text: string) {
  const out = emit(text);
  const source = createSourceText(text, 'programa.gs');
  return { out, map: buildSourceMap(source, out.code, out.segments) };
}
const find = (map: ReturnType<typeof mapOf>['map'], line: number, column: number) =>
  originalPositionFor(new TraceMap(JSON.stringify(map)), { line, column });

describe('source map', () => {
  it('mapeia token de keyword trocado e token copiado', () => {
    const { map } = mapOf('uai total é 10\nprosa(total)');
    expect(find(map, 1, 6)).toMatchObject({ source: 'programa.gs', line: 1, column: 4 });
    expect(find(map, 2, 12)).toMatchObject({ line: 2, column: 6 });
  });
  it('arquivo do Windows: BOM e \\r\\n dão as mesmas linhas (Review Focus 1)', () => {
    const lf = mapOf('uai a é 1\nprosa(a)');
    const win = mapOf('\uFEFFuai a é 1\r\nprosa(a)');
    expect(find(win.map, 2, 12)).toMatchObject({ line: 2 });
    expect(find(win.map, 2, 12).line).toBe(find(lf.map, 2, 12).line);
  });
  it('\\r isolado conta como quebra', () => {
    expect(find(mapOf('uai a é 1\rprosa(a)').map, 2, 12)).toMatchObject({ line: 2 });
  });
  it('par substituto antes do token conta 2 unidades', () => {
    const { map } = mapOf('uai t é 1\nprosa("😀", t)');
    expect(find(map, 2, 18)).toMatchObject({ line: 2, column: 12 });
  });
  it('código de ajudante não tem origem', () => {
    const { map, out } = mapOf('uai n é pergunta("x")');
    const helperLine = (out.helperRange?.startLine ?? 0);
    expect(find(map, helperLine, 0).source).toBeNull();
    expect(map.sourcesContent).toEqual(['uai n é pergunta("x")']);
  });
});
```
- [ ] **Rodar** → falha (`buildSourceMap` ausente).
- [ ] **Implementar** `source-map.types.ts`:
```ts
export interface SourceMapV3 {
  readonly version: 3;
  readonly file: string;
  readonly sources: readonly string[];
  readonly sourcesContent: readonly string[];
  readonly names: readonly string[];
  readonly mappings: string;
}
```
e `source-map.ts`. Cada segmento `copy` vira um mapeamento por token (início de cada palavra ou pontuação, via `TOKEN_PATTERN`), porque o trecho copiado é 1:1; `replace` vira um mapeamento no início do trecho trocado (e nenhum quando o texto trocado é vazio, como o BOM); `insert` vira um mapeamento de um campo só, sem origem. Linha e coluna do JS vêm de `createSourceText(generatedCode, …)`, que já conta `\n`, `\r\n` (uma quebra) e `\r`:
```ts
import { toMappingPosition } from '../source/position-convert.ts';
import { createSourceText, positionAt } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';
import type { MappingSegment } from '../lowering/edit.types.ts';
import type { SourceMapV3 } from './source-map.types.ts';
import { encodeVlq } from './vlq.ts';

const TOKEN_PATTERN = /[\p{L}\p{N}_]+|[^\s\p{L}\p{N}_]/gu;
const SOURCE_EXTENSION = /\.gs$/iu;
const EMITTED_EXTENSION = '.mjs';
const SOURCE_INDEX_DELTA = 0;
const LINE_SEPARATOR = ';';
const FIELD_SEPARATOR = ',';

interface Piece { readonly generatedOffset: number; readonly originalOffset: number | null }

function expandSegments(source: SourceText, segments: readonly MappingSegment[]): readonly Piece[] {
  return segments.flatMap((segment): readonly Piece[] => {
    if (segment.kind === 'insert') return [{ generatedOffset: segment.generatedOffset, originalOffset: null }];
    if (segment.originalOffset === null || segment.length === 0) return [];
    const original = segment.originalOffset;
    if (segment.kind === 'replace') return [{ generatedOffset: segment.generatedOffset, originalOffset: original }];
    const copied = source.text.slice(original, original + segment.length);
    return Array.from(copied.matchAll(TOKEN_PATTERN), (match) => ({
      generatedOffset: segment.generatedOffset + match.index,
      originalOffset: original + match.index,
    }));
  });
}

const separatorBefore = (index: number, line: number, previousLine: number): string => {
  if (index === 0) return LINE_SEPARATOR.repeat(line);
  return line === previousLine ? FIELD_SEPARATOR : LINE_SEPARATOR.repeat(line - previousLine);
};

// Acumuladores primitivos: copiar um objeto de estado a cada mapeamento tornaria o mapa quadrático (teto de 150 ms, §5.11).
function encodeMappings(source: SourceText, generated: SourceText, pieces: readonly Piece[]): string {
  let previousLine = 0;
  let previousColumn = 0;
  let sourceLine = 0;
  let sourceColumn = 0;
  const entries = pieces.map((piece, index) => {
    const target = toMappingPosition(positionAt(generated, piece.generatedOffset));
    const sameLine = index > 0 && target.line === previousLine;
    const columnDelta = sameLine ? target.column - previousColumn : target.column;
    const separator = separatorBefore(index, target.line, previousLine);
    previousLine = target.line;
    previousColumn = target.column;
    if (piece.originalOffset === null) return `${separator}${encodeVlq(columnDelta)}`;
    const original = toMappingPosition(positionAt(source, piece.originalOffset));
    const fields = [columnDelta, SOURCE_INDEX_DELTA, original.line - sourceLine, original.column - sourceColumn];
    sourceLine = original.line;
    sourceColumn = original.column;
    return `${separator}${fields.map(encodeVlq).join('')}`;
  });
  const trailing = LINE_SEPARATOR.repeat(generated.lineStarts.length - 1 - previousLine);
  return `${entries.join('')}${trailing}`;
}

export function buildSourceMap(source: SourceText, generatedCode: string, segments: readonly MappingSegment[]): SourceMapV3 {
  const generated = createSourceText(generatedCode, source.fileName);
  return {
    version: 3,
    file: source.fileName.replace(SOURCE_EXTENSION, EMITTED_EXTENSION),
    sources: [source.fileName],
    sourcesContent: [source.text],
    names: [],
    mappings: encodeMappings(source, generated, expandSegments(source, segments)),
  };
}
```
(O mapa nasce de uma só passada de `map` mais `join`: nenhum `push` em lista por linha. As peças chegam em ordem crescente de `generatedOffset`, então `;` aparece só entre linhas e as linhas finais sem mapeamento viram os `;` de `trailing`.)
- [ ] **Rodar** → passa.
- [ ] **De-sloppify; verify:** `corepack pnpm verify`.
- [ ] **Commit:** `feat(compiler): adiciona source map v3 por token`, com o corpo registrando a remoção do parâmetro `helperRange` de `buildSourceMap` e a atualização do bloco de interfaces do plano no mesmo commit.

---

### U2-10: API pública `compile()` (GS0901)
**Spec:** §5.9, §4.11, §5.6 (garantia) · **Tier:** medium · **Depende de:** U2-09 · **Risco:** exceção vazando de `compile()` ou `ok: true` com JS rejeitado pelo acorn. · **Rollback:** reverter; nenhum consumidor da Fase 3 ainda.
**Files:**
- Create: `packages/compiler/src/compile.ts`, `packages/compiler/src/diagnostics/report.ts`
- Modify: `packages/compiler/src/api.types.ts` (completa a §5.9 com `Diagnostic`, `CompileOptions`, `CompileSuccess`, `CompileFailure`, `CompileResult`, `OptimizeResult`, `RuntimeErrorContext` e o reexport de `SourceMapV3`; os tipos da U2-02 e `DiagnosticExplanation` da U2-03 ficam como estão), `packages/compiler/src/index.ts` (já exporta `explainDiagnostic` desde a U2-03; ganha `compile` e `export type * from './api.types.ts'`)
- Test: `packages/compiler/tests/unit/{compile,report}.test.ts`, `packages/compiler/tests/unit/compile-internal-error.test.ts`

**Interfaces:** Consumes `parse`, `createLexer`, `analyze`, `emitProgram`, `buildSourceMap`, `createSourceText`, `rangeOf`, `RawDiagnostic`, `formatMessage` e `explainDiagnostic` (ambos da U2-03; esta unidade não os cria nem os testa), `lookupDiagnostic`. Produces `compile(source, options?)`, `toDiagnostic(raw, source, tone)` e `mergeSession(previous, analysis)`; `index.ts` reexporta a API da §5.9 (`compile`, `explainDiagnostic`; `translateRuntimeError` entra na U2-11).

**Aceite:** `compile` nunca lança (bug vira `GS0901` em 1:1 de largura zero); `incomplete` só no `repl` com GS0201/GS0106; diagnósticos ordenados por posição; `session` imutável e somada; `echo`.

**Ciclo 1 — sucesso e falha**

- [ ] **Teste (RED)** `compile.test.ts`:
```ts
import { parse as acornParse } from 'acorn';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';

describe('compile', () => {
  it('sucesso: code, map, helperRange nulo e diagnósticos vazios', () => {
    const result = compile('prosa("oi")');
    expect(result).toMatchObject({ ok: true, code: 'console.log("oi");', helperRange: null, session: null, echo: false });
    expect(result.ok && result.map?.version).toBe(3);
  });
  it('sourceMap: false devolve map nulo', () => {
    const result = compile('prosa(1)', { sourceMap: false });
    expect(result.ok && result.map).toBeNull();
  });
  it('vários diagnósticos ordenados por posição (Review Focus 2)', () => {
    const result = compile('uai a = 1\nconsole.log(a)\nuai b é nomi');
    expect(result.ok).toBe(false);
    const codes = result.diagnostics.map((d) => d.code);
    expect(codes.length).toBeGreaterThanOrEqual(3);
    const starts = result.diagnostics.map((d) => d.range.start.offset);
    expect(starts).toEqual([...starts].sort((x, y) => x - y));
  });
  it('tom neutro muda a frase', () => {
    const raiz = compile('uai x é nomi', { tone: 'raiz' }).diagnostics[0]?.message;
    const neutro = compile('uai x é nomi', { tone: 'neutro' }).diagnostics[0]?.message;
    expect(raiz).not.toBe(neutro);
  });
  it('warning não derruba ok', () => {
    const result = compile('uai Data é 1\nprosa(Data)');
    expect(result.ok).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toEqual(['GS0804']);
  });
  it('ok: true implica JS aceito pelo acorn', () => {
    const result = compile('uai l é [3, 1]\nprosa(l.ordenar())\nuai n é pergunta("x")');
    if (!result.ok) throw new Error('esperava ok');
    expect(() => acornParse(result.code, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
  });
});
```
- [ ] **Rodar:** `… test -- tests/unit/compile.test.ts` → falha: módulo ausente.
- [ ] **Implementar** `compile.ts`:
```ts
const DEFAULT_FILE_NAME = 'programa.gs';
const INTERNAL_ERROR_CODE = 'GS0901';
const INCOMPLETE_CODES: ReadonlySet<string> = new Set(['GS0201', 'GS0106']);

const severityOf = (code: string): Severity => lookupDiagnostic(code)?.severity ?? 'error';

export function compile(text: string, options: CompileOptions = {}): CompileResult {
  const tone = options.tone ?? 'raiz';
  try {
    return compileUnsafe(text, options, tone);
  } catch {
    return internalFailure(tone);
  }
}

function compileUnsafe(text: string, options: CompileOptions, tone: Tone): CompileResult {
  const target = options.target ?? 'module';
  const source = createSourceText(text, options.fileName ?? DEFAULT_FILE_NAME);
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, { target, ...(options.session ? { session: options.session } : {}) });
  const raws = [...parsed.diagnostics, ...analysis.diagnostics].toSorted((a, b) => a.start - b.start);
  const diagnostics = raws.map((raw) => toDiagnostic(raw, source, tone));
  const errors = raws.filter((raw) => severityOf(raw.code) === 'error');
  if (errors.length > 0) {
    return { ok: false, diagnostics, incomplete: target === 'repl' && errors.every((raw) => INCOMPLETE_CODES.has(raw.code)) };
  }
  return buildSuccess(source, parsed, analysis, diagnostics, options, target);
}

// O detalhe técnico não sai para o aluno: a mensagem do motor seria inglês e o GS0901 já pede o relato.
function internalFailure(tone: Tone): CompileFailure {
  const raw: RawDiagnostic = { code: INTERNAL_ERROR_CODE, start: 0, end: 0, args: {} };
  return { ok: false, diagnostics: [toDiagnostic(raw, createSourceText('', DEFAULT_FILE_NAME), tone)], incomplete: false };
}

function buildSuccess(source: SourceText, parsed: ParseResult, analysis: AnalysisResult, diagnostics: readonly Diagnostic[], options: CompileOptions, target: CompileTarget): CompileSuccess {
  const emitted = emitProgram(parsed.program, analysis, source, { target, ...(options.loopLimit === undefined ? {} : { loopLimit: options.loopLimit }) });
  return {
    ok: true,
    code: emitted.code,
    diagnostics,
    helperRange: emitted.helperRange,
    map: options.sourceMap === false ? null : buildSourceMap(source, emitted.code, emitted.segments),
    session: target === 'repl' ? mergeSession(options.session, analysis) : null,
    echo: target === 'repl' && analysis.lastTopLevelExpression !== undefined,
  };
}

export function mergeSession(previous: ReplSession | undefined, analysis: AnalysisResult): ReplSession {
  const merged = [...(previous?.bindings ?? []), ...analysis.topLevelBindings];
  const bindings = new Map(merged.map((binding) => [binding.name, binding] as const));
  const members = new Set([...(previous?.members ?? []), ...analysis.declaredMembers]);
  return { bindings: [...bindings.values()], members: [...members].toSorted() };
}
```
Os diagnósticos do lexer já vêm dentro de `parsed.diagnostics` (U2-05). O `range` de largura zero em 1:1 do `GS0901` sai de `rangeOf(fonte vazia, 0, 0)`. `report.ts`:
```ts
export function toDiagnostic(raw: RawDiagnostic, source: SourceText, tone: Tone): Diagnostic {
  const definition = lookupDiagnostic(raw.code);
  const range = rangeOf(source, raw.start, raw.end);
  if (!definition) return { code: raw.code, severity: 'error', range, message: raw.code };
  const help = definition.help?.[tone];
  return {
    code: raw.code, severity: definition.severity, range,
    message: formatMessage(definition.messages[tone], raw.args),
    ...(help === undefined ? {} : { help: formatMessage(help, raw.args) }),
    ...(definition.lesson === undefined ? {} : { lesson: definition.lesson }),
  };
}
```
A mensagem e a ajuda saem de `formatMessage` (U2-03): trecho opcional `[[ … ]]` some quando falta o marcador e marcador sem valor vira `«nome»`.
- [ ] **Rodar** → passa.

**Ciclo 2 — GS0901 por injeção de falha e REPL**

- [ ] **Teste (RED)** `compile-internal-error.test.ts` (arquivo próprio, porque `vi.mock` vale para o arquivo inteiro e módulo ESM não aceita `vi.spyOn`):
```ts
import { describe, expect, it, vi } from 'vitest';
import { compile } from '../../src/compile.ts';

vi.mock('../../src/analyzer/analyzer.ts', () => ({
  analyze: () => {
    throw new RangeError('pilha');
  },
}));

describe('compile: falha interna', () => {
  it('exceção interna vira GS0901 em 1:1, sem lançar', () => {
    const result = compile('prosa(1)');
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({
      code: 'GS0901',
      range: { start: { offset: 0, line: 1, column: 1 }, end: { offset: 0, line: 1, column: 1 } },
    });
  });
});
```
- [ ] **Teste (RED)** `compile.test.ts` (acrescentar):
```ts
describe('compile: REPL e determinismo', () => {
  it('repl: incomplete só para GS0201/GS0106', () => {
    expect(compile('faz_trem f() {', { target: 'repl' })).toMatchObject({ ok: false, incomplete: true });
    expect(compile('/* aberto', { target: 'repl' })).toMatchObject({ ok: false, incomplete: true });
    expect(compile('uai t é "aberto', { target: 'repl' })).toMatchObject({ ok: false, incomplete: false });
    expect(compile('faz_trem f() {', { target: 'module' })).toMatchObject({ ok: false, incomplete: false });
  });
  it('repl: session soma, não muta e echo marca expressão', () => {
    const session = { bindings: [{ name: 'x', kind: 'uai' as const }], members: [] };
    const frozen = JSON.stringify(session);
    const result = compile('uai y é 1\ny mais x', { target: 'repl', session });
    expect(JSON.stringify(session)).toBe(frozen);
    expect(result).toMatchObject({ ok: true, echo: true });
    expect(result.ok && result.session?.bindings.map((b) => b.name)).toEqual(['x', 'y']);
  });
  it('repl: entrada que não compila não devolve sessão', () => {
    const result = compile('uai z é nomi', { target: 'repl' });
    expect(result.ok).toBe(false);
    expect(result).not.toHaveProperty('session');
  });
  it('compile é determinístico', () => {
    const src = 'uai l é [2, 1]\nprosa(l.ordenar())';
    expect(compile(src)).toEqual(compile(src));
  });
});
```
- [ ] **Teste de formato** `report.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { toDiagnostic } from '../../src/diagnostics/report.ts';
import { createSourceText } from '../../src/source/source-text.ts';

describe('toDiagnostic', () => {
  const source = createSourceText('uai a é nomi', 'programa.gs');
  it('monta código, severidade, faixa e mensagem no tom pedido', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi', suggestion: 'nome' } };
    expect(toDiagnostic(raw, source, 'neutro')).toEqual({
      code: 'GS0301',
      severity: 'error',
      range: { start: { offset: 8, line: 1, column: 9 }, end: { offset: 12, line: 1, column: 13 } },
      message: 'O nome "nomi" não foi declarado. Você quis dizer "nome"?',
    });
  });
  it('omite a pergunta quando não há sugestão', () => {
    const raw = { code: 'GS0301', start: 8, end: 12, args: { name: 'nomi' } };
    expect(toDiagnostic(raw, source, 'neutro').message).toBe('O nome "nomi" não foi declarado.');
  });
  it('código fora do catálogo vira erro com o próprio código na mensagem', () => {
    const raw = { code: 'GS9999', start: 0, end: 0, args: {} };
    expect(toDiagnostic(raw, source, 'raiz')).toMatchObject({ code: 'GS9999', severity: 'error', message: 'GS9999' });
  });
});
```
- [ ] **Rodar** → passa (o `report.ts` já existe do ciclo 1; este teste fixa o formato).
- [ ] **De-sloppify; verify:** `corepack pnpm verify`.
- [ ] **Commit:** `feat(compiler): adiciona compile() estável com falha interna em GS0901`

---

### U2-11: Tradução de erros de execução e frases de `.mensagem`
**Spec:** §5.10, §4.9 (P10), §4.10 · **Tier:** medium · **Depende de:** U2-10 · **Risco:** classificar por texto do motor quebra entre Node 22 e 24. · **Rollback:** reverter; CLI/REPL da Fase 3 ainda não consomem.
**Files:**
- Create: `packages/compiler/src/runtime-errors/{stack-frames.ts,classify.ts,original-position.ts,translate.ts}`, `packages/compiler/src/helpers/message-source.ts`
- Modify: `packages/compiler/src/sourcemap/vlq.ts` (acrescenta a leitura `decodeMappings`), `packages/compiler/src/helpers/helper-sources.ts` (acrescenta a chave `mensagem`), `packages/compiler/src/index.ts`
- Test: `packages/compiler/tests/unit/runtime-errors/{stack-frames,original-position,translate,message}.test.ts`

**Interfaces:** Consumes `RuntimeErrorContext`, `Diagnostic`, `SourceMapV3`, `LineRange`, `createSourceText`, `positionAt`, `offsetAt`, `toDiagnostic` (U2-10), `lookupDiagnostic`, `HELPER_SOURCES` (U2-08). A leitura do mapa é própria e sem dependência de runtime: `decodeMappings` em `sourcemap/vlq.ts` e `originalPositionFor(map, line, column)` em `runtime-errors/original-position.ts`; o teste usa o trace-mapping como oráculo. Produces `translateRuntimeError(error, context, tone?)`, `parseStackFrames(stack)`, `classifyRuntimeError(error): string` (código GSnnnn) e `HELPER_SOURCES.mensagem`.

**Códigos (D2):** `GS0710` TypeError, `GS0711` ReferenceError, `GS0712` RangeError, `GS0713` SyntaxError, `GS0714` qualquer outro, inclusive valor lançado que não é `Error`; `GS0701` laço, `GS0702` fim da entrada e `GS0703` promessa pendente chegam pela propriedade `gsCode` do erro, posta pelos ajudantes. Um código genérico por classe, decidido por `name` do erro (que atravessa realms) e nunca por `error.message`. A escolha de uma frase mais fina a partir da mensagem do motor (por exemplo, distinguir leitura de `nada` de chamada de não-função) é pergunta aberta ao dono e fica fora deste plano.

**Aceite:** primeiro frame fora de `helperRange`; mensagem do motor nunca exibida; `GS0701` pelo `gsLine` do erro; `fileName` do contexto; `.mensagem` devolve a frase genérica em português da classe para `TypeError`, `ReferenceError`, `RangeError` e `SyntaxError`, e a mensagem intacta para erro do programa.

- [ ] **Teste (RED)** `stack-frames.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { parseStackFrames } from '../../../src/runtime-errors/stack-frames.ts';

describe('parseStackFrames', () => {
  it('lê frames com e sem função, base 1', () => {
    const stack = ['TypeError: x', '    at f (file:///tmp/a.mjs:3:9)', '    at file:///tmp/a.mjs:7:1', '    at async Promise.all (index 0)'].join('\n');
    expect(parseStackFrames(stack)).toEqual([
      { functionName: 'f', line: 3, column: 9 },
      { functionName: null, line: 7, column: 1 },
    ]);
  });
  it('stack ausente ou não-texto devolve lista vazia', () => {
    expect(parseStackFrames(undefined)).toEqual([]);
    expect(parseStackFrames(42)).toEqual([]);
  });
});
```
- [ ] **Rodar:** → falha (módulo ausente). **Implementar:**
```ts
const FRAME = /^\s*at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/u;
const STACK_LINE_BREAK = /\r\n|\n|\r/u;

export interface StackFrame { readonly functionName: string | null; readonly line: number; readonly column: number }

export function parseStackFrames(stack: unknown): readonly StackFrame[] {
  if (typeof stack !== 'string') return [];
  return stack.split(STACK_LINE_BREAK).flatMap((row): readonly StackFrame[] => {
    const match = FRAME.exec(row);
    return match === null ? [] : [{ functionName: match[1] ?? null, line: Number(match[3]), column: Number(match[4]) }];
  });
}
```
O caminho do arquivo é lido de forma lazy até o último `:linha:coluna`, então também vale para `file:///C:/x/a.mjs:3:9` no Windows.
- [ ] **Rodar** → passa.
- [ ] **Teste (RED)** `translate.test.ts` — monta o contexto compilando de verdade:
```ts
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';
import { translateRuntimeError } from '../../../src/runtime-errors/translate.ts';

function contextOf(text: string) {
  const result = compile(text);
  if (!result.ok) throw new Error('esperava ok');
  return { result, context: { map: result.map, helperRange: result.helperRange, fileName: 'programa.gs', source: text } };
}
const EMITTED_FILE = 'file:///t/a.mjs';
function fail(code: string): unknown {
  try {
    new Script(code, { filename: EMITTED_FILE }).runInNewContext({ console });
  } catch (error: unknown) {
    return error;
  }
  return undefined;
}

describe('translateRuntimeError', () => {
  it('TypeError vira GS0710 na linha do .gs, sem texto do motor', () => {
    const { result, context } = contextOf('uai o é { x: 1 }\nuai a é nada\nprosa(a.x)');
    const error = fail(result.code.replace('console.log', 'void '));
    const diagnostic = translateRuntimeError(error, context);
    expect(diagnostic.code).toBe('GS0710');
    expect(diagnostic.range.start.line).toBe(3);
    expect(diagnostic.message).not.toMatch(/Cannot read|undefined|null/);
  });
  it('cada classe do motor tem o seu código, por name e não por mensagem', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(new TypeError('x'), base).code).toBe('GS0710');
    expect(translateRuntimeError(new ReferenceError('x'), base).code).toBe('GS0711');
    expect(translateRuntimeError(new RangeError('x'), base).code).toBe('GS0712');
    expect(translateRuntimeError(new SyntaxError('x'), base).code).toBe('GS0713');
    expect(translateRuntimeError(new Error('Cannot read properties of undefined'), base).code).toBe('GS0714');
    expect(translateRuntimeError(new URIError('x'), base).code).toBe('GS0714');
    expect(translateRuntimeError('texto solto', base).code).toBe('GS0714');
  });
  it('erro de outro realm é classificado pelo name', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(fail('null.x'), base).code).toBe('GS0710');
  });
  it('erro em ajudante aponta a linha do .gs que chamou', () => {
    const text = 'uai l é 5\nprosa(l.ordenar())';
    const result = compile(text);
    if (!result.ok || !result.helperRange) throw new Error('esperava ajudante');
    const helperLine = result.helperRange.startLine + 1;
    const error = new TypeError('x');
    error.stack = `TypeError: x\n    at $gs_ordem (file:///t/a.mjs:${helperLine}:5)\n    at file:///t/a.mjs:2:20`;
    const diagnostic = translateRuntimeError(error, { map: result.map, helperRange: result.helperRange, fileName: 'programa.gs', source: text });
    expect(diagnostic.range.start.line).toBe(2);
  });
  it('todos os frames em ajudante: largura zero em 1:1', () => {
    const range = { startLine: 1, endLine: 9 };
    const error = new TypeError('x');
    error.stack = 'TypeError: x\n    at h (file:///t/a.mjs:2:1)';
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: range, fileName: 'programa.gs', source: 'a' });
    expect(diagnostic.range.start).toMatchObject({ line: 1, column: 1, offset: 0 });
    expect(diagnostic.range.end.offset).toBe(0);
  });
  it('sem mapa, o range cobre a linha inteira do frame', () => {
    const error = new TypeError('x');
    error.stack = 'TypeError: x\n    at file:///t/a.mjs:2:3';
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: null, fileName: 'programa.gs', source: 'abc\ndefg\nh' });
    expect(diagnostic.range.start.line).toBe(2);
    expect(diagnostic.range.end.offset - diagnostic.range.start.offset).toBe(4);
  });
  it('GS0701 usa o gsLine do erro, sem depender da pilha', () => {
    const error = Object.assign(new Error('GS0701'), { gsCode: 'GS0701', gsLine: 4 });
    const diagnostic = translateRuntimeError(error, { map: null, helperRange: null, fileName: 'programa.gs', source: 'a\nb\nc\nd' });
    expect(diagnostic).toMatchObject({ code: 'GS0701' });
    expect(diagnostic.range.start.line).toBe(4);
    expect(diagnostic.message).toContain('linha 4');
  });
  it('erro marcado com gsCode GS0702 do ajudante vira GS0702; sem a marca, é genérico', () => {
    const base = { map: null, helperRange: null, fileName: 'programa.gs', source: 'x' };
    expect(translateRuntimeError(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }), base).code).toBe('GS0702');
    expect(translateRuntimeError(new Error('GS0702'), base).code).toBe('GS0714');
  });
});
```
O primeiro teste roda o JS emitido em `vm.Script` com nome de arquivo fixo, para que a pilha traga a linha real do JS (3) sem o deslocamento de `new Function`; o `void` no lugar de `console.log` força o `TypeError` do motor.
- [ ] **Rodar** → falha. **Implementar** `classify.ts`:
```ts
export const RUNTIME_CODE = { TypeError: 'GS0710', ReferenceError: 'GS0711', RangeError: 'GS0712', SyntaxError: 'GS0713' } as const;
export const GENERIC_RUNTIME_CODE = 'GS0714';

const CODE_BY_CLASS: ReadonlyMap<string, string> = new Map(Object.entries(RUNTIME_CODE));
const COMPILER_CODES: ReadonlySet<string> = new Set(['GS0701', 'GS0702', 'GS0703']);

// `instanceof Error` falha entre realms (vm, worker); o name atravessa.
export function isErrorLike(value: unknown): value is { readonly name: string } {
  return typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string';
}

export function classifyRuntimeError(error: unknown): string {
  if (!isErrorLike(error)) return GENERIC_RUNTIME_CODE;
  if ('gsCode' in error && typeof error.gsCode === 'string' && COMPILER_CODES.has(error.gsCode)) return error.gsCode;
  return CODE_BY_CLASS.get(error.name) ?? GENERIC_RUNTIME_CODE;
}

export function loopLineOf(error: unknown): number | undefined {
  return isErrorLike(error) && 'gsLine' in error && typeof error.gsLine === 'number' ? error.gsLine : undefined;
}
```
`original-position.ts` e a leitura em `sourcemap/vlq.ts` (que já tem `BASE64`, `CONTINUATION`, `PAYLOAD_MASK` e `PAYLOAD_BITS` da U2-09):
```ts
// vlq.ts (acrescentar)
export interface DecodedSegment { readonly generatedColumn: number; readonly originalLine: number | null; readonly originalColumn: number | null }

const BASE64_INDEX: ReadonlyMap<string, number> = new Map(Array.from(BASE64, (char, index) => [char, index] as const));

interface VlqState {
  readonly values: readonly number[];
  readonly accumulator: number;
  readonly shift: number;
}

const INITIAL_VLQ_STATE: VlqState = { values: [], accumulator: 0, shift: 0 };

// Um segmento tem poucos campos, então copiar `values` a cada dígito fechado custa quase nada.
function readDigit(state: VlqState, char: string): VlqState {
  const digit = BASE64_INDEX.get(char) ?? 0;
  const accumulator = state.accumulator + ((digit & PAYLOAD_MASK) << state.shift);
  if ((digit & CONTINUATION) !== 0) return { ...state, accumulator, shift: state.shift + PAYLOAD_BITS };
  const value = (accumulator & 1) === 1 ? -(accumulator >>> 1) : accumulator >>> 1;
  return { values: [...state.values, value], accumulator: 0, shift: 0 };
}

export const decodeVlqFields = (raw: string): readonly number[] => Array.from(raw).reduce(readDigit, INITIAL_VLQ_STATE).values;

export function decodeMappings(mappings: string): readonly (readonly DecodedSegment[])[] {
  let originalLine = 0;
  let originalColumn = 0;
  return mappings.split(';').map((line) => {
    let generatedColumn = 0;
    return line === '' ? [] : line.split(',').map((raw): DecodedSegment => {
      const fields = decodeVlqFields(raw);
      generatedColumn += fields[0] ?? 0;
      if (fields.length < 4) return { generatedColumn, originalLine: null, originalColumn: null };
      originalLine += fields[2] ?? 0;
      originalColumn += fields[3] ?? 0;
      return { generatedColumn, originalLine, originalColumn };
    });
  });
}
```
```ts
// original-position.ts
import { decodeMappings } from '../sourcemap/vlq.ts';
import type { SourceMapV3 } from '../sourcemap/source-map.types.ts';

// line base 1 e column base 0 do JS gerado; devolve line base 0 e column base 0 do .gs, ou null sem origem.
export function originalPositionFor(map: SourceMapV3, line: number, column: number): { readonly line: number; readonly column: number } | null {
  const segments = decodeMappings(map.mappings)[line - 1] ?? [];
  const candidate = segments.filter((segment) => segment.generatedColumn <= column).at(-1);
  if (candidate === undefined || candidate.originalLine === null || candidate.originalColumn === null) return null;
  return { line: candidate.originalLine, column: candidate.originalColumn };
}
```
`translate.ts`:
```ts
import type { Diagnostic, LineRange, RuntimeErrorContext, Tone } from '../api.types.ts';
import { toDiagnostic } from '../diagnostics/report.ts';
import { createSourceText, offsetAt, positionAt } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';
import { classifyRuntimeError, isErrorLike, loopLineOf } from './classify.ts';
import { originalPositionFor } from './original-position.ts';
import { parseStackFrames } from './stack-frames.ts';

interface OffsetRange { readonly start: number; readonly end: number }

const TRAILING_BREAK = /(?:\r\n|\r|\n)$/u;
const TOKEN_AT_START = /^(?:[\p{L}\p{N}_]+|\S)/u;
const EMPTY_RANGE: OffsetRange = { start: 0, end: 0 };

const isHelperLine = (line: number, helperRange: LineRange | null): boolean =>
  helperRange !== null && line >= helperRange.startLine && line <= helperRange.endLine;

function lineRange(source: SourceText, line: number): OffsetRange {
  const start = source.lineStarts[line - 1];
  if (start === undefined) return EMPTY_RANGE;
  const next = source.lineStarts[line] ?? source.text.length;
  return { start, end: start + source.text.slice(start, next).replace(TRAILING_BREAK, '').length };
}

function locate(error: unknown, context: RuntimeErrorContext, source: SourceText): OffsetRange {
  const loopLine = loopLineOf(error);
  if (loopLine !== undefined) return lineRange(source, loopLine);
  const stack = isErrorLike(error) && 'stack' in error ? error.stack : undefined;
  const frame = parseStackFrames(stack).find((candidate) => !isHelperLine(candidate.line, context.helperRange));
  if (frame === undefined) return EMPTY_RANGE;
  const original = context.map === null ? null : originalPositionFor(context.map, frame.line, frame.column - 1);
  if (original === null) return lineRange(source, frame.line);
  const start = offsetAt(source, original.line + 1, original.column + 1);
  return { start, end: start + (TOKEN_AT_START.exec(source.text.slice(start))?.[0].length ?? 0) };
}

export function translateRuntimeError(error: unknown, context: RuntimeErrorContext, tone: Tone = 'raiz'): Diagnostic {
  const source = createSourceText(context.source, context.fileName);
  const { start, end } = locate(error, context, source);
  const args = { file: context.fileName, line: String(positionAt(source, start).line) };
  return toDiagnostic({ code: classifyRuntimeError(error), start, end, args }, source, tone);
}
```
- [ ] **Teste de leitura do mapa** `original-position.test.ts`, com o trace-mapping como oráculo:
```ts
import { originalPositionFor as oracle, TraceMap } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { originalPositionFor } from '../../../src/runtime-errors/original-position.ts';
import { buildSourceMap } from '../../../src/sourcemap/source-map.ts';
import { createSourceText } from '../../../src/source/source-text.ts';
import { emit } from '../../support/lower.ts';

describe('originalPositionFor', () => {
  it('concorda com o trace-mapping em todas as colunas do JS gerado', () => {
    const text = 'uai total é 10\nprosa(total mais 1)';
    const out = emit(text);
    const map = buildSourceMap(createSourceText(text, 'programa.gs'), out.code, out.segments);
    const trace = new TraceMap(JSON.stringify(map));
    for (const [index, line] of out.code.split('\n').entries()) {
      for (let column = 0; column < line.length; column += 1) {
        const expected = oracle(trace, { line: index + 1, column });
        const actual = originalPositionFor(map, index + 1, column);
        expect(actual === null ? [null, null] : [actual.line + 1, actual.column]).toEqual([expected.line, expected.column]);
      }
    }
  });
});
```
- [ ] **Rodar** → passa.
- [ ] **Teste (RED)** `message.test.ts` — o ajudante `.mensagem`:
```ts
import { runInNewContext } from 'node:vm';
import { STDLIB } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { compile } from '../../../src/compile.ts';
import { HELPER_SOURCES } from '../../../src/helpers/helper-sources.ts';

const readMessage = runInNewContext(`${HELPER_SOURCES['mensagem']}; $gs_mensagem`) as (e: unknown) => string;
const TYPE_PHRASE = 'Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.';
const REFERENCE_PHRASE = 'Ô sô, o programa usou um nome que ainda não existe.';
const RANGE_PHRASE = 'Ô sô, um número ficou fora do que o trem aceita.';
const SYNTAX_PHRASE = 'Ô sô, o motor não entendeu um trecho do código.';
const END_OF_INPUT_PHRASE = 'Acabou a entrada, sô: o programa pediu uma resposta e não veio mais nada.';

describe('$gs_mensagem', () => {
  it.each([
    ['null.x', TYPE_PHRASE, () => (null as unknown as { x: number }).x],
    ['chamar valor', TYPE_PHRASE, () => (5 as unknown as () => void)()],
    ['sem declaração', REFERENCE_PHRASE, () => new Function('return naoExiste')()],
    ['TDZ', REFERENCE_PHRASE, () => new Function('x; let x = 1;')()],
    ['repete negativo', RANGE_PHRASE, () => 'a'.repeat(-1)],
    ['casas', RANGE_PHRASE, () => (1).toFixed(101)],
    ['recursão', RANGE_PHRASE, () => { const f = (): unknown => f(); f(); }],
    ['sintaxe', SYNTAX_PHRASE, () => new Function('uai x')()],
  ])('%s devolve a frase genérica da classe, em português', (_name, phrase, run) => {
    let caught: unknown;
    try { run(); } catch (error: unknown) { caught = error; }
    expect(readMessage(caught)).toBe(phrase);
  });
  it('erro do programa devolve a mensagem intacta', () => {
    expect(readMessage(new Error('Deu ruim, sô!'))).toBe('Deu ruim, sô!');
  });
  it('erro de outro realm é classificado por name', () => {
    expect(readMessage(runInNewContext('new TypeError("x")'))).toBe(TYPE_PHRASE);
  });
  it('erro marcado pelo compilador devolve a frase do catálogo, nunca o marcador', () => {
    expect(readMessage(Object.assign(new Error('GS0702'), { gsCode: 'GS0702' }))).toBe(END_OF_INPUT_PHRASE);
  });
  it('e.mensagem compila para o ajudante e devolve a mensagem do programa', () => {
    const result = compile('uai e é faz_um Erro("Deu ruim, sô!")\nprosa(e.mensagem)');
    if (!result.ok) throw new Error('compilação falhou');
    const printed: unknown[] = [];
    runInNewContext(result.code, { console: { log: (value: unknown) => printed.push(value) } });
    expect(printed).toEqual(['Deu ruim, sô!']);
  });
  it('toda entrada helper da biblioteca tem fonte de ajudante', () => {
    const names = STDLIB.filter((entry) => entry.kind === 'helper').map((entry) => entry.helperName ?? '');
    expect(names.filter((name) => HELPER_SOURCES[name] === undefined)).toEqual([]);
  });
});
```
- [ ] **Rodar** → falha (`HELPER_SOURCES['mensagem']` indefinido). **Implementar** `message-source.ts`. As frases vêm do catálogo (`raiz`) e o ajudante só escolhe entre elas por `name` e por `gsCode`; ele nunca lê `e.message` para decidir:
```ts
import { lookupDiagnostic } from '@goiasscript/language';

const GENERIC_CODE_BY_CLASS = { TypeError: 'GS0710', ReferenceError: 'GS0711', RangeError: 'GS0712', SyntaxError: 'GS0713' } as const;
const MARKER_CODES = ['GS0701', 'GS0702'] as const;

export interface MessagePhrases {
  readonly generic: Readonly<Record<string, string>>;
  readonly codes: Readonly<Record<string, string>>;
}

const phraseOf = (code: string): string => lookupDiagnostic(code)?.messages.raiz ?? '';

export const phrasesFromCatalog = (): MessagePhrases => ({
  generic: Object.fromEntries(Object.entries(GENERIC_CODE_BY_CLASS).map(([name, code]) => [name, phraseOf(code)])),
  codes: Object.fromEntries(MARKER_CODES.map((code) => [code, phraseOf(code)])),
});

export const buildMessageSource = (phrases: MessagePhrases): string => `function $gs_mensagem(e) {
  const p = ${JSON.stringify(phrases)};
  if (e && typeof e.gsCode === 'string' && Object.hasOwn(p.codes, e.gsCode)) return p.codes[e.gsCode].replace('{line}', String(e.gsLine));
  if (e && typeof e.name === 'string' && Object.hasOwn(p.generic, e.name)) return p.generic[e.name];
  return e && typeof e.message === 'string' ? e.message : '';
}`;
```
Em `helper-sources.ts`, acrescentar `mensagem: buildMessageSource(phrasesFromCatalog())` ao objeto `HELPER_SOURCES`, e exportar `translateRuntimeError` em `index.ts`.
- [ ] **Rodar** → passa.
- [ ] **De-sloppify; verify:** `corepack pnpm verify`.
- [ ] **Commit:** `feat(compiler): traduz erros de execução e frases de mensagem`

---

### U2-12: Geradores de `@goiasscript/language` com diff vazio
**Spec:** §5.2, §8.3, §9.5 (lock), §4.2 (página "o que mudou") · **Tier:** medium · **Depende de:** U2-03 · **Risco:** saída dependente de ordem de Map/locale tornaria o diff não determinístico; gerador esquecido no `verify` · **Rollback:** reverter o commit e remover `generate:check` do `verify`
**Files:**
- Create: `packages/language/generators/{textmate.ts,monarch.ts,snippets.ts,reference.ts,cli-help.ts,glossary.ts,completions.ts,retired-page.ts,vocabulary-lock.ts,error-phrases.ts}`; saídas versionadas `packages/language/generated/{goiasscript.tmLanguage.json,goiasscript.monarch.json,snippets.json,reference.md,cli-help.txt,glossary.json,completions.json,error-phrases.generated.ts}`, `docs/spec/o-que-mudou.md`, `docs/spec/vocabulario.lock.json`
- Modify: `packages/language/generators/run.ts` (registrar), `package.json` raiz (script `verify`)
- Test: `packages/language/tests/generators.test.ts`
**Interfaces:** Consumes: `KEYWORDS`, `STDLIB`, `JS_RESERVED`, `RETIRED_WORDS`, `DIAGNOSTICS`, `JS_MEMBER_NAMES`, `GeneratedFile`, `renderAll` (U2-01/03). Produces: um `render…Files(): readonly GeneratedFile[]` por gerador; `ERROR_PHRASES: Readonly<Record<string, string>>` (nome do erro do motor → frase em português, tom raiz, de GS0710–GS0714) consumido pelo ajudante `$gs_mensagem` (U2-08); `docs/spec/vocabulario.lock.json` consumido pelo job `compat` (§9.5).
**Aceite:** `generate:check` sai com 0 no repositório limpo e com 1 (listando o arquivo) depois de alterar uma entrada de tabela sem regenerar; toda saída é determinística (duas execuções idênticas); `corepack pnpm verify` inclui o check.

**Ciclo 1 — contrato de diff vazio e determinismo**
- [ ] **1.1 Teste (RED).** `packages/language/tests/generators.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAll } from '../generators/run.ts';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../..');
const EXPECTED_PATHS = [
  'docs/spec/o-que-mudou.md', 'docs/spec/vocabulario.lock.json',
  'packages/language/generated/cli-help.txt', 'packages/language/generated/completions.json',
  'packages/language/generated/error-phrases.generated.ts', 'packages/language/generated/glossary.json',
  'packages/language/generated/goiasscript.monarch.json', 'packages/language/generated/goiasscript.tmLanguage.json',
  'packages/language/generated/reference.md', 'packages/language/generated/snippets.json',
  'packages/language/src/js/js-members.generated.ts',
];

describe('geradores', () => {
  const files = renderAll();
  it('registra todos os geradores da §5.2', () => {
    expect(files.map((file) => file.path).sort()).toEqual([...EXPECTED_PATHS].sort());
  });
  it('é determinístico: duas execuções dão a mesma saída', () => {
    expect(renderAll()).toEqual(files);
  });
  it.each(EXPECTED_PATHS)('%s está igual ao arquivo versionado (diff vazio)', (path) => {
    const content = files.find((file) => file.path === path)?.content;
    expect(readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8')).toBe(content);
  });
  it('não gera data nem caminho absoluto', () => {
    expect(files.filter((file) => /\/home\/|\d{4}-\d{2}-\d{2}T/u.test(file.content))).toEqual([]);
  });
});
```
- [ ] **1.2 Rodar:** `corepack pnpm --filter @goiasscript/language exec vitest run tests/generators.test.ts` — esperado: falha `expected [ 'packages/language/src/js/js-members.generated.ts' ] to deeply equal [ …11 caminhos ]`.
- [ ] **1.3 Implementar os geradores** (cada um exporta uma função pura sem E/S; `const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;` em cada arquivo que gera JSON; ordenação sempre explícita por `localeCompare` proibido, usar comparação por code unit: `(a, b) => (a < b ? -1 : a > b ? 1 : 0)`).
`generators/textmate.ts`:
```ts
import { KEYWORDS, STDLIB } from '@goiasscript/language';
import type { GeneratedFile } from './generators.types.ts';

const SCOPE_BY_CATEGORY = { declaration: 'storage.type', assignment: 'keyword.operator.assignment', function: 'storage.type.function', control: 'keyword.control', class: 'storage.type.class', error: 'keyword.control.trycatch', literal: 'constant.language', operator: 'keyword.operator.word' } as const;
const WORD_START = '(?<![\\p{L}\\p{N}_])';
const WORD_END = '(?![\\p{L}\\p{N}_])';
const byLengthThenName = (a: string, b: string): number => b.length - a.length || (a < b ? -1 : 1);
const alternation = (names: readonly string[]): string => `${WORD_START}(${names.toSorted(byLengthThenName).join('|')})${WORD_END}`;
const spellings = (entries: readonly { readonly spelling: string; readonly asciiSpelling?: string }[]) => entries.flatMap((entry) => [entry.spelling, ...(entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling])]);

export function renderTextmateFiles(): readonly GeneratedFile[] {
  const keywordPatterns = (Object.keys(SCOPE_BY_CATEGORY) as (keyof typeof SCOPE_BY_CATEGORY)[]).map((category) => ({
    name: `${SCOPE_BY_CATEGORY[category]}.goiasscript`,
    match: alternation(spellings(KEYWORDS.filter((entry) => entry.category === category))),
  }));
  const globals = STDLIB.filter((entry) => entry.receiver === 'global').flatMap((entry) => [entry.name, entry.asciiName ?? entry.name]);
  const members = STDLIB.filter((entry) => entry.receiver !== 'global').map((entry) => (entry.name.split('.').at(-1) ?? entry.name));
  const grammar = {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json', name: 'GoiásScript', scopeName: 'source.goiasscript',
    patterns: [
      { name: 'comment.line.double-slash.goiasscript', match: '//.*$' },
      { name: 'comment.block.goiasscript', begin: '/\\*', end: '\\*/' },
      { name: 'string.quoted.double.goiasscript', begin: '"', end: '"', patterns: [{ name: 'constant.character.escape.goiasscript', match: '\\\\.' }] },
      { name: 'string.quoted.single.goiasscript', begin: "'", end: "'", patterns: [{ name: 'constant.character.escape.goiasscript', match: '\\\\.' }] },
      { name: 'constant.numeric.goiasscript', match: '\\b\\d+(\\.\\d+)?([eE][+-]?\\d+)?\\b' },
      ...keywordPatterns,
      { name: 'support.function.member.goiasscript', match: `(?<=\\.)${alternation([...new Set(members)])}` },
      { name: 'support.function.goiasscript', match: alternation([...new Set(globals)]) },
    ],
  };
  return [{ path: 'packages/language/generated/goiasscript.tmLanguage.json', content: `${JSON.stringify(grammar, null, 2)}\n` }];
}
```
`generators/monarch.ts`:
```ts
export function renderMonarchFiles(): readonly GeneratedFile[] {
  const words = KEYWORDS.flatMap((entry) => [entry.spelling, ...(entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling])]);
  const library = STDLIB.map((entry) => entry.name.split('.').at(-1) ?? entry.name);
  const language = {
    defaultToken: '', tokenPostfix: '.gs', unicode: true,
    keywords: [...new Set(words)].toSorted(), library: [...new Set(library)].toSorted(),
    tokenizer: { root: [
      [String.raw`[\p{L}_][\p{L}\p{N}_]*`, { cases: { '@keywords': 'keyword', '@library': 'type.identifier', '@default': 'identifier' } }],
      [String.raw`\d+(\.\d+)?([eE][+-]?\d+)?`, 'number'], ['"', { token: 'string', next: '@dq' }], ["'", { token: 'string', next: '@sq' }],
      [String.raw`//.*$`, 'comment'], [String.raw`/\*`, { token: 'comment', next: '@comment' }],
    ],
    dq: [[String.raw`[^\\"]+`, 'string'], [String.raw`\\.`, 'string.escape'], ['"', { token: 'string', next: '@pop' }]],
    sq: [[String.raw`[^\\']+`, 'string'], [String.raw`\\.`, 'string.escape'], ["'", { token: 'string', next: '@pop' }]],
    comment: [[String.raw`[^/*]+`, 'comment'], [String.raw`\*/`, { token: 'comment', next: '@pop' }], [String.raw`[/*]`, 'comment']] },
  };
  return [{ path: 'packages/language/generated/goiasscript.monarch.json', content: `${JSON.stringify(language, null, 2)}\n` }];
}
```
`generators/snippets.ts` (corpo vem da tabela, para o snippet nunca citar palavra inexistente):
```ts
const kw = (js: string): string => KEYWORDS.find((entry) => entry.js === js)?.spelling ?? js;
const SNIPPETS = {
  'se_ocê_quiser': [`${kw('if')} (\${1:condicao}) {`, '  $0', `} ${kw('else')} {`, '  ', '}'],
  'vai_indo': [`${kw('for')} (${kw('let')} \${1:i} ${kw('=')} 0; \${1:i} ${kw('<')} \${2:limite}; \${1:i} ${kw('=')} \${1:i} ${kw('+')} 1) {`, '  $0', '}'],
  'faz_trem': [`${kw('function')} \${1:nome}(\${2:parametros}) {`, '  $0', '}'],
  'arruma_trem': [`${kw('class')} \${1:Nome} {`, `  ${kw('constructor')}(\${2:parametros}) {`, '    $0', '  }', '}'],
  'tenta_aí': [`${kw('try')} {`, '  $0', `} ${kw('catch')} (\${1:erro}) {`, '  ', '}'],
  'prosa': ['prosa(${1:valor})'],
} as const;
export function renderSnippetsFiles(): readonly GeneratedFile[] {
  const entries = Object.entries(SNIPPETS).map(([prefix, body]) => [prefix, { prefix, body, description: `Trecho de ${prefix}` }] as const);
  return [{ path: 'packages/language/generated/snippets.json', content: `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n` }];
}
```
(`kw('=')` devolve `é`, `kw('<')` devolve `menor_que`, `kw('+')` devolve `mais`.) `generators/vocabulary-lock.ts`:
```ts
export function renderVocabularyLockFiles(): readonly GeneratedFile[] {
  const reserved = [
    ...KEYWORDS.map((entry) => ({ name: entry.spelling, source: 'keyword', since: entry.since, ...(entry.deprecatedIn === undefined ? {} : { deprecatedIn: entry.deprecatedIn }) })),
    ...STDLIB.map((entry) => ({ name: entry.name, source: 'stdlib', since: entry.since, ...(entry.deprecatedIn === undefined ? {} : { deprecatedIn: entry.deprecatedIn }) })),
    ...JS_RESERVED.map((entry) => ({ name: entry.name, source: 'js', since: '3.0.0' })),
  ].toSorted((a, b) => (a.source + a.name < b.source + b.name ? -1 : 1));
  const diagnostics = DIAGNOSTICS.map((entry) => ({ code: entry.code, severity: entry.severity })).toSorted((a, b) => (a.code < b.code ? -1 : 1));
  return [{ path: 'docs/spec/vocabulario.lock.json', content: `${JSON.stringify({ reserved, diagnostics }, null, 2)}\n` }];
}
```
`generators/retired-page.ts`:
```ts
export function renderRetiredPageFiles(): readonly GeneratedFile[] {
  const rows = RETIRED_WORDS.map((entry) => `| \`${entry.word}\` | ${entry.replacement === undefined ? 'sem equivalente' : `\`${entry.replacement}\``} | ${entry.note} |`);
  const content = ['# O que mudou', '', 'Palavras de versões anteriores que não existem no GoiásScript 3. Elas não são reservadas; só melhoram a mensagem de erro (GS0306).', '', '| Aposentada | Forma na v3 | Observação |', '|---|---|---|', ...rows, ''].join('\n');
  return [{ path: 'docs/spec/o-que-mudou.md', content }];
}
```
`generators/error-phrases.ts`:
```ts
const CLASS_BY_CODE = { GS0710: 'TypeError', GS0711: 'ReferenceError', GS0712: 'RangeError', GS0713: 'SyntaxError', GS0714: 'Error' } as const;
export function renderErrorPhrasesFiles(): readonly GeneratedFile[] {
  const phrases = Object.entries(CLASS_BY_CODE).map(([code, name]) => [name, DIAGNOSTICS.find((entry) => entry.code === code)?.messages.raiz ?? ''] as const);
  const body = phrases.map(([name, phrase]) => `  ${name}: ${JSON.stringify(phrase)},`).join('\n');
  return [{ path: 'packages/language/generated/error-phrases.generated.ts', content: `// Gerado por generators/error-phrases.ts a partir de GS0710–GS0714; não editar.\nexport const ERROR_PHRASES: Readonly<Record<string, string>> = {\n${body}\n};\n` }];
}
```
`generators/reference.ts`, `cli-help.ts`, `glossary.ts`, `completions.ts` seguem o mesmo molde (função pura, tabela → texto, ordem por categoria e nome): `reference.ts` gera `generated/reference.md` com duas tabelas Markdown (keywords: `GoiásScript | JavaScript | Classe | Categoria`; biblioteca: `Nome | Receptor | Forma | JS | Semântica`); `cli-help.ts` gera `cli-help.txt` com as keywords por categoria (uma linha `categoria: a, b, c`) e a lista `GSnnnn  título` do catálogo; `glossary.ts` gera `glossary.json` (`[{ term, js, category }]` das keywords e `[{ term, js, semantics }]` da biblioteca); `completions.ts` gera `completions.json` (`[{ label, detail: js, kind: 'keyword' | 'function' | 'property', lesson? }]`, `lesson` vindo do catálogo quando houver). Todos sem data, sem caminho e sem dependência de `Map`/`Set` não ordenados.
`run.ts`: no array `GENERATORS`, acrescentar `renderTextmateFiles`, `renderMonarchFiles`, `renderSnippetsFiles`, `renderReferenceFiles`, `renderCliHelpFiles`, `renderGlossaryFiles`, `renderCompletionsFiles`, `renderRetiredPageFiles`, `renderVocabularyLockFiles`, `renderErrorPhrasesFiles` (imports `.ts`).
- [ ] **1.4 Gerar e conferir:** `corepack pnpm --filter @goiasscript/language generate` e depois `corepack pnpm --filter @goiasscript/language generate:check` — esperado: exit 0. Rodar `... exec vitest run tests/generators.test.ts` — esperado: passa (14 testes).

**Ciclo 2 — o check pega tabela alterada**
- [ ] **2.1 Teste (RED).** Acrescentar ao `generators.test.ts`:
```ts
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

describe('generate:check (CI)', () => {
  it('falha listando o arquivo quando um gerado fica desatualizado e passa depois de regerar', () => {
    const target = resolve(REPOSITORY_ROOT, 'docs/spec/o-que-mudou.md');
    const original = readFileSync(target, 'utf8');
    const run = (mode: string) => spawnSync('node', [resolve(REPOSITORY_ROOT, 'packages/language/generators/run.ts'), mode], { encoding: 'utf8' });
    try {
      writeFileSync(target, `${original}linha a mais\n`);
      const stale = run('--check');
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain('docs/spec/o-que-mudou.md');
    } finally {
      writeFileSync(target, original);
    }
    expect(run('--check').status).toBe(0);
  });
});
```
- [ ] **2.2 Rodar:** `... exec vitest run tests/generators.test.ts` — esperado: passa (15 testes), porque o `--check` já existe no `run.ts`; este teste só caracteriza o comportamento. O RED real do ciclo é o `verify` não rodar o check: `grep -c "generate:check" package.json` — esperado: `0`.
- [ ] **2.3 Implementar.** No `package.json` da raiz, no script `verify`, acrescentar ao fim `&& corepack pnpm --filter @goiasscript/language generate:check`. Rodar `grep -c "generate:check" package.json` — esperado: `1` (GREEN) — e `corepack pnpm verify` — esperado: verde, com `generate:check` na saída.
- [ ] **3. Limpeza (de-sloppify)**: sem `Date`, sem caminho absoluto, sem método mutador (`sort`, `pop`, `push`) nem atribuição de propriedade (`functional/immutable-data` vale em `generators/`; usar `toSorted` e `at(-1)`), funções < 50 linhas, nenhum gerador acima de 400 linhas; knip sem arquivo gerado órfão (se acusar, listar os `generated/*` como `ignore` em `knip.json`).
- [ ] **4. Commit:** `git add packages/language docs/spec package.json && git commit -m "feat(language): adiciona geradores com diff vazio no ci"`

### U2-13: `@goiasscript/optimizer`
**Spec:** §5.8 · **Tier:** small · **Depende de:** U2-10 · **Risco:** Terser inlina constantes e muda o stdout de programas que imprimem texto do motor; `module: true` esquecido quebra `await` de topo. · **Rollback:** reverter; o modo didático não depende do pacote.
**Files:**
- Create: `packages/optimizer/src/{index.ts,optimize.ts}`, `packages/compiler/tests/support/{run-module.ts,seed-determinism.mjs}`
- Test: `packages/optimizer/tests/{optimize.test.ts,differential.test.ts}`
- Modify: `packages/optimizer/package.json` (dependência `terser` em versão exata 5.51.x, lida de `npm view terser version` no dia e registrada no ADR-0005)

**Interfaces:** Consumes `CompileSuccess`, `OptimizeResult`, `compile`. Produces `optimize(result, { minify }): Promise<OptimizeResult>`.

**Aceite:** `module: true`; `sources` do mapa composto aponta o `.gs` e preserva `sourcesContent`; `map: null` quando a entrada não tem mapa; stdout igual nos três modos no subconjunto determinístico; falha do Terser rejeita a Promise.

- [ ] **Teste (RED)** `optimize.test.ts`:
```ts
import { compile } from '@goiasscript/compiler';
import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { describe, expect, it } from 'vitest';
import { optimize } from '../src/optimize.ts';

function ok(text: string, sourceMap = true) {
  const result = compile(text, { sourceMap });
  if (!result.ok) throw new Error('esperava ok');
  return result;
}

describe('optimize', () => {
  it('await de topo sobrevive (module: true)', async () => {
    const out = await optimize(ok('uai a é 1\nespera_um_cadim cochila(1)\nprosa(a)'), { minify: false });
    expect(out.code).toContain('await');
  });
  it('minify encurta nomes locais; otimiza não', async () => {
    const result = ok('faz_trem somaTotal(valorUm, valorDois) { faz_favor valorUm mais valorDois }\nprosa(somaTotal(1, 2))');
    const minified = await optimize(result, { minify: true });
    const plain = await optimize(result, { minify: false });
    expect(minified.code.length).toBeLessThan(plain.code.length);
  });
  it('mapa composto aponta o .gs e preserva sourcesContent', async () => {
    const text = 'uai a é 1\nprosa(a mais 1)';
    const out = await optimize(ok(text), { minify: true });
    if (out.map === null) throw new Error('esperava mapa');
    const map = new TraceMap(JSON.stringify(out.map));
    expect(map.sources).toEqual(['programa.gs']);
    expect(map.sourcesContent).toEqual([text]);
    const generatedColumn = out.code.indexOf('log');
    expect(originalPositionFor(map, { line: 1, column: generatedColumn }).source).toBe('programa.gs');
  });
  it('sem mapa de entrada, mapa nulo', async () => {
    expect((await optimize(ok('prosa(1)', false), { minify: false })).map).toBeNull();
  });
  it('falha do Terser rejeita a Promise', async () => {
    const broken = { ...ok('prosa(1)'), code: 'const = ;' };
    await expect(optimize(broken, { minify: false })).rejects.toThrow();
  });
});
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/optimizer test` → falha: `Cannot find module '../src/optimize.ts'`.
- [ ] **Implementar** `optimize.ts`:
```ts
import type { CompileSuccess, OptimizeResult } from '@goiasscript/compiler';
import { minify as terserMinify } from 'terser';

const ECMA_2022 = 2022;
const OUTPUT_FILE_NAME = 'saida.mjs';

// `module: true` liga o modo de módulo do Terser: sem ele o `await` de topo não parseia.
export async function optimize(result: CompileSuccess, options: { readonly minify: boolean }): Promise<OptimizeResult> {
  const output = await terserMinify(result.code, {
    ecma: ECMA_2022, module: true, compress: { ecma: ECMA_2022 }, mangle: options.minify,
    ...(result.map ? { sourceMap: { content: JSON.stringify(result.map), filename: OUTPUT_FILE_NAME } } : {}),
  });
  if (output.code === undefined) throw new Error('terser não devolveu código');
  const map = result.map && output.map ? (JSON.parse(String(output.map)) as OptimizeResult['map']) : null;
  return { code: output.code, map };
}
```
`index.ts`: `export { optimize } from './optimize.ts';`.
- [ ] **Rodar** → passa.
- [ ] **Executor e semente** `tests/support/run-module.ts` (em `packages/compiler/tests/support/`, importável pelo optimizer via caminho relativo de teste):
```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SEED = new URL('./seed-determinism.mjs', import.meta.url).href;

export function runModule(code: string, stdin = ''): string {
  const dir = mkdtempSync(join(tmpdir(), 'gs-run-'));
  try {
    const file = join(dir, 'programa.mjs');
    writeFileSync(file, code);
    return execFileSync(process.execPath, ['--import', SEED, file], { input: stdin, encoding: 'utf8' });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
```
`seed-determinism.mjs`:
```js
let state = 123456789;
Math.random = () => {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
};
const FIXED = Date.UTC(2026, 0, 15, 12, 0, 0);
const RealDate = Date;
globalThis.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [FIXED])); }
  static now() { return FIXED; }
};
```
- [ ] **Teste (RED)** `differential.test.ts`:
```ts
import { compile } from '@goiasscript/compiler';
import { describe, expect, it } from 'vitest';
import { optimize } from '../src/optimize.ts';
import { runModule } from '../../compiler/tests/support/run-module.ts';

const PROGRAMS: ReadonlyArray<readonly [string, string, string]> = [
  ['soma', 'faz_trem soma(a, b) { faz_favor a mais b }\nprosa(soma(2, 3))', ''],
  ['laço', 'trem t é 0\nvai_indo (trem i é 1; i pelo_menos 1 e_mais i no_máximo 4; i é i mais 1) { t é t mais i }\nprosa(t)', ''],
  ['topo', 'espera_um_cadim cochila(1)\nprosa("depois")', ''],
  ['pergunta', 'uai n é pergunta("Nome?")\nprosa(n.gritando())', 'ana\n'],
  ['sorteio', 'prosa(Conta.sorteia_um(1, 6))', ''],
  ['ordenar', 'prosa([3, 1, 2].ordenar().juntar(","))', ''],
];

describe('diferencial', () => {
  it.each(PROGRAMS)('%s: mesmo stdout nos três modos', async (_name, text, stdin) => {
    const result = compile(text);
    if (!result.ok) throw new Error('esperava ok');
    const didactic = runModule(result.code, stdin);
    const optimized = runModule((await optimize(result, { minify: false })).code, stdin);
    const minified = runModule((await optimize(result, { minify: true })).code, stdin);
    expect(optimized).toBe(didactic);
    expect(minified).toBe(didactic);
  });
});
```
- [ ] **Rodar** → passa (teste de integração: o RED da unidade foi o do `optimize.test.ts`; o executor e a semente já existem pelo passo anterior).
- [ ] **De-sloppify; verify:** `corepack pnpm verify`.
- [ ] **Commit:** `feat(optimizer): adiciona otimizador com terser e mapa composto`

---

### U2-14: Corpus verde, propriedades e paridade de reservadas
**Spec:** §8.2 · **Tier:** large · **Depende de:** U2-10, U2-11, U2-13 · **Risco:** caso `expected-fail` esquecido bloqueia o gate S2; propriedade flaky por geração aleatória. · **Rollback:** reverter o commit do grupo problemático; os marcadores `expected-fail` voltam.
**Files:**
- Create: `packages/compiler/tests/conformance/<id>/{input.gs,output.mjs,stdout.txt,diagnostics.json,case.json?,stdin.txt?}` (um diretório por caso das tabelas abaixo), `packages/compiler/tests/support/{list-expected-fail.ts,gs-printer.ts,arbitraries.ts,corpus.ts,acceptance.ts}`
- Test: `packages/compiler/tests/conformance-groups.test.ts`, `packages/compiler/tests/properties/{never-throws,ok-implies-valid,valid-programs,reserved-parity}.test.ts`
- Modify: nenhum arquivo existente: o `.gitattributes` da U1-01 já traz `packages/compiler/tests/conformance/** -text` e o executor da U1-10 já lê `stdin.txt` quando existe.

**Interfaces:** Consumes `compile`, `optimize`, `runModule` (U2-13), `lookupJsReserved`, `createLexer`, `createSourceText`, executor e `pnpm bless` de U1-10. Produces corpus sem `expected-fail` dentro da v3, `readCorpus()` e `acceptanceRates(corpus)`.

**Aceite:** `corepack pnpm --filter @goiasscript/compiler test` verde; `list-expected-fail` não lista nenhum caso dentro da v3; propriedades (a)–(c) passam; paridade de reservadas com acorn.

**Ciclo 1 — grupos da §8.2 (diagnósticos e saídas em tabela executável)**

- [ ] **Teste (RED)** `tests/conformance-groups.test.ts` (cada linha é assertiva literal; o passo seguinte congela os goldens em disco com `bless`):
```ts
import { describe, expect, it } from 'vitest';
import { compile } from '../src/compile.ts';
import { runModule } from './support/run-module.ts';

type Row = readonly [id: string, source: string, codes: readonly string[]];
const codesOf = (source: string): readonly string[] => compile(source).diagnostics.map((d) => d.code);

const NFD = 'cafe\u0301';
const NFC = 'caf\u00e9';
const IF_NFD = 'se_oce\u0302_quiser';
const TABLE: Readonly<Record<string, readonly Row[]>> = {
  'fim-de-instrução': [
    ['callback-bloco', 'uai l é [1]\nl.pra_cada(x => {\n  prosa(x)\n  prosa(x mais 1)\n})', []],
    ['callback-em-lista', 'uai l é [1]\nuai fs é [x => {\n  prosa(x)\n  prosa(x)\n}]', []],
    ['seta-em-coisa', 'uai acoes é {\n  dobra: x => {\n    prosa(x)\n    faz_favor x vezes 2\n  }\n}', []],
    ['argumentos-quebrados', 'prosa(Conta.maior(1,\n 2))', []],
    ['if-else-mesma-linha', 'se_ocê_quiser (certeza) { prosa(1) } se_não { prosa(2) }', []],
    ['else-linha-nova-com-comentario', 'se_ocê_quiser (certeza) { prosa(1) }\n// c\nse_não { prosa(2) }', []],
    ['try-separado', 'tenta_aí {\n  prosa(1)\n}\nse_der_ruim (erro) {\n  prosa(2)\n}\npor_fim {\n  prosa(3)\n}', []],
    ['allman', 'faz_trem f()\n{\n  faz_favor 1\n}\nenquanto_tiver (de_jeito_nenhum)\n{\n  prosa(1)\n}', []],
    ['faz-favor-vazio', 'faz_trem f() {\n  faz_favor\n  prosa(2)\n}\nprosa(f())', ['GS0803']],
    ['continua-na-linha-de-cima', 'uai a é 1\nmais 2', ['GS0203']],
    ['seta-quebrada', 'uai f é (x)\n=> x', ['GS0204']],
    ['senão-solto', 'se_não { prosa(1) }', ['GS0205']],
    ['async-quebrado', 'vai_na_frente\nfaz_trem f() {}', ['GS0202']],
  ],
  'palavras-e-nomes': [
    ['de-propriedade', 'uai o é { de: "SP" }\nprosa(o.de)', []],
    ['de-variavel', 'uai de é [1]\nvai_indo (uai x de de) { prosa(x) }', []],
    ['em-variavel', 'uai em é { a: 1 }\nvai_indo (uai k em em) { prosa(k) }', []],
    ['mais-como-nome', 'uai mais é 1', ['GS0303']],
    ['catch-nativo', 'uai p é faz_um promessa(r => r(1))\np.catch(f => f)', ['GS0405']],
    ['new-propriedade', 'uai o é { new: 1 }', ['GS0401']],
    ['default-membro', 'uai o é { a: 1 }\nprosa(o.default)', ['GS0402']],
    ['public', 'uai public é 1', ['GS0402']],
    ['nfd-keyword', `${IF_NFD} (certeza) { prosa(1) }`, []],
    ['letra-grega', 'uai α é 1', ['GS0104']],
    ['cifrao', 'uai $x é 1', ['GS0104']],
    ['cedilha', 'uai ação é 1\nprosa(ação)', []],
    ['nfd-aceito', `uai ${NFD} é 1\nprosa(${NFD})`, []],
  ],
  'regex-template-numeros': [
    ['regex', 'uai r é /ab+/g', ['GS0502']],
    ['regex-com-aspas', 'uai r é /"/', ['GS0502']],
    ['regex-escapada', 'uai r é /a\\//', ['GS0502']],
    ['regex-igual', 'uai r é /=abc/', ['GS0502']],
    ['template', 'uai t é `oi`', ['GS0501']],
    ['divisoes', 'uai a é 8\nuai m é a / 2 / 2\nuai n é a /2/ 2', []],
    ['zero-esquerda', 'uai c é 01310', ['GS0101']],
    ['milhar', 'uai n é 1.000.000', ['GS0101']],
    ['virgula-decimal', 'uai preço é 10,50', ['GS0208']],
    ['milhar-virgula-args', 'prosa(1.000,50)', ['GS0805']],
    ['sem-diagnostico', 'prosa([1,2,3])\nprosa(Conta.maior(2,3))\nuai pi é 3.141', []],
  ],
  'membros-p1': [
    ['some', 'uai l é [1]\nl.some(f => f)', ['GS0406']],
    ['map', 'uai l é [1]\nl.map(f => f)', ['GS0405']],
    ['typo', 'uai p é { nome: 1 }\nprosa(p.nmoe)', ['GS0305']],
    ['constructor', 'uai p é { a: 1 }\nprosa(p.constructor)', ['GS0406']],
    ['indice-nao-literal', 'uai l é [1]\nuai i é 0\nprosa(l[i])', []],
  ],
  'sombreamento-p4': [
    ['classe-conta', 'arruma_trem Conta { aprepara_trem(v) { ocê.v é v } }\nuai c é faz_um Conta(1)\nprosa(c.v)', ['GS0804']],
    ['data-do-usuario', 'uai Data é 5\nprosa(Data)', ['GS0804']],
    ['ordenar-com-funcao-propria', 'faz_trem ordenar(l) { faz_favor l }\nprosa(ordenar([2, 1]))\nprosa([2, 1].ordenar())', []],
  ],
  'vixe': [
    ['seta-bloco', 'uai f é x => { vixe("a") }', []],
    ['seta-conciso', 'uai f é x => vixe("a")', ['GS0206']],
    ['ou-entao', 'uai a é nada\nuai b é a ou_então vixe("b")', ['GS0206']],
    ['dois-argumentos', 'vixe("a", "b")', ['GS0206']],
    ['concatenado', 'vixe("a") mais "b"', ['GS0206']],
  ],
  'aposentadas-p13': [
    ['presta-servico', 'presta_serviço soma(a, b) {}', ['GS0306']],
    ['vazio-nome', 'uai vazio é 0\nprosa(vazio)', []],
    ['se-nome', 'uai se é 1', []],
    ['lista-nome', 'uai lista é [1]', []],
  ],
  'avisos': [
    ['incremento', 'vai_indo (trem i é 0; i menor_que 5; i mais 1) { prosa(i) }', ['GS0806']],
    ['soma-solta', 'uai a é 1\na mais 1', ['GS0806']],
    ['prosa-erro', 'tenta_aí { vixe("a") } se_der_ruim (erro) { prosa(erro) }', ['GS0807']],
    ['trocar-dolar', 'prosa("x".trocar("x", "US$&"))', ['GS0808']],
  ],
};

describe.each(Object.entries(TABLE))('grupo %s', (_group, rows) => {
  it.each(rows)('%s', (_id, source, expected) => {
    expect(codesOf(source)).toEqual(expected);
  });
});

describe('unicode e arquivo', () => {
  it('BOM + \\r\\n dá as mesmas linhas de diagnóstico que \\n (Review Focus 1)', () => {
    const lf = compile('uai a é 1\nprosa(nomi)').diagnostics[0]?.range.start.line;
    const win = compile('\uFEFFuai a é 1\r\nprosa(nomi)').diagnostics[0]?.range.start.line;
    expect(win).toBe(lf);
  });
  it('U+2028 e U+2029 em código, texto e comentário dão GS0105', () => {
    for (const source of ['uai a é 1\u2028prosa(a)', 'uai t é "a\u2029b"', '// c\u2028d']) expect(codesOf(source)).toContain('GS0105');
  });
  it('posição com emoji antes do erro, na mesma linha, conta UTF-16', () => {
    const d = compile('uai t é "😀" mais nomi').diagnostics[0];
    expect(d?.range.start).toMatchObject({ line: 1, column: 19 });
  });
  it('identifier-nfd: stdout igual ao NFC e saída em NFC', () => {
    const result = compile(`uai ${NFC} é 1\nprosa(${NFD})`);
    if (!result.ok) throw new Error('esperava ok');
    expect(result.code.normalize('NFC')).toBe(result.code);
    expect(runModule(result.code)).toBe('1\n');
  });
  it('texto e comentário com NFD intactos byte a byte', () => {
    const result = compile(`// ${NFD}\nprosa("${NFD}")`);
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe(`${NFD}\n`);
  });
});

describe('pergunta e erros capturados', () => {
  it('encadeamento de pergunta executa', () => {
    const result = compile('prosa(pergunta("Nome?").gritando())');
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code, 'ana\n')).toBe('Nome? ANA\n');
  });
  it('fim da entrada antes da resposta termina o programa com o marcador GS0702', () => {
    const result = compile('uai a é pergunta("x")\nuai b é pergunta("y")');
    if (!result.ok) throw new Error('esperava ok');
    expect(() => runModule(result.code, 'um\n')).toThrow(/GS0702/);
  });
  it.each([
    ['leitura de nada', 'uai o é { x: 1 }\nuai a é nada\ntenta_aí { prosa(a.x) } se_der_ruim (erro) { prosa(erro.mensagem) }', TYPE_PHRASE],
    ['chamada de não-função', 'uai a é 5\ntenta_aí { a() } se_der_ruim (erro) { prosa(erro.mensagem) }', TYPE_PHRASE],
    ['uso antes da declaração', 'tenta_aí { prosa(x) } se_der_ruim (erro) { prosa(erro.mensagem) }\ntrem x é 1', REFERENCE_PHRASE],
    ['repete negativo', 'tenta_aí { prosa("a".repete(-1)) } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
    ['casas fora do limite', 'tenta_aí { prosa((1).com_casas(101)) } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
    ['recursão infinita', 'faz_trem f() { faz_favor f() }\ntenta_aí { f() } se_der_ruim (erro) { prosa(erro.mensagem) }', RANGE_PHRASE],
  ])('%s: mensagem genérica da classe, em português', (_name, source, phrase) => {
    const result = compile(source);
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe(`${phrase}\n`);
  });
  it('controle: vixe com mensagem do aluno sai intacta', () => {
    const result = compile('tenta_aí { vixe("Deu ruim, sô!") } se_der_ruim (erro) { prosa(erro.mensagem) }');
    if (!result.ok) throw new Error('esperava ok');
    expect(runModule(result.code)).toBe('Deu ruim, sô!\n');
  });
});
```
com as constantes do catálogo no topo do arquivo, junto de `NFD`:
```ts
const TYPE_PHRASE = 'Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.';
const REFERENCE_PHRASE = 'Ô sô, o programa usou um nome que ainda não existe.';
const RANGE_PHRASE = 'Ô sô, um número ficou fora do que o trem aceita.';
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/compiler test -- tests/conformance-groups.test.ts` → verde; qualquer divergência é defeito de U2-04…U2-11, corrigido **na unidade dona** em commit `fix(compiler): …` próprio, repetindo até verde.
- [ ] **Goldens em disco:** para cada linha das tabelas, criar `tests/conformance/<grupo>-<id>/input.gs` (o literal acima) e rodar `corepack pnpm bless`, que grava `output.mjs`, `stdout.txt` e `diagnostics.json`. Revisar o diff dos `diagnostics.json` contra a coluna `codes` da tabela: a tabela é a regra e o golden só congela a saída completa.

**Ciclo 2 — triagem dos 173 casos (expected-fail → 0)**

- [ ] **Script** `tests/support/list-expected-fail.ts`:
```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../conformance/', import.meta.url));

function isExpectedFail(id: string): boolean {
  try {
    const parsed: unknown = JSON.parse(readFileSync(join(ROOT, id, 'case.json'), 'utf8'));
    return typeof parsed === 'object' && parsed !== null && 'status' in parsed && parsed.status === 'expected-fail';
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

const marked = readdirSync(ROOT).filter(isExpectedFail);
process.stdout.write(`${marked.length} casos expected-fail\n${marked.join('\n')}\n`);
process.exitCode = marked.length === 0 ? 0 : 1;
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/compiler exec node tests/support/list-expected-fail.ts` → lista os marcados.
- [ ] **Laço de triagem** (repetir por caso, um commit `test(compiler): resolve caso <id> do corpus` por lote de ≤ 10): rodar `corepack pnpm --filter @goiasscript/compiler test -- tests/conformance.test.ts`; todo caso `expected-fail` que agora passa fica **vermelho** (sentinela): remover `case.json` e, se o comportamento mudou intencionalmente, regravar com `corepack pnpm bless <id>` e revisar o diff contra a regra de pertinência (§4.7); caso fora da v3 vira golden com o `GS05xx` específico da numeração fixada na U2-03 (`GS0500` só quando nenhum específico serve); caso que ainda falha por bug é corrigido na unidade dona. Critério de saída: `list-expected-fail` sai com código 0 (dentro da v3). Casos ligados a RFC pendente mantêm `{ "status": "expected-fail", "rfc": "RFC-0001" }` e entram no relatório do gate (U2-15).

**Ciclo 3 — propriedades (fast-check)**

- [ ] **Teste (RED)** `tests/properties/never-throws.test.ts` (a):
```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { createSourceText } from '../../src/source/source-text.ts';

const TOKEN_TEXTS = ['uai', 'trem', 'é', 'faz_trem', 'se_ocê_quiser', 'mais', '(', ')', '{', '}', '[', ']', ',', '.', '=>', '"', "'", '/', '/*', '//', '\n', '\r\n', ' ', 'x', '1', '1.5', '`', '$', 'vixe', 'pergunta'];
const tokenSequence = fc.array(fc.constantFrom(...TOKEN_TEXTS), { maxLength: 60 }).map((parts) => parts.join(' '));

describe('nunca lança (a)', () => {
  it('lexer e compile aceitam string Unicode arbitrária', () => {
    fc.assert(fc.property(fc.string({ unit: 'binary' }), (text) => {
      const lexer = createLexer(createSourceText(text, 'programa.gs'));
      for (let guard = 0; guard < text.length + 2; guard += 1) if (lexer.next().kind === 'end-of-file') break;
      expect(() => compile(text)).not.toThrow();
    }));
  });
  it('compile aceita sequências de tokens da tabela', () => {
    fc.assert(fc.property(tokenSequence, (text) => {
      expect(() => compile(text)).not.toThrow();
      expect(() => compile(text, { target: 'repl' })).not.toThrow();
    }));
  });
  it.each([
    ['parênteses', () => '('.repeat(100_000)],
    ['chaves', () => '{'.repeat(100_000)],
    ['soma encadeada', () => `1${' mais 1'.repeat(100_000)}`],
    ['cadeia de membros', () => `a${'.a'.repeat(100_000)}`],
    ['espaços', () => ' '.repeat(100_000)],
    ['10 mil linhas', () => 'prosa(1)\n'.repeat(10_000)],
  ])('entrada enorme: %s (Review Focus 4)', (_name, build) => {
    const result = compile(build());
    expect(result).toBeDefined();
    if (!result.ok) expect(result.diagnostics.length).toBeGreaterThan(0);
  });
});
```
`tests/properties/ok-implies-valid.test.ts` (b) — mutação do corpus e AST arbitrária impressa:
```ts
import { parse as acornParse } from 'acorn';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';
import { acceptanceRates } from '../support/acceptance.ts';
import { mutatedCorpus, programArbitrary } from '../support/arbitraries.ts';
import { readCorpus } from '../support/corpus.ts';
import { printProgram } from '../support/gs-printer.ts';

const CORPUS = readCorpus();
const ACCEPTANCE_FLOOR = 0.05;
const MUTATION_RUNS = 500;
const PROGRAM_RUNS = 300;

function expectValidWhenOk(text: string): void {
  const result = compile(text);
  if (result.ok) expect(() => acornParse(result.code, { ecmaVersion: 2022, sourceType: 'module' })).not.toThrow();
}

describe('ok implica JS válido (b)', () => {
  it('mutação do corpus', () => {
    fc.assert(fc.property(mutatedCorpus(CORPUS), expectValidWhenOk), { numRuns: MUTATION_RUNS });
  });
  it('AST arbitrária impressa em .gs', () => {
    fc.assert(fc.property(programArbitrary, (program) => { expectValidWhenOk(printProgram(program)); }), { numRuns: PROGRAM_RUNS });
  });
  it('a geração aceita uma fração mínima, para o teste não passar sem exercitar o JS emitido', () => {
    const rates = acceptanceRates(CORPUS);
    expect(rates.mutation).toBeGreaterThanOrEqual(ACCEPTANCE_FLOOR);
    expect(rates.programs).toBeGreaterThanOrEqual(ACCEPTANCE_FLOOR);
  });
});
```
O piso `ACCEPTANCE_FLOOR` é provisório; a U2-15 o troca por catracas lidas de `bench/budgets.json`. Arquivos de apoio:

`tests/support/corpus.ts`:
```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../conformance/', import.meta.url));

export function readCorpus(): readonly string[] {
  return readdirSync(ROOT).map((id) => readFileSync(join(ROOT, id, 'input.gs'), 'utf8'));
}
```
`tests/support/arbitraries.ts` (a AST imprimível não filtra o que o JS rejeita: nomes como `public` e `arguments` entram de propósito):
```ts
import fc from 'fast-check';

export type Expr =
  | { readonly kind: 'number'; readonly value: number }
  | { readonly kind: 'name'; readonly name: string }
  | { readonly kind: 'binary'; readonly operator: 'mais' | 'menos' | 'vezes'; readonly left: Expr; readonly right: Expr }
  | { readonly kind: 'call'; readonly callee: string; readonly args: readonly Expr[] };
export type Stmt =
  | { readonly kind: 'declaration'; readonly keyword: 'uai' | 'trem'; readonly name: string; readonly init: Expr }
  | { readonly kind: 'expression'; readonly expr: Expr }
  | { readonly kind: 'if'; readonly test: Expr; readonly body: readonly Stmt[] }
  | { readonly kind: 'function'; readonly name: string; readonly params: readonly string[]; readonly body: readonly Stmt[] };
export type ProgramShape = readonly Stmt[];

const NAMES = ['a', 'b', 'total', 'public', 'arguments', 'const', 'prosa', 'pergunta'] as const;
const MUTATION_PIECES = ['', ' ', '\n', ';', 'uai', 'mais', 'public', 'arguments', '{', '}'] as const;
const MAX_DEPTH = 4;
const MAX_LIST = 2;
const MAX_STATEMENTS = 6;
const MAX_NUMBER = 1000;

const name = fc.constantFrom(...NAMES);
const operator = fc.constantFrom('mais' as const, 'menos' as const, 'vezes' as const);

const tree = fc.letrec<{ expr: Expr; stmt: Stmt }>((tie) => ({
  expr: fc.oneof(
    { maxDepth: MAX_DEPTH },
    fc.record({ kind: fc.constant('number' as const), value: fc.nat(MAX_NUMBER) }),
    fc.record({ kind: fc.constant('name' as const), name }),
    fc.record({ kind: fc.constant('binary' as const), operator, left: tie('expr'), right: tie('expr') }),
    fc.record({ kind: fc.constant('call' as const), callee: name, args: fc.array(tie('expr'), { maxLength: MAX_LIST }) }),
  ),
  stmt: fc.oneof(
    { maxDepth: MAX_DEPTH },
    fc.record({ kind: fc.constant('declaration' as const), keyword: fc.constantFrom('uai' as const, 'trem' as const), name, init: tie('expr') }),
    fc.record({ kind: fc.constant('expression' as const), expr: tie('expr') }),
    fc.record({ kind: fc.constant('if' as const), test: tie('expr'), body: fc.array(tie('stmt'), { maxLength: MAX_LIST }) }),
    fc.record({ kind: fc.constant('function' as const), name, params: fc.array(name, { maxLength: MAX_LIST }), body: fc.array(tie('stmt'), { maxLength: MAX_LIST }) }),
  ),
}));

export const programArbitrary: fc.Arbitrary<ProgramShape> = fc.array(tree.stmt, { maxLength: MAX_STATEMENTS });

export const mutatedCorpus = (corpus: readonly string[]): fc.Arbitrary<string> =>
  fc.tuple(fc.constantFrom(...corpus), fc.nat(), fc.constantFrom(...MUTATION_PIECES)).map(([text, at, piece]) => {
    const index = at % (text.length + 1);
    return text.slice(0, index) + piece + text.slice(index + (at % 3));
  });
```
`tests/support/gs-printer.ts`:
```ts
import type { Expr, ProgramShape, Stmt } from './arbitraries.ts';

const INDENT = '  ';

function printExpr(expr: Expr): string {
  switch (expr.kind) {
    case 'number': return String(expr.value);
    case 'name': return expr.name;
    case 'binary': return `(${printExpr(expr.left)} ${expr.operator} ${printExpr(expr.right)})`;
    case 'call': return `${expr.callee}(${expr.args.map(printExpr).join(', ')})`;
  }
}

function printBlock(body: readonly Stmt[], depth: number): string {
  const inner = body.map((stmt) => printStmt(stmt, depth + 1)).join('\n');
  return `{\n${inner}\n${INDENT.repeat(depth)}}`;
}

function printStmt(stmt: Stmt, depth: number): string {
  const pad = INDENT.repeat(depth);
  switch (stmt.kind) {
    case 'declaration': return `${pad}${stmt.keyword} ${stmt.name} é ${printExpr(stmt.init)}`;
    case 'expression': return `${pad}${printExpr(stmt.expr)}`;
    case 'if': return `${pad}se_ocê_quiser (${printExpr(stmt.test)}) ${printBlock(stmt.body, depth)}`;
    case 'function': return `${pad}faz_trem ${stmt.name}(${stmt.params.join(', ')}) ${printBlock(stmt.body, depth)}`;
  }
}

export const printProgram = (program: ProgramShape): string => program.map((stmt) => printStmt(stmt, 0)).join('\n');
```
`tests/support/acceptance.ts` (a taxa de aceitação sai de amostras com semente fixa, para o número ser reprodutível):
```ts
import fc from 'fast-check';
import { compile } from '../../src/compile.ts';
import { mutatedCorpus, programArbitrary } from './arbitraries.ts';
import { printProgram } from './gs-printer.ts';

const SAMPLE_SEED = 20_261_014;
const MUTATION_RUNS = 500;
const PROGRAM_RUNS = 300;

const rateOf = (texts: readonly string[]): number => texts.filter((text) => compile(text).ok).length / texts.length;

export function acceptanceRates(corpus: readonly string[]): { readonly mutation: number; readonly programs: number } {
  return {
    mutation: rateOf(fc.sample(mutatedCorpus(corpus), { numRuns: MUTATION_RUNS, seed: SAMPLE_SEED })),
    programs: rateOf(fc.sample(programArbitrary.map(printProgram), { numRuns: PROGRAM_RUNS, seed: SAMPLE_SEED })),
  };
}
```
`tests/properties/valid-programs.test.ts` (c):
```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { compile } from '../../src/compile.ts';

const VALID = [
  'uai a é 1\nprosa(a)', 'faz_trem f(x) {\n  faz_favor x mais 1\n}\nprosa(f(2))',
  'uai l é [3, 1, 2]\nprosa(l.ordenar().juntar(","))', 'vai_indo (trem i é 0; i menor_que 3; i é i mais 1) {\n  prosa(i)\n}',
] as const;
const SEMICOLON_PAIRS = [
  ['uai a é 1\nprosa(a)', 'uai a é 1;\nprosa(a);'],
  ['faz_trem f(x) {\n  faz_favor x mais 1\n}\nprosa(f(2))', 'faz_trem f(x) {\n  faz_favor x mais 1;\n}\nprosa(f(2));'],
] as const;
const terminators = fc.constantFrom('\n', '\r\n', '\r');
const jsLineCount = (code: string): number => code.split(/\r\n|\n|\r/).length;

describe('programas válidos (c)', () => {
  it('compile é determinístico', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => { expect(compile(text)).toEqual(compile(text)); }));
  });
  it('linhas do .gs preservadas com qualquer terminador; ajudantes só depois', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), terminators, (text, eol) => {
      const source = text.replace(/\n/g, eol);
      const result = compile(source);
      if (!result.ok) throw new Error('esperava ok');
      const gsLines = source.split(/\r\n|\n|\r/).length;
      const firstHelper = result.helperRange?.startLine ?? jsLineCount(result.code) + 1;
      expect(firstHelper).toBeGreaterThanOrEqual(gsLines);
    }));
  });
  it.each(SEMICOLON_PAIRS)('o ; opcional do aluno não altera o JS: %#', (without, withSemicolons) => {
    const a = compile(without);
    const b = compile(withSemicolons);
    if (!a.ok || !b.ok) throw new Error('esperava ok');
    expect(b.code).toBe(a.code);
  });
  it('recompor ou decompor NFC/NFD não muda a saída e a saída está em NFC', () => {
    fc.assert(fc.property(fc.constantFrom('café', 'ação', 'você'), fc.boolean(), (name, decompose) => {
      const written = decompose ? name.normalize('NFD') : name;
      const result = compile(`uai ${written} é 1\nprosa(${written})`);
      if (!result.ok) throw new Error('esperava ok');
      expect(result.code.normalize('NFC')).toBe(result.code);
      expect(result.code).toContain(name.normalize('NFC'));
    }));
  });
  it('alvos que não são módulo começam com use strict no offset 0', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => {
      const result = compile(text, { target: 'playground' });
      if (!result.ok) throw new Error('esperava ok');
      expect(result.code.startsWith("'use strict';")).toBe(true);
    }));
  });
  it('repl é determinístico e não muta a sessão recebida', () => {
    fc.assert(fc.property(fc.constantFrom(...VALID), (text) => {
      const session = { bindings: [{ name: 'k', kind: 'trem' as const }], members: [] };
      const before = JSON.stringify(session);
      expect(compile(text, { target: 'repl', session })).toEqual(compile(text, { target: 'repl', session }));
      expect(JSON.stringify(session)).toBe(before);
    }));
  });
  it('todo prefixo de programa válido compila ou falha com diagnóstico, nunca em silêncio', () => {
    for (const text of VALID) for (let cut = 1; cut < text.length; cut += 1) {
      const result = compile(text.slice(0, cut), { target: 'repl' });
      expect(result.ok || result.diagnostics.length > 0).toBe(true);
    }
  });
});
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/compiler test -- tests/properties` → verde. Um contraexemplo (`Counterexample: […]`) é defeito de uma unidade anterior: o caso reduzido vira golden em `tests/conformance/prop-<n>/` e a correção entra na unidade dona, repetindo até verde.

**Ciclo 4 — paridade de reservadas com acorn**

- [ ] **Teste (RED)** `tests/properties/reserved-parity.test.ts`:
```ts
import { Parser, keywordTypes } from 'acorn';
import { Script } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { lookupJsReserved } from '@goiasscript/language';
import { compile } from '../../src/compile.ts';

const ES2022_RESERVED = ['await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'];
const STRICT_RESERVED = ['implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield'];
const UNIVERSE = [...new Set([...Object.keys(keywordTypes), ...ES2022_RESERVED, ...STRICT_RESERVED, 'eval', 'arguments'])];

function rejectedByEngine(word: string): boolean {
  try { Parser.parse(`const ${word} = 1`, { ecmaVersion: 2022, sourceType: 'module' }); } catch { return true; }
  try { new Script(`'use strict'; const ${word} = 1`); } catch { return true; }
  return false;
}

const BINDING_POSITIONS: ReadonlyArray<(name: string) => string> = [
  (n) => `uai ${n} é 1`,
  (n) => `faz_trem f(${n}) {}`,
  (n) => `faz_trem ${n}() {}`,
  (n) => `arruma_trem ${n} {}`,
  (n) => `uai f é ${n} => ${n}`,
  (n) => `tenta_aí { prosa(1) } se_der_ruim (${n}) {}`,
  (n) => `vai_indo (uai ${n} de [1]) {}`,
];

describe('paridade de reservadas com o acorn', () => {
  it('toda palavra que o motor rejeita como nome está em jsReserved', () => {
    const missing = UNIVERSE.filter((word) => rejectedByEngine(word) && !lookupJsReserved(word));
    expect(missing).toEqual([]);
  });
  it('toda palavra de jsReserved é rejeitada como nome nas 7 posições', () => {
    const accepted: string[] = [];
    for (const word of UNIVERSE.filter((w) => lookupJsReserved(w))) {
      for (const position of BINDING_POSITIONS) {
        const result = compile(position(word));
        if (result.ok) accepted.push(`${word}: ${position(word)}`);
      }
    }
    expect(accepted).toEqual([]);
  });
});
```
(`yield` e `await` aparecem nas duas listas; o `Set` remove duplicata.)
- [ ] **Rodar** → verde. Uma lista `missing` não vazia aponta palavra ausente de `js-reserved.data.ts` (U2-01); uma lista `accepted` não vazia aponta a posição de nome sem `checkBindingName` (U2-07). Ambas se corrigem na unidade dona, repetindo até `[]`.

- [ ] **De-sloppify** (remover caso duplicado do corpus; manter `tests/conformance/**` com `-text`). **Verify:** `corepack pnpm verify`.
- [ ] **Commits:** `test(compiler): adiciona grupos do corpus de conformidade`, `test(compiler): resolve os casos da auditoria no corpus`, `test(compiler): adiciona propriedades fast-check e paridade de reservadas`

---

### U2-15: Mutação, orçamentos e gate da Fase 2
**Spec:** §5.11, §8.2, §8.4, §10.1 F2 · **Tier:** medium · **Depende de:** U2-14, U2-12 · **Risco:** limiar de mutação ou catraca fixados em medida instável travam a `main`. · **Rollback:** voltar `thresholds.break` para `null` e as catracas para `null` em `budgets.json`.
**Files:**
- Create: `packages/compiler/stryker.config.mjs`, `packages/compiler/stryker.config.d.mts`, `packages/compiler/bench/{budgets.ts,measure.ts,budgets.json}`, `docs/fase-2/relatorio-gate.md`
- Test: `packages/compiler/tests/{budgets,stryker-config}.test.ts`
- Modify: `packages/compiler/package.json` (scripts `"mutate": "stryker run"`, `"bench": "node bench/measure.ts"` e `"bench:check": "node bench/measure.ts --check"`; devDependencies `@stryker-mutator/core`, `@stryker-mutator/vitest-runner` e `esbuild` em versões exatas, lidas de `npm view <pacote> version` no dia e registradas no ADR-0005), `packages/compiler/tests/properties/ok-implies-valid.test.ts` (troca o piso provisório pelas catracas de `budgets.json`), `.github/workflows/*.yml` do job de mutação (já existe desde a U1-06; passa a chamar `corepack pnpm --filter @goiasscript/compiler mutate`)
- Delete: `spikes/poc-compiler/` (após aprovação do gate; ver passo final)

**Interfaces:** Consumes `compile`, `CompileSuccess`, `acceptanceRates` e `readCorpus` (U2-14). Produces `ABSOLUTE_BUDGETS`, `measureBudgets()`, `helperBytes(result)`, `readRatchets()` e `budgets.json` com as catracas.

**Aceite:** tetos absolutos verdes (0 bytes de runtime para programa só nativo; 100 mil espaços < 100 ms; 10 mil linhas ≤ 150 ms); catracas gravadas com 1,25x a medida; `thresholds.break` fixado 2 pontos abaixo da primeira nota; relatório do gate; `spikes/` removido.

**Ciclo 1 — tetos absolutos (Review Focus 4)**

- [ ] **Teste (RED)** `tests/budgets.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { ABSOLUTE_BUDGETS, helperBytes, measureBudgets } from '../bench/budgets.ts';
import { compile } from '../src/compile.ts';

describe('orçamentos absolutos', () => {
  it('programa só nativo tem 0 bytes de runtime no alvo module', () => {
    const result = compile('uai l é [1, 2]\nprosa(l.mapear(x => x mais 1).juntar(","))');
    if (!result.ok) throw new Error('esperava ok');
    expect(helperBytes(result)).toBeLessThanOrEqual(ABSOLUTE_BUDGETS.runtimeBytesNative);
    expect(result.helperRange).toBeNull();
  });
  it('100 mil espaços compilam em menos de 100 ms', () => {
    const { pathologicalSpacesMs } = measureBudgets();
    expect(pathologicalSpacesMs).toBeLessThan(ABSOLUTE_BUDGETS.pathologicalSpacesMs);
  });
  it('compile() de 10 mil linhas cumpre o teto', () => {
    expect(measureBudgets().compile10kLinesMs).toBeLessThanOrEqual(ABSOLUTE_BUDGETS.compile10kLinesMs);
  });
  it('100 mil parênteses não lançam nem estouram a pilha', () => {
    expect(() => compile('('.repeat(100_000))).not.toThrow();
  });
});
```
- [ ] **Rodar:** `corepack pnpm --filter @goiasscript/compiler test -- tests/budgets.test.ts` → falha: `Cannot find module '../bench/budgets.ts'`.
- [ ] **Implementar** `bench/budgets.ts`:
```ts
import { readFileSync } from 'node:fs';
import type { CompileSuccess } from '../src/api.types.ts';
import { compile } from '../src/compile.ts';

export const ABSOLUTE_BUDGETS = { runtimeBytesNative: 0, pathologicalSpacesMs: 100, compile10kLinesMs: 150 } as const;
const WARMUP_RUNS = 2;
const MEASURED_RUNS = 20;
const TEN_THOUSAND = 10_000;
const HUNDRED_THOUSAND = 100_000;
const LINE_BREAK = /\r\n|\r|\n/u;

export interface Ratchets {
  readonly compile10kLinesMs: number | null;
  readonly brotliBytes: number | null;
  readonly acceptanceMutation: number;
  readonly acceptanceProgram: number;
}

export const readRatchets = (): Ratchets => JSON.parse(readFileSync(new URL('./budgets.json', import.meta.url), 'utf8')) as Ratchets;

export function helperBytes(result: CompileSuccess): number {
  if (result.helperRange === null) return 0;
  return result.code.split(LINE_BREAK).slice(result.helperRange.startLine - 1).join('\n').length;
}

function timeOnce(run: () => void): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

export function medianMs(run: () => void): number {
  for (let i = 0; i < WARMUP_RUNS; i += 1) run();
  const samples = Array.from({ length: MEASURED_RUNS }, () => timeOnce(run)).toSorted((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

export function tenThousandLines(): string {
  return Array.from({ length: TEN_THOUSAND / 4 }, (_, i) => `uai n${i} é ${i}\nfaz_trem f${i}(a, b) {\n  faz_favor a mais b vezes n${i}\n}`).join('\n');
}

export function measureBudgets(): { readonly pathologicalSpacesMs: number; readonly compile10kLinesMs: number } {
  const spaces = ' '.repeat(HUNDRED_THOUSAND);
  const lines = tenThousandLines();
  return { pathologicalSpacesMs: medianMs(() => compile(spaces)), compile10kLinesMs: medianMs(() => compile(lines)) };
}
```
- [ ] **Rodar** → passa. Se `compile10kLinesMs` estourar 150 ms ou os espaços 100 ms, o defeito está na unidade dona (lexer, `scan-trivia`, tabela de linhas, `buildSourceMap`): perfilar com `node --cpu-prof`, corrigir lá e repetir; o teto não se afrouxa.

**Ciclo 2 — catracas relativas e brotli**

- [ ] **Teste (RED)** (acrescentar em `budgets.test.ts`):
```ts
import { readRatchets } from '../bench/budgets.ts';

describe('catracas relativas', () => {
  it('budgets.json tem as catracas de tempo e de tamanho numéricas depois do gate', () => {
    const ratchets = readRatchets();
    expect(typeof ratchets.compile10kLinesMs).toBe('number');
    expect(typeof ratchets.brotliBytes).toBe('number');
  });
  it('a medida atual não passa da catraca', () => {
    const { compile10kLinesMs } = readRatchets();
    expect(compile10kLinesMs).not.toBeNull();
    expect(measureBudgets().compile10kLinesMs).toBeLessThanOrEqual(compile10kLinesMs ?? 0);
  });
});
```
- [ ] **Rodar** → falha: `budgets.json` ausente.
- [ ] **Implementar** `bench/budgets.json` inicial, em que as catracas de tempo e de tamanho ainda são `null` e os pisos de aceitação são os provisórios da U2-14:
```json
{ "compile10kLinesMs": null, "brotliBytes": null, "acceptanceMutation": 0.05, "acceptanceProgram": 0.05 }
```
e `bench/measure.ts` (`bench` mede e imprime; `bench -- --write` grava as catracas com 1,25x de folga e os pisos de aceitação 2 pontos abaixo da taxa medida; `bench:check` sai com código 1 quando a medida passa da catraca):
```ts
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { build } from 'esbuild';
import { acceptanceRates } from '../tests/support/acceptance.ts';
import { readCorpus } from '../tests/support/corpus.ts';
import { measureBudgets, readRatchets } from './budgets.ts';

const SLACK = 1.25;
const FLOOR_MARGIN = 0.02;
const PERCENT = 100;
const ENTRY = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const BUDGETS_FILE = new URL('./budgets.json', import.meta.url);

const floorOf = (rate: number): number => Math.max(0, Math.floor((rate - FLOOR_MARGIN) * PERCENT) / PERCENT);

const bundle = await build({ entryPoints: [ENTRY], bundle: true, minify: true, format: 'esm', platform: 'browser', write: false });
const brotliBytes = brotliCompressSync(Buffer.from(bundle.outputFiles[0]?.text ?? '')).length;
const { compile10kLinesMs } = measureBudgets();
const rates = acceptanceRates(readCorpus());
process.stdout.write(`${JSON.stringify({ compile10kLinesMs, brotliBytes, ...rates })}\n`);

if (process.argv.includes('--write')) {
  const ratchets = {
    compile10kLinesMs: Math.ceil(compile10kLinesMs * SLACK),
    brotliBytes: Math.ceil(brotliBytes * SLACK),
    acceptanceMutation: floorOf(rates.mutation),
    acceptanceProgram: floorOf(rates.programs),
  };
  writeFileSync(BUDGETS_FILE, `${JSON.stringify(ratchets, null, 2)}\n`);
}
if (process.argv.includes('--check')) {
  const limits = readRatchets();
  const slow = limits.compile10kLinesMs !== null && compile10kLinesMs > limits.compile10kLinesMs;
  const large = limits.brotliBytes !== null && brotliBytes > limits.brotliBytes;
  process.exitCode = slow || large ? 1 : 0;
}
```
O pacote `compiler` não importa `node:*` em `src/`; `bench/` e `tests/` podem. Rodar `corepack pnpm --filter @goiasscript/compiler bench -- --write` grava o `budgets.json` final.
- [ ] **Rodar** `tests/budgets.test.ts` → passa. Registrar a folga de 1,25x no ADR-0001.

**Ciclo 3 — Stryker incremental**

- [ ] **Arquivo** `packages/compiler/stryker.config.mjs`:
```js
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: ['src/lexer/**/*.ts', 'src/parser/**/*.ts', 'src/analyzer/**/*.ts', 'src/lowering/**/*.ts', 'src/sourcemap/**/*.ts', '!src/**/*.types.ts', '!src/**/*.constants.ts'],
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  reporters: ['clear-text', 'progress', 'json'],
  thresholds: { high: 90, low: 80, break: null },
  coverageAnalysis: 'perTest',
};
```
- [ ] **Declaração de tipos** `packages/compiler/stryker.config.d.mts`, para o teste importar a configuração com tipo:
```ts
declare const config: {
  readonly incremental: boolean;
  readonly mutate: readonly string[];
  readonly thresholds: { readonly high: number; readonly low: number; readonly break: number | null };
};
export default config;
```
- [ ] **Teste (RED)** `tests/stryker-config.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import config from '../stryker.config.mjs';

describe('stryker', () => {
  it('é incremental e cobre o núcleo', () => {
    expect(config.incremental).toBe(true);
    expect(config.mutate.some((glob) => glob.includes('src/parser'))).toBe(true);
  });
  it('depois do gate, break é numérico e positivo', () => {
    expect(typeof config.thresholds.break).toBe('number');
    expect(config.thresholds.break).toBeGreaterThan(0);
  });
});
```
- [ ] **Rodar** → o 2º teste falha (`break` é `null`): é a sentinela do gate.
- [ ] **Medir:** `corepack pnpm --filter @goiasscript/compiler mutate` (suíte completa, 1ª nota). Se `survived` revelar lacuna real, escrever o teste que mata o mutante no módulo dono e repetir (máx. 3 passadas, depois chamar o dono). Fixar `thresholds.break = nota - 2` (inteiro, arredondado para baixo) em `stryker.config.mjs`; o 2º teste passa.
- [ ] **Piso de aceitação das propriedades:** o `bench -- --write` do ciclo 2 já gravou `acceptanceMutation` e `acceptanceProgram` (taxa medida menos 2 pontos). Em `ok-implies-valid.test.ts`, trocar a constante `ACCEPTANCE_FLOOR` por esses valores:
```ts
import { readRatchets } from '../../bench/budgets.ts';

const { acceptanceMutation, acceptanceProgram } = readRatchets();
```
e, no último teste, `expect(rates.mutation).toBeGreaterThanOrEqual(acceptanceMutation)` e `expect(rates.programs).toBeGreaterThanOrEqual(acceptanceProgram)`.

**Ciclo 4 — relatório do gate e remoção do spike**

- [ ] **Criar** `docs/fase-2/relatorio-gate.md` com as seções, preenchidas com os números medidos (nenhum campo em branco): (1) unidades U2-01…U2-15 e commits; (2) cobertura por pacote (saída de `corepack pnpm test -- --coverage`); (3) nota de mutação e `thresholds.break`; (4) medidas e catracas (`compile10kLinesMs`, `brotliBytes`, 1,25x); (5) corpus: total de casos, casos `expected-fail` restantes (com RFC) e resultado do `list-expected-fail`; (6) taxa de aceitação das propriedades e piso; (7) divergências do spec encontradas e como foram resolvidas; (8) riscos abertos e dias reais da Fase 2 contra os 22 previstos.
- [ ] **Teste de gate** (shell): `corepack pnpm verify` e `corepack pnpm --filter @goiasscript/compiler exec node tests/support/list-expected-fail.ts` ambos com código 0.
- [ ] **GATE 2 [dono]:** apresentar o relatório; só com aprovação explícita do dono naquele momento seguir. Push e PR de fase `v3/integracao` → `main` também são **[dono]**.
- [ ] **Remover o spike** (depois da aprovação): `git rm -r spikes/poc-compiler`; `git grep -n "spikes/"` não pode listar nada em docs nem em configs (`pnpm-workspace.yaml`, `scope.json`, `knip.json`, `.dependency-cruiser.cjs`), então cada referência listada é removida; `corepack pnpm install` e `corepack pnpm verify` ficam verdes.
- [ ] **Commits:** `test(compiler): adiciona orçamentos absolutos e catracas`, `ci(compiler): adiciona mutação incremental com limiar fixado`, `docs(docs): adiciona relatório do gate da fase 2`, `chore(compiler): remove o spike da fase 0`

### GATE 2

**GATE 2 (dono).** Lê `docs/fase-2/relatorio-gate.md` (cobertura, mutação, orçamentos, corpus, propriedades) e autoriza
o push e o PR de fase. O spike `spikes/poc-compiler` só sai depois dessa aprovação.

## Decisões do dono que o plano espera

Cada item diz em que unidade bloqueia. O plano traz o padrão indicado; o dono confirma ou troca na revisão.

| # | Decisão | Padrão no plano | Bloqueia |
|---|---|---|---|
| 1 | Limites do ADR-0001: 1.500 linhas, 29 KB em brotli, 150 ms para 10 mil linhas, 28 dias; fórmula `(L_fase2 / P) × 1,3`; dia de 6 horas; `vocabulary.constants.ts` fora da contagem | Os valores do spec §10.1 | U0-00 |
| 2 | Identidade Entra ID federada ao GitHub ligada ao publisher do Marketplace, e a execução do workflow descartável | U0-07 fecha como "nenhum (escalado ao dono)" se faltar; os PATs acabam em 2026-12-01 | U0-07 |
| 3 | Instalar os navegadores do Playwright (e `sudo playwright install-deps` se faltar dependência) | Instalar | U0-06 |
| 4 | Os exemplos do playground não estão versionados; o plano embute as versões migradas para a v3 como fixtures | Valem como o "exemplo do playground" do critério (c) | U0-05 |
| 5 | Indicar 2 a 3 falantes de Goiás (anexo F) e decidir P8–P13, P15, P16, cada nome da biblioteca, as lacunas do anexo D e as alternativas do anexo E | — | GATE 0 |
| 6 | Numeração GS0501–GS0523 e GS0710–GS0714 fixada na U2-03 (o spec deixa os GS05xx para a RFC-0001) | A numeração da U2-03; a RFC-0001 pode renumerar antes da U2-03 | U2-03 |
| 7 | Aridade de `.bota_no_final`, `.bota_no_começo` (variádicas como no JS) e `.juntar` (separador obrigatório) | `{ min: 1 }` nas três | U2-01 |
| 8 | Frase de `.mensagem` e de `translateRuntimeError`: só genérica por classe de erro, ou também frases finas (leitura de `nada`, chamada de não-função, TDZ, recursão), o que exigiria olhar o texto do motor, vedado pela §5.10 | Só genérica por classe (GS0710–GS0714) | U2-11 |
| 9 | Lista de caminhos da reescrita do histórico (`paths.txt`, fora do repositório) e cada passo destrutivo da U1-00 | — | U1-00 |
| 10 | Identidade canônica do `.mailmap` | E-mail de noreply do GitHub | U1-01 |
| 11 | Exceções às regras do dono: mutação em `this.*` de lexer, parser e analisador (ADR-0004); `functional/immutable-data` desligado só nos testes (ADR-0004); `TODO(GS-<n>)` e identificadores em inglês (ADR-0007); commits sem ID Jira (ADR-0008) | Os três ADRs nascem `proposto` | GATE 1 |
| 12 | Escopo obrigatório no commitlint: o ADR-0008 do spec o deixa opcional; os commits do próprio plano já levam escopo | Opcional, como no spec | U1-05 |
| 13 | Bugs do corpus: uma issue de rastreio por grupo (11) ou uma por caso | Uma por grupo | U1-10 |
| 14 | AST sem os tokens de `é` do declarador, `se_não`, `por_fim`, `inherda_de`, `de`/`em` e `vai_na_frente`: o rebaixamento relê o trecho com o lexer (`keywordInGap`); a alternativa é a AST guardar esses tokens | Releitura | U2-08 |
| 15 | O teste diferencial do optimizer importa o suporte de testes do compiler entre pacotes; alternativa: um pacote de suporte de testes | Import relativo entre pacotes, permitido pela regra de camadas (optimizer acima de compiler) | U2-13 |
| 16 | Remover `spikes/poc-compiler` no mesmo PR da Fase 2 ou num PR seguinte | No mesmo PR, depois do GATE 2 | U2-15 |
