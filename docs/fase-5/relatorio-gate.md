# Relatório do gate da Fase 5

**Veredito proposto:** pronto para o GATE 5 assim que (a) a CI do `vscode.yml` passar nas seis combinações (Ubuntu,
Windows e macOS; VS Code estável e 1.90.0), que nunca rodaram localmente, e (b) o dono conferir a extensão num VS Code
real (seção 8). A revisão de segurança não achou CRITICAL nem HIGH. Os dois achados de nível MEDIUM/LOW que tinham
correção barata foram corrigidos com teste antes (seção 5). Nada foi publicado e nenhuma tag foi criada.

Medição: Node v26, Linux. Cobertura e contagens vêm de `corepack pnpm verify` (23/10/2026, depois do último commit de
código). Tempos são de uma execução.

## 1. Unidades e commits

Os commits não carregam o número da unidade no título; o agrupamento é pelo assunto.

| Unidade | Commits principais |
| --- | --- |
| U5-01 pacote, host injetável e build | f07f5f3, dbbb9c4, 507da61, 916c012, 0ad8586 (lockfile do esbuild) |
| U5-02 diagnósticos em tempo real | e260aaa, 54395c8 |
| U5-03 autocomplete e hover | 6d1040a, 4dafd42, 02dadf5 |
| U5-04 comandos `traduz` e `bota_pra_moer` | 865c442, 82c26fb, 70a07fd, 8c29cab |
| U5-05 gramática, snippets, ícones e configuração | db42f6a |
| U5-06 testes dentro do VS Code | 8ee003e, 2ff2884 (matriz de CI), 17e25b0 (suites de Modo Restrito e nomes hostis) |
| U5-07 release preparado | a26b701, 4944618, 8882fdf |
| U5-08 revisão de segurança e este relatório | 753ae55, e16e9c3 (relatório), 9ee4153 (correções do relatório) |

## 2. Cobertura (`vitest run --coverage`)

| Alvo | Linhas | Ramos | Funções | Instruções |
| --- | --- | --- | --- | --- |
| `packages/vscode/src` (sem `extension.ts` e `host/vscode-host.ts`) | 98,15% (319/325) | 93,23% (179/192) | 97,22% (105/108) | 97,45% (382/392) |
| Repositório inteiro (cobertura do `verify`) | 98,79% | 93,72% | 98,49% | 98,28% |

Total do `verify`: 2.260 testes passando, 7 ignorados, 193 arquivos (mais 1 ignorado); projeto `compiler` à parte: 966
testes. Só o pacote da extensão: 255 testes em 25 arquivos. O piso de 80% vale por pacote e o `verify` sai 0.

Os dois arquivos fora da conta (`extension.ts` e `host/vscode-host.ts`) são a única fronteira com a API do VS Code; só
rodam dentro do editor e ficam por conta de `test:integration` (seção 3).

## 3. `test:integration` por sistema e versão do VS Code

| Sistema | VS Code estável | VS Code 1.90.0 |
| --- | --- | --- |
| Ubuntu | **pendente de CI** | **pendente de CI** |
| Windows | **pendente de CI** | **pendente de CI** |
| macOS | **pendente de CI** | **pendente de CI** |

Não foi medido: por restrição de disco desta unidade o VS Code não é baixado localmente (o `@vscode/test-electron` vive
só na CI). As suites estão escritas e conferidas por tipo e lint: nomes hostis, esquema, Modo Restrito (confiável e não
confiável) e diagnósticos. Rodam em `vscode.yml` (a cada push em `v3/**`) e, sobre o `.vsix` do release, em
`release-vscode.yml`. **Nada neste relatório afirma que passam.** Falha em qualquer combinação bloqueia a fase.

## 4. Tabela de nomes hostis

Todo nome vai ao filho como **um único elemento** do argv, depois de `--`, sem `shell`. O teste de unidade confere a
lista de argumentos; o de integração espia `child_process` dentro do VS Code e exige `shell` ausente, o caminho uma vez
só depois de `--` e o marcador `PWNED` nunca criado.

