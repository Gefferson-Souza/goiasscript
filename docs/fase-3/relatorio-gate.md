# Relatório do gate da Fase 3

**Veredito proposto:** pendente da revisão independente. Nenhum achado CRITICAL ou HIGH foi encontrado pela revisão do
próprio executor e os dois MEDIUM foram corrigidos com teste de regressão (seção 6), mas o aceite da U3-15 exige o
`security-reviewer` em contexto fresco e somente leitura, que ainda não rodou. O E2E do tarball em três plataformas
(seis combinações) também segue pendente da CI. Só depois dessas duas coisas o relatório passa a "pronto para o GATE 3".
Pendências do dono: a conferência do Ctrl+C num terminal gráfico, os números de ticket dos achados 3 e 4 e o primeiro
publish (checklist da seção 11).

Medição: Node v26.11.1, Linux, CPU 12th Gen Intel(R) Core(TM) i5-12450H (12 núcleos). Os números de tempo são de uma
execução; os de cobertura e de testes vêm de `corepack pnpm verify` (medido em 22/10/2026, depois do último commit de código).

## 1. Unidades e commits

Os commits do plano 2 não carregam o número da unidade no título; o agrupamento abaixo é pelo assunto.

| Unidade | Commits principais |
| --- | --- |
| U3-01 pacote `goiasscript` | a536d36, f5c14dd |
| U3-02 argumentos, comandos e ajuda | f255a97, 253b3cc |
| U3-03 diagnósticos no terminal | 6605c64, 92dec8d |
| U3-04 entrada e saída seguras | 759b9f5, 9ae4c7f |
| U3-05 pendências do gate 2 | 4908196, 93fa892, e147c12 |
| U3-06 `traduz` e `vê_se_tá_certo` | f909e34, 0d79045, dff2f47 |
| U3-07 `bota_pra_moer` | 1648138, 673e0f1 |
| U3-08 `explica` e `dedo_de_prosa` | 5a17080, 54cea9a |
| U3-09 `arma_o_barraco` | d553174, 1c1a5c1, 0bb3c4a |
| U3-10 motor do REPL | 1c3a23f, 5c461f6 |
| U3-11 Roda de Prosa | e2c47c6, a3e53b2, 27c76af, 78eb889 |
| U3-12 build, API e tarball | fbd9fda, ba26f32 |
| U3-13 E2E do tarball | 653ea4c, 07f6241, e3ef801 |
| U3-14 `release.yml` do alpha | 5c16c63, 27a231a |
| U3-15 revisão de segurança | 2046e36, 39d78c6, 2a6c660 e o commit deste relatório |

## 2. Cobertura por pacote (`vitest run --coverage`)

| Pacote | Linhas | Ramos | Funções |
| --- | --- | --- | --- |
| cli | 97,99% | 89,52% | 97,58% |
| compiler | 99,73% | 95,83% | 99,83% |
| language | 100% | 100% | 100% |
| optimizer | 100% | 80,00% | 100% |

Total: 1.559 testes passando, 3 ignorados, 122 arquivos. Instruções 98,67%, ramos 94,29%, funções 99,07%, linhas
99,25% (3309/3334). O piso por pacote é 80% e o `verify` sai 0. O diretório `packages/cli/src/entry` fica fora da cobertura
(bins finos) e é exercido pelo E2E do tarball.

## 3. E2E do tarball instalado

| Sistema | Node | Resultado |
| --- | --- | --- |
| Linux (Ubuntu, esta máquina) | 26.11.1 | 9 arquivos, 52 testes passando |
| Ubuntu, Windows e macOS | 22 e 24 | **pendente**: sem resultado da CI anexado; roda na CI (`promises-gate.yml`, job `tarball`, seis combinações) e de novo no `release.yml` com Node 24 |

Só o Linux foi executado aqui; as outras cinco combinações dependem da CI e **não foram medidas por este relatório**.

## 4. Saídas medidas do `pergunta` e do GS0703

Programa: duas `pergunta` seguidas e um `prosa` que junta as respostas. `bota_pra_moer` sobre o `dist` desta máquina.

| Variante | Entrada | Resultado |
| --- | --- | --- |
| i. tudo de uma vez, LF | `Ana\nGoiânia\n` | `Ana de Goiânia`, exit 0 |
| ii. tudo de uma vez, CRLF | `Ana\r\nGoiânia\r\n` | `Ana de Goiânia`, exit 0 |
| iii. segunda linha 300 ms depois | `Ana`, pausa, `Goiânia` | `Ana de Goiânia`, exit 0 |
| iv. uma linha e fim da entrada | `Ana\n` | `erro GS0702: Acabou a entrada, sô: ...`, exit 2 |

