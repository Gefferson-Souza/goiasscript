# GoiásScript 3 — Plano 4 (Fases 6 a 9: cartilha e piloto, Engoianador, docs e remoção do legado, relançamento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Execução igual à dos planos 1 a 3 (D12): grafo de unidades, worktree por unidade, TDD, revisor independente em contexto
> fresco, passada de limpeza ("de-sloppify"), fila de merge e gate humano ao fim de cada fase.

> **Cobertura deste plano.** Detalha as Fases 6 a 9 que o plano 3 deixou em esboço (`U6-NN` a `U9-NN`), já com os nomes
> reais do código depois das Fases 4 e 5 (`AVAILABLE_LESSONS`, `KNOWN_LESSON_IDS`, `LESSON_BY_TERM`, `RunnerClient`,
> `engoianar`, `DIAGNOSTICS`, `lesson`). Onde o esboço não bate com o código, a seção "Desvios do esboço" registra o ajuste.
> Duas unidades novas nasceram desses desvios: `U7-00` (Worker nos gates) e a camada de stubs da `U7-01`.

**Goal:** Entregar a cartilha de 11 lições com correção automática e kit do piloto (Fase 6); deixar o Engoianador
validado na borda, com cota atômica, modelo configurável, cache e contrato agendado (Fase 7); fechar a spec, a porta de
entrada da comunidade, o runbook e o gate de promessas, e remover o legado (Fase 8); e deixar o relançamento pronto:
versionamento por Changesets, job `compat`, release estável, smoke pós-publicação, checklist dos achados da auditoria,
rastreabilidade e dados reais do vídeo (Fase 9). **Tudo que depende de conta, segredo ou ação do dono fica pronto e
testado com simulação, e o gate registra "pendente do dono" em vez de bloquear.**

**Architecture:**
- **Cartilha (Fase 6):** conteúdo em Markdown com frontmatter YAML em `apps/playground/content/cartilha/licao-NN.md`;
  `lib/cartilha/` carrega, valida por guardas de tipo e compila/executa cada bloco (o mesmo `compile` do playground, alvo
  `module` para rodar no Node do CI). As páginas são componentes de servidor (`app/cartilha/**`) que renderizam o Markdown
  como árvore React (sem HTML bruto); só o espaço de trabalho (editor, correção, progresso) é componente de cliente e reusa
  `createCompileService`, `createBrowserRunnerClient`, `startRun` e `reduceRunView`. A correção compara a saída
  normalizada com `expectedStdout` e responde as `pergunta` com as linhas de `stdin` da lição. Um índice gerado e
  versionado (`lesson-index.generated.ts`, com conferência de deriva) alimenta `AVAILABLE_LESSONS` e `LESSON_BY_TERM` do
  playground e da extensão, e o catálogo `DIAGNOSTICS` passa a apontar cada erro para a lição que o explica.
- **Engoianador (Fase 7):** o Worker entra nos gates do repositório (U7-00). `index.ts` vira roteador fino sobre um
  pipeline com portas (`QuotaLimiter`, `ProviderChain`, `ResponseCache`, `HealthReport`), criadas como stubs na U7-01 e
  implementadas uma por unidade em arquivos próprios: validação Zod, cota atômica em Durable Object (SQLite, reserva e
  devolução), provedores Groq e Workers AI com modelo por variável, cache por hash e `/health`.
- **Docs e legado (Fase 8):** spec final em `docs/spec/`, `CONTRIBUTING.md` e templates, `docs/operacao.md`, gate de
  promessas (§8.5) em scripts testados num pacote novo de testes de scripts (`tools/script-tests`), e remoção do legado
  sem exceção por caminho.
- **Relançamento (Fase 9):** Changesets com grupo fixo (CLI e extensão), job `compat` (§9.5), `release.yml` aceitando
  estável, smoke pós-publicação, checklist da auditoria, rastreabilidade (§11) e `video-facts.json` gerado de execução real.

**Tech Stack:** Node `>=22.12` (engines) com toolchain `>=22.22.1`; TypeScript 6.0.3; Next.js 15, React 18, Monaco 0.55
(já usados); Vitest 5; Playwright (Chromium, Firefox, WebKit) para o E2E; esbuild 0.28.2. Dependências novas, cada uma com
**versão exata fixada na unidade que a introduz e conferida no registro no dia**: `yaml` (já no workspace, U6-01),
`react-markdown` (U6-02), `zod` e `smol-toml` (Worker, U7-01 e U7-02), `@stryker-mutator/core` e
`@stryker-mutator/vitest-runner` no Worker (U7-07, as mesmas versões do pacote `cli`), `@changesets/cli` (U9-01),
`lychee` como action fixada por SHA (U8-05). Nenhuma dependência de runtime nova em `@goiasscript/compiler`.

**Spec:** `docs/superpowers/specs/2026-10-14-goiasscript-3-design.md`: §6.4, §6.6, §8.1, §8.2, §8.3, §8.5, §8.6, §9.1, §9.3,
§9.4, §9.5, §10.1 (Fases 6 a 9), §10.3, §10.4, §11. Plano anterior: `docs/superpowers/plans/2026-10-22-goiasscript-3-plano-3.md`.
Pendências herdadas: `docs/fase-4/relatorio-gate.md` e o relatório da Fase 5 (`docs/fase-5/relatorio-gate.md`).

## Global Constraints

Valem todas dos planos 1 a 3. Repetidas aqui porque cada unidade roda em contexto fresco:

- **TDD com RED observado:** o teste é escrito antes, roda e falha pelo motivo certo (a saída da falha é colada no commit
  do teste ou na revisão), só então a implementação mínima. Cobertura ≥ 80% por pacote e de patch.
  `corepack pnpm verify` verde ao fim de toda unidade.
- **Código:** sem `any`, sem `console` (nem `console.log`) em produção, sem número ou texto mágico (constante nominal em
  `*.constants.ts`), `readonly` e imutabilidade por padrão, funções com menos de 50 linhas, arquivos de até 400 linhas
  (limite duro 800), aninhamento de até 4, tipos e constantes em arquivos próprios (`*.types.ts`, `*.constants.ts`);
  interfaces exportadas ficam em `*.types.ts`.
- **Idioma:** identificadores de código **sempre em inglês**, inclusive em testes, fixtures e nomes de arquivo internos.
  Português só em comentários, títulos de teste (`describe`/`it`) e strings que o usuário vê. **Todo texto visível ao
  usuário é em goianês** (UI, mensagens de erro do Worker, lições, scripts de CLI, páginas de erro). Programas `.gs` dentro
  de lições e documentos são conteúdo da linguagem e seguem a grafia goiana.
- **Comentários:** só o porquê não óbvio, no máximo 4 linhas, acima do bloco, em português. Nada de referência a unidade,
  fase, achado, versão ou ticket; nada de histórico de desenvolvimento. `TODO` só como `TODO(GS-<n>)` com a issue aberta.
  Nos textos e comentários novos ficam de fora as duas palavras vetadas pelo dono (use "teste contra recaída" e "anterior").
- **Commits:** Conventional Commits em português, minúsculo, `<type>(<escopo>): descrição`. Escopos aceitos pelo
  commitlint: `language`, `compiler`, `optimizer`, `cli`, `vscode`, `playground`, `engoianador`, `docs`, `ci`, `deps`,
  `release`. Cabeçalho de até 72 caracteres, um commit por unidade (D13). Sem trailer de atribuição de IA e sem ID Jira.
- **Documentos novos** não citam e-mail pessoal, caminho absoluto da máquina (use `<repo>`), nome de empregador nem dado
  pessoal. Contato público vem de configuração do repositório, nunca do texto.
- **Fronteira do agente (inegociável):** nenhum `npm publish`, `npm stage publish`, `npm deprecate`, criação ou envio de
  tag, `git push`, abertura de PR, mudança de configuração do GitHub, da Vercel, do Cloudflare, do npm ou dos
  marketplaces, e nenhum segredo no repositório. Workflows e scripts ficam **prontos e testados com simulação**; quem
  executa é o dono (seção "Tarefas do dono").
- **Sobreposição de arquivos:** unidades da mesma camada rodam em paralelo em worktrees e **não editam o mesmo arquivo**.
  Arquivo compartilhado nasce na camada anterior (com stubs) e cada unidade seguinte edita só o próprio stub; a tabela
  "Arquivos compartilhados" diz quem é o dono em cada momento.
- **`apps/*` e a catraca por arquivo (§8.1, item c):** todo arquivo de `apps/*` criado ou alterado obedece a todos os
  gates (ESLint estrito, scanner, `max-lines`, knip) e **sai** de `tools/rules-scan/baseline.json`; a unidade que
  reescreve o arquivo remove a própria entrada.
- **Uma fase por PR** (rebase, um commit por unidade). Toda fase termina com uma unidade de gate que escreve
  `docs/fase-N/relatorio-gate.md` com números medidos.

Específicas da cartilha (Fase 6): Markdown da lição nunca vira `innerHTML` (renderização por árvore React, `skipHtml`,
links só `https:` ou caminho interno); `localStorage` sempre em `try/catch` (a lição funciona sem armazenamento);
exemplo de lição nunca usa `Conta` nem `Data` como nome de classe (P4) nem membro de nome reservado (P3); o bloco de
lição não pode emitir **nenhum** diagnóstico (nem aviso), salvo o bloco marcado `erro-esperado` com o código exato.

Específicas do Worker (Fase 7): a cota só é consumida por resposta bem-sucedida do provedor; falha de infraestrutura nunca
esgota a cota; resposta em cache não chama provedor nem consome cota; configuração inválida **falha no deploy**; a chave
da Groq só existe como secret do Cloudflare e como segredo do GitHub referenciado no passo que usa; texto do usuário não
é registrado em log.

## Regra de pendência do dono (execução automática sem bloqueio)

Tudo que exige conta, segredo ou ato do dono (Cloudflare, Groq, chave Pix, Vercel, Marketplace, Open VSX, npm, tags,
remoto do GitHub, aprendizes do piloto) **não bloqueia** a execução. A unidade entrega o código pronto e testado com
provedor, rede, relógio e sistema de arquivos simulados, e o relatório do gate da fase ganha a seção **"Pendências do dono"**,
com uma linha por item:

| Item | Unidade | O que está pronto | Comando ou ação do dono | Evidência esperada | Estado |
|---|---|---|---|---|---|

O estado é `pendente do dono` até o dono anexar a evidência; o gate pode ser aprovado com pendências desse tipo, e o
relatório da Fase 9 consolida todas. Pendência **técnica** (teste vermelho, CRITICAL/HIGH aberto) continua bloqueando.

## Desvios do esboço

1. **U7-00 nova (Worker nos gates).** O esboço supunha o Worker já dentro de ESLint, knip e Vitest; hoje
   `apps/engoianador-api` está em `ignoreWorkspaces` do `knip.json`, fora de `projects` do `vitest.config.mts`, com
   TypeScript e Vitest de outras versões, e tem 4 arquivos no `baseline.json`. A U7-00 faz isso antes de qualquer
   comportamento mudar.
2. **U7-02 a U7-05 dependem da U7-01**, não só do GATE 4: a U7-01 cria as portas e os stubs (`limiter.ts`, `cache.ts`,
   `providers/index.ts`, `health.ts`) para que nenhuma unidade posterior edite `index.ts`.
3. **Contrato do Worker muda de `{ texto }`/`{ engoianado }` para `{ text }`/`{ text }`** (campo em inglês, §6.6). A U7-01
   atualiza `REQUEST_TEXT_FIELD` e `RESPONSE_TEXT_FIELDS` do cliente do playground no mesmo commit; a U7-05 não "atualiza o
   cliente com o mesmo teste": ela só acrescenta `checkEngoianadorHealth`.
4. **Contrato semanal em workflow próprio** (`.github/workflows/engoianador-contract.yml`) e não como job de
   `scheduled.yml`, para não colidir com a U8-05 (links externos) nem com o relatório de mutação; continua semanal.
5. **U6-02 depende também da U6-03a** (o E2E precisa de conteúdo real) e fica na camada 3; ela pode começar assim que a
   U6-03a for mesclada, em paralelo com U6-03b e U6-03c.
6. **A página "o que mudou" mora em `/cartilha/o-que-mudou`**, não em `app/o-que-mudou`: `lesson-routes.constants.ts` monta a
   URL com o prefixo `/cartilha/` e o catálogo cita o id `o-que-mudou` (GS0306). A página ainda lê `docs/spec/o-que-mudou.md`.
7. **`AVAILABLE_LESSONS` deixa de ser lista manual** e `KNOWN_LESSON_IDS` passa a ser derivado de `DIAGNOSTICS`: hoje o
   catálogo só cita `licao-02` e `o-que-mudou` (GS0401 e GS0306), então "todo `lesson` do catálogo tem página" seria
   verdade vazia. A U6-04 atribui `lesson` aos diagnósticos por uma tabela fechada (mudança de metadado, golden revisado).
8. **Glossário** lê `@goiasscript/language/generated/glossary.json` (já gerado e exportado), em vez de um `glossary.json` novo.
9. **U6-05 traz o resumo do piloto** (`summarize-pilot.ts` + esquema das respostas anonimizadas), para que a U6-06 seja
   mecânica quando o dono entregar o retorno e, sem retorno, registre `pendente do dono` com contagem `0/3`.
10. **U8-02:** `docs/rfc/rfc.md` já existe; o que falta é o template de issue `rfc.md`, o `config.yml` e a troca dos e-mails
    placeholder de `SECURITY.md` e `CODE_OF_CONDUCT.md` por referência ao reporte privado do GitHub.
11. **U8-04 cria `tools/script-tests`** (pacote de testes dos scripts da raiz, projeto Vitest `script-tests` pelo glob
    `tools/*`), porque testes de `scripts/*.ts` hoje moram em pacotes de destino (`packages/vscode/tests`,
    `packages/cli/tests`) e os scripts da Fase 8 e 9 não têm pacote dono.
12. **U8-06:** a conferência `git grep goiasscript-legacy` vazia exclui os registros históricos (`docs/fase-*/`,
    `docs/superpowers/`, `docs/auditoria/`, `docs/pesquisa/`). A tag de arquivo do protótipo Rust e o envio de
    `legacy/1.5` ao remoto são ações do dono; a tag `legacy/1.5` já existe localmente.
13. **U9-04 não lê `scripts/audit-issues.json`** (ele só mapeia 11 grupos de probes para números de issue). Os achados
    CRITICAL/HIGH vêm dos relatórios `docs/auditoria/2026-10-13/{A..E}-*.md`; o fechamento de cada um fica em
    `scripts/audit-closure.json` (id → teste, ADR ou mudança intencional com golden).
14. **U9-01: o job `compat` não tem tag estável anterior para comparar na 3.0.0.** Sem tag `v3.x.y` estável anterior, o
    script passa com aviso explícito e o teste cobre os dois caminhos; a primeira comparação real acontece na 3.0.1.
15. **U9-05 e a rastreabilidade:** provas que só existem depois de publicar (smoke do `latest`, contrato do Engoianador,
    smoke da extensão) ganham o estado `pendente do dono`; "100% verde" significa zero prova ausente e zero prova vermelha.
