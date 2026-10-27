# Relatório do gate da Fase 9 e relatório final

**Veredito:** sem CRITICAL/HIGH técnico aberto, mas o critério do GATE 9 (rastreabilidade 100% verde) **não está
atendido**: 5 das 19 promessas seguem `ready` e só fecham depois dos smokes pós-publicação, que dependem do dono. O
`verify` sai 0, a rastreabilidade tem 0 prova ausente (14 `green`, 5 `ready`), o checklist da auditoria tem 46 achados
CRITICAL/HIGH fechados (anexo em `docs/fase-9/checklist-auditoria.md`) e nenhum CRITICAL/HIGH ficou aberto nas revisões
de segurança das fases 3, 4, 5 e 7. Ressalvas técnicas que continuam abertas:

1. A mutação do compilador (92,91) é a medida da Fase 2, sem nova medição nesta fase.
2. Os manifestos seguem em `3.0.0-alpha.0` e não há changeset pendente; o release estável depende do versionamento.

Também estão abertos o teto de 29 KB brotli do ADR-0001 (excedido na Fase 4) e todos os atos do dono. O GATE 9 só
fecha depois de publicar, implantar e rodar os smokes (seção 8). Nada foi enviado ao remoto, publicado, implantado nem
etiquetado por este trabalho. O S7 (tudo no ar) e o S8 (piloto) **não** estão cumpridos: dependem do dono.

Medição: Node v26, Linux. Os números vêm de `corepack pnpm verify` e dos comandos da seção 2, rodados depois do último
commit de código da fase.

## 1. Unidades da Fase 9

| Unidade | Commits principais |
| --- | --- |
| U9-01 Changesets e job `compat` | 2b29160, 2a2cced |
| U9-02 release estável | 91d3511, 29ae103 |
| U9-03 smoke pós-publicação | 03245c3, b827b89 |
| U9-04 checklist dos achados da auditoria | 16ae28e, c5883db |
| U9-05 rastreabilidade e README | 41f1250, d54c44e, 2fb1a8d |
| U9-06 dados reais para o vídeo | 7d6d398, facc8bd |

Ordem na branch: a U9-01 entrou antes do GATE 8 (registrado no relatório da Fase 8). O job `compat` roda em pull
request para `main`, fora do `verify`, e na 3.0.0 passa com aviso porque não existe tag estável `v3.x.y` anterior; a
primeira comparação real acontece na 3.0.1.

## 2. Comandos rodados e resultado

| Comando | Resultado |
| --- | --- |
| `corepack pnpm verify` | saiu 0 |
| `corepack pnpm audit:checklist` | 46 achados, 46 `closed`, 0 `open` |
| `node scripts/check-traceability.ts --report` | 19 promessas: 14 `green`, 5 `ready`, 0 `missing` |
| `corepack pnpm video:facts -- --out <fora do repositório>` | gravado de execução real, 3 comandos do CLI com saída 0 |

Dentro do `verify`: `tsc` dos quatro projetos, ESLint com zero avisos, scanner de regras, `generate:check`, índice de
lições, Vitest com cobertura, projeto `compiler`, dependency-cruiser, knip, e os checks de documentos.

| Medida | Valor |
| --- | --- |
| Arquivos de teste | 249 passaram, 1 ignorado (250) |
| Testes | 2.972 passaram, 7 ignorados (2.979) |
| Projeto `compiler` | 66 arquivos, 967 testes passaram |
| Cobertura de instruções | 97,05% (6202/6390) |
| Cobertura de ramos | 93,09% (3534/3796) |
| Cobertura de funções | 96,8% (1514/1564) |
| Cobertura de linhas | 97,68% (5145/5267) |
| dependency-cruiser | 786 módulos, 1.949 dependências, nenhuma violação |
| Blocos da documentação | 40 conferidos |
| Comandos e palavras citados | 30 documentos conferidos |
| Inglês proibido na interface | 955 textos, nenhum em inglês |
| Compilador sem dependência de runtime | 125 arquivos conferidos |

Cobertura por pacote (relatório `lcov` do Vitest, mesma execução; o `verify` barra qualquer pacote abaixo de 80% em
linhas, funções, ramos e instruções por `thresholds` no `vitest.config.ts`). Para `apps/playground` e
`apps/engoianador-api` entram só os arquivos de lógica listados em `include`.

