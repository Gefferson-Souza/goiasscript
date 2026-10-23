# Relatório do gate da Fase 4

**Veredito proposto:** pronto para o GATE 4 assim que a CI do `playground-e2e.yml` passar em Firefox e WebKit, que
nunca rodaram localmente. A revisão de segurança independente, em contexto fresco e somente leitura, não achou CRITICAL
nem HIGH (seção 5.3). Fica com o dono a decisão sobre o teto de 29 KB do ADR-0001, hoje excedido (33.195 B, seção 6),
e o checklist da seção 9.

Medição: Node v26, Linux, CPU 12th Gen Intel(R) Core(TM) i5-12450H (12 núcleos), Google Chrome 155 do sistema para o
Chromium do E2E e para a medição de `compile()`. Cobertura e contagens de testes vêm de `corepack pnpm verify` e de
`vitest run --coverage` (22/10/2026, depois do último commit de código). Tempos são de uma execução.

## 1. Unidades e commits

Os commits não carregam o número da unidade no título; o agrupamento é pelo assunto.

| Unidade | Commits principais |
| --- | --- |
| U4-01 compilador: diagnósticos em escala linear | e1f876b, 1b1e733, e3edc42, 7d3e397 |
| U4-02 CLI: REPL linear e mutação do `cli` | db5f32c, 2a7a35e, 9e09d8c |
| U4-03 base do app (gates, configuração pública, cabeçalhos) | 96484be, 3cfc591, b2f7a38 |
| U4-04 sandbox: runner, protocolo, cliente e limites | 9351851, 974e486 |
| U4-05 compilação ao vivo, marcadores, autocomplete e hover | 1f56794, 90f2145, 062ae44, 0378e3a |
| U4-06 doação e páginas de erro | 5dfc52f, 0d26896, a6bb54b |
| U4-07 página do Engoianador | 5fef0d6 |
| U4-08 infra do E2E | 3469588, 5fb2460 |
| U4-09 casca da interface | 7755ee2, b630186 |
| U4-10 deploy preparado e smoke | b98c7c7, b02c821 |
| U4-11 E2E de sandbox e segurança | 289c845, 6d3d670, ce352d0 |
| U4-12 E2E do editor e da interface | 14a9bab, 92f5a00, 0dd3f60 |
| U4-13 revisão de segurança e este relatório | b0018c2 e o commit deste relatório |

## 2. Cobertura (`vitest run --coverage`)

| Alvo | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| `packages/language` | 100% | 98,00% | 100% |
| `packages/compiler` | 99,74% | 95,74% | 99,83% |
| `packages/optimizer` | 100% | 80,00% | 100% |
| `packages/cli` | 98,00% | 89,38% | 97,57% |
| `apps/playground` (config + lib + sandbox) | 96,70% | 90,20% | 95,91% |
| \- `config` | 92,86% | 88,31% | 96,55% |
| \- `lib` | 99,30% | 93,86% | 98,41% |
| \- `sandbox` | 86,15% | 70,45% | 75,00% |

Total: 1.960 testes passando, 7 ignorados, 166 arquivos (mais 1 ignorado); projeto `compiler` rodado à parte: 965
testes. Instruções 98,33% (4778/4859), ramos 93,68% (2805/2994), funções 98,60% (1135/1151), linhas 98,85%
(3954/4000). O piso de 80% vale por pacote e
para o conjunto `apps/playground/{config,lib,sandbox}`, e o `verify` sai 0.

Ressalva honesta: medido isoladamente, `sandbox` fica abaixo de 80% em ramos e funções porque `sandbox/runner.ts` (a
entrada do Worker, 19 linhas) não é carregado pelos testes de unidade e só é exercido pelo E2E de navegador; sem ele,
`run-program.ts` tem cobertura alta de linhas. O critério do gate é o do conjunto, que passa.

## 3. E2E por navegador

