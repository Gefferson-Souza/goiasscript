# Relatório do gate da Fase 7

**Veredito:** NÃO APROVADO, condicionado à revisão independente. O aceite exige o `security-reviewer` em contexto
fresco e ele ainda não rodou: a revisão da seção 6 foi autorrevisão do executor (mais uma leitura posterior, sem agente
de segurança dedicado). Sem essa prova, a ausência de achado CRITICAL ou HIGH é só a leitura do executor, não está
comprovada de forma independente. Dentro do que foi feito, a
validação de corpo está coberta por teste, a cota sob concorrência passa exatamente o limite, cobertura e mutação foram
medidas e `apps/engoianador-api` não tem entrada no `baseline.json`. O que depende de conta, chave ou ato do dono
(Cloudflare, Groq, KV, Durable Object, secrets, `wrangler deploy`) está na seção 9 como `pendente do dono`. Nada foi
implantado, publicado nem enviado ao remoto, e nenhuma tag foi criada.

Medição: Node v26, Linux. Cobertura e contagens vêm de `vitest run --coverage` e de `corepack pnpm verify` feitos depois
do último commit de código. A nota de mutação é de uma execução (1 min).

## 1. Unidades e commits

Os commits não carregam o número da unidade no título; o agrupamento é pelo assunto.

| Unidade | Commits principais |
| --- | --- |
| U7-00 worker nos gates | bbd3faf |
| U7-01 validação de borda, contrato e portas | 1b034c7, 69e028c (E2E e README ao contrato `text`) |
| U7-02 cota atômica em Durable Object | 9b49369 |
| U7-03 provedores, modelo e fallback | 5edbb94, 1e4ae31 (para a cadeia após cancelamento; exige modelo no deploy) |
| U7-05 `GET /health` e cliente | c797e27, 3414e05, ba16f81, 42f7189 |
| U7-04 cache por hash do texto normalizado | 1ce6098, bb4a35f, 741eb0a (limite de leituras por rede) |
| U7-06 contrato semanal e smoke pós-deploy | 6ee10af, 3066ebc |
| U7-07 testes de `index` e `engoiana` e mutação | 28d69fe, 19ed382 |
| U7-08 revisão de segurança e este relatório | 51bf233 (`fix(engoianador): agrupa o guarda de leitura pelo /64 no worker`; o mesmo commit também ajusta `vitest.mutation.config.ts`), 37ee0a1 (relatório) e 92f8299 (correções da revisão: reset do guarda e `ALLOW_UNLIMITED`) |

## 2. Cobertura (`vitest run --coverage`)

| Alvo | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| `apps/engoianador-api/src` (somado de `lcov.info`) | 98,27% (454/462) | 91,14% (247/271) | 99,13% (114/115) |
| Repositório inteiro (cobertura do `verify`) | 97,67% | 93,06% | 96,79% |

Total da execução com cobertura: 2.694 testes passando, 7 ignorados, 235 arquivos (mais 1 ignorado); o projeto
`compiler` roda à parte no `verify`. Só o Worker: 22 arquivos e 219 testes. O piso de 80% por linhas, funções, ramos e
instruções vale para `apps/engoianador-api/src/**` (`vitest.config.mts`) e o `verify` sai 0.

## 3. Nota de mutação (`corepack pnpm --filter engoianador-api mutate`)

Somente relatório (`thresholds.break: null`, decisão 29): **78,92%** no total, **81,63%** sobre o código coberto; 758
mortos, 2 por tempo, 171 sobreviventes, 32 sem cobertura, 0 erros. Mutantes de regex ficam de fora da conta.