GS0703 (promessa que nunca resolve): `erro GS0703: O programa ficou esperando uma resposta que nunca veio, sô.`, exit 2,
processo encerrado em 0,06 s de relógio (sem esperar o fim da fila de eventos). O E2E `question-pipe.e2e.ts` fixa que a
resposta com o escritor da entrada ainda aberto fecha em menos de 1 s.

## 5. Matriz de nomes (o CLI nunca apaga nem sobrescreve o seu `.gs`)

`name-matrix.e2e.ts` roda `traduz` e `bota_pra_moer` com cada nome, confere o hash do fonte antes e depois, que nada
foi executado a partir do nome (`PWNED` não existe) e que um `x.temp.js` pré-existente ficou intacto.

| Nome | Resultado esperado |
| --- | --- |
| `x.txt`, `x` | recusado com GS0902, exit 3, pasta intacta |
| `x.gs`, `X.GS` | funciona |
| `e.gs/f/programa.gs` | funciona (pasta com nome terminado em `.gs`) |
| `nome com espaço.gs` | funciona |
| `a$(touch PWNED).gs` | funciona, sem executar |
| `` `touch PWNED`.gs ``, `a";touch PWNED;".gs` | funciona, sem executar (fora do Windows) |
| `-x.gs` | funciona depois de `--` |
| `café.gs` (NFC) e `café.gs` (NFD) | funciona |

Mais as recusas de saída: saída igual à entrada, hard link para o fonte e destino existente sem `--sobrescreve`
(`name-matrix.e2e.ts`, bloco "recusas de saída").

## 6. Revisão de segurança e disposição

**Como foi feita.** A ferramenta de subagente não estava disponível na execução deste relatório; a revisão foi feita
direto pelo executor da unidade, com o checklist do plano, lendo o código de `packages/cli/src`, `scripts/{build-cli,pack-cli,release-target}.ts`
e os dois workflows, e **atacando o `dist` real** com entradas hostis (comandos na seção 6.2). Não é a revisão em contexto
fresco que o aceite pede: **o dono deve rodar o `security-reviewer` independente antes de fechar o GATE 3**, usando esta
tabela como ponto de partida. Perímetro ignorado: `packages/core`, `node_modules`, `dist`.

### 6.1 Achados

| # | Severidade | Onde | Descrição | Disposição |
| --- | --- | --- | --- | --- |
| 1 | MEDIUM | `run/program-runner.ts` | Pasta temporária ausente ou sem permissão (`TMPDIR` inválido) lançava `CliFileError` sem tratamento: pilha do motor e caminho do sistema na tela, exit 1. | **Corrigido** em 2046e36, teste `temp-workspace-failure.test.ts` visto RED antes. Agora GS0903 de preparo, exit 3 (`EXIT_CODE.usage`); a varredura de órfãos engole falhas de listagem e o teste cobre `TMPDIR` inexistente. |
| 2 | MEDIUM | `diagnostics/source-window.ts` | `lineOf` refazia o `split` do arquivo inteiro a cada diagnóstico: renderização quadrática (arquivo de 4.000 linhas com 244 mil diagnósticos levou 24 s; 20.000 linhas passou de 120 s). Negação de serviço contra o próprio usuário. | **Corrigido** em 39d78c6, teste `render-diagnostic-scale.test.ts` visto RED (6,1 s contra teto de 2,5 s). A quebra da última fonte fica em cache. |
| 3 | LOW | `compiler` (fora do perímetro do CLI) | O compilador também cresce acima do linear com muitos diagnósticos (`--json`: 1.000, 2.000 e 4.000 linhas levam 0,3 s, 0,9 s e 3,1 s). | Aceito neste gate; abrir ticket `GS-<n>` para o compilador (o número sai do dono). |
| 4 | LOW | REPL, compilador | Uma linha de 3 MB de um identificador só leva cerca de 18 s no REPL; 40 mil linhas por pipe levam 10,7 s (20 mil levam 3,2 s), com crescimento acima do linear (fila de linhas, histórico e sessão copiados a cada linha). | Aceito para o alpha: só afeta quem alimenta o REPL com entrada gigante. Ticket `GS-<n>` a abrir. |
| 5 | LOW | `real-io.ts` | `stdin.readAll` e `readBytes` não têm teto de tamanho. | Aceito: a entrada é do próprio usuário e o Node falha por memória; não há fronteira de confiança. |
| 6 | LOW | `repl/report-async-error.ts` | O relato de erro assíncrono do REPL não passa por `sanitizeForTerminal`. | Aceito com motivo: o texto vem do catálogo de diagnósticos e, testado com chave de objeto contendo ESC (`o[k]()` num timer), nenhum byte de controle chega ao terminal. Defesa em profundidade pode entrar junto do ticket 4. |
| 7 | LOW | `release.yml`, job `publish` | `npm install --global npm@12.2.1` roda com `id-token: write` ativo; a versão é fixa mas sem hash. | Aceito: o `npm stage` exige essa versão (§8.6) e o job só roda depois do ambiente `npm-release` aprovado. |
| 8 | INFO | `release.yml` | O `tarball.sha256` viaja no mesmo artefato que o tarball: detecta corrupção, não adulteração. | Aceito: a proteção contra adulteração é o ambiente com aprovação manual e a checagem de que o commit da tag está na `main`; a versão de dentro do tarball também é conferida contra a tag. |
| 9 | INFO | `bota_pra_moer`, `goias` | O `vm` do REPL não é fronteira de segurança. | Aceito e documentado: `bota_pra_moer` e `goias` executam o código do usuário com os poderes dele. Busca por "isola", "sandbox", "seguro" e "segurança" no texto de ajuda, mensagens do REPL e README do CLI: **nenhuma promessa de isolamento**. |

