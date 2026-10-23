# Operação do mantenedor

Runbook curto das tarefas que só o mantenedor faz. Cada comando abaixo existe no
repositório; o teste de `tools/config-tests/tests/docs.test.mjs` confere os scripts,
os workflows e os arquivos citados. Tudo que mexe em conta externa (Cloudflare, Groq,
npm, Marketplace, Open VSX, Vercel) é ato manual do dono: nenhuma automação faz isso
por conta própria.

Rode os comandos a partir da raiz do repositório.

## Rotacionar a chave da Groq

1. Gere a chave nova no painel da Groq e revogue a anterior depois de concluir os passos.
2. Atualize o segredo do Worker:
   `corepack pnpm --filter engoianador-api exec wrangler secret put GROQ_API_KEY`
   (o wrangler pede o valor no terminal; não passe a chave na linha de comando).
3. Atualize o segredo do GitHub com o mesmo nome (`GROQ_API_KEY`) em Settings, Secrets
   and variables, Actions. É ele que o workflow `.github/workflows/engoianador-contract.yml` usa.
4. Confira: o `/health` do Worker deve responder `bindings.GROQ_API_KEY: true` e o
   contrato (seção "Rodar contrato e smoke") deve passar.

O modelo é conferido no registro da Groq antes de cada deploy por
`apps/engoianador-api/scripts/verify-model.ts`, ligado ao `predeploy`.

## Acionar e desligar o kill switch

O Worker lê a variável `KILL_SWITCH`: só o valor `true` liga. Ligado, toda chamada
de engoianar recebe recusa imediata e nenhuma chamada sai para a Groq.

- Ligar: `corepack pnpm --filter engoianador-api exec wrangler secret put KILL_SWITCH`
  e informe `true`.
- Desligar: `corepack pnpm --filter engoianador-api exec wrangler secret delete KILL_SWITCH`.

A mudança vale para as próximas requisições, sem novo deploy do código. A origem do
comportamento está em `apps/engoianador-api/src/limiter.ts`.

## Republicar a extensão

A extensão sai por tag `vscode-v*` (exemplo: `vscode-v0.3.0`), pelo workflow
`.github/workflows/release-vscode.yml`.

1. Ajuste a versão em `packages/vscode/package.json` e faça o merge na `main`.
2. Confirme que o commit da tag é a ponta da `main`: o workflow recusa o contrário.
3. Crie e envie a tag. O workflow roda `verify`, empacota, testa dentro do VS Code e
   publica nos ambientes `marketplace` e `open-vsx`, nesta ordem de jobs.
4. Se um ambiente falhar, reexecute só o job dele; o vsix é o mesmo (conferido por sha256).
5. Depois de publicado, rode o workflow manual `.github/workflows/smoke-extension.yml`
   para conferir a versão nos dois catálogos.

Os ambientes `marketplace` e `open-vsx` e as variáveis do Azure precisam existir antes
da primeira tag. Para empacotar localmente: `corepack pnpm pack:vscode`.

## Deprecar versão e mexer nas dist-tags

O CLI sai como `goiasscript` por tag `v3.*-alpha.*`, pelo workflow
`.github/workflows/release.yml`, e o alpha entra na dist-tag `next`. O workflow só
coloca o tarball em stage: enquanto ninguém aprovar o stage, a versão não está
publicada no npm e a dist-tag não vale.

Ciclo de uma versão: o workflow prepara o stage de `next`; o dono aprova com
`npm stage approve <stage-id>` (pede 2FA) e confere com `npm dist-tag ls goiasscript`.
Para a `latest`, uma nova publicação em stage com a tag `latest` passa pela mesma
aprovação com 2FA, só depois de o `next` ter sido validado.

- Deprecar uma versão ruim:
  `npm deprecate goiasscript@<versão> "mensagem curta dizendo o que fazer"`
- Mover uma tag para outra versão: `npm dist-tag add goiasscript@<versão> <tag>`
- Ver as tags: `npm dist-tag ls goiasscript`
- Tirar uma tag: `npm dist-tag rm goiasscript <tag>`

Esses comandos (`npm deprecate` e `npm dist-tag`) usam o login do dono, não a
automação, e mexer na `latest` pode pedir a mesma credencial humana (2FA).

Versão publicada no npm não se reutiliza: para corrigir, publique uma versão nova e
deprece a ruim. Nada disso roda em automação.

## Recriar o trusted publisher expirado

O trusted publisher do npm expira em 2 dias se o primeiro publish não for validado.
Se expirou:

1. No painel do pacote `goiasscript` no npm, abra Settings e Trusted Publisher.
2. Recrie com o repositório do projeto, o workflow `release.yml` e o ambiente `npm-release`.
3. Dispare o publish em até 2 dias, enviando a tag do alpha. O workflow
   `.github/workflows/release.yml` usa OIDC, com provenance, e deixa o tarball em stage.
4. Aprove o stage com `npm stage approve <stage-id>` (pede 2FA), para `next` e depois
   para `latest`. Antes disso a versão não está publicada.

Só crie o trusted publisher imediatamente antes de publicar, com o `release.yml`
definitivo já na `main`.

O OIDC dispensa segredo, então a aprovação humana mora no GitHub. Antes da
primeira tag, confira que o ambiente `npm-release` exige revisor e só aceita tags
`v3.*`, e que um ruleset de tags limita `v3.*` aos mantenedores. O workflow só
publica quando a tag aponta para a ponta da `main`.

## Reverter o deploy do playground

O playground roda na Vercel (`apps/playground/vercel.json`).

1. No painel da Vercel, abra o projeto do playground e a aba Deployments.
2. Escolha o último deploy bom e use "Promote to Production" nele.
3. Confira o endereço de produção com o smoke da seção "Rodar contrato e smoke".

Reverter na Vercel não mexe no Worker do Engoianador: se o problema for a API, use o
kill switch.

## Aquecer o cache do Engoianador

Depois de trocar o prompt ou o modelo, a chave de cache muda e os exemplos do playground
ficam frios. Para aquecer os exemplos prontos contra a API implantada:

`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON apps/engoianador-api/scripts/warm-cache.ts https://<endereço-da-api>`

O script só aceita endereço `https` (ou local) e sai com código 1 se algum exemplo falhar.

## Rodar contrato e smoke

- Contrato da Groq e da API (semanal, também manual):
  `.github/workflows/engoianador-contract.yml`, que precisa do segredo `GROQ_API_KEY` e
  da variável `ENGOIANADOR_URL`. Sem os dois, o contrato se declara pendente e não falha.
- Smoke do Engoianador implantado: workflow manual `.github/workflows/engoianador-smoke.yml`
  com `base_url` em https.
- Smoke do playground implantado: workflow manual `.github/workflows/playground-smoke.yml`
  com `base_url` em https.
- Local, contra um endereço já no ar:
  `ENGOIANADOR_URL=https://<endereço-da-api> node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON apps/engoianador-api/scripts/contract-check.ts`

Antes de qualquer deploy do Worker, `corepack pnpm --filter engoianador-api run deploy` roda o `predeploy`,
que recusa ids de KV de exemplo e modelo desativado.