| Arquivo | Nota | Arquivo | Nota |
| --- | --- | --- | --- |
| `cache.ts`, `cache-key.ts`, `engoiana.ts`, `providers/index.ts` | 100,00 | `handler.ts` | 76,42 |
| `prompt.ts` | 95,00 | `index.ts` | 76,92 |
| `validation.ts` | 93,42 | `config.ts` | 76,71 |
| `health.ts` | 90,91 | `cors.ts` | 75,00 |
| `workers-ai.ts` | 87,50 | `limiter.ts` | 74,70 |
| `network-key.ts` | 85,47 | `groq.ts` | 70,59 |
| `quota-ledger.ts` | 82,35 | `reservation.ts` | 64,71 |
| `answer.ts` | 80,00 | `rate-limiter.do.ts` | 64,71 |
| `lookup-guard.ts` | 58,49 | `log.ts` | 10,00 |

Leitura: o miolo de risco (validação, cota, cache, cadeia de provedores) está acima de 80%. Os sobreviventes
concentram-se em mensagens e literais de erro, em fronteiras de status HTTP no classificador da Groq (`>=` contra `>`)
e em `log.ts`, que é só a saída para o console da plataforma. O limiar de ruptura entra no plano de manutenção.

Na execução houve um defeito de configuração, corrigido no commit 51bf233, que também traz o fix de segurança sem citar este ajuste no título: o teste que roda o `warm-cache` direto
no Node (`warm-cache-cli.test.ts`) importa o `playground` pela raiz do repositório e quebrava a rodada inicial do
Stryker, cujo sandbox fica dentro do pacote; ele passou para a lista de exclusão de `vitest.mutation.config.ts`, como
os outros dois testes que leem a raiz.

O Stryker deixa `.stryker-tmp/` dentro do pacote e o ESLint do `verify` o lê: depois de `mutate`, apague
`apps/engoianador-api/.stryker-tmp` antes de rodar o `verify`.

## 4. Casos da borda (APP-10), todos em `validation.test.ts` e `handler.test.ts`

| Caso | Resposta | Teste |
| --- | --- | --- |
| `Content-Type` diferente de JSON ou ausente | 415 | 'recusa Content-Type %s com 415' |
| `Content-Length` ausente | 411, antes de ler o corpo | 'recusa Content-Length ausente com 411' |
| `Content-Length` inválido (`abc`, `-1`, `1.5`, vazio) | 400 | 'recusa Content-Length inválido (%s) com 400' |
| `Content-Length` acima do teto | 413, sem ler o corpo | 'recusa Content-Length acima do teto sem ler o corpo' |
| Corpo maior que o declarado | 413 | 'recusa corpo maior que o declarado com 413' |
| Declaração mentirosa com fluxo grande | leitura interrompida, 413 | 'interrompe a leitura quando os bytes passam do teto…' |
| `null`, array, texto, número, objeto vazio | 400 | 'recusa corpo … com 400' (tabela de entradas) |
| `text` não string, nulo, vazio, só espaços, campo extra | 400 | idem |
| Texto acima de `MAX_INPUT_CHARS` | 413 | 'recusa texto acima de MAX_INPUT_CHARS com 413' |
| Texto exatamente no limite | 200 | 'aceita texto exatamente no limite de caracteres' |
| Mensagens de recusa | todas em goianês, com CORS da origem permitida | 'escreve toda mensagem de recusa em goianês' |
| Configuração inválida | 503 em goianês, com CORS, sem provedor | 'configuração inválida devolve 503 …' |
| Erro interno | 500 sem vazar mensagem nem texto | 'erro interno devolve 500 sem vazar …' |
| Registro de log | nunca contém o texto do usuário | 'nunca registra o texto do usuário em log' |

## 5. Concorrência da cota

`quota-ledger.test.ts`: 'concede exatamente o limite sob 30 chamadas simultâneas' e 'concede exatamente o limite sob
30 requisições simultâneas ao objeto' (limite 20: passam 20, negam 10, nos dois níveis). Também cobertos: `refund`
idempotente, janela diária virando no UTC, teto global (`reason: 'global'`), kill switch sem tocar no Durable Object,
Durable Object que lança virando `misconfig` (503) e IPv6 do mesmo /64 dividindo a cota. O ledger roda sobre um SQL
falso em memória e sobre o objeto com `fetch` simulado; o comportamento dentro do runtime real da Cloudflare só é
observável depois do deploy (seção 9).

