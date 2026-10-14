# Auditoria — Governança, extensão VS Code e histórico (GoiásScript 1.5)

> Escopo: regras e instruções (CLAUDE.md, `.github/`, camadas globais), documentação, `vscode-extension/`, histórico git (branches, tag, commits, protótipo Rust, `archive/v2-experimental`) e metadados do GitHub.
> Data: 2026-10-13. Base: `origin/main` = `2cf8946` (PR #6); a branch de trabalho `feat/v1.5-launch-playground-engoianador` tem o mesmo conteúdo.
> Marcação: **[VERIFICADO]** = comando ou leitura executados nesta sessão; **[KNOWN-FACTS]** = fato herdado de `KNOWN-FACTS.md`, não reverificado; **[HIPÓTESE]** = inferência não executada.
> Severidade segue a tabela de `code-review.md` das regras globais: CRITICAL = vulnerabilidade de segurança ou risco de perda de dados; HIGH = bug ou problema significativo; MEDIUM = manutenibilidade; LOW = estilo ou sugestão.
> Matriz de conformidade: OK = conforme, PARCIAL = parcialmente conforme, NÃO = não conforme (os três estados da matriz do digest).

## Resumo executivo

1. A disciplina de entrega recente é boa: 24 de 25 commits desde o relançamento seguem `<type>: descrição`, o CI está verde nas últimas execuções e a varredura de segredos em 71 commits não encontrou nada. A camada de governança, porém, ficou para trás do produto 1.5.
2. As instruções para agentes descrevem outro produto: 11 de 16 afirmações verificáveis do `CLAUDE.md` são falsas (gs-balaio, gs-fuçá, JIT, tipos, módulos, `.gritando()`...) e `.github/copilot-instructions.md` aponta para arquivos que não existem mais.
3. A linguagem não tem especificação única: 9 fontes independentes do vocabulário divergem entre si, e o contrato público do 1.0.x foi quebrado sem registro (13 palavras removidas, 4 novas, nada no CHANGELOG).
4. Não existe nenhum ADR ou RFC. As decisões vivem em commits, num `KEEP-OR-ARCHIVE.md` já vencido e num plano retirado do git em 2026-05-04 que continua público no histórico. Resultado: três conflitos de produto abertos (alvo de deploy, limites do Engoianador, versão no npm).
5. A extensão VS Code não é publicável como está. Há 1 achado CRITICAL (injeção de comando via nome de arquivo, com PoC), 6 de 8 comandos sem handler e LSP e debugger apontando para arquivos arquivados. Veredito: reciclar os ativos (gramática cobre 50 de 53 mapeamentos, configuração de linguagem, logo) e recriar a casca.
6. O protótipo em Rust (abril/2025) vale só como referência: gera Rust, não JavaScript; o lexer reconhece 35 das 53 chaves e o parser cobre bem menos da gramática (sem acesso a membro, arrays, objetos, setas, classes); tem 0 testes; o último snapshot não compila. Ele responde por 88% do peso do repositório (584 arquivos de `target/` commitados).
7. Higiene: `main` sem proteção, nenhuma tag `v1.5.0` nem release, 7 branches (2 órfãs com correção não portada, 3 refs no mesmo commit), `.gitignore` incoerente com o monorepo, `husky` sem hook, PRs sem nenhum review.
8. Bloqueadores antes de qualquer divulgação: F01 (injeção), F05 (README manda instalar do npm outro produto), F06 (canais de segurança inoperantes) e F08 (Pix placeholder e Sponsors inexistente).

## Metodologia, limites e desvios

- Leitura via `git show`, `git log`, `git ls-tree`, `git grep` e `git archive`, sem checkout, sem editar, sem stage, commit ou push, sem install. Estado final de `git status`: limpo, exceto `research_notes/` (untracked, criado por outra sessão; não é desta auditoria).
- Rede usada somente por `gh` em modo leitura (REST e consultas GraphQL de leitura) e por `cargo build`/`clippy` no protótipo Rust (o build não falhou por rede; não verifiquei se baixou crates). `npm`, `vsce` e o VS Code não foram executados; o estado do npm é [KNOWN-FACTS].
- Desvios do pedido, todos em arquivos de texto dentro do scratchpad e sem execução do conteúdo: (a) do `goiasscript-2.2.0.vsix` extraí 5 arquivos de texto (manifest, `extension.js`, gramática, snippets, README) além do `unzip -l`, para comparar com o código-fonte (resultado: idênticos); (b) o Rust foi extraído em três commits (`adee62c` como pedido, mais `e180182` e `7e1a2c6` para comparar), sempre sem `target/`.
- As sondagens do transpiler usam `packages/core/src/browser.js` (o mesmo caminho do playground) com execução em `vm` e timers neutralizados. Scripts e saídas: `probes-gov/` (Anexo F).
- Itens que dependem de conhecimento externo (datas de fim de vida do Node, comportamento do `vsce`, Workspace Trust, colisão da extensão `.gs`) estão marcados como [HIPÓTESE].

## Métricas

| Métrica | Valor |
|---|---|
| Documentos `.md` rastreados | 19 (mais 4 locais ignorados em `docs/plano/`) |
| Camadas de regra/instrução ativas em sessões deste repo | 7 (hooks, CLAUDE.md global, `rules/common`, `rules/typescript`, `personal-projects/.claude/rules` (9 arquivos), CLAUDE.md do projeto, `copilot-instructions.md`) |
| ADRs / RFCs | 0 / 0 |
| Dias sem editar `CLAUDE.md` | 394 (última edição 2025-09-14); o slim-down que o invalidou é de 2026-05-03 |
| Dias desde o último commit do repositório | 134 (2026-06-01) |
| Fontes independentes do vocabulário | 9 (transpiler, lexer morto, TextMate, Monarch, snippets, REPL, README, CLAUDE.md, METODOS_GOIANOS) |
| Chaves canônicas do transpiler | 53 (55 entradas; `rejeita_isso` e `resolve_aí` duplicadas em `simpleTranspiler.js:143-144` e `:161-162`) |
| Vocabulário 1.0.x -> 1.5 | 49 mantidas, 13 removidas, 4 novas |
| Chaves citadas em algum teste (excluindo `lexer.test.js`) | 27/53 |
| Testes que cobrem código morto (`lexer.test.js`) | 23 de 85 (27%) |
| Chaves em nenhum dos 10 markdown analisados / em nenhum exemplo `.gs` / em nenhum dos dois | 11 / 16 / 5 |
| Exemplos `.gs` rastreados que geram JS válido | 6/15 |
| Blocos de código `goiasscript` nos docs | 25: 15 rodam, 7 são fragmentos, 3 falhas reais |
| Snippets da extensão que o 1.5 traduz | 21/37 |
| Gramática TextMate sobre as 53 chaves | 50 com escopo, 3 sem; 0 de 453 ocorrências sem escopo nos 15 exemplos |
| Comandos do manifest com handler | 2/8; 4 pontos de menu/atalho quebrados; 7 settings declarados e 0 lidos |
| VSIX 2.2.0 | 328 arquivos, 3,05 MB; 313 (95%) são `node_modules` do cliente LSP que não conecta |
| Commits (todas as refs) | 71 (64 sem merges), 3 identidades de autoria (1 bot) |
| Conventional Commits | 51/64 (80%) no total; 24/25 (96%) desde 2026-05-03; com escopo: 3/64 |
| PRs | 6 (0 com review); PR #5 mesclado 6 min 37 s após abrir |
| Branches remotas / tags / releases | 7 / 1 / 0 |
| Peso do pacote git | 60,4 MiB; 7,0 MiB sem o protótipo Rust (88,3% do peso) |
| Segredos no histórico (71 commits, arquivos e padrões) | 0 acertos |
| `archive/v2-experimental` | 140 arquivos de texto, 25.892 linhas (+16.222 em lockfiles), 36 `.gs` (4.317 linhas), 3 rodam no 1.5 |
| Protótipo Rust | 1.488 linhas (`adee62c`) a 1.630 (`7e1a2c6`); 0 testes; 2 de 3 snapshots compilam |
| `.gitignore` | 9 arquivos rastreados casam regras de ignore; 1 padrão morto (`./docs`) |

## Achados

### [CRITICAL] F01 — Injeção de comando no terminal pelo nome do arquivo (extensão VS Code)

- Evidência: `vscode-extension/src/extension.js:74` e `:93` montam uma linha de shell com o caminho do documento e a enviam ao terminal:
  ```js
  terminal.sendText(`goiasscript traduz "${document.fileName}"`);        // :74
  terminal.sendText(`goiasscript bota_pra_moer "${document.fileName}"`); // :93
  ```
  PoC [VERIFICADO, simulando em bash o texto que `sendText` digita; o VS Code não foi executado]: o arquivo real `x$(touch PWNED_PELO_NOME).gs` faz o `$(...)` ser expandido dentro das aspas duplas e cria `PWNED_PELO_NOME`; o arquivo `a";touch PWNED_ASPAS;".gs` fecha as aspas e executa o segundo comando (cria `PWNED_ASPAS`). Roteiro de reprodução e marcador em `probes-gov/inj/` (`POC.txt`, `PWNED_ASPAS`); os arquivos com nomes-payload foram removidos depois da prova.
- Regra/critério violado: `security.md` (validar entrada, prevenir injeção); `code-review.md` classifica vulnerabilidade de segurança como CRITICAL.
- Impacto: execução arbitrária de comandos ao acionar "Traduzir" ou "Botar pra Moer" (menu, atalho `ctrl+shift+g ctrl+t/r`) sobre um `.gs` com nome malicioso, por exemplo num repositório clonado de terceiros. Exposição hoje limitada: a extensão não está publicada [KNOWN-FACTS] e exige ação do usuário [HIPÓTESE: sem `capabilities.untrustedWorkspaces`, o VS Code não ativa extensões com código em Modo Restrito]. Publicada como está, seria uma vulnerabilidade distribuída. Classificado CRITICAL pelo critério literal das regras; quem consolidar pode ponderar a exposição e rebaixar.
- Recomendação: não montar linha de shell. Usar `vscode.tasks.executeTask` com `new vscode.ShellExecution(cmd, [args])` (o VS Code aplica o quoting de cada shell) ou `child_process.execFile` com saída num `OutputChannel`; ler `goiasscript.compilerPath` (declarado e nunca lido); validar `document.uri.scheme === 'file'`; declarar `capabilities.untrustedWorkspaces: { supported: false }`; teste automatizado com nomes contendo `$()`, crase, aspas, `;` e espaço.

### [HIGH] F02 — Quebra silenciosa de compatibilidade 1.0.x -> 1.5 e dois vocabulários coexistindo

- Evidência: o compilador 1.0.x (`git show b2fdb21:goiasscript.js`, `this.keywords` em `:229-318`) tinha 62 entradas; o 1.5 (`packages/core/src/compiler/simpleTranspiler.js:89-172`) tem 53 chaves. Mantidas 49, todas com a mesma tradução JS. **Removidas 13**: `presta_serviço`, `vai_na_frente_presta_serviço`, `mexe_assim`, `lista`, `um_tanto_de`, `tem`, `vixe_que`, `vazio`, `sei_lá`, `ninguem_fuça`, `só_da_famia`, `todo_mundo_vê`, `fixo`. **Novas 4**: `faz_trem`, `vai_na_frente_faz_trem`, `nada`, `indefinido` (`probes-gov/compat-1.0.out.txt`). O `CHANGELOG.md` não registra a remoção (zero ocorrências de `presta_serviço`; a seção "Arquivado" do `1.5.0-rc.1` lista módulos, binários, templates e docs, mas nenhuma palavra da linguagem). Ainda usam a palavra antiga 14 arquivos rastreados: 9 `.gs` (8 deles geram JS inválido no 1.5), `vscode-extension/README.md:29`, `CONTRIBUTING.md:177`, `.github/copilot-instructions.md`, `lexer.js` (código morto) e `cli/index.js`. A gramática TextMate e a Monarch mantêm `vazio`, `sei_lá`, `ninguem_fuça`, `só_da_famia`, `todo_mundo_vê`, `fixo` e `tem`, herdados do 1.0.
- Regra/critério violado: Keep a Changelog (o próprio `CHANGELOG.md:5-6` se compromete; remoções vão em "Removido"); SemVer; ausência de política de compatibilidade (nenhum ADR/RFC).
- Impacto: o contrato público da linguagem mudou entre o 1.0.x e o 1.5 (passando pela v2 nunca lançada) sem aviso. Código escrito no 1.0 deixa de funcionar sem mensagem útil, e a documentação ensina as duas ortografias.
- Recomendação: ADR-0003 e RFC-0001 "Legado 1.0": decidir alias deprecado `presta_serviço -> faz_trem` com aviso goiano e prazo de remoção; publicar `docs/language/legado-1.0.md` com a tabela de migração; registrar a quebra no CHANGELOG como "Removido"; migrar os 9 `.gs`, o README da extensão e o CONTRIBUTING.

### [HIGH] F03 — Sem fonte única da especificação: nove listas de vocabulário divergentes

- Evidência [VERIFICADO: `probes-gov/drift.js`, `grammar-coverage.js`, `claims.js`]:

| Fonte | Termos | Divergência medida |
|---|---|---|
| Transpiler `simpleTranspiler.js:89-172` | 53 chaves | referência |
| `lexer.js` (só `lexer.test.js` o usa [KNOWN-FACTS]) | 52 | `presta_serviço`, `vazio`, `sei_lá` fora do transpiler; sem `faz_trem`, `vai_na_frente_faz_trem`, `nada`, `indefinido` |
| TextMate `tmLanguage.json` | 104 | 55 fora do transpiler (`se`, `senao`, `diferente_de`, `vazio`, `fixo`, `pega`, `troca_ideia*`, tipos, 17 decoradores `@Componente`...); 3 das 53 sem escopo |
| Monarch `apps/playground/lib/monaco-goias.ts:9-102` | 78 | 31 fora (`se`, `senao`, `pega`, `tem`, `num`, tipos...); 6 das 53 ausentes (`promessa`, `quando_resolver`, `se_der_pobrema`, `resolve_aí`, `rejeita_isso`, `vai_na_frente_faz_trem`) |
| `CLAUDE.md:93-127` | 33 | 3 inexistentes (`se`, `senao`, `fazer`); 23 das 53 ausentes (classes, async, promise, try/catch) |
| README (tabelas) | 22 | corretas, mas só 22/53 |
| `docs/METODOS_GOIANOS.md` | métodos | `:309` usa `se`; `:16` promete bloqueio que não existe; `:198-199` quebra (F22) |
| REPL `bin/goias.js:296-297, 358-366, 399-408` | ajuda e autocompletar | anuncia `.gritando()`, `.cochichando()`, `.tem_no_meio()`, `.bota_no_final()`, `.arranca_o_rabo()` e `GoianoMath.sorteia_um()`, que não existem no runtime |
| Snippets | 37 | 16 geram código que o 1.5 não traduz (Anexo D.3) |

  Reprodução: `prosa("oi".gritando())` -> `TypeError: "oi".gritando is not a function`; `prosa(GoianoMath.sorteia_um())` -> `TypeError`; `se (x maior_que 1) { ... }` -> `SyntaxError: Unexpected token '{'`. Os mesmos nomes inexistentes aparecem em `CLAUDE.md:156-171`, no REPL e na gramática (`tmLanguage.json:109`). Cobertura documental: 11 das 53 chaves não aparecem em nenhum dos 10 markdown analisados, 16 em nenhum exemplo e 5 em nenhum dos dois (`vai_na_frente_faz_trem`, `num_muda`, `para_com_isso`, `continua_aí`, `por_fim`).
- Regra/critério violado: o próprio `copilot-instructions.md` (§5 e §7) exige atualizar docs e gramática "atomicamente" a cada mudança de mapeamento; nada impõe isso. Regra global `coding-style.md` (alta coesão, baixo acoplamento).
- Impacto: cada mudança de linguagem exige edição manual em 9 lugares e a divergência já aconteceu em todos. Usuário recebe autocompletar e ajuda de métodos que explodem em execução.
- Recomendação: ADR-0003. Criar `docs/language/keywords.json` (ou exportar a tabela do core) e um gerador `pnpm spec:build` que produza o TextMate, o Monarch, os snippets, as tabelas do README/METODOS e a ajuda do REPL; check `pnpm spec:check` no CI que falha se houver diff; testes golden por palavra (hoje 27/53 são citadas em testes).

### [HIGH] F04 — `CLAUDE.md` e `copilot-instructions.md` descrevem um produto que não existe mais

- Evidência: Anexo B (16 afirmações do `CLAUDE.md`: 11 falsas, 3 parciais, 1 conflito de camada, 1 irrelevante). O arquivo foi editado pela última vez em 2025-09-14 (`a8155f1`), 394 dias atrás; 231 dias separam essa edição do slim-down de 2026-05-03. Está rastreado (`git ls-files CLAUDE.md`) e ao mesmo tempo listado em `.gitignore:38` (`git ls-files -ci` o lista). `.github/copilot-instructions.md` (2025-09-13) descreve um transpilador de arquivo único `goiasscript.js` (removido em `1.5.0-rc.1`), `GoiasScriptCompiler.keywords`/`patterns`, `traduzirErroJS`, `vixe_que -> vixeGoiano`, `vm.runInNewContext` e a pasta `goiasscript-language/goiasscript/`: `git grep` em `HEAD` retorna 0 ocorrências de `vixeGoiano`, `traduzirErroJS`, `this.patterns`, `runInNewContext` e `goiasscript-language`. O §9 ainda diz "Do NOT replace the tokenization with a full parser unless explicitly requested", o que restringe uma questão que deveria ser decidida em ADR (ADR-0004).
- Regra/critério violado: CLAUDE.md global ("Não invente nem assuma: sempre verificar"); `subagent-delegation-and-ui.md` (subagents e contribuidores não herdam contexto, então instruções erradas se propagam).
- Impacto: qualquer agente ou contribuidor que siga esses arquivos tenta criar `gs-balaio`, editar `goiasscript.js` ou usar `se`/`senao`, e reintroduz nomes que o CHANGELOG diz terem sido arquivados.
- Recomendação: Anexo C.1. Reescrever o `CLAUDE.md` (≤ 80 linhas, verificável contra o código), reduzir `copilot-instructions.md` a um ponteiro de 3 linhas, remover `CLAUDE.md` e `.claude/` do `.gitignore` (manter só `settings.local.json` ignorado).

### [HIGH] F05 — Distribuição incoerente: README manda instalar do npm um produto diferente; versão regrediu; sem tag nem release

- Evidência: `README.md:19-20` ("Via npm (a partir do release v1.5.0): `npm install -g goiasscript`"). O npm só tem `goiasscript@2.0.0` (2025-09-14, o monólito arquivado com bins `gspack`, `gsrepl`, `gs-fuça`...) e a 1.5.0 nunca foi publicada [KNOWN-FACTS]. Histórico da versão no `package.json` [VERIFICADO: `git log -- package.json`]: 1.0.0 -> 1.0.1 -> 1.0.3 (abril/2025) -> 1.1.0 (2025-09-12) -> 2.0.0 (2025-09-13) -> 1.5.0-rc.1 (2026-05-03): a versão regrediu depois de publicar a 2.0.0. `CHANGELOG.md:8-12` declara a 1.5.0 como lançada em 2026-05-21 e diz que o pacote "sai do -rc" (nunca houve `-rc` no npm); o PR #6 só foi mesclado em 2026-06-01. `git tag -l`: apenas `v2.0-pre-archive`; `gh release list`: vazio; `.github/workflows/` só tem `ci.yml` (sem release). `packages/core/package.json:61-70` lista `README.md`, `LICENSE` e `CHANGELOG.md` em `files`, mas os três não existem em `packages/core/`. `packages/core/templates/template-info.json:26` ainda diz `"versao": "1.5.0-rc.1"`. O scaffold gera `engines.goiasscript: '^2.0.0'` (`bin/goiasscript.js:317`) e textos "GoiásScript v2.0" (`:209, :221, :226, :330, :508`) [VERIFICADO: `arma_o_barraco` em pasta temporária produziu `main.gs` com "GoiásScript v2.0" e `package.json` com `^2.0.0`].
- Regra/critério violado: SemVer e Keep a Changelog (`CHANGELOG.md:5-6`); fluxo de release (tag + notas) ausente.
- Impacto: quem seguir o README instala outro produto e conclui que o projeto está quebrado; publicar a 1.5.0 como `latest` é recusado pelo npm 11 [KNOWN-FACTS]; o CHANGELOG afirma um lançamento que não ocorreu.
- Recomendação: ADR-0005 (opções: publicar como 3.0.0 e rodar `npm deprecate` na 2.0.0; ou dist-tag; ou novo nome de pacote). Criar `release.yml` (tag `vX.Y.Z` -> `npm publish --provenance` -> GitHub Release com as notas do CHANGELOG); só depois taguear. Corrigir `files`, scaffold, `template-info.json` e README no mesmo PR; manter `[Unreleased]` no CHANGELOG.

### [HIGH] F06 — Canais de segurança e de conduta inoperantes; `SECURITY.md` vencida

- Evidência: `SECURITY.md:21` ("gefferson.souza+security@example.com") e `CODE_OF_CONDUCT.md:36` ("gefferson.souza@example.com") usam o domínio reservado `example.com` [VERIFICADO]. `gh api repos/Gefferson-Souza/goiasscript/private-vulnerability-reporting` retorna `{"enabled":false}`. `SECURITY.md:9-11` lista apenas 1.1.x e 1.0.x como suportadas (1.5.x e 2.0.0 não constam); `:36` promete resposta em 48 h; o escopo inclui "Extensão VS Code oficial", que não foi publicada. Configurações do repositório: `dependabot_security_updates: disabled`, `hasVulnerabilityAlertsEnabled: false`, sem `dependabot.yml`, sem CodeQL; secret scanning e push protection estão ativos (bom).
- Regra/critério violado: `security.md` (protocolo de resposta); expectativa de GitHub Community Standards.
- Impacto: não existe canal privado funcional para relatar vulnerabilidade, num projeto que agora expõe um Worker com chave de LLM e um playground que executa código do usuário [KNOWN-FACTS]. Quem tentar seguir o `SECURITY.md` envia e-mail para lugar nenhum.
- Recomendação: ADR-0012. Ativar GitHub Private Vulnerability Reporting, reescrever o `SECURITY.md` (versões suportadas = última minor, escopo real, canal real, prazo realista para um projeto mantido por uma só pessoa), trocar o contato do `CODE_OF_CONDUCT.md`, ativar Dependabot alerts e security updates e adicionar `dependabot.yml` para `npm`/`github-actions`.

### [HIGH] F07 — Extensão VS Code não publicável como está (manifest × implementação)

- Evidência: Anexo D.1. Resumo: 8 comandos declarados (`package.json:119-168`) e 2 registrados (`extension.js:59, 78`); `debuggers[0].program = ./out/debug/goianoDebugAdapter.js` (`package.json:63`) não existe; `extension.js:11-46` inicia um `LanguageClient` apontando para `../lsp-server/server.js`, que não existe (`client.start()` sem `await` nem `catch`); 7 settings declarados e nenhum lido (`getConfiguration` ausente); `engines.vscode ^1.80.0` contra `vscode-languageclient@9.0.1`, que exige `^1.82.0` (`package-lock.json`); descrição diz "Framework 2.1", versão 2.2.0, lock em 2.1.0, script `install-extension` aponta para `goiasscript-0.3.0.vsix`; sem `LICENSE`, sem `.vscodeignore`; o VSIX 2.2.0 empacota 328 arquivos (313 de `node_modules`). Os comandos chamam `goiasscript` do PATH, e o único `goiasscript` instalável do npm é a 2.0.0 [KNOWN-FACTS].
- Regra/critério violado: boas práticas de publicação do `vsce` (Anexo D.4); `coding-style` (sem código morto); promessa do README raiz ("Extensão VSCode (Marketplace)", `README.md:211`).
- Impacto: ativar a extensão gera erro do LSP; 2 dos 4 atalhos e 2 itens de menu apontam para comandos que não existem; F5 em `.gs` falha pela configuração de debug.
- Recomendação: veredito "reciclar ativos, recriar a casca" (Anexo D.5).

### [HIGH] F08 — Doações: chave Pix placeholder e Sponsors inexistente no código do playground

- Evidência: `apps/playground/components/DonationLinks.tsx:4-7`:
  ```ts
  // Chave Pix do projeto. Trocar pela chave real antes do lançamento.
  export const PIX_KEY = 'goiasscript@proton.me';
  const SPONSORS_URL = 'https://github.com/sponsors/Gefferson-Souza';
  const KOFI_URL = 'https://ko-fi.com/goiasscript';
  ```
  O comentário de troca entrou em `2066cac` (2026-06-01) e foi mesclado em `main`. `gh api graphql` -> `user(login:"Gefferson-Souza"){hasSponsorsListing}` = `false` [VERIFICADO]; a URL de Sponsors leva a uma página inexistente. Não há `.github/FUNDING.yml`. A existência da conta no Ko-fi não foi verificada (rede restrita) [HIPÓTESE: pode não existir]. A chave Pix é um e-mail que o próprio comentário chama de provisório.
- Regra/critério violado: `security.md` (nenhum valor placeholder em produção); comentário que registra pendência no código (R2/R3 de `comments.md`, e `TODO` sem ticket).
- Impacto: ao lançar, o fluxo de dinheiro aponta para uma chave não confirmada e para um perfil de Sponsors que não existe. Se o e-mail pertencer a terceiros, os apoiadores pagam a um desconhecido.
- Recomendação: tornar os três links configuráveis por variável de ambiente com falha explícita se ausentes em produção; criar o perfil de Sponsors ou remover o link; confirmar a chave real antes do deploy; adicionar `FUNDING.yml`; teste E2E que falha se a chave for o valor de exemplo.

### [HIGH] F09 — Exemplos e blocos de documentação que não executam

- Evidência [VERIFICADO: `probes-gov/examples-run.js`, `doc-blocks.js`]:
  - 9 dos 15 `.gs` rastreados geram JS inválido no 1.5: `advanced/teste_classes.gs`, `teste_classes_simples.gs`, `teste_instanceof.gs`, `async/async_exemplo.gs`, `basic/exemplo_simples.gs`, `classes/exemplo_classes.gs`, `templates/projeto-basico/src/main.gs`, `templates/projeto-basico/tests/test.gs`, `tests/fixtures/test-basic.gs`. Oito deles usam `presta_serviço` (F02).
  - 25 blocos `goiasscript` nos docs: 15 rodam; 7 são fragmentos (variável não definida, aceitável); 3 são falhas reais: `README.md:170` (a linha começa com `[` e se cola ao `trocar(...)` da linha 167, armadilha de ASI: `TypeError: "Oi sô".trocar(...)[(1 , 2 , 3)].mapear is not a function`), `docs/METODOS_GOIANOS.md:198-199` (`GoianoMath.PI`/`.E` viram `GoianoGoianoMath`: ReferenceError; bug em `simpleTranspiler.js:271-272`), `docs/METODOS_GOIANOS.md:309` (`se (...)` não existe).
  - `packages/core/examples/README.md` descreve pastas `/modules/` e `/performance/` e comandos `gs-fuça`, `gs-balaio` inexistentes, "v2.0" e links para `../ROADMAP.md` e `../README.md` (ambos ausentes em `packages/core/`).
  - O exemplo principal do README (`README.md:39`, `:98`, `:138`) roda; o fluxo `arma_o_barraco` -> `bota_pra_moer` gera um projeto que executa [VERIFICADO].
- Regra/critério violado: regra global sobre tarefas visuais e de integração (`subagent-delegation-and-ui.md` §2: "pronto" é evidência observada, não código que parece certo); `testing.md` (exemplos como teste).
- Impacto: a primeira impressão de quem copia um exemplo do repositório é um erro de sintaxe, em 60% dos casos.
- Recomendação: job de CI `docs:test` que extrai os blocos `goiasscript` dos markdown e roda todos os `.gs` rastreados pelo transpiler, falhando em `SyntaxError`; migrar ou apagar os 9 exemplos; corrigir `README.md:167-170` com `;`; remover `se`/`senao` dos docs ou implementá-los (ADR-0003).

### [HIGH] F10 — Decisões de produto conflitantes e sem registro (deploy, domínio, limites, modelo de LLM)

- Evidência:
  - Alvo de deploy: `README.md:183, 208` e `apps/playground/README.md:28-31` dizem Vercel; os planos locais `docs/plano/index.md:6, 61`, `PLANO-RELANCAMENTO.md:104-112` e `STACK-ZERO-CUSTO.md:59-81` dizem Cloudflare Pages (`goiasscript-web.pages.dev`); o código fixa `https://playground.goiasscript.com.br` em `apps/engoianador-api/wrangler.toml:7`, `apps/playground/app/layout.tsx:6`, `apps/playground/lib/share.ts:3` e `apps/playground/app/opengraph-image.tsx:59`, e o domínio não está registrado [KNOWN-FACTS].
  - Limite de uso: `README.md:198`, `apps/engoianador-api/README.md:12, 62` e `CHANGELOG.md:26` dizem "10 req/min/IP"; o código usa janela diária de 20 (`apps/engoianador-api/src/rate-limit.ts:8, 40`; `wrangler.toml:8`), alterado em `a27cd41` (2026-06-01), no mesmo PR, sem atualizar a documentação.
  - Modelo: `apps/engoianador-api/src/engoiana.ts:13` fixa `llama-3.1-70b-versatile`, descontinuado pela Groq em 2025-01-24 [KNOWN-FACTS]; o id do KV é placeholder (`wrangler.toml:19`).
- Regra/critério violado: ausência de ADR; `security.md` (nenhum valor placeholder em produção).
- Impacto: três respostas diferentes para "onde roda, quanto custa, quanto posso usar"; o Worker não sobe como está.
- Recomendação: ADR-0006 (hospedagem e URL canônica, configurada por `NEXT_PUBLIC_SITE_URL` e `ALLOWED_ORIGINS` por ambiente) e ADR-0007 (provedor, modelo em `vars`, quota, política quando o provedor descontinua o modelo); alinhar README, apps READMEs e CHANGELOG ao código no mesmo PR.

### [MEDIUM] F11 — Conflitos entre camadas de regras

- Evidência (tabela de conflitos; ordem de precedência declarada: hooks > CLAUDE.md global > `rules/common` > `rules/typescript` > CLAUDE.md do projeto):

| Tema | Camada A | Camada B | Prática medida | Resolução proposta |
|---|---|---|---|---|
| Idioma dos comentários | `CLAUDE.md:150` "Comentários de código interno" em inglês | `comments.md` R3: português | 201 PT, 50 EN, 80 ambíguos nos `.js/.ts` rastreados (`probes-gov`, heurística) | Português (a prática e a regra global convergem); corrigir o CLAUDE.md |
| Formato de commit | global `git-workflow.md`: `<type>(<scope>): ...` (escopo no molde; ID de ticket nos projetos de trabalho) | `personal-projects/.claude/rules/git-workflow.md` e `CONTRIBUTING.md:107`: `<type>: descrição` | 3 de 64 commits com escopo (`seguranca`, `viral`, `ux`) | `<type>[(escopo semântico)]: descrição`; nunca ID de ticket do trabalho neste repo |
| Identificadores em inglês | global `code-generation-quality.md` item 9 (estrito) | `CLAUDE.md` "Regra de ouro" (superfície goiana) | API pública exportada em português: `listarMetodosGoianos`, `listarTiposGoianos`, `ehMetodoProibido` (`src/browser.js:19, 23, 27`), 12 métodos de `GoianoBuiltins` (`:118, 368-441`), classe `ErroGoiano`, método `mostra_as_tralha` em `bin/goias.js:254` | Superfície da linguagem em goianês; API JS pública em inglês com aliases goianos (ADR-0002) |
| Enforcement | `comments.md`: hook só em `.ts/.tsx` | núcleo é JS (CJS) | nenhum gate determinístico em `packages/core/**/*.js`; só ESLint (`no-console: warn`) | ADR-0008: regras viram lint/CI |
| Cobertura | global `testing.md`: 80% | `jest.config.js:20-26`: 50/50/50/40 | ~63% medido [KNOWN-FACTS] | ver F19 |

  Camada `personal-projects/.claude/rules/*.md` [VERIFICADO]: 9 arquivos com mtime idêntico (2026-03-15), carregados em toda sessão neste repositório, que são cópias achatadas de uma versão antiga das regras globais: 5 links `../common/*.md` quebrados (`coding-style.md:10`, `hooks.md:10`, `patterns.md:10`, `security.md:10`, `testing.md:10`); `performance.md` lista Sonnet 4.6 e Opus 4.5, que o `performance.md` global (2026-07-23) declara extintos (o Haiku 4.5 segue válido); `agents.md` usa nomes curtos que, segundo o `agents.md` global, "não resolvem"; `development-workflow.md` cita o Exa como fonte de pesquisa e omite o Context7, que o global põe antes do Exa; `coding-style.md` exemplifica `console.error`.
- Regra/critério violado: hierarquia de regras do CLAUDE.md global.
- Impacto: um agente nesta pasta recebe instruções contraditórias; a hierarquia declarada no CLAUDE.md global não lista a camada `personal-projects`, então o desempate é implícito.
- Recomendação: ADR-0002, ADR-0009 e ADR-0013; remover as 9 cópias de `personal-projects/.claude/rules/`; declarar no topo do CLAUDE.md do projeto os 3 overrides explícitos (superfície goiana, commits sem Jira, JS no core).

### [MEDIUM] F12 — Nenhum ADR/RFC; registros de decisão vencidos; plano fora do git mas público no histórico

- Evidência: `git grep -i -E "\bADR\b|\bRFC\b|architecture decision|decis[ãa]o|decision record|\bDecision\b"` em `HEAD` retorna uma única linha (`KEEP-OR-ARCHIVE.md:122`, "Decisão consciente: tudo vai pra archive primeiro"); nenhuma pasta `adr/` ou `rfc/` em nenhuma ref. O de-facto ADR é `KEEP-OR-ARCHIVE.md` (2026-05-31), com defeitos: `:19` mantém `src/compiler/index.js` (removido no `1.5.0-rc.1`); `:55` registra `goianoBuiltins.test.js` como FAIL (hoje passa); `:150-156` projeta "~36 arquivos / ~120 testes" (real no core: 38 arquivos em `packages/` e 85 testes; o total do repositório, 124 arquivos, inclui apps e extensão); `:84` deixa uma nota-para-si no texto publicado ("nome físico é `gs-fuça.js`?"); `:21` chama o `lexer.js` de "Tokenizer compartilhado" (é código morto). Um plano de relançamento foi retirado do git em 2026-05-04, com uma mensagem em inglês que não descreve a mudança, e está no `.gitignore`. Ele continua acessível no histórico público e contém planejamento pessoal do mantenedor; este documento não descreve o conteúdo nem onde ele está (decisão no ADR-0011 do spec da v3).
- Regra/critério violado: CLAUDE.md global ("Plano, evidência, prova, roteiro, doc de entrega -> vault, nunca no repositório", escopo de memória); `CONTRIBUTING.md:91, 154, 191` ainda direcionam contribuidores para esse plano (links 404, F26).
- Impacto: decisões não rastreáveis; contribuidores seguem um roadmap que não existe; material estratégico pessoal público.
- Recomendação: ADR-0001 e Anexo C.2. Converter `KEEP-OR-ARCHIVE.md` em ADR-0014 (marcado como histórico, números corrigidos). Mover planos para o vault. Decidir em ADR-0010 se o histórico público fica como está ou é limpo.

### [MEDIUM] F13 — `.gitignore` incoerente com o monorepo e com a estrutura de build futura

- Evidência [VERIFICADO: `git check-ignore -v --no-index`, `git ls-files -ci --exclude-standard`]:
  - 9 arquivos rastreados casam regras de ignore: `.vscode/tasks.json` (`:81`), `CLAUDE.md` (`:38`), `vscode-extension/package-lock.json` (`:7`) e 6 exemplos `.gs` (`exemplo_*.gs` `:107`, `teste_*.gs` `:108`).
  - A exceção `!examples/**/*.gs` (`:140`) é ancorada na raiz e deixou de valer com a migração para `packages/core/examples/`: `packages/core/examples/basic/exemplo_novo.gs` e `.../advanced/teste_novo.gs` são ignorados (`:107` e `:108`); quem adicionar um exemplo com esses nomes precisa de `git add -f`.
  - `lib/` (`:17`), `out/` (`:16`), `build/` (`:15`) e `dist/` (`:14`) ignoram em qualquer profundidade. `packages/core/src/lib/util.js` fica ignorado; `apps/` só funciona por causa do remendo `!apps/**/lib/` (`:68-69`). Uma pasta-fonte `packages/*/lib`, `scripts/build/` ou `out/` seria silenciosamente perdida.
  - Faltam `target/` e `pkg/` (Rust/wasm-pack): `packages/rust/target/debug/x` e `packages/core/pkg/x.wasm` aparecem como não ignorados. A história prova o custo: 584 arquivos de `target/` já foram commitados (F14).
  - `./docs` (`:41`) é um padrão morto (git não interpreta `./`): `check-ignore` não casa `docs/METODOS_GOIANOS.md` nem `docs/novo.md`. A regra efetiva é `docs/plano/` (`:99`).
  - Resíduos da v2 em "MANTER ESSENCIAL" (`:139-149`): `!balaios/`, `!lsp-server/*`, `!templates/`, `/meu-projeto/`, `/minha-loja/`, `gspack.json`; `!src/` e `!templates/` não anulam nenhuma regra anterior.
  - `.vscode/` ignorado com `tasks.json` rastreado; `package-lock.json` ignorado globalmente com `vscode-extension/package-lock.json` rastreado (a pasta não pertence ao workspace pnpm, que só inclui `packages/*` e `apps/*`).
- Regra/critério violado: coesão e ausência de código/configuração morta; consistência do monorepo.
- Impacto: arquivos novos desaparecem sem aviso; a futura reintrodução de uma implementação Rust/WASM ou de uma pasta `lib/` repete os problemas anteriores.
- Recomendação: reescrever o `.gitignore` por seção, sem negações órfãs; ignorar `target/`, `pkg/`, `.turbo/`; ancorar `lib/`, `out/`, `build/` apenas onde são saída (`/packages/*/dist/`, `/apps/*/.next/`); trocar `exemplo_*.gs`/`teste_*.gs` por `/meu-projeto/` específico ou remover; decidir `.vscode/` (versionar `extensions.json`, `tasks.json` válido) e `CLAUDE.md`.

### [MEDIUM] F14 — Histórico pesado (88% protótipo Rust com `target/`)

- Evidência: `git count-objects -vH`: `size-pack 59,61 MiB` (GitHub: `size` 61.856 KB). Pacote reconstruído com todas as refs: 60,4 MiB; sem o caminho `goiasscript-language/goiasscript-rust`: 7,0 MiB, ou seja, 88,3% do peso é o protótipo. 649 caminhos do Rust no histórico, 584 sob `target/`; maior blob 17,95 MiB (`libclap_builder-*.rlib`); 7 binários ELF de ~4 MB commitados. Os commits do Rust (`adee62c`, `e180182`, `7e1a2c6`) estão no histórico de `main`; o código-fonte (`src/*.rs`) foi apagado em `9a2d57e`. Nenhuma branch ou tag aponta para esses commits: o protótipo só é alcançável pela história de `main`.
- Regra/critério violado: higiene de repositório; o `.gitignore` da época não cobria `target/` (e ainda não cobre, F13).
- Impacto: todo `git clone` baixa ~60 MiB para ter ~7 MiB de projeto; o protótipo só é achável por busca no log.
- Recomendação: ADR-0010. Mínimo: tag anotada `archive/rust-prototype` em `e180182` (último snapshot que compila). Opcional, se o peso importar: `git filter-repo` em um clone espelho removendo `goiasscript-language/goiasscript-rust/target/` e binários, com force-push coordenado (há 1 fork e 40 estrelas; a tag `v2.0-pre-archive` e as branches de arquivo seriam recriadas).

### [MEDIUM] F15 — Higiene de branches, tags e releases; `main` sem proteção

- Evidência [VERIFICADO: `git branch -a`, `gh api`, `gh pr list`]:

| Ref | Aponta para | Situação | Ação sugerida |
|---|---|---|---|
| `origin/main` | `2cf8946` | padrão, sem proteção (`branches/main/protection` = 404; `rulesets` = `[]`) | proteger (PR obrigatório, checks, squash) |
| `origin/feat/v1.5-launch-playground-engoianador` | `cacbbcd` | mesclada (PR #6) | excluir; ativar `delete_branch_on_merge` (hoje `false`) |
| `origin/feat/v1.5-slim` | `78fa493` | mesclada (PR #5) | excluir |
| `origin/staging` | `e14b7c3` | mesmo commit de `archive/v2-experimental` e da tag; ainda dispara CI (`ci.yml:5, 7`) | excluir (duplicata) |
| `origin/archive/v2-experimental` | `e14b7c3` | arquivo | manter e proteger |
| `origin/DEVELOPMENT` | `fc0a91f` | 40 atrás, 8 à frente; PRs #1-#4 do bot Jules; diff líquido de 3 arquivos (+38/-2) | portar o teste e a correção (abaixo), depois excluir |
| `origin/feat/increase-test-coverage` | `c8c0495` | idem | excluir |
| tag `v2.0-pre-archive` | `e14b7c3` | anotada | manter |
| tag `v1.5.0` | ausente | CHANGELOG diz lançada | criar junto com a publicação (F05) |

  A `DEVELOPMENT` guarda uma correção real que nunca chegou a `main`: o regex de palavras com `_` ou acento não aceita `;` como delimitador. [VERIFICADO] No 1.5, `continua_aí;` e `para_com_isso;` saem sem tradução (`ReferenceError: continua_aí is not defined`). `de_jeito_nenhum;` só funciona porque o runtime declara `const de_jeito_nenhum = false` (mascaramento, não correção). O teste de regressão está em `tests/unit/bug-repro.test.js` da branch. Essas duas palavras não aparecem em nenhum teste, exemplo ou documento.
  Também: a `main` local está 8 commits atrás de `origin/main`; branches locais `feat/v1.5-slim`, `staging` e `archive/v2-experimental` são resíduos; `has_wiki` e `has_projects` estão ligados e sem uso.
- Regra/critério violado: fluxo de release e revisão do `CONTRIBUTING.md:97, 185-186`; `git-workflow.md`.
- Impacto: refs duplicadas confundem; uma correção ficou presa 13 meses numa branch órfã; qualquer push direto em `main` é possível.
- Recomendação: ADR-0009. Portar `bug-repro.test.js` e a correção para `main` via PR; excluir as 5 branches obsoletas; proteger `main`; `delete_branch_on_merge: true`; permitir só squash.

### [MEDIUM] F16 — Processo de PR e review descrito no CONTRIBUTING, mas não praticado

- Evidência [VERIFICADO: `gh pr list`, `gh pr view 5/6`, `git log --merges`]:

| PR | Autor | Base | Abertura -> merge | Commits | Review | Estilo de merge |
|---|---|---|---|---|---|---|
| #1 a #4 | `google-labs-jules` (bot) | `DEVELOPMENT` | 56 s a 9 min 39 s | 1 cada (+160/-1, +112/-3, +57/-272, +38/-55) | 0 | merge commit |
| #5 | `Gefferson-Souza` | `main` | 6 min 37 s | 30 (+16.098/-1.571; 78 arquivos) | 0 | merge commit `a19bf17` |
| #6 | `Gefferson-Souza` | `main` | 11 dias | 7 (+7.311/-115; 64 arquivos) | 0 | merge commit `2cf8946` |

  `CONTRIBUTING.md:185-186` promete "pelo menos um maintainer aprova" e "squash & merge é o padrão"; os repositórios aceitam os três modos de merge. Nenhum dos 2 PRs abertos por `Gefferson-Souza` usou o `pull_request_template.md` (o corpo do #5 começa em "## Resumo" e é texto próprio; o do #6 repete a mensagem do commit). Duas execuções de CI do PR #5 falharam (2026-05-04 04:20, 14-16 s) e foram corrigidas pelo commit seguinte (`78fa493`, "deixa pnpm/action-setup ler versão do packageManager"); as outras 10 execuções amostradas estão verdes.
- Regra/critério violado: `CONTRIBUTING.md` (processo de review); `code-review.md` ("Code review MANDATORY antes de merge em branches compartilhadas"); regra global de CI verde antes de push.
- Impacto: o processo documentado é aspiracional; PRs grandes (78 arquivos) entram sem segunda leitura. Num projeto mantido por uma só pessoa isso é compreensível, mas o documento precisa descrever o que acontece.
- Recomendação: ADR-0009: para um projeto mantido por uma só pessoa, exigir CI verde + auto-review checklist no PR (template curto), squash-only, e descrever isso no CONTRIBUTING; se entrarem contribuidores, passar a exigir 1 aprovação.

### [MEDIUM] F17 — Gates de CI e de commit frouxos ou inoperantes

- Evidência:
  - `.github/workflows/ci.yml:15` testa Node `18.x`, `20.x`, `22.x`; nenhuma versão atual do Node (o ambiente local usa Node 24 [KNOWN-FACTS]). [HIPÓTESE, calendário oficial de releases do Node, não verificado online: 18 e 20 já estão em fim de vida.] `engines` exige `>=18` (`packages/core/package.json:58`) e o `.babelrc:7` ainda mira Node 14.
  - `:38-39` `format:check` com `continue-on-error: true`; `:46-51` upload do Codecov também não bloqueante e sem token.
  - `pnpm lint` (`:35`) roda só `packages/core` (`package.json` raiz: `"lint": "pnpm --filter goiasscript lint"`); os apps TS não são linted em CI (`next lint` existe em `apps/playground` e não é chamado).
  - `push: [main, staging, 'feat/**']` (`:4-5`) mais `pull_request` (`:6-7`) duplica as execuções de cada push em branch com PR aberto (visto em `gh run list`: eventos `push` e `pull_request` para o mesmo SHA).
  - `lint-staged` está configurado no `package.json` raiz e `"prepare": "husky install"` existe, mas não há hook `pre-commit` versionado: `.husky/` contém só `_/` (gerado), `git ls-files .husky` = 0. O gate de commit prometido não existe.
  - Sem `release.yml`, sem Dependabot e sem code scanning (`gh api .../code-scanning/default-setup` retorna `state: not-configured`); ações referenciadas por tag (`@v4`), sem pin por SHA (`sha_pinning_required: false`); permissões padrão do `GITHUB_TOKEN` já são `read` (bom).
- Regra/critério violado: `code-review.md` (CI verde antes do review); `testing.md`; `hooks.md` (auto-checks); CLAUDE.md global ("Push só após CI verde local").
- Impacto: a verificação de formatação e a de lint dos apps não protegem nada; CI testa runtimes que ninguém usa e não testa o Node que o ambiente local usa.
- Recomendação: ADR-0008. Matriz Node 22 e 24; `format:check` bloqueante; `pnpm -r lint`; `on: pull_request` + `push: main`; criar `.husky/pre-commit` com `lint-staged` ou remover ambos; adicionar `release.yml`, `dependabot.yml` e CodeQL; passar a fixar ações por SHA.

### [MEDIUM] F18 — Metadados do GitHub imprecisos

- Evidência [VERIFICADO: `gh repo view`, `gh api`]: descrição "Esoteric programming language with Goiás dialect syntax: hand-written lexer and parser compiling to JavaScript" (a 1.5 não tem parser e o lexer não é usado, [KNOWN-FACTS]); tópicos `compiler, esolang, javascript, lexer, parser`; `homepageUrl` vazio; Discussions desligado enquanto `CONTRIBUTING.md:199` manda abrir uma Discussion; wiki e projetos ligados sem uso; sem `.gitattributes` (nenhum `linguist-language` para `.gs`); `has_pages: false`. Perfil da comunidade: `health_percentage: 100`, com `issue_template: null` apesar de `.github/ISSUE_TEMPLATE/*.md` existirem em `main` (divergência não explicada; [HIPÓTESE] cache). A API retorna `documentation: .../tree/master/docs`; a branch `master` redireciona para `main`, então o link funciona.
- Regra/critério violado: coerência entre README e metadados públicos.
- Impacto: a primeira linha que o visitante lê descreve uma arquitetura que não existe.
- Recomendação: nova descrição ("Linguagem de programação goiana: transpila goianês para JavaScript. CLI, playground web e Engoianador."), tópicos `esolang, transpiler, programming-language, portuguese, brazil, goias, nextjs, cloudflare-workers`, `homepage` após o deploy, habilitar ou remover o link de Discussions, `.gitattributes` com `*.gs linguist-language=JavaScript` (a decidir em ADR-0011, F30).

### [MEDIUM] F19 — Governança de testes e cobertura: waiver vencida, testes de código morto, vocabulário sem teste

- Evidência: `packages/core/jest.config.js:17-19` registra o limiar reduzido com o comentário "Meta de 80% retorna na Fase 1 (W20)": W20 foi 2026-05-11/17, a fase não existe mais e o limiar continua em 50/50/50/40 (`:22-25`); `CHANGELOG.md:69` e `CONTRIBUTING.md:137, 179` repetem a promessa. `.eslintrc.js:33-34` tem o mesmo padrão ("Voltam pra error na Fase 1"). 23 dos 85 testes (27%) testam `lexer.js`, que nenhum código de produção usa [KNOWN-FACTS]; só 27 das 53 chaves da linguagem são citadas em testes que exercitam o transpiler (sem testes: `é_tipo_de`, `é_igualim`, `num_muda`, `se_num_for`, `vai_indo`, `enquanto_tiver`, `para_com_isso`, `continua_aí`, `vai_na_frente`, `diferente`, `menor_que`, `pelo_menos`, `no_máximo`, `e_mais`, `ou_então`, `num_é`, `menos`, `vezes`, `dividido`, `sobrou`, `quando_resolver`, `se_der_pobrema`, `por_fim`, `nada`, `indefinido`, `vixe`; parte pode ser coberta indiretamente por exemplos, a medição é textual). Cobertura global ~63% [KNOWN-FACTS]; `src/cli/index.js` e `browser.js` com 0%.
- Regra/critério violado: `testing.md` global (80%, TDD, unit + integração + E2E); `comments.md` R2 (marcador de fase em comentário).
- Impacto: a exceção ao padrão global não tem prazo real nem responsável; o suite de testes dá confiança falsa sobre o vocabulário.
- Recomendação: ADR-0008. Dar data e escopo à exceção (por exemplo, subir 5 pontos por release até 80% em `packages/core`), remover ou ressuscitar `lexer.js` (decidir no ADR-0004), gerar testes golden a partir de `keywords.json` (uma linha `.gs` -> `.js` por palavra) e incluir `docs:test` (F09).

### [MEDIUM] F20 — Extensão VS Code: qualidade de gramática, snippets, ícones e empacotamento

- Evidência: Anexo D.2 a D.4. Gramática: `nada` recebe `storage.type.primitive` (`tmLanguage.json:188`) em vez de constante; as palavras `texto|numero|booleano|lista|objeto|funcao|coisa` são coloridas como tipo em qualquer posição (um identificador `lista` em `lista.pra_cada(...)` vira tipo; `:188` sem restrição de contexto); `:` é `keyword.operator.type` em literais de objeto e ternários (`:192`); strings de aspas simples e template literals não são tokenizados (`strings` só trata `"`, `:146-156`): `'uai dentro de aspas'` colore `uai` e `de` como palavras-chave, e `se_ocê_quiser` dentro de crases também; builtins do runtime (`sorteio`, `pra_cada`, `vira_numero`) sem escopo. Snippets: 16 de 37 geram código que o 1.5 não traduz (imports/exports, decoradores, assinaturas tipadas). Ícones: PNG da marca de 1024x1024, 1,3 MB, idêntico em `dark` e `light` (mesmo sha256), logo horizontal com mapa e wordmark que perde legibilidade em 128 px; ícones de arquivo SVG 16x16 com glifos "G" e "S" malformados e rótulo `GS` com `font-size="1.5"`, ilegível em 16 px (render em Chromium: `probes-gov/icons-render/`); `iconThemes` define só `.gs`, [HIPÓTESE] ativar o tema remove os demais ícones. Empacotamento: Anexo D.4. README: bloco de código sem fechamento (1 cerca, aberta em `README.md:22`), instala "pelo VS Code Marketplace" (`:16`, não publicado), exemplo com "Usuário: Gefferson-Souza" e "Data: 2025-04-13 05:15:11" dentro de `prosa(...)` (`:25-26`) e `presta_serviço` (`:29`); `CHANGELOG.md` da extensão é o molde ("[Unreleased] - Initial release"); `vsc-extension-quickstart.md` é boilerplate do gerador.
- Regra/critério violado: requisitos de publicação (Anexo D.4); coerência com a spec (F03).
- Impacto: realce incorreto em código real e experiência de instalação quebrada, mesmo depois de corrigir o F01.
- Recomendação: Anexo D.5.

### [MEDIUM] F21 — `bota_pra_moer` e o script `example:classes` terminam com código 0 quando falham

- Evidência [VERIFICADO]: `node bin/goiasscript.js bota_pra_moer examples/classes/exemplo_classes.gs` imprime "Deu ruim na execução: Unexpected identifier 'Pamonharia'" e sai com `0`; `node src/cli/index.js examples/classes/exemplo_classes.gs` (script `pnpm example:classes`, `packages/core/package.json`) imprime só o banner e sai com `0`, sem erro nenhum. Por contraste, `traduz` com arquivo inexistente e `vê_se_tá_certo` com sintaxe ruim saem com `1`. O CI (`ci.yml:53-58`) só roda `--version`, `dedo_de_prosa` e `traduz`; nenhum passo executa `bota_pra_moer`.
- Regra/critério violado: `subagent-delegation-and-ui.md` §2 ("verifique o output real, não o exit code otimista"); erros explícitos na fronteira (`coding-style.md`).
- Impacto: scripts e CI não detectam exemplos quebrados, e o F09 passou despercebido.
- Recomendação: sair com código diferente de zero na falha de execução; adicionar ao CI um passo que execute 3 exemplos e verifique a saída (cruzar com o auditor do CLI).

### [MEDIUM] F22 — Limites do transpiler por substituição desmentem a documentação e sustentam a decisão de arquitetura

- Evidência [VERIFICADO: `probes-gov/core-edge.js`]:
  - Template literals não são protegidos (`simpleTranspiler.js:76-78` só protege `'` e `"`): `` prosa(`soma: ${a} mais ${b}`) `` imprime `soma: 1 + 2`.
  - Comentários não são protegidos: `// Clica em mais um` -> `// Clica in + um`.
  - Não há política de palavras reservadas: `uai de é 1` -> `const of = 1`; `uai mais é 1` -> `const + = 1` (SyntaxError); `{ nada: 1 }` -> `{ null: 1 }`; `{ em: 1 }` -> `{ in: 1 }`.
  - ASI: `uai a é "x"` seguido de linha que começa com `[` quebra (`README.md:167-170`, F09).
  - `GoianoMath.PI`/`.E` documentados viram `GoianoGoianoMath.*` porque `Math\.PI\b` casa dentro de `GoianoMath.PI` (`:271-272`).
  - O delimitador `;` não é aceito para palavras com `_` ou acento (F15).
  - Tipos: `uai x: numero é "a"` é aceito (`_removeTypeAnnotations`, `:210`; o analisador de tipos é `NoopTypeAnalyzer`, `compiler.js:19`); `vê_se_tá_certo` não verifica tipos, contrariando `README.md:78` ("Valida sintaxe e tipos").
  - O aviso "O método console.log( não é goiano" dispara em todo programa que usa `prosa` (`_checkForbiddenMethods` roda depois das substituições, `:39`); `docs/METODOS_GOIANOS.md:16` promete bloqueio, mas `[1,2].map(...)` é reescrito silenciosamente para `.mapear(...)` e executa.
- Regra/critério violado: promessas da documentação (`README.md:78`, `METODOS_GOIANOS.md:16`, `:198-199`); coerência da spec.
- Impacto: cada limite é uma promessa pública quebrada; todos têm a mesma causa (substituição sem tokenização), o que precisa de decisão, não de remendo caso a caso.
- Recomendação: ADR-0004 (opções e critérios no Anexo C.2). Entregar já as correções baratas (proteger templates e comentários, `;` como delimitador, regex de `Math.` com lookbehind) com testes golden; ajustar os docs para o comportamento real. (Detalhes de correção ficam com o auditor do núcleo.)

### [LOW] F23 — `.vscode/tasks.json` quebrado

- Evidência: `.vscode/tasks.json` (2025-09-13) chama `${workspaceFolder}/bin/goiasscript.js`, `bin/gs-fuça.js` e `bin/gs-balaio.js`; na raiz não existe `bin/` (o binário está em `packages/core/bin/`; os outros dois foram arquivados). 6 das 8 tarefas falham; só `npm test` e `npm run test:coverage` funcionam.
- Regra/critério violado: ausência de configuração morta.
- Impacto: a tarefa padrão de build ("Botar pra Moer") falha no VS Code do contribuidor.
- Recomendação: corrigir os caminhos para `packages/core/bin/` ou remover o arquivo (e o `.vscode/` do `.gitignore`, F13).

### [LOW] F24 — Templates de PR e de issue desatualizados

- Evidência: `.github/pull_request_template.md` (2025-09-13) pede `npm test`, `npm run lint`, `npm run format` e "`npm run build` funciona" (não há `build` na raiz; o projeto usa pnpm); o `bug_report.md` pede "GoiásScript: [ex: 1.0.3]" e `npm`; não existe template de RFC nem de pergunta.
- Regra/critério violado: `CONTRIBUTING.md` (comandos reais).
- Recomendação: atualizar para pnpm, adicionar `rfc.md` e `config.yml` apontando para Discussions (ou removendo), e reduzir o PR template ao que de fato é verificado antes do merge.

### [LOW] F25 — Marcadores `AUTO-GENERATED` sem gerador e já desatualizados

- Evidência: `README.md:72-83` e `CONTRIBUTING.md:53-76` têm `<!-- AUTO-GENERATED:... -->`; `git grep` encontra só os marcadores, sem script. A tabela de scripts do CONTRIBUTING lista 6 dos 15 scripts da raiz (faltam `playground:*`, `engoianador:*`, `e2e` e `prepare`).
- Regra/critério violado: rótulo enganoso; fonte única.
- Recomendação: gerar a partir do `package.json` num script `docs:sync` ou remover o rótulo.

### [LOW] F26 — Links quebrados em documentos rastreados

- Evidência: `CONTRIBUTING.md:91, 154, 191` apontam para `docs/plano/PLANO-RELANCAMENTO.md` (ignorado e removido do git em `26b6857`; o próprio CONTRIBUTING foi editado em `ceba983`, em 2026-05-31, depois da remoção, e manteve os links); `:199` aponta para Discussions desligado; `:97` ainda sugere partir de `feat/v1.5-slim` (já mesclada); `packages/core/examples/README.md` aponta para `../ROADMAP.md` e `../README.md`, ausentes.
- Recomendação: um check de links (por exemplo `lychee`) no CI, e remover as referências ao plano.

### [LOW] F27 — Comentários fora do padrão R1-R4 e idioma misto

- Evidência: 10 linhas de comentário em 6 arquivos com histórico ou marcador de fase [VERIFICADO: `git grep`]: `.eslintrc.js:34` ("Fase 1"), `jest.config.js:17-18` ("Fase 1 (W20)", "v1.5 enxuto"), `compiler.js:4-6` ("v1.5 slim build", "archived for v1.5"), `compiler.js:296` ("browser playground (Fase 1)"), `simpleTranspiler.js:355` ("Falso-positivo conhecido da v2 corrigido aqui"), `rate-limit.ts:8` ("plano: 20 req/dia"), `browser.js:2`. (O mesmo `grep` casou mais 3 linhas que são texto gerado com versão, não comentário: `bin/goiasscript.js:209, 226` e `GoianoBuiltins.js:120`; as duas primeiras entram no F05.) Idioma: 201 PT, 50 EN, 80 ambíguos; `compiler.js` e `browser.js` em inglês, `GoianoBuiltins.js` e `bin/*.js` em português.
- Regra/critério violado: `comments.md` R2 (histórico de desenvolvimento, marcador de fase) e R3 (português).
- Recomendação: remover esses comentários de histórico (a informação vive no git e nos ADRs) e unificar em português (ADR-0002). A taxa é baixa e a correção é mecânica.

### [LOW] F28 — Higiene de mensagens de commit

- Evidência: 15 de 64 assuntos acima de 72 caracteres (4 de 25 desde o relançamento); `26b6857` tem assunto de 261 caracteres, em inglês, fora do formato; `568c3bf` carrega o trailer `Co-authored-by: Copilot <copilot@github.com>` (único trailer de IA no histórico); 6 mensagens vagas, todas da UI do GitHub de 2025-04-13 ("Update README.md", "Create README.md", "Add files via upload", "Initial commit"); 3 autores: `Gefferson-Souza` (54), `Gefferson Teodoro de Souza` (13, commits via UI do GitHub) e `google-labs-jules[bot]` (4). Escopos usados: `seguranca`, `viral`, `ux` (sem Jira, como deve ser neste repo).
- Regra/critério violado: `git-workflow.md` (descrição curta, sem mensagens vagas); CLAUDE.md global (atribuição de IA desativada).
- Recomendação: `commitlint` no CI com `header-max-length: 72` e lista de tipos; `.mailmap` para unificar autoria; nada a reescrever no histórico.

### [LOW] F29 — Resíduos locais e protótipo Rust sem referência nomeada

- Evidência: pastas vazias não rastreadas `docs/api/`, `docs/guides/` e `lsp-server/` (de 2025-09 e 2026-06); `research_notes/` untracked, criado por outra sessão, não por esta auditoria; `main` local 8 commits atrás. O protótipo Rust só é achável por `git log` (F14).
- Recomendação: remover as pastas vazias; criar a tag `archive/rust-prototype` (F14).

### [LOW] F30 — Extensão de arquivo `.gs` pode colidir com outras ferramentas

- Evidência: [HIPÓTESE, não verificada: a extensão `.gs` é usada pelo Google Apps Script e pelo Gosu no GitHub Linguist]; o repositório não tem `.gitattributes`, e `languages` do GitHub não reporta nenhum byte para `.gs` (só JavaScript, TypeScript e CSS), de modo que o realce dos exemplos no GitHub depende do que o Linguist decidir.
- Regra/critério violado: nenhuma regra; decisão de ecossistema pendente.
- Recomendação: decidir em ADR-0011 se `.gs` permanece (com `.gitattributes` `*.gs linguist-language=JavaScript` e `languages[].extensions` explícito) ou se haverá extensão alternativa (por exemplo `.goias`) como alias.

## Conformidade com as regras

| Regra (fonte) | Estado | Contagem e exemplos |
|---|---|---|
| Regra de ouro: UX do usuário em goianês (CLAUDE.md projeto) | PARCIAL | Mensagens, comandos e REPL em goianês; `--help` do commander em inglês (`Usage`, `Options`, `output the version number`, `display help for command`), templates de issue bilíngues |
| Identificadores em inglês (global item 9) | NÃO | 12 métodos de `GoianoBuiltins`, 3 de `browser.js`, `ErroGoiano`, `mostra_as_tralha` (F11); não medi o resto do código (auditor de qualidade) |
| Comentários R1-R4 (global `comments.md`) | PARCIAL | 10 linhas de comentário em 6 arquivos com histórico/fase; idioma 201 PT / 50 EN / 80 ambíguos (F27) |
| Código sem `any`, sem magic values, imutável, arquivos pequenos | N/A | fora do escopo desta auditoria (ver auditores do núcleo e de qualidade) |
| TDD e cobertura >= 80% (global) | NÃO | limiar 50/50/50/40 com waiver vencida; 23 de 85 testes em código morto; 27 de 53 chaves citadas em testes (F19) |
| Segurança: sem segredos, validar entradas, canal de report | PARCIAL | 0 segredos em 71 commits e secret scanning ativo; F01 (injeção), F06 (canais mortos), F08 (Pix placeholder) |
| Conventional Commits (global/CONTRIBUTING) | OK | 51/64 (80%) no total; 24/25 (96%) desde 2026-05-03; escopo em 3/64; 0 mensagens vagas desde o relançamento |
| Mensagens vagas bloqueadas (global) | OK | 6 no histórico, todas de 2025-04-13 (UI do GitHub) |
| Fluxo: pesquisa -> plano -> TDD -> review -> CI verde | PARCIAL | CI verde nas 10 execuções recentes amostradas; 2 vermelhas no PR #5, corrigidas em < 1 min; 0 reviews em 6 PRs; plano retirado do git (F12, F16) |
| Plano e evidência fora do repositório (CLAUDE.md global) | NÃO | `docs/plano/*` e `.claude/plan/*` públicos no histórico (F12) |
| Hierarquia de regras coerente entre camadas | NÃO | 5 conflitos (F11); camada `personal-projects` obsoleta com 5 links quebrados |
| Atribuição de IA desativada (global) | PARCIAL | 1 commit com `Co-authored-by: Copilot` (`568c3bf`); nenhum trailer do Claude |
| CONTRIBUTING reflete o processo real | NÃO | 3 links 404, Discussions desligado, "squash" e "1 aprovação" não praticados (F16, F26) |
| Documentação reflete o código | NÃO | CLAUDE.md 11/16 falsas; 9/15 exemplos inválidos; 3/25 blocos de docs com falha real (F04, F09) |
| ADRs e RFCs para decisões e mudanças de linguagem | NÃO | 0 e 0 (F12) |
| Branch protegida, tags de release, `CODEOWNERS` | NÃO | `main` sem proteção; 0 releases; sem `CODEOWNERS` (opcional num projeto de uma só pessoa) (F15) |

## Veredito por módulo/arquivo

| Artefato | Veredito | Justificativa |
|---|---|---|
| `CLAUDE.md` | reescrever | 11 de 16 afirmações falsas; vira a fonte única, enxuta e verificável |
| `.github/copilot-instructions.md` | remover (ou ponteiro de 3 linhas) | descreve o monólito 1.0; 0 símbolos existentes |
| `personal-projects/.claude/rules/*.md` (9) | remover | cópias obsoletas, links quebrados, conflitam com as regras globais |
| `README.md` | refatorar | estrutura e tom bons; corrigir ~10 afirmações (npm, tipos, Marketplace, deploy, limites) |
| `CONTRIBUTING.md` | refatorar | bom fluxo; consertar links, descrever o processo real, mover backlog para Issues |
| `CHANGELOG.md` | refatorar | manter o formato; data real, `[Unreleased]`, "Removido" do vocabulário 1.0 |
| `KEEP-OR-ARCHIVE.md` | refatorar | converter em ADR histórico com os números corrigidos |
| `SECURITY.md` | reescrever | contato, versões e escopo falsos |
| `CODE_OF_CONDUCT.md` | manter | conteúdo adequado; trocar o contato |
| `docs/METODOS_GOIANOS.md` | refatorar | gerar a partir da spec e do runtime; corrigir 3 exemplos e a promessa de bloqueio |
| `docs/plano/*` (local) | manter fora do repositório | já ignorado; retirar as referências nos docs; mover para o vault |
| Templates de PR e de issue | refatorar | pnpm, RFC, checklist curto |
| `.github/workflows/ci.yml` | refatorar | F17 |
| `.gitignore` | reescrever | F13 |
| `.husky` e `lint-staged` | refatorar | criar o hook ou remover ambos |
| `.vscode/tasks.json` | refatorar | 6 de 8 tarefas quebradas |
| `vscode-extension/src/extension.js` | reescrever | F01 e F07 |
| `vscode-extension/package.json` | reescrever | F07 |
| `syntaxes/goiasscript.tmLanguage.json` | refatorar (manter a base) | 50 de 53 chaves cobertas; ajustar contexto de tipos, strings e `:` |
| `snippets/goiasscript.json` | refatorar | 21 válidos, 16 inválidos |
| `language-configuration.json` | manter | adequado |
| `icons/*.png` | refatorar | um arquivo otimizado a partir do glifo do mapa |
| `icons/*.svg` | reescrever | glifos malformados, rótulo ilegível |
| `README.md` e `CHANGELOG.md` da extensão | reescrever | desatualizados, molde e cerca aberta |
| `vsc-extension-quickstart.md` | remover | boilerplate |
| `vscode-extension/package-lock.json` | decidir | rastreado e ignorado ao mesmo tempo |
| Protótipo Rust (`adee62c`..`7e1a2c6`) | manter só como referência | etiquetar com tag; não evoluir |
| `archive/v2-experimental` | manter (protegido) | snapshot imutável |
| `staging` | remover | duplicata de `archive/v2-experimental` |
| `DEVELOPMENT`, `feat/increase-test-coverage` | portar e remover | uma correção e um teste |

## O que vale reaproveitar numa reescrita

- A tabela de 53 mapeamentos e o vocabulário goiano (a base de `keywords.json`), mais a tabela de métodos do runtime (`GoianoBuiltins.js`, sem os métodos inexistentes).
- A arquitetura de entrega do 1.5: entry `browser.js`, playground com Web Worker + Monaco, Engoianador com CORS, rate limit fail-closed e testes de injeção de prompt, a suíte E2E Playwright, a estrutura de jobs do CI (corrigida conforme F17).
- A gramática TextMate (50 de 53 chaves, `language-configuration.json`) e o logo como base da extensão recriada; o código de teste de gramática que usei (`vscode-textmate` + `vscode-oniguruma`, `probes-gov/lib-grammar.js`) vira teste de CI.
- A correção do delimitador `;` e o `bug-repro.test.js` da branch `DEVELOPMENT`.
- Do arquivo v2: o servidor LSP (diagnósticos que apontam `=`, `if`, `function`, `console.log`; completion e hover) como semente do autocompletar do Monaco (item "LSP simples" do `CONTRIBUTING.md:172`), depois de alinhado à spec.
- O corpus de 36 `.gs` do arquivo (4.317 linhas) como insumo de RFC de módulos, tipos e decoradores. Só 3 rodam no 1.5, então não servem como teste.
- Rust como referência de desenho: `logos` + descida recursiva + AST em enum (Anexo E.2); a decisão de usar ou não Rust/WASM é do ADR-0004.
- O padrão `KEEP-OR-ARCHIVE` (tudo vai para arquivo antes de apagar) como ADR-0014.

## Anexo A — Inventário de regras, ADRs e documentos de decisão

Datas: `git log -1 --format=%ci -- <arquivo>` para o que é rastreado; mtime para o que não é. "Confere" compara com o código atual.

| Documento | Camada/tipo | Propósito | Última mudança | Confere? | Observação |
|---|---|---|---|---|---|
| hooks globais (`quality-pretooluse.mjs`, `validate-commit-message.sh`) | 1 | gate determinístico | n/d (fora do repositório; não inspecionados) | n/d | segundo `comments.md`, o gate de qualidade atua só em `.ts/.tsx`, então não cobre `packages/core/**/*.js` |
| `<home>/.claude/CLAUDE.md` | 2 | identidade, commits com ID de ticket, hierarquia | n/d | parcial | formato com ID de ticket é dos projetos de trabalho (N/A neste repo) |
| `rules/common/*.md` (14) | 3 | regras universais | `comments` 2026-07-23, `code-generation-quality` 2026-08-31, `git-workflow` 2026-07-17, `performance` 2026-07-23, `testing` 2026-03-10 | sim | referência |
| `rules/typescript/*.md` (6) | 4 | regras TS | n/d | parcial | o núcleo é JS (CJS); valem para os apps |
| `personal-projects/.claude/rules/*.md` (9) | auto-carregada | cópias antigas | 2026-03-15 | não | F11 |
| `CLAUDE.md` | 6 | identidade, comandos, arquitetura v2 | 2025-09-14 (`a8155f1`) | não | Anexo B |
| `.github/copilot-instructions.md` | 7 | guia do monólito 1.0 | 2025-09-13 (`b6d7dc1`) | não | F04 |
| `README.md` | doc | visão geral | 2026-05-31 (`ceba983`) | parcial | `:19-20`, `:78`, `:183`, `:198`, `:211` |
| `CONTRIBUTING.md` | processo | fluxo e áreas | 2026-05-31 | parcial | F16, F26 |
| `CHANGELOG.md` | histórico | versões | 2026-05-31 | parcial | datas, rate limit, modelo, "sai do -rc"; omite os commits de 2026-06-01 (segurança, doação, E2E) |
| `KEEP-OR-ARCHIVE.md` | decisão (ADR de fato) | triagem do slim-down | 2026-05-31 | parcial | F12 |
| `SECURITY.md` | processo | política de segurança | 2025-09-12 (`128d614`) | não | F06 |
| `CODE_OF_CONDUCT.md` | processo | conduta | 2025-09-12 | parcial | contato placeholder |
| `docs/METODOS_GOIANOS.md` | referência | métodos do runtime | 2026-05-04 (`6594cae`) | parcial | F03, F09, F22 |
| `packages/core/examples/README.md` | doc | exemplos | 2026-05-03 | não | pastas e comandos inexistentes |
| `packages/core/templates/projeto-basico/README.md` | doc | template | 2026-05-03 | não | "v2.0", `^2.0.0` (`package.json:17`) |
| `apps/playground/README.md` | doc | playground | 2026-05-31 | parcial | Vercel × domínio |
| `apps/engoianador-api/README.md` | doc | Worker | 2026-05-31 | não | "10 req/min", modelo |
| `vscode-extension/README.md`, `CHANGELOG.md` | doc | extensão | 2025-09-12 | não | F20 |
| `vscode-extension/vsc-extension-quickstart.md` | boilerplate | gerador | 2025-09-12 | n/a | remover |
| `.github/ISSUE_TEMPLATE/*.md` (2) | template | issues | 2025-09-13 | parcial | F24 |
| `.github/pull_request_template.md` | template | PR | 2025-09-13 | parcial | F24 |
| `.github/workflows/ci.yml` | gate | CI | 2026-06-01 (`a974819`) | parcial | F17 |
| `.eslintrc.js` | norma | lint | 2026-05-04 | parcial | comentário "Fase 1"; só `packages/core` |
| `packages/core/jest.config.js` | norma | cobertura | 2026-05-03 | não | 50% vs 80% |
| `.gitignore` | norma | ignorar | 2026-06-01 | não | F13 |
| `.husky/`, `lint-staged` (`package.json`) | norma | pre-commit | n/a | não | sem hook |
| `.vscode/tasks.json` | norma | tarefas | 2025-09-13 | não | F23 |
| `docs/plano/{index,PLANO-RELANCAMENTO,STACK-ZERO-CUSTO,DESIGN-BRIEF}.md` | plano (local, ignorado) | relançamento | mtime 2026-05-04 | histórico | Cloudflare Pages; marcos W19-W29 vencidos |
| material de planejamento pessoal | plano | — | — | histórico | F12 |
| `ROADMAP.md`, `RELEASE_NOTES_v2.0.md`, `INSTALACAO_E_TESTES.md`, `PROXIMOS_PASSOS.md` (em `archive/v2-experimental`) | histórico | v2 | 2025-09 | histórico | sem uso |
| ADRs, RFCs | n/a | n/a | n/a | n/a | inexistentes |

## Anexo B — Afirmações do `CLAUDE.md` contra o código 1.5

| # | Afirmação | Veredito | Evidência |
|---|---|---|---|
| 1 | `src/compiler.js`: "compilador com JIT integrado; análise de tipos, módulos" | Falsa | JIT, tipos e módulos são stubs (`compiler.js:19, 25, 41, 59-61`) |
| 2 | CLI `goiasscript` com 5 comandos | Parcial | existem (`bin/goiasscript.js:553-641`); `vê_se_tá_certo` não verifica tipos |
| 3 | `gs-balaio` (6 subcomandos) | Falsa | removido (`CHANGELOG.md`, `1.5.0-rc.1`) |
| 4 | `gs-fuçá` (5 subcomandos) | Falsa | removido |
| 5 | REPL `goias` e 7 comandos de ponto | Parcial | os 7 existem (`bin/goias.js:220-257`); as variáveis não persistem [KNOWN-FACTS] |
| 6 | 33 palavras-chave | Parcial | 30 existem; `se`, `senao` e `fazer` não |
| 7 | Métodos `.gritando()`, `.cochichando()`, `.tem_no_meio()`, `.bota_no_final()`, `.arranca_o_rabo()`, `sorteia_um()` | Falsa | TypeError em execução; os reais são `pra_maiusculo`, `pra_minusculo`, `contem`, `empurrar`, `tirar_ultimo`, `sorteio` |
| 8 | Balaios built-in `goiano-utils`, `goiano-http`, `goiano-db`, `goiano-teste` | Falsa | 2 arquivados (v2), `goiano-db` e `goiano-teste` nunca existiram como arquivo |
| 9 | "Sistema de tipos goiano completo" | Falsa | só remoção de anotação por regex (`simpleTranspiler.js:210`); `uai x: numero é "a"` é aceito |
| 10 | Módulos `pega`/`troca_ideia` | Falsa | `pega { a } de "./x.gs"` -> `SyntaxError` |
| 11 | JIT Compiler | Falsa | `NoopJITCompiler` |
| 12 | "AST Parser para análises avançadas" | Falsa | arquivado |
| 13 | "Extensão VS Code completa" | Falsa | F07 |
| 14 | "Métodos 100% goianos (sem dependência de JavaScript)" | Falsa | `GoianoBuiltins.js` embrulha nativos (`String.prototype.trocar` chama `this.replace`) |
| 15 | "Comentários de código interno em inglês" | Conflito | contraria a prática (201 PT / 50 EN) e a regra global |
| 16 | "Nunca voltar a `gspack`/`gsdebug`/`gsrepl`; sempre 'balaio'" | Irrelevante | os binários e o conceito foram arquivados |

## Anexo C — Governança alvo (proposta)

### C.1 Fonte única de regras do projeto

1. **`CLAUDE.md` na raiz, versionado**, com no máximo 80 linhas e só fatos verificáveis: o que o projeto é hoje (core transpiler por substituição, playground, Engoianador, extensão), os comandos reais (`pnpm test`, `pnpm lint`, `pnpm e2e`, `pnpm playground:dev`), o mapa de pastas, a política de idioma (ADR-0002), o formato de commit, branch e PR (ADR-0009), "como mudar a linguagem" (RFC) e **três overrides explícitos** sobre as regras globais: superfície da linguagem e mensagens ao usuário em goianês; commits sem escopo Jira; JS no core com JSDoc até haver decisão de migrar. Remover `CLAUDE.md` e `.claude/` do `.gitignore`, deixando só `.claude/settings.local.json` ignorado.
2. **`.github/copilot-instructions.md`** vira ponteiro de 3 linhas para `CLAUDE.md` (ou um `AGENTS.md` com o mesmo conteúdo).
3. **`CONTRIBUTING.md`** é só para humanos: fluxo, commits, RFC/ADR; o backlog sai do documento e vai para Issues e Projects.
4. **Remover `personal-projects/.claude/rules/*.md`** (9 cópias obsoletas); a camada global já cobre. Se faltar uma regra específica de "projetos pessoais", escrever um único arquivo curto.
5. **Regras viram verificação, não prosa:** `commitlint` (formato e 72 colunas), `spec:check` (F03), `docs:test` (F09), `lychee` (F26), testes golden por palavra (F19).

### C.2 ADRs que deveriam existir

Formato sugerido: MADR curto em `docs/adr/NNNN-slug.md` (Status, Contexto, Decisão, Consequências).

| ID | Título | Decisão a tomar | Opções | Default sugerido | Prio. | Motivado por |
|---|---|---|---|---|---|---|
| 0001 | Adotar ADRs e RFCs | como registrar decisões | MADR curto + RFC leve; ou só descrição de PR | MADR curto + RFC leve (C.3) | P0 | F12 |
| 0002 | Política de idioma | comentários PT×EN; nomes exportados PT×EN; `--help`; docs de contribuição | (a) PT nos comentários, EN nos identificadores, API pública EN com aliases goianos; (b) tudo PT; (c) tudo EN | (a), alinhada à prática e à regra global | P0 | F11, F04 |
| 0003 | Especificação única e vocabulário | `keywords.json` como fonte; destino de `se`/`senao`/`fazer`, `presta_serviço`, `vazio`/`sei_lá`, tipos, decoradores; política de palavras reservadas e aliases | alias deprecado com aviso; remoção declarada; restauração | alias `presta_serviço -> faz_trem` deprecado com prazo; `se`/`senao` implementar ou remover dos docs | P0 | F02, F03 |
| 0004 | Estratégia de tradução | regex (atual) × tokenizer + regras × parser real em JS/TS × parser Rust compilado para WASM | tokenizer que protege strings, templates e comentários agora; parser real só depois das RFCs de módulos e tipos | tokenizer agora | P1 | F22, Anexo E.2 |
| 0005 | Versionamento e distribuição no npm | 2.0.0 publicada × linha 1.5; lockstep core/apps/extensão; provenance | 3.0.0 + `npm deprecate` da 2.0.0; dist-tag; novo nome | 3.0.0 + deprecate | P0 | F05 |
| 0006 | Hospedagem e URL canônica | Vercel × Cloudflare Pages; domínio próprio × subdomínio | uma plataforma, URL por variável de ambiente | uma plataforma + `NEXT_PUBLIC_SITE_URL` e `ALLOWED_ORIGINS` por ambiente | P0 | F10 |
| 0007 | Engoianador: provedor, modelo e limites | LLM, modelo em `vars`, quota (min × dia), fallback, kill switch, custo | Groq, Workers AI, ambos | modelo configurável + teste de saúde do provedor | P1 | F10 |
| 0008 | Qualidade e gates | cobertura (50 -> 80 com prazo), escopo (core + apps), lint dos apps, `format:check`, matriz Node, pre-commit, docs e exemplos como teste | ver F17 e F19 | gates no CI + prazo datado | P1 | F17, F19 |
| 0009 | Branches, PR e releases | trunk-based, proteção de `main`, squash-only, delete-on-merge, tags, formato de commit | uma pessoa × com revisor | uma pessoa: CI verde + checklist; squash-only | P1 | F15, F16, F11 |
| 0010 | Preservação do histórico | manter × `filter-repo` (remover `target/` e binários) × repositório de arquivo; material estratégico no histórico público | manter + tag; limpar | tag `archive/*` agora; decidir reescrita só se o peso importar | P2 | F14, F12 |
| 0011 | Extensão VS Code: escopo e publicação | declarativa; sem LSP e debugger; versão; Marketplace + Open VSX; extensão `.gs` | ver Anexo D.5 | declarativa, versão independente a partir de 0.x | P1 | F01, F07, F20, F30 |
| 0012 | Modelo de ameaças e `SECURITY.md` | superfícies (playground, Worker, CLI que executa código, extensão), canal, versões suportadas | PVR do GitHub + documento | PVR + `SECURITY.md` reescrito | P0 | F06, F01, F08 |
| 0013 | Fonte única de instruções para agentes | `CLAUDE.md` × `AGENTS.md` × `copilot-instructions.md`; camada `personal-projects` | `CLAUDE.md` + ponteiros | `CLAUDE.md` único | P0 | F04, F11 |
| 0014 | Escopo da linguagem 1.x e não-objetivos | JIT, debugger, gerenciador de balaios, framework web: fora; módulos, tipos, decoradores: candidatos a RFC | lista explícita | não-objetivos declarados, o resto vira RFC | P1 | F02, F12 |

### C.3 Processo leve de RFC para mudanças na linguagem

- **Quando exige RFC:** nova palavra, operador ou método do runtime; renomear ou remover qualquer um deles; mudança de nome de comando ou flag da CLI; mudança na API pública JS (`goiasscript` e `goiasscript/browser`); mudança no formato do `.gs`. Correção de bug que aproxima o comportamento do documentado vai direto em PR.
- **Fluxo:** (1) issue `[RFC] título` com template `rfc.md` e label `rfc`; (2) PR que adiciona `docs/rfcs/NNNN-slug.md` (NNNN = número do PR) a partir de `docs/rfcs/0000-modelo.md`; (3) 72 h de comentário (projeto com uma pessoa mantendo) ou 1 aprovação externa, se houver; (4) decisão no front matter (`status: aceita | rejeitada | adiada`); (5) o PR de implementação cita a RFC e inclui a atualização de `keywords.json`, testes golden (`.gs` -> `.js`), artefatos regenerados, nota de migração se for breaking e entrada de CHANGELOG na seção "Linguagem".
- **Modelo (seções):** Resumo; Motivação; Sintaxe goiana proposta (antes e depois, `.gs` -> JS); Colisões (identificadores e propriedades comuns, busca no corpus de exemplos); Compatibilidade; Impacto (transpiler, runtime, TextMate, Monarch, snippets, docs, REPL); Testes de aceitação; Alternativas; **Teste da prosa** (a palavra existe no falar goiano? grafia e acentuação estáveis? origem citada? respeita o `CODE_OF_CONDUCT.md`?); Questões em aberto.
- **Critérios de aceite:** não introduz colisão com palavras comuns sem regra contextual; os artefatos regeneram sem diff; nenhum falso positivo novo nos 25 blocos de docs e nos 15 exemplos; CHANGELOG atualizado.
- **Versionamento da linguagem:** palavra nova = MINOR (com aviso se colidir com identificadores plausíveis); renomear ou remover = MAJOR; alias deprecado emite aviso por pelo menos uma minor antes de sair.
- **Registro:** `docs/rfcs/README.md` com índice e status; ADR só para decisões de engenharia.

### C.4 Estrutura de documentação alvo

```
CLAUDE.md                  fonte única para agentes (versionado)
CONTRIBUTING.md            humanos: fluxo, commits, RFC/ADR
docs/adr/                  decisões de engenharia (0001..)
docs/rfcs/                 mudanças na linguagem (modelo + índice)
docs/language/
  keywords.json            fonte única do vocabulário
  spec.md                  semântica, reservados, ASI, strings/templates/comentários
  glossario.md             origem e grafia de cada palavra (teste da prosa)
  legado-1.0.md            migração 1.0.x -> 1.5
docs/guias/                tutorial, CLI, REPL
docs/referencia/metodos.md gerado a partir do runtime
```

### C.5 Ordem de execução

| Prio. | Item | Esforço |
|---|---|---|
| P0 | Corrigir F01 (ou desativar os 2 comandos); trocar Pix e Sponsors (F08); ativar PVR e reescrever `SECURITY.md` (F06); ADR-0005 e correção do README de instalação (F05); reescrever `CLAUDE.md` (F04) | S a M |
| P0 | ADR-0001 e ADR-0013; remover `personal-projects/.claude/rules/*` | S |
| P1 | `keywords.json` + `spec:build`/`spec:check` (F03); ADR-0002, 0003, 0004; decisão de hospedagem (F10); `docs:test` e correção dos exemplos (F09); `.gitignore` (F13); gates de CI (F17); proteção de `main`, remoção de branches, port da correção do `;` (F15) | M |
| P2 | Recriação da extensão (D.5); ADR-0010 e tags de arquivo; check de links; `commitlint` | M a L |

## Anexo D — Extensão VS Code

### D.1 Manifest × implementação

| Contribuição | Declarado | Implementado | Evidência |
|---|---|---|---|
| Comandos | 8 | 2 com handler (`traduz`, `bota_pra_moer`); sem handler: `ve_se_ta_certo`, `compile`, `run`, `checkTypes`, `arma_o_barraco`, `newFile` | `package.json:119-168`; `extension.js:59, 78` |
| Menus e atalhos | 8 entradas de menu, 4 atalhos | 4 apontam para comando inexistente: `editor/context` `ve_se_ta_certo`, `commandPalette` `newFile`, atalhos `ctrl+shift+g ctrl+c` e `ctrl+shift+g ctrl+n` | `package.json:169-239` |
| Debugger | `program: ./out/debug/goianoDebugAdapter.js`, `${command:AskForProgramName}` | arquivo e comando inexistentes; `out/` é ignorado (`.gitignore:16, 90`) | `package.json:60-109` |
| Language client | servidor em `../lsp-server/server.js` | não existe (arquivado; pasta vazia); `client.start()` sem `await` nem `catch`; watcher `**/.gs` (deveria ser `**/*.gs`) | `extension.js:11-46` |
| Configuração | 7 settings | 0 leituras (`getConfiguration` ausente) | `package.json:240-280` |
| Ícones de arquivo | `languages[].icon` e `iconThemes` | tema define só `.gs` [HIPÓTESE: ao ativar, os demais arquivos ficam sem ícone] | `package.json:55-58, 281-287` |
| `engines.vscode` | `^1.80.0` | `vscode-languageclient@9.0.1` exige `^1.82.0` | `package.json:15-17`; `package-lock.json` |
| Versão | 2.2.0 | lock em 2.1.0; descrição "Framework 2.1"; script `install-extension` aponta para `0.3.0`; core 1.5.0 | `package.json:4-5, 291` |
| Categorias e palavras-chave | `Themes`, `Language Packs`; `nestjs`, `angular`, `tailwind`, `framework`, `fullstack` | resíduos do v2; [HIPÓTESE] "Language Packs" é a categoria dos pacotes de localização | `package.json:18-42` |
| Ativação | `onLanguage:goiasscript` | ok | `package.json:299-301` |

### D.2 Gramática TextMate

- Cobertura sobre as 53 chaves [VERIFICADO: `vscode-textmate` 9.3.1 + `vscode-oniguruma` 1.7.0 do VS Code instalado, `probes-gov/grammar-coverage.js`]: 50 com escopo, 3 sem (`vai_na_frente_faz_trem`; `faz_trem` quando não segue `nome(`; `indefinido`). Em 15 exemplos reais (453 ocorrências de palavras-chave), 0 ficaram sem escopo.
- Defeitos em contexto [VERIFICADO: `grammar-realworld.js`, `grammar-edge.js`]: `nada` como `storage.type.primitive` (`:188`); `lista`/`texto`/`numero`... como tipo em qualquer posição (`lista.pra_cada` colore `lista` como tipo); `:` como operador de tipo em objetos e ternários (`:192`); `'...'` e crases não são strings (`strings` só trata `"`, `:146-156`), então palavras-chave dentro delas são coloridas; builtins `sorteio`, `pra_cada`, `vira_numero` sem escopo; termos que o 1.5 não traduz (`diferente_de`, `vazio`, `sei_lá`, decoradores, `pega`, `troca_ideia`) coloridos como válidos.

### D.3 Snippets

37 snippets; 21 geram JS sintaticamente válido no 1.5 (13 deles com referência indefinida só por serem molde); 16 geram código que o 1.5 não traduz [VERIFICADO: `probes-gov/snippets-check.js`]: `faz_trem_tipos`, `async_tipos` (parâmetros e retornos tipados), `pega`, `pega_named`, `pega_mixed`, `pega_tudo_de`, `troca_ideia_principal`, `troca_ideia`, `troca_ideia_single`, `modulo_completo`, `@Componente`, `@Controlador`, `@Injectable`, `@Pegar`, `@Postar`, `modulo_framework`.

### D.4 Requisitos de publicação do `vsce`

`vsce` não foi executado; os itens abaixo combinam o inventário do VSIX 2.2.0 [VERIFICADO] com o comportamento conhecido da ferramenta [HIPÓTESE].

| Requisito | Estado |
|---|---|
| `publisher` válido no Marketplace e PAT | `gefferson-souza` declarado; existência não verificável; extensão não encontrada no Marketplace nem no Open VSX [KNOWN-FACTS] |
| `repository`, `bugs`, `homepage` | presentes |
| `license` e arquivo `LICENSE` | ausentes (manifest e pasta); [HIPÓTESE] o `vsce` avisa e pede confirmação; `--skip-license` contorna |
| `.vscodeignore` ou `files` | ausentes: o VSIX 2.2.0 contém `vsc-extension-quickstart.md`, 2 PNG idênticos de 1,3 MB e 313 arquivos de `node_modules` (`vscode-languageclient` 131, `vscode-languageserver-protocol` 68, `semver` 52, `vscode-jsonrpc` 48, outros 14) |
| `icon` PNG >= 128 px | PNG 1024x1024 RGB, 1,3 MB; atende, mas sem otimização |
| `engines.vscode` coerente com as dependências | incoerente (`^1.80.0` vs `^1.82.0`) |
| `README` sem molde, sem links relativos quebrados | README próprio, porém desatualizado, cerca de código aberta e instrução falsa de Marketplace |
| `CHANGELOG` | molde "Initial release" |
| Testes e CI de empacotamento | nenhum job para a extensão no `ci.yml`; sem testes |
| Gerenciador de pacotes | fora do workspace pnpm; `package-lock.json` próprio, rastreado e ignorado ao mesmo tempo |

O VSIX 2.2.0 é idêntico ao código atual nos 5 arquivos comparados (manifest, `extension.js`, gramática, snippets, README).

### D.5 Veredito: reciclar os ativos, recriar a casca

- **Reciclar:** gramática (base boa, ajustes de contexto), `language-configuration.json`, snippets (21 válidos), logo como fonte do ícone, ideia do tema de ícones (só se completa).
- **Recriar:** `extension.js` e `package.json`. Uma extensão **declarativa** (sem `main`, sem dependências) cobre gramática, configuração, snippets e ícone. Se os dois comandos forem mantidos, um `extension.js` mínimo sem LSP, usando `ShellExecution` com argumentos (F01), lendo `goiasscript.compilerPath`.
- **Remover:** `debuggers`, `LanguageClient`, 6 comandos, 4 pontos de menu/atalho quebrados, 7 settings sem uso, `vscode-languageclient` e `vsc-extension-quickstart.md`.
- **Gerar, não digitar:** TextMate, Monarch e snippets a partir de `keywords.json` (F03); teste de gramática no CI com fixtures por palavra.
- **Publicação:** `LICENSE`, `.vscodeignore`, versão alinhada (ADR-0011), `vsce package --no-dependencies` no CI, publicação em Marketplace e Open VSX só depois do F01 e do ADR-0005; README com capturas reais.
- **Adiar:** LSP e debugger. O servidor arquivado serve de semente para o autocompletar do Monaco (Anexo E.3).

## Anexo E — Histórico e o que salvar

### E.1 `archive/v2-experimental` (= `staging` = tag `v2.0-pre-archive`, commit `e14b7c3`)

140 arquivos de texto, 25.892 linhas (mais 16.222 em lockfiles) e 2 binários (2,5 MiB). `git diff --shortstat b2fdb21 e14b7c3`: 145 arquivos, +40.570/-980 (o README fala em "38k+"). Para comparação, `origin/main`: 120 arquivos de texto, 11.323 linhas; o core caiu de ~18.981 linhas (src, bin, tests, templates, examples, balaios, lsp) para 5.299 (-72%).

| Área | Arquivos | Linhas | Conteúdo | Destino |
|---|---|---|---|---|
| `templates/` | 42 | 6.392 | `goias-web-framework` (2.746, framework web tipo NestJS/Angular em `.gs`), `roda-de-prosa` (2.246, DDD em `.gs`), `projeto-web` (445) | descartar; referência para RFC de módulos/decoradores |
| `src/` | 15 | 5.301 | `ASTParser` (427), `TypeAnalyzer` (350), `ModuleResolver` (372), `JITCompiler` (389), `PackageManager` (649), `GoianoDebugger` (440) + `GoianoDebugAdapter` (308), mais o core que continua | `ASTParser`, `TypeAnalyzer` e `ModuleResolver` são regex por linha, não parsers reais; referência; JIT, PackageManager e debugger: descartar |
| `tests/` | 13 | 2.573 | testes dos módulos arquivados | descartar |
| `bin/` | 8 | 2.408 | `gs-balaio` 207, `gs-fuça` 322, `gspack` 207, `gsdebug` 213, `gs-debug-adapter` 24, `gsrepl` 389, mais `goias` e `goiasscript` | descartar |
| material de planejamento pessoal | — | — | — | fora do repositório público (F12) |
| `vscode-extension/` | 11 | 1.241 | a mesma extensão | ver Anexo D |
| `examples/` | 13 | 1.070 | exemplos, módulos, performance | corpus de referência |
| `balaios/` | 3 | 631 | `goiano-http` 364, `goiano-utils` 229+35 | corpus de referência |
| `lsp-server/` | 3 | 606 | servidor LSP (455) + README | **salvar** como semente |
| Raiz (README, ROADMAP, `goiasscript.js` legado, configs) | 19 | 2.840 | `README` (445), `goiasscript.js` v1 (535), `ROADMAP` (331), release notes, instalação | histórico |
| `.github`, `.vscode`, `docs`, `scripts` | 8 | 957 | CI, tarefas, `METODOS_GOIANOS`, build | já migrado |

Resultado do corpus `.gs` do arquivo (36 arquivos, 4.317 linhas) no transpiler 1.5 [VERIFICADO: `probes-gov/archive-corpus.js`]: 3 geram JS que executa, 33 geram JS inválido (todos os de `templates/`, `balaios/` e `examples/modules`).

### E.2 Protótipo Rust (commits `adee62c`, `e180182`, `7e1a2c6`, 2025-04-13)

[VERIFICADO: `cargo build`, `cargo clippy`, `rustc`, sondas em `probes-gov/`]

| Snapshot | Linhas `src/` | `cargo build` | Exemplos `.gs` (traduz / compila com `rustc`) |
|---|---|---|---|
| `adee62c` | 1.488 | ok, 5 warnings | 4/6 traduzem, 3/6 compilam (`controle` e `exemplo_completo` falham no parser: "Esperava ';' após expressão") |
| `e180182` | 1.625 | ok, 14 warnings (`clippy`) | 12/12 traduzem, 9/12 compilam (`programa_avancado` e `rpg_aventura`: "argument never used"; `rpg_simples`: E0308) |
| `7e1a2c6` (último com Rust) | 1.630 | **falha**: 3 erros E0308 (`translator.rs:265, 309`, `main.rs:72`) | n/a |

| Arquivo | Linhas | Avaliação |
|---|---|---|
| `lexer.rs` | 216 | `logos`; 48 tokens, 35 das 53 chaves do 1.5 (faltam as de classe, `faz_trem`, `vai_na_frente_faz_trem`, as de promise, `vixe`, `nada`, `indefinido`, `em`, `de`, `por_fim`; tem `presta_serviço`, `vazio`, `sei_lá` do 1.0); identificadores só ASCII (`[a-zA-Z_][a-zA-Z0-9_]*`), enquanto as palavras-chave têm acento; só strings de aspas duplas; sem template literals |
| `parser.rs` | 573 | descida recursiva com precedência (or, and, igualdade, comparação, soma, fator, chamada, primário); sem else-if (`se_num_for` existe como token e o parser nunca o usa), sem operador unário (`num_é` nunca construído), sem acesso a membro (`.` é token e nunca é consumido), sem array/objeto/lambda/`await`/`new`, sem classes; `;` obrigatório; `eprintln!` de depuração para os bytes 550-560 (`:542-554`) |
| `ast.rs` | 139 | enums razoáveis; 6 variantes de `Expression` e 2 de `UnaryOperator` nunca construídas (avisos do compilador) |
| `translator.rs` | 437 | gera **código Rust**, não JavaScript; heurísticas: todo parâmetro vira `impl Display`, qualquer função com `faz_favor` vira `-> String`, `+` com string vira `format!`, caso especial de concatenação em `println!` (sai "Olá, Gefferson !" com espaço extra); `async` emite `use async_trait::async_trait;` que não resolve no `rustc` (E0432); construções não suportadas viram o texto `/* expressão não implementada */` no código gerado |
| `keywords.rs` | 85 | `KEYWORDS` e `SPECIAL_PATTERNS` com `#[allow(dead_code)]`: nunca usados |
| `main.rs` | 152 | CLI `clap` com modos Translate/Build/Release/Doc; chama `rustc` |
| Geral | n/a | 0 testes, sem README, 7 binários ELF e `target/` commitados; `Cargo.toml` com comentário "Adicione esta dependência" |

Sondas no compilador Rust (`e180182`): 11 de 12 construções do 1.5 falham (array literal, chamada de método, seta, `faz_trem`, classe, aspas simples, código sem `;`, identificador acentuado, `se_num_for`, `num_é`, `espera_um_cadim`); só o caso básico `uai x é 5; prosa("x = " mais x);` passa.

**Veredito: só referência.** Motivos: o alvo é Rust, não JS (seria preciso um emissor novo); o lexer reconhece 35 das 53 chaves e o parser cobre bem menos da gramática que o 1.5 aceita; sem testes; o último snapshot não compila. O esqueleto `logos` + descida recursiva + AST em enum é um desenho aceitável para recomeçar, mas seria reescrita, não evolução: lexer com `\p{L}` e tratamento de newline/ASI, gramática completa de expressões (membro, chamada, array, objeto, seta, template, `new`, `await`, unário), classes, try/catch, source maps, emissor JS, testes golden a partir dos 15 exemplos e dos 25 blocos de docs, build `wasm-pack` com orçamento de tamanho. A escolha Rust/WASM versus tokenizer em JS é o ADR-0004.

### E.3 O que salvar

| Item | Origem | Ação |
|---|---|---|
| Correção do delimitador `;` e `bug-repro.test.js` | `origin/DEVELOPMENT` (`c8c0495`, `95ab66a`) | portar para `main` com teste (F15) |
| Servidor LSP (diagnósticos, completion, hover) | `archive/v2-experimental:lsp-server/server.js` (455 linhas; deps `vscode-languageserver` 9) | semente do autocompletar do Monaco, após alinhar à spec; README dele repete nomes inexistentes (`.gritando()`) |
| Corpus `.gs` (36 arquivos) | `archive/v2-experimental` | insumo de RFC de módulos, tipos e decoradores; não é teste |
| `TypeAnalyzer`, `ModuleResolver` | `archive/v2-experimental` | referência de RFC; não ressuscitar como estão (regex por linha) |
| Protótipo Rust | commits `adee62c`..`7e1a2c6` | tag `archive/rust-prototype` em `e180182` |
| Planos e estratégia | histórico público (várias refs) | manter fora do repositório; decidir limpeza em ADR-0010 |
| JIT, PackageManager, debugger, templates web, bins | `archive/v2-experimental` | descartar (declarar como não-objetivos no ADR-0014) |

## Anexo F — Artefatos de prova e limites

Diretório: `.../scratchpad/audit/probes-gov/`.

| Artefato | Conteúdo |
|---|---|
| `extract-table.js`, `mapping-table.json` | tabela de 55 entradas / 53 chaves do transpiler |
| `lib-probe.js`, `claims.js`, `doc-blocks.js`, `examples-run.js`, `snippets-check.js`, `core-edge.js`, `archive-corpus.js` | transpilação e execução em `vm` (timers neutralizados) de afirmações, blocos de docs, exemplos, snippets e corpus arquivado; saídas `*.out.txt` |
| `lib-grammar.js`, `grammar-coverage.js`, `grammar-realworld.js`, `grammar-edge.js` | tokenização com `vscode-textmate` e `vscode-oniguruma` (do VS Code instalado em `/usr/share/antigravity`) |
| `drift.js`, `doc-coverage.js`, `compat-1.0.js` | divergência de vocabulário entre fontes, cobertura documental e comparação 1.0.x -> 1.5 |
| `count-ref.js` | contagem de linhas por ref sem checkout |
| `commit-audit.js` | conformidade dos commits (`commit-audit.out.txt`) |
| `rust*/`, `rust-out-*/`, `rust-probe/`, `cargo-build-*.txt`, `target-rust-*` | Rust extraído (sem `target/`) e resultados de build e exemplos |
| `vsix-2.2.0/` | 5 arquivos de texto extraídos do VSIX para comparação |
| `inj/` | PoC do F01: `POC.txt` (roteiro) e o marcador `PWNED_ASPAS` criado pela injeção |
| `icons-render/` | renderização Chromium dos ícones SVG e do PNG |

Limites: sem execução do VS Code, do `vsce` nem do npm; estado do npm e fatos do core vêm de `KNOWN-FACTS.md`; o hook `quality-pretooluse.mjs` e as regras globais não foram inspecionados além do digest; classificação de idioma dos comentários é heurística (PT/EN por vocabulário e acentos).