| Pacote | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| `packages/language` | 100,00% | 98,00% | 100,00% |
| `packages/compiler` | 99,74% | 95,74% | 99,83% |
| `packages/optimizer` | 100,00% | 80,00% | 100,00% |
| `packages/cli` | 98,00% | 89,38% | 97,57% |
| `packages/vscode` | 98,18% | 93,88% | 97,25% |
| `apps/playground` | 92,39% | 89,68% | 89,66% |
| `apps/engoianador-api` | 98,11% | 90,94% | 99,15% |


## 3. Rastreabilidade (§11)

| Estado | Promessas |
| --- | --- |
| `green` (14) | escrever em goianês e virar JavaScript; autocomplete; tela dividida; `arma_o_barraco`; `bota_pra_moer`; Roda de Prosa; front-end à mão; licença MIT; o CLI nunca apaga o `.gs`; extensão sem comando a partir de nome de arquivo; `traduz`; `vê_se_tá_certo`; `explica`; `dedo_de_prosa` |
| `ready` (5), depende do dono | playground no navegador; extensão (realce, ícones, snippets); Engoianador; "N testes"; `npm install -g goiasscript` e versão |
| `missing` (0) | nenhuma |

| Promessa em `ready` | Prova pronta | Ação do dono |
| --- | --- | --- |
| Playground no navegador | `playground-smoke.yml` | `gh workflow run playground-smoke.yml` depois do deploy na Vercel |
| Extensão | `smoke-extension.yml` | publicar `vscode-v3.0.0` e rodar `gh workflow run smoke-extension.yml` |
| Engoianador | `engoianador-contract.yml`, `engoianador-smoke.yml`, `contract-check.ts` | `corepack pnpm engoianador:deploy`; depois os dois workflows |
| "N testes" | `ci.yml` | `gh workflow run ci.yml`; o número vem do relatório JSON do Vitest anexado |
| `npm install -g goiasscript` | `release.yml`, `release-target.ts`, `smoke-release.yml` | tag `v3.0.0`, `npm stage approve` com 2FA, `smoke-release.yml` |

O README só afirma o que está provado; a descrição proposta para o campo "About" do repositório está em
`docs/fase-9/descricao-do-repositorio.md` e não cita playground nem extensão antes do smoke.

## 4. Critérios de sucesso S1 a S8

| # | Estado | Prova ou pendência |
| --- | --- | --- |
| S1 | parcial: 14 de 19 `green` | gate de promessas (`docs:blocks`, `docs:commands`, inglês, rastreabilidade): verde no `verify`, com 0 prova ausente; as 5 promessas `ready` da seção 3 só viram `green` depois da publicação e dos smokes, então o critério de 100% verde não está atendido |
| S2 | cumprido | 227 casos em `tests/conformance`: 168 `audit` mais 5 movidos para outro teste (`audit-moved.json`) = 173; 0 `expected-fail` |
| S3 | cumprido | 46 achados CRITICAL/HIGH fechados com prova verificável (seção 5); os dois CRITICAL ligados a `name-matrix.e2e.ts` e `hostile-names.test.ts`; palavras aposentadas fecham por golden de GS0306 |
| S4 | cumprido | orçamento `programa só nativo tem 0 bytes de runtime no alvo module` em `budgets.test.ts`, verde |
| S5 | cumprido | gates bloqueantes verdes (ESLint, scanner, dependency-cruiser) e baseline do scanner vazio (as chaves de cor de `apps/playground/tailwind.config.ts` agora são em inglês). A exceção de mutação confinada a `this.*` (ADR-0004) está registrada |
| S6 | cumprido | cobertura acima de 80% em cada pacote (tabela da seção 2, imposta pelo `verify`); mutação do compilador 92,91 com `thresholds.break` = 90, medida na Fase 2 e sem nova medição; o Worker e o CLI têm só relatório de mutação |
| S7 | pendente do dono | CLI no npm, playground no ar, extensão no Marketplace e Open VSX e Engoianador no ar exigem contas e segredos do dono; os quatro smokes estão prontos |
| S8 | pendente do dono | `docs/piloto/relatorio-piloto.md` registra `0/3`; kit, formulário e `summarize-pilot` prontos |

## 5. Checklist da auditoria (anexo)

46 achados (A 12, B 9, C 8, D 7, E 10), 46 `closed`, 0 `open`. A tabela completa gerada por
`corepack pnpm audit:checklist`, com o fechamento de cada achado, está anexada em
[`checklist-auditoria.md`](./checklist-auditoria.md). Os dois CRITICAL são:

| Achado | Gravidade | Fechamento |
| --- | --- | --- |
| B F01 | CRITICAL | `packages/cli/tests/e2e/name-matrix.e2e.ts`, `output-plan.test.ts`, `run-lifecycle.test.ts` |
| E F01 | CRITICAL | `packages/vscode/tests/integration/hostile-names.test.ts`, `commands-feature.test.ts`, `program-terminal.test.ts` |

## 6. Revisões de segurança e CRITICAL/HIGH

| Fase | Revisão independente | CRITICAL/HIGH abertos |
| --- | --- | --- |
| 3 CLI | feita (contexto fresco, somente leitura) | 0 |
| 4 Playground | feita | 0 |
| 5 Extensão | feita | 0 |
| 7 Worker | feita | 0 |
| 8 e 9 Docs e relançamento | feita | 0 |

Na revisão das Fases 8 e 9 foram corrigidos: a publicação exige a tag na ponta da `main`
(antes aceitava qualquer ancestral) e o changeset com BOM ou espaço antes do frontmatter conta como
pendente. A aprovação humana do `npm-release` depende de configuração do GitHub e entrou no runbook
(`docs/operacao.md`) e no item 9 da seção 8. Aceitos com motivo: o `npm` pinado instalado no job com OIDC
(versão fixa), o sha256 do tarball no mesmo artifact (detecta corrupção, não adulteração; a prova é o
provenance), a rede liberada no sandbox dos blocos (Node 22 e 24 não negam rede; o job não tem segredo
nem escrita) e o ambiente herdado pelo `video:facts` (ferramenta manual do dono, com saída redigida).

Dois avisos HIGH em dependências só de desenvolvimento foram registrados no `osv-scanner.toml`, com prazo até
2027-01-27: `zod` 3.22.3, puxado pelo miniflare do `wrangler` 3, que só valida a configuração do projeto, e
`@azure/msal-node` 6.0.1, puxado pelo `vsce`, cuja publicação não usa o fluxo afetado. A correção pede o `wrangler` 4
e um `@azure/identity` que aceite o `msal-node` 7.

Zero CRITICAL/HIGH técnico aberto. Itens MEDIUM/LOW aceitos ou mitigados estão nos relatórios de cada fase (por
exemplo, o diagnóstico em tempo real da extensão compila no processo de extensões, com teto de 100.000 caracteres).

## 7. Riscos da §12 reavaliados

| Risco | Situação agora |
| --- | --- |
| Parser resiliente custar mais | encerrado: o núcleo fechou na Fase 2, com compilação de 10 mil linhas entre 105 e 133 ms (teto 150 ms) |
| Vocabulário mudar depois de haver programa de aluno | controlado: `compat` barra remoção sem `major`; primeira comparação real só na 3.0.1 |
| Reserva de nomes de membro custar nomes comuns | encerrado pela RFC-0001 e pela reserva por forma; coberto por corpus |
| Gíria regional virar barreira | aberto: depende do piloto com aprendizes de fora de Goiás (S8, `0/3`) |
| Sandbox do playground contornável | mitigado por CSP e E2E de fuga; Firefox e WebKit só rodam na CI |
| Engoianador: custo, abuso, modelo desligado | mitigado em código (cota atômica, cache, teto, kill switch, fallback); sem validação em produção até o dono implantar |
| Prazos externos (PAT do Marketplace em 2026-12-01; Node 26 LTS em 2026-10-28) | aberto: o método sem PAT está pronto, o dono precisa criar o publisher antes de 2026-12-01; matriz do CI revisar com o Node 26 |
| Confusão com `goiasscript@2.0.0` | pronto: página "o que mudou", GS0306 e CHANGELOG; falta `npm deprecate` (dono) |
| Mantenedor único e dormência | mitigado: spec, corpus, runbook `docs/operacao.md`, automação de release e do vídeo |
| Material pessoal no histórico anterior à v3 | tratado na Fase 1; varredura da Fase 8 vazia |
| Escopo voltando | política "fora da v3" no README e no CONTRIBUTING |
| Regras de imutabilidade em tensão com lexer, parser e analisador | override do ADR-0004 testado; aprovação do dono segue listada |
| Versões de ferramentas mudando | ADR-0005; Node 26 no ambiente local, 22 e 24 na CI |

Risco novo: a versão dos manifestos ainda é `3.0.0-alpha.0` e não há changeset pendente; o `video:facts` gravou essa
versão. O release estável exige o commit de versionamento do Changesets (item 9 da seção 8), e depois disso o
`video:facts` deve rodar de novo.

## 8. Pendências do dono, consolidadas, em ordem recomendada