| Navegador | Resultado | Duração |
| --- | --- | --- |
| Chromium (Chrome 155 do sistema, local) | 49 passaram, 0 falharam, 0 instáveis, 0 ignorados | 51,2 s |
| Firefox | **pendente de CI** (não medido) | |
| WebKit | **pendente de CI** (não medido) | |

Por arquivo (Chromium): `sandbox-attacks` 12, `split-view` 6, `ask-box` 5, `editor-autocomplete` 5,
`editor-diagnostics` 5, `engoianador` 4, `run-output` 4, `donation-guard` 3, `sandbox-limits` 3, `security-headers` 2.

Firefox e WebKit rodam no `playground-e2e.yml` (matriz de três navegadores, uma instalação por job) e **a falha de
segurança em qualquer um deles bloqueia a fase**. Nada neste relatório afirma que passam. Os servidores do E2E sobem em
produção (`next build` + `next start`), então os cabeçalhos testados são os do deploy. Depois do build, `.next/` e
`.next-configured/` foram apagados do worktree.

## 4. Tabela de ataques (Chromium)

Cada ataque que compila imprime `tentei` antes e `deu ruim: <mensagem>` depois; o teste exige as duas linhas, que a
mensagem case com a lista fechada do ataque (bloqueio de CSP ou de rede, nunca erro de sintaxe do próprio payload) e que
o canário não tenha recebido acesso. O `localStorage` do host (`segredo-do-host`) é conferido ao fim de cada caso.

| Ataque | Resultado |
| --- | --- |
| `fetch`, `XMLHttpRequest`, `WebSocket` | tentou, bloqueado; canário sem acesso |
| `import()` dinâmico de URL externa, `importScripts` | tentou, bloqueado; canário sem acesso |
| `navigator.sendBeacon` | tentou, bloqueado; canário sem acesso |
| `x["con" mais "structor"]` (construtor pelo índice computado) | compila e fica contido pela CSP (sem `unsafe-eval`) |
| leitura do `localStorage` do host | tentou, inalcançável no Worker |
| `Function("return this")()` e `[].constructor.constructor(...)` | barrados na compilação (diagnóstico), nada executa |
| laço infinito | para em GS0701 com a linha do laço; batimento da aba < 250 ms |
| saída gigante (5.000 linhas) | truncada por linhas, com aviso |
| `daqui_um_cadim` em laço | estoura `maxRunMs` com aviso em goianês |
| `pergunta` sem resposta | cortada pelo teto absoluto; Parar encerra |
| recursão sem fim | tentou, `deu ruim` com estouro de pilha |

Não coberto por E2E: `BroadcastChannel`. O programa do aluno não alcança globais (nomes de JavaScript são barrados no
mundo fechado e `globalThis.postMessage` falha na compilação com GS0403), e a página não escuta canal algum.

## 5. Revisão de segurança e disposição

**Como foi feita.** A ferramenta de subagente não estava disponível na execução desta unidade; a revisão foi feita
direto pelo executor, em modo de leitura, com o checklist do plano, sobre `apps/playground/{config,lib,sandbox,app,components,scripts}`,
`apps/playground/vercel.json` e os workflows `playground-e2e.yml` e `playground-smoke.yml` (perímetro ignorado:
`packages/core`, `node_modules`, `.next`, `public/vs`). Foram feitas buscas por sumidouros (`dangerouslySetInnerHTML`,
`innerHTML`, `eval`, `new Function`, `document.write`, `window.open`, `postMessage`, `localStorage`, `credentials`,
`targetOrigin`), tentativa de forjar mensagem do protocolo a partir de um programa compilado de verdade, e
`pnpm audit --prod` (nenhuma vulnerabilidade conhecida). **A revisão em contexto fresco, por agente de segurança
independente, que o aceite pede, continua pendente** e deve ser disparada pelo dono ou pelo orquestrador antes do GATE 4.

### 5.1 Achados

