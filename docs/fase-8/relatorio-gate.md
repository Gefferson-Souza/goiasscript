# Relatório do gate da Fase 8

**Veredito:** pronto para o GATE 8, que o dono decide, com um item parcial. Os checks de promessas rodáveis aqui
estão verdes, o `verify` sai 0 e o código removido não deixa referência fora dos registros históricos. A conferência
de links é parcial: links locais (sem âncoras) e 3 endereços externos por `curl` foram conferidos aqui; âncoras e a
varredura externa completa ficam com o `lychee` na CI (estado `pendente de CI`, seções 2 e 6). O que depende de ato do
dono está na seção 7 como `pendente do dono`. Nada foi enviado ao remoto, publicado nem etiquetado por este trabalho.

Medição: Node v26, Linux. Os números vêm de `corepack pnpm verify` e dos comandos da seção 2, rodados depois do último
commit de código da fase.

## 1. Unidades e commits

| Unidade | Commits principais |
| --- | --- |
| U8-01 spec final em `docs/spec` | 25844d7 |
| U8-02 contribuição, templates e política | 73b0e30, 622885f |
| U8-03 `docs/operacao.md` | 437f232, 8722dd2 |
| U8-04 gate de blocos e comandos | 0f2407d, ff8d512, 2726ed3 |
| U8-05 inglês, rastreabilidade e links | 34b0f7f, 181948d |
| U8-06 remoção do código antigo da v1 | 9cc66a3, 35f83d1 |
| U8-07 `CLAUDE.md` final | 3f8c070 |

Ordem na branch: os commits da U9-01 (2b29160, changesets e job `compat`; 2a2cced, correção do `compat`) já estavam
na base `v3/integracao` antes deste relatório e não fazem parte do diff da U8-08. Pelo plano, a U9-01 depende do
GATE 8: a ordem é registrada aqui, não confirmada como intencional, e fica para o dono avaliar. O job `compat`
(`.github/workflows/compat.yml`, só em PR para `main`) é separado do `verify`: o `verify` não o executa e este
relatório não o mediu.

## 2. Gate de promessas

| Item do gate | Comando | Resultado |
| --- | --- | --- |
| Blocos goianos compilam e executam | `corepack pnpm docs:blocks` | verde: 40 blocos conferidos |
| Comandos e palavras citados existem | `corepack pnpm docs:commands` | verde: 30 documentos conferidos |
| Inglês proibido na interface | `node scripts/check-english-ui.ts` | verde: 955 textos, nenhum em inglês |
| Goldens executáveis sem texto do motor | `vitest run --config vitest.e2e.config.ts english-scan` (em `packages/cli`) | verde: 11 testes |
| Compilador sem dependência de runtime | `node scripts/check-compiler-dependencies.ts` | verde: 125 arquivos conferidos |
| Rastreabilidade das 15 linhas do §11 | `node scripts/check-traceability.ts` | verde: 15 promessas com prova no lugar |
| Documentos dos agentes | `corepack pnpm agent-docs` | verde |
| Links locais (sem âncoras) | conferência própria sobre `README.md`, `CONTRIBUTING.md`, `docs/**` e a cartilha; o script não está versionado | 38 arquivos, 16 links locais, 0 quebrados; âncoras não conferidas |
| Links externos (uma vez) | `curl` em cada endereço externo dos documentos publicados | parcial: 3 endereços, todos 200 (repositório, issues, selo de licença); `lychee` pendente de CI |

Observação sobre os links: o binário `lychee` não está instalado nesta máquina e o disco não comporta instalá-lo; ele
roda na CI (`promises-gate.yml`, job `links`, e `scheduled.yml`, job `links-externos`). A conferência local acima cobre
o mesmo conjunto de arquivos e exclusões do `lychee.toml`, mas não as âncoras internas, que só o `lychee` confere, na CI. O script da conferência local não está
versionado, então o número "38 arquivos, 16 links" não é reproduzível a partir do repositório.

## 3. `verify` e escopo das exceções

`corepack pnpm verify` saiu 0. Dentro dele: `tsc` dos quatro projetos, ESLint com zero avisos, scanner de regras,
`generate:check`, Vitest com cobertura, projeto `compiler`, dependency-cruiser (765 módulos, 1877 dependências, nenhuma
violação), knip e os cinco checks da seção 2.