## 6. Revisão de segurança e disposição

**Como foi feita.** A ferramenta de subagente não estava disponível na execução desta unidade; a revisão foi feita
direto pelo executor, em modo de leitura, sobre `apps/engoianador-api/{src,scripts,wrangler.toml}`,
`.github/workflows/engoianador-*.yml` e `apps/playground/lib/engoianador-client.ts` (perímetro ignorado:
`node_modules`, `dist`, `packages/core`). **A revisão em contexto fresco por agente independente, que o aceite pede,
continua pendente** e deve ser disparada pelo dono ou pelo orquestrador antes de aprovar o GATE 7.

### 6.1 Achados

| # | Severidade | Onde | Descrição | Disposição |
| --- | --- | --- | --- | --- |
| 1 | MEDIUM | `handler.ts` | O guarda de rajada de leituras de cache usava o IP cru como chave. Quem controla um bloco IPv6 /64 girava o endereço e abria uma janela nova a cada requisição, lendo o KV sem limite (a cota só vale para quem chama o provedor). | **Corrigido:** o guarda usa `networkKeyOf`, a mesma chave da cota. Teste 'rajada de acertos de cache girando endereços do mesmo /64 também leva 429' (RED observado: esperado 429, veio 200). |
| 2 | MEDIUM | `config.ts`, `env.types.ts` | `ALLOW_UNLIMITED` era lido para a configuração mas nenhum código o consultava: um interruptor de desvio de cota que parece funcionar e não faz nada engana quem opera. | **Corrigido:** removido da configuração e do tipo (92f8299). Não há mais interruptor de desvio de cota. |
| 9 | MEDIUM | `lookup-guard.ts` | Com o mapa de redes cheio, `evictExpired` zerava as janelas de todas as redes; quem usa muitos endereços distintos soltava a rajada de leitura de cache de qualquer rede. Impacto limitado à leitura de KV por isolate. | **Corrigido:** sai uma rede por vez, preferindo as que ainda não estão no teto; redes barradas são as últimas a sair. Teste 'não solta a rajada de uma rede já barrada quando o mapa enche' (RED observado: veio 200 esperando 429). |
| 3 | LOW | `prompt.ts` | Injeção de prompt: o texto do usuário vai entre tags removidas do conteúdo, com instrução de tratar como dado e exemplo de ataque no few-shot, mas o modelo pode ainda vazar o prompt de sistema. | Aceito: o prompt é público no repositório e não há segredo nele; a saída não executa nada e só volta ao autor da requisição. |
| 4 | LOW | `handler.ts` | Um cliente que desconecta no meio da chamada cancela `request.signal`; a devolução da cota pode não rodar se o isolate for encerrado. | Aceito: a falha é do lado seguro (cota a menos para quem abandonou a requisição); o ledger limpa por dia. |
| 5 | LOW | `limiter.ts` | Muitas redes distintas podem esgotar o teto global do dia (negação de serviço da cota de todos). | Aceito: é o propósito do teto global (limita o custo); o kill switch e o teto são ajustáveis sem deploy de código. |
| 6 | LOW | `health.ts` | `/health` público informa o modelo configurado e quais bindings existem. | Aceito: é o contrato do teste agendado; não expõe valor de segredo (teste 'não expõe a chave nem valores de variável'). |
| 7 | LOW | `engoianador-smoke.yml` | `base_url` é escolhido por quem dispara o workflow (SSRF a partir do runner). | Aceito: só quem escreve no repositório dispara; o job não tem segredo; a entrada passa por `env` (nunca interpolada em `run`), exige `https://` sem espaço e o script recusa redirecionamento para outro host. |
| 8 | INFO | `providers/workers-ai.ts` | O ouvinte de `abort` da corrida com o tempo-limite não é removido. | Sem efeito: o sinal vive só durante a requisição. |