| # | Severidade | Onde | Descrição | Disposição |
| --- | --- | --- | --- | --- |
| 1 | MEDIUM | `sandbox/run-program.ts` | O coletor de `console` enviava o texto inteiro ao host; o corte nos tetos só vinha depois do clone da mensagem. | **Corrigido em parte**: limita o que atravessa o `postMessage`. O Worker corta cada argumento e a junção em `maxLogChars + 1` (bastante para o host detectar o excesso), com testes para argumento único, vários argumentos e objeto grande. A memória do próprio Worker (a string ou o objeto que o programa monta, e o `JSON.stringify` de um objeto) **não** é limitada: risco aceito, contido por `maxRunMs` e pelo botão Parar (seção 8). |
| 2 | LOW | `config/security-headers.constants.ts` | `script-src 'self' 'unsafe-inline'` na CSP da página (Next injeta scripts inline sem nonce). `unsafe-eval` só existe em `next dev`, nunca no build de produção (coberto por `security-headers.test.ts` e pelo E2E). | Aceito: não há sumidouro de HTML em todo o app (busca sem ocorrências); nonce exigiria renderização dinâmica. Rever se algum dia entrar HTML dinâmico. |
| 3 | LOW | `/sandbox/runner.js` | O Worker roda na mesma origem da página. A barreira é a CSP do runner mais o mundo fechado do compilador, não a origem. O app só usa `localStorage`, que não existe em Worker, e não usa IndexedDB, Cache API nem `BroadcastChannel`. | Aceito como risco aberto (seção 8); ticket `GS-<n>` para servir o runner de origem separada, número a vir do dono. |
| 4 | LOW | `app/use-playground.ts` | Abrir um link `#codigo=` grava o código do link no `localStorage`, sobrescrevendo o código salvo do aluno sem perguntar. O link nunca executa; só carrega no editor. | Aceito: perda de rascunho local, sem efeito de segurança; ticket `GS-<n>` para pedir confirmação. |
| 5 | LOW | `compiler/src/helpers/helper-sources.ts` | O ajudante `pergunta` posta o enunciado inteiro; o host corta em 500 caracteres só depois do clone (mesma classe do achado 1, no transporte). Fica no compilador (Fase 2), fora do perímetro do app. | Aceito: o teto absoluto de tempo limita o abuso; ticket `GS-<n>` para o compilador. |
| 6 | LOW | `playground-smoke.yml` | A conferência de `base_url` com `grep` é por linha; um valor com quebra de linha passa pela primeira linha. O script reconfere com `new URL`, exige `https:` e só segue redirecionamento no mesmo host. Quem dispara é o dono. | Aceito: sem efeito prático. |
| 7 | INFO | `lib/engoianador-client.ts` | A resposta do Engoianador não tem teto de tamanho. A origem é a configurada pelo dono, `credentials: 'omit'`, `redirect: 'error'`, o texto vai para o React como texto (sem HTML). | Aceito. |
| 8 | INFO | workflows | Permissões `contents: read`, actions pinadas por SHA, `pull_request` (nunca `pull_request_target`), `base_url` passada por variável de ambiente e não interpolada no `run`. | Nenhuma ação. |

Nenhum CRITICAL/HIGH na autorrevisão do executor; isso **não** substitui a revisão independente exigida pelo gate.

### 5.2 Checklist do plano e evidência

- **CSP da página e do runner:** página com `default-src 'self'`, `frame-ancestors 'none'`, `base-uri` e `form-action`
  `'self'`, `connect-src` só `'self'` mais a origem do Engoianador; runner com `default-src 'none'`, `connect-src 'none'`,
  `img-src 'none'`. Conferido em `security-headers.spec.ts` (a página não herda a política do runner e vice-versa) e no
  smoke pós-deploy.