| Nome | Unidade (`cli-invocation.test.ts`) | Integração (`hostile-names.test.ts`) |
| --- | --- | --- |
| `a$(touch PWNED).gs` | um argumento, depois de `--` | idem, execução real |
| `` a`touch PWNED`.gs `` | idem | idem (no Windows só se o sistema aceita o nome) |
| `a";touch PWNED;".gs` | idem | idem (aspas fora do NTFS) |
| `a;b.gs` | idem | idem |
| `a b.gs` | idem | idem |
| `-x.gs`, `a&b.gs`, `a\|b.gs`, `a'b.gs`, nome com quebra de linha, `café.gs` | idem | não (só unidade) |
| `--sobrescreve` como nome | `--sobrescreve` real entra antes do `--`, o nome depois | não (só unidade) |

Esquema: `scheme-guard.test.ts` recusa documento `untitled` e de provedor virtual nos dois comandos antes de qualquer
execução. Modo Restrito: `untrusted-workspace.test.ts` roda nos dois perfis (`traduz` funciona nos dois;
`bota_pra_moer` só executa com confiança).

## 5. Revisão de segurança e disposição

**Como foi feita.** A ferramenta de subagente não estava disponível na execução desta unidade; a revisão foi feita
direto pelo executor, em modo de leitura, sobre `packages/vscode` (manifesto, `src/**`, testes),
`scripts/{build-vscode,pack-vscode,release-target-vscode,smoke-extension}.ts` e `.github/workflows/{release-vscode,vscode,smoke-extension}.yml`
(perímetro ignorado: `packages/core`, `vscode-extension`, `node_modules`, `dist`). Foi conferido também o `.vsix`
empacotado de verdade (seção 7). **A revisão em contexto fresco por agente independente, que o aceite pede, continua
pendente** e deve ser disparada pelo dono ou pelo orquestrador antes do GATE 5.

### 5.1 Achados

| # | Severidade | Onde | Descrição | Disposição |
| --- | --- | --- | --- | --- |
| 1 | MEDIUM | `package.json` (`capabilities`), `lessonBaseUrl` | Uma pasta não confiável podia trazer `goiasscript.lessonBaseUrl` nas próprias configurações e fazer os links de diagnóstico e hover levarem a uma página de terceiro (https, mas escolhida por quem preparou a pasta). | **Corrigido** em 753ae55: `restrictedConfigurations` lista a chave; teste no manifesto (RED observado antes). |
| 2 | LOW | `settings/settings.ts` | O endereço de lição aceitava `https://usuario:senha@host`. O playground já recusa; a extensão destoava. | **Corrigido** em 753ae55: usuário ou senha no endereço viram `null`; teste (RED observado antes). |
| 3 | MEDIUM | `.github/rulesets/tags.json`, `release-vscode.yml` | O ruleset de tags só protege `legacy/*` e o arquivo do protótipo; quem tem escrita pode empurrar `vscode-v*` e disparar o workflow. Contenções que existem: ambientes `marketplace` e `open-vsx` (a aprovação é do dono) e a conferência de que o commit da tag está na `main`. | Corrigido no arquivo: `refs/tags/vscode-v*` entrou no ruleset versionado (deletion, update, non_fast_forward) com teste em `rulesets.test.mjs`. Aplicar o ruleset no GitHub continua com o dono (checklist da seção 11). |
| 4 | LOW | `release-vscode.yml` | Os dois jobs de publicação são independentes: um pode publicar e o outro falhar, e as versões divergem entre Marketplace e Open VSX. | Aceito: a correção é republicar com a versão seguinte; o `smoke-extension.yml` confere os dois lados. |
| 5 | LOW | `diagnostics/live-diagnostics.ts` | Documento de até 500.000 caracteres é compilado no processo de extensões: medido 257 a 362 ms (mediana de 5, 25 mil linhas). O `getText()` roda em todo evento mesmo para documento acima do teto. | Aceito: o teto existe, o atraso (padrão 300 ms) agrupa a digitação e o compilador é linear. |
| 6 | LOW | `cli-invocation.ts` | O `cwd` do filho é a pasta do arquivo (controlada pelo usuário). | Aceito: é o que faz caminhos relativos do programa funcionarem; o Node resolve módulos pelo script (caminho absoluto dentro da extensão), e `NODE_OPTIONS`, `LD_PRELOAD` e afins não passam (lista fechada de variáveis, testada). |
| 7 | LOW | `pack-vscode.ts`, `smoke-extension.ts` | `GS_EXTENSION_PUBLISHER` entra no manifesto empacotado e no caminho da consulta ao Open VSX sem escape. | Aceito: o valor é do dono, em ambiente que ele controla; o workflow do smoke nem o repassa. |
| 8 | LOW | `release-vscode.yml` | Os jobs de publicação rodam `pnpm install`. | Aceito: o pnpm 10 não executa scripts de instalação de dependências por padrão e não há `onlyBuiltDependencies`; a lockfile é congelada. |
| 9 | INFO | `run-program.ts` | `bota_pra_moer` executa o arquivo salvo em disco, não o texto ainda não salvo do editor. | Sem efeito de segurança; registrado. |
| 10 | INFO | `command-guards.ts` | No Windows, um `file:` de compartilhamento de rede (UNC) passa na guarda. | Aceito: só executa em pasta que o dono marcou como confiável. |

