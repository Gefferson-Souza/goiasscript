# Lançamento da 3.0.0

Roteiro do dono para soltar a 3.0.0 estável do CLI (`goiasscript` no npm) e da extensão (Marketplace e Open VSX).
Cada passo diz o que fazer e como conferir. Ele segue `docs/operacao.md` e os workflows
`.github/workflows/release.yml` e `.github/workflows/release-vscode.yml`; se algum deles mudar, confira este roteiro
de novo antes de usar.

Nada aqui roda em automação: tag, aprovação de ambiente, `npm stage approve` e `npm deprecate` são atos do dono.
Rode os comandos a partir da raiz do repositório clonado.

## Regra de ouro

As duas tags (`v3.0.0` e `vscode-v3.0.0`) têm de apontar para a ponta da `main`, e os jobs de publicação conferem
isso de novo na hora de publicar. Do primeiro passo até o fim da publicação da extensão, não faça merge na `main`
(nem de PR de dependência). O ruleset de tags impede apagar ou mover uma tag `v3.*` ou `vscode-v*`: se a ponta
andar no meio do caminho, a tag fica presa no commit antigo e a saída é versionar a próxima num PR.

## 1. Antes de começar

1. A ponta da `main` é o commit que vai sair e o CI dela está verde:
   - `git fetch origin` e `git ls-remote origin refs/heads/main` (o sha tem de bater com `git rev-parse origin/main`).
   - `gh run list --branch main --commit <sha>`: CI, CodeQL, OSV e Promessas públicas todos com `success`.
   - E2E do playground e Testes da extensão no VS Code só rodam sozinhos quando o commit mexe nos caminhos deles.
     Se não aparecerem nesse sha, dispare os dois na `main` e espere o `success`:
     `gh workflow run playground-e2e.yml --ref main` e `gh workflow run vscode.yml --ref main`.
2. CLI e extensão estão em 3.0.0 e não há changeset pendente (o `scripts/release-target.ts` recusa a estável se
   houver): `packages/cli/package.json` e `packages/vscode/package.json` com `"version": "3.0.0"`, e a pasta
   `.changeset` só com o `README.md` e o `config.json`.
3. Ambientes no GitHub (Settings, Environments), conferíveis com `gh api repos/<dono>/<repo>/environments`:
   - `npm-release`: exige revisor e só aceita tags `v3.*`.
   - `marketplace` e `open-vsx`: exigem revisor e só aceitam tags `vscode-v*`.
4. Credenciais da extensão (o `release-vscode.yml` lê estes nomes):
   - variáveis `AZURE_CLIENT_ID` e `AZURE_TENANT_ID`, visíveis para o ambiente `marketplace` (no repositório ou no
     ambiente), ligadas à identidade federada do Azure que publica no Marketplace sem PAT;
   - segredo `OVSX_PAT` visível para o ambiente `open-vsx`.

   Confira com `gh variable list`, `gh variable list --env marketplace`, `gh secret list` e
   `gh secret list --env open-vsx`. Sem elas o job de publicação falha depois da aprovação.
5. Ruleset de tags ativo cobrindo `refs/tags/v3.*` e `refs/tags/vscode-v*`, com bloqueio de apagar e de mover:
   `gh api repos/<dono>/<repo>/rulesets` e depois `gh api repos/<dono>/<repo>/rulesets/<id>`.
6. Na sua máquina: npm com suporte a stage (o workflow usa o `npm@12.2.1`; confira com `npm stage --help`), login
   feito (`npm whoami`) e 2FA à mão. Se o `npm stage --help` responder que o comando não existe, o npm é antigo:
   atualize com `npm install --global npm@12.2.1` e confira de novo. Resolva isso antes do passo 2, porque o prazo
   do trusted publisher começa a contar ali.

## 2. Trusted publisher do npm (só na hora)

O trusted publisher expira em 2 dias se o primeiro publish não for validado e não se edita, só se recria. Crie
imediatamente antes do passo 3, com o `release.yml` definitivo já na `main`:

1. No npmjs.com, abra o pacote `goiasscript`, Settings, Trusted Publisher, GitHub Actions.
2. Preencha o dono e o nome do repositório, o workflow `release.yml` e o ambiente `npm-release`.
3. Salve e siga direto para o passo 3. Se passar de 2 dias sem aprovar o stage, recrie (veja
   "Recriar o trusted publisher expirado" em `docs/operacao.md`).

## 3. Tag do CLI

```bash
git fetch origin
git tag v3.0.0 origin/main
git push origin v3.0.0
```