- **Mensagens forjadas pelo Worker:** `message-guards.ts` reconstrói cada mensagem campo a campo, só com propriedades
  próprias, e descarta o resto; `runId` divergente é ignorado; log, pergunta, pilha e nome de erro têm teto. Cobertura só
  unitária (`message-guards.test.ts`, `runner-client.test.ts`), porque o programa do aluno não consegue emitir mensagens
  do protocolo (seção 7).
- **XSS:** nenhum `dangerouslySetInnerHTML`/`innerHTML`; saída do programa, pergunta e erro entram como texto;
  caracteres de controle e marcas bidi são mostrados escapados (`visibleText`); Markdown de hover não é confiável
  (`isTrusted: false`, `supportHtml: false`) e escapa o texto do aluno.
- **`href` de configuração:** só `https:` em produção, sem usuário e senha; placeholders do `.env.example` derrubam o
  build de produção; `rel="noopener noreferrer"` em todo link externo; chave Pix só como texto.
- **Link de compartilhamento:** `#codigo=` limitado a 8 KB, base64url estrito, UTF-8 estrito, decodificado sem executar;
  o hash é limpo depois de lido.
- **`window.open`:** um único uso (compositor do X), URL de constante, `noopener,noreferrer`.
- **`postMessage`:** o host só fala com o próprio Worker (sem `targetOrigin`); o Worker só aceita uma mensagem `execute`
  e executa uma vez.
- **`NEXT_PUBLIC_*`:** apenas URLs públicas e a chave Pix; nenhum segredo no repositório.
- **Cache e cabeçalhos do runner:** `nosniff` e `Cross-Origin-Resource-Policy: same-origin`; o arquivo é de `public/`
  (sem cache imutável).

### 5.3 Revisão independente

O `security-reviewer` rodou em contexto fresco, somente leitura. Confirmou o isolamento do Worker (CSP própria sem
rede), a reconstrução campo a campo das mensagens, os limites de saída, a ausência de HTML vindo do visitante, a
validação do `#codigo=` e da config pública, o cliente do Engoianador e os workflows. Nenhum CRITICAL ou HIGH.

| Achado | Disposição |
| --- | --- |
| MEDIUM: runner na mesma origem do site, isolado só pela CSP; IndexedDB, Cache API e BroadcastChannel da origem ficariam ao alcance se o app passasse a usá-los | aceito por ora: o app só usa `localStorage`, que o Worker não alcança; origem dedicada para o sandbox depende do domínio (dono) |
| MEDIUM: `script-src 'unsafe-inline'` na página | aceito por ora: o Next injeta scripts inline sem nonce; nonce por middleware fica para a fase de docs e relançamento |
| LOW: pergunta forjada pausa o relógio de 10 s até o teto de parede | aceito: afeta só a aba do visitante e o Worker é encerrado no teto |
| LOW: log forjado enorme é clonado antes do corte | aceito: o clone acontece no `postMessage`, antes de qualquer código do host; a primeira mensagem acima do limite encerra a execução |
| LOW: `prompt` forjado parece pergunta legítima | aceito: controles e bidi já são neutralizados |
| Cabeçalhos na Vercel não verificados | o smoke pós-deploy confere a CSP do runner (checklist da seção 9) |

## 6. Orçamentos e desempenho medidos

| Medida | Valor |
| --- | --- |
| Chunk do compilador no playground (brotli, `compile-service.ts`) | **33.195 B** (catraca em `budgets.json`: 33.195 B; bruto 120.525 B) |
| Chunk do otimizador (brotli, `@goiasscript/optimizer`) | **122.066 B** (bruto 507.612 B), carregado só ao pedir o JS otimizado |
| `compile()` no Chromium, 1.000 linhas (mediana de 20) | **10,7 ms** (máximo 15,8 ms) |
| `compile()` no Chromium, 10.000 linhas (mediana de 20) | **98,2 ms** (máximo 115 ms; teto do plano 150 ms) |