Estado de todas: `pendente do dono`, salvo quando marcado.

| Ordem | Item | Fase | O que está pronto | Ação do dono | Evidência esperada |
| --- | --- | --- | --- | --- | --- |
| 1 | Abrir a branch e ler a CI (somente CI, sem ação além de ler) | 3 a 8 | workflows `ci.yml`, `vscode.yml`, `playground-e2e.yml`, `promises-gate.yml` | enviar a branch, abrir o PR de cada fase e ler a execução (pendente de CI) | Ubuntu, Windows e macOS (Node 22 e 24) verdes; Chromium, Firefox e WebKit verdes; `lychee` verde |
| 2 | Contato público e reporte privado | 8 | `SECURITY.md` e `CODE_OF_CONDUCT.md` sem e-mail | preencher o perfil e ligar o reporte privado de vulnerabilidade | opção ativa no repositório |
| 3 | Configurações do GitHub | 8 | rulesets versionados em `.github/rulesets` | aplicar rulesets (inclui `vscode-v*`), marcar os jobs do gate de promessas como obrigatórios, desligar Discussions | regra de proteção listando os jobs |
| 4 | Tag de arquivo do protótipo Rust | 8 | commit candidato 371477b | `git tag archive/rust-prototype 371477b && git push origin archive/rust-prototype` | tag no remoto |
| 5 | Vercel e domínio | 4, 6 | `vercel.json`, cabeçalhos, build testado | criar o projeto, ligar `apps/playground`, conferir inclusão de arquivos fora da raiz (`docs/spec/o-que-mudou.md`), definir domínio e `goiasscript.lessonBaseUrl` | URL servindo `/cartilha` e `/cartilha/o-que-mudou` |
| 6 | Doação | 4 | guarda de configuração | fornecer a chave Pix real e Sponsors, ou deixar as variáveis vazias | seção visível ou ausente de propósito |
| 7 | Cloudflare e Engoianador | 7 | `wrangler.toml`, Durable Object, `predeploy` | conta, `wrangler login`, KV, `GROQ_API_KEY`, `engoianador:deploy`, aquecer o cache, `ALLOWED_ORIGINS` de produção | `/health` com todos os bindings `true` |
| 8 | Groq e variáveis no GitHub | 7 | `engoianador-contract.yml`, `engoianador-smoke.yml` | segredo `GROQ_API_KEY`, variável `ENGOIANADOR_URL`, disparar os dois workflows; preencher `NEXT_PUBLIC_ENGOIANADOR_URL` na Vercel | execuções verdes |
| 9 | Versão estável do npm | 9 | `release.yml`, `release-target.ts`, Changesets, `compat` | aplicar o versionamento do Changesets (3.0.0), conferir revisor obrigatório e restrição `v3.*` no ambiente `npm-release`, criar o trusted publisher imediatamente antes, tag `v3.0.0`, `npm stage approve` com 2FA, validar em até 2 dias | `npm view goiasscript dist-tags` com `latest` em 3.0.0 e provenance |
| 10 | Deprecar a 2.0.0 | 9 | página "o que mudou" | `npm deprecate goiasscript@2.0.0` com a mensagem apontando para a página | aviso na página do pacote |
| 11 | Extensão | 5, 9 | `release-vscode.yml`, `smoke-extension.yml` | publisher do Marketplace com Entra ID federado, conta Eclipse e namespace do Open VSX, ambientes com revisores, tag `vscode-v3.0.0`, GitHub Release | extensão nos dois marketplaces |
| 12 | Smokes pós-publicação | 9 | `smoke-release.yml`, `playground-smoke.yml`, `smoke-extension.yml` | disparar e anexar o resultado; atualizar a descrição do repositório com o texto proposto | execuções verdes |
| 13 | Piloto | 6 | kit em `docs/piloto/`, `summarize-pilot` | 3 a 5 aprendizes (um de fora de Goiás), salvar `docs/piloto/respostas/AN.json`, rodar o resumo | `3/3` ou mais |
| 14 | Vídeo | 9 | `video:facts` | gerar `video-facts.json` com `ENGOIANADOR_URL` depois do versionamento e renderizar de novo no kit externo | JSON com `engoianador.status: ok` |
| 15 | Ctrl+C no `goias` em terminal gráfico | 3 | conferência manual descrita no relatório da Fase 3 | conferir uma vez, antes do primeiro publish | registro no relatório da Fase 3 |
| 16 | Teto de 29 KB do ADR-0001 | 4 | catraca em `budgets.json` (33.195 B brotli, só impede piora) | decidir o teto ou registrar ADR de emenda | decisão registrada antes do GATE 4 ser dado por fechado |
| 17 | Extensão num VS Code real | 5 | testes de integração escritos, executados só na CI | conferir Modo Restrito e comandos, anexar capturas ao relatório da Fase 5; criar o segredo `OVSX_PAT` (o plano cita `OVSX_TOKEN`; vale o nome do workflow) | capturas anexadas; ambiente `open-vsx` com o segredo |
| 18 | Tickets dos achados aceitos | 3, 4 | achados LOW descritos nos relatórios das fases | abrir os tickets `GS-<n>` (3 e 4 da Fase 3; 3, 4 e 5 da Fase 4) e citar os números | tickets criados |
| 19 | Alarme de uso, Turnstile e modelo | 7 | teto global e guarda de leitura; `verify-model` no `predeploy` | alerta de uso dos Durable Objects na Cloudflare, Turnstile se quiser, rodar `verify-model` com a chave | alerta ativo; "tá ativo na Groq" |
| 20 | Página "o que mudou" implantada | 6 | `/cartilha/o-que-mudou` lê `docs/spec/o-que-mudou.md` | conferir a página implantada contra o spec | texto igual |
| 21 | Merge e branches do repositório | 8 | ADR-0011 e rulesets | ligar `delete_branch_on_merge`, desligar merge commit | `gh api` com `delete_branch_on_merge=true` e `allow_merge_commit=false` |