16. **Exercícios de `pergunta` no E2E** ficam na U6-07 (lição 11), não na U6-02, que cobre as lições 1 a 4.

## Decisões padrão novas (o plano segue o padrão se o dono não disser o contrário no gate do plano)

17. **Ids de lição `licao-01` a `licao-11`** (`licao-02` já é citado pelo catálogo); arquivo `licao-NN.md`, `NN` com dois
    dígitos, igual ao `id` do frontmatter. Alternativa: slugs por assunto (quebraria o `lesson: 'licao-02'` existente).
18. **Formato de lição:** frontmatter YAML (`id`, `order`, `title`, `summary`, `terms`, `exercise`) e corpo Markdown com
    blocos ` ```goiasscript ` (executa, estático), ` ```goiasscript exemplo ` (o único editável) e
    ` ```goiasscript erro-esperado GSnnnn `. É a mesma info string que o gate de promessas (U8-04) usa nos documentos.
19. **Markdown renderizado no servidor com `react-markdown`** (versão exata), `skipHtml`, sem plugin de HTML bruto, links
    filtrados. Alternativa: renderizador próprio de subconjunto (mais código para manter).
20. **Correção por saída normalizada:** fim de linha `\r\n` vira `\n`, espaço no fim da linha e linhas vazias finais são
    ignorados; o resto é igualdade exata. `pergunta` é respondida automaticamente com as linhas de `stdin` do exercício.
21. **Progresso só em `localStorage`** (chave única, lista de ids concluídos); sem conta, sem servidor, sem telemetria.
22. **Índice de lições gerado e commitado** (`lesson-index.generated.ts` no playground e `lesson-terms.generated.ts` na
    extensão), conferido em `generate:check`; cada termo da linguagem pertence a no máximo uma lição.
23. **Atribuição de `lesson` no catálogo por tabela fechada** (U6-04, abaixo). Mudança de metadado do catálogo: PATCH (§9.5).
24. **Piloto:** respostas anonimizadas em `docs/piloto/respostas/AN.json` (`A1`, `A2`, …); critério S8 = pelo menos 3
    aprendizes com as lições 1 a 5 concluídas.
25. **Cota do Engoianador em Durable Object com SQLite** (decisão 8 do plano 3 confirmada): um objeto por chave de rede
    (IPv4 inteiro; IPv6 pelo prefixo /64) e um objeto `global` por dia; operações síncronas sobre `ctx.storage.sql`.
26. **Corpo do Engoianador:** `{ "text": string }` com `Content-Type: application/json`, `Content-Length` conferido antes
    de ler, teto de bytes configurável; resposta `{ "text": string }`; erro `{ "error": string }` (a mensagem em goianês é o
    valor). Sem retrocompatibilidade com `texto`: nada foi implantado.
27. **Política do KV/cache e da cota:** a cota falha **fechada** (DO indisponível = 503 em goianês); o cache falha **aberto**
    (leitura ou escrita com erro vira miss, nunca derruba a requisição). Cache em KV com TTL de 6 h (`CACHE_TTL_SEC`).
28. **Normalização do texto para o hash:** NFC, `trim` e espaços repetidos viram um; caixa preservada. Chave
    `v1:<promptVersion>:<modelId>:<sha256>`.
29. **Mutação do Worker só como relatório** (sem `thresholds.break`), como no `cli`; a catraca vem no plano de manutenção.
30. **Gate de promessas:** blocos ` ```goiasscript ` executam; os que usam `pergunta` trazem `entrada=<texto>` na info
    string ou `sem-execucao` (só compila). Palavras citadas em código inline são conferidas contra a tabela, com lista de
    permissão versionada (`tools/promises/word-allowlist.json`, uma razão por entrada).
31. **Changesets:** grupo `fixed` com `goiasscript` e `goiasscript-vscode`; pacotes privados ignorados; `commit: false`
    (a mensagem `chore(release): versiona pacotes` é do commit manual do release).
32. **Rastreabilidade:** `tools/promises/traceability.json`, três estados por prova: `green` (arquivo e nome do teste
    existem e o teste roda no `verify`), `ready` (workflow ou script pronto e testado por simulação, depende de ato do dono)
    e `missing` (falha o gate).
33. **Vídeo:** `scripts/video-facts.ts` grava `video-facts.json` fora do repositório; dado que depende de rede externa ou
    segredo entra como `{ "status": "pending-owner" }`, nunca inventado.

## Review Focus

1. **Markdown e XSS na cartilha** (U6-02): `<script>` e `<img onerror>` no corpo viram texto; `javascript:` e `data:` em
   link são recusados; `localStorage` ausente ou lançando; lição com `terms` de outra lição.
2. **Cota atômica** (U7-02): 30 requisições simultâneas contra o limite 20 passam exatamente 20; provedor em erro devolve a
   cota; teto global e kill switch antes de qualquer custo; chave /64 agrupa IPv6 do mesmo prefixo.
3. **Borda do Worker** (U7-01): `null`, array, tipo errado, `Content-Type` ausente, `Content-Length` enorme, corpo
   maior que o declarado, CORS presente em todo 4xx e 5xx; nenhum log do texto do usuário.
4. **Cache** (U7-04): chave inclui modelo e versão do prompt; hit não chama provedor nem reserva cota; erro de KV vira miss.
5. **Gate de promessas** (U8-04, U8-05): falso positivo que trava o merge e falso negativo que deixa passar bloco quebrado;
   lista de permissão com razão obrigatória.
6. **Remoção do legado** (U8-06): nenhuma exceção por caminho sobra; `.gitignore` corrigido não "designora" lixo
   (conferir `git status` limpo); lockfile regenerado sem pacote órfão.
7. **Release** (U9-02, U9-03): estável só com Changesets aplicado; workflow sem token; mesmo tarball testado e publicado.
8. **Checklist da auditoria** (U9-04): achado "fechado" sem prova verificável; `expected-fail` esquecido no corpus.

---

## Como executar este plano

Valem as regras dos planos anteriores. Diferenças:

- **Branch de integração:** `v3/integracao`, com GATE 4 e GATE 5 aprovados e as fases já na `main` por PR de fase
  (rebase). Worktree por unidade: `git worktree add ../goiasscript-wt/<id> -b v3/<id> v3/integracao`.
- **Execução dos testes:**
  - playground: `corepack pnpm exec vitest run --project playground <arquivo>`;
  - E2E: `corepack pnpm --filter playground-e2e test:e2e` (fora do `verify`, entra em `playground-e2e.yml`);
  - Worker: `corepack pnpm exec vitest run --project engoianador-api <arquivo>` (projeto criado na U7-00);
  - scripts da raiz: `corepack pnpm exec vitest run --project script-tests <arquivo>` (projeto criado na U8-04);
  - extensão: `corepack pnpm --filter goiasscript-vscode exec vitest run <arquivo>`.
- **Workflows novos em arquivos próprios** (`engoianador-contract.yml`, `engoianador-smoke.yml`, `compat.yml`,
  `smoke-release.yml`) para não gerar conflito no `ci.yml`. `promises-gate.yml` é editado pela U8-04 e depois pela U8-05
  (camadas diferentes); `scheduled.yml` só pela U8-05.
- **Gates humanos:** GATE 6, 7, 8 e 9 (`docs/fase-N/relatorio-gate.md`); aprovação do dono, e só então push, PR de fase
  por rebase e as tarefas do dono da fase.

### Arquivos compartilhados entre unidades (quem edita e quando)

| Arquivo | Criado por | Depois editado por (em camadas diferentes) |
|---|---|---|
| `apps/playground/package.json` | existente | U6-01 (`yaml`, script `check:cartilha`, `prebuild`), U6-02 (`react-markdown`), U6-04 (script do índice no `prebuild`) |
| `apps/playground/lib/test-ids.constants.ts`, `components/ui-texts.constants.ts` | existentes | U6-02 (ids e textos da cartilha); nenhuma outra da Fase 6 |
| `apps/playground/lib/lesson-routes.constants.ts`, `lesson-routes.ts` | existentes | U6-04 (dona única) |
| `packages/vscode/src/language/lesson-link.constants.ts` | existente | U6-04 (dona única) |
| `package.json` raiz (`scripts`) | existente | U6-04 (`generate:check`), U7-00 (`typecheck`, `verify`), U8-06 (remove `legacy:*`), U9-01 (`changeset`) |
| `vitest.config.mts` | existente | U7-00 (projeto e include), U7-05 (tira o Worker-cliente do `PLAYGROUND_LEGACY`), U7-07 (limiar do Worker), U8-04 (projeto `script-tests` já entra pelo glob `tools/*`; só o include de cobertura) |
| `eslint.config.mjs`, `knip.json`, `.dependency-cruiser.cjs`, `tools/rules-scan/scope.json` | existentes | U7-00 (Worker), U8-04 (`tools/script-tests`), U8-06 (remove legado) |
| `apps/engoianador-api/wrangler.toml`, `package.json`, `src/env.types.ts`, `src/config.ts` | U7-00 (esqueleto completo) | nenhuma unidade da Fase 7 depois (cada uma só preenche os próprios arquivos); valores reais são do dono |
| `apps/engoianador-api/src/index.ts`, `src/handler.ts`, `src/ports.types.ts` | U7-01 | nenhuma depois (as portas são preenchidas em arquivos próprios) |
| `.github/workflows/promises-gate.yml` | existente | U8-04 (jobs de blocos e comandos), U8-05 (jobs de inglês, rastreabilidade, links) |
| `README.md`, `CONTRIBUTING.md` | existentes | U8-02 (reescrita); U9-05 (alinha o README ao provado) |
| `tools/promises/**` | U8-04 (`word-allowlist.json`) | U8-05 (`forbidden-english.json`, `traceability.json`), U9-05 (estados das provas) |
| `CHANGELOG.md` | existente | U9-02 (entrada 3.0.0) |

## Mapa de arquivos (estado ao fim das Fases 6 a 9)

```
apps/playground/
  content/cartilha/{licao-01..11.md,stdin/licao-11.txt}
  lib/cartilha/
    lesson.types.ts  lesson.constants.ts  lesson-schema.ts  parse-lesson.ts  load-lessons.ts
    check-lesson-blocks.ts  run-lesson-program.ts  run-lesson-program.types.ts
    grade-exercise.ts  grade-exercise.types.ts  progress.ts  progress.types.ts  progress.constants.ts
    use-lesson-session.ts  markdown-urls.ts  lesson-index.generated.ts
  components/cartilha/{LessonIndex,LessonWorkspace,ExercisePanel,LessonProse,ProgressBadge}.tsx  cartilha-texts.constants.ts
  app/cartilha/{layout.tsx,page.tsx,[id]/page.tsx,o-que-mudou/page.tsx}  app/glossario/page.tsx
  scripts/{check-cartilha.ts,build-lesson-index.ts,summarize-pilot.ts}
  tests/cartilha/*.test.ts  tests/fixtures/cartilha/**
apps/playground-e2e/tests/{cartilha-lesson,cartilha-progress,cartilha-pergunta}.spec.ts  tests/support/cartilha-page.ts
packages/language/src/diagnostics/*.data.ts            (campo lesson, U6-04)
packages/vscode/src/language/lesson-terms.generated.ts
docs/piloto/{README.md,roteiro.md,formulario-retorno.md,modelo-relatorio.md,relatorio-piloto.md,respostas/}
apps/engoianador-api/
  wrangler.toml  package.json  stryker.config.mjs
  src/{index.ts,handler.ts,ports.types.ts,env.types.ts,config.ts,validation.ts,validation.types.ts,cors.ts,
       limiter.ts,quota/{network-key.ts,quota-ledger.ts,quota.types.ts},rate-limiter.do.ts,
       engoiana.ts,prompt.ts,providers/{index.ts,groq.ts,workers-ai.ts,provider.types.ts},
       cache.ts,cache-key.ts,health.ts,messages.constants.ts}
  scripts/{check-worker-config.ts,verify-model.ts,warm-cache.ts,contract-check.ts}
  test/*.test.ts
tools/script-tests/{package.json,vitest.config.ts,tests/*.test.ts}
tools/promises/{word-allowlist.json,forbidden-english.json,traceability.json}
scripts/{check-docs-blocks.ts,check-docs-commands.ts,check-traceability.ts,compat-check.ts,audit-checklist.ts,
         audit-closure.json,video-facts.ts,release-target.ts}
docs/{operacao.md,spec/referencia.md,fase-6..9/relatorio-gate.md}
.changeset/config.json  lychee.toml
.github/workflows/{engoianador-contract,engoianador-smoke,compat,smoke-release}.yml  .github/ISSUE_TEMPLATE/{config.yml,rfc.md}
```

## Grafos de camadas

**Fase 6** (depende do GATE 4)

| id | Unidade | depende de | tier |
|---|---|---|---|
| U6-01 | Motor de lições | GATE 4 | large |
| U6-03a | Lições 1 a 4 | U6-01 | medium |
| U6-03b | Lições 5 a 8 | U6-01 | medium |
| U6-03c | Lições 9 a 11 | U6-01 | medium |
| U6-02 | Interface `/cartilha` e correção | U6-01, U6-03a | large |
| U6-04 | Liga erro, hover e glossário às lições | U6-02, U6-03a..c | large |
| U6-05 | Kit do piloto | U6-02 | small |
| U6-06 | Aplicar o retorno do piloto | U6-05 e retorno do dono | medium |
| U6-07 | **Gate 6** | U6-04, U6-06 | medium |

Camadas: **L1** {U6-01} · **L2** {U6-03a, U6-03b, U6-03c} · **L3** {U6-02} · **L4** {U6-04, U6-05} · **L5** {U6-06} · **L6** {U6-07}.
Arquivos disjuntos dentro de cada camada. **U6-06 não bloqueia:** sem retorno do piloto ela escreve
`docs/piloto/relatorio-piloto.md` com `0/3` e o estado `pendente do dono`, e a U6-07 registra a pendência (S8 fica aberto até o dono entregar).

**Fase 7** (depende do GATE 4; **independente das Fases 5 e 6**, pode rodar em paralelo a elas)

| id | Unidade | depende de | tier |
|---|---|---|---|
| U7-00 | Worker nos gates do repositório | GATE 4 | medium |
| U7-01 | Validação de borda, contrato e portas | U7-00 | large |
| U7-02 | Cota atômica (Durable Object) | U7-01 | large |
| U7-03 | Provedores, modelo e fallback | U7-01 | medium |
| U7-05 | `GET /health` e cliente | U7-01 | small |
| U7-04 | Cache por hash | U7-02, U7-03 | medium |
| U7-06 | Contrato semanal e smoke pós-deploy | U7-03 | small |
| U7-07 | Testes de `index` e `engoiana` e mutação | U7-01, U7-03 | medium |
| U7-08 | **Gate 7** | U7-04..U7-07 | medium |

Camadas: **L1** {U7-00} · **L2** {U7-01} · **L3** {U7-02, U7-03, U7-05} · **L4** {U7-04, U7-06, U7-07} · **L5** {U7-08}.
**U7-06 e U7-08 não bloqueiam por falta de chave:** o contrato roda só com o segredo configurado pelo dono; sem ele o gate registra `pendente do dono`.

**Fase 8** (depende dos GATES 5, 6 e 7)