### 5.2 Checklist do plano e evidência

- **Execução por nome de arquivo:** nenhum `exec`, `execSync`, `shell: true` nem `Terminal.sendText` em `src/` (busca
  feita e coberta por `cli-invocation.test.ts` e `hostile-names.test.ts`). `traduz` usa `execFile`, `bota_pra_moer`
  usa `spawn`, ambos com lista de argumentos e o arquivo depois de `--`.
- **Esquema do documento:** `guardCommand` recusa tudo que não é `file:` antes de qualquer outra checagem;
  `resolveDocument` devolve `undefined` quando o documento não abre como texto. Diagnósticos só compilam `file:` e
  `untitled:` e nunca executam código.
- **Modo Restrito:** `bota_pra_moer` com `when: isWorkspaceTrusted` em menus (paleta, título do editor, explorador) e
  atalho, mais a checagem em runtime em `guardCommand`; `capabilities.untrustedWorkspaces.supported = 'limited'` com
  texto em goianês, mais a restrição da chave de lições (achado 1). Cobertos por `manifest.test.ts`,
  `command-guards.test.ts` e `untrusted-workspace.test.ts`.
- **Ambiente do filho:** lista fechada (`PATH`, `HOME`, `USERPROFILE`, `TMPDIR`, `TEMP`, `LANG`, `SystemRoot`) mais
  `ELECTRON_RUN_AS_NODE=1`; teste com `NODE_OPTIONS`, `LD_PRELOAD`, `DYLD_INSERT_LIBRARIES` e segredo de exemplo.
- **`cwd`:** achado 6.
- **Markdown de hover e documentação:** `MarkdownString` com as opções de `UNTRUSTED_MARKDOWN_OPTIONS` (`isTrusted = false`,
  `supportHtml = false`), aplicadas em `host/vscode-host.ts`; `hover.test.ts` confere as opções e que uma base de
  lição com `(`, `)`, `]`, espaço e `<` gera um único link bem formado, com os parênteses e o espaço escapados.
- **Sequência de controle:** `sanitizeTerminalText` tira controles (inclusive ESC e CR), formato e separadores de
  linha e parágrafo; vale para o terminal, o título do terminal, o canal de saída e a mensagem de sucesso;
  `stripEscapeSequences` limpa setas e colar na digitação antes do `stdin` do filho
  (`sanitize-terminal-text.test.ts`, `program-terminal.test.ts`).
