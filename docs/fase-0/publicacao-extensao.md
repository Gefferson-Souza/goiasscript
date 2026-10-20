# Publicação da extensão VS Code sem PAT

## Decisão

**Método escolhido:** nenhum (escalado ao dono)

Nenhuma execução real de GitHub Actions foi feita: ela exige registrar um aplicativo Entra ID, uma credencial federada e o principal como membro do publisher, passos que dependem de conta e de aprovação do dono. Sem essa prova, a regra de decisão da unidade resulta em "nenhum". Os fatos abaixo, que não dependem de conta, indicam `--azure-credential` como o caminho documentado a testar primeiro.

## Evidências

Fatos verificados com `@vscode/vsce` 4.0.0 (sem conta, sem rede além do npm):

- `npm view @vscode/vsce version dist-tags` → `version = '4.0.0'`, `dist-tags = { latest: '4.0.0', next: '4.0.1-4' }`.
- `npx --yes @vscode/vsce@4.0.0 publish --help | grep -c -- '--oidc'` → `0` (opção oculta no `--help`).
- `npx --yes @vscode/vsce@4.0.0 publish --help | grep -c -- '--azure-credential'` → `1`.
- `npm pack @vscode/vsce@4.0.0` e `grep -n "OIDC_AUDIENCE\|oidcTokenProviders" package/out/oidc.js` → audiência `marketplace.visualstudio.com` e um único provedor, o de GitHub Actions.
- `grep -n "499b84ac" package/out/auth.js` → `--azure-credential` pede token do Azure DevOps (`499b84ac-1321-427f-aa17-267ca6975798/.default`) por uma cadeia que começa em `EnvironmentCredential`, depois `AzureCliCredential` e identidade gerenciada (`ManagedIdentityCredential`).
- Documentação (Context7, README do vsce): `vsce publish --oidc` exige uma política de publicação confiável no Marketplace e `permissions: id-token: write`; troca o JWT do GitHub por um token de sessão de até 15 minutos e não recai em PAT se a troca falhar.

Execução real: não realizada. Modelo de workflow para o dono disparar: `spikes/publish/verify-entra.workflow.yml`.

## Prazo e fallback

Os PATs globais do Azure DevOps são aposentados em 2026-12-01, antes do fim da Fase 5. O dono precisa decidir antes dessa data. Sem a execução até lá, as opções são: PAT de escopo mínimo só para a primeira publicação, ou adiar a Fase 5.

Para o dono executar (cada passo com aprovação): registrar o aplicativo Entra ID e a credencial federada (`repo:<org>/<repo>:environment:marketplace`); adicionar o principal ao publisher; numa branch descartável, copiar o modelo para `.github/workflows/verify-entra.yml` e disparar por `workflow_dispatch`; registrar a URL da execução aqui e apagar a branch. Se o Marketplace oferecer política de publicação confiável e o dono preferir o caminho sem Azure, repetir com `npx @vscode/vsce publish --oidc` de uma extensão descartável.

## Entrada para o ADR-0009

- Marketplace publicado pelo método escolhido (hoje: pendente da decisão do dono).
- Open VSX por token de escopo restrito, guardado só no ambiente de release e usado só no job de publicação.
- `release.yml` com `permissions: id-token: write` e ambiente protegido.
- Reavaliar `--oidc` quando sair do `--help` oculto.