| id | Unidade | depende de | tier |
|---|---|---|---|
| U8-01 | Spec final em `docs/spec/` | GATES 5-7 | medium |
| U8-02 | `CONTRIBUTING`, templates, README | GATES 5-7 | medium |
| U8-03 | `docs/operacao.md` | GATES 5-7 | small |
| U8-04 | Gate de promessas: blocos e comandos | GATES 5-7 | large |
| U8-05 | Gate de promessas: inglês, zero dependências, rastreabilidade, links | U8-04 | large |
| U8-06 | Remoção do legado | U8-04, U8-05 | large |
| U8-07 | `CLAUDE.md` final | U8-06 | small |
| U8-08 | **Gate 8** | U8-01..U8-07 | medium |

Camadas: **L1** {U8-01, U8-02, U8-03, U8-04} · **L2** {U8-05} · **L3** {U8-06} · **L4** {U8-07} · **L5** {U8-08}.

**Fase 9** (depende do GATE 8)

| id | Unidade | depende de | tier |
|---|---|---|---|
| U9-01 | Changesets e job `compat` | GATE 8 | medium |
| U9-04 | Checklist dos achados da auditoria | GATE 8 | large |
| U9-02 | Release estável | U9-01 | medium |
| U9-03 | Smoke pós-publicação | U9-02 | small |
| U9-05 | Rastreabilidade 100% e README alinhado | U9-03, U9-04 | medium |
| U9-06 | Dados reais do vídeo | U9-05 | medium |
| U9-07 | **Gate 9 / relatório final** | U9-05, U9-06 | medium |

Camadas: **L1** {U9-01, U9-04} · **L2** {U9-02} · **L3** {U9-03} · **L4** {U9-05} · **L5** {U9-06} · **L6** {U9-07}.

## Interfaces compartilhadas (contrato entre unidades)

```ts
// apps/playground/lib/cartilha/lesson.types.ts
export type BlockMode = 'editable' | 'static' | 'expected-error';
export interface LessonBlock {
  readonly mode: BlockMode;
  readonly code: string;
  readonly line: number;                    // linha da abertura do bloco no arquivo, para mensagens
  readonly expectedCode?: string;           // GSnnnn, só em 'expected-error'
}
export interface LessonExercise {
  readonly prompt: string;
  readonly starter: string;
  readonly solution: string;
  readonly expectedStdout: string;
  readonly stdin?: readonly string[];       // lido de stdinFile; uma resposta por pergunta
}
export interface Lesson {
  readonly file: string;                    // nome do arquivo, para citar nas mensagens
  readonly solutionLine: number;            // linha da solução no arquivo, para citar nas mensagens
  readonly id: string;                      // licao-NN
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly terms: readonly string[];        // palavras da tabela que esta lição explica
  readonly bodyMarkdown: string;
  readonly blocks: readonly LessonBlock[];
  readonly example: LessonBlock;            // o único bloco 'editable'
  readonly exercise: LessonExercise;
}
export interface LessonProblem { readonly lessonId: string | null; readonly line: number | null; readonly message: string }
export type ParseLessonResult =
  | { readonly ok: true; readonly lesson: Lesson }
  | { readonly ok: false; readonly problems: readonly LessonProblem[] };

// apps/playground/lib/cartilha/grade-exercise.types.ts
export type Verdict = 'correct' | 'wrong' | 'compile-failed' | 'run-failed' | 'timeout';
export interface GradeResult {
  readonly verdict: Verdict;
  readonly actualStdout: string;
  readonly expectedStdout: string;
  readonly diagnostic?: Diagnostic;         // de @goiasscript/compiler
  readonly reason?: string;                 // goianês, quando run-failed
}

// apps/engoianador-api/src/ports.types.ts
export type QuotaDecision =
  | { readonly ok: true; readonly reservation: string }
  | { readonly ok: false; readonly reason: 'rate' | 'global' | 'kill-switch' | 'misconfig'; readonly retryAfterSec: number };
export interface QuotaLimiter {
  reserve(networkKey: string, nowSec: number): Promise<QuotaDecision>;
  refund(reservation: string): Promise<void>;
}
export type ProviderFailure = 'client-error' | 'server-error' | 'timeout' | 'model-disabled' | 'empty';
export type ProviderResult =
  | { readonly ok: true; readonly text: string; readonly provider: string }
  | { readonly ok: false; readonly failure: ProviderFailure; readonly provider: string };
export interface ProviderChain { complete(text: string, signal: AbortSignal): Promise<ProviderResult> }
export interface ResponseCache {
  get(text: string): Promise<string | null>;
  put(text: string, answer: string): Promise<void>;
}
export interface HealthReport { readonly ok: boolean; readonly model: string; readonly bindings: Readonly<Record<string, boolean>> }
```

---

## Fase 6 — Cartilha + piloto