- **Regex e laço sobre documento grande:** o teto de 500.000 caracteres vale antes de compilar; hover e autocomplete
  varrem só a linha, em tempo linear e sem regex com retrocesso (achado 5).
- **`lessonBaseUrl`:** só `https:`, sem usuário e senha, restrito no Modo Restrito; o identificador da lição passa por
  `^[a-z0-9-]+$` (`settings.test.ts`, `manifest.test.ts`).
- **Conteúdo do `.vsix`:** seção 7.
- **Workflow:** `contents: read` por padrão; `id-token: write` só no job `publish-marketplace`; token do Open VSX só no
  `env` do passo de publicação; todas as actions por SHA; um único `.vsix` (o job exige exatamente um e a versão no
  nome); SHA-256 calculado no empacotamento e conferido nos jobs de integração e de publicação; commit da tag
  conferido como ancestral da `main`; `vsce` e `ovsx` em versão exata no `package.json`; `vscode.yml` roda só em push e
  `pull_request` (nunca `pull_request_target`).

### 5.3 Revisão independente

Pendente (seção 5). Quando rodar, anexar aqui a tabela do `everything-claude-code:security-reviewer`; sem CRITICAL ou
HIGH abertos o gate fecha.

## 6. Orçamentos medidos

| Medida | Valor |
| --- | --- |
| `dist/extension.cjs` (brotli, qualidade máxima) | **49.579 B** (bruto 237.009 B); catraca em `budgets.json` atualizada de 49.492 para 49.579 B pela correção do achado 2 |
| `.vsix` | **334.712 B** (`stat -c %s packages/vscode/pack/goiasscript-vscode-0.3.0.vsix`), 21 entradas, 1.452.149 B descomprimidos |
| CLI embutido (`dist/cli`) | `optimizer.mjs` 896.780 B é a maior parte; é o bundle do CLI da Fase 3, sem mapa |

## 7. Conteúdo do `.vsix` (`corepack pnpm pack:vscode`)

```
extension.vsixmanifest, [Content_Types].xml
extension/package.json, readme.md, changelog.md, LICENSE.txt, language-configuration.json
extension/syntaxes/goiasscript.tmLanguage.json
extension/snippets/goiasscript.json
extension/assets/icons/{goiasscript-file-dark.svg, goiasscript-file-light.svg, goiasscript-icon.png}
extension/dist/extension.cjs
extension/dist/cli/{cli.mjs, goias.mjs, goiasscript.mjs, index.mjs, optimizer.mjs}
extension/dist/cli/chunks/{chunk-2UPSRMOW.mjs, chunk-UR5PIFSO.mjs, chunk-YLBYRMSM.mjs}
```

Conferido: nenhum `.ts`, nenhum mapa, nenhum teste, nenhum `src/`, nenhum `.env`; nenhum caminho absoluto de máquina,
e-mail nem formato de token nos arquivos; `package-layout.test.ts` falha se aparecer qualquer entrada fora da lista
permitida. O comando `vsce ls` sobre a pasta do pacote lista a fonte (manifesto, gramática, snippets, ícones);
o conteúdo final, com o bundle, é o da lista acima, lida do arquivo gerado com `unzip -l packages/vscode/pack/goiasscript-vscode-0.3.0.vsix`.

## 8. Verificação manual do dono

Pendente. O dono confere num VS Code real, com capturas de tela anexadas aqui: (1) Modo Restrito (`bota_pra_moer` some
dos menus e é recusado; `traduz` e os erros funcionam); (2) `pergunta` no terminal da extensão (digitar, apagar, Enter,
Ctrl+C); (3) ícone do arquivo `.gs` nos temas claro e escuro e ícone da extensão; (4) snippets.

## 9. Divergências do spec e do plano