Decisões do dono ainda abertas: o teto de 29 KB brotli do ADR-0001 (item 16), confirmar as exceções às regras (ADR-0004 mutação confinada, ADR-0008 commits sem ID
Jira, ADR-0007 `TODO(GS-<n>)`), a leitura do teto de 150 ms como
relativo à máquina de referência (relatório da Fase 2) e o método do Marketplace antes de 2026-12-01.

## 9. Retrospectiva de prazo

A hipótese do spec era de 71 dias de uma pessoa sênior (§10.1). A execução foi automatizada, então os dias abaixo são
datas de commit e não horas de trabalho humano; o dono já decidiu manter as horas fora da previsão (2026-10-20).

| Fase | Hipótese (dias) | Real (datas de commit) |
| --- | --- | --- |
| 0 | 3 | 2026-10-14 a 2026-10-20 (relatório do gate 2026-10-20) |
| 1 | 3 | dentro do intervalo da Fase 0 a 2026-10-21 |
| 2 | 22 | 2026-10-21 a 2026-10-22 |
| 3 | 6 | 2026-10-22 |
| 4 | 7 | 2026-10-22 |
| 5 | 5 | 2026-10-23 |
| 6 | 6 | 2026-10-23 |
| 7 | 3 | 2026-10-23 |
| 8 | 3 | 2026-10-23 |
| 9 | 3 | 2026-10-23 |

Do primeiro commit da v3 (2026-10-14) até este relatório passaram 10 dias de calendário, contra 71 de hipótese. A
comparação não vale como previsão de trabalho humano: o que consumiu tempo real foi a espera de CI e as decisões do
dono, e isso ainda não foi medido porque a CI não rodou.

## 10. Itens que este ambiente não rodou

| Item | Motivo | Onde roda |
| --- | --- | --- |
| E2E do playground e da cartilha em Chromium, Firefox e WebKit | navegadores do Playwright não são baixados aqui (disco) | `playground-e2e.yml` |
| Testes dentro do VS Code | o VS Code não é baixado aqui | `vscode.yml` |
| Matriz Windows e macOS, Node 22 e 24 | só a CI tem esses sistemas | `ci.yml` |
| `lychee` (âncoras e links externos) | binário não instalado | `promises-gate.yml`, `scheduled.yml` |
| Mutação do Stryker | gera arquivos temporários grandes e o disco tem cerca de 4 GB livres | `scheduled.yml` |
| Job `compat` | roda em PR para `main` | `compat.yml` |

## 11. Dados do vídeo

`corepack pnpm video:facts` gravou o JSON fora do repositório, sem inventar dado: versão `3.0.0-alpha.0`; 2.979 testes
com `source: local`; `arma_o_barraco demo`, `bota_pra_moer main.gs` e `vê_se_tá_certo main.gs` com saída 0 e `stderr`
vazio; `trem idade é 30` vira `let idade = 30;`; Engoianador `{ "status": "pending-owner" }`. Para o número de testes
valer como prova pública, usar o relatório da CI (`--tests-from`).
