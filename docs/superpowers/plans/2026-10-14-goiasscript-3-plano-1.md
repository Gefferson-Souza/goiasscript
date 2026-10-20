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
  src/{lexer.ts,parser.ts,emit.ts,compile.ts,ast.types.ts,token.types.ts,diagnostics.ts}
  tests/{lexer.test.ts,parser.test.ts,emit.test.ts,demos.test.ts,typical-errors.test.ts}
  bench/{measure.ts,generate-10k.ts}   fixtures/{demos/*.gs,typical-errors/*.gs}
docs/
  adr/0001…0011-*.md   rfc/{rfc.md,0001-vocabulario-e-biblioteca.md}   spec/{gramatica.md,o-que-mudou.md,migracao.md,vocabulario.lock.json}
  fase-0/{relatorio-gate.md,spike-sandbox.md,publicacao-extensao.md}
packages/language/
  src/index.ts  src/lookup.ts  src/limits.constants.ts
  src/keywords/{keywords.types.ts,keywords.data.ts}
  src/js/{js-reserved.types.ts,js-reserved.data.ts,js-members.generated.ts}
  src/retired/{retired-words.types.ts,retired-words.data.ts}
  src/stdlib/{stdlib.types.ts,text.data.ts,list.data.ts,object.data.ts,math.data.ts,number.data.ts,time.data.ts,promise.data.ts,error.data.ts,date.data.ts,io.data.ts,index.ts}
  src/diagnostics/{diagnostics.types.ts,lexical.data.ts,syntax.data.ts,names.data.ts,javascript.data.ts,subset.data.ts,library.data.ts,runtime.data.ts,hints.data.ts,tools.data.ts,index.ts}
  generators/{run.ts,js-members.ts,textmate.ts,monarch.ts,snippets.ts,reference.ts,cli-help.ts,glossary.ts,completions.ts,retired-page.ts,vocabulary-lock.ts,error-phrases.ts}
  generated/  (saídas versionadas; CI exige diff vazio)
  tests/{integrity.test.ts,lookup.test.ts,generators.test.ts}
packages/compiler/
  src/index.ts  src/api.types.ts  src/compile.ts  src/explain.ts
  src/source/{source-text.ts,line-table.ts,position-convert.ts,identifier-alphabet.ts}
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
  tests/conformance.test.ts  tests/properties/**  tests/oracle/**  tests/support/**
  bench/{budgets.ts,budgets.json}   stryker.config.mjs
packages/optimizer/
  src/{index.ts,optimize.ts}  tests/{optimize.test.ts,differential.test.ts}
tools/rules-scan/
  src/**  scope.json  policy.json  baseline.json  dictionaries.lock.json  fixtures/pt-names.txt  fixtures/en-names.txt  tests/**
tsconfig.base.json  eslint.config.mjs  .dependency-cruiser.cjs  knip.json  commitlint.config.mjs  .lintstagedrc.mjs
.husky/{commit-msg,pre-commit,pre-push}  .github/{workflows/*.yml,pull_request_template.md,dependabot.yml,ISSUE_TEMPLATE/*,copilot-instructions.md}
CLAUDE.md  .gitignore  .gitattributes  .mailmap  .changeset/config.json
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
| U2-10 | API pública `compile()` (GS0901), tipos da §5.9 | U2-09 | medium | §5.9 |
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
export function lookupDiagnostic(code: string): DiagnosticDefinition | undefined;

// packages/compiler/src/api.types.ts — exatamente a API da §5.9 do spec (CompileOptions, CompileResult, Diagnostic…).

// packages/compiler/src/source/*
export interface SourceText { readonly text: string; readonly fileName: string; readonly lineStarts: readonly number[] }
export function createSourceText(text: string, fileName: string): SourceText;
export function positionAt(source: SourceText, offset: number): SourcePosition;           // line/column base 1
export function rangeOf(source: SourceText, start: number, end: number): SourceRange;
export function toLspPosition(position: SourcePosition): { readonly line: number; readonly character: number };
export function toMappingPosition(position: SourcePosition): { readonly line: number; readonly column: number }; // base 0
export function isIdentifierStart(codePoint: number): boolean;   // alfabeto P5
export function isIdentifierPart(codePoint: number): boolean;
export function isCombiningMark(codePoint: number): boolean;     // U+0300–U+036F

// packages/compiler/src/lexer/token.types.ts
export type TokenKind = 'keyword' | 'identifier' | 'number' | 'string' | 'template' | 'punctuator' | 'newline' | 'end-of-file' | 'invalid';
export interface Token {
  readonly kind: TokenKind;
  readonly start: number; readonly end: number;     // offsets UTF-16 no texto original
  readonly text: string;                            // texto original
  readonly value: string;                           // NFC para palavras; valor decodificado para textos
  readonly keyword?: KeywordEntry;                  // quando kind === 'keyword'
  readonly precededByNewline: boolean;
  readonly leadingTrivia: readonly Trivia[];
}
export interface Trivia { readonly kind: 'whitespace' | 'line-comment' | 'block-comment' | 'bom'; readonly start: number; readonly end: number; readonly containsNewline: boolean }
export interface Lexer { next(): Token; peek(offset?: number): Token; rescanAsRegex(token: Token): Token; readonly diagnostics: readonly RawDiagnostic[] }
export interface RawDiagnostic { readonly code: string; readonly start: number; readonly end: number; readonly args: Readonly<Record<string, string>> }
export function createLexer(source: SourceText): Lexer;

// packages/compiler/src/ast/ast.types.ts — união discriminada por `type`, nomes ESTree, todos os campos readonly,
// cada nó com `start`/`end` (offsets) e, quando vem de keyword, `keywordToken?: Token`. Inclui `ErrorNode`.
export interface ParseResult { readonly program: Program; readonly diagnostics: readonly RawDiagnostic[]; readonly incomplete: boolean }
export function parse(source: SourceText, lexer: Lexer, options: { readonly target: CompileTarget }): ParseResult;

// packages/compiler/src/analyzer/analyzer.ts
export interface Resolution { readonly kind: 'library' | 'program' | 'session' | 'unresolved'; readonly entry?: StdlibEntry }
export interface AnalysisResult {
  readonly diagnostics: readonly RawDiagnostic[];
  readonly resolutionOf: (node: Identifier | MemberExpression) => Resolution;
  readonly declaredMembers: ReadonlySet<string>;     // censo D
  readonly topLevelBindings: readonly SessionBinding[];
  readonly rethrowCalls: ReadonlySet<CallExpression>; // vixe(erro) que relança
}
export function analyze(program: Program, source: SourceText, options: { readonly target: CompileTarget; readonly session?: ReplSession }): AnalysisResult;

// packages/compiler/src/lowering/edit.types.ts
export interface Edit { readonly start: number; readonly end: number; readonly text: string; readonly order: number }
export interface LoweringResult { readonly edits: readonly Edit[]; readonly helpers: readonly string[] /* helperName */ }
export function lower(program: Program, analysis: AnalysisResult, source: SourceText, options: { readonly target: CompileTarget; readonly loopLimit?: number }): LoweringResult;
export function applyEdits(source: SourceText, edits: readonly Edit[]): { readonly code: string; readonly segments: readonly MappingSegment[] };
export interface MappingSegment { readonly generatedOffset: number; readonly originalOffset: number | null }

// packages/compiler/src/sourcemap/source-map.ts
export function buildSourceMap(source: SourceText, generatedCode: string, segments: readonly MappingSegment[], helperRange: LineRange | null): SourceMapV3;

// packages/compiler/src/diagnostics/report.ts
export function toDiagnostic(raw: RawDiagnostic, source: SourceText, tone: Tone): Diagnostic;   // ordena por posição quem chama
```

Os nomes acima são o contrato. Uma unidade que precise mudá-los registra a mudança no próprio commit e atualiza este
bloco no mesmo commit.

---

## Unidades