Nenhum achado CRITICAL ou HIGH.

### 6.2 Checklist do plano e evidência observada

- **Execução de comando pelo nome do arquivo:** nenhum `shell`, `exec` ou `spawn` em `packages/cli/src`; o único
  `child_process` do escopo é `execFile` com lista de argumentos em `scripts/pack-cli.ts`. Matriz de nomes na seção 5.
- **Travessia e escrita fora do alvo (`planOutput`, `arma_o_barraco`):** o nome do projeto só aceita
  `[\p{L}\p{N}][\p{L}\p{N}_.-]*` até 64 caracteres, sem barra. Saída com `--saida` aceita só pasta existente.
- **Link simbólico e físico:** `a.mjs` apontando para um arquivo, com e sem `--sobrescreve`: sem a opção recusa (GS0903);
  com a opção o `rename` troca o link e o arquivo apontado fica intacto (conferido: `victim.txt` ficou com o conteúdo
  original). Link simbólico pendente também é recusado. Hard link para o fonte é recusado por identidade de inode.
- **TOCTOU:** criação exclusiva (`wx`) em toda gravação sem `--sobrescreve`, que também não segue link simbólico; com
  `--sobrescreve`, temporário `wx` no mesmo diretório e `rename` atômico.
- **Permissões e temporários:** `mkdtemp` (modo 0700), `program.mjs` criado com `wx` dentro dele, remoção no evento
  `exit` e varredura de pastas velhas só do próprio usuário e só quando `lstat` diz que é pasta.
- **Sequência de controle no terminal:** nome de arquivo (entrada e saída), argumentos, texto do aluno no diagnóstico,
  mensagem do programa (`vixe`), nome de comando inexistente: nenhum byte `ESC`, `BEL` ou C1 chega cru à saída (verificado com `grep -P`
  em 10 invocações hostis). Eco e listagens do REPL escapam controle.
- **ReDoS e linha gigante no renderizador:** não há regex de custo polinomial nos caminhos do CLI; uma linha de cerca de 800 KB
  de fonte renderiza em 0,34 s e 92 MB; 300 mil `ESC` numa linha geram saída de cerca de 500 bytes (janela de 120 colunas).
- **`unhandledRejection` e `uncaughtException`:** o `bota_pra_moer` converte os dois em diagnóstico traduzido e sai com 2,
  sem pilha do motor (testado com `vixe`, `daqui_um_cadim` e promessa rejeitada). A única fuga era o achado 1.
- **Pipe fechado (EPIPE):** `bota_pra_moer many.gs | head -1` termina sem pilha.
- **Dependências embutidas (OSV):** o bundle embute `terser` 5.51.2 e suas dependências, no `optimizer.mjs`. `pnpm audit --prod`:
  "No known vulnerabilities found". O `osv.yml` roda na CI com o `pnpm-lock.yaml`; o `osv-scanner` não está instalado nesta máquina.
- **Workflows:** `release.yml` dispara só por tag `v3.*-alpha.*`; `permissions: contents: read` por padrão e `id-token: write`
  somente no job `publish`, que usa o ambiente `npm-release`; todas as actions presas por SHA; o `publish` confere que o
  commit da tag está na `main`, o sha256 do tarball baixado, a versão de dentro do tarball contra a tag, e publica o
  **mesmo** tarball dos testes com `--tag next --provenance`. `GITHUB_REF_NAME` só é lido por `release-target.ts` (nunca interpolado em shell).
  `promises-gate.yml` usa `pull_request` (não `pull_request_target`), sem segredos.

## 7. Ctrl+C em laço no REPL (parcial: pty, não terminal gráfico)