1. A revisão de segurança foi feita pelo executor, não por agente em contexto fresco (seção 5).
2. `test:integration` não foi executado localmente (seção 3).
3. A lista de tarefas do dono do plano cita o segredo `OVSX_TOKEN`; o workflow (e o passo 1.4 da U5-07) usa
   `OVSX_PAT`. Vale o nome do workflow, e o checklist abaixo usa ele.
4. O plano pede `vsce ls`; a listagem do conteúdo final foi lida do `.vsix` gerado (`vsce ls` não vê o `dist/`, que só
   existe na cópia de empacotamento).
5. A catraca do bundle subiu 87 bytes (de 49.492 para 49.579) para recusar usuário e senha no endereço de lições.

## 10. Riscos abertos

- Revisão de segurança independente não feita (bloqueia o GATE 5).
- `test:integration` sem execução nas seis combinações até a CI rodar (bloqueia o GATE 5).
- Tag `vscode-v*`: o ruleset versionado já a protege; até o dono aplicá-lo, a defesa é a aprovação dos ambientes (achado 3).
- Publicação parcial entre Marketplace e Open VSX (achado 4).
- Os PATs globais do Azure DevOps são aposentados em 2026-12-01; sem o método decidido até lá, a publicação precisa de
  PAT mínimo só para a primeira vez (`docs/fase-0/publicacao-extensao.md`).
- Nenhuma publicação real foi feita: o smoke pós-publicação só roda depois que o dono publicar.

## 11. Rastreabilidade (§11) e checklist do dono

| Requisito do spec | Teste |
| --- | --- |
| A extensão não executa comando a partir do nome do arquivo e respeita o Modo Restrito | `hostile-names.test.ts` + `untrusted-workspace.test.ts` + `manifest.test.ts` (e `cli-invocation.test.ts`, `command-guards.test.ts`) |
| Extensão: realce, ícones, snippets | `generated-drift.test.ts` + `manifest-assets.test.ts` + smoke pós-publicação (`smoke-extension.test.ts`) |
| Diagnósticos em tempo real | `live-diagnostics.test.ts` + `integration/diagnostics.test.ts` |
| Autocomplete e hover pela tabela da linguagem | `completion.test.ts` + `hover.test.ts` |
| Pacote publicado só com o necessário | `package-layout.test.ts` |

**Checklist do dono para a primeira publicação (Fase 5)**

1. Enviar a branch ao remoto e anexar aqui o resultado da CI do `vscode.yml` nas seis combinações.
2. Disparar a revisão de segurança independente (`everything-claude-code:security-reviewer`, contexto fresco, somente
   leitura, perímetro da seção 5) e anexar a tabela; sem CRITICAL/HIGH abertos.
3. Decidir o método do Marketplace (decisão 12) antes de 2026-12-01; criar o publisher; registrar o aplicativo Entra ID,
   a credencial federada (`repo:<org>/<repo>:environment:marketplace`) e adicionar o principal ao publisher; criar o
   ambiente `marketplace` com as variáveis `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` e `MARKETPLACE_PUBLISHER`.
4. Criar a conta Eclipse, assinar o Publisher Agreement do Open VSX, criar o namespace (`ovsx create-namespace`) e um
   token de escopo restrito; criar o ambiente `open-vsx` com o segredo `OVSX_PAT`.
5. Pôr revisores obrigatórios nos dois ambientes e, se quiser, um ruleset de criação restrita para `vscode-v*`
   (achado 3; o arquivo versionado `.github/rulesets/tags.json` já inclui `vscode-v*`, falta o dono aplicá-lo).
6. Definir `GS_EXTENSION_PUBLISHER` se o identificador não for `goiasscript`; criar a tag `vscode-v0.3.0` a partir de
   um commit já na `main`; aprovar os ambientes; rodar o `smoke-extension.yml`.
7. Conferir num VS Code real e anexar capturas (seção 8).
8. Abrir os tickets `GS-<n>` que quiser para os achados aceitos (3, 4 e 5).