| Medida | Valor |
| --- | --- |
| Arquivos de teste | 244 passaram, 1 ignorado (245) |
| Testes | 2.866 passaram, 7 ignorados (2.873) |
| Projeto `compiler` | 65 arquivos, 966 testes passaram |
| Cobertura de instruções | 97,04% (6201/6390) |
| Cobertura de ramos | 93,07% (3533/3796) |
| Cobertura de funções | 96,8% (1514/1564) |
| Cobertura de linhas | 97,68% (5145/5267) |

Exceções que existem: `tools/rules-scan/scope.json` tem `excluded: []`, mas `ignoredPrefixes` cobre `docs`, o corpus
de conformidade (`packages/compiler/tests/conformance`), os assets gerados do playground (`apps/playground/public/vs`,
`apps/playground/public/examples`) e `apps/playground/next-env.d.ts`; `pathSegmentsExemptPrefixes` isenta `docs`. O
`knip.json` ignora o workspace `apps/playground-e2e` (roda só na CI) e as dependências `lint-staged` e
`@commitlint/cli`, usadas por hooks. `pnpm install --frozen-lockfile` passa e `generate:check` não deixa árvore suja.

## 4. Remoção do código antigo da v1

`git grep -nE 'goiasscript-legacy|packages/core|vscode-extension|lsp-server'`, excluídos `docs/fase-*`,
`docs/superpowers`, `docs/auditoria` e `docs/pesquisa`: vazio. A tag local `legacy/1.5` existe e guarda o estado
anterior à remoção.

## 5. Varredura de dados pessoais

Comandos rodados sobre os documentos publicados e alterados na fase (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`, `CLAUDE.md`, `docs/spec`, `docs/operacao.md`, `docs/piloto`, `.github`):

```
FILES="README.md CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md CLAUDE.md docs/spec docs/operacao.md docs/piloto .github"
git grep -nE '[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}' -- $FILES
git grep -nE '(^|[^[:alnum:]])(/ho[m]e/|/Use[r]s/|[A-Za-z]:\\Use[r]s\\)' -- $FILES
```

Os colchetes evitam que a própria expressão case com o texto deste relatório. Os dois voltaram vazios. Não há teste
versionado que execute essa varredura: ela é manual e reproduzível pelos comandos acima. Este
relatório também não cita e-mail, caminho absoluto, empregador nem dado pessoal.

## 6. Itens que a CI confere e este ambiente não rodou

| Item | Motivo | Onde roda |
| --- | --- | --- |
| E2E do playground em Chromium | os navegadores do Playwright não são baixados aqui (disco) | `apps/playground-e2e` na CI |
| `lychee` (âncoras e links externos automáticos) | binário não instalado aqui; item de links parcial até a CI rodar | jobs `links` e `links-externos` |

## 7. Pendências do dono

| Item | Unidade | O que está pronto | Comando ou ação do dono | Evidência esperada | Estado |
| --- | --- | --- | --- | --- | --- |
| Contato público por configuração | U8-02 | `SECURITY.md` e `CODE_OF_CONDUCT.md` sem e-mail, apontam para o perfil | preencher o contato público no perfil do GitHub | perfil exibindo o contato | pendente do dono |
| Reporte privado de vulnerabilidade | U8-02 | `SECURITY.md` aponta para o reporte privado | Settings > Code security > Private vulnerability reporting > Enable | opção ativa no repositório | pendente do dono |
| Configurações do GitHub | U8-02, U8-05 | templates, `config.yml` e jobs `promises-gate` | marcar os jobs `docs-blocks`, `docs-commands`, `english-ui`, `traceability` e `links` como checks obrigatórios; desligar Discussions | regra de proteção do branch listando os jobs | pendente do dono |
| Envio de `legacy/1.5` | U8-06 | tag local `legacy/1.5` (objeto 8066d5e, commit 30bcf4c) | `git push origin legacy/1.5` antes do push da fase | `git ls-remote --tags origin 'legacy/*'` listando a tag | verificado: a tag já está no remoto apontando para 30bcf4c; nenhuma ação |
| Tag de arquivo do protótipo Rust | U8-06 | commit candidato 371477b (último a mexer em `goiasscript-language/goiasscript-rust`, 2025-04-13) | `git tag archive/rust-prototype 371477b && git push origin archive/rust-prototype` | tag listada no remoto | pendente do dono |