Verificado só num **pseudo-terminal do kernel** (módulo `pty` do Python, `goias.mjs` do `dist` como processo filho), com o
programa abaixo repetido 5 vezes: enviar `enquanto_tiver (certeza) { }`, esperar 0,8 s, enviar Ctrl+C (`\x03`), depois
`prosa(N)`. Resultado nas 5 rodadas: `Entrada interrompida, sô. A sessão continua de pé.` e o `prosa(N)` seguinte respondeu
`N`. Dois Ctrl+C seguidos no prompt vazio avisam e depois saem com código 0. Isto prova o caminho de TTY real, mas **não é um emulador de terminal gráfico**: a conferência manual do dono num terminal
de verdade continua no checklist (seção 11). A CI usa `readline` sobre streams com `terminal: true` (decisão 5 do plano).

## 8. Tamanhos

| Item | Medida |
| --- | --- |
| Tarball `goiasscript-3.0.0-alpha.0.tgz` | 252.109 bytes (12 arquivos, 1.184.527 bytes descompactados) |
| `dist` inteiro | 1.180.915 bytes de `.mjs` e `.d.ts` |
| `optimizer.mjs` (Terser embutido, carregado só quando preciso) | 896.780 bytes |
| `cli.mjs` | 73.296 bytes |

Bundle legível, sem minificar (decisão 8 do plano); o custo é o tamanho acima.

## 9. Divergências do spec e decisões do dono adotadas pelo padrão

- **Sem PTY na CI** (decisão 5): o spec (§8.2) cita PTY; o REPL é testado por `readline` com `terminal: true` e por E2E com pipe. Esta
  fase acrescentou a conferência em PTY da seção 7, feita à mão e não na CI.
- **Sem Changesets e sem job `compat`** (decisão 7): pré-requisito do `3.0.0`, Fase 9.
- **Sem cor, sem histórico em arquivo, sem mapa de fonte gravado** (decisão 6).
- **Nome npm** (decisão 1): `goiasscript` é o CLI novo e o legado vira `goiasscript-legacy`, privado.
- **GS0903 e erros de leitura** (decisões 2 e 3): o texto cobre pasta e `.gs`; leitura que falha usa GS0905 com detalhe.
- **`--json` só em `traduz` e `vê_se_tá_certo`** (decisão 4).
- **Revisão de segurança sem subagente em contexto fresco**: ver seção 6; pendente para o dono.

## 10. Riscos abertos

- E2E de Windows e macOS dependem da CI; o `pack-cli.ts` chama `corepack` por `execFile`, que no Windows pode exigir `corepack.cmd`.
  Só a CI do Windows prova isso.
- Achados 3 e 4 (desempenho em entradas gigantes) seguem sem ticket numerado.
- Trusted publisher expira em 2 dias sem publish validado: criar só imediatamente antes do primeiro publish.
- A mutação do Stryker cobre só o `compiler`; o pacote `cli` não entrou.

## 11. Checklist do dono para o primeiro publish

Só depois do GATE 3 e com o `release.yml` na `main`:

1. Criar o trusted publisher do `goiasscript` no npm apontando para este repositório e o workflow `release.yml`,
   imediatamente antes do primeiro publish.
2. Criar o ambiente `npm-release` no GitHub com aprovação manual.
3. Criar a tag `v3.0.0-alpha.0`.
4. Aprovar o stage com 2FA (`npm stage approve`).
5. Em até 2 dias, validar o publish (a configuração expira).
6. Conferir `npm view goiasscript dist-tags` (`next` aponta o alpha, `latest` intacto) e a página com provenance.
7. Registrar aqui que `--tag next` funcionou com publisher só de stage (§8.6), ou o que falhou.

Antes do item 1: rodar o `security-reviewer` independente (seção 6) e conferir o Ctrl+C num terminal gráfico (seção 7).

## 12. Mapa de rastreabilidade (§11 do spec) da Fase 3

| Afirmação | Prova |
| --- | --- |
| `goiasscript arma_o_barraco meu-projeto` | U3-13: `scaffold-steps.e2e.ts` gera o projeto e roda os próximos passos impressos |
| `goiasscript bota_pra_moer arquivo.gs` | U3-13: `shim.e2e.ts`, `question-pipe.e2e.ts`, `pending-promise.e2e.ts` |
| "O CLI nunca apaga nem sobrescreve o seu `.gs`" | matriz de nomes (seção 5): `name-matrix.e2e.ts` |
| "Roda de Prosa" (`goias`) | `repl-loop.test.ts` e `repl-pipe.e2e.ts` |
| `npm install -g goiasscript` e versão | smoke pós-publicação (Fase 9) |