### U6-01: Motor de lições
**Spec:** §6.4, §8.2 (blocos da cartilha no CI) · **Tier:** large · **Depende de:** GATE 4 · **Risco:** validar de menos (lição que passa e quebra no navegador) ou de mais (rejeitar conteúdo bom); executar programa do disco no CI sem contenção · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/lib/cartilha/{lesson.types.ts,lesson.constants.ts,lesson-schema.ts,parse-lesson.ts,load-lessons.ts,check-lesson-blocks.ts,run-lesson-program.ts,run-lesson-program.types.ts}`, `apps/playground/scripts/check-cartilha.ts`
- Create (testes): `apps/playground/tests/cartilha/{parse-lesson,lesson-schema,load-lessons,check-lesson-blocks,run-lesson-program}.test.ts`, `apps/playground/tests/cartilha-content.test.ts`, `apps/playground/tests/fixtures/cartilha/**` (lições válidas e inválidas mínimas)
- Modify: `apps/playground/package.json` (`yaml` na versão já usada pela raiz, script `check:cartilha`, `prebuild` roda `check-cartilha.ts --somente-compila`), `knip.json` se o knip acusar entrada nova

**Interfaces:** Produces `parseLesson(fileName, raw, readStdin): ParseLessonResult`; `loadLessons(dir): LoadLessonsResult` (verifica `id` único e igual ao nome do arquivo, `order` contíguo 1..N, `terms` sem repetição entre lições e existentes na tabela via `lookupKeyword`/`lookupStdlibGlobal`/`lookupStdlibMember` de `@goiasscript/language`); `checkLessonBlocks(lessons, deps): Promise<readonly LessonProblem[]>`; `runLessonProgram(code, stdin, options): Promise<{ stdout: string; stderr: string; exitCode: number | null; timedOut: boolean }>` (compila no alvo `module`, grava num `.mjs` temporário e roda `process.execPath` por `execFile` com lista de argumentos, `cwd` temporário, ambiente mínimo e teto `LESSON_RUN_TIMEOUT_MS`).
**Aceite:** lição inválida (id repetido, exercício sem `expectedStdout`, bloco que não compila, bloco com aviso, `stdinFile` fora da pasta, solução cuja saída difere da esperada, termo fora da tabela) faz `check-cartilha.ts` sair 1 com mensagem em goianês que cita arquivo e linha; `prebuild` falha junto; o teste `cartilha-content.test.ts` percorre as lições reais que existirem em disco (zero é aceito até a U6-04, que fixa 11).

- [ ] **1.1 Teste (RED).** `parse-lesson.test.ts`: 'lê frontmatter e blocos de uma lição válida'; 'recusa frontmatter sem id'; 'recusa mais de um bloco exemplo'; 'recusa lição sem bloco exemplo'; 'lê o código esperado de um bloco erro-esperado'. `lesson-schema.test.ts`: 'recusa id fora do padrão licao-NN'; 'recusa exercício sem saída esperada'; 'recusa stdinFile com ../'. `load-lessons.test.ts`: 'recusa id repetido entre lições'; 'recusa ordem com buraco'; 'recusa termo que não está na tabela da linguagem'; 'recusa termo repetido em duas lições'. `check-lesson-blocks.test.ts` (com `compile` e `run` reais sobre fixtures): 'aceita bloco que compila sem nenhum diagnóstico'; 'recusa aviso inesperado em bloco (classe Conta)'; 'aceita erro-esperado só quando o código bate'; 'recusa solução que imprime saída diferente da esperada'; 'compara ignorando CRLF'; 'responde pergunta com as linhas do stdin'; 'mensagens saem em goianês e citam arquivo e linha'. `run-lesson-program.test.ts`: 'estoura o tempo e devolve timedOut'; 'nome de arquivo não passa pelo shell'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground cartilha` — esperado: falham.
- [ ] **1.3 Implementar.** Frontmatter por `yaml` (somente chaves conhecidas; chave extra é problema). Fences lidas por varredura linha a linha (sem regex gulosa); info string `goiasscript [exemplo | erro-esperado GSnnnn]`. Guardas de tipo à mão, sem Zod no app. Toda mensagem de problema começa com "Ô sô" ou equivalente do tom raiz e traz `licao-NN.md:linha`.
- [ ] **1.4 Rodar:** os testes, `corepack pnpm --filter playground exec node scripts/check-cartilha.ts` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(playground): adiciona o motor de lições da cartilha`.

---

### U6-03a: Lições 1 a 4
**Spec:** §6.4 · **Tier:** medium · **Depende de:** U6-01 · **Risco:** exemplo bonito que não compila; decimal com vírgula ensinado sem o erro · **Rollback:** reverter o commit
**Files:** Create `apps/playground/content/cartilha/licao-0{1,2,3,4}.md`. Test: `cartilha-content.test.ts` (da U6-01) e `check-cartilha.ts`.

**Conteúdo (grafias conferidas em `packages/language/generated/glossary.json`):**
| id | Título | `terms` | Exemplo editável | Exercício (saída esperada) |
|---|---|---|---|---|
| licao-01 | Primeiro programa: `prosa` | `prosa` | `prosa("Bão, sô!")` | imprimir `Olá, Goiás!` |
| licao-02 | `uai` e `trem` | `uai`, `trem` | constante e variável; bloco `erro-esperado GS0208` com `uai preço é 10,50` e a correção com ponto | `starter` com `uai preço é 10,50`; `solution` com `10.50`; `expectedStdout` `Preço: 10.5` |
| licao-03 | Texto e `mais` | `mais`, `gritando` | juntar textos com `mais`; `.gritando()` | montar `PEQUI DE GOIÁS` |
| licao-04 | `se_ocê_quiser` | `se_ocê_quiser`, `se_não`, `se_num_for` | decisão com `maior_que`/`é_igualim` | classificar uma nota em três faixas |

- [ ] **1.1 Teste (RED).** Rodar `check-cartilha.ts` sem os arquivos não prova nada; o RED é `cartilha-content.test.ts` ganhar o caso 'a lição licao-0N existe e cumpre o roteiro' (id, ordem, termos esperados da tabela acima) para as quatro lições — falha por arquivo ausente.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground cartilha-content` — esperado: falha.
- [ ] **1.3 Implementar.** Texto didático em goianês raiz, curto; lição 2 ensina `trem` como variável (vira `let`) e que decimal é com ponto; cada lição termina chamando o exercício. Nenhum exemplo usa `Conta`/`Data` como classe nem membro reservado.
- [ ] **1.4 Rodar:** o teste e `check-cartilha.ts` (compila e executa tudo) — esperado: verdes.
- [ ] **1.5 Commit:** `feat(playground): adiciona as lições 1 a 4 da cartilha`.

### U6-03b: Lições 5 a 8
**Depende de:** U6-01 · **Tier:** medium · **Rollback:** reverter o commit · **Files:** Create `content/cartilha/licao-0{5,6,7,8}.md`.
| id | Título | `terms` | Exercício |
|---|---|---|---|
| licao-05 | Laços | `vai_indo`, `enquanto_tiver`, `para_com_isso`, `continua_aí` | imprimir de 1 a 5 |
| licao-06 | Listas | `mapear`, `filtrar`, `bota_no_final`, `tamanho` | dobrar os números e filtrar os maiores que 5 |
| licao-07 | `faz_trem` | `faz_trem`, `faz_favor` | função `soma` e chamada |
| licao-08 | Coisas (objetos) | `de`, `em` (iteração) ou as palavras de objeto que a tabela trouxer | ler e mudar campos de uma coisa; sem chaves de nome reservado (P3) |

- [ ] **1.1 Teste (RED):** `cartilha-content.test.ts` ganha 'a lição licao-0N existe e cumpre o roteiro' para 05 a 08 (falha por arquivo ausente).
- [ ] **1.2 Rodar / 1.3 Implementar / 1.4 Rodar:** como na U6-03a. Lição 5 explica o limite de laço do playground (GS0701) em texto, sem bloco que estoure. Se uma palavra de `terms` não existir na tabela, usar a grafia real do glossário; o teste da U6-01 barra termo inexistente.
- [ ] **1.5 Commit:** `feat(playground): adiciona as lições 5 a 8 da cartilha`.

### U6-03c: Lições 9 a 11
**Depende de:** U6-01 · **Tier:** medium · **Rollback:** reverter o commit · **Files:** Create `content/cartilha/licao-{09,10,11}.md`, `content/cartilha/stdin/licao-11.txt`.
| id | Título | `terms` | Exercício |
|---|---|---|---|
| licao-09 | `arruma_trem` e `a_raiz` | `arruma_trem`, `a_raiz`, `inherda_de`, `aprepara_trem` | classes `Fruta` e `Pequi` (P4), método na filha chamando `a_raiz` |
| licao-10 | `tenta_aí` e `vixe` | `tenta_aí`, `se_der_ruim`, `por_fim`, `vixe` | capturar erro e imprimir `erro.mensagem`; mostra o erro de execução já em português |
| licao-11 | `pergunta` e `espera_um_cadim` | `pergunta`, `espera_um_cadim`, `vira_número` | `uai preço é vira_número(pergunta("Quanto custa?"))`; `stdin` `10,50` mostra o aviso da vírgula (GS0805) e o aluno troca por ponto no `starter` |

- [ ] **1.1 Teste (RED):** `cartilha-content.test.ts` ganha o caso do roteiro para 09 a 11 e 'a lição 11 usa stdinFile dentro de content/cartilha/stdin'.
- [ ] **1.2 a 1.4:** como na U6-03a; `stdin/licao-11.txt` com uma resposta por linha. `solution` e blocos executados pelo CI com o stdin da lição.
- [ ] **1.5 Commit:** `feat(playground): adiciona as lições 9 a 11 da cartilha`.

---

### U6-02: Interface `/cartilha`, correção automática e progresso
**Spec:** §6.4, §6.3 (Worker, CSP) · **Tier:** large · **Depende de:** U6-01, U6-03a · **Risco:** XSS pelo Markdown; correção que depende de ordem de mensagem do Worker; perder a lição quando `localStorage` falha · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/app/cartilha/{layout.tsx,page.tsx,[id]/page.tsx}`, `apps/playground/components/cartilha/{LessonIndex,LessonWorkspace,ExercisePanel,LessonProse,ProgressBadge}.tsx`, `apps/playground/components/cartilha/cartilha-texts.constants.ts`, `apps/playground/lib/cartilha/{grade-exercise.ts,grade-exercise.types.ts,progress.ts,progress.types.ts,progress.constants.ts,use-lesson-session.ts,markdown-urls.ts}`
- Create (testes): `apps/playground/tests/cartilha/{grade-exercise,progress,markdown-urls,lesson-prose,static-params}.test.ts`; `apps/playground-e2e/tests/{cartilha-lesson,cartilha-progress}.spec.ts`, `apps/playground-e2e/tests/support/cartilha-page.ts`
- Modify: `apps/playground/package.json` (`react-markdown`, versão exata), `apps/playground/lib/test-ids.constants.ts`, `apps/playground/components/ui-texts.constants.ts`, `tools/rules-scan/baseline.json` (se algum arquivo tocado ainda estiver nele), link "Cartilha" na navegação do `app/layout.tsx` (único arquivo de layout que a Fase 6 edita)

**Interfaces:** Produces `gradeExercise(request, deps): Promise<GradeResult>` com `request = { source, exercise: Pick<LessonExercise, 'expectedStdout' | 'stdin'> }` e `deps = { compile(source): Promise<CompileView>; runner: RunnerClient }`; `normalizeStdout(text): string`; `readProgress(storage): LessonProgress`, `markCompleted(storage, lessonId): LessonProgress`, `PROGRESS_STORAGE_KEY`; `useLessonSession(lesson)`; `isSafeLessonHref(href): boolean`.
**Aceite:** na lição 1 o aluno roda o exemplo e vê a saída; acerta o exercício e a lição fica marcada; erra e vê a saída esperada ao lado da obtida; sem `localStorage` (ou com ele lançando) a lição funciona e o progresso só não persiste; `<script>` e `javascript:` do Markdown viram texto ou são descartados; `generateStaticParams` devolve um id por lição; E2E verde em Chromium, Firefox e WebKit; rodar a correção reusa o mesmo Worker com CSP da Fase 4 (nada novo na superfície de execução).

- [ ] **1.1 Teste (RED).** `grade-exercise.test.ts` (com `RunnerClient` falso): 'acerta quando a saída bate ignorando CRLF e espaço no fim da linha'; 'erra e devolve a saída obtida'; 'responde as perguntas com as linhas de stdin na ordem'; 'run-failed quando o programa pergunta mais do que o stdin tem'; 'compile-failed com o diagnóstico, sem rodar'; 'timeout do runner vira timeout'. `progress.test.ts`: 'lê vazio quando o storage lança'; 'marca concluída sem duplicar'; 'ignora id fora do padrão'; 'JSON torto ou tipo errado volta a vazio'. `lesson-prose.test.ts` (renderToString): '`<script>` no Markdown sai como texto'; 'link javascript: é descartado'; 'link https e caminho interno são mantidos'; 'bloco de código vira pre/code sem HTML bruto'. `static-params.test.ts`: 'um id por lição do diretório de conteúdo'. E2E: 'abre a lição 1, roda o exemplo e vê a saída'; 'acerta o exercício da lição 1 e a lição fica marcada no índice'; 'erra e vê esperado e obtido'; 'a lição 2 mostra o erro GS0208 no editor para uai preço é 10,50'; 'sem localStorage a lição continua funcionando'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground cartilha` — esperado: falham.
- [ ] **1.3 Implementar.** Página `[id]` é componente de servidor (lê `loadLessons` no build, `notFound()` para id desconhecido); `LessonWorkspace` é o único componente de cliente e compõe `createCompileService`, `createBrowserRunnerClient`, `startRun`, `reduceRunView` e o `Editor` dinâmico, sem editar `use-playground.ts`. `gradeExercise` sobrepõe um coletor de saída ao `RunEvent` (`out`, `ask`, `finished`, `failed`, `timeout`). Textos em `cartilha-texts.constants.ts` ("Acertou, sô!", "Quase lá, sô…"). `data-testid` novos em `test-ids.constants.ts`.
- [ ] **1.4 Rodar:** os testes, `corepack pnpm --filter playground-e2e test:e2e -- cartilha` e `corepack pnpm verify` — esperado: verdes (Firefox e WebKit também rodam na CI; registrar no gate se só o Chromium rodou local).
- [ ] **1.5 Commit:** `feat(playground): adiciona a interface da cartilha com correção`.

---

### U6-04: Liga erro, hover e glossário às lições
**Spec:** §6.4 ("cada diagnóstico aponta para a lição"), §6.3, §6.5 · **Tier:** large · **Depende de:** U6-02, U6-03a, U6-03b, U6-03c · **Risco:** alterar `lesson` muda goldens (`diagnostics.json`); mapa de termos divergente entre playground e extensão; Vercel não enxergar `docs/spec` fora do diretório do app · **Rollback:** reverter o commit
**Files:**
- Create: `apps/playground/scripts/build-lesson-index.ts` (`--write` e `--check`), `apps/playground/lib/cartilha/lesson-index.generated.ts`, `packages/vscode/src/language/lesson-terms.generated.ts`, `apps/playground/app/cartilha/o-que-mudou/page.tsx`, `apps/playground/app/glossario/page.tsx`
- Create (testes): `apps/playground/tests/{lesson-index-drift,lesson-catalog,glossary-page,o-que-mudou-page}.test.ts`
- Modify: `apps/playground/lib/lesson-routes.constants.ts` e `lesson-routes.ts`; `packages/vscode/src/language/lesson-link.constants.ts`; `packages/language/src/diagnostics/{syntax,lexical,names,javascript,library,runtime,subset,hints}.data.ts` (campo `lesson`); `package.json` raiz (`generate:check` ganha `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON apps/playground/scripts/build-lesson-index.ts --check`); `apps/playground/tests/lesson-routes.test.ts` e os testes de hover/completion da extensão que assumem o mapa vazio; goldens afetados (`corepack pnpm bless`, revisados no commit); `apps/playground/package.json` (`prebuild` gera o índice)

**Tabela fechada de `lesson` (decisão 23).** Cada código existe no catálogo; os que já têm `lesson` ficam.
| Lição | Códigos |
|---|---|
| licao-02 | GS0208, GS0301, GS0302, GS0304, GS0307, GS0401, GS0402, GS0403, GS0404 |
| licao-03 | GS0101, GS0102, GS0103, GS0501 |
| licao-04 | GS0801, GS0207 |
| licao-05 | GS0308, GS0701, GS0802 |
| licao-06 | GS0405, GS0603, GS0604 |
| licao-07 | GS0309, GS0803 |
| licao-08 | GS0305, GS0406, GS0601 |
| licao-09 | GS0310, GS0311 |
| licao-10 | GS0206, GS0807, GS0710, GS0711, GS0712 |
| licao-11 | GS0312, GS0602, GS0702, GS0703, GS0805 |
| o-que-mudou | GS0306 |

**Interfaces:** `lesson-index.generated.ts` exporta `AVAILABLE_LESSON_IDS: readonly string[]` e `LESSON_TERMS: Readonly<Record<string, string>>` (termo → id); `lesson-routes.constants.ts` passa a derivar `AVAILABLE_LESSONS = [...AVAILABLE_LESSON_IDS, 'o-que-mudou']`, `LESSON_BY_TERM = LESSON_TERMS` e `KNOWN_LESSON_IDS` dos `lesson` de `DIAGNOSTICS`. A extensão recebe o mesmo mapa (`LESSON_BY_TERM`).
**Aceite:** teste percorre `DIAGNOSTICS` e exige que todo `lesson` esteja em `AVAILABLE_LESSONS` e que `/cartilha/<id>` exista para cada um (inclusive `o-que-mudou`); cada código da tabela existe e recebeu a lição certa; `generate:check` falha se o índice divergir das lições; hover do playground e da extensão (com `lessonBaseUrl` preenchido) passam a mostrar o link de `prosa`, `uai` etc.; `/glossario` lista palavras e biblioteca do `glossary.json` com âncora por termo e link para a lição quando houver; `/cartilha/o-que-mudou` renderiza `docs/spec/o-que-mudou.md` pelo mesmo `LessonProse` (sem HTML bruto); E2E: o erro GS0208 do exemplo ganha link para `/cartilha/licao-02`.

- [ ] **1.1 Teste (RED).** `lesson-catalog.test.ts`: 'todo lesson do catálogo tem página em AVAILABLE_LESSONS'; 'a tabela atribui a lição certa a cada código'; 'nenhum código da tabela falta no catálogo'. `lesson-index-drift.test.ts`: 'o índice gerado é igual ao calculado das lições'; 'a extensão recebe o mesmo mapa de termos'. `glossary-page.test.ts`: 'lista todos os termos do glossário com âncora'; 'termo com lição ganha link'. `o-que-mudou-page.test.ts`: 'renderiza a tabela de palavras aposentadas'. `lesson-routes.test.ts` e os da extensão: trocam a expectativa de lista vazia por 11 lições mais `o-que-mudou`.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground lesson` e `corepack pnpm --filter goiasscript-vscode exec vitest run hover completion lesson` — esperado: falham.
- [ ] **1.3 Implementar.** Gerador lê `loadLessons` e escreve os dois arquivos (cabeçalho "gerado, não edite"). Tabela em `packages/language/src/diagnostics/lesson-map.constants.ts` consumida por um teste (a fonte de verdade continua sendo o campo `lesson` de cada `d(...)`). A página de `o-que-mudou` lê `path.resolve(process.cwd(), '../../docs/spec/o-que-mudou.md')` no build; se a Vercel não incluir arquivos fora do diretório raiz, o `prebuild` copia o arquivo (decisão do dono, ver Tarefas). `corepack pnpm bless` regrava só `lesson` nos goldens afetados.
- [ ] **1.4 Rodar:** os testes, `corepack pnpm generate:check`, E2E da cartilha e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(playground): liga diagnósticos e termos às lições da cartilha`.

---

### U6-05: Kit do piloto
**Spec:** §6.4, §10.3 · **Tier:** small · **Depende de:** U6-02 · **Risco:** dado pessoal de aprendiz no repositório · **Rollback:** reverter o commit
**Files:**
- Create: `docs/piloto/{README.md,roteiro.md,formulario-retorno.md,modelo-relatorio.md}`, `docs/piloto/respostas/.gitkeep`, `apps/playground/scripts/summarize-pilot.ts`, `apps/playground/scripts/summarize-pilot.types.ts`, `apps/playground/tests/summarize-pilot.test.ts`, `apps/playground/tests/fixtures/pilot/**` (respostas simuladas)
- Modify: `tools/config-tests/tests/docs.test.mjs` (higiene: sem e-mail, sem caminho absoluto, sem nome de pessoa nos arquivos de `docs/piloto/**`)

**Interfaces:** `PilotAnswer = { learnerId: 'A1'..; origin: 'goias' | 'fora'; lessonsCompleted: readonly string[]; confusingMessages: readonly { code: string; comment: string }[]; confusingLessons: readonly { lessonId: string; comment: string }[] }`; `summarizePilot(answers): { learners: number; completedLessons1to5: number; s8Met: boolean; topCodes: ...; topLessons: ... }`.
**Aceite:** roteiro de 3 a 5 aprendizes (incluindo de fora de Goiás), formulário sobre mensagens e lições, modelo do relatório; `summarize-pilot.ts` valida o esquema (recusa campo livre com padrão de e-mail ou telefone), conta quantos concluíram as lições 1 a 5 e imprime o resumo em goianês; sem respostas imprime `0/3 — pendente do dono`.

- [ ] **1.1 Teste (RED).** `summarize-pilot.test.ts`: 'conta aprendizes com as lições 1 a 5 concluídas'; 'S8 atendido com 3 aprendizes'; 'recusa resposta com e-mail no comentário'; 'recusa learnerId fora de A1..A9'; 'sem respostas devolve 0 de 3 e pendente'. `docs.test.mjs`: 'docs/piloto não tem e-mail, caminho absoluto nem nome próprio de aprendiz'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project playground summarize-pilot` e `corepack pnpm exec vitest run --project config-tests docs` — esperado: falham.
- [ ] **1.3 Implementar.** Documentos em goianês simples; roteiro diz o que observar (tempo até o primeiro `prosa`, onde travou, mensagem que não entendeu) e como anonimizar (`A1`, sem nome nem cidade; "de fora de Goiás" é só um marcador).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `docs(docs): adiciona o kit do piloto da cartilha`.

---

### U6-06: Aplicar o retorno do piloto
**Spec:** §10.1 (Fase 6: "retorno do piloto aplicado") · **Tier:** medium · **Depende de:** U6-05 e do retorno do dono (**não bloqueia**) · **Risco:** ajustar texto sem teste; perder o que ficou fora · **Rollback:** reverter o commit
**Files:** Create `docs/piloto/relatorio-piloto.md`; Modify conforme o retorno (mensagens do catálogo em `packages/language/src/diagnostics/*.data.ts`, lições em `content/cartilha/**`, goldens).
**Aceite:** com respostas em `docs/piloto/respostas/`: `summarize-pilot.ts` roda, cada ajuste de mensagem ou lição nasce com teste (golden ou conteúdo) e o relatório lista o que mudou e o que ficou fora, com S8 medido. **Sem respostas:** o relatório traz `0/3`, o estado `pendente do dono` e o comando exato (`corepack pnpm --filter playground exec node scripts/summarize-pilot.ts`); nenhum arquivo além do relatório muda.

- [ ] **1.1 Verificar.** Se `docs/piloto/respostas/` só tem `.gitkeep`, ir direto ao passo 1.3 (modo pendente).
- [ ] **1.2 Teste (RED) por ajuste:** para cada comentário acionável, golden de diagnóstico ou caso em `cartilha-content.test.ts` que falha com o texto atual.
- [ ] **1.3 Implementar e escrever** `relatorio-piloto.md` (aprendizes `A1..`, resultados agregados, ajustes, itens fora, S8).
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `docs(docs): registra o retorno do piloto e os ajustes`.

---

### U6-07: Gate 6
**Spec:** §10.1 (Fase 6), §8.2 (E2E da cartilha), §11 · **Tier:** medium · **Depende de:** U6-04, U6-06 · **Risco:** relatório sem número medido · **Rollback:** reverter o commit
**Files:** Create `docs/fase-6/relatorio-gate.md`, `apps/playground-e2e/tests/cartilha-pergunta.spec.ts`.
**Aceite:** E2E da cartilha verde nos três navegadores (resultado de CI anexado; o que não rodou local vira `pendente de CI`); blocos de código e soluções das 11 lições rodam no CI (`cartilha-content.test.ts`); revisão leve de XSS no Markdown renderizado feita e registrada (sem CRITICAL/HIGH); seção "Pendências do dono" (piloto, S8, domínio e `lessonBaseUrl`, Vercel e `docs/spec`).

- [ ] **1.1 Teste (RED).** `cartilha-pergunta.spec.ts`: 'a lição 11 responde a pergunta com o stdin da lição e corrige'; 'o aviso da vírgula aparece quando a resposta é 10,50 sem converter'.
- [ ] **1.2 Rodar:** `corepack pnpm --filter playground-e2e test:e2e -- cartilha` — esperado: falha antes de implementar o que faltar, depois verde.
- [ ] **1.3 Escrever** `docs/fase-6/relatorio-gate.md`: unidades e commits; cobertura de `apps/playground/{config,lib,sandbox}`; E2E por navegador; contagem de lições, blocos e soluções executados; tabela da revisão de XSS (corpo com `<script>`, `<img onerror>`, `javascript:`, `data:`); S8 (`0/3` ou medido); rastreabilidade da Fase 6 ("cada diagnóstico aponta para a lição" → `lesson-catalog.test.ts`; "lições rodam no CI" → `cartilha-content.test.ts`); pendências do dono.
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 6`.

---

## Fase 7 — Engoianador

### U7-00: Worker nos gates do repositório
**Spec:** §6.6, §8.1 (c) · **Tier:** medium · **Depende de:** GATE 4 · **Risco:** quebrar o Worker ao mudar versões; esconder lint atrás de exceção · **Rollback:** reverter o commit
**Files:**
- Modify: `apps/engoianador-api/{package.json,tsconfig.json,vitest.config.ts,wrangler.toml}`, `apps/engoianador-api/src/{index.ts,cors.ts,engoiana.ts,prompt.ts,rate-limit.ts}` e `test/{helpers,cors,prompt,rate-limit}.test.ts` (conformidade mecânica, sem mudar comportamento), `tools/rules-scan/baseline.json` (remove as 7 entradas do Worker), `knip.json` (sai de `ignoreWorkspaces`, ganha entrada), `vitest.config.mts` (projeto `engoianador-api`; include de cobertura sem limiar ainda), `eslint.config.mjs`, `package.json` raiz (`typecheck` e `verify` incluem `tsc -p apps/engoianador-api/tsconfig.json`)
- Create: `apps/engoianador-api/src/{env.types.ts,config.ts,config.constants.ts}`, `apps/engoianador-api/test/config.test.ts`, `apps/engoianador-api/scripts/{check-worker-config.ts,verify-model.ts}` (**stubs que falham**: "ainda não implementado")

**Interfaces:** `Env` (movido de `engoiana.ts`) com **todas** as variáveis e bindings planejados: `GROQ_API_KEY?`, `GROQ_MODEL`, `WORKERS_AI_MODEL`, `AI?`, `ALLOWED_ORIGINS`, `RATE_LIMIT_PER_DAY`, `GLOBAL_DAILY_CAP`, `MAX_INPUT_CHARS`, `MAX_BODY_BYTES`, `CACHE_TTL_SEC`, `KILL_SWITCH?`, `ALLOW_UNLIMITED?`, `QUOTA_LEDGER: DurableObjectNamespace`, `ENGOIANADOR_CACHE: KVNamespace`; `parseConfig(env): { ok: true; config: WorkerConfig } | { ok: false; problems: readonly string[] }` (inteiros positivos, origens `https:`/localhost, bindings presentes).
**Aceite:** `verify` cobre o Worker (typecheck, ESLint estrito, scanner, knip, Vitest) com TypeScript 6.0.3 e Vitest 5.0.5 do monorepo; testes existentes continuam verdes; `wrangler.toml` traz o esqueleto completo (vars, `[[durable_objects.bindings]]`, `[[migrations]]` com `new_sqlite_classes`, dois KV, `[ai]`) com ids marcados como placeholder que o `check-worker-config.ts` (stub) recusa; `predeploy` = `check-worker-config.ts && verify-model.ts`.

- [ ] **1.1 Teste (RED).** `config.test.ts`: 'aceita a configuração padrão'; 'recusa limite não numérico'; 'recusa limite zero ou negativo'; 'recusa origem http fora de localhost'; 'lista todos os problemas de uma vez'. Teste de configuração: 'eslint cobre apps/engoianador-api' (arquivo de exemplo que viola `any` é barrado), em `tools/config-tests/tests/eslint-matrix.test.mjs` (linha nova).
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api config` e `corepack pnpm exec vitest run --project config-tests eslint-matrix` — esperado: falham.
- [ ] **1.3 Implementar.** Ajustes mecânicos (nomes em inglês, `readonly`, constantes, sem `console` — `console.warn`/`console.error` viram um `LogPort` injetado), sem trocar fluxo. Conferir a sintaxe de Durable Object com SQLite e de `migrations` na documentação do Cloudflare no dia (Context7).
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `chore(engoianador): traz o worker para os gates do repositório`.

---

### U7-01: Validação de borda, contrato e portas
**Spec:** §6.6 (validação de borda; D APP-10) · **Tier:** large · **Depende de:** U7-00 · **Risco:** corpo lido antes do teto; CORS faltando em erro; quebrar o cliente do playground · **Rollback:** reverter o commit
**Files:**
- Create: `apps/engoianador-api/src/{handler.ts,validation.ts,validation.types.ts,ports.types.ts,messages.constants.ts,limiter.ts,cache.ts,health.ts}` e `src/providers/{index.ts,provider.types.ts}` (os quatro últimos como **stubs**: `limiter.ts` embrulha o `checkRateLimit` atual; `cache.ts` e `health.ts` são vazios funcionais; `providers/index.ts` embrulha `engoianarTexto`), `apps/engoianador-api/test/{validation,handler}.test.ts`
- Modify: `apps/engoianador-api/src/{index.ts,cors.ts}`, `apps/engoianador-api/package.json` (`zod`, versão exata), `apps/playground/lib/engoianador-client.constants.ts` (`REQUEST_TEXT_FIELD = 'text'`, `RESPONSE_TEXT_FIELDS = ['text']`), `apps/playground/tests/engoianador-client.test.ts`, `apps/engoianador-api/README.md`

**Interfaces:** `parseEngoianarRequest(request, config): Promise<{ ok: true; text: string } | { ok: false; status: 400 | 411 | 413 | 415; error: string }>`; `createHandler(deps: { limiter: QuotaLimiter; providers: ProviderChain; cache: ResponseCache; health: () => HealthReport; config: WorkerConfig; log: LogPort }): (request: Request, env: Env) => Promise<Response>`; ports de `ports.types.ts` (seção "Interfaces compartilhadas"). Pipeline fixo: preflight → rota → kill switch → validação → cache → reserva → provedores → devolução ou commit → cache.put. `GET /health` aponta para `health.ts`.
**Aceite:** cada caso do APP-10 testado: `Content-Type` diferente de JSON = 415; `Content-Length` ausente ou acima do teto = 411/413 **antes** de ler o corpo; corpo maior que o declarado = 413; `null`, array, texto no lugar de objeto, `text` não string, vazio ou só espaços = 400; acima de `MAX_INPUT_CHARS` = 413; todos com `Content-Type` JSON e cabeçalhos de CORS da origem permitida; mensagens em goianês; o pipeline não loga o texto; cliente do playground fala `{ text }`.

- [ ] **1.1 Teste (RED).** `validation.test.ts`: um `it` por caso da lista acima ('recusa corpo null com 400 e CORS', 'recusa Content-Length acima do teto sem ler o corpo', …). `handler.test.ts`: 'GET /health responde sem chamar provedor nem consumir cota'; 'kill switch devolve 503 antes de qualquer custo'; 'OPTIONS devolve preflight só para origem permitida'; 'rota desconhecida devolve 404 em goianês com CORS'; 'ordem do pipeline: cache antes da reserva'; 'erro interno devolve 500 sem vazar mensagem'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api validation handler` — esperado: falham.
- [ ] **1.3 Implementar.** Schema Zod `z.object({ text: z.string().trim().min(1) }).strict()` aplicado só depois dos testes de cabeçalho; leitura do corpo por `request.body` com contador de bytes. Retirar o cabeçalho `x-user-api-key` do CORS. Mesma lógica dos stubs mantém o comportamento atual até as unidades seguintes.
- [ ] **1.4 Rodar:** os testes, `corepack pnpm exec vitest run --project playground engoianador-client` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(engoianador): valida o corpo da requisição na borda`.

---

### U7-02: Cota atômica em Durable Object
**Spec:** §6.6 (limite atômico, /64, teto global, kill switch; D APP-02, APP-05) · **Tier:** large · **Depende de:** U7-01 · **Risco:** corrida entre leitura e escrita; cota perdida quando o provedor falha; chave de rede mal calculada · **Rollback:** reverter o commit
**Files:**
- Create: `apps/engoianador-api/src/quota/{network-key.ts,quota-ledger.ts,quota.types.ts}`, `apps/engoianador-api/src/rate-limiter.do.ts` (classe `QuotaLedgerObject`, exportada pelo `index.ts` via `export { QuotaLedgerObject } from './rate-limiter.do'` já previsto na U7-01), `apps/engoianador-api/test/{network-key,quota-ledger,limiter,check-worker-config}.test.ts`
- Modify: `apps/engoianador-api/src/limiter.ts` (substitui o stub), `apps/engoianador-api/scripts/check-worker-config.ts` (substitui o stub; `smol-toml` em versão exata), `apps/engoianador-api/package.json` (dependência); remove `rate-limit.ts` e `test/rate-limit.test.ts`

**Interfaces:** `networkKeyOf(ip: string): string` (IPv4 inteiro; IPv6 expandido, só os 4 primeiros grupos; entrada inválida vira `anon`); `QuotaLedger.reserve({ key, limit, windowSec, globalCap, nowSec })` síncrono sobre `ctx.storage.sql`, devolvendo `QuotaDecision`; `refund(reservation)`; `createLimiter(env, config): QuotaLimiter` (reserva global e depois da rede; se a rede nega, devolve a global).
**Aceite:** 30 chamadas simultâneas (`Promise.all`) ao limite 20 passam exatamente 20 e negam 10; `refund` volta o contador ao valor anterior e é idempotente; provedor em erro (teste no `handler`) devolve a reserva; dois IPv6 do mesmo /64 dividem a cota, de /64 diferentes não; teto global nega com `reason: 'global'`; kill switch nega antes de tocar no DO; DO indisponível = negação `misconfig` (503); janela diária vira no UTC; `check-worker-config.ts` falha para `RATE_LIMIT_PER_DAY` não numérico, id de KV placeholder, binding de DO ausente, migração sem a classe.

- [ ] **1.1 Teste (RED).** `quota-ledger.test.ts` (sobre um `sql` falso em memória): 'concede exatamente o limite sob 30 chamadas simultâneas'; 'refund devolve a cota uma única vez'; 'a janela expira depois de 24 h'; 'o teto global nega depois do limite'. `network-key.test.ts`: 'IPv6 do mesmo /64 gera a mesma chave'; 'IPv4 mapeado em IPv6 usa o IPv4'; 'entrada inválida vira anon'. `limiter.test.ts`: 'nega por rede e devolve a global'; 'DO que lança vira misconfig'; 'kill switch não chama o DO'. `check-worker-config.test.ts`: 'recusa id de KV placeholder'; 'recusa DO sem migração'; 'aceita o wrangler.toml completo'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api quota limiter network-key check-worker-config` — esperado: falham.
- [ ] **1.3 Implementar.** Tabela `ledger(key TEXT, day INTEGER, count INTEGER)` mais `reservations(id, key, day)`. O IP vem só de `cf-connecting-ip`. Sem texto do usuário no DO.
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(engoianador): reserva e devolve a cota de forma atômica`.

---

### U7-03: Provedores, modelo e fallback
**Spec:** §6.6 (modelo por variável, ID verificado no deploy, fallback testado) · **Tier:** medium · **Depende de:** U7-01 · **Risco:** modelo desligado derrubar o serviço; chave em log ou no repositório · **Rollback:** reverter o commit
**Files:**
- Create: `apps/engoianador-api/src/providers/{groq.ts,workers-ai.ts}`, `apps/engoianador-api/test/{groq,workers-ai,provider-chain,verify-model}.test.ts`
- Modify: `apps/engoianador-api/src/{engoiana.ts,prompt.ts}` (`engoiana.ts` vira o orquestrador `createProviderChain`; `prompt.ts` exporta `PROMPT_VERSION`), `apps/engoianador-api/src/providers/index.ts` (substitui o stub), `apps/engoianador-api/scripts/verify-model.ts` (substitui o stub), `apps/engoianador-api/test/prompt.test.ts`, `apps/engoianador-api/.dev.vars.example`, `apps/engoianador-api/wrangler.toml` (só os **valores** de `GROQ_MODEL`/`WORKERS_AI_MODEL`, conferidos no registro no dia)

**Interfaces:** `createGroqProvider(options: { apiKey: string | undefined; model: string; fetchFn: FetchPort; timeoutMs: number }): ProviderPort`; `createWorkersAiProvider(options)`; `createProviderChain(providers): ProviderChain` (tenta em ordem; para na primeira resposta boa; devolve a última falha); `verifyModel(options: { apiKey: string | undefined; model: string; fetchFn: FetchPort }): Promise<VerifyModelResult>` (lê a lista de modelos da API da Groq, confirma que o id existe e está ativo; sem chave = resultado `skipped` com aviso, e exit 1 em modo `--require`).
**Aceite:** provedor simulado cobre sucesso, 4xx, 5xx, timeout, resposta vazia e `model_decommissioned` (classificado `model-disabled`); Groq falhando cai no Workers AI; os dois falhando devolve a falha ao `handler` (que devolve a cota); `verify-model` falha com id inexistente ou desligado e **não imprime a chave**; nenhum valor de segredo no repositório.

- [ ] **1.1 Teste (RED).** `groq.test.ts`: 'sucesso devolve o texto sem aspas'; 'status 400 vira client-error'; 'status 503 vira server-error'; 'timeout vira timeout'; 'modelo desligado vira model-disabled'; 'resposta vazia vira empty'; 'a chave só vai no cabeçalho Authorization'. `provider-chain.test.ts`: 'cai no Workers AI quando a Groq falha'; 'devolve a última falha quando todos falham'; 'sem chave da Groq usa só o Workers AI'. `verify-model.test.ts`: 'aceita modelo ativo'; 'recusa modelo ausente da lista'; 'sem chave pula e avisa, ou falha com --require'; 'a saída nunca contém a chave'. `prompt.test.ts`: 'PROMPT_VERSION muda quando o texto do prompt muda' (snapshot do hash do prompt).
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api groq workers-ai provider-chain verify-model prompt` — esperado: falham.
- [ ] **1.3 Implementar.** Mensagens de erro internas em inglês só no log (sem texto do usuário); resposta ao usuário sempre goianês. Remover as constantes `GROQ_MODEL`/`WORKERS_AI_MODEL` fixas de `engoiana.ts` (os modelos que estavam fixos foram desligados pela Groq).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(engoianador): configura modelo, provedores e fallback`.

---

### U7-05: `GET /health` e cliente
**Spec:** §6.6 (`/health`) · **Tier:** small · **Depende de:** U7-01 · **Risco:** `/health` chamar provedor ou consumir cota · **Rollback:** reverter o commit
**Files:** Modify `apps/engoianador-api/src/health.ts` (substitui o stub), `apps/playground/lib/engoianador-client.ts`, `engoianador-client.types.ts`, `engoianador-client.constants.ts`, `apps/playground/app/engoianador/{engoianador-screen.tsx,use-engoianador-session.ts}` (estado "de folga" quando o health falha), `vitest.config.mts` (tira `engoianador-client` de `PLAYGROUND_LEGACY`), `apps/playground/tests/engoianador-client.test.ts`, `tools/rules-scan/baseline.json`; Create `apps/engoianador-api/test/health.test.ts`.
**Interfaces:** `buildHealthReport(env, config): HealthReport` (confere modelo configurado e bindings `QUOTA_LEDGER`, `ENGOIANADOR_CACHE`, `AI`, secret `GROQ_API_KEY` por presença, **sem expor valor**); `checkEngoianadorHealth(options: EngoianarOptions): Promise<'up' | 'down' | 'disabled'>`.
**Aceite:** contrato do `/health` testado (200 com `{ ok, model, bindings }`; 503 com `ok: false` quando falta binding); nenhuma chamada ao provedor, ao limiter nem ao cache; cliente e página: sem `engoianadorUrl` = `disabled` sem requisição; `up`/`down` refletem o health com `credentials: 'omit'`, `redirect: 'error'` e teto de tempo; `engoianador-client.ts` entra na cobertura.

- [ ] **1.1 Teste (RED).** `health.test.ts`: 'responde 200 com modelo e bindings'; 'responde 503 quando falta o Durable Object'; 'não expõe a chave nem valores de variável'; 'não chama provedor nem limiter'. Cliente: 'disabled quando não há URL e não faz requisição'; 'up para 200 com ok true'; 'down para 503, rede caída e JSON torto'; 'não segue redirecionamento'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api health` e `... --project playground engoianador-client` — esperado: falham.
- [ ] **1.3 Implementar** e remover as entradas do `baseline.json` dos arquivos reescritos.
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(engoianador): adiciona o health e o estado de folga no cliente`.

---

### U7-04: Cache por hash do texto normalizado
**Spec:** §6.6 (cache; D APP-03) · **Tier:** medium · **Depende de:** U7-02, U7-03 · **Risco:** servir resposta de outro modelo ou prompt; erro de KV derrubar a requisição · **Rollback:** reverter o commit
**Files:** Create `apps/engoianador-api/src/cache-key.ts`, `apps/engoianador-api/scripts/warm-cache.ts`, `apps/engoianador-api/test/{cache-key,cache,warm-cache}.test.ts`; Modify `apps/engoianador-api/src/cache.ts` (substitui o stub), `apps/engoianador-api/README.md`.
**Interfaces:** `normalizeForCache(text): string` (NFC, `trim`, espaços repetidos viram um); `cacheKeyOf(text, promptVersion, modelId): Promise<string>` (`v1:<promptVersion>:<modelId>:<sha256 hex>` via `crypto.subtle`); `createCache(options: { kv: KvPort; ttlSec: number; promptVersion: string; modelId: string }): ResponseCache`; `warm-cache.ts` posta as 5 `PRESETS` do playground (`apps/playground/app/engoianador/engoianador.constants.ts`) na API informada por argumento.
**Aceite:** a segunda chamada igual não chama o provedor e não consome cota (teste de `handler` com contadores); texto com espaços extras e normalização Unicode diferente acerta o mesmo item; trocar `PROMPT_VERSION` ou o modelo muda a chave; `get` e `put` que lançam viram miss e não alteram a resposta; TTL aplicado (`expirationTtl >= 60`); o aviso de privacidade da página já cita o cache (U4-07).

- [ ] **1.1 Teste (RED).** `cache-key.test.ts`: 'espaços extras geram a mesma chave'; 'NFC e NFD geram a mesma chave'; 'modelo diferente gera chave diferente'; 'versão do prompt diferente gera chave diferente'. `cache.test.ts`: 'put e get devolvem a resposta'; 'erro de leitura vira miss'; 'erro de escrita é engolido e registrado'; 'aplica o TTL'. `handler.test.ts` (acréscimo): 'acerto de cache não chama provedor nem reserva cota'. `warm-cache.test.ts`: 'envia as cinco frases prontas e relata falha sem abortar'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api cache handler warm-cache` — esperado: falham.
- [ ] **1.3 Implementar.** `warm-cache.ts` é script de operação do dono (usa `fetch` injetável nos testes); não roda no CI.
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `feat(engoianador): guarda respostas em cache por hash do texto`.

---

### U7-06: Contrato semanal e smoke pós-deploy
**Spec:** §6.6 (teste de contrato agendado; smoke único), §8.3 · **Tier:** small · **Depende de:** U7-03 · **Risco:** workflow que roda sem o segredo e acusa falso vermelho; segredo em `run:` ou em `env` do job inteiro · **Rollback:** reverter o commit
**Files:** Create `.github/workflows/{engoianador-contract,engoianador-smoke}.yml`, `apps/engoianador-api/scripts/contract-check.ts`, `apps/engoianador-api/test/contract-check.test.ts`, `tools/config-tests/tests/engoianador-workflows.test.mjs`.
**Interfaces:** `runContractCheck(options: { baseUrl: string | null; apiKey: string | undefined; model: string; fetchFn: FetchPort }): Promise<ContractResult>` com `ContractResult = { status: 'passed' } | { status: 'skipped'; reason: string } | { status: 'failed'; problems: readonly string[] }`; confere (a) a Groq lista o modelo configurado e uma completação mínima responde; (b) a API implantada responde `/health` ok e `POST /engoiana` devolve `{ text }` para uma frase pronta.
**Aceite:** `engoianador-contract.yml` (cron semanal e `workflow_dispatch`) e `engoianador-smoke.yml` (só `workflow_dispatch`, entrada `base_url`) com `permissions: contents: read`, actions por SHA, segredo `GROQ_API_KEY` referenciado **uma vez**, só no `env` do passo que roda o script; sem o segredo e a variável `ENGOIANADOR_URL` o script devolve `skipped` com mensagem em goianês e sai 0 mas o resumo do job mostra "pendente do dono"; nada roda automaticamente sem configuração.

- [ ] **1.1 Teste (RED).** `contract-check.test.ts`: 'passa quando modelo e API respondem'; 'falha quando o modelo sumiu da lista'; 'falha quando a API devolve o campo errado'; 'pula sem chave e sem URL'; 'a saída nunca contém a chave'. `engoianador-workflows.test.mjs`: 'cron semanal'; 'segredo aparece uma vez e só no env de um passo'; 'smoke recusa base_url sem https'; 'actions pinadas por SHA'; 'permissões mínimas'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api contract-check` e `... --project config-tests engoianador-workflows` — esperado: falham.
- [ ] **1.3 Implementar.** Mesmo cuidado do `playground-smoke.yml` com validação de `base_url` (`new URL`, `https:`, mesmo host em redirecionamento).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `ci(engoianador): adiciona contrato semanal e smoke pós-deploy`.

---

### U7-07: Testes reais de `index` e `engoiana` e mutação
**Spec:** §6.6 ("0/8 mutantes mortos"), §8.2 (mutação) · **Tier:** medium · **Depende de:** U7-01, U7-03 · **Risco:** teste que repete a implementação; mutação lenta demais · **Rollback:** reverter o commit
**Files:** Create `apps/engoianador-api/test/{index,engoiana}.test.ts`, `apps/engoianador-api/stryker.config.mjs`, `apps/engoianador-api/vitest.mutation.config.ts`; Modify `apps/engoianador-api/package.json` (script `mutate`, devDependencies Stryker nas versões do pacote `cli`), `vitest.config.mts` (limiar 80% para `apps/engoianador-api/src/**`), `tools/config-tests/tests/*` (se houver teste do `stryker.config`).
**Aceite:** testes de fluxo completo em `index.ts` (fetch do Worker com `Env` falso) e de `engoiana.ts` (cadeia com provedores simulados) cobrindo erro de cada camada; cobertura do Worker ≥ 80% por linhas, funções e ramos; `corepack pnpm --filter engoianador-api mutate` roda e a **nota de mutação medida é registrada no relatório** (somente relatório, `thresholds.break: null`).

- [ ] **1.1 Teste (RED).** `index.test.ts`: 'POST válido percorre validação, cota, provedor e cache'; 'provedores em erro devolvem 502 em goianês e devolvem a cota'; 'cota negada devolve 429 com Retry-After'; 'rota desconhecida devolve 404'. `engoiana.test.ts`: 'usa o segundo provedor quando o primeiro falha'; 'devolve a falha quando todos falham'; 'não vaza o corpo cru do provedor'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project engoianador-api index engoiana` — esperado: parte falha por comportamento ainda não coberto; ajustar a implementação só onde o teste achar bug.
- [ ] **1.3 Implementar** a configuração do Stryker espelhando a do `cli` e ligar o limiar de cobertura.
- [ ] **1.4 Rodar:** `corepack pnpm exec vitest run --coverage --project engoianador-api`, `corepack pnpm --filter engoianador-api mutate` e `corepack pnpm verify` — esperado: verdes; anotar a nota de mutação.
- [ ] **1.5 Commit:** `test(engoianador): cobre index e engoiana e mede mutação`.

---

### U7-08: Gate 7
**Spec:** §10.1 (Fase 7) · **Tier:** medium · **Depende de:** U7-04, U7-05, U7-06, U7-07 · **Risco:** achado CRITICAL/HIGH aberto; relatório afirmando sem medir · **Rollback:** reverter o commit
**Files:** Create `docs/fase-7/relatorio-gate.md`; Modify o que os achados exigirem (RED antes de cada correção).
**Aceite:** `everything-claude-code:security-reviewer` (contexto fresco, somente leitura) sem CRITICAL/HIGH abertos, com MEDIUM/LOW dispostos; validação por schema coberta por teste; `verify` verde; nota de mutação e cobertura medidas; contrato semanal **verde se o dono configurou a chave, senão `pendente do dono`**; `apps/engoianador-api` sem entrada no `baseline.json`.

- [ ] **1.1 Revisão.** Despachar o `security-reviewer` repetindo no prompt: branch base `v3/integracao`; caminhos `apps/engoianador-api/{src,scripts,wrangler.toml}`, `.github/workflows/engoianador-*.yml`, `apps/playground/lib/engoianador-client.ts`; ignorar `node_modules`, `dist`, `packages/core`; saída = tabela severidade/arquivo/descrição/correção em português. Checklist: leitura de corpo sem teto, CORS em erro, bypass da cota (IPv6, cabeçalho forjado, `ALLOW_UNLIMITED` em produção), reserva não devolvida, injeção no prompt vazando instruções, log do texto do usuário, segredo em `env` de job, SSRF no smoke (`base_url`), fuga de chave em `/health`, chave de cache colidindo entre modelos.
- [ ] **1.2 Disposição.** CRITICAL/HIGH: RED, correção e nova revisão. MEDIUM/LOW: corrigir, abrir `GS-<n>` ou aceitar com motivo.
- [ ] **1.3 Medir e escrever** `docs/fase-7/relatorio-gate.md`: unidades e commits; cobertura; nota de mutação; tabela de casos da borda (APP-10); resultado do teste de concorrência; achados e disposição; mapa de rastreabilidade ("Engoianador: texto vira goianês com LLM" → contrato agendado + smoke pós-deploy, **estado `pendente do dono` até a chave**); seção "Pendências do dono" (conta Cloudflare, KV, Durable Object, secrets, `wrangler deploy`, `warm-cache`, smoke).
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 7`.

---

## Fase 8 — Docs, spec final e remoção do legado

### U8-01: Spec final em `docs/spec/`
**Spec:** §9.1, §9.5 · **Tier:** medium · **Depende de:** GATES 5, 6, 7 · **Risco:** documento divergir da tabela · **Rollback:** reverter o commit
**Files:** Modify `packages/language/generators/reference.ts` (grava `docs/spec/referencia.md`; sai de `packages/language/generated/reference.md`, depois de conferir os consumidores com `git grep reference.md`), `docs/spec/{gramatica.md,migracao.md}`, `packages/language/tests/generators.test.ts`, `tools/config-tests/tests/docs.test.mjs`; Create `docs/spec/referencia.md` (gerado).
**Aceite:** `generate:check` e o teste de deriva verdes; `gramatica.md` com ids `Gnn` únicos e coerentes com a RFC-0001; `migracao.md` traz uma linha para cada mudança de nome da 3.0.0 (palavras aposentadas de `retiredWords`, `trem` para `let`, `.tamanho()` para `.tamanho`), e o teste acusa palavra aposentada sem linha ali ou em `o-que-mudou.md`; todos os arquivos de `docs/spec/` citados no `CLAUDE.md` existem.

- [ ] **1.1 Teste (RED).** `docs.test.mjs`: 'ids Gnn da gramática são únicos'; 'toda palavra aposentada aparece em migracao.md'; 'docs/spec tem os cinco arquivos esperados'. `generators.test.ts`: 'a referência vai para docs/spec/referencia.md'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project config-tests docs` e `... --project language generators` — esperado: falham.
- [ ] **1.3 Implementar** (regerar com `corepack pnpm --filter @goiasscript/language generate`).
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `docs(docs): fecha a spec final em docs/spec`.

### U8-02: `CONTRIBUTING`, templates e política da v3
**Spec:** §9.4 (porta de entrada da comunidade) · **Tier:** medium · **Depende de:** GATES 5, 6, 7 · **Risco:** comando citado que não existe; e-mail em documento · **Rollback:** reverter o commit
**Files:** Modify `CONTRIBUTING.md` (enxuto, só para humanos; remove o bloco `AUTO-GENERATED:scripts`), `README.md` (política "não faz parte da v3", remove `AUTO-GENERATED:cli-commands` ou o gera do registro de comandos, blocos ` ```goiasscript ` válidos), `SECURITY.md` e `CODE_OF_CONDUCT.md` (trocam o e-mail placeholder pela referência ao reporte privado de vulnerabilidade do GitHub e ao contato público do perfil), `.github/ISSUE_TEMPLATE/{bug_report.md,feature_request.md}` (pnpm e versão atual); Create `.github/ISSUE_TEMPLATE/{config.yml,rfc.md}`.
**Aceite:** `CONTRIBUTING.md` cobre como rodar (comandos que existem), como propor palavra (RFC por `docs/rfc/rfc.md`), expectativa honesta de mantenedor único (sem SLA), "fora da v3" (§7), formato de commit (ADR-0008) e regra de merge (ADR-0011); sem link para material de planejamento, backlog nem Discussions; `config.yml` com `blank_issues_enabled: false`; `git grep -nE '[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}'` nos documentos novos ou alterados vazio; `corepack pnpm agent-docs` e o gate de blocos (U8-04, quando existir) verdes.

- [ ] **1.1 Teste (RED).** `tools/config-tests/tests/docs.test.mjs`: 'CONTRIBUTING não cita Discussions nem planejamento'; 'SECURITY e CODE_OF_CONDUCT não têm e-mail'; 'templates de issue existem e config.yml desliga issue em branco'; 'README declara a política não faz parte da v3'; 'README não tem marcador AUTO-GENERATED sem gerador'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project config-tests docs` — esperado: falha.
- [ ] **1.3 Implementar.** Todo comando citado conferido contra `package.json`; tom goiano nos títulos.
- [ ] **1.4 Rodar:** `corepack pnpm verify` — esperado: verde.
- [ ] **1.5 Commit:** `docs(docs): reescreve contribuição, templates e política da v3`.

### U8-03: `docs/operacao.md`
**Spec:** §9.4 · **Tier:** small · **Depende de:** GATES 5, 6, 7 · **Risco:** runbook com comando inexistente · **Rollback:** reverter o commit
**Files:** Create `docs/operacao.md`; Modify `tools/config-tests/tests/docs.test.mjs`.
**Aceite:** seções: rotacionar a chave da Groq (`wrangler secret put GROQ_API_KEY` e o segredo do GitHub); acionar e desligar o kill switch (`KILL_SWITCH`); republicar a extensão (tag `vscode-v*`, ambientes `marketplace` e `open-vsx`); `npm deprecate` e dist-tags; recriar o trusted publisher expirado (2 dias); reverter o deploy do playground (Vercel, promover o deploy anterior); aquecer o cache (`warm-cache.ts`); rodar contrato e smoke. Cada comando existe (scripts, workflows e flags) e o gate de promessas (U8-04) o confere.

- [ ] **1.1 Teste (RED).** `docs.test.mjs`: 'operacao.md tem as sete seções do runbook'; 'todo script pnpm citado existe no package.json'; 'todo workflow citado existe em .github/workflows'.
- [ ] **1.2 a 1.4:** rodar (falha), escrever em português técnico direto, rodar `corepack pnpm verify`.
- [ ] **1.5 Commit:** `docs(docs): adiciona o runbook de operação do mantenedor`.

### U8-04: Gate de promessas — blocos e comandos
**Spec:** §8.5 itens 2, 3 e 7 · **Tier:** large · **Depende de:** GATES 5, 6, 7 · **Risco:** falso positivo que trava o merge; checar o documento errado · **Rollback:** reverter o commit
**Files:**
- Create: `tools/script-tests/{package.json,vitest.config.ts}`, `tools/script-tests/tests/{docs-blocks,docs-commands}.test.ts`, `scripts/check-docs-blocks.ts`, `scripts/check-docs-commands.ts`, `scripts/docs-gate.types.ts`, `tools/promises/word-allowlist.json`
- Modify: `.github/workflows/promises-gate.yml` (jobs `docs-blocks` e `docs-commands`), `eslint.config.mjs`, `knip.json`, `tools/rules-scan/scope.json` (se o pacote novo exigir), `package.json` raiz (scripts `docs:blocks`, `docs:commands`; `verify` roda os dois)

**Interfaces:** `extractGoiasscriptBlocks(markdown, file): readonly DocBlock[]` com `DocBlock = { file: string; line: number; code: string; expectation: 'runs' | 'compiles-only' | 'expected-error'; expectedCode?: string; stdin?: string }` (info string ` ```goiasscript [entrada=<texto>] [sem-execucao] [erro-esperado GSnnnn] `); `checkDocBlocks(blocks, deps): Promise<readonly DocProblem[]>` (reusa `compile` e o executor da U6-01 por importação do compilador; executa `runs` no alvo `module`); `extractCommandMentions(markdown): { commands: readonly string[]; words: readonly string[] }`; `checkDocCommands(files, registry): readonly DocProblem[]`.
**Aceite:** compila e executa todo bloco goiano de `README.md`, `docs/**` (exceto `docs/superpowers`, `docs/auditoria`, `docs/pesquisa`, `docs/fase-*` e blocos ` ```ebnf `), `content/cartilha/**` e `CLAUDE.md`; bloco com erro esperado só passa com o código exato (a página "o que mudou" gerada hoje só tem tabela; a regra de GS0306 fica coberta por teste com fixture); todo comando `goiasscript <comando>` e `goias` citado existe no registro de comandos do CLI (`packages/cli/src/commands/registry.ts`; nome real da exportação conferido na unidade) e toda palavra citada em código inline de `README.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `CONTRIBUTING.md` e `docs/operacao.md` está na tabela ou em `word-allowlist.json` (uma razão por entrada); `agent-docs` (item 7) segue como job próprio.

- [ ] **1.1 Teste (RED).** `docs-blocks.test.ts`: 'extrai blocos goiasscript com linha e flags'; 'ignora blocos de outras linguagens'; 'bloco que não compila falha com arquivo e linha'; 'bloco com entrada alimenta o stdin'; 'erro-esperado exige o código exato'; 'sem-execucao só compila'. `docs-commands.test.ts`: 'comando inexistente falha'; 'palavra citada fora da tabela e da lista de permissão falha'; 'entrada da lista de permissão sem razão falha'; 'comando com acento e sem acento passa'. Teste de configuração: 'promises-gate roda os dois jobs'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project script-tests docs-` — esperado: falha.
- [ ] **1.3 Implementar.** Mensagens em goianês; saída lista `arquivo:linha`. Se um documento existente falhar de verdade, **corrigir o documento** (não relaxar o gate) no mesmo commit.
- [ ] **1.4 Rodar:** `corepack pnpm docs:blocks`, `corepack pnpm docs:commands` e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `ci(docs): confere os blocos e comandos da documentação`.

### U8-05: Gate de promessas — inglês, zero dependências, rastreabilidade e links
**Spec:** §8.5 itens 4, 5, 6 e 8, §11 · **Tier:** large · **Depende de:** U8-04 · **Risco:** lista de permissão virar buraco; rastreabilidade só de fachada · **Rollback:** reverter o commit
**Files:**
- Create: `scripts/check-english-ui.ts`, `scripts/check-traceability.ts`, `scripts/check-compiler-dependencies.ts`, `scripts/gate.types.ts`, `tools/promises/{forbidden-english.json,english-allowlist.json,traceability.json}`, `lychee.toml`, `tools/script-tests/tests/{english-ui,traceability,compiler-dependencies}.test.ts`
- Modify: `packages/cli/tests/e2e/english-scan.e2e.ts` (passa a importar `forbidden-english.json`), `.github/workflows/promises-gate.yml` (jobs `english-ui`, `traceability`, `links`), `.github/workflows/scheduled.yml` (job `links-externos`), `package.json` raiz (scripts e `verify`)

**Interfaces:** `collectUserFacingStrings(): readonly UiString[]` (catálogo de `DIAGNOSTICS` nos dois tons, `cli-help.txt`, `apps/playground/components/ui-texts.constants.ts`, `app/**/*.constants.ts`, páginas de erro, mensagens do Worker); `checkEnglish(strings, forbidden, allowlist): readonly GateProblem[]`; `TraceabilityEntry = { promise: string; proofs: readonly { kind: 'test' | 'workflow' | 'script'; path: string; name?: string }[]; state: 'green' | 'ready' | 'missing' }`; `checkTraceability(entries, fs): readonly GateProblem[]`.
**Aceite:** nenhuma string visível ao usuário casa a lista de inglês proibido, salvo as permissões (a: trecho entre aspas em GS04xx; b: nomes próprios e de comando; c: painel "JS gerado" e código emitido), cada uma com razão de uma linha; os goldens executáveis falham se stdout ou stderr casar a lista do motor (`Cannot read properties`, `is not a function`, `is not a constructor`, `before initialization`, `Maximum call stack`, `Invalid count value`, `toFixed()`); snapshot do `--help` conferido; `@goiasscript/compiler` com zero dependências de runtime; cada uma das 15 linhas do §11 tem prova cujo arquivo existe e cujo nome de teste aparece no arquivo (estados `green` ou `ready`, nunca `missing`); `lychee` sobre `README.md`, `CONTRIBUTING.md`, `docs/**` e a cartilha: links locais e âncoras bloqueiam (`--offline`), externos só no semanal.

- [ ] **1.1 Teste (RED).** `english-ui.test.ts`: 'acusa mensagem em inglês fora da permissão'; 'aceita o trecho entre aspas em GS04xx'; 'permissão sem razão falha'; 'o catálogo nos dois tons passa'. `compiler-dependencies.test.ts`: 'falha se o compilador declarar dependência de runtime'. `traceability.test.ts`: 'prova com arquivo inexistente é missing'; 'prova com nome de teste ausente do arquivo é missing'; 'cada linha do §11 está na tabela'; 'estado ready exige workflow ou script existente'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project script-tests english-ui traceability compiler-dependencies` — esperado: falham.
- [ ] **1.3 Implementar.** `lychee` via action fixada por SHA, versão exata conferida no dia; `lychee.toml` com `exclude` mínimo e razão.
- [ ] **1.4 Rodar:** os testes, `corepack pnpm verify` e `corepack pnpm exec vitest run --project cli english-scan` — esperado: verdes.
- [ ] **1.5 Commit:** `ci(docs): confere inglês proibido, rastreabilidade e links`.

### U8-06: Remoção do legado
**Spec:** §9.4 (último item) · **Tier:** large · **Depende de:** U8-04, U8-05 · **Risco:** apagar o que o novo ainda usa; `.gitignore` corrigido "designorar" lixo; lockfile órfão · **Rollback:** reverter o commit (a tag `legacy/1.5` guarda o estado anterior)
**Files:**
- Delete: `packages/core/`, `vscode-extension/`, `lsp-server/` (se existir), todo `*.vsix` rastreado, `KEEP-OR-ARCHIVE.md`, `.github/workflows/legacy-ci.yml`, `docs/METODOS_GOIANOS.md` (se o conteúdo útil já estiver em `docs/spec/` e na cartilha) e demais docs que só descrevem o legado
- Modify: `package.json` raiz (remove `legacy:*` e overrides só do legado), `apps/playground/next.config.ts` (`transpilePackages` sem `goiasscript-legacy`), `apps/playground/tests/package-layout.test.ts`, `packages/cli/tests/package-layout.test.ts`, `.dependency-cruiser.cjs`, `eslint.config.mjs`, `knip.json` (`ignoreWorkspaces` esvazia), `tools/rules-scan/scope.json` (`excluded` esvazia) e `tools/rules-scan/tests/files.test.mjs`, `.github/codeql/codeql-config.yml`, `osv-scanner.toml`, `tools/config-tests/tests/workflows.test.mjs`, `.gitignore`, `pnpm-lock.yaml` (regenerado), `apps/playground/README.md`, `README.md` e `CONTRIBUTING.md` se ainda citarem o legado
**Aceite:** `git grep -n goiasscript-legacy -- . ':!docs/fase-*' ':!docs/superpowers' ':!docs/auditoria' ':!docs/pesquisa'` vazio, o mesmo para `packages/core`, `vscode-extension` e `lsp-server`; `scope.json` com `excluded: []`; `verify` verde **sem exceção por caminho**; `.gitignore` sem `./docs`, `lib/` e `out/` e `git status` limpo depois da correção (nenhum arquivo útil passa a aparecer como novo, nenhum rastreado fica ignorado: teste com `git check-ignore` sobre `git ls-files`); `pnpm install --frozen-lockfile` passa com o lockfile novo. **Pendente do dono (registrado, não bloqueia):** `git push` da tag `legacy/1.5` (já existe local) antes do push da fase, e a tag de arquivo do protótipo Rust (o relatório traz o comando e o commit candidato).

- [ ] **1.1 Teste (RED).** `scope.json`/`files.test.mjs`: 'nenhum caminho excluído'; `tools/config-tests/tests/hygiene.test.mjs`: 'gitignore não ignora arquivo rastreado'; 'gitignore não tem padrão inválido'; 'sem referência ao legado fora dos registros históricos'; 'a tag legacy/1.5 existe no repositório local'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project config-tests hygiene` e `... files` — esperado: falham.
- [ ] **1.3 Implementar.** Remover primeiro as referências, depois os diretórios; regenerar o lockfile com `corepack pnpm install` e conferir que nenhum pacote do app ficou órfão. Conferir `git ls-remote --tags origin legacy/1.5` só para o relatório (leitura); não enviar nada.
- [ ] **1.4 Rodar:** `corepack pnpm verify`, `corepack pnpm install --frozen-lockfile` e o E2E do playground em Chromium — esperado: verdes.
- [ ] **1.5 Commit:** `chore(deps): remove o código legado e suas dependências`.

### U8-07: `CLAUDE.md` final
**Spec:** §9.4 · **Tier:** small · **Depende de:** U8-06 · **Risco:** afirmação falsa · **Rollback:** reverter o commit
**Files:** Modify `CLAUDE.md` (abaixo de 200 linhas), `.github/copilot-instructions.md` (ponteiro de 3 linhas).
**Aceite:** descreve o estado final (pacotes, `apps/playground`, `apps/engoianador-api`, `packages/vscode`, `tools/script-tests`, comandos que existem, ponteiros para ADRs, fora da v3, precedência de regras); sem "legado removível" nem "reconstrução"; `corepack pnpm agent-docs` e `docs:commands` verdes.
- [ ] **1.1 Teste (RED):** `agent-docs.test.mjs`: 'CLAUDE.md não cita legado' e 'CLAUDE.md cita os pacotes do workspace'; **1.2** rodar (falha); **1.3** reescrever; **1.4** `corepack pnpm verify`.
- [ ] **1.5 Commit:** `docs(docs): atualiza o claude.md para o estado final`.

### U8-08: Gate 8
**Spec:** §10.1 (Fase 8) · **Tier:** medium · **Depende de:** U8-01 a U8-07 · **Risco:** relatório sem medida · **Rollback:** reverter o commit
**Files:** Create `docs/fase-8/relatorio-gate.md`.
**Aceite:** gate de promessas completo (blocos, comandos, inglês, zero dependências, rastreabilidade, links locais; externos rodados uma vez e anotados) com resultado de cada item; `verify` sem exceção por caminho; documentos novos sem e-mail, caminho absoluto, empregador ou dado pessoal (comando de varredura citado); seção "Pendências do dono" (contato público por configuração, reporte privado de vulnerabilidade, configurações do GitHub, envio de `legacy/1.5`, tag do protótipo Rust).
- [ ] **1.1 a 1.4:** executar o gate (`corepack pnpm verify`, `docs:blocks`, `docs:commands`, os checks da U8-05, `lychee` externo uma vez), colar os números, escrever o relatório.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório do gate da fase 8`.

---

## Fase 9 — Relançamento + vídeo

### U9-01: Changesets e job `compat`
**Spec:** §8.6, §9.5 · **Tier:** medium · **Depende de:** GATE 8 · **Risco:** bump subestimado passar; comparar com tag errada · **Rollback:** reverter o commit
**Files:** Create `.changeset/config.json`, `.changeset/README.md`, `scripts/compat-check.ts`, `scripts/compat-check.types.ts`, `tools/script-tests/tests/compat-check.test.ts`, `.github/workflows/compat.yml`, `tools/config-tests/tests/changesets-config.test.mjs`; Modify `package.json` raiz (`@changesets/cli` exato, script `changeset`).
**Interfaces:** `VocabularyLock = { reserved: readonly { name: string; source: string; since: string; deprecatedIn?: string }[]; diagnostics: readonly { code: string; severity: 'error' | 'warning' }[] }` (formato de `docs/spec/vocabulario.lock.json`); `requiredBump(previous, next): { bump: 'none' | 'patch' | 'minor' | 'major'; reasons: readonly string[] }` (nome reservado novo, remoção ou renomeação, `warning` promovido a `error` ou `error` novo = `major`; `warning` novo = `minor`; código reutilizado com outra severidade = `major`); `pendingBump(changesets): BumpKind`; `replayOkCases(previousTag, compileFn, git): Promise<readonly { id: string; nowFails: boolean }[]>` (casos de `packages/compiler/tests/conformance/*` da tag anterior com `diagnostics.json` sem `error`, compilados com o código do PR).
**Aceite:** PR que remove palavra reservada sem changeset `major` é barrado (teste); `warning` novo exige `minor`; sem tag estável `v3.x.y` anterior o script passa **com aviso explícito** (primeira comparação real na 3.0.1); caso `ok: true` da tag anterior que vira erro sem `major` falha; `.changeset/config.json` com `fixed: [["goiasscript","goiasscript-vscode"]]`, pacotes privados em `ignore` e `commit: false`.

- [ ] **1.1 Teste (RED).** `compat-check.test.ts`: 'remover palavra exige major'; 'palavra reservada nova exige major'; 'warning novo exige minor'; 'warning promovido a error exige major'; 'changeset minor com mudança que exige major falha'; 'sem tag anterior passa com aviso'; 'caso ok que vira erro falha sem major'. `changesets-config.test.mjs`: 'grupo fixo cli e vscode'; 'pacotes privados ignorados'; 'compat.yml roda em pull_request com fetch-depth 0'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project script-tests compat-check` e `... --project config-tests changesets-config` — esperado: falham.
- [ ] **1.3 Implementar.** `git` por `execFile` com lista de argumentos; tag anterior = maior `v3.*` estável por SemVer, diferente da atual.
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `chore(release): adiciona changesets e o job compat`.

### U9-02: Release estável
**Spec:** §8.6 · **Tier:** medium · **Depende de:** U9-01 · **Risco:** estável sair sem Changesets aplicado; segredo em workflow · **Rollback:** reverter o commit
**Files:** Modify `.github/workflows/release.yml` (gatilho `v3.*` além de `v3.*-alpha.*`), `scripts/release-target.ts`, `scripts/release-target.types.ts`, `packages/cli/tests/release-target.test.ts`, `tools/config-tests/tests/release-workflow.test.mjs`, `CHANGELOG.md` (entrada 3.0.0 em português com "Removido" e "Alterado").
**Interfaces:** `resolveReleaseTarget(tag, packageVersion, options: { changesetsPending: boolean }): ReleaseTarget` com `distTag: 'next' | 'latest'`.
**Aceite:** `v3.0.0` publica em `latest` só se a versão do `package.json` do CLI for `3.0.0` e não houver changeset pendente; alpha continua em `next`; tag sem prefixo `v`, com sufixo estranho ou diferente do manifesto é recusada; o workflow não contém token, mantém `id-token: write` apenas no job de publicação, usa o mesmo tarball testado (sha256 conferido) e `npm stage` com aprovação humana; CHANGELOG lista as palavras aposentadas e `trem` → `let`, `.tamanho()` → `.tamanho`. **Nada é publicado.**

- [ ] **1.1 Teste (RED).** `release-target.test.ts`: 'v3.0.0 vira latest'; 'v3.0.0 com changeset pendente é recusada'; 'alpha segue em next'; 'v3.0.0 com manifesto 3.0.1 é recusada'; 'v3.0 é recusada'. `release-workflow.test.mjs`: 'gatilho aceita estável'; 'sem token no arquivo'; 'id-token só no job de publicação'; 'stage com aprovação'; 'mesmo tarball no publish'. Teste do CHANGELOG: 'entrada 3.0.0 tem Removido e Alterado'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project cli release-target` e `... --project config-tests release-workflow` — esperado: falham.
- [ ] **1.3 Implementar** e escrever o CHANGELOG a partir de `retiredWords` (lido do gerador, não digitado).
- [ ] **1.4 Rodar:** os testes e `corepack pnpm verify` — esperado: verdes.
- [ ] **1.5 Commit:** `ci(release): publica versão estável pela tag v3`.

### U9-03: Smoke pós-publicação
**Spec:** §11 (`npm install -g goiasscript`), §8.3 · **Tier:** small · **Depende de:** U9-02 · **Risco:** smoke que passa sem instalar de verdade · **Rollback:** reverter o commit
**Files:** Create `.github/workflows/smoke-release.yml`, `scripts/smoke-release.ts`, `scripts/smoke-release.types.ts`, `tools/script-tests/tests/smoke-release.test.ts`, `tools/config-tests/tests/smoke-release-workflow.test.mjs`.
**Interfaces:** `runReleaseSmoke(options: { dist: 'latest' | 'next'; exec: ExecPort; tmpDir: string }): Promise<SmokeResult>` — `npm install -g goiasscript@<dist>` num prefixo temporário, `goiasscript --version` igual à versão do registro, `LICENSE` presente no pacote, `goiasscript dedo_de_prosa` com exit 0; o workflow chama também `playground-smoke.yml` e `smoke-extension.yml` por `workflow_dispatch` com as entradas.
**Aceite:** `workflow_dispatch` apenas, sem segredo, `permissions: contents: read`; falha nomeada para cada passo; o teste usa `exec` simulado (sem rede).
- [ ] **1.1 Teste (RED):** 'versão instalada diferente da do registro falha'; 'sem LICENSE falha'; 'dedo_de_prosa com exit diferente de zero falha'; 'instala em prefixo temporário'; workflow: 'só workflow_dispatch', 'sem secrets'.
- [ ] **1.2 a 1.4:** rodar (falha), implementar, `corepack pnpm verify`.
- [ ] **1.5 Commit:** `ci(release): adiciona o smoke pós-publicação`.

### U9-04: Checklist dos achados da auditoria (S3)
**Spec:** §2.3 S3, §8.2 · **Tier:** large · **Depende de:** GATE 8 · **Risco:** achado "fechado" sem prova; parser acoplado a um formato de relatório · **Rollback:** reverter o commit
**Files:** Create `scripts/audit-checklist.ts`, `scripts/audit-checklist.types.ts`, `scripts/audit-closure.json`, `tools/script-tests/tests/audit-checklist.test.ts`; Modify `package.json` raiz (script `audit:checklist`).
**Interfaces:** `parseFindings(markdown, reportName): readonly Finding[]` (`Finding = { id: string; severity: 'CRITICAL' | 'HIGH'; title: string; report: string }`, tolerante aos dois formatos de título dos relatórios A a E); `Closure = { id: string; kind: 'test' | 'intentional' | 'adr'; ref: string; testName?: string }`; `buildChecklist(findings, closures, fs): ChecklistRow[]` com estado `closed | open`.
**Aceite:** todo CRITICAL/HIGH dos relatórios A a E aparece no checklist com seu fechamento verificável (arquivo existe e, se houver `testName`, o título está no arquivo; `intentional` aponta golden de conformidade existente; `adr` aponta ADR existente); os dois CRITICAL (`B F01` e `E F01`) ligados a `packages/cli/tests/e2e/name-matrix.e2e.ts` e a `packages/vscode/tests/integration/hostile-names.test.ts`; `expected-fail` zero no corpus (reusa `list-expected-fail.ts`); a saída em Markdown vai ao PR de release; achado sem fechamento **falha o script** e aparece como `open` (isso é pendência técnica, bloqueia S3, e o dono decide no gate).

- [ ] **1.1 Teste (RED).** 'lê achados no formato de título com colchetes'; 'lê achados do relatório A (outro formato)'; 'achado sem fechamento é open e falha'; 'fechamento com arquivo inexistente falha'; 'fechamento com nome de teste ausente falha'; 'os dois CRITICAL apontam para os testes da §8.2'; 'expected-fail no corpus falha'.
- [ ] **1.2 Rodar:** `corepack pnpm exec vitest run --project script-tests audit-checklist` — esperado: falha.
- [ ] **1.3 Implementar.** Montar `audit-closure.json` lendo cada relatório e cruzando com o corpus (`packages/compiler/tests/conformance/audit-*`), `packages/compiler/tests/audit-moved.json` e os ADRs; não adivinhar: item sem prova fica `open`.
- [ ] **1.4 Rodar:** `corepack pnpm audit:checklist` e `corepack pnpm verify` — esperado: checklist sem `open`, ou `open` listado para o gate.
- [ ] **1.5 Commit:** `test(docs): gera o checklist dos achados da auditoria`.

### U9-05: Rastreabilidade 100% e README alinhado
**Spec:** §11, §10.1 (Fase 9) · **Tier:** medium · **Depende de:** U9-03, U9-04 · **Risco:** README prometer o que não foi provado · **Rollback:** reverter o commit
**Files:** Modify `tools/promises/traceability.json`, `README.md`, `scripts/check-traceability.ts` (modo `--report`), `tools/script-tests/tests/traceability.test.ts`; (descrição do repositório é ato do dono: o texto proposto vai no relatório).
**Aceite:** `check-traceability` verde: zero `missing`; provas que dependem de publicação ou de conta (`npm install -g` do `latest`, smoke da extensão, contrato e smoke do Engoianador, smoke do playground) em estado `ready` com o workflow e o comando do dono; o README só afirma o que tem prova (retirar ou suavizar o que não tiver); cada afirmação de número ("N testes") aponta para a fonte; a saída `--report` lista `green`, `ready` e o que falta do dono.
- [ ] **1.1 Teste (RED):** 'toda promessa do README está na tabela'; 'estado ready lista o comando do dono'; 'promessa sem prova falha'; **1.2** rodar (falha); **1.3** alinhar; **1.4** `corepack pnpm verify` e `check-traceability --report`.
- [ ] **1.5 Commit:** `docs(docs): fecha a rastreabilidade e alinha o readme`.

### U9-06: Dados reais para o vídeo
**Spec:** §10.4 · **Tier:** medium · **Depende de:** U9-05 · **Risco:** dado inventado; vazar segredo no JSON · **Rollback:** reverter o commit
**Files:** Create `scripts/video-facts.ts`, `scripts/video-facts.types.ts`, `tools/script-tests/tests/video-facts.test.ts`; Modify `package.json` raiz (script `video:facts`).
**Interfaces:** `collectVideoFacts(deps: { readVersion; countTests; runCli; fetchEngoianador; now }): Promise<VideoFacts>` com `VideoFacts = { generatedAt: string; version: string; tests: { count: number; source: 'ci' | 'local' }; cli: readonly { command: string; stdout: string; stderr: string; exitCode: number }[]; trocaTremParaLet: { before: string; after: string }; engoianador: { status: 'ok'; request: string; response: string } | { status: 'pending-owner' } }`; saída gravada no caminho passado por `--out` (fora do repositório; recusa caminho dentro de `<repo>`).
**Aceite:** versão lida do `package.json` do CLI; contagem de testes lida do relatório JSON do Vitest (`--tests-from <arquivo>` para o artefato da CI; sem ele roda local e marca `source: 'local'`); saídas do CLI (stdout **e** stderr) vêm da execução real do CLI empacotado sobre o `demo`; `trem` → `let` vem do `traduz` real; resposta do Engoianador só com `ENGOIANADOR_URL`, senão `{ status: 'pending-owner' }`; nenhum dado digitado à mão; teste com dependências simuladas.
- [ ] **1.1 Teste (RED):** 'lê a versão do package.json'; 'conta testes do relatório JSON'; 'guarda stdout e stderr separados'; 'sem URL do Engoianador marca pending-owner'; 'recusa --out dentro do repositório'; 'o JSON não contém segredo'.
- [ ] **1.2 a 1.4:** rodar (falha), implementar, `corepack pnpm verify` e uma execução real com `--out` fora do repositório.
- [ ] **1.5 Commit:** `feat(release): gera os dados reais para o vídeo`.

### U9-07: Gate 9 e relatório final
**Spec:** §10.1 (Fase 9), §2.3 (S1 a S8), §12 · **Tier:** medium · **Depende de:** U9-05, U9-06 · **Risco:** relatório otimista · **Rollback:** reverter o commit
**Files:** Create `docs/fase-9/relatorio-gate.md`.
**Aceite:** rastreabilidade §11 (`green`, `ready` e o que depende do dono); S1 a S8 cada um com a prova ou a pendência; checklist da auditoria (U9-04) anexado; zero CRITICAL/HIGH técnico aberto; riscos da §12 reavaliados; retrospectiva de prazo (dias reais por fase contra a hipótese de 71); **seção "Pendências do dono" consolidada de todas as fases** com ordem recomendada de execução.
- [ ] **1.1 a 1.4:** rodar `corepack pnpm verify`, `audit:checklist`, `check-traceability --report`, `video:facts` (fora do repositório); colar os números.
- [ ] **1.5 Commit:** `docs(docs): registra o relatório final do lançamento`.

---

## Tarefas do dono (nenhuma é unidade executável por agente)

Nenhuma bloqueia a execução automática; cada item vira linha em "Pendências do dono" do gate da fase. A ordem dentro da fase é a recomendada.

**Fase 6 (cartilha)**
1. Recrutar 3 a 5 aprendizes (inclusive de fora de Goiás), aplicar o roteiro de `docs/piloto/` e salvar as respostas anonimizadas em `docs/piloto/respostas/A1.json`, `A2.json`…; depois rodar a U6-06 de novo.
2. No projeto da Vercel (tarefa 6 do plano 3), conferir a opção que inclui arquivos fora do diretório raiz (`docs/spec/o-que-mudou.md`); se estiver desligada, avisar para ligar o `prebuild` com cópia.
3. Quando houver domínio, preencher o endereço da cartilha em `goiasscript.lessonBaseUrl` (padrão da extensão ou orientação no README) para o link de lição aparecer no hover.

**Fase 7 (Engoianador)**
4. Criar a conta Cloudflare com plano que inclua Durable Objects; criar os dois KV (`wrangler kv namespace create`), colar os ids no `wrangler.toml`, registrar `GROQ_API_KEY` (`wrangler secret put`), conferir o binding de Workers AI e rodar `corepack pnpm engoianador:deploy` (o `predeploy` confere configuração e modelo).
5. Criar a chave da Groq; registrar no GitHub o segredo `GROQ_API_KEY` e a variável `ENGOIANADOR_URL` para o contrato semanal; disparar `engoianador-contract.yml` e `engoianador-smoke.yml` e anexar o resultado ao relatório.
6. Rodar `warm-cache.ts` contra a API implantada para as 5 frases prontas; preencher `NEXT_PUBLIC_ENGOIANADOR_URL` na Vercel.

**Fase 8 (docs e legado)**
7. Ligar o reporte privado de vulnerabilidade e definir o contato público do projeto na configuração/perfil do GitHub (o texto dos documentos só aponta para eles); aplicar as configurações (`delete_branch_on_merge`, merge commit desligado) se ainda não estiverem.
8. Enviar a tag `legacy/1.5` ao remoto **antes** do push da fase 8 e criar a tag de arquivo do protótipo Rust (comando e commit no relatório do gate 8).

**Fase 9 (relançamento)**
9. Criar a tag `v3.0.0`, aprovar o stage com 2FA (`npm stage approve`), confirmar o trusted publisher imediatamente antes (a configuração expira em 2 dias sem publish validado).
10. Rodar `npm deprecate goiasscript@2.0.0` com a mensagem apontando para a página "o que mudou".
11. Publicar a extensão estável (`vscode-v3.0.0`, ambientes `marketplace` e `open-vsx`) e criar o GitHub Release.
12. Disparar `smoke-release.yml`, anexar o resultado e atualizar a descrição do repositório com o texto proposto no relatório da U9-05.
13. Gerar `video-facts.json` com `ENGOIANADOR_URL` configurado e renderizar de novo o vídeo no kit externo.