O programa de teste alterna `uai nN é N mais 2` e `prosa(nN)`, com mapa de fonte e `loopLimit` do playground. O chunk
do compilador está 3.195 B acima do teto de 29 KB do ADR-0001 (decisão 16, que o dono ainda resolve); a catraca só
impede piora.

## 7. Divergências do spec

1. A mensagem forjada pelo Worker (log, pergunta ou fim fora do protocolo) tem só cobertura unitária; não há como o
   programa do aluno emiti-la, então o E2E não a reproduz.
2. Firefox e WebKit não foram medidos localmente; ficam para a CI.
3. A revisão de segurança desta unidade foi feita pelo executor, não por agente em contexto fresco (seção 5).
4. O painel de saída mostra a frase goiana do GS0701 com a linha do laço, não o código `GS0701` (ajuste do plano na U4-11).
5. `daqui_a_pouco` do plano virou `daqui_um_cadim` (RFC-0001).
6. Cabeçalhos definidos em `next.config.ts` (decisão 1); `vercel.json` não os repete.
7. `sandbox`, medido isoladamente, fica abaixo de 80% em ramos e funções (seção 2); o gate é pelo conjunto.

## 8. Riscos abertos

- Revisão de segurança independente não feita (bloqueia o GATE 4).
- Firefox e WebKit sem execução até a CI rodar (bloqueia o GATE 4).
- Runner na mesma origem da página (achado 3): se a CSP ou o mundo fechado regredirem, o Worker alcança o armazenamento
  da origem. Os dois têm teste (CSP no E2E, mundo fechado nos testes do compilador).
- A memória do Worker não é limitada por mensagem de log: um programa pode alocar strings ou objetos enormes dentro dele
  até `maxRunMs` ou Parar (achado 1).
- O Worker pode consumir CPU até o teto absoluto (`maxRunMs + maxAskWaitMs`) ou até o aluno clicar em Parar, quando
  finge uma pergunta.
- Teto de 29 KB do ADR-0001 excedido (33.195 B), pré-condição do GATE 4: exige decisão do dono (decisão 16) ou ADR de
  emenda antes de fechar a fase; a catraca só impede piora.
- Nenhum deploy real foi feito: o smoke pós-deploy só roda contra uma URL real (tarefa do dono 8).

## 9. Rastreabilidade (§11) e checklist do dono

| Requisito do spec | Teste |
| --- | --- |
| Autocomplete com goianês para JS | `editor-autocomplete.spec.ts` |
| Tela dividida | `split-view.spec.ts` |
| Playground: roda no navegador | `run-output.spec.ts` e o smoke pós-deploy (Fase 9) |

**Checklist do dono para o primeiro deploy (Fase 4)**

1. Enviar a branch ao remoto e anexar aqui o resultado da CI do `playground-e2e.yml` em Chromium, Firefox e WebKit;
   qualquer falha de segurança em Firefox ou WebKit bloqueia a fase.
2. Cumprir as pendências da Fase 3 que ainda estiverem abertas (CI do tarball em Windows e macOS, Ctrl+C no `goias`,
   teto de 29 KB, item 8).
3. Abrir os tickets `GS-<n>` dos achados 3, 4 e 5 da seção 5.1.
4. Criar o projeto na Vercel apontando para `apps/playground` (diretório raiz), com as variáveis `NEXT_PUBLIC_*` do
   `.env.example`, e registrar o domínio ou adotar o `.vercel.app`.
5. Fornecer a chave Pix real e/ou os links do GitHub Sponsors e do Ko-fi, ou deixar as variáveis vazias (a seção some).
6. Disparar o `playground-smoke.yml` com a URL do deploy e anexar o resultado.
7. Disparar a revisão de segurança independente (`everything-claude-code:security-reviewer`, contexto fresco, somente
   leitura, perímetro do plano) e anexar a tabela; sem CRITICAL/HIGH abertos.
8. Decidir o teto de 29 KB do ADR-0001 (decisão 16) ou registrar um ADR de emenda.