### 6.2 Checklist do plano e evidência

- **Leitura de corpo sem teto:** `Content-Length` conferido antes de ler; leitura por fluxo com contador e teto de
  `MAX_BODY_BYTES`; declaração mentirosa interrompe a leitura (`validation.test.ts`).
- **CORS em erro:** a resposta de todo 4xx e 5xx passa por `makeReply`, que anexa os cabeçalhos da origem permitida;
  `x-user-api-key` saiu da lista (`handler.test.ts`, 'não anuncia x-user-api-key no CORS'); origem fora da lista não
  recebe `Access-Control-Allow-Origin` e o preflight devolve 403.
- **Bypass da cota:** a chave vem só de `cf-connecting-ip` (a Cloudflare define; `x-forwarded-for` é ignorado, teste
  'usa cf-connecting-ip como chave de rede'); IPv6 vira /64 e IPv4 mapeado em IPv6 vira o IPv4 (`network-key.test.ts`);
  entrada inválida e ausente caem no balde `anon` (todos juntos, do lado seguro); `ALLOW_UNLIMITED` foi removido
  (achado 2); o guarda de leituras agora usa a mesma chave (achado 1).
- **Reserva não devolvida:** falha dos provedores devolve a reserva (`handler.test.ts`, 'falha do provedor devolve a
  cota'); a reserva global é devolvida se a da rede nega ou lança; `refund` é idempotente.
- **Injeção de prompt:** achado 3.
- **Log do texto do usuário:** o `handler` só registra o nome do erro e eventos fixos; a cadeia de provedores registra
  `provedor:falha`; o teste 'nunca registra o texto do usuário em log' cobre; nenhum `console` fora de `log.ts`.
- **Segredo em `env` de job:** `GROQ_API_KEY` aparece uma vez em `engoianador-contract.yml`, só no `env` do passo que
  roda o script; `engoianador-smoke.yml` não recebe segredo; ações por SHA, `permissions: contents: read`
  (`engoianador-workflows.test.mjs`). A chave só é enviada ao endereço fixo da Groq; o script nunca a imprime.
- **SSRF no smoke:** achado 7.
- **Fuga de chave em `/health`:** só presença booleana (achado 6).
- **Chave de cache colidindo entre modelos:** `v1:<versão do prompt>:<groq>+<workers-ai>:<sha256>`; trocar prompt ou
  qualquer um dos modelos muda a chave (`cache-key.test.ts`). A falha de leitura ou escrita do KV vira miss.
- **Durable Object:** só alcançável pelo binding (sem rota pública); o corpo é validado por esquema estrito e o texto do
  usuário nunca chega ao objeto.

## 7. Rastreabilidade (§11)

| Requisito do spec | Prova |
| --- | --- |
| Engoianador: texto vira goianês com LLM | Contrato agendado (`engoianador-contract.yml`) + smoke pós-deploy (`engoianador-smoke.yml`), com `contract-check.test.ts` e `engoianador-workflows.test.mjs` provando o código e os workflows por simulação. Estado: **pendente do dono** até existir a chave e a URL implantada |
| Validação de corpo por schema | `validation.test.ts` e `handler.test.ts` (seção 4) |
| Limite atômico, cota só em sucesso | `quota-ledger.test.ts`, `limiter.test.ts`, `handler.test.ts` |
| Cache falha aberto, hit sem provedor nem cota | `cache.test.ts`, `handler.test.ts` |
| Modelo por configuração, fallback | `groq.test.ts`, `workers-ai.test.ts`, `provider-chain.test.ts`, `verify-model.test.ts` |
| Worker nos gates do repositório | `corepack pnpm verify` (typecheck, ESLint estrito, scanner, knip, Vitest com piso de 80%) e `baseline.json` sem entrada de `apps/engoianador-api` |

## 8. Divergências do spec e do plano

1. A revisão de segurança foi feita pelo executor, não por agente em contexto fresco (seção 6).
2. A nota de mutação ficou em 78,92%, abaixo do verde de 80% do Stryker, mas o limiar é só de relatório (decisão 29).
   Os sobreviventes de `lookup-guard.ts` (58,49%), `reservation.ts` e `rate-limiter.do.ts` (64,71%) ficam para a
   manutenção: endurecer esses três arquivos com testes que matem os sobreviventes e então ligar o limiar de ruptura em
   80%. O número do ticket GS-<n> deve ser aberto pelo dono; nenhum número foi inventado aqui. O novo teste do guarda
   cobre o caso de maior risco (reset do mapa), mas a nota não foi remedida.
3. O contrato semanal não rodou contra a Groq nem contra a API: não há chave nem URL (seção 9).

## 9. Pendências do dono

| Item | Unidade | O que está pronto | Comando ou ação do dono | Evidência esperada | Estado |
| --- | --- | --- | --- | --- | --- |
| Conta Cloudflare e `wrangler login` | U7-00 | `wrangler.toml` completo (vars, Durable Object com migração `new_sqlite_classes`, um KV, `[ai]`) | criar a conta e autenticar o `wrangler` | `wrangler whoami` | pendente do dono |
| Namespaces KV | U7-04 | binding `ENGOIANADOR_CACHE` com id marcador que o `check-worker-config` recusa | `wrangler kv namespace create ENGOIANADOR_CACHE` e colar o id no `wrangler.toml` | `check-worker-config` sem recusa | pendente do dono |
| Durable Object | U7-02 | classe `QuotaLedgerObject` e migração `v1` | publicar com `wrangler deploy` (cria a migração) | `/health` com `bindings.QUOTA_LEDGER: true` | pendente do dono |
| Secret `GROQ_API_KEY` | U7-03 | provedor, `verify-model` e `.dev.vars.example` | `wrangler secret put GROQ_API_KEY` e segredo do GitHub com o mesmo nome | `/health` com `bindings.GROQ_API_KEY: true` | pendente do dono |
| Conferir o modelo no registro da Groq | U7-03 | `verify-model.ts` (`--require`) no `predeploy` | rodar `verify-model` com a chave antes do deploy | saída "tá ativo na Groq" para `GROQ_MODEL` | pendente do dono |
| `wrangler deploy` | U7-00 a U7-07 | `predeploy` = `check-worker-config` + `verify-model` | `corepack pnpm --filter engoianador-api deploy` (roda o `predeploy` antes) | URL implantada respondendo `/health` | pendente do dono |
| Aquecer o cache | U7-04 | `scripts/warm-cache.ts` (cinco frases do playground) | rodar o script com a URL implantada | cinco respostas 200 relatadas | pendente do dono |
| Variável `ENGOIANADOR_URL` e contrato semanal | U7-06 | `engoianador-contract.yml` | definir a variável e o segredo e disparar o workflow | execução verde (sem "pendente do dono" no resumo) | pendente do dono |
| Smoke pós-deploy | U7-06 | `engoianador-smoke.yml` | disparar com `base_url` implantado | execução verde | pendente do dono |
| Revisão de segurança independente (bloqueia o GATE 7) | U7-08 | perímetro e checklist da seção 6 | despachar o `everything-claude-code:security-reviewer` em contexto fresco e anexar a tabela na seção 6 | tabela sem CRITICAL/HIGH | pendente do orquestrador |
| Aplicar `ALLOWED_ORIGINS` de produção | U7-00 | validação de origens `https:` na configuração | trocar pelo domínio real no `wrangler.toml` | `/health` 200 e CORS da origem real | pendente do dono |