O push dispara o `release.yml`: `release-verify` (que já recusa cedo tag que não pode sair), `pack`, `tarball-gate`
em Ubuntu, Windows e macOS, e `publish`, que espera aprovação no ambiente `npm-release`.

Conferir: `gh run list --workflow release.yml --limit 1` e `gh run watch <id>`. Os três `tarball-gate` têm de passar
antes de o `publish` pedir aprovação.

## 4. Aprovar o ambiente `npm-release`

Na página da execução (Actions, Release), use "Review deployments", marque `npm-release` e aprove. O job `publish`
confere de novo que a tag é a ponta da `main`, confere o sha256 do tarball testado, confere que a versão de dentro do
tarball é 3.0.0 e roda `npm stage publish <tarball> --tag latest --provenance`.

Conferir: o job `publish` termina verde. Até aqui nada está publicado: o tarball está em stage.

## 5. Aprovar o stage com 2FA

1. Ache o id do stage: no log do passo "Prepara o stage do tarball na dist-tag da tag", com `npm stage list` (confira
   os argumentos em `npm stage --help`) ou na aba de pacotes em stage do npmjs.com.
2. Aprove: `npm stage approve <stage-id>` (pede o código de 2FA).
3. Confira: `npm dist-tag ls goiasscript` mostra `latest: 3.0.0`, e `npm view goiasscript@3.0.0` mostra a versão.
   A página do pacote no npmjs.com mostra a procedência (provenance) ligada a este repositório.

## 6. Deprecar a 2.0.0

A 2.0.0 é o monólito arquivado. Depois de a `latest` apontar para a 3.0.0:

```bash
npm deprecate goiasscript@2.0.0 "Ô sô, essa 2.0.0 foi arquivada. Instala a 3: npm i -g goiasscript@3"
```

Conferir: `npm view goiasscript@2.0.0 deprecated` devolve a mensagem.

## 7. Tag da extensão

Com a `main` ainda no mesmo commit da `v3.0.0`:

```bash
git fetch origin
git tag vscode-v3.0.0 origin/main
git push origin vscode-v3.0.0
```

O push dispara o `release-vscode.yml`: `release-verify`, `package` (calcula versão e canal; da 3.0.0 em diante sai
estável, sem `--pre-release`), `integration` em Ubuntu, Windows e macOS com o VS Code estável e o 1.90.0, e depois
`publish-marketplace` e `publish-openvsx`, cada um esperando aprovação no seu ambiente.

Conferir: `gh run list --workflow release-vscode.yml --limit 1` e `gh run watch <id>`; as seis combinações de
`integration` passam antes dos pedidos de aprovação.

## 8. Aprovar `marketplace` e `open-vsx`

Na página da execução, "Review deployments", aprove os dois ambientes. Os dois jobs conferem de novo a ponta da
`main` e o sha256 do vsix. Se um falhar (credencial, catálogo fora do ar), reexecute só o job dele: o vsix é o mesmo.

Conferir: os dois jobs verdes e, em seguida, rode o smoke da extensão:

```bash
gh workflow run smoke-extension.yml
gh run list --workflow smoke-extension.yml --limit 1
```

O `scripts/smoke-extension.ts` confere a versão nos dois catálogos.

## 9. Smoke pós-publicação

Com o npm e a extensão no ar, rode o smoke completo. Ele instala o pacote publicado na dist-tag, confere versão,
licença e comando, chama o smoke da extensão e, se receber o endereço, o do playground:

```bash
gh workflow run smoke-release.yml -f dist=latest
gh workflow run smoke-release.yml -f dist=latest -f playground_url=https://<endereço-do-playground>
```

Use a segunda forma quando o playground de produção já estiver com a 3.0.0. Confira também na sua máquina:

```bash
npm i -g goiasscript@3
goiasscript dedo_de_prosa
```

A primeira linha tem de dizer `GoiásScript 3.0.0`.

## 10. Playground (se for publicar junto)

O playground roda na Vercel (`apps/playground/vercel.json`); nenhum workflow deste repositório faz deploy. No painel
da Vercel, confira que o deploy de produção é do mesmo sha da `main` e rode o smoke do endereço:

```bash
gh workflow run playground-smoke.yml -f base_url=https://<endereço-do-playground>
```

Para voltar atrás, veja "Reverter o deploy do playground" em `docs/operacao.md`.

## Depois do lançamento

- Libere de novo os merges na `main`.
- Se algo saiu errado no npm: versão publicada não se reutiliza. Corrija num PR, versione a 3.0.1 e deprece a ruim
  (veja "Deprecar versão e mexer nas dist-tags" em `docs/operacao.md`).
